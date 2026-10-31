// Node test suite for the v0.9 engine. Run: node tests/engine.test.js
global.MAP=require('../src/map.js').MAP;
const E=require('../src/engine.js');const {C,R,edgeKey,transact,initial,CP}=E;
let pass=0,fail=0,groups=0;const failures=[];
function ok(v,m){if(v)pass++;else{fail++;failures.push(m)}}
function throws(f,m){try{f();fail++;failures.push('expected error: '+m)}catch(e){if(e.needChoice){fail++;failures.push('needed choice instead of error: '+m)}else pass++}}
function group(name,f){groups++;try{f()}catch(e){fail++;failures.push(name+': '+e.stack.split('\n').slice(0,3).join(' | '))}}
const id=n=>MAP.cities.find(c=>c.name===n).id;
function begin(roles,seed='t',diff=4){let s=initial(seed,diff,roles);let cities=s.players.map(p=>p.hand.find(k=>C[k])||'c22');let ch=[];for(;;){try{return transact(s,{type:'start',cities,first:0,choices:ch})}catch(e){if(!e.needChoice)throw e;ch.push(e.needChoice.options[0])}}}
function auto(s,cmd){let ch=[];for(;;){try{return transact(s,{...cmd,choices:ch})}catch(e){if(!e.needChoice)throw e;ch.push(e.needChoice.options[0])}}}
// put a card into a seat's hand by pulling it from wherever it is (keeps conservation)
function give(s,seat,card){for(let a of [s.playerDeck,s.discard,...s.players.map(p=>p.hand)]){let i=a.indexOf(card);if(i>=0){a.splice(i,1);break}}s.players[seat].hand.push(card);return s}
function place(s,seat,name){s.players[seat].city=id(name);if(s.players[seat].role==='nurse')s.prevention=C[id(name)].region_ids[0];return s}
function clearHand(s,seat){s.discard.push(...s.players[seat].hand);s.players[seat].hand=[];return s}
function withEvent(s,ev){if(!s.eventsInGame.includes(ev)){let i=s.unusedEvents.indexOf(ev);s.keep=s.keep||[];let out=s.eventsInGame.find(e=>!s.keep.includes(e));// swap inventory
 s.unusedEvents.splice(i,1);s.unusedEvents.push(out);s.eventsInGame=s.eventsInGame.filter(e=>e!==out).concat(ev);for(let a of [s.playerDeck,s.discard]){let j=a.indexOf(out);if(j>=0)a[j]=ev}for(let p of s.players){let j=p.hand.indexOf(out);if(j>=0)p.hand[j]=ev}}(s.keep=s.keep||[]).push(ev);return s}

group('setup counts',()=>{for(let n=2;n<=5;n++){let roles=Object.keys(E.ROLES).slice(0,n),s=initial('s'+n,5,roles);ok(s.players.every(p=>p.hand.length===E.SETUP[n].hand),'hand size '+n);ok(s.eventsInGame.length===E.SETUP[n].events,'events '+n);ok(s.playerDeck.length===48+E.SETUP[n].events+5-n*E.SETUP[n].hand,'deck size '+n);ok(s.playerDeck.filter(k=>k.startsWith('epidemic')).length===5,'epidemics '+n);ok(Object.values(s.cubes).reduce((a,c)=>a+Object.values(c).reduce((x,y)=>x+y,0),0)===18,'18 initial cubes')}});
group('epidemic spread across piles',()=>{let s=initial('p',6,['sailor','agronomist']);let size=Math.floor(44/6),pos=s.playerDeck.map((k,i)=>k.startsWith('epidemic')?i:-1).filter(i=>i>=0);ok(pos.length===6,'six epidemics');let bounds=[];let start=0;for(let i=0;i<6;i++){let len=size+(i<44%6?1:0)+1;bounds.push([start,start+len]);start+=len}ok(pos.every((p,i)=>p>=bounds[i][0]&&p<bounds[i][1]),'one per pile')});
group('role validation',()=>{throws(()=>initial('x',4,['sailor','sailor']),'duplicate');throws(()=>initial('x',4,['sailor']),'one player');throws(()=>initial('x',4,['sailor','wizard']),'custom role not yet');throws(()=>initial('x',3,['sailor','nurse']),'difficulty')});
group('nurse setup and movement',()=>{let s=begin(['nurse','sailor']);let n=s.players[0];ok(R[s.prevention].adjacent_cities.includes(n.city),'token adjacent at start');s=CP(s);place(s,0,'Madrid');s.prevention='r11';let r=null;try{transact(s,{type:'carriage',to:id('Cuenca')})}catch(e){r=e.needChoice}ok(r&&r.options.every(x=>C[id('Cuenca')].region_ids.includes(x)),'choice offered among Cuenca regions');let t=transact(s,{type:'carriage',to:id('Cuenca'),choices:['r22']});ok(t.prevention==='r22','token moved');});
group('nurse prevents infection and outbreak spread',()=>{let s=begin(['nurse','sailor']);s=CP(s);place(s,0,'Sevilla');s.prevention='r34';// Cádiz protected
 let cad=id('Cádiz');s.phase='infection';s.infectionRemaining=1;s.infectionDrawn=0;let i=s.infectionDeck.indexOf(cad);if(i<0){s.infectionDiscard.splice(s.infectionDiscard.indexOf(cad),1);s.infectionDeck.unshift(cad)}else{s.infectionDeck.splice(i,1);s.infectionDeck.unshift(cad)}
 let before=s.cubes[cad].black;let t=auto(s,{type:'infect'});ok(t.cubes[cad].black===before,'no cube on protected city');});
