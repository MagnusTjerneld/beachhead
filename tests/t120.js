// The campaign's first scenario models (issue 129, Magnus 4 nov): mkKraftverk, mkCistern (whole and broken), mkPumphus and mkTanker, built headless with the
// game's own code (cut out of g2.js the way t99 does) and checked against the description: the measured parts (userData.hall, body, house, hull) are within a few
// percent of the sizes, the triangle budget and the number of draw calls hold, the model stands on the ground (the ship floats at its waterline), nothing is NaN,
// and the glass is R3.winMat and the lamps R3.lampMat. T120_PROBE=1 prints the measures.
const fs=require('fs'),path=require('path');global.performance={now:()=>0};
const THREE=require('three');let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const src=fs.readFileSync(path.join(__dirname,'g2.js'),'utf8').split('\r').join('');
const MARK='\nif(!hasDOM)return;\n',i=src.indexOf(MARK),R0=src.indexOf('\nlet R3=null;\n'),j=src.indexOf('function mkEnemyMesh(e){'),k=src.indexOf('\n}\n',j)+3;
const a0=src.indexOf('/* ---- issue 129 models'),a1=src.indexOf('/* ---- end of the issue 129 models ---- */');
ok(i>0&&R0>i&&j>R0&&k>j&&a0>R0&&a1>a0&&a1<j,'the issue 129 models are where this test looks for them (after let R3, before mkEnemyMesh)');
if(!(i>0&&a0>R0&&a1>a0)){console.log('FAILED');process.exit(1);}
const cv=()=>({width:0,height:0,getContext:()=>new Proxy({},{get:(t,p)=>p==='createRadialGradient'||p==='createLinearGradient'?()=>({addColorStop(){}}):()=>{},set:()=>true})});
global.document={createElement:cv};
const body=(src.slice(0,i)+'\n'+src.slice(R0,k)).replace('(function(){','').split('\n').filter(l=>!l.startsWith("if(typeof globalThis!=='undefined')globalThis.__BH=")).join('\n')
  +'\nreturn{mkKraftverk,mkCistern,mkPumphus,mkTanker,setR3:o=>{R3=o;}};\n';
const M=new Function('THREE',body)(THREE);
const lampMat=new THREE.MeshLambertMaterial({color:0xe8e4d0}),winMat=new THREE.MeshLambertMaterial({color:0x2f4a5a});lampMat.userData.lit=winMat.userData.lit=true;
M.setR3({lampMat,winMat});

const measure=g=>{g.updateMatrixWorld(true);let tri=0,calls=0,bad=0,win=0,lamp=0;const bb=new THREE.Box3();
  g.traverse(o=>{if(!o.isMesh)return;calls++;const ge=o.geometry,p=ge.attributes.position;tri+=(ge.index?ge.index.count:p.count)/3;
    for(let n=0;n<p.array.length;n++)if(!isFinite(p.array[n])){bad++;break;}
    if(o.material===winMat)win++;if(o.material===lampMat)lamp++;});
  bb.setFromObject(g);return{tri,calls,bad,win,lamp,bb,size:bb.getSize(new THREE.Vector3())};};
const near=(v,t,tol)=>Math.abs(v-t)<=t*tol;
const probe=!!process.env.T120_PROBE;
const check=(name,g,o)=>{const m=measure(g);if(probe)console.log(name,'tri',m.tri,'calls',m.calls,'size',m.size.toArray().map(v=>+v.toFixed(2)),'min',m.bb.min.toArray().map(v=>+v.toFixed(2)),'win',m.win,'lamp',m.lamp);
  ok(g.isGroup,name+' is a THREE.Group');ok(m.bad===0,name+' has no NaN');ok(m.tri<=o.tri,name+' stays under '+o.tri+' triangles ('+Math.round(m.tri)+')');
  ok(m.calls<=o.calls,name+' stays under '+o.calls+' draw calls ('+m.calls+')');
  ok(Math.abs(m.bb.min.y-o.floor)<=.3,name+' stands on '+o.floor+' (lowest point '+m.bb.min.y.toFixed(2)+')');
  ok(m.win>=o.win,name+' has windows in R3.winMat ('+m.win+' draw call'+(m.win===1?'':'s')+')');ok(m.lamp>=o.lamp,name+' has lamps in R3.lampMat ('+m.lamp+')');
  const sub=n=>{const s=g.userData[n];ok(s&&s.isObject3D,name+' keeps userData.'+n);const b=new THREE.Box3().setFromObject(s);return{b,s:b.getSize(new THREE.Vector3())};};
  return{m,sub};};

