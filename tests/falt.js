// Field test (16 okt): wings on real islands, ordered through the same function as a click on the chart (groupOrder), with the enemy
// known as after scouting. Six missions on each island: two VARG at the nearest air defence, three VARG and an offensive HÖK at the
// nearest bunker, two VARG to the far relay, VARG and BÄVER to the same point, a GETING out 350 m inland and back, and
// two VARG from the sea at each of two bunkers in the open within 90 m of each other, counting the hits from the side, from the bunker
// it is not fighting at the moment, until both are out (korseld,
// prov 20 okt, ö 9949). For each unit it
// measures the first planned route (length and share over water), the distance driven while advancing (Anfaller, Samlas, Söker, På väg;
// retreats and service trips are not counted), time in the water, the longest time standing still with an order, how close an aircraft
// came to air defence it was not attacking, and time with no way through. It flags what looks wrong; a flag is a lead, not a failure.
// Builds g2.js first, like run.js.
//   node tests/falt.js                        six islands, all missions, 200 s each (about half a minute)
//   node tests/falt.js 5555,9052 120          chosen islands and a shorter time
//   node tests/falt.js all 200 lv,sparv       only some missions: lv, bunker, punkt, baver, sparv, korseld
global.performance={now:()=>0};
require('child_process').execFileSync('python3',[require('path').join(__dirname,'mk.py')]);
require('./g2.js');const B=globalThis.__BH;
const out=s=>process.stdout.write(s+'\n');
const arg=process.argv.slice(2);
const SEEDS=(!arg[0]||arg[0]==='all'?'1234,2024,4711,5555,8080,9052':arg[0]).split(',').map(Number);
const MAXT=+(arg[1]||200),ONLY=arg[2]?new Set(arg[2].split(',')):null,want=k=>!ONLY||ONLY.has(k);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const wet=(x,y)=>{const W=B.W,c=W.grid[Math.min(219,Math.max(0,Math.floor(y/10)))*220+Math.min(219,Math.max(0,Math.floor(x/10)))];return c<2;};
const flags=[],rows=[];
function setup(seed){B.START.units=['eng'];B.newGame(seed);const G=B.G;G.running=true;G.known.fill(1);G.knownV++;for(const e of G.enemies)e.seen=true;G.units.length=0;return G;}
// the units stand 40 m in from the landing beach, side by side, facing the middle of the island
function place(G,kinds){const L=B.W.landing,c={x:1100,y:1100},d=dist(L,c)||1,f={x:(c.x-L.x)/d,y:(c.y-L.y)/d},n={x:-f.y,y:f.x};const us=[];
  kinds.forEach((k,i)=>{const s=40+(k==='drone'?-20:0),l=(i-(kinds.length-1)/2)*22,p={x:L.x+f.x*s+n.x*l,y:L.y+f.y*s+n.y*l},u=B.makeUnit(k,p.x,p.y);
    u.heading=u.turret=Math.atan2(f.y,f.x);if(k==='drone'){u.post=u.post||'off';u.alt=30;}G.units.push(u);us.push(u);});
  return us;}
