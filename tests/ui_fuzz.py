"""Plays whole games on the real page by clicking whatever is clickable (random but weighted),
checking engine invariants after every step. Usage:
  python3 tests/ui_fuzz.py GAMES [SEED] [OUTFILE]
Reports: script errors, invariant failures, stuck screens, buttons covered by other things, game results."""
import asyncio,sys,json,random,time,os,pathlib
from playwright.async_api import async_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
URL=ROOT.joinpath('index.html').as_uri()
GAMES=int(sys.argv[1]) if len(sys.argv)>1 else 5
SEED=int(sys.argv[2]) if len(sys.argv)>2 else 1
OUT=sys.argv[3] if len(sys.argv)>3 else None
rnd=random.Random(SEED)
COLLECT="""(()=>{
 const vis=e=>{let r=e.getBoundingClientRect();if(r.width<3||r.height<3)return false;let s=getComputedStyle(e);if(s.visibility==='hidden'||s.display==='none'||s.pointerEvents==='none')return false;return r.bottom>0&&r.right>0&&r.left<innerWidth&&r.top<innerHeight};
 const open=id=>{let d=document.getElementById(id);return d&&d.open};
 let out=[],add=(e,k,w)=>{if(!vis(e))return;window.__c.push(e);out.push([window.__c.length-1,k,w,e.id||e.textContent.trim().slice(0,30)||e.getAttribute('class')||e.tagName])};
 window.__c=[];
 let fx=document.getElementById('fx');
 if(open('choiceDialog')){let d=document.getElementById('choiceDialog');for(let b of d.querySelectorAll('button:not(:disabled)'))add(b,'choice',3);
   if(d.classList.contains('mapPick'))document.querySelectorAll('#board .pickable,#board [data-arm],#board .edgeBuild').forEach(e=>add(e,'map',3));return out}
 if(fx&&fx.classList.contains('on')){add(fx,'fx',5);return out}
 if(open('eventDialog')){for(let b of document.querySelectorAll('#eventDialog button:not(:disabled)'))add(b,'event',2);
   document.querySelectorAll('#board .pickable,#board [data-arm],#board .edgeBuild').forEach(e=>add(e,'map',4));return out}
 for(let id of ['menu','logDialog','onlineDialog'])if(open(id))document.getElementById(id).close();
 for(let b of document.querySelectorAll('#ring button:not(:disabled),#actionButtons button:not(:disabled)'))add(b,'ring',3);
 for(let b of document.querySelectorAll('#pawnPanel button:not(:disabled)'))add(b,'panel',3);
 for(let b of document.querySelectorAll('#hands button:not(:disabled)'))add(b,'hand',1);
 for(let b of document.querySelectorAll('#preview button:not(:disabled),.previewBox button:not(:disabled),#cardPreview button:not(:disabled)'))add(b,'preview',1);
 let rt=document.getElementById('ringToggle');if(rt&&!rt.hidden)add(rt,'ringtoggle',3);
 let bg=document.getElementById('begin');if(bg&&!bg.disabled)add(bg,'begin',8);
 let np=document.getElementById('nextPhase');if(np&&!np.disabled)add(np,'next',2);
 let un=document.getElementById('undo');if(un&&!un.disabled)add(un,'undo',0.15);
 document.querySelectorAll('#board .pickable,#board [data-arm],#board .edgeBuild').forEach(e=>add(e,'map',2));
 return out})()"""
STATE="""(()=>{let r={err:null,rails:[],status:state.status,phase:state.phase,n:(commands||[]).length,act:state.actions,active:state.active,mode:mode||'',busy:!!busy,fx:!!(fxCurrent||fxQueue.length)};
 try{invariant(state)}catch(e){r.err=e.message}
 for(let k of state.rails)if(!(EDGES.get(k)&&EDGES.get(k).railway_allowed))r.rails.push(k);
 return r})()"""
