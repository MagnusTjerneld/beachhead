// renders proto/gadda01.html: today's GÄDDA and GÄDDA 01 from four sides with their triangles and materials (gadda01.jpg), and GÄDDA 01's
// model sheet from six sides against the neutral background, the launcher down and lifted (gadda01_karta.jpg); node proto/gadda01.js [ut-mapp]
const path=require('path'),fs=require('fs'),{execSync}=require('child_process');
const {chromium}=require(execSync('npm root -g').toString().trim()+'/playwright');
const dir=process.argv[2]||__dirname,three=path.join(__dirname,'..','tests','node_modules','three','build','three.min.js');
const cloud=fs.existsSync('/opt/pw-browsers/chromium');
(async()=>{const b=await chromium.launch({executablePath:cloud?'/opt/pw-browsers/chromium':undefined,args:['--no-sandbox','--ignore-gpu-blocklist',...(cloud?['--use-gl=swiftshader','--enable-unsafe-swiftshader']:['--enable-gpu'])]});
  const p=await b.newPage({viewport:{width:800,height:600}});p.on('pageerror',e=>console.log('ERR',e.message));
  await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith('file:'))return r.continue();if(u.includes('three.min.js'))return r.fulfill({path:three,contentType:'text/javascript'});r.abort();});
  await p.goto(require('url').pathToFileURL(path.join(__dirname,'gadda01.html')).href+'?bench');
  await p.waitForFunction(()=>globalThis.BENCH);
  const sheet=async(file,title,rows,W,H)=>{const jpg=await p.evaluate(async([title,rows,W,H])=>{const T=34,c=document.createElement('canvas'),cols=rows[0].imgs.length;c.width=W*cols;c.height=50+rows.length*(H+T);const x=c.getContext('2d');
      x.fillStyle='#dcdee0';x.fillRect(0,0,c.width,c.height);x.fillStyle='#1f2326';x.font='700 26px Arial';x.fillText(title,14,34);
      for(let r=0;r<rows.length;r++){const y0=50+r*(H+T);x.font='600 16px Arial';x.fillStyle='#2a2f33';x.fillText(rows[r].label,14,y0+22);
        for(let i=0;i<cols;i++){const im=new Image();im.src=rows[r].imgs[i];await im.decode();x.drawImage(im,i*W,y0+T);
          if(rows[r].caps){x.font='14px Arial';x.fillStyle='#5a6268';x.fillText(rows[r].caps[i],i*W+12,y0+T+20);}}}
      x.strokeStyle='#c4c6c8';for(let i=1;i<rows[0].imgs.length;i++){x.beginPath();x.moveTo(i*W,50);x.lineTo(i*W,c.height);x.stroke();}
      return c.toDataURL('image/jpeg',.9);},[title,rows,W,H]);fs.writeFileSync(file,Buffer.from(jpg.split(',')[1],'base64'));console.log('skrev',file);};
  const rows=[];
  for(const v of['old','new']){const r=await p.evaluate(v=>BENCH.show(v,0),v);if(v==='new'){for(const l of[0,1]){await p.evaluate(l=>BENCH.show('new',l),l);const lo=await p.evaluate(()=>BENCH.loose());const hg=await p.evaluate(()=>BENCH.hangs());console.log('lyft '+l+': '+(lo.length?lo.length+' delar rör inget: '+lo.join('; '):'alla delar sitter ihop')+'; '+(hg.length?hg.length+' hänger i luften: '+hg.join('; '):'inget hänger i luften'));}await p.evaluate(()=>BENCH.show('new',0));}
    console.log(v,JSON.stringify(r));const imgs=[];for(const[a,e]of[[35,18],[90,4],[145,18],[0,6]])imgs.push(await p.evaluate(([a,e])=>BENCH.shoot(a,e,560,380,21),[a,e]));
    rows.push({label:(v==='old'?'I dag':'01')+' · '+r.tri+' trianglar, '+r.mats+' material · '+r.len+' × '+r.wid+' × '+r.h+' m',imgs});}
  await sheet(path.join(dir,'gadda01.jpg'),'GÄDDA: i dag och 01',rows,560,380);
  const r=await p.evaluate(()=>BENCH.show('new',0)),V=[['Snett framifrån',35,18,0],['Från sidan',90,3,0],['Snett bakifrån',145,18,0],['Ovanifrån',90,89.5,0],['Bakifrån',180,6,0],['Robotlådan lyft',125,14,1]],imgs=[];
  for(const[,a,e,l]of V){await p.evaluate(l=>BENCH.show('new',l),l);imgs.push(await p.evaluate(([a,e])=>BENCH.shoot(a,e,640,440,e>80?27:21),[a,e]));}
  await sheet(path.join(dir,'gadda01_karta.jpg'),'GÄDDA / 01',[{label:r.len+' × '+r.wid+' × '+r.h+' m · '+r.tri+' trianglar, '+r.mats+' material',imgs:imgs.slice(0,3),caps:V.slice(0,3).map(v=>v[0])},{label:'',imgs:imgs.slice(3),caps:V.slice(3).map(v=>v[0])}],640,440);
  await b.close();})();
