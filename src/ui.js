// Iberia prototype UI v0.10
const UI_VERSION='0.10.7',$=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg',MAP_SIGNATURE=hash(JSON.stringify(MAP)).toString(16);
const SAVE_KEY='iberia-v09-save';
// The board picture (assets/board.jpeg, 3910x2760) is placed into map coordinates (cities use a 1521x1080 frame)
// by the transform on #boardImage, measured by matching it to the previous board. The frame is cropped to the picture.
const BOARD_FIT=[7.9,8.3,1511.9,1066.5];
// Track and research positions measured on the current board (centres of the printed symbols).
const RATE_POS=[[623.5,59.5],[675.5,59.5],[728.5,59.5],[780.5,59.5],[832.5,59.5],[885.5,59.5],[938.5,59]];
const OUT_POS=[[1396,341],[1455.5,386.5],[1396,432.5],[1457,477.5],[1396.5,522.5],[1457.5,568.5],[1396.5,614],[1457.5,659.5],[1397.5,706.5]];
// research markers sit on the microscope silhouettes below the disease circles: [centre x, top, bottom]
const RESEARCH_POS={red:[817,994.5,1043.5],blue:[891,996.5,1043.5],black:[959,995.5,1043.5],yellow:[1030,997.5,1043.5]};
// Printed city names (and port anchors) on assets/board.jpeg: [left, top, right, bottom] relative to each city, in map units.
// Pieces are placed to keep these clear.
const LABEL_OFF={"c0":[-68,-38,20,-22],"c1":[18,-28,100,2],"c2":[-90,-16,-30,6],"c3":[18,6,78,22],"c4":[16,-22,58,-6],"c5":[-86,6,-20,24],"c6":[-100,2,-26,20],"c7":[18,-2,80,14],"c8":[20,2,88,20],"c9":[-64,-38,8,-20],"c10":[20,-2,64,18],"c11":[-60,26,30,44],"c12":[-40,-38,22,-18],"c13":[14,-24,52,-8],"c14":[-46,-40,42,-20],"c15":[-62,12,-6,46],"c16":[4,-28,188,-10],"c17":[22,-10,92,8],"c18":[-24,20,30,46],"c19":[-12,-38,38,-20],"c20":[18,-8,96,10],"c21":[16,6,54,22],"c22":[26,-6,78,10],"c23":[-16,-34,30,-18],"c24":[-56,22,6,54],"c25":[-24,-34,26,-16],"c26":[24,-16,94,2],"c27":[28,-10,120,12],"c28":[28,6,118,26],"c29":[-60,-28,-4,-10],"c30":[-80,6,-28,24],"c31":[22,6,104,28],"c32":[-120,-36,-10,-2],"c33":[24,-2,86,14],"c34":[20,-2,104,16],"c35":[20,6,110,26],"c36":[-68,-32,-16,-14],"c37":[20,-24,108,-6],"c38":[-70,-34,-6,-16],"c39":[-90,-6,-28,12],"c40":[16,0,52,18],"c41":[-62,26,10,44],"c42":[20,-2,72,14],"c43":[22,-4,86,12],"c44":[-88,6,-20,26],"c45":[0,16,78,38],"c46":[-40,24,40,44],"c47":[16,2,110,24]};
let LAYOUT=null;
function layoutBase(){if(LAYOUT)return LAYOUT;let labels=[],dots=[];for(let c of MAP.cities){let o=LABEL_OFF[c.id];if(o)labels.push([c.x+o[0]-2,c.y+o[1]-2,c.x+o[2]+2,c.y+o[3]+2]);dots.push([c.x-14,c.y-14,c.x+14,c.y+14,c.id])}return LAYOUT={labels,dots,cache:{}}}
function ovl(a,b){let w=Math.min(a[2],b[2])-Math.max(a[0],b[0]),h=Math.min(a[3],b[3])-Math.max(a[1],b[1]);return w>0&&h>0?w*h:0}
function hit(r,list){let s=0;for(let b of list)s+=ovl(r,b);return s}
// choose the first candidate rectangle that covers the least printed text, then other cities, then other pieces
function pick(cands,w,h,extra=[],own=null){let L=layoutBase(),best=null;cands.forEach(([x,y],i)=>{let r=[x,y,x+w,y+h],score=hit(r,L.labels)*6+hit(r,L.dots.filter(d=>d[4]!==own))*3+hit(r,extra)*2+i*3;if(!best||score<best.s)best={x,y,s:score}});return best}
function cubeWidth(cid,view){let w=0;for(let k of COLORS){let n=view[cid][k];if(n)w+=19+(n-1)*9+3}return Math.max(0,w-3)}
function cubeOrigin(cid,view){let c=C[cid],W=cubeWidth(cid,view),np=pawnsAt(cid),key=cid+':'+W+':'+np,L=layoutBase();if(L.cache[key])return L.cache[key];let pr=np?[pawnSpot(cid,np).r]:[];
 let x=c.x,y=c.y,H=22,cands=[[x+13,y-17],[x-13-W,y-17],[x-W/2,y+14],[x+9,y+10],[x-9-W,y+10],[x+13,y-30],[x-13-W,y-30],[x-W/2,y-62],[x+13,y+28],[x-13-W,y+28],[x-W/2,y+34]];
 let b=pick(cands,W,H,pr,cid);return L.cache[key]=[b.x,b.y]}
function hospitalOrigin(cid,n,extra){let c=C[cid],x=c.x,y=c.y,W=30*n,H=30;let cands=[[x-35,y-8],[x+5,y-8],[x-W/2,y+12],[x-14-W,y-15],[x+14,y-15],[x-35,y-48],[x+5,y-48],[x-W/2,y+30]];let b=pick(cands,W,H,extra,cid);return [b.x,b.y]}
function pawnSpot(cid,n){let L=layoutBase(),key='p:'+cid+':'+n;if(L.cache[key])return L.cache[key];let c=C[cid],W=20*(n-1)+30,best=null;
 for(let dy of [0,12,22])for(let dx of [0,10,-10,18,-18]){let r=[c.x+dx-W/2,c.y-4+dy-42,c.x+dx+W/2,c.y-4+dy+3],s=hit(r,L.labels)*6+hit(r,L.dots.filter(d=>d[4]!==cid))*3+Math.abs(dx)*8+dy*5;if(!best||s<best.s)best={dx,dy,s,r}}return L.cache[key]=best}
function pawnsAt(cid){return state.players.filter(q=>q.city===cid&&!q.city2).length}
function regionCenter(r){let pts=r.boundary_cities.map(k=>[C[k].x,C[k].y]),A=0,cx=0,cy=0;for(let i=0;i<pts.length;i++){let [x1,y1]=pts[i],[x2,y2]=pts[(i+1)%pts.length],f=x1*y2-x2*y1;A+=f;cx+=(x1+x2)*f;cy+=(y1+y2)*f}if(Math.abs(A)<1e-6)return [pts.reduce((a,q)=>a+q[0],0)/pts.length,pts.reduce((a,q)=>a+q[1],0)/pts.length];return [cx/(3*A),cy/(3*A)]}
function tokenSpot(x,y,w,h,extra){let cands=[[0,0]];for(let r of [14,26,38,50])for(let a=0;a<8;a++)cands.push([Math.round(r*Math.cos(a*Math.PI/4)),Math.round(r*Math.sin(a*Math.PI/4))]);let b=pick(cands.map(([dx,dy])=>[x+dx-w/2,y+dy-h/2]),w,h,extra);return [b.x+w/2,b.y+h/2]}
// Some printed connections are curved on the board picture: CURVE gives how far (in map pixels) each bulges at its middle.
const CURVE={'c27|c25':-14,'c28|c27':-11,'c31|c28':-14,'c37|c22':16,'c35|c46':29,'c45|c47':19,'c12|c14':24,'c15|c16':-6,'c31|c32':-6,'c24|c25':15};
function curveH(p,q){let h=CURVE[p+'|'+q];if(h!=null)return h;h=CURVE[q+'|'+p];return h==null?0:-h}
function edgeCtrl(p,q){let A=C[p],B=C[q],d=Math.hypot(B.x-A.x,B.y-A.y)||1,h=curveH(p,q);return [(A.x+B.x)/2-(B.y-A.y)/d*2*h,(A.y+B.y)/2+(B.x-A.x)/d*2*h]}
function edgePt(p,q,u){let A=C[p],B=C[q],[cx,cy]=edgeCtrl(p,q),a=(1-u)*(1-u),b=2*(1-u)*u,c=u*u;return [a*A.x+b*cx+c*B.x,a*A.y+b*cy+c*B.y]}
function edgeD(p,q){let A=C[p],B=C[q];if(!curveH(p,q))return `M${A.x} ${A.y} L${B.x} ${B.y}`;let [cx,cy]=edgeCtrl(p,q);return `M${A.x} ${A.y} Q${cx} ${cy} ${B.x} ${B.y}`}
// The railroad token and the Civil Engineer sit in the middle of the line, turned along it.
function railSpot(p,q){let [x,y]=edgePt(p,q,.5),[x2,y2]=edgePt(p,q,.52),[x1,y1]=edgePt(p,q,.48);return [x,y,Math.atan2(y2-y1,x2-x1)*180/Math.PI]}
const FOUNDED={c0:1208,c1:850,c2:-150,c3:-25,c4:-16,c5:-136,c6:-250,c7:-45,c8:-34,c9:-1000,c10:-59,c11:750,c12:-500,c13:-29,c14:-26,c15:1300,c16:1180,c17:-74,c18:1181,c19:884,c20:1072,c21:-133,c22:871,c23:-350,c24:1278,c25:-79,c26:-24,c27:-15,c28:-450,c29:1171,c30:784,c31:-138,c32:-123,c33:1100,c34:-324,c35:-227,c36:-300,c37:1255,c38:875,c39:-169,c40:-231,c41:-950,c42:-850,c43:-550,c44:-1104,c45:-750,c46:995,c47:1160};
function fmtYear(y){return y<0?'–'+(-y):String(y)}
function oldestCard(p){let cs=p.hand.filter(k=>C[k]);if(!cs.length)return null;return cs.reduce((a,b)=>FOUNDED[b]<FOUNDED[a]?b:a)}
function suggestFirst(){let best=null;state.players.forEach((p,i)=>{let k=oldestCard(p);if(k&&(best===null||FOUNDED[k]<best.y))best={i,k,y:FOUNDED[k]}});return best}
const PAWN={sailor:'#2f6fb3',agronomist:'#3f8f3a',railwayman:'#8a5a2b',politician:'#6b3fa0',nurse:'#e07aa6',scientist:'#ece4cf',rural_doctor:'#e07b1a',civil_engineer:'#2c3340',palliative_nurse:'#d9dde3',student:'#c0489a',time_traveler:'#2fa37a',professor:'#e6c229'};
// Where each printed city circle really sits relative to its map coordinates (measured on assets/board.jpeg), so move markers sit on the circles
const MARK={"c0":[-4.1,1.0],"c1":[0.6,0.6],"c2":[-2.5,1.4],"c3":[0.6,2.5],"c4":[1.4,1.4],"c5":[0.2,2.5],"c6":[0.2,2.9],"c7":[1.7,3.3],"c8":[2.9,0.2],"c9":[-0.2,0.8],"c10":[-0.2,0.8],"c11":[-1.4,1.4],"c12":[-0.2,0.8],"c13":[-0.2,0.8],"c14":[-0.2,0.8],"c15":[-2.1,1.0],"c16":[-0.2,0.8],"c17":[-0.2,0.8],"c18":[1.7,-0.6],"c19":[-0.2,0.8],"c20":[-0.2,0.8],"c21":[-1.4,-0.2],"c22":[-0.2,0.8],"c23":[-0.6,-0.6],"c24":[-0.6,2.1],"c25":[-1.0,1.4],"c26":[-0.2,-1.0],"c27":[-0.6,-0.2],"c28":[-0.2,0.8],"c29":[-0.2,0.8],"c30":[-1.0,-1.4],"c31":[-1.0,1.7],"c32":[-1.0,-0.2],"c33":[-0.2,1.7],"c34":[-1.4,1.4],"c35":[1.0,-0.6],"c36":[0.2,1.7],"c37":[-1.0,1.0],"c38":[1.7,0.2],"c39":[0.6,0.6],"c40":[-2.5,-0.2],"c41":[-0.6,1.4],"c42":[1.0,-0.2],"c43":[1.7,-1.0],"c44":[1.4,1.7],"c45":[0.2,-1.7],"c46":[1.0,-2.1],"c47":[-2.1,-1.4]};
const DISEASE={red:'#b0262a',blue:'#3059c8',yellow:'#f0bf0a',black:'#2a2828'};
const HOSP={red:'#b0262a',blue:'#3059c8',yellow:'#f0bf0a',black:'#2a2828'};
const REVEALS=new Set(['start','pick','draw','infect','epidemic','peek','ttswap','profdraw']);
function newSeed(){let a=new Uint32Array(2);try{crypto.getRandomValues(a)}catch(e){a[0]=Math.random()*2**32;a[1]=Date.now()}return a[0].toString(36)+a[1].toString(36).slice(0,3)}
function randRoles(){let pool=Object.keys(ROLES);for(let i=pool.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}return pool.slice(0,5)}
let holdActive=null;
function shownActive(){return holdActive!=null?holdActive:state.active}
function releaseHold(){if(holdActive==null)return;if(fxCurrent||fxQueue.length||flyTimer){setTimeout(releaseHold,200);return}setTimeout(()=>{if(fxCurrent||fxQueue.length||flyTimer)return releaseHold();holdActive=null;render();flashActive()},1500)}
let state=initial(newSeed(),4,randRoles().slice(0,2)),history=[],commands=[],mode='',legal={},selectedCards=[],busy=false;
let sel={to:null,to2:'',color:'red',region:'r34',direction:'give',other:null,passenger:false,extra:'',swapTake:null};
const TYPES=['carriage','train','ship','build','treat','hospital','purify','agronomist','research','share','pgive','pswap','peek','attract','htreat','ttswap','profdraw','stbuild','stwater','sttreat'];
const FREEA=new Set(['stbuild','stwater','sttreat']);
const LABEL={carriage:'Carriage / boat',train:'Train',ship:'Ship',build:'Build railroad',treat:'Treat disease',hospital:'Build hospital',purify:'Purify water',agronomist:'Agronomist: water',research:'Research disease',share:'Share knowledge',pgive:'Politician: give',pswap:'Politician: swap',peek:'Scientist: look at 3',attract:'Attract cubes',htreat:'Treat all at hospital',ttswap:'Look & swap Infection card',profdraw:'Draw an Event card',stbuild:'Place held railroad',stwater:'Place held purification',sttreat:'Treat with held cube'};

