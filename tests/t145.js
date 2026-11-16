// Rättelser beslutade 12 till 16 nov (natt 17 nov, paket D1): BÄVER:s stopp för kontakt (issue 198), vakter som låser en punkt (issue 204),
// sprängorder bakom en annan spärr (issue 168) och besättningen hemma vid rampen (issue 184).
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const run=(n,f)=>{for(let i=0;i<n;i++){B.step(.05);if(f&&f())return i;}return n;};
let G;
function fresh(sd,opt){B.newGame(sd,null,opt);G=B.G;G.running=true;G.netAll=true;G.mines=[];G.known.fill(1);G.knownV++;B.LOS.on=false;G.krokAuto=false;G.units=[];return G;}
const put=(k,x,y)=>{const u=B.makeUnit(k,x,y);G.units.push(u);return u;};
const lastLog=()=>G.log.slice(0,6).map(l=>l.text).join(' | ');
function landNear(x,y,r0){for(let r=r0||0;r<300;r+=8)for(let a=0;a<6.28;a+=.4){const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;if(B.passLand(B.cellIdx(px,py)))return{x:px,y:py};}return null;}

// ---- issue 198: BÄVER stops only for what reaches it with its range against ground ----
fresh(1264);G.enemies=[];
{const L=B.W.landing,p=landNear(L.x,L.y,30),q=landNear(p.x+160,p.y,0);
  const u=put('eng',p.x,p.y);u.hp=u.maxhp=1e6;const tgt={x:q.x,y:q.y};
  const mkE=(kind,id,dx,dy)=>{const e=B.makeEnemy({id,kind,x:p.x+dx,y:p.y+dy});e.dmg=0;e.cd=1e9;e.mgcd=1e9;e.reveal=1e9;e.seen=true;G.enemies.push(e);return e;};
  // air defence within 55 m: visible, inside the old 150 m, but it cannot fire on ground
  const rs=()=>{u.hold=false;u.unsafeWait=false;u.override=false;u.waitT=0;u.path=null;u.orders=[{type:'move',x:tgt.x,y:tgt.y,post:'def'}];G.log.length=0;};
  const aa=mkE('aa','A9',40,30);aa.flashOn=u;
  rs();run(30);
  ok(!u.hold&&!/Kontakt/.test(lastLog()),'air defence 50 m off does not stop BÄVER ('+u.state+')');
  aa.dead=true;
  // a tank (not camouflaged) with its ground range cut to 60 m, 120 m away: in the old 150 m rule, out of its own reach
  const tk=mkE('tank','V9',0,120);tk.range=60;rs();run(30);
  ok(!u.hold,'a threat inside 150 m but out of its own reach does not stop it');
  // a bunker with a 140 m range, 110 m away: it reaches BÄVER
  tk.dead=true;const tu=mkE('turret','T9',0,110);tu.camo=false;tu.flashOn=u;rs();run(30);
  ok(u.hold,'a bunker that reaches it stops it ('+u.state+')');
  const L1=G.log.find(l=>/Kontakt/.test(l.text));
  ok(L1&&/^Kontakt: bunker T9, \d+ m\. Avvaktar\.$/.test(L1.text),'the line names the threat and the distance: '+(L1&&L1.text));
  ok(L1&&L1.acts&&L1.acts.length===1&&L1.acts[0].l==='Fortsätt trots risk','the line carries the button Fortsätt trots risk');
  // a new explicit order does not pass the stop
  const px=u.x;B.giveOrder(u,{type:'move',x:tgt.x,y:tgt.y+10,post:'def'},false);run(40);
  ok(u.hold&&Math.abs(u.x-px)<1.5,'a new explicit order does not pass the stop');
  // a threat reaching only the work place stops it too
  tu.dead=true;const far=mkE('turret','T8',300,0);far.camo=false;far.x=tgt.x+20;far.y=tgt.y;far.lx=far.x;far.ly=far.y;far.flashOn=u;
  rs();run(30);
  ok(u.hold&&/Kontakt: bunker T8/.test(lastLog()),'a threat that reaches only the work place stops it too ('+u.state+')');
  // the button lets it go on, and the line loses it when the stop ends
  tu.dead=false;far.dead=true;rs();run(30);const L2=G.log.find(l=>/Kontakt/.test(l.text));
  ok(L2&&L2.acts,'a new stop gives a new line with the button');
  L2.acts[0].f();ok(u.override&&!u.hold,'the button sets BÄVER going (Fortsätt trots risk)');
  run(30);ok(!u.hold&&u.x!==px,'and it is not stopped again ('+u.state+')');
  ok(/Uppfattat\. Fortsätter trots risk/.test(lastLog()),'with the old confirmation line');
  tu.dead=true;}

