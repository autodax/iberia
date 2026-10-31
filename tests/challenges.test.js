// Node tests for the two challenges: Influx of Patients and Historical Diseases. Run: node tests/challenges.test.js
global.MAP=require('../src/map.js').MAP;
const E=require('../src/engine.js');const {C,ADJ,COLORS,initial,transact,CP,edgeKey}=E;
let pass=0,fail=0;const failures=[];
function ok(v,m){if(v)pass++;else{fail++;failures.push(m)}}
function group(n,f){try{f()}catch(e){fail++;failures.push(n+': '+e.stack.split('\n').slice(0,3).join(' | '))}}
function auto(s,cmd,spread){let ch=[];for(;;){try{return transact(s,{...cmd,choices:ch})}catch(e){if(!e.needChoice)throw e;let o=e.needChoice.options;ch.push(spread?o[ch.length%o.length]:o[0])}}}
function give(s,seat,card){for(let a of [s.playerDeck,s.discard,...s.players.map(p=>p.hand)]){let i=a.indexOf(card);if(i>=0){a.splice(i,1);break}}s.players[seat].hand.push(card);return s}
function begin(opts,roles=['sailor','agronomist'],seed='ch'){let s=initial(seed,4,roles,opts);let cities=s.players.map(p=>p.hand.find(k=>C[k])||'c22');return auto(s,{type:'start',cities,first:0})}
// put exactly n cubes of a color into a city (keeps the cube count right)
function setCubes(s,id,color,n){let d=n-s.cubes[id][color];s.cubes[id][color]=n;s.supply[color]-=d}
function clearBoard(s){for(let c of MAP.cities)for(let k of COLORS){s.supply[k]+=s.cubes[c.id][k];s.cubes[c.id][k]=0}}
function toInfection(s,id){s.phase='infection';s.infectionRemaining=1;s.infectionFromBottom=false;s.revealed=[];s.infectionDeck=s.infectionDeck.filter(x=>x!==id);s.infectionDiscard=s.infectionDiscard.filter(x=>x!==id);s.infectionDeck.unshift(id);return s}
function inf(s,id,spread){return auto(toInfection(s,id),{type:'infect'},spread)}
const total=(s,col)=>MAP.cities.reduce((a,c)=>a+s.cubes[c.id][col],0);
const byColor=col=>MAP.cities.filter(c=>c.color===col).map(c=>c.id);

group('base game unchanged without challenges',()=>{let s=begin({});ok(!s.hospWater&&s.waterSupply===14&&!s.challenges.influx&&s.challenges.hist.length===0,'defaults')});

group('influx: setup',()=>{let s=begin({influx:true});ok(s.waterSupply===6,'6 purification tokens in supply');ok(Object.values(s.hospWater).every(v=>v===2),'2 under each hospital');E.invariant(s)});

group('influx: building a hospital releases tokens and removes cubes',()=>{
 let s=begin({influx:true});clearBoard(s);let id=byColor('yellow')[0];s.players[0].city=id;give(s,0,id);setCubes(s,id,'yellow',2);setCubes(s,id,'blue',1);s.phase='actions';s.actions=4;
 let n=auto(s,{type:'hospital'});
 ok(n.hospitals.yellow===id&&n.waterSupply===8&&n.hospWater.yellow===0,'2 tokens released');ok(n.cubes[id].yellow===0&&n.cubes[id].blue===1,'only the matching color removed');E.invariant(n)});

group('influx: patients move one step toward the hospital',()=>{
 let s=begin({influx:true});clearBoard(s);let h=byColor('yellow')[0];let a=ADJ[h][0],b=ADJ[a].find(x=>x!==h&&!ADJ[h].includes(x));
 s.hospitals.yellow=h;s.hospWater.yellow=0;s.waterSupply=8;
 if(!b){ok(true,'skip');return}
 setCubes(s,b,'yellow',1);s.phase='actions';s.actions=1;
 let n=auto(s,{type:'draw'});
 ok(n.cubes[b].yellow===0&&n.cubes[a].yellow===1,'patient two steps away moved to the middle city');
 ok(n.log.some(l=>/patient moves/.test(l)),'logged')});

