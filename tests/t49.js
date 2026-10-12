global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;B.START.res=300;B.START.units=['drone','tank','tank','eng'];/* the old start, so results compare */
const seeds=(process.argv[2]||'7341,1234,9001,31,77').split(',').map(Number);
for(const seed of seeds){
  B.newGame(seed);const G=B.G;G.running=true;const k=G.kroks[0];
  const R3=G.relays[2],R2=G.relays[1];
  // a stream of SPARVs fly toward R3 one after another, each re-launched when the previous dies
  let sc=0,t=0;const tank=G.units.find(u=>u.kind==='tank');
  const launch=()=>{const u=B.makeUnit('scout',k.pad.x,k.pad.y);G.units.push(u);B.giveOrder(u,{type:'move',x:R3.x,y:R3.y,post:'dold'},false);sc++;return u;};
  let cur=launch();
  for(let i=0;i<20*60*2;i++){B.step(.05);if(cur.dead&&sc<6)cur=launch();}
  // now try to airlift the tank next to R3
  B.krokOrder(k,{type:'lift',unit:tank},false);B.krokOrder(k,{type:'drop',x:R3.x-40,y:R3.y},true);
  let res='';for(let i=0;i<20*240;i++){B.step(.05);if(!k.orders.length&&!k.cargo)break;}
  const d=Math.hypot(tank.x-R3.x,tank.y-R3.y);
  const knownAA=G.enemies.filter(e=>e.kind==='aa'&&e.seen).length,allAA=G.enemies.filter(e=>e.kind==='aa').length;
  console.log(seed,'sparv lost',G.units.filter(u=>u.kind==='scout'&&u.dead).length+'/'+sc,'AA known',knownAA+'/'+allAA,'krok',k.dead?'DEAD':Math.round(k.hp)+'hp','tank',tank.dead?'DEAD':'dist to R3 '+Math.round(d),'|',G.log.filter(l=>l.who&&l.who.startsWith('KROK')).slice(0,3).map(l=>l.text).join(' / '));
}
