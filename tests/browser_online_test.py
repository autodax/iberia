"""Two-browser-tab test of online play. Run: python3 tests/browser_online_test.py
Needs Playwright + Chromium (set CHROMIUM=/path/to/chrome to use a specific browser) and serves the repo on
localhost. The public PeerJS service is replaced by a fake that passes messages between tabs of one browser,
so the test needs no internet. It checks the page wiring (lobby, seats, who may act, sync), not WebRTC itself."""
import asyncio,os,sys,subprocess,time
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1];PORT=8765
FAKE_PEER="""
(()=>{
 const bc=()=>new BroadcastChannel('fakepeer');
 class Conn{constructor(peer,cid,other){this.peer=peer;this.cid=cid;this.other=other;this.h={};this.open=false}
  on(e,f){(this.h[e]=this.h[e]||[]).push(f)}emit(e,...a){(this.h[e]||[]).forEach(f=>f(...a))}
  send(d){this.peer.post({k:'data',cid:this.cid,to:this.other,d})}
  close(){this.peer.post({k:'close',cid:this.cid,to:this.other});this.emit('close');this.peer.conns.delete(this.cid)}}
 window.Peer=class{
  constructor(id,opts){if(id&&typeof id==='object'){opts=id;id=null}this.h={};this.conns=new Map();this.ch=bc();this.id=id||('anon'+Math.random().toString(36).slice(2));this.dead=false;(window.__peers=window.__peers||[]).push(this);
   this.ch.onmessage=e=>this.recv(e.data);
   if(id){this.post({k:'claim',id});this.claimTimer=setTimeout(()=>{if(!this.dead)this.emit('open',this.id)},120)}else setTimeout(()=>this.emit('open',this.id),10)}
  on(e,f){(this.h[e]=this.h[e]||[]).push(f)}emit(e,...a){(this.h[e]||[]).forEach(f=>f(...a))}
  post(m){this.ch.postMessage(m)}
  recv(m){
   if(this.dead)return;
   if(m.k==='claim'&&m.id===this.id&&!this.claimTimer_done){if(this.opened)this.post({k:'taken',id:m.id})}
   if(m.k==='taken'&&m.id===this.id&&!this.opened){clearTimeout(this.claimTimer);this.dead=true;this.emit('error',{type:'unavailable-id'})}
   if(m.k==='conn'&&m.to===this.id){const c=new Conn(this,m.cid,m.from);this.conns.set(m.cid,c);this.emit('connection',c);c.open=true;c.emit('open');this.post({k:'accept',cid:m.cid,to:m.from})}
   if(m.k==='accept'&&m.to===this.id){const c=this.conns.get(m.cid);if(c){clearTimeout(c.t);c.open=true;c.emit('open')}}
   if(m.k==='data'&&m.to===this.id){const c=this.conns.get(m.cid);if(c)c.emit('data',m.d)}
   if(m.k==='close'&&m.to===this.id){const c=this.conns.get(m.cid);if(c){this.conns.delete(m.cid);c.emit('close')}}
  }
  connect(to){const cid='c'+Math.random().toString(36).slice(2),c=new Conn(this,cid,to);this.conns.set(cid,c);this.post({k:'conn',cid,from:this.id,to});c.t=setTimeout(()=>{if(!c.open)this.emit('error',{type:'peer-unavailable'})},600);return c}
  destroy(){this.dead=true;for(const c of [...this.conns.values()])c.close();try{this.ch.close()}catch(e){}}
  reconnect(){}
 };
 // the page ships the real PeerJS; keep this fake in place of it for the test
 const Fake=window.Peer;Object.defineProperty(window,'Peer',{get:()=>Fake,set:()=>{},configurable:true});
})();
"""
res=[];errs=[]
def ok(c,m):res.append((bool(c),m))
async def main():
  srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
  try:
    async with async_playwright() as p:
      b=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM') or None)
      ctx=await b.new_context(viewport={'width':1366,'height':768})
      RELAY=os.environ.get('RELAY_URL')
      if RELAY:   # real relay instead of the fake PeerJS: start it first (cd relay && npx wrangler dev --port 8787, or node tools/home-relay/relay.js)
        await ctx.add_init_script("try{localStorage.setItem('iberia-relay','"+RELAY+"')}catch(e){}")
      else:
        await ctx.add_init_script(FAKE_PEER.replace("this.opened","this._o").replace("if(!this.dead)this.emit('open',this.id)","if(!this.dead){this._o=true;this.emit('open',this.id)}"))
      async def page(name):
        pg=await ctx.new_page();pg.on('pageerror',lambda e:errs.append(name+': '+str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(name+': '+m.text));return pg
      A=await page('host');B=await page('guest')
      await A.goto(f'http://localhost:{PORT}/index.html');await B.goto(f'http://localhost:{PORT}/index.html')
      await A.wait_for_timeout(400)
      # --- host a room
      await A.click('#onlineButton');await A.fill('#onName','Ana')
      await A.click('#onHost');await A.wait_for_selector('#choiceDialog[open]');await A.click('#choiceOptions button:first-child')
      await A.wait_for_function('Net.active&&Net.status==="connected"&&Net.code.length===5',timeout=8000)
      code=await A.evaluate('Net.code');ok(len(code)==5,'host gets a room code '+code)
      ok(await A.is_visible('#onSeats .onSeat'),'host sees the seat list')
      # --- guest joins with the code
      await B.click('#onlineButton');await B.fill('#onName','Ben');await B.fill('#onCode',code.lower());await B.click('#onJoin')
      await B.wait_for_function('Net.active&&Net.status==="connected"',timeout=8000)
      ok(await B.evaluate('Net.lobby.people.length')==2,'guest joined and sees 2 people')
      await A.wait_for_function('Net.lobby.people.length===2')
      ok(await A.evaluate('Net.lobby.people.some(p=>p.name==="Ben")'),'host sees Ben')
      # --- guest takes seat 2 (second role)
      await B.click('#onSeats .onSeat:nth-child(2) button:has-text("Take this seat")')
      await A.wait_for_function('Net.lobby.seats[1]!==null')
      await B.wait_for_function('Net.mine(1)',timeout=5000)
      ok(await B.evaluate('Net.mine(1)&&!Net.mine(0)'),'Ben owns seat 2 only')
      ok(await A.evaluate('Net.mine(0)&&!Net.mine(1)'),'Ana (host) plays the unclaimed seat 1 and not Ben\'s')
      await A.screenshot(path='/tmp/online_lobby_host.png');await B.screenshot(path='/tmp/online_lobby_guest.png')
      # --- start
      await A.click('#onStartGame')
      await B.wait_for_function('Net.lobby.phase==="playing"&&state.phase==="setup"',timeout=8000)
      ok(not await A.evaluate("document.getElementById('onlineDialog').open"),'lobby dialog closes on the host at start')
      ok(not await B.evaluate("document.getElementById('onlineDialog').open"),'lobby dialog closes on the guest at start')
      ok(await A.evaluate('netSum()')==await B.evaluate('netSum()'),'same opening deal on both pages')
      ok(await A.is_visible('#setupPanel'),'host sees the setup panel')
      ok(not await B.is_visible('#setupPanel'),'guest does not see the setup panel')
      await A.locator('#setupPanel button',has_text='Player 1 (').last.click()  # the first player depends on the random deal, so choose seat 1
      await A.click('#begin');await B.wait_for_function('state.phase==="actions"',timeout=8000)
      await A.evaluate('resetFx()');await B.evaluate('resetFx()')
      ok(await A.evaluate('netSum()')==await B.evaluate('netSum()'),'same state after Begin game')
      # --- it is seat 0's turn (host). The guest has no actions and cannot act.
      ok(await A.evaluate('state.active')==0,'seat 1 is up first')
      ok(await B.evaluate('Object.values(legal).every(v=>v.length===0)'),'guest has no available actions on host\'s turn')
      ok('Waiting for' in (await B.inner_text('#actionHint')),'guest is told who we are waiting for')
      ok(await B.evaluate('document.getElementById("nextPhase").hidden'),'guest cannot press Continue on host\'s turn')
      r=await B.evaluate('perform({type:"draw"})');ok(r==False,'a forced command from the guest is refused')
      ok(await A.evaluate('state.actions')==4,'refused command changed nothing')
      # host acts: first legal carriage move, through the real perform()
      await A.evaluate('(async()=>{await perform({...legal.carriage[0]})})()')
      await B.wait_for_function('state.actions===3',timeout=5000)
      ok(await A.evaluate('netSum()')==await B.evaluate('netSum()'),'host move shows on the guest and states match')
      # host ends actions and works through the draw and infection steps until it is Ben's turn
      for _ in range(60):
        if await A.evaluate('state.active')==1 and await A.evaluate('state.phase')=='actions':break
        txt=await A.evaluate('(()=>{let b=document.getElementById("nextPhase");return b.hidden||b.disabled?"":"go"})()')
        if txt=='go':await A.evaluate('document.getElementById("nextPhase").click()')
        else:
          # discard if over the limit, or clear a card reveal
          await A.evaluate('resetFx();(async()=>{let s=fullHands(state);if(s.length)await perform({type:"discard",seat:s[0],card:state.players[s[0]].hand.find(k=>C[k])})})()')
        await A.wait_for_timeout(120)
      await B.wait_for_function('state.active===1&&state.phase==="actions"',timeout=8000)
      await B.evaluate('resetFx()')
      ok(await A.evaluate('netSum()')==await B.evaluate('netSum()'),'states match after a full turn (draw, epidemics, infections)')
      # --- now it is Ben's turn: he can act, the host cannot
      ok(await B.evaluate('Object.values(legal).some(v=>v.length>0)'),'guest has actions on his own turn')
      ok(await A.evaluate('Object.values(legal).every(v=>v.length===0)'),'host has no actions on the guest\'s turn')
      ok(await A.evaluate('perform({type:"draw"})')==False,'host cannot act for Ben\'s seat while he is connected')
      await B.screenshot(path='/tmp/online_play_guest.png')
      await B.evaluate('(async()=>{await perform({...legal.carriage[0]})})()')
      await A.wait_for_function('state.actions===3&&state.active===1',timeout=5000)
      ok(await A.evaluate('netSum()')==await B.evaluate('netSum()'),'guest move shows on the host and states match')
      ok(await B.evaluate('document.getElementById("hands").innerText.includes("(you)")'),'guest sees which hand is his')
      # --- guest closes the page: host sees him go away and can cover the seat
      await B.evaluate('(window.__peers||[]).forEach(p=>p.destroy())')  # what a closing tab does to its connections
      await B.close()
      await A.wait_for_function('Net.lobby.people.find(p=>p.name==="Ben").connected===false',timeout=8000)
      ok(await A.evaluate('Net.mine(1)'),'host can act for an absent player\'s seat')
      # --- host leaves: board stays as a local game
      await A.evaluate('Net.leave();render()');await A.wait_for_timeout(200)
      ok(await A.evaluate('!Net.active&&state.players.length===2'),'after leaving, the board stays as a local game')
      ok(await A.evaluate('Net.mine(1)'),'offline, every seat is yours again')
      await b.close()
  finally:
    srv.terminate()
    for c,m in res:print(('ok   ' if c else 'FAIL ')+m)
  bad=[m for c,m in res if not c]
  real=[e for e in errs if 'favicon' not in e and 'raw.githubusercontent' not in e and 'Failed to load resource' not in e and 'ERR_' not in e]
  if real:print('page errors:',real)
  print(len(res)-len(bad),'passed,',len(bad),'failed')
  sys.exit(1 if bad or real else 0)
asyncio.run(main())
