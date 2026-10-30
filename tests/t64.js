// harbour and docking: the planned path is open water, the harbour is point H with its own guards and is taken by BÄVER like the others,
// Birka sails in at about 10 knots with acceleration and braking, docks aligned, and carries the deck BÄVER, KROK's spot and an idle KROK along
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
  for(const e of G.enemies)e.dead=true;/* the way in now runs along the coast to the quay: this test is about the docking, not the fight on the way */
  {const v2=B.makeUnit('eng',q.x+6,q.y);G.units.push(v2);v2.orders=[{type:'capture',relay:hr,post:'def'}];}/* the first one is usually shot by the guards */
  let t=0,sec=null,vmax=0,dvmax=0,lastV=0;
  let ord=null;/* issue 93: the taken harbour waits for the captain's order, it never sends her by itself */
  for(let i=0;i<20*900&&!G.harbor.docked;i++){B.step(.05);t+=.05;if(G.harbor.secured&&sec==null)sec=t;if(sec!=null&&ord==null&&t>sec+30){const moved=Math.hypot(B.CARRIER.x-c0.x,B.CARRIER.y-c0.y);ok(G.harbor.wait&&!G.harbor.ph&&moved<.01,f+': 30 s after the harbour was taken she still lies at the anchorage and waits ('+moved.toFixed(1)+' m)');ok(!!B.harborItem({relay:hr})&&B.harborGo(),f+': the harbour\'s menu offers the order and it starts her');ord=t;}const hv=G.harbor.v;vmax=Math.max(vmax,hv);dvmax=Math.max(dvmax,(hv-lastV)/.05);lastV=hv;}
  ok(hr.captured&&sec!=null&&sec<12,f+': BÄVER takes the harbour in '+(sec||0).toFixed(1)+' s once the guards are out, and that secures it');
  ok(G.harbor.docked&&ord!=null,f+': Birka docked after '+(t-(ord||0)).toFixed(0)+' s from the order');ok(!B.harborItem({relay:hr}),f+': no order is offered once she lies in the harbour');
  ok(vmax>B.BIRKA_MOVE.vmax*.88&&vmax<=B.BIRKA_MOVE.vmax*1.01,f+': top speed '+(vmax/0.5144).toFixed(1)+' knots');
  ok(dvmax<=B.BIRKA_MOVE.acc+1e-6,f+': acceleration capped ('+dvmax.toFixed(3)+' m/s2)');
  const d=W.harbor.dock;ok(Math.hypot(B.CARRIER.x-d.x,B.CARRIER.y-d.y)<.01&&Math.abs(B.CARRIER.a-d.a)<.01,f+': moored on the dock point and heading');
  ok(Math.hypot(B.CARRIER.x-c0.x,B.CARRIER.y-c0.y)>300,f+': Birka moved '+Math.round(Math.hypot(B.CARRIER.x-c0.x,B.CARRIER.y-c0.y))+' m');
  const e1=loc(eng),p1=loc(k.pad);
  ok(eng.carried||Math.abs(e1.lat-e0.lat)+Math.abs(e1.fwd-e0.fwd)<1.5||Math.abs(e1.lat)<16&&Math.abs(e1.fwd)<45,f+': the deck BÄVER rides along, where it stood or on a service pad ('+e1.lat.toFixed(1)+', '+e1.fwd.toFixed(1)+')');
  ok(Math.abs(p1.lat-p0.lat)+Math.abs(p1.fwd-p0.fwd)<.01,f+': the KROK pad rides along');
  {const kc=Math.hypot(k.x-B.CARRIER.x,k.y-B.CARRIER.y);ok(k.cargo||k.orders.length||kc<70,f+': an idle KROK circles over Birka ('+kc.toFixed(0)+' m from its centre)');}
  // a new game puts Birka back at sea
  B.newGame(seed);ok(Math.hypot(B.CARRIER.x-c0.x,B.CARRIER.y-c0.y)<.01&&!B.G.harbor.secured,f+': a new game resets Birka and the harbour');
}
// Birka's way in over many islands: the hull line keeps 20 m of water to the harbour mouth, and never crosses the real coastline
// (elevation, not the 10 m grid) outside the basin; a straightened leg once ran over a holm and a rounded corner over a headland
{let n=0,clear=0,dry=0;for(const f of['as','hastsko','nas','udde','rund'])for(let sd=3000;sd<3002;sd++){B.SHAPE_CFG.force=f;B.SHAPE_CFG.rough=1;B.newGame(sd);const W=B.W,P=W.birkaPath,H=W.harbor;if(!P)continue;n++;if(B.birkaClear(W))clear++;
  let land=0;for(let s=0;s<P.L;s+=2){let i=0;while(i<P.pts.length-2&&P.len[i+1]<s)i++;const a=P.pts[i],b=P.pts[i+1],t=(s-P.len[i])/((P.len[i+1]-P.len[i])||1),x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,dx=x-H.x,dy=y-H.y,li=-(dx*H.nx+dy*H.ny),lt=Math.abs(-dx*H.ny+dy*H.nx);if(li>-20&&lt<32)continue;if(B.elevAt(x,y,W.seed,W.V)>0)land++;}if(!land)dry++;}
  ok(n>=8&&clear===n,'Birka keeps 20 m clear of land on '+clear+'/'+n+' islands');ok(dry===n,'Birka never crosses the coastline: '+dry+'/'+n+' islands');}
console.log(fail?'FAILED '+fail:'all passed');if(fail)process.exit(1);
