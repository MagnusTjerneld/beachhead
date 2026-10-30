// air defence by target size, manual KROK flight with the hook, BÄVER field repair, the planner's gaps and air pockets
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;B.START.res=500;B.START.units=['drone','tank','tank','eng'];B.SHAPE_CFG.force='rund';B.SHAPE_CFG.rough=0;/* the game's 500 material (issue 103), with a fixed force */let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
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
 k.x=k.pad.x;k.y=k.pad.y;run(2.2);/* the load is lowered for 2 s since 19 okt (issue 60) */ok(!k.carry&&G.res>=r0+40-1,'pile delivered at the ship (+'+Math.round(G.res-r0)+')');
 for(const e of G.units)if(e.kind==='eng'){e.x=L.x;e.y=L.y;}/* BÄVER parks on a stern pad now, within the hook's reach */
 B.krokHook(k);ok(!k.mAct,'F with nothing below does nothing');G.ctrl=null;}
// 3. BÄVER repairs a damaged VARG in the field up to 75 %, only when both are still and out of fire
{B.newGame(7341);const G=B.G;G.running=true;kill(G);G.res=500;const L=G.relays[0];
 const v=G.units.find(u=>u.kind==='tank'),e=G.units.find(u=>u.kind==='eng');v.x=L.x+40;v.y=L.y;v.hp=20;v.orders=[];e.x=L.x+55;e.y=L.y+5;e.orders=[];
 ok(B.callIn('eng',{unit:v}),'call-in B on a damaged VARG');ok(e.orders[0]&&e.orders[0].type==='repair','BÄVER got a repair order');
 v.lastHit=G.time;run(3);ok(v.hp<=21,'no repair while the VARG is under fire');run(40);
 ok(Math.abs(v.hp-v.maxhp*B.REP.cap)<1,'repaired to '+Math.round(v.hp)+' of '+v.maxhp);ok(G.res<500-10,'repair cost material, net of income ('+Math.round(500-G.res)+')');
 ok(!e.orders.length,'order done');v.hp=v.maxhp*.3;run(4);ok(e.orders[0]&&e.orders[0].type==='repair'&&e.orders[0].auto,'idle BÄVER starts repairing on its own');}
// 4. planner: deliberate gaps on long lines, LC always held, pockets closed by fortress and depth defence
{let gaps=0,plans=0,pk=0;for(const s of [1234,7341,4242,9001,2718,5555,31,77,1001,1002])for(const d of ['framskjutet','djup','fastning','rorligt']){B.ENEMY_CFG.doctrine=d;B.newGame(s);const P=B.W.plan;plans++;if(P.cracks>0)gaps++;if(d==='djup'||d==='fastning')pk+=P.airPockets;
   const lc=B.G.relays[2];if(B.G.enemies.filter(e=>e.guard===2).length<2){ok(false,'LC under-defended on '+s+' '+d);}}
 B.ENEMY_CFG.doctrine=null;
 {let bare=0,n=0,lea=0;for(const s of [1234,7341,4242,9001,2718,5555]){B.newGame(s);const G=B.G,R1=G.relays[0];for(const a of G.enemies.filter(e=>e.kind==='aa'&&Math.hypot(e.x-R1.x,e.y-R1.y)>260)){n++;if(!G.enemies.some(f=>f.kind==='at'&&f.cover===a.id&&Math.hypot(f.x-a.x,f.y-a.y)<70))bare++;}
   for(const f of G.enemies)if(f.cover&&f.kind==='at'&&f.leash>40)lea++;}
  ok(n>0&&bare<=n*.1,'air defence beyond R1 has its own anti-tank cover ('+(n-bare)+' of '+n+')');ok(lea===0,'cover teams hold their post');}
 ok(gaps>=plans*.7,'gaps in '+gaps+' of '+plans+' plans');ok(pk===0,'fortress and depth leave no air-landing pockets ('+pk+')');}
// 5. a build can be cancelled: queued gives everything back, the one in production what is not printed yet
{B.newGame(7341);const G=B.G;G.running=true;G.res=1000;B.queueBuild('tank');B.queueBuild('drone');const r0=G.res;
 B.cancelBuild('ship',1);ok(G.res===r0+120&&G.build.length===1,'queued HÖK cancelled, full refund');
 for(let i=0;i<200;i++)B.step(.05);const b=G.build[0],part=Math.round(200*b.t/b.total),r1=G.res;B.cancelBuild('ship',0);
 ok(!G.build.length&&Math.abs(G.res-r1-part)<1&&part<200,'VARG in production cancelled, '+part+' of 200 back');}
