// GÄDDA in the game's own world (concept 25 okt): finds a real firing place on an island (navigable water, out of reach of every
// enemy that fires on the ground, a bunker within range), puts the model (proto/gadda.js) there with a MUS spotting the bunker, and
// renders five pictures with the game's __BHstill: along the coast, firing, from the shore, high over the bay, alongside Birka.
//   node proto/gaddaspel.js [ö] [ut-prefix] [--rack 180]   (cirka 20 s; lokalt grafikkortet)
const fs=require('fs'),path=require('path'),{execSync}=require('child_process');
const {chromium}=require(execSync('npm root -g').toString().trim()+'/playwright');
const three=process.env.THREE_JS||path.join(__dirname,'..','tests','node_modules','three','build','three.min.js');
const arg=process.argv.slice(2),seed=+(arg[0]||9052),pre=arg[1]||'gadda-spel',ri=arg.indexOf('--rack'),RACK=ri>=0?+arg[ri+1]:180;
const cloud=fs.existsSync('/opt/pw-browsers/chromium');
(async()=>{const b=await chromium.launch({executablePath:cloud?'/opt/pw-browsers/chromium':undefined,args:['--no-sandbox','--ignore-gpu-blocklist',...(cloud?['--use-gl=swiftshader','--enable-unsafe-swiftshader']:['--enable-gpu'])]});
  const p=await b.newPage({viewport:{width:1600,height:900}});p.on('pageerror',e=>console.log('ERR',e.message));
  await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith('file:'))return r.continue();if(u.includes('three.min.js'))return r.fulfill({path:three,contentType:'text/javascript'});r.abort();});
  await p.goto(require('url').pathToFileURL(path.join(__dirname,'..','index.html')).href+'?seed='+seed+'&doktrin=fastning&nointro&photo',{waitUntil:'commit',timeout:120000});
  await p.waitForFunction(()=>globalThis.__BHstill&&globalThis.__BH&&__BH.G&&__BH.G.seed&&globalThis.__boot&&__boot.warm,null,{timeout:200000,polling:500});
  await p.addScriptTag({path:path.join(__dirname,'gadda.js')});
  const plan=await p.evaluate(RACK=>{const B=__BH,G=B.G,W=B.W,g=W.baseGrid,GW=220,GH=220,C=10,N=GW*GH;
    const wet=new Uint8Array(N);for(let i=0;i<N;i++)wet[i]=g[i]===0||g[i]===1?1:0;
    const D=new Float32Array(N).fill(1e9),q=[];for(let i=0;i<N;i++)if(!wet[i]){D[i]=0;q.push(i);}
    for(let h=0;h<q.length;h++){const c=q[h],x=c%GW,y=(c/GW)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;const n=ny*GW+nx;if(D[n]>D[c]+1){D[n]=D[c]+1;q.push(n);}}}
    const nav=new Uint8Array(N),st=[];for(let x=0;x<GW;x++)for(const y of[0,GH-1]){const i=y*GW+x;if(wet[i]&&D[i]>=2){nav[i]=1;st.push(i);}}
    while(st.length){const c=st.pop(),x=c%GW,y=(c/GW)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;const n=ny*GW+nx;if(!nav[n]&&wet[n]&&D[n]>=2){nav[n]=1;st.push(n);}}}
    const sh=G.enemies.filter(e=>!e.dead&&e.canGround!==false&&(e.range||0)>0),safe=(x,y)=>!sh.some(e=>Math.hypot(e.x-x,e.y-y)<=(e.range||140)+10);
    let best=null;for(const e of G.enemies){if(e.dead||e.kind!=='turret')continue;
      for(let i=0;i<N;i++){if(!nav[i]||D[i]<4||D[i]>8)continue;const x=(i%GW+.5)*C,y=(((i/GW)|0)+.5)*C,d=Math.hypot(x-e.x,y-e.y);if(d>RACK||d<RACK-40||!safe(x,y))continue;
        const sc=D[i]===5?0:Math.abs(D[i]-5)*10+Math.abs(d-(RACK-15));if(!best||sc<best.sc)best={sc,e,x,y,d};}}
    if(!best)return null;
    // the shore's way: the boat lies along it, broadside to the bunker
    const T=best.e,ax=T.x-best.x,ay=T.y-best.y,al=Math.hypot(ax,ay),ux=ax/al,uy=ay/al;let hx=-uy,hy=ux;
    const boat=mkGadda(THREE,{color:0x2fb3a8,lift:0,robots:4});boat.position.set(best.x,0,best.y);boat.rotation.y=-Math.atan2(hy,hx);B.R3.scene.add(boat);
    // a simple wake behind it
    const wk=new THREE.Mesh(new THREE.PlaneGeometry(18,1.8),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.45,depthWrite:false}));wk.rotation.x=-Math.PI/2;wk.rotation.z=Math.atan2(hy,hx);
    wk.position.set(best.x-hx*13,.05,best.y-hy*13);wk.visible=false;
    // the bunker is known (seen by a MUS 50 m off it, on the side towards the sea)
    T.seen=true;T.lx=T.x;T.ly=T.y;T.stale=null;const mus=B.makeUnit('mus',T.x-ux*50,T.y-uy*50);G.units.push(mus);
    window.__G={x:best.x,y:best.y,hx,hy,ux,uy,tx:T.x,ty:T.y,d:best.d,boat,wk};
    return{x:Math.round(best.x),y:Math.round(best.y),d:Math.round(best.d),t:[Math.round(T.x),Math.round(T.y)],skyttar:sh.length};},RACK);
  if(!plan){console.log('ingen skjutplats på ö '+seed);await b.close();return;}
  console.log('ö',seed,'skjutplats',plan);
  const shots=[['kusten',{}],['skjuter',{lift:1,robots:3,robot:.1}],['land',{}],['hogt',{}],['birka',{birka:true}]];
  for(const[k,s]of shots){const d=await p.evaluate(([k,s])=>{const B=__BH,G=B.G,Q=window.__G,SP=(lat,fwd)=>{const C=B.CARRIER,fx=Math.cos(C.a),fy=Math.sin(C.a);return[C.x-fy*lat+fx*fwd,C.y+fx*lat+fy*fwd];},gy=(x,y)=>Math.max(0,(B.heightAt||(()=>8))(x,y)),sideX=-Q.ux,sideY=-Q.uy;
      // rebuild the boat in the state of the picture
      B.R3.scene.remove(Q.boat);Q.boat=mkGadda(THREE,{color:0x2fb3a8,lift:s.lift||0,robots:s.robots==null?4:s.robots});Q.boat.rotation.y=-Math.atan2(Q.hy,Q.hx);Q.boat.position.set(Q.x,0,Q.y);
      if(s.birka){const p=SP(-24,-10),a=B.CARRIER.a;Q.boat.position.set(p[0],0,p[1]);Q.boat.rotation.y=-(a+Math.PI);}
      B.R3.scene.add(Q.boat);if(Q.rob){B.R3.scene.remove(Q.rob);Q.rob=null;}
      if(s.robot){const t=s.robot,x=Q.x+(Q.tx-Q.x)*t,y=Q.y+(Q.ty-Q.y)*t,h=3+Math.sin(t*Math.PI)*45,r=new THREE.Group(),m=mkGaddaRobot(THREE,0x2fb3a8);
        m.rotation.z=-1.05;const yaw=new THREE.Group();yaw.rotation.y=-Math.atan2(Q.uy,Q.ux);yaw.add(m);r.add(yaw);r.position.set(x,h,y);
        const fl=new THREE.Mesh(new THREE.ConeGeometry(.2,1.4,8),new THREE.MeshBasicMaterial({color:0xffd28a}));fl.position.set(0,-1.3,0);fl.rotation.z=Math.PI;m.add(fl);
        for(let i=0;i<16;i++){const k=t*(1-i*.065);if(k<0)break;const sx=Q.x+(Q.tx-Q.x)*k,sy=Q.y+(Q.ty-Q.y)*k,sh=3+Math.sin(k*Math.PI)*45;
          const sm=new THREE.Mesh(new THREE.SphereGeometry(.6+i*.12,8,6),new THREE.MeshLambertMaterial({color:0xe8e8e2,transparent:true,opacity:Math.max(.1,.6-i*.035),depthWrite:false}));sm.position.set(sx-x,sh-h,sy-y);r.add(sm);}
        B.R3.scene.add(r);Q.rob=r;}
      let cam,look;
      if(k==='kusten'){cam={x:Q.x-Q.hx*13+sideX*6,y:3.2,z:Q.y-Q.hy*13+sideY*6};look={x:Q.x+Q.hx*30+Q.ux*14,y:3,z:Q.y+Q.hy*30+Q.uy*14};}
      else if(k==='skjuter'){cam={x:Q.x-Q.ux*16+Q.hx*9,y:5,z:Q.y-Q.uy*16+Q.hy*9};look={x:Q.x+Q.ux*30,y:12,z:Q.y+Q.uy*30};}
      else if(k==='land'){const lx=Q.x+Q.ux*55-Q.hx*20,ly=Q.y+Q.uy*55-Q.hy*20;cam={x:lx,y:gy(lx,ly)+14,z:ly};look={x:Q.x-Q.ux*10,y:1,z:Q.y-Q.uy*10};}
      else if(k==='hogt'){cam={x:Q.x-Q.ux*150+Q.hx*60,y:120,z:Q.y-Q.uy*150+Q.hy*60};look={x:(Q.x+Q.tx)/2,y:0,z:(Q.y+Q.ty)/2};}
      else{const c=SP(-50,-40),l=SP(-22,-8);cam={x:c[0],y:6,z:c[1]};look={x:l[0],y:4,z:l[1]};}
      return globalThis.__BHstill({cam,look,doy:190,tod:16.5,moln:25,photo:true});},[k,s]);
    const f=pre+'-'+k+'.jpg';fs.writeFileSync(f,Buffer.from(d.split(',')[1],'base64'));console.log(f);}
  await b.close();})();
