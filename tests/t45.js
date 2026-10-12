global.performance={now:()=>0};
require('./g2.js');
const B=globalThis.__BH;
const V=process.argv[2]||'base';
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

/* reachability without A*: the bot asked A* once per defender every tick, and for unreachable targets A* floods the whole map.
   Connected components of the ground (4-connected, which is what A* without corner cutting reaches) give the same answer. */
const GWc=220,CELLc=10,passC=i=>B.W.grid[i]!==4&&B.W.grid[i]!==5;
const cellC=(x,y)=>Math.max(0,Math.min(GWc-1,Math.floor(y/CELLc)))*GWc+Math.max(0,Math.min(GWc-1,Math.floor(x/CELLc)));
let RV=null,LAB=null,NP=new Map(),FPC=new Map();
function reachVer(){const g=B.W.grid;let h=g.length;for(let i=0;i<g.length;i++)if(g[i]===4||g[i]===5)h=(Math.imul(h,31)+i)|0;
  if(h!==RV){RV=h;NP.clear();FPC.clear();const N=g.length;LAB=new Int32Array(N);let L=0;const q=new Int32Array(N);
    for(let i=0;i<N;i++){if(LAB[i]||!passC(i))continue;L++;let qh=0,qt=0;q[qt++]=i;LAB[i]=L;while(qh<qt){const c=q[qh++],cx=c%GWc,cy=(c/GWc)|0;
      if(cx>0&&!LAB[c-1]&&passC(c-1)){LAB[c-1]=L;q[qt++]=c-1;}if(cx<GWc-1&&!LAB[c+1]&&passC(c+1)){LAB[c+1]=L;q[qt++]=c+1;}
      if(cy>0&&!LAB[c-GWc]&&passC(c-GWc)){LAB[c-GWc]=L;q[qt++]=c-GWc;}if(cy<GWc-1&&!LAB[c+GWc]&&passC(c+GWc)){LAB[c+GWc]=L;q[qt++]=c+GWc;}}}}}
function nearestP(t){if(NP.has(t))return NP.get(t);const N=GWc*GWc,seen=new Uint8Array(N),qu=[t];seen[t]=1;let r=-1;
  for(let h=0;h<qu.length;h++){const c=qu[h];if(passC(c)){r=c;break;}const cx=c%GWc,cy=(c/GWc)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=GWc||ny>=GWc)continue;const n=ny*GWc+nx;if(!seen[n]){seen[n]=1;qu.push(n);}}}
  NP.set(t,r);return r;}