// 6. a badly damaged VARG goes to a BÄVER nearby for field repair, not to the ship; a player order keeps it fighting
{B.newGame(7341);const G=B.G;G.running=true;for(const e of G.enemies)e.dead=true;G.res=500;const L=G.relays[0];
 const v=G.units.find(u=>u.kind==='tank'),e=G.units.find(u=>u.kind==='eng');v.x=L.x;v.y=L.y;v.orders=[];
 /* the BÄVER on open land 100 to 140 m off (19 okt: R1 moved into its yard, and a fixed offset fell on a cliff) */
 {const g=B.W.grid;let p=null;for(let r=100;r<=140&&!p;r+=10)for(let k=0;k<24&&!p;k++){const x=L.x+Math.cos(k/24*6.283)*r,y=L.y+Math.sin(k/24*6.283)*r,c=g[B.cellIdx(x,y)];if((c===2||c===3)&&B.astar(L.x,L.y,x,y,i=>g[i]===2||g[i]===3,()=>1))p={x,y};}e.x=p.x;e.y=p.y;}e.orders=[];
 v.hp=25;for(let i=0;i<20;i++)B.step(.05);ok(!v.rtb&&v.orders[0]&&v.orders[0].toRep===e.id,'damaged VARG drives to the BÄVER instead of the ship');
 for(let t=0;t<60&&v.hp<74;t++)for(let i=0;i<20;i++)B.step(.05);ok(v.hp>=74,'repaired in the field to '+Math.round(v.hp));
 const v2=G.units.filter(u=>u.kind==='tank')[1];v2.x=L.x+300;v2.y=L.y+200;e.x=9999;e.dead=true;v2.hp=20;v2.orders=[];for(let i=0;i<10;i++)B.step(.05);ok(v2.rtb,'without a BÄVER it retreats to the ship');
 B.giveOrder(v2,{type:'move',x:L.x,y:L.y,post:'off'},false);for(let i=0;i<20;i++)B.step(.05);ok(!v2.rtb&&v2.orders[0]&&v2.orders[0].type==='move','a player order keeps it in the fight');}
// 7. HÖK carries two robots and fires them by hand at the target in its sight
{B.newGame(7341);const G=B.G;G.running=true;const h=G.units.find(u=>u.kind==='drone');ok(h.maxAmmo===4&&h.ammo===4&&h.maxhp===60,'HÖK carries four robots and 60 hull');
 const t=G.enemies.find(x=>x.kind==='light'||x.kind==='inf');for(const e of G.enemies)if(e!==t)e.dead=true;t.seen=true;t.visibleNow=true;t.lx=t.x;t.ly=t.y;t.hp=999;
 h.x=t.x-80;h.y=t.y;h.heading=0;G.ctrl=h.id;B.droneRocket(h);ok(h.ammo===3,'R fires a robot at the target in the sight');for(let k=0;k<3;k++){h.cd=0;B.droneRocket(h);}ok(h.ammo===0,'all four');h.cd=0;B.droneRocket(h);ok(h.ammo===0,'no fifth');G.ctrl=null;}
