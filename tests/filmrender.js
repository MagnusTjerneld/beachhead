// The whole trailer as an mp4 on this machine (Magnus 7 nov): runs the game's own Spara video (filmExport) in a browser on the graphics card, frame by frame with
// the score, and writes the file. Needs Edge or Chrome for H.264 (without them Playwright's Chromium gives VP9 in the mp4). Some minutes; it prints the progress.
//   node tests/filmrender.js [ut.mp4] [--upp 1080|1440]     default 1440p, the size for YouTube
// three.js r128 comes from tests/node_modules/three (npm install in tests) or the path in THREE_JS; the mp4 muxer is fetched from jsdelivr as in the game.
const fs=require('fs'),path=require('path'),http=require('http'),{execSync}=require('child_process');
const {chromium}=require(execSync('npm root -g').toString().trim()+'/playwright');
const argv=process.argv.slice(2),opt={},pos=[];for(let i=0;i<argv.length;i++){if(argv[i].startsWith('--'))opt[argv[i].slice(2)]=argv[++i];else pos.push(argv[i]);}
const out=path.resolve(pos[0]||'uppdrag-arkipelag-trailer.mp4'),upp=+(opt.upp||1440),root=path.join(__dirname,'..');
const three=process.env.THREE_JS||path.join(__dirname,'node_modules','three','build','three.min.js');
const MIME={'.html':'text/html','.mp3':'audio/mpeg'};
// the game over http: on file: the score cannot be fetched
const srv=http.createServer((q,r)=>{const f=path.join(root,decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/,'/index.html'));
  if(!f.startsWith(root)||!fs.existsSync(f)){r.writeHead(404);return r.end();}r.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});
(async()=>{await new Promise(k=>srv.listen(0,'127.0.0.1',k));const port=srv.address().port;
  let b=null;for(const channel of['msedge','chrome',undefined]){try{b=await chromium.launch({channel,args:['--no-sandbox','--ignore-gpu-blocklist','--enable-gpu','--autoplay-policy=no-user-gesture-required']});console.log('webbläsare',channel||'chromium');break;}catch(e){}}
  const c=await b.newContext({viewport:{width:1280,height:720},acceptDownloads:true}),p=await c.newPage();p.on('pageerror',e=>console.log('ERR',e.message));
  await p.route('**/*three.min.js',r=>r.fulfill({path:three,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'}}));
  await p.goto('http://127.0.0.1:'+port+'/index.html?trailer',{waitUntil:'commit',timeout:120000});
  await p.waitForFunction(()=>globalThis.__FILM&&__FILM.R3()&&__BH&&__BH.G&&__BH.G.seed&&globalThis.__boot&&__boot.warm&&__FILM.FILM.state==='idle',null,{timeout:300000,polling:500});
  const t0=Date.now(),dl=p.waitForEvent('download',{timeout:0});
  const done=p.evaluate(u=>__FILM.exp(u),upp);
  let last='';const tick=setInterval(async()=>{try{const t=await p.evaluate(()=>document.getElementById('tPress').textContent);if(t!==last){last=t;console.log(Math.round((Date.now()-t0)/1000)+' s',t);}}catch(e){}},5000);
  await done;clearInterval(tick);/* the download comes as the export ends, so it is waited for after, with a limit: a failed export gives none */
  const d=await Promise.race([dl,new Promise(k=>setTimeout(()=>k(null),20000))]);
  if(!d){console.log('ingen fil:',await p.evaluate(()=>document.getElementById('tPress').textContent));process.exit(1);}
  await d.saveAs(out);console.log(out,(fs.statSync(out).size/1e6).toFixed(0)+' MB',Math.round((Date.now()-t0)/1000)+' s');await b.close();srv.close();})();
