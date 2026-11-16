// What the player knows (issue 98 and 152, smyg package 7): a unit outside the net that sees an enemy may shoot at it but the chart and 3D (shown, seen)
// get it only when the unit is back in contact; a minefield found out of contact is reported then; a HÖK takes scouted ground when the detour is
// reasonable and the straight way otherwise, with the line in the log; with KNOW off the game is as before.
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const seedRand=s=>{let x=s>>>0;Math.random=()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};};
let G;
const texts=()=>G.log.map(l=>l.text);
function fresh(on){seedRand(11);B.newGame(1264);G=B.G;G.running=true;G.mines=[];G.units=[];G.known.fill(1);G.knownV++;B.LOS.on=false;G.krokAuto=false;B.KNOW.on=on;G.log.length=0;}
ok(B.KNOW&&B.KNOW.on===true&&typeof B.AIRSCOUT.detour==='number'&&typeof B.AIRSCOUT.extra==='number','KNOW is on by default and AIRSCOUT is named');

// a position that is outside the net with an enemy near it
function outsider(){const E=G.enemies.filter(e=>!e.dead&&['turret','at','light','tank'].includes(e.kind)&&!B.inNet(e.x,e.y));
  for(const e of E)for(let a=0;a<16;a++){const x=e.x+Math.cos(a/16*Math.PI*2)*32,y=e.y+Math.sin(a/16*Math.PI*2)*32;if(B.inNet(x,y)||!B.passLand(B.cellIdx(x,y)))continue;return{e,x,y};}return null;}

for(const on of [true,false]){
  fresh(on);const f=outsider();ok(!!f,'(KNOW '+on+') an enemy outside the net with ground beside it');if(!f)continue;
  const e=f.e;for(const q of G.enemies)if(q!==e)q.dead=true;e.camo=false;e.hp=e.maxhp=1e6;
  const u=B.makeUnit('tank',f.x,f.y);u.hp=u.maxhp=1e6;G.units.push(u);u.orders=[];
  G.netAll=false;
  for(let i=0;i<40;i++)B.step(.05);
  ok(!B.contactOf(u)||!on,'(KNOW '+on+') the unit is out of contact');
  ok(e.visibleNow,'(KNOW '+on+') the unit outside the net sees the enemy and may shoot at it (visibleNow)');
  if(on){ok(!e.shown&&!e.seen,'the chart and 3D do not show it (shown '+e.shown+', seen '+e.seen+')');
    ok(u.pend&&u.pend[e.id],'the unit keeps what it saw in its own list');
    ok(!texts().some(t=>/Kontakt: /.test(t)&&t.includes(e.id)),'no Kontakt line yet');
    // hysteresis: a flicker of contact shorter than KNOW.back reports nothing
    G.netAll=true;for(let i=0;i<Math.floor((B.KNOW.back-.5)/.05);i++)B.step(.05);G.netAll=false;for(let i=0;i<20;i++)B.step(.05);
    ok(!e.seen&&!e.shown,'a flicker at the net edge reports nothing (hysteresis)');
    G.netAll=true;for(let i=0;i<Math.ceil((B.KNOW.back+.5)/.05);i++)B.step(.05);
    ok(e.seen,'back in contact the enemy is in the common picture (seen)');
    ok(Math.hypot(e.lx-e.x,e.ly-e.y)<60,'at the place it was seen');
    ok(texts().some(t=>/Kontakt: /.test(t)&&t.includes(e.id)),'the Kontakt line comes then');
    ok(!u.pend,'the list is emptied');
    // a unit that is destroyed out there takes what it saw with it
    fresh(true);const f2=outsider();const e2=f2.e;for(const q of G.enemies)if(q!==e2)q.dead=true;e2.camo=false;e2.hp=e2.maxhp=1e6;e2.dmg=0;
    const u2=B.makeUnit('tank',f2.x,f2.y);u2.hp=u2.maxhp=1e6;G.units.push(u2);G.netAll=false;for(let i=0;i<40;i++)B.step(.05);
    const had=!!(u2.pend&&u2.pend[e2.id]);u2.dead=true;G.netAll=true;for(let i=0;i<80;i++)B.step(.05);
    ok(had&&!e2.seen,'a unit knocked out outside the net takes what it saw with it');
  }else{
    ok(e.shown===e.visibleNow&&e.shown,'KNOW off: as before, visible at once (shown '+e.shown+')');
  }
}

// a muzzle flash from an enemy firing at a unit outside the net reports nothing
{fresh(true);const f=outsider();const e=f.e;for(const q of G.enemies)if(q!==e)q.dead=true;e.camo=false;e.hp=e.maxhp=1e6;
  const u=B.makeUnit('tank',f.x,f.y);u.hp=u.maxhp=1e6;G.units.push(u);G.netAll=false;e.reveal=2;e.flashOn=u;
  for(let i=0;i<10;i++)B.step(.05);
  ok(!e.seen,'an enemy that fires at a unit outside the net is not reported by the flash');}

