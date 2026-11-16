// Patruller som urverk (issue 189, Magnus 16 nov, med issue 164): two to four patrols per island taken from the free mobile units (the sum of the
// enemy's strength as before), a fixed route from the island's seed, even speed and a halt at each end, a route on ground that can be walked and
// outside Birka's air for what can fire on aircraft, back on the route after an alarm or the captain's send, and the flag off gives the old island
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const seedRand=s=>{let x=s>>>0;Math.random=()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};};
const SEEDS=[1264,2024,3402,5555,9052,4787,7968,6795,3410,1490];
const COST={turret:5,aa:5,rb:1.5,inf:1,at:2,light:3,tank:5};
const pats=G=>G.enemies.filter(e=>e.route&&e.pat);
const sum=L=>L.reduce((a,e)=>a+(COST[e.kind]||0),0);
const kinds=L=>L.map(e=>e.id+e.kind).sort().join(',');
const BP=B.PATROL;
ok(BP&&BP.on===true&&BP.n[0]===2&&BP.n[1]===4&&BP.halt===20,'PATROL is on by default with n [2,4] and halt 20');

// 1: two to four patrols, the same budget as with the flag off
let tot=0;
for(const sd of SEEDS){BP.on=false;seedRand(5);B.newGame(sd);const stOff=B.G.structs.map(q=>q.kind+Math.round(q.x)+','+Math.round(q.y)).join('|'),off=B.W.enemies.map(e=>({id:e.id,kind:e.kind,x:e.x,y:e.y,route:!!e.route,cover:e.cover,guard:e.guard}));
  BP.on=true;seedRand(5);B.newGame(sd);const G=B.G,p=pats(G),WE=B.W.enemies;tot+=p.length;
  ok(p.length>=2&&p.length<=4,'ö '+sd+': '+p.length+' patrols ('+p.map(e=>e.id).join(' ')+')');
  ok(B.G.structs.map(q=>q.kind+Math.round(q.x)+','+Math.round(q.y)).join('|')===stOff,'ö '+sd+': the buildings stand where they stood with the flag off');
  ok(off.length===WE.length&&kinds(off)===kinds(WE),'ö '+sd+': the same enemies by id and kind as with the flag off');
  ok(sum(off)===sum(WE),'ö '+sd+': the same sum of strength ('+sum(WE)+')');
  const pid=new Set(p.map(e=>e.id)),offMoved=off.filter(o=>!pid.has(o.id)&&WE.find(e=>e.id===o.id&&(Math.abs(e.x-o.x)>.01||Math.abs(e.y-o.y)>.01)));
  ok(offMoved.length===0,'ö '+sd+': what is not a patrol stands where it stood'+(offMoved.length?' ('+offMoved.map(o=>o.id+o.kind).join(' ')+')':''));
  ok(off.filter(o=>o.route).length<=1,'ö '+sd+': with the flag off at most the one patrol on the road');
  // 3: the ways
  const bad=[];for(const e of p)for(const q of e.route){if(!B.passLand(B.cellIdx(q.x,q.y)))bad.push(e.id);if(e.canAir&&B.inBirka(e,q.x,q.y))bad.push(e.id+'B');}
  ok(bad.length===0,'ö '+sd+': every point of every way is passable, and outside Birka\'s air for what can fire on aircraft'+(bad.length?' ('+[...new Set(bad)].join(' ')+')':''));
  ok(p.every(e=>B.polyLen(e.route)>=40),'ö '+sd+': every way is at least 40 m ('+p.map(e=>Math.round(B.polyLen(e.route))).join(' ')+')');}
ok(tot>=SEEDS.length*2.5,'on average more than 2.5 patrols per island ('+(tot/SEEDS.length).toFixed(1)+')');

// 2: the same seed, the same ways (the world built anew, with another random sequence behind it)
for(const sd of[1264,6795,3410]){BP.on=true;seedRand(1);B.buildWorld(sd,null);const a=B.W.enemies.filter(e=>e.route).map(e=>e.id+':'+e.route.map(q=>Math.round(q.x*10)+','+Math.round(q.y*10)).join(';')).join('|');
  seedRand(99);Math.random();B.buildWorld(sd,null);const b=B.W.enemies.filter(e=>e.route).map(e=>e.id+':'+e.route.map(q=>Math.round(q.x*10)+','+Math.round(q.y*10)).join(';')).join('|');
  ok(a.length>0&&a===b,'ö '+sd+': the same seed gives the same ways');}

