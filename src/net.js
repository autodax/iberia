// Iberia online play (v0.10).
//
// How it works
//  - One browser is the HOST. Everyone else is a GUEST who connects to the host (peer to peer, no game server).
//  - The engine is deterministic: the same state plus the same command always gives the same result, because
//    shuffles use the seed stored inside the state. So only COMMANDS travel over the network, never the board.
//  - A guest never changes its own board directly. It sends its command to the host. The host checks that the
//    sender controls that seat, runs the command, then sends the accepted command (with a sequence number and a
//    checksum of the resulting state) to everybody, including the sender. Everyone applies commands in the same order.
//  - If a guest ever misses a command or its checksum differs, it asks the host for a full copy of the state.
//
// This file knows nothing about the page. The page gives it "hooks" (apply a command, read/replace the state,
// ask a yes/no question) and a "transport" (PeerJS in the browser, an in-memory fake in the tests).

const NET_PROTO=1,NET_MAX_PEOPLE=8,NET_HOST_ID='host',NET_ACK_TIMEOUT=20000,NET_ASK_TIMEOUT=90000;
const NET_CODE_CHARS='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I so a code read aloud is hard to get wrong
const NET_SAVE_KEY='iberia-online-host';

function netRandom(n,chars){let out='',a=new Uint32Array(n);try{crypto.getRandomValues(a)}catch(e){for(let i=0;i<n;i++)a[i]=Math.random()*4294967296}for(let i=0;i<n;i++)out+=chars[a[i]%chars.length];return out}
function netNewCode(){return netRandom(5,NET_CODE_CHARS)}
function netNormalizeCode(t){return String(t||'').toUpperCase().split('').filter(c=>NET_CODE_CHARS.includes(c)).join('')}
function netCleanName(t){t=String(t==null?'':t).replace(/\s+/g,' ').trim().slice(0,20);return t||'Player'}

/* cfg = {
     transport: {host(code,onConnection)->Promise<{close()}>, join(code)->Promise<conn>},   conn = {send(str),close(),onmessage,onclose}
     hooks: {
       getState()            -> the current game state object (read only)
       loadState(obj)        -> replace the game state with obj and redraw
       apply(cmd)            -> run a command on the page; returns {ok:true,sum} or {ok:false,error}
       checksum()            -> short string identifying the current state
       onStart(game)         -> begin a new game {seed,difficulty,roles}
       ask(text)             -> Promise<boolean>, a yes/no question shown to this player
     },
     version: {ui,engine,map},   storage / tokenStore: localStorage-like {getItem,setItem,removeItem} (optional)
     newSeed(): string,  heartbeat: false to switch off timers (tests)
   } */