// ---- issue 204: guards that lock a point ----
fresh(1264);
{const r=G.relays.find(x=>x.guards.length&&G.enemies.some(e=>r0(x,e)));
  function r0(x,e){return x.guards.includes(e.id)&&e.canGround;}
  ok(!!r,'a point with ground guards ('+(r&&r.id)+')');
  const gs=G.enemies.filter(e=>r.guards.includes(e.id)&&e.canGround);const g=gs[0];
  const u=put('eng',r.x,r.y);u.hp=u.maxhp=1e6;
  for(const e of G.enemies)e.seen=false;
  ok(B.relayGuards(r).length===0,'unseen guards lock nothing');
  const o={type:'capture',relay:r,post:'def'};G.log.length=0;
  ok(B.relayLocked(r,u,o)===false&&!/skyddas/.test(u.state||'')&&!G.log.some(l=>/skyddas/.test(l.text)),'an unseen guard does not lock, and the status line names nothing');
  g.seen=true;
  ok(B.relayGuards(r).includes(g)&&B.relayLocked(r,u,o)===true,'a known guard that can fire on ground locks');
  ok(/^Punkten skyddas av /.test(u.state)&&G.log.some(l=>/skyddas av /.test(l.text)&&l.text.includes(g.id)),'the reason is said and names the known guard');
  const n1=G.log.filter(l=>/skyddas av /.test(l.text)).length;G.time+=10;B.relayLocked(r,u,o);
  ok(G.log.filter(l=>/skyddas av /.test(l.text)).length===n1,'once per order, not every frame');
  const o2={type:'capture',relay:r,post:'def'};G.time+=10;B.relayLocked(r,u,o2);
  ok(G.log.filter(l=>/skyddas av /.test(l.text)).length===n1+1,'a new order to the same point says it again');
  // air defence never locks
  const aa=B.makeEnemy({id:'AX',kind:'aa',x:r.x+20,y:r.y});aa.seen=true;G.enemies.push(aa);r.guards.push(aa.id);
  ok(!B.relayGuards(r).includes(aa),'a known air defence does not lock');
  g.dead=true;for(const e of gs)e.dead=true;
  ok(B.relayLocked(r,u,{type:'capture',relay:r})===false,'with the ground guards gone only the air defence is left: not locked');}

// ---- issue 168: a charge behind another barrier ----
fresh(6795);
{const S1=G.barriers.find(b=>b.id==='S1'),S2=G.barriers.find(b=>b.id==='S2');const L=B.W.landing;let p=null;
  for(let r=10;r<200&&!p;r+=10)for(let a=0;a<6.28&&!p;a+=.5){const x=L.x+Math.cos(a)*r,y=L.y+Math.sin(a)*r;if(B.passLand(B.cellIdx(x,y)))p={x,y};}
  const u=put('eng',p.x,p.y);G.enemies=[];
  ok(B.clearBlocker(u,S2)===S1&&B.clearBlocker(u,S1)===null,'from the landing S1 is the one that closes the way to S2, and S1 itself can be reached');
  B.giveOrder(u,B.defaultOrder(u,{barrier:S2},'def'),false);const o=u.orders[0];ok(o&&o.type==='clear'&&o.barrier===S2,'a charge order on S2');
  G.log.length=0;run(200,()=>G.log.some(l=>/stänger vägen/.test(l.text)));
  const L1=G.log.find(l=>/stänger vägen/.test(l.text));
  ok(L1&&/spärr S1 stänger vägen/.test(L1.text)&&/till spärr S2/.test(L1.text),'the line names S1, the one that closes the way: '+(L1&&L1.text));
  ok(L1&&L1.acts&&L1.acts[0].l==='Spräng S1 först','with the button Spräng S1 först');
  ok(!G.log.some(l=>/Skicka BÄVER/.test((l.acts||[]).map(a=>a.l).join())),'and no Skicka BÄVER for itself');
  ok(!u.awaitKrok&&!G.kroks.some(k=>k.orders.some(q=>q.type==='lift')),'KROK is not asked for first');
  const n=G.log.filter(l=>/stänger vägen/.test(l.text)).length;run(400);ok(G.log.filter(l=>/stänger vägen/.test(l.text)).length===n,'asked once per order');
  L1.acts[0].f();ok(u.orders[0]&&u.orders[0].type==='clear'&&u.orders[0].barrier===S1&&u.orders[1]===o,'the button puts S1 first and S2 after it');
  run(4000,()=>S1.cleared);ok(S1.cleared,'S1 is blasted ('+u.state+')');
  run(4000,()=>S2.cleared);ok(S2.cleared,'and then S2 ('+u.state+')');}
