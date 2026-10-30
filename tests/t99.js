// The model contract (issue 76, Magnus 30 okt): builds every own unit's model and every enemy model headless with the game's own code (mkUnitMesh,
// mkEnemyMesh) and checks each against CONTRACT below: the parts the game animates exist and are the right kind, the model stands on the ground,
// has a plausible size, stays inside a budget of triangles and draw calls (baked meshes: one per material), has no stray parts, no NaN, and
// that proto/mkgalleri.py still finds every piece of game code it greps out of index.html. T99_PROBE=1 prints what each model measures.
// The game script stops at its own "if(!hasDOM)return;" headless (the 3D part is never reached), so the 3D code is cut out of g2.js and run here.
const fs=require('fs'),path=require('path');global.performance={now:()=>0};
const THREE=require('three');let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const src=fs.readFileSync(path.join(__dirname,'g2.js'),'utf8').split('\r').join('');
const MARK='\nif(!hasDOM)return;\n',i=src.indexOf(MARK),R0=src.indexOf('\nlet R3=null;\n'),j=src.indexOf('function mkEnemyMesh(e){'),k=src.indexOf('\n}\n',j)+3;
ok(i>0&&R0>i&&j>R0&&k>j,'the 3D model code is where this test looks for it (the early return in the game script, let R3, then mkEnemyMesh)');
if(!(i>0&&R0>i&&j>R0&&k>j)){console.log('FAILED');process.exit(1);}
// functions the models use that live further down the file, cut out by name
const EXTRA=['krokLegs'],fn=n=>{const a=src.indexOf('\nfunction '+n+'(');if(a<0)throw new Error('function '+n+' not found');return src.slice(a,src.indexOf('\n}\n',a)+3);},
  st=n=>{const a=src.indexOf('\nconst '+n+'=');if(a<0)throw new Error('const '+n+' not found');return src.slice(a,src.indexOf('\n',a+1)+1);};
// a canvas that draws nothing, for the contact shadow texture
const cv=()=>({width:0,height:0,getContext:()=>new Proxy({},{get:(t,p)=>p==='createRadialGradient'||p==='createLinearGradient'?()=>({addColorStop(){}}):()=>{},set:()=>true})});
global.document={createElement:cv};
// the __BH line names things declared after the early return, which are not run here
const body=(src.slice(0,i)+'\n'+src.slice(R0,k)+EXTRA.map(fn).join('')+st('HOVER_Y')+st('_lgI')).replace('(function(){','').split('\n').filter(l=>!l.startsWith("if(typeof globalThis!=='undefined')globalThis.__BH=")).join('\n')
  +'\nreturn{mkUnitMesh,mkEnemyMesh,setR3:o=>{R3=o;},TYPES,ENEMY};\n';
const M=new Function('THREE',body)(THREE);
M.setR3({lampMat:new THREE.MeshLambertMaterial({color:0xe8e4d0})});

const measure=g=>{g.updateMatrixWorld(true);let tri=0,meshes=0,bad=0;const bb=new THREE.Box3(),mats=new Set();
  g.traverse(o=>{if(!o.isMesh)return;meshes++;mats.add(o.material.uuid);const ge=o.geometry,p=ge.attributes.position;tri+=(ge.index?ge.index.count:p.count)/3;
    for(let n=0;n<p.array.length;n++)if(!isFinite(p.array[n])){bad++;break;}});
  bb.setFromObject(g);const s=bb.getSize(new THREE.Vector3());return{tri,meshes,mats:mats.size,bad,min:bb.min,max:bb.max,size:s};};
const objs=(v,out=[])=>{if(!v)return out;if(Array.isArray(v)){for(const x of v)objs(x,out);}else if(v.isObject3D)out.push(v);return out;};
const inTree=(g,o)=>{let p=o;while(p){if(p===g)return true;p=p.parent;}return false;};

/* The contract. parts: userData keys the game's sync3D (or the weapons and effects code) reads, all of them must exist, hold at least one
   object (or a function for fn), and each object must hang under the model. tri and calls are ceilings (about 25 % over what the model
   measured on 30 okt); h is the plausible height range and foot the plausible lowest point of the model, both in metres (the model is built at
   its own origin on the ground; flying ones hang on their own height). len is the plausible longest side. */
