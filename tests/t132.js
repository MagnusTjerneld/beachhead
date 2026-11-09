// Issue 166. Provspel ö 2929 (Magnus 9 nov): sökningen efter eldställning frös spelet i 8 s (kostnaden jämfördes i 64 bitar mot 32-bitars
// lagrade värden, så celler lades tillbaka i kön om och om igen); en VARG utan egen eldställning tar en ruta intill de andras och väntar när
// alla är tagna, i stället för att släppa ordern; och på väg hem kör en VARG inte runt ön över ospanad mark eller genom känd räckvidd utan
// väntar och frågar.
global.performance={now:()=>Date.now()};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const run=(n,f)=>{for(let i=0;i<n;i++){B.step(.05);if(f&&f())return i;}return n;};
B.newGame(2929);let G=B.G;G.running=true;
/* ---- every cell is seen at most a few times ---- */
{const N=220*220,e=G.enemies.find(q=>q.kind==='turret');let worst=0,ms=0;
  for(const known of [0,1]){G.known.fill(known);G.knownV++;
    for(let k=0;k<12;k++){const x=300+(k*517)%1600,y=300+(k*311)%1600;if(!B.passTank(B.cellIdx(x,y)))continue;let n=0;const t=Date.now();
      B.wayCost({x,y},e,()=>{n++;return false;});ms=Math.max(ms,Date.now()-t);worst=Math.max(worst,n);}}
  ok(worst<=N*1.2,'the way search sees each cell about once: at most '+worst+' visits on '+N+' cells');
  ok(ms<1500,'and no search takes long: '+ms+' ms at most');}
/* ---- firing spots side by side, and waiting when all are taken ---- */
{B.newGame(2929);G=B.G;G.running=true;G.known.fill(1);G.knownV++;
  const e=G.enemies.find(q=>q.id==='T5');e.seen=true;e.lx=e.x;e.ly=e.y;for(const f of G.enemies)if(f!==e)f.dead=true;
  const us=[];let full=null,spots=[];
  for(let k=0;k<150&&!full;k++){const u=B.makeUnit('tank',690+(k%4)*8,689+(k>>2)*8);/* east of spärr S1, which leaves T5 a few cells (provspel kp05) */
    u.vision=50;e.visibleNow=false;/* a short reach leaves a ring of a few dozen cells */const o={type:'attack',enemy:e,post:'off'};u.orders=[o];G.units.push(u);us.push(u);const sp=B.fireSpot(u,o);
    if(sp.full)full=sp;else if(sp.none)break;else{o.arc=sp;spots.push(sp);}}
  const close=spots.some((p,i)=>spots.some((q,j)=>j<i&&Math.hypot(p.x-q.x,p.y-q.y)<B.FIRE.gap));
  ok(spots.length>=2&&spots.every((p,i)=>spots.every((q,j)=>j>=i||Math.hypot(p.x-q.x,p.y-q.y)>=6)),'every VARG has a cell of its own: '+spots.length+' spots');
  ok(close,'once the spread-out spots are gone they stand side by side, closer than '+B.FIRE.gap+' m');
  ok(!!full,'when every spot is taken the search says so (full) instead of none');}
/* ---- the way home ---- */
{B.newGame(2929);G=B.G;G.running=true;G.known.fill(0);G.knownV++;G.mines=[];
  const C=B.CARRIER,ens=G.enemies.filter(f=>!f.dead&&f.canGround);
  /* a VARG on land 400 to 900 m from Birka by way, and a gun half way along that way, reaching nearly to both ends */
  let u=null,f=ens[0],pl=null;const Lp=p=>{let t=0;for(let i=1;i<p.length;i++)t+=Math.hypot(p[i].x-p[i-1].x,p[i].y-p[i-1].y);return t;};
  for(let k=0;k<400&&!u;k++){const x=200+(k*397)%1800,y=200+(k*613)%1800;if(B.W.grid[B.cellIdx(x,y)]!==3)continue;const d=Math.hypot(x-C.x,y-C.y);if(d<400||d>800)continue;
    const p=B.astar(x,y,C.x,C.y,B.passTank,()=>1);if(p&&p.length>4&&Lp([{x,y},...p])<d*1.3){u=B.makeUnit('tank',x,y);pl=p;}}
  if(u){const m=pl[pl.length>>1];f.x=f.lx=m.x;f.y=f.ly=m.y;f.range=Math.min(Math.hypot(m.x-u.x,m.y-u.y),Math.hypot(m.x-C.x,m.y-C.y))-40;}
  ok(!!u,'a VARG with a known gun between it and Birka');
  if(u){for(const g of G.enemies)if(g!==f)g.dead=true;f.seen=true;f.lx=f.x;f.ly=f.y;f.mobile=false;f.canMove=false;
    G.units.push(u);u.hp=u.maxhp*.3;B.goRtb(u,'Svåra skador.');const x0=u.x,y0=u.y;run(100);
    ok(/^Väntar: raka vägen till/.test(u.state||'')&&Math.hypot(u.x-x0,u.y-y0)<20,'it waits instead of driving through or round: '+u.state);
    const m=G.log.find(q=>q.uid===u.id&&/Raka vägen till/.test(q.text));ok(!!m&&m.acts&&m.acts.some(a=>a.l==='Kör raka vägen'),'and says why, with Kör raka vägen: '+(m&&m.text));
    if(m){m.acts.find(a=>a.l==='Kör raka vägen').f();f.dead=true;run(60);ok(Math.hypot(u.x-x0,u.y-y0)>20,'Kör raka vägen sends it home');}}}
console.log(fail?fail+' FAIL':'all ok');process.exit(fail?1:0);
