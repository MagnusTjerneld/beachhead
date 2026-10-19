// line of sight against the ground (19 okt, issue 38): a bunker and a VARG with a ridge between them do not see or fire on each
// other; at a spot on the edge with a clear line they do, whatever the difference in height
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
B.newGame(7341);const G=B.G,W=B.W;G.running=true;G.netAll=true;for(const e of G.enemies)e.dead=true;
const g=W.grid,land=(x,y)=>{const c=g[B.cellIdx(x,y)];return c===2||c===3;},hv=(x,y)=>Math.max(0,B.elevAt(x,y,W.seed,W.V));
// a pair 90 to 120 m apart with the ground between, and on the line from the low one a spot where the bunker can be seen
let A=null,T=null,P=null;let q=7;const rnd=()=>((q=(q*16807)%2147483647)/2147483647);
for(let k=0;k<20000&&!P;k++){const x=300+rnd()*1600,y=300+rnd()*1600,a=rnd()*6.283,D=90+rnd()*30,x2=x+Math.cos(a)*D,y2=y+Math.sin(a)*D;if(!land(x,y)||!land(x2,y2))continue;
  if(B.losClear(x,y,hv(x,y)+2.7,x2,y2,hv(x2,y2)+2.7))continue;
  const reach=B.astar;for(let t=.1;t<.8&&!P;t+=.05){const px=x+(x2-x)*t,py=y+(y2-y)*t;if(!land(px,py))break;if(B.losClear(px,py,hv(px,py)+2.7,x2,y2,hv(x2,y2)+2.7)&&Math.hypot(x2-px,y2-py)<130){A={x,y};T={x:x2,y:y2};P={x:px,y:py};}}}
ok(!!P,'(a VARG and a bunker with the ground between them, and a spot on the edge'+(P?': '+Math.round(Math.hypot(T.x-A.x,T.y-A.y))+' m apart, height '+hv(A.x,A.y).toFixed(1)+' and '+hv(T.x,T.y).toFixed(1)+' m':'')+')');
if(P){const e=B.makeEnemy({id:'QL',kind:'turret',x:T.x,y:T.y});e.seen=true;e.lx=T.x;e.ly=T.y;e.camo=false;e.aim=Math.atan2(A.y-T.y,A.x-T.x);G.enemies.push(e);
  const v=B.makeUnit('tank',A.x,A.y);v.post='off';v.hp=v.maxhp=1e4;G.units.push(v);
  for(let i=0;i<8*20;i++)B.step(.05);
  ok(e.tgtU!==v&&!v.fighting&&v.hp===v.maxhp,'behind the ground the bunker does not take the VARG ('+(e.tgtU?e.tgtU.id:'none')+') and the VARG does not fire ('+v.state+')');
  v.x=P.x;v.y=P.y;v.orders=[];let t=0;for(;t<15&&!(v.fighting&&e.tgtU===v);t+=.05)B.step(.05);
  ok(v.fighting&&e.tgtU===v,'at the edge they see each other and fight ('+t.toFixed(1)+' s, '+v.state+')');
  B.LOS.on=false;v.x=A.x;v.y=A.y;v.target=null;e.tgtU=null;let s=0;for(;s<10&&!v.fighting;s+=.05)B.step(.05);B.LOS.on=true;
  ok(v.fighting,'(without the line of sight they fought through the ground: '+s.toFixed(1)+' s)');}
console.log(fail?fail+' FAILED':'all passed');process.exit(fail?1:0);
