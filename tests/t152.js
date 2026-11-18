// Provspel ö 1185 (Magnus 18 nov): BÄVER begär lufttransport bara för hans order, KROK:s vägran namnger hotets senaste observation
// och har Hämta ändå, HÖK-raden säger varför ingen är ledig, GÄDDA:s väg in i nätet räknas mot hamnen Birka går till, en torr HÖK
// säger samma vägran högst en gång på 10 s, och besättningens klocka är 1,5 s per meter.
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const run=(n,f)=>{for(let i=0;i<n;i++){B.step(.05);if(f&&f())return i;}return n;};
let G;
function fresh(sd){B.newGame(sd);G=B.G;G.running=true;G.netAll=true;G.mines=[];G.known.fill(1);G.knownV++;B.LOS.on=false;G.krokAuto=false;G.units=[];G.enemies=[];return G;}
const put=(k,x,y)=>{const u=B.makeUnit(k,x,y);G.units.push(u);return u;};
function landNear(x,y,r0){for(let r=r0||0;r<300;r+=8)for(let a=0;a<6.28;a+=.4){const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;if(B.passLand(B.cellIdx(px,py)))return{x:px,y:py};}return null;}
const krokBusy=u=>G.kroks.some(k=>!k.dead&&k.orders.some(q=>q.unit===u));

// ---- the crew's clock ----
ok(B.MIS_CFG.crewPerM===1.5,'the crew patrol sets out after 1.5 s per metre of the way');

// ---- BÄVER: its own way home asks for no lift; the captain's order does ----
fresh(1185);
{const C=B.CARRIER,L=B.W.landing,q=landNear(L.x,L.y,60);
  // a BÄVER on Birka's deck sent ashore by its own errand (back into the net): no lift unasked
  const u=put('eng',C.x,C.y);u.hp=u.maxhp=1e6;u.orders=[{type:'move',x:q.x,y:q.y,post:'def',toNet:true}];G.log.length=0;run(60);
  const line=G.log.find(l=>/begär ingen lufttransport/.test(l.text));
  ok(B.onDeck(u.x,u.y)&&!krokBusy(u)&&!!line,'BÄVER on its own errand orders no KROK and says so ('+u.state+')');
  ok(G.log.filter(l=>/begär ingen lufttransport/.test(l.text)).length===1,'the line comes once');
  const btn=line&&line.acts&&line.acts.find(a=>/Begär lufttransport/.test(a.l));
  ok(!!btn,'the line has Begär lufttransport');
  if(btn){btn.f();run(80);}
  ok(krokBusy(u)||u.awaitKrok||u.carried,'the button orders the lift');
  // the captain's own order lifts it as before
  fresh(1185);const v=put('eng',C.x,C.y);v.hp=v.maxhp=1e6;v.orders=[{type:'move',x:q.x,y:q.y,post:'def'}];run(80);
  ok(krokBusy(v)||v.awaitKrok||v.carried,'the order of the captain still orders the lift');
}

// ---- where and when a threat was last seen ----
fresh(1185);
{const e=B.makeEnemy({id:'L2',kind:'aa',x:1000,y:900});G.enemies.push(e);e.seen=true;e.lx=980;e.ly=920;e.repT=G.time-240;e.visibleNow=false;e.shown=false;
  const t=B.seenWhere(e,{x:780,y:1015});
  ok(/^senast sedd för 4 min sedan i ruta \S+, 22\d m bort$/.test(t),'an old sighting is named with age, square and distance: '+t);
  e.shown=true;ok(/^sedd nu, 22\d m bort$/.test(B.seenWhere(e,{x:780,y:1015})),'a sighting in view says now');
}

