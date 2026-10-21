// KROK's legs (Magnus 21 okt): folded in flight, down before a pickup, before setting down and at service. Follows a lift of a VARG
// on the beach, setting it down 250 to 400 m away, a pile carried home and a trip home for repair, and reads what the legs want
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
// set it down 400 m away: up on the way, down before the place and while setting down
let tgt=null;
for(const r of[400,350,300,250])for(let a=0;a<12&&!tgt;a++){const x=L.x+Math.cos(a*Math.PI/6)*r,y=L.y+Math.sin(a*Math.PI/6)*r;if(B.heightAt(x,y)>1.5)tgt={x,y};}
ok(!!tgt,'a place on land to set the VARG down');k.post='off';u.post='off';B.krokOrder(k,{type:'drop',x:tgt.x,y:tgt.y,force:true},false);
let dFar=null,dNear=null,dLow=null;for(let t=0;t<200&&k.cargo;t+=.25){B.step(.25);if(!k.cargo)break;const o=k.orders[0],p=o&&(o.dp||o.tp),r=p?Math.hypot(p.x-k.x,p.y-k.y):1e9,w=B.krokLegsWant(k);
  if(r>B.KROK_LEGS_R+20&&dFar==null)dFar=w;if(r<B.KROK_LEGS_R-10&&r>10&&dNear==null)dNear=w;if(k.low&&dLow==null)dLow=w;}
ok(dFar===0,'on the way to set it down, far off: legs up');ok(dNear===1,'within '+B.KROK_LEGS_R+' m of the place: legs down');ok(dLow===1,'setting down: legs down');ok(!k.cargo,'the VARG is set down');
// (no piles left, so it does not go salvaging on the way)
k.orders=[];k.state='idle';k.target=null;G.wrecks.length=0;
// a pile on the hook on the way home: up far out, down before its spot
{k.orders=[];k.state='back';k.carry={id:'P',x:k.x,y:k.y,w:10};k.carryT=0;let pf=null,pn=null;for(let t=0;t<200&&k.carry;t+=.25){B.step(.25);const r=Math.hypot(k.pad.x-k.x,k.pad.y-k.y),w=B.krokLegsWant(k);
  if(r>B.KROK_LEGS_R+20&&pf==null)pf=w;if(r<B.KROK_LEGS_R-10&&pn==null&&k.carry)pn=w;}
 ok(pf===0,'a pile on the hook, far from Birka: legs up');ok(pn===1,'a pile on the hook, near its spot: legs down');}
// home for repair
k.carry=null;k.state='idle';k.hp=k.maxhp*.6;
let up=null,home=null;for(let t=0;t<200&&home==null;t+=.25){B.step(.25);const r=Math.hypot(k.pad.x-k.x,k.pad.y-k.y),w=B.krokLegsWant(k);if(r>B.KROK_LEGS_R+20&&up==null)up=w;if(r<10)home=w;}
ok(up!==1,'damaged, far from Birka: legs up');
ok(home===1,'at its spot for repair: legs down');
console.log(fail?'FAIL '+fail:'all ok');process.exit(fail?1:0);
