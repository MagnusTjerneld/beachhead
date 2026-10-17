// Renders the boundary test bench: one overview, then per type a game-height view, a mid view and an eye-level view.
//   node proto/avskiljare.js [ut.jpg]   (cirka 15 s)
const fs=require('fs'),path=require('path'),{execSync}=require('child_process');
const {chromium}=require(execSync('npm root -g').toString().trim()+'/playwright');
const three=process.env.THREE_JS||path.join(__dirname,'..','tests','node_modules','three','build','three.min.js'),out=process.argv[2]||'avskiljare.jpg';
const TW=640,TH=380;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const p=await b.newPage({viewport:{width:TW*3,height:TH*8}});p.on('pageerror',e=>console.log('ERR',e.message));p.on('console',m=>console.log('LOG',m.text()));
  await p.route('**/*',r=>{const u=r.request().url();if(u.includes('three.min.js'))return r.fulfill({path:three,contentType:'text/javascript'});if(u.startsWith('file:'))return r.continue();r.abort();});
  await p.goto('file://'+path.join(__dirname,'avskiljare.html')+'?w='+TW+'&h='+TH);await p.waitForFunction(()=>window.ready,null,{timeout:120000});
  const rows=await p.evaluate(()=>{const T=window.TYPES,o=[];
    const zc=(T.length-1)*55/2;o.push({label:'Översikt från drönarhöjd',shots:[[[150,130,-70],[0,0,zc*.8],260,50],[[20,230,zc-170],[0,0,zc],260,50],[[110,45,-40],[-10,0,zc*.7],260,50]]});
    for(const t of T){const y=window.hAt(0,t.z)+1;const hill=t.k==='holme'||t.k==='rygg',hy=window.hAt(0,t.z);o.push({label:t.n,shots:[[[60,60,t.z-60],[0,0,t.z],140,50],[[24,9+hy*.6,t.z-24],[0,y,t.z],60,55],hill?[[14,hy*.5+3,t.z-30],[0,hy*.6,t.z],60,60]:[[6,1.7,t.z-7],[-4,y,t.z],40,60]]});}
    return o;});
  const imgs=[];for(const r of rows){const row=[];for(const s of r.shots){row.push(await p.evaluate(s=>window.shot(...s),s));process.stdout.write('.');}imgs.push({label:r.label,row});}
  const jpg=await p.evaluate(async({imgs,TW,TH})=>{const c=document.createElement('canvas');c.width=TW*3;c.height=TH*imgs.length;const g=c.getContext('2d');
    const ld=src=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=src;});
    for(let y=0;y<imgs.length;y++){for(let x=0;x<3;x++){g.drawImage(await ld(imgs[y].row[x]),x*TW,y*TH);}
      g.font='bold 22px sans-serif';const t=imgs[y].label,w=g.measureText(t).width;g.fillStyle='rgba(0,0,0,.55)';g.fillRect(8,y*TH+8,w+16,32);g.fillStyle='#fff';g.fillText(t,16,y*TH+32);}
    return c.toDataURL('image/jpeg',.88);},{imgs,TW,TH});
  fs.writeFileSync(out,Buffer.from(jpg.split(',')[1],'base64'));console.log('\n'+out);await b.close();})();
