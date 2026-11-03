// Nedskjuten besättning görs om (issue 124, Magnus 3 nov and 4 nov): the crew becomes a unit of its own when found, walks 1.5 m/s on land, can be
// shot, follows no group order; KROK lands for it on HÖK's terms (landWhy, landSpot), KROK, VARG and BÄVER take it aboard but not HÖK, GETING,
// MUS or GÄDDA; the icon over the vehicle; the mission is done when it is aboard Birka and fails when it or its vehicle is lost
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const run=(n,f)=>{for(let i=0;i<n;i++){B.step(.05);if(f&&f())return i;}return n;};
let G;
function fresh(sd){B.newGame(sd,null,{uppdrag:'crew'});G=B.G;G.running=true;G.netAll=true;G.mines=[];G.known.fill(1);G.knownV++;B.LOS.on=false;G.krokAuto=false;return G.mission==='crew';}
const put=(k,x,y)=>{const u=B.makeUnit(k,x,y);G.units.push(u);return u;};
const lastLog=()=>G.log.slice(0,6).map(l=>l.text).join(' | ');
const sel=us=>{G.selIds=us.map(u=>u.id);G.sel=G.selIds[0]||null;};
const found=()=>{const q=G.misCrew,v=put('tank',q.x+25,q.y);B.misTick(.05);return{v,c:B.crewU()};};
// a seed with the crew placed by an air defence and ground for KROK near it
let SD=null;
for(const sd of[3402,1035,5555,1012,2024,2551,4836,5795,2107,2255,1888,1148,9052,7670]){if(!fresh(sd))continue;if(G.misCrew.noAA||G.misCrew.noLand)continue;G.enemies=[];if(B.landSpot(B.G.kroks[0],G.misCrew.x,G.misCrew.y,[])){SD=sd;break;}}
ok(SD!=null,'a crew island with an air defence near it and ground for KROK ('+SD+')');

// 6: placement. Within an air defence's reach on most islands; the numbers are printed
{let n=0,aa=0,land=0;for(const sd of[1000,1148,1296,1444,1592,1740,1888,1959,2107,2255,2403,2551]){if(!fresh(sd))continue;n++;const q=G.misCrew;if(q.noAA)continue;aa++;if(!q.noLand)land++;
    let best=9;for(const e of G.enemies)if(e.kind==='aa')best=Math.min(best,Math.hypot(q.x-e.x,q.y-e.y)/B.airR(e));
    if(!(best>=B.CREW.aaMin-1e-6&&best<=B.CREW.aaMax+1e-6)){ok(false,'ö '+sd+': the crew lies '+best.toFixed(2)+' of an air defence\'s reach away');}
    for(const e of G.enemies)if(e.canGround&&!e.mobile&&e.kind!=='kust'&&Math.hypot(q.x-e.x,q.y-e.y)<=e.range)ok(false,'ö '+sd+': inside the reach of '+e.id);}
  ok(aa>=n*.6,'most islands put it within an air defence\'s reach ('+aa+' of '+n+'), '+land+' of them with ground for KROK near it');}

// 1: found, and a unit of its own
fresh(SD);G.enemies=[];
{const q=G.misCrew,c0=B.crewU();ok(!c0&&!q.found,'before it is found there is no unit, only the ring');
  const far=put('tank',q.x+200,q.y);B.misTick(.05);ok(!q.found,'a unit 200 m off does not find it');far.dead=true;
  const{v,c}=found();
  ok(q.found&&c&&c.kind==='crew'&&G.units.includes(c),'found by a vehicle within 45 m: a unit of kind crew');
  ok(c.hp===20&&c.maxhp===20&&c.speed===1.5,'20 hull and 1.5 m/s');
  ok(/^C\d\d$/.test(c.tag)&&c.name==='BESÄTTNING '+c.tag,'its call number is '+c.tag+' ('+c.name+')');
  ok(!G.wrecks.some(w=>w.kind==='crew'),'no wreck: it is not lifted in the hook');
  ok(!B.towable({kind:'crew'}),'and not towed');
  ok(/hittad/.test(lastLog()),'a line in the log');}