function labsOf(s){if(passC(s))return[LAB[s]];const cx=s%GWc,cy=(s/GWc)|0,o=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=cx+dx,ny=cy+dy;if((!dx&&!dy)||nx<0||ny<0||nx>=GWc||ny>=GWc)continue;const n=ny*GWc+nx;if(passC(n)&&(!(dx&&dy)||(passC(cy*GWc+nx)&&passC(ny*GWc+cx))))o.push(LAB[n]);}return o;}
function reach(sx,sy,tx,ty){const s=cellC(sx,sy);let t=cellC(tx,ty);if(!passC(t)){t=nearestP(t);if(t<0)return false;}if(s===t)return true;return labsOf(s).includes(LAB[t]);}
function fpOK(u,e){const k=labsOf(cellC(u.x,u.y)).join(',')+'|'+e.id+'|'+e.visibleNow;if(!FPC.has(k))FPC.set(k,!!B.firingPoint(u,e));return FPC.get(k);}
function play(seed,limit){
  B.newGame(seed);const G=B.G;G.running=true;
  // T45_EXPLORE=1: one extra SPARV explores freely from the start and is left alone by the bot; T45_RADIO sets its radio range
  if(process.env.T45_RADIO)B.RADIO.r=+process.env.T45_RADIO;const exK={};let exS=null;if(process.env.T45_EXPLORE){exS=B.makeUnit('scout',B.W.landing.x,B.W.landing.y+60);exS.simX=1;G.units.push(exS);B.giveOrder(exS,{type:'explore',post:'def'},false,'mission');}
  const landPct=()=>{let a=0,k=0;const g=B.W.baseGrid;for(let i=0;i<g.length;i+=2)if(g[i]>1){a++;if(G.known[i])k++;}return Math.round(k/a*100);};
  if(V==='nosalv')G.krokAuto=false;
  if(process.env.START)G.res=+process.env.START;if(process.env.BASE)B.INCOME.base=+process.env.BASE;if(process.env.RELAY)B.INCOME.relay=+process.env.RELAY;
  const lostK={},seenDead=new Set(),killers={};
  const cat={},known=new Map();let tick=0,maxRes=0,krokBusy=0,krokN=0,firstRelay=null;
  const COST={scout:40,drone:120,tank:200,eng:150};
  while(G.time<limit&&!G.over){
    if(exS)for(const m of [300,600,890])if(!exK[m]&&G.time>=m)exK[m]=landPct()+(exS.dead?'x':'');
    B.step(.05);tick++;
    // salvage accounting
    if(tick%20===0){const now=new Set(G.wrecks.map(w=>w.id));for(const w of G.wrecks)known.set(w.id,w);for(const[id,w]of known)if(!now.has(id)){const k=w.own?'own':w.kind==='rubble'||w.kind==='crate'||w.kind==='hulk'?w.kind:'enemy';cat[k]=(cat[k]||0)+w.value;known.delete(id);}
      for(const u of G.units)if(u.dead&&!seenDead.has(u.id)){seenDead.add(u.id);lostK[u.kind]=(lostK[u.kind]||0)+1;if(u.kind==='scout'||process.env.ALLK){let k='?',t=-1;for(const id in u.hitBy)if(u.hitBy[id]>t){t=u.hitBy[id];k=id;}const e=G.enemies.find(x=>x.id===k);const key=u.kind+'<'+(e?e.kind+(e.seen?'':'(osedd)'):k);killers[key]=(killers[key]||0)+1;}}
      for(const k of G.kroks){krokN++;if(k.state!=='idle')krokBusy++;}maxRes=Math.max(maxRes,G.res);
      if(firstRelay===null&&G.relays.some(r=>r.captured))firstRelay=Math.round(G.time);}
    if(tick%40)continue;
    const alive=G.units.filter(u=>!u.dead);
    const cnt=k=>alive.filter(u=>u.kind===k).length+G.build.filter(b=>b.kind===k).length;
    const aaAlive=G.enemies.some(e=>!e.dead&&e.kind==='aa');
    const want=V==='rush'?[['eng',1],['tank',6]]:V==='farm'?[['eng',3]]:[['eng',2],['drone',1],...(aaAlive?[['scout',1]]:[]),['tank',Math.min(7,4+Math.floor(G.res/350))]];
    for(const[k,n]of want){if(cnt(k)<n&&G.res>=COST[k]&&alive.length+G.build.filter(b=>b.kind!=='krok').length<10){G.res-=COST[k];G.build.push({kind:k,t:{scout:8,drone:15,tank:25,eng:20}[k],total:1});}}
    if(V!=='nosalv'&&G.kroks.length+G.build.filter(b=>b.kind==='krok').length<(V==='farm'?4:3)&&G.res>=(V==='farm'?150:400)&&G.wrecks.filter(w=>!w.claimed).length>4){G.res-=150;G.build.push({kind:'krok',t:20,total:20});}
    if(V==='farm'){for(const e of alive.filter(u=>u.kind==='eng')){if(e.orders.length)continue;const ss=G.structs.filter(s=>!s.dead&&!G.enemies.some(x=>!x.dead&&d(x,s)<x.range+40)).sort((a,b)=>d(a,e)-d(b,e));const s=ss.find(s=>!G.units.some(o=>o!==e&&o.orders[0]&&o.orders[0].s===s));if(s){s.krok=true;B.giveOrder(e,{type:'demolish',s,post:'dold'},false);}}continue;}
    const tanks=alive.filter(u=>u.kind==='tank');
    const cen=tanks.length?{x:tanks.reduce((s,u)=>s+u.x,0)/tanks.length,y:tanks.reduce((s,u)=>s+u.y,0)/tanks.length}:{x:G.units[0]?G.units[0].x:0,y:0};
    const defs0=G.enemies.filter(e=>!e.dead).sort((a,b)=>d(a,cen)-d(b,cen));
    const t0=tanks[0];let tgt=null;
    reachVer();
    for(const e of defs0){if(!t0){tgt=e;break;}if(reach(t0.x,t0.y,e.x,e.y)||fpOK(t0,e)){tgt=e;break;}}
    if(tgt)tgt.seen=true;
    for(const t of tanks){if(t.rtb||t.awaitRep||(t.orders[0]&&t.orders[0].toRep)||t.hp<t.maxhp*.3)continue;if(tgt&&(!t.orders[0]||t.orders[0].enemy!==tgt)){t.orders=[];B.giveOrder(t,{type:'attack',enemy:tgt,post:'off'},false);}}
    if(V!=='rush'&&tgt&&!tgt.visibleNow&&tgt.kind==='aa'){const h=alive.find(u=>u.kind==='drone');if(h&&!h.rtb&&h.hp>h.maxhp*.6&&tanks.some(t=>d(t,tgt)<t.range)){const dir=Math.atan2(cen.y-tgt.y,cen.x-tgt.x),p={x:tgt.x+Math.cos(dir)*165,y:tgt.y+Math.sin(dir)*165};const o=h.orders[0];if(!o||o.type!=='obs'||d(o,p)>25||o.post!=='off'){h.orders=[];B.giveOrder(h,{type:'obs',x:p.x,y:p.y,post:'off'},false);}}}
    else if(V!=='rush'&&tgt&&!tgt.visibleNow){
      const dir=Math.atan2(cen.y-tgt.y,cen.x-tgt.x);
      const umbrella=G.enemies.some(a=>!a.dead&&a.kind==='aa'&&d(a,tgt)<215);
      const sc=alive.find(u=>u.kind==='scout'&&!u.simX),h=alive.find(u=>u.kind==='drone');
      const sp=umbrella&&sc?sc:h;
      if(sp&&!sp.rtb){const R=sp===sc?68:150;const p={x:tgt.x+Math.cos(dir)*R,y:tgt.y+Math.sin(dir)*R};const o=sp.orders[0];const post=sp===sc&&umbrella?'off':'def';if(!o||o.type!=='obs'||d(o,p)>25||o.post!==post){sp.orders=[];B.giveOrder(sp,{type:'obs',x:p.x,y:p.y,post},false);}}
    }
    const engs=alive.filter(u=>u.kind==='eng'),e=engs[0];
    if(e&&!e.orders.length){
      const job=[...G.relays.filter(r=>!r.captured&&!r.guards.some(id=>G.enemies.find(x=>x.id===id&&!x.dead))).map(r=>({type:'capture',relay:r})),
                 ...G.barriers.filter(b=>!b.cleared&&!G.enemies.some(x=>!x.dead&&x.kind!=='aa'&&(d(x,b)<x.range+5||b.sides.some(sd=>sd.z!==b.far&&d(x,sd)<x.range+5)))).map(b=>({type:'clear',barrier:b})),
                 ...(G.mines||[]).filter(m=>m.found&&!m.cleared).map(m=>({type:'demine',mine:m}))];
      const pass=i=>B.W.grid[i]!==4&&B.W.grid[i]!==5;const reachable=j=>j.relay?reach(e.x,e.y,j.relay.x,j.relay.y):j.mine?(()=>{const sd=B.mineSide(j.mine,e);return reach(e.x,e.y,sd.x,sd.y);})():j.barrier.sides.some(s=>reach(e.x,e.y,s.x,s.y));
      job.sort((a,b)=>d(e,a.relay||a.barrier||a.mine)-d(e,b.relay||b.barrier||b.mine));const okj=job.filter(reachable);job.length=0;job.push(...okj);
      if(job[0]){job[0].post='dold';B.giveOrder(e,job[0],false);e.override=true;}
    }
    const e2=engs[1];
    if(V!=='nosalv'&&e2&&!e2.orders.length){const ss=G.structs.filter(s=>!s.dead&&!G.enemies.some(x=>!x.dead&&d(x,s)<x.range+40)).sort((a,b)=>d(a,e2)-d(b,e2));const s0=ss.slice(0,6).find(s=>reach(e2.x,e2.y,s.x,s.y));if(s0){s0.krok=true;B.giveOrder(e2,{type:'demolish',s:s0,post:'dold'},false);}}
  }
  const lost={};for(const l of G.log)0;
  if(process.env.DBG){for(const u of G.units.filter(u=>!u.dead))console.log(u.name,Math.round(u.x),Math.round(u.y),u.state,u.orders[0]&&u.orders[0].type,u.orders[0]&&u.orders[0].enemy&&u.orders[0].enemy.id);for(const e of G.enemies.filter(e=>!e.dead))console.log(' ',e.id,e.kind,Math.round(e.x),Math.round(e.y),'seen',e.seen,'vis',e.visibleNow,'hp',Math.round(e.hp));console.log(G.relays.map(r=>r.id+':'+r.captured+':'+r.guards).join(' '),'barriers',G.barriers.map(b=>b.id+(b.cleared?'x':'')).join(' '));}
  return {seed,explore:exS?exK:undefined,over:G.over,t:Math.round(G.time),r1:firstRelay,cap:G.relays.filter(r=>r.captured).length,lost:G.unitsLost,net:G.lostValue-G.salvagedOwn,res:Math.round(G.res),maxRes:Math.round(maxRes),salv:G.salvaged,cat,kroks:G.kroks.length,krokBusy:krokN?Math.round(krokBusy/krokN*100):0,lostK,killers,structsLeft:G.structs.filter(s=>!s.dead).length+'/'+G.structs.length};
}
// seeds: a comma list, 'quick' (four islands, about a minute) or nothing (all ten, two to three minutes)
const seeds=(process.argv[3]==='quick'?'1234,7341,4242,9001':process.argv[3]||'1234,7341,4242,9001,2718,5555,31,77,1001,1002').split(',').map(Number);
const lim=+(process.argv[4]||3600);
const summary=rs=>{const won=rs.filter(r=>r.over);const avg=(a,f)=>a.length?Math.round(a.reduce((s,r)=>s+f(r),0)/a.length):'-';
console.log(V,'won',won.length+'/'+rs.length,'avg time(won)',avg(won,r=>r.t),'avg lost',avg(rs,r=>r.lost),'avg net',avg(rs,r=>r.net),'avg salv',avg(rs,r=>r.salv),'avg endRes',avg(rs,r=>r.res),'krokBusy%',avg(rs,r=>r.krokBusy));};
// several seeds run in parallel child processes, one per core (each game is independent); T45_SERIAL=1 runs them in turn
if(seeds.length>1&&!process.env.T45_SERIAL&&!process.env.T45_CHILD){
  const {spawn}=require('child_process'),n=Math.max(1,+(process.env.T45_JOBS||require('os').cpus().length));const out=new Map();let next=0,live=0;
  const go=()=>{while(live<n&&next<seeds.length){const sd=seeds[next++];live++;let buf='';
    const c=spawn(process.execPath,[__filename,V,String(sd),String(lim)],{env:Object.assign({},process.env,{T45_CHILD:'1'})});
    c.stdout.on('data',d=>buf+=d);c.stderr.on('data',d=>process.stderr.write(d));
    c.on('close',()=>{live--;const line=buf.split('\n').find(l=>l.startsWith('{'));if(line){out.set(sd,JSON.parse(line));console.log(line);}else console.log('seed',sd,'failed');
      if(out.size+(next-out.size-live)>=seeds.length&&!live&&next>=seeds.length)summary(seeds.map(s2=>out.get(s2)).filter(Boolean));else go();});}};go();
}else{const rs=[];for(const s of seeds){const r=play(s,lim);rs.push(r);console.log(JSON.stringify(r));}if(!process.env.T45_CHILD)summary(rs);}
