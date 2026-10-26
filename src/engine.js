// Iberia prototype rules engine v0.9 — standard base game (7 roles, 15 Events, 2–5 players)
const VERSION='0.9.11';
const COLORS=['blue','red','yellow','black'],RATE=[2,2,2,3,3,4,4];
const C=Object.fromEntries(MAP.cities.map(c=>[c.id,c])),R=Object.fromEntries(MAP.regions.map(r=>[r.id,r]));
const edgeKey=(a,b)=>[a,b].sort().join('|'),EDGES=new Map(MAP.connections.map(e=>[edgeKey(e.a,e.b),e]));
const ADJ=Object.fromEntries(MAP.cities.map(c=>[c.id,[]]));for(let e of MAP.connections){ADJ[e.a].push(e.b);ADJ[e.b].push(e.a)}
const ROLES={sailor:'Sailor',agronomist:'Agronomist',railwayman:'Railwayman',politician:'Politician',nurse:'Nurse',scientist:'Royal Academy Scientist',rural_doctor:'Rural Doctor'};
const ROLE_TEXT={
 sailor:'Move by Ship without spending a card. When you Move by Ship you may take one passenger (a pawn in your city).',
 agronomist:'As an action, place 1 purification token into an adjacent region. When you Purify Water, you may place 1 additional token.',
 railwayman:'Once per turn, Build Railroad may place two consecutive tokens starting from your city. When you Move by Train you may take one passenger.',
 politician:'As an action, give the City card matching your city to another player anywhere. As an action, swap a City card in hand with one in the Player Discard Pile; you must be in a city matching one of them.',
 nurse:'Your prevention token sits in a region adjacent to your city. Cities adjacent to it cannot be infected. Whenever your pawn moves, move the token to a region adjacent to your new city.',
 scientist:'Purify Water with any City card regardless of color. As an action, look at the top 3 Player cards and rearrange them.',
 rural_doctor:'Treat Disease removes one cube from your city plus one more from your city or a different city in an adjacent region.'};
