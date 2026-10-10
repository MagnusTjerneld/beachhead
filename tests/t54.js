global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;const C=B.CTRL;
B.newGame(7341);const G=B.G;G.running=true;
const ts=G.units.filter(u=>u.kind==='tank'),d=G.units.find(u=>u.kind==='drone'),e=G.units.find(u=>u.kind==='eng');
B.setSel([ts[0].id,ts[1].id,d.id,e.id]);B.assignWing(1);
G.ctrl=ts[0].id;G.ctrlSel=G.selIds.slice();ts[0].orders=[];
B.setFollowMe(true);
const L=ts[0];L.heading=Math.atan2(1100-L.y,1100-L.x);C.thr=1;C.steer=0;
for(let i=0;i<20*40;i++){B.step(.05);if(i%200===0)console.log(Math.round(G.time),'leader',Math.round(L.x),Math.round(L.y),'| dist',[ts[1],e,d].map(v=>v.name+':'+Math.round(Math.hypot(v.x-L.x,v.y-L.y))).join(' '),'|',ts[1].state);}
C.thr=0;B.stopFollowMe(true);B.step(.05);console.log('after release:',[ts[1],e,d].map(v=>v.name+':'+(v.orders[0]?v.orders[0].type:'-')).join(' '));