const CONTRACT={
  unit:{
    scout:{parts:['spin'],tri:1300,calls:8,h:[.4,2],len:[1.5,4],foot:[-.8,.1]},
    drone:{parts:['spin','rockets','legs','ducts'],tri:3000,calls:24,h:[.8,3],len:[5,12],foot:[-.8,.1]},
    tank:{parts:['tur'],tri:1800,calls:6,h:[2,6.5],len:[6,13],foot:[-.15,.1]},
    eng:{parts:[],tri:1450,calls:5,h:[2.5,7],len:[4.5,9],foot:[-.15,.1]},
    mus:{parts:[],tri:800,calls:3,h:[1.2,3.5],len:[1.2,3],foot:[-.15,.1]},
    gadda:{parts:['launcher','caps','fn:setLift'],tri:1850,calls:28,h:[3,7],len:[6,13],foot:[-.8,.1]},
    krok:{parts:['spin','legs','sw','hook','cable'],legDef:true,tri:3050,calls:28,h:[7,16],len:[14,26],foot:[-10,0]},
  },
  enemy:{
    turret:{parts:['head'],tri:650,calls:4,h:[3.5,7.5],len:[8,14],foot:[-.15,.1]},
    /* the coast battery is built into a rock face that goes below the origin, so it is tall, wide and sunk by design */
    kust:{parts:['head'],tri:2250,calls:4,h:[12,20],len:[20,36],foot:[-12,.1]},
    aa:{parts:['head'],tri:2050,calls:8,h:[2,5],len:[4.5,9],foot:[-.15,.1]},
    rb:{parts:[],tri:360,calls:3,h:[1.2,2.8],len:[2,4.5],foot:[-.15,.1]},
    inf:{parts:[],tri:620,calls:3,h:[1.2,2.8],len:[1.5,4.5],foot:[-.15,.1]},
    at:{parts:[],tri:380,calls:3,h:[1.2,2.8],len:[1.5,4],foot:[-.2,.1]},
    tank:{parts:['head'],tri:2100,calls:6,h:[2.5,5.5],len:[7,14],foot:[-.15,.1]},
    light:{parts:['head'],tri:1650,calls:6,h:[2.2,5],len:[4.5,9],foot:[-.15,.1]},
  }};
/* Known breaches, left as they are (the models are not changed here): "kind:rule" -> why. A rule listed here is reported as a note, not a failure;
   when the model is fixed the exception must go (this test fails if an exception no longer applies). */
const EXCEPT={};

const probe=!!process.env.T99_PROBE,seen=new Set();
const check=(grp,kind,make)=>{const C=CONTRACT[grp][kind],tag=grp+' '+kind;let g;
  try{g=make();}catch(e){ok(false,tag+': builds ('+String(e.stack).split('\n').slice(0,3).join(' | ')+')');return;}
  const m=measure(g);
  if(probe)console.log('PROBE '+tag+' tri='+m.tri+' calls='+m.meshes+' mats='+m.mats+' h='+m.size.y.toFixed(2)+' len='+Math.max(m.size.x,m.size.z).toFixed(2)+' foot='+m.min.y.toFixed(2)+' ud='+Object.keys(g.userData).join(','));
  const rule=(name,pass,why)=>{const key=kind+':'+name,ex=grp==='unit'?EXCEPT['u.'+key]:EXCEPT['e.'+key];seen.add(grp==='unit'?'u.'+key:'e.'+key);
    if(ex){ok(!pass,tag+': '+name+' is a known breach ('+ex+') and must still be one; if it is fixed, take the exception out');return;}
    ok(pass,tag+': '+name+(pass?'':' ('+why+')'));};
  rule('builds a group with meshes',g.isObject3D&&m.meshes>0,'no meshes');
  rule('no NaN in the geometry',m.bad===0,m.bad+' bad arrays');
  for(const p of C.parts){
    if(p.startsWith('fn:')){const f=p.slice(3);rule('userData.'+f+' is a function',typeof g.userData[f]==='function','is '+typeof g.userData[f]);continue;}
    const o=objs(g.userData[p]);rule('userData.'+p+' holds parts that hang under the model',o.length>0&&o.every(x=>inTree(g,x)),o.length+' objects, '+o.filter(x=>!inTree(g,x)).length+' loose');}
  if(C.legDef){const d=g.userData.legDef;rule('userData.legDef has U, K and B for every leg, under the model',Array.isArray(d)&&d.length>0&&d.every(l=>[l.U,l.K,l.B].every(x=>x&&inTree(g,x))),'legDef is '+(d&&d.length)+' long');}
  rule('triangles within '+C.tri,m.tri<=C.tri,m.tri+' triangles');
  rule('draw calls within '+C.calls,m.meshes<=C.calls,m.meshes+' meshes');
  rule('height in '+C.h.join('..')+' m',m.size.y>=C.h[0]&&m.size.y<=C.h[1],m.size.y.toFixed(2)+' m');
  const L=Math.max(m.size.x,m.size.z);rule('length in '+C.len.join('..')+' m',L>=C.len[0]&&L<=C.len[1],L.toFixed(2)+' m');
  rule('lowest point in '+C.foot.join('..')+' m (stands on the ground)',m.min.y>=C.foot[0]&&m.min.y<=C.foot[1],'lowest '+m.min.y.toFixed(2)+' m');
  const R=1.2*Math.max(...C.len);rule('centred on its origin (within '+R.toFixed(0)+' m)',Math.max(Math.abs(m.min.x),Math.abs(m.max.x),Math.abs(m.min.z),Math.abs(m.max.z))<=R,'x '+m.min.x.toFixed(1)+'..'+m.max.x.toFixed(1)+', z '+m.min.z.toFixed(1)+'..'+m.max.z.toFixed(1));
  rule('no stray part (every mesh hangs under the model)',(()=>{let n=0;g.traverse(o=>{if(o.isMesh&&!inTree(g,o))n++;});return n===0;})(),'loose mesh');
  return g;};

