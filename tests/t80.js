// the captain's salvage order follows KROK's stance (prov 20 okt, ö 9949 kp04): in Defensiv a pile within reach of known air defence
// is skipped with a reason and an offer of Offensiv; in Offensiv KROK fetches it anyway, warns once, and brings it home
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
B.newGame(9949);const G=B.G;G.running=true;for(const e of G.enemies)e.dead=true;
const run=s=>{for(let t=0;t<s;t+=.25)B.step(.25);},last=re=>G.log.find(l=>re.test(l.text));
G.known.fill(1);const k=G.kroks[0],C=B.CARRIER;
const w=G.wrecks.slice().sort((a,b)=>Math.hypot(a.x-C.x,a.y-C.y)-Math.hypot(b.x-C.x,b.y-C.y)).find(x=>Math.hypot(x.x-C.x,x.y-C.y)>250);
ok(!!w,'a pile '+(w?Math.round(Math.hypot(w.x-C.x,w.y-C.y)):'-')+' m from Birka');
// an air defence known to stand 150 m from the pile; it is really far away, so it never fires
const L=B.makeEnemy({id:'LX',kind:'aa',x:30,y:30});L.seen=true;L.lx=w.x+150;L.ly=w.y;G.enemies.push(L);
ok(!B.wreckSafe(w),'the pile counts as unsafe');
k.post='def';B.krokOrder(k,{type:'salvage',wreck:w},false);run(1);
const m1=last(/Hoppar över/);ok(!!m1&&/inom räckhåll för/.test(m1.text)&&m1.acts&&m1.acts.some(a=>/Offensiv/.test(a.l)),'Defensiv: skipped, says why and offers Offensiv');
ok(k.target!==w&&!w.claimed,'and KROK does not go for it (it may fetch a safe pile on its own)');
k.post='off';const r0=G.res;B.krokOrder(k,{type:'salvage',wreck:w},false);run(1);
ok(!!last(/Hämtar ändå på din order/)&&k.state==='out','Offensiv: it goes anyway and says so');
run(240);ok(G.res>r0,'and brings it home: +'+(G.res-r0)+' material');
process.exit(fail?1:0);
