// air defence by target size, manual KROK flight with the hook, BÄVER field repair, the planner's gaps and air pockets
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const run=(s)=>{for(let i=0;i<s*20;i++)B.step(.05);};
const kill=G=>{for(const e of G.enemies)e.dead=true;};
// 1. AA engages KROK at 240 m but not a HÖK at the same distance
{B.newGame(1234);const G=B.G;G.running=true;const aa=G.enemies.find(e=>e.kind==='aa');for(const e of G.enemies)if(e!==aa)e.dead=true;
 const k=G.kroks[0],h=G.units.find(u=>u.kind==='drone');
 k.x=aa.x+240;k.y=aa.y;k.state='hook';k.t=-1e9;const hp0=k.hp;h.x=aa.x-240;h.y=aa.y;h.alt=30;h.orders=[];h.orbit={x:h.x,y:h.y};const hh=h.hp;
 B.G.ctrl=k.id;run(6);ok(k.hp<hp0,'AA hits KROK at 240 m ('+hp0+' -> '+Math.round(k.hp)+')');ok(h.hp>=hh,'AA leaves HÖK at 240 m alone');B.G.ctrl=null;}
// 2. manual KROK: hook a VARG, set it down elsewhere, salvage a pile and bring it home
{B.newGame(7341);const G=B.G;G.running=true;kill(G);G.known.fill(1);G.knownV++;
 const k=G.kroks[0],v=G.units.find(u=>u.kind==='tank');const L=G.relays[0];v.x=L.x+60;v.y=L.y;v.orders=[];G.ctrl=k.id;k.x=v.x+6;k.y=v.y;
 B.krokHook(k);ok(k.mAct&&k.mAct.type==='lift','F over a VARG starts coupling');run(4);ok(k.cargo===v&&v.carried===k.id,'VARG lifted by hand');
 k.x=L.x+120;k.y=L.y+40;run(.2);ok(Math.hypot(v.x-k.x,v.y-k.y)<1,'cargo follows KROK');B.krokHook(k);run(4);
 ok(!k.cargo&&!v.carried&&Math.hypot(v.x-(L.x+120),v.y-(L.y+40))<2,'VARG set down at '+Math.round(v.x)+','+Math.round(v.y));
 const w={x:L.x+150,y:L.y+40,value:40,id:'wM',kind:'crate'};G.wrecks.push(w);k.x=w.x+3;k.y=w.y;const r0=G.res;B.krokHook(k);run(4);ok(k.carry===w,'pile hooked by hand');
 k.x=k.pad.x;k.y=k.pad.y;run(.2);ok(!k.carry&&G.res>=r0+40-1,'pile delivered at the ship (+'+Math.round(G.res-r0)+')');
 B.krokHook(k);ok(!k.mAct,'F with nothing below does nothing');G.ctrl=null;}
// 3. BÄVER repairs a damaged VARG in the field up to 75 %, only when both are still and out of fire
{B.newGame(7341);const G=B.G;G.running=true;kill(G);G.res=500;const L=G.relays[0];
 const v=G.units.find(u=>u.kind==='tank'),e=G.units.find(u=>u.kind==='eng');v.x=L.x+40;v.y=L.y;v.hp=20;v.orders=[];e.x=L.x+55;e.y=L.y+5;e.orders=[];
 ok(B.callIn('eng',{unit:v}),'call-in B on a damaged VARG');ok(e.orders[0]&&e.orders[0].type==='repair','BÄVER got a repair order');
 v.lastHit=G.time;run(3);ok(v.hp<=21,'no repair while the VARG is under fire');run(40);
 ok(Math.abs(v.hp-v.maxhp*B.REP.cap)<1,'repaired to '+Math.round(v.hp)+' of '+v.maxhp);ok(G.res<500-10,'repair cost material, net of income ('+Math.round(500-G.res)+')');
 ok(!e.orders.length,'order done');v.hp=30;run(4);ok(e.orders[0]&&e.orders[0].type==='repair'&&e.orders[0].auto,'idle BÄVER starts repairing on its own');}