// the side is chosen among those that can be reached on land: with S1 closed, S2's near side is not
fresh(6795);
{const S2=G.barriers.find(b=>b.id==='S2'),L=B.W.landing;let p=null;
  for(let r=10;r<200&&!p;r+=10)for(let a=0;a<6.28&&!p;a+=.5){const x=L.x+Math.cos(a)*r,y=L.y+Math.sin(a)*r;if(B.passLand(B.cellIdx(x,y)))p={x,y};}
  const rr=B.reachFrom(p),sd=B.barrierSide(S2,p);const any=S2.sides.some(s=>rr[B.cellIdx(s.x,s.y)]);
  ok(any===false&&!!sd,'with no side of S2 reachable a side is still returned (the order then asks)');
  const S1=G.barriers.find(b=>b.id==='S1');S1.cleared=true;for(const c of S1.cells)B.W.grid[c]=B.W.baseGrid[c];
  const r2=B.reachFrom(p),sd2=B.barrierSide(S2,p);ok(r2[B.cellIdx(sd2.x,sd2.y)],'with S1 blasted the side it picks can be driven to');}
// ö 3410: S2 blasted, BÄVER at (1355,917) in zone 3: S3's side comes out reachable
fresh(3410);
{const S2=G.barriers.find(b=>b.id==='S2'),S3=G.barriers.find(b=>b.id==='S3');S2.cleared=true;for(const c of S2.cells)B.W.grid[c]=B.W.baseGrid[c];
  const p={x:1355,y:917},sd=B.barrierSide(S3,p),r=B.reachFrom(p);ok(r[B.cellIdx(sd.x,sd.y)]===1,'ö 3410, S2 blasted: the side chosen for S3 can be reached on land');
  ok(B.clearBlocker(p,S3)===null,'and nothing closes the way to S3');}

// ---- issue 184: the crew is home when its vehicle stands within the ramp's reach ----
fresh(3402,{uppdrag:'crew'});G.enemies=[];
{const q=G.misCrew,v=put('tank',q.x+25,q.y);B.misTick(.05);const c=B.crewU();ok(!!c,'the crew is found');
  B.crewBoard(c,v);G.beach.st='on';G.beach.tipH=B.DECK_Y-2;G.ramp={bow:1,side:1};ok(B.berthed()&&B.rampDown('bow'),'Birka at the beach, ramp down');
  const t=B.crewTip(),R=B.rampReach();
  v.x=t.x+R*3;v.y=t.y;B.misTick(.05);ok(!G.misGot,'three ramp lengths off: not home');
  v.x=t.x+R*.8;v.y=t.y;B.misTick(.05);ok(G.misGot,'within the ramp\'s reach of its foot: home, the vehicle need not be on the plate ('+lastLog()+')');}
fresh(3402,{uppdrag:'crew'});G.enemies=[];
{const q=G.misCrew,v=put('tank',q.x+25,q.y);B.misTick(.05);const c=B.crewU();B.crewBoard(c,v);G.beach.st='off';
  const t=B.crewTip();v.x=t.x;v.y=t.y;B.misTick(.05);ok(!G.misGot,'with Birka not at the beach or the quay it does not count');
  G.beach.st='on';G.ramp={bow:.5,side:1};B.misTick(.05);ok(!G.misGot,'nor with the bow ramp up');}
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
