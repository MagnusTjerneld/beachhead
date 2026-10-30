// Stills for review (16 okt): renders a series of pictures of the game in headless Chromium and puts them together into one contact
// sheet. Every picture goes through the game's own __BHstill, the same steps as a frame (sync, sky, clouds, tree culling, render), so
// the first picture of a series has its trees like the rest. Swiftshader takes about a second and a half a picture; a series of
// more than about 60 pictures takes over two minutes and needs a yes first (CLAUDE.md).
//   node tests/stills.js arstider [ut.jpg]        built-in series: arstider (9 dates at noon), manader (12 months at noon), ar (12 months x 6 hours), vinter
//   node tests/stills.js serie.json [ut.jpg]      your own: {seed, cols, w, h, photo (no labels, far fog), title, rowLabels, colLabels, shots:[{label, datum:'12-21', klocka:'08:30',
//                                                 moln, cam:{rel,x,y,z}, look:{rel,x,y,z}}]}; rel = relative to the landing beach,
//                                                 a missing y = that high over the ground (camUp, lookUp); rel:'birka' is Birka's own frame
//                                                 (x across, z forward), rel:'station' the field station's plates (z out through them); rel:'radar' the radar mast's foot with world axes;
//                                                 form (the island's shape, as ?form=); uppdrag (the mission, as ?uppdrag=; rel:'kust' is then the coast battery's frame, z out to sea); prep (in the series or a shot) is JavaScript run in the page first, with B = __BH and G = __BH.G
// three.js r128 comes from tests/node_modules/three (npm install in tests) or the path in THREE_JS.
const fs=require('fs'),path=require('path'),{execSync}=require('child_process');
const {chromium}=require(execSync('npm root -g').toString().trim()+'/playwright');
const arg=process.argv.slice(2),out=arg[1]||'stills.jpg';
const three=process.env.THREE_JS||path.join(__dirname,'node_modules','three','build','three.min.js');
if(!fs.existsSync(three)){console.error('three.min.js saknas: kör npm install i tests eller sätt THREE_JS');process.exit(1);}
const low={cam:{rel:true,x:-120,z:60,y:null},look:{rel:true,x:150,z:-120},camUp:35,lookUp:5};
const SERIES={
  arstider:{cols:3,shots:[['15 jan','01-15'],['1 apr','04-01'],['20 apr','04-20'],['10 maj','05-10'],['1 jul','07-01'],['15 sep','09-15'],['15 okt','10-15'],['10 nov','11-10'],['20 dec','12-20']].map(([l,d])=>({label:l,datum:d,klocka:'12:00',moln:20,...low}))},
  manader:{cols:4,shots:['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'].map((m,i)=>({label:'15 '+m,datum:String(i+1).padStart(2,'0')+'-15',klocka:'12:00',moln:20,...low}))},
  vinter:{cols:2,shots:[['15 jan 12','01-15','12:00'],['15 jan 22','01-15','22:00'],['20 dec 12','12-20','12:00'],['20 dec 22','12-20','22:00']].map(([l,d,k])=>({label:l,datum:d,klocka:k,moln:20,...low}))},
  ar:{cols:6,w:240,h:142,title:'Ett år i skärgården: ö 1234 den 15:e varje månad, 59,4° N',
    rowLabels:['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December'],
    colLabels:[0,4,8,12,16,20].map(h=>'kl '+String(h).padStart(2,'0')),shots:[].concat(...['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'].map((m,i)=>[0,4,8,12,16,20].map(h=>({label:m+' '+String(h).padStart(2,'0'),datum:String(i+1).padStart(2,'0')+'-15',klocka:String(h).padStart(2,'0')+':00',moln:20,...low}))))}};