group('influx: closest patient moves, ties are a choice, railroads make it fast',()=>{
 let s=begin({influx:true});clearBoard(s);let h=byColor('red')[0];s.hospitals.red=h;s.hospWater.red=0;s.waterSupply=8;
 let far=MAP.cities.map(c=>c.id).find(x=>x!==h&&!ADJ[h].includes(x)&&ADJ[x].some(y=>ADJ[y].includes(h)&&!ADJ[h].includes(x)));
 let mid=ADJ[far].find(y=>ADJ[y].includes(h));let near=ADJ[h].find(y=>y!==mid&&y!==far);
 setCubes(s,far,'red',1);setCubes(s,near,'red',1);s.phase='actions';s.actions=1;
 let n=auto(s,{type:'draw'});ok(n.cubes[near].red===0&&n.cubes[h].red===1&&n.cubes[far].red===1,'the nearer patient moves, not the far one');
 // two tied patients -> a choice is requested
 let t=begin({influx:true});clearBoard(t);t.hospitals.red=h;t.hospWater.red=0;t.waterSupply=8;let n2=ADJ[h].slice(0,2);for(let x of n2)setCubes(t,x,'red',1);t.phase='actions';t.actions=1;
 let asked=false;try{transact(t,{type:'draw',choices:[]})}catch(e){asked=!!e.needChoice}ok(asked,'tie asks which patient');
 // rail: patient two steps away reaches the hospital in one move by rail
 let r=begin({influx:true});clearBoard(r);r.hospitals.red=h;r.hospWater.red=0;r.waterSupply=8;
 r.phase='actions';r.actions=1;
 let a=ADJ[h].find(x=>ADJ[x].some(y=>y!==h&&!ADJ[h].includes(y)&&EDGES_OK(x,y)));
 function EDGES_OK(x,y){return E.EDGES.get(edgeKey(x,y))&&E.EDGES.get(edgeKey(x,y)).railway_allowed&&E.EDGES.get(edgeKey(x,h))&&E.EDGES.get(edgeKey(x,h)).railway_allowed}
 if(a){let y=ADJ[a].find(y=>y!==h&&!ADJ[h].includes(y)&&EDGES_OK(a,y));r.rails=[edgeKey(a,h),edgeKey(a,y)];r.railSupply-=2;setCubes(r,y,'red',1);let nn=auto(r,{type:'draw'});ok(nn.cubes[h].red===1&&nn.cubes[y].red===0,'a patient rides the railroad straight to the hospital')}else ok(true,'skip rail')});

group('influx: overrun when a patient arrives as the 4th',()=>{
 let s=begin({influx:true});clearBoard(s);let h=byColor('black')[0];s.hospitals.black=h;s.hospWater.black=0;s.waterSupply=8;let a=ADJ[h][0];
 setCubes(s,h,'black',3);setCubes(s,a,'black',1);s.phase='actions';s.actions=1;let ob=s.outbreaks;
 let n=auto(s,{type:'draw'});
 ok(n.cubes[h].black===0,'every black cube left the hospital city');ok(n.outbreaks>=ob+1,'outbreak marker advanced');ok(n.log.some(l=>/overrun/.test(l)),'logged');
 ok(n.fx.some(f=>f.kind==='overrun'),'overrun banner');E.invariant(n)});

group('influx: infection into a hospital city with 3 overruns it',()=>{
 let s=begin({influx:true});clearBoard(s);let h=byColor('blue')[0];s.hospitals.blue=h;s.hospWater.blue=0;s.waterSupply=8;setCubes(s,h,'blue',3);
 let n=inf(s,h,true);ok(n.cubes[h].blue===0,'overrun instead of an outbreak');ok(total(n,'blue')===4,'all four cubes (3 + the new one) are on the neighbours');
 ok(!n.log.some(l=>/^Outbreak \d+: /.test(l))||n.log.filter(l=>/^Outbreak \d+: /.test(l)).length===0,'no normal outbreak in the hospital city');
 E.invariant(n)});

group('influx: a hospital in a city that is not the cube color also overruns',()=>{
 let s=begin({influx:true});clearBoard(s);let h=byColor('yellow')[0];s.hospitals.yellow=h;s.hospWater.yellow=0;s.waterSupply=8;
 let c=byColor('blue')[0];s.hospitals.blue=c;s.hospWater.blue=0;s.waterSupply=10;setCubes(s,c,'blue',3);let n=inf(s,c,true);ok(n.cubes[c].blue===0,'blue patients flee a blue hospital');E.invariant(n)});

group('historical: malaria doubles the first black cube',()=>{
 let s=begin({hist:['black']});clearBoard(s);let id=byColor('black')[0];let n=inf(s,id);ok(n.cubes[id].black===2,'2 black cubes in an empty city');
 let s2=begin({hist:['black']});clearBoard(s2);setCubes(s2,id,'black',1);let n2=inf(s2,id);ok(n2.cubes[id].black===2,'only +1 when the city already has black');
 let s3=begin({});clearBoard(s3);let n3=inf(s3,id);ok(n3.cubes[id].black===1,'not active without the card');E.invariant(n)});