// 2: it walks, on land only, 1.5 m/s
fresh(SD);G.enemies=[];
{const{v,c}=found();v.x-=500;/* the finder leaves */sel([c]);const q=G.misCrew;
  let tgt=null;for(let r=30;r<60&&!tgt;r+=5)for(let a=0;a<6.28&&!tgt;a+=.4){const x=c.x+Math.cos(a)*r,y=c.y+Math.sin(a)*r;if(B.passLand(B.cellIdx(x,y))&&B.passLand(B.cellIdx((x+c.x)/2,(y+c.y)/2)))tgt={x,y};}
  const d0=Math.hypot(tgt.x-c.x,tgt.y-c.y);B.groupOrder({world:tgt},false);ok(c.orders.length===1&&c.orders[0].type==='move','a click gives it a move order');
  const x0=c.x,y0=c.y;run(40);const d1=Math.hypot(c.x-x0,c.y-y0);ok(d1>2.5&&d1<3.2,'in two seconds it has walked about 3 m ('+d1.toFixed(2)+')');
  let wet=0;run(2400,()=>{if(!B.passLand(B.cellIdx(c.x,c.y)))wet++;return !c.orders.length;});
  ok(c.orders.length===0&&Math.hypot(tgt.x-c.x,tgt.y-c.y)<2,'it arrives ('+Math.hypot(tgt.x-c.x,tgt.y-c.y).toFixed(1)+' m off, of '+d0.toFixed(0)+')');
  ok(wet===0,'and was never in water');
  // a target in the sea: it goes as near as the land allows, and not into the water
  G.enemies=[];let sea=null;for(let r=60;r<600&&!sea;r+=20)for(let a=0;a<6.28&&!sea;a+=.3){const x=c.x+Math.cos(a)*r,y=c.y+Math.sin(a)*r;if(x>10&&y>10&&x<B.W.WW-10&&!B.passLand(B.cellIdx(x,y))&&B.W.grid[B.cellIdx(x,y)]<=1)sea={x,y};}
  if(sea){B.groupOrder({world:sea},false);wet=0;run(3000,()=>{if(!B.passLand(B.cellIdx(c.x,c.y)))wet++;return !c.orders.length;});ok(wet===0,'ordered into the sea it stays on land');}}

// 3: it follows no group order
fresh(SD);G.enemies=[];
{const{v,c}=found();sel([c,v]);const p0={x:c.x,y:c.y};B.groupOrder({world:{x:c.x+40,y:c.y}},false);
  ok(c.orders.length===0,'in a group order it is left out');ok(v.orders.length===1,'the VARG takes the order');ok(/följer inte med i grupporder/.test(lastLog()),'and the captain is told');
  // not in a wing
  B.assignWing('1');ok(!(G.wings['1']||[]).includes(c.id)&&(G.wings['1']||[]).includes(v.id),'it is not put in a wing');
}