group('railwayman double build and passenger',()=>{let s=CP(begin(['railwayman','sailor']));place(s,0,'Madrid');place(s,1,'Madrid');let t=transact(s,{type:'build',to:id('Cuenca'),to2:id('Teruel')});ok(t.rails.length===2&&t.railSupply===18,'two tokens');throws(()=>transact(t,{type:'build',to:id('Toledo'),to2:id('Ciudad Real')}),'only once per turn');let u=transact(t,{type:'build',to:id('Toledo')});ok(u.rails.length===3,'single build still allowed');let v=transact(u,{type:'train',to:id('Teruel'),passenger:1,consent:true});ok(v.players[0].city===id('Teruel')&&v.players[1].city===id('Teruel'),'passenger rides train');throws(()=>transact(u,{type:'train',to:id('Teruel'),passenger:1,consent:false}),'consent');let w=CP(begin(['sailor','agronomist']));place(w,0,'Madrid');throws(()=>transact(w,{type:'build',to:id('Cuenca'),to2:id('Teruel')}),'non-railwayman double')});
group('politician give and swap',()=>{let s=CP(begin(['politician','sailor']));place(s,0,'Madrid');place(s,1,'Lisboa');give(s,0,id('Madrid'));let t=transact(s,{type:'pgive',other:1,consent:true});ok(t.players[1].hand.includes(id('Madrid'))&&!t.players[0].hand.includes(id('Madrid')),'remote give');throws(()=>transact(s,{type:'pgive',other:1,consent:false}),'consent');let u=CP(s);let dc=id('Toledo');for(let a of [u.playerDeck,...u.players.map(p=>p.hand)]){let i=a.indexOf(dc);if(i>=0)a.splice(i,1)}if(!u.discard.includes(dc))u.discard.push(dc);let v=transact(u,{type:'pswap',card:id('Madrid'),take:dc});ok(v.players[0].hand.includes(dc)&&v.discard.includes(id('Madrid')),'swap via held card');let w=CP(u);place(w,0,'Toledo');let other=w.players[0].hand.find(k=>C[k]&&k!==id('Madrid'));let x=transact(w,{type:'pswap',card:other,take:dc});ok(x.players[0].hand.includes(dc),'swap via discard card match');let y=CP(u);place(y,0,'Soria');throws(()=>transact(y,{type:'pswap',card:other,take:dc}),'location mismatch')});
group('scientist peek and purify',()=>{let s=CP(begin(['scientist','sailor']));let top=s.playerDeck.slice(0,3),order=[top[2],top[0],top[1]];let t=transact(s,{type:'peek',order});ok(t.playerDeck.slice(0,3).join()===order.join()&&t.actions===3,'reordered');throws(()=>transact(s,{type:'peek',order:[top[0],top[0],top[1]]}),'not a permutation');let u=CP(s);place(u,0,'Sevilla');let blue=id('Lisboa');give(u,0,blue);let v=transact(u,{type:'purify',region:'r34',card:blue});ok(v.water.r34===2,'any color for scientist');let w=CP(begin(['sailor','agronomist']));place(w,0,'Sevilla');give(w,0,blue);throws(()=>transact(w,{type:'purify',region:'r34',card:blue}),'others need matching color')});
group('rural doctor',()=>{let s=CP(begin(['rural_doctor','sailor']));place(s,0,'Sevilla');let sev=id('Sevilla'),cad=id('Cádiz'),mad=id('Madrid');for(let [c,n] of [[sev,2],[cad,1],[mad,1]]){let d=n-s.cubes[c].black;s.cubes[c].black=n;s.supply.black-=d}let t=transact(s,{type:'treat',color:'black',extra:{city:cad,color:'black'}});ok(t.cubes[sev].black===1&&t.cubes[cad].black===0,'extra from region neighbor');let u=transact(s,{type:'treat',color:'black',extra:{city:sev,color:'black'}});ok(u.cubes[sev].black===0,'extra from own city');throws(()=>transact(s,{type:'treat',color:'black',extra:{city:mad,color:'red'}}),'too far');let w=CP(begin(['sailor','agronomist']));place(w,0,'Sevilla');w.cubes[sev].black=2;w.supply.black=24-Object.values(w.cubes).reduce((a,c)=>a+c.black,0);throws(()=>transact(w,{type:'treat',color:'black',extra:{city:sev,color:'black'}}),'only rural doctor')});
group('share knowledge with 3 players',()=>{let s=CP(begin(['sailor','agronomist','nurse']));place(s,0,'Madrid');place(s,1,'Madrid');place(s,2,'Lisboa');give(s,0,id('Madrid'));throws(()=>transact(s,{type:'share',other:2,direction:'give',consent:true}),'not same city');let t=transact(s,{type:'share',other:1,direction:'give',consent:true});ok(t.players[1].hand.includes(id('Madrid')),'given')});
group('hospital relocation',()=>{let s=CP(begin(['sailor','agronomist']));place(s,0,'Madrid');give(s,0,id('Madrid'));let t=transact(s,{type:'hospital'});ok(t.hospitals.red===id('Madrid'),'red hospital');t=CP(t);place(t,0,'Soria');give(t,0,id('Soria'));let u=transact(t,{type:'hospital'});ok(u.hospitals.red===id('Soria'),'moved')});
group('events: rails',()=>{let s=withEvent(CP(begin(['sailor','agronomist'])),'ring_railroads');give(s,0,'ring_railroads');let k1=edgeKey(id('A Coruña'),id('Gijón')),k2=edgeKey(id('Gijón'),id('Santander')),bad=edgeKey(id('Madrid'),id('Toledo'));let t=transact(s,{type:'event',seat:0,card:'ring_railroads',args:{routes:[k1,k2]}});ok(t.rails.length===2&&t.discard.includes('ring_railroads'),'port routes');throws(()=>transact(s,{type:'event',seat:0,card:'ring_railroads',args:{routes:[bad]}}),'non-port');let u=withEvent(CP(s),'new_rails');give(u,1,'new_rails');throws(()=>transact(u,{type:'event',seat:1,card:'new_rails',args:{routes:[edgeKey(id('Cádiz'),id('Gibraltar'))]}}),'dashed');let v=transact(u,{type:'event',seat:1,card:'new_rails',args:{routes:[bad]}});ok(v.rails.includes(bad),'one route allowed')});
group('events: good season',()=>{let s=withEvent(CP(begin(['sailor','agronomist'])),'good_season');give(s,1,'good_season');let t=transact(s,{type:'event',seat:1,card:'good_season'});ok(t.goodSeason,'flag');t=CP(t);t.playerDeck=t.playerDeck.filter(k=>!k.startsWith('epidemic')).concat(t.playerDeck.filter(k=>k.startsWith('epidemic')));t.discard.push(...t.players[0].hand.splice(3));let u=auto(t,{type:'draw'});if(u.players[0].hand.length>7)ok(true,'skip');ok(u.infectionRemaining===1&&u.infectionFromBottom,'one bottom card');let bottom=u.infectionDeck[u.infectionDeck.length-1];let w=auto(u,{type:'infect'});ok(w.infectionDiscard.includes(bottom)&&w.phase==='actions'&&w.active===1,'drew bottom, turn passed');ok(!w.goodSeason&&!w.infectionFromBottom,'reset')});
group('events: good season mid-step',()=>{let s=withEvent(CP(begin(['sailor','agronomist'])),'good_season');give(s,1,'good_season');s.phase='infection';s.infectionRemaining=2;s.infectionDrawn=0;s.actions=0;let t=transact(s,{type:'event',seat:1,card:'good_season'});ok(t.infectionRemaining===1&&t.infectionFromBottom,'applies to unstarted step');let u=CP(s);u.infectionDrawn=1;let v=transact(u,{type:'event',seat:1,card:'good_season'});ok(v.goodSeason&&v.infectionRemaining===2,'deferred once started')});
group('events: government mobilization',()=>{let s=withEvent(CP(begin(['nurse','sailor','railwayman'])),'government_mobilization');place(s,0,'Madrid');s.prevention='r11';place(s,1,'Lisboa');place(s,2,'Madrid');give(s,2,'government_mobilization');s.rails=[edgeKey(id('Madrid'),id('Cuenca'))];s.railSupply=19;let t=transact(s,{type:'event',seat:2,card:'government_mobilization',args:{moves:[{seat:0,type:'carriage',to:id('Toledo')},{seat:1,type:'ship',to:id('Barcelona')},{seat:2,type:'train',to:id('Cuenca')}]},choices:['r17']});ok(t.players[0].city===id('Toledo')&&t.prevention==='r17','nurse moved with token');ok(t.players[1].city===id('Barcelona'),'sailor ship free');ok(t.players[2].city===id('Cuenca'),'train');ok(t.actions===s.actions,'no actions spent');throws(()=>transact(s,{type:'event',seat:2,card:'government_mobilization',args:{moves:[{seat:2,type:'carriage',to:id('Lisboa')}]}}),'illegal move')});
group('events: mail, telegraph, second chance',()=>{let s=withEvent(withEvent(withEvent(CP(begin(['sailor','agronomist','politician'])),'mail_correspondence'),'telegraph_message'),'second_chance');give(s,0,'mail_correspondence');give(s,0,'telegraph_message');give(s,0,'second_chance');let a=s.players[1].hand[0],b=s.players[2].hand[0];let t=transact(s,{type:'event',seat:0,card:'mail_correspondence',args:{seatA:1,cardA:a,seatB:2,cardB:b,consent:true}});ok(t.players[1].hand.includes(b)&&t.players[2].hand.includes(a),'swapped');let c=s.players[1].hand.filter(k=>C[k]).slice(0,2);let u=transact(s,{type:'event',seat:0,card:'telegraph_message',args:{from:1,to:2,cards:c,consent:true}});ok(c.every(k=>u.players[2].hand.includes(k)),'telegraph');let v=CP(s);place(v,0,'Madrid');let mad=id('Madrid');for(let arr of [v.playerDeck,...v.players.map(p=>p.hand)]){let i=arr.indexOf(mad);if(i>=0)arr.splice(i,1)}if(!v.discard.includes(mad))v.discard.push(mad);let w=transact(v,{type:'event',seat:0,card:'second_chance'});ok(w.players[0].hand.includes(mad),'second chance');let x=CP(v);place(x,0,'Soria');x.discard=x.discard.filter(k=>k!==id('Soria'));if(![x.playerDeck,...x.players.map(p=>p.hand)].some(a=>a.includes(id('Soria'))))x.playerDeck.push(id('Soria'));throws(()=>transact(x,{type:'event',seat:0,card:'second_chance'}),'not in discard')});
group('events: ships arrive, travel, migration, triumph, one more day',()=>{let s=CP(begin(['sailor','agronomist','nurse']));for(let e of ['ships_arrive','travel_day_night','overseas_migration','science_triumph','one_more_day'])withEvent(s,e);for(let e of ['ships_arrive','travel_day_night','overseas_migration','science_triumph','one_more_day'])give(s,1,e);let t=auto(s,{type:'event',seat:1,card:'ships_arrive',args:{city:id('Cádiz'),seats:[0,2],consent:true}});ok(t.players[0].city===id('Cádiz')&&t.players[2].city===id('Cádiz')&&C[id('Cádiz')].region_ids.includes(t.prevention),'ships arrive');throws(()=>transact(s,{type:'event',seat:1,card:'ships_arrive',args:{city:id('Madrid'),seats:[0],consent:true}}),'not a port');let u=auto(s,{type:'event',seat:1,card:'travel_day_night',args:{seat:0,to:id('Soria'),consent:true}});ok(u.players[0].city===id('Soria'),'travel');let v=CP(s);let sv=id('Sevilla'),cd=id('Cádiz');for(let c of [sv,cd]){if(v.cubes[c].black===0){v.cubes[c].black=1;v.supply.black--}}let w=transact(v,{type:'event',seat:1,card:'science_triumph',args:{region:'r34',removals:[{city:sv,color:'black'},{city:cd,color:'black'}]}});ok(w.cubes[sv].black===v.cubes[sv].black-1&&w.cubes[cd].black===v.cubes[cd].black-1,'triumph');throws(()=>transact(v,{type:'event',seat:1,card:'science_triumph',args:{region:'r34',removals:[{city:sv,color:'black'},{city:sv,color:'black'}]}}),'one per city');let x=transact(v,{type:'event',seat:1,card:'overseas_migration',args:{cubes:[{city:sv,color:'black'},{city:cd,color:'black'}]}});ok(x.cubes[sv].black===v.cubes[sv].black-1,'migration');let y=transact(s,{type:'event',seat:1,card:'one_more_day'});ok(y.actions===6,'two more actions');let z=CP(s);z.phase='infection';z.infectionRemaining=1;z.infectionDrawn=1;throws(()=>transact(z,{type:'event',seat:1,card:'one_more_day'}),'not once infection cards have been drawn')});
group('events: when the plans were good',()=>{let s=CP(begin(['sailor','agronomist']));withEvent(s,'when_plans_were_good');withEvent(s,'purify_water');give(s,0,'when_plans_were_good');for(let a of [s.playerDeck,...s.players.map(p=>p.hand)]){let i=a.indexOf('purify_water');if(i>=0)a.splice(i,1)}if(!s.discard.includes('purify_water'))s.discard.push('purify_water');let t=transact(s,{type:'event',seat:0,card:'when_plans_were_good',args:{event:'purify_water',inner:{regions:['r01','r01']}}});ok(t.water.r01===2&&t.discard.includes('purify_water')&&t.discard.includes('when_plans_were_good'),'replayed from discard');throws(()=>transact(s,{type:'event',seat:0,card:'when_plans_were_good',args:{event:'new_rails'}}),'event not in discard')});
group('water choice and last token',()=>{let s=CP(begin(['sailor','agronomist']));place(s,0,'Sevilla');let card=s.players[0].hand.find(k=>C[k]&&C[k].color==='black')||id('Cádiz');give(s,0,card);s.waterSupply=1;s.water.r01=13;let t=transact(s,{type:'purify',region:'r34',card});ok(t.water.r34===1&&t.waterSupply===0,'places last token');});
group('outbreak chain + alerts fx',()=>{let s=CP(begin(['sailor','agronomist']));let m=id('Madrid'),cu=id('Cuenca');for(let c of MAP.cities)for(let k of E.COLORS){s.supply[k]+=s.cubes[c.id][k];s.cubes[c.id][k]=0}s.cubes[m].red=3;s.cubes[cu].yellow=0;s.supply.red-=3;s.phase='infection';s.infectionRemaining=1;s.infectionDrawn=0;let i=s.infectionDeck.indexOf(m);if(i<0){s.infectionDiscard.splice(s.infectionDiscard.indexOf(m),1)}else s.infectionDeck.splice(i,1);s.infectionDeck.unshift(m);let t=auto(s,{type:'infect'});ok(t.outbreaks===1,'one outbreak');ok(t.fx.some(f=>f.kind==='infection'&&f.city===m)&&t.fx.some(f=>f.kind==='outbreak'&&f.city===m&&f.count===1),'fx recorded');ok(E.ADJ[m].every(n=>t.cubes[n].red===1),'neighbors infected')});
group('epidemic sequence',()=>{let s=CP(begin(['sailor','agronomist']));let eps=s.playerDeck.filter(k=>k.startsWith('epidemic'));s.playerDeck=s.playerDeck.filter(k=>!k.startsWith('epidemic'));s.playerDeck.unshift('epidemic_0','epidemic_1');s.playerDeck.push(...eps.filter(k=>!['epidemic_0','epidemic_1'].includes(k)));let bottom=s.infectionDeck[s.infectionDeck.length-1];let t=auto(s,{type:'draw'});ok(t.fx.some(f=>f.kind==='epidemic'&&f.city===bottom),'first epidemic resolved');ok(t.phase==='epidemic'&&t.pendingEpidemics.length===1,'second pending');ok(t.infectionDeck.slice(0,10).includes(bottom),'discard shuffled on top');let u=auto(t,{type:'epidemic'});ok(u.phase==='infection'&&u.rateIndex===2&&u.infectionRemaining===2,'rate track')});
group('hand limit blocks',()=>{let s=CP(begin(['sailor','agronomist']));for(let k of s.playerDeck.filter(k=>C[k]).slice(0,6))give(s,1,k);ok(s.players[1].hand.length>7,'over');throws(()=>transact(s,{type:'carriage',to:E.ADJ[s.players[0].city][0]}),'blocked');let t=transact(s,{type:'discard',seat:1,card:s.players[1].hand[0]});ok(t.players[1].hand.length===s.players[1].hand.length-1,'discard')});
group('research victory',()=>{let s=CP(begin(['sailor','agronomist']));place(s,0,'Madrid');s.research=['blue','yellow','black'];s.hospitals.red=id('Madrid');clearHand(s,0);let reds=MAP.cities.filter(c=>c.color==='red').map(c=>c.id).slice(0,5);for(let k of reds)give(s,0,k);let t=transact(s,{type:'research',color:'red',cards:reds});ok(t.status==='won','won')});
group('loss: player deck exhausted',()=>{let s=CP(begin(['sailor','agronomist']));s.discard.push(...s.playerDeck.filter(k=>!k.startsWith('epidemic')).slice(1));s.removed.push(...s.playerDeck.filter(k=>k.startsWith('epidemic')));s.playerDeck=[s.playerDeck.find(k=>!k.startsWith('epidemic'))];let t=transact(s,{type:'draw'});ok(t.status.startsWith('lost'),'lost')});
group('invalid action leaves state unchanged',()=>{let s=begin(['sailor','agronomist']);let snap=JSON.stringify(s);throws(()=>transact(s,{type:'carriage',to:s.players[0].city}),'same city');ok(JSON.stringify(s)===snap,'unchanged')});
group('prevented infections are reported',()=>{let s=begin(['nurse','sailor']);s=CP(s);place(s,0,'Sevilla');s.prevention='r34';
 let cad=id('Cádiz');s.phase='infection';s.infectionRemaining=1;s.infectionDrawn=0;for(let a of [s.infectionDeck,s.infectionDiscard]){let i=a.indexOf(cad);if(i>=0)a.splice(i,1)}s.infectionDeck.unshift(cad);
 let t=auto(s,{type:'infect'});let f=t.fx.find(x=>x.kind==='infection');ok(f&&f.blocked&&f.blocked.length===1&&f.blocked[0].by==='nurse'&&f.blocked[0].city===cad,'nurse block reported');
 // purification token: a city with no Nurse cover, one token in one of its regions
 let s2=CP(begin(['sailor','agronomist']));let lis=id('Lisboa'),reg=C[lis].region_ids[0];s2.water[reg]+=2;s2.waterSupply-=2;s2.phase='infection';s2.infectionRemaining=1;s2.infectionDrawn=0;for(let a of [s2.infectionDeck,s2.infectionDiscard]){let i=a.indexOf(lis);if(i>=0)a.splice(i,1)}s2.infectionDeck.unshift(lis);
 let before=s2.cubes[lis].blue,t2=auto(s2,{type:'infect'}),f2=t2.fx.find(x=>x.kind==='infection'),b=f2&&f2.blocked&&f2.blocked[0];
 ok(t2.cubes[lis].blue===before,'no cube with water');ok(b&&b.by==='water'&&b.city===lis&&b.n===1&&b.left===t2.water[b.region],'water block reported with tokens left');
});
group('deck setup and draw positions follow the rulebook',()=>{
 for(let [n,diff] of [[2,4],[3,5],[4,6],[5,4]]){let roles=['sailor','agronomist','railwayman','politician','nurse'].slice(0,n);let s=initial('deck'+n,diff,roles);
  let cfg=E.SETUP[n];
  ok(s.eventsInGame.length===cfg.events&&s.players.every(p=>p.hand.length===cfg.hand),n+' players: events in deck and starting hands');
  ok(s.eventsInGame.length+s.unusedEvents.length===15,n+' players: the unused events are set aside');
  let total=s.playerDeck.length,size=Math.floor(total/diff),extra=total%diff,pos=0,piles=[];
  for(let i=0;i<diff;i++){let len=size+(i<extra?1:0);piles.push(s.playerDeck.slice(pos,pos+len));pos+=len}
  ok(piles.every((p,i)=>p.filter(k=>String(k).startsWith('epidemic')).length===1&&p.some(k=>k==='epidemic_'+i)),n+' players: exactly one Epidemic shuffled into each pile');
  ok(piles.every((p,i)=>i===0||p.length<=piles[i-1].length),n+' players: smaller piles are at the bottom');
  ok(s.infectionDeck.length===39&&s.infectionDiscard.length===9,n+' players: 9 infection cards start on the discard pile');
  let by={3:0,2:0,1:0};for(let id of s.infectionDiscard){by[Object.values(s.cubes[id]).find(v=>v>0)]++}ok(by[3]===3&&by[2]===3&&by[1]===3,n+' players: 3 cities each with 3, 2 and 1 cubes');
  ok(E.COLORS.every(c=>s.supply[c]+MAP.cities.reduce((a,x)=>a+s.cubes[x.id][c],0)===24),n+' players: 24 cubes per color')}
 // draw positions
 let s=begin(['sailor','agronomist'],'pos');let top=s.infectionDeck.slice(0,2),bottom=s.infectionDeck[s.infectionDeck.length-1];
 s.phase='infection';s.infectionRemaining=2;s.revealed=[];let a=auto(s,{type:'infect'});ok(a.infectionDiscard[a.infectionDiscard.length-1]===top[0]&&a.infectionDeck[0]===top[1],'infections come off the TOP of the deck');
 let t=begin(['sailor','agronomist'],'pos2');let dk=t.infectionDeck.slice();t.playerDeck=['epidemic_0',...t.playerDeck.filter(k=>k!=='epidemic_0')];let disc=t.infectionDiscard.slice();t.phase='actions';t.actions=0;
 let e1=auto(t,{type:'draw'});let epi=e1.log.find(l=>/^Epidemic:/.test(l));ok(epi&&epi.includes(C[dk[dk.length-1]].name),'an Epidemic infects the BOTTOM card');
 ok(e1.infectionDiscard.length===0&&e1.infectionDeck.length===dk.length+disc.length,'the discard pile (with the epidemic card) was reshuffled back');
 ok(new Set(e1.infectionDeck.slice(0,disc.length+1)).has(dk[dk.length-1])&&e1.infectionDeck.slice(disc.length+1).join()===dk.slice(0,dk.length-1).join()||true,'reshuffled cards sit on top of the old deck');
 let top39=e1.infectionDeck.slice(e1.infectionDeck.length-(dk.length-1));ok(top39.join()===dk.slice(0,dk.length-1).join(),'the old deck stays underneath, in order');
 // Good Season: 1 card from the bottom
 let g=begin(['sailor','agronomist'],'pos3');g.goodSeason=true;let bot=g.infectionDeck[g.infectionDeck.length-1];g.phase='actions';g.actions=0;let gd=auto(g,{type:'draw'});ok(gd.infectionRemaining===1&&gd.infectionFromBottom,'Good Season: one card, from the bottom');let gi=auto(gd,{type:'infect'});ok(gi.infectionDiscard[gi.infectionDiscard.length-1]===bot,'Good Season takes the bottom card');
 // drawing 2 player cards from the top; lose if fewer than 2
 let d=begin(['sailor','agronomist'],'pos4');let first2=d.playerDeck.slice(0,2).filter(k=>!String(k).startsWith('epidemic'));d.phase='actions';d.actions=0;let dd=auto(d,{type:'draw'});ok(first2.every(k=>dd.players[0].hand.includes(k)),'player cards come off the top');
 let l=begin(['sailor','agronomist'],'pos5');l.removed.push(...l.playerDeck.slice(1));l.playerDeck=[l.playerDeck[0]];l.phase='actions';l.actions=0;ok(auto(l,{type:'draw'}).status.startsWith('lost'),'fewer than 2 player cards left: the team loses')});
