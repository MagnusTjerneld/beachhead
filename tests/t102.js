// KAMERA 2's downward picture and the name of the active view (issue 79 and 116, Magnus 2 nov). The DOM code is out of reach headless, so the
// functions are cut out of g2.js by name and run here with stubs: (1) a click on the downward picture in KAMERA 2's corner toggles u.down for
// that GETING (and G.camDown when camera 1 shows it too), a click elsewhere in KAMERA 2 does not; (2) Q (swapViews) still swaps the views in the
// standard layout (G.activeView: cam and map) and in the wide layout; (3) the old word huvudkamera/huvudvy and G.mainMode are gone.
const fs=require('fs'),path=require('path');let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const src=fs.readFileSync(path.join(__dirname,'g2.js'),'utf8').split('\r').join('');
const fn=n=>{const a=src.indexOf('\nfunction '+n+'(');if(a<0)throw new Error('function '+n+' not found');let d=0,i=src.indexOf('{',a);for(;;i++){if(src[i]==='{')d++;else if(src[i]==='}'&&!--d)break;}return src.slice(a,i+1);};
ok(/const VW=\{main:'cam',sub:'map',small:'cam2',act:'sub'\}/.test(src),'the view table VW is where this test looks for it');
const mk=new Function('stub','const VW={main:"cam",sub:"map",small:"cam2",act:"sub"};const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));'+fn('pipRect')+fn('cam2PipClick')+fn('swapViews')+'\n'+
  'const vwSwap=(a,b)=>{const t=VW[a];VW[a]=VW[b];VW[b]=t;};const LAYOUT=stub.LAYOUT,G=stub.G,R3=stub.R3,CAM2=stub.CAM2,unitById=stub.unitById,heard=stub.heard,actCam=()=>{},placePanes=()=>{},uiTick=()=>{};'+
  'return{VW,cam2PipClick,swapViews,pipRect};');
const run=o=>{const u={id:'u1',kind:'scout',dead:false,carried:false,down:false},G={cam:'u1',camDown:false,activeView:'cam'},R3={snap:false};
  const stub={LAYOUT:{on:!!o.wide},G,R3,CAM2:{cv:{getBoundingClientRect:()=>({left:100,top:50,width:800,height:500})}},unitById:id=>id==='u1'?u:null,heard:()=>o.heard!==false};
  return{u,G,R3,...mk(stub)};};
const F={isBig:true,r:{},uid:'u1'};
{const{u,G,R3,cam2PipClick,pipRect}=run({}),r=pipRect(800,500),c={clientX:100+r.x+r.s/2,clientY:50+r.y+r.s/2};
  ok(!cam2PipClick(F,{clientX:150,clientY:100}),'a click elsewhere in KAMERA 2 is not taken');ok(!u.down,'... and the downward camera is unchanged');
  ok(cam2PipClick(F,c)&&u.down===true,'a click on the corner picture makes the downward picture large for the GETING');
  ok(G.camDown===true&&R3.snap,'camera 1 showing the same GETING follows (G.camDown, snap)');
  ok(cam2PipClick(F,c)&&u.down===false&&G.camDown===false,'a second click swaps back');
  G.cam='other';cam2PipClick(F,c);ok(u.down===true&&G.camDown===false,'camera 1 on another unit keeps its own G.camDown');
  ok(!cam2PipClick({...F,isBig:false},c),'the small live picture does not take the corner click');
  u.carried=true;ok(!cam2PipClick(F,c),'no corner picture, no click, on a carried GETING');u.carried=false;
  u.kind='tank';ok(!cam2PipClick(F,c),'only a GETING has the downward picture');u.kind='scout';
  const r2=run({heard:false});ok(!r2.cam2PipClick(F,c),'out of radio reach the corner picture is not drawn, so no click');}
{const{G,swapViews}=run({});swapViews();ok(G.activeView==='map','Q in the standard layout: camera to chart (G.activeView)');swapViews();ok(G.activeView==='cam','... and back');}
{const{G,swapViews,VW}=run({wide:true});swapViews();ok(VW.sub==='cam2'&&VW.small==='map'&&G.activeView==='cam','Q in the wide layout swaps the active view with the small picture');
  swapViews();ok(VW.sub==='map'&&VW.small==='cam2','... and back');}
ok(!/mainMode/.test(src),'G.mainMode is gone');
ok(!/huvudkamera|huvudvy|huvudbild/i.test(fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8')+fs.readFileSync(path.join(__dirname,'..','README.md'),'utf8')),'no huvudkamera/huvudvy/huvudbild in the game text or README');
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
