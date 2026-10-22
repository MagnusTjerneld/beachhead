// Testfall (Magnus 22 okt): every case in the game's TESTFALL starts on its island, sets up its situation and passes its own check,
// stands paused with its note in the log, and then plays ten seconds without an error; the ids work in a link (#tf-<id>)
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const T=B.TESTFALL,ids=new Set();
for(const t of T){ok(/^[a-z0-9]+$/.test(t.id)&&!ids.has(t.id),t.id+': an id that works in a link');ids.add(t.id);
  let err=null;try{ok(B.testfall(t.id),t.id+': starts');}catch(e){err=e;}
  if(err){ok(false,t.id+': setup threw '+err.message);continue;}
  const G=B.G;ok(G.seed===t.seed&&G.paused&&G.testfall===t.id,t.id+': on island '+t.seed+', paused');
  ok(G.log.some(l=>/^Testfall: /.test(l.text)),t.id+': says what to try');
  let c=false;try{c=!!t.check();}catch(e){console.log(e.message);}ok(c,t.id+': its own check');
  try{G.paused=false;for(let i=0;i<200;i++)B.step(.05);ok(true,t.id+': plays ten seconds');}catch(e){ok(false,t.id+': plays ten seconds ('+e.message+')');}}
console.log(fail?'FAILED '+fail:'all passed');if(fail)process.exit(1);
