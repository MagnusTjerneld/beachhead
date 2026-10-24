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
// the cases for Birka (23 okt) play through: in onto the beach, off the beach to the harbour, from the anchorage to the quay
const until=(f,s)=>{for(let i=0;i<s*20;i++){if(f())return true;B.step(.05);}return f();};
{B.testfall('strand');const G=B.G;G.paused=false;ok(B.beachGo(true)&&until(()=>G.beach.st==='on',300),'strand: she goes in onto the beach');}
{B.testfall('strandhamn');const G=B.G;G.paused=false;ok(until(()=>G.harbor.wait,5),'strandhamn: the harbour waits for the captain');
  ok(B.beachGo(false)&&until(()=>G.harbor.docked,900),'strandhamn: she backs off the beach and docks in the harbour ('+(G.harbor.ph||G.beach.st)+')');}
{B.testfall('kaj');const G=B.G;G.paused=false;ok(until(()=>G.harbor.docked,900),'kaj: from the anchorage she docks in the harbour ('+(G.harbor.ph||'-')+')');}
console.log(fail?'FAILED '+fail:'all passed');if(fail)process.exit(1);
