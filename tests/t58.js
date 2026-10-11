// BÄVER and call-in: locked sectors, supply rules behind barriers, mines, call-in from any view
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
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
 const w={x:r2.x+40,y:r2.y,value:30,id:'wX',kind:'crate'};G.wrecks.push(w);G.known.fill(1);ok(!B.callIn('krok',{wreck:w})||!G.krokQ.includes('wX'),'KROK refuses salvage behind the barrier');}
// 3. mines: HÖK finds a field, the ground closes, a BÄVER clears it
{B.newGame(8080);const G=B.G;G.running=true;for(const e of G.enemies)e.dead=true;const m=G.mines[0];
 const h=G.units.find(u=>u.kind==='drone');h.x=m.x+60;h.y=m.y;h.alt=30;run(G,1);
 ok(m.found,'HÖK detects minefield '+m.id);ok(m.walled.length>0,'found field closes '+m.walled.length+' cells');
 ok(G.log.some(l=>/Minfält upptäckt/.test(l.text)&&l.acts),'mine notice offers BÄVER');
 const e=G.units.find(u=>u.kind==='eng');e.x=m.x+40;e.y=m.y+5;
 ok(B.callIn('eng',{mine:m}),'call-in BÄVER on minefield');for(let t=0;t<200&&!m.cleared;t++)run(G,1);
 ok(m.cleared,'field cleared at t '+Math.round(G.time)+' s');}
// 4. a VARG drives into an unfound field and is hurt
{B.newGame(8080);const G=B.G;G.running=true;for(const e of G.enemies)e.dead=true;const m=G.mines[1];
 const v=G.units.find(u=>u.kind==='tank');v.x=m.x+4;v.y=m.y;const hp=v.hp;run(G,.5);ok(m.found&&v.hp<hp,'VARG hits unfound mine: hp '+hp+' -> '+Math.round(v.hp));}
// 5. call-in air support and VARG on an enemy without touching the selection
{B.newGame(7341);const G=B.G;G.running=true;const e=G.enemies.find(x=>x.kind!=='aa');e.seen=true;e.lx=e.x;e.ly=e.y;const sel=G.selIds.slice();
 ok(B.callIn('air',{enemy:e}),'call-in HÖK on '+e.id);const h=G.units.find(u=>u.kind==='drone');ok(h.orders[0]&&(h.orders[0].type==='attack'||h.orders[0].type==='obs'),'HÖK ordered: '+(h.orders[0]&&h.orders[0].type));
 ok(B.callIn('tank',{enemy:e}),'call-in VARG on '+e.id);ok(G.units.filter(u=>u.kind==='tank').every(u=>u.orders[0]),'VARGs ordered');
 ok(G.selIds.join()===sel.join(),'selection untouched');
 const t=G.units.find(u=>u.kind==='tank');G.ctrl=t.id;t.orders=[];B.callIn('tank',{world:{x:1100,y:1100}});ok(!t.orders.length&&G.ctrl===t.id,'the unit you drive is never called in');}
console.log(fail?fail+' FAILED':'all passed');process.exit(fail?1:0);
