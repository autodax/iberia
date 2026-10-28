// Node test suite for online play. Run: node tests/net.test.js
// A host and several guests talk through an in-memory fake network. Each "page" runs its own copy of the engine,
// exactly like separate browsers would, and the tests check that every copy ends up identical.
global.MAP=require('../src/map.js').MAP;
const E=require('../src/engine.js');
const {createNet,netNormalizeCode}=require('../src/net.js');
const {C,transact,initial,hash,fullHands,CP}=E;

let pass=0,fail=0;const failures=[];
function ok(v,m){if(v)pass++;else{fail++;failures.push(m)}}
async function group(name,f){console.log('GROUP '+name+' @'+Math.round(process.uptime())+'s');try{await f()}catch(e){fail++;failures.push(name+': '+(e&&e.stack||e).toString().split('\n').slice(0,4).join(' | '))}}
const tick=(ms=0)=>new Promise(r=>setTimeout(r,ms));
async function settle(){await tick(150)}

/* ---------- the real relay, running locally (wrangler dev) ---------- */
const RELAY=process.env.RELAY_URL||'http://127.0.0.1:8787';
const {wsTransport}=require('../src/net.js');
const sockets=new Set();
class TrackedWS extends WebSocket{constructor(u){super(u);this.u=u;sockets.add(this);this.addEventListener('close',()=>sockets.delete(this))}}
function makeNetwork(){
  const nw={rooms:new Map(),
    killWhere(f){for(const s of [...sockets])if(f(s.u))s.close()},
    transport:()=>wsTransport(RELAY,{WebSocket:TrackedWS,pingMs:5000,retryMs:300,connectMs:8000})};
  return nw;
}

/* ---------- one simulated page ---------- */
const VERSION={ui:'test',engine:E.VERSION,map:'m'};
function makePage(nw,label,opts={}){
  const page={label,state:initial('placeholder',4,['sailor','agronomist']),applied:0,asked:[],answer:true,starts:0,loads:0,store:new Map(),tok:new Map()};
  const mem=m=>({getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)});
  const sum=()=>hash(JSON.stringify({...page.state,fx:undefined})).toString(16);
  const hooks={
    getState:()=>page.state,
    loadState:s=>{page.state=s;page.loads++},
    apply:cmd=>{let n;try{n=transact(page.state,cmd)}catch(e){return {ok:false,error:e.needChoice?'Incomplete choices':e.message}}page.state=n;page.applied++;return {ok:true,sum:sum()}},
    checksum:sum,
    onStart:g=>{page.state=initial(g.seed,g.difficulty,g.roles);page.starts++;page.game=g},
    ask:async q=>{page.asked.push(q);return page.answer}
  };
  page.sum=sum;
  page.net=createNet({transport:opts.transport||nw.transport(),hooks,version:opts.version||VERSION,storage:opts.storage||mem(page.store),tokenStore:mem(page.tok),newSeed:()=>opts.seed||('seed'+Math.random().toString(36).slice(2,6)),heartbeat:false});
  return page;
}

/* a command the way the page builds it: ask the engine for choices until it is satisfied */
function resolve(state,cmd){let ch=[];for(;;){try{transact(state,{...cmd,choices:ch});return {...cmd,choices:ch}}catch(e){if(!e.needChoice)throw e;ch.push(e.needChoice.options[0])}}}
function tryResolve(state,cmd){try{return resolve(state,cmd)}catch(e){return null}}

/* find any legal command for the active player (very small bot): moves, treats, draws, infects, discards */
function botMove(s){
  if(s.status!=='playing')return null;
  const over=fullHands(s);
  if(s.phase==='setup')return null;
  if(over.length){const seat=over[0],card=s.players[seat].hand.find(k=>C[k])||s.players[seat].hand[0];return {type:'discard',seat,card}}
  if(s.phase==='epidemic')return {type:'epidemic'};
  if(s.phase==='infection')return {type:'infect'};
  if(s.phase==='draw')return {type:'draw'};
  const p=s.players[s.active];
  if(s.actions<=0)return {type:'draw'};
  for(const color of ['red','blue','yellow','black'])if(s.cubes[p.city][color]>0){const c=tryResolve(s,{type:'treat',color});if(c)return c}
  const nb=E.ADJ?(E.ADJ[p.city]||[]):[];
  for(const to of (Array.isArray(nb)?nb:Object.keys(nb))){const c=tryResolve(s,{type:'carriage',to:typeof to==='string'?to:to.to||to.id});if(c)return c}
  return {type:'draw'};
}

