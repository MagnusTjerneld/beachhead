// issue 75, prototyp: fyra VARG sida vid sida på vattnet (vanlig, fasad, AO, AO+fas), en bild på spelavstånd, en från drönare och närbilder av var och en.
//   node proto/detalj.js ut.jpg [seed]   (på datorn med grafikkortet, några sekunder)
const fs=require('fs'),path=require('path'),{execSync}=require('child_process');
const {chromium}=require(execSync('npm root -g').toString().trim()+'/playwright');
const REPO=path.join(__dirname,'..'),out=process.argv[2]||'detalj.jpg',seed=process.argv[3]||'1234';
const three=path.join(REPO,'tests','node_modules','three','build','three.min.js');
(async()=>{const b=await chromium.launch({args:['--no-sandbox','--ignore-gpu-blocklist','--enable-gpu']});
  const p=await b.newPage({viewport:{width:1600,height:900}});p.on('pageerror',e=>console.log('ERR',e.message));
  await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith('file:'))return r.continue();if(u.includes('three.min.js'))return r.fulfill({path:three,contentType:'text/javascript'});r.abort();});
  await p.goto(require('url').pathToFileURL(path.join(REPO,'index.html')).href+'?seed='+seed+'&nointro',{waitUntil:'commit',timeout:120000});
  await p.waitForFunction(()=>globalThis.__BHstill&&globalThis.__BH&&__BH.G&&__BH.G.seed&&globalThis.__boot&&__boot.warm,null,{timeout:90000,polling:500});
  const base={doy:180,tod:10.5,moln:20,fyrar:true};
  await p.evaluate(o=>__BHstill(o),{...base,cam:{rel:true,x:-120,z:60},look:{rel:true,x:0,z:0}});
  const info=await p.evaluate(()=>{const B=__BH,D=B.DETALJ,R3=B.R3,L=B.LANDING,gy=B.groundY;
    // a flat stretch inland from the landing: the bearing where the ground 40 to 80 m in is highest and evenest
    let best=null;for(let k=0;k<36;k++){const a=k/36*Math.PI*2,c=Math.cos(a),s=Math.sin(a),px=-s,py=c,hs=[];
      for(let d=40;d<=80;d+=10)for(let j=-1;j<=2;j++){hs.push(gy(L.x+c*d+px*j*12,L.y+s*d+py*j*12));}
      const mx=Math.max(...hs);const sc=-mx;if(!best||sc>best.sc)best={sc,a,c,s,px,py};}
    const d=70,V=[['vanlig',{}],['fas',{fas:true}],['ao',{ao:true}],['ao+fas',{ao:true,fas:true}]],out=[];
    V.forEach(([nm,f],i)=>{D.ao=!!f.ao;D.fas=!!f.fas;D.ms=0;const t0=performance.now(),m=B.mkUnitMesh({kind:'tank',color:0x3d7fd0,id:'d'+i});const ms=performance.now()-t0;
      const x=L.x+best.c*d+best.px*(i-1.5)*13,z=L.y+best.s*d+best.py*(i-1.5)*13;m.position.set(x,Math.max(0,gy(x,z))+.35,z);m.rotation.y=-Math.atan2(best.py,best.px);R3.scene.add(m);
      let tri=0,dc=0;m.traverse(o=>{if(o.isMesh){dc++;const g=o.geometry;tri+=(g.index?g.index.count:g.attributes.position.count)/3;}});out.push({nm,x,z,ms:Math.round(ms),ao:Math.round(D.ms),tri:Math.round(tri),dc});});
    D.ao=D.fas=false;return{best,v:out};});
  console.log(JSON.stringify(info.v));
  const{c,s,px,py}=info.best,mid={x:(info.v[1].x+info.v[2].x)/2,z:(info.v[1].z+info.v[2].z)/2};
  // the camera stands seaward of the row, on the sun's... whichever side: front three-quarter (from the bow side = +px)
  const shots=[];
  shots.push(['spelavstånd 80 m',{cam:{x:mid.x-c*55+px*30,y:null,z:mid.z-s*55+py*30},camUp:45,look:{x:mid.x,y:null,z:mid.z},lookUp:1}]);
  shots.push(['drönare 35 m',{cam:{x:mid.x-c*25+px*12,y:null,z:mid.z-s*25+py*12},camUp:22,look:{x:mid.x,y:null,z:mid.z},lookUp:1}]);
  for(const v of info.v)shots.push([v.nm+' nära',{cam:{x:v.x-c*9+px*7,y:null,z:v.z-s*9+py*7},camUp:5,look:{x:v.x,y:null,z:v.z},lookUp:1.4,fov:40}]);
  for(const v of info.v)shots.push([v.nm+' ovanifrån',{cam:{x:v.x-c*4+px*3,y:null,z:v.z-s*4+py*3},camUp:12,look:{x:v.x,y:null,z:v.z},lookUp:1,fov:45}]);
  const imgs=[];for(const[l,o]of shots){imgs.push(await p.evaluate(o=>__BHstill(o),{...base,...o}));process.stdout.write('.');}
  const W=800,H=450,cols=2;const sheet=await p.evaluate(async([imgs,labels,W,H,cols])=>{const rows=Math.ceil(imgs.length/cols),c=document.createElement('canvas');c.width=W*cols;c.height=H*rows;const x=c.getContext('2d');
    for(let i=0;i<imgs.length;i++){const im=new Image();await new Promise(r=>{im.onload=r;im.src=imgs[i];});const k=Math.max(W/im.width,H/im.height),sw=W/k,sh=H/k;x.drawImage(im,(im.width-sw)/2,(im.height-sh)/2,sw,sh,(i%cols)*W,Math.floor(i/cols)*H,W,H);
      x.font='18px sans-serif';x.fillStyle='#ffd84a';x.fillText(labels[i],(i%cols)*W+8,Math.floor(i/cols)*H+22);}return c.toDataURL('image/jpeg',.88);},[imgs,shots.map(s=>s[0]),W,H,cols]);
  fs.writeFileSync(out,Buffer.from(sheet.split(',')[1],'base64'));console.log('\n'+out);await b.close();})();
