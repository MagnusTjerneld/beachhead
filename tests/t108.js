// Shadow quality and baked jetties and wrecks (issue 100, Magnus 30 okt): (a) the shadow choice under Inställningar (Av / Låg / Mellan /
// Hög; Mellan is what the game always had) turns the sun's shadow off or changes its map size straight away, and is kept in
// localStorage; (b) the jetties are merged into four meshes each, and the wrecks built from loose pieces into one, with the same
// triangles and the same box, and the update that hides a destroyed jetty's deck and posts finds them by handles, not by shapes.
// The 3D code is cut out of g2.js by its text (the game script stops at "if(!hasDOM)return;" headless), as t99 does.
const fs=require('fs'),path=require('path');global.performance={now:()=>0};
const THREE=require('three');let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const src=fs.readFileSync(path.join(__dirname,'g2.js'),'utf8').split('\r').join('');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const cut=(a,b)=>{const i=src.indexOf(a);if(i<0)throw new Error('missing '+a);const j=src.indexOf(b,i);if(j<0)throw new Error('missing '+b);return src.slice(i,j);};
global.document={createElement:()=>({width:0,height:0,getContext:()=>new Proxy({},{get:()=>()=>({addColorStop(){}}),set:()=>true})})};

// (a) the shadow choice: the table, the storage key, the menu button and what applyShadow does to a light
{const tbl=/const SHAD=\{k:'mellan'\},SHAD_N=\{av:0,lag:1024,mellan:2048,hog:4096\}/.test(src);ok(tbl,'the shadow levels are av 0, låg 1024, mellan 2048 (the default, as before), hög 4096');
  ok(/id="bSkugg"/.test(html)&&/localStorage\.setItem\('bh\.skugg'/.test(src)&&/localStorage\.getItem\('bh\.skugg'\)/.test(src),'there is a menu button and the choice is kept in localStorage (read and written inside try)');
  ok(/sun\.castShadow=true;sun\.shadow\.mapSize\.set\(2048,2048\)/.test(src),'the start values are still the old ones: shadows on, 2048');
  ok(/skuggor \(av, låg, mellan eller hög/.test(html),'the help text describes the setting');
  const fnSrc=cut('function applyShadow(){','\nfunction setSkugg');
  const mk=(k,PHOTO)=>{const sun={castShadow:true,shadow:{mapSize:new THREE.Vector2(2048,2048),map:null}};const R3={sun};
    const SHAD={k},SHAD_N={av:0,lag:1024,mellan:2048,hog:4096};const f=new Function('R3','PHOTO','SHAD','SHAD_N',fnSrc+'\nreturn applyShadow;')(R3,PHOTO,SHAD,SHAD_N);return{sun,SHAD,f};};
  let t=mk('mellan',false);let disposed=0;t.sun.shadow.map={dispose(){disposed++;}};t.f();
  ok(t.sun.castShadow&&t.sun.shadow.mapSize.x===2048&&disposed===0&&t.sun.shadow.map,'mellan: shadows on, 2048, the map is left alone');
  t.SHAD.k='lag';t.f();ok(t.sun.castShadow&&t.sun.shadow.mapSize.x===1024&&t.sun.shadow.mapSize.y===1024&&disposed===1&&t.sun.shadow.map===null,'låg: 1024, the old map is disposed and dropped so three.js makes a new one');
  t.SHAD.k='hog';t.f();ok(t.sun.shadow.mapSize.x===4096&&t.sun.castShadow,'hög: 4096');
  t.SHAD.k='av';t.f();ok(!t.sun.castShadow,'av: the sun casts no shadow (the shadow pass is skipped)');
  t.SHAD.k='mellan';t.f();ok(t.sun.castShadow&&t.sun.shadow.mapSize.x===2048,'back to mellan: on again, 2048');
  t=mk('av',true);t.f();ok(t.sun.castShadow&&t.sun.shadow.mapSize.x===2048,'the photo mode keeps its own shadow map whatever the setting');}

// (b) the jetties: the game's own loop, run on its own with the merge stubbed out and then for real
{const i=src.indexOf('  R3.jetM=[];R3.boatM=[];'),jEnd='g.rotation.y=-j.a;g.position.set(j.x,0,j.y);st.add(g);}',j=src.indexOf(jEnd,i)+jEnd.length;ok(i>0&&j>i,'the jetty loop is where this test looks for it');
  const loop=src.slice(i,j);
  const helpers=cut('const MATS=new Map()','function cyl(').replace(/\n$/,'')+'\n'+src.slice(src.indexOf('function cyl('),src.indexOf('function mesh(')).trim()+'\n'+src.slice(src.indexOf('function mesh('),src.indexOf('\n',src.indexOf('function mesh(')))+'\n'
    +cut('const _bm=','const drawCalls');
  const run=(real)=>{const body=helpers.replace('function bake(root,vc,X){','function bake(root,vc,X){if(!REAL)return root;')+'\nconst wood=mat(0x8a7356),post=mat(0x5e4e3a),heightAt=(x,y)=>Math.max(0,3-Math.hypot(x-100,y)*.05),R3={};const D={jetties:[{x:100,y:0,a:Math.PI,len:24},{x:300,y:50,a:1,len:12}]};const st=new THREE.Group();\n'+loop+'\nreturn{R3,st};';
    return new Function('THREE','REAL',body)(THREE,real);};
  const stat=g=>{g.updateMatrixWorld(true);let n=0,tri=0;const bb=new THREE.Box3();g.traverse(o=>{if(o.isMesh){n++;tri+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;bb.expandByObject(o);}});return{n,tri,bb};};
  const a=run(false),b=run(true);
  a.R3.jetM.forEach((g,k)=>{const x=stat(g),y=stat(b.R3.jetM[k]);
    ok(x.n>=y.n+4&&y.n<=4,'jetty '+k+': '+x.n+' meshes before, '+y.n+' after (at most 4: deck, breaking posts, the rest in two paints)');
    ok(x.tri===y.tri,'jetty '+k+': the same '+x.tri+' triangles');
    ok(x.bb.min.distanceTo(y.bb.min)<1e-4&&x.bb.max.distanceTo(y.bb.max)<1e-4,'jetty '+k+': the same box');
    const U=b.R3.jetM[k].userData;ok(U.deck&&U.deck.isMesh&&U.brk&&U.brk.children.length===1,'jetty '+k+': the deck and the breaking posts have handles');
    // hiding the deck and the breaking group takes away exactly the deck and the posts that broke away before
    const z=stat(b.R3.jetM[k]);U.deck.visible=false;U.brk.visible=false;let vis=0,visTri=0;b.R3.jetM[k].traverse(o=>{if(!o.isMesh)return;let p=o,h=true;while(p&&p!==b.R3.jetM[k]){if(!p.visible)h=false;p=p.parent;}if(h){vis++;visTri+=o.geometry.attributes.position.count/3;}});
    ok(vis===2&&visTri<z.tri&&visTri>0,'jetty '+k+': destroyed leaves only the gangway and the other posts ('+vis+' meshes)');});
  ok(/U\.deck\)U\.deck\.visible=!dead;if\(U\.brk\)U\.brk\.visible=!dead/.test(src)&&!/geometry\.parameters\.radiusTop===\.14&&k%3===0\)c\.visible/.test(src),'the update hides the deck and the posts by their handles, no longer by their shapes');
  // the jetties' draw calls on a whole island are counted in the game's own measurement: all jetties together under 5 per jetty
  const per=b.R3.jetM.reduce((s,g)=>s+stat(g).n,0)/b.R3.jetM.length;ok(per<=4,'draw calls for jetties: '+per+' per jetty (limit 4; was '+(a.R3.jetM.reduce((s,g)=>s+stat(g).n,0)/a.R3.jetM.length)+')');}

