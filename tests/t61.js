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
// the wheel names individual units: pick who takes a relay without selecting it first
{B.newGame(7341);const G=B.G;G.running=true;for(const e of G.enemies)e.dead=true;const r=G.relays.find(x=>!x.captured);
 const es=G.units.filter(u=>u.kind==='eng');B.queueBuild&&0;if(es.length<2){const n=B.makeUnit('eng',r.x+300,r.y);G.units.push(n);es.push(n);}
 es[0].x=r.x+40;es[0].y=r.y;es[1].x=r.x+200;es[1].y=r.y;for(const e of es)e.orders=[];
 const it=B.callItems({relay:r});ok(it[0].l.includes(es[0].name),'default item names the nearest BÄVER ('+it[0].l+')');
 const alt=it.find(x=>x.l.startsWith(es[1].name));ok(!!alt,'the other BÄVER is offered by name');alt.f();
 ok(es[1].orders[0]&&es[1].orders[0].type==='capture'&&!es[0].orders.length,'the chosen BÄVER takes the relay, the nearest stays');}
// HÖK in a mixed group flies air cover for the ground units, and spots for them when they attack something camouflaged
{B.newGame(6556);const G=B.G;G.running=true;const t=G.enemies.find(x=>x.kind==='turret');for(const e of G.enemies)if(e!==t)e.dead=true;
 const v=G.units.find(u=>u.kind==='tank'),h=G.units.find(u=>u.kind==='drone');const a=Math.atan2(h.y-t.y,h.x-t.x);v.x=t.x+Math.cos(a)*142;v.y=t.y+Math.sin(a)*142;v.orders=[];h.orders=[];
 G.selIds=[v.id,h.id];G.sel=v.id;B.groupOrder({world:{x:t.x+Math.cos(a)*150,y:t.y+Math.sin(a)*150}},false);
 ok(h.mission&&h.mission.type==='follow'&&h.mission.escort&&h.mission.unit===v,'HÖK in the group escorts the VARG instead of flying to the point');
 ok(v.orders[0]&&v.orders[0].type==='move','the VARG gets the move');
 B.groupOrder({world:{x:t.x+Math.cos(a)*145,y:t.y+Math.sin(a)*145}},false);ok(h.orders[0]===h.mission,'a new group order keeps the same escort');
 run(20);t.seen=true;t.lx=t.x;t.ly=t.y;B.giveOrder(v,{type:'attack',enemy:t,post:'off'},false);run(1);
 ok(h.orders[0]&&h.orders[0].spotFor===t,'the escorting HÖK goes to spot the bunker');
 for(let i=0;i<120&&!t.dead;i++)run(1);ok(t.dead,'bunker killed');run(3);
 ok(h.orders[0]&&h.orders[0]===h.mission&&h.mission.type==='follow','HÖK back to escorting afterwards');}
// optional autopause: a new contact found by another unit pauses, one found by the unit you drive does not
{B.newGame(7341);const G=B.G;G.running=true;run(2);const h=G.units.find(u=>u.kind==='drone'),t=G.enemies.find(e=>!e.seen&&e.kind==='turret');ok(!!t,'an unseen bunker to find');
 B.AUTOPAUSE.on=false;h.orders=[];h.x=t.x+120;h.y=t.y;h.orbit={x:h.x,y:h.y};B.step(.05);ok(t.seen&&!G.paused,'option off: no pause');
 const t2=G.enemies.find(e=>!e.seen&&e.kind==='turret'&&Math.hypot(e.x-t.x,e.y-t.y)>400);B.AUTOPAUSE.on=true;G.ctrl=h.id;h.x=t2.x+120;h.y=t2.y;B.step(.05);ok(t2.seen&&!G.paused,'found by the unit you drive: no pause');G.ctrl=null;
 const t3=G.enemies.find(e=>!e.seen&&Math.hypot(e.x-t2.x,e.y-t2.y)>400);h.x=t3.x+100;h.y=t3.y;B.step(.05);ok(t3.seen&&G.paused,'found by another unit: paused');
 B.setPaused(false);const t4=G.enemies.find(e=>!e.seen&&Math.hypot(e.x-t3.x,e.y-t3.y)>400);h.x=t4.x+100;h.y=t4.y;B.step(.05);ok(t4.seen&&!G.paused,'no new pause within 3 s of resuming');
 B.AUTOPAUSE.on=false;}
