// Corrections after the review of the night build of 16-17 nov (issues 190, 189, 167, 188, 98, 194, 198): the enemy's hull follows its way of walking
// so that the armour is counted against the right side; a troop the captain sent or gathered stands where it is and does not walk back to its patrol;
// the retaking counts only troops that arrived after a send; a lost field yard builds nothing and its queue is paid back; dead samples leave the
// shared-sight list; a minefield found out of contact is unfound if its finder dies; the timeline shows a lost KROK, a retaking and a gathering.
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const src=require('fs').readFileSync(__dirname+'/../index.html','utf8');
let G;const seedRand=s=>{let x=s>>>0;Math.random=()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};};
function fresh(seed){seedRand(7);B.newGame(seed||1264);G=B.G;G.running=true;G.netAll=true;G.mines=G.mines||[];G.units=[];G.known.fill(1);G.knownV++;B.LOS.on=false;G.krokAuto=false;B.setCap(true);}
const angD=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
const open=(x,y)=>{for(let d=0;d<300;d+=6)for(let k=0;k<12;k++){const a=k*Math.PI/6,px=x+Math.cos(a)*d,py=y+Math.sin(a)*d;if(B.passLand(B.cellIdx(px,py)))return{x:px,y:py};}return null;};

// 1. the hull follows the way it walks, and armorSide counts against it (issue 190)
fresh();
{const p=open(G.relays[0].x,G.relays[0].y),t=B.makeEnemy({id:'T1',kind:'tank',x:p.x,y:p.y});G.enemies=[t];
  t.hd=2.5;t.aim=2.5;let moved=0;
  for(let i=0;i<200;i++){const x0=t.x;B.enemyStep(t,p.x+400,p.y,.1);moved+=Math.abs(t.x-x0);}
  ok(moved>10,'the tank walked ('+moved.toFixed(0)+' m)');
  ok(angD(t.hd,0)<.05,'its hull points the way it walked (hd '+t.hd.toFixed(2)+')');
  ok(B.armorSide(t,{x:t.x+200,y:t.y})==='front','a unit ahead of a tank driving towards it hits it from the front');
  ok(B.armorSide(t,{x:t.x-200,y:t.y})==='rear','a unit behind it hits it from the rear');
  t.hx=t.x;t.hy=t.y;t.leash=0;const hd0=t.hd;t.aim=3;for(let i=0;i<20;i++)B.updateEnemy(t,.05);ok(angD(t.hd,hd0)<1e-9,'standing still the hull does not turn with the gun');
  const lt=B.makeEnemy({id:'L1',kind:'light',x:p.x,y:p.y});ok(angD(lt.hd,lt.aim)<1e-9,'a new light armour starts with the hull where the gun points');
  ok(/m\.rotation\.y=-e\.hd;m\.userData\.head\.rotation\.y=-\(e\.aim-e\.hd\)/.test(src)&&/vehTilt3D\(m,px,py,m\.userData\.truck\?e\.hd:hullOf\(e\)/.test(src),'the 3D hull is drawn at e.hd and the turret at e.aim');}

// 2. patrol against the captain's troops (issues 189, 167, 194)
{fresh();const e=G.enemies.find(x=>x.patR&&x.mobile);ok(!!e,'there is a patrol on the island');
  if(e){G.enemies=[e];G.units=[];e.route=null;e.march=null;e.capTo=1;e.capT=G.time;e.hx=e.x;e.hy=e.y;e.gath=false;
    const tick=s=>{for(let i=0;i<s*10;i++){G.time+=.1;B.updateEnemy(e,.1);}};
    tick(30);ok(!e.route&&B.capHold(e),'a sent troop with no march left keeps standing and does not take up its patrol (held for '+B.RETAKE.hold+' s)');
    tick(B.RETAKE.hold+5);ok(!!e.route&&e.capTo==null,'after the hold it goes back to its patrol and is released');
    e.route=null;e.gath=true;e.capTo=1;e.capT=G.time;tick(60);ok(!e.route,'a gathering troop does not walk back either');
    e.gath=false;B.capRelease(e);tick(1);ok(!!e.route,'released, it patrols again');}}
{fresh();B.step(.05);const C=G.eCap,mob=G.enemies.filter(x=>x.mobile&&!x.dead).slice(0,4),r=G.relays.find(q=>q.type!=='central'&&q.type!=='hamn');
  for(const x of mob){x.patR=[{x:x.x,y:x.y},{x:x.x+20,y:x.y}];x.route=x.patR;x.pat=true;}
  const n=B.capGatherStart(C,{i:G.relays.indexOf(r)},mob,r,[],{});
  if(n>=2){const rally=mob.filter(x=>x.gath&&!x.march);ok(rally.length>=1&&rally.every(x=>!x.route),'the rally point\'s own troop has lost its patrol route and stands still');}
  else ok(true,'(no rally group could be formed on this island: '+n+')');}

// 3. a retaken field yard builds nothing, the queue is paid back (issue 167)
fresh();
{const r=G.relays.find(q=>q.type==='varv');
  if(r){r.captured=true;G.buildAt=r.id;G.res=100;G.fbuild.push({kind:'tank',t:50,total:50,at:r.id},{kind:'scout',t:20,total:20,at:r.id});
    const cost=B.buildCost('tank')+B.buildCost('scout');r.captured=false;const res0=G.res;B.step(.05);
    ok(G.fbuild.length===0&&G.res===res0+cost,'a yard the enemy holds again: queue gone and paid back ('+(G.res-res0)+' of '+cost+')');
    ok(!G.units.some(u=>!u.dead),'nothing was built');}
  else ok(true,'(no yard here)');}

// 4. dead samples leave the shared-sight list (issue 188)
fresh();
{const e=G.enemies.find(x=>!x.dead),u=B.makeUnit('tank',e.x+20,e.y);u.id='U9';G.units.push(u);
  G.time=100;B.shareNote(e,u);e.dead=true;e.deadT=100;const a=G.eRep.get([...G.eRep.keys()].find(k=>k.endsWith('|U9')));
  for(let i=1;i<=200;i++){G.time=100+i*.6;B.shareNote(e,u);}
  ok(a.length<=B.ENEMY_SHARE.t/.5+2,'the list holds '+a.length+' samples after 200 notes by a post that is dead, only those not yet due (limit '+(B.ENEMY_SHARE.t/.5+2)+'), not 200');}
fresh();
{const e=G.enemies.find(x=>!x.dead),u=B.makeUnit('tank',e.x+20,e.y);u.id='U8';G.units.push(u);
  for(let i=0;i<30;i++){G.time=100+i*.6;B.shareNote(e,u);}const b=G.eRep.get([...G.eRep.keys()].find(k=>k.endsWith('|U8')));
  ok(b.length>=1&&b.length<=30,'a living post keeps its samples as before ('+b.length+')');}

// 5. a minefield found out of contact is unfound when its finder dies (issue 98)
fresh();
{const p=open(G.relays[0].x+80,G.relays[0].y+80),cells=[];for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++){const c=B.cellIdx(p.x+dx*10,p.y+dy*10);if(B.passLand(c))cells.push(c);}
  const m={id:'MX',x:p.x,y:p.y,r:20,cells,walled:[],found:false,cleared:false,prog:0};G.mines=[m];
  const f=B.makeUnit('eng',p.x,p.y);G.units.push(f);B.mineFound(m,f,true);m.hidden=true;m.hiddenBy=f.id;
  f.dead=true;f.diedAt=G.time;G.mineT=0;B.mineTick(.3);
  ok(m.found===false&&!m.hidden&&m.walled.length===0,'the finder died: the field is undiscovered again');
  ok(cells.length>0&&m.walled.length===0&&cells.every(c=>B.W.grid[c]===B.W.baseGrid[c]),'and the walled cells are open again');}

