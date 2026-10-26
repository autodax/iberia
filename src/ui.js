// Iberia prototype UI v0.9
const UI_VERSION='0.9.2',$=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg',MAP_SIGNATURE=hash(JSON.stringify(MAP)).toString(16);
const SAVE_KEY='iberia-v09-save';
const RATE_POS=[622,676,728,783,835,888,940].map(x=>[x,55]);
const OUT_POS=[[1390,342],[1449,387],[1390,431],[1449,476],[1391,522],[1450,567],[1391,611],[1450,657],[1391,707]];
const RESEARCH_POS={red:[832,958],blue:[913,958],black:[973,958],yellow:[1048,958]};
const PAWN={sailor:'#2f6fb3',agronomist:'#3f8f3a',railwayman:'#8a5a2b',politician:'#6b3fa0',nurse:'#e07aa6',scientist:'#ece4cf',rural_doctor:'#e07b1a'};
const DISEASE={red:'#c0303a',blue:'#2f6fb3',yellow:'#d1a514',black:'#1d1d1d'};
const HOSP={red:'#b8333b',blue:'#2f67a8',yellow:'#d4a91c',black:'#2a2a2a'};
let state=initial('iberia-test-1',4,['sailor','agronomist']),history=[],commands=[],mode='',legal={},selectedCards=[],busy=false;
let sel={to:null,to2:'',color:'red',region:'r34',direction:'give',other:null,passenger:false,extra:'',swapTake:null};
const TYPES=['carriage','train','ship','build','treat','hospital','purify','agronomist','research','share','pgive','pswap','peek'];
const LABEL={carriage:'Carriage / boat',train:'Train',ship:'Ship',build:'Build railroad',treat:'Treat disease',hospital:'Build hospital',purify:'Purify water',agronomist:'Agronomist: water',research:'Research disease',share:'Share knowledge',pgive:'Politician: give',pswap:'Politician: swap',peek:'Scientist: look at 3'};

/* ---------- local assets ---------- */
let ASSETS={},REPO={},REPO_STATUS='Loading graphics from the GitHub repo…';
const REPO_NAME='autodax/iberia',REPO_BRANCH='main';
// Repo graphics are the default: every file under assets/ in the GitHub repo is used by name.
// Top-level files map to tokens/<name> (img0/board -> board/iberia); subfolders keep their path (pawns/pawn-nurse.png -> pawns/pawn-nurse).
function repoKey(rel){let k=norm(rel);if(!k.includes('/'))k=(k==='img0'||k==='board'||k==='iberia')?'board/iberia':'tokens/'+k;return k}
function repoBase(){return location.protocol.startsWith('http')&&/github\.io$/.test(location.hostname)?'assets/':'https://raw.githubusercontent.com/'+REPO_NAME+'/'+REPO_BRANCH+'/assets/'}
async function loadRepoAssets(){let files=null;
 try{let r=await fetch('https://api.github.com/repos/'+REPO_NAME+'/git/trees/'+REPO_BRANCH+'?recursive=1',{cache:'no-store'});if(r.ok){let j=await r.json();files=j.tree.filter(t=>t.type==='blob'&&t.path.startsWith('assets/')).map(t=>t.path.slice(7))}}catch(e){}
 if(!files)files=typeof REPO_FILES!=='undefined'?REPO_FILES:[];
 files=files.filter(f=>/\.(png|jpe?g|webp|gif|svg|wav|mp3|ogg)$/i.test(f));let base=repoBase(),found={};
 await Promise.all(files.map(f=>new Promise(res=>{let url=base+f.split('/').map(encodeURIComponent).join('/');if(/\.(wav|mp3|ogg)$/i.test(f)){found[repoKey(f)]=url;return res()}let im=new Image();im.onload=()=>{found[repoKey(f)]=url;res()};im.onerror=()=>res();im.src=url})));
 REPO=found;let n=Object.keys(found).length;REPO_STATUS=n?n+' graphics loaded from the GitHub repo ('+REPO_NAME+'/assets).':'Could not reach the GitHub repo; using the copies built into this file.';
 if(!Object.keys(ASSETS).length){$('assetStatus').textContent=REPO_STATUS;let b=asset('board/iberia');$('boardImage').setAttribute('href',b||BOARD_SRC)}render()}
