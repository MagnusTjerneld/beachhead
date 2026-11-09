// Issue 165. Provspel ö 1364 och testplanen (Magnus 9 nov): BÄVER spränger kustartilleriet också från hjulet och Ropa in (B), texten säger att den lägger
// sprängladdningen, batteriet går upp i en kedja av sprängningar; GÄDDA:s klick på land flyttar den till vattnet i stället för att skjuta en robot,
// och en robot mot en punkt på land kommer bara med strike (hjulets Robot mot platsen).
global.performance={now:()=>0};process.env.BH_KUST='1';
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const run=(n,f)=>{for(let i=0;i<n;i++){B.step(.05);if(f&&f())return i;}return n;};
/* ---- the coast battery ---- */
let seed=0;for(let s=1000;s<1100&&!seed;s++){B.newGame(s);if(B.G.kustIsle)seed=s;}
ok(!!seed,'an island with a coast battery: ö '+seed);
if(seed){B.newGame(seed);const G=B.G;G.running=true;G.netAll=true;G.known.fill(1);G.knownV++;G.mines=[];G.krokAuto=false;
  const e=G.enemies.find(q=>q.kind==='kust');e.seen=true;e.lx=e.x;e.ly=e.y;
  ok(/B spränger/.test(B.callHints({enemy:e})),'Ropa in on the battery offers B: '+B.callHints({enemy:e}));
  const its=B.callItems({enemy:e});ok(its.some(i=>/BÄVER spränger/.test(i.l)),'the call-in items name BÄVER: '+its.map(i=>i.l).join(', '));
  G.enemies=G.enemies.filter(q=>q===e);const P=B.kustPortal(e),u=B.makeUnit('eng',P.x+3,P.y+3);G.units=G.units.filter(v=>v.kind!=='eng').concat([u]);
  B.callIn('eng',{enemy:e});ok(u.orders[0]&&u.orders[0].type==='blast'&&u.orders[0].enemy===e,'B on the battery gives BÄVER a blast order');
  run(200,()=>/sprängladdning/.test(u.state||''));ok(/Lägger sprängladdning vid porten/.test(u.state||''),'the state says what it does: '+u.state);
  const n0=G.fx.length;run(800,()=>e.dead);ok(e.dead,'the battery goes up');
  const bs=G.fx.filter(f=>f.k==='boom');ok(bs.length>=6&&bs.some(f=>f.t<0),'a chain of blasts, some still to come: '+bs.length+' booms, '+bs.filter(f=>f.t<0).length+' waiting');
  run(80);ok(!G.fx.some(f=>f.k==='boom'&&f.t<0),'all of them have gone off within four seconds');}
/* ---- GÄDDA on land ---- */
B.newGame(9052);{const G=B.G;G.running=true;G.netAll=true;
  const C=B.CARRIER;let p=null;for(let r=150;r<900&&!p;r+=20)for(let a=0;a<6.28&&!p;a+=.15){const x=C.x+Math.cos(a)*r,y=C.y+Math.sin(a)*r;if(B.seaPass(B.cellIdx(x,y)))p={x,y};}
  const u=B.makeUnit('gadda',p.x,p.y);G.units.push(u);
  let L=null;for(let r=20;r<400&&!L;r+=10)for(let a=0;a<6.28&&!L;a+=.2){const x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*r;if(B.heightAt(x,y)>2)L={x,y};}
  const o=B.gaddaOrder(u,{world:L},'off');ok(o&&o.type==='move'&&B.seaPass(B.cellIdx(o.x,o.y)),'a click on land moves GÄDDA to the water near it, no robot ('+(o&&o.type)+')');
  const s=B.gaddaOrder(u,{world:L,strike:true},'off');ok(s&&s.type==='strike','Robot mot platsen still sends a robot at a point on land');}
process.exit(fail?1:0);
