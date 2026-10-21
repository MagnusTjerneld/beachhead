// The poster (21 okt, Magnus chose it): a drone shot from the forest on the island out over the lighthouse and the sea, every unit in
// the picture (three VARG on their way in to the point, KROK with BÄVER in the hook, two HÖK, GETING by the shore, MUS on the rock by
// the lighthouse) and Birka in the roads with the other islands behind, in portrait 2:3 with the logo, the line and the copyright.
// It is staged in the trailer's film mode (?trailer, island 7341) with the film's own actors and effects: a scene takes the place of a
// shot's script, the film is stepped up to the moment on its own clock and the frame is rendered and composed with the logo.
// The lighthouse stands where the game has it, on the point (the trailer moves it up the height), and Birka is brought in to 520 m.
//   node tests/poster.js [ut.jpg] [--bredd 2400] [--utan-logga]
//   node tests/poster.js ut.jpg --scener egna.js [--bara namn,namn]   your own scenes: module.exports=[{namn, host (a shot id, for its
//       lighting and set dressing), tau (seconds into the shot), steg (seconds stepped before it, for effects), kod}], where kod is the
//       body of a shot script f(tau,dur,dtr,S) with the film's helpers (__FILM.fx) and the poster's own below in scope; several
//       scenes give ut_<namn>.jpg
// A few seconds a picture on a graphics card. three.js r128 comes from tests/node_modules/three (npm install in tests) or THREE_JS.
const fs=require('fs'),path=require('path'),{execSync}=require('child_process');
const {chromium}=require(execSync('npm root -g').toString().trim()+'/playwright');
const argv=process.argv.slice(2),opt={},pos=[];for(let i=0;i<argv.length;i++){if(argv[i].startsWith('--')){const k=argv[i].slice(2);opt[k]=(argv[i+1]&&!argv[i+1].startsWith('--'))?argv[++i]:true;}else pos.push(argv[i]);}
const out=pos[0]||'poster.jpg',W=+(opt.bredd||2400),H=Math.round(W*1.5),bara=opt.bara?opt.bara.split(','):null;
const three=process.env.THREE_JS||path.join(__dirname,'node_modules','three','build','three.min.js');
if(!fs.existsSync(three)){console.error('three.min.js saknas: kör npm install i tests eller sätt THREE_JS');process.exit(1);}
// the poster's helpers. shoot() sets the camera; gnd(sx,f) is the ground point f m ahead at screen x sx (-1 to 1); ray(sx,sy,d) the point
// d m out along the ray through (sx,sy). Headings are relative to the camera: 0 away from it, PI toward it. from() stands the camera at a
// bearing and distance from the lighthouse, which is put back on the point.
const HELP=`
const L=WORLD.decor.light;{const g=R3.lighthouse;g.position.set(L.x,L.h,L.y);if(R3.lhBeam){R3.lhBeam.beam.position.set(L.x,L.h+14.4,L.y);R3.lhBeam.flare.position.copy(R3.lhBeam.beam.position);}}
const shoot=(cx,cz,h,yaw,pitch,fov)=>{const y=fGround(cx,cz)+h,l={x:cx+Math.cos(yaw)*100,z:cz+Math.sin(yaw)*100};fCam(cx,y,cz,l.x,y+Math.tan(pitch)*100,l.z,0);FILM.fov=fov;
  const c=R3.cam;c.fov=fov;c.updateProjectionMatrix();c.updateMatrixWorld();const t=Math.tan(fov*PI/360)*c.aspect,fx=Math.cos(yaw),fz=Math.sin(yaw);
  return{yaw,ray:(sx,sy,d)=>{const v=new THREE.Vector3(sx,sy,.5).unproject(c).sub(c.position).normalize();return{x:c.position.x+v.x*d,y:c.position.y+v.y*d,z:c.position.z+v.z*d};},
    gnd:(sx,f)=>{const l=sx*f*t;return{x:cx+fx*f-fz*l,z:cz+fz*f+fx*l};}};};
const from=(az,d,h,pitch,fov,yo)=>{const a=az*PI/180;return shoot(L.x+Math.cos(a)*d,L.y+Math.sin(a)*d,h,a+PI+(yo||0),pitch,fov);};
const varg=(K,n,sx,f,rel)=>{const q=K.gnd(sx,f),hd=K.yaw+rel,m=fVarg(n),gy=groundY(q.x,q.z);if(m.userData.tur)m.userData.tur.rotation.y=0;
  if(gy<.3){m.position.set(q.x,0,q.z);m.rotation.set(0,-hd,0);fVargWater(m,dtr,FILM.t,n,170);}else{fPlace(m,q.x,q.z,hd,HOVER_Y);if(gy<1.5)vargSpray(q.x,q.z,14,dtr*2.2);else if(Math.random()<dtr*30)fxDust(q.x-Math.cos(hd)*3,gy,q.z-Math.sin(hd)*3,1.4);}return m;};
const air=(K,key,kind,sx,sy,d,rel,pitch,roll,col)=>{const q=K.ray(sx,sy,d),m=fUnit(key,kind,col);m.position.set(q.x,q.y,q.z);m.rotation.set(roll||0,-(K.yaw+rel),pitch||0);return m;};
const krok=(K,sx,sy,d,rel,legs)=>{const q=K.ray(sx,sy,d),hd=K.yaw+rel,km=fA('krok',()=>mkUnitMesh({kind:'krok'})),bm=fUnit('bav','eng');km.position.set(q.x,q.y,q.z);km.rotation.set(.02,-hd,-.06);
  km.userData.cable.visible=true;km.userData.hook.visible=true;krokLegs(km.userData,legs||0);bm.position.set(q.x,q.y-8,q.z);bm.rotation.set(0,-hd-.15,.03);return km;};
const mus=(K,sx,f,rel)=>{const q=K.gnd(sx,f),hd=K.yaw+rel,m=fUnit('mus','mus');fPlace(m,q.x,q.z,hd,0);if(Math.random()<dtr*40)fxDust(q.x-Math.cos(hd),fGround(q.x,q.z),q.z-Math.sin(hd),.6);return m;};
`;
const POSTER=[{namn:'fyren',host:'lyft',tau:1.5,steg:1.5,kod:`
  FILM.tod=17.2;FILM.sunEl=.24;
  const a0=75*PI/180;filmBirka({x:L.x+Math.cos(a0)*520,y:L.y+Math.sin(a0)*520,a:a0+PI/2});
  const K=from(255,130,70,-.3,58,.05);
  mus(K,.18,108,PI-.5);
  varg(K,0,-.28,150,PI+.25);varg(K,1,.3,168,PI-.15);varg(K,2,.02,190,PI);
  krok(K,.35,.05,95,PI-.5);
  air(K,'hok1','drone',-.42,.02,52,PI+.4,-.05,-.4);air(K,'hok2','drone',-.18,.12,66,PI+.4,-.05,-.4,PAL[3][0]);
  air(K,'geting','scout',.5,-.35,30,PI-.8,.05,.1);
`}];
const scener=(opt.scener?require(path.resolve(opt.scener)):POSTER).filter(s=>!bara||bara.includes(s.namn));
// in the cloud: its own Chromium on swiftshader; on a desktop the graphics card (swiftshader loses the WebGL context there)
const cloud=fs.existsSync('/opt/pw-browsers/chromium');
(async()=>{const b=await chromium.launch({executablePath:cloud?'/opt/pw-browsers/chromium':undefined,args:['--no-sandbox','--ignore-gpu-blocklist',...(cloud?['--use-gl=swiftshader','--enable-unsafe-swiftshader']:['--enable-gpu'])]});
  const p=await b.newPage({viewport:{width:Math.min(W,1600),height:Math.min(H,2400)}});p.on('pageerror',e=>console.log('ERR',e.message));
  await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith('file:'))return r.continue();if(u.includes('three.min.js'))return r.fulfill({path:three,contentType:'text/javascript'});r.abort();});
  await p.goto(require('url').pathToFileURL(path.join(__dirname,'..','index.html')).href+'?trailer',{waitUntil:'commit',timeout:120000});
  await p.waitForFunction(()=>globalThis.__FILM&&__FILM.R3()&&__BH&&__BH.G&&__BH.G.seed,null,{timeout:200000,polling:500});
  for(const s of scener){
    const url=await p.evaluate(([s,help,W,H,logga])=>{const F=__FILM,FILM=F.FILM,X=F.fx();FILM.state='export';FILM.tod=null;
      const i=F.SHOTS.findIndex(q=>q.id===s.host);if(i<0)throw new Error('ingen bild '+s.host);const f0=F.SHOTS[i].f;
      F.SHOTS[i].f=new Function('X','return function(tau,dur,dtr,S){with(X){'+help+s.kod+'}}')(X);
      const R=F.R3().renderer;R.setPixelRatio(1);R.setSize(W,H,false);const c=F.R3().cam;c.aspect=W/H;c.updateProjectionMatrix();
      try{F.seed(FILM.seed);const t=F.shotT(i)+s.tau;F.seek(Math.max(0,t-(s.steg??2)));const dt=1/30;while(FILM.t+dt<t){FILM.t+=dt;F.step(dt);}FILM.t=t;F.frame(1/60);}
      finally{F.SHOTS[i].f=f0;FILM.tod=null;}
      const cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');x.drawImage(R.domElement,0,0,W,H);
      if(logga){// a darker tone at the top and bottom under the text
        let g=x.createLinearGradient(0,0,0,H*.3);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,W,H*.3);
        g=x.createLinearGradient(0,H*.8,0,H);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.7)');x.fillStyle=g;x.fillRect(0,H*.8,W,H*.2);
        X.drawLogo(99);const lg=document.getElementById('logo'),lw=W*.86,lh=lg.height*lw/lg.width;
        x.save();x.imageSmoothingEnabled=false;x.shadowColor='rgba(0,0,0,.5)';x.shadowBlur=20*W/1080;x.shadowOffsetY=8*W/1080;x.drawImage(lg,(W-lw)/2,H*.045,lw,lh);x.restore();
        const k=W/1080,line=(t,fs,y,col,ls)=>{x.font=fs+'px "Share Tech Mono",ui-monospace,Menlo,monospace';x.textBaseline='top';let tw=-ls;for(const ch of t)tw+=x.measureText(ch).width+ls;let cx=(W-tw)/2;
          x.fillStyle=col;x.shadowColor='rgba(0,0,0,.8)';x.shadowBlur=4*k;for(const ch of t){x.fillText(ch,cx,y);cx+=x.measureText(ch).width+ls;}x.shadowBlur=0;};
        line('FRIGÖR SKÄRGÅRDEN, EN Ö I TAGET.',Math.round(30*k),H*.915,'#eef1ea',Math.round(9*k));line('© 2026 MAGNUS TJERNELD',Math.round(17*k),H*.955,'rgba(238,241,234,.7)',Math.round(4*k));}
      return cv.toDataURL('image/jpeg',.92);},[s,HELP,W,H,!opt['utan-logga']]);
    const f=scener.length>1?out.replace(/(\.jpe?g)?$/i,'_'+s.namn+'.jpg'):out;fs.writeFileSync(f,Buffer.from(url.split(',')[1],'base64'));console.log(f);}
  await b.close();})();