async function startRoom(nw,guestCount,{players=3,seed='seedA'}={}){
  const host=makePage(nw,'host',{seed});
  const guests=[];
  const code=await host.net.host('Hosty');
  for(let i=0;i<guestCount;i++){const g=makePage(nw,'g'+i);guests.push(g);await g.net.join(code,'Guest'+i)}
  await settle();
  host.net.setSettings({players});
  return {host,guests,code};
}
function beginGame(host,guests){
  const r=host.net.start();if(!r.ok)throw Error(r.error);
  const s=host.state;
  const cities=s.players.map(p=>p.hand.find(k=>C[k])||'c22');
  return {cities};
}
async function hostStartsPlay(host){
  const cities=host.state.players.map(p=>p.hand.find(k=>C[k])||Object.keys(C)[0]);
  const cmd=resolve(host.state,{type:'start',cities,first:0});
  const r=await host.net.submit(cmd);if(!r.ok)throw Error(r.error);
}
const allSame=pages=>pages.every(p=>p.sum()===pages[0].sum());

(async()=>{
  await group('room code cleanup',()=>{ok(netNormalizeCode(' k7-qm4 ')==='K7QM4','upper-cased and cleaned');ok(netNormalizeCode('o0i1')==='','look-alike characters removed')});

  await group('host and guests meet in a lobby',async()=>{
    const nw=makeNetwork();const {host,guests,code}=await startRoom(nw,2,{players:3});
    ok(code.length===5,'five character code');
    ok(host.net.lobby.people.length===3,'host sees everyone');
    ok(guests[0].net.lobby.people.length===3&&guests[1].net.lobby.people.length===3,'guests see everyone');
    ok(guests[0].net.myId!==guests[1].net.myId,'distinct ids');
    guests[0].net.claim(0);guests[1].net.claim(1);await settle();
    ok(host.net.lobby.seats[0]===guests[0].net.myId&&host.net.lobby.seats[1]===guests[1].net.myId,'claims reach the host');
    guests[1].net.claim(0);await settle();
    ok(host.net.lobby.seats[0]===guests[0].net.myId,'cannot take a seat someone else holds');
    ok(guests[0].net.mine(0)&&!guests[0].net.mine(1),'mine() reflects the claim');
    ok(!guests[0].net.mine(2)&&host.net.mine(2),'host covers the unclaimed seat');
    host.net.assign(2,guests[0].net.myId);await settle();
    ok(guests[0].net.mine(2),'host can assign a seat');
    guests[0].net.release(2);await settle();
    ok(host.net.lobby.seats[2]===null,'guest can release a seat');
    ok(!guests[0].net.setSettings({players:2}).ok,'guests cannot change settings');
  });

  await group('start sends the same deal to everyone',async()=>{
    const nw=makeNetwork();const {host,guests}=await startRoom(nw,2,{players:3,seed:'dealX'});
    host.net.setSettings({difficulty:5});
    ok(host.net.start().ok,'host starts');await settle();
    ok(allSame([host,...guests]),'identical opening state on all pages');
    ok(host.state.players.length===3&&host.state.seed==='dealX','state built from the host settings');
    ok(guests[0].net.lobby.phase==='playing','lobby phase is playing');
    ok(!guests[0].net.start().ok,'guest cannot start');
  });

  await group('commands are checked and relayed in order',async()=>{
    const nw=makeNetwork();const {host,guests}=await startRoom(nw,2,{players:3});
    guests[0].net.claim(0);guests[1].net.claim(1);await settle();
    host.net.start();await settle();
    ok((await guests[0].net.submit({type:'start',cities:[],first:0,choices:[]})).ok===false,'guest cannot send start');
    await hostStartsPlay(host);await settle();
    ok(host.state.phase==='actions'&&allSame([host,...guests]),'start applied everywhere');
    const active=host.state.active;
    // the guest who does NOT own the active seat is refused
    const wrong=active===0?guests[1]:guests[0];
    const mv=botMove(host.state);
    const r1=await wrong.net.submit(mv);
    ok(!r1.ok&&/played by someone else/.test(r1.error),'a non-owner is refused: '+r1.error);
    ok(allSame([host,...guests]),'a refused command changes nothing');
    // the owner succeeds
    const owner=active===0?guests[0]:active===1?guests[1]:host;
    const before=host.state.log.length;
    const r2=await owner.net.submit(mv);
    ok(r2.ok,'owner accepted: '+(r2.error||''));await settle();
    ok(host.state.log.length>before&&allSame([host,...guests]),'accepted command is on every page');
    ok(host.net.seq===2&&guests[0].net.seq===2&&guests[1].net.seq===2,'sequence numbers agree (start + one move)');
    // an illegal command from the owner is rejected by the engine
    const bad=await owner.net.submit({type:'build',to:'nowhere',choices:[]});
    ok(!bad.ok,'engine rejects an illegal command');
    ok(allSame([host,...guests]),'still identical after a rejection');
  });

  await group('discards and events belong to the seat named in the command',async()=>{
    const nw=makeNetwork();const {host,guests}=await startRoom(nw,2,{players:3});
    guests[0].net.claim(0);guests[1].net.claim(1);await settle();host.net.start();await settle();await hostStartsPlay(host);await settle();
    const s=host.state;const seat=1,card=s.players[seat].hand[0];
    const r=await guests[0].net.submit({type:'discard',seat,card,choices:[]});
    ok(!r.ok&&/someone else/.test(r.error),'guest 0 cannot discard from seat 1');
    const ev=Object.keys(E.EVENTS);
    const r2=await guests[0].net.submit({type:'event',seat:1,card:ev[0],args:{},choices:[]});
    ok(!r2.ok,'guest 0 cannot play an Event from seat 1\'s hand');
  });

  await group('a whole game stays in sync (bot plays every seat)',async()=>{
    for(const seed of ['g1','g2','g3']){
      const nw=makeNetwork();const {host,guests}=await startRoom(nw,2,{players:3,seed});
      guests[0].net.claim(0);guests[1].net.claim(1);await settle();host.net.start();await settle();await hostStartsPlay(host);await settle();
      const pages=[host,...guests];let moves=0,rejected=0;
      while(host.state.status==='playing'&&moves<600){
        const cmd=botMove(host.state);if(!cmd)break;
        const s=host.state;const seat=(cmd.type==='discard'||cmd.type==='event')?cmd.seat:s.active;
        const who=seat===0?guests[0]:seat===1?guests[1]:host;
        const r=await who.net.submit(cmd.choices?cmd:resolve(s,cmd));
        if(!r.ok)rejected++;moves++;
        if(moves%10===0)await settle();
      }
      await settle();
      ok(moves>20,'seed '+seed+': played '+moves+' commands');
      ok(allSame(pages),'seed '+seed+': all three pages identical after '+moves+' commands, status '+host.state.status);
      ok(rejected<moves*.2,'seed '+seed+': few rejections ('+rejected+')');
      ok(guests[0].net.seq===host.net.seq,'seed '+seed+': same sequence');
    }
  });

  await group('state size for a joining or resyncing player',async()=>{
    const nw=makeNetwork();const {host,guests}=await startRoom(nw,1,{players:4});
    host.net.start();await settle();await hostStartsPlay(host);await settle();
    const bytes=JSON.stringify(host.state).length;
    ok(bytes<400000,'full state is '+bytes+' bytes');
    console.log('   (full state size: '+bytes+' bytes)');
  });

  await group('a late joiner gets the whole game',async()=>{
    const nw=makeNetwork();const {host,guests,code}=await startRoom(nw,1,{players:2});
    host.net.start();await settle();await hostStartsPlay(host);await settle();
    for(let i=0;i<6;i++){const cmd=botMove(host.state);if(!cmd)break;await host.net.submit(cmd.choices?cmd:resolve(host.state,cmd))}
    await settle();
    const late=makePage(nw,'late');await late.net.join(code,'Late');await settle();
    ok(late.loads>=1&&late.sum()===host.sum(),'late joiner holds the same state');
    ok(late.net.seq===host.net.seq,'late joiner has the sequence number');
    const cmd=botMove(host.state);const r=await late.net.submit(cmd.choices?cmd:resolve(host.state,cmd));
    ok(!r.ok,'a spectator cannot act');
  });

  await group('desync is detected and repaired',async()=>{
    const nw=makeNetwork();const {host,guests}=await startRoom(nw,1,{players:2});
    guests[0].net.claim(0);await settle();host.net.start();await settle();await hostStartsPlay(host);await settle();
    // corrupt the guest's copy, then play one more command
    guests[0].state=CP(guests[0].state);guests[0].state.outbreaks=7;
    const cmd=botMove(host.state);const who=host.state.active===0?guests[0]:host;const rr=await who.net.submit(cmd.choices?cmd:resolve(host.state,cmd));ok(rr.ok,'command accepted by the host');
    await settle();await settle();
    ok(guests[0].loads>=1,'guest asked for and loaded a fresh state');
    ok(guests[0].sum()===host.sum(),'states match again');
  });

  await group('version mismatch is refused with a clear message',async()=>{
    const nw=makeNetwork();const host=makePage(nw,'host');const code=await host.net.host('H');
    const old=makePage(nw,'old',{version:{ui:'0.0.1',engine:E.VERSION,map:'m'}});
    let msg='';try{await old.net.join(code,'Old')}catch(e){msg=e.message}
    ok(/version mismatch/i.test(msg),'refused: '+msg);
    ok(!old.net.active,'refused guest is not left half joined');
    const bad=makePage(nw,'bad');let m2='';try{await bad.net.join('ZZZZZ','X')}catch(e){m2=e.message}
    ok(/No room found/.test(m2),'unknown code explained: '+m2);
  });

  await group('room is full at 8 people',async()=>{
    const nw=makeNetwork();const host=makePage(nw,'host');const code=await host.net.host('H');
    const gs=[];for(let i=0;i<7;i++){const g=makePage(nw,'g'+i);await g.net.join(code,'G'+i);gs.push(g)}
    const extra=makePage(nw,'extra');let msg='';try{await extra.net.join(code,'X')}catch(e){msg=e.message}
    ok(/full/i.test(msg),'ninth person refused: '+msg);
  });

  await group('asking another seat for consent',async()=>{
    const nw=makeNetwork();const {host,guests}=await startRoom(nw,2,{players:3});
    guests[0].net.claim(0);guests[1].net.claim(1);await settle();host.net.start();await settle();
    guests[1].answer=true;
    ok(await guests[0].net.askSeat(1,'Ana: do you agree?')===true&&guests[1].asked.length===1,'guest asks another guest');
    guests[1].answer=false;
    ok(await guests[0].net.askSeat(1,'Ana: again?')===false,'a "no" comes back as false');
    host.answer=true;
    ok(await guests[0].net.askSeat(2,'Unclaimed seat: ok?')===true&&host.asked.length===1,'an unclaimed seat is answered by the host');
    guests[0].answer=true;
    ok(await host.net.askSeat(0,'Host asks guest 0')===true&&guests[0].asked.length===1,'host asks a guest');
  });

  await group('leaving gives up seats',async()=>{
    const nw=makeNetwork();const {host,guests}=await startRoom(nw,2,{players:3});
    guests[0].net.claim(0);await settle();
    guests[0].net.leave();await settle();
    ok(host.net.lobby.seats[0]===null,'seat freed');ok(host.net.lobby.people.length===2,'person removed');
    ok(!guests[0].net.active,'guest is out');
    host.net.leave();await settle();ok(!host.net.active&&!host.net.savedHost(),'host leaving closes the room and forgets the snapshot');
  });

  await group('relay: unknown room, taken code',async()=>{
    const nw=makeNetwork();const g=makePage(nw,'g');let m='';try{await g.net.join('QQQQQ','X')}catch(e){m=e.message}
    ok(/No room found/.test(m),'unknown code explained: '+m);
    const t=nw.transport();const h1=await t.host('TAKEN',()=>{});let code='';try{await nw.transport().host('TAKEN',()=>{})}catch(e){code=e.code}
    ok(code==='taken','second host on the same code refused');h1.close();await tick(200);
    const h2=await nw.transport().host('TAKEN',()=>{});ok(!!h2,'code free again after the host leaves');h2.close();
  });
  await group('relay: unreachable relay gives a clear error',async()=>{
    const bad=wsTransport('http://127.0.0.1:1',{WebSocket:TrackedWS,connectMs:3000});let m='';try{await bad.join('ABCDE')}catch(e){m=e.message+'|'+e.code}
    ok(/relay server/i.test(m)&&/net$/.test(m),'join error: '+m);
    m='';try{await bad.host('ABCDE',()=>{})}catch(e){m=e.message+'|'+e.code}
    ok(/relay server/i.test(m)&&/net$/.test(m),'host error: '+m);
    const d=await bad.diagnose();ok(d.ok===false,'diagnose reports unreachable');
    const good=await wsTransport(RELAY,{WebSocket:TrackedWS}).diagnose();ok(good.ok===true,'diagnose reports the relay is up');
  });
  await group('relay: a guest that drops returns with the same seat and state',async()=>{
    const nw=makeNetwork();const {host,guests,code}=await startRoom(nw,2,{players:3});
    guests[0].net.claim(0);guests[1].net.claim(1);await settle();host.net.start();await tick(300);await hostStartsPlay(host);await tick(300);
    const gid=guests[1].net.myId;
    nw.killWhere(u=>u.includes('role=guest'));
    await tick(500);
    // the host plays a move meanwhile
    const cmd=botMove(host.state);const act=host.state.active;
    ok(host.net.lobby.people.some(p=>!p.connected),'host sees guests as away');
    // guests reconnect on their own (first retry after about a second)
    for(let i=0;i<40&&!(guests[0].net.status==='connected'&&guests[1].net.status==='connected');i++)await tick(250);
    ok(guests[1].net.status==='connected'&&guests[1].net.myId===gid,'guest back with the same identity');
    ok(host.net.lobby.seats[1]===gid,'seat kept');
    await tick(300);ok(allSame([host,...guests]),'same state after returning');
    const owner=act===0?guests[0]:act===1?guests[1]:host;const r=await owner.net.submit(cmd.choices?cmd:resolve(host.state,cmd));
    await tick(300);ok(r.ok&&allSame([host,...guests]),'play continues in sync');
  });
  await group('relay: the host loses the relay and everyone comes back',async()=>{
    const nw=makeNetwork();const {host,guests,code}=await startRoom(nw,1,{players:2});
    guests[0].net.claim(0);await settle();host.net.start();await tick(300);await hostStartsPlay(host);await tick(300);
    const seqBefore=host.net.seq;
    nw.killWhere(u=>u.includes('role=host'));
    for(let i=0;i<20&&guests[0].net.status==='connected';i++)await tick(100);   // wait for the drop to be noticed first
    ok(guests[0].net.status!=='connected','guest notices the host link dropped');
    for(let i=0;i<60&&!(guests[0].net.status==='connected'&&host.net.lobby.people.every(p=>p.connected)&&host.net.lobby.people.length===2);i++)await tick(250);
    ok(guests[0].net.status==='connected','guest reconnected');ok(host.net.lobby.people.every(p=>p.connected),'host sees the guest again');
    ok(host.net.seq===seqBefore&&allSame([host,guests[0]]),'game intact');
    const cmd=botMove(host.state);const act=host.state.active;const who=act===0?guests[0]:host;
    const r=await who.net.submit(cmd.choices?cmd:resolve(host.state,cmd));await tick(300);
    ok(r.ok&&allSame([host,guests[0]]),'play continues after the host reconnected');
  });
  await group('relay: host refresh (resume) keeps the room code',async()=>{
    const nw=makeNetwork();const {host,guests,code}=await startRoom(nw,1,{players:2});
    guests[0].net.claim(0);await settle();host.net.start();await tick(300);await hostStartsPlay(host);await tick(300);
    const saved=host.store,sumBefore=host.sum();
    // the old host page vanishes (its relay link closes), a new page resumes the same room
    nw.killWhere(u=>u.includes('role=host'));await tick(100);
    const host2=makePage(nw,'host2',{storage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)}});
    const c2=await host2.net.resumeHost('Hosty');
    ok(c2===code&&host2.sum()===sumBefore,'same code and game');
  });

  console.log(pass+' checks passed, '+fail+' failed');
  if(fail){console.log(failures.map(f=>' - '+f).join('\n'));process.exit(1)}
  process.exit(0);
})();
