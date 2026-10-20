// reserve KROK (issue 67, Magnus 20 okt): with no KROK left, none in the yard and too little material for one, the yard builds a free
// one after KROK_RESERVE.t seconds and says so; with material for one, or one in the yard, nothing comes from the reserve
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
B.newGame(7341);const G=B.G;G.running=true;for(const e of G.enemies)e.dead=true;
const said=re=>G.log.filter(l=>re.test(l.text)).length,run=s=>{for(let t=0;t<s;t+=.25)B.step(.25);};
ok(G.kroks.some(k=>!k.dead),'a new game has a KROK');run(5);ok(!said(/reserven/),'and nothing from the reserve');
// 1: the KROK is lost with too little material
for(const k of G.kroks)B.killKrok(k);G.res=B.KROK_COST-50;const r0=G.res;run(5);
ok(said(/Ny KROK från reserven om 2 minuter/)===1,'lost with '+r0+' material: the reserve is announced');
run(B.KROK_RESERVE.t-15);ok(!G.kroks.some(k=>!k.dead),'none before the time is up');
run(20);ok(G.kroks.filter(k=>!k.dead).length===1&&said(/Reserv-KROK klar/)===1,'one free KROK after '+B.KROK_RESERVE.t+' s');
// 2: lost with material enough: the player builds it, no reserve
for(const k of G.kroks)B.killKrok(k);G.res=B.KROK_COST+10;const n1=said(/reserven/);run(B.KROK_RESERVE.t+10);
ok(said(/reserven/)===n1&&!G.kroks.some(k=>!k.dead),'with material for one: no reserve');
// 3: one already in the yard: no reserve either
G.build.push({kind:'krok',t:1e4,total:1e4});G.res=0;run(B.KROK_RESERVE.t+10);
ok(said(/reserven/)===n1,'with one in the yard: no reserve');
process.exit(fail?1:0);
