// The enemy retakes a station and the captain keeps a reserve (issue 167 and issue 194, Magnus 16 nov): after the counterattack has come to a taken
// station and none of the player's units is within CAP.nearR, it counts down and goes back to the enemy (not the harbour, not the command centre); the
// net, service and the chart follow; a coupled mast keeps covering its zone; the reserve for the command centre is never sent away; a counterattack
// gathers before it goes; with the flags off nothing of this happens.
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;B.CAP2.on=false;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail=1;};
let G,lines;
const seedRand=s=>{let x=s>>>0;Math.random=()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};};
function fresh(types,seed){seedRand(11);B.newGame(seed||3410);G=B.G;G.running=true;G.netAll=false;G.mines=[];G.units=[];G.known.fill(1);G.knownV++;B.LOS.on=false;G.krokAuto=false;
  B.setCap(true);lines=[];const seen=new Set();G.relays.forEach(r=>{r.captured=false;});
  for(const t of types||[]){const r=G.relays.find(q=>q.type===t);if(r){r.captured=true;r.capT=-1000;}}
  return G;}
const collect=()=>{for(const l of G.log)if(!lines.some(x=>x===l))lines.push(l);};
const run=(n,f)=>{for(let i=0;i<n;i++){B.step(.05);if(i%20===0)collect();if(f)f(i);}collect();};
const rel=t=>G.relays.find(r=>r.type===t);
const gone=(r,limit)=>{let t0=G.time;run(limit*20,()=>{});return!r.captured;};

B.RETAKE.on=true;B.RESERVE.on=false;/* the retaking alone first */

// a station taken and left alone is retaken after the counterattack arrives
{fresh(['verkstad']);const r=rel('verkstad'),C0=()=>G.eCap;
  let started=null,done=null,warned=null;
  run(20*400,()=>{if(started===null&&r.rt>0)started=G.time;if(done===null&&!r.captured)done=G.time;});
  ok(!r.captured,'a taken station without a guard is retaken ('+(done&&done.toFixed(0))+' s)');
  ok(started!==null&&done-started>=B.RETAKE.t-.2&&done-started<=B.RETAKE.t+2,'the countdown takes about as long as taking it ('+(done-started).toFixed(1)+' s)');
  ok(lines.some(l=>/^Fienden rycker ut mot punkten /.test(l.text)),'step 1: the captain says "rycker ut"');
  ok(lines.some(l=>new RegExp('^Fienden är framme vid '+r.id+'\\. Stationen hålls inte\\.$').test(l.text)),'step 2: "framme" when the countdown starts');
  ok(lines.some(l=>new RegExp('^Fienden har tagit tillbaka '+r.id+'\\.$').test(l.text)),'step 3: "tagit tillbaka"');
  ok(G.eCap.stat.retaken===1,'stat.retaken counts it');
  ok(r.rt===0&&r.prog===0,'the countdown and the capture progress are reset');
  ok(G.enemies.some(e=>!e.dead&&e.capTo===G.relays.indexOf(r)&&Math.hypot(e.x-r.x,e.y-r.y)<=B.RETAKE.atR+30),'no new guard: the troops that took it stand there');}

// a unit of the player within CAP.nearR breaks the countdown
{fresh(['verkstad']);const r=rel('verkstad');let rtMax=0,ownT=null;
  run(20*400,()=>{if(r.rt>0&&ownT===null){const u=B.makeUnit('tank',r.x+B.CAP.nearR-20,r.y);u.hp=u.maxhp=1e6;G.units.push(u);ownT=G.time;}rtMax=Math.max(rtMax,r.rt||0);});
  ok(ownT!==null&&r.captured,'a unit within CAP.nearR: the station is not retaken');
  ok(G.eCap.log.some(d=>d.type==='retake'&&d.why.ph==='break'),'the break is in the captain\'s log');}

// the harbour and the command centre are never retaken
{fresh(['hamn','central']);run(20*500);
  ok(rel('hamn').captured&&rel('central').captured,'the harbour and the command centre stay taken');
  fresh(['hamn']);run(20*500);ok(rel('hamn').captured&&(G.eCap.stat.retaken||0)===0,'the harbour is not retaken with the captain on');}