function createNet(cfg){
  const H=cfg.hooks,T=cfg.transport,store=cfg.storage||null,tokenStore=cfg.tokenStore||null,beat=cfg.heartbeat!==false;
  const net={active:false,isHost:false,code:'',myId:'',name:'',status:'idle',error:'',lobby:null,seq:0};
  const listeners=[];
  let people=new Map();      // host only: id -> {id,name,token,conn,connected,lastSeen}
  let idCounter=0,hostHandle=null,guestConn=null,leaving=false,fatal=false,gen=0,awaitingSync=false,lastHeard=0;
  let timers=[],pending=new Map(),cidCounter=0,askCounter=0,asks=new Map(),reconnecting=false;
  const lobby={phase:'lobby',settings:{players:2,difficulty:4,roles:['sailor','agronomist','railwayman','politician','nurse']},seats:[null,null]};

  /* ---------- small helpers ---------- */
  function emit(){for(const f of listeners.slice()){try{f(net)}catch(e){console.error(e)}}}
  net.onChange=f=>{listeners.push(f)};
  function enc(m){return JSON.stringify(m)}
  function send(conn,m){try{conn.send(enc(m))}catch(e){}}
  function publicPeople(){return [...people.values()].map(p=>({id:p.id,name:p.name,connected:p.connected,host:p.id===NET_HOST_ID}))}
  function publicLobby(){return {phase:lobby.phase,settings:{players:lobby.settings.players,difficulty:lobby.settings.difficulty,roles:lobby.settings.roles.slice()},seats:lobby.seats.slice(),people:publicPeople()}}
  function setLobby(l){net.lobby=l}
  function broadcast(m,exceptId){const s=enc(m);for(const p of people.values()){if(p.id===NET_HOST_ID||!p.connected||p.id===exceptId)continue;try{p.conn.send(s)}catch(e){}}}
  function broadcastLobby(){setLobby(publicLobby());broadcast({t:'lobby',lobby:net.lobby});persist();emit()}
  function now(){return Date.now()}
  function every(ms,f){if(!beat)return;timers.push(setInterval(f,ms))}
  function clearTimers(){for(const t of timers)clearInterval(t);timers=[]}
  function token(){let t=tokenStore&&tokenStore.getItem('iberia-online-token');if(!t){t=netRandom(16,NET_CODE_CHARS+'abcdefghijkmnpqrstuvwxyz');try{tokenStore&&tokenStore.setItem('iberia-online-token',t)}catch(e){}}return t}
  function resizeSeats(){const n=lobby.settings.players;while(lobby.seats.length<n)lobby.seats.push(null);lobby.seats.length=n}

  /* ---------- who may do what (host decides) ---------- */
  function seatOwnerConnected(seat){const o=lobby.seats[seat];return o!=null&&!!(people.get(o)&&people.get(o).connected)}
  function canControl(pid,seat){
    if(!Number.isInteger(seat)||seat<0||seat>=lobby.seats.length)return false;
    const owner=lobby.seats[seat];
    if(owner===pid)return true;
    // the host keeps unclaimed seats going, and covers a seat whose player has dropped out
    return pid===NET_HOST_ID&&(owner==null||!seatOwnerConnected(seat));
  }
  function authorize(pid,cmd){
    if(!cmd||typeof cmd!=='object'||typeof cmd.type!=='string')return 'Not a valid command';
    if(lobby.phase!=='playing')return 'The game has not started yet';
    if(cmd.type==='start')return pid===NET_HOST_ID?null:'Only the host can begin the game';
    const st=H.getState();
    const seat=(cmd.type==='discard'||cmd.type==='event')?cmd.seat:st.active;
    return canControl(pid,seat)?null:'That seat is played by someone else';
  }
  net.mine=seat=>{
    if(!net.active)return true;
    if(net.isHost)return canControl(NET_HOST_ID,seat);
    return !!net.lobby&&net.lobby.seats[seat]===net.myId;
  };
  net.owner=seat=>{if(!net.lobby)return null;const id=net.lobby.seats[seat];return id==null?null:(net.lobby.people.find(p=>p.id===id)||null)};
  net.me=()=>net.lobby?net.lobby.people.find(p=>p.id===net.myId)||null:null;

  /* ---------- host: persistence so a refresh does not end the room ---------- */
  function persist(){
    if(!store||!net.isHost||!net.active)return;
    try{store.setItem(NET_SAVE_KEY,JSON.stringify({v:1,code:net.code,idCounter,seq:net.seq,
      lobby:{phase:lobby.phase,settings:lobby.settings,seats:lobby.seats},
      people:[...people.values()].filter(p=>p.id!==NET_HOST_ID).map(p=>({id:p.id,name:p.name,token:p.token})),
      state:lobby.phase==='playing'?H.getState():null}))}catch(e){}
  }
  net.savedHost=()=>{try{const o=JSON.parse(store.getItem(NET_SAVE_KEY));return o&&o.v===1&&o.code?{code:o.code,phase:o.lobby.phase,players:o.lobby.settings.players}:null}catch(e){return null}};
  function forgetHost(){try{store&&store.removeItem(NET_SAVE_KEY)}catch(e){}}

  /* ---------- host ---------- */
  async function openRoom(code,tries){
    for(let i=0;;i++){
      try{return await T.host(code,onGuestConnection)}
      catch(e){
        // after a refresh the signalling server may still hold the old registration for a few seconds
        if(e&&e.code==='taken'&&i<tries){await new Promise(r=>setTimeout(r,3000));continue}
        throw e;
      }
    }
  }
  function hostBase(name){
    net.active=true;net.isHost=true;net.myId=NET_HOST_ID;net.name=netCleanName(name);net.error='';
    people=new Map([[NET_HOST_ID,{id:NET_HOST_ID,name:net.name,token:'',conn:null,connected:true,lastSeen:now()}]]);
    if(beat)every(10000,()=>{const t=now();for(const p of people.values()){if(p.id!==NET_HOST_ID&&p.connected&&t-p.lastSeen>35000)dropConn(p)}});
  }
  net.host=async function(name){
    if(net.active)throw Error('Already in a room');
    leaving=false;fatal=false;hostBase(name);net.status='connecting';emit();
    let lastErr=null;
    for(let i=0;i<6;i++){
      const code=netNewCode();
      try{hostHandle=await openRoom(code,0);net.code=code;lastErr=null;break}
      catch(e){lastErr=e;if(!(e&&e.code==='taken'))break}
    }
    if(lastErr){resetLocal();throw lastErr}
    resizeSeats();net.status='connected';broadcastLobby();return net.code;
  };
  net.resumeHost=async function(name){
    if(net.active)throw Error('Already in a room');
    let snap=null;try{snap=JSON.parse(store.getItem(NET_SAVE_KEY))}catch(e){}
    if(!snap||snap.v!==1)throw Error('No saved room to resume');
    leaving=false;fatal=false;hostBase(name||'Host');net.status='connecting';emit();
    try{hostHandle=await openRoom(snap.code,12)}catch(e){resetLocal();throw e}
    net.code=snap.code;idCounter=snap.idCounter||0;net.seq=snap.seq||0;
    lobby.phase=snap.lobby.phase;lobby.settings=snap.lobby.settings;lobby.seats=snap.lobby.seats;resizeSeats();
    for(const p of snap.people)people.set(p.id,{id:p.id,name:p.name,token:p.token,conn:null,connected:false,lastSeen:0});
    if(snap.state)H.loadState(snap.state);
    net.status='connected';broadcastLobby();return net.code;
  };
  function onGuestConnection(conn){
    conn.pid=null;
    conn.onmessage=raw=>{let m;try{m=JSON.parse(raw)}catch(e){return}hostMessage(conn,m)};
    conn.onclose=()=>{if(conn.pid){const p=people.get(conn.pid);if(p&&p.conn===conn)dropConn(p)}};
  }
  function dropConn(p){
    p.connected=false;const c=p.conn;p.conn=null;if(c){c.onclose=null;try{c.close()}catch(e){}}
    for(const [id,a] of asks)if(a.owner===p.id){asks.delete(id);finishAsk(a,false)}
    broadcastLobby();
  }
  function refuse(conn,reason){send(conn,{t:'refuse',reason});setTimeout(()=>{try{conn.close()}catch(e){}},300)}
  function hostMessage(conn,m){
    if(!m||typeof m.t!=='string')return;
    if(m.t==='hello')return hostHello(conn,m);
    const p=conn.pid&&people.get(conn.pid);
    if(!p||p.conn!==conn)return;
    p.lastSeen=now();
    switch(m.t){
      case 'ping':return send(conn,{t:'pong'});
      case 'rename':p.name=uniqueName(netCleanName(m.name),p.id);return broadcastLobby();
      case 'claim':{const r=claimSeat(p.id,m.seat);if(!r.ok)send(conn,{t:'notice',text:r.error});return}
      case 'release':{const r=releaseSeat(p.id,m.seat);if(!r.ok)send(conn,{t:'notice',text:r.error});return}
      case 'needsync':return send(conn,{t:'sync',seq:net.seq,state:H.getState()});
      case 'bye':{ // a guest who leaves on purpose gives up their seats and their place in the room
        for(let i=0;i<lobby.seats.length;i++)if(lobby.seats[i]===p.id)lobby.seats[i]=null;
        people.delete(p.id);conn.onclose=null;p.conn=null;try{conn.close()}catch(e){}
        for(const [id,a] of asks)if(a.owner===p.id){asks.delete(id);finishAsk(a,false)}
        return broadcastLobby();
      }
      case 'cmd':{
        const r=hostRun(p.id,m.cmd);
        send(conn,r.ok?{t:'ack',cid:m.cid,ok:true}:{t:'ack',cid:m.cid,ok:false,error:r.error});return;
      }
      case 'ask':return hostAsk(p.id,m.seat,m.q).then(ok=>send(conn,{t:'askresult',id:m.id,ok}));
      case 'answer':{const a=asks.get(m.id);if(a&&a.owner===p.id){asks.delete(m.id);finishAsk(a,!!m.ok)}return}
    }
  }
  function uniqueName(name,selfId){let n=name,k=2;while([...people.values()].some(p=>p.id!==selfId&&p.name===n))n=name.slice(0,17)+' '+(k++);return n}
  function hostHello(conn,m){
    if(m.proto!==NET_PROTO)return refuse(conn,'This room uses a different version of online play. Reload the page and try again.');
    const v=m.ver||{},mine=cfg.version;
    if(v.ui!==mine.ui||v.engine!==mine.engine||v.map!==mine.map)return refuse(conn,'Game version mismatch: the host is on v'+mine.ui+' and you are on v'+v.ui+'. Reload the page (or clear the cache) so you both have the same version.');
    let p=[...people.values()].find(x=>x.id!==NET_HOST_ID&&x.token&&x.token===m.token);
    if(p){if(p.conn&&p.conn!==conn){const old=p.conn;old.onclose=null;send(old,{t:'refuse',reason:'You joined this room from another window.'});try{old.close()}catch(e){}}}
    else{
      if(people.size>=NET_MAX_PEOPLE)return refuse(conn,'This room is full.');
      p={id:'p'+(++idCounter),name:'',token:String(m.token||''),conn:null,connected:false,lastSeen:0};
      p.name=uniqueName(netCleanName(m.name),p.id);people.set(p.id,p);
    }
    p.conn=conn;p.connected=true;p.lastSeen=now();conn.pid=p.id;
    send(conn,{t:'welcome',you:p.id,code:net.code,lobby:publicLobby()});
    if(lobby.phase==='playing')send(conn,{t:'sync',seq:net.seq,state:H.getState()});
    broadcastLobby();
  }
  function claimSeat(pid,seat){
    if(!Number.isInteger(seat)||seat<0||seat>=lobby.seats.length)return {ok:false,error:'No such seat'};
    if(lobby.seats[seat]!=null&&lobby.seats[seat]!==pid)return {ok:false,error:'That seat is already taken'};
    lobby.seats[seat]=pid;broadcastLobby();return {ok:true};
  }
  function releaseSeat(pid,seat){
    if(!Number.isInteger(seat)||seat<0||seat>=lobby.seats.length)return {ok:false,error:'No such seat'};
    if(lobby.seats[seat]!==pid&&pid!==NET_HOST_ID)return {ok:false,error:'That is not your seat'};
    lobby.seats[seat]=null;broadcastLobby();return {ok:true};
  }
  function hostRun(pid,cmd){
    const err=authorize(pid,cmd);if(err)return {ok:false,error:err};
    const r=H.apply(cmd);if(!r.ok)return {ok:false,error:r.error||'Rejected'};
    net.seq++;broadcast({t:'applied',seq:net.seq,cmd,sum:r.sum,by:pid});persist();emit();
    return {ok:true};
  }

  // Host-only lobby controls
  net.setSettings=function(part){
    if(!net.isHost||lobby.phase!=='lobby')return {ok:false,error:'Only the host can change settings before the game starts'};
    const s=lobby.settings;
    if(part.players!=null){const n=+part.players;if(!(n>=2&&n<=5))return {ok:false,error:'2 to 5 players'};s.players=n}
    if(part.difficulty!=null){const d=+part.difficulty;if(!(d>=4&&d<=6))return {ok:false,error:'4 to 6 Epidemics'};s.difficulty=d}
    if(Array.isArray(part.roles))s.roles=part.roles.slice(0,5);
    resizeSeats();broadcastLobby();return {ok:true};
  };
  net.assign=function(seat,pid){
    if(!net.isHost)return {ok:false,error:'Only the host can assign seats'};
    if(!Number.isInteger(seat)||seat<0||seat>=lobby.seats.length)return {ok:false,error:'No such seat'};
    if(pid!=null&&!people.has(pid))return {ok:false,error:'No such person'};
    lobby.seats[seat]=pid==null?null:pid;broadcastLobby();return {ok:true};
  };
  net.start=function(){
    if(!net.isHost||lobby.phase!=='lobby')return {ok:false,error:'Only the host can start, from the lobby'};
    const s=lobby.settings;
    const game={seed:cfg.newSeed(),difficulty:s.difficulty,roles:s.roles.slice(0,s.players)};
    try{H.onStart(game)}catch(e){return {ok:false,error:e.message}}
    lobby.phase='playing';net.seq=0;
    broadcast({t:'start',game});broadcastLobby();return {ok:true};
  };
  net.backToLobby=function(){
    if(!net.isHost)return {ok:false,error:'Only the host can do that'};
    lobby.phase='lobby';broadcastLobby();return {ok:true};
  };

  /* ---------- asking another player a yes/no question (card transfers, passengers) ---------- */
  function finishAsk(a,ok){clearTimeout(a.timer);a.resolve(ok)}
  function hostAsk(requesterId,seat,text){
    return new Promise(resolve=>{
      if(!Number.isInteger(seat)||seat<0||seat>=lobby.seats.length)return resolve(false);
      const owner=lobby.seats[seat];
      const ownerP=owner!=null?people.get(owner):null;
      const target=ownerP&&ownerP.connected?ownerP.id:NET_HOST_ID; // unclaimed or absent: the host answers
      if(target===NET_HOST_ID)return Promise.resolve(H.ask(String(text))).then(resolve,()=>resolve(false));
      const id='a'+(++askCounter),a={owner:target,resolve,timer:setTimeout(()=>{asks.delete(id);resolve(false)},NET_ASK_TIMEOUT)};
      asks.set(id,a);send(ownerP.conn,{t:'ask',id,q:String(text)});
    });
  }

  /* ---------- guest ---------- */
  net.join=async function(code,name){
    if(net.active)throw Error('Already in a room');
    code=netNormalizeCode(code);if(code.length<4)throw Error('Enter the room code the host gave you');
    leaving=false;fatal=false;net.active=true;net.isHost=false;net.code=code;net.name=netCleanName(name);net.status='connecting';net.error='';net.seq=0;emit();
    try{await guestConnect(true)}catch(e){resetLocal();throw e}
    return code;
  };
  function guestConnect(first){
    return new Promise((resolve,reject)=>{
      let settled=false;
      T.join(net.code).then(conn=>{
        guestConn=conn;lastHeard=now();
        conn.onmessage=raw=>{let m;try{m=JSON.parse(raw)}catch(e){return}lastHeard=now();guestMessage(m,(err)=>{if(!settled){settled=true;err?reject(err):resolve()}})};
        conn.onclose=()=>{if(guestConn===conn){guestConn=null;guestLost()}if(!settled){settled=true;reject(Error('Could not reach the host'))}};
        send(conn,{t:'hello',proto:NET_PROTO,ver:cfg.version,token:token(),name:net.name});
        setTimeout(()=>{if(!settled){settled=true;try{conn.close()}catch(e){}reject(Error('The host did not answer'))}},12000);
      }).catch(e=>{if(!settled){settled=true;reject(
        first&&e&&e.code==='notfound'?Error('No room found with that code. Check the code, and that the host still has the page open.'):
        first&&e&&e.code==='blocked'?Error('The room exists, but a connection could not be opened. Your network (or the host\'s) is probably blocking direct connections. Press "Test my connection" and see the relay settings below.'):e)}});
    });
  }
  function guestMessage(m,done){
    switch(m.t){
      case 'welcome':net.myId=m.you;setLobby(m.lobby);net.status='connected';net.error='';awaitingSync=false;startGuestTimers();emit();done&&done();return;
      case 'refuse':fatal=true;net.error=m.reason||'The host refused the connection';if(done)done(Error(net.error));else{net.status='closed';emit()}return;
      case 'lobby':setLobby(m.lobby);emit();return;
      case 'start':try{H.onStart(m.game)}catch(e){console.error(e)}net.seq=0;awaitingSync=false;emit();return;
      case 'sync':try{H.loadState(m.state);net.seq=m.seq;awaitingSync=false}catch(e){console.error(e)}emit();return;
      case 'applied':return guestApplied(m);
      case 'ack':{const p=pending.get(m.cid);if(p){pending.delete(m.cid);clearTimeout(p.timer);p.resolve(m.ok?{ok:true}:{ok:false,error:m.error||'Rejected'})}return}
      case 'notice':net.notice=m.text;emit();return;
      case 'ask':Promise.resolve(H.ask(m.q)).catch(()=>false).then(ok=>{if(guestConn)send(guestConn,{t:'answer',id:m.id,ok:!!ok})});return;
      case 'askresult':{const a=asks.get(m.id);if(a){asks.delete(m.id);finishAsk(a,!!m.ok)}return}
    }
  }
  function guestApplied(m){
    if(m.seq<=net.seq)return;                       // already have it
    if(m.seq!==net.seq+1||awaitingSync){requestSync();return}
    const r=H.apply(m.cmd);
    if(!r.ok||r.sum!==m.sum){requestSync();return}
    net.seq=m.seq;emit();
  }
  function requestSync(){if(awaitingSync||!guestConn)return;awaitingSync=true;send(guestConn,{t:'needsync'})}
  function startGuestTimers(){
    clearTimers();
    every(10000,()=>{if(guestConn){send(guestConn,{t:'ping'});if(now()-lastHeard>35000){const c=guestConn;guestConn=null;c.onclose=null;try{c.close()}catch(e){}guestLost()}}});
  }
  function guestLost(){
    for(const [cid,p] of pending){clearTimeout(p.timer);p.resolve({ok:false,error:'Connection lost'})}pending.clear();
    for(const [id,a] of asks){asks.delete(id);finishAsk(a,false)}
    if(leaving||fatal||!net.active||net.isHost||net.status!=='connected'||reconnecting)return;
    reconnecting=true;net.status='reconnecting';emit();
    const g=gen;
    (async()=>{
      for(let i=0;i<40;i++){
        await new Promise(r=>setTimeout(r,i?3000:1000));
        if(g!==gen||leaving||fatal)break;
        try{await guestConnect(false);if(g===gen)reconnecting=false;return}catch(e){}
      }
      if(g!==gen)return;
      reconnecting=false;if(!leaving){net.status='closed';net.error=net.error||'Lost the connection to the host.';emit()}
    })();
  }

  /* ---------- guest -> host requests (the host's own calls are handled directly) ---------- */
  net.claim=seat=>{if(net.isHost)return claimSeat(NET_HOST_ID,seat);if(guestConn)send(guestConn,{t:'claim',seat});return {ok:true}};
  net.release=seat=>{if(net.isHost)return releaseSeat(NET_HOST_ID,seat);if(guestConn)send(guestConn,{t:'release',seat});return {ok:true}};
  net.rename=name=>{
    name=netCleanName(name);net.name=name;
    if(net.isHost){const p=people.get(NET_HOST_ID);p.name=uniqueName(name,NET_HOST_ID);broadcastLobby()}
    else if(guestConn)send(guestConn,{t:'rename',name});
  };
  net.submit=function(cmd){
    if(!net.active)return Promise.resolve({ok:false,error:'Not in an online game'});
    if(net.isHost)return Promise.resolve(hostRun(NET_HOST_ID,cmd));
    if(!guestConn)return Promise.resolve({ok:false,error:'Not connected to the host'});
    return new Promise(resolve=>{
      const cid=++cidCounter,timer=setTimeout(()=>{pending.delete(cid);resolve({ok:false,error:'The host did not answer'})},NET_ACK_TIMEOUT);
      pending.set(cid,{resolve,timer});send(guestConn,{t:'cmd',cid,cmd});
    });
  };
  net.askSeat=function(seat,text){
    if(!net.active)return Promise.resolve(H.ask(text));
    if(net.isHost)return hostAsk(NET_HOST_ID,seat,text);
    if(!guestConn)return Promise.resolve(false);
    return new Promise(resolve=>{
      const id='q'+(++askCounter),a={owner:'host',resolve,timer:setTimeout(()=>{asks.delete(id);resolve(false)},NET_ASK_TIMEOUT+5000)};
      asks.set(id,a);send(guestConn,{t:'ask',id,seat,q:String(text)});
    });
  };

  /* ---------- leaving ---------- */
  function resetLocal(){
    gen++;clearTimers();net.active=false;net.isHost=false;net.status='idle';net.myId='';net.lobby=null;net.code='';net.seq=0;
    people=new Map();pending.clear();asks.clear();
    if(hostHandle){try{hostHandle.close()}catch(e){}hostHandle=null}
    if(guestConn){const c=guestConn;guestConn=null;c.onclose=null;try{c.close()}catch(e){}}
    lobby.phase='lobby';lobby.seats=[null,null];lobby.settings.players=2;
    reconnecting=false;awaitingSync=false;
  }
  net.leave=function(){
    leaving=true;
    // say goodbye first and close a moment later, so the message is not lost with the connection
    const later=f=>setTimeout(f,400);
    if(net.isHost){
      broadcast({t:'refuse',reason:'The host closed the room.'});forgetHost();
      const handle=hostHandle;hostHandle=null;const cs=[...people.values()].map(p=>p.conn).filter(Boolean);
      later(()=>{for(const c of cs){try{c.close()}catch(e){}}if(handle){try{handle.close()}catch(e){}}});
    }else if(guestConn){
      const c=guestConn;guestConn=null;c.onclose=null;send(c,{t:'bye'});later(()=>{try{c.close()}catch(e){}});
    }
    const was=net.active;resetLocal();net.status='idle';if(was)emit();
  };
  return net;
}

