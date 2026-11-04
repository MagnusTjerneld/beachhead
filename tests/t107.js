// Call numbers (issue 114, Magnus 2 nov): every own unit has a letter for its kind (V VARG, H HOK, X GETING, G GADDA, B BAVER, M MUS, K KROK) and the
// lowest free number among the living of that kind, V01 for the first VARG, so that a replacement can take the number of one that was lost. The number is set
// when the unit is built (the starting units too), saved, given to the units of an older save when it is loaded, and on the model as flat letters that bake
// into the hull's draw call (no extra call; a few triangles). The model half builds the models headless the way t99 does.
const fs=require('fs'),path=require('path');global.performance={now:()=>0};
let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
/* ---- the game: numbers, names, lowest free, saves ---- */
require('./g2.js');const B=globalThis.__BH;
B.newGame(7341);let G=B.G;G.running=true;
{const e=G.units.find(u=>u.kind==='eng'),k=G.kroks[0];
  ok(e.num===1&&e.tag==='B01'&&e.name==='BÄVER B01','the starting BÄVER is B01 ('+e.name+')');
  ok(k.num===1&&k.tag==='K01'&&k.name==='KROK K01','the starting KROK is K01 ('+k.name+')');}
const mk=(kind)=>{const u=B.makeUnit(kind,G.units[0].x+5,G.units[0].y);G.units.push(u);return u;};
{const v=[mk('tank'),mk('tank'),mk('tank')];
  ok(v.map(u=>u.tag).join()==='V01,V02,V03','three VARG are V01, V02 and V03 ('+v.map(u=>u.tag)+')');
  ok(v[0].name==='VARG V01'&&v[1].num===2,'the name is the kind and the call number ('+v[0].name+')');
  const want={drone:['H01','HÖK H01'],scout:['X01','GETING X01'],gadda:['G01','GÄDDA G01'],mus:['M01','MUS M01'],eng:['B02','BÄVER B02']};
  for(const k in want){const u=mk(k);ok(u.tag===want[k][0]&&u.name===want[k][1],k+' is '+want[k][1]+' ('+u.tag+', '+u.name+')');}
  /* the lowest free: V02 lost, the next VARG takes V02, and then V04 */
  v[1].dead=true;const n=mk('tank'),n2=mk('tank');
  ok(n.tag==='V02'&&n2.tag==='V04','a lost number is taken again, then the next free ('+n.tag+', '+n2.tag+')');
  ok(G.units.filter(u=>u.kind==='tank'&&!u.dead).every((u,i,a)=>a.findIndex(x=>x.tag===u.tag)===i),'no two living VARG share a number');
  ok(B.nextCall('drone')===2&&B.nextCall('tank')===5,'the next number is per kind ('+B.nextCall('drone')+', '+B.nextCall('tank')+')');
  /* KROK, a second and then a replacement */
  const k2=B.makeKrok();G.kroks.push(k2);ok(k2.tag==='K02'&&k2.name==='KROK K02','a second KROK is K02');
  G.kroks[0].dead=true;const k3=B.makeKrok();ok(k3.tag==='K01','a KROK that is lost leaves K01 to the next ('+k3.tag+')');G.kroks.push(k3);
  const m=mk('mus');ok(m.tag==='M02','another MUS is M02 ('+m.tag+')');
  ok(Object.values(B.CALLSIGN).join('')==='VJHXGBMKC','one letter per kind: V H X G B M K, C for the downed crew (issue 124) and J for BJÖRN (issue 92) ('+Object.values(B.CALLSIGN).join('')+')');
  ok(G.units.every(u=>u.tag.length===3&&u.tag[0]===B.CALLSIGN[u.kind]),'every tag is a letter and two digits (the chart marks and the panel fit three characters)');}
/* a save keeps the numbers; an older save without them gets them when it is loaded */
{G.paused=true;const sv=JSON.parse(JSON.stringify(B.saveState())),before=G.units.map(u=>u.id+':'+u.tag+':'+u.name).join('|'),kb=G.kroks.map(k=>k.id+':'+k.tag).join('|');
  B.newGame(1490);B.newGame(7341);B.applySave(sv);G=B.G;
  ok(G.units.map(u=>u.id+':'+u.tag+':'+u.name).join('|')===before,'a save brings the numbers, tags and names back');ok(G.kroks.map(k=>k.id+':'+k.tag).join('|')===kb,'and the KROK numbers');
  /* an old save: the numbers taken out, the names as they were (VARG-1 ...) */
  let n=0;for(const u of G.units){delete u.num;u.tag='V'+(++n);u.name='VARG-'+n;}for(const k of G.kroks){delete k.num;k.tag='K';k.name='KROK';}
  const dead=G.units.find(u=>u.dead);const old=JSON.parse(JSON.stringify(B.saveState()));B.newGame(1490);B.newGame(7341);B.applySave(old);G=B.G;
  const live=G.units.filter(u=>!u.dead),LB={tank:'VARG',drone:'HÖK',scout:'GETING',gadda:'GÄDDA',eng:'BÄVER',mus:'MUS'};
  ok(live.every(u=>u.num>0&&u.tag===B.callTag(u.kind,u.num)),'an older save gets a number for every unit that is alive');
  ok(live.every(u=>u.name===LB[u.kind]+' '+u.tag),'with the kind and the number as its name');
  ok(Object.keys(LB).every(k=>{const a=live.filter(u=>u.kind===k).map(u=>u.num).sort((x,y)=>x-y);return a.every((x,i)=>x===i+1);}),'numbered from 01 in the order of the units, with no gaps');
  ok(G.kroks.filter(k=>!k.dead).every(k=>k.num>0&&k.tag===B.callTag('krok',k.num)),'and for the KROK');
  ok(!dead||!dead.num,'a unit that was already lost gets none');
  const keep=G.units[0].num;B.numberUnits();ok(G.units[0].num===keep,'numbering again changes nothing');}
