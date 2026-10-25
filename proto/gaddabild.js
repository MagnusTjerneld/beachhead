// Renders GÄDDA on its test bench (proto/gadda.html): a contact sheet of six views and, with --hjalte, the hero picture alone.
//   node proto/gaddabild.js [ut.jpg] [--hjalte hjalte.jpg]   (några sekunder; lokalt på Windows grafikkortet, i molnet swiftshader)
const fs=require('fs'),path=require('path'),{execSync}=require('child_process');
const {chromium}=require(execSync('npm root -g').toString().trim()+'/playwright');
const three=process.env.THREE_JS||path.join(__dirname,'..','tests','node_modules','three','build','three.min.js');
const arg=process.argv.slice(2),out=arg[0]&&!arg[0].startsWith('--')?arg[0]:'gadda.jpg',hi=arg.indexOf('--hjalte'),hero=hi>=0?arg[hi+1]:null;
const cloud=fs.existsSync('/opt/pw-browsers/chromium'),TW=900,TH=560;
const SHOTS=[
  ['Framifrån snett, i fart',[13,3.2,9],[0,1.2,0],{speed:.7,trim:-.03}],
  ['Från sidan',[0,1.6,19],[0,1.3,0],{speed:0}],
  ['Ovanifrån, som från en HÖK',[-6,46,8],[0,0,0],{speed:.7},34],
  ['Skjuter: rören uppe, en robot på väg',[-10,4.5,13],[1,4,0],{speed:.2,lift:1,robots:3,robot:{p:[2.6,8.5,0],a:-.95}},46],
  ['Akterifrån med kölvattnet',[-24,5,-7],[0,1,0],{speed:.8,trim:-.03}],
  ['Tom: alla fyra skjutna, på väg hem',[16,6,-12],[0,1,0],{speed:.7,robots:0,trim:-.03}]];
(async()=>{const b=await chromium.launch({executablePath:cloud?'/opt/pw-browsers/chromium':undefined,args:['--no-sandbox','--ignore-gpu-blocklist',...(cloud?['--use-gl=swiftshader','--enable-unsafe-swiftshader']:['--enable-gpu'])]});
  const p=await b.newPage({viewport:{width:1600,height:1000}});p.on('pageerror',e=>console.log('ERR',e.message));
  await p.route('**/*',r=>{const u=r.request().url();if(u.includes('three.min.js'))return r.fulfill({path:three,contentType:'text/javascript'});if(u.startsWith('file:'))return r.continue();r.abort();});
  await p.goto(require('url').pathToFileURL(path.join(__dirname,'gadda.html')).href+'?shot');await p.waitForFunction(()=>window.ready,null,{timeout:120000});
  if(hero){const d=await p.evaluate(()=>window.shot([12.5,2.6,8.5],[-.5,1.5,0],2400,1350,{speed:.75,trim:-.035},36));fs.writeFileSync(hero,Buffer.from(d.split(',')[1],'base64'));console.log(hero);}
  const imgs=[];for(const[l,c,k,s,f]of SHOTS)imgs.push({l,d:await p.evaluate(a=>window.shot(...a),[c,k,TW,TH,s,f])});
  const jpg=await p.evaluate(async({imgs,TW,TH})=>{const c=document.createElement('canvas');c.width=TW*2;c.height=TH*3;const g=c.getContext('2d');
    const ld=src=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=src;});
    for(let k=0;k<imgs.length;k++){const x=(k%2)*TW,y=Math.floor(k/2)*TH;g.drawImage(await ld(imgs[k].d),x,y);g.font='bold 22px sans-serif';const w=g.measureText(imgs[k].l).width;
      g.fillStyle='rgba(0,0,0,.55)';g.fillRect(x+10,y+10,w+16,32);g.fillStyle='#fff';g.fillText(imgs[k].l,x+18,y+34);}
    return c.toDataURL('image/jpeg',.88);},{imgs,TW,TH});
  fs.writeFileSync(out,Buffer.from(jpg.split(',')[1],'base64'));console.log(out);await b.close();})();
