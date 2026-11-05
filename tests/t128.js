// Provspel ö 6586 (issue 155, Magnus 5 nov): the radio masts stand until the radar station is taken; KROK's way in Offensiv is no longer than
// an order's way for VARG; the text for a pile near an air defence names it; KROK waiting with a vehicle that wanted secured land sets it down
// once the vehicle is put on Offensiv; GADDA pressed to Birka's side gets clear and round her without a new order.
global.performance={now:()=>0};
let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
require('./g2.js');const B=globalThis.__BH;
const fresh=seed=>{B.newGame(seed);const G=B.G;G.running=true;for(let i=0;i<20;i++)B.step(.05);return G;};
const last=G=>(G.log||[])[0]||{text:''};
/* ---- the masts ---- */
{const G=fresh(7341);G.netAll=false;const m=G.structs.find(s=>s.kind==='mast'&&!s.dead);ok(!!m,'the island has a radio mast ('+(m&&m.id)+')');
  const v=B.makeUnit('drone',m.x+60,m.y);G.units.push(v);B.giveOrder(v,{type:'raze',s:m,post:'off'},false);
  ok(!v.orders.length,'an order to shoot a mast is not taken before the radar station is taken');
  ok(/står kvar tills radarstationen är tagen/.test(last(G).text),'and the unit says why ('+last(G).text+')');
  const e=B.makeUnit('eng',m.x+20,m.y);G.units.push(e);B.giveOrder(e,{type:'demolish',s:m,post:'def'},false);ok(!e.orders.length,'nor an order to tear one down');
  m.hp=0;B.killStruct(m,v,'shot');ok(!m.dead&&m.hp>=1,'and a mast brought to 0 is not killed (hp '+m.hp+')');
  G.netAll=true;B.giveOrder(v,{type:'raze',s:m,post:'off'},false);ok(v.orders.length===1,'with the radar station taken the order is taken');
  B.killStruct(m,v,'shot');ok(m.dead,'and the mast can be shot down');}
/* ---- KROK's captain's way: no longer than FIRE.cap times the crow's way (or that plus FIRE.add) ---- */
{const G=fresh(7341),GW=B.GW,N=G.known.length,K=new Uint8Array(N).fill(1),dz=new Uint8Array(N),C=10;
  const a={x:800,y:1500},b={x:1300,y:1500},mx=1050,my=1500,R=330;for(let i=0;i<N;i++){const x=(i%GW)*C+5,y=Math.floor(i/GW)*C+5;if(Math.hypot(x-mx,y-my)<R)dz[i]=1;}
  const L=p=>{let n=0,q=a;for(const r of p){n+=Math.hypot(r.x-q.x,r.y-q.y);q=r;}return n;},cr=500,lim=Math.max(B.FIRE.cap*cr,cr+B.FIRE.add);
  const p=B.capPath(B.cellIdx(a.x,a.y),B.cellIdx(b.x,b.y),a,b,K,dz);ok(L(p)<=lim+1,'the way past a threat of '+R+' m on a crow\'s way of 500 m is within '+lim+' m ('+Math.round(L(p))+' m)');
  dz.fill(0);for(let i=0;i<N;i++){const x=(i%GW)*C+5,y=Math.floor(i/GW)*C+5;if(Math.hypot(x-mx,y-my)<120)dz[i]=1;}
  const q=B.capPath(B.cellIdx(a.x,a.y),B.cellIdx(b.x,b.y),a,b,K,dz),cut=q.some(r=>0)||(()=>{let pr=a;for(const r of q){const n=Math.ceil(Math.hypot(r.x-pr.x,r.y-pr.y)/5);for(let k=0;k<=n;k++){const x=pr.x+(r.x-pr.x)*k/n,y=pr.y+(r.y-pr.y)*k/n;if(Math.hypot(x-mx,y-my)<115)return true;}pr=r;}return false;})();
  ok(!cut&&L(q)<=lim,'a small threat that a short detour clears is still flown round ('+Math.round(L(q))+' m)');}
/* ---- the text for a pile near an air defence ---- */
{const G=fresh(7341),k=G.kroks[0],w=B.addWreck(k.x+400,k.y,50,false,'rubble'),e=B.makeEnemy({kind:'aa',id:'LX',x:w.x+217,y:w.y});e.seen=true;e.lx=e.x;e.ly=e.y;G.enemies.push(e);
  for(let i=0;i<G.known.length;i++)G.known[i]=1;
  const t=B.wreckWhy(k,w);ok(/räckhåll för luftvärn/.test(t),'a pile 217 m from an air defence is said to lie within its reach ('+t+')');}
/* ---- KROK waiting with a vehicle that is put on Offensiv ---- */
{const G=fresh(7341),k=G.kroks[0],u=G.units.find(v=>v.kind==='eng');u.post='def';k.cargo=u;u.carried=k.id;
  const ld=G.structs.find(q=>q.kind==='mast');k.waitDrop={x:ld.x+15,y:ld.y,cap:true,cg:u};k.orders=[];for(let i=0;i<10;i++)B.step(.05);ok(!k.orders.length,'on Defensiv the vehicle waits on the hook');
  u.post='off';B.step(.05);B.step(.05);ok(k.orders[0]&&k.orders[0].type==='drop'&&!k.waitDrop,'put on Offensiv, KROK takes it down to the point ('+(k.orders[0]&&k.orders[0].type)+')');
  ok(/står nu på Offensiv/.test((G.log||[]).map(m=>m.text).join('|')),'and says so');}
/* ---- GADDA pressed to Birka's side, its way on across her ---- */
{const G=fresh(7341),C=B.CARRIER,p=B.shipPos(19,30),g=B.makeUnit('gadda',p[0],p[1]);G.units.push(g);g.heading=C.a;g.v=0;
  const far=B.shipPos(-400,0);B.giveOrder(g,{type:'move',x:far[0],y:far[1],post:'off'},false);
  let still=0,worst=0,clear=-1;for(let i=0;i<20*25&&clear<0;i++){B.step(.05);if((g.v||0)<1){still+=.05;worst=Math.max(worst,still);}else still=0;const L=B.shipLocal(g.x,g.y);if(L.lat<-30)clear=i/20;}
  ok(clear>=0&&clear<20,'GADDA beside Birka gets round to her other side ('+(clear<0?'not in 25 s':clear.toFixed(1)+' s')+')');ok(worst<5,'without standing still more than 5 s ('+worst.toFixed(1)+' s)');}
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