/* ---- the models ---- */
const THREE=require('three');
const src=fs.readFileSync(path.join(__dirname,'g2.js'),'utf8').split('\r').join('');
const MARK='\nif(!hasDOM)return;\n',i=src.indexOf(MARK),R0=src.indexOf('\nlet R3=null;\n'),j=src.indexOf('function mkEnemyMesh(e){'),k2=src.indexOf('\n}\n',j)+3;
const fn=n=>{const a=src.indexOf('\nfunction '+n+'(');if(a<0)throw new Error('function '+n+' not found');return src.slice(a,src.indexOf('\n}\n',a)+3);},
  st=n=>{const a=src.indexOf('\nconst '+n+'=');if(a<0)throw new Error('const '+n+' not found');return src.slice(a,src.indexOf('\n',a+1)+1);};
const cv=()=>({width:0,height:0,getContext:()=>new Proxy({},{get:(t,p)=>p==='createRadialGradient'||p==='createLinearGradient'?()=>({addColorStop(){}}):()=>{},set:()=>true})});
global.document={createElement:cv};
const body=(src.slice(0,i)+'\n'+src.slice(R0,k2)+fn('krokLegs')+st('HOVER_Y')+st('_lgI')).replace('(function(){','').split('\n').filter(l=>!l.startsWith("if(typeof globalThis!=='undefined')globalThis.__BH=")).join('\n')
  +'\nreturn{mkUnitMesh,svNum,svCall,SV_FONT,setR3:o=>{R3=o;}};\n';
const M=new Function('THREE',body)(THREE);
const lamp=new THREE.MeshLambertMaterial({color:0xe8e4d0});
const meas=g=>{g.updateMatrixWorld(true);let tri=0,meshes=0,h=0;const lug=g.userData.lugs;g.traverse(o=>{if(!o.isMesh||(lug&&o.parent===lug))return;meshes++;const ge=o.geometry,p=ge.attributes.position;tri+=(ge.index?ge.index.count:p.count)/3;
  for(let n=0;n<p.array.length;n++)h=(h*31+Math.round(p.array[n]*1000))|0;});return{tri,meshes,h};};
const kinds=['tank','drone','scout','eng','mus','gadda','krok'];
/* the font: every glyph a rectangle of rows of equal length, and the digits and the seven letters are all there */
ok('0123456789VHXGBMK'.split('').every(c=>{const g=M.SV_FONT[c];return g&&g.length===7&&g.every(r=>r.length===g[0].length&&/^[01]+$/.test(r));}),'the pixel font has 0 to 9 and V H X G B M K, seven rows each');
{const a=M.svNum('V01',.1),t=a.children[0].geometry.attributes.position.count/3;ok(t>=8&&t<=60,'"V01" is a handful of flat triangles ('+t+')');
  ok(M.svNum('V01',.1).children[0].geometry===a.children[0].geometry,'the shared geometry is built once per text and size');ok(M.svNum('V01',.1,true).children[0].geometry!==a.children[0].geometry,'a copy for the models that scale their geometry in place');}
for(const kind of kinds){
  M.setR3({lampMat:lamp,season:{brown:0,snow:0}});
  const mk1=n=>meas(M.mkUnitMesh({kind,color:'#3aa0c8',ammo:4,num:n}));
  const a=meas(M.mkUnitMesh({kind,color:'#3aa0c8',ammo:4})),b=mk1(1),c=mk1(2),d=mk1(88);
  ok(b.tri>a.tri,kind+': the number is in the model ('+a.tri+' triangles without, '+b.tri+' with '+M.svCall({kind,num:1})+')');
  ok(b.meshes===a.meshes&&d.meshes===a.meshes,kind+': it adds no draw call ('+a.meshes+' with and without)');
  ok(b.h!==c.h,kind+': 01 and 02 are different geometry');ok(d.tri>b.tri,kind+': 88 has more to it than 01 ('+d.tri+' triangles)');
  ok(b.tri-a.tri<=120,kind+': the number is cheap ('+(b.tri-a.tri)+' triangles)');
  /* rebuilt for another season: the number goes with it */
  M.setR3({lampMat:lamp,season:{brown:1,snow:0}});const w=mk1(1),w0=meas(M.mkUnitMesh({kind,color:'#3aa0c8',ammo:4}));
  ok(w.tri>w0.tri&&w.tri===b.tri,kind+': a model rebuilt for the autumn keeps its number');}
ok(M.svCall({kind:'tank',num:1})==='V01'&&M.svCall({kind:'krok',num:12})==='K12'&&M.svCall({kind:'gadda'})==='','svCall gives the number as the model shows it, or nothing without one');
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