/* ---------- PeerJS transport (browser only) ----------
   PeerJS gives each browser a short id on a free public signalling server and then connects the two browsers
   directly (WebRTC). The library (PeerJS 1.5.4, MIT licence, src/vendor/) is built into the page by build.py,
   so it normally needs no download. The CDN address below is only a fallback if the built-in copy is missing. */
function peerJsTransport(opts){
  opts=opts||{};
  const SRC=opts.src||'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';
  const PREFIX='iberia-';
  // Direct browser-to-browser links often fail on phone data and strict routers. A relay (TURN) server carries the
  // traffic when that happens. Settings come from src/ice.json (built into the page) or, for testing, from the
  // "Relay settings" box in the Online dialog (kept in this browser only).
  const ICE=(typeof NET_ICE!=='undefined'&&NET_ICE)||{};
  const STUN=[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:global.stun.twilio.com:3478'}];
  const OPEN_RELAY=[{urls:'turn:openrelay.metered.ca:80',username:'openrelayproject',credential:'openrelayproject'},
    {urls:'turn:openrelay.metered.ca:443',username:'openrelayproject',credential:'openrelayproject'},
    {urls:'turns:openrelay.metered.ca:443?transport=tcp',username:'openrelayproject',credential:'openrelayproject'}];
  let iceCache=null,loading=null;
  function localIce(){try{return JSON.parse(localStorage.getItem('iberia-ice'))||{}}catch(e){return {}}}
  async function iceServers(){
    if(opts.config)return opts.config.iceServers;
    if(iceCache)return iceCache;
    const L=localIce(),app=L.metered_app||ICE.metered_app,key=L.metered_key||ICE.metered_key;
    let list=STUN.slice();
    if(app&&key){
      try{
        const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),6000);
        const r=await fetch('https://'+encodeURIComponent(app)+'.metered.live/api/v1/turn/credentials?apiKey='+encodeURIComponent(key),{signal:ctl.signal});
        clearTimeout(t);if(r.ok){const j=await r.json();if(Array.isArray(j))list=list.concat(j)}
      }catch(e){}
    }
    if(ICE.open_relay!==false)list=list.concat(OPEN_RELAY);     // free shared relay, best effort
    for(const x of ICE.extra||[])list.push(x);
    return iceCache=list;
  }
  function load(){
    if(typeof Peer!=='undefined')return Promise.resolve();
    if(!loading)loading=new Promise((ok,no)=>{
      const s=document.createElement('script');s.src=SRC;s.onload=ok;
      s.onerror=()=>{loading=null;no(Error('Could not load the connection library. Check your internet connection or any content blocker.'))};
      document.head.appendChild(s);
    });
    return loading;
  }
  function wrap(dc,peer,ownsPeer){
    const c={send:s=>dc.send(s),onmessage:null,onclose:null,close(){try{dc.close()}catch(e){}if(ownsPeer){try{peer.destroy()}catch(e){}}}};
    dc.on('data',d=>{if(c.onmessage)c.onmessage(typeof d==='string'?d:String(d))});
    const gone=()=>{if(c.onclose){const f=c.onclose;c.onclose=null;f()}};
    dc.on('close',gone);dc.on('error',gone);
    return c;
  }
  return {
    forgetIce(){iceCache=null},
    // Reports which kinds of connection this network can make: direct (host), via the internet address (srflx), via a relay.
    async diagnose(){
      const servers=await iceServers(),found={host:0,srflx:0,relay:0};
      const pc=new RTCPeerConnection({iceServers:servers});pc.createDataChannel('t');
      pc.onicecandidate=e=>{if(e.candidate){const m=/ typ (\w+)/.exec(e.candidate.candidate);if(m&&found[m[1]]!==undefined)found[m[1]]++}};
      await pc.setLocalDescription(await pc.createOffer());
      await new Promise(res=>{pc.onicegatheringstatechange=()=>{if(pc.iceGatheringState==='complete')res()};setTimeout(res,8000)});
      pc.close();return found;
    },
    async host(code,onConnection){
      await load();const CONFIG={iceServers:await iceServers()};
      return new Promise((ok,no)=>{
        const peer=new Peer(PREFIX+code,{config:CONFIG,debug:0});let opened=false;
        peer.on('open',()=>{opened=true;ok({close(){try{peer.destroy()}catch(e){}}})});
        peer.on('error',e=>{if(!opened){try{peer.destroy()}catch(x){}no(e&&e.type==='unavailable-id'?Object.assign(Error('That room code is already in use'),{code:'taken'}):Object.assign(Error('Could not reach the connection service ('+(e&&e.type||'error')+').'),{code:'net'}))}});
        peer.on('disconnected',()=>{try{peer.reconnect()}catch(e){}});
        peer.on('connection',dc=>{dc.on('open',()=>onConnection(wrap(dc,peer,false)))});
      });
    },
    async join(code){
      await load();const CONFIG={iceServers:await iceServers()};
      return new Promise((ok,no)=>{
        const peer=new Peer({config:CONFIG,debug:0});let done=false;
        const fail=e=>{if(done)return;done=true;try{peer.destroy()}catch(x){}no(e)};
        peer.on('error',e=>fail(e&&e.type==='peer-unavailable'?Object.assign(Error('No such room'),{code:'notfound'}):Object.assign(Error('Could not reach the connection service ('+(e&&e.type||'error')+').'),{code:'net'})));
        peer.on('open',()=>{
          const dc=peer.connect(PREFIX+code,{reliable:true});
          const t=setTimeout(()=>fail(Object.assign(Error('blocked'),{code:'blocked'})),20000);
          dc.on('open',()=>{if(done)return;done=true;clearTimeout(t);ok(wrap(dc,peer,true))});
          dc.on('error',()=>{clearTimeout(t);fail(Object.assign(Error('blocked'),{code:'blocked'}))});
        });
      });
    }
  };
}

