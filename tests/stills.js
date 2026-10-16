// Stills for review (16 okt): renders a series of pictures of the game in headless Chromium and puts them together into one contact
// sheet. Every picture goes through the game's own __BHstill, the same steps as a frame (sync, sky, clouds, tree culling, render), so
// the first picture of a series has its trees like the rest. Swiftshader takes about a second and a half a picture; a series of
// more than about 60 pictures takes over two minutes and needs a yes first (CLAUDE.md).
//   node tests/stills.js arstider [ut.jpg]        built-in series: arstider (9 dates at noon), ar (12 months x 6 hours), vinter
//   node tests/stills.js serie.json [ut.jpg]      your own: {seed, cols, w, h, shots:[{label, datum:'12-21', klocka:'08:30',
//                                                 moln, cam:{rel,x,y,z}, look:{rel,x,y,z}}]}; rel = relative to the landing beach,
//                                                 a missing y = that high over the ground (camUp, lookUp)
// three.js r128 comes from tests/node_modules/three (npm install in tests) or the path in THREE_JS.
const fs=require('fs'),path=require('path'),{execSync}=require('child_process');
const {chromium}=require(execSync('npm root -g').toString().trim()+'/playwright');
const arg=process.argv.slice(2),out=arg[1]||'stills.jpg';
const three=process.env.THREE_JS||path.join(__dirname,'node_modules','three','build','three.min.js');
if(!fs.existsSync(three)){console.error('three.min.js saknas: kör npm install i tests eller sätt THREE_JS');process.exit(1);}
const low={cam:{rel:true,x:-120,z:60,y:null},look:{rel:true,x:150,z:-120},camUp:35,lookUp:5};
const SERIES={
  arstider:{cols:3,shots:[['15 jan','01-15'],['1 apr','04-01'],['20 apr','04-20'],['10 maj','05-10'],['1 jul','07-01'],['15 sep','09-15'],['15 okt','10-15'],['10 nov','11-10'],['20 dec','12-20']].map(([l,d])=>({label:l,datum:d,klocka:'12:00',moln:20,...low}))},
  vinter:{cols:2,shots:[['15 jan 12','01-15','12:00'],['15 jan 22','01-15','22:00'],['20 dec 12','12-20','12:00'],['20 dec 22','12-20','22:00']].map(([l,d,k])=>({label:l,datum:d,klocka:k,moln:20,...low}))},
  ar:{cols:6,w:240,h:142,shots:[].concat(...['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'].map((m,i)=>[0,4,8,12,16,20].map(h=>({label:m+' '+String(h).padStart(2,'0'),datum:String(i+1).padStart(2,'0')+'-15',klocka:String(h).padStart(2,'0')+':00',moln:20,...low}))))}};
const S=SERIES[arg[0]]||JSON.parse(fs.readFileSync(arg[0],'utf8'));
const seed=S.seed||1234,W=S.w||560,H=S.h||340,cols=S.cols||3;
const doyOf=(m,d)=>Math.round((Date.UTC(2032,m-1,d)-Date.UTC(2032,0,1))/864e5)+1;
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const p=await b.newPage({viewport:{width:W,height:H}});p.on('pageerror',e=>console.log('ERR',e.message));
  await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith('file:'))return r.continue();if(u.includes('three.min.js'))return r.fulfill({path:three,contentType:'text/javascript'});r.abort();});
  await p.goto('file://'+path.join(__dirname,'..','index.html')+'?seed='+seed+'&nointro',{waitUntil:'commit',timeout:120000});
  await p.waitForFunction(()=>globalThis.__BHstill&&globalThis.__BH&&__BH.G&&__BH.G.seed,null,{timeout:200000,polling:500});
  const imgs=[];for(const s of S.shots){const o={...s};if(s.datum){const[m,d]=s.datum.split('-').map(Number);o.doy=doyOf(m,d);}if(s.klocka){const[h,mi]=s.klocka.split(':').map(Number);o.tod=h+mi/60;}
    imgs.push(await p.evaluate(o=>globalThis.__BHstill(o),o));process.stdout.write('.');}
  // the contact sheet is drawn in the page itself
  const sheet=await p.evaluate(async([imgs,labels,W,H,cols])=>{const rows=Math.ceil(imgs.length/cols),c=document.createElement('canvas');c.width=W*cols;c.height=H*rows;const x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,c.width,c.height);
    for(let i=0;i<imgs.length;i++){const im=new Image();await new Promise(r=>{im.onload=r;im.src=imgs[i];});x.drawImage(im,(i%cols)*W,Math.floor(i/cols)*H,W,H);x.font='13px sans-serif';x.fillStyle='#ffd84a';x.fillText(labels[i]||'',(i%cols)*W+6,Math.floor(i/cols)*H+16);}
    return c.toDataURL('image/jpeg',.86);},[imgs,S.shots.map(s=>s.label),W,H,cols]);
  fs.writeFileSync(out,Buffer.from(sheet.split(',')[1],'base64'));console.log('\n'+out);await b.close();})();