// SPARV: built with the mission to explore, maps the island, keeps clear of a known AA, and spots for VARG before HÖK does
{B.newGame(7341);const G=B.G;G.running=true;G.res=1000;B.queueBuild('scout');run(10);const sc=G.units.find(u=>u.kind==='scout');
 ok(sc&&!sc.mission&&!sc.orders.length,'a new SPARV waits for the captain\'s order');ok(sc.maxFuel>=600,'ten minutes of battery');
 B.giveOrder(sc,{type:'explore',post:'def'},false,'mission');ok(sc.mission&&sc.mission.type==='explore','explore given as a mission');
 const aa=G.enemies.find(e=>e.kind==='aa');aa.seen=true;aa.lx=aa.x;aa.ly=aa.y;let minD=1e9;
 const r0=B.RADIO.r;B.RADIO.r=5000;for(let i=0;i<20*120;i++){B.step(.05);if(!sc.dead)minD=Math.min(minD,Math.hypot(sc.x-aa.x,sc.y-aa.y));}B.RADIO.r=r0;
 ok(!sc.dead&&G.landPct>.1,'without the radio limit: explored '+Math.round(G.landPct*100)+' % of the island in two minutes');ok(minD>110,'never inside the AA radar ('+Math.round(minD)+' m)');
 const t=G.enemies.find(e=>e.kind==='turret'&&!e.dead);t.seen=true;t.lx=t.x;t.ly=t.y;t.visibleNow=false;const v=G.units.find(u=>u.kind==='tank');v.x=t.x+140;v.y=t.y;
 B.requestSpot(v,t);ok(sc.orders[0]&&sc.orders[0].spotFor===t,'the SPARV is sent to spot, not the HÖK');}
// SPARV explores one zone when told to, reports when it is done and waits for orders
{B.newGame(7341);const G=B.G;G.running=true;for(const e of G.enemies)e.dead=true;const sc=B.makeUnit('scout',B.W.landing.x,B.W.landing.y);G.units.push(sc);
 const z=B.W.zid[Math.floor(B.W.landing.y/10)*220+Math.floor(B.W.landing.x/10)];ok(z>=0,'landing zone '+z);
 const v=G.units.find(u=>u.kind==='tank');v.x=B.W.landing.x;v.y=B.W.landing.y;v.orders=[];B.RADIO.r=5000;
 B.giveOrder(sc,{type:'explore',zone:z,post:'def'},false,'mission');let out=0;
 for(let i=0;i<20*240&&sc.mission;i++){B.step(.05);const zz=B.W.zid[Math.floor(sc.y/10)*220+Math.floor(sc.x/10)];if(i%20===0&&zz!==z&&zz>=0)out++;}
 ok(!sc.mission&&G.log.some(l=>/Zonen vid .* är spanad/.test(l.text)),'zone done and reported, SPARV waits');
 B.RADIO.r=250;let unk=0,tot=0;for(let gy=1;gy<220;gy+=3)for(let gx=1;gx<220;gx+=3){const i=gy*220+gx;if(B.W.zid[i]===z){tot++;if(!G.known[i])unk++;}}ok(unk===0,'nothing left unknown in the zone ('+tot+' sample cells)');}
// SPARV radio link: only within reach of Birka or a heavy unit; it stays inside the net while exploring and turns back when the link is lost
{B.newGame(7341);const G=B.G;G.running=true;for(const e of G.enemies)e.dead=true;const sc=B.makeUnit('scout',B.W.landing.x,B.W.landing.y);G.units.push(sc);
 const v=G.units.find(u=>u.kind==='tank');v.x=B.W.landing.x;v.y=B.W.landing.y;v.orders=[];for(const u of G.units)if(u!==sc&&u!==v&&u.kind!=='eng'){u.x=1100;u.y=1950;u.orders=[];}
 B.giveOrder(sc,{type:'explore',post:'def'},false,'mission');let worst=0;for(let i=0;i<20*90;i++){B.step(.05);worst=Math.max(worst,B.linkAt(sc.x,sc.y).d);}
 ok(worst<=B.RADIO.r+8,'exploring SPARV stays inside the radio net (farthest '+Math.round(worst)+' m from a relay)');
 B.giveOrder(sc,{type:'move',x:B.W.landing.x+900,y:B.W.landing.y-900,post:'def'},false);for(let i=0;i<20*40;i++)B.step(.05);
 ok(B.linkAt(sc.x,sc.y).d<=B.RADIO.r+8,'a waypoint beyond the net stops at its edge');
 for(const u of G.units)if(u.kind==='eng'){u.x=1100;u.y=1950;}const L0=B.linkAt(1100,1100);sc.x=L0.relay.x+(1100-L0.relay.x)*(B.RADIO.r+150)/L0.d;sc.y=L0.relay.y+(1100-L0.relay.y)*(B.RADIO.r+150)/L0.d;const d0=B.linkAt(sc.x,sc.y).d;for(let i=0;i<20*20;i++)B.step(.05);
 ok(d0>B.RADIO.r&&B.linkAt(sc.x,sc.y).d<=B.RADIO.r+8,'link lost: it turns back until it has the link again');}
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