/* ---------- Relay transport (WebSocket through the Cloudflare relay in relay/) ----------
   Every player keeps one ordinary secure web connection open to the relay, which passes messages between the host and
   the guests. Unlike PeerJS there is no direct browser-to-browser link, so it works on phone data, school and
   work networks. The relay is a few dozen lines (relay/src/index.js) and never looks inside the messages. */
function wsTransport(baseUrl,opts){
  opts=opts||{};
  const WS=opts.WebSocket||(typeof WebSocket!=='undefined'?WebSocket:null);
  const root=String(baseUrl||'').trim().replace(/\/+$/,'');
  const wsBase=root.replace(/^http/i,'ws'),httpBase=root.replace(/^ws/i,'http');
  const PING_MS=opts.pingMs||20000,CONNECT_MS=opts.connectMs||12000,RETRY_MS=opts.retryMs||2000,RETRIES=opts.retries||60;
  const netErr=m=>Object.assign(Error(m),{code:'net'});
  const noRelay='Could not reach the relay server. Check your internet connection and the relay address.';
  function openSocket(code,role){if(!WS)throw netErr('This browser cannot open web connections.');return new WS(wsBase+'/room/'+code+'?role='+role)}
  function fire(c){if(c.onclose){const f=c.onclose;c.onclose=null;f()}}
  function keepAlive(get){const t=setInterval(()=>{try{const w=get();if(w&&w.readyState===1)w.send('ping')}catch(e){}},PING_MS);if(t.unref)t.unref();return t}
  return {
    kind:'relay',
    forgetIce(){},
    async diagnose(){
      try{const r=await fetch(httpBase+'/',{cache:'no-store'});const t=await r.text();return {kind:'relay',ok:r.ok&&/Iberia relay/.test(t)}}
      catch(e){return {kind:'relay',ok:false}}
    },
    host(code,onConnection){
      return new Promise((ok,no)=>{
        let ws=null,closed=false,settled=false,tries=0;const conns=new Map();
        const ping=keepAlive(()=>ws);
        const handle={close(){closed=true;clearInterval(ping);const old=[...conns.values()];conns.clear();for(const c of old)fire(c);try{ws&&ws.close()}catch(e){}}};
        function makeConn(g){
          const c={onmessage:null,onclose:null,
            send(s){if(ws&&ws.readyState===1)ws.send(JSON.stringify({g,d:s}))},
            close(){if(conns.get(g)===c){conns.delete(g);try{ws.send(JSON.stringify({t:'kick',g}))}catch(e){}}}};
          return c;
        }
        function connect(){
          try{ws=openSocket(code,'host')}catch(e){if(!settled){settled=true;no(e)}return}
          const mine=ws;let gotReady=false;
          const timer=setTimeout(()=>{if(!gotReady){try{mine.close()}catch(e){}}},CONNECT_MS);
          mine.onmessage=ev=>{
            const raw=typeof ev.data==='string'?ev.data:String(ev.data);if(raw==='pong')return;
            let m;try{m=JSON.parse(raw)}catch(e){return}
            if(m.t==='ready'){gotReady=true;clearTimeout(timer);tries=0;if(!settled){settled=true;ok(handle)}return}
            if(m.t==='error'){clearTimeout(timer);if(!settled){settled=true;closed=true;clearInterval(ping);no(m.code==='taken'?Object.assign(Error('That room code is already in use'),{code:'taken'}):netErr(noRelay))}return}
            if(m.t==='open'){const c=makeConn(m.g);conns.set(m.g,c);onConnection(c);return}
            if(m.t==='close'){const c=conns.get(m.g);if(c){conns.delete(m.g);fire(c)}return}
            if(typeof m.g==='string'&&typeof m.d==='string'){const c=conns.get(m.g);if(c&&c.onmessage)c.onmessage(m.d)}
          };
          mine.onerror=()=>{};
          mine.onclose=()=>{
            clearTimeout(timer);
            if(mine!==ws)return;
            const old=[...conns.values()];conns.clear();for(const c of old)fire(c);   // the relay link dropped: guests rejoin by themselves
            if(closed)return;
            if(!settled){settled=true;clearInterval(ping);no(netErr(noRelay));return}
            if(++tries>RETRIES){closed=true;clearInterval(ping);return}
            setTimeout(()=>{if(!closed)connect()},RETRY_MS);
          };
        }
        connect();
      });
    },
    join(code){
      return new Promise((ok,no)=>{
        let ws,settled=false;
        try{ws=openSocket(code,'guest')}catch(e){return no(e)}
        const c={onmessage:null,onclose:null,send(s){if(ws.readyState===1)ws.send(s)},close(){clearInterval(ping);try{ws.close()}catch(e){}}};
        const ping=keepAlive(()=>ws);
        const timer=setTimeout(()=>{if(!settled){settled=true;clearInterval(ping);try{ws.close()}catch(e){}no(netErr(noRelay))}},CONNECT_MS);
        ws.onmessage=ev=>{
          const raw=typeof ev.data==='string'?ev.data:String(ev.data);if(raw==='pong')return;
          if(!settled){
            settled=true;clearTimeout(timer);let m=null;try{m=JSON.parse(raw)}catch(e){}
            if(m&&m.t==='ready')ok(c);
            else{clearInterval(ping);no(m&&m.code==='notfound'?Object.assign(Error('No such room'),{code:'notfound'}):netErr(noRelay))}
            return;
          }
          if(c.onmessage)c.onmessage(raw);
        };
        ws.onerror=()=>{};
        ws.onclose=()=>{clearTimeout(timer);clearInterval(ping);if(!settled){settled=true;no(netErr(noRelay))}else fire(c)};
      });
    }
  };
}

if(typeof module!=='undefined')module.exports={createNet,peerJsTransport,wsTransport,netNormalizeCode,NET_PROTO};