// 4: KROK, VARG and BÄVER take it aboard, others not
fresh(SD);G.enemies=[];
{const{v,c}=found();const b=put('eng',c.x-4,c.y),h=put('drone',c.x+3,c.y),g=put('scout',c.x+3,c.y+3),m=put('mus',c.x+2,c.y);
  ok(B.crewCan(v)&&B.crewCan(b)&&B.crewCan(G.kroks[0]),'KROK, VARG and BÄVER can');ok(!B.crewCan(h)&&!B.crewCan(g)&&!B.crewCan(m)&&!B.crewCan(put('gadda',c.x,c.y)),'HÖK, GETING, MUS and GÄDDA cannot');
  for(const x of[h,g,m]){B.giveOrder(c,{type:'board',unit:x,post:'def'},false);run(10);ok(!c.carried&&!x.crew,x.name+': the crew does not go aboard');}
  v.x=c.x+20;v.y=c.y;B.giveOrder(c,{type:'board',unit:v,post:'def'},false);
  // a vehicle that is moving: the crew waits for it to stop
  v.orders=[{type:'move',x:v.x,y:v.y+300,post:'def'}];v.path=null;run(30);ok(!c.carried,'a VARG on the move: it does not board');
  v.orders=[];v.path=null;run(2000,()=>!!c.carried);
  ok(c.carried===v.id&&v.crew===c.id,'it walked to the VARG and went aboard once it stood still');
  const p=c.x;run(40);ok(Math.hypot(c.x-v.x,c.y-v.y)<.01,'aboard it follows the vehicle');
  sel([c]);ok(B.stowed(c)&&!B.selUnits().includes(c),'aboard it is stowed: not selectable');
  // set off again
  const self=B.selfItems(v).find(i=>/Sätt av besättningen/.test(i.l));ok(!!self,'the vehicle\'s own menu has Sätt av besättningen');self.f();
  ok(!c.carried&&!v.crew&&B.passLand(B.cellIdx(c.x,c.y)),'it is set down on land beside the vehicle');
  // BÄVER
  B.giveOrder(c,{type:'board',unit:b,post:'def'},false);run(400,()=>!!c.carried);ok(c.carried===b.id,'BÄVER takes it too');}

// fetch: the vehicle drives to it
fresh(SD);G.enemies=[];
{const{v,c}=found();v.x=c.x+60;v.y=c.y+10;if(!B.passLand(B.cellIdx(v.x,v.y))){v.x=c.x+25;v.y=c.y;}
  B.crewFetch(v,c);ok(v.fetch&&v.orders.length===1,'Hämta besättningen sends the vehicle');
  run(3000,()=>!!c.carried);ok(c.carried===v.id,'it arrives and the crew boards ('+(c.carried?'':lastLog())+')');}

// 5: done when aboard Birka. A vehicle on the deck
fresh(SD);G.enemies=[];
{const{v,c}=found();B.crewBoard(c,v);run(2);ok(!G.over&&!G.misGot,'aboard a vehicle in the field is not done');
  const sp=B.shipPos(4.5,-30);v.x=sp[0];v.y=sp[1];run(3);
  ok(G.misGot&&G.over&&!G.failed,'the vehicle on Birka\'s deck: the mission is done');}
// the crew walks aboard when she lies at the beach
fresh(SD);G.enemies=[];
{const{c}=found();G.beach={st:'on',tipH:0};G.ramp={bow:1,side:1};c.orders=[];
  B.giveOrder(c,{type:'birka',post:'def'},false);
  const t=B.crewTip();c.x=t.x+30;c.y=t.y;/* near the foot of her ramp */
  const sea=!B.passLand(B.cellIdx(c.x,c.y));if(sea){c.x=t.x;c.y=t.y;}
  run(2000,()=>G.misGot);
  ok(G.misGot&&G.over&&!G.failed,'she lies at the beach: the crew walks aboard on its own');
  fresh(SD);G.enemies=[];const f=found();f.c.orders=[];B.giveOrder(f.c,{type:'birka',post:'def'},false);run(5);
  ok(!f.c.orders.length&&/inte vid stranden/.test(lastLog()),'with her at anchor the order is refused');}