// ---- a dry HÖK says the refusal once per 10 s ----
fresh(1185);
{const h=put('drone',1300,1300);h.ammo=0;const e=B.makeEnemy({id:'SV3',kind:'tank',x:1100,y:1100});G.enemies.push(e);G.log.length=0;
  for(let i=0;i<6;i++)B.dryTell(h,e);const n=G.log.filter(l=>/kulsprutan biter inte/.test(l.text)).length;
  ok(n===1,'six clicks give one refusal ('+n+')');run(220);B.dryTell(h,e);
  ok(G.log.filter(l=>/kulsprutan biter inte/.test(l.text)).length===2,'and again after 10 s');
}

// ---- no HÖK free: the line says why, and one on its way home can be sent ----
fresh(1185);
{const L=B.W.landing,p=landNear(L.x,L.y,40);const v=put('tank',p.x,p.y);const e=B.makeEnemy({id:'T7',kind:'turret',x:p.x+150,y:p.y});G.enemies.push(e);e.seen=false;
  const h=put('drone',p.x-200,p.y);h.ammo=0;h.rtb=true;h.orders=[{type:'rtb',post:'def'}];h.saved=[];G.log.length=0;
  B.requestSpot(v,e);const line=G.log.find(l=>/Ingen HÖK ledig/.test(l.text));
  ok(!!line&&/HÖK \S+ på väg att ladda om/.test(line.text),'the line says what the HÖK is doing: '+(line&&line.text));
  const btn=line&&line.acts&&line.acts.find(a=>/^Skicka .* ändå$/.test(a.l));ok(!!btn,'and offers to send it anyway');
  if(btn){btn.f();ok(!h.rtb&&h.orders[0]&&h.orders[0].spotFor===e,'the HÖK leaves the way home to spot');}
}

// ---- GÄDDA's way back in while Birka sails to the harbour ----
{let tried=0,done=false;
  for(const sd of [1185,2024,3402,9052,5555]){fresh(sd);if(!B.W.harbor||!B.W.harbor.dock||!G.harbor)continue;tried++;
    const d=B.W.harbor.dock;G.harbor.go=true;G.harbor.docked=false;
    const g=put('gadda',B.W.carrier0.x,B.W.carrier0.y);G.netAll=false;
    const p=B.gaddaNetPt(g);if(!p)continue;
    G.netShip=d;const inDock=B.inNet(p.x,p.y);G.netShip=null;
    ok(inDock,'ö '+sd+': GÄDDA heads for the net round the quay Birka is bound for');done=true;break;}
  ok(done,'an island with a harbour was tried ('+tried+')');
}
// ---- KROK: a pile in reach of an old sighting is skipped with where and when, and Hämta ändå fetches it with a notice ----
fresh(1185);
{const k=G.kroks[0],L=B.W.landing,q=landNear(L.x,L.y,80);k.post='def';const w={id:'w99',x:q.x,y:q.y,value:300,own:false,kind:'turret',claimed:false,rot:0,t0:0};G.wrecks.push(w);
  const e=B.makeEnemy({id:'L2',kind:'aa',x:q.x+400,y:q.y});G.enemies.push(e);e.seen=true;e.lx=q.x+60;e.ly=q.y;e.repT=G.time-200;e.visibleNow=false;e.shown=false;e.dmg=0;e.cd=1e9;
  G.log.length=0;B.krokOrder(k,{type:'salvage',wreck:w},false);run(10);
  const line=G.log.find(l=>/Hoppar över/.test(l.text));
  ok(!!line&&/luftvärn L2 \(senast sedd för 3 min sedan i ruta \S+, 60 m bort\)/.test(line.text),'the skip names the old sighting: '+(line&&line.text));
  const btn=line&&line.acts&&line.acts.find(a=>a.l==='Hämta ändå');ok(!!btn,'and has Hämta ändå');
  if(btn){G.log.length=0;btn.f();run(10);}
  ok(k.target===w&&G.log.some(l=>/Hämtar ändå på din order/.test(l.text)),'Hämta ändå sends KROK with a notice ('+G.log.map(l=>l.text).join(' | ')+')');
}
if(fail){console.log(fail+' FAIL');process.exit(1);}console.log('alla ok');
