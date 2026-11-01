// renders proto/varg.html: today's VARG and 01B from four sides with their triangles and materials (varg.jpg), and 01B's model
// sheet from six sides against the neutral background (varg_karta.jpg); node proto/varg.js [ut-mapp], some seconds
const path=require('path'),fs=require('fs'),{execSync}=require('child_process');
const {chromium}=require(execSync('npm root -g').toString().trim()+'/playwright');
const dir=process.argv[2]||__dirname,three=path.join(__dirname,'..','tests','node_modules','three','build','three.min.js');
const cloud=fs.existsSync('/opt/pw-browsers/chromium');
(async()=>{const b=await chromium.launch({executablePath:cloud?'/opt/pw-browsers/chromium':undefined,args:['--no-sandbox','--ignore-gpu-blocklist',...(cloud?['--use-gl=swiftshader','--enable-unsafe-swiftshader']:['--enable-gpu'])]});
  const p=await b.newPage({viewport:{width:800,height:600}});p.on('pageerror',e=>console.log('ERR',e.message));
  await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith('file:'))return r.continue();if(u.includes('three.min.js'))return r.fulfill({path:three,contentType:'text/javascript'});r.abort();});
  await p.goto(require('url').pathToFileURL(path.join(__dirname,'varg.html')).href+'?bench');
  await p.waitForFunction(()=>globalThis.BENCH);
  const sheet=async(file,title,rows,W,H)=>{const jpg=await p.evaluate(async([title,rows,W,H])=>{const T=34,c=document.createElement('canvas'),cols=rows[0].imgs.length;c.width=W*cols;c.height=50+rows.length*(H+T);const x=c.getContext('2d');
      x.fillStyle='#dcdee0';x.fillRect(0,0,c.width,c.height);x.fillStyle='#1f2326';x.font='700 26px Arial';x.fillText(title,14,34);
      for(let r=0;r<rows.length;r++){const y0=50+r*(H+T);x.font='600 16px Arial';x.fillStyle='#2a2f33';x.fillText(rows[r].label,14,y0+22);
        for(let i=0;i<cols;i++){const im=new Image();im.src=rows[r].imgs[i];await im.decode();x.drawImage(im,i*W,y0+T);
          if(rows[r].caps){x.font='14px Arial';x.fillStyle='#5a6268';x.fillText(rows[r].caps[i],i*W+12,y0+T+20);}}}
      x.strokeStyle='#c4c6c8';for(let i=1;i<rows[0].imgs.length;i++){x.beginPath();x.moveTo(i*W,50);x.lineTo(i*W,c.height);x.stroke();}
      return c.toDataURL('image/jpeg',.9);},[title,rows,W,H]);fs.writeFileSync(file,Buffer.from(jpg.split(',')[1],'base64'));console.log('skrev',file);};
  const rows=[];
  for(const v of['old','new']){const r=await p.evaluate(v=>BENCH.show(v),v);if(v==='new'){const l=await p.evaluate(()=>BENCH.loose());console.log(l.length?l.length+' delar rör inget: '+l.join('; '):'alla delar sitter ihop');}
    console.log(v,JSON.stringify(r));const imgs=[];for(const[a,e]of[[35,18],[90,4],[145,18],[0,4]])imgs.push(await p.evaluate(([a,e])=>BENCH.shoot(a,e,560,380),[a,e]));
    rows.push({label:(v==='old'?'I dag':'01B')+' · '+r.tri+' trianglar, '+r.mats+' material · '+r.len+' × '+r.wid+' × '+r.h+' m',imgs});}
  await sheet(path.join(dir,'varg.jpg'),'VARG: i dag och 01B',rows,560,380);
  const r=await p.evaluate(()=>BENCH.show('new')),V=[['Snett framifrån',35,18],['Från sidan',90,3],['Snett bakifrån',145,18],['Framifrån',0,4],['Bakifrån',180,4],['Ovanifrån',90,89.5]],imgs=[];
  for(const[,a,e]of V)imgs.push(await p.evaluate(([a,e])=>BENCH.shoot(a,e,640,440,e>80?38:28),[a,e]));
  await sheet(path.join(dir,'varg_karta.jpg'),'VARG / 01B',[{label:r.len+' × '+r.wid+' × '+r.h+' m · '+r.tri+' trianglar, '+r.mats+' material',imgs:imgs.slice(0,3),caps:V.slice(0,3).map(v=>v[0])},{label:'',imgs:imgs.slice(3),caps:V.slice(3).map(v=>v[0])}],640,440);
  await b.close();})();
