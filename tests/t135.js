// Issue 171. Small faults from the code review (10 nov): the foam pool after a new island, the log's buttons after a loaded save, the benchmark's
// error path, MUS without a contact shadow, CAP.slow missing, address options that did not read the hash (#), the star sky's sine hash, and
// resetFor leaving unsafeWait. What needs three.js (foam, shadow, sky) is checked in the source text.
global.performance={now:()=>Date.now()};
const fs=require('fs'),path=require('path');
global.location={search:'',hash:'#photo=1&kust=1&ekapten=1&eshare=1&wtok=3&efter=bloom&budget=150'};/* the options after #, as on the artefact */
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const src=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
/* ---- address options read the hash too ---- */
ok(B.BOOTQ.get('photo')==='1','BOOTQ reads the hash');
ok(B.PHOTO===true,'photo from #');
ok(B.KUST_ISLE.on===1,'kust from #');
ok(B.CAP.on===true,'ekapten from #');
ok(B.ENEMY_SHARE.on===true,'eshare from #');
ok(/const WTOK=\(\(\)=>\{try\{const v=\+BOOTQ\.get\("wtok"\)/.test(src),'wtok reads BOOTQ (the sky and water are not built headless)');
ok(/const q=BOOTQ\.get\('efter'\)/.test(src),'efter reads BOOTQ (the post-processing is not built headless)');
ok(/try\{const q=BOOTQ,bu=\+q\.get\('budget'\)/.test(src)&&/try\{const q=BOOTQ,fm=q\.get\('form'\)/.test(src),'budget and form read BOOTQ (set late in the script)');
ok(!/new URLSearchParams\(location\.search\)/.test(src.replace(/const BOOTQ=[^\n]*\n/,'')),'only BOOTQ reads location.search');
ok(src.indexOf('const BOOTQ=')<src.indexOf('const PHOTO='),'BOOTQ is defined before its first use');
/* ---- CAP.slow ---- */
ok(typeof B.CAP.slow==='number'&&B.CAP.slow>0,'CAP.slow exists: '+B.CAP.slow);
ok(Number.isFinite(1000+B.CAP.slow),'slowT is a number');
B.setCap(false);
/* ---- the log's buttons after a saved game is loaded ---- */
B.newGame(7341);let G=B.G;G.running=true;G.paused=true;
{B.say(G.units[0],'Prov med knapp.',[{l:'Knapp',f:()=>{throw new Error('should not run');}}]);
  ok(G.log.some(l=>l.acts&&l.acts.length),'a log row has buttons before the save');
  const sv=JSON.parse(JSON.stringify(B.saveState()));B.newGame(1490);B.applySave(sv);G=B.G;
  ok(G.log.length>0&&G.log.every(l=>l.acts==null),'after loading, no row keeps a button (acts null): '+G.log.length+' rows');}
/* ---- resetFor ---- */
{const u=B.makeUnit('tank',100,100);u.unsafeWait=true;u.hold=true;B.resetFor(u);ok(u.unsafeWait===false,'resetFor clears unsafeWait');}
/* ---- the world's reason is empty for a valid world ---- */
ok(!B.WORLD.why,'W.why is empty for a valid island: '+B.WORLD.why);
/* ---- the benchmark's error path (the benchmark is built late in the script, so the source is read) ---- */
ok(/catch\(err\)\{BENCH\.on=false;diagErr\('benchmark',err\);try\{benchDone\(\);\}catch\(_\)\{\}/.test(src),'the frame calls benchDone, guarded, when the benchmark fails');
ok(/let q=null;try{q=BOOTQ;}catch/.test(src),'the benchmark options read BOOTQ');
/* ---- the source: foam pool, MUS shadow, the sky hash ---- */
ok(/R3\.rings=null;R3\.foam=null;/.test(src),'buildStatic empties the foam pool');
{const i=src.indexOf("if(u.ty==='mus'"),m=/if\(u\.kind==='mus'\)\{\s*\n/.exec(src.slice(src.indexOf('function mkUnitMesh')));
  const a=src.indexOf('function mkUnitMesh'),s=src.slice(a+m.index,a+m.index+12000),j=s.indexOf("if(u.ty==='bjorn')");
  ok(j>0&&/contactShadow\(r,\.02\);return r;/.test(s.slice(0,j)),'the MUS branch puts down a contact shadow before it returns');
  ok(!/u\.kind==='mus'\)contactShadow/.test(src),'and the dead test further down is gone');}
{const a=src.indexOf('function mkSky'),s=src.slice(a,a+6000);
  ok(!/sin\(/.test(s.slice(0,s.indexOf('return sky'))),'the star sky has no sine hash');
  ok(/float hash\(vec3 p\)\{vec3 p3=fract/.test(s),'it uses the sine-free hash');}
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