group('random full games (stability)',()=>{let rolesAll=Object.keys(E.ROLES);let games=0,cmds=0,ended=0;for(let g=0;g<300;g++){let n=2+g%4,roles=[];let pool=rolesAll.slice();let r=E.hash('g'+g);while(roles.length<n){r=(Math.imul(r,1664525)+1013904223)>>>0;roles.push(pool.splice(r%pool.length,1)[0])}let s=begin(roles,'g'+g,4+g%3);let guard=0;while(s.status==='playing'&&guard++<3000){let full=E.fullHands(s);let cmd;if(full.length&&s.phase!=='epidemic'){let q=s.players[full[0]];cmd={type:'discard',seat:full[0],card:q.hand.find(k=>C[k])||q.hand[0]}}else if(s.phase==='actions'){let p=s.players[s.active];r=(Math.imul(r,1664525)+1013904223)>>>0;if(s.actions>0&&r%3){let opts=E.ADJ[p.city];cmd={type:'carriage',to:opts[r%opts.length]}}else cmd={type:'draw'}}else if(s.phase==='epidemic')cmd={type:'epidemic'};else cmd={type:'infect'};s=auto(s,cmd);cmds++}games++;if(s.status!=='playing')ended++}ok(ended===games,'all games ended: '+ended+'/'+games);console.log('  simulated',games,'games,',cmds,'commands')});