function select(G,us,wing){if(wing)G.wings={'1':us.map(u=>u.id)};G.selIds=us.map(u=>u.id);G.sel=us[0].id;}
// run until done() (after 5 s at least), all units have been without orders for 10 s, or MAXT; straight = the shortest the trip could be
function run(G,name,seed,us,straight,done,extra){
  const tr=us.map(u=>({u,len:0,last:{x:u.x,y:u.y},wet:0,still:0,stillMax:0,minAA:1e9,states:new Map(),plan:null,planWet:0,atk:0,atkWet:0}));
  let t=0,idle=0;for(;t<MAXT;t+=.05){B.step(.05);if(extra)extra(t);
    for(const r of tr){const u=r.u;if(u.dead)continue;const m=dist(u,r.last);r.len+=m;r.last={x:u.x,y:u.y};
      if(!u.air&&wet(u.x,u.y))r.wet+=.05;
      if(r.plan==null&&u.path&&u.path.length){let L=0,q={x:u.x,y:u.y};for(const p of u.path){L+=dist(q,p);q=p;}r.plan=Math.round(L);r.planWet=Math.round(u.path.filter(p=>wet(p.x,p.y)).length*100/u.path.length);}
      if(/^(Anfaller|Samlas|Söker|På väg)/.test(u.state||'')){r.atk+=m;if(!u.air&&wet(u.x,u.y))r.atkWet+=.05;}
      const busy=u.orders.length&&!/I position|Skjuter|Bekämpar|Anfaller|Väntar|Cirklar/.test(u.state||'');if(busy&&m<.02){r.still+=.05;r.stillMax=Math.max(r.stillMax,r.still);}else r.still=0;
      if(u.air)for(const e of G.enemies)if(!e.dead&&e.kind==='aa'&&!(u.orders[0]&&u.orders[0].enemy===e))r.minAA=Math.min(r.minAA,Math.hypot(u.x-e.lx,u.y-e.ly));
      const s=(u.state||'').replace(/\d+/g,'#');r.states.set(s,(r.states.get(s)||0)+.05);}
    if(us.every(u=>u.dead||!u.orders.length))idle+=.05;else idle=0;if(done(t)&&t>5||idle>10)break;}
  for(const r of tr){const u=r.u,ratio=straight>20?r.atk/straight:0,nw=r.states.get('Ingen framkomlig väg')||0;
    const top=[...r.states].sort((a,b)=>b[1]-a[1]).slice(0,2).map(([s,v])=>s.slice(0,40)+' '+Math.round(v)+' s').join(' / ');
    const f=[];if(r.plan!=null&&straight>20&&r.plan>Math.max(straight*2,straight+300))f.push('planerad omväg '+r.plan+' m mot '+Math.round(straight)+' m ('+r.planWet+' % vatten)');
    if(ratio>2.5&&r.atk>400)f.push('kör x'+ratio.toFixed(1)+' i framryckning');if(r.stillMax>20)f.push('står still '+Math.round(r.stillMax)+' s med order');
    if(r.atkWet>30&&r.planWet<50)f.push('i vatten '+Math.round(r.atkWet)+' s i framryckning');
    if(u.air&&u.kind!=='drone'&&r.minAA<125)f.push('nära luftvärn '+Math.round(r.minAA)+' m');if(nw>20)f.push('ingen väg '+Math.round(nw)+' s');
    rows.push([seed,name,u.kind,'plan '+(r.plan==null?'-':r.plan+' m ('+r.planWet+' % vatten)'),'fram '+Math.round(r.atk)+' m','totalt '+Math.round(r.len)+' m','fågelväg '+Math.round(straight)+' m',u.dead?'död':'',Math.round(t)+' s',top].join(' | '));
    if(f.length)flags.push(seed+' '+name+' '+u.kind+' '+u.id+': '+f.join(', ')+'  ['+top+']');}}
/* a target behind an unblown barrier: "ingen väg" is then the game saying so, not a fault (19 okt, issue 63) */
/* the way there can run through a barrier also when the target is not in a locked zone: the route then goes round it, often by sea
   (ö 1234, 19 okt: 2.5 km against 0.9 km with the barriers blown). The route from the landing with and without unblown barriers */
const viaBarrier=t=>{const L=B.W.landing,c={x:1100,y:1100},d=dist(L,c)||1,a={x:L.x+(c.x-L.x)/d*40,y:L.y+(c.y-L.y)/d*40},tx=t.lx??t.x,ty=t.ly??t.y;
  const g=B.W.grid,pass=i=>g[i]!==4&&g[i]!==5,len=p=>{if(!p)return null;let n=0,q=a;for(const r of p){n+=dist(q,r);q=r;}return n;};
  const with_=len(B.astar(a.x,a.y,tx,ty,pass,()=>1)),kept=[];for(const b of B.G.barriers)if(!b.cleared)for(const i of b.cells){kept.push([i,g[i]]);g[i]=B.W.baseGrid[i];}
  const without=len(B.astar(a.x,a.y,tx,ty,pass,()=>1));for(const[i,v]of kept)g[i]=v;return without!=null&&(with_==null||with_>Math.max(without*1.5,without+300));};
