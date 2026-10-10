global.performance={now:()=>0};
require(process.argv[3]||'./g2.js');const B=globalThis.__BH;
for(const seed of (process.argv[2]||'7341,1234,9001,31,77').split(',').map(Number)){
  B.newGame(seed);const G=B.G;G.running=true;const k=G.kroks[0],d=G.units.find(u=>u.kind==='drone'),t=G.units.find(u=>u.kind==='tank');
  const R1=G.relays[0],W=B.W;
  // HÖK scouts a ring around R1 on Defensiv
  const pts=[];for(let a=0;a<6;a++)pts.push({x:R1.x+Math.cos(a)*220,y:R1.y+Math.sin(a)*220});
  pts.forEach((p,i)=>B.giveOrder(d,{type:'move',x:p.x,y:p.y,post:'def'},i>0));
  for(let i=0;i<20*150;i++)B.step(.05);
  const rbSeen=G.enemies.filter(e=>e.kind==='rb'&&e.seen).length,rbAll=G.enemies.filter(e=>e.kind==='rb').length;
  // airlift a VARG to a point 250 m beyond R1, away from the beach
  const dx=R1.x-W.landing.x,dy=R1.y-W.landing.y,dl=Math.hypot(dx,dy)||1,target={x:R1.x+dx/dl*250,y:R1.y+dy/dl*250};
  B.krokOrder(k,{type:'lift',unit:t},false);B.krokOrder(k,{type:'drop',x:target.x,y:target.y},true);
  let minHp=k.hp;for(let i=0;i<20*200;i++){B.step(.05);minHp=Math.min(minHp,k.hp);if(!k.orders.length&&!k.cargo)break;if(k.dead)break;}
  const dist=Math.round(Math.hypot(t.x-target.x,t.y-target.y)),fromBeach=Math.round(Math.hypot(t.x-W.landing.x,t.y-W.landing.y));
  console.log(seed,'HÖK',d.dead?'DEAD':Math.round(d.hp)+'hp','| RB seen',rbSeen+'/'+rbAll,'| KROK',k.dead?'DEAD':'min '+Math.round(minHp)+'hp','| VARG',t.dead?'DEAD':dist+' m from target, '+fromBeach+' m from beach','|',k.status);
}
