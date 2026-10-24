// BÄVER and call-in: locked sectors, supply rules behind barriers, mines, call-in from any view
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;B.START.res=300;B.START.units=['drone','tank','tank','eng'];B.SHAPE_CFG.force='rund';B.SHAPE_CFG.rough=0;/* the old start, so results compare */let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const run=(G,s)=>{for(let i=0;i<s*20;i++)B.step(.05);};
// 1. call in a BÄVER on a barrier: it is lifted ashore if needed, blows it, the sector behind opens
{B.newGame(7341);const G=B.G;G.running=true;G.known.fill(1);G.knownV++;for(const e of G.enemies){e.dead=true;}
 const b=G.barriers.find(x=>x.sides.some(sd=>!B.lockedAt(sd.x,sd.y)))||G.barriers[0],l0=G.lockN;ok(G.lockN>0,'island 7341 has locked sectors ('+G.lockN+' cells)');
 ok(B.callIn('eng',{barrier:b}),'call-in BÄVER on barrier '+b.id);
 const e=G.units.find(u=>u.kind==='eng');ok(e.orders[0]&&e.orders[0].type==='clear','BÄVER got a clear order');
 for(let t=0;t<400&&!b.cleared;t++)run(G,1);
 ok(b.cleared,'barrier '+b.id+' cleared after '+Math.round(G.time)+' s');ok(G.lockN<l0,'locked cells '+l0+' -> '+G.lockN);
 ok(G.log.some(l=>/Sektorn bakom är öppen|Vägen är öppen/.test(l.text)),'log announces the opening');}
// 2. supply rules behind a barrier
{B.newGame(7341);const G=B.G;G.running=true;const r2=G.relays.find(r=>B.lockedAt(r.x,r.y));
 const v=G.units.find(u=>u.kind==='tank');v.x=r2.x+30;v.y=r2.y;v.hp=30;ok(B.lockedAt(v.x,v.y),'VARG placed in locked sector');
 r2.captured=true;const hm=B.homeFor(v);ok(hm.ship||!/verkstad|fältvarv/.test(hm.name)||hm.name.indexOf(r2.id)<0,'captured point in a locked sector gives no service ('+hm.name+')');
 run(G,3);ok(!v.rtb,'cut-off VARG does not head for service');ok(G.log.some(l=>/Avskuren bakom spärr/.test(l.text)&&l.acts&&l.acts.length),'cut-off notice with actions');
 const w={x:r2.x+40,y:r2.y,value:30,id:'wX',kind:'crate'};G.wrecks.push(w);G.known.fill(1);B.callIn('krok',{wreck:w});ok(G.krokQ.includes('wX')||G.kroks.some(k=>k.target===w||k.orders.some(o=>o.wreck===w)),'KROK takes a salvage behind the barrier (since 24 okt: it comes by air; service there stays cut off)');}
// 3. mines: buried, so a HÖK right above sees nothing; BÄVER's detector finds the field, the ground closes, the BÄVER clears it
{B.newGame(8080);const G=B.G;G.running=true;G.netAll=true;for(const e of G.enemies)e.dead=true;const m=G.mines[0];
 const h=G.units.find(u=>u.kind==='drone');h.x=m.x+20;h.y=m.y;h.alt=30;h.orders=[];h.orbit={x:h.x,y:h.y};run(G,1);ok(!m.found,'HÖK does not see buried mines');
 const e=G.units.find(u=>u.kind==='eng');e.x=m.x+40;e.y=m.y+5;run(G,1);
 ok(m.found,'BÄVER detects minefield '+m.id);ok(m.walled.length>0,'found field closes '+m.walled.length+' cells');
 ok(G.log.some(l=>/Minfält upptäckt/.test(l.text)&&l.acts),'mine notice offers BÄVER');
 ok(B.callIn('eng',{mine:m}),'call-in BÄVER on minefield');for(let t=0;t<200&&!m.cleared;t++)run(G,1);
 ok(m.cleared,'field cleared at t '+Math.round(G.time)+' s');}
// 4. a VARG drives into an unfound field and is hurt
{B.newGame(8080);const G=B.G;G.running=true;for(const e of G.enemies)e.dead=true;const m=G.mines[0];
 const v=G.units.find(u=>u.kind==='tank');v.x=m.x+4;v.y=m.y;const hp=v.hp;run(G,.5);ok(m.found&&v.hp<hp,'VARG hits unfound mine: hp '+hp+' -> '+Math.round(v.hp));}