const S=SERIES[arg[0]]||JSON.parse(fs.readFileSync(arg[0],'utf8'));
const seed=S.seed||1234,W=S.w||560,H=S.h||340,cols=S.cols||3;
const doyOf=(m,d)=>Math.round((Date.UTC(2032,m-1,d)-Date.UTC(2032,0,1))/864e5)+1;
// in the cloud: its own Chromium on swiftshader; on a desktop the graphics card (swiftshader loses the WebGL context there)
const cloud=fs.existsSync('/opt/pw-browsers/chromium');
(async()=>{const b=await chromium.launch({executablePath:cloud?'/opt/pw-browsers/chromium':undefined,args:['--no-sandbox','--ignore-gpu-blocklist',...(cloud?['--use-gl=swiftshader','--enable-unsafe-swiftshader']:['--enable-gpu'])]});
  // the screen layouts give the camera pane only part of the window, so render in a big window and scale down in the sheet
  const p=await b.newPage({viewport:{width:1600,height:900}});p.on('pageerror',e=>console.log('ERR',e.message));
  await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith('file:'))return r.continue();if(u.includes('three.min.js'))return r.fulfill({path:three,contentType:'text/javascript'});r.abort();});
  await p.goto(require('url').pathToFileURL(path.join(__dirname,'..','index.html')).href+'?seed='+seed+'&nointro'+(S.photo?'&photo':'')+(S.form?'&form='+S.form:'')+(S.uppdrag?'&uppdrag='+S.uppdrag:''),{waitUntil:'commit',timeout:120000});
  await p.waitForFunction(()=>globalThis.__BHstill&&globalThis.__BH&&__BH.G&&__BH.G.seed&&globalThis.__boot&&__boot.warm,null,{timeout:200000,polling:500});
  const prep=code=>code&&p.evaluate(c=>{const B=globalThis.__BH,G=B.G;return new Function('B','G',c)(B,G);},code);let prepped=false;
  // the flashing lights (sector lights, daymarks) are held lit unless the series or a shot says fyrar:false
  const imgs=[];for(const s of S.shots){const o={fyrar:S.fyrar??true,...s};delete o.prep;if(s.datum){const[m,d]=s.datum.split('-').map(Number);o.doy=doyOf(m,d);}if(s.klocka){const[h,mi]=s.klocka.split(':').map(Number);o.tod=h+mi/60;}
    await p.evaluate(o=>globalThis.__BHstill(o),o);/* the first frame after a new date settles snow, leaves and ice; it also starts the game, so prep runs after it */
    if(!prepped){prepped=true;await prep(S.prep);}await prep(s.prep);
    imgs.push(await p.evaluate(o=>globalThis.__BHstill(o),o));process.stdout.write('.');}
  // the contact sheet is drawn in the page itself; with rowLabels/colLabels the labels go in margins instead of on the pictures
  const sheet=await p.evaluate(async([imgs,labels,W,H,cols,title,rowL,colL])=>{const rows=Math.ceil(imgs.length/cols),grid=!!(rowL||colL),
      L=rowL?110:0,T=(title?34:0)+(colL?40:0),c=document.createElement('canvas');c.width=L+W*cols;c.height=T+H*rows;const x=c.getContext('2d');
    x.fillStyle=grid?'#0d111a':'#000';x.fillRect(0,0,c.width,c.height);
    if(title){x.font='bold 20px sans-serif';x.fillStyle='#eee';x.fillText(title,L,26);}
    x.font='15px sans-serif';x.fillStyle='#ccc';x.textBaseline='middle';
    if(colL){x.textAlign='center';colL.forEach((t,i)=>x.fillText(t,L+i*W+W/2,T-20));x.textAlign='left';}
    if(rowL)rowL.forEach((t,i)=>x.fillText(t,10,T+i*H+H/2));x.textBaseline='alphabetic';
    for(let i=0;i<imgs.length;i++){const im=new Image();await new Promise(r=>{im.onload=r;im.src=imgs[i];});const px=L+(i%cols)*W,py=T+Math.floor(i/cols)*H;const k=Math.max(W/im.width,H/im.height),sw=W/k,sh=H/k;x.drawImage(im,(im.width-sw)/2,im.height-sh,sw,sh,px,py,W,H);
      if(grid){x.strokeStyle='#0d111a';x.lineWidth=2;x.strokeRect(px,py,W,H);}else{x.font='13px sans-serif';x.fillStyle='#ffd84a';x.fillText(labels[i]||'',px+6,py+16);}}
    return c.toDataURL('image/jpeg',.9);},[imgs,S.shots.map(s=>s.label),W,H,cols,S.title,S.rowLabels,S.colLabels]);
  fs.writeFileSync(out,Buffer.from(sheet.split(',')[1],'base64'));console.log('\n'+out);await b.close();})();
