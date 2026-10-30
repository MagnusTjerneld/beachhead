// renders proto/fiendefordon.html: the old and the new enemy tank and light armour from three sides, with their triangle counts,
// in one contact sheet (node proto/fiendefordon.js [ut.jpg], some seconds)
const path=require('path'),fs=require('fs'),{execSync}=require('child_process');
const {chromium}=require(execSync('npm root -g').toString().trim()+'/playwright');
const out=process.argv[2]||path.join(__dirname,'fiendefordon.jpg'),three=path.join(__dirname,'..','tests','node_modules','three','build','three.min.js');
const cloud=fs.existsSync('/opt/pw-browsers/chromium');
(async()=>{const b=await chromium.launch({executablePath:cloud?'/opt/pw-browsers/chromium':undefined,args:['--no-sandbox','--ignore-gpu-blocklist',...(cloud?['--use-gl=swiftshader','--enable-unsafe-swiftshader']:['--enable-gpu'])]});
  const p=await b.newPage({viewport:{width:800,height:600}});p.on('pageerror',e=>console.log('ERR',e.message));
  await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith('file:'))return r.continue();if(u.includes('three.min.js'))return r.fulfill({path:three,contentType:'text/javascript'});r.abort();});
  await p.goto(require('url').pathToFileURL(path.join(__dirname,'fiendefordon.html')).href+'?bench');
  await p.waitForFunction(()=>globalThis.BENCH);
  const views=[[35,4.5,13],[90,2,13.5],[215,8,13]],W=640,H=400,rows=[];
  for(const[kind,name]of[['tank','Stridsvagn'],['light','Lätt pansar']])for(const ver of['old','new']){
    const n=await p.evaluate(([k,v])=>BENCH.show(k,v),[kind,ver]);const imgs=[];if(ver==='new'){const l=await p.evaluate(()=>BENCH.loose());console.log(kind+': '+(l.length?l.length+' delar rör inget: '+l.join('; '):'alla delar sitter ihop'));}
    for(const[a,h,d]of views)imgs.push(await p.evaluate(([a,h,d,W,H])=>BENCH.shoot(a,h,d,W,H),[a,h,d,W,H]));
    rows.push({label:name+', '+(ver==='old'?'i dag':'skiss')+' · '+n+' trianglar',imgs});console.log(kind,ver,n);}
  const jpg=await p.evaluate(async([rows,W,H])=>{const T=30,c=document.createElement('canvas');c.width=W*3;c.height=rows.length*(H+T);const x=c.getContext('2d');
    x.fillStyle='#10161d';x.fillRect(0,0,c.width,c.height);x.font='bold 18px system-ui,sans-serif';
    for(let r=0;r<rows.length;r++){x.fillStyle='#e8eef0';x.fillText(rows[r].label,10,r*(H+T)+21);
      for(let i=0;i<3;i++){const im=new Image();im.src=rows[r].imgs[i];await im.decode();x.drawImage(im,i*W,r*(H+T)+T);}}
    return c.toDataURL('image/jpeg',.88);},[rows,W,H]);
  fs.writeFileSync(out,Buffer.from(jpg.split(',')[1],'base64'));console.log('skrev',out);await b.close();})();
