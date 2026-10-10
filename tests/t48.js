global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;
B.newGame(1234);const G=B.G;G.running=true;
const k=G.kroks[0],t=G.units.find(u=>u.kind==='tank'),e=G.units.find(u=>u.kind==='eng');
const R2=G.relays[1];
B.krokOrder(k,{type:'lift',unit:t},false);B.krokOrder(k,{type:'drop',x:R2.x-200,y:R2.y},true);
B.krokOrder(k,{type:'lift',unit:e},true);B.krokOrder(k,{type:'drop',x:R2.x-190,y:R2.y+20},true);
t.orders=[];
let log=[];for(let i=0;i<6000&&(k.orders.length||k.cargo);i++){B.step(.05);if(i%400===0)log.push(Math.round(G.time)+' '+k.status+' | '+t.state+' | '+e.state+' hp'+Math.round(k.hp));}
console.log(log.join('\n'));
console.log('tank at',Math.round(t.x),Math.round(t.y),'eng at',Math.round(e.x),Math.round(e.y),'target',Math.round(R2.x-200),Math.round(R2.y),'krok dead',k.dead,'time',Math.round(G.time));
console.log(G.log.slice(0,8).map(l=>l.who+': '+l.text).join('\n'));
