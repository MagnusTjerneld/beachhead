// Natt 17 nov, agent H (Magnus 16 nov): decided corrections, no flag.
//  1. issue 159 and 163: ground vehicles lean with the ground and the ramps under them (tiltFromCorners, vehPose); the hovercraft less.
//  2. issue 183: the air defence truck's supports fold while it moves; setting up takes AA_SETUP s before it can fire (aaStay).
//  3. issue 158: the radar mast's stays stand on land (the radio mast of the issue is the radar station R2).
//  4. issue 162: every radio mast can be reached from Birka alone through the chain of masts.
//  5. issue 200: the harbour does not stand against a cliff.
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const PI=Math.PI,near=(a,b,e)=>Math.abs(a-b)<=(e==null?1e-6:e);

// ---- 1. the lean from four corners
{const T=B.tiltFromCorners,hl=4,hw=1.6;
  let t=T(1,1,1,1,hl,hw,1);ok(near(t.pitch,0)&&near(t.roll,0)&&near(t.y,1),'flat ground: no lean, the middle at the ground');
  t=T(3,3,1,1,hl,hw,1);ok(near(t.pitch,Math.atan2(2,2*hl))&&near(t.roll,0)&&near(t.y,2),'nose 2 m higher than the tail over '+2*hl+' m: pitched up '+t.pitch.toFixed(3)+', middle at the mean');
  t=T(1,1,3,3,hl,hw,1);ok(t.pitch<0,'nose lower than the tail: pitched down');
  t=T(1,2,1,2,hl,hw,1);ok(t.roll>0&&near(t.roll,Math.atan2(1,2*hw)),'right side higher: rolled to the right (+z), '+t.roll.toFixed(3));
  const h=T(3,3,1,1,hl,hw,B.VEH_TILT.hover);ok(near(h.pitch,.45*Math.atan2(2,2*hl),1e-9)&&B.VEH_TILT.hover<1,'the hovercraft leans '+B.VEH_TILT.hover+' of what a track does');
  t=T(0,0,0,6,hl,hw,1);ok(t.y>=0&&t.y<=B.VEH_TILT.liftT+3,'a twisted footprint is lifted so no corner is under the plane');
  for(const[fl,fr,bl,br]of[[0,0,0,6],[5,0,0,0],[0,3,2,0],[1,1,4,0]]){const q=T(fl,fr,bl,br,hl,hw,1),tp=Math.tan(q.pitch),tr=Math.tan(q.roll);
    let m=1e9;for(const[dx,dz,hh]of[[hl,-hw,fl],[hl,hw,fr],[-hl,-hw,bl],[-hl,hw,br]])m=Math.min(m,q.y+dx*tp+dz*tr-hh);
    ok(m>=-1e-9||q.y-q.mean>=B.VEH_TILT.liftT-1e-9,'no corner through the ground for '+[fl,fr,bl,br]);}
  const c=T(0,0,0,100,hl,hw,1);ok(Math.abs(c.pitch)<=B.VEH_TILT.max+1e-9&&Math.abs(c.roll)<=B.VEH_TILT.max+1e-9,'the lean is capped at '+B.VEH_TILT.max+' rad');}

// ---- the ramp at the quay: BJÖRN drives down the side ramp onto the quay (the nose went through the quay at the ramp's foot)
{B.newGame(2024);const G=B.G,H=G.harbor,d=B.W.harbor.dock;B.moveCarrier(d.x,d.y,d.a);H.secured=true;H.docked=true;G.ramp={bow:0,side:1};
  const R=B.rampReach(),dim=B.VEH_TILT.dim.bjorn,hd=B.CARRIER.a+PI/2,surf=(a,b)=>B.vehSurf(null,a,b);
  let worstNose=0,worstTail=0,flatNose=0,flatTail=0,maxPitch=0,n=0;
  for(let lat=B.RAMP.side-8;lat<=B.RAMP.side+R+10;lat+=.5){const p=B.shipPos(lat,2),x=p[0],y=p[1],P=B.vehPose(x,y,hd,dim,1,B.VEH_TILT.liftT,surf),mid=surf(x,y),cy=mid+P.off,tp=Math.tan(P.pitch),tr=Math.tan(P.roll);n++;
    const cs=[[dim[0],-dim[1]],[dim[0],dim[1]],[-dim[0],-dim[1]],[-dim[0],dim[1]]].map(([a,b])=>{const px=x+Math.cos(hd)*a-Math.sin(hd)*b,py=y+Math.sin(hd)*a+Math.cos(hd)*b;return{s:surf(px,py),h:cy+a*tp+b*tr,a};});
    for(const c of cs){const clear=c.h-c.s;if(c.a>0)worstNose=Math.min(worstNose,clear);else worstTail=Math.max(worstTail,clear);
      flatNose=Math.max(flatNose,c.s-mid);}
    maxPitch=Math.max(maxPitch,Math.abs(P.pitch));}
  ok(n>20&&flatNose>.1,'the old level pose put a corner up to '+flatNose.toFixed(2)+' m into the ramp or quay (the tail on the ramp, the nose at its foot)');
  ok(worstNose>=-.02,'with the lean no front corner is under the surface (worst '+worstNose.toFixed(3)+' m)');
  ok(worstTail<=.45,'and the tail does not float: highest rear corner over the surface '+worstTail.toFixed(2)+' m');
  ok(maxPitch>.1&&maxPitch<B.VEH_TILT.max,'it pitches along the ramp ('+maxPitch.toFixed(2)+' rad at most)');
  // on the deck itself: level, also at the edge where corners pass the rail
  const q=B.shipPos(0,10),P=B.vehPose(q[0],q[1],hd,dim,1,B.VEH_TILT.liftT,surf);ok(near(P.pitch,0,1e-9)&&near(P.roll,0,1e-9)&&near(P.off,0,1e-9),'on Birka\'s deck a vehicle stays level');
  const q2=B.shipPos(15.4,10),P2=B.vehPose(q2[0],q2[1],hd,dim,1,B.VEH_TILT.liftT,surf);ok(Math.abs(P2.pitch)<.05,'at the deck\'s edge, over the rail, the corners count as deck ('+P2.pitch.toFixed(3)+')');}