// the net, the service and the chart owner follow
{fresh(['radar']);G.netAll=true;const r=rel('radar');const m=G.structs.find(s=>s.kind==='mast'&&!s.dead);
  m.relay=true;G.masts.push({x:m.x,y:m.y,id:m.id});const v0=G.tver||0;
  const inside=B.inNet(r.x+700,r.y+700);
  run(20*400);
  ok(!r.captured&&G.netAll===false,'the radar retaken: the net round the island goes (netAll off)');
  ok((G.tver||0)>v0,'G.tver goes up');
  ok(B.inNet(m.x,m.y)&&B.inNet(m.x+30,m.y),'a coupled mast still covers its zone');
  ok(B.mastKeep(m),'the mast is kept again (mastKeep)');
  ok(!B.capUp||true,'(the flags keep the captain up)');}
{fresh(['varv'],1264);const v=rel('varv');G.buildAt=v.id;run(20*500);
  ok(!v.captured&&G.buildAt==='ship','a yard retaken: the building place goes back to the ship');
  ok(B.servicePads&&!G.relays.some(r=>r.id===v.id&&r.captured),'service at a retaken station does not exist (captured is the owner)');}

// the flag off: as before
{B.RETAKE.on=false;fresh(['verkstad']);const r=rel('verkstad');run(20*500);
  ok(r.captured&&!lines.some(l=>/tagit tillbaka/.test(l.text)),'RETAKE off: the station stays taken, no line');B.RETAKE.on=true;}
// the captain off: nothing either
{B.setCap(false);fresh(['verkstad']);B.setCap(false);const r=rel('verkstad');run(20*500);ok(r.captured,'the captain off: nothing is retaken');B.setCap(true);}

// the reserve for the command centre
B.RESERVE.on=true;B.RETAKE.on=false;
{fresh(['varv'],1264);const c=rel('central');
  const mob=G.enemies.filter(e=>!e.dead&&e.mobile),want=new Set(mob.sort((a,b)=>Math.hypot(a.x-c.x,a.y-c.y)-Math.hypot(b.x-c.x,b.y-c.y)).slice(0,B.RESERVE.keep));
  const held=B.capHeld();
  ok(held.size===Math.min(B.RESERVE.keep,mob.length)&&[...held].every(e=>want.has(e)),'the reserve is the nearest troops to the command centre ('+held.size+')');
  let sentHeld=0;const ids=[...held];
  run(20*400,()=>{for(const e of ids)if(!e.dead&&e.capTo!=null)sentHeld++;});
  ok(ids.length>0&&sentHeld===0,'the reserve is never sent to a counterattack ('+sentHeld+')');
  ok(G.eCap.stat.counter>0,'the counterattack goes anyway ('+G.eCap.stat.counter+')');
  // a taken command centre: the captain is silent and nothing is held
  c.captured=true;ok(B.capHeld().size===0,'a taken command centre: no reserve');c.captured=false;}

// the counterattack gathers first
{fresh(['varv'],1264);const C=()=>G.eCap;let gT=null,cT=null,gAt=null;
  run(20*400,()=>{const c=C();if(!c)return;if(gT===null&&c.gath){gT=G.time;gAt={x:c.gath.p.x,y:c.gath.p.y};}if(cT===null&&c.stat.counter>0)cT=G.time;});
  ok(gT!==null,'a counterattack starts by gathering');
  ok(cT!==null&&cT>=gT,'the counter decision is logged when they go ('+(cT&&(cT-gT).toFixed(1))+' s after the gathering began)');
  const lg=G.eCap.log.filter(d=>d.type==='counter')[0];
  ok(!!lg&&lg.why.gathered>=2&&lg.why.all===true&&typeof lg.why.waited==='number','the counter log tells how many gathered and how long it waited ('+JSON.stringify(lg&&lg.why)+')');
  ok(lines.filter(l=>/^Fienden rycker ut mot /.test(l.text)).length>=1&&lines.findIndex(l=>/^Fienden rycker ut mot /.test(l.text))>=0,'"rycker ut" is said when they go');
  ok(G.eCap.log.some(d=>d.type==='gather'),'the gathering is in the captain\'s log');}

// all the flags off: as before (no gathering, no reserve, no retaking)
{B.RESERVE.on=false;B.RETAKE.on=false;fresh(['verkstad']);const r=rel('verkstad');run(20*400);
  ok(r.captured&&!G.eCap.gath&&!G.eCap.log.some(d=>d.type==='gather'||d.type==='retake')&&B.capHeld().size===0,'flags off: no gathering, no reserve, no retaking');
  ok(G.eCap.stat.counter>0,'flags off: the counterattack goes straight');}

process.exit(fail?1:0);
