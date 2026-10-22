// GETING low or high (Magnus 22 okt): low it sees everything and is heard at 70 m; high (150 m) only the air defence's radar notices it,
// it sees the big targets further but not the teams on foot until they fire, and land it alone has seen is not secured for KROK
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const run=s=>{for(let i=0;i<s*20;i++)B.step(.05);};const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
B.newGame(9949);const G=B.G;G.running=true;G.netAll=true;
// a pansarvärn with a bunker within 200 m, the rest of the enemy gone
/* a team in cover (a house, a wood edge) is hidden from the air within 40 m anyway, so the pansarvärn is moved into the open by its bunker */
let pv=null,bk=null;for(const e of G.enemies)if(e.kind==='at'){const b=G.enemies.find(f=>f.kind==='turret'&&d(f,e)<200);if(!b)continue;
  for(let a=0;a<24&&!pv;a++){const x=b.x+Math.cos(a*Math.PI/12)*90,y=b.y+Math.sin(a*Math.PI/12)*90;if(!B.airCover(x,y)&&B.unitHOf({x,y,kind:'tank'})>2.75){e.x=e.hx=x;e.y=e.hy=y;e.cover=false;pv=e;bk=b;}}if(pv)break;}
ok(!!pv&&!!bk,'ö 9949 has a pansarvärn near a bunker ('+(pv&&pv.id)+', '+(bk&&bk.id)+')');
const aa=G.enemies.find(e=>e.kind==='aa');
for(const e of G.enemies)if(e!==pv&&e!==bk&&e!==aa)e.dead=true;aa.x=aa.hx=bk.x+2000;aa.y=aa.hy=bk.y;/* out of the way */
for(const v of G.units)if(v.kind!=='eng')v.dead=true;
const mx=(pv.x+bk.x)/2,my=(pv.y+bk.y)/2,g=B.makeUnit('scout',mx,my);G.units.push(g);g.fuel=1e9;
const fix=()=>{g.x=mx;g.y=my;g.orders=[];g.orbit=null;g.hp=g.maxhp;};
// 1. low sees both
fix();run(1);ok(pv.visibleNow&&bk.visibleNow,'low it sees the pansarvärn and the bunker ('+Math.round(d(g,pv))+' and '+Math.round(d(g,bk))+' m)');
const hLo=B.unitHOf(g);
// 2. high: the bunker, not the team on foot
B.setHigh(g,true);fix();run(1);
ok(Math.abs(B.unitHOf(g)-hLo-125)<1,'high it flies 125 m over its low height ('+Math.round(B.unitHOf(g)-hLo)+')');
ok(g.vision===200,'and sees 200 m');
ok(bk.visibleNow,'high it sees the bunker');ok(!pv.visibleNow,'but not the pansarvärn');
pv.reveal=2;run(.1);ok(pv.visibleNow,'until the pansarvärn fires');pv.reveal=0;run(.2);
// 3. who can fire on it
ok(B.reachVs(bk,g)===0,'high the bunker cannot reach it');ok(B.reachVs(aa,g)>0,'the air defence\'s radar can ('+B.reachVs(aa,g)+' m)');
B.setHigh(g,false);ok(B.reachVs(bk,g)===70,'low the bunker reaches it at its sig ('+B.reachVs(bk,g)+' m)');
{g.x=bk.x+50;g.y=bk.y;g.orders=[];g.orbit=null;B.setHigh(g,true);let shot=false;for(let i=0;i<60;i++){B.step(.05);g.x=bk.x+50;g.y=bk.y;if(bk.tgtU===g)shot=true;}
  ok(!shot,'high, 50 m from the bunker, the bunker does not take it as a target');
  B.setHigh(g,false);for(let i=0;i<60;i++){B.step(.05);g.x=bk.x+50;g.y=bk.y;g.hp=g.maxhp;if(bk.tgtU===g)shot=true;}ok(shot,'low it does');}
// 4. the map: land seen only from high is scouted but not secured; looking low clears it
{B.newGame(9949);const G=B.G;G.running=true;G.netAll=true;for(const e of G.enemies)e.dead=true;for(const v of G.units)if(v.kind!=='eng')v.dead=true;
  const L=B.W.landing,g=B.makeUnit('scout',L.x,L.y);G.units.push(g);g.fuel=1e9;B.setHigh(g,true);
  const ci=(x,y)=>Math.floor(y/10)*B.GW+Math.floor(x/10);let i=null;
  for(let a=0;a<12&&i==null;a++){const x=L.x+Math.cos(a*Math.PI/6)*150,y=L.y+Math.sin(a*Math.PI/6)*150,c=ci(x,y);if(!G.known[c])i=c;}
  const hold=()=>{g.x=L.x;g.y=L.y;g.orders=[];g.orbit=null;};
  for(let k=0;k<20;k++){B.step(.05);hold();}
  ok(i!=null&&G.known[i]===1&&!B.knownLo(i),'land 150 m away seen from high counts as scouted but only from high');
  {const K0=G.known.slice();G.known.fill(1);G.knownV++;for(let k=0;k<13;k++){B.step(.05);hold();}const s1=B.secureMask()[ci(L.x,L.y)];const H0=G.knownHi.slice();G.knownHi.fill(0);G.knownV++;for(let k=0;k<13;k++){B.step(.05);hold();}const s2=B.secureMask()[ci(L.x,L.y)];
    ok(!s1&&s2,'with all else scouted, the landing is secured only once nothing near it is seen from high alone ('+s1+', '+s2+')');G.known.set(K0);G.knownHi.set(H0);G.knownV++;}
  B.setHigh(g,false);for(let k=0;k<20;k++){B.step(.05);hold();}
  ok(!B.knownLo(i),'low, 150 m is beyond its 120 m: still only from high');
  g.x=L.x+(i%B.GW*10-L.x)*.5;g.y=L.y+(Math.floor(i/B.GW)*10-L.y)*.5;for(let k=0;k<20;k++)B.step(.05);
  ok(B.knownLo(i),'flown closer low, it is scouted for KROK too');}
console.log(fail?fail+' failed':'all passed');process.exit(fail?1:0);