// minefield found outside the net
for(const on of [true,false]){
  fresh(on);const f=outsider();if(!f){ok(false,'a spot');continue;}
  const m={id:'M1',x:f.x+6,y:f.y,r:10,cells:[],walled:[],found:false,cleared:false,prog:0};G.mines.push(m);
  for(const q of G.enemies)q.dead=true;
  const v=B.makeUnit('eng',f.x,f.y);v.hp=v.maxhp=1e6;G.units.push(v);G.netAll=false;
  for(let i=0;i<20;i++)B.step(.05);
  ok(m.found,'(KNOW '+on+') BÄVER outside the net finds the field (it avoids it)');
  if(on){ok(m.hidden===true,'but it is not shown or said');ok(!texts().some(t=>/Minfält upptäckt/.test(t)),'no log line');
    G.netAll=true;for(let i=0;i<Math.ceil((B.KNOW.back+.5)/.05);i++)B.step(.05);
    ok(!m.hidden&&texts().some(t=>/Minfält upptäckt/.test(t)),'back in contact the field is reported');}
  else ok(!m.hidden&&texts().some(t=>/Minfält upptäckt/.test(t)),'KNOW off: reported at once as before');
}

// HÖK over scouted ground
{const GWc=Math.round(Math.sqrt(G.known.length)),CELL=10,mid=GWc*CELL/2;
  const A={x:mid-400,y:mid},Bp={x:mid+400,y:mid},CR=800;
  const corridor=off=>{G.known.fill(0);const m={x:mid,y:mid+off},seg=(p,q)=>{const n=Math.ceil(Math.hypot(q.x-p.x,q.y-p.y)/4);for(let k=0;k<=n;k++){const x=p.x+(q.x-p.x)*k/n,y=p.y+(q.y-p.y)*k/n;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const c=B.cellIdx(x+dx*10,y+dy*10);G.known[c]=1;}}};seg(A,m);seg(m,Bp);};
  const fly=(on,off)=>{fresh(on);G.enemies.length=0;if(off==null)G.known.fill(0);else corridor(off);const h=B.makeUnit('drone',A.x,A.y);G.units.push(h);G.ctrl=null;const o={type:'move',x:Bp.x,y:Bp.y,post:'def'};h.orders=[o];
    const p=B.airPath(h,Bp.x,Bp.y,o);return{p,t:texts()};};
  let r=fly(true,200);
  ok(r.p.length>=2&&r.p.some(q=>Math.hypot(q.x-(mid),q.y-(mid+200))<90),'a reasonable detour (about 12 % longer) over scouted ground is taken ('+r.p.map(q=>Math.round(q.x)+','+Math.round(q.y)).join(' ')+')');
  ok(r.t.some(t=>/flyger över spanad mark/.test(t)),'and the log says it');
  r=fly(true,700);
  ok(r.p.length===1&&r.p[0].x===Bp.x,'a detour of twice the way is not taken: straight');
  ok(r.t.some(t=>/flyger \d+ m över ospanad mark\./.test(t)),'the order says how far it flies over unscouted ground: '+r.t.filter(t=>/ospanad/.test(t))[0]);
  r=fly(true,null);ok(r.p.length===1&&r.t.some(t=>/m över ospanad mark\./.test(t)),'no scouted way at all: straight, with the line');
  G.known.fill(1);{const h=B.makeUnit('drone',A.x,A.y);G.units.push(h);const o={type:'move',x:Bp.x,y:Bp.y,post:'def'};G.log.length=0;const p=B.airPath(h,Bp.x,Bp.y,o);ok(p.length===1&&!texts().some(t=>/ospanad/.test(t)),'all scouted: straight and silent');}
  r=fly(false,200);ok(r.p.length===1&&!r.t.some(t=>/ospanad|spanad mark/.test(t)),'KNOW off: straight and silent as before');
  // a GETING scouts and keeps its way; a HÖK flown by hand is not steered
  fresh(true);G.enemies.length=0;corridor(200);{const g=B.makeUnit('scout',A.x,A.y);G.units.push(g);const o={type:'move',x:Bp.x,y:Bp.y,post:'def'};const p=B.airPath(g,Bp.x,Bp.y,o);ok(p.length===1,'a GETING is not steered over scouted ground');}
  fresh(true);G.enemies.length=0;corridor(200);{const h=B.makeUnit('drone',A.x,A.y);G.units.push(h);G.ctrl=h.id;const o={type:'move',x:Bp.x,y:Bp.y,post:'def'};const p=B.airPath(h,Bp.x,Bp.y,o);ok(p.length===1,'a HÖK flown by hand is not steered');}
}
process.exit(fail?1:0);
