global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;B.START.res=300;B.START.units=['drone','tank','tank','eng'];B.SHAPE_CFG.force='rund';/* the old start, so results compare */
for(const seed of [7341,1234,9001]){B.newGame(seed);const G=B.G;G.running=true;G.known.fill(1);G.knownV++;
  for(const e of G.enemies)e.dead=true;
  const e=G.units.find(u=>u.kind==='eng'),R1=G.relays[0];
  B.giveOrder(e,{type:'capture',relay:R1,post:'dold'},false);
  const log=[];for(let i=0;i<20*240;i++){B.step(.05);if(i%600===0)log.push(Math.round(G.time)+':'+e.state);if(R1.captured)break;}
  console.log(seed,'captured',R1.captured,'t',Math.round(G.time),'|',log.join(' / '));}