// (b) the wrecks built from loose pieces
{const body=cut('const MATS=new Map()','function cyl(')+src.slice(src.indexOf('function cyl('),src.indexOf('function mesh(')).trim()+'\n'+src.slice(src.indexOf('function mesh('),src.indexOf('\n',src.indexOf('function mesh(')))+'\n'
    +cut('const _bm=','const drawCalls')+src.slice(src.indexOf('function hedgehog('),src.indexOf('/* old wrecks go to rust'))+src.slice(src.indexOf('function rusted('),src.indexOf('\n',src.indexOf('function rusted(')))+'\n'
    +src.slice(src.indexOf('function sh(g)'),src.indexOf('\n',src.indexOf('function sh(g)')))+'\n'+cut('function mkWreckMesh(w){','const FXM=new Map();')
    +'\nconst contactShadow=()=>{},WRECK_KINDS={own:new Set(),enemy:new Set()},mkUnitMesh=()=>new THREE.Group(),mkEnemyMesh=()=>new THREE.Group(),headOf=()=>null,charred=g=>g,krokDefault=0,groundY=()=>0,TAU=Math.PI*2,PI=Math.PI;\nreturn mkWreckMesh;';
  let mk;try{mk=new Function('THREE',body.replace(/^function sh\(g\)/m,'function sh(g)'))(THREE);}catch(e){console.log('FAIL building the wreck code: '+e.message);fail++;}
  if(mk){const count=g=>{let n=0,tri=0;g.traverse(o=>{if(o.isMesh){n++;tri+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;}});return{n,tri};};
    for(const kind of['rubble','crate','turret']){const w=mk({kind,rot:.37,id:kind,x:0,y:0,big:false}),c=count(w);ok(c.n===1,kind+' wreck: one mesh ('+c.n+'; limit 1)');
      let all=true;w.traverse(o=>{if(o.isMesh&&!(o.castShadow&&o.receiveShadow))all=false;});ok(all,kind+' wreck: the merged mesh casts and receives shadows');}
    let hed=null;for(let r=0;r<40&&!hed;r++){const w=mk({kind:'hulk',rot:r*.173,id:'h'+r,x:0,y:0}),c=count(w);if(c.n===1&&c.tri>=3*12*3)hed=c;}
    ok(!!hed,'a hedgehog wreck (hulk) is one mesh with all its girders'+(hed?' ('+hed.tri+' triangles)':''));}}

console.log(fail?'FAILED':'PASSED');process.exit(fail?1:0);