/* ---------- local assets ---------- */
let ASSETS={},REPO={},REPO_STATUS='Loading graphics from the GitHub repo…';
const REPO_NAME='autodax/iberia',REPO_BRANCH='main';
// Repo graphics are the default: every file under assets/ in the GitHub repo is used by name.
// Top-level files map to tokens/<name> (board -> board/iberia); subfolders keep their path (pawns/pawn-nurse.png -> pawns/pawn-nurse).
function repoKey(rel){let k=norm(rel);if(!k.includes('/'))k=(k==='board'||k==='iberia')?'board/iberia':'tokens/'+k;return k}
function repoBase(){return location.protocol.startsWith('http')&&/github\.io$/.test(location.hostname)?'assets/':'https://raw.githubusercontent.com/'+REPO_NAME+'/'+REPO_BRANCH+'/assets/'}
async function loadRepoAssets(){let files=null;
 try{let r=await fetch('https://api.github.com/repos/'+REPO_NAME+'/git/trees/'+REPO_BRANCH+'?recursive=1',{cache:'no-store'});if(r.ok){let j=await r.json();files=j.tree.filter(t=>t.type==='blob'&&t.path.startsWith('assets/')).map(t=>t.path.slice(7))}}catch(e){}
 if(!files)files=typeof REPO_FILES!=='undefined'?REPO_FILES:[];
 files=files.filter(f=>/\.(png|jpe?g|webp|gif|svg|wav|mp3|ogg)$/i.test(f));let base=repoBase(),found={};
 const LAZY=/^(city_cards|infection_cards|event_cards|role_cards)\/|(^|\/)(city_back|infection_back|role_back|actions_card|epidemia_card)\./i;   // big card pictures load only when a card is shown
 await Promise.all(files.map(f=>new Promise(res=>{let url=base+f.split('/').map(encodeURIComponent).join('/');if(/\.(wav|mp3|ogg)$/i.test(f)||LAZY.test(f)){found[repoKey(f)]=url;return res()}let im=new Image();im.onload=()=>{found[repoKey(f)]=url;res()};im.onerror=()=>res();im.src=url})));
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
/* ---------- sounds (assets/sounds/*.mp3; a local folder or the repo can replace them) ---------- */
const SND_VOL={blocked:.9,move:.95,draw:.9,cube:.95,outbreak:1,epidemic:1,win:.95,lose:.95,turn:.9,water:.95,choo:1},SND_BOOST=2,SND_KEY='iberia-sound';
let sndCtx=null,sndBuf={},sndLast={},sndPrefs={on:false,vol:.7};try{Object.assign(sndPrefs,JSON.parse(localStorage.getItem(SND_KEY)||'{}'))}catch(e){}
const SND_REV='6';
function soundUrls(name){let out=[];for(let k of ['sounds/'+name,'audio/'+name,'tokens/'+name]){k=norm(k);for(let src of [ASSETS,REPO,typeof EMBED!=='undefined'?EMBED:{}]){let u=src[k];if(u&&src===REPO&&/^https?:|^assets\//.test(u))u+='?r='+SND_REV;if(u&&!out.includes(u))out.push(u)}}return out}
function soundUrl(name){return soundUrls(name)[0]||null}
function saveSound(){try{localStorage.setItem(SND_KEY,JSON.stringify(sndPrefs))}catch(e){}}
function syncSoundUI(){let b=$('muteButton');if(b){b.classList.toggle('off',!sndPrefs.on);b.title=sndPrefs.on?'Sound on (click to mute)':'Sound off (click to turn on)';b.setAttribute('aria-pressed',String(sndPrefs.on))}if($('sound'))$('sound').checked=sndPrefs.on;if($('volume'))$('volume').value=Math.round(sndPrefs.vol*100)}
function setSound(on){sndPrefs.on=on;saveSound();syncSoundUI();saveSettings();if(on){unlockSound();playSound('cube')}}
let sndKeep=null;
// iPad/iPhone: the ringer switch mutes Web Audio unless the page is also "playing media", so loop a silent clip
function keepAudioAlive(){try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}try{if(!sndKeep){sndKeep=new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQIAAAAAAA==');sndKeep.loop=true;sndKeep.volume=.01;sndKeep.setAttribute('playsinline','')}if(sndKeep.paused)sndKeep.play().catch(()=>{})}catch(e){}}
function unlockSound(){keepAudioAlive();try{if(!sndCtx){let A=window.AudioContext||window.webkitAudioContext;if(A){sndCtx=new A();setTimeout(preloadSounds,400)}}if(sndCtx&&sndCtx.state!=='running'){sndCtx.resume();if(!sndCtx.iosKick){sndCtx.iosKick=true;let b=sndCtx.createBuffer(1,1,22050),n=sndCtx.createBufferSource();n.buffer=b;n.connect(sndCtx.destination);n.start(0)}}}catch(e){}}
// iPad/iPhone only allow sound after a tap: any tap re-opens it if sound is switched on
for(let ev of ['pointerdown','touchend','click','keydown'])document.addEventListener(ev,()=>{if(sndPrefs.on)unlockSound()},{passive:true,capture:true});
function decodeUrl(url){if(!sndCtx)return Promise.resolve(null);if(!sndBuf[url])sndBuf[url]=fetch(url).then(r=>{if(!r.ok)throw 0;return r.arrayBuffer()}).then(a=>new Promise((ok,no)=>sndCtx.decodeAudioData(a,ok,no))).catch(()=>null).then(b=>{if(!b)delete sndBuf[url];return b});return sndBuf[url]}   // a failed load is never remembered, so a sound cannot disappear for good
// try the local folder, then the repo, then the built-in copy
async function soundBuffer(name){if(!sndCtx)return null;for(let u of soundUrls(name)){let b=await decodeUrl(u);if(b)return b}return null}
function soundBeep(url,vol,delay){setTimeout(()=>{try{let a=new Audio(url);a.volume=Math.min(1,vol);a.play().catch(()=>{})}catch(e){}},delay)}
let sndMaster=null;
function masterOut(){if(!sndMaster||sndMaster.ctx!==sndCtx){sndMaster=sndCtx.createDynamicsCompressor();sndMaster.ctx=sndCtx;sndMaster.threshold.value=-8;sndMaster.ratio.value=6;sndMaster.connect(sndCtx.destination)}return sndMaster}
function preloadSounds(){if(!sndCtx||sndCtx.state!=='running')return;for(let n of Object.keys(SND_VOL))for(let u of soundUrls(n)){decodeUrl(u);break}}
function playSound(name,delay=0){if(!sndPrefs.on)return;let url=soundUrl(name);if(!url)return;let now=performance.now()+delay;if(sndLast[name]&&Math.abs(now-sndLast[name])<45)return;sndLast[name]=now;
 let vol=sndPrefs.vol*(SND_VOL[name]??.9);(window.soundLog=window.soundLog||[]).push(name);unlockSound();
 let viaBuffer=()=>soundBuffer(name).then(b=>{if(!b||!sndCtx||sndCtx.state!=='running'){soundBeep(url,vol,0);return}let s=sndCtx.createBufferSource(),g=sndCtx.createGain();s.buffer=b;s.playbackRate.value=name==='cube'?0.94+Math.random()*.12:1;g.gain.value=vol*SND_BOOST;s.connect(g).connect(masterOut());s.start(sndCtx.currentTime+Math.max(0,delay)/1000)});
 if(!sndCtx){soundBeep(url,vol,delay);return}
 // Safari suspends the audio engine when idle or after a tab switch: wake it first, and fall back to a plain audio element if it will not wake
 if(sndCtx.state!=='running'){Promise.race([Promise.resolve(sndCtx.resume()).catch(()=>{}),new Promise(r=>setTimeout(r,350))]).then(()=>{if(sndCtx.state==='running')viaBuffer();else soundBeep(url,vol,0)});return}
 viaBuffer()}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&sndPrefs.on){unlockSound();setTimeout(preloadSounds,300)}});

/* ---------- helpers ---------- */
function el(tag,props={},parent){let n=Object.assign(document.createElement(tag),props);if(parent)parent.appendChild(n);return n}
function svg(tag,attrs,parent){let n=document.createElementNS(NS,tag);for(let [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(parent)parent.appendChild(n);return n}
function notice(t,error=false){$('message').textContent=t;$('message').className=error?'error':''}
// Menu settings travel with the save (and with the autosave), and are also remembered between visits.
const SET_KEY='iberia-settings';
function getSettings(){return {fxSpeed:$('fxSpeed').value,showRegions:$('showRegions').checked,showNames:$('showNames').checked,sound:sndPrefs.on,volume:sndPrefs.vol}}
function applySettings(o,withSound){if(!o||typeof o!=='object')return;if(o.fxSpeed!=null&&[...$('fxSpeed').options].some(x=>x.value===String(o.fxSpeed)))$('fxSpeed').value=String(o.fxSpeed);if(typeof o.showRegions==='boolean')$('showRegions').checked=o.showRegions;if(typeof o.showNames==='boolean')$('showNames').checked=o.showNames;
 if(!withSound)return;if(typeof o.volume==='number'&&o.volume>=0&&o.volume<=1)sndPrefs.vol=o.volume;if(typeof o.sound==='boolean')sndPrefs.on=o.sound;saveSound();syncSoundUI()}
function saveSettings(){try{localStorage.setItem(SET_KEY,JSON.stringify(getSettings()))}catch(e){}if(typeof autosave==='function'&&state)autosave()}
function envelope(){return {app:'iberia-prototype',version:VERSION,uiVersion:UI_VERSION,mapSignature:MAP_SIGNATURE,settings:getSettings(),state,commands}}
function autosave(){if(typeof Net!=='undefined'&&Net.active)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(envelope()))}catch(e){}}
function uniq(a){return [...new Set(a)]}
function cubeTotal(k){return COLORS.reduce((a,c)=>a+(state.cubes[k]?.[c]||0),0)}
function byCubes(ids){return ids.map((k,i)=>[k,i]).sort((a,b)=>cubeTotal(b[0])-cubeTotal(a[0])||a[1]-b[1]).map(x=>x[0])}
function cubeNote(k){let n=cubeTotal(k);return n?' · '+n+' cube'+(n>1?'s':''):''}
function cityItems(filter){return MAP.cities.filter(filter||(()=>true)).slice().sort((a,b)=>a.name.localeCompare(b.name)).map(c=>[c.id,c.name])}
function seatItems(filter){return state.players.map((p,i)=>[String(i),plabel(i)]).filter(([i])=>!filter||filter(+i))}
// Choices are shown as buttons. A hidden select keeps the value (and the id) for code that reads it.
function cubeIcons(k,n,parent){let src=asset('tokens/cube-'+k);for(let j=0;j<n;j++){if(src)el('img',{src,alt:k,className:'cube-'+k+' chipCube'},parent);else el('i',{className:'chipCube dot',style:'background:'+DISEASE[k]},parent)}}
function decorateChip(b,id,v,t){if(id==='disease'&&COLORS.includes(v)){let q=state.players[state.active],n=mode==='treat'&&q.city?(state.cubes[q.city][v]||1):1;b.textContent='';b.title=v;b.setAttribute('aria-label',v);let w=el('span',{className:'chipCubes'},b);cubeIcons(v,n,w);return}
 if(C[v]&&t.startsWith(C[v].name)){b.textContent=C[v].name;let w=el('span',{className:'chipCubes'},b);for(let k of COLORS)cubeIcons(k,state.cubes[v][k]||0,w);return}
 if(String(v).includes('|')&&COLORS.includes(String(v).split('|')[1])&&C[String(v).split('|')[0]]){let [c,k]=v.split('|'),m=/\((\d+)\)/.exec(t);b.textContent=C[c].name;let w=el('span',{className:'chipCubes'},b);cubeIcons(k,m?+m[1]:1,w);return}
 if(/^st_/.test(id)&&COLORS.includes(v)){b.textContent='Remove';b.title='Remove 1 '+v+' cube';let w=el('span',{className:'chipCubes'},b);cubeIcons(v,1,w)}}
function field(label,id,items,value,onchange,parent,opt={}){let l=el('div',{className:'field'},parent);el('div',{className:'label',textContent:label},l);let s=el('select',{id,hidden:true},l);if(opt.blank)el('option',{value:'',textContent:''},s);for(let [v,t] of items)el('option',{value:v,textContent:t},s);if(items.some(([v])=>String(v)===String(value)))s.value=value;else if(opt.blank)s.value='';else if(items[0])s.value=items[0][0];
 let g=el('div',{className:'choiceGroup'+(items.length>10?' many':'')},l);g.dataset.for=id;let sync=()=>{for(let b of g.children)b.classList.toggle('on',b.dataset.v===s.value)};
 for(let [v,t] of items){let b=el('button',{type:'button',className:'chip'+(C[v]?' city '+C[v].color:''),textContent:t},g);b.dataset.v=String(v);decorateChip(b,id,v,t);b.onclick=()=>{s.value=String(v);sync();onchange(s.value);if(opt.go)autoGo()}}
 sync();s.onchange=()=>{sync();onchange(s.value)};requestAnimationFrame(()=>{let on=g.querySelector('.on');if(on&&g.scrollHeight>g.clientHeight)on.scrollIntoView({block:'nearest'})});return s}
// turn a fixed select (in the page) into buttons; the select stays hidden and holds the value
function buttonize(s){s.hidden=true;let g=s.nextElementSibling;if(!g||!g.classList.contains('choiceGroup')){g=document.createElement('div');g.className='choiceGroup';s.after(g)}g.replaceChildren();g.dataset.for=s.id;
 for(let o of s.options){let b=el('button',{type:'button',className:'chip',textContent:o.textContent},g);b.dataset.v=o.value;b.onclick=e=>{e.preventDefault();s.value=o.value;syncChips();s.dispatchEvent(new Event('change'))}}syncChips()}
function syncChips(){for(let g of document.querySelectorAll('.choiceGroup[data-for]')){let s=document.getElementById(g.dataset.for);if(s)for(let b of g.children)b.classList.toggle('on',b.dataset.v===s.value)}}
// fewer clicks: once nothing is left to choose, the action happens straight away (Undo is available)
function readyToGo(){if(!mode||!canAct()||busy)return false;let p=state.players[state.active],o=legal[mode]||[];if(!o.length)return false;
 let mates=others().some(i=>state.players[i].city===p.city),carrier=(mode==='ship'&&p.role==='sailor'||mode==='train'&&p.role==='railwayman')&&mates;
 if(['attract','htreat','ttswap','profdraw'].includes(mode))return true;
 if(['carriage','train','ship','build','stbuild'].includes(mode)){if(!sel.to||!o.some(c=>c.to===sel.to))return false;if(carrier&&sel.passenger===undefined)return false;
  if(mode==='build'&&p.role==='railwayman'&&!state.doubleRailUsed&&state.railSupply>=2&&!sel.to2Chosen&&ADJ[sel.to].some(n=>n!==p.city&&possible({type:'build',to:sel.to,to2:n})))return false;
  if(mode==='ship'&&p.role!=='sailor')return o.filter(c=>c.to===sel.to).length===1;return true}
 if(mode==='sttreat')return true;
 if(mode==='treat')return p.role!=='rural_doctor'||sel.extraChosen;
 if(mode==='purify')return o.filter(c=>c.region===sel.region).length===1;
 if(mode==='agronomist'||mode==='stwater')return !!sel.region;
 if(mode==='hospital'||mode==='pgive')return o.length===1||sel.otherChosen;
 if(mode==='share')return o.filter(c=>c.other===+sel.other).length===1||sel.dirChosen;
 if(mode==='pswap')return o.filter(c=>c.take===sel.swapTake).length===1;
 if(mode==='research')return p.hand.filter(k=>C[k]&&C[k].color===sel.color).length===5;
 return false}
async function treatCube(k){if(!canAct()||busy||cubeView||mapPick)return;let p=state.players[state.active],c=(legal.treat||[]).find(x=>x.color===k);if(!c)return;if(p.role==='rural_doctor'){mode='treat';sel.color=k;sel.extra='';sel.extraChosen=false;selectedCards=[];render();return}await perform({...c})}
async function goNow(){if(!mode||!canAct()||busy)return;let cmd=await makeCmd();if(cmd)perform(cmd)}
async function autoGo(){if(!readyToGo())return;let cmd=await makeCmd();if(cmd)perform(cmd)}
function check(label,checked,onchange,parent){let l=el('label',{className:'check'},parent),c=el('input',{type:'checkbox',checked},l);el('span',{textContent:label},l);c.onchange=()=>onchange(c.checked);return c}
function pawnIcon(role,parent,size=14){let s=svg('svg',{width:size,height:size*1.5,viewBox:'-15 -42 30 45'},parent);drawPawn(s,0,0,role,null,false);return s}

/* ---------- choice / confirm dialog ---------- */
let mapPick=null;
// with no action chosen, clicking a reachable city moves there: carriage/boat at once (undoable); train or ship opens that action
function quickMoves(){let m=new Map();if(mode||!canAct()||state.phase!=='actions')return m;for(let [t,label] of [['carriage','move here by carriage or boat (1 action)'],['train','move here by train'],['ship','move here by ship']])for(let c of legal[t]||[])if(c.to&&!m.has(c.to))m.set(c.to,{type:t,label});return m}
async function quickMove(to){let q=quickMoves().get(to);if(!q)return;if(q.type==='carriage'){let c=(legal.carriage||[]).find(x=>x.to===to);await perform({...c});return}mode=q.type;sel.to=to;sel.to2='';delete sel.passenger;selectedCards=[];render();autoGo()}
let chooseQueue=Promise.resolve();
function choose(title,options,labels){let p=chooseQueue.then(()=>chooseNow(title,options,labels));chooseQueue=p.catch(()=>{});return p}
function chooseNow(title,options,labels){return new Promise(res=>{let d=$('choiceDialog');$('choiceTitle').textContent=title;let box=$('choiceOptions');box.replaceChildren();
 let kind=options.length&&options.every(o=>typeof o==='string'&&R[o])?'region':options.length&&options.every(o=>typeof o==='string'&&C[o])?'city':null;
 let finish=v=>{d.close();d.classList.remove('mapPick');if(mapPick){mapPick=null;paint()}res(v)};
 box.classList.toggle('mapOnly',!!kind&&options.length>8);
 options.forEach((o,i)=>{let b=el('button',{textContent:labels?.[i]??o,onclick:()=>finish(o)},box);if(kind){b.onmouseenter=()=>{if(mapPick){mapPick.hover=o;paint()}};b.onmouseleave=()=>{if(mapPick){mapPick.hover=null;paint()}}}});
 $('choiceCancel').onclick=()=>finish(null);d.oncancel=e=>{e.preventDefault();finish(null)};
 if(kind){mapPick={kind,options:new Set(options),pick:finish,hover:null};d.classList.add('mapPick');el('p',{className:'mapHint',textContent:'Or click a highlighted '+(kind==='region'?'region':'city')+' on the map.'},box);d.show();paint()}else d.showModal()})}
async function ask(q){return (await choose(q,['yes','no'],['Yes — agreed','No']))==='yes'}

/* ---------- layout ---------- */
function fitLayout(){let W=document.documentElement.clientWidth,H=innerHeight,pad=6,gap=6,head=34,foot=16,minSide=W>=1600?380:W>=1200?330:290,maxSide=560;
 let boardH=Math.max(200,H-2*pad-head-foot-2*gap),boardW=boardH*BOARD_FIT[2]/BOARD_FIT[3];
 if(boardW>W-2*pad-gap-minSide){boardW=Math.max(300,W-2*pad-gap-minSide);boardH=boardW*BOARD_FIT[3]/BOARD_FIT[2]}
 let side=Math.min(maxSide,Math.max(minSide,W-2*pad-gap-boardW));
 let appW=2*pad+boardW+gap+side,appH=H;
 document.querySelector('aside').classList.toggle('roomy',H>=950&&side>=440);
 let st=$('app').style;for(let [k,v] of Object.entries({'--boardW':boardW,'--boardH':boardH,'--sideW':side,'--appW':appW,'--appH':appH}))st.setProperty(k,v+'px')}

/* ---------- legality ---------- */
function possible(cmd){try{transact(state,cmd);return true}catch(e){return !!e.needChoice}}
function canAct(){return holdActive==null&&state.status==='playing'&&state.phase==='actions'&&state.actions>0&&!fullHands(state).length&&mine(state.active)&&!inLobby()}
function others(){return state.players.map((_,i)=>i).filter(i=>i!==state.active)}
function choicesFor(type){if(!canAct())return [];let p=state.players[state.active],base={type},cities=p.hand.filter(k=>C[k]);
 if(type==='build'&&p.role==='civil_engineer')return [{...base,to:p.city2}].filter(possible);
 if(['carriage','train','build','stbuild'].includes(type))return MAP.cities.map(c=>({...base,to:c.id})).filter(possible);
 if(type==='ship'){if(p.role==='sailor')return MAP.cities.map(c=>({...base,to:c.id})).filter(possible);return MAP.cities.flatMap(c=>cities.map(card=>({...base,to:c.id,card}))).filter(possible)}
 if(type==='treat'||type==='sttreat')return COLORS.map(color=>({...base,color})).filter(possible);
 if(['attract','htreat','ttswap','profdraw'].includes(type))return [base].filter(possible);
 if(type==='hospital')return [base].filter(possible);
 if(type==='share')return others().flatMap(o=>['give','take'].map(direction=>({...base,other:o,direction,consent:true}))).filter(possible);
 if(type==='pgive')return others().map(o=>({...base,other:o,consent:true})).filter(possible);
 if(type==='pswap')return cities.flatMap(card=>state.discard.filter(k=>C[k]).map(t=>({...base,card,take:t}))).filter(possible);
 if(type==='peek')return p.role==='scientist'&&state.playerDeck.length?[{...base,order:state.playerDeck.slice(0,3)}].filter(possible):[];
 if(type==='research')return COLORS.map(color=>({...base,color,cards:cities.filter(k=>C[k].color===color).slice(0,5)})).filter(possible);
 if(type==='agronomist'||type==='stwater')return MAP.regions.map(r=>({...base,region:r.id})).filter(possible);
 if(type==='purify')return uniq(locs(p).flatMap(c=>C[c].region_ids)).flatMap(r=>cities.map(card=>({...base,region:r,card}))).filter(possible);
 return []}
function recompute(){for(let t of TYPES)legal[t]=choicesFor(t);if(mode&&!legal[mode]?.length)mode='';selectedCards=selectedCards.filter(k=>state.players[state.active].hand.includes(k))}

/* ---------- perform with choices + reveals ---------- */
/* ---------- pawn movement animation ---------- */
let pawnFlying=new Set(),pawnFlights=new Map();
function pawnPos(i,st){let q=st.players[i];if(q.city2){let [x,y]=edgePt(q.city,q.city2,.5);return [x,y+8]}let mates=st.players.map((x,k)=>x.city===q.city&&!x.city2?k:-1).filter(k=>k>=0),n=mates.length,j=mates.indexOf(i),ps=pawnSpot(q.city,n),c=C[q.city];return [c.x+ps.dx+(j-(n-1)/2)*20,c.y-4+ps.dy]}
function pawnMoves(before,how){if(before.phase==='setup'||state.phase==='setup'||+$('fxSpeed').value<0||matchMedia('(prefers-reduced-motion: reduce)').matches)return [];let out=[];state.players.forEach((a,i)=>{let b=before.players[i];if(!b||!b.city||!a.city||(b.city===a.city&&b.city2===a.city2))return;out.push({i,from:pawnPos(i,before),to:pawnPos(i,state),fc:b.city,tc:a.city,how:i===before.active&&['carriage','train','ship'].includes(how)?how:null})});for(let m of out)pawnFlying.add(m.i);return out}
function railPath(a,b){let adj={};for(let k of state.rails){let [x,y]=k.split('|');(adj[x]=adj[x]||[]).push(y);(adj[y]=adj[y]||[]).push(x)}let prev={[a]:null},q=[a];while(q.length){let c=q.shift();if(c===b)break;for(let n of adj[c]||[])if(!(n in prev)){prev[n]=c;q.push(n)}}if(!(b in prev))return null;let path=[],c=b;while(c!==null){path.unshift(c);c=prev[c]}return path}
let railHide=new Set(),railTimers=[],afterFx=[];
// Pawn and railroad animations wait until the popups on screen are gone.
function animAfterFx(fn){if(fxCurrent||fxQueue.length)afterFx.push(fn);else fn()}
function railGeom(k){let [a,b]=k.split('|');return railSpot(a,b)}
function stopRailFlights(){railTimers.forEach(clearTimeout);railTimers=[];railHide.clear()}
// New railroads fly in from the middle of the board like cubes do, then land with a choo-choo.
function startRailFlights(keys){if(!keys.length)return;let speed=+$('fxSpeed').value;
 if(speed<0||matchMedia('(prefers-reduced-motion: reduce)').matches){keys.forEach(k=>railHide.delete(k));paint();playSound('choo');return}
 let g=$('flyers'),img=tokenImg('railroad'),dur=1100;
 keys.forEach((k,i)=>{railHide.add(k)});paint();
 keys.forEach((k,i)=>{let [tx,ty,ang]=railGeom(k),[ox,oy]=[760,520],cx=(ox+tx)/2,cy=Math.min(oy,ty)-150,P=[],cum=[0];
  for(let n=0;n<=60;n++){let u=n/60,a=(1-u)*(1-u),b=2*(1-u)*u,c=u*u;P.push([a*ox+b*cx+c*tx,a*oy+b*cy+c*ty]);if(n)cum.push(cum[n-1]+Math.hypot(P[n][0]-P[n-1][0],P[n][1]-P[n-1][1]))}
  let frames=[],N=28;for(let q=0;q<=N;q++){let fr=q/N,d=fr*cum[60],m=1;while(m<60&&cum[m]<d)m++;let w=cum[m]>cum[m-1]?(d-cum[m-1])/(cum[m]-cum[m-1]):0,x=P[m-1][0]+(P[m][0]-P[m-1][0])*w,y=P[m-1][1]+(P[m][1]-P[m-1][1])*w;frames.push({transform:`translate(${x}px,${y}px) rotate(${ang*fr}deg) scale(${3+(1-3)*fr})`,opacity:Math.min(1,fr*12),offset:fr})}
  let node=img?svg('image',{href:img,x:-22,y:-12.5,width:44,height:25},g):svg('rect',{x:-22,y:-6,width:44,height:12,fill:'#5a3a1a'},g),delay=i*700;
  node.animate(frames,{duration:dur,delay,easing:'linear',fill:'both'});
  railTimers.push(setTimeout(()=>{playSound('choo');railHide.delete(k);node.remove();paint()},delay+dur))})}
function startPawnFlights(list){if(!list.length)return;let L=document.getElementById('pawnFly');if(!L){L=document.createElementNS(NS,'g');L.id='pawnFly';L.style.pointerEvents='none';$('flyers').parentNode.appendChild(L)}
 for(let m of list){let how=m.how||(EDGES.has(edgeKey(m.fc,m.tc))?'carriage':state.rails.length&&railPath(m.fc,m.tc)?'train':C[m.fc].port&&C[m.tc].port?'ship':'carriage');let pts=[m.from];
  if(how==='train'){let path=railPath(m.fc,m.tc);if(path)for(let k of path.slice(1,-1))pts.push([C[k].x,C[k].y-4])}
  pts.push(m.to);let raw=[];
  if(how==='ship'){let [x0,y0]=m.from,[x1,y1]=m.to,len=Math.hypot(x1-x0,y1-y0),mx=(x0+x1)/2,my=(y0+y1)/2-Math.min(120,len*.22);for(let u=0;u<=40;u++){let t=u/40,a=(1-t)*(1-t),b=2*(1-t)*t,c=t*t;raw.push([a*x0+b*mx+c*x1,a*y0+b*my+c*y1])}}else{for(let u=0;u<pts.length-1;u++)for(let t=0;t<20;t++)raw.push([pts[u][0]+(pts[u+1][0]-pts[u][0])*t/20,pts[u][1]+(pts[u+1][1]-pts[u][1])*t/20]);raw.push(m.to)}
  let cum=[0];for(let u=1;u<raw.length;u++)cum.push(cum[u-1]+Math.hypot(raw[u][0]-raw[u-1][0],raw[u][1]-raw[u-1][1]));let total=cum[cum.length-1]||1,frames=[],N=36;
  for(let q=0;q<=N;q++){let d=q/N*total,k=1;while(k<raw.length-1&&cum[k]<d)k++;let w=cum[k]>cum[k-1]?(d-cum[k-1])/(cum[k]-cum[k-1]):0,x=raw[k-1][0]+(raw[k][0]-raw[k-1][0])*w,y=raw[k-1][1]+(raw[k][1]-raw[k-1][1])*w;frames.push({transform:`translate(${x}px,${y}px)`,offset:q/N})}
  let g=svg('g',{},L);drawPawn(g,0,0,state.players[m.i].role,null,m.i===state.active&&state.phase!=='setup');let dur=Math.max(650,Math.min(2200,500+total*(how==='ship'?2.4:2)));
  let old=pawnFlights.get(m.i);if(old){clearTimeout(old.t);old.g.remove()}
  g.animate(frames,{duration:dur,easing:'linear',fill:'both'});let t=setTimeout(()=>{pawnFlights.delete(m.i);g.remove();pawnFlying.delete(m.i);paint()},dur+20);pawnFlights.set(m.i,{g,t})}
 paint()}
function stopPawnFlights(){for(let f of pawnFlights.values()){clearTimeout(f.t);f.g.remove()}pawnFlights.clear();pawnFlying.clear()}
function commit(resolved,n,remote){let before=state;state=n;commands.push(resolved);if(REVEALS.has(resolved.type)||state.status!=='playing'||(Net.active&&!Net.isHost))history=[];else{let fresh=state.log.slice(before.log.length);history.push({state:before,commands:commands.length-1,label:fresh[fresh.length-1]||resolved.type});if(history.length>60)history.shift()}selectedCards=[];let pm=pawnMoves(before,resolved.type),nr=state.rails.filter(k=>!before.rails.includes(k));if(+$('fxSpeed').value>=0)nr.forEach(k=>railHide.add(k));recompute();render();autosave();notice(state.status==='playing'?(remote?state.log[state.log.length-1]:'Done.'):state.status);if(MOVES.has(resolved.type))playSound('move');if(Object.keys(state.water).some(r=>state.water[r]>before.water[r]))playSound('water');queueFx(state.fx);animAfterFx(()=>{startPawnFlights(pm);startRailFlights(nr)});{let was=new Set(fullHands(before));let extra=fullHands(state).filter(i=>!was.has(i)&&state.status==='playing').map(i=>({kind:'handLimit',seat:i,count:state.players[i].hand.length,limit:handLimit(state.players[i])}));if(extra.length)queueFx(extra)}if(state.status==='playing'&&state.phase!=='setup'&&before.phase!=='setup'&&before.active!==state.active&&(fxCurrent||fxQueue.length)){holdActive=before.active;render();releaseHold()}if(state.status==='playing'&&state.phase!=='setup'&&(before.active!==state.active||before.phase==='setup')){if(fxCurrent||fxQueue.length)turnFlash=true;else flashActive()}}
async function perform(cmd){if(busy)return false;busy=true;let choices=[];try{while(true){try{let resolved={...cmd,choices},n=transact(state,resolved);if(Net.active){let r=await Net.submit(resolved);if(!r.ok){notice(r.error,true);return false}return true}commit(resolved,n,false);return true}catch(e){if(!e.needChoice){notice(e.message,true);return false}let a=await choose(e.needChoice.description,e.needChoice.options,e.needChoice.labels);if(a===null){notice('Cancelled — nothing changed.');return false}choices.push(a)}}}finally{busy=false}}

/* ---------- reveal & alert overlay ---------- */
let fxQueue=[],fxTimer=null,fxCurrent=null,turnFlash=false;const MOVES=new Set(['carriage','train','ship','start']);
// Card pictures: assets/city_cards/city_<name>, infection_cards/infection_<name>, event_cards/event_<name>.
// File names match the game's own names: city_<city-name>, infection_<city-name>, event_<event_key>, role_<role_key>.
function cardArt(k,landscape){
 if(C[k]){let s=slug(C[k].name),names=[s];
  for(let n of names){let a=asset((landscape?'infection_cards/infection_':'city_cards/city_')+n);if(a)return a}
  return asset((landscape?'cards/infection/':'cards/player/')+s)}
 if(EVENTS[k])return asset('event_cards/event_'+k)||asset('cards/events/'+slug(EVENTS[k]));
 if(String(k).startsWith('role:')){let r=k.slice(5);return asset('role_cards/role_'+r)}
 if(String(k).startsWith('epidemic'))return asset('tokens/epidemia_card')||asset('cards/epidemic');
 return null}
function genericFace(box,k,landscape){let color=C[k]?C[k].color:EVENTS[k]?'event':'epidemic';el('div',{className:'band '+color},box);el('div',{className:'kind',textContent:landscape?'Infection':C[k]?'City · '+C[k].color:EVENTS[k]?'Event':'Epidemic'},box);el('div',{className:'nm',textContent:cardName(k)},box);if(EVENTS[k])el('div',{className:'kind',textContent:EVENT_TEXT[k],style:'text-transform:none;letter-spacing:0;font-size:10px'},box)}
function cardFace(k,landscape){let box=el('div',{className:'bigCard'+(landscape?' landscape':'')});let src=cardArt(k,landscape);
 if(src){box.classList.add('art');let im=el('img',{src,alt:cardName(k)},box);im.onerror=()=>{im.remove();box.classList.remove('art');genericFace(box,k,landscape)};return box}
 genericFace(box,k,landscape);return box}
// ---------- prevented infections ----------
function blockedNote(f,b){let box=el('div',{className:'blocked'},b);
 let all=f.blocked.reduce((a,x)=>a+x.n,0);
 el('div',{className:'bhead',textContent:f.kind==='infection'&&f.blocked.every(x=>x.city===f.city)?'Infection prevented':all===1?'1 cube prevented':all+' cubes prevented'},box);
 for(let x of f.blocked){let row=el('div',{className:'brow '+x.by},box);el('img',{src:tokenImg(x.by==='water'?'purification':'prevention')},row);
  let t=el('div',{},row);el('strong',{textContent:C[x.city].name+(x.n>1?' ×'+x.n:'')},t);
  el('span',{textContent:x.by==='water'?(x.n>1?' · '+x.n+' purification tokens used':' · purification token used')+(x.left?' ('+x.left+' left there)':''):' · protected by the Nurse\u2019s prevention token'},t)}}
function showBlocked(list){if(+$('fxSpeed').value<0||matchMedia('(prefers-reduced-motion: reduce)').matches)return;let g=$('flyers');
 list.forEach((x,i)=>{let c=C[x.city],img=tokenImg(x.by==='water'?'purification':'prevention'),grp=document.createElementNS(NS,'g');grp.setAttribute('class','shield');
  let ring=document.createElementNS(NS,'circle');ring.setAttribute('cx',c.x);ring.setAttribute('cy',c.y);ring.setAttribute('r',18);ring.setAttribute('fill','none');ring.setAttribute('stroke',x.by==='water'?'#2f8fc9':'#e07aa6');ring.setAttribute('stroke-width',4);grp.appendChild(ring);
  let im=document.createElementNS(NS,'image');im.setAttribute('href',img);im.setAttribute('x',c.x-18);im.setAttribute('y',c.y-46);im.setAttribute('width',36);im.setAttribute('height',36);grp.appendChild(im);g.appendChild(grp);
  let d=i*260;ring.animate([{r:14,opacity:1},{r:44,opacity:0}],{duration:1100,delay:d,iterations:2,fill:'both'});
  im.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)',offset:.25},{opacity:1,offset:.7},{opacity:0,transform:'translateY(-10px)'}],{duration:1900,delay:d,fill:'both'}).onfinish=()=>grp.remove();
  setTimeout(()=>playSound('blocked'),d)})}
function queueFx(list){let speed=+$('fxSpeed').value;list=list||[];if(!trackView){let o=list.find(f=>f.kind==='outbreak'),e=list.find(f=>f.kind==='epidemic');if(o||e){trackView={o:o?o.count-1:state.outbreaks,r:e&&e.rateIndex!=null?Math.max(0,e.rateIndex-1):state.rateIndex};paint()}}if(list.length&&list[0].pre&&!cubeView&&!fxCurrent&&!fxQueue.length){cubeView=list[0].pre;paint()}for(let f of list){if(f.kind==='epidemic'||f.kind==='outbreak'||f.kind==='end'||f.kind==='handLimit'||f.blocked){fxQueue.push(f);continue}if(speed>=0)fxQueue.push(f);else if(f.after)fxQueue.push({...f,silent:true})}if(!fxCurrent)nextFx()}
let trackView=null;
function shownOut(){return trackView?trackView.o:state.outbreaks}function shownRate(){return trackView?trackView.r:state.rateIndex}
let turnPopTimer=null;
function flashActive(){if(!Net.active||mine(state.active))playSound('turn');if(state.status!=='playing'||state.phase==='setup')return;let q=state.players[state.active];if(!q)return;let old=document.getElementById('turnPop');if(old)old.remove();clearTimeout(turnPopTimer);let d=el('div',{id:'turnPop'},$('boardFrame'));d.style.setProperty('--pc',PAWN[q.role]||'#4c6b5c');pawnIcon(q.role,el('span',{className:'tp'},d),22);el('span',{textContent:plabel(state.active)+'’s turn'},d);turnPopTimer=setTimeout(()=>d.remove(),2200)}
function nextFx(){clearTimeout(fxTimer);let box=$('fx');box.replaceChildren();box.className='';let done=fxCurrent;if(done&&done.after)applyCubes(done.after,done);if(done&&done.blocked)showBlocked(done.blocked);fxCurrent=fxQueue.shift()||null;
 while(fxCurrent&&fxCurrent.silent){applyCubes(fxCurrent.after,null);fxCurrent=fxQueue.shift()||null}
 if(!fxCurrent){if(trackView){trackView=null;paint()}settleCubes();releaseHold();{let q=afterFx;afterFx=[];q.forEach(fn=>fn())}if(holdActive==null)render();if(turnFlash){turnFlash=false;if(holdActive==null)flashActive()}return}let f=fxCurrent;if(trackView&&(f.kind==='outbreak'||f.kind==='epidemic')){if(f.kind==='outbreak')trackView.o=f.count;else if(f.rateIndex!=null)trackView.r=f.rateIndex;paint()}f=fxCurrent;if(f.kind==='outbreak'&&f.chainTotal>1&&f.chainIndex>1){let wait=()=>{if(flyTimer)fxTimer=setTimeout(wait,80);else nextFx()};wait();return}let speed=+$('fxSpeed').value,dur=3000,b=el('div',{className:'fxBox'},box);
 if(f.kind==='playerDraw'){let who=el('div',{className:'fxWho'},b);pawnIcon(state.players[f.seat].role,who,26);el('span',{textContent:plabel(f.seat)+' draws'},who);let row=el('div',{className:'fxRow'},b);for(let k of f.cards)row.appendChild(cardFace(k));dur=3500;playSound('draw')}
 else if(f.kind==='infection'){el('div',{className:'fxWho'},b).textContent='Infect '+C[f.city].name;b.appendChild(cardFace(f.city,true));dur=f.blocked?5000:3000;playSound('draw')}
 else if(f.kind==='handLimit'){let q=state.players[f.seat],over=f.count-f.limit;let who=el('div',{className:'fxWho'},b);pawnIcon(q.role,who,26);el('span',{textContent:plabel(f.seat)+' is over the hand limit'},who);el('div',{className:'fxCaption',textContent:f.count+' cards in hand, limit '+f.limit+'. Discard '+over+' card'+(over>1?'s':'')+' before the game goes on.'},b);dur=4500;playSound('blocked')}
 else if(f.kind==='research'){el('div',{className:'fxCaption',textContent:f.color[0].toUpperCase()+f.color.slice(1)+' disease researched'},b);dur=3000}
 else if(f.kind==='epidemic'){let a=el('div',{className:'alert'},b);let ban=asset('alerts/epidemic');if(ban)el('img',{className:'banner',src:ban},a);el('h3',{textContent:'Epidemic'},a);let row=el('div',{className:'fxRow',style:'justify-content:center;margin:8px 0'},a);row.appendChild(cardFace('epidemic_0'));row.appendChild(cardFace(f.city,true));el('p',{textContent:'Infection rate is now '+f.rate+'. '+C[f.city].name+' receives 3 cubes; the discard pile is shuffled onto the deck.'},a);dur=4500;playSound('epidemic')}
 else if(f.kind==='outbreak'&&f.chainTotal>1){let a=el('div',{className:'alert outbreak chain'},b);let ban=asset('alerts/outbreak');if(ban)el('img',{className:'banner',src:ban},a);el('div',{className:'chainTag',textContent:'Chain reaction'},a);let h=el('h3',{},a);el('img',{className:'tok',src:tokenImg('outbreak')},h);h.append(f.chainTotal+' outbreaks in a chain');
  el('p',{textContent:C[f.city].name+' · '+f.color+' disease. Each full city spreads the disease to its neighbours, which sets off more outbreaks.'},a);
  let path=el('div',{className:'chainPath'},a);f.chain.forEach((k,n)=>{if(n)el('span',{className:'arr',textContent:'→'},path);el('span',{className:'step',textContent:C[k].name},path)});
  el('p',{textContent:'Outbreaks: '+(f.count+f.chainTotal-1)+' / 8'},a);dur=3200;playSound('outbreak');for(let n=1;n<f.chainTotal;n++)setTimeout(()=>playSound('outbreak'),260*n)}
 else if(f.kind==='outbreak'){let a=el('div',{className:'alert outbreak'},b);let ban=asset('alerts/outbreak');if(ban)el('img',{className:'banner',src:ban},a);let h=el('h3',{},a);el('img',{className:'tok',src:tokenImg('outbreak')},h);h.append('Outbreak');el('p',{textContent:C[f.city].name+' · '+f.color+' disease'},a);el('p',{textContent:'Outbreaks: '+f.count+' / 8'},a);dur=2800;playSound('outbreak')}
 else if(f.kind==='end'){let a=el('div',{className:'alert'+(state.status==='won'?' win':'')},b);el('h3',{textContent:state.status==='won'?'Victory':'Defeat'},a);el('p',{textContent:f.text},a);dur=6000;playSound(state.status==='won'?'win':'lose')}
 if(f.blocked)blockedNote(f,b);
 let sticky=f.kind==='outbreak'||f.kind==='end'||speed===0||(f.blocked&&speed<0),ms=dur*(speed>0?speed:1);
 let sk=el('div',{className:'fxSkip'},b);let btn=el('button',{textContent:(()=>{let n=fxQueue.filter(x=>!(x.kind==='outbreak'&&x.chainTotal>1&&x.chainIndex>1)).length;return n?'Continue ('+n+' more)':'Continue'})()},sk);btn.onclick=e=>{e.stopPropagation();nextFx()};
 if(!sticky){let bar=el('div',{className:'fxBar',title:'Closes automatically; click to continue now'},sk);el('i',{style:'animation-duration:'+ms+'ms'},bar);fxTimer=setTimeout(nextFx,ms)}
 box.className='on';box.onclick=()=>nextFx();setTimeout(()=>btn.focus({preventScroll:true}),0)}
document.addEventListener('keydown',e=>{if(fxCurrent&&(e.key==='Enter'||e.key===' '||e.key==='Escape')&&!document.querySelector('dialog[open]')){e.preventDefault();nextFx()}});


/* ---------- cubes appear after their alert, flying in ---------- */
let cubeView=null,flyTimer=null,flyTarget=null;
function cubeSpot(cid,color,j,view){let [ox,oy]=cubeOrigin(cid,view),cx=ox;for(let k of COLORS){let n=view[cid][k];if(!n)continue;if(k===color)return [cx+j*9+9.5,oy+3-(j%2)*3+9.5];cx+=19+(n-1)*9+3}let c=C[cid];return [c.x+20,c.y-5]}
function settleCubes(){if(flyTimer)return;if(!fxCurrent&&!fxQueue.length&&cubeView){cubeView=null;paint()}}
function flushFly(){if(!flyTimer)return;clearTimeout(flyTimer);flyTimer=null;$('flyers').replaceChildren();cubeView=flyTarget;flyTarget=null}
function applyCubes(next,f){flushFly();let from=cubeView||state.cubes;let adds=[];
 for(let c of MAP.cities)for(let k of COLORS){let d=(next[c.id][k]||0)-(from[c.id][k]||0);for(let j=0;j<d;j++)adds.push([c.id,k,(from[c.id][k]||0)+j])}
 let speed=+$('fxSpeed').value;if(!f||!adds.length||speed<0||matchMedia('(prefers-reduced-motion: reduce)').matches){if(adds.length)playSound('cube');cubeView=next;paint();settleCubes();return}
 let g=$('flyers'),src0=f.kind==='outbreak'?[C[f.city].x,C[f.city].y]:[760,520],dur=f.kind==='outbreak'?1000:1250,step=Math.min(200,1000/adds.length),last=0;
 // keep the arriving cubes hidden until they land
 let hold=JSON.parse(JSON.stringify(from));for(let [cid,k] of adds)hold[cid][k]=hold[cid][k]||0;cubeView=hold;paint();
 adds.forEach(([cid,k,j],i)=>{let [tx,ty]=cubeSpot(cid,k,j,next),img=asset('tokens/cube-'+k),node;
  if(img)node=svg('image',{href:img,x:-9.5,y:-9.5,width:19,height:19,class:'cube-'+k},g);else node=svg('rect',{x:-8.5,y:-8.5,width:17,height:17,rx:2,fill:DISEASE[k],stroke:'#f6e8cd','stroke-width':1.5},g);
  let [ox,oy]=src0;
  // one smooth arc at constant speed: a quadratic curve sampled by arc length, linear easing, size easing down to 1
  let cx=(ox+tx)/2,cy=Math.min(oy,ty)-170,P=[],cum=[0];for(let n=0;n<=60;n++){let u=n/60,a=(1-u)*(1-u),b=2*(1-u)*u,c=u*u;P.push([a*ox+b*cx+c*tx,a*oy+b*cy+c*ty]);if(n)cum.push(cum[n-1]+Math.hypot(P[n][0]-P[n-1][0],P[n][1]-P[n-1][1]))}
  let s0=f.kind==='outbreak'?1.4:3,frames=[],N=28;for(let q=0;q<=N;q++){let fr=q/N,d=fr*cum[60],m=1;while(m<60&&cum[m]<d)m++;let w=cum[m]>cum[m-1]?(d-cum[m-1])/(cum[m]-cum[m-1]):0,x=P[m-1][0]+(P[m][0]-P[m-1][0])*w,y=P[m-1][1]+(P[m][1]-P[m-1][1])*w;frames.push({transform:`translate(${x}px,${y}px) scale(${s0+(1-s0)*fr})`,opacity:Math.min(1,fr*12),offset:fr})}
  let delay=i*step;last=Math.max(last,delay+dur);
  node.animate(frames,{duration:dur,delay,easing:'linear',fill:'both'});
  setTimeout(()=>{if(flyTarget!==next)return;playSound('cube');cubeView[cid][k]=Math.max(cubeView[cid][k]||0,j+1);node.remove();paint()},delay+dur)});
 flyTarget=next;flyTimer=setTimeout(()=>{flyTimer=null;$('flyers').replaceChildren();cubeView=flyTarget;flyTarget=null;paint();settleCubes()},last+30)}
function resetFx(){afterFx=[];stopPawnFlights();stopRailFlights();turnFlash=false;holdActive=null;clearTimeout(fxTimer);trackView=null;fxQueue=[];fxCurrent=null;if(flyTimer){clearTimeout(flyTimer);flyTimer=null}flyTarget=null;$('flyers').replaceChildren();cubeView=null;$('fx').replaceChildren();$('fx').className=''}

/* ---------- hands ---------- */
function drawSupply(){for(let im of document.querySelectorAll('#resources img[data-tok]')){let src=tokenImg(im.dataset.tok);if(src&&im.getAttribute('src')!==src)im.src=src;im.hidden=!src}
 let cs=$('cubeSupply');cs.replaceChildren();el('span',{className:'lbl',textContent:'Cubes left'},cs);for(let k of COLORS){let t=el('span',{className:'t',title:state.supply[k]+' '+k+' cubes left'},cs);let src=asset('tokens/cube-'+k);if(src)el('img',{src,alt:k,className:'cube-'+k},t);else el('i',{style:'display:inline-block;width:12px;height:12px;border-radius:2px;background:'+DISEASE[k]},t);t.append(String(state.supply[k]))}
 let rs=$('researchStatus');rs.replaceChildren();el('span',{className:'lbl',textContent:'Researched'},rs);for(let k of COLORS){let done=state.research.includes(k),src=asset('tokens/research-'+k),t=el('span',{className:'t',title:k+(done?' researched':' not researched yet')},rs);if(src)el('img',{src,alt:k,className:done?'':'off'},t);else{t.textContent=k;if(!done)t.style.opacity=.4}}}
// hand display order: the color you hold most of first, then the next, Events last; oldest city first within a color
function handOrder(hand){let cnt={};for(let k of hand)if(C[k])cnt[C[k].color]=(cnt[C[k].color]||0)+1;let rank=k=>C[k]?[0,-cnt[C[k].color],COLORS.indexOf(C[k].color),FOUNDED[k]??0]:[1,0,0,0];return hand.slice().sort((a,b)=>{let x=rank(a),y=rank(b);for(let i=0;i<4;i++)if(x[i]!==y[i])return x[i]-y[i];return String(a)<String(b)?-1:1})}
function drawHands(){let box=$('hands'),n=state.players.length;box.replaceChildren();
 state.players.forEach((p,i)=>{let h=el('div',{className:'hand'+(shownActive()===i&&state.phase!=='setup'?' active':state.phase!=='setup'&&state.status==='playing'?' idle':'')+(p.hand.length>handLimit(p)?' over':'')},box);let t=el('div',{className:'handTitle'},h);pawnIcon(p.role,t,14);el('span',{className:'roleLink',onmouseenter:()=>showPreview('role:'+p.role),onmouseleave:()=>hidePreview(),onclick:e=>{e.stopPropagation();showPreview('role:'+p.role,true)},textContent:plabel(i)+' · '+(p.city?C[p.city].name+(p.city2?' – '+C[p.city2].name:''):'choose start')+' · '+p.hand.length+'/'+handLimit(p)+seatTag(i),title:ROLE_TEXT[p.role]},t);
  let cards=el('div',{className:'handCards'},h);for(let k of handOrder(p.hand)){let b=el('button',{className:'card '+(C[k]?.color||'event')+(selectedCards.includes(k)&&i===state.active?' selected':''),textContent:cardName(k),title:C[k]?cardName(k)+' — '+C[k].color+' · founded '+fmtYear(FOUNDED[k]):EVENTS[k]+': '+EVENT_TEXT[k]},cards);b.onmouseenter=()=>showPreview(k);b.onmouseleave=()=>hidePreview();
   if(p.hand.length>handLimit(p)&&!['epidemic','setup','ended'].includes(state.phase)&&!EVENTS[k]){b.textContent='✕ '+cardName(k);b.title='Discard to reach the hand limit';b.onclick=()=>perform({type:'discard',seat:i,card:k});b.disabled=!mine(i)}
   else if(EVENTS[k]){b.onclick=()=>openEvent(i,k);b.disabled=['setup','ended'].includes(state.phase)||!mine(i)}
   else b.onclick=()=>{if(i!==state.active||!['purify','ship','research'].includes(mode))return;if(mode==='research'){if(C[k].color!==sel.color)return;selectedCards=selectedCards.includes(k)?selectedCards.filter(c=>c!==k):[...selectedCards,k]}else selectedCards=[k];render()}}
  if(p.event){let b=el('button',{className:'card event',textContent:'On role card: '+EVENTS[p.event],title:EVENTS[p.event]+': '+EVENT_TEXT[p.event]+' (played from the University Professor card, then removed from the game)'},cards);b.onmouseenter=()=>showPreview(p.event);b.onmouseleave=()=>hidePreview();b.onclick=()=>openEvent(i,p.event,true);b.disabled=['setup','ended'].includes(state.phase)||!mine(i)}
  if(p.hold){let h2=p.hold,bits=[];if(h2.rail)bits.push('railroad');if(h2.water)bits.push('purification');for(let c of h2.cubes)bits.push(c+' cube');el('div',{className:'detail',textContent:'On the Student card: '+(bits.join(', ')||'nothing yet')},h)}
  if(p.role==='time_traveler'&&state.revealed&&state.revealed.length){let r=el('div',{className:'detail'},h);r.append('Infection cards this turn: ');state.revealed.forEach((k,j)=>{el('span',{className:'miniCard '+C[k].color,textContent:C[k].name,title:'Will be infected '+(j+1)+(j===0?'st':j===1?'nd':j===2?'rd':'th')},r);r.append(' ')})}
  if(p.hand.length>handLimit(p)&&!['epidemic','setup','ended'].includes(state.phase))el('span',{className:'detail',textContent:' Over the limit: click ✕ to discard, or play an Event.'},cards)});let act=box.children[state.active];if(act&&box.scrollHeight>box.clientHeight)requestAnimationFrame(()=>{let r=act.offsetTop-box.offsetTop;if(r<box.scrollTop||r+act.offsetHeight>box.scrollTop+box.clientHeight)box.scrollTop=r-4})}

/* ---------- action panel ---------- */
function drawSetup(){let box=$('startFields');box.replaceChildren();let online=Net.active,host=!online||Net.isHost;
 state.players.forEach((p,i)=>{let items=p.hand.filter(k=>C[k]);let opts=(items.length?items:Object.keys(C)).map(k=>[k,C[k].name]);
  if(!mine(i)){el('p',{className:'detail',textContent:plabel(i)+': '+(p.city?'starts in '+C[p.city].name:'is choosing a starting city…')},box);return}
  let cur=p.city||(online?'':sel['start'+i]);if(cur&&!opts.some(([v])=>v===cur))cur=online?'':opts[0][0];if(!online&&!cur)cur=opts[0][0];sel['start'+i]=cur;
  field(plabel(i)+' starts in'+(online&&!p.city?' — choose one':''),'start'+i,opts,cur,v=>{sel['start'+i]=v;perform({type:'pick',seat:i,city:v})},box,{blank:online&&!p.city})});
 let fp=$('firstPlayer'),lab=fp.parentElement,done=state.players.every(q=>q.city);lab.hidden=!host;$('begin').hidden=!host;$('begin').disabled=online&&!done;
 if(!host){$('firstHint').textContent=done?'Everyone has chosen. Waiting for the host to begin the game.':'Choose your starting city from a City card in your hand. The host begins the game when everyone has chosen.';return}
 let sug=suggestFirst(),key=state.seed+':'+state.players.map(q=>q.hand.join()).join('|');fp.replaceChildren();state.players.forEach((p,i)=>{let k=oldestCard(p);el('option',{value:i,textContent:plabel(i)+(k?' · '+C[k].name+' '+fmtYear(FOUNDED[k]):'')},fp)});if(fp.dataset.key!==key){fp.dataset.key=key;fp.value=sug?String(sug.i):'0'}else if(+fp.dataset.v<state.players.length)fp.value=fp.dataset.v;fp.onchange=()=>fp.dataset.v=fp.value;fp.dataset.v=fp.value;buttonize(fp);
 let ties=sug?state.players.filter(q=>{let k=oldestCard(q);return k&&FOUNDED[k]===sug.y}).length:0;
 $('firstHint').textContent=(online&&!done?'Waiting for every player to choose a starting city. ':'')+(sug?'Oldest city in hand goes first (rulebook): '+C[sug.k].name+', founded '+fmtYear(sug.y)+(ties>1?'. Tied with another player, so choose between them.':'.')+' You can still change the first player.':'No City cards in hand, so choose the first player.')}
function drawAction(){let box=$('actionButtons');box.replaceChildren();{let u=$('undo'),h=history[history.length-1];u.hidden=Net.active&&!Net.isHost?!(state.status==='playing'&&state.phase==='actions'&&state.actions<4&&mine(state.active)):!h||state.status!=='playing'||(Net.active&&!mine(state.active));if(h)u.title='Undo: '+h.label+' (Ctrl+Z)';else if(!u.hidden)u.title='Ask the host to undo your last action'}$('actionForm').replaceChildren();$('confirm').hidden=true;$('setupPanel').hidden=state.phase!=='setup'||inLobby();$('actionArea').hidden=state.phase==='setup';$('actionHeading').hidden=state.phase==='ended';{let ah=$('actionHeading'),q=state.players[shownActive()];ah.replaceChildren();if(q&&state.phase!=='setup'){ah.style.setProperty('--pc',PAWN[q.role]||'#4c6b5c');pawnIcon(q.role,el('span',{className:'tp'},ah),15);el('span',{className:'who',textContent:plabel(shownActive())+'’s turn'},ah);el('span',{className:'sub',textContent:state.phase==='actions'?state.actions+' of 4 actions left':state.phase==='draw'?'draw 2 Player cards':state.phase==='infection'?'infection step':state.phase==='discard'?'discard down to the hand limit':''},ah)}else ah.textContent='Available actions'}$('actionHint').textContent='';
 if(state.phase==='setup'){drawSetup();return}
 for(let t of TYPES)if(legal[t]?.length)el('button',{className:'action'+(mode===t?' chosen':''),textContent:LABEL[t],onclick:()=>{mode=t;selectedCards=[];sel.to2='';sel.extra='';delete sel.passenger;sel.to2Chosen=sel.extraChosen=sel.otherChosen=sel.dirChosen=false;render();if(legal[t]?.length===1||t==='hospital')autoGo()}},box);
 if(state.status!=='playing'){$('actionHint').textContent=state.status==='won'?'Victory — all four diseases researched.':'Defeat — '+state.status.replace('lost: ','');return}
 if(fullHands(state).length&&state.phase!=='epidemic'){$('actionHint').textContent='Hand limit: discard from the highlighted hand above (✕), or play an Event.';return}
 if(state.phase!=='actions'){$('actionHint').textContent=state.phase==='epidemic'?'Another Epidemic is waiting. Events may be played before it resolves.':'Infection step. Events may be played between Infection cards.';return}
 if(!TYPES.some(t=>legal[t]?.length)){$('actionHint').textContent=state.actions?'No legal actions. End actions to draw.':'No actions left. End actions to draw 2 cards.';return}
 if(!mode){$('actionHint').textContent='Choose an action, or click a ringed city on the map to move there. Only actions you can take right now are shown.';return}
 let options=legal[mode],p=state.players[state.active],form=$('actionForm');
 if(['carriage','train','ship','build','stbuild'].includes(mode)){let ids=byCubes(uniq(options.map(c=>c.to)));if(!ids.includes(sel.to)){sel.to=ids[0];sel.to2=''}field('Destination — or click a highlighted city','target',ids.map(k=>[k,C[k].name+cubeNote(k)]),sel.to,v=>{sel.to=v;sel.to2='';render()},form,{go:true});
  let carrier=mode==='ship'&&p.role==='sailor'||mode==='train'&&p.role==='railwayman';let mates=others().filter(i=>state.players[i].city===p.city);
  if(carrier&&mates.length){let items=[['','No passenger'],...mates.map(i=>[String(i),'Take '+plabel(i)])];field('Passenger','passenger',items,sel.passenger===false?'':sel.passenger,v=>sel.passenger=v===''?false:v,form,{go:true})}else sel.passenger=false;
  if(mode==='build'&&p.role==='railwayman'&&!state.doubleRailUsed&&state.railSupply>=2){let next=ADJ[sel.to].filter(n=>n!==p.city&&possible({type:'build',to:sel.to,to2:n}));if(next.length){field('Railwayman: second token (once per turn)','to2',[['','No second token'],...next.map(k=>[k,C[sel.to].name+' → '+C[k].name])],sel.to2,v=>{sel.to2=v;sel.to2Chosen=true;paint()},form,{go:true})}}}
 if(['treat','research','sttreat'].includes(mode)){let ids=uniq(options.map(c=>c.color));if(!ids.includes(sel.color))sel.color=ids[0];field('Disease','disease',ids.map(k=>[k,k]),sel.color,v=>{sel.color=v;selectedCards=[];sel.extra='';render()},form,{go:true})}
 if(mode==='treat'&&p.role==='rural_doctor'){let near=uniq([p.city,...C[p.city].region_ids.flatMap(r=>R[r].adjacent_cities)]);let after=CP(state.cubes);after[p.city][sel.color]--;let items=[['','No extra cube']];for(let c of near)for(let k of COLORS)if(after[c][k]>0)items.push([c+'|'+k,C[c].name+' · '+k+' ('+after[c][k]+')']);field('Rural Doctor: extra cube','extra',items,sel.extra,v=>{sel.extra=v;sel.extraChosen=true},form,{go:true})}
 if(['purify','agronomist','stwater'].includes(mode)){let ids=uniq(options.map(c=>c.region));if(!ids.includes(sel.region))sel.region=ids[0];field('Adjacent region — or click it on the map','region',ids.map(k=>[k,k+' · water '+state.water[k]]),sel.region,v=>{sel.region=v;selectedCards=[];render()},form,{go:true});el('p',{className:'detail',textContent:R[sel.region].adjacent_cities.map(k=>C[k].name).join(' · ')},form)}
 if(mode==='share'||mode==='pgive'){let ids=uniq(options.map(c=>c.other));if(!ids.includes(+sel.other))sel.other=ids[0];field('Other player','other',ids.map(i=>[String(i),plabel(i)]),sel.other,v=>{sel.other=+v;sel.otherChosen=mode==='pgive';render()},form,{go:true});if(mode==='share'){let dirs=options.filter(c=>c.other===+sel.other).map(c=>c.direction);if(!dirs.includes(sel.direction))sel.direction=dirs[0];field('Transfer','direction',dirs.map(k=>[k,k==='give'?'Give the '+C[p.city].name+' card':'Take the '+C[p.city].name+' card']),sel.direction,v=>{sel.direction=v;sel.dirChosen=true},form,{go:true})}else el('p',{className:'detail',textContent:'Gives the '+C[p.city].name+' card to that player, wherever they are.'},form)}
 if(mode==='pswap'){let takes=uniq(options.map(c=>c.take));if(!takes.includes(sel.swapTake))sel.swapTake=takes[0];field('Take from discard pile','swapTake',takes.map(k=>[k,C[k].name+' ('+C[k].color+')']),sel.swapTake,v=>{sel.swapTake=v;selectedCards=[];render()},form,{go:true});let gives=options.filter(c=>c.take===sel.swapTake).map(c=>c.card);selectedCards=selectedCards.filter(k=>gives.includes(k));if(!selectedCards.length)selectedCards=[gives[0]];let pk=el('div',{className:'cardPicker'},form);el('div',{className:'label',textContent:'Card to put in the discard pile'},pk);for(let k of gives)el('button',{className:'miniCard '+C[k].color+(selectedCards.includes(k)?' selected':''),textContent:C[k].name,onclick:()=>{selectedCards=[k];render();goNow()}},pk)}
 if(mode==='peek'){let top=state.playerDeck.slice(0,3);if(!sel.peek||sel.peek.join()!==[...sel.peek].sort().join()&&false||sel.peek.slice().sort().join()!==top.slice().sort().join())sel.peek=top.slice();el('p',{className:'detail',textContent:'Top of the Player deck (first = drawn next). Reorder, then confirm.'},form);let list=el('div',{className:'peekList'},form);sel.peek.forEach((k,i)=>{let row=el('div',{},list);el('span',{className:'miniCard '+(C[k]?.color||(EVENTS[k]?'event':'epidemic')),textContent:(i+1)+'. '+cardName(k)},row);let up=el('button',{textContent:'↑',disabled:i===0,onclick:()=>{[sel.peek[i-1],sel.peek[i]]=[sel.peek[i],sel.peek[i-1]];render()}},row);let dn=el('button',{textContent:'↓',disabled:i===sel.peek.length-1,onclick:()=>{[sel.peek[i+1],sel.peek[i]]=[sel.peek[i],sel.peek[i+1]];render()}},row)})}
 if(['purify','research'].includes(mode)||(mode==='ship'&&p.role!=='sailor')){let eligible=p.hand.filter(k=>C[k]);if(mode==='purify')eligible=eligible.filter(k=>options.some(c=>c.card===k&&c.region===sel.region));if(mode==='ship')eligible=eligible.filter(k=>C[k].color===C[sel.to].color);if(mode==='research')eligible=eligible.filter(k=>C[k].color===sel.color);selectedCards=selectedCards.filter(k=>eligible.includes(k));if(mode!=='research'&&!selectedCards.length)selectedCards=eligible.slice(0,1);if(mode==='research'&&!selectedCards.length&&eligible.length===5)selectedCards=eligible.slice();let pk=el('div',{className:'cardPicker'},form);el('div',{className:'label',textContent:mode==='research'?'Select five cards ('+selectedCards.length+'/5)':'City card to discard'},pk);for(let k of eligible)el('button',{className:'miniCard '+C[k].color+(selectedCards.includes(k)?' selected':''),textContent:C[k].name,onclick:()=>{selectedCards=mode==='research'?(selectedCards.includes(k)?selectedCards.filter(c=>c!==k):[...selectedCards,k]):[k];render();if(mode!=='research')goNow()}},pk)}
 if(mode==='hospital')$('actionHint').textContent='Discard '+C[p.city].name+' to place the '+C[p.city].color+' hospital here'+(state.hospitals[C[p.city].color]?' (moves it from '+C[state.hospitals[C[p.city].color]].name+').':'.');
 if(mode==='treat'&&p.role!=='rural_doctor')$('actionHint').textContent='Remove one '+sel.color+' cube'+(p.city2?' from one of your two cities.':' from '+C[p.city].name+'.');
 if(mode==='stbuild')$('actionHint').textContent='Places the railroad token from your card. This costs no action.';if(mode==='stwater')$('actionHint').textContent='Places the purification token from your card. This costs no action.';if(mode==='sttreat')$('actionHint').textContent='Returns the cube on your card to remove a cube of that color here. This costs no action.';
 if(mode==='agronomist')$('actionHint').textContent='Place one purification token. No card required.';
 if(mode==='purify')$('actionHint').textContent='Places up to '+(p.role==='agronomist'?3:2)+' tokens ('+state.waterSupply+' left in supply).';
 $('confirm').hidden=false;$('confirm').textContent=LABEL[mode]+(FREEA.has(mode)?' · free':' · 1 action');$('confirm').disabled=mode==='research'&&selectedCards.length!==5}
async function makeCmd(){let p=state.players[state.active],cmd={type:mode};
 if(['carriage','train','ship','build','stbuild'].includes(mode))cmd.to=sel.to;
 if(mode==='ship'&&p.role!=='sailor')cmd.card=selectedCards[0];
 if(mode==='build'&&sel.to2)cmd.to2=sel.to2;
 if(['treat','research','sttreat'].includes(mode))cmd.color=sel.color;
 if(mode==='treat'&&sel.extra){let [city,color]=sel.extra.split('|');cmd.extra={city,color}}
 if(['purify','agronomist','stwater'].includes(mode))cmd.region=sel.region;if(mode==='purify')cmd.card=selectedCards[0];
 if(mode==='research')cmd.cards=selectedCards.slice();
 if(mode==='pswap'){cmd.card=selectedCards[0];cmd.take=sel.swapTake}
 if(mode==='peek')cmd.order=sel.peek.slice();
 if(mode==='share'||mode==='pgive'){cmd.other=+sel.other;if(mode==='share')cmd.direction=sel.direction;cmd.consent=await askSeat(cmd.other,plabel(cmd.other)+': do you agree to this card transfer?');if(!cmd.consent)return null}
 if(['ship','train'].includes(mode)&&sel.passenger!=null&&sel.passenger!==false&&sel.passenger!==''){cmd.passenger=+sel.passenger;cmd.consent=await askSeat(cmd.passenger,plabel(cmd.passenger)+': do you agree to travel as a passenger?');if(!cmd.consent)return null}
 return cmd}

/* ---------- board ---------- */
function drawPawn(g,x,y,role,num,active){let col=PAWN[role]||'#888',dark=role==='scientist'?'#6b6250':'#1b1b1b';if(active)svg('ellipse',{cx:x,cy:y,rx:14,ry:5,fill:'none',stroke:'#16e0f0','stroke-width':3},g);let img=roleAsset('pawns/pawn-',role);if(img){svg('image',{href:img,x:x-15,y:y-42,width:30,height:45},g)}else{svg('ellipse',{cx:x,cy:y,rx:10,ry:3.5,fill:col,stroke:dark,'stroke-width':1.3},g);svg('path',{d:`M${x-9} ${y} C${x-8} ${y-9} ${x-5} ${y-14} ${x-4} ${y-18} L${x+4} ${y-18} C${x+5} ${y-14} ${x+8} ${y-9} ${x+9} ${y} Z`,fill:col,stroke:dark,'stroke-width':1.3},g);svg('circle',{cx:x,cy:y-24,r:6.5,fill:col,stroke:dark,'stroke-width':1.3},g)}}
function drawHospital(g,x,y,color){let img=asset('tokens/hospital-'+color);if(img){svg('image',{href:img,x:x-21,y:y-37,width:42,height:42},g);return}let c=HOSP[color];svg('path',{d:`M${x-12} ${y} V${y-13} L${x} ${y-24} L${x+12} ${y-13} V${y} Z`,fill:c,stroke:'#111','stroke-width':1.4},g);svg('path',{d:`M${x-14} ${y-12} L${x} ${y-25} L${x+14} ${y-12}`,fill:'none',stroke:'#111','stroke-width':2.2},g);svg('rect',{x:x-3,y:y-8,width:6,height:8,fill:'#f3e6c8',stroke:'#111','stroke-width':.8},g);svg('rect',{x:x-9.5,y:y-11,width:4,height:4,fill:'#f3e6c8'},g);svg('rect',{x:x+5.5,y:y-11,width:4,height:4,fill:'#f3e6c8'},g);svg('rect',{x:x-1,y:y-21,width:2,height:7,fill:'#fff'},g);svg('rect',{x:x-3.5,y:y-18.5,width:7,height:2,fill:'#fff'},g)}
function drawCityList(){let box=$('cityList');if(!box)return;box.replaceChildren();let view=cubeView||state.cubes;
 let rows=MAP.cities.map(c=>({c,n:COLORS.reduce((a,k)=>a+(view[c.id]?.[k]||0),0)})).filter(r=>r.n>0).sort((a,b)=>COLORS.indexOf(a.c.color)-COLORS.indexOf(b.c.color)||b.n-a.n||a.c.name.localeCompare(b.c.name));
 let h=el('div',{className:'clHead'},box);el('h2',{textContent:'Infected cities'},h);el('span',{className:'detail',textContent:rows.length?rows.length+' cities · '+rows.reduce((a,r)=>a+r.n,0)+' cubes':'No cubes on the board'},h);
 let grid=null,cur=null;
 for(let {c,n} of rows){if(c.color!==cur){cur=c.color;let g=rows.filter(r=>r.c.color===cur);let gh=el('div',{className:'clGroup '+cur},box);el('span',{textContent:cur[0].toUpperCase()+cur.slice(1)},gh);el('span',{className:'detail',textContent:g.length+(g.length>1?' cities · ':' city · ')+g.reduce((a,r)=>a+r.n,0)+' cubes'},gh);grid=el('div',{className:'clGrid'},box)}let holders=state.players.map((q,i)=>[q,i]).filter(([q])=>q.hand.includes(c.id));
  let r=el('div',{className:'clRow '+c.color+(n>=3?' hot':''),title:c.name+': '+COLORS.filter(k=>view[c.id]?.[k]).map(k=>view[c.id][k]+' '+k).join(', ')+(holders.length?' · card held by '+holders.map(([q,i])=>plabel(i)).join(', '):'')},grid);
  el('span',{className:'clName',textContent:c.name},r);let cu=el('span',{className:'clCubes'},r);
  for(let k of COLORS){let m=view[c.id]?.[k]||0;if(!m)continue;let src=asset('tokens/cube-'+k);for(let j=0;j<m;j++){if(src)el('img',{src,alt:k,className:'cube-'+k},cu);else el('i',{style:'background:'+DISEASE[k]},cu)}}
  let pw=el('span',{className:'clPawns'},r);for(let [q,i] of holders){let w=el('span',{className:'clPawn',title:plabel(i)+' holds this card'},pw);pawnIcon(q.role,w,13)}}}

// Card preview: hover a card in a hand (or a player's name) to see it full size; click a name to keep it open.
let prevEl=null,prevPinned=false;
function hidePreview(force){if(prevPinned&&!force)return;prevPinned=false;if(prevEl){prevEl.remove();prevEl=null}}
function showPreview(k,pin){if(prevPinned&&!pin)return;prevPinned=false;if(prevEl){prevEl.remove();prevEl=null}if(!cardArt(k,false))return;prevEl=el('div',{id:'cardPreview'},document.body);prevEl.appendChild(cardFace(k));if(String(k).startsWith('role:')){let r=k.slice(5);el('div',{className:'prevText',textContent:ROLE_TEXT[r]||''},prevEl)}if(pin){prevPinned=true;prevEl.classList.add('pinned')}}
document.addEventListener('click',()=>hidePreview(true));
document.addEventListener('keydown',e=>{if(e.key==='Escape')hidePreview(true)});
// Deck pictures on the board: the Infection deck and discard (top), the Player deck and discard (bottom right).
const DECK_SLOTS={infDeck:[987,27,240,172],infDisc:[1256,24,250,173],plDeck:[1120,813,178,240],plDisc:[1325,813,174,240]};
function drawDecks(T){
 let put=(slot,href,n,label,dim)=>{let [x,y,w,h]=DECK_SLOTS[slot];if(!href||!n)return;let g=svg('g',{class:'deckArt'},T);svg('title',{},g).textContent=label+': '+n;
  svg('image',{href,x,y,width:w,height:h,preserveAspectRatio:'xMidYMid slice','clip-path':'inset(0 round 10px)',...(dim?{style:'opacity:.55;filter:saturate(.7) brightness(.9)'}:{})},g);
  svg('circle',{cx:x+w-16,cy:y+h-16,r:15,fill:'#1d2a24','fill-opacity':.85,stroke:'#f4e7c5','stroke-width':2},g);let t=svg('text',{x:x+w-16,y:y+h-10,'text-anchor':'middle','font-size':17,'font-weight':700,fill:'#f4e7c5'},g);t.textContent=n};
 let ib=asset('tokens/infection-back'),cb=asset('tokens/city-back');
 put('infDeck',ib,state.infectionDeck.length,'Infection deck');
 put('plDeck',cb,state.playerDeck.length,'Player deck');
 let ti=state.infectionDiscard[state.infectionDiscard.length-1],tp=state.discard[state.discard.length-1];
 if(ti)put('infDisc',cardArt(ti,true),state.infectionDiscard.length,'Infection discard',true);
 if(tp)put('plDisc',cardArt(tp,false),state.discard.length,'Player discard',true)}
function paint(){drawCityList();for(let k of ['areas','tracks','pieces'])$(k).replaceChildren();let A=$('areas'),T=$('tracks'),P=$('pieces');drawDecks(T);let p=state.players[state.active];let occupied=new Set(state.players.flatMap(q=>[q.city,q.city2]).filter(Boolean));
 let quick=quickMoves(),regionMode=['purify','agronomist'].includes(mode)&&canAct(),targets=['carriage','train','ship','build'].includes(mode)&&canAct()?new Set((legal[mode]||[]).map(c=>c.to)):new Set();
 for(let r of MAP.regions){let active=regionMode&&r.id===sel.region,cand=regionMode&&(legal[mode]||[]).some(c=>c.region===r.id);if(active||cand||$('showRegions').checked||state.prevention===r.id){let poly=svg('polygon',{points:r.boundary_cities.map(k=>C[k].x+','+C[k].y).join(' '),fill:active?'#00edff':state.prevention===r.id?'#e04040':'#4a9aff','fill-opacity':active?.28:cand?.1:state.prevention===r.id?.1:.04,stroke:active?'#00efff':'none','stroke-width':3},A);if(cand)poly.style.cursor='pointer';poly.onclick=()=>{if(cand){sel.region=r.id;selectedCards=[];render();autoGo()}}}if($('showRegions').checked){let t=svg('text',{x:r.label_position.x,y:r.label_position.y+30,'text-anchor':'middle',style:'font-size:11px'},P);t.textContent=r.id}}
 if(mapPick&&mapPick.kind==='region')for(let r of MAP.regions){if(!mapPick.options.has(r.id))continue;let hv=mapPick.hover===r.id,poly=svg('polygon',{points:r.boundary_cities.map(k=>C[k].x+','+C[k].y).join(' '),fill:'#00edff','fill-opacity':hv?.4:.2,stroke:'#00efff','stroke-width':hv?5:3,class:'pickable'},A);poly.style.cursor='pointer';svg('title',{},poly).textContent=regionLabel(r.id);poly.onclick=e=>{e.stopPropagation();mapPick.pick(r.id)};poly.onmouseenter=()=>{mapPick.hover=r.id;for(let b of document.querySelectorAll('#choiceOptions button'))b.classList.toggle('hot',b.textContent===regionLabel(r.id))}}
 // railroads
 let railImg=tokenImg('railroad');for(let k of state.rails){if(railHide.has(k))continue;let [a,b]=k.split('|'),[mx,my,ang]=railSpot(a,b);svg('image',{href:railImg,x:mx-22,y:my-12.5,width:44,height:25,transform:`rotate(${ang} ${mx} ${my})`},T)}
 if(mode==='build'&&sel.to2&&canAct()&&ADJ[sel.to]&&ADJ[sel.to].includes(sel.to2)){let a=sel.to,b=sel.to2;svg('path',{d:edgeD(a,b),fill:'none',stroke:'#16e0f0','stroke-width':4,'stroke-dasharray':'8 6'},T)}
 // water & prevention
 for(let r of MAP.regions){let hasW=state.water[r.id],hasP=state.prevention===r.id;if(!hasW&&!hasP)continue;let lp=r.label_position,pc=hasP?regionCenter(r):null,ex=pc?[[pc[0]-23,pc[1]-23,pc[0]+23,pc[1]+23]]:[];
  if(hasW){let rc=regionCenter(r),[x,y]=tokenSpot(rc[0],rc[1],36,36,ex);svg('image',{href:tokenImg('purification'),x:x-17,y:y-17,width:34,height:34},P);if(state.water[r.id]>1){svg('circle',{cx:x+15,cy:y-13,r:9,fill:'#1d4f86',stroke:'#fff','stroke-width':1.5},P);let t=svg('text',{x:x+15,y:y-9,'text-anchor':'middle',style:'font-size:11px;stroke-width:0'},P);t.textContent=state.water[r.id]}}
  if(hasP)svg('image',{href:tokenImg('prevention'),x:pc[0]-20,y:pc[1]-20,width:40,height:40},P)}
 // tracks
 let [rx,ry]=RATE_POS[shownRate()];$('outbreaks').textContent=shownOut()+'/8';$('rate').textContent=RATE[shownRate()];svg('image',{href:tokenImg('infection_rate'),x:rx-32,y:ry-32,width:64,height:64},P);
 let [ox,oy]=OUT_POS[Math.min(8,shownOut())];svg('image',{href:tokenImg('outbreak'),x:ox-33,y:oy-33,width:66,height:66},P);
 for(let c of state.research){let [x,t,bt]=RESEARCH_POS[c],y=(t+bt)/2,h=bt-t;let img=asset('tokens/research-'+c);if(img){let H=h*1.12;svg('image',{href:img,x:x+1.5-H/2,y:t+h/2-H/2+1,width:H,height:H,filter:'url(#researchFx)',class:'researchMark'},P)}else{svg('circle',{cx:x,cy:y,r:17,fill:DISEASE[c],stroke:'#f6e8cd','stroke-width':3},P);let t=svg('text',{x,y:y+6,'text-anchor':'middle',style:'font-size:18px'},P);t.textContent='✓'}}
 // cities: cubes, hospitals, targets
 let CV=cubeView||state.cubes;for(let c of MAP.cities){let present=COLORS.filter(k=>CV[c.id][k]),used=[];if(present.length){let [ox,oy]=cubeOrigin(c.id,CV),cx=ox;used.push([ox,oy,ox+cubeWidth(c.id,CV),oy+22]);for(let k of present){let n=CV[c.id][k],img=asset('tokens/cube-'+k);if(img){let tr=!cubeView&&c.id===p.city&&canAct()&&(legal.treat||[]).some(x=>x.color===k);for(let j=0;j<n;j++){let im=svg('image',{href:img,x:cx+j*9,y:oy+3-(j%2)*3,width:19,height:19,class:'cube-'+k+(tr?' treatable':'')},P);if(tr){im.onclick=e=>{e.stopPropagation();treatCube(k)};svg('title',{},im).textContent='Click to treat '+k+' disease here'}}cx+=19+(n-1)*9+3}else{svg('rect',{x:cx,y:oy+3,width:17,height:17,rx:2,fill:DISEASE[k],stroke:'#f6e8cd','stroke-width':1.5},P);let t=svg('text',{x:cx+8.5,y:oy+16.5,'text-anchor':'middle',style:'font-size:12px'},P);t.textContent=n;cx+=19}}}
  let hs=COLORS.filter(color=>state.hospitals[color]===c.id);if(hs.length){if(occupied.has(c.id))used.push(pawnSpot(c.id,pawnsAt(c.id)).r);let [hx,hy]=hospitalOrigin(c.id,hs.length,used);hs.forEach((color,i)=>drawHospital(P,hx+15+30*i,hy+28,color))}
  let pk=mapPick&&mapPick.kind==='city'&&mapPick.options.has(c.id),qm=!pk&&!mapPick&&quick.has(c.id),tg=targets.has(c.id)||pk,dot=svg('circle',{cx:c.x+(MARK[c.id]?MARK[c.id][0]:0),cy:c.y+(MARK[c.id]?MARK[c.id][1]:0),r:15,fill:tg?'#00edff':'#fff','fill-opacity':tg?.25:qm?.08:0,stroke:tg?'#00efff':qm?'#00d0e0':'transparent','stroke-width':tg?3:2.5,'stroke-dasharray':qm?'4 3':'none'},P);svg('title',{},dot).textContent=c.name+(c.port?' (port)':'')+(qm?' · click to '+quick.get(c.id).label:'');if(pk){dot.style.cursor='pointer';dot.onclick=()=>mapPick.pick(c.id)}else if(tg){dot.style.cursor='pointer';dot.onclick=()=>{sel.to=c.id;sel.to2='';render();autoGo()}}else if(qm){dot.style.cursor='pointer';dot.onclick=()=>quickMove(c.id)}if($('showNames').checked){let t=svg('text',{x:c.x+12,y:c.y-18,style:'font-size:12px'},P);t.textContent=c.name}}
 // pawns
 let byCity={};state.players.forEach((q,i)=>{if(q.city&&!q.city2)(byCity[q.city]=byCity[q.city]||[]).push(i)});state.players.forEach((q,i)=>{if(q.city&&q.city2&&!pawnFlying.has(i)){let [ex,ey]=edgePt(q.city,q.city2,.5);drawPawn(P,ex,ey+8,q.role,i+1,i===state.active&&state.phase!=='setup')}});for(let [cid,seats] of Object.entries(byCity)){let c=C[cid],n=seats.length,ps=pawnSpot(cid,n);seats.forEach((i,j)=>{if(pawnFlying.has(i))return;let x=c.x+ps.dx+(j-(n-1)/2)*20,y=c.y-4+ps.dy;drawPawn(P,x,y,state.players[i].role,i+1,i===state.active&&state.phase!=='setup')})}}

/* ---------- render ---------- */
// keep the side panel from overflowing: shrink a long button list (it scrolls) rather than push the page
function fitChoices(){let a=document.querySelector('aside');if(!a)return;let f=$('actionForm');f.style.maxHeight='';f.style.overflowY='';for(let g of document.querySelectorAll('#actionForm .choiceGroup.many,#startFields .choiceGroup.many')){g.style.maxHeight='';let over=a.scrollHeight-a.clientHeight;if(over>0)g.style.maxHeight=Math.max(60,g.clientHeight-over-2)+'px'}
 let over=a.scrollHeight-a.clientHeight;if(over>0&&f.clientHeight>80){f.style.maxHeight=Math.max(80,f.clientHeight-over-2)+'px';f.style.overflowY='auto'}}
function render(){syncChips();requestAnimationFrame(fitChoices);let p=state.players[state.active];$('turnStatus').textContent=inLobby()?'Online lobby: waiting to start':state.phase==='setup'?'Choose starting cities':state.status!=='playing'?(state.status==='won'?'Victory':'Defeat — '+state.status.replace('lost: ','')):'Turn '+(state.turn-(holdActive!=null?1:0))+' · '+plabel(shownActive())+' · '+state.actions+' action'+(state.actions===1?'':'s');
 $('phaseLabel').textContent=state.phase;$('footer').textContent='Player deck '+state.playerDeck.length+' · infection deck '+state.infectionDeck.length+' · Events in game: '+state.eventsInGame.map(k=>EVENTS[k]).join(', ')+' · seed '+state.seed+' · v'+UI_VERSION;
 $('outbreaks').textContent=shownOut()+'/8';$('rate').textContent=RATE[shownRate()];$('railsSupply').textContent=state.railSupply;$('waterSupply').textContent=state.waterSupply;drawSupply();
 let flags=[];if(state.goodSeason)flags.push('Good Season pending: next infection step draws 1 bottom card');if(state.phase==='infection'&&state.infectionFromBottom)flags.push('Good Season: drawing from the bottom');if(state.doubleRailUsed)flags.push('Railwayman double build used this turn');$('flags').textContent=flags.join(' · ');
 let np=$('nextPhase');np.hidden=['setup','ended'].includes(state.phase)||!mine(state.active);np.disabled=holdActive!=null||!!fxCurrent||fxQueue.length>0||fullHands(state).length>0&&state.phase!=='epidemic';np.textContent=state.phase==='actions'?(p.role==='time_traveler'?'End actions & start infection step':'End actions & draw two cards'):state.phase==='epidemic'?'Resolve next Epidemic':'Infect next city · '+state.infectionRemaining+' left';
 drawAction();onlineHint();drawHands();paint();fitLayout()}

/* ---------- events ---------- */
function eventForm(card,box,seat,onChange){let m={},n=state.players.length,refresh=()=>{box.replaceChildren();build()};
 function build(){el('div',{className:'eventText',textContent:EVENT_TEXT[card]},box);
 if(card==='government_mobilization'){m.moves=m.moves||state.players.map(()=>({type:'',to:'',card:''}));state.players.forEach((q,i)=>{let mv=m.moves[i];let row=el('div',{className:'seatRow'},box);let types=[['','Stay'],['carriage','Carriage / boat'],['train','Train'],['ship','Ship']];field(plabel(i)+' in '+C[q.city].name,'gm_t'+i,types,mv.type,v=>{mv.type=v;mv.to='';refresh()},row);if(mv.type){let dests=MAP.cities.filter(c=>{if(c.id===q.city)return false;if(mv.type==='carriage')return EDGES.has(edgeKey(q.city,c.id));if(mv.type==='train')return railReach(state,q.city).has(c.id);return C[q.city].port&&c.port&&(q.role==='sailor'||q.hand.some(k=>C[k]?.color===c.color))}).map(c=>[c.id,c.name]);if(!dests.length)el('p',{className:'detail',textContent:'No destination by that means.'},row);else{if(!dests.some(([v])=>v===mv.to))mv.to=dests[0][0];field('Destination','gm_d'+i,dests,mv.to,v=>{mv.to=v;refresh()},row);if(mv.type==='ship'&&q.role!=='sailor'){let cs=q.hand.filter(k=>C[k]?.color===C[mv.to].color).map(k=>[k,C[k].name]);if(!cs.some(([v])=>v===mv.card))mv.card=cs[0]?.[0];field('Discard','gm_c'+i,cs,mv.card,v=>mv.card=v,box)}}}});el('p',{className:'detail',textContent:'Ruling: free means no action is spent; ship travel still needs its matching City card unless you are the Sailor.'},box)}
 if(card==='hospital_founding'){m.city=m.city||cityItems()[0][0];field('Hospital city (uses that city’s color)','ev_city',cityItems(),m.city,v=>m.city=v,box)}
 if(card==='mail_correspondence'){m.seatA=m.seatA??0;m.seatB=m.seatB??1;field('First player','mc_a',seatItems(),m.seatA,v=>{m.seatA=+v;m.cardA=null;refresh()},box);let ha=state.players[m.seatA].hand.filter(k=>!(m.seatA===seat&&k===card));if(!ha.includes(m.cardA))m.cardA=ha[0];field('Card they give','mc_ca',ha.map(k=>[k,cardName(k)]),m.cardA,v=>m.cardA=v,box);field('Second player','mc_b',seatItems(i=>i!==m.seatA),m.seatB,v=>{m.seatB=+v;m.cardB=null;refresh()},box);if(m.seatB===m.seatA){m.seatB=(m.seatA+1)%n;refresh();return}let hb=state.players[m.seatB].hand.filter(k=>!(m.seatB===seat&&k===card));if(!hb.includes(m.cardB))m.cardB=hb[0];field('Card they give','mc_cb',hb.map(k=>[k,cardName(k)]),m.cardB,v=>m.cardB=v,box)}
 if(card==='new_rails'||card==='ring_railroads'){let max=card==='new_rails'?2:3;let opts=MAP.connections.filter(e=>e.railway_allowed&&!state.rails.includes(edgeKey(e.a,e.b))&&(card==='new_rails'||C[e.a].port&&C[e.b].port)).map(e=>[edgeKey(e.a,e.b),C[e.a].name+' ↔ '+C[e.b].name]).sort((a,b)=>a[1].localeCompare(b[1]));m.routes=m.routes||[];for(let i=0;i<Math.min(max,state.railSupply);i++){field('Railroad '+(i+1),'rr'+i,[['','—'],...opts],m.routes[i]||'',v=>{m.routes[i]=v;onChange&&onChange()},box)}if(card==='ring_railroads')el('p',{className:'detail',textContent:'Only connections joining two port cities are listed.'},box)}
 if(card==='overseas_migration'||card==='science_triumph'){if(card==='science_triumph'){m.region=m.region||'';let rb=el('div',{className:'field'},box);el('div',{className:'label',textContent:'Region'},rb);el('p',{className:'detail',textContent:m.region?'Chosen: '+R[m.region].adjacent_cities.map(k=>C[k].name).join(', '):'No region chosen yet.'},rb);el('button',{type:'button',textContent:m.region?'Choose a different region on the map':'Choose a region on the map',onclick:async()=>{$('eventDialog').close();let r=await choose('Science Triumph: click a region on the map',MAP.regions.map(x=>x.id),MAP.regions.map(x=>x.adjacent_cities.map(k=>C[k].name).join(', ')));showDialog('eventDialog');if(r){m.region=r;m.rem={};refresh()}}},rb);m.rem=m.rem||{};let any=false;for(let c of (m.region?R[m.region].adjacent_cities:[])){let cols=COLORS.filter(k=>state.cubes[c][k]);if(!cols.length)continue;any=true;field(C[c].name,'st_'+c,[['','Leave'],...cols.map(k=>[k,'Remove 1 '+k])],m.rem[c]||'',v=>m.rem[c]=v,box)}if(m.region&&!any)el('p',{className:'detail',textContent:'No cubes in that region.'},box)}else{let items=[['','—']];for(let c of MAP.cities)for(let k of COLORS)if(state.cubes[c.id][k])items.push([c.id+'|'+k,C[c.id].name+' · '+k+' ('+state.cubes[c.id][k]+')']);m.cubes=m.cubes||['',''];field('Cube 1','om1',items,m.cubes[0],v=>m.cubes[0]=v,box);field('Cube 2','om2',items,m.cubes[1],v=>m.cubes[1]=v,box)}}
 if(card==='purify_water'){m.regions=m.regions||['',''];for(let i=0;i<Math.min(2,state.waterSupply);i++){let rb=el('div',{className:'field'},box);el('div',{className:'label',textContent:'Token '+(i+1)},rb);el('p',{className:'detail',textContent:m.regions[i]?'Placed in the region of '+R[m.regions[i]].adjacent_cities.map(k=>C[k].name).join(', '):'Not placed yet (a token is optional).'},rb);
  el('button',{type:'button',textContent:m.regions[i]?'Choose a different region on the map':'Choose a region on the map',onclick:async()=>{$('eventDialog').close();let r=await choose('Purify Water: click a region on the map for token '+(i+1),MAP.regions.map(x=>x.id),MAP.regions.map(x=>x.adjacent_cities.map(k=>C[k].name).join(', ')));showDialog('eventDialog');if(r){m.regions[i]=r;refresh()}}},rb);if(m.regions[i])el('button',{type:'button',textContent:'Clear',onclick:()=>{m.regions[i]='';refresh()}},rb)}}
 if(card==='second_chance'){let c=state.players[seat].city;el('p',{className:'detail',textContent:state.discard.includes(c)?'Takes '+C[c].name+' from the discard pile into '+plabel(seat)+'’s hand.':'The '+C[c].name+' card is not in the discard pile, so this Event cannot be played now.'},box)}
 if(card==='ships_arrive'){m.city=m.city||cityItems(c=>c.port)[0][0];field('Port city','sa_c',cityItems(c=>c.port),m.city,v=>m.city=v,box);m.seats=m.seats||[];state.players.forEach((q,i)=>check('Move '+plabel(i)+' (in '+C[q.city].name+')',m.seats.includes(i),v=>{m.seats=v?[...m.seats,i]:m.seats.filter(x=>x!==i)},box))}
 if(card==='telegraph_message'){m.from=m.from??seat;m.to=m.to??(seat+1)%n;field('Giver','tm_f',seatItems(),m.from,v=>{m.from=+v;m.cards=[];if(m.to===m.from)m.to=(m.from+1)%n;refresh()},box);field('Receiver','tm_t',seatItems(i=>i!==m.from),m.to,v=>m.to=+v,box);m.cards=m.cards||[];let pk=el('div',{className:'cardPicker'},box);el('div',{className:'label',textContent:'Choose 1 or 2 City cards ('+m.cards.length+'/2)'},pk);for(let k of state.players[m.from].hand.filter(k=>C[k]))el('button',{className:'miniCard '+C[k].color+(m.cards.includes(k)?' selected':''),textContent:C[k].name,onclick:()=>{m.cards=m.cards.includes(k)?m.cards.filter(x=>x!==k):m.cards.length<2?[...m.cards,k]:m.cards;refresh()}},pk)}
 if(card==='travel_day_night'){m.seat=m.seat??seat;field('Pawn','td_s',seatItems(),m.seat,v=>{m.seat=+v;refresh()},box);let items=byCubes(cityItems(c=>c.id!==state.players[m.seat].city).map(x=>x[0])).map(k=>[k,C[k].name+cubeNote(k)]);if(!items.some(([v])=>v===m.to))m.to=items[0][0];field('Destination','td_c',items,m.to,v=>m.to=v,box)}
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
  return a},consentNeeded(a){a=a||this.args;let c=card==='when_plans_were_good'?a.event:card,x=card==='when_plans_were_good'?a.inner:a;if(c==='mail_correspondence')return 'Do '+plabel(x.seatA)+' and '+plabel(x.seatB)+' agree to swap these cards?';if(c==='telegraph_message')return state.players[x.to]?.name+': do you accept these cards?';if(c==='ships_arrive')return 'Do the moved players agree to travel to '+C[x.city]?.name+'?';if(c==='travel_day_night'&&x.seat!==seat)return plabel(x.seat)+': do you agree to move to '+C[x.to]?.name+'?';return null}}}
function openEvent(seat,card,fromRole){if(['setup','ended'].includes(state.phase)||busy||!mine(seat))return;let box=$('eventForm');box.replaceChildren();$('eventTitle').textContent=plabel(seat)+': '+EVENTS[card];let f=eventForm(card,box,seat);
 $('eventConfirm').onclick=async()=>{let args=f.args,q=f.consentNeeded(args);if(q){let ok=await ask(q);if(!ok){notice('Not agreed — Event not played.');return}if(card==='when_plans_were_good')args.inner.consent=true;else args.consent=true}$('eventDialog').close();if(!await perform({type:'event',seat,card,args,...(fromRole?{fromRole:true}:{})}))showDialog('eventDialog')};showDialog('eventDialog')}

/* ---------- wiring ---------- */
function showDialog(id){if(!$(id).open)$(id).showModal()}
for(let id of ['menu','eventDialog','logDialog']){let d=$(id);d.querySelector('.close').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d)d.close()})}
$('confirm').onclick=async()=>{let cmd=await makeCmd();if(cmd)perform(cmd)};
$('begin').onclick=()=>perform({type:'start',...(Net.active?{}:{cities:state.players.map((_,i)=>sel['start'+i])}),first:+$('firstPlayer').value});
$('nextPhase').onclick=async()=>{if(fxCurrent||fxQueue.length)return;if(state.phase==='actions'&&state.actions>0){let tt=state.players[state.active].role==='time_traveler',n=state.actions;if(!await ask('You still have '+n+' action'+(n>1?'s':'')+' left. End your actions now and '+(tt?'start the infection step?':'draw two Player cards?')))return}perform({type:state.phase==='actions'?'draw':state.phase==='epidemic'?'epidemic':'infect'})};
$('menuButton').onclick=()=>{drawRoleFields();syncChips();showDialog('menu')};
$('logButton').onclick=()=>{let box=$('logContent');box.replaceChildren();let list=el('div',{className:'logList'},box),sub=false;for(let t of state.log.slice(-250)){let lv;if(/^(Turn \d+:|New game|First player:)/.test(t)){lv=0;sub=false}else if(/^(Infect |Epidemic)/.test(t)){lv=1;sub=true}else if(sub&&/^(Outbreak \d|Purification in|Prevention token protects)/.test(t))lv=2;else{lv=1;sub=false}el('div',{className:'logL l'+lv,textContent:t},list)}for(let [title,cards] of [['Player discard pile',state.discard],['Infection discard pile',state.infectionDiscard],['Events in this game',state.eventsInGame]]){el('h3',{textContent:title},box);el('p',{textContent:cards.map(cardName).join(' · ')||'Empty'},box)}el('h3',{textContent:'Roles'},box);for(let q of state.players)el('p',{textContent:roleName(q.role)+': '+ROLE_TEXT[q.role]},box);showDialog('logDialog');box.parentElement.scrollTop=0};
let roleChoice=randRoles();
function drawRoleFields(){let n=+$('playerCount').value,box=$('roleFields');box.replaceChildren();for(let i=0;i<n;i++)field('Role '+(i+1),'role'+i,Object.entries(ROLES),roleChoice[i],v=>{let j=roleChoice.indexOf(v);if(j>=0&&j!==i)roleChoice[j]=roleChoice[i];roleChoice[i]=v;drawRoleFields()},box)}
$('playerCount').onchange=drawRoleFields;
for(let id of ['playerCount','difficulty','fxSpeed'])buttonize($(id));
$('randomRoles').onclick=()=>{roleChoice=randRoles();drawRoleFields()};
$('newGame').onclick=async()=>{if(Net.active){notice('You are in an online room. Use the Online button to leave it or go back to the lobby.',true);$('menu').close();return}if(!await ask('Start a new game? Export a save first if you want to keep this one.'))return;try{let n=+$('playerCount').value;let seed=$('seed').value.trim()||newSeed();state=initial(seed,+$('difficulty').value,roleChoice.slice(0,n));roleChoice=randRoles();drawRoleFields();$('seed').value='';history=[];commands=[];resetFx();mode='';selectedCards=[];recompute();render();autosave();$('menu').close();notice('Choose starting cities.')}catch(e){notice(e.message,true)}};
$('saveButton').onclick=()=>{let u=URL.createObjectURL(new Blob([JSON.stringify(envelope(),null,2)],{type:'application/json'})),a=el('a',{href:u,download:'iberia-save-v09-turn'+state.turn+'.json'});a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};
function restore(o){requireRule(!Net.active,'You are in an online room. Leave it before loading a save.');requireRule(o.app==='iberia-prototype'&&o.mapSignature===MAP_SIGNATURE,'Incompatible save or map');requireRule(/^0\.9\./.test(o.version||''),'This save is from v'+(o.version||'?')+'. Only v0.9 saves can be loaded; start a new game.');invariant(o.state);state=o.state;if(o.settings)applySettings(o.settings,true);commands=Array.isArray(o.commands)?o.commands:[];history=[];mode='';resetFx();selectedCards=[];recompute();render();autosave();$('menu').close();notice('Saved game restored.')}
$('loadButton').onclick=()=>$('loadFile').click();$('loadFile').onchange=async()=>{try{restore(JSON.parse(await $('loadFile').files[0].text()))}catch(e){notice('Load failed: '+e.message,true);$('menu').close()}$('loadFile').value=''};
$('resumeButton').onclick=()=>{try{let raw=localStorage.getItem(SAVE_KEY);requireRule(raw,'No automatic save found in this browser yet. Restore Last Game only works on the device and browser that played the game.');restore(JSON.parse(raw))}catch(e){notice(e.message,true)}};
{let base=/github\.io$/.test(location.hostname)?'':'https://autodax.github.io/iberia/';$('rulesLink').href=base+'docs/Iberia_rulebook.pdf';$('guideLink').href=base+'docs/Guide.pdf'}
function undoLocal(){if(busy||!history.length||state.status!=='playing')return null;let h=history.pop();state=h.state;commands.length=h.commands;mode='';selectedCards=[];resetFx();recompute();render();autosave();return h.label}
async function undo(){if(Net.active){let r=await Net.undo();notice(r.ok?'Undone: '+(r.label||'last action'):r.error,!r.ok);return}let l=undoLocal();if(l)notice('Undone: '+l)}
$('undo').onclick=undo;
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&e.key.toLowerCase()==='z'&&!document.querySelector('dialog[open]')&&!/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName||'')){e.preventDefault();undo()}});
$('assetButton').onclick=()=>$('assetFiles').click();$('assetFiles').onchange=()=>loadAssets([...$('assetFiles').files]);$('assetClear').onclick=()=>{loadAssets([]);$('assetStatus').textContent=REPO_STATUS};
$('showRegions').onchange=()=>{paint();saveSettings()};$('showNames').onchange=()=>{paint();saveSettings()};$('fxSpeed').addEventListener('change',saveSettings);try{applySettings(JSON.parse(localStorage.getItem(SET_KEY)||'null'))}catch(e){}window.addEventListener('resize',fitLayout);
$('muteButton').onclick=e=>{e.stopPropagation();setSound(!sndPrefs.on)};$('sound').onchange=()=>setSound($('sound').checked);$('volume').oninput=()=>{sndPrefs.vol=+$('volume').value/100;saveSound()};$('volume').addEventListener('change',saveSettings);$('volume').onchange=()=>playSound('cube');syncSoundUI();
/* ---------- online play (v0.10) ---------- */
// Everything network-related lives in net.js. This section connects it to the page: which seats are yours,
// the Online dialog (host, join, seats, people), and the hooks net.js uses to run commands on this page.
function safeStore(k){try{return window[k]}catch(e){return null}}
function netSum(){return hash(JSON.stringify({...state,fx:undefined})).toString(16)}
function startGameLocal(seed,difficulty,roles){state=initial(seed,difficulty,roles);history=[];commands=[];resetFx();mode='';selectedCards=[];recompute();render();autosave();notice('Choose starting cities.')}
// Online play uses the relay server when an address is set (src/ice.json, or the Relay box in the Online dialog),
// and otherwise falls back to direct browser-to-browser links, which many networks block.
const p2pTransport=peerJsTransport();let relayCache=null;
let linkRelay='';   // relay address that came with an invite link (used for this visit only)
function relayUrl(){if(linkRelay)return linkRelay;let l='';try{l=(localStorage.getItem('iberia-relay')||'').trim()}catch(e){}if(l==='direct')return '';return l||((typeof NET_ICE!=='undefined'&&NET_ICE.relay_url)||'').trim()}   // 'direct' (set by tests) skips the relay
function builtInRelay(){return((typeof NET_ICE!=='undefined'&&NET_ICE.relay_url)||'').trim()}
function pickTransport(){let u=relayUrl();if(!u)return p2pTransport;if(!relayCache||relayCache.u!==u)relayCache={u,t:wsTransport(u)};return relayCache.t}
const NetTransport={host:(c,f)=>pickTransport().host(c,f),join:c=>pickTransport().join(c),diagnose:()=>pickTransport().diagnose(),forgetIce:()=>p2pTransport.forgetIce()};
const Net=createNet({
  transport:NetTransport,
  version:{ui:UI_VERSION,engine:VERSION,map:MAP_SIGNATURE},
  storage:safeStore('localStorage'),tokenStore:safeStore('sessionStorage'),newSeed,
  hooks:{
    getState:()=>state,
    loadState:s=>{invariant(s);state=s;history=[];commands=[];mode='';selectedCards=[];resetFx();recompute();render()},
    apply:cmd=>{let n;try{n=transact(state,cmd)}catch(e){return {ok:false,error:e.needChoice?'Incomplete choices':e.message}}try{commit(cmd,n,true)}catch(e){console.error(e)}return {ok:true,sum:netSum()}},
    checksum:netSum,
    onStart:g=>startGameLocal(g.seed,g.difficulty,g.roles),
    ask:q=>ask(q),
    undo:undoLocal,undoLabel:()=>history.length?history[history.length-1].label:null
  }
});
function mine(seat){return !Net.active||Net.mine(seat)}
function inLobby(){return !!(Net.active&&Net.lobby&&Net.lobby.phase==='lobby')}
function askSeat(seat,q){return Net.active&&!mine(seat)?Net.askSeat(seat,q):ask(q)}
function seatTag(i){return Net.active&&mine(i)?' (you)':''}
function who(i){if(!Net.active)return '';let o=Net.owner(i);return o?o.name:(Net.name||'')}
function plabel(i){let w=who(i),r=roleName(state.players[i].role);return w?w+' · '+r:r}
function onlineHint(){let h=$('actionHint');if(inLobby()){h.textContent='Start the game from the Online dialog.';return}if(Net.active&&!Net.isHost&&state.status==='playing'&&state.players.every((_,i)=>!mine(i))){h.textContent='You are not controlling any player. Open Online and take a seat.';return}if(!Net.active||state.status!=='playing'||state.phase==='setup'||mine(state.active))return;let o=Net.owner(state.active);h.textContent='Waiting for '+plabel(state.active)+(o?' ('+o.name+')':'')+' to play.'}