const EVENTS={good_season:'Good Season',government_mobilization:'Government Mobilization',hospital_founding:'Hospital Founding',mail_correspondence:'Mail Correspondence',new_rails:'New Rails',one_more_day:'One More Day',overseas_migration:'Overseas Migration',purify_water:'Purify Water',ring_railroads:'Ring Railroads',science_triumph:'Science Triumph',second_chance:'Second Chance',ships_arrive:'Ships Arrive',telegraph_message:'Telegraph Message',travel_day_night:'Travel Day and Night',when_plans_were_good:'When the Plans Were Good'};
const EVENT_TEXT={good_season:'During the next infection step, draw only 1 Infection card, from the bottom of the Infection Deck.',government_mobilization:'Each player may immediately move their pawn once for free: carriage, train, or ship.',hospital_founding:'Place or move a hospital into a city matching its color.',mail_correspondence:'Two players (anywhere on the board) can swap 1 card from their hands.',new_rails:'Add 2 railroad tokens anywhere on the board (not on dashed lines).',one_more_day:'The current player may take 2 more actions this turn.',overseas_migration:'Remove up to 2 cubes from the board.',purify_water:'Put up to 2 purification tokens onto the board, in one or two different regions.',ring_railroads:'Add 3 railroad tokens between port cities (not on dashed lines).',science_triumph:'Remove up to 1 cube from each city in one region.',second_chance:'Take the City card matching your current city from the Player Discard Pile.',ships_arrive:'Select a port city. Move 1 or more player pawns there from anywhere (with permission).',telegraph_message:'One player may give 1 or 2 City cards to one other player anywhere on the board.',travel_day_night:'Move a pawn to any city on the board (with permission).',when_plans_were_good:'Take 1 Event card from the Player Discard Pile and play it immediately.'};
const SETUP={2:{events:4,hand:4},3:{events:5,hand:3},4:{events:6,hand:2},5:{events:8,hand:2}};
const HAND_LIMIT=7;
const CP=x=>JSON.parse(JSON.stringify(x));
function requireRule(v,m){if(!v)throw Error(m)}
function random(s){s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return s.rng/4294967296}
function shuffle(s,a){a=a.slice();for(let i=a.length-1;i>0;i--){let j=Math.floor(random(s)*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function hash(t){let h=2166136261;for(let c of String(t)){h=Math.imul(h^c.charCodeAt(0),16777619)}return h>>>0}
function cardName(k){return C[k]?C[k].name:EVENTS[k]||(String(k).startsWith('epidemic')?'Epidemic':k)}
function roleName(r){return ROLES[r]||r}
function playerLabel(s,i){return s.players[i].name+' ('+roleName(s.players[i].role)+')'}

function initial(seed='iberia',difficulty=4,roles=['sailor','agronomist']){
 requireRule([4,5,6].includes(difficulty),'Difficulty must be 4, 5 or 6');
 requireRule(Array.isArray(roles)&&roles.length>=2&&roles.length<=5,'Choose 2 to 5 players');
 requireRule(roles.every(r=>ROLES[r])&&new Set(roles).size===roles.length,'Each player needs a different standard role');
 let n=roles.length,cfg=SETUP[n];
 let s={version:VERSION,mapId:'approved-34-regions',seed:String(seed),rng:hash(seed),difficulty,
  players:roles.map((role,i)=>({name:'Player '+(i+1),role,city:null,hand:[]})),active:0,phase:'setup',actions:4,turn:1,status:'playing',
  research:[],hospitals:Object.fromEntries(COLORS.map(c=>[c,null])),rails:[],railSupply:20,
  water:Object.fromEntries(MAP.regions.map(r=>[r.id,0])),waterSupply:14,prevention:null,
  cubes:Object.fromEntries(MAP.cities.map(c=>[c.id,Object.fromEntries(COLORS.map(k=>[k,0]))])),supply:Object.fromEntries(COLORS.map(c=>[c,24])),
  outbreaks:0,rateIndex:0,infectionRemaining:0,infectionDrawn:0,infectionFromBottom:false,goodSeason:false,doubleRailUsed:false,
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
 requireRule(s.waterSupply>=0&&s.waterSupply+Object.values(s.water).reduce((a,b)=>a+b,0)===14,'Water conservation failure');
 requireRule(Object.keys(s.water).length===34,'Wrong regions');
 for(let r of MAP.regions)requireRule(Number.isInteger(s.water[r.id])&&s.water[r.id]>=0,'Invalid water');
 for(let color of COLORS){requireRule(Number.isInteger(s.supply[color])&&s.supply[color]>=0,'Invalid cube supply');let total=s.supply[color];for(let c of MAP.cities){let k=s.cubes[c.id][color];requireRule(Number.isInteger(k)&&k>=0&&k<=3,'Invalid city cubes');total+=k}requireRule(total===24,'Cube conservation failure')}
 requireRule(s.railSupply>=0&&s.railSupply+s.rails.length===20,'Rail conservation failure');
 requireRule(new Set(s.rails).size===s.rails.length&&s.rails.every(k=>EDGES.has(k)&&EDGES.get(k).railway_allowed),'Invalid built railway');
 requireRule(new Set(s.research).size===s.research.length&&s.research.every(c=>COLORS.includes(c)),'Invalid research');
 for(let color of COLORS)requireRule(s.hospitals[color]===null||C[s.hospitals[color]]?.color===color,'Invalid hospital');
 let cards=[...s.playerDeck,...s.discard,...s.removed,...s.pendingEpidemics,...s.players.flatMap(p=>p.hand)];
 let expected=[...Object.keys(C),...s.eventsInGame,...Array.from({length:s.difficulty},(_,i)=>'epidemic_'+i)];
 requireRule(cards.length===expected.length&&new Set(cards).size===expected.length&&expected.every(c=>cards.includes(c)),'Player-card conservation failure');
 requireRule(s.eventsInGame.length+s.unusedEvents.length===15&&new Set([...s.eventsInGame,...s.unusedEvents]).size===15,'Event inventory failure');
 let infections=[...s.infectionDeck,...s.infectionDiscard];requireRule(infections.length===48&&new Set(infections).size===48&&infections.every(c=>C[c]),'Infection-card conservation failure');
 requireRule(new Set(s.players.map(p=>p.role)).size===n,'Duplicate roles');
 for(let p of s.players){requireRule(ROLES[p.role],'Unsupported role');requireRule(p.city===null&&s.phase==='setup'||!!C[p.city],'Invalid pawn location');requireRule(p.hand.every(c=>C[c]||EVENTS[c]),'Invalid hand card')}
 let nurse=s.players.find(p=>p.role==='nurse');
 if(nurse&&s.phase!=='setup')requireRule(R[s.prevention]&&R[s.prevention].adjacent_cities.includes(nurse.city),'Prevention token must be adjacent to the Nurse');
 if(!nurse)requireRule(s.prevention===null,'Prevention token without Nurse');
 return true}

function lose(s,reason){if(s.status!=='playing')return;s.status='lost: '+reason;s.phase='ended';s.log.push('Defeat — '+reason);pushFx(s,{kind:'end',text:'Defeat — '+reason})}
function spend(s,p,card){let i=p.hand.indexOf(card);requireRule(i>=0,'Card not in hand');p.hand.splice(i,1);s.discard.push(card)}
function take(p,card){let i=p.hand.indexOf(card);requireRule(i>=0,'Card not in hand');p.hand.splice(i,1);return card}
function fullHands(s){return s.players.map((p,i)=>p.hand.length>HAND_LIMIT?i:-1).filter(i=>i>=0)}
function railReach(s,start){let seen=new Set([start]),again=true;while(again){again=false;for(let k of s.rails){let [a,b]=k.split('|');if(seen.has(a)&&!seen.has(b)){seen.add(b);again=true}if(seen.has(b)&&!seen.has(a)){seen.add(a);again=true}}}seen.delete(start);return seen}
function choice(ctx,options,description,labels){if(options.length===1)return options[0];let v=ctx.choices[ctx.index++];if(v===undefined){let e=Error(description);e.needChoice={options,description,labels:labels||options};throw e}requireRule(options.includes(v),'Invalid choice: '+v);return v}
function regionLabel(r){return r+' — '+R[r].adjacent_cities.map(k=>C[k].name).join(', ')}
// Move any pawn; the Nurse re-places her prevention token in a region adjacent to her new city.
function relocate(s,seat,to,ctx){let q=s.players[seat];q.city=to;if(q.role==='nurse'){let opts=C[to].region_ids.slice();s.prevention=choice(ctx,opts,'Nurse: choose the region for the prevention token next to '+C[to].name,opts.map(regionLabel));s.log.push('Prevention token → '+s.prevention)}}
// Record a prevented cube on the alert that caused it (shown in the popup, then animated on the board).
function noteBlocked(s,b){let f=s.fx&&s.fx[s.fx.length-1];if(!f)return;let list=f.blocked=f.blocked||[],e=list.find(x=>x.city===b.city&&x.by===b.by&&x.region===b.region);if(e){e.n++;e.left=b.left}else list.push({...b,n:1})}
function protectedByNurse(s,id){return !!(s.prevention&&R[s.prevention].adjacent_cities.includes(id))}
function addCube(s,id,color,ctx,erupted,queue){
 if(erupted.has(id))return false;
 if(protectedByNurse(s,id)){s.log.push('Prevention token protects '+C[id].name);noteBlocked(s,{city:id,by:'nurse',region:s.prevention});return false}
 let water=C[id].region_ids.filter(r=>s.water[r]>0);
 if(water.length){let r=choice(ctx,water,'Choose which purification token protects '+C[id].name,water.map(x=>regionLabel(x)+' (×'+s.water[x]+')'));s.water[r]--;s.waterSupply++;s.log.push('Purification in '+regionLabel(r)+' protects '+C[id].name);noteBlocked(s,{city:id,by:'water',region:r,left:s.water[r]});return false}
 if(s.cubes[id][color]===3){erupted.add(id);s.outbreaks++;s.log.push('Outbreak '+s.outbreaks+': '+C[id].name);pushFx(s,{kind:'outbreak',city:id,color,count:s.outbreaks});if(s.outbreaks>=8){lose(s,'8 outbreaks');return true}queue.push(...ADJ[id].filter(n=>!erupted.has(n)));return true}
 if(s.supply[color]===0){lose(s,'no '+color+' cubes left');return false}
 s.cubes[id][color]++;s.supply[color]--;return false}
function resolveInfection(s,id,amount,ctx){let color=C[id].color,erupted=new Set(),queue=[];s.log.push('Infect '+C[id].name+' ×'+amount);for(let j=0;j<amount&&s.status==='playing';j++){if(addCube(s,id,color,ctx,erupted,queue))break}while(queue.length&&s.status==='playing')addCube(s,queue.shift(),color,ctx,erupted,queue)}
function beginInfectionStep(s){s.phase='infection';s.infectionDrawn=0;if(s.goodSeason){s.goodSeason=false;s.infectionRemaining=1;s.infectionFromBottom=true;s.log.push('Good Season: one Infection card from the bottom')}else{s.infectionRemaining=RATE[s.rateIndex];s.infectionFromBottom=false}}
function epidemic(s,ctx){let card=s.pendingEpidemics.shift();requireRule(card,'No epidemic pending');s.removed.push(card);s.rateIndex=Math.min(6,s.rateIndex+1);let id=s.infectionDeck.pop();s.log.push('Epidemic: infection rate '+RATE[s.rateIndex]+'; bottom card '+C[id].name);pushFx(s,{kind:'epidemic',city:id,rate:RATE[s.rateIndex]});resolveInfection(s,id,3,ctx);s.infectionDiscard.push(id);if(s.status!=='playing')return;s.infectionDeck=[...shuffle(s,s.infectionDiscard),...s.infectionDeck];s.infectionDiscard=[];if(s.pendingEpidemics.length)s.phase='epidemic';else beginInfectionStep(s)}
function endTurn(s){s.active=(s.active+1)%s.players.length;s.turn++;s.actions=4;s.phase='actions';s.doubleRailUsed=false;s.infectionFromBottom=false;s.log.push('Turn '+s.turn+': '+playerLabel(s,s.active))}
function buildRail(s,k){requireRule(EDGES.get(k)?.railway_allowed,'Railroads cannot be built on that connection');requireRule(!s.rails.includes(k),'Railroad already built there');requireRule(s.railSupply>0,'No railroad tokens left');s.rails.push(k);s.railSupply--}
function seatOk(s,i){return Number.isInteger(i)&&i>=0&&i<s.players.length}
// A single movement of one pawn (used by actions and Government Mobilization).
function movePawn(s,seat,m,ctx,free){let q=s.players[seat],from=q.city;requireRule(C[m.to]&&m.to!==from,'Choose a different city');
 if(m.type==='carriage')requireRule(EDGES.has(edgeKey(from,m.to)),'Destination not connected');
 else if(m.type==='train')requireRule(railReach(s,from).has(m.to),'No continuous railroad to that city');
 else if(m.type==='ship'){requireRule(C[from].port&&C[m.to].port,'Both cities must be ports');if(q.role!=='sailor'){requireRule(C[m.card]?.color===C[m.to].color,'Discard a City card matching the destination color');spend(s,q,m.card)}}
 else throw Error('Unknown movement');
 if(m.passenger!==undefined&&m.passenger!==null){requireRule(!free,'No passengers on free movement');requireRule(m.type==='ship'&&q.role==='sailor'||m.type==='train'&&q.role==='railwayman','Only the Sailor (ship) or Railwayman (train) may take a passenger');requireRule(seatOk(s,m.passenger)&&m.passenger!==seat&&s.players[m.passenger].city===from,'Passenger must be another pawn in your city');requireRule(m.consent===true,'Passenger must agree');relocate(s,m.passenger,m.to,ctx)}
 relocate(s,seat,m.to,ctx)}

function playEvent(s,seat,card,a,ctx,fromDiscard){let q=s.players[seat];a=a||{};
 if(card==='good_season'){if(s.phase==='infection'&&s.infectionDrawn===0){s.infectionRemaining=1;s.infectionFromBottom=true;s.log.push('Good Season applies to this infection step')}else s.goodSeason=true}
 else if(card==='government_mobilization'){let moves=a.moves||[];requireRule(Array.isArray(moves),'Invalid moves');let seen=new Set();for(let m of moves){if(!m)continue;requireRule(seatOk(s,m.seat)&&!seen.has(m.seat),'Each player moves at most once');seen.add(m.seat);requireRule(['carriage','train','ship'].includes(m.type),'Choose carriage, train or ship');movePawn(s,m.seat,{type:m.type,to:m.to,card:m.card},ctx,true)}}
 else if(card==='hospital_founding'){requireRule(C[a.city],'Choose a city');s.hospitals[C[a.city].color]=a.city}
 else if(card==='mail_correspondence'){requireRule(seatOk(s,a.seatA)&&seatOk(s,a.seatB)&&a.seatA!==a.seatB,'Choose two different players');requireRule(a.consent===true,'Both players must agree');let A=s.players[a.seatA],B=s.players[a.seatB];requireRule(A.hand.includes(a.cardA)&&B.hand.includes(a.cardB),'Each player must offer a card from hand');requireRule(!(a.seatA===seat&&a.cardA===card)&&!(a.seatB===seat&&a.cardB===card),'Cannot swap the Event being played');take(A,a.cardA);take(B,a.cardB);A.hand.push(a.cardB);B.hand.push(a.cardA)}
 else if(card==='new_rails'||card==='ring_railroads'){let max=card==='new_rails'?2:3,routes=a.routes||[];requireRule(Array.isArray(routes)&&routes.length>=1&&routes.length<=max&&new Set(routes).size===routes.length,'Choose 1 to '+max+' different routes');requireRule(routes.length<=s.railSupply,'Not enough railroad tokens');for(let k of routes){if(card==='ring_railroads'){let [x,y]=k.split('|');requireRule(C[x]?.port&&C[y]?.port,'Ring Railroads must connect two port cities')}buildRail(s,k)}}
 else if(card==='one_more_day'){requireRule(s.phase==='actions','One More Day must be played during the action step');s.actions+=2}
 else if(card==='overseas_migration'){let cubes=a.cubes||[];requireRule(Array.isArray(cubes)&&cubes.length<=2,'Choose up to two cubes');for(let x of cubes){requireRule(C[x.city]&&COLORS.includes(x.color)&&s.cubes[x.city][x.color]>0,'Cube not available');s.cubes[x.city][x.color]--;s.supply[x.color]++}}
 else if(card==='purify_water'){let regions=a.regions||[];requireRule(Array.isArray(regions)&&regions.length<=2&&regions.every(r=>R[r])&&regions.length<=s.waterSupply,'Choose up to two available purification tokens');for(let r of regions){s.water[r]++;s.waterSupply--}}
 else if(card==='science_triumph'){requireRule(R[a.region],'Choose a region');let rem=a.removals||[],seen=new Set();for(let x of rem){requireRule(R[a.region].adjacent_cities.includes(x.city)&&!seen.has(x.city),'One cube per city in that region');seen.add(x.city);requireRule(COLORS.includes(x.color)&&s.cubes[x.city][x.color]>0,'Cube not available');s.cubes[x.city][x.color]--;s.supply[x.color]++}}
 else if(card==='second_chance'){let c=q.city;let i=s.discard.indexOf(c);requireRule(i>=0,'The City card for '+C[c].name+' is not in the discard pile');s.discard.splice(i,1);q.hand.push(c)}
 else if(card==='ships_arrive'){requireRule(C[a.city]?.port,'Choose a port city');let seats=a.seats||[];requireRule(Array.isArray(seats)&&seats.length>=1&&new Set(seats).size===seats.length&&seats.every(i=>seatOk(s,i)),'Choose at least one pawn');requireRule(a.consent===true,'Moved players must agree');for(let i of seats)if(s.players[i].city!==a.city)relocate(s,i,a.city,ctx)}
 else if(card==='telegraph_message'){requireRule(seatOk(s,a.from)&&seatOk(s,a.to)&&a.from!==a.to,'Choose giver and receiver');requireRule(a.consent===true,'Receiver must agree');let cards=a.cards||[];requireRule(cards.length>=1&&cards.length<=2&&new Set(cards).size===cards.length&&cards.every(k=>C[k]&&s.players[a.from].hand.includes(k)),'Give 1 or 2 City cards from the giver’s hand');for(let k of cards){take(s.players[a.from],k);s.players[a.to].hand.push(k)}}
 else if(card==='travel_day_night'){requireRule(seatOk(s,a.seat)&&C[a.to]&&s.players[a.seat].city!==a.to,'Choose a pawn and a different city');requireRule(a.consent===true||a.seat===seat,'That player must agree');relocate(s,a.seat,a.to,ctx)}
 else if(card==='when_plans_were_good'){requireRule(!fromDiscard,'Cannot chain this Event');let k=a.event,i=s.discard.indexOf(k);requireRule(EVENTS[k]&&i>=0&&k!=='when_plans_were_good','Choose an Event in the Player Discard Pile');s.discard.splice(i,1);s.log.push('Retrieved '+EVENTS[k]+' from the discard pile');playEvent(s,seat,k,a.inner||{},ctx,true);s.discard.push(k)}
 else throw Error('Unknown Event')}

function pushFx(s,f){f.pre=JSON.parse(JSON.stringify(s.cubes));s.fx.push(f)}
function transact(state,cmd){let s=CP(state),ctx={choices:cmd.choices||[],index:0};s.fx=[];requireRule(s.status==='playing','Game has ended');let p=s.players[s.active];
 if(cmd.type==='start'){requireRule(s.phase==='setup','Already started');requireRule(cmd.cities?.length===s.players.length&&seatOk(s,cmd.first),'Choose starting cities and first player');
  for(let i=0;i<s.players.length;i++){let opts=s.players[i].hand.filter(k=>C[k]);requireRule(C[cmd.cities[i]]&&(!opts.length||opts.includes(cmd.cities[i])),'Start must match a City card in that hand');relocate(s,i,cmd.cities[i],ctx)}
  s.active=cmd.first;s.phase='actions';s.log.push('First player: '+playerLabel(s,s.active))}
 else if(cmd.type==='discard'){requireRule(seatOk(s,cmd.seat),'Invalid seat');requireRule(s.phase!=='setup'&&s.phase!=='epidemic','Resolve Epidemics before discarding');let q=s.players[cmd.seat];requireRule(q.hand.length>HAND_LIMIT,'Discard only to resolve the hand limit');spend(s,q,cmd.card);s.log.push(q.name+' discards '+cardName(cmd.card))}
 else if(cmd.type==='event'){requireRule(s.phase!=='setup','Finish setup first');requireRule(seatOk(s,cmd.seat),'Invalid Event owner');let q=s.players[cmd.seat];requireRule(EVENTS[cmd.card]&&q.hand.includes(cmd.card),'Event not held');take(q,cmd.card);s.log.push(q.name+' plays '+EVENTS[cmd.card]);playEvent(s,cmd.seat,cmd.card,cmd.args,ctx,false);s.discard.push(cmd.card)}
 else{requireRule(s.phase!=='setup','Choose starting locations first');if(cmd.type!=='epidemic')requireRule(fullHands(s).length===0,'Resolve all hands above seven before continuing');
  if(cmd.type==='draw'){requireRule(s.phase==='actions','Not in action phase');if(s.playerDeck.length<2){lose(s,'not enough Player cards to draw')}else{let drawn=s.playerDeck.splice(0,2);pushFx(s,{kind:'playerDraw',cards:drawn.slice(),seat:s.active});for(let card of drawn){if(card.startsWith('epidemic_'))s.pendingEpidemics.push(card);else p.hand.push(card)}s.log.push(p.name+' draws '+drawn.map(cardName).join(', '));s.actions=0;if(s.pendingEpidemics.length)epidemic(s,ctx);else beginInfectionStep(s)}}
  else if(cmd.type==='epidemic'){requireRule(s.phase==='epidemic','No pending epidemic');epidemic(s,ctx)}
  else if(cmd.type==='infect'){requireRule(s.phase==='infection'&&s.infectionRemaining>0,'No infection due');let id=s.infectionFromBottom?s.infectionDeck.pop():s.infectionDeck.shift();pushFx(s,{kind:'infection',city:id});resolveInfection(s,id,1,ctx);s.infectionDiscard.push(id);s.infectionRemaining--;s.infectionDrawn++;if(s.status==='playing'&&s.infectionRemaining===0)endTurn(s)}
  else{requireRule(s.phase==='actions'&&s.actions>0,'No action available');let from=p.city;
   if(['carriage','train','ship'].includes(cmd.type))movePawn(s,s.active,cmd,ctx,false);
   else if(cmd.type==='build'){buildRail(s,edgeKey(from,cmd.to));if(cmd.to2){requireRule(p.role==='railwayman'&&!s.doubleRailUsed,'Only the Railwayman, once per turn, may build two consecutive railroads');requireRule(cmd.to2!==from,'Second railroad must continue onward');buildRail(s,edgeKey(cmd.to,cmd.to2));s.doubleRailUsed=true}}
   else if(cmd.type==='treat'){requireRule(COLORS.includes(cmd.color)&&s.cubes[from][cmd.color]>0,'No cube of that color here');s.cubes[from][cmd.color]--;s.supply[cmd.color]++;if(cmd.extra){requireRule(p.role==='rural_doctor','Only the Rural Doctor removes an extra cube');let x=cmd.extra,near=C[from].region_ids.flatMap(r=>R[r].adjacent_cities);requireRule(C[x.city]&&(x.city===from||near.includes(x.city)),'Extra cube must be in your city or a city in an adjacent region');requireRule(COLORS.includes(x.color)&&s.cubes[x.city][x.color]>0,'No such cube for the extra removal');s.cubes[x.city][x.color]--;s.supply[x.color]++}}
   else if(cmd.type==='hospital'){spend(s,p,from);s.hospitals[C[from].color]=from}
   else if(cmd.type==='share'){requireRule(cmd.consent===true,'Other player must agree');requireRule(seatOk(s,cmd.other)&&cmd.other!==s.active&&s.players[cmd.other].city===from,'The other player must be in your city');requireRule(cmd.direction==='give'||cmd.direction==='take','Choose give or take');let o=s.players[cmd.other],giver=cmd.direction==='take'?o:p,receiver=cmd.direction==='take'?p:o;take(giver,from);receiver.hand.push(from)}
   else if(cmd.type==='pgive'){requireRule(p.role==='politician','Politician only');requireRule(seatOk(s,cmd.other)&&cmd.other!==s.active,'Choose another player');requireRule(cmd.consent===true,'Receiver must agree');take(p,from);s.players[cmd.other].hand.push(from)}
   else if(cmd.type==='pswap'){requireRule(p.role==='politician','Politician only');requireRule(C[cmd.card]&&p.hand.includes(cmd.card),'Choose a City card in hand');let i=s.discard.indexOf(cmd.take);requireRule(C[cmd.take]&&i>=0,'Choose a City card in the discard pile');requireRule(cmd.card===from||cmd.take===from,'You must be in a city matching one of the swapped cards');s.discard.splice(i,1);take(p,cmd.card);s.discard.push(cmd.card);p.hand.push(cmd.take)}
   else if(cmd.type==='peek'){requireRule(p.role==='scientist','Royal Academy Scientist only');let top=s.playerDeck.slice(0,3);requireRule(top.length>0,'Player deck empty');requireRule(Array.isArray(cmd.order)&&cmd.order.length===top.length&&[...cmd.order].sort().join()===[...top].sort().join(),'Order must rearrange exactly the top cards');s.playerDeck.splice(0,top.length,...cmd.order)}
   else if(cmd.type==='research'){let color=cmd.color;requireRule(COLORS.includes(color)&&!s.research.includes(color)&&s.hospitals[color]===from,'A matching hospital in your city and an unresearched disease are required');requireRule(cmd.cards?.length===5&&new Set(cmd.cards).size===5&&cmd.cards.every(k=>C[k]?.color===color&&p.hand.includes(k)),'Choose five matching City cards');for(let card of cmd.cards)spend(s,p,card);s.research.push(color);pushFx(s,{kind:'research',color});if(s.research.length===4){s.status='won';s.phase='ended';s.log.push('Victory: all four diseases researched');pushFx(s,{kind:'end',text:'Victory — all four diseases researched'})}}
   else if(cmd.type==='purify'||cmd.type==='agronomist'){let r=R[cmd.region];requireRule(r&&r.adjacent_cities.includes(from),'Choose a region adjacent to your city');requireRule(s.waterSupply>0,'No purification tokens left');let amount=1;if(cmd.type==='agronomist')requireRule(p.role==='agronomist','Agronomist only');else{let color=C[cmd.card]?.color;requireRule(color&&(p.role==='scientist'||s.research.includes(color)||r.adjacent_cities.some(k=>C[k].color===color)),'Card color not eligible for this region');spend(s,p,cmd.card);amount=p.role==='agronomist'?3:2}amount=Math.min(amount,s.waterSupply);s.water[cmd.region]+=amount;s.waterSupply-=amount}
   else throw Error('Unsupported command');
   s.actions--;s.log.push(p.name+': '+cmd.type+(cmd.to?' → '+C[cmd.to].name:''))}}
 s.fx.forEach((f,i)=>f.after=i+1<s.fx.length?s.fx[i+1].pre:JSON.parse(JSON.stringify(s.cubes)));invariant(s);return s}
if(typeof module!=='undefined')module.exports={VERSION,COLORS,RATE,C,R,EDGES,ADJ,ROLES,ROLE_TEXT,EVENTS,EVENT_TEXT,SETUP,HAND_LIMIT,edgeKey,initial,invariant,transact,railReach,fullHands,cardName,CP,hash};
