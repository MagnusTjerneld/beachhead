global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;
B.newGame(7341);const G=B.G;G.running=true;
const t=G.units.find(u=>u.kind==='tank');const R1=G.relays[0];
B.giveOrder(t,{type:'move',x:R1.x,y:R1.y,post:'off'},false);
let fightMoving=0,fightStill=0,px=t.x,py=t.y;
for(let i=0;i<20*120;i++){B.step(.05);const mv=Math.hypot(t.x-px,t.y-py)>0.01;px=t.x;py=t.y;if(t.fighting){if(mv)fightMoving++;else fightStill++;}if(i%400===0)console.log(Math.round(G.time),t.state,Math.round(t.hp));}
console.log('fighting steps moving',fightMoving,'still',fightStill,'arrived',Math.round(Math.hypot(t.x-R1.x,t.y-R1.y)));
