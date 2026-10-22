// The four seasons from one drone camera (decided 17 okt, Magnus: kept for reuse): the same island, hour and camera on the clearest
// day of each season, each rendered full size in photo mode, and a picture stitched of a quarter of each as vertical stripes, spring,
// summer, autumn and winter from left to right. All PNG, cropped to 16:9 from the top (the sky).
//   node tests/arstider.js                                  island 2024 from 550 m out at sea to the east at 11:00, 3402 px wide (Magnus 22 okt)
//   node tests/arstider.js 9052 ut/arstider                 another island; the files are named <ut>_strimlor.png and <ut>_<season>.png
//   node tests/arstider.js 2024 ut --cam 471,150,704 --look 836,0,713 --klocka 13:00   the first view, over the cove with the jetty
//   --datum var=04-22,sommar=07-02,host=10-16,vinter=02-15     other days
//   --fov 30                                                 a longer lens (degrees, vertical), which draws the backdrop islands nearer
// BH_HTML=<file> renders another copy of the game (a mockup). About 15 s an image at full size in swiftshader; three.js r128 from tests/node_modules/three (npm install in tests) or THREE_JS.
const fs=require('fs'),path=require('path'),{execSync}=require('child_process');
const {chromium}=require(execSync('npm root -g').toString().trim()+'/playwright');
const arg=process.argv.slice(2),pos=arg.filter((a,i)=>!a.startsWith('--')&&!(i>0&&arg[i-1].startsWith('--'))),opt=k=>{const i=arg.indexOf('--'+k);return i>=0?arg[i+1]:null;};
const seed=+(pos[0]||2024),out=pos[1]||'arstider';
const xyz=s=>{const[x,y,z]=s.split(',').map(Number);return{x,y,z};};
const cam=xyz(opt('cam')||'1732,550,1160'),look=xyz(opt('look')||'1067,0,1390');
const [hh,mm]=(opt('klocka')||'11:00').split(':').map(Number),moln=+(opt('moln')??15),bredd=+(opt('bredd')||3402),fov=opt('fov')?+opt('fov'):null;
const DAYS={var:'04-22',sommar:'07-02',host:'10-16',vinter:'02-15'};if(opt('datum'))for(const kv of opt('datum').split(',')){const[k,v]=kv.split('=');DAYS[k]=v;}
const SEAS=['var','sommar','host','vinter'];
const three=process.env.THREE_JS||path.join(__dirname,'node_modules','three','build','three.min.js');
if(!fs.existsSync(three)){console.error('three.min.js saknas: kör npm install i tests eller sätt THREE_JS');process.exit(1);}
const doyOf=(m,d)=>Math.round((Date.UTC(2032,m-1,d)-Date.UTC(2032,0,1))/864e5)+1;
// in the cloud: its own Chromium on swiftshader; on a desktop the graphics card (swiftshader loses the WebGL context there)
const cloud=fs.existsSync('/opt/pw-browsers/chromium');
(async()=>{const b=await chromium.launch({executablePath:cloud?'/opt/pw-browsers/chromium':undefined,args:['--no-sandbox','--ignore-gpu-blocklist',...(cloud?['--use-gl=swiftshader','--enable-unsafe-swiftshader']:['--enable-gpu'])]});
  // the camera pane is about 0.87 by 0.93 of the window: size the window so the picture comes out bredd wide
  const p=await b.newPage({viewport:{width:Math.round(bredd/.8723),height:Math.round(bredd/.8723*.564)}});p.on('pageerror',e=>console.log('ERR',e.message));
  await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith('file:'))return r.continue();if(u.includes('three.min.js'))return r.fulfill({path:three,contentType:'text/javascript'});r.abort();});
  await p.goto(require('url').pathToFileURL(process.env.BH_HTML||path.join(__dirname,'..','index.html')).href+'?seed='+seed+'&nointro&photo',{waitUntil:'commit',timeout:120000});
  await p.waitForFunction(()=>globalThis.__BHstill&&globalThis.__BH&&__BH.G&&__BH.G.seed,null,{timeout:200000,polling:500});
  const imgs=[];for(const s of SEAS){const[m,d]=DAYS[s].split('-').map(Number);const o={doy:doyOf(m,d),tod:hh+mm/60,moln,png:true,cam,look,fov};
    await p.evaluate(o=>globalThis.__BHstill(o),o);/* the first frame after a new date settles snow, leaves and ice */
    imgs.push(await p.evaluate(o=>globalThis.__BHstill(o),o));process.stdout.write(s+' ');}
  // crop to 16:9 from the top and stitch the stripes, in the page
  const res=await p.evaluate(async imgs=>{const ims=[];for(const u of imgs){const im=new Image();await new Promise(r=>{im.onload=r;im.src=u;});ims.push(im);}
    const w=ims[0].width,h=ims[0].height,H=Math.round(w*9/16),top=Math.max(0,h-H),one=im=>{const c=document.createElement('canvas');c.width=w;c.height=H;c.getContext('2d').drawImage(im,0,top,w,H,0,0,w,H);return c;};
    const cs=ims.map(one),st=document.createElement('canvas');st.width=w;st.height=H;const x=st.getContext('2d');
    cs.forEach((c,i)=>{const x0=Math.round(i*w/4),x1=Math.round((i+1)*w/4);x.drawImage(c,x0,0,x1-x0,H,x0,0,x1-x0,H);});
    return{size:[w,H],one:cs.map(c=>c.toDataURL('image/png')),stripes:st.toDataURL('image/png')};},imgs);
  const save=(f,u)=>{fs.mkdirSync(path.dirname(path.resolve(f)),{recursive:true});fs.writeFileSync(f,Buffer.from(u.split(',')[1],'base64'));};
  SEAS.forEach((s,i)=>save(out+'_'+s+'.png',res.one[i]));save(out+'_strimlor.png',res.stripes);
  console.log('\n'+res.size.join(' x ')+'  '+out+'_strimlor.png och '+SEAS.map(s=>out+'_'+s+'.png').join(', '));await b.close();})();
