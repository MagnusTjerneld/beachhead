global.performance={now:()=>0};
require('./g2.js');
const B=globalThis.__BH;B.START.res=300;B.START.units=['drone','tank','tank','eng'];B.SHAPE_CFG.force='rund';/* the old start, so results compare */
B.newGame(7341);const G=B.G;G.running=true;
const t=G.units.find(u=>u.kind==='tank');
// pick a safe-ish struct far from enemies
const md=s=>Math.min(...G.enemies.map(e=>Math.hypot(e.x-s.x,e.y-s.y)));const ss=G.structs.slice().sort((a,b)=>md(b)-md(a));
const s=ss[0];console.log('target',s.kind,s.id,s.hp,s.value);
t.x=s.x-60;t.y=s.y;t.heading=0;t.turret=0;G.ctrl=t.id;G.mlook=true;G.firing=true;
for(let i=0;i<200;i++)B.step(.05);
console.log('struct dead',s.dead,'hp',s.hp,'wrecks rubble',G.wrecks.filter(w=>w.kind==='rubble').map(w=>w.value));
// demolish by eng
const e=G.units.find(u=>u.kind==='eng');const s2=ss[1];e.x=s2.x+30;e.y=s2.y;s2.krok=true;B.giveOrder(e,{type:'demolish',s:s2,post:'dold'},false);
G.ctrl=null;G.firing=false;
for(let i=0;i<400;i++)B.step(.05);
console.log('demolished',s2.dead,s2.kind,s2.value,'queue',G.krokQ,'log',G.log.slice(0,5).map(l=>l.who+': '+l.text));
// fuel blast test
const f=G.structs.filter(x=>x.kind==='fuel'&&!x.dead).sort((a,b)=>md(a)-md(b))[0];const near=G.enemies.filter(en=>Math.hypot(en.x-f.x,en.y-f.y)<48).map(en=>en.id+':'+Math.round(en.hp));
B.killStruct(f,t,'shot');console.log('fuel blast near',near,'after',G.enemies.filter(en=>Math.hypot(en.x-f.x,en.y-f.y)<48).map(en=>en.id+':'+Math.round(en.hp)+(en.dead?'D':'')));
for(let i=0;i<4000;i++)B.step(.05);
console.log('after 200s res',Math.round(G.res),'salvaged',G.salvaged,'krok',G.kroks.map(k=>k.status));
