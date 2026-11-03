// Issue 96 (Magnus 30 okt and 3 nov): the height bonus is on for both sides, and a gun cannot point down further than its depression:
// a tank on a height cannot fire on a target close below it but can at a distance, infantry can, and so for the VARG
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
let G;
function fresh(){B.newGame(1264);G=B.G;G.running=true;G.netAll=true;G.mines=[];G.enemies=[];G.units=[];G.known.fill(1);G.knownV++;B.LOS.on=false;G.krokAuto=false;}
fresh();B.RANGE_F.on=false;
ok(B.HEIGHT_F.on===1&&B.HEIGHT_F.per===.01&&B.HEIGHT_F.max===.15,'the height bonus is on: 0.01 per metre, at most 15 %');
ok(B.TYPES.tank.dep===8&&B.ENEMY.tank.dep===6&&B.ENEMY.light.dep===6&&B.ENEMY.turret.dep===15&&B.ENEMY.inf.dep==null&&B.ENEMY.rb.dep==null&&B.TYPES.drone.dep==null,'depression table: VARG 8, SV 6, LP 6, bunker 15, infantry, missile team and HOK free');
const mkE=(k,x,y)=>{const e=B.makeEnemy({id:'E'+k+x+y,kind:k,x,y});e.seen=true;e.lx=x;e.ly=y;e.dead=false;return e;};
const put=(k,x,y)=>{const u=B.makeUnit(k,x,y);G.units.push(u);return u;};
// find a slope on land: a high place and a lower one 40 or 70 m off, at least 14 m lower
let hi=null,lo=null;
for(let x=40;x<2200-40&&!hi;x+=20)for(let y=40;y<2200-40&&!hi;y+=20){const g=B.groundY(x,y);if(g<5)continue;
  for(let a=0;a<6.28&&!hi;a+=.5)for(const r of[40,70]){const x2=x+Math.cos(a)*r,y2=y+Math.sin(a)*r;if(x2<10||y2<10||x2>2200-10||y2>2200-10)continue;const g2=B.groundY(x2,y2);if(g2>1&&g-g2>=14){hi={x,y};lo={x:x2,y:y2,r};break;}}}
ok(!!hi,'a slope of at least 14 m is found on the island');
if(hi){
  const dh=B.groundY(hi.x,hi.y)-B.groundY(lo.x,lo.y);console.log('slope '+dh.toFixed(1)+' m over '+lo.r+' m');
  const tk=mkE('tank',hi.x,hi.y),inf=mkE('inf',hi.x,hi.y),v=put('tank',hi.x,hi.y),h=put('drone',hi.x,hi.y);
  const tgt=put('tank',lo.x,lo.y),etgt=mkE('tank',lo.x,lo.y);
  ok(!B.depOK(tk,tgt),'an enemy tank on the height cannot fire on a target close below it');
  ok(B.depOK(inf,tgt),'infantry on the same spot can');
  ok(!B.depOK(v,etgt),'a VARG on the height cannot fire steeper down than 8 degrees');
  ok(B.depOK(h,tgt),'a HOK has no limit down');
  // at a distance the same slope direction gives a shallow angle: pick the point 600 m along the line if it is not higher ground
  const ux=(lo.x-hi.x)/lo.r,uy=(lo.y-hi.y)/lo.r,fx=hi.x+ux*600,fy=hi.y+uy*600;
  if(fx>0&&fy>0&&fx<2200&&fy<2200){const far=mkE('tank',fx,fy);const ang=Math.atan2(B.unitHOf(tk)-B.unitHOf(far),600)*180/Math.PI;
    ok(B.depOK(tk,far)===(ang<=6),'at 600 m the angle is '+ang.toFixed(1)+' degrees and depOK agrees');}
  // the bonus: the same shot from the height hits more often than from level ground, for both sides
  const rate=(a,t,N)=>{let n=0;for(let i=0;i<N;i++){const b=G.fx.length;B.shoot(a,t,0,.5,a.hitBy?'f':'e','cannon');n+=G.fx.slice(b).filter(f=>f.k==='shot'&&f.hit).length;G.fx.length=0;}return n/N;};
  const exp=Math.min(.15,Math.max(0,(B.unitHOf(v)-B.unitHOf(tgt)))*.01);
  const low=put('tank',lo.x+1,lo.y+1);
  const rHigh=rate(v,etgt,6000),rLow=rate(low,etgt,6000);
  console.log('hit rate from the height '+rHigh.toFixed(3)+', level '+rLow.toFixed(3)+', expected factor '+(1+exp).toFixed(3));
  ok(rHigh>rLow*1.05,'the one standing higher hits more often (VARG)');
  const rE=rate(tk,tgt,6000),rE0=rate(mkE('tank',lo.x+1,lo.y+1),tgt,6000);
  ok(rE>rE0*1.05,'and so does the enemy tank on the height');
  ok(rHigh<=.5*1.15+.03,'the bonus has its cap of 15 %');
}
console.log(fail?'FAILED '+fail:'all ok');process.exit(fail?1:0);
