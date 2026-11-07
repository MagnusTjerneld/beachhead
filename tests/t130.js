// Provspel ö 1518 (issue 156, Magnus 7 nov): on Offensiv a badly hit GADDA keeps its attack order until it has fired, and a new order gets the same
// chance; on Defensiv it breaks off as before; a HOK whose target is gone circles where it is; a firing spot with room to spare is taken before one
// where the line only just passes.
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const run=(n,f)=>{for(let i=0;i<n;i++){B.step(.05);if(f&&f())return i;}return n;};
let G;
function fresh(){B.newGame(1264);G=B.G;G.running=true;G.netAll=true;G.mines=[];G.enemies=[];G.units=[];G.known.fill(1);G.knownV++;B.LOS.on=false;G.krokAuto=false;}
const put=(k,x,y)=>{const u=B.makeUnit(k,x,y);G.units.push(u);return u;};
const foe=(id,kind,x,y)=>{const e=B.makeEnemy({id,kind,x,y});e.seen=true;e.lx=e.x;e.ly=e.y;e.dead=false;e.fireCd=1e9;e.visibleNow=true;G.enemies.push(e);return e;};
const sea=()=>{const C=B.CARRIER;for(let r=200;r<700;r+=25)for(let a=0;a<6.28;a+=.2){const x=C.x+Math.cos(a)*r,y=C.y+Math.sin(a)*r;if(B.seaPass(B.cellIdx(x,y)))return{x,y};}return null;};
const said=re=>G.log.some(l=>re.test(l.text));
/* ---- GADDA on Offensiv ---- */
fresh();{const p=sea(),u=put('gadda',p.x,p.y);u.post='off';const t=foe('XT','turret',p.x+150,p.y);
  B.giveOrder(u,{type:'attack',enemy:t,post:'off'},false);run(2);u.hp=u.maxhp*.3;u.hitBy[t.id]=G.time;u.lastHit=G.time;run(2);
  ok(!u.rtb&&u.orders[0]&&u.orders[0].type==='attack','at 30 % on Offensiv the attack order stands');
  ok(u.orders[0]&&u.orders[0].underFire===1,'and it fires as soon as the bow is round');ok(said(/Ordern gäller/),'and says so');
  u.orders[0].fired=1;u.lastHit=G.time;run(2);ok(u.rtb,'once it has fired, the next hit breaks it off');ok(said(/Återvänder till HMS Birka/),'and says so');
  B.giveOrder(u,{type:'attack',enemy:t,post:'off'},false);run(1);u.lastHit=G.time;run(2);ok(!u.rtb&&u.orders[0]&&u.orders[0].type==='attack','a new order after the break is not taken back at the next hit');}
/* ---- on Defensiv it decides for itself ---- */
fresh();{const p=sea(),u=put('gadda',p.x,p.y);u.post='def';const t=foe('XT','turret',p.x+150,p.y);
  B.giveOrder(u,{type:'attack',enemy:t,post:'def'},false);run(2);u.hp=u.maxhp*.3;u.hitBy[t.id]=G.time;u.lastHit=G.time;run(2);ok(u.rtb,'at 30 % on Defensiv it breaks off at once');}
/* ---- HOK, the target gone ---- */
fresh();{const L=B.LANDING,h=put('drone',L.x,L.y-60);h.orbit={x:L.x-300,y:L.y-300};const t=foe('XT','light',L.x+120,L.y-60);t.fireCd=1e9;
  B.giveOrder(h,{type:'attack',enemy:t,post:'off'},false);run(4);ok(!h.orbit,'an attack leaves the old circle');
  t.dead=true;t.hp=0;run(40);ok(!!h.orbit&&Math.hypot(h.orbit.x-(L.x-300),h.orbit.y-(L.y-300))>150,'with the target gone it circles where it is ('+(h.orbit?Math.round(h.orbit.x)+','+Math.round(h.orbit.y):'none')+')');}
/* ---- the firing spot's margin ---- */
{B.newGame(7341);G=B.G;G.running=true;G.netAll=true;G.mines=[];G.units=[];G.known.fill(1);G.knownV++;B.LOS.on=true;
  const T=G.enemies.filter(e=>e.kind==='turret'||e.kind==='aa'||e.kind==='at').slice(0,24),L=B.LANDING;let n=0,thin0=0,thin1=0;const keep=B.FIRE.thin;
  const eh=(q)=>Math.max(0,B.heightAt(q.x,q.y))+2.7,tight=(q,e)=>!B.losClear(q.x,q.y,eh(q),e.lx,e.ly,B.hOf?B.hOf(e):B.heightAt(e.x,e.y)+2.7,B.LOS.margin+B.FIRE.slack);
  for(const e of T){e.seen=true;e.lx=e.x;e.ly=e.y;const a=Math.atan2(L.y-e.y,L.x-e.x);let p=null;for(let r=240;r<420&&!p;r+=20){const x=e.x+Math.cos(a)*r,y=e.y+Math.sin(a)*r;if(B.passLand(B.cellIdx(x,y)))p={x,y};}if(!p)continue;
    const u=B.makeUnit('tank',p.x,p.y),o={type:'attack',enemy:e};G.units=[u];
    B.FIRE.thin=0;const a0=B.fireSpot(u,o);B.FIRE.thin=keep;const a1=B.fireSpot(u,o);if(!a0||a0.none||!a1||a1.none)continue;n++;if(tight(a0,e))thin0++;if(tight(a1,e))thin1++;}
  ok(n>=8,'firing spots found for '+n+' targets');ok(thin1<=thin0,'spots where the line only just passes: '+thin0+' without the cost, '+thin1+' with it');ok(thin1===0||thin1<n/4,'and few are left');}
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