const bak=t=>B.lockedAt(t.lx??t.x,t.ly??t.y)?' (målet bakom spärr)':viaBarrier(t)?' (vägen går genom spärr)':'';
const TANK='tank',HOK='drone',SP='scout',BV='eng';
for(const seed of SEEDS){let G=setup(seed);const L=B.W.landing,start=()=>{const c={x:1100,y:1100},d=dist(L,c)||1;return{x:L.x+(c.x-L.x)/d*40,y:L.y+(c.y-L.y)/d*40};};
  const near=k=>G.enemies.filter(e=>!e.dead&&e.kind===k).sort((a,b)=>dist(a,L)-dist(b,L))[0];
  const lc=G.relays.slice().sort((a,b)=>dist(b,L)-dist(a,L))[0],tp={x:lc.x+15,y:lc.y+15};
  if(want('lv')){const aa=near('aa');if(aa){const us=place(G,[TANK,TANK]);select(G,us,true);B.groupOrder({enemy:aa});run(G,'2 VARG mot luftvärn'+bak(aa),seed,us,Math.max(0,dist(start(),{x:aa.lx,y:aa.ly})-120),()=>aa.dead);}}
  if(want('bunker')){G=setup(seed);const tb=near('turret');if(tb){const us=place(G,[TANK,TANK,TANK,HOK]);select(G,us,true);B.groupOrder({enemy:tb});run(G,'3 VARG och HÖK mot bunker'+bak(tb),seed,us,Math.max(0,dist(start(),{x:tb.lx,y:tb.ly})-120),()=>tb.dead);}}
  if(want('punkt')){G=setup(seed);const us=place(G,[TANK,TANK]);select(G,us,true);B.groupOrder({world:tp});run(G,'2 VARG till punkt'+bak(tp),seed,us,dist(start(),tp),()=>us.every(u=>u.dead||dist(u,tp)<40));}
  if(want('baver')){G=setup(seed);const us=place(G,[TANK,BV]);select(G,us,true);B.groupOrder({world:tp});run(G,'VARG och BÄVER till punkt'+bak(tp),seed,us,dist(start(),tp),()=>us.every(u=>u.dead||dist(u,tp)<40));}
  /* crossfire (prov 20 okt, ö 9949 kp01: VARG-1 stood where T8 reached while it fought T10, 61 m off): two VARG come in from the sea
     at the bunker nearest the landing that has another bunker within 90 m, and the other is left alone. It counts the hits from the
     other bunker and the time in its reach before the target fell */
  if(want('korseld')){const T=setup(seed).enemies.filter(e=>!e.dead&&e.kind==='turret').sort((a,b)=>dist({x:a.lx,y:a.ly},L)-dist({x:b.lx,y:b.ly},L));
    /* a pair in the open: behind a barrier the barrier decides the way, which the other missions already see */
    const open=e=>!B.lockedAt(e.lx,e.ly)&&!viaBarrier(e);let pA=null,pB=null;for(const a of T.filter(open)){const b=T.find(o=>o!==a&&open(o)&&Math.hypot(o.lx-a.lx,o.ly-a.ly)<90);if(b){pA=a.id;pB=b.id;break;}}
    /* each of the two as the target, coming in from the sea on the landing's side and 50 degrees either way of it */
    if(pA)for(const[ia,ib]of[[pA,pB],[pB,pA]])for(const da of[0,-50,50]){G=setup(seed);const tA=G.enemies.find(e=>e.id===ia),tB=G.enemies.find(e=>e.id===ib);
      const a0=Math.atan2(L.y-tA.ly,L.x-tA.lx)+da*Math.PI/180,f={x:Math.cos(a0),y:Math.sin(a0)},s0={x:tA.lx+f.x*320,y:tA.ly+f.y*320};if(!wet(s0.x,s0.y))continue;
      const us=[TANK,TANK].map((k,i)=>{const u=B.makeUnit(k,s0.x-f.y*(i-.5)*22,s0.y+f.x*(i-.5)*22);u.heading=u.turret=Math.atan2(-f.y,-f.x);G.units.push(u);return u;});
      const log0=G.log.length;select(G,us,true);B.groupOrder({enemy:tA});const hits=us.map(()=>0),last=us.map(u=>Object.assign({},u.hitBy)),nm='2 VARG mot '+tA.id+' från '+(da>0?'+':'')+da+' grader, '+tB.id+' '+Math.round(Math.hypot(tB.lx-tA.lx,tB.ly-tA.ly))+' m bort'+bak(tA);
      /* a hit from anything but the unit's own target of the moment is a hit from the side: the crossfire the wing should keep out of */
      let both=null;run(G,nm,seed,us,200,t=>tA.dead&&tB.dead,t=>{if(both==null&&tA.dead&&tB.dead)both=t;
        us.forEach((u,i)=>{if(u.dead)return;const q=u.orders[0],own=q&&q.type==='attack'?q.enemy.id:null;for(const id in u.hitBy){if(u.hitBy[id]!==last[i][id]){if(id!==own&&(id===tA.id||id===tB.id))hits[i]++;last[i][id]=u.hitBy[id];}}});});
      const said=G.log.slice(log0).map(l=>l.text).filter(t=>/täcker|eldställning/.test(t)).slice(0,1);
      us.forEach((u,i)=>{const r=seed+' '+nm+' '+u.id+': '+hits[i]+' träffar från sidan, skrov '+Math.round(u.hp/u.maxhp*100)+' %, '+(both!=null?'båda ute efter '+Math.round(both)+' s':'inte båda ute')+(i===0&&said.length?'  ['+said[0]+']':'');rows.push(r);
        if(hits[i])flags.push(r);});}}
  if(want('sparv')){G=setup(seed);const c={x:1100,y:1100},d=dist(L,c)||1,sp0={x:L.x+(c.x-L.x)/d*350,y:L.y+(c.y-L.y)/d*350};const us=place(G,[SP,TANK]),sp=us[0];select(G,[sp],false);B.groupOrder({world:sp0});let back=false,bt=0;
    run(G,'GETING ut och hem',seed,[sp],2*dist(start(),sp0),t=>back&&(sp.dead||dist(sp,L)<40||!sp.orders.length)&&t-bt>5,t=>{if(!back&&(dist(sp,sp0)<30||t>60)){back=true;bt=t;select(G,[sp],false);B.groupOrder({world:{x:L.x,y:L.y}});}});}
}
out('ö | uppdrag | enhet | första planerade väg | körd i framryckning | körd totalt | fågelväg | | tid | vanligaste lägen');for(const r of rows)out(r);
out('\nFLAGGOR ('+flags.length+'):');for(const f of flags)out(f);
