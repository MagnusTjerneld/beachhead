// Ground combat as a platoon would fight it (Magnus 21 okt): on ö 9949 the beach bunkers T9, T10 and T8 cover each other in a line.
// Two VARG coming in from the sea at T8 roll the line up from the flank, T9 first; at T10 from the west they find a firing position
// on a way of no more than five times the distance as the crow flies (it was a staging point behind a steep shore and 3 km round the
// island); and a move order alone over a long way of mostly unscouted land is refused with the GETING button, and one round the
// island past a standing barrier with the BÄVER button
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const setup=()=>{B.START.units=['eng'];B.newGame(9949);const G=B.G;G.running=true;G.netAll=true;G.known.fill(1);G.knownV++;for(const e of G.enemies)e.seen=true;G.units.length=0;return G;};
const wing=(G,e,deg,d)=>{const L=B.W.landing,a0=Math.atan2(L.y-e.ly,L.x-e.lx)+deg*Math.PI/180,f={x:Math.cos(a0),y:Math.sin(a0)},s={x:e.lx+f.x*d,y:e.ly+f.y*d};
  const us=[0,1].map(i=>{const u=B.makeUnit('tank',s.x-f.y*(i-.5)*22,s.y+f.x*(i-.5)*22);u.heading=u.turret=a0+Math.PI;G.units.push(u);return u;});
  G.wings={'1':us.map(u=>u.id)};G.selIds=us.map(u=>u.id);G.sel=us[0].id;return us;};
const len=(u,p)=>{let n=0,q=u;for(const r of p||[]){n+=Math.hypot(r.x-q.x,r.y-q.y);q=r;}return n;};
// 1. the line is rolled up from the flank
{const G=setup(),T8=G.enemies.find(e=>e.id==='T8'),us=wing(G,T8,0,320);B.groupOrder({enemy:T8});
  const said=G.log.map(l=>l.text).find(t=>/täcker/.test(t))||'';ok(/från flanken|först/.test(said),'the wing says the guns cover each other and how it takes them ('+said+')');
  const first=us[0].orders[0]&&us[0].orders[0].enemy;ok(first&&first!==T8,'and goes for '+(first?first.id:'nothing')+' before T8');
  ok(us[0].orders.some(o=>o.enemy===T8),'with T8 still in its orders');}
// 2. no way round the island to a firing position
{const G=setup(),T10=G.enemies.find(e=>e.id==='T10'),us=wing(G,T10,-50,320);B.groupOrder({enemy:T10,force:true});
  let p=null;for(let i=0;i<60&&!p;i++){B.step(.05);if(us[0].path&&us[0].path.length&&us[0].orders[0]&&us[0].orders[0].type==='attack')p=us[0].path.slice();}
  const end=p&&p[p.length-1],cr=end?Math.hypot(end.x-us[0].x,end.y-us[0].y):0,n=len(us[0],p);
  ok(!p||n<=Math.max(B.FIRE.cap*cr,cr+B.FIRE.add)+20,'the way to the firing position or staging point is '+Math.round(n)+' m for '+Math.round(cr)+' m as the crow flies (3 km before)');}
// 3. alone over a long way of mostly unscouted land
{const G=setup();for(const e of G.enemies)e.dead=true;for(const b of G.barriers){b.cleared=true;for(const c of b.cells)B.W.grid[c]=B.W.baseGrid[c];}G.known.fill(0);G.knownV++;const L=B.W.landing,u=B.makeUnit('tank',L.x,L.y);G.units.push(u);G.wings={};G.selIds=[u.id];G.sel=u.id;
  let best=null;for(let k=0;k<200&&!best;k++){const x=200+((k*137)%1800),y=200+((k*251)%1800);if(B.W.grid[B.cellIdx(x,y)]<2)continue;const p=B.astar(u.x,u.y,x,y,i=>B.W.grid[i]!==4&&B.W.grid[i]!==5,()=>1);if(p&&len(u,p)>2.5*Math.hypot(x-u.x,y-u.y)&&len(u,p)<4.5*Math.hypot(x-u.x,y-u.y)&&Math.hypot(x-u.x,y-u.y)>200)best={x,y};}
  if(best){B.groupOrder({world:best});for(let i=0;i<20;i++)B.step(.05);const m=G.log.find(l=>/ospanad mark/.test(l.text));if(!m)console.log(G.log.slice(0,4).map(l=>l.text).join(' | '),JSON.stringify(best));
    ok(!!m,'a move alone over a long way of unscouted land is refused ('+(m?m.text:u.state)+')');ok(m&&m.acts&&m.acts.some(a=>/GETING/.test(a.l)),'with a button to send a GETING');}
  else ok(true,'(no long way on this island)');}
// 4. round the island because a barrier stands: refused even when the captain orders it, with the button to send BÄVER
{const G=setup();for(const e of G.enemies)e.dead=true;G.known.fill(0);G.knownV++;const L=B.W.landing,u=B.makeUnit('tank',L.x,L.y);G.units.push(u);G.wings={};G.selIds=[u.id];G.sel=u.id;
  B.groupOrder({world:{x:748,y:1204}});for(let i=0;i<20;i++)B.step(.05);const m=G.log.find(l=>/står i vägen/.test(l.text));
  ok(!!m&&!u.orders.length,'a move round the island past a standing barrier is refused ('+(m?m.text:u.state)+')');ok(m&&m.acts&&m.acts.some(a=>/BÄVER/.test(a.l)),'with a button to send BÄVER');}
console.log(fail?'FAILED '+fail:'all passed');if(fail)process.exit(1);
