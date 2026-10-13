// harbour and docking: the planned path is open water, the harbour is point H with its own guards and is taken by BÄVER like the others,
// Birka sails in at about 10 knots with acceleration and braking, docks aligned, and carries the deck BÄVER and the KROK pad along
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const GW=220,DEEP=0,SHAL=1;
const loc=p=>{const C=B.CARRIER,f={x:Math.cos(C.a),y:Math.sin(C.a)},dx=p.x-C.x,dy=p.y-C.y;return{lat:-dx*f.y+dy*f.x,fwd:dx*f.x+dy*f.y};};
for(const[f,seed]of[['as',1000],['hastsko',1037],['udde',1111]]){
  B.SHAPE_CFG.force=f;B.SHAPE_CFG.rough=1;B.newGame(seed);const G=B.G,W=B.W;G.running=true;
  ok(!!(G.harbor&&W.birkaPath&&W.harborQ),f+': harbour, quay and Birka path exist');if(!G.harbor)continue;
  const P=W.birkaPath,g=W.baseGrid;let wet=true;
  for(let s=0;s<P.L;s+=10){let i=0;while(i<P.pts.length-2&&P.len[i+1]<s)i++;const a=P.pts[i],b=P.pts[i+1],t=(s-P.len[i])/((P.len[i+1]-P.len[i])||1),x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,c=g[Math.floor(y/10)*GW+Math.floor(x/10)];if(c!==DEEP&&c!==SHAL)wet=false;}
  ok(wet,f+': the path ('+Math.round(P.L)+' m) runs in water all the way');
  const shoal=((W.decor&&W.decor.shoals)||[]).find(s=>W.nearPath(s.x,s.y,0));ok(!shoal,f+': no shoal on the path');
  const c0={...B.CARRIER},q=W.harborQ,eng=G.units.find(u=>u.kind==='eng'),k=G.kroks[0],e0=loc(eng),p0=loc(k.pad);
  // the harbour is a point of its own: it has guards, and a BÄVER at the quay cannot take it while they stand
  const hr=G.relays.find(r=>r.type==='hamn');ok(!!hr&&hr.id==='H'&&Math.hypot(hr.x-q.x,hr.y-q.y)<1,f+': the harbour is point H at the quay');
  ok(hr&&hr.guards.length>0,f+': the harbour has guards ('+(hr?hr.guards.join(', '):'')+')');
  const v=B.makeUnit('eng',q.x+6,q.y);G.units.push(v);v.orders=[{type:'capture',relay:hr,post:'def'}];
  for(let i=0;i<20;i++)B.step(.05);ok(!hr.captured&&!G.harbor.secured,f+': not taken while its guards stand'+(hr.lockMsg?' (locked)':' (BÄVER waits under fire)'));
  for(const e of G.enemies)if(hr.guards.includes(e.id)||Math.hypot(e.x-q.x,e.y-q.y)<300)e.dead=true;
  {const v2=B.makeUnit('eng',q.x+6,q.y);G.units.push(v2);v2.orders=[{type:'capture',relay:hr,post:'def'}];}/* the first one is usually shot by the guards */
  let t=0,sec=null,vmax=0,dvmax=0,lastV=0;
  for(let i=0;i<20*900&&!G.harbor.docked;i++){B.step(.05);t+=.05;if(G.harbor.secured&&sec==null)sec=t;const hv=G.harbor.v;vmax=Math.max(vmax,hv);dvmax=Math.max(dvmax,(hv-lastV)/.05);lastV=hv;}
  ok(hr.captured&&sec!=null&&sec<12,f+': BÄVER takes the harbour in '+(sec||0).toFixed(1)+' s once the guards are out, and that secures it');
  ok(G.harbor.docked,f+': Birka docked after '+(t-(sec||0)).toFixed(0)+' s');
  ok(vmax>4.5&&vmax<=5.15,f+': top speed '+(vmax/0.5144).toFixed(1)+' knots');
  ok(dvmax<=B.BIRKA_MOVE.acc+1e-6,f+': acceleration capped ('+dvmax.toFixed(3)+' m/s2)');
  const d=W.harbor.dock;ok(Math.hypot(B.CARRIER.x-d.x,B.CARRIER.y-d.y)<.01&&Math.abs(B.CARRIER.a-d.a)<.01,f+': moored on the dock point and heading');
  ok(Math.hypot(B.CARRIER.x-c0.x,B.CARRIER.y-c0.y)>300,f+': Birka moved '+Math.round(Math.hypot(B.CARRIER.x-c0.x,B.CARRIER.y-c0.y))+' m');
  const e1=loc(eng),p1=loc(k.pad);
  ok(eng.carried||Math.abs(e1.lat-e0.lat)+Math.abs(e1.fwd-e0.fwd)<1.5,f+': the deck BÄVER rides along ('+e1.lat.toFixed(1)+', '+e1.fwd.toFixed(1)+')');
  ok(Math.abs(p1.lat-p0.lat)+Math.abs(p1.fwd-p0.fwd)<.01,f+': the KROK pad rides along');
  ok(k.cargo||k.orders.length||Math.hypot(k.x-k.pad.x,k.y-k.pad.y)<3,f+': an idle KROK sits on its pad');
  // a new game puts Birka back at sea
  B.newGame(seed);ok(Math.hypot(B.CARRIER.x-c0.x,B.CARRIER.y-c0.y)<.01&&!B.G.harbor.secured,f+': a new game resets Birka and the harbour');
}
console.log(fail?'FAILED '+fail:'all passed');if(fail)process.exit(1);