// ---- on the island's ground: no corner under the ground where the ground is not a cliff
{B.newGame(2547);const dim=B.VEH_TILT.dim.tank,surf=(a,b)=>B.groundY(a,b);let n=0,bad=0,leaned=0,over=0;
  for(let i=0;i<400;i++){const x=200+Math.random()*1100,y=200+Math.random()*1100,hd=Math.random()*2*PI;if(!B.passLand(B.cellIdx(x,y))||surf(x,y)<1)continue;
    const P=B.vehPose(x,y,hd,dim,1,B.VEH_TILT.liftT,surf),mid=surf(x,y),tp=Math.tan(P.pitch),tr=Math.tan(P.roll);n++;if(Math.abs(P.pitch)>.03||Math.abs(P.roll)>.03)leaned++;
    let low=1e9;for(const[a,b]of[[dim[0],-dim[1]],[dim[0],dim[1]],[-dim[0],-dim[1]],[-dim[0],dim[1]]]){const px=x+Math.cos(hd)*a-Math.sin(hd)*b,py=y+Math.sin(hd)*a+Math.cos(hd)*b;low=Math.min(low,mid+P.off+a*tp+b*tr-surf(px,py));}
    if(low<-.02)bad++;if(P.off>B.VEH_TILT.liftT-1e-6)over++;}
  ok(n>=50&&bad<=n*.02,'on ö 2547: no corner under the ground at '+(n-bad)+' of '+n+' places ('+leaned+' lean more than 2 degrees)');}

// ---- 2. the air defence truck's supports and its setting up
{const SC=B.SCOOT.aa;ok(B.AA_SETUP===8&&SC.setup===B.AA_SETUP,'setting up takes AA_SETUP = '+B.AA_SETUP+' s (5 s for a night, back to 8 on 17 nov)');
  ok(B.aaStay({sc:null,kind:'aa'})===1,'a truck that has not moved stands on its supports');
  ok(B.aaStay({kind:'aa',sc:{ph:'pack',t:SC.pack}})===1&&B.aaStay({kind:'aa',sc:{ph:'pack',t:SC.pack/2}})===.5&&B.aaStay({kind:'aa',sc:{ph:'pack',t:0}})===0,'packing folds them up over '+SC.pack+' s');
  ok(B.aaStay({kind:'aa',sc:{ph:'move',t:3}})===0,'they are up while it drives');
  ok(B.aaStay({kind:'aa',sc:{ph:'setup',t:SC.setup}})===0&&near(B.aaStay({kind:'aa',sc:{ph:'setup',t:SC.setup/2}}),.5)&&B.aaStay({kind:'aa',sc:{ph:'setup',t:0}})===1,'setting up puts them down over '+SC.setup+' s');}
{const run=s=>{for(let i=0;i<s*20;i++)B.step(.05);};
  B.newGame(7341);const G=B.G;G.running=true;G.netAll=true;for(const e of G.enemies)e.dead=true;for(const u of G.units)if(u.kind!=='eng'){u.x=G.relays[0].x-700;u.y=G.relays[0].y;u.orders=[];u.hold=true;}
  const L=G.relays[0],a=B.makeEnemy({id:'Q1',kind:'aa',x:L.x,y:L.y});G.enemies.push(a);
  const h=B.makeUnit('drone',L.x+120,L.y);G.units.push(h);h.orders=[];h.hold=true;h.override=true;h.dmg=0;h.ammo=0;h.range=0;h.speed=0;h.fuel=h.maxFuel=1e5;h.hp=h.maxhp=1e4;
  ok(B.startScoot(a),'the truck starts to pack and move');let t0=null,t1=null,hp0=null,fired=false;
  for(let i=0;i<60*20;i++){B.step(.05);if(a.sc&&a.sc.ph==='setup'&&t0===null){t0=G.time;hp0=h.hp;}if(t0!==null&&t1===null&&a.sc&&h.hp<hp0)fired=true;if(t0!==null&&!a.sc){t1=G.time;break;}}
  ok(t0!==null&&t1!==null&&Math.abs((t1-t0)-B.AA_SETUP)<.15,'the setting up took '+(t1-t0).toFixed(2)+' s of the '+B.AA_SETUP+' s and ends with the truck ready');
  ok(!fired,'it fired nothing while it set up');}