// 5. call-in air support and VARG on an enemy without touching the selection
{B.newGame(7341);const G=B.G;G.running=true;const e=G.enemies.find(x=>x.kind!=='aa');e.seen=true;e.lx=e.x;e.ly=e.y;const sel=G.selIds.slice();
 ok(B.callIn('air',{enemy:e}),'call-in HÖK on '+e.id);const h=G.units.find(u=>u.kind==='drone');ok(h.orders[0]&&(h.orders[0].type==='attack'||h.orders[0].type==='obs'),'HÖK ordered: '+(h.orders[0]&&h.orders[0].type));
 ok(B.callIn('tank',{enemy:e}),'call-in VARG on '+e.id);ok(G.units.filter(u=>u.kind==='tank').every(u=>u.orders[0]),'VARGs ordered');
 ok(G.selIds.join()===sel.join(),'selection untouched');
 const t=G.units.find(u=>u.kind==='tank');G.ctrl=t.id;t.orders=[];B.callIn('tank',{world:{x:1100,y:1100}});ok(!t.orders.length&&G.ctrl===t.id,'the unit you drive is never called in');}
// 5. the captain gives the orders: a BÄVER's own request for a lift only goes to a safe landing zone, and it does not drive into known reach
{B.newGame(7341);const G=B.G;G.running=true;const r=G.relays[0],e=G.units.find(u=>u.kind==='eng'),k=G.kroks[0];
 const t=G.enemies.find(x=>x.kind==='turret'&&!x.dead);t.x=r.x+20;t.y=r.y;t.lx=t.x;t.ly=t.y;t.seen=true;G.known.fill(1);G.knownV++;
 B.giveOrder(e,{type:'capture',relay:r,post:'def'},false);run(G,2);
 ok(!k.orders.length&&e.hold,'target inside a known bunker\'s reach: no lift, the BÄVER waits ('+e.state+')');
 /* since 24 okt the target is checked on deck too, before a lift is asked for (provspel ö 2915 kp16), so BÄVER says why it waits */
 ok(G.log.some(l=>/Ingen säker landningsplats|Målet ligger inom räckhåll/.test(l.text)),'BÄVER or KROK says why it waits');
 t.dead=true;run(G,4);ok(k.orders.some(o=>o.type==='drop'),'bunker gone: KROK flies the BÄVER in');
 const d=k.orders.find(o=>o.type==='drop');ok(G.enemies.every(x=>x.dead||!x.seen||!x.canGround||Math.hypot(x.lx-d.x,x.ly-d.y)>=x.range+15),'landing zone outside every known ground threat');}
{B.newGame(7341);const G=B.G;G.running=true;for(const x of G.enemies)x.dead=true;const L=G.relays[0],e=G.units.find(u=>u.kind==='eng');
 const land=(x,y)=>{const g=B.W.grid[Math.floor(y/10)*220+Math.floor(x/10)];return g===2||g===3;};let p0=null;
 for(let r=170;r<260&&!p0;r+=10)for(let a=0;a<12&&!p0;a++){const x=L.x+Math.cos(a/12*6.283)*r,y=L.y+Math.sin(a/12*6.283)*r;if(land(x,y))p0={x,y};}
 e.x=p0.x;e.y=p0.y;e.orders=[];const t=G.enemies.find(x=>x.kind==='turret');t.dead=false;t.x=L.x;t.y=L.y;t.lx=t.x;t.ly=t.y;t.seen=true;t.hp=999;
 B.giveOrder(e,{type:'move',x:L.x,y:L.y,post:'def'},false);run(G,2);ok(e.hold&&Math.hypot(e.x-p0.x,e.y-p0.y)<5,'BÄVER waits instead of driving into a known bunker\'s reach ('+e.state+')');
 e.override=true;e.hold=false;run(G,3);ok(Math.hypot(e.x-p0.x,e.y-p0.y)>5,'Kör ändå sends it anyway');
 /* on Offensiv it goes in as Kör ändå sends it (decided 24 okt, provspel ö 2915 kp08) */
 e.override=false;e.x=p0.x;e.y=p0.y;e.hp=e.maxhp;B.giveOrder(e,{type:'move',x:L.x,y:L.y,post:'off'},false);run(G,3);ok(Math.hypot(e.x-p0.x,e.y-p0.y)>5&&G.log.some(l=>/BÄVER står på Offensiv/.test(l.text)),'on Offensiv it drives in and says so ('+e.state+')');}
console.log(fail?fail+' FAILED':'all passed');process.exit(fail?1:0);