const NAME_KEY='iberia-online-name';
let onlinePrev={phase:'',status:'',people:'',seats:'',active:false};
function showOnlineMsg(t,bad){let m=$('onMsg');m.textContent=t||'';m.className='detail'+(bad?' error':'')}
function roomLink(){let r=relayUrl(),extra=r&&r!==builtInRelay()?'&relay='+encodeURIComponent(r):'';return location.origin+location.pathname+'?room='+Net.code+extra}
function drawOnline(){
  let L=Net.lobby,active=Net.active;
  $('onlineStart').hidden=active;$('onlineRoom').hidden=!active;
  $('onlineButton').textContent=active?'Room '+Net.code:'Online';
  $('onlineButton').classList.toggle('live',active&&Net.status==='connected');
  if(!active){let sv=Net.savedHost();$('onResume').hidden=!sv;if(sv)$('onResumeText').textContent='You were hosting room '+sv.code+(sv.phase==='playing'?' with a game in progress':'')+'. Resume it and your guests can rejoin with the same code.';return}
  $('onStatus').textContent=Net.status==='connecting'?'Connecting…':Net.status==='reconnecting'?'Connection lost. Trying to reconnect…':Net.status==='closed'?(Net.error||'Disconnected.'):(Net.isHost?'You are the host. Keep this page open while you play.':'Connected to the host.');
  $('onStatus').className='detail'+(Net.status==='closed'||Net.status==='reconnecting'?' error':'');
  $('onCodeBig').textContent=Net.code;$('onShare').hidden=!Net.isHost;
  if(!L)return;
  let playing=L.phase==='playing',box=$('onSeats');box.replaceChildren();
  // settings: host, before the game starts
  let sb=$('onSettings');sb.replaceChildren();sb.hidden=!(Net.isHost&&!playing);
  if(!sb.hidden){
    let row=el('div',{className:'seatRow'},sb);
    let l1=el('label',{textContent:'Players'},row),s1=el('select',{},l1);for(let n=2;n<=5;n++)el('option',{value:n,textContent:n,selected:n===L.settings.players},s1);s1.onchange=()=>Net.setSettings({players:+s1.value});
    let l2=el('label',{textContent:'Epidemics'},row),s2=el('select',{},l2);for(let [v,t] of [[4,'4 · Introductory'],[5,'5 · Standard'],[6,'6 · Heroic']])el('option',{value:v,textContent:t,selected:v===L.settings.difficulty},s2);s2.onchange=()=>Net.setSettings({difficulty:+s2.value});
  }
  L.seats.forEach((owner,i)=>{
    let role=playing&&state.players[i]?state.players[i].role:L.settings.roles[i];
    let r=el('div',{className:'onSeat'},box);
    let who=el('div',{className:'onRole'},r);pawnIcon(role,who,12);
    if(Net.isHost&&!playing){
      let sel=el('select',{title:'Role'},who);for(let [v,t] of Object.entries(ROLES))el('option',{value:v,textContent:t,selected:v===role},sel);
      sel.onchange=()=>{let roles=L.settings.roles.slice(),j=roles.indexOf(sel.value);if(j>=0&&j!==i)roles[j]=roles[i];roles[i]=sel.value;Net.setSettings({roles})}
    }else el('span',{textContent:roleName(role)},who);
    let by=el('div',{className:'onBy'},r);
    if(Net.isHost){
      let sel=el('select',{title:'Who plays this seat'},by);el('option',{value:'',textContent:'Unassigned'},sel);
      for(let p of L.people)el('option',{value:p.id,textContent:p.name+(p.connected?'':' (away)'),selected:p.id===owner},sel);
      sel.onchange=()=>Net.assign(i,sel.value||null);
    }else{
      let o=L.people.find(p=>p.id===owner);
      if(owner===Net.myId){el('span',{textContent:'You'},by);el('button',{textContent:'Give up',onclick:()=>Net.release(i)},by)}
      else if(o&&!o.connected){el('span',{className:'detail',textContent:o.name+' (away)'},by);el('button',{textContent:'Take over',onclick:()=>Net.claim(i)},by)}
      else if(o)el('span',{textContent:o.name},by);
      else{el('span',{className:'detail',textContent:'Open'},by);el('button',{textContent:'Take this seat',onclick:()=>Net.claim(i)},by)}
    }
  });
  let pb=$('onPeople');pb.replaceChildren();
  for(let p of L.people){let r=el('div',{className:'onPerson'},pb);el('span',{className:'dot'+(p.connected?' on':''),title:p.connected?'Connected':'Away'},r);el('span',{textContent:p.name+(p.host?' (host)':'')+(p.id===Net.myId?' (you)':'')},r)}
  $('onStartGame').hidden=!(Net.isHost&&!playing);$('onBack').hidden=!(Net.isHost&&playing);
  $('onWait').hidden=!(!Net.isHost&&!playing);
  $('onUnclaimed').hidden=!(Net.isHost&&!playing&&L.seats.some(o=>o==null));
}
Net.onChange(()=>{
  let L=Net.lobby;
  // join and leave notices
  let key=L?L.people.map(p=>p.id+':'+p.name+':'+(p.connected?1:0)).join('|'):'';
  if(Net.active&&L&&onlinePrev.people&&key!==onlinePrev.people){
    let was=new Map(onlinePrev.people.split('|').filter(Boolean).map(x=>{let a=x.split(':');return [a[0],a]}));
    for(let p of L.people){let w=was.get(p.id);if(p.id===Net.myId)continue;if(!w)notice(p.name+' joined the room.');else if(w[2]==='1'&&!p.connected)notice(p.name+' lost connection.');else if(w[2]==='0'&&p.connected)notice(p.name+' is back.')}
    for(let [id,w] of was)if(!L.people.some(p=>p.id===id))notice(w[1]+' left the room.');
  }
  onlinePrev.people=key;
  if(Net.notice){notice(Net.notice,true);Net.notice=''}
  if(Net.status!==onlinePrev.status){
    if(Net.status==='reconnecting')notice('Connection to the host lost. Trying to reconnect…',true);
    else if(Net.status==='connected'&&onlinePrev.status==='reconnecting')notice('Reconnected.');
    else if(Net.status==='closed')notice(Net.error||'Disconnected from the room.',true);
    onlinePrev.status=Net.status;
  }
  // the game began: close the dialog for everyone who was waiting in the lobby
  let phase=L?L.phase:'';
  if(onlinePrev.phase==='lobby'&&phase==='playing'){$('onlineDialog').close();notice(Net.isHost?'Choose starting cities, then Begin game.':'The host is choosing starting cities.')}
  let wasActive=onlinePrev.active;onlinePrev.active=Net.active;
  if(phase!==onlinePrev.phase||wasActive!==Net.active){onlinePrev.phase=phase;recompute();render()}
  onlinePrev.phase=phase;
  // seats changed: redraw the board so the right player gets the controls
  let seatKey=L?L.seats.join(','):'';
  if(seatKey!==onlinePrev.seats){onlinePrev.seats=seatKey;if(Net.active&&phase==='playing'){recompute();render()}}
  drawOnline();
});
$('onlineButton').onclick=()=>{$('onName').value=localStorage.getItem(NAME_KEY)||$('onName').value;loadRelayBox();drawOnline();showOnlineMsg('');showDialog('onlineDialog')};
function loadRelayBox(){try{$('onRelayUrl').value=localStorage.getItem('iberia-relay')||''}catch(e){}}
$('onRelaySave').onclick=()=>{try{let v=$('onRelayUrl').value.trim();if(v&&!/^(https?|wss?):\/\/[^\s]+$/i.test(v)){showOnlineMsg('That does not look like a web address. It should start with https://',true);return}if(v)localStorage.setItem('iberia-relay',v);else localStorage.removeItem('iberia-relay');relayCache=null;showOnlineMsg(v?'Relay address saved. Press "Test my connection" to check it.':'Using the built-in relay setting.')}catch(e){showOnlineMsg('Could not save settings in this browser.',true)}};
function describeConnectionTest(r){
  if(r.kind==='relay')return r.ok?'Good. The relay server is reachable, so online play should work on this network.':'Problem. Could not reach the relay server from this network. Check the relay address below, or try another network.';
  let counts=' (direct '+r.host+', internet address '+r.srflx+', relay '+r.relay+')';
  if(r.relay>0)return 'Good. This network can use a relay, so connections should work even on strict networks.'+counts;
  if(r.srflx>0)return 'Partly good. No relay server is set up, so players on phone data or strict networks may not be able to connect. See the README to set one up.'+counts;
  return 'Problem. This network is blocking the way browsers find each other, and no relay server is set up. See the README to set one up.'+counts;
}
$('onTest').onclick=async()=>{let b=$('onTest'),out=$('onTestResult');b.disabled=true;out.textContent='Testing. This takes up to 10 seconds…';try{out.textContent=describeConnectionTest(await NetTransport.diagnose())}catch(e){out.textContent='The test could not run in this browser: '+(e.message||e)}b.disabled=false};
$('onlineDialog').querySelector('.close').onclick=()=>$('onlineDialog').close();
$('onlineDialog').addEventListener('click',e=>{if(e.target===$('onlineDialog'))$('onlineDialog').close()});
function onlineName(){let n=$('onName').value.trim();try{localStorage.setItem(NAME_KEY,n)}catch(e){}return n}
async function onlineDo(btn,f){btn.disabled=true;showOnlineMsg('Connecting…');try{await f();showOnlineMsg('')}catch(e){showOnlineMsg(e.message||String(e),true)}btn.disabled=false;drawOnline()}
$('onHost').onclick=()=>onlineDo($('onHost'),async()=>{if(!await ask('Hosting starts a shared game from the lobby. The board on this page will be replaced when you start. Continue?'))throw Error('');await Net.host(onlineName())});
$('onJoin').onclick=()=>onlineDo($('onJoin'),async()=>{await Net.join($('onCode').value,onlineName())});
$('onCode').addEventListener('keydown',e=>{if(e.key==='Enter')$('onJoin').click()});
$('onResumeBtn').onclick=()=>onlineDo($('onResumeBtn'),async()=>{await Net.resumeHost(onlineName()||'Host')});
$('onName').addEventListener('change',()=>{let n=onlineName();if(Net.active)Net.rename(n)});
$('onCopy').onclick=async()=>{try{await navigator.clipboard.writeText(roomLink());showOnlineMsg('Link copied. Send it to the other players.')}catch(e){showOnlineMsg('Copy this link: '+roomLink())}};
$('onStartGame').onclick=()=>{let r=Net.start();if(!r.ok)showOnlineMsg(r.error,true)};
$('onBack').onclick=async()=>{if(await ask('Take everyone back to the lobby to start a new game? The current game ends.')){let r=Net.backToLobby();if(!r.ok)showOnlineMsg(r.error,true)}};
$('onLeave').onclick=async()=>{if(!await ask(Net.isHost?'Close this room? Everyone is disconnected. The board stays on this page as a game you can keep playing here.':'Leave this room? The board stays on this page as a local game.'))return;Net.leave();$('onlineDialog').close();render();notice('You left the online room.')};
{let r=/[?&]relay=([^&]+)/.exec(location.search);if(r){try{let v=decodeURIComponent(r[1]).trim();if(/^(https?|wss?):\/\/[^\s]+$/i.test(v))linkRelay=v}catch(e){}}
 let m=/[?&]room=([A-Za-z0-9]+)/.exec(location.search);if(m){$('onCode').value=m[1].toUpperCase();setTimeout(()=>{if(!Net.active){$('onName').value=localStorage.getItem(NAME_KEY)||'';drawOnline();showDialog('onlineDialog')}},400)}}

recompute();render();loadRepoAssets();notice('Choose starting cities, then Begin game. Menu → New game sets players and roles.');

// Card size slider (Menu): scales the hover previews and the drawn-card popups; remembered on this device
{let K='iberia-card-size',v=100;try{v=+localStorage.getItem(K)||100}catch(e){}
 let apply=x=>{x=Math.max(50,Math.min(150,x));document.documentElement.style.setProperty('--cs',String(x/100));let i=$('cardSize');if(i)i.value=x;let t=$('cardSizeVal');if(t)t.textContent=x+'%';return x};
 apply(v);$('cardSize').oninput=()=>{v=apply(+$('cardSize').value);try{localStorage.setItem(K,String(v))}catch(e){}}}