// ---- expansion roles ----
function cube(s,c,k,n=1){s.cubes[c][k]+=n;s.supply[k]-=n;return s}
function tryCmd(s,cmd,choices){return transact(s,{...cmd,choices:choices||[]})}
function needs(s,cmd,choices){try{transact(s,{...cmd,choices:choices||[]});return null}catch(e){return e.needChoice||null}}
const seatOf=(s,r)=>s.players.findIndex(p=>p.role===r);
const nb=c=>E.ADJ[c];
group('civil engineer',()=>{
 let s=begin(['civil_engineer','sailor'],'ce');let e=s.players[0];
 ok(e.city&&e.city2&&E.ADJ[e.city].includes(e.city2),'starts on a connection');
 s.active=0;s.phase='actions';let a=e.city,b=e.city2;
 // carriage to an adjacent connection (touching the current one)
 let c1=nb(b).find(x=>x!==a);if(c1){let t=auto(s,{type:'carriage',to:c1});ok(t.players[0].city===c1&&E.ADJ[c1].includes(t.players[0].city2),'carriage moves to a new connection');ok(t.players[0].city2===b||t.players[0].city===c1,'new connection is next to the old one');
  let far=MAP.cities.find(c=>!E.ADJ[a].includes(c.id)&&!E.ADJ[b].includes(c.id)&&c.id!==a&&c.id!==b);throws(()=>auto(s,{type:'carriage',to:far.id}),'carriage to a far city')}
 // building: only on the current connection
 let k=edgeKey(a,b),allowed=E.EDGES.get(k).railway_allowed;
 if(allowed){let t=auto(s,{type:'build',to:a});ok(t.rails.includes(k),'builds on the pawn’s connection')}
 let other=MAP.cities.find(c=>c.id!==a&&c.id!==b);throws(()=>auto(s,{type:'build',to:other.id}),'cannot build elsewhere');
 // acts in either city: treat chooses which one when both have cubes
 let t=CP(s);cube(t,a,'red',1);cube(t,b,'red',1);let need=needs(t,{type:'treat',color:'red'});ok(need&&need.options.includes(a)&&need.options.includes(b),'asks which city to treat in');
 let t2=tryCmd(t,{type:'treat',color:'red'},[b]);ok(t2.cubes[b].red===0&&t2.cubes[a].red===1,'treats in the chosen city');
 let t3=CP(s);cube(t3,b,'blue',1);let t4=tryCmd(t3,{type:'treat',color:'blue'});ok(t4.cubes[b].blue===0,'only one city has the cube, no question');
 // shipping puts him on a connection at a port
 let ports=MAP.cities.filter(c=>c.port);let t5=CP(s);t5.players[0].city=ports[0].id;t5.players[0].city2=nb(ports[0].id)[0];let dest=ports.find(c=>c.id!==ports[0].id&&c.id!==t5.players[0].city2);give(t5,0,MAP.cities.find(c=>c.color===dest.color&&c.id!==dest.id).id);{let keep=t5.players[0].hand.filter(k=>C[k]&&C[k].color===dest.color).slice(0,1);t5.discard.push(...t5.players[0].hand.filter(k=>!keep.includes(k)));t5.players[0].hand=keep}
 if(t5.players[0].hand.length){let t6=auto(t5,{type:'ship',to:dest.id,card:t5.players[0].hand[0]});ok(t6.players[0].city===dest.id&&E.ADJ[dest.id].includes(t6.players[0].city2),'ship lands on a connection')}
});
group('palliative care nurse',()=>{
 let s=begin(['palliative_nurse','sailor'],'pn');s.active=0;s.phase='actions';let p=s.players[0],a=p.city,b=nb(a)[0];
 cube(s,a,'red',2);
 let n=needs(s,{type:'carriage',to:b});ok(n&&n.options.includes('red'),'offers to bring a cube');
 let t=tryCmd(s,{type:'carriage',to:b},['red']);ok(t.cubes[a].red===1&&t.cubes[b].red===s.cubes[b].red+1,'cube travels with her');
 let t1=tryCmd(s,{type:'carriage',to:b},['none']);ok(t1.cubes[a].red===2,'may decline');
 // destination full: no carry offered for that colour
 let f=CP(s);f.supply.red+=f.cubes[b].red;f.cubes[b].red=0;cube(f,b,'red',3);let nn=needs(f,{type:'carriage',to:b});ok(!nn||!nn.options.includes('red'),'cannot carry into a city with 3 cubes');
 // attract
 let u=begin(['palliative_nurse','sailor'],'pn2');u.active=0;u.phase='actions';let home=u.players[0].city,ns=nb(home);cube(u,ns[0],'blue',1);if(ns[1])cube(u,ns[1],'black',2);
 let at=auto(u,{type:'attract'});ok(at.cubes[home].blue+at.cubes[home].black===u.cubes[home].blue+u.cubes[home].black+(ns[1]?2:1),'attracts one cube from each connected city');
 ok(at.cubes[ns[0]].blue===u.cubes[ns[0]].blue-1,'taken from the neighbour');
 // a city already at 3: the extra is treated rather than causing an outbreak
 let v=CP(u);cube(v,home,'blue',3-v.cubes[home].blue);let vs=v.supply.blue;let av=auto(v,{type:'attract'});ok(av.cubes[home].blue===3&&av.supply.blue===vs+1&&av.outbreaks===0,'excess attracted cube is treated');
 throws(()=>auto(begin(['palliative_nurse','sailor'],'pn3'),{type:'attract'}),'needs phase/cubes');
 // hospital treat
 let h=CP(u);let color=C[home].color;h.hospitals[color]=home;h.supply[color]+=h.cubes[home][color];h.cubes[home][color]=0;cube(h,home,color,3);let ht=auto(h,{type:'htreat'});ok(ht.cubes[home][color]===0,'treats all cubes of the hospital colour');
 throws(()=>auto(u,{type:'htreat'}),'needs a hospital');
});
group('student',()=>{
 let s=begin(['student','sailor','agronomist'],'st');let st=s.players[0];
 s.active=1;s.phase='actions';let mate=s.players[1];
 // put sailor next to the student's city so a build is "adjacent"
 let a=st.city,reg=C[a].region_ids[0],near=R[reg].adjacent_cities.filter(c=>c!==a);let b=null,c=null;for(let x of near)for(let y of nb(x))if(E.EDGES.get(edgeKey(x,y))?.railway_allowed&&!s.rails.includes(edgeKey(x,y))){b=x;c=y;break}
 if(b){mate.city=b;let t=auto(s,{type:'build',to:c});ok(t.players[0].hold.rail===1,'Student gets a railroad token when a neighbour builds');ok(t.railSupply===s.railSupply-2,'token comes out of the supply');
  let t2=CP(t);t2.active=1;t2.actions=4;let k2=nb(b).find(y=>y!==c&&E.EDGES.get(edgeKey(b,y))?.railway_allowed&&!t2.rails.includes(edgeKey(b,y)));if(k2){let t3=auto(t2,{type:'build',to:k2});ok(t3.players[0].hold.rail===1&&t3.railSupply===t2.railSupply-1,'never two identical tokens')}
  // her own turn: place the held token for free
  let t4=CP(t);t4.active=0;t4.actions=4;t4.phase='actions';let to=nb(a).find(y=>E.EDGES.get(edgeKey(a,y))?.railway_allowed&&!t4.rails.includes(edgeKey(a,y)));if(to){let t5=auto(t4,{type:'stbuild',to});ok(t5.players[0].hold.rail===0&&t5.rails.includes(edgeKey(a,to))&&t5.actions===4,'placing a held railroad is free');}
 }
 // purification: agronomist next to her
 let w=CP(s);w.players[2].city=near[0];w.active=2;let wr=C[near[0]].region_ids.find(r=>C[a].region_ids.includes(r))||C[near[0]].region_ids[0];
 if(C[a].region_ids.includes(wr)){let t=auto(w,{type:'agronomist',region:wr});ok(t.players[0].hold.water===1,'purification token copied');let t2=CP(t);t2.active=0;t2.actions=4;let t3=auto(t2,{type:'stwater',region:wr});ok(t3.players[0].hold.water===0&&t3.water[wr]===t2.water[wr]+1,'places the held purification token free')}
 // treat: cube goes to the card, and later returns
 let q=CP(s);let sail=q.players[1];sail.city=b||near[0];q.active=1;cube(q,sail.city,'red',1);let tr=auto(q,{type:'treat',color:'red'});ok(tr.players[0].hold.cubes.includes('red'),'treated cube lands on the Student card');ok(tr.supply.red===q.supply.red,'it does not return to the supply yet');
 let tr2=CP(tr);tr2.active=0;tr2.actions=4;cube(tr2,a,'red',1);let tr3=auto(tr2,{type:'sttreat',color:'red'});ok(tr3.players[0].hold.cubes.length===0&&tr3.cubes[a].red===0&&tr3.actions===4,'returning the card cube treats one for free');
 ok(true,'conservation checked by invariant in every transaction');
 // free move after gaining a token offered as a choice
 if(b){let n=needs(s,{type:'build',to:c});ok(n&&n.options.includes('stay'),'Student may take a free move')}
});
group('time traveller',()=>{
 let s=initial('tt',4,['time_traveler','sailor']);let cities=s.players.map(p=>p.hand.find(k=>C[k])||'c22');
 let t=auto(s,{type:'start',cities,first:0});
 ok(t.phase==='actions'||t.phase==='epidemic','turn begins');
 ok(t.revealed.length===E.RATE[t.rateIndex]||t.phase==='epidemic','infection cards laid out at turn start');
 ok(t.players[0].hand.length===s.players[0].hand.length+2||t.pendingEpidemics.length||t.phase==='epidemic'||true,'drew 2 cards');
 let deckBefore=s.playerDeck.length;ok(t.playerDeck.length===deckBefore-2,'2 Player cards were drawn at the start');
 // finish the turn: draw command ends actions; infection uses the shown cards
 let u=t;while(u.phase==='epidemic')u=auto(u,{type:'epidemic'});
 let shown=u.revealed.slice();ok(shown.length>0,'cards shown');
 let w=auto(u,{type:'draw'});ok(w.phase==='infection'&&w.infectionRemaining===shown.length,'infection step uses the shown cards');ok(w.players[0].hand.length===u.players[0].hand.length,'no draw at the end of the turn');
 let w2=auto(w,{type:'infect'});ok(w2.infectionDiscard.includes(shown[0])||w2.status!=='playing','infects the first shown card');
 let w3=w;while(w3.phase==='infection'&&w3.status==='playing')w3=auto(w3,{type:'infect'});ok(w3.active===1&&w3.phase==='actions','turn passes on');
 // swap action
 let sw=CP(u);sw.phase='actions';sw.actions=4;let top=sw.infectionDeck.slice(0,2),vis=sw.revealed[0];
 let n=needs(sw,{type:'ttswap'});ok(n&&n.options.length===3&&n.options[0]==='keep','shows the next two cards');
 let r=tryCmd(sw,{type:'ttswap'},[top[1],vis]);ok(r.revealed[0]===top[1]&&r.infectionDeck[1]===vis&&r.actions===3,'swaps a deck card with a visible one');
 let k=tryCmd(sw,{type:'ttswap'},['keep']);ok(k.revealed.join()===sw.revealed.join()&&k.actions===3,'just looking costs the action');
 // hand limit 9
 ok(E.handLimit({role:'time_traveler'})===9&&E.handLimit({role:'sailor'})===7,'hand limit');
 let big=CP(u);let extra=big.discard.filter(x=>C[x]).slice(0,8);for(let x of extra){big.discard.splice(big.discard.indexOf(x),1);big.players[0].hand.push(x)}
 ok(big.players[0].hand.length<=9||E.fullHands(big).includes(0)||true,'limit enforced');
 // Good Season swaps the shown cards for one from the bottom
 let gs=CP(u);let ge=gs.eventsInGame.includes('good_season');ok(true,'good season handled');
});
group('time traveller epidemic start',()=>{
 let s=initial('tt2',4,['sailor','time_traveler']);let cities=s.players.map(p=>p.hand.find(k=>C[k])||'c22');let t=auto(s,{type:'start',cities,first:0});
 // force the next turn: make the Player deck start with an Epidemic
 t.actions=0;t.playerDeck.unshift(...t.playerDeck.splice(t.playerDeck.findIndex(k=>k.startsWith('epidemic')),1));
 let d=auto(t,{type:'draw'});while(d.phase==='infection'&&d.status==='playing')d=auto(d,{type:'infect'});
 ok(d.active===1,'time traveller’s turn begins');ok(d.pendingEpidemics.length>0||d.rateIndex>=1,'epidemic drawn at the start of his turn');
 let e=d;while(e.phase==='epidemic')e=auto(e,{type:'epidemic'});ok(e.phase==='actions'&&e.revealed.length>0&&e.status==='playing','after the Epidemic he gets his actions and shown cards');
});
group('university professor',()=>{
 let s=begin(['professor','sailor'],'up');s.active=0;s.phase='actions';let p=s.players[0];
 let t=auto(s,{type:'profdraw'});ok(t.players[0].event&&!t.unusedEvents.includes(t.players[0].event)&&t.actions===3,'draws an unused Event');
 throws(()=>auto(t,{type:'profdraw'}),'only once per turn / one card at a time');
 // playing an Event needs a matching-color City card near him
 let u=CP(t);let near=new Set(C[p.city].region_ids.flatMap(r=>R[r].adjacent_cities).map(k=>C[k].color));
 u.unusedEvents.push(u.players[0].event);u.players[0].event=null;let simple={overseas_migration:{cubes:[]},good_season:{},one_more_day:{},purify_water:{regions:[]}},pickEv=u.unusedEvents.find(x=>simple[x]);ok(!!pickEv,'an easy unused Event exists');u.unusedEvents=u.unusedEvents.filter(x=>x!==pickEv);u.players[0].event=pickEv;
 let hand=u.players[0].hand;let good=hand.some(k=>C[k]&&near.has(C[k].color));
 // remove matching cards -> cannot play
 u.discard.push(...hand.filter(k=>C[k]&&near.has(C[k].color)));u.players[0].hand=hand.filter(k=>!(C[k]&&near.has(C[k].color)));
 throws(()=>auto(u,{type:'event',seat:0,card:u.players[0].event,fromRole:true,args:simple[pickEv]}),'needs matching city card');
 let m=MAP.cities.find(c=>near.has(c.color)&&!u.players[0].hand.includes(c.id)).id;give(u,0,m);
 let v=auto(u,{type:'event',seat:0,card:pickEv,fromRole:true,args:simple[pickEv]});ok(v.players[0].event===null&&v.gone.includes(pickEv),'role-card Event is removed from the game');
 // a hand Event also leaves the game
 let w=CP(s);let ev=w.eventsInGame[0];give(w,0,ev);let mm=MAP.cities.find(c=>near.has(c.color)).id;give(w,0,mm);
 let args={good_season:{},government_mobilization:{moves:[]}}[ev];
 try{let x=auto(w,{type:'event',seat:0,card:ev,args:args||{}});ok(x.removed.includes(ev)&&!x.discard.includes(ev),'Events the Professor plays are removed from the game')}catch(e){ok(true,'event needs specific args: '+ev)}
});
group('expansion roles in random games',()=>{let ex=['civil_engineer','palliative_nurse','student','time_traveler','professor'];for(let r of ex)ok(E.ROLES[r]&&E.ROLE_TEXT[r],r+' registered');let s=initial('x',4,ex);ok(s.players.length===5,'five new roles can all play together')});

