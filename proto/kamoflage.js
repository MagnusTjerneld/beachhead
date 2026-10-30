// renders proto/kamoflage.html: today's and the new command post and forward yard from three sides at ground level and from above
// at 120 m and 400 m, with their triangle counts, in one contact sheet (node proto/kamoflage.js [ut.jpg], some seconds)
const path=require('path'),fs=require('fs'),{execSync}=require('child_process');
const {chromium}=require(execSync('npm root -g').toString().trim()+'/playwright');
const out=process.argv[2]||path.join(__dirname,'kamoflage.jpg'),three=path.join(__dirname,'..','tests','node_modules','three','build','three.min.js');
const cloud=fs.existsSync('/opt/pw-browsers/chromium');
(async()=>{const b=await chromium.launch({executablePath:cloud?'/opt/pw-browsers/chromium':undefined,args:['--no-sandbox','--ignore-gpu-blocklist',...(cloud?['--use-gl=swiftshader','--enable-unsafe-swiftshader']:['--enable-gpu'])]});
  const p=await b.newPage({viewport:{width:800,height:600}});p.on('pageerror',e=>console.log('ERR',e.message));
  await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith('file:'))return r.continue();if(u.includes('three.min.js'))return r.fulfill({path:three,contentType:'text/javascript'});r.abort();});
  await p.goto(require('url').pathToFileURL(path.join(__dirname,'kamoflage.html')).href+'?bench');
  await p.waitForFunction(()=>globalThis.BENCH);
  /* [bearing, height, distance, aerial]: the ground views from the lane side, the back and the side, then two drone heights */
  const views=[[180,3,44,0],[300,3,44,0],[60,3,44,0],[230,120,0,1],[230,400,0,1]],W=480,H=320,rows=[];
  for(const[kind,name]of[['central','Ledningscentral'],['varv','Fältvarv']])for(const[ver,taken]of[['old',0],['new',0],['new',1]]){
    const n=await p.evaluate(([k,v,t])=>BENCH.show(k,v,t),[kind,ver,taken]);const imgs=[];
    for(const[a,h,d,ae]of views)imgs.push(await p.evaluate(([a,h,d,W,H,ae])=>BENCH.shoot(a,h,d,W,H,ae),[a,h,d,W,H,ae]));
    rows.push({label:name+', '+(ver==='old'?'i dag':taken?'ny, tagen (grön lampa, flagga, H)':'ny, otagen')+' · '+n+' trianglar · marknivå från tre håll, sedan 120 m och 400 m',imgs});console.log(kind,ver,n);}
  const jpg=await p.evaluate(async([rows,W,H,N])=>{const T=30,c=document.createElement('canvas');c.width=W*N;c.height=rows.length*(H+T);const x=c.getContext('2d');
    x.fillStyle='#10161d';x.fillRect(0,0,c.width,c.height);x.font='bold 18px system-ui,sans-serif';
    for(let r=0;r<rows.length;r++){x.fillStyle='#e8eef0';x.fillText(rows[r].label,10,r*(H+T)+21);
      for(let i=0;i<N;i++){const im=new Image();im.src=rows[r].imgs[i];await im.decode();x.drawImage(im,i*W,r*(H+T)+T);}}
    return c.toDataURL('image/jpeg',.88);},[rows,W,H,views.length]);
  fs.writeFileSync(out,Buffer.from(jpg.split(',')[1],'base64'));console.log('skrev',out);await b.close();})();