{const g=M.mkKraftverk(),{m,sub}=check('kraftverk',g,{tri:2500,calls:20,floor:0,win:1,lamp:1});
  const h=sub('hall');ok(near(h.s.x,36,.03)&&near(h.s.z,18,.05)&&near(h.s.y,9,.03),'the hall is 36 x 18 x 9 m ('+h.s.toArray().map(v=>v.toFixed(1)).join(' x ')+')');
  const st=sub('stacks');ok(near(st.b.max.y,18,.02),'the tallest stack is 18 m ('+st.b.max.y.toFixed(1)+')');ok(g.userData.stackH[0]===18&&g.userData.stackH[1]===14,'the stacks are 18 and 14 m');
  const y=sub('yard');ok(near(y.s.x,14,.06)&&near(y.s.z,12,.06),'the transformer yard is 14 x 12 m ('+y.s.x.toFixed(1)+' x '+y.s.z.toFixed(1)+')');
  ok(near(m.size.y,18,.02),'the whole is 18 m tall');}
for(const br of[false,true]){const nm='cistern'+(br?' (broken)':''),g=M.mkCistern(br),{m,sub}=check(nm,g,{tri:2500,calls:16,floor:0,win:0,lamp:0});
  const b=sub('body');ok(near(b.s.x,22,.02)&&near(b.s.z,22,.02),nm+' is 22 m across ('+b.s.x.toFixed(1)+' x '+b.s.z.toFixed(1)+')');
  if(!br)ok(near(b.s.y,14,.02),nm+' is 14 m high ('+b.s.y.toFixed(2)+')');else ok(b.s.y<=14.05&&b.s.y>=12,nm+' has a lower, sunk top ('+b.s.y.toFixed(2)+')');
  const bd=sub('bund');ok(near(bd.s.x,36,.02)&&near(bd.s.z,36,.02)&&near(bd.s.y,3,.02),nm+' has a 36 x 36 m bund, 3 m high ('+bd.s.toArray().map(v=>v.toFixed(1)).join(' x ')+')');
  ok(m.size.y<=14.05,nm+' is no taller than 14 m overall');}
{const b0=measure(M.mkCistern(false)),b1=measure(M.mkCistern(true));ok(b1.tri!==b0.tri,'the broken cistern differs from the whole one');}
{const g=M.mkPumphus(),{sub}=check('pumphus',g,{tri:2500,calls:14,floor:0,win:1,lamp:1});
  const h=sub('house');ok(near(h.s.x,12,.05)&&near(h.s.z,8,.05)&&near(h.s.y,5,.03),'the pumphouse is 12 x 8 x 5 m ('+h.s.toArray().map(v=>v.toFixed(1)).join(' x ')+')');
  const p=sub('pipes');ok(near(p.s.y,1.8,.1)&&p.b.min.y>=-.01,'the pipes are 0.8 m across on 1 m supports ('+p.s.y.toFixed(2)+' high)');}
{const g=M.mkTanker(),{m,sub}=check('tanker',g,{tri:6000,calls:24,floor:-10,win:1,lamp:1});
  const h=sub('hull');ok(near(h.s.x,150,.01)&&near(h.s.z,24,.01),'the hull is 150 x 24 m ('+h.s.x.toFixed(1)+' x '+h.s.z.toFixed(1)+')');
  ok(near(h.b.max.y,8,.03),'the freeboard is 8 m ('+h.b.max.y.toFixed(2)+')');ok(Math.abs(h.b.min.y+10)<.01,'the hull goes 10 m below the waterline');
  ok(near(m.size.x,150,.02),'nothing sticks out beyond the 150 m');ok(Math.abs(m.bb.min.x+m.bb.max.x)<150*.02,'amidships is the origin');
  const s=sub('house');ok(near(s.s.z,22,.06)&&s.b.max.y>=17&&s.b.max.y<=30,'the superstructure is about 22 m wide and four decks high ('+s.s.z.toFixed(1)+' wide, top '+s.b.max.y.toFixed(1)+')');
  ok(s.b.max.x<-40&&s.b.min.x<-60,'the superstructure is aft (-x)');
  ok(h.b.max.x>74&&h.b.min.x>-76,'the bow is toward +x');}
{const a=measure(M.mkTanker()),b=measure(M.mkTanker());ok(a.tri===b.tri,'the tanker builds the same twice');}
console.log(fail?'FAILED '+fail:'PASSED');process.exit(fail?1:0);