// 3: KROK lands only where landWhy allows, takes the crew aboard and flies it home
fresh(SD);G.enemies=[];
{const{v,c}=found();v.dead=true;const k=G.kroks[0];sel([]);
  const s0=B.landSpot(k,c.x,c.y,[]);ok(!!s0,'ground to land on near the crew');
  B.krokOrder(k,{type:'crewland',mode:'load',unit:c},false);
  let landedAt=null;const i=run(6000,()=>{if(k.landed&&!landedAt)landedAt={x:k.x,y:k.y,why:B.landWhy(k,k.x,k.y),alt:B.unitHOf(k)};return !!k.crew;});
  ok(!!landedAt&&landedAt.why===null,'KROK landed on ground landWhy allows ('+(landedAt?Math.round(Math.hypot(landedAt.x-c.x,landedAt.y-c.y))+' m from the crew':'never landed: '+k.status+' '+lastLog())+')');
  ok(k.crew===c.id&&c.carried===k.id,'the crew went aboard');
  ok(!k.cargo&&!k.carry,'nothing hangs in the hook');
  run(200);ok(!k.landed,'KROK lifts again');
  run(6000,()=>G.misGot);ok(G.misGot&&G.over&&!G.failed,'KROK over Birka\'s pad with the crew: the mission is done ('+Math.round(Math.hypot(k.x-k.pad.x,k.y-k.pad.y))+' m from the pad)');}
// refused: a known bunker in reach of the crew and no ground outside it within 40 m
fresh(SD);G.enemies=[];
{const{v,c}=found();v.dead=true;const k=G.kroks[0];
  const e=B.makeEnemy({id:'XT',kind:'turret',x:c.x+30,y:c.y});e.seen=true;e.lx=e.x;e.ly=e.y;G.enemies.push(e);
  ok(!!B.landWhy(k,c.x,c.y),'with a known bunker in reach, landWhy says no ('+B.landWhy(k,c.x,c.y)+')');
  B.krokOrder(k,{type:'crewland',mode:'load',unit:c},false);run(10);
  ok(k.orders.length===0&&!k.landed&&/Landar inte/.test(lastLog()),'KROK refuses and says why: '+lastLog().split(' | ')[0]);
  // unscouted ground
  G.enemies=[];G.known.fill(0);G.knownV++;ok(B.landWhy(k,c.x,c.y)==='marken runt ej spanad','unscouted ground: no');}
// KROK refuses with a load on the hook; and the menu item is greyed with the reason
fresh(SD);G.enemies=[];
{const{v,c}=found();v.dead=true;const k=G.kroks[0];k.cargo=B.makeUnit('tank',0,0);B.krokOrder(k,{type:'crewland',mode:'load',unit:c},false);ok(k.orders.length===0,'KROK with a load in the hook does not land');k.cargo=null;}
// it lifts when an enemy comes in sight while it waits
fresh(SD);G.enemies=[];
{const{v,c}=found();v.dead=true;const k=G.kroks[0];c.x+=0;
  B.krokOrder(k,{type:'crewland',mode:'load',unit:c},false);
  // keep the crew from boarding: it stands still with an order to nowhere
  c.speed=0;run(6000,()=>k.landed);ok(k.landed,'landed');
  const spotter=put('tank',k.x+12,k.y);const e=B.makeEnemy({id:'XI',kind:'inf',x:k.x+60,y:k.y});e.seen=true;e.lx=e.x;e.ly=e.y;G.enemies.push(e);run(10);
  ok(!k.landed&&k.orders.length===0&&!k.crew,'an enemy in sight: it lifts and the order is struck');}
// and sets the crew down again (Landa och sätt av)
fresh(SD);G.enemies=[];
{const{v,c}=found();const k=G.kroks[0],P={x:c.x,y:c.y};B.crewBoard(c,k);
  B.krokOrder(k,{type:'crewland',mode:'unload',x:P.x,y:P.y,unit:null},false);run(6000,()=>!k.crew&&!k.landed&&k.orders.length===0);
  ok(!k.crew&&!c.carried&&B.passLand(B.cellIdx(c.x,c.y)),'KROK sets the crew down on land');}