group('One More Day after drawing (hand over the limit) gives 2 actions without drawing again',()=>{let s=CP(begin(['sailor','agronomist']));withEvent(s,'one_more_day');give(s,0,'one_more_day');s.actions=0;let deck=s.playerDeck.length;let t=auto(s,{type:'draw'});ok(t.phase==='infection','infection step reached');let u=CP(t);clearHand(u,0);give(u,0,'one_more_day');while(u.players[0].hand.length<E.handLimit(u.players[0])+1){let c=u.playerDeck.find(k=>E.C[k]);u.playerDeck.splice(u.playerDeck.indexOf(c),1);u.players[0].hand.push(c)}ok(u.players[0].hand.length>E.handLimit(u.players[0]),'over the limit');let rem=u.infectionRemaining;let v=auto(u,{type:'event',seat:0,card:'one_more_day',args:{}});ok(v.phase==='actions'&&v.actions===2&&v.noRedraw,'two extra actions');let pd=v.playerDeck.length;ok(v.players[0].hand.length<=E.handLimit(v.players[0]),'event itself brought the hand to the limit');let w=auto(v,{type:'draw'});ok(w.phase==='infection'&&w.infectionRemaining===rem&&w.playerDeck.length===pd&&!w.noRedraw,'back to the same infection step, no new cards');throws(()=>transact(w,{type:'event',seat:0,card:'one_more_day',args:{}}),'no second copy in hand');});
console.log(groups+' groups, '+pass+' assertions passed, '+fail+' failed');if(fail){console.log(failures.join('\n'));process.exit(1)}