// ---- 3. the radar mast's stays stand on land (the "radio mast" at the quay of issue 158 is R2, the radar station)
{const LV=[64,128],K=.75,DR=[1,.9,1.1,.8,1.2,.7,.6],DA=[0,.12,-.12,.24,-.24,.36,-.36],T3=2*PI/3;let islands=0,bad=[],moved=0;
  for(const seed of[4787,1490,1518,2547,3410,6795,7968,9052,2024,3019]){B.newGame(seed);const W=B.WORLD,r=B.G.relays.find(q=>q.type==='radar'),wet=(x,y)=>B.heightAt(x,y)<.5;islands++;if(W.r2dry)moved++;
    const spot=(p,k,h)=>{let bst=1e9;for(const dr of DR)for(const da of DA){const a=p+k*T3+da,R=h*K*dr,c=(wet(r.x+Math.cos(a)*R,r.y+Math.sin(a)*R)?4:0)+Math.abs(da)*.5+Math.abs(dr-1)*.5;if(c<bst)bst=c;}return bst;};
    let best=9;for(let k=0;k<36;k++){const p=k*T3/36;let n=0;for(let q=0;q<3;q++)for(const h of LV)if(spot(p,q,h)>=4)n++;best=Math.min(best,n);}
    if(best>0)bad.push(seed+':'+best);}
  ok(bad.length===0,'no stay anchor of the radar mast stands in water on '+islands+' islands ('+moved+' had the station moved off the shore'+(bad.length?'; wet: '+bad.join(' '):'')+')');}

// ---- 4. every radio mast can be reached from Birka alone through the chain (issue 162)
{const reach=G=>{G.netAll=false;G.masts=[];for(const r of G.relays)r.captured=false;const left=G.structs.filter(s=>s.kind==='mast');
    for(let more=true;more;){more=false;for(const m of left.slice())if(B.inNet(m.x,m.y)){G.masts.push({x:m.x,y:m.y,id:m.id});left.splice(left.indexOf(m),1);more=true;}}return left.map(m=>m.id);};
  let tot=0,str=[],bridged=0,dropped=0,ids=true;
  for(const seed of[1364,2547,4806,5491,5080,5354,4943,2169]){B.newGame(seed);const G=B.G;tot+=G.structs.filter(s=>s.kind==='mast').length;bridged+=B.WORLD.mastsBridged;dropped+=B.WORLD.mastsDropped;
    const l=reach(G);if(l.length)str.push(seed+':'+l.join(','));const idl=G.structs.map(s=>s.id);if(new Set(idl).size!==idl.length)ids=false;}
  ok(str.length===0,'from Birka alone every mast is reached on 8 islands ('+tot+' masts, '+bridged+' bridge masts added)'+(str.length?', stranded: '+str.join(' '):''));
  ok(dropped<=4,'at most a handful of masts had to be dropped, where no chain reaches the zone ('+dropped+' on 8 islands)');ok(ids,'the structures keep unique numbers');}

// ---- 5. the harbour does not stand against a wall (issue 200, ö 3410: the pier ended in a rock wall 16 m high)
{const K=B.KAJ,Wl=B.HARB_WALL,wallOf=seed=>{B.newGame(seed);const W=B.WORLD,H=W.V.harbor,ux=-H.nx,uy=-H.ny;let e=0;
    for(const li of Wl.li)for(const d of Wl.past)for(const lt of[K.p1+d,K.lt0-d])e=Math.max(e,B.heightAt(H.x+ux*li-uy*lt,H.y+uy*li+ux*lt));return{e,valid:W.valid,tries:W.tries};};
  const res=[3410,1684,8604,40300,2024].map(sd=>[sd,wallOf(sd)]);
  ok(res.every(([sd,r])=>r.e<=Wl.h+.6),'the ground within '+Wl.li[Wl.li.length-1]+' m of the quay and '+Wl.past[Wl.past.length-1]+' m past its ends is at most '+Wl.h+' m on 3410, 1684, 8604, 40300 and 2024 ('+res.map(([sd,r])=>sd+': '+r.e.toFixed(1)).join(', ')+'; before 16.3, 17.5, 19.5, 11.7, 4.9)');
  ok(res.every(([,r])=>r.valid!==false),'and all five islands are still valid worlds');}

console.log(fail?fail+' failed':'all passed');process.exit(fail?1:0);