// the icon over a vehicle with the crew aboard, and the wrench beside it on a pad
fresh(SD);G.enemies=[];
{const{v,c}=found();const k=G.kroks[0];B.crewBoard(c,v);
  let m=B.taskMarks();ok(m.some(x=>x.g==='crew'&&x.unit===v),'the crew icon over the VARG');
  v.orders=[{type:'rtb',post:'def'}];v.pad={key:'ship',i:0,t:0};v.onPad=true;const pp=B.shipPos(4.5,-38);v.x=pp[0];v.y=pp[1];
  m=B.taskMarks();ok(m.some(x=>x.g==='crew'&&x.unit===v)&&m.some(x=>x.g==='wrench'&&x.unit===v&&x.sh===1),'on a pad the crew icon stays and the wrench moves beside it');
  v.crew=null;c.carried=null;B.crewBoard(c,k);m=B.taskMarks();ok(m.some(x=>x.g==='crew'&&x.unit===k),'KROK with the crew aboard has the icon too');}

// 7: the patrol and the enemy reaching it
fresh(SD);
{const q=G.misCrew,{v,c}=found();v.dead=true;c.orders=[];G.time=B.MISSION.crew?480:480;
  const e=G.enemies.find(x=>x.mobile);
  if(e){e.x=c.x+200;e.y=c.y;B.misTick(.05);ok(q.patrol&&q.pat.length>=1,'after 8 minutes the patrol is sent for the crew');}
  const w=B.makeEnemy({id:'XW',kind:'inf',x:c.x+10,y:c.y});G.enemies=[w];B.misTick(.05);ok(G.over&&G.failed&&/tagit besättningen/.test(lastLog()),'an enemy within 15 m of it on foot: failed');}
fresh(SD);G.enemies=[];
{const{v,c}=found();B.crewBoard(c,v);const w=B.makeEnemy({id:'XW',kind:'inf',x:c.x+10,y:c.y});G.enemies=[w];B.misTick(.05);ok(!G.over,'aboard a vehicle the enemy beside it does not take it');}

// 8: lost
fresh(SD);G.enemies=[];
{const{v,c}=found();B.killUnit(c,'Träffad.');B.misTick(.05);ok(G.over&&G.failed,'the crew shot: the mission fails');ok(!G.wrecks.some(w=>w.kind==='crew'),'and leaves no wreck');}
fresh(SD);G.enemies=[];
{const{v,c}=found();B.crewBoard(c,v);B.killUnit(v);B.misTick(.05);ok(G.over&&G.failed&&/Fordonet med besättningen/.test(lastLog()),'the VARG with the crew aboard knocked out: it fails');}
fresh(SD);G.enemies=[];
{const{v,c}=found();const k=G.kroks[0];B.crewBoard(c,k);k.dead=true;k.diedAt=G.time;B.misTick(.05);ok(G.over&&G.failed,'KROK with the crew aboard knocked out: it fails');}
// shot by the enemy
fresh(SD);G.enemies=[];
{const{v,c}=found();v.x-=400;const e=B.makeEnemy({id:'XT',kind:'turret',x:c.x+60,y:c.y});G.enemies.push(e);B.G.known.fill(1);
  run(400,()=>c.dead);ok(c.dead,'a bunker kills it');run(2);ok(G.over&&G.failed,'and the mission fails');}

// an old save: the crew as a wreck becomes the unit
fresh(SD);G.enemies=[];
{const q=G.misCrew;q.found=true;const w=B.addWreck(q.x,q.y,0,false,'crew');w.mis=true;w.seen=true;G.misW=w;const k=G.kroks[0];k.carry=w;
  B.misTick(.05);const c=B.crewU();ok(c&&c.kind==='crew'&&!G.wrecks.includes(w)&&!G.misW&&!k.carry,'a save with the crew as a wreck on KROK\'s hook: it becomes the unit');}

// the briefing and the goal say how
fresh(SD);
{const t=B.misBriefText();ok(/ombord på Birka/.test(t)&&/luftvärn/.test(t)&&!/med KROK innan/.test(t),'the briefing: aboard Birka, shot down by air defence');}
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
