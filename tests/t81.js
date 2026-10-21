// KROK's legs (Magnus 21 okt): folded in flight, down before a pickup and at service. Follows a lift of a VARG on the beach and a
// trip home for repair, and reads what the legs want at each stage
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
B.newGame(2024);const G=B.G;G.running=true;for(const e of G.enemies)e.dead=true;G.known.fill(1);
const k=G.kroks[0],L=B.W.landing,u=B.makeUnit('tank',L.x,L.y);G.units.push(u);
const d=()=>Math.hypot(u.x-k.x,u.y-k.y);
ok(B.krokLegsWant(k)===0,'idle at Birka: legs up');
B.krokOrder(k,{type:'lift',unit:u},false);
let far=null,near=null,coupling=null;
for(let t=0;t<240&&!k.cargo;t+=.25){B.step(.25);const w=B.krokLegsWant(k);
  if(d()>B.KROK_LEGS_R+20&&far==null)far=w;if(d()<B.KROK_LEGS_R-10&&d()>10&&near==null)near=w;if(k.low&&coupling==null)coupling=w;}
ok(far===0,'on the way out, far from the VARG: legs up');
ok(near===1,'within '+B.KROK_LEGS_R+' m of the VARG: legs down');
ok(coupling===1,'coupling: legs down');
ok(!!k.cargo,'the VARG is on the hook');
B.step(.25);ok(B.krokLegsWant(k)===0,'with the VARG on the hook in flight: legs up');
// home for repair: down on the way in to its spot
// (no piles left, so it does not go salvaging on the way)
k.cargo.carried=null;k.cargo=null;k.orders=[];k.state='idle';k.target=null;G.wrecks.length=0;k.hp=k.maxhp*.6;
let up=null,home=null;for(let t=0;t<200&&home==null;t+=.25){B.step(.25);const r=Math.hypot(k.pad.x-k.x,k.pad.y-k.y),w=B.krokLegsWant(k);if(r>B.KROK_LEGS_R+20&&up==null)up=w;if(r<10)home=w;}
ok(up!==1,'damaged, far from Birka: legs up');
ok(home===1,'at its spot for repair: legs down');
console.log(fail?'FAIL '+fail:'all ok');process.exit(fail?1:0);
