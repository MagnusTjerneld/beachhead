global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;B.START.res=500;B.START.units=['drone','tank','tank','eng'];B.SHAPE_CFG.force='rund';B.SHAPE_CFG.rough=0;/* the game's 500 material (issue 103), with a fixed force */
for(const post of ['off','def']){for(const seed of [7341,1234,9001]){
  B.newGame(seed);const G=B.G;G.running=true;
  const tanks=G.units.filter(u=>u.kind==='tank'),d=G.units.find(u=>u.kind==='drone');
  B.setSel(tanks.map(t=>t.id));B.assignWing(1);
  // drive the wing toward R1, drone escorts VARG-1
  const R1=G.relays[0];for(const t of tanks)B.giveOrder(t,{type:'move',x:R1.x,y:R1.y,post:'off'},false);
  B.setSel([d.id]);B.giveOrder(d,{type:'follow',unit:tanks[0],post,escort:true,group:tanks.map(t=>t.id)},false);
  let eng=0,lastT=null,switched=false;const killedMid=[];
  for(let i=0;i<20*240;i++){B.step(.05);if(d.escTgt&&d.escTgt!==lastT){eng++;lastT=d.escTgt;}
    if(i===20*90&&!tanks[0].dead){tanks[0].hp=0;tanks[0].dead=true;}
    if(d.orders[0]&&d.orders[0].unit===tanks[1])switched=true;}
  const kills=G.enemies.filter(e=>e.dead).length;
  console.log(post,seed,'drone',d.dead?'DEAD':Math.round(d.hp)+'hp fuel '+Math.round(d.fuel),'| targets engaged',eng,'| switched',switched,'| enemies dead',kills,'| state',d.state);
}}
