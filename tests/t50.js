global.performance={now:()=>0};
require(process.argv[3]||'./g2.js');const B=globalThis.__BH;
const seeds=(process.argv[2]||'7341,1234,9001,31,77').split(',').map(Number);
for(const seed of seeds){
  B.newGame(seed);const G=B.G;G.running=true;G.res=9999;const k=G.kroks[0];
  const R3=G.relays[2];const tank=G.units.find(u=>u.kind==='tank');
  // fan of SPARVs at the core, all flying straight in (offensive, so they do not dodge), one at a time
  const tg=[];for(let a=0;a<8;a++)tg.push({x:R3.x+Math.cos(a*Math.PI/4)*120,y:R3.y+Math.sin(a*Math.PI/4)*120});
  let lost=0;for(const p of tg){const u=B.makeUnit('scout',k.pad.x,k.pad.y);G.units.push(u);B.giveOrder(u,{type:'move',x:p.x,y:p.y,post:'off'},false);
    for(let i=0;i<20*90&&!u.dead&&Math.hypot(u.x-p.x,u.y-p.y)>15;i++)B.step(.05);if(u.dead)lost++;else{u.orders=[];}}
  B.krokOrder(k,{type:'lift',unit:tank},false);B.krokOrder(k,{type:'drop',x:R3.x,y:R3.y},true);
  for(let i=0;i<20*300;i++){B.step(.05);if(!k.orders.length&&!k.cargo)break;if(k.dead)break;}
  const d=Math.hypot(tank.x-R3.x,tank.y-R3.y),z=B.W.zid[Math.floor(tank.y/10)*Math.round(Math.sqrt(B.W.grid.length))+Math.floor(tank.x/10)];
  const knownAA=G.enemies.filter(e=>e.kind==='aa'&&e.seen).length,allAA=G.enemies.filter(e=>e.kind==='aa').length;
  console.log(seed,'sparv lost',lost+'/8','AA known',knownAA+'/'+allAA,'krok',k.dead?'DEAD':Math.round(k.hp)+'hp','tank',tank.dead?'DEAD':'R3 '+Math.round(d)+' m'+(z===B.W.zones.r3z?' (I R3-ZONEN)':z===B.W.zones.r2z?' (R2-zonen)':''),'|',k.status);
}
