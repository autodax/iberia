import asyncio,sys,json
from playwright.async_api import async_playwright
F=''+__import__('pathlib').Path(__file__).resolve().parents[1].joinpath('index.html').as_uri()+''
res=[];errs=[]
def ok(c,m):res.append((bool(c),m))
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path=__import__('os').environ.get('CHROMIUM') or None)
    for W,H in [(1280,720),(1366,768),(1440,900),(1920,1080),(1024,768)]:
      pg=await b.new_page(viewport={'width':W,'height':H});pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
      await pg.goto(F);await pg.wait_for_timeout(300)
      sc=await pg.evaluate("[document.documentElement.scrollHeight<=innerHeight+1,document.documentElement.scrollWidth<=innerWidth+1]")
      ok(all(sc),f'{W}x{H} no page scroll at setup')
      await pg.click('#begin');await pg.wait_for_timeout(200)
      ok(await pg.evaluate("state.phase==='actions'"),f'{W}x{H} game begins')
      bb=await pg.evaluate("(()=>{let a=document.getElementById('app').getBoundingClientRect();return [a.right<=innerWidth+1,a.bottom<=innerHeight+1]})()")
      ok(all(bb),f'{W}x{H} app fits')
      fit=await pg.evaluate("(()=>{let f=document.getElementById('boardFrame').getBoundingClientRect();return Math.abs(f.width/f.height-1521/1080)})()")
      ok(fit<0.02,f'{W}x{H} board aspect snug ({fit:.3f})')
      await pg.screenshot(path=f'/tmp/shot_{W}x{H}.png')
      await pg.close()
    # gameplay in 1366
    pg=await b.new_page(viewport={'width':1366,'height':768});pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto(F)
    # new 4-player game with nurse etc via engine (UI menu path tested separately)
    await pg.click('#menuButton');await pg.select_option('#playerCount','4');await pg.wait_for_timeout(100)
    n=await pg.evaluate("document.querySelectorAll('#roleFields select').length");ok(n==4,'4 role selectors')
    await pg.select_option('#role2','nurse');await pg.select_option('#role3','scientist')
    await pg.click('#newGame');await pg.wait_for_selector('#choiceDialog[open]');await pg.click('#choiceOptions button >> nth=0');await pg.wait_for_timeout(200)
    ok(await pg.evaluate("state.players.length===4&&state.players.map(p=>p.role).includes('nurse')"),'4-player game with nurse')
    ok(await pg.evaluate("document.querySelectorAll('.hand').length===4"),'four hands shown')
    await pg.click('#begin');await pg.wait_for_timeout(200)
    # nurse choice dialog might appear
    if await pg.evaluate("document.getElementById('choiceDialog').open"):
      await pg.click('#choiceOptions button >> nth=0');await pg.wait_for_timeout(200)
    ok(await pg.evaluate("state.phase==='actions'&&!!state.prevention"),'begun with prevention token placed')
    ok(await pg.evaluate("[...document.querySelectorAll('#pieces image')].some(i=>i.getAttribute('href')===TOKENS.prevention)"),'prevention token drawn')
    ok(await pg.evaluate("[...document.querySelectorAll('#pieces image')].some(i=>i.getAttribute('href')===TOKENS.infection)"),'infection marker drawn')
    ok(await pg.evaluate("[...document.querySelectorAll('#pieces image')].some(i=>i.getAttribute('href')===TOKENS.outbreak)"),'outbreak marker drawn')
    btns=await pg.evaluate("[...document.querySelectorAll('#actionButtons button')].map(b=>b.textContent)");ok('Carriage / boat' in btns,'carriage shown: '+','.join(btns))
    ok('Research disease' not in btns,'research hidden')
    await pg.click('text=Carriage / boat');await pg.wait_for_timeout(100)
    city0=await pg.evaluate("state.players[state.active].city");await pg.click('#confirm');await pg.wait_for_timeout(200)
    if await pg.evaluate("document.getElementById('choiceDialog').open"):await pg.click('#choiceOptions button >> nth=0')
    await pg.wait_for_timeout(150)
    ok(await pg.evaluate(f"state.players[state.active].city!=='{city0}'&&state.actions===3"),'moved, 3 actions left')
    # end actions → draw reveal
    await pg.evaluate("state.actions=0;recompute();render()")
    await pg.click('#nextPhase');await pg.wait_for_timeout(200)
    for _ in range(4):
      if await pg.evaluate("document.getElementById('choiceDialog').open"):await pg.click('#choiceOptions button >> nth=0');await pg.wait_for_timeout(100)
    ok(await pg.evaluate("document.getElementById('fx').classList.contains('on')&&document.querySelectorAll('#fx .bigCard').length>=1"),'draw reveal shown')
    await pg.screenshot(path='/tmp/shot_reveal.png')
    await pg.click('#fx');await pg.wait_for_timeout(100)
    # epidemic alert: force
    await pg.evaluate("queueFx([{kind:'epidemic',city:'c22',rate:2},{kind:'outbreak',city:'c22',color:'red',count:3}])");await pg.wait_for_timeout(300)
    while await pg.evaluate("fxCurrent&&fxCurrent.kind!=='epidemic'"):
      await pg.click('#fx');await pg.wait_for_timeout(80)
    ok(await pg.evaluate("!!document.querySelector('#fx .alert h3')&&document.querySelector('#fx .alert h3').textContent==='Epidemic'"),'epidemic alert')
    await pg.screenshot(path='/tmp/shot_epidemic.png')
    await pg.click('#fx');await pg.wait_for_timeout(150)
    ok(await pg.evaluate("document.querySelector('#fx .alert h3')?.textContent.includes('Outbreak')"),'outbreak alert')
    await pg.screenshot(path='/tmp/shot_outbreak.png')
    await pg.click('#fx');await pg.wait_for_timeout(100)
    # play through infections
    for _ in range(40):
      ph=await pg.evaluate("state.phase")
      if ph=='actions':break
      if await pg.evaluate("document.getElementById('choiceDialog').open"):await pg.click('#choiceOptions button >> nth=0');continue
      if await pg.evaluate("fullHands(state).length>0&&state.phase!=='epidemic'"):
        await pg.evaluate("(()=>{let i=fullHands(state)[0];let k=state.players[i].hand.find(k=>C[k]);perform({type:'discard',seat:i,card:k})})()");await pg.wait_for_timeout(100);continue
      await pg.evaluate("fxQueue=[];nextFx()");await pg.click('#nextPhase');await pg.wait_for_timeout(120)
    ok(await pg.evaluate("state.phase==='actions'&&state.turn===2"),'turn passed to next player')
    # events dialog for each event type renders without error
    evs=await pg.evaluate("Object.keys(EVENTS)")
    for e in evs:
      r=await pg.evaluate(f"(()=>{{try{{let box=document.createElement('div');let f=eventForm('{e}',box,0);f.args;return box.querySelectorAll('select,input,button,p,.eventText').length>0}}catch(x){{return 'ERR '+x.message}}}})()")
      ok(r is True,'event form '+e+' '+str(r))
    # play an event through UI: inject purify_water into hand via engine-friendly swap
    await pg.evaluate("""(()=>{let s=CP(state);let ev='purify_water';if(!s.eventsInGame.includes(ev)){let out=s.eventsInGame[0];s.unusedEvents.splice(s.unusedEvents.indexOf(ev),1,out);s.eventsInGame=s.eventsInGame.filter(x=>x!==out).concat(ev);for(let a of [s.playerDeck,s.discard,...s.players.map(p=>p.hand)]){let j=a.indexOf(out);if(j>=0)a[j]=ev}}for(let a of [s.playerDeck,s.discard,...s.players.map(p=>p.hand)]){let j=a.indexOf(ev);if(j>=0)a.splice(j,1)}s.players[1].hand.push(ev);invariant(s);state=s;recompute();render()})()""")
    await pg.click('.hand >> nth=1 >> text=Purify Water');await pg.wait_for_selector('#eventDialog[open]')
    await pg.select_option('#pw0','r01');await pg.select_option('#pw1','r02');await pg.click('#eventConfirm');await pg.wait_for_timeout(200)
    ok(await pg.evaluate("state.water.r01===1&&state.water.r02===1&&state.discard.includes('purify_water')"),'Purify Water event via UI')
    ok(await pg.evaluate("[...document.querySelectorAll('#pieces image')].filter(i=>i.getAttribute('href')===TOKENS.water).length===2"),'water drops drawn')
    # save / load
    env=await pg.evaluate("JSON.stringify(envelope())")
    await pg.evaluate("state=initial('other',4,['sailor','agronomist']);render()")
    await pg.evaluate(f"restore(JSON.parse({json.dumps(env)}))")
    ok(await pg.evaluate("state.players.length===4&&state.water.r01===1"),'save restore round-trip')
    await pg.screenshot(path='/tmp/shot_4p.png')
    # asset loader: synthesize file
    await pg.evaluate("""(async()=>{let c=document.createElement('canvas');c.width=c.height=64;let g=c.getContext('2d');g.fillStyle='#f0f';g.fillRect(0,0,64,64);let blob=await new Promise(r=>c.toBlob(r));let f=new File([blob],'outbreak.png',{type:'image/png'});Object.defineProperty(f,'webkitRelativePath',{value:'iberia-assets/tokens/outbreak.png'});let g2=new File([blob],'pawn_nurse.png');Object.defineProperty(g2,'webkitRelativePath',{value:'iberia-assets/pawns/pawn_nurse.png'});await loadAssets([f,g2])})()""")
    await pg.wait_for_timeout(200)
    ok(await pg.evaluate("[...document.querySelectorAll('#pieces image')].some(i=>i.getAttribute('href').startsWith('blob:'))"),'local asset replaces token')
    ok(await pg.evaluate("document.getElementById('assetStatus').textContent.startsWith('2 files')"),'asset status')
    await b.close()
asyncio.run(main())
for c,m in res:print(('PASS ' if c else 'FAIL ')+m)
print('errors:',errs[:10]);print(sum(c for c,_ in res),'/',len(res),'browser checks passed')
