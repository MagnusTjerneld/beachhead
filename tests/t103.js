// A group mate in a passing fight with something else does not release the HÖK from the group hold for good (issue 108). The
// sandbox scenario lv (2 VARG and two Offensiv HÖK against air defence, a bunker and infantry behind the line) had the infantry fire
// on a VARG for a second or two on the way in, which latched holdDone in grpHold, and the HÖK flew at the air defence alone: HÖK
// losses 0.28 before issue 104's group attack (5b4df80, not 106's camouflaged points as first thought) and 0.74 after. hokHold lets
// go only while the fight lasts; grpHold now does the same, and only the target firing on the HÖK releases it for good.
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
B.SHAPE_CFG.force='rund';B.SHAPE_CFG.rough=0;/* the sandbox's round island */
B.newGame(7341);const W=B.W,c=W.grid,land=(x,y)=>{const v=c[Math.floor(y/10)*220+Math.floor(x/10)];return v>=2&&B.elevAt(x,y,W.seed,W.V)>1.5;};
function arena(){for(let r=0;r<=700;r+=30)for(let b=0;b<6.28;b+=.3){const D={x:1100+Math.cos(b)*r,y:1100+Math.sin(b)*r};
  const a=Math.atan2(D.y-B.CARRIER.y,D.x-B.CARRIER.x),f={x:Math.cos(a),y:Math.sin(a)},n={x:-f.y,y:f.x};let k=true;
  for(let s=-460;s<=140&&k;s+=20)for(let l=-130;l<=130&&k;l+=26)if(!land(D.x+f.x*s+n.x*l,D.y+f.y*s+n.y*l))k=false;if(k)return{D,f,n};}
  console.log('FAIL no open ground');process.exit(1);}
function run(rep){Math.random=(s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;})(1000+rep*7919);
  B.newGame(7341);const G=B.G;G.running=true;G.netAll=true;G.mines=[];
  for(const b of G.barriers)if(!b.cleared){b.cleared=true;for(const q of b.cells)W.grid[q]=W.baseGrid[q];}
  const{D,f,n}=arena();for(let s=-480;s<=160;s+=5)for(let l=-150;l<=150;l+=5){const i=Math.floor((D.y+f.y*s+n.y*l)/10)*220+Math.floor((D.x+f.x*s+n.x*l)/10);if(W.grid[i]>=4)W.grid[i]=W.baseGrid[i]=3;}
  G.reachAll=null;B.computeLock();const at=(fw,la)=>({x:D.x+f.x*fw+n.x*la,y:D.y+f.y*fw+n.y*la});
  G.enemies=[['aa',30,0],['turret',0,40],['inf',-20,-40]].map(([kind,fw,la],i)=>{const p=at(fw,la),e=B.makeEnemy({id:'X'+(i+1),kind,x:p.x,y:p.y});e.aim=Math.atan2(-f.y,-f.x)+(Math.random()-.5)*.6;e.seen=true;return e;});
  G.known.fill(1);G.knownV++;G.units=[];const own=[];
  for(let i=0;i<2;i++){const p=at(-420,(i-.5)*26),u=B.makeUnit('tank',p.x,p.y);u.heading=u.turret=Math.atan2(f.y,f.x);G.units.push(u);own.push(u);}
  for(let i=0;i<2;i++){const p=at(-450,(i-.5)*30),u=B.makeUnit('drone',p.x,p.y);u.post='off';u.heading=Math.atan2(f.y,f.x);G.units.push(u);own.push(u);}
  G.wings={'1':own.map(u=>u.id)};G.selIds=own.map(u=>u.id);G.sel=own[0].id;
  [0,1,2].forEach((k,j)=>B.groupOrder({enemy:G.enemies[k]},j>0));return{G,own};}
let lost=0;const N=12;
for(let r=0;r<N;r++){const{G,own}=run(r);const hs=own.filter(u=>u.kind==='drone');
  for(let t=0;t<300;t+=.05){B.step(.05);if(G.enemies.every(e=>e.dead))break;}
  lost+=hs.filter(h=>h.dead).length;}
ok(lost/N<.3,'HÖK lost per round in lv: '+(lost/N).toFixed(2)+' (0.74 with the latch)');
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