const BUILTIN={water:TOKENS.water,prevention:TOKENS.prevention,infection_rate:TOKENS.infection,outbreak:TOKENS.outbreak,railroad:TOKENS.rail};
function slug(t){return String(t).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function norm(path){return path.toLowerCase().replace(/\\/g,'/').replace(/^.*?iberia-assets\//,'').replace(/\.[a-z0-9]+$/,'').replace(/_/g,'-')}
function asset(key){let k=norm(key);return ASSETS[k]||REPO[k]||(typeof EMBED!=='undefined'&&EMBED[k])||null}
const ROLE_SLUG={scientist:['scientist','royal-academy-scientist'],rural_doctor:['rural-doctor'],sailor:['sailor'],agronomist:['agronomist'],railwayman:['railwayman'],politician:['politician'],nurse:['nurse']};
function roleAsset(prefix,role){for(let s of ROLE_SLUG[role]||[role]){let a=asset(prefix+s);if(a)return a}return null}
function tokenImg(name){return asset('tokens/'+name)||BUILTIN[name.replace('purification','water')]}
async function loadAssets(files){for(let u of Object.values(ASSETS))URL.revokeObjectURL(u);ASSETS={};let n=0;for(let f of files){if(!/\.(png|jpe?g|webp|gif|svg|wav|mp3|ogg)$/i.test(f.name))continue;let p=f.webkitRelativePath||f.name;ASSETS[norm(p)]=URL.createObjectURL(f);n++}
 let b=asset('board/iberia');$('boardImage').setAttribute('href',b||BOARD_SRC);$('assetStatus').textContent=n?n+' files loaded from your folder'+(b?' (including board image).':'.'):'No local files loaded. '+REPO_STATUS;render()}
const BOARD_SRC=document.getElementById('boardImage').getAttribute('href');
function playSound(name){if(!$('sound').checked)return;let a=asset('audio/'+name);if(a){try{new Audio(a).play()}catch(e){}}}

/* ---------- helpers ---------- */
function el(tag,props={},parent){let n=Object.assign(document.createElement(tag),props);if(parent)parent.appendChild(n);return n}
function svg(tag,attrs,parent){let n=document.createElementNS(NS,tag);for(let [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(parent)parent.appendChild(n);return n}
function notice(t,error=false){$('message').textContent=t;$('message').className=error?'error':''}
function envelope(){return {app:'iberia-prototype',version:VERSION,uiVersion:UI_VERSION,mapSignature:MAP_SIGNATURE,state,commands}}
function autosave(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(envelope()))}catch(e){}}
function uniq(a){return [...new Set(a)]}
function cityItems(filter){return MAP.cities.filter(filter||(()=>true)).slice().sort((a,b)=>a.name.localeCompare(b.name)).map(c=>[c.id,c.name])}
function seatItems(filter){return state.players.map((p,i)=>[String(i),playerLabel(state,i)]).filter(([i])=>!filter||filter(+i))}
function field(label,id,items,value,onchange,parent){let l=el('label',{textContent:label},parent),s=el('select',{id},l);for(let [v,t] of items)el('option',{value:v,textContent:t},s);if(items.some(([v])=>String(v)===String(value)))s.value=value;else if(items[0])s.value=items[0][0];s.onchange=()=>onchange(s.value);return s}
function check(label,checked,onchange,parent){let l=el('label',{className:'check'},parent),c=el('input',{type:'checkbox',checked},l);el('span',{textContent:label},l);c.onchange=()=>onchange(c.checked);return c}
function pawnIcon(role,parent,size=14){let s=svg('svg',{width:size,height:size*1.5,viewBox:'-15 -42 30 45'},parent);drawPawn(s,0,0,role,null,false);return s}

/* ---------- choice / confirm dialog ---------- */
function choose(title,options,labels){return new Promise(res=>{let d=$('choiceDialog');$('choiceTitle').textContent=title;let box=$('choiceOptions');box.replaceChildren();options.forEach((o,i)=>el('button',{textContent:labels?.[i]??o,onclick:()=>{d.close();res(o)}},box));$('choiceCancel').onclick=()=>{d.close();res(null)};d.oncancel=e=>{e.preventDefault();d.close();res(null)};d.showModal()})}
async function ask(q){return (await choose(q,['yes','no'],['Yes — agreed','No']))==='yes'}

/* ---------- layout ---------- */
function fitLayout(){let W=document.documentElement.clientWidth,H=innerHeight,pad=6,gap=6,head=34,foot=16,side=W>=1600?330:W>=1200?300:W>=950?262:224;
 let hands=$('hands');hands.style.height='auto';$('playArea').style.gridTemplateRows='max-content 1fr';let est=null;
 for(let pass=0;pass<2;pass++){let handsH=est??76;let maxBoardH=Math.max(150,H-2*pad-head-foot-2*gap-handsH-gap),maxBoardW=Math.max(150,W-2*pad-side-gap);let boardW=Math.min(maxBoardW,maxBoardH*1521/1080);hands.style.width=boardW+'px';let ch=[...hands.children],nat=ch.length?ch[ch.length-1].getBoundingClientRect().bottom-ch[0].getBoundingClientRect().top:40;est=Math.min(Math.ceil(nat),Math.floor(H*0.34))}
 let handsH=est,maxBoardH=Math.max(150,H-2*pad-head-foot-2*gap-handsH-gap),maxBoardW=Math.max(150,W-2*pad-side-gap);let boardW=Math.min(maxBoardW,maxBoardH*1521/1080),boardH=boardW*1080/1521;
 let appW=2*pad+boardW+gap+side,appH=2*pad+head+foot+2*gap+handsH+gap+boardH;hands.style.width='';hands.style.height='';$('playArea').style.gridTemplateRows='';
 let s=$('app').style;for(let [k,v] of Object.entries({'--boardW':boardW,'--boardH':boardH,'--sideW':side,'--handsH':handsH,'--appW':appW,'--appH':appH}))s.setProperty(k,v+'px')}

/* ---------- legality ---------- */
function possible(cmd){try{transact(state,cmd);return true}catch(e){return !!e.needChoice}}
function canAct(){return state.status==='playing'&&state.phase==='actions'&&state.actions>0&&!fullHands(state).length}
function others(){return state.players.map((_,i)=>i).filter(i=>i!==state.active)}
function choicesFor(type){if(!canAct())return [];let p=state.players[state.active],base={type},cities=p.hand.filter(k=>C[k]);
 if(['carriage','train','build'].includes(type))return MAP.cities.map(c=>({...base,to:c.id})).filter(possible);
 if(type==='ship'){if(p.role==='sailor')return MAP.cities.map(c=>({...base,to:c.id})).filter(possible);return MAP.cities.flatMap(c=>cities.map(card=>({...base,to:c.id,card}))).filter(possible)}
 if(type==='treat')return COLORS.map(color=>({...base,color})).filter(possible);
 if(type==='hospital')return [base].filter(possible);
 if(type==='share')return others().flatMap(o=>['give','take'].map(direction=>({...base,other:o,direction,consent:true}))).filter(possible);
 if(type==='pgive')return others().map(o=>({...base,other:o,consent:true})).filter(possible);
 if(type==='pswap')return cities.flatMap(card=>state.discard.filter(k=>C[k]).map(t=>({...base,card,take:t}))).filter(possible);
 if(type==='peek')return p.role==='scientist'&&state.playerDeck.length?[{...base,order:state.playerDeck.slice(0,3)}].filter(possible):[];
 if(type==='research')return COLORS.map(color=>({...base,color,cards:cities.filter(k=>C[k].color===color).slice(0,5)})).filter(possible);
 if(type==='agronomist')return MAP.regions.map(r=>({...base,region:r.id})).filter(possible);
 if(type==='purify')return C[p.city].region_ids.flatMap(r=>cities.map(card=>({...base,region:r,card}))).filter(possible);
 return []}
function recompute(){for(let t of TYPES)legal[t]=choicesFor(t);if(mode&&!legal[mode]?.length)mode='';selectedCards=selectedCards.filter(k=>state.players[state.active].hand.includes(k))}

/* ---------- perform with choices + reveals ---------- */
async function perform(cmd){if(busy)return false;busy=true;let choices=[];try{while(true){try{let resolved={...cmd,choices},n=transact(state,resolved);history.push(CP(state));if(history.length>80)history.shift();state=n;commands.push(resolved);selectedCards=[];recompute();render();autosave();notice(state.status==='playing'?'Done.':state.status);queueFx(state.fx);return true}catch(e){if(!e.needChoice){notice(e.message,true);return false}let a=await choose(e.needChoice.description,e.needChoice.options,e.needChoice.labels);if(a===null){notice('Cancelled — nothing changed.');return false}choices.push(a)}}}finally{busy=false}}

/* ---------- reveal & alert overlay ---------- */
let fxQueue=[],fxTimer=null,fxCurrent=null;
function cardFace(k,landscape){let box=el('div',{className:'bigCard'+(landscape?' landscape':'')});let src=null;
 if(C[k])src=asset((landscape?'cards/infection/':'cards/player/')+slug(C[k].name));else if(EVENTS[k])src=asset('cards/events/'+slug(EVENTS[k]));else if(String(k).startsWith('epidemic'))src=asset('cards/epidemic');
 if(src){el('img',{src,alt:cardName(k)},box);return box}
 let color=C[k]?C[k].color:EVENTS[k]?'event':'epidemic';el('div',{className:'band '+color},box);el('div',{className:'kind',textContent:landscape?'Infection':C[k]?'City · '+C[k].color:EVENTS[k]?'Event':'Epidemic'},box);el('div',{className:'nm',textContent:cardName(k)},box);if(EVENTS[k])el('div',{className:'kind',textContent:EVENT_TEXT[k],style:'text-transform:none;letter-spacing:0;font-size:10px'},box);return box}
function queueFx(list){let speed=+$('fxSpeed').value;for(let f of list||[]){if(f.kind==='epidemic'||f.kind==='outbreak'||f.kind==='end'){fxQueue.push(f);continue}if(speed>0)fxQueue.push(f)}if(!fxCurrent)nextFx()}
function nextFx(){clearTimeout(fxTimer);let box=$('fx');box.replaceChildren();box.className='';fxCurrent=fxQueue.shift()||null;if(!fxCurrent)return;let f=fxCurrent,speed=+$('fxSpeed').value||0.6,dur=1400,b=el('div',{className:'fxBox'},box);
 if(f.kind==='playerDraw'){let row=el('div',{className:'fxRow'},b);for(let k of f.cards)row.appendChild(cardFace(k));el('div',{className:'fxCaption',textContent:state.players[f.seat].name+' draws'},b);dur=1800;playSound('card-draw')}
 else if(f.kind==='infection'){b.appendChild(cardFace(f.city,true));el('div',{className:'fxCaption',textContent:'Infect '+C[f.city].name},b);dur=1400;playSound('card-draw')}
 else if(f.kind==='research'){el('div',{className:'fxCaption',textContent:f.color[0].toUpperCase()+f.color.slice(1)+' disease researched'},b);dur=1600}
 else if(f.kind==='epidemic'){let a=el('div',{className:'alert'},b);let ban=asset('alerts/epidemic');if(ban)el('img',{className:'banner',src:ban},a);el('h3',{textContent:'Epidemic'},a);let row=el('div',{className:'fxRow',style:'justify-content:center;margin:8px 0'},a);row.appendChild(cardFace('epidemic_0'));row.appendChild(cardFace(f.city,true));el('p',{textContent:'Infection rate is now '+f.rate+'. '+C[f.city].name+' receives 3 cubes; the discard pile is shuffled onto the deck.'},a);dur=2800;playSound('epidemic')}
 else if(f.kind==='outbreak'){let a=el('div',{className:'alert outbreak'},b);let ban=asset('alerts/outbreak');if(ban)el('img',{className:'banner',src:ban},a);let h=el('h3',{},a);el('img',{className:'tok',src:tokenImg('outbreak')},h);h.append('Outbreak');el('p',{textContent:C[f.city].name+' · '+f.color+' disease'},a);el('p',{textContent:'Outbreaks: '+f.count+' / 8'},a);dur=2800;playSound('outbreak')}
 else if(f.kind==='end'){let a=el('div',{className:'alert'+(state.status==='won'?' win':'')},b);el('h3',{textContent:state.status==='won'?'Victory':'Defeat'},a);el('p',{textContent:f.text},a);dur=6000}
 el('div',{className:'fxSkip',textContent:'Click to continue'+(fxQueue.length?' · '+fxQueue.length+' more':'')},b);box.className='on';box.onclick=()=>nextFx();fxTimer=setTimeout(nextFx,dur*(f.kind==='end'?1:speed))}

/* ---------- hands ---------- */
function drawHands(){let box=$('hands'),n=state.players.length;box.replaceChildren();box.style.gridTemplateColumns='repeat('+(n<=3?n:Math.ceil(n/2))+',minmax(0,1fr))';
 state.players.forEach((p,i)=>{let h=el('div',{className:'hand'+(state.active===i&&state.phase!=='setup'?' active':'')+(p.hand.length>HAND_LIMIT?' over':'')},box);let t=el('div',{className:'handTitle'},h);pawnIcon(p.role,t,12);el('span',{textContent:p.name+' · '+roleName(p.role)+' · '+(p.city?C[p.city].name:'choose start')+' · '+p.hand.length+'/'+HAND_LIMIT,title:ROLE_TEXT[p.role]},t);
  let cards=el('div',{className:'handCards'},h);for(let k of p.hand){let b=el('button',{className:'card '+(C[k]?.color||'event')+(selectedCards.includes(k)&&i===state.active?' selected':''),textContent:cardName(k),title:C[k]?cardName(k)+' — '+C[k].color:EVENTS[k]+': '+EVENT_TEXT[k]},cards);
   if(p.hand.length>HAND_LIMIT&&!['epidemic','setup','ended'].includes(state.phase)&&!EVENTS[k]){b.textContent='✕ '+cardName(k);b.title='Discard to reach the hand limit';b.onclick=()=>perform({type:'discard',seat:i,card:k})}
   else if(EVENTS[k]){b.onclick=()=>openEvent(i,k);b.disabled=['setup','ended'].includes(state.phase)}
   else b.onclick=()=>{if(i!==state.active||!['purify','ship','research'].includes(mode))return;if(mode==='research'){if(C[k].color!==sel.color)return;selectedCards=selectedCards.includes(k)?selectedCards.filter(c=>c!==k):[...selectedCards,k]}else selectedCards=[k];render()}}
  if(p.hand.length>HAND_LIMIT&&!['epidemic','setup','ended'].includes(state.phase))el('span',{className:'detail',textContent:' Over the limit: click ✕ to discard, or play an Event.'},cards)})}

/* ---------- action panel ---------- */
function drawSetup(){let box=$('startFields');box.replaceChildren();state.players.forEach((p,i)=>{let items=p.hand.filter(k=>C[k]);let opts=(items.length?items:Object.keys(C)).map(k=>[k,C[k].name]);if(!opts.some(([v])=>v===sel['start'+i]))sel['start'+i]=opts[0][0];field(p.name+' ('+roleName(p.role)+') starts in','start'+i,opts,sel['start'+i],v=>sel['start'+i]=v,box)});let fp=$('firstPlayer'),cur=fp.value;fp.replaceChildren();state.players.forEach((p,i)=>el('option',{value:i,textContent:playerLabel(state,i)},fp));fp.value=cur&&+cur<state.players.length?cur:'0'}
function drawAction(){let box=$('actionButtons');box.replaceChildren();$('actionForm').replaceChildren();$('confirm').hidden=true;$('setupPanel').hidden=state.phase!=='setup';$('actionArea').hidden=state.phase==='setup';$('actionHeading').hidden=state.phase==='ended';$('actionHint').textContent='';
 if(state.phase==='setup'){drawSetup();return}
 for(let t of TYPES)if(legal[t]?.length)el('button',{className:'action'+(mode===t?' chosen':''),textContent:LABEL[t],onclick:()=>{mode=t;selectedCards=[];sel.to2='';sel.extra='';render()}},box);
 if(state.status!=='playing'){$('actionHint').textContent=state.status==='won'?'Victory — all four diseases researched.':'Defeat — '+state.status.replace('lost: ','');return}
 if(fullHands(state).length&&state.phase!=='epidemic'){$('actionHint').textContent='Hand limit: discard from the highlighted hand above (✕), or play an Event.';return}
 if(state.phase!=='actions'){$('actionHint').textContent=state.phase==='epidemic'?'Another Epidemic is waiting. Events may be played before it resolves.':'Infection step. Events may be played between Infection cards.';return}
 if(!TYPES.some(t=>legal[t]?.length)){$('actionHint').textContent=state.actions?'No legal actions. End actions to draw.':'No actions left. End actions to draw 2 cards.';return}
 if(!mode){$('actionHint').textContent='Choose an action. Only actions you can take right now are shown.';return}
 let options=legal[mode],p=state.players[state.active],form=$('actionForm');
 if(['carriage','train','ship','build'].includes(mode)){let ids=uniq(options.map(c=>c.to));if(!ids.includes(sel.to))sel.to=ids[0];field('Destination — or click a highlighted city','target',ids.map(k=>[k,C[k].name]),sel.to,v=>{sel.to=v;sel.to2='';render()},form);
  let carrier=mode==='ship'&&p.role==='sailor'||mode==='train'&&p.role==='railwayman';let mates=others().filter(i=>state.players[i].city===p.city);
  if(carrier&&mates.length){let items=[['','No passenger'],...mates.map(i=>[String(i),'Take '+playerLabel(state,i)])];field('Passenger','passenger',items,sel.passenger===false?'':sel.passenger,v=>sel.passenger=v===''?false:v,form)}else sel.passenger=false;
  if(mode==='build'&&p.role==='railwayman'&&!state.doubleRailUsed&&state.railSupply>=2){let next=ADJ[sel.to].filter(n=>n!==p.city&&possible({type:'build',to:sel.to,to2:n}));if(next.length){field('Railwayman: second token (once per turn)','to2',[['','No second token'],...next.map(k=>[k,C[sel.to].name+' → '+C[k].name])],sel.to2,v=>{sel.to2=v;paint()},form)}}}
 if(['treat','research'].includes(mode)){let ids=uniq(options.map(c=>c.color));if(!ids.includes(sel.color))sel.color=ids[0];field('Disease','disease',ids.map(k=>[k,k]),sel.color,v=>{sel.color=v;selectedCards=[];sel.extra='';render()},form)}
 if(mode==='treat'&&p.role==='rural_doctor'){let near=uniq([p.city,...C[p.city].region_ids.flatMap(r=>R[r].adjacent_cities)]);let after=CP(state.cubes);after[p.city][sel.color]--;let items=[['','No extra cube']];for(let c of near)for(let k of COLORS)if(after[c][k]>0)items.push([c+'|'+k,C[c].name+' · '+k+' ('+after[c][k]+')']);field('Rural Doctor: extra cube','extra',items,sel.extra,v=>sel.extra=v,form)}
 if(['purify','agronomist'].includes(mode)){let ids=uniq(options.map(c=>c.region));if(!ids.includes(sel.region))sel.region=ids[0];field('Adjacent region — or click it on the map','region',ids.map(k=>[k,k+' · water '+state.water[k]]),sel.region,v=>{sel.region=v;selectedCards=[];render()},form);el('p',{className:'detail',textContent:R[sel.region].adjacent_cities.map(k=>C[k].name).join(' · ')},form)}
 if(mode==='share'||mode==='pgive'){let ids=uniq(options.map(c=>c.other));if(!ids.includes(+sel.other))sel.other=ids[0];field('Other player','other',ids.map(i=>[String(i),playerLabel(state,i)]),sel.other,v=>{sel.other=+v;render()},form);if(mode==='share'){let dirs=options.filter(c=>c.other===+sel.other).map(c=>c.direction);if(!dirs.includes(sel.direction))sel.direction=dirs[0];field('Transfer','direction',dirs.map(k=>[k,k==='give'?'Give the '+C[p.city].name+' card':'Take the '+C[p.city].name+' card']),sel.direction,v=>sel.direction=v,form)}else el('p',{className:'detail',textContent:'Gives the '+C[p.city].name+' card to that player, wherever they are.'},form)}
 if(mode==='pswap'){let takes=uniq(options.map(c=>c.take));if(!takes.includes(sel.swapTake))sel.swapTake=takes[0];field('Take from discard pile','swapTake',takes.map(k=>[k,C[k].name+' ('+C[k].color+')']),sel.swapTake,v=>{sel.swapTake=v;selectedCards=[];render()},form);let gives=options.filter(c=>c.take===sel.swapTake).map(c=>c.card);selectedCards=selectedCards.filter(k=>gives.includes(k));if(!selectedCards.length)selectedCards=[gives[0]];let pk=el('div',{className:'cardPicker'},form);el('div',{className:'label',textContent:'Card to put in the discard pile'},pk);for(let k of gives)el('button',{className:'miniCard '+C[k].color+(selectedCards.includes(k)?' selected':''),textContent:C[k].name,onclick:()=>{selectedCards=[k];render()}},pk)}
 if(mode==='peek'){let top=state.playerDeck.slice(0,3);if(!sel.peek||sel.peek.join()!==[...sel.peek].sort().join()&&false||sel.peek.slice().sort().join()!==top.slice().sort().join())sel.peek=top.slice();el('p',{className:'detail',textContent:'Top of the Player deck (first = drawn next). Reorder, then confirm.'},form);let list=el('div',{className:'peekList'},form);sel.peek.forEach((k,i)=>{let row=el('div',{},list);el('span',{className:'miniCard '+(C[k]?.color||(EVENTS[k]?'event':'epidemic')),textContent:(i+1)+'. '+cardName(k)},row);let up=el('button',{textContent:'↑',disabled:i===0,onclick:()=>{[sel.peek[i-1],sel.peek[i]]=[sel.peek[i],sel.peek[i-1]];render()}},row);let dn=el('button',{textContent:'↓',disabled:i===sel.peek.length-1,onclick:()=>{[sel.peek[i+1],sel.peek[i]]=[sel.peek[i],sel.peek[i+1]];render()}},row)})}
 if(['purify','research'].includes(mode)||(mode==='ship'&&p.role!=='sailor')){let eligible=p.hand.filter(k=>C[k]);if(mode==='purify')eligible=eligible.filter(k=>options.some(c=>c.card===k&&c.region===sel.region));if(mode==='ship')eligible=eligible.filter(k=>C[k].color===C[sel.to].color);if(mode==='research')eligible=eligible.filter(k=>C[k].color===sel.color);selectedCards=selectedCards.filter(k=>eligible.includes(k));if(mode!=='research'&&!selectedCards.length)selectedCards=eligible.slice(0,1);if(mode==='research'&&!selectedCards.length&&eligible.length===5)selectedCards=eligible.slice();let pk=el('div',{className:'cardPicker'},form);el('div',{className:'label',textContent:mode==='research'?'Select five cards ('+selectedCards.length+'/5)':'City card to discard'},pk);for(let k of eligible)el('button',{className:'miniCard '+C[k].color+(selectedCards.includes(k)?' selected':''),textContent:C[k].name,onclick:()=>{selectedCards=mode==='research'?(selectedCards.includes(k)?selectedCards.filter(c=>c!==k):[...selectedCards,k]):[k];render()}},pk)}
 if(mode==='hospital')$('actionHint').textContent='Discard '+C[p.city].name+' to place the '+C[p.city].color+' hospital here'+(state.hospitals[C[p.city].color]?' (moves it from '+C[state.hospitals[C[p.city].color]].name+').':'.');
 if(mode==='treat'&&p.role!=='rural_doctor')$('actionHint').textContent='Remove one '+sel.color+' cube from '+C[p.city].name+'.';
 if(mode==='agronomist')$('actionHint').textContent='Place one purification token. No card required.';
 if(mode==='purify')$('actionHint').textContent='Places up to '+(p.role==='agronomist'?3:2)+' tokens ('+state.waterSupply+' left in supply).';
 $('confirm').hidden=false;$('confirm').textContent=LABEL[mode]+' · 1 action';$('confirm').disabled=mode==='research'&&selectedCards.length!==5}
async function makeCmd(){let p=state.players[state.active],cmd={type:mode};
 if(['carriage','train','ship','build'].includes(mode))cmd.to=sel.to;
 if(mode==='ship'&&p.role!=='sailor')cmd.card=selectedCards[0];
 if(mode==='build'&&sel.to2)cmd.to2=sel.to2;
 if(['treat','research'].includes(mode))cmd.color=sel.color;
 if(mode==='treat'&&sel.extra){let [city,color]=sel.extra.split('|');cmd.extra={city,color}}
 if(['purify','agronomist'].includes(mode))cmd.region=sel.region;if(mode==='purify')cmd.card=selectedCards[0];
 if(mode==='research')cmd.cards=selectedCards.slice();
 if(mode==='pswap'){cmd.card=selectedCards[0];cmd.take=sel.swapTake}
 if(mode==='peek')cmd.order=sel.peek.slice();
 if(mode==='share'||mode==='pgive'){cmd.other=+sel.other;if(mode==='share')cmd.direction=sel.direction;cmd.consent=await ask(playerLabel(state,cmd.other)+': do you agree to this card transfer?');if(!cmd.consent)return null}
 if(['ship','train'].includes(mode)&&sel.passenger!==false&&sel.passenger!==''){cmd.passenger=+sel.passenger;cmd.consent=await ask(playerLabel(state,cmd.passenger)+': do you agree to travel as a passenger?');if(!cmd.consent)return null}
 return cmd}

/* ---------- board ---------- */
function drawPawn(g,x,y,role,num,active){let col=PAWN[role]||'#888',dark=role==='scientist'?'#6b6250':'#1b1b1b';if(active)svg('ellipse',{cx:x,cy:y,rx:14,ry:5,fill:'none',stroke:'#16e0f0','stroke-width':3},g);let img=roleAsset('pawns/pawn-',role);if(img){svg('image',{href:img,x:x-15,y:y-42,width:30,height:45},g)}else{svg('ellipse',{cx:x,cy:y,rx:10,ry:3.5,fill:col,stroke:dark,'stroke-width':1.3},g);svg('path',{d:`M${x-9} ${y} C${x-8} ${y-9} ${x-5} ${y-14} ${x-4} ${y-18} L${x+4} ${y-18} C${x+5} ${y-14} ${x+8} ${y-9} ${x+9} ${y} Z`,fill:col,stroke:dark,'stroke-width':1.3},g);svg('circle',{cx:x,cy:y-24,r:6.5,fill:col,stroke:dark,'stroke-width':1.3},g)}if(num!=null){let t=svg('text',{x,y:img?y-11:y-6,'text-anchor':'middle',style:'font-size:10px;stroke-width:2.4px'},g);t.textContent=num}}
function drawHospital(g,x,y,color){let img=asset('tokens/hospital-'+color);if(img){svg('image',{href:img,x:x-15,y:y-28,width:30,height:30},g);return}let c=HOSP[color];svg('path',{d:`M${x-12} ${y} V${y-13} L${x} ${y-24} L${x+12} ${y-13} V${y} Z`,fill:c,stroke:'#111','stroke-width':1.4},g);svg('path',{d:`M${x-14} ${y-12} L${x} ${y-25} L${x+14} ${y-12}`,fill:'none',stroke:'#111','stroke-width':2.2},g);svg('rect',{x:x-3,y:y-8,width:6,height:8,fill:'#f3e6c8',stroke:'#111','stroke-width':.8},g);svg('rect',{x:x-9.5,y:y-11,width:4,height:4,fill:'#f3e6c8'},g);svg('rect',{x:x+5.5,y:y-11,width:4,height:4,fill:'#f3e6c8'},g);svg('rect',{x:x-1,y:y-21,width:2,height:7,fill:'#fff'},g);svg('rect',{x:x-3.5,y:y-18.5,width:7,height:2,fill:'#fff'},g)}
function paint(){for(let k of ['areas','tracks','pieces'])$(k).replaceChildren();let A=$('areas'),T=$('tracks'),P=$('pieces');let p=state.players[state.active];
 let regionMode=['purify','agronomist'].includes(mode)&&canAct(),targets=['carriage','train','ship','build'].includes(mode)&&canAct()?new Set((legal[mode]||[]).map(c=>c.to)):new Set();
 for(let r of MAP.regions){let active=regionMode&&r.id===sel.region,cand=regionMode&&(legal[mode]||[]).some(c=>c.region===r.id);if(active||cand||$('showRegions').checked||state.prevention===r.id){let poly=svg('polygon',{points:r.boundary_cities.map(k=>C[k].x+','+C[k].y).join(' '),fill:active?'#00edff':state.prevention===r.id?'#e04040':'#4a9aff','fill-opacity':active?.28:cand?.1:state.prevention===r.id?.1:.04,stroke:active?'#00efff':'none','stroke-width':3},A);if(cand)poly.style.cursor='pointer';poly.onclick=()=>{if(cand){sel.region=r.id;selectedCards=[];render()}}}if($('showRegions').checked){let t=svg('text',{x:r.label_position.x,y:r.label_position.y+30,'text-anchor':'middle',style:'font-size:11px'},P);t.textContent=r.id}}
 // railroads
 let railImg=tokenImg('railroad');for(let k of state.rails){let [a,b]=k.split('|'),x1=C[a].x,y1=C[a].y,x2=C[b].x,y2=C[b].y,mx=(x1+x2)/2,my=(y1+y2)/2,ang=Math.atan2(y2-y1,x2-x1)*180/Math.PI;svg('line',{x1,y1,x2,y2,stroke:'#5a3a1a','stroke-width':4,'stroke-opacity':.75},T);svg('image',{href:railImg,x:mx-22,y:my-12.5,width:44,height:25,transform:`rotate(${ang} ${mx} ${my})`},T)}
 if(mode==='build'&&sel.to2&&canAct()){let a=sel.to,b=sel.to2;svg('line',{x1:C[a].x,y1:C[a].y,x2:C[b].x,y2:C[b].y,stroke:'#16e0f0','stroke-width':4,'stroke-dasharray':'8 6'},T)}
 // water & prevention
 for(let r of MAP.regions){let {x,y}=r.label_position;if(state.water[r.id]){svg('image',{href:tokenImg('purification'),x:x-17,y:y-17,width:34,height:34},P);if(state.water[r.id]>1){svg('circle',{cx:x+15,cy:y-13,r:9,fill:'#1d4f86',stroke:'#fff','stroke-width':1.5},P);let t=svg('text',{x:x+15,y:y-9,'text-anchor':'middle',style:'font-size:11px;stroke-width:0'},P);t.textContent=state.water[r.id]}}if(state.prevention===r.id){svg('image',{href:tokenImg('prevention'),x:x-15+(state.water[r.id]?24:0),y:y-15+(state.water[r.id]?12:0),width:30,height:30},P)}}
 // tracks
 let [rx,ry]=RATE_POS[state.rateIndex];svg('image',{href:tokenImg('infection_rate'),x:rx-24,y:ry-24,width:48,height:48},P);
 let [ox,oy]=OUT_POS[Math.min(8,state.outbreaks)];svg('image',{href:tokenImg('outbreak'),x:ox-25,y:oy-25,width:50,height:50},P);
 for(let c of state.research){let [x,y]=RESEARCH_POS[c];let img=asset('tokens/research-'+c);if(img){svg('circle',{cx:x,cy:y,r:23,fill:'#f6e8cd',stroke:'#2e4339','stroke-width':2.5},P);svg('image',{href:img,x:x-17,y:y-18,width:34,height:34},P)}else{svg('circle',{cx:x,cy:y,r:17,fill:DISEASE[c],stroke:'#f6e8cd','stroke-width':3},P);let t=svg('text',{x,y:y+6,'text-anchor':'middle',style:'font-size:18px'},P);t.textContent='✓'}}
 // cities: cubes, hospitals, targets
 for(let c of MAP.cities){let present=COLORS.filter(k=>state.cubes[c.id][k]);{let cx=c.x+13;for(let k of present){let n=state.cubes[c.id][k],img=asset('tokens/cube-'+k);if(img){for(let j=0;j<n;j++)svg('image',{href:img,x:cx+j*9,y:c.y-14-(j%2)*3,width:19,height:19},P);cx+=19+(n-1)*9+3}else{svg('rect',{x:cx,y:c.y-11,width:17,height:17,rx:2,fill:DISEASE[k],stroke:'#f6e8cd','stroke-width':1.5},P);let t=svg('text',{x:cx+8.5,y:c.y+2.5,'text-anchor':'middle',style:'font-size:12px'},P);t.textContent=n;cx+=19}}}
  for(let color of COLORS)if(state.hospitals[color]===c.id)drawHospital(P,c.x-20,c.y+20,color);
  let tg=targets.has(c.id),dot=svg('circle',{cx:c.x,cy:c.y,r:15,fill:tg?'#00edff':'#fff','fill-opacity':tg?.25:0,stroke:tg?'#00efff':'transparent','stroke-width':3},P);svg('title',{},dot).textContent=c.name+(c.port?' (port)':'');if(tg){dot.style.cursor='pointer';dot.onclick=()=>{sel.to=c.id;sel.to2='';render()}}if($('showNames').checked){let t=svg('text',{x:c.x+12,y:c.y-18,style:'font-size:12px'},P);t.textContent=c.name}}
 // pawns
 let byCity={};state.players.forEach((q,i)=>{if(q.city)(byCity[q.city]=byCity[q.city]||[]).push(i)});for(let [cid,seats] of Object.entries(byCity)){let c=C[cid],n=seats.length;seats.forEach((i,j)=>{let x=c.x+(j-(n-1)/2)*20,y=c.y-4;drawPawn(P,x,y,state.players[i].role,i+1,i===state.active&&state.phase!=='setup')})}}

/* ---------- render ---------- */
function render(){let p=state.players[state.active];$('turnStatus').textContent=state.phase==='setup'?'Choose starting cities':state.status!=='playing'?(state.status==='won'?'Victory':'Defeat — '+state.status.replace('lost: ','')):'Turn '+state.turn+' · '+playerLabel(state,state.active)+' · '+state.actions+' action'+(state.actions===1?'':'s');
 $('phaseLabel').textContent=state.phase;$('footer').textContent='Player deck '+state.playerDeck.length+' · infection deck '+state.infectionDeck.length+' · Events in game: '+state.eventsInGame.map(k=>EVENTS[k]).join(', ')+' · seed '+state.seed+' · v'+UI_VERSION;
 $('outbreaks').textContent=state.outbreaks+'/8';$('rate').textContent=RATE[state.rateIndex];$('railsSupply').textContent=state.railSupply;$('waterSupply').textContent=state.waterSupply;$('cubeSupply').textContent='Cubes left — '+COLORS.map(k=>k+' '+state.supply[k]).join(' · ');$('researchStatus').textContent='Researched: '+(state.research.join(', ')||'none');
 let flags=[];if(state.goodSeason)flags.push('Good Season pending: next infection step draws 1 bottom card');if(state.phase==='infection'&&state.infectionFromBottom)flags.push('Good Season: drawing from the bottom');if(state.doubleRailUsed)flags.push('Railwayman double build used this turn');$('flags').textContent=flags.join(' · ');
 let np=$('nextPhase');np.hidden=['setup','ended'].includes(state.phase);np.disabled=fullHands(state).length>0&&state.phase!=='epidemic';np.textContent=state.phase==='actions'?'End actions & draw 2':state.phase==='epidemic'?'Resolve next Epidemic':'Infect next city · '+state.infectionRemaining+' left';
 drawAction();drawHands();paint();fitLayout()}

/* ---------- events ---------- */
function eventForm(card,box,seat,onChange){let m={},n=state.players.length,refresh=()=>{box.replaceChildren();build()};
 function build(){el('div',{className:'eventText',textContent:EVENT_TEXT[card]},box);
 if(card==='government_mobilization'){m.moves=m.moves||state.players.map(()=>({type:'',to:'',card:''}));state.players.forEach((q,i)=>{let mv=m.moves[i];let row=el('div',{className:'seatRow'},box);let types=[['','Stay'],['carriage','Carriage / boat'],['train','Train'],['ship','Ship']];field(playerLabel(state,i)+' in '+C[q.city].name,'gm_t'+i,types,mv.type,v=>{mv.type=v;mv.to='';refresh()},row);if(mv.type){let dests=MAP.cities.filter(c=>{if(c.id===q.city)return false;if(mv.type==='carriage')return EDGES.has(edgeKey(q.city,c.id));if(mv.type==='train')return railReach(state,q.city).has(c.id);return C[q.city].port&&c.port&&(q.role==='sailor'||q.hand.some(k=>C[k]?.color===c.color))}).map(c=>[c.id,c.name]);if(!dests.length)el('p',{className:'detail',textContent:'No destination by that means.'},row);else{if(!dests.some(([v])=>v===mv.to))mv.to=dests[0][0];field('Destination','gm_d'+i,dests,mv.to,v=>{mv.to=v;refresh()},row);if(mv.type==='ship'&&q.role!=='sailor'){let cs=q.hand.filter(k=>C[k]?.color===C[mv.to].color).map(k=>[k,C[k].name]);if(!cs.some(([v])=>v===mv.card))mv.card=cs[0]?.[0];field('Discard','gm_c'+i,cs,mv.card,v=>mv.card=v,box)}}}});el('p',{className:'detail',textContent:'Ruling: free means no action is spent; ship travel still needs its matching City card unless you are the Sailor.'},box)}
 if(card==='hospital_founding'){m.city=m.city||cityItems()[0][0];field('Hospital city (uses that city’s color)','ev_city',cityItems(),m.city,v=>m.city=v,box)}
 if(card==='mail_correspondence'){m.seatA=m.seatA??0;m.seatB=m.seatB??1;field('First player','mc_a',seatItems(),m.seatA,v=>{m.seatA=+v;m.cardA=null;refresh()},box);let ha=state.players[m.seatA].hand.filter(k=>!(m.seatA===seat&&k===card));if(!ha.includes(m.cardA))m.cardA=ha[0];field('Card they give','mc_ca',ha.map(k=>[k,cardName(k)]),m.cardA,v=>m.cardA=v,box);field('Second player','mc_b',seatItems(i=>i!==m.seatA),m.seatB,v=>{m.seatB=+v;m.cardB=null;refresh()},box);if(m.seatB===m.seatA){m.seatB=(m.seatA+1)%n;refresh();return}let hb=state.players[m.seatB].hand.filter(k=>!(m.seatB===seat&&k===card));if(!hb.includes(m.cardB))m.cardB=hb[0];field('Card they give','mc_cb',hb.map(k=>[k,cardName(k)]),m.cardB,v=>m.cardB=v,box)}
 if(card==='new_rails'||card==='ring_railroads'){let max=card==='new_rails'?2:3;let opts=MAP.connections.filter(e=>e.railway_allowed&&!state.rails.includes(edgeKey(e.a,e.b))&&(card==='new_rails'||C[e.a].port&&C[e.b].port)).map(e=>[edgeKey(e.a,e.b),C[e.a].name+' ↔ '+C[e.b].name]).sort((a,b)=>a[1].localeCompare(b[1]));m.routes=m.routes||[];for(let i=0;i<Math.min(max,state.railSupply);i++){field('Railroad '+(i+1),'rr'+i,[['','—'],...opts],m.routes[i]||'',v=>{m.routes[i]=v;onChange&&onChange()},box)}if(card==='ring_railroads')el('p',{className:'detail',textContent:'Only connections joining two port cities are listed.'},box)}
 if(card==='overseas_migration'||card==='science_triumph'){if(card==='science_triumph'){m.region=m.region||'r34';field('Region','st_r',MAP.regions.map(r=>[r.id,r.id+' — '+r.adjacent_cities.map(k=>C[k].name).join(', ')]),m.region,v=>{m.region=v;m.rem={};refresh()},box);m.rem=m.rem||{};let any=false;for(let c of R[m.region].adjacent_cities){let cols=COLORS.filter(k=>state.cubes[c][k]);if(!cols.length)continue;any=true;field(C[c].name,'st_'+c,[['','Leave'],...cols.map(k=>[k,'Remove 1 '+k])],m.rem[c]||'',v=>m.rem[c]=v,box)}if(!any)el('p',{className:'detail',textContent:'No cubes in that region.'},box)}else{let items=[['','—']];for(let c of MAP.cities)for(let k of COLORS)if(state.cubes[c.id][k])items.push([c.id+'|'+k,C[c.id].name+' · '+k+' ('+state.cubes[c.id][k]+')']);m.cubes=m.cubes||['',''];field('Cube 1','om1',items,m.cubes[0],v=>m.cubes[0]=v,box);field('Cube 2','om2',items,m.cubes[1],v=>m.cubes[1]=v,box)}}
 if(card==='purify_water'){let opts=[['','—'],...MAP.regions.map(r=>[r.id,r.id+' — '+r.adjacent_cities.map(k=>C[k].name).join(', ')])];m.regions=m.regions||['',''];for(let i=0;i<Math.min(2,state.waterSupply);i++)field('Token '+(i+1),'pw'+i,opts,m.regions[i],v=>m.regions[i]=v,box)}
 if(card==='second_chance'){let c=state.players[seat].city;el('p',{className:'detail',textContent:state.discard.includes(c)?'Takes '+C[c].name+' from the discard pile into '+state.players[seat].name+'’s hand.':'The '+C[c].name+' card is not in the discard pile, so this Event cannot be played now.'},box)}
 if(card==='ships_arrive'){m.city=m.city||cityItems(c=>c.port)[0][0];field('Port city','sa_c',cityItems(c=>c.port),m.city,v=>m.city=v,box);m.seats=m.seats||[];state.players.forEach((q,i)=>check('Move '+playerLabel(state,i)+' (in '+C[q.city].name+')',m.seats.includes(i),v=>{m.seats=v?[...m.seats,i]:m.seats.filter(x=>x!==i)},box))}
 if(card==='telegraph_message'){m.from=m.from??seat;m.to=m.to??(seat+1)%n;field('Giver','tm_f',seatItems(),m.from,v=>{m.from=+v;m.cards=[];if(m.to===m.from)m.to=(m.from+1)%n;refresh()},box);field('Receiver','tm_t',seatItems(i=>i!==m.from),m.to,v=>m.to=+v,box);m.cards=m.cards||[];let pk=el('div',{className:'cardPicker'},box);el('div',{className:'label',textContent:'Choose 1 or 2 City cards ('+m.cards.length+'/2)'},pk);for(let k of state.players[m.from].hand.filter(k=>C[k]))el('button',{className:'miniCard '+C[k].color+(m.cards.includes(k)?' selected':''),textContent:C[k].name,onclick:()=>{m.cards=m.cards.includes(k)?m.cards.filter(x=>x!==k):m.cards.length<2?[...m.cards,k]:m.cards;refresh()}},pk)}
 if(card==='travel_day_night'){m.seat=m.seat??seat;field('Pawn','td_s',seatItems(),m.seat,v=>{m.seat=+v;refresh()},box);let items=cityItems(c=>c.id!==state.players[m.seat].city);if(!items.some(([v])=>v===m.to))m.to=items[0][0];field('Destination','td_c',items,m.to,v=>m.to=v,box)}
 if(card==='when_plans_were_good'){let evs=state.discard.filter(k=>EVENTS[k]&&k!=='when_plans_were_good');if(!evs.length){el('p',{className:'detail',textContent:'No Event cards are in the discard pile yet.'},box);return}if(!evs.includes(m.event)){m.event=evs[0];m.inner=null}field('Event to replay from the discard pile','wp_e',evs.map(k=>[k,EVENTS[k]]),m.event,v=>{m.event=v;m.inner=null;refresh()},box);let sub=el('div',{style:'border-left:3px solid #4f8a4a;padding-left:8px;display:grid;gap:6px'},box);m.inner=m.inner||eventForm(m.event,sub,seat)}
 }
 build();
 return {card,get args(){let a={};
  if(card==='government_mobilization')a.moves=m.moves.map((mv,i)=>mv.type&&mv.to?{seat:i,type:mv.type,to:mv.to,card:mv.card}:null).filter(Boolean);
  if(card==='hospital_founding')a.city=m.city;
  if(card==='mail_correspondence')Object.assign(a,{seatA:m.seatA,cardA:m.cardA,seatB:m.seatB,cardB:m.cardB});
  if(card==='new_rails'||card==='ring_railroads')a.routes=m.routes.filter(Boolean);
  if(card==='overseas_migration')a.cubes=m.cubes.filter(Boolean).map(x=>{let [city,color]=x.split('|');return {city,color}});
  if(card==='science_triumph'){a.region=m.region;a.removals=Object.entries(m.rem).filter(([,v])=>v).map(([city,color])=>({city,color}))}
  if(card==='purify_water')a.regions=m.regions.filter(Boolean);
  if(card==='ships_arrive'){a.city=m.city;a.seats=m.seats.slice()}
  if(card==='telegraph_message')Object.assign(a,{from:m.from,to:m.to,cards:m.cards.slice()});
  if(card==='travel_day_night')Object.assign(a,{seat:m.seat,to:m.to});
  if(card==='when_plans_were_good'){a.event=m.event;a.inner=m.inner?m.inner.args:{}}
  return a},consentNeeded(a){a=a||this.args;let c=card==='when_plans_were_good'?a.event:card,x=card==='when_plans_were_good'?a.inner:a;if(c==='mail_correspondence')return 'Do '+state.players[x.seatA].name+' and '+state.players[x.seatB].name+' agree to swap these cards?';if(c==='telegraph_message')return state.players[x.to]?.name+': do you accept these cards?';if(c==='ships_arrive')return 'Do the moved players agree to travel to '+C[x.city]?.name+'?';if(c==='travel_day_night'&&x.seat!==seat)return state.players[x.seat].name+': do you agree to move to '+C[x.to]?.name+'?';return null}}}
function openEvent(seat,card){if(['setup','ended'].includes(state.phase)||busy)return;let box=$('eventForm');box.replaceChildren();$('eventTitle').textContent=state.players[seat].name+': '+EVENTS[card];let f=eventForm(card,box,seat);
 $('eventConfirm').onclick=async()=>{let args=f.args,q=f.consentNeeded(args);if(q){let ok=await ask(q);if(!ok){notice('Not agreed — Event not played.');return}if(card==='when_plans_were_good')args.inner.consent=true;else args.consent=true}$('eventDialog').close();if(!await perform({type:'event',seat,card,args}))showDialog('eventDialog')};showDialog('eventDialog')}

/* ---------- wiring ---------- */
function showDialog(id){if(!$(id).open)$(id).showModal()}
for(let id of ['menu','eventDialog','logDialog']){let d=$(id);d.querySelector('.close').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d)d.close()})}
$('confirm').onclick=async()=>{let cmd=await makeCmd();if(cmd)perform(cmd)};
$('begin').onclick=()=>perform({type:'start',cities:state.players.map((_,i)=>sel['start'+i]),first:+$('firstPlayer').value});
$('nextPhase').onclick=()=>perform({type:state.phase==='actions'?'draw':state.phase==='epidemic'?'epidemic':'infect'});
$('menuButton').onclick=()=>{drawRoleFields();showDialog('menu')};
$('logButton').onclick=()=>{let box=$('logContent');box.replaceChildren();let list=el('ol',{},box);for(let t of state.log.slice(-200))el('li',{textContent:t},list);for(let [title,cards] of [['Player discard pile',state.discard],['Infection discard pile',state.infectionDiscard],['Events in this game',state.eventsInGame]]){el('h3',{textContent:title},box);el('p',{textContent:cards.map(cardName).join(' · ')||'Empty'},box)}el('h3',{textContent:'Roles'},box);for(let q of state.players)el('p',{textContent:roleName(q.role)+': '+ROLE_TEXT[q.role]},box);showDialog('logDialog');box.parentElement.scrollTop=0};
let roleChoice=['sailor','agronomist','railwayman','politician','nurse'];
function drawRoleFields(){let n=+$('playerCount').value,box=$('roleFields');box.replaceChildren();for(let i=0;i<n;i++)field('Player '+(i+1)+' role','role'+i,Object.entries(ROLES),roleChoice[i],v=>{let j=roleChoice.indexOf(v);if(j>=0&&j!==i)roleChoice[j]=roleChoice[i];roleChoice[i]=v;drawRoleFields()},box)}
$('playerCount').onchange=drawRoleFields;
$('randomRoles').onclick=()=>{let pool=Object.keys(ROLES);for(let i=pool.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}roleChoice=pool.slice(0,5);drawRoleFields()};
$('newGame').onclick=async()=>{if(!await ask('Start a new game? Export a save first if you want to keep this one.'))return;try{let n=+$('playerCount').value;state=initial($('seed').value,+$('difficulty').value,roleChoice.slice(0,n));history=[];commands=[];mode='';selectedCards=[];recompute();render();autosave();$('menu').close();notice('Choose starting cities.')}catch(e){notice(e.message,true)}};
$('saveButton').onclick=()=>{let u=URL.createObjectURL(new Blob([JSON.stringify(envelope(),null,2)],{type:'application/json'})),a=el('a',{href:u,download:'iberia-save-v09-turn'+state.turn+'.json'});a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};
function restore(o){requireRule(o.app==='iberia-prototype'&&o.mapSignature===MAP_SIGNATURE,'Incompatible save or map');requireRule(/^0\.9\./.test(o.version||''),'This save is from v'+(o.version||'?')+'. Only v0.9 saves can be loaded; start a new game.');invariant(o.state);state=o.state;commands=Array.isArray(o.commands)?o.commands:[];history=[];mode='';fxQueue=[];nextFx();selectedCards=[];recompute();render();autosave();$('menu').close();notice('Saved game restored.')}
$('loadButton').onclick=()=>$('loadFile').click();$('loadFile').onchange=async()=>{try{restore(JSON.parse(await $('loadFile').files[0].text()))}catch(e){notice('Load failed: '+e.message,true);$('menu').close()}$('loadFile').value=''};
$('resumeButton').onclick=()=>{try{let raw=localStorage.getItem(SAVE_KEY);requireRule(raw,'No local autosave found');restore(JSON.parse(raw))}catch(e){notice(e.message,true)}};
$('undoButton').onclick=()=>{if(!history.length){notice('No undo history in this session.');return}state=history.pop();commands.pop();selectedCards=[];recompute();render();autosave();$('menu').close();notice('Debug undo — previously revealed cards cannot be forgotten.')};
$('assetButton').onclick=()=>$('assetFiles').click();$('assetFiles').onchange=()=>loadAssets([...$('assetFiles').files]);$('assetClear').onclick=()=>{loadAssets([]);$('assetStatus').textContent=REPO_STATUS};
$('showRegions').onchange=paint;$('showNames').onchange=paint;window.addEventListener('resize',fitLayout);
recompute();render();loadRepoAssets();notice('Choose starting cities, then Begin game. Menu → New game sets players and roles.');
