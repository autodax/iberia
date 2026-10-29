// Iberia prototype rules engine v0.9 — standard base game (7 roles, 15 Events, 2–5 players)
const VERSION='0.9.22';
const COLORS=['blue','red','yellow','black'],RATE=[2,2,2,3,3,4,4];
const C=Object.fromEntries(MAP.cities.map(c=>[c.id,c])),R=Object.fromEntries(MAP.regions.map(r=>[r.id,r]));
const edgeKey=(a,b)=>[a,b].sort().join('|'),EDGES=new Map(MAP.connections.map(e=>[edgeKey(e.a,e.b),e]));
const ADJ=Object.fromEntries(MAP.cities.map(c=>[c.id,[]]));for(let e of MAP.connections){ADJ[e.a].push(e.b);ADJ[e.b].push(e.a)}
const ROLES={sailor:'Sailor',agronomist:'Agronomist',railwayman:'Railwayman',politician:'Politician',nurse:'Nurse',scientist:'Royal Academy Scientist',rural_doctor:'Rural Doctor',civil_engineer:'Civil Engineer',palliative_nurse:'Palliative Care Nurse',student:'Student',time_traveler:'Time Traveller',professor:'University Professor'};
const ROLE_TEXT={
 sailor:'Move by Ship without spending a card. When you Move by Ship you may take one passenger (a pawn in your city).',
 agronomist:'As an action, place 1 purification token into an adjacent region. When you Purify Water, you may place 1 additional token.',
 railwayman:'Once per turn, Build Railroad may place two consecutive tokens starting from your city. When you Move by Train you may take one passenger.',
 politician:'As an action, give the City card matching your city to another player anywhere. As an action, swap a City card in hand with one in the Player Discard Pile; you must be in a city matching one of them.',
 nurse:'Your prevention token sits in a region adjacent to your city. Cities adjacent to it cannot be infected. Whenever your pawn moves, move the token to a region adjacent to your new city.',
 scientist:'Purify Water with any City card regardless of color. As an action, look at the top 3 Player cards and rearrange them.',
 rural_doctor:'Treat Disease removes one cube from your city plus one more from your city or a different city in an adjacent region.',
 civil_engineer:'Your pawn always stands on the line connecting two cities and counts as being in both; choose which one for each action. Carriage/Boat moves you to an adjacent connection. You can only Build Railroad on your current connection.',
 palliative_nurse:'When you move (by any method) you may bring 1 disease cube with you. As an action, attract 1 cube from each connected city, then Treat so that no outbreak occurs. As an action at a Hospital, treat all cubes of the Hospital\u2019s color.',
 student:'When another player builds a railroad, places a purification token, or treats a cube in a region adjacent to you, you take a matching token or cube onto this card (never two identical) and may take 1 free move. On your turn, place those tokens, and return held cubes to Treat the same color here, for free.',
 time_traveler:'At the start of your turn you draw your 2 Player cards and lay out this turn\u2019s Infection cards face up. As an action, look at the next 2 Infection cards and swap 1 for a visible one. Your hand limit is 9.',
 professor:'Once per turn, as an action, draw 1 random Event card that was not used in the setup and keep it on this card. To play any Event you must hold a City card matching the color of a city in an adjacent region. Events you play are removed from the game.'};
