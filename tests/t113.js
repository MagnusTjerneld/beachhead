// Provspel ö 1264 and the stills on ö 2547 (Magnus 3 nov): the lights with bloom 1.5 times white, threshold 1.2, strength 0.6 (issue 140),
// GÄDDA breaks off when fired on by something other than its target (issue 142), finds a way from Birka's side and picks firing spots only
// in water it can reach (issue 143), and a HÖK on service that is fit to fight takes a group order (issue 144)
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const run=(n,f)=>{for(let i=0;i<n;i++){B.step(.05);if(f&&f())return i;}return n;};
let G;
function fresh(){B.newGame(1264);G=B.G;G.running=true;G.netAll=true;G.mines=[];G.enemies=[];G.units=[];G.known.fill(1);G.knownV++;B.LOS.on=false;G.krokAuto=false;}
const put=(k,x,y)=>{const u=B.makeUnit(k,x,y);G.units.push(u);return u;};
// 140
{const h=require('fs').readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');ok(/exp:1,th:1\.2,str:\.6,lamp:1\.5,/.test(h),'bloom: lights 1.5 times white, threshold 1.2, strength 0.6');
  ok(/L\.intensity=\(air\?1:1\.6\)/.test(h),'the headlights at half: 1.6 on the ground, 1 in the air (issue 141)');}
// 143: from Birka's side, inside the box round her hull, there is a way out to open water
fresh();{const C=B.CARRIER,sp=B.shipPos(19,-20),c=B.cellIdx(sp[0],sp[1]);ok(!B.seaPass(c),'a place at Birka\'s side is not open water for the search');
  let far=null;for(let r=300;r<900&&!far;r+=50)for(let a=0;a<6.28&&!far;a+=.2){const x=C.x+Math.cos(a)*r,y=C.y+Math.sin(a)*r;if(B.seaPass(B.cellIdx(x,y))&&B.gaddaPiece(x,y)===B.gaddaPiece(sp[0],sp[1]))far={x,y};}
  ok(!!far,'open water in the same piece some way off');
  const R=far&&B.gaddaRoute(sp[0],sp[1],far.x,far.y,B.seaPass);ok(!!R&&R.length>1,'a way from Birka\'s side to it ('+(R?R.length:0)+' points)');}
// 143: a firing spot lies in the boat's own piece of water
fresh();{const C=B.CARRIER,u=put('gadda',C.x+40,C.y);let pk=null;for(const L of[B.LANDING])for(let r=80;r<400&&!pk;r+=20)for(let a=0;a<6.28&&!pk;a+=.3){const x=L.x+Math.cos(a)*r,y=L.y+Math.sin(a)*r;if(B.passLand(B.cellIdx(x,y)))pk={x,y};}
  const sp=pk&&B.gaddaSpot(u,pk.x,pk.y);ok(!sp||B.gaddaPiece(sp.x,sp.y)===B.gaddaPiece(u.x,u.y),'the firing spot is in the boat\'s own water');}
// 142: on Defensiv, fired on by another than its target, it breaks off and first gets out of reach
fresh();{const C=B.CARRIER;let p=null;for(let r=200;r<700&&!p;r+=25)for(let a=0;a<6.28&&!p;a+=.2){const x=C.x+Math.cos(a)*r,y=C.y+Math.sin(a)*r;if(B.seaPass(B.cellIdx(x,y)))p={x,y};}
  const u=put('gadda',p.x,p.y);u.post='def';const t=B.makeEnemy({id:'XT',kind:'turret',x:p.x+150,y:p.y}),o2=B.makeEnemy({id:'XO',kind:'turret',x:p.x,y:p.y+120});
  for(const e of[t,o2]){e.seen=true;e.lx=e.x;e.ly=e.y;e.dead=false;G.enemies.push(e);}
  B.giveOrder(u,{type:'attack',enemy:t,post:'def'},false);run(2);u.hitBy[o2.id]=G.time;u.lastHit=G.time;run(1);
  ok(u.rtb&&u.orders.some(o=>o.type==='rtb'),'fired on by another, it breaks off for Birka');
  ok(G.log.some(l=>/Bryter anfallet/.test(l.text)),'and says so');}
// 144: a HÖK on service with full hull and robots and half a battery takes the group order; one with an empty battery does not
fresh();{const L=B.LANDING,v=put('tank',L.x,L.y-40),h=put('drone',L.x+5,L.y-30),h2=put('drone',L.x+10,L.y-30);
  for(const x of[h,h2]){x.rtb=true;x.orders=[{type:'rtb',post:'def'}];}h.fuel=h.maxFuel*.5;h2.fuel=h2.maxFuel*.1;
  B.groupOrder({world:{x:L.x,y:L.y-150},us:[v,h,h2]},false);
  ok(!h.rtb&&!h.orders.some(o=>o.type==='rtb'),'a fit HÖK at 50 % leaves service for the group order');
  ok(h2.rtb,'one at 10 % stays on service');}
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
