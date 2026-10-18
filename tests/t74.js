// saved games (19 okt, issue 56): a save of the whole state as a graph, put back over a freshly built island, gives the same game:
// units, enemies, orders pointing at the same enemies and points, an order that is also a unit's mission still one object, the
// island's grid as it stood, and the game goes on from there
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
B.newGame(7341);let G=B.G;G.running=true;G.netAll=true;
const L=G.relays[0],t=B.makeUnit('tank',G.units[0].x+30,G.units[0].y),e=G.units.find(u=>u.kind==='eng');G.units.push(t);
const foe=G.enemies.filter(x=>!x.dead).sort((a,b)=>Math.hypot(a.x-t.x,a.y-t.y)-Math.hypot(b.x-t.x,b.y-t.y))[0];
B.giveOrder(t,{type:'attack',enemy:foe,post:'off'},false);B.giveOrder(e,{type:'capture',relay:L,post:'def'},false,'mission');
for(let i=0;i<60*20;i++)B.step(.05);
const st=B.G.structs.find(s=>!s.dead);B.killStruct(st,t,'demolish');for(let i=0;i<20;i++)B.step(.05);
/* a unit whose order is its mission, the same object */
const m=B.makeUnit('eng',e.x+5,e.y);G.units.push(m);const mo={type:'capture',relay:L,post:'def'};m.mission=mo;m.orders=[mo];
G=B.G;const sv=JSON.parse(JSON.stringify(B.saveState())),size=JSON.stringify(sv).length;
const snap=g=>({time:g.time,res:Math.round(g.res),units:g.units.map(u=>u.id+':'+Math.round(u.x)+','+Math.round(u.y)+':'+Math.round(u.hp)).join(' '),enemies:g.enemies.filter(x=>!x.dead).length,known:g.known.reduce((a,b)=>a+b,0),wrecks:g.wrecks.length});
const before=snap(G),grid0=Array.from(B.W.grid).join(''),te=G.units.find(u=>u.id===t.id),missionSame=e.orders[0]===e.mission;
ok(size<4e6,'a save is '+Math.round(size/1024)+' kB');
B.newGame(1490);B.newGame(7341);ok(B.G.time===0,'(a fresh game in between)');
B.applySave(sv);G=B.G;const after=snap(G);
ok(JSON.stringify(before)===JSON.stringify(after),'the state comes back: '+JSON.stringify(after).slice(0,160));
ok(Array.from(B.W.grid).join('')===grid0,'the island\'s grid as it stood (the torn-down building open)');
const t2=G.units.find(u=>u.id===t.id),e2=G.units.find(u=>u.id===e.id);
const o=t2.orders[0];ok(!o||o.type!=='attack'||G.enemies.includes(o.enemy),'an attack order points at an enemy of the loaded game'+(o?' ('+o.type+')':''));
const m2=G.units.find(u=>u.id===m.id);ok(m2.orders[0]===m2.mission&&G.relays.includes(m2.mission.relay),'an order that is also the mission of the unit is still one object, at the loaded point');
ok(G.enemies.every(x=>!x.tgtU||G.units.includes(x.tgtU)||G.kroks.includes(x.tgtU)),'the enemies\' targets are units of the loaded game');
let err=null;try{for(let i=0;i<60*20;i++)B.step(.05);}catch(x){err=x;}
ok(!err&&G.time>before.time+59,'and the game goes on for a minute ('+(err?err.message:Math.round(G.time)+' s')+')');
console.log(fail?fail+' FAILED':'all passed');process.exit(fail?1:0);