for(const kind in CONTRACT.unit)check('unit',kind,()=>M.mkUnitMesh({kind,color:'#3aa0c8',ammo:4}));
for(const kind in CONTRACT.enemy)check('enemy',kind,()=>M.mkEnemyMesh({kind,id:'e1'}));
// the contract names every kind the game has
ok(Object.keys(M.TYPES).sort().join()===Object.keys(CONTRACT.unit).filter(k=>k!=='krok').sort().join(),'the contract names every unit kind in TYPES (and KROK): '+Object.keys(M.TYPES).join(','));
ok(Object.keys(M.ENEMY).sort().join()===Object.keys(CONTRACT.enemy).sort().join(),'the contract names every enemy kind in ENEMY: '+Object.keys(M.ENEMY).join(','));
for(const ex in EXCEPT)ok(seen.has(ex),'the exception '+ex+' names a rule that exists');
// the same model twice gives the same numbers (nothing depends on a cache that changes the shape)
{const a=measure(M.mkUnitMesh({kind:'tank',color:'#3aa0c8',ammo:4})),b=measure(M.mkUnitMesh({kind:'tank',color:'#c8a03a',ammo:0}));ok(a.tri===b.tri&&a.meshes===b.meshes,'a unit model does not change shape with colour or ammunition');}

// proto/mkgalleri.py finds its pieces by searching index.html for text: every literal it searches for must still be there
{const py=fs.readFileSync(path.join(__dirname,'..','proto','mkgalleri.py'),'utf8'),html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8').split('\r').join('');
  const lits=[...py.matchAll(/(?:grab|stmt)\((['"])((?:\\.|(?!\1).)*)\1/g)].map(m=>m[2].replace(/\\n/g,'\n').replace(/\\'/g,"'")),
    idx=[...py.matchAll(/g\.index\((['"])((?:\\.|(?!\1).)*)\1/g)].map(m=>m[2].replace(/\\'/g,"'"));
  ok(lits.length>=15,'mkgalleri.py: found '+lits.length+' grab and stmt searches to check');
  for(const l of lits.concat(idx))ok(html.includes(l),'mkgalleri.py: index.html still has "'+l.replace(/\n/g,'\\n').slice(0,50)+'"');
  // and the pieces come in the order it cuts them: each grab ends after it starts
  const pos=(s)=>html.indexOf(s);ok(pos('function mkGadda(')<pos('function mkUnitMesh('),'mkgalleri.py: mkGadda comes before mkUnitMesh (it cuts between them)');
  ok(pos("/* KROK's legs between folded")<pos('function krokSwing('),"mkgalleri.py: the KROK leg code comes before krokSwing (it cuts between them)");}

console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