async def main():
  findings={'pageerrors':{},'invariant':{},'rails':[],'stuck':[],'covered':{},'notices':{},'results':[],'steps':0}
  def note(d,k):d[k]=d.get(k,0)+1
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM') or None)
    pg=await b.new_page(viewport={'width':1440,'height':900})
    pg.on('pageerror',lambda e:note(findings['pageerrors'],str(e)[:200]))
    pg.on('console',lambda m:m.type=='error' and note(findings['pageerrors'],'console: '+m.text[:200]))
    await pg.goto(URL);await pg.wait_for_timeout(1500)
    await pg.evaluate("$('fxSpeed').value='-1';try{setSound(false)}catch(e){};window.__n=[];let on=notice;notice=function(m,e){window.__n.push(m);return on.apply(this,arguments)}")
    for g in range(GAMES):
      await pg.goto(URL);await pg.wait_for_timeout(900)
      await pg.evaluate("$('fxSpeed').value='-1';try{setSound(false)}catch(e){};window.__n=window.__n||[];let on=notice;notice=function(m,e){window.__n.push(m);return on.apply(this,arguments)}")
      n=rnd.choice([2,3,4]);roles=rnd.sample(list(json.loads(await pg.evaluate("JSON.stringify(Object.keys(ROLES))"))),n)
      await pg.evaluate("([n,roles,seed])=>{state=initial(seed,n,roles);commands=[];history=[];mode='';selectedCards=[];resetFx();recompute();render()}",[4,roles,rnd.randrange(10**6)] if False else [rnd.choice([4,5,6]),roles,rnd.randrange(10**6)])
      await pg.wait_for_timeout(200)
      await pg.evaluate("document.getElementById('begin')&&document.getElementById('begin').click()");await pg.wait_for_timeout(400)
      trace=[];last=(-1,'');idle=0;steps=0;t0=time.time()
      while steps<2500:
        steps+=1;findings['steps']+=1
        st=await pg.evaluate(STATE)
        if st['err']:note(findings['invariant'],st['err'])
        if st['rails']:findings['rails'].append(st['rails'])
        if st['status']!='playing' and st['phase'] not in ('setup',):break
        key=(st['n'],st['phase'],st['act'])
        if key==last:idle+=1
        else:idle=0;last=key
        if idle>60:
          dbg=await pg.evaluate("({ph:state.phase,st:state.status,begin:!!document.getElementById('begin')&&document.getElementById('begin').offsetParent!==null,cd:document.getElementById('choiceDialog').open,ed:document.getElementById('eventDialog').open,fx:document.getElementById('fx').className,busy:!!busy,fxc:!!fxCurrent,q:fxQueue.length,mode,pk:!!mapPick,pv:!!document.getElementById('cardPreview'),first:state.active,act:state.actions})");print('STUCK',dbg,trace[-12:],flush=True)
          await pg.screenshot(path=f'/tmp/fuzz_stuck_{SEED}_{g}.png')
          findings['stuck'].append({'game':g,'roles':roles,'phase':st['phase'],'mode':st['mode'],'shot':f'/tmp/fuzz_stuck_{SEED}_{g}.png'});break
        if idle in (25,45):
          await pg.keyboard.press('Escape');await pg.evaluate("if(document.getElementById('eventDialog').open)document.querySelector('#eventDialog .close').click()")
        cands=json.loads(json.dumps(await pg.evaluate(COLLECT)))
        if not cands:
          await pg.wait_for_timeout(60)
          continue
        if await pg.evaluate("!!document.getElementById('cardPreview')"):
          cands.append([-1,'bodyclick',12,'body'])
        w=[c[2] for c in cands];c=rnd.choices(cands,weights=w)[0]
        trace.append((c[1],c[3]))
        if c[0]<0:
          await pg.mouse.click(20,892);await pg.wait_for_timeout(25);continue
        info=await pg.evaluate("""(i)=>{let e=window.__c[i];let r=e.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;let t=document.elementFromPoint(x,y);let isHtml=e instanceof HTMLButtonElement&&!e.closest('#hands');return {x,y,covered:isHtml&&t&&!(e===t||e.contains(t)||t.contains(e)),by:t&&(t.tagName+'#'+t.id+'.'+(t.className&&t.className.baseVal===undefined?t.className:'')+' in '+(t.parentElement&&(t.parentElement.id||t.parentElement.className)))}}""",c[0])
        if info['covered']:note(findings['covered'],f"{c[3]} covered by {info['by']}")
        try:
          if info['covered']:await pg.evaluate("window.__c[%d].click()"%c[0])
          else:await pg.mouse.click(info['x'],info['y'])
        except Exception as e:
          note(findings['pageerrors'],'click: '+str(e)[:100])
        await pg.wait_for_timeout(25)
      for m in await pg.evaluate('window.__n'):note(findings['notices'],str(m)[:100])
      st=await pg.evaluate(STATE)
      findings['results'].append({'game':g,'roles':roles,'status':st['status'],'phase':st['phase'],'commands':st['n'],'steps':steps,'secs':round(time.time()-t0)})
      print(f"game {g}: {st['status']} cmds={st['n']} steps={steps} {round(time.time()-t0)}s",flush=True)
    await b.close()
  print(json.dumps({k:v for k,v in findings.items() if k!='results'},indent=1,ensure_ascii=False)[:6000])
  if OUT:json.dump(findings,open(OUT,'w'),ensure_ascii=False,indent=1)
asyncio.run(main())