// 6. the retaking counts only troops that arrived after a send (issue 167)
fresh();B.step(.05);
{const r=G.relays.find(q=>q.type!=='central'&&q.type!=='hamn'&&q.type!=='farja'&&q.type!=='radar'),i=G.relays.indexOf(r);r.captured=true;r.capT=G.time;
  const e=B.makeEnemy({id:'RT1',kind:'inf',x:r.x+10,y:r.y});G.enemies=[e];e.capTo=i;e.capT=G.time;
  const C=G.eCap;for(let k=0;k<30;k++)B.capRetake(C,.1);
  ok(!(r.rt>0)&&r.captured,'a troop that stands near the station without having arrived after a send does not start the countdown');
  e.capArr=G.time;for(let k=0;k<30;k++)B.capRetake(C,.1);ok((r.rt||0)>0||!r.captured,'one that has arrived does');}

// 7. ?turret and ?pansar are independent at start (source check, the UI code is not built headless)
ok(!/setGlugg\(q\?TURRET\.on/.test(src)&&/if\(!BOOTQ\.has\('turret'\)\)TURRET\.on=v==='1';if\(!BOOTQ\.has\('pansar'\)\)ARMOR\.on=v==='1'/.test(src),'the saved choice reaches each half unless the address sets that half');

// 8 and 9. the timeline (issue 194)
fresh();B.step(.05);
{G.tl=[];const k=G.kroks[0]||B.makeKrok();if(!G.kroks.includes(k))G.kroks.push(k);B.killKrok(k);
  ok(G.tl.some(d=>d.k==='lost'&&d.kind==='krok'),'a lost KROK is on the timeline');
  const C=G.eCap;C.log.push({t:50,type:'retake',z:0,refs:[],n:0,why:{ph:'start'}},{t:60,type:'retake',z:0,refs:[],n:0,why:{ph:'done'}},{t:40,type:'gather',z:0,refs:[],n:3,at:{x:0,y:0},why:{}});
  const rows=B.tlBuild().rows.map(r=>r.txt);
  ok(rows.filter(t=>/Fienden tog tillbaka/.test(t)).length===1,'the retaking is one row ('+rows.filter(t=>/tillbaka/.test(t)).join('|')+')');
  ok(rows.some(t=>/samlar förband/.test(t)),'the gathering is a row');}

// 11. the BÄVER stop button goes when the order goes (issue 198)
fresh();
{const u=B.makeUnit('eng',G.relays[0].x,G.relays[0].y);G.units.push(u);u.hold=true;u.holdLog={acts:null};u.orders=[];B.step(.05);
  ok(u.holdLog===null&&!u.hold,'an engineer that stood in a stop loses its ask when the order is gone');}

process.exit(fail?1:0);