// 4. planner: deliberate gaps on long lines, LC always held, pockets closed by fortress and depth defence
{let gaps=0,plans=0,pk=0;for(const s of [1234,7341,4242,9001,2718,5555,31,77,1001,1002])for(const d of ['framskjutet','djup','fastning','rorligt']){B.ENEMY_CFG.doctrine=d;B.newGame(s);const P=B.W.plan;plans++;if(P.cracks>0)gaps++;if(d==='djup'||d==='fastning')pk+=P.airPockets;
   const lc=B.G.relays[2];if(B.G.enemies.filter(e=>e.guard===2).length<2){ok(false,'LC under-defended on '+s+' '+d);}}
 B.ENEMY_CFG.doctrine=null;ok(gaps>=plans*.7,'gaps in '+gaps+' of '+plans+' plans');ok(pk===0,'fortress and depth leave no air-landing pockets ('+pk+')');}
// 5. a build can be cancelled: queued gives everything back, the one in production what is not printed yet
{B.newGame(7341);const G=B.G;G.running=true;G.res=1000;B.queueBuild('tank');B.queueBuild('drone');const r0=G.res;
 B.cancelBuild('ship',1);ok(G.res===r0+120&&G.build.length===1,'queued HÖK cancelled, full refund');
 for(let i=0;i<200;i++)B.step(.05);const b=G.build[0],part=Math.round(200*b.t/b.total),r1=G.res;B.cancelBuild('ship',0);
 ok(!G.build.length&&Math.abs(G.res-r1-part)<1&&part<200,'VARG in production cancelled, '+part+' of 200 back');}
// 6. a badly damaged VARG goes to a BÄVER nearby for field repair, not to the ship; a player order keeps it fighting
{B.newGame(7341);const G=B.G;G.running=true;for(const e of G.enemies)e.dead=true;G.res=500;const L=G.relays[0];
 const v=G.units.find(u=>u.kind==='tank'),e=G.units.find(u=>u.kind==='eng');v.x=L.x+40;v.y=L.y;v.orders=[];e.x=L.x+160;e.y=L.y+20;e.orders=[];
 v.hp=25;for(let i=0;i<20;i++)B.step(.05);ok(!v.rtb&&v.orders[0]&&v.orders[0].toRep===e.id,'damaged VARG drives to the BÄVER instead of the ship');
 for(let t=0;t<60&&v.hp<74;t++)for(let i=0;i<20;i++)B.step(.05);ok(v.hp>=74,'repaired in the field to '+Math.round(v.hp));
 const v2=G.units.filter(u=>u.kind==='tank')[1];v2.x=L.x+300;v2.y=L.y+200;e.x=9999;e.dead=true;v2.hp=20;v2.orders=[];for(let i=0;i<10;i++)B.step(.05);ok(v2.rtb,'without a BÄVER it retreats to the ship');
 B.giveOrder(v2,{type:'move',x:L.x,y:L.y,post:'off'},false);for(let i=0;i<20;i++)B.step(.05);ok(!v2.rtb&&v2.orders[0]&&v2.orders[0].type==='move','a player order keeps it in the fight');}
// 7. HÖK carries two robots and fires them by hand at the target in its sight
{B.newGame(7341);const G=B.G;G.running=true;const h=G.units.find(u=>u.kind==='drone');ok(h.maxAmmo===2&&h.ammo===2,'HÖK carries two robots');
 const t=G.enemies.find(x=>x.kind==='light'||x.kind==='inf');for(const e of G.enemies)if(e!==t)e.dead=true;t.seen=true;t.visibleNow=true;t.lx=t.x;t.ly=t.y;t.hp=999;
 h.x=t.x-80;h.y=t.y;h.heading=0;G.ctrl=h.id;B.droneRocket(h);ok(h.ammo===1,'R fires a robot at the target in the sight');h.cd=0;B.droneRocket(h);ok(h.ammo===0,'second robot');h.cd=0;B.droneRocket(h);ok(h.ammo===0,'no third');G.ctrl=null;}
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
