// the island's layout (19 okt, issues 57, 52, 45): R1 (workshop or field yard) stands forward on the route to R3 and away from the
// harbour; the point R1 stands in the station's yard; a radio mast becomes a relay that widens the net (20 okt: as soon as BÄVER gets to
// it, its whole zone and 250 m round it; with the radar station taken the masts are torn down like any building)
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
// 1. R1 and the harbour, over a run of islands
{let bad=0,inYard=0,yards=0,n=0;const ex=[];
  for(let s=3000;s<3030;s++){B.newGame(s);const W=B.W,z=W.zones,V=W.V;n++;if(z.r1z===z.hz||(V.r1Harb!=null&&V.r1Harb<300)){bad++;ex.push(s);}
    if(W.yard){yards++;const r=W.relays[0];if(Math.hypot(r.x-W.yard.x,r.y-W.yard.y)<1)inYard++;}}
  ok(!bad,'R1 is never in the harbour\'s zone nor under 300 m from it along the passes ('+bad+' of '+n+(ex.length?': '+ex.join(','):'')+')');
  ok(yards>0&&inYard===yards,'the point R1 stands in the station\'s yard ('+inYard+' of '+yards+' islands with a yard)');}
// 2. island 9949: the workshop in F4 on the way to LC, not at the west end
{B.newGame(9949);const r=B.W.relays[0];ok(r.x>1000&&r.x<1300&&r.y>600&&r.y<900,'on 9949 the workshop stands in F4 on the way to LC ('+Math.round(r.x)+','+Math.round(r.y)+')');}
// 3. BÄVER couples a radio mast in even with enemies left in its zone, the net covers the zone, and the reach stays when the mast is torn down
{B.newGame(7341);const G=B.G,W=B.W;G.running=true;for(let i=0;i<20;i++)B.step(.05);
  const ms=G.structs.filter(s=>s.kind==='mast'&&B.inNet(s.x,s.y));let m=null,P=null;
  for(const s of ms){for(let k=0;k<16&&!P;k++){const a=k/16*Math.PI*2,q={x:s.x+Math.cos(a)*200,y:s.y+Math.sin(a)*200};if(q.x>0&&q.y>0&&q.x<2200&&q.y<2200&&!B.inNet(q.x,q.y))P=q;}if(P){m=s;break;}}
  ok(!!m,'(a mast in the net with ground beyond the net within 200 m'+(m?' at '+Math.round(m.x)+','+Math.round(m.y):'')+')');
  if(m){const z=W.zid[B.cellIdx(m.x,m.y)];
    const v=B.makeUnit('tank',m.x+20,m.y);G.units.push(v);for(let i=0;i<30;i++)B.step(.05);
    ok(!m.relay,'a VARG beside it does not couple it in');
    const u=B.makeUnit('eng',m.x+15,m.y);G.units.push(u);
    const foes=G.enemies.filter(e=>!e.dead&&W.zid[B.cellIdx(e.x,e.y)]===z).length;
    let far=null,fd=0;for(let i=0;i<W.zid.length;i++)if(W.zid[i]===z){const c={x:(i%220)*10+5,y:Math.floor(i/220)*10+5},d=Math.hypot(c.x-m.x,c.y-m.y);if(d>fd){fd=d;far=c;}}
    const farIn0=B.inNet(far.x,far.y);
    B.giveOrder(u,{type:'mast',s:m,post:'def'},false);let t=0;for(;t<40&&!m.relay;t+=.05)B.step(.05);
    ok(m.relay&&B.inNet(P.x,P.y),'with '+foes+' enemies left in its zone BÄVER couples it in ('+t.toFixed(1)+' s) and the net reaches 200 m beyond it');
    ok(B.inNet(far.x,far.y),'the whole zone is in the net, its far corner '+Math.round(fd)+' m from the mast too (before: '+(farIn0?'in':'out')+')');
    B.killStruct(m,u,'demolish');ok(B.inNet(P.x,P.y),'torn down later, the reach stays');}}
// 4. with the radar station taken the masts are of no more use: a click with BÄVER tears one down
{B.newGame(7341);const G=B.G;G.running=true;const m=G.structs.find(s=>s.kind==='mast'&&!s.dead);ok(B.mastFree(m),'before R2 a mast can be coupled in');
  G.netAll=true;ok(!B.mastFree(m),'with R2 taken it cannot, and BÄVER tears it down like any building');}
console.log(fail?fail+' FAILED':'all passed');process.exit(fail?1:0);
