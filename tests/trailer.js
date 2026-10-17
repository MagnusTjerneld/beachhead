// Trailer stills (17 okt): renders pictures of the trailer in headless Chromium, a few per shot, and puts them together into one contact
// sheet. Each picture is reached by stepping the film from the start of its shot on the film's own clock (the same steps as the video
// export, filmFrame), so the effects and the actors are where they would be; the last step is rendered and composed with the chart,
// the logo and the fades. About a second a picture.
//   node tests/trailer.js [ut.jpg] [--skott id,id] [--andel .3,.75] [--tid 12.5,30] [--bredd 640]
//   --skott  only these shots (their ids in FILM_SHOTS, or their numbers from 1)
//   --andel  where in each shot, as a share of its length (default .3 and .8)
//   --tid    film times in seconds instead of shots
// three.js r128 comes from tests/node_modules/three (npm install in tests) or the path in THREE_JS.
const fs=require('fs'),path=require('path'),{execSync}=require('child_process');
const {chromium}=require(execSync('npm root -g').toString().trim()+'/playwright');
const argv=process.argv.slice(2),opt={},pos=[];for(let i=0;i<argv.length;i++){if(argv[i].startsWith('--'))opt[argv[i].slice(2)]=argv[++i];else pos.push(argv[i]);}
const out=pos[0]||'trailer.jpg',W=+(opt.bredd||640),H=Math.round(W*9/16),cols=+(opt.kol||4);
const three=process.env.THREE_JS||path.join(__dirname,'node_modules','three','build','three.min.js');
if(!fs.existsSync(three)){console.error('three.min.js saknas: kör npm install i tests eller sätt THREE_JS');process.exit(1);}
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
  const p=await b.newPage({viewport:{width:W,height:H}});p.on('pageerror',e=>console.log('ERR',e.message));
  await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith('file:'))return r.continue();if(u.includes('three.min.js'))return r.fulfill({path:three,contentType:'text/javascript'});r.abort();});
  await p.goto('file://'+path.join(__dirname,'..','index.html')+'?trailer',{waitUntil:'commit',timeout:120000});
  await p.waitForFunction(()=>globalThis.__FILM&&__FILM.R3()&&__BH&&__BH.G&&__BH.G.seed,null,{timeout:200000,polling:500});
  // the list of pictures: [film time, label]
  const shots=await p.evaluate(()=>__FILM.SHOTS.map((S,i)=>({id:S.id,t0:__FILM.shotT(i),t1:i<__FILM.SHOTS.length-1?__FILM.shotT(i+1):__FILM.END})));
  let list=[];
  if(opt.tid)list=opt.tid.split(',').map(Number).map(t=>{const i=shots.findIndex((s,k)=>t>=s.t0&&t<s.t1);return[t,(i+1)+' '+(shots[i]||{}).id+' '+t.toFixed(1)+' s',i];});
  else{const want=opt.skott?opt.skott.split(','):null,fr=(opt.andel||'.3,.8').split(',').map(Number);
    shots.forEach((s,i)=>{if(want&&!want.includes(s.id)&&!want.includes(String(i+1)))return;for(const f of fr){const t=s.t0+(s.t1-s.t0)*f;list.push([t,(i+1)+' '+s.id+' '+(f*100|0)+' %',i]);}});}
  const imgs=[];
  for(const [t,label,i] of list){imgs.push(await p.evaluate(([t,t0,W,H])=>{const F=__FILM,FILM=F.FILM;FILM.state='export';
      const R=F.R3().renderer;R.setPixelRatio(1);R.setSize(W,H,false);const c=F.R3().cam;c.aspect=W/H;c.updateProjectionMatrix();
      F.seed(FILM.seed);F.seek(Math.max(0,t0-.5));const dt=1/15;while(FILM.t+dt<t){FILM.t+=dt;F.step(dt);}FILM.t=t;F.frame(1/60);
      const cv=document.createElement('canvas');cv.width=W;cv.height=H;F.compose(cv.getContext('2d'),W,H);return cv.toDataURL('image/jpeg',.88);},[t,shots[i]?shots[i].t0:t,W,H]));process.stdout.write('.');}
  const sheet=await p.evaluate(async([imgs,labels,W,H,cols])=>{const rows=Math.ceil(imgs.length/cols),c=document.createElement('canvas');c.width=W*cols;c.height=H*rows;const x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,c.width,c.height);
    for(let i=0;i<imgs.length;i++){const im=new Image();await new Promise(r=>{im.onload=r;im.src=imgs[i];});x.drawImage(im,(i%cols)*W,Math.floor(i/cols)*H,W,H);x.font='14px sans-serif';x.fillStyle='#ffd84a';x.fillText(labels[i]||'',(i%cols)*W+6,Math.floor(i/cols)*H+17);}
    return c.toDataURL('image/jpeg',.86);},[imgs,list.map(l=>l[1]),W,H,Math.min(cols,imgs.length)]);
  fs.writeFileSync(out,Buffer.from(sheet.split(',')[1],'base64'));console.log('\n'+out);await b.close();})();
