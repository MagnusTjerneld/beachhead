// Issue 172 point 1 (Magnus 10 nov): the coast artillery fires only into the cone the chart draws, only at what it sees (land higher
// than its own ground, a headland or an islet, hides a target; the flat top of its own rock does not), out to its whole seaRange, and
// ranges in: the hit chance rises with each round at the same target and is forgotten after KUST.zeroT s. The mission kust has the cone too.
global.performance={now:()=>Date.now()};
process.env.BH_KUST='1';
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
/* an island with the battery on it (1185: it sees most of its water, see the measurement in issue 172) */
B.newGame(1185);let G=B.G;G.running=true;const e=G.enemies.find(q=>q.kind==='kust');
ok(!!e,'ö 1185 has the coast artillery');
ok(!!e.cone,'the battery has a cone');
const at=(a,r)=>({x:e.x+Math.cos(a)*r,y:e.y+Math.sin(a)*r});
const mid=(e.cone.a0+e.cone.a1)/2,half=(e.cone.a1-e.cone.a0)/2;
/* a water point in the cone it sees, and one outside the cone */
let inP=null;for(let r=120;r<=260&&!inP;r+=10)for(let da=0;da<half&&!inP;da+=.05)for(const s of[1,-1]){const p=at(mid+s*da,r);if(B.heightAt(p.x,p.y)<-1&&B.kustSees(e,{...p,kind:'gadda',id:'q'})){inP=p;break;}}
ok(!!inP,'a water point in the cone that it sees');
ok(B.inKustCone(e,at(mid,200))&&!B.inKustCone(e,at(mid+half+.3,200))&&!B.inKustCone(e,at(mid+Math.PI,200)),'inKustCone: in the middle yes, past the edge and behind no');
ok(B.inKustCone({x:0,y:0,cone:null},{x:5,y:-3}),'no cone: the whole circle');
ok(!B.kustSees(e,{...at(mid,e.seaRange+20),kind:'gadda',id:'q'}),'not past seaRange');
/* the boat in the cone: it is the target; moved out of the cone (same distance) it is not */
const g=B.makeUnit('gadda',inP.x,inP.y);G.units.push(g);e.silT=0;e.cd=0;
const tick=n=>{for(let i=0;i<n;i++)B.step(.05);};
G.enemies=G.enemies.filter(q=>q===e);/* only the battery fires */
tick(10);ok(e.tgtU===g,'it takes the boat in its cone as target');
ok(B.kustSees(e,g),'it sees the boat');
/* the battery's own plateau does not hide: a point on its own ground level between it and the boat is not blocking (kustLos uses g+1) */
const src=require('fs').readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
ok(/if\(h>g\+1&&h\+LOS\.margin>ah\+\(bh-ah\)\*t\)return false/.test(src),'only land higher than its own ground hides a target');
/* outside the cone at the same distance: no target */
const d=Math.hypot(g.x-e.x,g.y-e.y),bad=at(mid+Math.PI,d);g.x=bad.x;g.y=bad.y;e.tgtU=null;tick(4);
ok(e.tgtU!==g,'outside the cone it does not take the boat ('+(e.tgtU?e.tgtU.name:'none')+')');
/* ranging in */
g.x=inP.x;g.y=inP.y;e.zero=null;
ok(Math.abs(B.kustZero(e,g)-B.KUST.zero0)<1e-9,'the first round at a new target: '+B.KUST.zero0.toFixed(2)+' of the hit chance');
e.zero={id:g.id,n:1,t:G.time};const z1=B.kustZero(e,g);e.zero.n=B.KUST.zeroN;const zN=B.kustZero(e,g);
ok(z1>B.KUST.zero0&&z1<1&&zN===1,'rising with each round, all of it after '+B.KUST.zeroN+' ('+z1.toFixed(2)+', '+zN+')');
e.zero.t=G.time-B.KUST.zeroT-1;ok(Math.abs(B.kustZero(e,g)-B.KUST.zero0)<1e-9,'forgotten after '+B.KUST.zeroT+' s without a round');
e.zero={id:'annan',n:3,t:G.time};ok(Math.abs(B.kustZero(e,g)-B.KUST.zero0)<1e-9,'a new target starts over');
/* firing counts the rounds at the target */
e.zero=null;e.cd=0;e.silT=0;g.hp=g.maxhp=9999;let n0=0;for(let i=0;i<400&&n0<2;i++){B.step(.05);n0=e.zero&&e.zero.id===g.id?e.zero.n:0;}
ok(n0>=2,'its rounds at the boat are counted ('+n0+')');
/* the mission kust has the cone */
ok(/kb\.cone=kustCone\(kb\);G\.misBat/.test(src),'the mission kust gives its battery the cone');
console.log(fail?fail+' FAILED':'all ok');process.exit(fail?1:0);
