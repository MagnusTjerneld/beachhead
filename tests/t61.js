// missions and temporary orders: a call-in is done, then the unit goes back to its mission; Shift makes a new mission
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const run=s=>{for(let i=0;i<s*20;i++)B.step(.05);};
const quiet=G=>{for(const e of G.enemies)e.dead=true;G.known.fill(1);G.knownV++;};
// 1. HÖK on escort is called in against an enemy, kills it and returns to the escort
{B.newGame(7341);const G=B.G;G.running=true;quiet(G);const L=G.relays[0];
 const v=G.units.find(u=>u.kind==='tank'),h=G.units.find(u=>u.kind==='drone');v.x=L.x+40;v.y=L.y;v.orders=[];h.x=v.x;h.y=v.y-30;h.alt=30;
 B.giveOrder(h,{type:'follow',unit:v,post:'def',escort:true,group:[v.id]},false);ok(h.mission&&h.mission.type==='follow','escort is the HÖK\'s mission');
 const e=G.enemies.find(x=>x.kind==='inf'||x.kind==='light'||x.kind==='rb');e.dead=false;e.hp=1;e.x=v.x+90;e.y=v.y+40;e.hx=e.x;e.hy=e.y;e.seen=true;e.lx=e.x;e.ly=e.y;e.mobile=false;e.route=null;
 ok(B.callIn('air',{enemy:e}),'call-in air support on '+e.id);ok(h.orders[0].type==='attack'&&h.mission.type==='follow','attack is temporary, mission kept');
 for(let t=0;t<60&&!e.dead;t++)run(1);ok(e.dead,'enemy destroyed');run(2);
 ok(h.orders[0]===h.mission,'HÖK back on its escort: '+h.state);ok(G.log.some(l=>/Återgår till uppdraget/.test(l.text)),'log says it returns to the mission');}
// 2. VARG following another is called somewhere and comes back to follow
{B.newGame(7341);const G=B.G;G.running=true;quiet(G);const L=G.relays[0];
 const [a,b]=G.units.filter(u=>u.kind==='tank');a.x=L.x+40;a.y=L.y;a.orders=[];b.x=L.x+60;b.y=L.y+10;
 B.giveOrder(b,{type:'follow',unit:a,post:'def'},false);G.selIds=[b.id];
 B.callIn('tank',{world:{x:L.x+160,y:L.y+60}});ok(b.orders[0].type==='move'&&b.mission&&b.mission.unit===a,'V call-in moves VARG-2, mission stays');
 for(let t=0;t<40&&b.orders[0]&&b.orders[0].type==='move';t++)run(1);run(1);ok(b.orders[0]===b.mission,'VARG-2 follows again after the move');}
// 3. Shift on a call-in makes it the new mission; an ordinary order replaces the mission
{B.newGame(7341);const G=B.G;G.running=true;quiet(G);const L=G.relays[0];
 const [a,b]=G.units.filter(u=>u.kind==='tank');B.giveOrder(b,{type:'follow',unit:a,post:'def'},false);G.selIds=[b.id];
 B.callIn('tank',{world:{x:L.x+100,y:L.y}},true);ok(b.mission&&b.mission.type==='obs','Shift+V: holding the point is the new mission');
 B.giveOrder(b,{type:'move',x:L.x,y:L.y,post:'def'},false);ok(!b.mission,'an ordinary move order clears the mission');}
// 4. the unit a mission follows is lost: the mission ends with a report
{B.newGame(7341);const G=B.G;G.running=true;quiet(G);const [a,b]=G.units.filter(u=>u.kind==='tank');
 B.giveOrder(b,{type:'follow',unit:a,post:'def'},false);a.dead=true;run(1);ok(!b.mission,'mission ends when the followed unit is lost');}
// 5. a cut-off or repaired unit resumes its mission after the BÄVER is done
{B.newGame(7341);const G=B.G;G.running=true;quiet(G);G.res=500;const L=G.relays[0];
 const [a,b]=G.units.filter(u=>u.kind==='tank'),e=G.units.find(u=>u.kind==='eng');a.x=L.x+20;a.y=L.y;a.orders=[];b.x=L.x+40;b.y=L.y+10;e.x=L.x+55;e.y=L.y+5;e.orders=[];
 B.giveOrder(b,{type:'follow',unit:a,post:'def'},false);run(1);b.hp=30;run(3);ok(e.orders[0]&&e.orders[0].type==='repair'&&e.orders[0].unit===b,'idle BÄVER repairs a VARG that is on its mission');
 for(let t=0;t<40&&e.orders.length;t++)run(1);run(1);ok(b.hp>=74&&b.orders[0]===b.mission,'repaired VARG back on its mission ('+Math.round(b.hp)+' hp)');}
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
