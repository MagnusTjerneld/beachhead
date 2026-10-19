// no clear line of fire (19 okt, issue 38, Magnus): a waiting VARG hit by an enemy behind the ground finds a firing spot instead of
// standing there, and a VARG with no spot calls in a HÖK of its wing, unless known air defence covers the target, and says so
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
B.newGame(7341);const G=B.G,W=B.W;G.running=true;G.netAll=true;for(const e of G.enemies)e.dead=true;
const g=W.grid,land=(x,y)=>{const c=g[B.cellIdx(x,y)];return c===2||c===3;},hv=(x,y)=>Math.max(0,B.elevAt(x,y,W.seed,W.V));
// a pair 90 to 120 m apart with the ground between, and on the line from the low one a spot where the bunker can be seen
/* wing support takes no long trip: the way to the tank at most 1.5 times the straight line plus 40 m */
const shortWay=(x,y,x2,y2)=>{const p=B.astar(x,y,x2,y2,i=>g[i]!==4&&g[i]!==5,()=>1);if(!p)return false;let L=0,a={x,y};for(const r of p){L+=Math.hypot(r.x-a.x,r.y-a.y);a=r;}return L<=Math.hypot(x2-x,y2-y)*1.5+40;};
let A=null,T=null,P=null;let q=7;const rnd=()=>((q=(q*16807)%2147483647)/2147483647);
for(let k=0;k<20000&&!P;k++){const x=300+rnd()*1600,y=300+rnd()*1600,a=rnd()*6.283,D=90+rnd()*30,x2=x+Math.cos(a)*D,y2=y+Math.sin(a)*D;if(!land(x,y)||!land(x2,y2))continue;
  if(B.losClear(x,y,hv(x,y)+2.7,x2,y2,hv(x2,y2)+2.7))continue;
  const reach=B.astar;for(let t=.1;t<.8&&!P;t+=.05){const px=x+(x2-x)*t,py=y+(y2-y)*t;if(!land(px,py))break;if(B.losClear(px,py,hv(px,py)+2.7,x2,y2,hv(x2,y2)+2.7)&&Math.hypot(x2-px,y2-py)<130&&shortWay(x,y,x2,y2)){A={x,y};T={x:x2,y:y2};P={x:px,y:py};}}}
ok(!!P,'(a VARG and a tank with the ground between them, a short way round and a spot on the edge'+(P?': '+Math.round(Math.hypot(T.x-A.x,T.y-A.y))+' m apart, height '+hv(A.x,A.y).toFixed(1)+' and '+hv(T.x,T.y).toFixed(1)+' m':'')+')');
if(P){const e=B.makeEnemy({id:'QS',kind:'tank',x:T.x,y:T.y});e.seen=true;e.lx=T.x;e.ly=T.y;e.dmg=0;e.hp=e.maxhp=1e5;e.speed=0;e.mobile=false;G.enemies.push(e);
  const v=B.makeUnit('tank',A.x,A.y);v.post='def';v.hp=v.maxhp=1e4;G.units.push(v);
  const h=B.makeUnit('drone',A.x,A.y);h.post='def';h.hp=h.maxhp=1e4;G.units.push(h);G.wings={'1':[v.id,h.id]};
  const said=re=>G.log.filter(l=>re.test(l.text)).length;
  // 1: hit from behind the ground while waiting, with the HÖK above spotting the tank
  let t=0,went=false;for(;t<20&&!(v.fighting&&B.sees(v,e));t+=.05){if(t<4)v.hitBy[e.id]=G.time;B.step(.05);if(v.orders[0]&&v.orders[0].support&&v.orders[0].enemy===e)went=true;}
  ok(went&&v.fighting&&B.sees(v,e),'a waiting VARG hit by a tank behind the ground goes for a spot with a clear line and fires ('+t.toFixed(1)+' s, '+v.state+', '+Math.round(Math.hypot(v.x-A.x,v.y-A.y))+' m from where it stood)');
  // 2: no spot anywhere: the wing's HÖK is sent in, with an order that lets it spend its robots on armour
  v.orders=[];h.orders=[];h.mission=null;v.losAsk=null;const n0=said(/Skickar in/);B.losCall(v,e);const o=h.orders[0];
  ok(o&&o.type==='attack'&&o.enemy===e&&o.losCall===v.id&&said(/Skickar in/)===n0+1,'with no firing spot the VARG sends in its HÖK ('+(o?o.type+' '+(o.enemy&&o.enemy.id):'no order')+')');
  B.losCall(v,e);ok(said(/Skickar in|Ingen fri skottlinje/)===n0+1,'asked again at once: no second call or message');
  // 3: known air defence over the target keeps the HÖK out
  h.orders=[];v.losAsk=null;const aa=B.makeEnemy({id:'QA',kind:'aa',x:T.x+20,y:T.y});aa.seen=true;aa.lx=aa.x;aa.ly=aa.y;aa.dmg=0;G.enemies.push(aa);
  const n1=said(/luftvärn täcker/);B.losCall(v,e);ok(!h.orders.length&&said(/luftvärn täcker/)===n1+1,'air defence over the target: no HÖK, and the VARG says why');
  aa.dead=true;
  // 4: hit from behind the ground with no short way to a spot: the HÖK goes in
  h.orders=[];v.orders=[];v.losAsk=null;v.x=A.x;v.y=A.y;v.path=null;B.SUPPORT.mate=-1;/* no support trip of its own */let c=false;for(let i=0;i<40&&!c;i++){v.hitBy[e.id]=G.time;B.step(.05);c=!!(h.orders[0]&&h.orders[0].losCall===v.id);}B.SUPPORT.mate=300;
  ok(c,'hit by a tank it neither sees nor may go round to, the waiting VARG calls in the HÖK');
  // 5: no wing, no HÖK: the captain is told
  G.wings={};h.orders=[];v.losAsk=null;const n2=said(/Skicka HÖK/);B.losCall(v,e);ok(!h.orders.length&&said(/Skicka HÖK/)===n2+1,'without a HÖK in the wing the VARG asks the captain for one');}
console.log(fail?fail+' FAILED':'all passed');process.exit(fail?1:0);
