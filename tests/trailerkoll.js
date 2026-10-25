// Trailer check (17 okt): steps every shot of the trailer on the film's own clock without rendering, and flags what a viewer would see
// go wrong: an actor on the ground that drives through a tree, a block or a wall, a house, a wreck or into the water, a camera inside a
// tree's crown, and a view from the camera to what it looks at (R3.lookAt) that is blocked by the ground or by crowns. Things the film
// clears away (filmClearAt) do not count. Only actors in the picture are checked. A few seconds; not in run.js.
//   node tests/trailerkoll.js [--skott id,id] [--karta ut.png] [--omr x0,z0,x1,z1] [--alla]
//   --karta  also a chart from above: the ground, the obstacles (cleared ones hollow), each shot's actors' tracks and its cameras
//   --omr    the chart's area in metres (default round the battle)
//   --alla   list every hit, not only the first per actor and obstacle
// Exit code 1 if anything was flagged.
const fs=require('fs'),path=require('path'),{execSync}=require('child_process');
const {chromium}=require(execSync('npm root -g').toString().trim()+'/playwright');
const argv=process.argv.slice(2),opt={};for(let i=0;i<argv.length;i++){if(argv[i].startsWith('--')){const k=argv[i].slice(2);opt[k]=argv[i+1]&&!argv[i+1].startsWith('--')?argv[++i]:true;}}
const three=process.env.THREE_JS||path.join(__dirname,'node_modules','three','build','three.min.js');
if(!fs.existsSync(three)){console.error('three.min.js saknas: kör npm install i tests eller sätt THREE_JS');process.exit(1);}
const cloud=fs.existsSync('/opt/pw-browsers/chromium');
(async()=>{const b=await chromium.launch({executablePath:cloud?'/opt/pw-browsers/chromium':undefined,args:['--no-sandbox','--ignore-gpu-blocklist',...(cloud?['--use-gl=swiftshader','--enable-unsafe-swiftshader']:['--enable-gpu'])]});
  const p=await b.newPage({viewport:{width:640,height:360}});p.on('pageerror',e=>console.log('ERR',e.message));
  await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith('file:'))return r.continue();if(u.includes('three.min.js'))return r.fulfill({path:three,contentType:'text/javascript'});r.abort();});
  await p.goto(require('url').pathToFileURL(path.join(__dirname,'..','index.html')).href+'?trailer',{waitUntil:'commit',timeout:120000});
  await p.waitForFunction(()=>globalThis.__FILM&&__FILM.R3()&&__FILM.W&&__BH&&__BH.G&&__BH.G.seed&&globalThis.__boot&&__boot.warm,null,{timeout:200000,polling:500});
  const res=await p.evaluate(([want,all,omr])=>{const F=__FILM,FILM=F.FILM,W=F.W(),G=F.G(),R3=F.R3(),gy=F.gy,hAt=F.hAt,clr=F.clearAt,cam=R3.cam,TH=THREE;
    // the obstacles: [x, z, radius, kind, top (m over the ground) or null]
    const OB=[],D=W.decor||{};
    for(const t of W.trees)OB.push({x:t.x,z:t.y,r:.5*t.s,k:'träd',tree:t});
    for(const q of W.ridgeStones||[])if(q.m||q.r>=.55)OB.push({x:q.x,z:q.y,r:q.r*.95,k:q.m?'mur':'block'});
    for(const q of W.bushes||[])if(q.s>=1.2)OB.push({x:q.x,z:q.y,r:q.s*.9,k:'buske'});
    for(const q of W.junipers||[])if(q.s>=1.1)OB.push({x:q.x,z:q.y,r:q.s*.4,k:'en'});
    for(const q of W.coastStones||[])if(q.r>=.6)OB.push({x:q.x,z:q.y,r:q.r,k:'strandsten'});
    for(const q of W.walls||[])OB.push({x:q.x,z:q.y,r:1.8,k:'boxmur'});
    for(const w of G.wrecks)OB.push({x:w.x,z:w.y,r:w.kind==='hulk'?4.6:w.kind==='crate'?1.2:2.5,k:'vrak ('+w.kind+')'});
    for(const q of W.structs||[])OB.push({x:q.x,z:q.y,r:7,k:'byggnad '+q.kind});
    for(const q of W.relays||[])OB.push({x:q.x,z:q.y,r:8,k:'punkt '+(q.type||'')});
    for(const q of D.villas||[])OB.push({x:q.x,z:q.y,r:6.5,k:'villa'});
    for(const q of D.cabins||[])OB.push({x:q.x,z:q.y,r:5,k:'stuga'});
    for(const q of D.sheds||[])OB.push({x:q.x,z:q.y,r:3.2,k:'bod'});
    if(D.light)OB.push({x:D.light.x,z:D.light.y,r:4,k:'fyr'});
    for(const o of OB)o.gone=o.k!=='mur'&&clr(o.x,o.z,o.r);/* the film leaves a wall's courses standing */
    const live=OB.filter(o=>!o.gone),trees=live.filter(o=>o.tree);
    // a coarse grid of the live obstacles for the lookups
    const GR=new Map(),gk=(i,j)=>i+','+j;for(const o of live){const k=gk(Math.floor(o.x/20),Math.floor(o.z/20));if(!GR.has(k))GR.set(k,[]);GR.get(k).push(o);}
    const near=(x,z,r)=>{const out=[];for(let i=Math.floor((x-r)/20);i<=Math.floor((x+r)/20);i++)for(let j=Math.floor((z-r)/20);j<=Math.floor((z+r)/20);j++)for(const o of GR.get(gk(i,j))||[])out.push(o);return out;};
    const crownAt=(x,y,z,pad)=>{for(const o of near(x,z,8)){if(!o.tree)continue;const s=o.tree.s,g=gy(o.x,o.z),rr=3*s+(pad||0);if((x-o.x)**2+(z-o.z)**2<rr*rr&&y>g+3*s&&y<g+13.5*s)return o;}return null;};
    // the actor's box in its own frame (nose +x), measured once
    const box=new TH.Box3(),BX=new Map();
    const boxOf=(key,m)=>{if(BX.has(key))return BX.get(key);const pp=m.position.clone(),rr=m.rotation.clone(),vis=m.visible;m.position.set(0,0,0);m.rotation.set(0,0,0);m.visible=true;m.updateMatrixWorld(true);box.setFromObject(m);
      const bb={x0:box.min.x,x1:box.max.x,z0:box.min.z,z1:box.max.z,h:box.max.y-box.min.y};m.position.copy(pp);m.rotation.copy(rr);m.visible=vis;m.updateMatrixWorld(true);BX.set(key,bb);return bb;};
    const fr=new TH.Frustum(),pm=new TH.Matrix4(),v3=new TH.Vector3();
    const out=[],tracks=[];let i0=0;
    FILM.state='export';F.seed(FILM.seed);
    for(let i=0;i<F.SHOTS.length;i++){const S=F.SHOTS[i];if(want&&!want.includes(S.id)&&!want.includes(String(i+1)))continue;
      const t0=F.shotT(i),t1=i<F.SHOTS.length-1?F.shotT(i+1):F.END,dt=1/15,hits=new Map(),sum={id:S.id,n:i+1,steps:0,crown:0,los:0,losWhy:{},hits:[]},tr={id:S.id,act:{},cams:[]};
      F.seek(t0);
      for(let t=t0;t<t1-1e-6;t+=dt){FILM.t=t;F.step(dt);sum.steps++;if(FILM.map)continue;
        cam.updateMatrixWorld(true);pm.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse);fr.setFromProjectionMatrix(pm);const tau=t-t0;
        const C=cam.position,L=R3.lookAt.clone();L.y=Math.max(L.y,gy(L.x,L.z)+1);tr.cams.push([C.x,C.z]);
        // the camera in a crown
        const cr=crownAt(C.x,C.y,C.z,.3);if(cr){sum.crown++;}
        // the view to the subject: the ground and the crowns between (the last 4 m, round the subject itself, are not counted)
        const dl=C.distanceTo(L);let why=null;for(let s=2;s<dl-4&&!why;s+=1.5){const f=s/dl,x=C.x+(L.x-C.x)*f,y=C.y+(L.y-C.y)*f,z=C.z+(L.z-C.z)*f;
          if(gy(x,z)>y+.2)why='terräng';else if(crownAt(x,y,z))why='trädkrona';}
        if(why){sum.los++;sum.losWhy[why]=(sum.losWhy[why]||0)+1;}
        // the actors on the ground in the picture
        const acts=[];for(const k in FILM.act){const m=FILM.act[k];if(m.visible)acts.push([k,m]);}
        if(FILM.useMovers)for(const m of R3.movers||[])if(m.varg)acts.push(['varg'+m.varg,m.g]);
        for(const [k,m] of acts){const x=m.position.x,z=m.position.z,g=F.fGround(x,z),air=m.position.y-g>3;if(air)continue;
          (tr.act[k]||(tr.act[k]=[])).push([x,z]);
          v3.set(x,m.position.y+1,z);if(!fr.containsPoint(v3)||C.distanceTo(v3)>320)continue;
          const bb=boxOf(k,m),hd=-m.rotation.y,c=Math.cos(hd),s=Math.sin(hd),wet=hAt(x,z)<0,floats=/^v\d|^varg/.test(k);
          if(wet&&!floats){const key=k+' vatten';if(!hits.has(key))hits.set(key,{k,what:'vatten',x,z,tau});}
          for(const o of near(x,z,14)){const dx=o.x-x,dz=o.z-z,u=dx*c+dz*s,w=-dx*s+dz*c;
            if(u>bb.x0-o.r*.8&&u<bb.x1+o.r*.8&&w>bb.z0-o.r*.8&&w<bb.z1+o.r*.8){const key=k+' '+o.k+' '+Math.round(o.x/10)+','+Math.round(o.z/10);
              if(!hits.has(key)||all)hits.set(all?key+tau:key,{k,what:o.k,x:o.x,z:o.z,tau});}}}}
      sum.hits=[...hits.values()].map(h=>({k:h.k,what:h.what,at:h.x.toFixed(0)+','+h.z.toFixed(0),tau:+h.tau.toFixed(2)}));out.push(sum);tracks.push(tr);}
    return{out,tracks,obs:OB.filter(o=>!o.tree||!o.gone).map(o=>[o.x,o.z,o.r,o.k,o.gone?1:0]),trees:OB.filter(o=>o.tree).map(o=>[o.x,o.z,o.tree.s,o.gone?1:0]),zones:FILM.zones};
  },[opt.skott?String(opt.skott).split(','):null,!!opt.alla,opt.omr]);
  let bad=0;
  for(const s of res.out){const crown=s.crown/s.steps,los=s.los/s.steps,lines=[];
    if(crown>.02)lines.push('kameran i en trädkrona '+(crown*100|0)+' % av tiden');
    if(los>.05)lines.push('sikten till motivet skymd '+(los*100|0)+' % ('+Object.entries(s.losWhy).map(([k,v])=>k+' '+(v/s.steps*100|0)+' %').join(', ')+')');
    for(const h of s.hits)lines.push(h.k+' genom '+h.what+' vid '+h.at+' ('+h.tau+' s in)');
    bad+=lines.length;console.log((lines.length?'FLAGGA ':'ok     ')+s.n+' '+s.id+(lines.length?'\n       '+lines.join('\n       '):''));}
  console.log(bad?bad+' flaggor':'inga flaggor');
  if(opt.karta){const [x0,z0,x1,z1]=(typeof opt.omr==='string'?opt.omr:'1180,560,1620,880').split(',').map(Number);
    const png=await p.evaluate(([res,x0,z0,x1,z1])=>{const F=__FILM,k=Math.min(4,2400/(x1-x0)),Wd=Math.round((x1-x0)*k),Hd=Math.round((z1-z0)*k),c=document.createElement('canvas');c.width=Wd;c.height=Hd+30;const x=c.getContext('2d');
      const im=x.createImageData(Wd,Hd);for(let j=0;j<Hd;j++)for(let i=0;i<Wd;i++){const wx=x0+i/k,wz=z0+j/k,h=F.hAt(wx,wz),o=(j*Wd+i)*4;
        if(h<0){im.data[o]=70;im.data[o+1]=110;im.data[o+2]=150;}else{const g=F.gy(wx,wz),sl=Math.min(1,Math.hypot(F.gy(wx+1,wz)-g,F.gy(wx,wz+1)-g)*1.2),v=200-Math.min(1,g/25)*60-sl*90;im.data[o]=v*.85;im.data[o+1]=v;im.data[o+2]=v*.7;}im.data[o+3]=255;}
      x.putImageData(im,0,0);const P=(a,b)=>[(a-x0)*k,(b-z0)*k];
      const Z=res.zones||{c:[],l:[]};x.strokeStyle='rgba(255,255,255,.7)';x.setLineDash([6,4]);for(const q of Z.c){const [a,b]=P(q[0],q[1]);x.beginPath();x.arc(a,b,q[2]*k,0,7);x.stroke();}
      for(const [a1,b1,a2,b2,w] of Z.l){const [p1,q1]=P(a1,b1),[p2,q2]=P(a2,b2);x.lineWidth=w*k;x.strokeStyle='rgba(255,255,255,.18)';x.setLineDash([]);x.beginPath();x.moveTo(p1,q1);x.lineTo(p2,q2);x.stroke();}x.lineWidth=1;x.setLineDash([]);
      for(const [a,b,s,gone] of res.trees){const [u,v]=P(a,b);x.beginPath();x.arc(u,v,Math.max(1.5,3*s*k*.5),0,7);if(gone){x.strokeStyle='rgba(30,80,30,.5)';x.stroke();}else{x.fillStyle='rgba(30,90,30,.75)';x.fill();}}
      const col={mur:'#222',block:'#777',buske:'#5a8a3a',en:'#2c4630',strandsten:'#888',boxmur:'#000'};
      for(const [a,b,r,kd,gone] of res.obs){const [u,v]=P(a,b);x.beginPath();x.arc(u,v,Math.max(1.5,r*k),0,7);const cc=col[kd]||(kd.startsWith('vrak')?'#7a4a22':'#c03020');if(gone){x.strokeStyle=cc;x.stroke();}else{x.fillStyle=cc;x.fill();}}
      const pal=['#ff2a8a','#00b4ff','#ffb000','#9b4dff','#00d080','#ff5a00','#0040ff','#e000e0'];x.font='bold 13px sans-serif';
      res.tracks.forEach((T,n)=>{const cl=pal[n%pal.length];x.strokeStyle=cl;x.fillStyle=cl;x.lineWidth=2;
        for(const k in T.act){const A=T.act[k];x.beginPath();A.forEach((q,i)=>{const [u,v]=P(q[0],q[1]);i?x.lineTo(u,v):x.moveTo(u,v);});x.stroke();const [u,v]=P(A[A.length-1][0],A[A.length-1][1]);x.fillText(T.id,u+3,v-3);}
        x.lineWidth=1;T.cams.forEach((q,i)=>{if(i%4)return;const [u,v]=P(q[0],q[1]);x.fillRect(u-1.5,v-1.5,3,3);});if(T.cams.length){const [u,v]=P(T.cams[0][0],T.cams[0][1]);x.fillText('▢'+T.id,u+3,v+12);}});
      x.fillStyle='#000';x.fillRect(0,Hd,Wd,30);x.fillStyle='#fff';x.font='13px sans-serif';x.fillText(x0+','+z0+' till '+x1+','+z1+' m · fylld = står kvar, ring = röjd · linjer = aktörer på marken, punkter = kameran, ▢ = kamerans start',8,Hd+20);
      return c.toDataURL('image/png');},[res,x0,z0,x1,z1]);
    fs.writeFileSync(opt.karta,Buffer.from(png.split(',')[1],'base64'));console.log(opt.karta);}
  await b.close();process.exit(bad?1:0);})();