const EVENTS={good_season:'Good Season',government_mobilization:'Government Mobilization',hospital_founding:'Hospital Founding',mail_correspondence:'Mail Correspondence',new_rails:'New Rails',one_more_day:'One More Day',overseas_migration:'Overseas Migration',purify_water:'Purify Water',ring_railroads:'Ring Railroads',science_triumph:'Science Triumph',second_chance:'Second Chance',ships_arrive:'Ships Arrive',telegraph_message:'Telegraph Message',travel_day_night:'Travel Day and Night',when_plans_were_good:'When the Plans Were Good'};
const EVENT_TEXT={good_season:'During the next infection step, draw only 1 Infection card, from the bottom of the Infection Deck.',government_mobilization:'Each player may immediately move their pawn once for free: carriage, train, or ship.',hospital_founding:'Place or move a hospital into a city matching its color.',mail_correspondence:'Two players (anywhere on the board) can swap 1 card from their hands.',new_rails:'Add 2 railroad tokens anywhere on the board (not on dashed lines).',one_more_day:'The current player may take 2 more actions this turn.',overseas_migration:'Remove up to 2 cubes from the board.',purify_water:'Put up to 2 purification tokens onto the board, in one or two different regions.',ring_railroads:'Add 3 railroad tokens between port cities (not on dashed lines).',science_triumph:'Remove up to 1 cube from each city in one region.',second_chance:'Take the City card matching your current city from the Player Discard Pile.',ships_arrive:'Select a port city. Move 1 or more player pawns there from anywhere (with permission).',telegraph_message:'One player may give 1 or 2 City cards to one other player anywhere on the board.',travel_day_night:'Move a pawn to any city on the board (with permission).',when_plans_were_good:'Take 1 Event card from the Player Discard Pile and play it immediately.'};
const SETUP={2:{events:4,hand:4},3:{events:5,hand:3},4:{events:6,hand:2},5:{events:8,hand:2}};
const HAND_LIMIT=7;
const handLimit=p=>p&&p.role==='time_traveler'?9:HAND_LIMIT;
const locs=p=>p.city2?[p.city,p.city2]:[p.city];
const inCity=(p,c)=>!!c&&(p.city===c||p.city2===c);
const CP=x=>JSON.parse(JSON.stringify(x));
function requireRule(v,m){if(!v)throw Error(m)}
function random(s){s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return s.rng/4294967296}
function shuffle(s,a){a=a.slice();for(let i=a.length-1;i>0;i--){let j=Math.floor(random(s)*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function hash(t){let h=2166136261;for(let c of String(t)){h=Math.imul(h^c.charCodeAt(0),16777619)}return h>>>0}
function cardName(k){return C[k]?C[k].name:EVENTS[k]||(String(k).startsWith('epidemic')?'Epidemic':k)}
function roleName(r){return ROLES[r]||r}
function playerLabel(s,i){return roleName(s.players[i].role)}

function initial(seed='iberia',difficulty=4,roles=['sailor','agronomist']){
 requireRule([4,5,6].includes(difficulty),'Difficulty must be 4, 5 or 6');
 requireRule(Array.isArray(roles)&&roles.length>=2&&roles.length<=5,'Choose 2 to 5 players');
 requireRule(roles.every(r=>ROLES[r])&&new Set(roles).size===roles.length,'Each player needs a different standard role');
 let n=roles.length,cfg=SETUP[n];
 let s={version:VERSION,mapId:'approved-34-regions',seed:String(seed),rng:hash(seed),difficulty,
  players:roles.map((role,i)=>({name:'Player '+(i+1),role,city:null,city2:null,hand:[],...(role==='student'?{hold:{rail:0,water:0,cubes:[]}}:{}),...(role==='professor'?{event:null}:{})})),active:0,phase:'setup',actions:4,turn:1,status:'playing',
  research:[],hospitals:Object.fromEntries(COLORS.map(c=>[c,null])),rails:[],railSupply:20,
  water:Object.fromEntries(MAP.regions.map(r=>[r.id,0])),waterSupply:14,prevention:null,
  cubes:Object.fromEntries(MAP.cities.map(c=>[c.id,Object.fromEntries(COLORS.map(k=>[k,0]))])),supply:Object.fromEntries(COLORS.map(c=>[c,24])),
  outbreaks:0,rateIndex:0,infectionRemaining:0,infectionDrawn:0,infectionFromBottom:false,goodSeason:false,doubleRailUsed:false,revealed:[],gone:[],profUsed:false,ttStart:false,
  pendingEpidemics:[],removed:[],discard:[],infectionDiscard:[],eventsInGame:[],unusedEvents:[],log:[],fx:[]};
 s.infectionDeck=shuffle(s,MAP.cities.map(c=>c.id));
 for(let amount of [3,2,1])for(let j=0;j<3;j++){let id=s.infectionDeck.shift();s.infectionDiscard.push(id);s.cubes[id][C[id].color]=amount;s.supply[C[id].color]-=amount}
 let ev=shuffle(s,Object.keys(EVENTS));s.eventsInGame=ev.slice(0,cfg.events).sort();s.unusedEvents=ev.slice(cfg.events);
 let deck=shuffle(s,[...MAP.cities.map(c=>c.id),...s.eventsInGame]);
 for(let p of s.players)p.hand=deck.splice(0,cfg.hand);
 let chunks=[],size=Math.floor(deck.length/difficulty),extra=deck.length%difficulty;
 for(let i=0;i<difficulty;i++)chunks.push(shuffle(s,[...deck.splice(0,size+(i<extra?1:0)),'epidemic_'+i]));
 s.playerDeck=chunks.flat();
 s.log.push('New game: seed '+seed+', '+n+' players, '+difficulty+' Epidemics, '+cfg.events+' random Events. Choose starting cities and first player.');
 invariant(s);return s}

function invariant(s){
 requireRule(/^0\.9\./.test(s.version),'Unsupported save version');
 let n=s.players.length;requireRule(n>=2&&n<=5&&Number.isInteger(s.active)&&s.active>=0&&s.active<n,'Invalid players');
 requireRule(['setup','actions','epidemic','infection','ended'].includes(s.phase),'Invalid phase');
 requireRule(Number.isInteger(s.actions)&&s.actions>=0&&s.actions<=40,'Invalid action budget');
 requireRule(Number.isInteger(s.outbreaks)&&s.outbreaks>=0&&s.outbreaks<=8,'Invalid outbreaks');
 requireRule(Number.isInteger(s.rateIndex)&&s.rateIndex>=0&&s.rateIndex<=6,'Invalid infection rate');
 let held=s.players.map(p=>p.hold).filter(Boolean);requireRule(s.waterSupply>=0&&s.waterSupply+Object.values(s.water).reduce((a,b)=>a+b,0)+held.reduce((a,h)=>a+h.water,0)===14,'Water conservation failure');
 for(let h of held)requireRule((h.rail===0||h.rail===1)&&(h.water===0||h.water===1)&&Array.isArray(h.cubes)&&new Set(h.cubes).size===h.cubes.length&&h.cubes.every(c=>COLORS.includes(c)),'Invalid Student card');
 requireRule(Object.keys(s.water).length===34,'Wrong regions');
 for(let r of MAP.regions)requireRule(Number.isInteger(s.water[r.id])&&s.water[r.id]>=0,'Invalid water');
 for(let color of COLORS){requireRule(Number.isInteger(s.supply[color])&&s.supply[color]>=0,'Invalid cube supply');let total=s.supply[color]+held.reduce((a,h)=>a+h.cubes.filter(c=>c===color).length,0);for(let c of MAP.cities){let k=s.cubes[c.id][color];requireRule(Number.isInteger(k)&&k>=0&&k<=3,'Invalid city cubes');total+=k}requireRule(total===24,'Cube conservation failure')}
 requireRule(s.railSupply>=0&&s.railSupply+s.rails.length+held.reduce((a,h)=>a+h.rail,0)===20,'Rail conservation failure');
 requireRule(new Set(s.rails).size===s.rails.length&&s.rails.every(k=>EDGES.has(k)&&EDGES.get(k).railway_allowed),'Invalid built railway');
 requireRule(new Set(s.research).size===s.research.length&&s.research.every(c=>COLORS.includes(c)),'Invalid research');
 for(let color of COLORS)requireRule(s.hospitals[color]===null||C[s.hospitals[color]]?.color===color,'Invalid hospital');
 let cards=[...s.playerDeck,...s.discard,...s.removed,...s.pendingEpidemics,...s.players.flatMap(p=>p.hand)];
 let expected=[...Object.keys(C),...s.eventsInGame,...Array.from({length:s.difficulty},(_,i)=>'epidemic_'+i)];
 requireRule(cards.length===expected.length&&new Set(cards).size===expected.length&&expected.every(c=>cards.includes(c)),'Player-card conservation failure');
 {let all=[...s.eventsInGame,...s.unusedEvents,...(s.gone||[]),...s.players.map(p=>p.event).filter(Boolean)];requireRule(all.length===15&&new Set(all).size===15,'Event inventory failure')}
 let infections=[...s.infectionDeck,...s.infectionDiscard,...(s.revealed||[])];requireRule(infections.length===48&&new Set(infections).size===48&&infections.every(c=>C[c]),'Infection-card conservation failure');
 requireRule(new Set(s.players.map(p=>p.role)).size===n,'Duplicate roles');
 for(let p of s.players){requireRule(ROLES[p.role],'Unsupported role');requireRule(p.city===null&&s.phase==='setup'||!!C[p.city],'Invalid pawn location');if(p.role==='civil_engineer'&&p.city)requireRule(ADJ[p.city].includes(p.city2),'The Civil Engineer must stand on a connection');else requireRule(p.city2==null,'Only the Civil Engineer stands on a connection');requireRule(p.hand.every(c=>C[c]||EVENTS[c]),'Invalid hand card')}
 let nurse=s.players.find(p=>p.role==='nurse');
 if(nurse&&s.phase!=='setup')requireRule(R[s.prevention]&&R[s.prevention].adjacent_cities.includes(nurse.city),'Prevention token must be adjacent to the Nurse');
 if(!nurse)requireRule(s.prevention===null,'Prevention token without Nurse');
 return true}

function lose(s,reason){if(s.status!=='playing')return;s.status='lost: '+reason;s.phase='ended';s.log.push('Defeat — '+reason);pushFx(s,{kind:'end',text:'Defeat — '+reason})}
function spend(s,p,card){let i=p.hand.indexOf(card);requireRule(i>=0,'Card not in hand');p.hand.splice(i,1);s.discard.push(card)}
function take(p,card){let i=p.hand.indexOf(card);requireRule(i>=0,'Card not in hand');p.hand.splice(i,1);return card}
function fullHands(s){return s.players.map((p,i)=>p.hand.length>handLimit(p)?i:-1).filter(i=>i>=0)}
function railReach(s,start){let seen=new Set([start]),again=true;while(again){again=false;for(let k of s.rails){let [a,b]=k.split('|');if(seen.has(a)&&!seen.has(b)){seen.add(b);again=true}if(seen.has(b)&&!seen.has(a)){seen.add(a);again=true}}}seen.delete(start);return seen}
function choice(ctx,options,description,labels){if(options.length===1)return options[0];let v=ctx.choices[ctx.index++];if(v===undefined){let e=Error(description);e.needChoice={options,description,labels:labels||options};throw e}requireRule(options.includes(v),'Invalid choice: '+v);return v}
function regionLabel(r){return r+' — '+R[r].adjacent_cities.map(k=>C[k].name).join(', ')}
// Move any pawn. The Nurse re-places her prevention token; the Palliative Care Nurse may carry a cube; the Civil Engineer stands on a connection (to + a neighbour).
function relocate(s,seat,to,ctx,withCity,allowed){let q=s.players[seat],from=q.city;
 if(q.role==='palliative_nurse'&&from&&from!==to){let ok=COLORS.filter(k=>s.cubes[from][k]>0&&s.cubes[to][k]<3);if(ok.length){let k=choice(ctx,['none',...ok],'Palliative Care Nurse: bring a disease cube along to '+C[to].name+'?',['No cube',...ok.map(c=>'Bring a '+c+' cube')]);if(k!=='none'){s.cubes[from][k]--;s.cubes[to][k]++;s.log.push('Palliative Care Nurse carries a '+k+' cube to '+C[to].name)}}}
 q.city=to;
 if(q.role==='civil_engineer'){let o=allowed||ADJ[to];requireRule(!withCity||o.includes(withCity),'Not a valid connection');q.city2=withCity||choice(ctx,o,'Civil Engineer: stand on the connection between '+C[to].name+' and which city?',o.map(n=>C[to].name+' – '+C[n].name));s.log.push('Civil Engineer stands between '+C[to].name+' and '+C[q.city2].name)}
 if(q.role==='nurse'){let opts=C[to].region_ids.slice();s.prevention=choice(ctx,opts,'Nurse: choose the region for the prevention token next to '+C[to].name,opts.map(regionLabel));s.log.push('Prevention token → '+s.prevention)}}
// Record a prevented cube on the alert that caused it (shown in the popup, then animated on the board).
function noteBlocked(s,b){let f=s.fx&&s.fx[s.fx.length-1];if(!f)return;let list=f.blocked=f.blocked||[],e=list.find(x=>x.city===b.city&&x.by===b.by&&x.region===b.region);if(e){e.n++;e.left=b.left}else list.push({...b,n:1})}
function protectedByNurse(s,id){return !!(s.prevention&&R[s.prevention].adjacent_cities.includes(id))}
function placeCube(s,id,color,ctx,erupted,pend,from){
 if(erupted.has(id))return null;
 if(protectedByNurse(s,id)){s.log.push('Prevention token protects '+C[id].name);noteBlocked(s,{city:id,by:'nurse',region:s.prevention});return 'blocked'}
 let water=C[id].region_ids.filter(r=>s.water[r]>0);
 if(water.length){let r=choice(ctx,water,'Choose which purification token protects '+C[id].name,water.map(x=>regionLabel(x)+' (×'+s.water[x]+')'));s.water[r]--;s.waterSupply++;s.log.push('Purification in '+regionLabel(r)+' protects '+C[id].name);noteBlocked(s,{city:id,by:'water',region:r,left:s.water[r]});return 'blocked'}
 if(s.cubes[id][color]===3){if(!pend.some(p=>p[0]===id))pend.push([id,from]);return 'full'}
 if(s.supply[color]===0){lose(s,'no '+color+' cubes left');return null}
 s.cubes[id][color]++;s.supply[color]--;return 'placed'}
function outbreak(s,id,color,ctx,erupted,pend,from){erupted.add(id);s.outbreaks++;s.log.push('Outbreak '+s.outbreaks+': '+C[id].name);let ofx={kind:'outbreak',city:id,color,count:s.outbreaks,from:from||null,chainIndex:erupted.size};pushFx(s,ofx);(erupted.fx=erupted.fx||[]).push(ofx);if(s.outbreaks>=8){lose(s,'8 outbreaks');return}
 // rulebook: place this outbreak's cubes first; chain reaction outbreaks happen after the current outbreak is done
 for(let n of ADJ[id]){if(s.status!=='playing')return;if(!erupted.has(n))placeCube(s,n,color,ctx,erupted,pend,id)}}
function resolveInfection(s,id,amount,ctx){let color=C[id].color,erupted=new Set(),pend=[];s.log.push('Infect '+C[id].name+' ×'+amount);
 for(let j=0;j<amount&&s.status==='playing';j++){if(placeCube(s,id,color,ctx,erupted,pend,null)==='full')break}
 while(pend.length&&s.status==='playing'){let [n,f]=pend.shift();if(!erupted.has(n))outbreak(s,n,color,ctx,erupted,pend,f)}
 for(let f of erupted.fx||[]){f.chainTotal=erupted.fx.length;f.chain=erupted.fx.map(x=>x.city)}}
function beginInfectionStep(s){s.phase='infection';s.infectionDrawn=0;if(s.revealed&&s.revealed.length){s.infectionRemaining=s.revealed.length;s.infectionFromBottom=false}else if(s.goodSeason){s.goodSeason=false;s.infectionRemaining=1;s.infectionFromBottom=true;s.log.push('Good Season: one Infection card from the bottom')}else{s.infectionRemaining=RATE[s.rateIndex];s.infectionFromBottom=false}}
function epidemic(s,ctx){let card=s.pendingEpidemics.shift();requireRule(card,'No epidemic pending');s.removed.push(card);s.rateIndex=Math.min(6,s.rateIndex+1);let id=s.infectionDeck.pop();s.log.push('Epidemic: infection rate '+RATE[s.rateIndex]+'; bottom card '+C[id].name);pushFx(s,{kind:'epidemic',city:id,rate:RATE[s.rateIndex],rateIndex:s.rateIndex});resolveInfection(s,id,3,ctx);s.infectionDiscard.push(id);if(s.status!=='playing')return;s.infectionDeck=[...shuffle(s,s.infectionDiscard),...s.infectionDeck];s.infectionDiscard=[];if(s.pendingEpidemics.length)s.phase='epidemic';else if(s.ttStart){s.ttStart=false;s.phase='actions';revealInfection(s)}else beginInfectionStep(s)}
function endTurn(s,ctx){s.active=(s.active+1)%s.players.length;s.turn++;s.actions=4;s.phase='actions';s.doubleRailUsed=false;s.profUsed=false;s.infectionFromBottom=false;s.log.push('Turn '+s.turn+': '+playerLabel(s,s.active));startTurn(s,ctx)}
// Time Traveller: draws his 2 Player cards first and lays out this turn's Infection cards face up.
function revealInfection(s){let n=RATE[s.rateIndex],bottom=false;if(s.goodSeason){s.goodSeason=false;n=1;bottom=true;s.log.push('Good Season: one Infection card from the bottom')}s.revealed=[];for(let i=0;i<n&&s.infectionDeck.length;i++)s.revealed.push(bottom?s.infectionDeck.pop():s.infectionDeck.shift());s.log.push('Infection cards for this turn: '+s.revealed.map(cardName).join(', '))}
function startTurn(s,ctx){let p=s.players[s.active];if(s.status!=='playing'||p.role!=='time_traveler')return;
 if(s.playerDeck.length<2){lose(s,'not enough Player cards to draw');return}
 let drawn=s.playerDeck.splice(0,2);pushFx(s,{kind:'playerDraw',cards:drawn.slice(),seat:s.active});for(let card of drawn){if(card.startsWith('epidemic_'))s.pendingEpidemics.push(card);else p.hand.push(card)}
 s.log.push(p.name+' draws '+drawn.map(cardName).join(', ')+' at the start of the turn');
 if(s.pendingEpidemics.length){s.ttStart=true;epidemic(s,ctx)}else revealInfection(s)}
// Student: copies of the matching token or cube land on her card when another player acts in a region next to her.
function reactStudents(s,actor,ev,ctx){s.players.forEach((q,i)=>{if(q.role!=='student'||q===actor||!q.city)return;
 let rs=C[q.city].region_ids,near=new Set(rs.flatMap(r=>R[r].adjacent_cities)),got=[];
 if(ev.rail&&ev.rail.some(c=>near.has(c))&&!q.hold.rail&&s.railSupply>0){s.railSupply--;q.hold.rail=1;got.push('a railroad token')}
 if(ev.water&&rs.includes(ev.water)&&!q.hold.water&&s.waterSupply>0){s.waterSupply--;q.hold.water=1;got.push('a purification token')}
 for(let x of ev.cubes||[])if(near.has(x.city)&&!q.hold.cubes.includes(x.color)&&s.supply[x.color]>0){s.supply[x.color]--;q.hold.cubes.push(x.color);got.push('a '+x.color+' cube')}
 if(!got.length)return;s.log.push('Student takes '+got.join(' and ')+' onto the role card');
 let carr=ADJ[q.city],tr=[...railReach(s,q.city)],sh=C[q.city].port?MAP.cities.filter(c=>c.port&&c.id!==q.city&&q.hand.some(k=>C[k]&&C[k].color===c.color)).map(c=>c.id):[];
 let ts=[['stay','Stay where you are']];if(carr.length)ts.push(['carriage','Carriage / boat']);if(tr.length)ts.push(['train','Train']);if(sh.length)ts.push(['ship','Ship']);
 if(ts.length<2)return;let t=choice(ctx,ts.map(x=>x[0]),'Student (took '+got.join(' and ')+'): take 1 free move?',ts.map(x=>x[1]));if(t==='stay')return;
 let tos=t==='carriage'?carr:t==='train'?tr:sh,to=choice(ctx,tos,'Student: move to which city?',tos.map(c=>C[c].name)),card;
 if(t==='ship'){let cs=q.hand.filter(k=>C[k]&&C[k].color===C[to].color);card=choice(ctx,cs,'Student: discard which City card for the ship?',cs.map(k=>C[k].name))}
 movePawn(s,i,{type:t,to,card},ctx,true)})}

function buildRail(s,k){requireRule(EDGES.get(k)?.railway_allowed,'Railroads cannot be built on that connection');requireRule(!s.rails.includes(k),'Railroad already built there');requireRule(s.railSupply>0,'No railroad tokens left');s.rails.push(k);s.railSupply--}
function seatOk(s,i){return Number.isInteger(i)&&i>=0&&i<s.players.length}
// A single movement of one pawn (used by actions and Government Mobilization).
function moveEngineer(s,seat,m,ctx,free){let q=s.players[seat],[a,b]=locs(q);requireRule(C[m.to],'Choose a destination');
 if(m.type==='carriage'){let cur=edgeKey(a,b),opts=ADJ[m.to].filter(n=>edgeKey(m.to,n)!==cur&&(m.to===a||m.to===b||n===a||n===b));requireRule(opts.length,'Move to a connection that touches your current one');relocate(s,seat,m.to,ctx,m.with,opts);return}
 requireRule(m.to!==a&&m.to!==b,'Choose a different city');
 if(m.type==='train')requireRule(railReach(s,a).has(m.to)||railReach(s,b).has(m.to),'No continuous railroad to that city');
 else if(m.type==='ship'){requireRule(C[m.to].port&&(C[a].port||C[b].port),'Both cities must be ports');requireRule(C[m.card]?.color===C[m.to].color,'Discard a City card matching the destination color');spend(s,q,m.card)}
 else throw Error('Unknown movement');
 requireRule(!m.passenger&&m.passenger!==0,'The Civil Engineer takes no passengers');relocate(s,seat,m.to,ctx,m.with)}
function movePawn(s,seat,m,ctx,free){let q=s.players[seat],from=q.city;if(q.role==='civil_engineer')return moveEngineer(s,seat,m,ctx,free);requireRule(C[m.to]&&m.to!==from,'Choose a different city');
 if(m.type==='carriage')requireRule(EDGES.has(edgeKey(from,m.to)),'Destination not connected');
 else if(m.type==='train')requireRule(railReach(s,from).has(m.to),'No continuous railroad to that city');
 else if(m.type==='ship'){requireRule(C[from].port&&C[m.to].port,'Both cities must be ports');if(q.role!=='sailor'){requireRule(C[m.card]?.color===C[m.to].color,'Discard a City card matching the destination color');spend(s,q,m.card)}}
 else throw Error('Unknown movement');
 if(m.passenger!==undefined&&m.passenger!==null){requireRule(!free,'No passengers on free movement');requireRule(m.type==='ship'&&q.role==='sailor'||m.type==='train'&&q.role==='railwayman','Only the Sailor (ship) or Railwayman (train) may take a passenger');requireRule(seatOk(s,m.passenger)&&m.passenger!==seat&&inCity(s.players[m.passenger],from),'Passenger must be another pawn in your city');requireRule(m.consent===true,'Passenger must agree');relocate(s,m.passenger,m.to,ctx)}
 relocate(s,seat,m.to,ctx)}

function playEvent(s,seat,card,a,ctx,fromDiscard){let q=s.players[seat];a=a||{};
 if(card==='good_season'){if(s.revealed&&s.revealed.length&&s.infectionDrawn===0){s.infectionDeck.unshift(...s.revealed);s.revealed=[s.infectionDeck.pop()];if(s.phase==='infection')s.infectionRemaining=1;s.log.push('Good Season: only one Infection card, from the bottom')}else if(s.phase==='infection'&&s.infectionDrawn===0){s.infectionRemaining=1;s.infectionFromBottom=true;s.log.push('Good Season applies to this infection step')}else s.goodSeason=true}
 else if(card==='government_mobilization'){let moves=a.moves||[];requireRule(Array.isArray(moves),'Invalid moves');let seen=new Set();for(let m of moves){if(!m)continue;requireRule(seatOk(s,m.seat)&&!seen.has(m.seat),'Each player moves at most once');seen.add(m.seat);requireRule(['carriage','train','ship'].includes(m.type),'Choose carriage, train or ship');movePawn(s,m.seat,{type:m.type,to:m.to,card:m.card},ctx,true)}}
 else if(card==='hospital_founding'){requireRule(C[a.city],'Choose a city');s.hospitals[C[a.city].color]=a.city}
 else if(card==='mail_correspondence'){requireRule(seatOk(s,a.seatA)&&seatOk(s,a.seatB)&&a.seatA!==a.seatB,'Choose two different players');requireRule(a.consent===true,'Both players must agree');let A=s.players[a.seatA],B=s.players[a.seatB];requireRule(A.hand.includes(a.cardA)&&B.hand.includes(a.cardB),'Each player must offer a card from hand');requireRule(!(a.seatA===seat&&a.cardA===card)&&!(a.seatB===seat&&a.cardB===card),'Cannot swap the Event being played');take(A,a.cardA);take(B,a.cardB);A.hand.push(a.cardB);B.hand.push(a.cardA)}
 else if(card==='new_rails'||card==='ring_railroads'){let max=card==='new_rails'?2:3,routes=a.routes||[];requireRule(Array.isArray(routes)&&routes.length>=1&&routes.length<=max&&new Set(routes).size===routes.length,'Choose 1 to '+max+' different routes');requireRule(routes.length<=s.railSupply,'Not enough railroad tokens');for(let k of routes){if(card==='ring_railroads'){let [x,y]=k.split('|');requireRule(C[x]?.port&&C[y]?.port,'Ring Railroads must connect two port cities')}buildRail(s,k)}}
 else if(card==='one_more_day'){requireRule(s.phase==='actions','One More Day must be played during the action step');s.actions+=2}
 else if(card==='overseas_migration'){let cubes=a.cubes||[];requireRule(Array.isArray(cubes)&&cubes.length<=2,'Choose up to two cubes');for(let x of cubes){requireRule(C[x.city]&&COLORS.includes(x.color)&&s.cubes[x.city][x.color]>0,'Cube not available');s.cubes[x.city][x.color]--;s.supply[x.color]++}}
 else if(card==='purify_water'){let regions=a.regions||[];requireRule(Array.isArray(regions)&&regions.length<=2&&regions.every(r=>R[r])&&regions.length<=s.waterSupply,'Choose up to two available purification tokens');for(let r of regions){s.water[r]++;s.waterSupply--}}
 else if(card==='science_triumph'){requireRule(R[a.region],'Choose a region');let rem=a.removals||[],seen=new Set();for(let x of rem){requireRule(R[a.region].adjacent_cities.includes(x.city)&&!seen.has(x.city),'One cube per city in that region');seen.add(x.city);requireRule(COLORS.includes(x.color)&&s.cubes[x.city][x.color]>0,'Cube not available');s.cubes[x.city][x.color]--;s.supply[x.color]++}}
 else if(card==='second_chance'){let c=q.city;if(q.city2){let o=locs(q).filter(k=>s.discard.includes(k));requireRule(o.length,'Neither City card is in the discard pile');c=choice(ctx,o,'Second Chance: take which City card?',o.map(k=>C[k].name))}let i=s.discard.indexOf(c);requireRule(i>=0,'The City card for '+C[c].name+' is not in the discard pile');s.discard.splice(i,1);q.hand.push(c)}
 else if(card==='ships_arrive'){requireRule(C[a.city]?.port,'Choose a port city');let seats=a.seats||[];requireRule(Array.isArray(seats)&&seats.length>=1&&new Set(seats).size===seats.length&&seats.every(i=>seatOk(s,i)),'Choose at least one pawn');requireRule(a.consent===true,'Moved players must agree');for(let i of seats)if(s.players[i].city!==a.city)relocate(s,i,a.city,ctx)}
 else if(card==='telegraph_message'){requireRule(seatOk(s,a.from)&&seatOk(s,a.to)&&a.from!==a.to,'Choose giver and receiver');requireRule(a.consent===true,'Receiver must agree');let cards=a.cards||[];requireRule(cards.length>=1&&cards.length<=2&&new Set(cards).size===cards.length&&cards.every(k=>C[k]&&s.players[a.from].hand.includes(k)),'Give 1 or 2 City cards from the giver’s hand');for(let k of cards){take(s.players[a.from],k);s.players[a.to].hand.push(k)}}
 else if(card==='travel_day_night'){requireRule(seatOk(s,a.seat)&&C[a.to]&&s.players[a.seat].city!==a.to,'Choose a pawn and a different city');requireRule(a.consent===true||a.seat===seat,'That player must agree');relocate(s,a.seat,a.to,ctx)}
 else if(card==='when_plans_were_good'){requireRule(!fromDiscard,'Cannot chain this Event');let k=a.event,i=s.discard.indexOf(k);requireRule(EVENTS[k]&&i>=0&&k!=='when_plans_were_good','Choose an Event in the Player Discard Pile');s.discard.splice(i,1);s.log.push('Retrieved '+EVENTS[k]+' from the discard pile');playEvent(s,seat,k,a.inner||{},ctx,true);s.discard.push(k)}
 else throw Error('Unknown Event')}


const FREE=new Set(['stbuild','stwater','sttreat']);
// One action performed from city `from` (the Civil Engineer chooses which of his two cities counts).
function act(s,p,cmd,from,ctx){
   if(cmd.type==='build'){let k;if(p.role==='civil_engineer'){requireRule(inCity(p,cmd.to)&&!cmd.to2,'The Civil Engineer builds only on the connection his pawn stands on');k=edgeKey(p.city,p.city2)}else k=edgeKey(from,cmd.to);buildRail(s,k);if(cmd.to2){requireRule(p.role==='railwayman'&&!s.doubleRailUsed,'Only the Railwayman, once per turn, may build two consecutive railroads');requireRule(cmd.to2!==from,'Second railroad must continue onward');buildRail(s,edgeKey(cmd.to,cmd.to2));s.doubleRailUsed=true;reactStudents(s,p,{rail:[from,cmd.to,cmd.to2]},ctx)}else reactStudents(s,p,{rail:k.split('|')},ctx)}
   else if(cmd.type==='treat'){requireRule(COLORS.includes(cmd.color)&&s.cubes[from][cmd.color]>0,'No cube of that color here');s.cubes[from][cmd.color]--;s.supply[cmd.color]++;let gone=[{city:from,color:cmd.color}];if(cmd.extra){requireRule(p.role==='rural_doctor','Only the Rural Doctor removes an extra cube');let x=cmd.extra,near=C[from].region_ids.flatMap(r=>R[r].adjacent_cities);requireRule(C[x.city]&&(x.city===from||near.includes(x.city)),'Extra cube must be in your city or a city in an adjacent region');requireRule(COLORS.includes(x.color)&&s.cubes[x.city][x.color]>0,'No such cube for the extra removal');s.cubes[x.city][x.color]--;s.supply[x.color]++;gone.push({city:x.city,color:x.color})}reactStudents(s,p,{cubes:gone},ctx)}
   else if(cmd.type==='hospital'){spend(s,p,from);s.hospitals[C[from].color]=from}
   else if(cmd.type==='share'){requireRule(cmd.consent===true,'Other player must agree');requireRule(seatOk(s,cmd.other)&&cmd.other!==s.active&&inCity(s.players[cmd.other],from),'The other player must be in your city');requireRule(cmd.direction==='give'||cmd.direction==='take','Choose give or take');let o=s.players[cmd.other],giver=cmd.direction==='take'?o:p,receiver=cmd.direction==='take'?p:o;take(giver,from);receiver.hand.push(from)}
   else if(cmd.type==='pgive'){requireRule(p.role==='politician','Politician only');requireRule(seatOk(s,cmd.other)&&cmd.other!==s.active,'Choose another player');requireRule(cmd.consent===true,'Receiver must agree');take(p,from);s.players[cmd.other].hand.push(from)}
   else if(cmd.type==='pswap'){requireRule(p.role==='politician','Politician only');requireRule(C[cmd.card]&&p.hand.includes(cmd.card),'Choose a City card in hand');let i=s.discard.indexOf(cmd.take);requireRule(C[cmd.take]&&i>=0,'Choose a City card in the discard pile');requireRule(cmd.card===from||cmd.take===from,'You must be in a city matching one of the swapped cards');s.discard.splice(i,1);take(p,cmd.card);s.discard.push(cmd.card);p.hand.push(cmd.take)}
   else if(cmd.type==='peek'){requireRule(p.role==='scientist','Royal Academy Scientist only');let top=s.playerDeck.slice(0,3);requireRule(top.length>0,'Player deck empty');requireRule(Array.isArray(cmd.order)&&cmd.order.length===top.length&&[...cmd.order].sort().join()===[...top].sort().join(),'Order must rearrange exactly the top cards');s.playerDeck.splice(0,top.length,...cmd.order)}
   else if(cmd.type==='research'){let color=cmd.color;requireRule(COLORS.includes(color)&&!s.research.includes(color)&&s.hospitals[color]===from,'A matching hospital in your city and an unresearched disease are required');requireRule(cmd.cards?.length===5&&new Set(cmd.cards).size===5&&cmd.cards.every(k=>C[k]?.color===color&&p.hand.includes(k)),'Choose five matching City cards');for(let card of cmd.cards)spend(s,p,card);s.research.push(color);pushFx(s,{kind:'research',color});if(s.research.length===4){s.status='won';s.phase='ended';s.log.push('Victory: all four diseases researched');pushFx(s,{kind:'end',text:'Victory — all four diseases researched'})}}
   else if(cmd.type==='purify'||cmd.type==='agronomist'){let r=R[cmd.region];requireRule(r&&r.adjacent_cities.includes(from),'Choose a region adjacent to your city');requireRule(s.waterSupply>0,'No purification tokens left');let amount=1;if(cmd.type==='agronomist')requireRule(p.role==='agronomist','Agronomist only');else{let color=C[cmd.card]?.color;requireRule(color&&(p.role==='scientist'||s.research.includes(color)||r.adjacent_cities.some(k=>C[k].color===color)),'Card color not eligible for this region');spend(s,p,cmd.card);amount=p.role==='agronomist'?3:2}amount=Math.min(amount,s.waterSupply);s.water[cmd.region]+=amount;s.waterSupply-=amount;reactStudents(s,p,{water:cmd.region},ctx)}
   else if(cmd.type==='attract'){requireRule(p.role==='palliative_nurse','Palliative Care Nurse only');let got=0;for(let n of ADJ[from]){let have=COLORS.filter(k=>s.cubes[n][k]>0);if(!have.length)continue;let k=choice(ctx,have,'Attract which cube from '+C[n].name+'?',have.map(c=>c+' cube'));s.cubes[n][k]--;got++;if(s.cubes[from][k]<3)s.cubes[from][k]++;else{s.supply[k]++;s.log.push('Extra '+k+' cube treated to avoid an outbreak in '+C[from].name)}}requireRule(got>0,'No cubes in connected cities')}
   else if(cmd.type==='htreat'){requireRule(p.role==='palliative_nurse','Palliative Care Nurse only');let color=C[from].color;requireRule(s.hospitals[color]===from,'You must be in a city with its Hospital');let n=s.cubes[from][color];requireRule(n>0,'No '+color+' cubes here');s.cubes[from][color]=0;s.supply[color]+=n;reactStudents(s,p,{cubes:[{city:from,color}]},ctx)}
   else if(cmd.type==='ttswap'){requireRule(p.role==='time_traveler','Time Traveller only');requireRule(s.revealed.length>0&&s.infectionDeck.length>=2,'No Infection cards to swap');let top=s.infectionDeck.slice(0,2);let d=choice(ctx,['keep',...top],'Time Traveller: the next two Infection cards are '+top.map(k=>C[k].name).join(' and ')+'. Swap one for a visible card?',['Keep both (just look)',...top.map(k=>'Swap out '+C[k].name)]);if(d!=='keep'){let v=choice(ctx,s.revealed,'Swap '+C[d].name+' for which visible Infection card?',s.revealed.map(k=>C[k].name));let i=s.infectionDeck.indexOf(d),j=s.revealed.indexOf(v);s.infectionDeck[i]=v;s.revealed[j]=d;s.log.push('Time Traveller swaps a visible Infection card with one from the deck')}}
   else if(cmd.type==='profdraw'){requireRule(p.role==='professor','University Professor only');requireRule(!p.event,'An Event card is already on your role card');requireRule(!s.profUsed,'Once per turn');requireRule(s.unusedEvents.length>0,'No unused Event cards left');let ev=shuffle(s,s.unusedEvents)[0];s.unusedEvents=s.unusedEvents.filter(k=>k!==ev);p.event=ev;s.profUsed=true;s.log.push('University Professor draws '+EVENTS[ev])}
   else if(cmd.type==='stbuild'){requireRule(p.role==='student'&&p.hold.rail,'No railroad token on the Student card');p.hold.rail=0;s.railSupply++;buildRail(s,edgeKey(from,cmd.to))}
   else if(cmd.type==='stwater'){requireRule(p.role==='student'&&p.hold.water,'No purification token on the Student card');let r=R[cmd.region];requireRule(r&&r.adjacent_cities.includes(from),'Choose a region adjacent to your city');p.hold.water=0;s.water[cmd.region]++}
   else if(cmd.type==='sttreat'){requireRule(p.role==='student'&&p.hold.cubes.includes(cmd.color),'No cube of that color on the Student card');requireRule(s.cubes[from][cmd.color]>0,'No cube of that color here');p.hold.cubes=p.hold.cubes.filter(c=>c!==cmd.color);s.supply[cmd.color]+=2;s.cubes[from][cmd.color]--}
   else throw Error('Unsupported command')}
function pushFx(s,f){f.pre=JSON.parse(JSON.stringify(s.cubes));s.fx.push(f)}
function transact(state,cmd){let s=CP(state),ctx={choices:cmd.choices||[],index:0};s.fx=[];requireRule(s.status==='playing','Game has ended');let p=s.players[s.active];
 if(cmd.type==='start'){s.revealed=s.revealed||[];s.gone=s.gone||[];requireRule(s.phase==='setup','Already started');requireRule(cmd.cities?.length===s.players.length&&seatOk(s,cmd.first),'Choose starting cities and first player');
  for(let i=0;i<s.players.length;i++){let opts=s.players[i].hand.filter(k=>C[k]);requireRule(C[cmd.cities[i]]&&(!opts.length||opts.includes(cmd.cities[i])),'Start must match a City card in that hand');relocate(s,i,cmd.cities[i],ctx)}
  s.active=cmd.first;s.phase='actions';s.log.push('First player: '+playerLabel(s,s.active));startTurn(s,ctx)}
 else if(cmd.type==='discard'){requireRule(seatOk(s,cmd.seat),'Invalid seat');requireRule(s.phase!=='setup'&&s.phase!=='epidemic','Resolve Epidemics before discarding');let q=s.players[cmd.seat];requireRule(q.hand.length>handLimit(q),'Discard only to resolve the hand limit');spend(s,q,cmd.card);s.log.push(q.name+' discards '+cardName(cmd.card))}
 else if(cmd.type==='event'){requireRule(s.phase!=='setup','Finish setup first');requireRule(seatOk(s,cmd.seat),'Invalid Event owner');let q=s.players[cmd.seat];let own=cmd.fromRole===true;if(own)requireRule(q.role==='professor'&&q.event===cmd.card,'No such Event on the role card');else requireRule(EVENTS[cmd.card]&&q.hand.includes(cmd.card),'Event not held');
  if(q.role==='professor'){let near=new Set(C[q.city].region_ids.flatMap(r=>R[r].adjacent_cities).map(k=>C[k].color));requireRule(q.hand.some(k=>C[k]&&near.has(C[k].color)),'The University Professor needs a City card matching the color of a city in an adjacent region to play an Event')}
  if(own)q.event=null;else take(q,cmd.card);s.log.push(q.name+' plays '+EVENTS[cmd.card]);playEvent(s,cmd.seat,cmd.card,cmd.args,ctx,false);if(q.role==='professor')(own?s.gone:s.removed).push(cmd.card);else s.discard.push(cmd.card)}
 else{requireRule(s.phase!=='setup','Choose starting locations first');if(cmd.type!=='epidemic')requireRule(fullHands(s).length===0,'Resolve all hands above seven before continuing');
  if(cmd.type==='draw'){requireRule(s.phase==='actions','Not in action phase');if(p.role==='time_traveler'){s.actions=0;s.log.push(p.name+' ends the actions');beginInfectionStep(s)}else if(s.playerDeck.length<2){lose(s,'not enough Player cards to draw')}else{let drawn=s.playerDeck.splice(0,2);pushFx(s,{kind:'playerDraw',cards:drawn.slice(),seat:s.active});for(let card of drawn){if(card.startsWith('epidemic_'))s.pendingEpidemics.push(card);else p.hand.push(card)}s.log.push(p.name+' draws '+drawn.map(cardName).join(', '));s.actions=0;if(s.pendingEpidemics.length)epidemic(s,ctx);else beginInfectionStep(s)}}
  else if(cmd.type==='epidemic'){requireRule(s.phase==='epidemic','No pending epidemic');epidemic(s,ctx)}
  else if(cmd.type==='infect'){requireRule(s.phase==='infection'&&s.infectionRemaining>0,'No infection due');let id=s.revealed&&s.revealed.length?s.revealed.shift():s.infectionFromBottom?s.infectionDeck.pop():s.infectionDeck.shift();pushFx(s,{kind:'infection',city:id});resolveInfection(s,id,1,ctx);s.infectionDiscard.push(id);s.infectionRemaining--;s.infectionDrawn++;if(s.status==='playing'&&s.infectionRemaining===0)endTurn(s,ctx)}
  else{requireRule(s.phase==='actions'&&s.actions>0,'No action available');let from=p.city;
   if(['carriage','train','ship'].includes(cmd.type))movePawn(s,s.active,cmd,ctx,false);
   else{if(p.city2&&cmd.type!=='build'){let ok=locs(p).filter(c=>{let t=CP(s);try{act(t,t.players[t.active],cmd,c,{choices:[],index:0});return true}catch(e){return !!e.needChoice}});if(ok.length)from=ok.length===1?ok[0]:choice(ctx,ok,'Civil Engineer: act in which city?',ok.map(k=>C[k].name))}
    act(s,p,cmd,from,ctx)}
   if(!FREE.has(cmd.type))s.actions--;
   s.log.push(p.name+': '+cmd.type+(cmd.to?' → '+C[cmd.to].name:''))}}
 s.fx.forEach((f,i)=>f.after=i+1<s.fx.length?s.fx[i+1].pre:JSON.parse(JSON.stringify(s.cubes)));invariant(s);return s}
if(typeof module!=='undefined')module.exports={VERSION,handLimit,locs,inCity,COLORS,RATE,C,R,EDGES,ADJ,ROLES,ROLE_TEXT,EVENTS,EVENT_TEXT,SETUP,HAND_LIMIT,edgeKey,initial,invariant,transact,railReach,fullHands,cardName,CP,hash};
