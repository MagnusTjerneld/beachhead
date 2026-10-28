// Efterbehandling (prototyp, grenen claude/efterbehandling): samma fyra vyer (dag, kväll mot solen, natt, explosion i skymning) utan och med tonkurva, bloom och färgton, och bildtiden per variant.
//   node proto/efter.js ut.jpg [seed]   (på datorn med grafikkortet, under en minut)
const fs=require('fs'),path=require('path'),{execSync}=require('child_process');
const {chromium}=require(execSync('npm root -g').toString().trim()+'/playwright');
const REPO=path.join(__dirname,'..'),out=process.argv[2]||'efter.jpg',seed=process.argv[3]||'1234';
const three=path.join(REPO,'tests','node_modules','three','build','three.min.js');
const VAR=[['förut','',1,.7],['knee','knee',1,.7],['bloom tröskel 2','knee,bloom',2,.5],['bloom tröskel 3','knee,bloom',3,.6],['tröskel 3 + grade','knee,bloom,grade',3,.6]];
const low={cam:{rel:true,x:-120,z:60},camUp:35,look:{rel:true,x:150,z:-120},lookUp:5,moln:20,fyrar:true};
const SC=[['dag',{...low,doy:180,tod:13}],['kväll mot solen',{...low,doy:180,tod:21.3,cam:{rel:true,x:-60,z:60},look:{rel:true,x:200,z:-200}}],['natt',{...low,doy:258,tod:22.5}],['explosion i skymning',{...low,doy:258,tod:19.6,boom:true}]];
(async()=>{const b=await chromium.launch({args:['--no-sandbox','--ignore-gpu-blocklist','--enable-gpu']});
  const p=await b.newPage({viewport:{width:1600,height:900}});p.on('pageerror',e=>console.log('ERR',e.message));p.on('console',m=>{if(m.type()==='error')console.log('CON',m.text().slice(0,200));});
  await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith('file:'))return r.continue();if(u.includes('three.min.js'))return r.fulfill({path:three,contentType:'text/javascript'});r.abort();});
  await p.goto(require('url').pathToFileURL(path.join(REPO,'index.html')).href+'?seed='+seed+'&nointro',{waitUntil:'commit',timeout:120000});
  await p.waitForFunction(()=>globalThis.__BHstill&&globalThis.__BH&&__BH.G&&__BH.G.seed&&globalThis.__boot&&__boot.warm,null,{timeout:90000,polling:500});
  await p.evaluate(o=>__BHstill(o),SC[0][1]);
  const imgs=[],labels=[];
  for(const[sl,so]of SC){for(const[vl,vq,th,st]of VAR){
    const im=await p.evaluate(([o,q,th,st])=>{const B=__BH;B.EFTER.set(q);B.EFTER.th=th;B.EFTER.str=st;if(o.boom){const L=B.LANDING;const x=L.x+70,z=L.y-60,y=Math.max(0,B.groundY(x,z));B.fxBoom(x,y,z,1.5);B.fxFire&&B.fxFire(x+8,y,z+5,1);}return __BHstill(o);},[so,vq,th,st]);
    imgs.push(im);labels.push(sl+' · '+vl);process.stdout.write('.');}}
  // frame time: 40 frames per variant, each forced to finish by reading a pixel back
  const tm=await p.evaluate(VAR=>{const B=__BH,R3=B.R3,r=R3.renderer,gl=r.getContext(),px=new Uint8Array(4),o={};
    for(const[vl,vq]of VAR){B.EFTER.set(vq);for(let k=0;k<5;k++)__BHstill({cam:{rel:true,x:-120,z:60},look:{rel:true,x:150,z:-120}});const t0=performance.now();
      for(let k=0;k<40;k++){__BHstill({cam:{rel:true,x:-120,z:60},look:{rel:true,x:150,z:-120},q:.1});gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);}o[vl]=+((performance.now()-t0)/40).toFixed(1);}
    const s=new THREE.Vector2();r.getDrawingBufferSize(s);o.size=s.x+'x'+s.y;return o;},VAR);
  console.log('\nms per bild (med toDataURL):',JSON.stringify(tm));
  const W=640,H=360,cols=VAR.length;const sheet=await p.evaluate(async([imgs,labels,W,H,cols])=>{const rows=Math.ceil(imgs.length/cols),c=document.createElement('canvas');c.width=W*cols;c.height=H*rows;const x=c.getContext('2d');
    for(let i=0;i<imgs.length;i++){const im=new Image();await new Promise(r=>{im.onload=r;im.src=imgs[i];});const k=Math.max(W/im.width,H/im.height),sw=W/k,sh=H/k;x.drawImage(im,(im.width-sw)/2,(im.height-sh)/2,sw,sh,(i%cols)*W,Math.floor(i/cols)*H,W,H);
      x.font='17px sans-serif';x.fillStyle='#ffd84a';x.fillText(labels[i],(i%cols)*W+8,Math.floor(i/cols)*H+22);}return c.toDataURL('image/jpeg',.88);},[imgs,labels,W,H,cols]);
  fs.writeFileSync(out,Buffer.from(sheet.split(',')[1],'base64'));console.log(out);await b.close();})();