// 4: even laps. One patrol alone, nothing to see; the time between two halts at an end
function lap(sd,pick){BP.on=true;seedRand(5);B.newGame(sd);const G=B.G;G.units=[];G.kroks=[];G.running=true;const e=pats(G)[pick];if(!e)return null;
  const ev=[];let last=e.haltT||0;for(let i=0;i<60000&&ev.length<5;i++){G.time=i*.1;B.updateEnemy(e,.1);if(e.haltT&&e.haltT!==last){last=e.haltT;ev.push(G.time);}}
  const iv=[];for(let i=1;i<ev.length;i++)iv.push(ev[i]-ev[i-1]);return{iv,e,len:B.polyLen(e.route)};}
{let n=0;for(const sd of[1264,3402,6795]){for(let k=0;k<4;k++){const r=lap(sd,k);if(!r)continue;n++;const iv=r.iv.slice(1),mn=Math.min(...iv),mx=Math.max(...iv),want=r.len/r.e.speed+BP.halt;
      ok(iv.length>=3&&mx/mn<=1.05,'ö '+sd+' '+r.e.id+': the laps are equal within 5 % ('+iv.map(v=>v.toFixed(1)).join(' ')+' s)');
      ok(mn/want>.95&&mn/want<1.3,'ö '+sd+' '+r.e.id+': the lap is the way over the speed plus the halt, a little more on a road of close points ('+mn.toFixed(1)+' of '+want.toFixed(1)+' s)');}}
  ok(n>=6,'laps measured on '+n+' patrols');}

// 5: the halt is a halt: it stands still BP.halt s at the end
{const r=lap(1264,0);const e=r.e,G=B.G;let x0=e.x,y0=e.y,t0=G.time;/* e stands at the end of its route now */let moved=0;for(let i=0;i<150;i++){G.time=t0+i*.1;B.updateEnemy(e,.1);if(G.time-t0<BP.halt-1)moved=Math.max(moved,Math.hypot(e.x-x0,e.y-y0));}
  ok(moved<1,'at the end it stands still for the halt (moved '+moved.toFixed(2)+' m)');}

// 6: back on the route after being sent away (the captain's send nulls e.route) and after an alarm
function back(mode){BP.on=true;seedRand(5);B.newGame(6795);const G=B.G;G.units=[];G.kroks=[];G.running=true;const e=pats(G)[0];
  const R=e.patR,own=R.map(q=>({x:q.x,y:q.y}));
  for(let i=0;i<200;i++){G.time=i*.1;B.updateEnemy(e,.1);}
  const a=Math.atan2(R[0].y-e.y+1,R[0].x-e.x+1)+2,tx=e.x+Math.cos(a)*90,ty=e.y+Math.sin(a)*90;
  if(mode==='send'){const pth=B.astar(e.x,e.y,tx,ty,B.passLand,()=>1);if(pth&&pth.length){e.march=pth;e.mi=0;e.route=null;e.hx=tx;e.hy=ty;e.leash=Math.max(e.leash||0,200);}}
  else e.alert={x:tx,y:ty,t:G.time};
  const t0=G.time;let t=0,rt=null;for(let i=0;i<9000;i++){t=t0+i*.1;G.time=t;B.updateEnemy(e,.1);
    if(e.route&&!e.march&&rt===null){let d=1e9;for(let k=0;k<own.length-1;k++){const dx=own[k+1].x-own[k].x,dy=own[k+1].y-own[k].y,l2=dx*dx+dy*dy||1;let u=((e.x-own[k].x)*dx+(e.y-own[k].y)*dy)/l2;u=Math.max(0,Math.min(1,u));d=Math.min(d,Math.hypot(own[k].x+dx*u-e.x,own[k].y+dy*u-e.y));}if(d<8&&t>t0+(mode==='send'?3:22))rt=t-t0;}}
  return{rt,restored:e.route===R,moved:Math.hypot(e.x-tx,e.y-ty)};}
for(const m of['send','alarm']){const r=back(m);ok(r.restored&&r.rt!=null&&r.rt<400,'after '+(m==='send'?'the captain\'s send':'an alarm')+' it is back on its route ('+(r.rt==null?'never':r.rt.toFixed(0)+' s')+')');}

// 7: the flag off behaves as before (no halt, no way back; the route is nulled for good)
{BP.on=false;seedRand(5);B.newGame(6795);const G=B.G;G.units=[];G.kroks=[];const e=G.enemies.find(q=>q.route);ok(e&&!e.patR&&!e.pat,'with the flag off no patrol has a saved route or the urverk flag');
  BP.on=true;}

console.log(fail?'FAILED '+fail:'ALL OK');process.exit(fail?1:0);