// 7b. homing robots reach 50 m further at a target another unit has eyes on, never at one only the HÖK itself sees
{B.newGame(7341);const G=B.G;G.running=true;const h=G.units.find(u=>u.kind==='drone'),t=G.enemies.find(x=>x.kind==='light'||x.kind==='inf');for(const e of G.enemies)if(e!==t)e.dead=true;t.hp=999;t.seen=true;
 for(const u of G.units)if(u!==h){u.x=50;u.y=50;}h.x=t.x-160;h.y=t.y;h.heading=0;h.orders=[];h.orbit={x:h.x,y:h.y};B.step(.05);
 ok(t.visibleNow&&B.reachR(h,t)===h.range,'only the HÖK sees it: normal reach');G.ctrl=h.id;h.heading=Math.atan2(t.y-h.y,t.x-h.x);B.droneRocket(h);ok(h.ammo===4,'no robot fired at 160 m');
 G.ctrl=null;const sc=B.makeUnit('scout',t.x+40,t.y);G.units.push(sc);sc.orders=[];sc.mission=null;sc.orbit={x:sc.x,y:sc.y};B.step(.05);G.ctrl=h.id;
 ok(B.reachR(h,t)===h.range+50,'a SPARV has eyes on it: reach '+B.reachR(h,t)+' m');h.cd=0;h.heading=Math.atan2(t.y-h.y,t.x-h.x);{const mr=Math.random;Math.random=()=>.01;B.droneRocket(h);Math.random=mr;}ok(h.ammo===3,'robot fired at 160 m');G.ctrl=null;
 const hp0=t.hp;t.mobile=true;for(let i=0;i<60;i++){t.x+=.4;B.step(.05);}ok(t.hp<hp0,'the homing robot hits a target that moves');}
// 8. a VARG attacking a camouflaged bunker it cannot see gets an idle HÖK to spot it from outside its air range, and kills it
{B.newGame(6556);const G=B.G;G.running=true;const t=G.enemies.find(x=>x.kind==='turret');for(const e of G.enemies)if(e!==t)e.dead=true;t.seen=true;t.lx=t.x;t.ly=t.y;
 const v=G.units.find(u=>u.kind==='tank'),h=G.units.find(u=>u.kind==='drone');for(const u of G.units)if(u!==v&&u!==h){u.dead=true;}
 const C={x:h.x,y:h.y},a=Math.atan2(C.y-t.y,C.x-t.x);v.x=t.x+Math.cos(a)*142;v.y=t.y+Math.sin(a)*142;v.orders=[];h.orders=[];
 B.giveOrder(v,{type:'attack',enemy:t,post:'off'},false);for(let i=0;i<10;i++)B.step(.05);
 const so=h.orders[0];ok(so&&so.type==='obs'&&so.spotFor===t,'idle HÖK sent to spot the bunker');
 let minD=1e9;for(let i=0;i<20*120&&!t.dead;i++){B.step(.05);if(h.x!==undefined&&Math.hypot(h.x-t.x,h.y-t.y)<minD&&h.orders[0]&&h.orders[0].spotFor)minD=Math.hypot(h.x-t.x,h.y-t.y);}
 ok(t.dead,'bunker killed with the spotter');ok(minD>130,'spotter stayed outside the bunker air range (closest '+Math.round(minD)+' m)');
 for(let i=0;i<20;i++)B.step(.05);ok(!h.orders[0]||!h.orders[0].spotFor,'spotting order ends with the target');}
// 9. robots hurt armor at half effect, the MG does not bother
{B.newGame(7341);const G=B.G;G.running=true;const h=G.units.find(u=>u.kind==='drone'),t=G.enemies.find(x=>x.kind==='turret');
 ok(B.canHit(h,t,true),'HÖK with robots can engage a bunker when told to');ok(!B.canHit(h,t),'but never picks armor on its own');h.ammo=0;ok(!B.canHit(h,t),'without robots it cannot');ok(Math.abs(B.dmgMult(h,t,'rocket')-.5)<1e-9,'robot vs armor at half effect');}
// 10. HÖK's robot: hit chance from the type (0.9), and each air defence reaching the target shoots it down 5 % of the time (issue 95)
{B.newGame(7341);const G=B.G;G.running=true;const h=G.units.find(u=>u.kind==='drone'),aa=G.enemies.find(e=>e.kind==='aa');
 ok(h.acc===.9&&B.HOK_AA===.05,'HÖK acc 0.9, air defence takes down 5 %');
 for(const e of G.enemies)if(e!==aa)e.dead=true;let n=0;const N=4000;for(let i=0;i<N;i++){const f={x2:aa.x+20,y2:aa.y,down:null};B.hokAim(f);if(f.down)n++;}
 ok(Math.abs(n/N-.05)<.02,'one air defence downs '+(n/N*100).toFixed(1)+' % of the robots');
 aa.dead=true;let m=0;for(let i=0;i<500;i++){const f={x2:aa.x+20,y2:aa.y,down:null};B.hokAim(f);if(f.down)m++;}ok(m===0,'a dead air defence downs none');}
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