group('historical: typhus costs 2 actions with 2+ red cubes',()=>{
 let s=begin({hist:['red']});clearBoard(s);let id=byColor('red')[0];s.players[0].city=id;setCubes(s,id,'red',2);s.phase='actions';s.actions=4;
 let n=auto(s,{type:'treat',color:'red'});ok(n.actions===2&&n.cubes[id].red===1,'2 actions for the first cube');
 let n2=auto(n,{type:'treat',color:'red'});ok(n2.actions===1&&n2.cubes[id].red===0,'then 1 action for the last cube');
 let s1=CP(s);s1.actions=1;let threw=false;try{auto(s1,{type:'treat',color:'red'})}catch(e){threw=true}ok(threw,'cannot treat with only 1 action left');
 let s3=begin({});clearBoard(s3);s3.players[0].city=id;setCubes(s3,id,'red',2);s3.phase='actions';s3.actions=4;ok(auto(s3,{type:'treat',color:'red'}).actions===3,'1 action without the card')});

group('historical: cholera spreads two connections away into empty cities',()=>{
 let s=begin({hist:['blue']});clearBoard(s);let id=byColor('blue')[0];setCubes(s,id,'blue',3);
 let n1=new Set(ADJ[id]),two=[];for(let a of ADJ[id])for(let b of ADJ[a])if(b!==id&&!n1.has(b)&&!two.includes(b))two.push(b);
 // one two-away city already has a cube of another color
 let occupied=two[0];setCubes(s,occupied,'red',1);
 let n=inf(s,id);
 ok(ADJ[id].every(a=>n.cubes[a].blue>=1),'neighbours get blue');
 ok(two.slice(1).every(b=>n.cubes[b].blue>=1),'empty cities 2 away get blue');ok(n.cubes[occupied].blue===0,'a city 2 away that already has cubes does not');
 let s2=begin({});clearBoard(s2);setCubes(s2,id,'blue',3);let m=inf(s2,id);ok(two.every(b=>m.cubes[b].blue===0),'not active without the card')});

group('historical: yellow fever spreads to adjacent ports',()=>{
 let s=begin({hist:['yellow']});clearBoard(s);let id=MAP.cities.find(c=>c.color==='yellow'&&c.port&&ADJ[c.id].some(n=>C[n].port)).id;let n=inf(s,id);
 ok(n.cubes[id].yellow===1,'the infected port');ok(ADJ[id].filter(x=>C[x].port).every(x=>n.cubes[x].yellow===1),'every adjacent port city gets yellow');
 ok(ADJ[id].filter(x=>!C[x].port).every(x=>n.cubes[x].yellow===0),'inland neighbours do not');
 let q=MAP.cities.find(c=>c.color==='yellow'&&!c.port);let s2=begin({hist:['yellow']});clearBoard(s2);let n2=inf(s2,q.id);ok(total(n2,'yellow')===1,'inland city does not spread');E.invariant(n)});

group('challenges together over many random games (stability)',()=>{
 let games=0,cmds=0;for(let g=0;g<150;g++){let hs=COLORS.filter((_,i)=>(g>>i)&1);let s=begin({influx:g%2===0,hist:hs},['sailor','agronomist','politician'][g%3]?['sailor','agronomist','politician'].slice(0,2+g%2):['sailor','agronomist'],'cg'+g);
  let r=E.hash('x'+g),guard=0;while(s.status==='playing'&&guard++<3000){let full=E.fullHands(s),cmd;
   if(full.length&&s.phase!=='epidemic'){let q=s.players[full[0]];cmd={type:'discard',seat:full[0],card:q.hand.find(k=>C[k])||q.hand[0]}}
   else if(s.phase==='actions'){let p=s.players[s.active];r=(Math.imul(r,1664525)+1013904223)>>>0;if(s.actions>0&&r%3){let o=ADJ[p.city];cmd={type:'carriage',to:o[r%o.length]}}else if(s.actions>0&&r%5===0&&COLORS.some(k=>s.cubes[p.city][k]>0)){cmd={type:'treat',color:COLORS.find(k=>s.cubes[p.city][k]>0)}}else cmd={type:'draw'}}
   else if(s.phase==='epidemic')cmd={type:'epidemic'};else cmd={type:'infect'};
   try{s=auto(s,cmd)}catch(e){if(cmd.type==='treat'){s=auto(s,{type:'draw'})}else throw e};cmds++}
  games++}
 ok(games===150,'150 games with challenges all ran: '+cmds+' commands')});

console.log(pass+' checks passed, '+fail+' failed');if(fail){console.log(failures.map(f=>' - '+f).join('\n'));process.exit(1)}
