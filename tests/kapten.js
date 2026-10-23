/* the captain bot (Magnus 23 okt: the test bot plays nothing like him, it loses about three times as many units per enemy taken out).
   It plays as his recordings do: today's islands and start, wing 1 the VARG and wing 2 the HÖK, ordered through groupOrder as a click
   on the chart. It attacks only what it has spotted, waits a while after spotting and has a GETING look over the ground first, attacks
   with the whole wing, nearest first, advances in bounds of about 120 m onto ground seen from low, sends the HÖK at pansarvärn and
   robot teams near the wing and never under seen air defence, sends VARG to service at 60 %, keeps one GETING exploring low and one
   BÄVER pulling down buildings for salvage, taking points and blowing barriers. Built from t45.js as the variant 'kapten' (node
   tests/t45.js kapten); the reach helpers come from there. T45_WHY=1 prints once a minute what it waits for */
module.exports=(B,{reach,fpOK,reachVer})=>{
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
// his forces at the end of 1490 and 3019: four VARG, four HÖK, one GETING and one BÄVER, built GETING first and HÖK after the third VARG
const PLAN=[['scout',1],['tank',2],['tank',3],['drone',2],['tank',4],['drone',4]];
const BOUND=120,/* he waited about a minute from spotting to the first attack order (median 26 to 65 s) */WAIT=20,SCAN_T=40,SVC=.6,SVC_IDLE=.85;
const hurt=u=>u.fighting||B.G.time-(u.lastHit??-99)<6;
/* service costs material: with none a VARG at service waits for good, so it is not counted as at service (and not sent there) once it is
   above 15 %; ö 1490, both VARG stood on the pads from minute six to the end */
const broke=u=>B.G.res<2&&u.hp>=u.maxhp*.15;
const busySvc=u=>(u.rtb&&!broke(u))||u.awaitRep||(u.orders[0]&&u.orders[0].toRep&&!broke(u));
const cen=us=>({x:us.reduce((s,u)=>s+u.x,0)/us.length,y:us.reduce((s,u)=>s+u.y,0)/us.length});
/* as a click: an attack goes through the game's own check of targets covering each other, which on Offensiv takes the cover first */
const ord=(us,pk)=>{if(us.length)B.groupOrder(Object.assign({us},pk),false);};
/* a seen enemy that can fire on ground units within this of the point makes the point unsafe for the wing */
const groundThreat=(G,p,m)=>G.enemies.find(e=>!e.dead&&e.seen&&e.canGround&&Math.hypot(p.x-e.lx,p.y-e.ly)<(e.range||0)+m);
/* seen ground (from low or high) around a point: where an air defence would have been seen, as camouflage hides it only from the ground */
function knownShare(G,p,r){const g=B.W.baseGrid;let n=0,k=0;
  for(let y=p.y-r;y<=p.y+r;y+=20)for(let x=p.x-r;x<=p.x+r;x+=20){if(Math.hypot(x-p.x,y-p.y)>r||x<0||y<0||x>=2200||y>=2200)continue;const i=B.cellIdx(x,y);if(g[i]<=1)continue;n++;if(G.known[i])k++;}
  return n?k/n:1;}
/* low-seen ground around a point: the share of land cells within r m that some unit has seen from low */
function lowShare(G,p,r){const W=B.W,c=10,g=W.baseGrid;let n=0,k=0;
  for(let y=p.y-r;y<=p.y+r;y+=c*2)for(let x=p.x-r;x<=p.x+r;x+=c*2){if(Math.hypot(x-p.x,y-p.y)>r||x<0||y<0||x>=2200||y>=2200)continue;const i=B.cellIdx(x,y);if(g[i]<=1)continue;n++;if(B.knownLo(i))k++;}
  return n?k/n:1;}
return function tick(G){
  const K=G.kap||(G.kap={seenAt:{},done:{},scan:null,tgt:null,hTgt:null,bound:null});
  const alive=G.units.filter(u=>!u.dead&&u.kind!=='mus');
  const cnt=k=>alive.filter(u=>u.kind===k).length+G.build.filter(b=>b.kind===k).length+(G.fbuild||[]).filter(b=>b.kind===k).length;
  /* building: the plan in order, saving up for the next one rather than skipping it; a second KROK only once the plan is built (he built
     it after 19 minutes in 3019): bought early it took the second VARG's material */
  const unmet=PLAN.find(([k,n])=>cnt(k)<n);if(unmet){if(G.res>=B.TYPES[unmet[0]].cost)B.queueBuild(unmet[0]);}
  else if(G.kroks.length+G.build.filter(b=>b.kind==='krok').length<2&&G.res>=400&&G.wrecks.filter(w=>!w.claimed).length>4){G.res-=B.KROK_COST;G.build.push({kind:'krok',t:20,total:20});}
  for(const e of G.enemies)if(e.seen&&K.seenAt[e.id]==null)K.seenAt[e.id]=G.time;
  {const k=G.enemies.filter(e=>e.dead).length;if(k!==K.kills){K.kills=k;K.act=G.time;}}
  reachVer();
  const free=u=>!u.carried&&!u.dead&&!(u.deckTo)&&G.ctrl!==u.id;
  const tanks=alive.filter(u=>u.kind==='tank'&&free(u)),hoks=alive.filter(u=>u.kind==='drone'&&free(u));
  G.wings={};if(tanks.length)G.wings['1']=tanks.map(u=>u.id);if(hoks.length)G.wings['2']=hoks.map(u=>u.id);
  // service: VARG at 60 % out of the fight, and at 85 % while the wing has nothing to do
  /* once per 20 s each: the game may turn a service order into field repair by a nearer BÄVER, which is not a service order */
  const svcT=K.svcT||(K.svcT={});
  for(const t of tanks){if(busySvc(t)||hurt(t)||broke(t)||G.time-(svcT[t.id]??-99)<20)continue;if(t.hp<t.maxhp*SVC||(!K.tgt&&t.hp<t.maxhp*SVC_IDLE)){svcT[t.id]=G.time;B.groupService([t],'Kaptenen');}}
  const ready=tanks.filter(t=>!busySvc(t)&&(t.hp>=t.maxhp*SVC||broke(t)));
  const hReady=hoks.filter(h=>!h.rtb&&h.hp>=h.maxhp*SVC&&h.ammo>=2);
  /* the GETING: low, exploring freely, unless it is looking over ground for the wing; a scan ends at the point or after SCAN_T s. Low as
     he flew it (his recordings are from before high existed): only land seen from low is secured for KROK and the BÄVER */
  const sc=alive.find(u=>u.kind==='scout'&&free(u)&&!u.rtb);
  if(K.scan&&(!sc||sc.dead||G.time-K.scan.t>SCAN_T||(K.scan.at!=null&&G.time-K.scan.at>4))){K.scan.done=true;K.done[K.scan.key]=1;}
  if(sc&&K.scan&&!K.scan.done&&K.scan.at==null&&d(sc,K.scan.p)<20)K.scan.at=G.time;
  if(sc&&(!K.scan||K.scan.done)&&!(sc.mission&&sc.mission.type==='explore'&&sc.orders[0]===sc.mission)){B.setHigh(sc,false);B.giveOrder(sc,{type:'explore',post:'def'},false,'mission');}
  /* asks for a scan of the ground at p (for the target e, from its own side); true once that is done or cannot be done */
  const scanned=(key,p,e,from)=>{if(K.done[key])return true;if(K.scan&&K.scan.key===key)return K.scan.done;if(!sc)return true;
    const q=e?B.spotPoint(sc,e,from):p;if(!q)return true;
    K.scan={key,p:q,t:G.time,at:null,done:false};B.giveOrder(sc,{type:'obs',x:q.x,y:q.y,post:'def',orbR:5},false,'temp');return false;};
  /* with nothing else to look at, the GETING looks over the ground round material near the wing or the landing, which KROK fetches only
     once 90 % of the land within 110 m has been seen from low */
  const scanFree=()=>!K.scan||K.scan.done,key=w=>'s'+Math.round(w.x/50)+','+Math.round(w.y/50);
  const salvScan=()=>{if(!sc||!scanFree())return;const c0=tanks.length?cen(tanks):B.W.landing;
    const w=G.wrecks.filter(w=>!w.claimed&&!B.lockedAt(w.x,w.y)&&d(w,c0)<350&&lowShare(G,w,110)<.9&&!G.enemies.some(e=>!e.dead&&e.seen&&Math.hypot(e.lx-w.x,e.ly-w.y)<(e.kRange||e.airRange||e.range||0)+20))
      .concat(G.structs.filter(s=>!s.dead&&d(s,c0)<300&&lowShare(G,s,100)<.6&&!G.enemies.some(e=>!e.dead&&e.seen&&Math.hypot(e.lx-s.x,e.ly-s.y)<(e.range||0)+40)))
      .filter(w=>!K.done[key(w)]).sort((a,b)=>d(a,sc)-d(b,sc))[0];
    if(w)scanned(key(w),{x:w.x,y:w.y},null);};
  salvScan();
  /* the BÄVER: the points, barriers and mines it can take, then buildings for salvage; only on ground seen from low, near the VARG or the
     landing, and away from what has been seen (sent at once into unknown land, KROK flew it over an air defence nobody had seen) */
  const en=alive.find(u=>u.kind==='eng'&&!u.carried);
  const vc0=tanks.length?cen(tanks):null,L0=B.W.landing;
  /* its stance Offensiv, and Flyg ändå when it has waited 20 s for a secured landing place: early in a game there is none, and he lifted
     and set it down by hand (ö 9949, 19 okt) */
  const jobAt=o=>o&&(o.relay||o.barrier||o.mine||o.s||(o.x!=null?o:null));
  const threatNear=(p,m)=>G.enemies.some(x=>!x.dead&&x.seen&&Math.hypot(x.lx-p.x,x.ly-p.y)<(x.kind==='aa'?200:x.range||0)+m);
  /* not where a weapon has been seen since the job was given (ö 9949: set down under bunker T10 and shot) */
  if(en){en.post='off';const ja=jobAt(en.orders[0]);if(en.unsafeWait&&en.lzMsgT!=null&&G.time<en.lzMsgT&&ja&&!threatNear(ja,40)){K.lzW=K.lzW??G.time;if(G.time-K.lzW>20){en.override=true;en.hold=false;en.unsafeWait=false;K.lzW=null;}}else K.lzW=null;}
  /* a job it has waited 90 s for (no safe way, no landing place it may use) is given up for three minutes and the next taken: on
     9949 it hung in the lift queue for the whole game while two buildings by the beach were there to pull down */
  const jobBad=K.jobBad||(K.jobBad={}),jid=o=>{const t=jobAt(o);return t&&(t.id||Math.round(t.x)+','+Math.round(t.y));};
  if(en&&en.orders.length&&en.unsafeWait){K.enW=K.enW??G.time;if(G.time-K.enW>90){const k=jid(en.orders[0]);if(k)jobBad[k]=G.time;K.enW=null;en.override=false;B.groupOrder({us:[en],world:{x:en.x,y:en.y}},false);}}else K.enW=null;
  const jobOK=o=>{const k=jid(o);return !k||!(G.time-(jobBad[k]??-999)<180);};
  if(en&&!en.orders.length&&!en.awaitKrok){
    const near=threatNear;
    const safe=p=>(d(p,L0)<250||(vc0&&d(p,vc0)<300))&&lowShare(G,p,100)>=.6;
    const covered=b=>tanks.filter(t=>!busySvc(t)&&b.sides.some(sd=>sd.z!==b.far&&d(t,sd)<300)).length>=2;
    const job=[...G.relays.filter(r=>!r.captured&&!r.guards.some(id=>G.enemies.find(x=>x.id===id&&!x.dead))).map(r=>({type:'capture',relay:r,at:r})),
      /* a barrier with the VARG beside it is blown under their cover (ö 1490: a stridsvagn seen behind S1 kept the BÄVER off it and the
         wing could not reach the stridsvagn, for 20 minutes) */
      ...G.barriers.filter(b=>!b.cleared&&((!near(b,5)&&!b.sides.some(sd=>sd.z!==b.far&&near(sd,5)))||covered(b))).map(b=>({type:'clear',barrier:b,at:b,cov:covered(b)})),
      ...(G.mines||[]).filter(m=>m.found&&!m.cleared).map(m=>({type:'demine',mine:m,at:m}))]
      .filter(j=>(j.cov||safe(j.at))&&jobOK(j)).filter(j=>j.relay?reach(en.x,en.y,j.relay.x,j.relay.y):j.mine?(()=>{const sd=B.mineSide(j.mine,en);return reach(en.x,en.y,sd.x,sd.y);})():j.barrier.sides.some(s=>reach(en.x,en.y,s.x,s.y)))
      .sort((a,b)=>d(en,a.at)-d(en,b.at));
    /* buildings first while material is short: on 9949 he pulled down the two sheds by the beach before anything else. On Offensiv, as
       he gave it: KROK then sets it down where it is sent, not only on secured land, which early in a game is nowhere */
    const st=()=>G.structs.filter(s=>!s.dead&&!near(s,40)&&safe(s)&&jobOK({s})).sort((a,b)=>d(a,en)-d(b,en)).slice(0,6).find(s=>reach(en.x,en.y,s.x,s.y));
    const s0=G.res<300?st():null;
    if(s0){s0.krok=true;B.giveOrder(en,{type:'demolish',s:s0,post:'off'},false);}
    else if(job[0]){const j=job[0];delete j.at;delete j.cov;j.post='off';B.giveOrder(en,j,false);}
    else{const s=st();if(s){s.krok=true;B.giveOrder(en,{type:'demolish',s,post:'off'},false);}}}
  /* KROK sent to material by hand, as he did on 9949 when the material ran out: a pile seen, outside every seen threat, near the landing or
     the wing, though the ground round it is not all looked over (the automatic salvage waits for that) */
  /* a KROK on its pad with no material to repair it goes out to salvage by itself in the game now (KROK_BROKE, 23 okt) */
  if(G.krokQ.length<2){const c1=tanks.length?cen(tanks):L0,w=G.wrecks.filter(w=>!w.claimed&&!G.krokQ.includes(w.id)&&G.known[B.cellIdx(w.x,w.y)]&&(d(w,L0)<400||d(w,c1)<300)&&B.wreckSafe(w)).sort((a,b)=>b.value-a.value)[0];if(w)B.orderKrok(w);}
  /* never under a seen air defence (twelve HÖK of fifteen lost were shot down by one, ten islands 23 okt) */
  const known=(e,r)=>knownShare(G,{x:e.lx,y:e.ly},r);
  const aaNear=p=>G.enemies.some(a=>!a.dead&&a.seen&&a.kind==='aa'&&Math.hypot(a.lx-p.lx,a.ly-p.ly)<a.range+25);
  /* the HÖK wing: pansarvärn (which cannot fire on aircraft) and robot teams it has seen within 400 m of the VARG, two HÖK or more at a time */
  const vc=ready.length?cen(ready):tanks.length?cen(tanks):{x:B.W.landing.x,y:B.W.landing.y};
  if(K.hTgt&&(K.hTgt.dead||!hoks.some(h=>h.orders[0]&&h.orders[0].enemy===K.hTgt)))K.hTgt=null;
  if(!K.hTgt&&hReady.length>=2){const ht=G.enemies.filter(e=>!e.dead&&e.seen&&(e.kind==='at'||e.kind==='rb')&&Math.hypot(e.lx-vc.x,e.ly-vc.y)<400&&G.time-K.seenAt[e.id]>=WAIT&&B.canHit(hReady[0],e,true)&&!aaNear(e)&&known(e,220)>=.85)
    .sort((a,b)=>Math.hypot(a.lx-vc.x,a.ly-vc.y)-Math.hypot(b.lx-vc.x,b.ly-vc.y))[0];
    /* only one that cannot fire on aircraft: sent at bunkers closing the way, two HÖK at a time were shot down eleven times on 9027 */
    const bk=K.blocker&&!K.blocker.dead&&!K.blocker.canAir&&B.canHit(hReady[0],K.blocker,true)&&!aaNear(K.blocker)&&known(K.blocker,220)>=.6?K.blocker:null;
    if(K.blocker)K.bkWhy=/* for T45_WHY */[hReady.length,B.canHit(hReady[0],K.blocker,true),aaNear(K.blocker),known(K.blocker,220).toFixed(2)].join(' ');
    const t=ht||bk;if(t){K.hTgt=t;ord(hReady,{enemy:t});}}
  /* a HÖK on its way to a target that air defence turns out to cover is called back, to a point behind the VARG outside every seen
     threat to aircraft: after the first was shot down the others flew on into it one by one (ö 5555) */
  const aSafe=p=>!G.enemies.some(e=>!e.dead&&e.seen&&e.canAir&&Math.hypot(e.lx-p.x,e.ly-p.y)<(e.airRange||e.range||0)+25);
  const back=()=>{const L1=B.W.landing,dl=d(vc,L1)||1;for(const r of[150,250,350,500,800]){const q={x:vc.x+(L1.x-vc.x)/dl*Math.min(r,dl),y:vc.y+(L1.y-vc.y)/dl*Math.min(r,dl)};if(aSafe(q))return q;}return{x:L1.x,y:L1.y};};
  {const pull=hoks.filter(h=>!h.rtb&&h.orders.some(o=>o.type==='attack'&&(o.enemy.kind==='aa'||aaNear(o.enemy))));if(pull.length){const p=back();for(const h of pull)B.giveOrder(h,{type:'move',x:p.x,y:p.y,post:'def'},false);if(K.hTgt&&aaNear(K.hTgt))K.hTgt=null;}}
  const cover=hReady.filter(h=>!(K.hTgt&&h.orders[0]&&h.orders[0].enemy===K.hTgt));
  /* the VARG wing waits for its own: two, and three once four are built */
  const nT=cnt('tank'),need=Math.min(3,Math.max(2,Math.ceil(nT*.6)));
  if(K.tgt&&(K.tgt.dead||!K.tgt.seen))K.tgt=null;
  /* a target out of sight that draws the wing more than 300 m from where the attack began is let go and the wing goes back (ö 9949:
     the VARG followed a stridsvagn 800 m in among bunkers nobody had seen, and one did not come back) */
  if(K.tgt&&K.from&&!K.tgt.visibleNow){const on=tanks.filter(t=>t.orders.some(o=>o.type==='attack'&&o.enemy===K.tgt));
    if(on.length&&d(cen(on),K.from)>300){(K.bad||(K.bad={}))[K.tgt.id]=G.time;ord(on,{world:{x:K.from.x,y:K.from.y}});K.tgt=null;}}
  /* a target nobody has taken up for 20 s (the order gave no attack: no way there, or the game's cover check sent them elsewhere) is
     let go for two minutes; it held the wing still for the rest of a game (ö 3019) */
  const bad=K.bad||(K.bad={});
  /* the game's cover check may send them at the target covering it first, so the wing counts as busy with any attack */
  if(K.tgt){const on=tanks.filter(t=>t.orders.some(o=>o.type==='attack')).length;if(on){K.tgtOn=G.time;K.tgtAny=true;}
    if(!on&&G.time-Math.max(K.tgtOn||0,K.tgtAt||0)>20){if(!K.tgtAny)bad[K.tgt.id]=G.time;K.tgt=null;}}
  /* one back from service or new joins an attack under way, but a lone VARG is not sent at it again (ö 9949: VARG-1 went at a stridsvagn
     alone, three times, the third time to its end) */
  if(K.tgt){const miss=ready.filter(t=>!t.orders.some(o=>o.type==='attack'&&o.enemy===K.tgt)),on=tanks.some(t=>t.orders.some(o=>o.type==='attack'&&o.enemy===K.tgt));if(miss.length&&on&&G.time-(K.tgtT||0)>6){K.tgtT=G.time;ord(miss,{enemy:K.tgt});}return;}
  if(ready.length<need){K.why='samlas';return;}
  const cand=G.enemies.filter(e=>!e.dead&&e.seen&&!(G.time-(bad[e.id]??-999)<120)&&B.canHit(ready[0],e,true)&&(reach(ready[0].x,ready[0].y,e.lx,e.ly)||fpOK(ready[0],e)))
    .map(e=>({e,r:Math.hypot(e.lx-vc.x,e.ly-vc.y)})).filter(c=>c.r<350).sort((a,b)=>a.r-b.r);
  /* the nearest first: it waited for a target further off and drove past a nearer one it had just seen (ö 3019, T9 on the way to T4) */
  if(cand.length){const e=cand[0].e;
    /* targets that cover each other with no flank free (the game's own check, as when he clicks) want one VARG more than there are of
       them, up to four: two VARG at the bunker cluster by the landing on 9949 were beaten back and stood at service with no material for
       the rest of the game. After three minutes with nothing done it goes with what it has, as he would rather than sit (ö 9001: five
       bunkers and no material) */
    const cc=B.coverCheck(ready[0],e),th=cc&&cc.ch.length>=2&&!cc.free?cc.ch.length+1:0;
    if(ready.length<Math.min(4,th)&&!ready.some(t=>hurt(t))&&G.time-(K.act||0)<180){K.why='för få mot skydd';return;}
    // a fight already under way is joined at once; otherwise it waits WAIT s from the spotting and has the ground looked over
    const fight=ready.some(t=>hurt(t));
    if(!fight&&G.time-K.seenAt[e.id]<WAIT){K.why='väntar efter spaning';return;}
    if(!fight&&!scanned('e'+e.id,null,e,vc)){K.why='spanar mål';return;}
    /* the HÖK strike with the wing only outside air defence */
    K.tgt=e;K.tgtT=K.tgtAt=G.time;K.tgtAny=false;K.bound=null;K.from={x:vc.x,y:vc.y};ord(e.kind==='aa'||aaNear(e)?ready:ready.concat(cover),{enemy:e});return;}
  // nothing in reach: the next bound towards the nearest point or barrier the wing can drive to
  if(K.bound&&G.time-K.bound.t<60&&ready.some(t=>d(t,K.bound)>40)){K.why='på väg';return;}
  const objs=[...G.relays.filter(r=>!r.captured).map(r=>({x:r.x,y:r.y})),...G.barriers.filter(b=>!b.cleared).flatMap(b=>b.sides.filter(s=>s.z!==b.far).map(s=>({x:s.x,y:s.y})))]
    .filter(o=>d(o,vc)>80&&reach(vc.x,vc.y,o.x,o.y)).sort((a,b)=>d(a,vc)-d(b,vc));
  if(!objs.length){K.why='inget mål';return;}
  /* the first objective whose next bound is clear of seen ground weapons; a weapon the VARG cannot get at that closes every way on is
     left to the HÖK (ö 1490: bunker T6 behind barrier S2 held all four VARG still for 25 minutes) */
  const g=B.W.grid;let p=null,blk=null;
  for(const o of objs.slice(0,4)){const path=B.astar(vc.x,vc.y,o.x,o.y,i=>g[i]!==4&&g[i]!==5,()=>1);if(!path||!path.length)continue;
    let L=0,q=vc,pp=path[path.length-1];for(const s of path){L+=d(q,s);q=s;if(L>=BOUND){pp=s;break;}}
    const x=groundThreat(G,pp,25);if(!x){p=pp;break;}if(!blk)blk=x;}
  K.blocker=p?null:blk;
  if(!p){K.why=blk?'hot vid steget '+blk.id+(bad[blk.id]!=null?' (släppt)':''):'ingen väg';
    /* Kör ändå: a BÄVER that has waited a minute at a barrier inside the reach of the weapon that closes the way is sent on, as the captain
       would (ö 1490: bunker T6 behind S2 under air defence, out of reach of both VARG and HÖK) */
    if(blk&&en&&en.unsafeWait&&en.orders[0]&&en.orders[0].type==='clear'){K.enWait=K.enWait||G.time;if(G.time-K.enWait>60){en.override=true;en.hold=false;K.enWait=null;}}else K.enWait=null;
    return;}
  if(lowShare(G,p,90)<.7&&!scanned('p'+Math.round(p.x/40)+','+Math.round(p.y/40),p,null)){K.why='spanar steget';return;}
  K.why='steg';K.bound={x:p.x,y:p.y,t:G.time};K.act=G.time;ord(ready.concat(cover),{world:{x:p.x,y:p.y}});
};};
