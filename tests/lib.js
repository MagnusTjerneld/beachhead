// Common ground for the tests (issue 181, Magnus 16 nov). One file instead of the same header copied into every test:
//   const L=require('./lib.js');
//   const B=L.game();            // a fresh g2.js (rebuilt if index.html or mk.py is newer), required, returns globalThis.__BH
//   const {ok,done}=L.head();    // ok(cond,msg) prints "ok   msg" or "FAIL msg" and counts; done() prints the last line and exits 1 on any FAIL
//   L.seed();                    // BH_SEED=12345 unless set, before the game is required (run.js sets it for every test)
//   const M=L.models(THREE,'mkFerry',{extra:['krokLegs'],consts:['HOVER_Y']});   // the 3D part cut out of g2.js (t99, t107, t120, t127)
// The build is the same as tests/mk.py (kept, run.js and CI call it): the script of index.html with a seeded Math.random in front when BH_SEED is set.
// If the head below is changed, change it in mk.py too.
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),G2=path.join(__dirname,'g2.js'),HTML=path.join(ROOT,'index.html'),MK=path.join(__dirname,'mk.py');
const HEAD="if(typeof process!=='undefined'&&process.env&&process.env.BH_SEED){let s=(+process.env.BH_SEED)>>>0;"
  +"Math.random=()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}\n";
const mtime=f=>{try{return fs.statSync(f).mtimeMs;}catch(_){return 0;}};
/* g2.js is stale when index.html or mk.py is newer (or g2.js is missing); the build goes through a temp file and a rename, so several tests
   starting at once never read a half written file */
function build(){const s=fs.readFileSync(HTML,'utf8'),i=s.lastIndexOf('<script>'),j=s.lastIndexOf('</script>');
  const tmp=G2+'.'+process.pid+'.tmp';fs.writeFileSync(tmp,HEAD+s.slice(i+8,j));fs.renameSync(tmp,G2);return G2;}
function fresh(){if(mtime(G2)<Math.max(mtime(HTML),mtime(MK)))build();return G2;}
function seed(n){if(!process.env.BH_SEED)process.env.BH_SEED=String(n||12345);return process.env.BH_SEED;}
function game(){global.performance=global.performance||{now:()=>0};fresh();require(G2);return globalThis.__BH;}
function head(){let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;return !!c;};
  const done=()=>{console.log(fail?'FAILED '+fail:'ALL OK');process.exit(fail?1:0);};return{ok,done,fails:()=>fail};}
/* the 3D part of the game script: it stops at its own "if(!hasDOM)return;" headless, so the model code is cut out of g2.js and run with THREE.
   marks() gives the cut points (for a test's own "is it where I look" check); models() runs the cut. */
const MARK='\nif(!hasDOM)return;\n';
function source(){fresh();return fs.readFileSync(G2,'utf8').split('\r').join('');}
function marks(){const src=source(),i=src.indexOf(MARK),R0=src.indexOf('\nlet R3=null;\n'),j=src.indexOf('function mkEnemyMesh(e){'),k=src.indexOf('\n}\n',j)+3;return{src,i,R0,j,k};}
const fnSrc=(src,n)=>{const a=src.indexOf('\nfunction '+n+'(');if(a<0)throw new Error('function '+n+' not found');return src.slice(a,src.indexOf('\n}\n',a)+3);};
const stSrc=(src,n)=>{const a=src.indexOf('\nconst '+n+'=');if(a<0)throw new Error('const '+n+' not found');return src.slice(a,src.indexOf('\n',a+1)+1);};
const cv=()=>({width:0,height:0,getContext:()=>new Proxy({},{get:(t,p)=>p==='createRadialGradient'||p==='createLinearGradient'?()=>({addColorStop(){}}):()=>{},set:()=>true})});
// ret: what to return (names, comma list); setR3 is always added. extra: functions further down the file; consts: single line consts further down
function models(THREE,ret,o){o=o||{};const m=marks();global.document={createElement:cv};
  const body=(m.src.slice(0,m.i)+'\n'+m.src.slice(m.R0,m.k)+(o.extra||[]).map(n=>fnSrc(m.src,n)).join('')+(o.consts||[]).map(n=>stSrc(m.src,n)).join(''))
    .replace('(function(){','').split('\n').filter(l=>!l.startsWith("if(typeof globalThis!=='undefined')globalThis.__BH=")).join('\n')
    +'\nreturn{'+ret+',setR3:o=>{R3=o;}};\n';
  return new Function('THREE',body)(THREE);}
module.exports={ROOT,G2,build,fresh,seed,game,head,source,marks,models,fnSrc,stSrc};
