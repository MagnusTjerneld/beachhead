// The enemy's alert level and the intercepted radio traffic (issue 187, Magnus 11 nov): two levels, calm and alarm, derived from the captain's
// own picture; the lines "Avlyssnat: ..." come only while the player holds a station (a taken point, or a radio mast coupled in), name only points the player knows, and stop
// when the command centre is taken ("Fiendens ledning har tystnat." once); with the captain off nothing is shown and nothing changes.
// The level is not shown to the player (Magnus 12 nov); it is the captain's state, and a recording keeps it and every decision (issue 194).
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
let G,lines,seenLog,unk=[];const leak=[];
const seedRand=s=>{let x=s>>>0;Math.random=()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};};
function fresh(cap,station,n){seedRand(7);B.newGame(1264);G=B.G;G.running=true;G.netAll=true;G.mines=[];G.units=[];G.known.fill(1);G.knownV++;B.LOS.on=false;G.krokAuto=false;
  B.setCap(!!cap);if(!cap)B.ENEMY_SHARE.on=false;lines=[];seenLog=new Set();
  if(station){const r=G.relays.find(q=>q.type!=='central'&&q.type!=='radar');r.captured=true;r.capT=1e9;}/* taken "in the future": a station that the captain does not counterattack */
  const r0=G.relays[0];for(let i=0;i<(n||4);i++){const u=B.makeUnit('tank',r0.x-60+(i%5)*8,r0.y-40-Math.floor(i/5)*8);u.hp=u.maxhp=150;G.units.push(u);}}
/* every new log line is kept, and checked against the points the player does not know at that moment */
const collect=()=>{for(const l of G.log)if(!seenLog.has(l)){seenLog.add(l);lines.push(l);
  if(/^Avlyssnat/.test(l.text))for(const id of unk)if(new RegExp('\\b'+id+'\\b').test(l.text))leak.push(l.text);}};
const run=(n,f)=>{for(let i=0;i<n;i++){unk=G.relays.filter(r=>!B.rKnown(r)).map(r=>r.id);B.step(.05);collect();if(f)f(i);}};
const av=()=>lines.filter(l=>/^Avlyssnat/.test(l.text));
const SILENT='Fiendens ledning har tystnat.';

ok(typeof B.capLevel==='function'&&typeof B.capStation==='function','capLevel and capStation are exported');

// the captain off: no level, no lines, no picture
fresh(false,true);run(1200);
ok(B.capLevel()===null&&!G.eCap&&av().length===0,'captain off: no level, no picture, no Avlyssnat line');

// at the start the level is calm; a sighting: calm until the report reaches the captain, then alarm, and the line comes with it
fresh(true,true);ok(B.capLevel()==='calm','at the start the level is calm');
{let rep=null,seen=null,lvlAtRep=null,lineAt=null,alarmAt=null;
  run(600,()=>{if(rep===null&&G.eRep&&G.eRep.size){rep=G.time;lvlAtRep=B.capLevel();}
    if(seen===null&&G.eCap&&G.eCap.seen.size)seen=G.time;
    if(alarmAt===null&&B.capLevel()==='alarm')alarmAt=G.time;
    if(lineAt===null&&av().some(l=>/rapporterar/.test(l.text)))lineAt=G.time;});
  ok(rep!==null&&lvlAtRep==='calm','a post has seen a unit and the level is still calm (the suspicious state is not built)');
  ok(seen!==null&&seen-rep>=B.CAP.lag-1.1,'the report reaches the captain after the lag ('+(seen-rep).toFixed(1)+' s)');
  ok(alarmAt!==null&&alarmAt-seen<=1.1&&alarmAt>=seen,'the level goes to alarm when the picture has something in it ('+(alarmAt-seen).toFixed(2)+' s after)');
  ok(lineAt!==null&&lineAt>=seen&&lineAt-seen<=1.1,'the line "posten ... rapporterar" is written when the report reaches the captain, not when the post sees ('+(lineAt-seen).toFixed(2)+' s after)');
  const l=av().find(x=>/rapporterar/.test(x.text));
  ok(!!l&&/^Avlyssnat: (posten vid \w+|en post) rapporterar (fordon|flyg|fartyg) i [A-N]\d+\.$/.test(l.text),'the line names the post and a chart square: "'+(l&&l.text)+'"');}

// decisions give their lines, and the lines keep the silences that exist
run(900);
{const C=G.eCap;ok(C.stat.alarm>0,'the captain decides an alarm ('+JSON.stringify(C.stat)+')');
  ok(av().some(l=>/^Avlyssnat: larm från (posten vid \w+|en post)\. Pjäserna i närheten vrids mot [A-N]\d+\.$/.test(l.text)),'an alarm decision gives its line');
  ok(!av().some(l=>/\d/.test(l.text.replace(/ [A-N]\d+\.$/,'').replace(/\b[RH]\d?\b/g,''))),'no line gives a number of guns or units');
  const gaps=re=>{const by={};let g=1e9;for(const l of av().filter(x=>re.test(x.text))){const k=l.text.replace(/ rapporterar.*|\. Pjäserna.*/,'');if(by[k]!=null)g=Math.min(g,l.t-by[k]);by[k]=l.t;}return g;};
  const g1=gaps(/rapporterar/),g2=gaps(/larm från/);
  ok(g1>=B.CAP.qAlarm*.79,'a post reports at most once per CAP.qAlarm ('+(g1>1e8?'only once':g1.toFixed(1)+' s')+')');
  ok(g2>=B.CAP.qAlarm*.79,'an alarm from a post at most once per CAP.qAlarm ('+(g2>1e8?'only once':g2.toFixed(1)+' s')+')');
  /* the decision repeats every qAlarm; the same line (same post, same square) is written at most once per CAP.qLine */
  {const by={};let g=1e9;for(const l of av().filter(x=>/larm från/.test(x.text))){if(by[l.text]!=null)g=Math.min(g,l.t-by[l.text]);by[l.text]=l.t;}
    ok(g>=B.CAP.qLine-.06&&G.eCap.stat.alarm>av().filter(x=>/larm från/.test(x.text)).length,'the same alarm line at most once per CAP.qLine ('+(g>1e8?'only once':g.toFixed(1)+' s')+', '+G.eCap.stat.alarm+' decisions, '+av().filter(x=>/larm från/.test(x.text)).length+' lines)');}}
ok(leak.length===0,'no line names a point the player does not know ('+leak.join(' | ')+')');

// with no unit left nothing new is known: back to calm, not before CAP.calm after the last decision
{G.units.length=0;let alarmUntil=0,calmAt=null;const C=G.eCap;run(2400,()=>{if(B.capLevel()==='alarm')alarmUntil=G.time;else if(calmAt===null)calmAt=G.time;});
  ok(calmAt!==null&&C.seen.size===0,'with nothing new the level falls back to calm (at '+(calmAt&&calmAt.toFixed(0))+' s)');
  ok(calmAt!==null&&calmAt>=C.decT+B.CAP.calm-.06&&alarmUntil<=calmAt,'not before CAP.calm after the last decision ('+(calmAt-C.decT).toFixed(1)+' s after it)');}

// no flicker while the units stay in sight
fresh(true,true);run(600);ok(B.capLevel()==='alarm','the second game reaches alarm as well');
{let flips=0,last=B.capLevel();run(1200,()=>{const l=B.capLevel();if(l!==last){flips++;last=l;}});ok(flips===0,'the level does not flicker ('+flips+' changes in 60 s)');}

// without a station: the level is shown, no Avlyssnat line, the old counterattack line stays
fresh(true,false);run(1200);
ok(B.capLevel()==='alarm'&&!B.capStation(),'no station: the level still goes to alarm');
ok(av().length===0,'no station: no Avlyssnat line ('+av().length+')');
fresh(true,false,1);{const r=G.relays[0];r.captured=true;r.capT=0;G.time=1;run(1200);
  ok(G.eCap.stat.counter>0&&lines.some(l=>/^Fienden rycker ut mot /.test(l.text)),'a counterattack says "Fienden rycker ut mot ..." as before');}
{fresh(true,false);const r=G.relays.find(q=>q.type!=='central'&&q.type!=='radar');
  run(700);const n=av().length;r.captured=true;r.capT=G.time;run(1200);ok(n===0&&av().length>0,'a station taken later: the lines start ('+n+' before, '+av().length+' after)');}
/* a radio mast coupled in is a station as well (Magnus 11 nov): no point taken, and the lines start with the mast */
{fresh(true,false);const m=G.structs.find(s=>s.kind==='mast'&&!s.dead);ok(!!m,'the island has a radio mast');
  run(700);const n=av().length,st0=B.capStation();m.relay=true;G.masts.push({x:m.x,y:m.y,id:m.id});run(1200);
  ok(!st0&&B.capStation()&&!G.relays.some(r=>r.captured),'a mast coupled in is a station, with no point taken');ok(n===0&&av().length>0,'a mast coupled in: the lines start ('+n+' before, '+av().length+' after)');}

// the command centre taken: silent, one line, no new traffic
fresh(true,true);run(600);
{const c=G.relays.find(r=>r.type==='central');c.captured=true;c.capT=G.time;run(40);const nAfter=av().length;run(1200);
  ok(B.capLevel()==='silent','the command centre taken: the level is silent');
  ok(lines.filter(l=>l.text===SILENT).length===1,'"'+SILENT+'" is written once');
  ok(av().length===nAfter,'no new traffic after it ('+nAfter+' at the first seconds, '+av().length+' at the end)');}
// a save with the captain on keeps its picture as Maps, and the loaded game goes on (the serializer saved Maps as empty objects)
fresh(true,true);run(600);
{const n=G.eRep.size,m=G.eCap.seen.size,lv=B.capLevel(),sv=JSON.parse(JSON.stringify(B.saveState()));B.newGame(1490);B.applySave(sv);G=B.G;
  ok(G.eRep instanceof Map&&G.eRep.size===n&&G.eCap.seen instanceof Map&&G.eCap.seen.size===m&&G.eCap.q instanceof Map,'a loaded save has the picture as Maps ('+n+' reports, '+m+' seen)');
  let err=null;try{for(let i=0;i<600;i++)B.step(.05);}catch(x){err=x;}ok(!err&&B.capLevel()===lv,'the loaded game goes on with the same alert level ('+(err?err.message:lv)+')');}
// a recording keeps the captain's picture and decisions (issue 194): seen before the first decision, each decision with the units it was built on,
// the level's changes, and nothing at all while no recording runs
fresh(true,true);ok(B.REC.on===false,'no recording runs in the tests');run(600);ok(!B.REC.ev.some(e=>e.type==='kapten')&&G.eCap.log.length>0,'without a recording no event is written ('+G.eCap.log.length+' decisions)');
fresh(true,true);B.REC.ev=[];B.REC.cap=null;B.REC.on=true;run(1200);B.REC.on=false;
{const ev=B.REC.ev.filter(e=>e.type==='kapten'),by=d=>ev.filter(e=>e.d===d),dec=ev.filter(e=>['alarm','counter','reinf','wait'].includes(e.d)),C=G.eCap;
  ok(by('seen').length>0&&by('seen').every(e=>e.u&&e.by&&e.age>=B.CAP.lag-1.1),'a unit entering the picture is written with the post that saw it and the age of the sighting ('+by('seen').length+')');
  {const al=by('level').find(e=>e.lvl==='alarm');ok(by('level')[0].lvl==='calm'&&al&&al.t>=by('seen')[0].t,'the level is written from the start (calm), and alarm not before the first sighting');}
  ok(dec.length===C.log.length&&dec.length>0,'every decision is written ('+dec.length+' of '+C.log.length+')');
  ok(dec.every(e=>e.p===G.relays[e.z].id&&Array.isArray(e.refs)&&e.refs.length>0&&e.refs.every(r=>r.u&&r.x!=null&&r.age!=null)),'each with its point and the units it was built on, with where they were seen');
  ok(JSON.parse(JSON.stringify(ev)).length===ev.length,'the events are plain data');
  G.units.length=0;B.REC.on=true;run(2400);B.REC.on=false;const ev2=B.REC.ev.filter(e=>e.type==='kapten');
  ok(ev2.filter(e=>e.d==='lost').length===by('seen').length,'each unit that entered the picture is written as lost when it falls out ('+ev2.filter(e=>e.d==='lost').length+')');
  ok(ev2[ev2.length-1].d==='level'&&ev2[ev2.length-1].lvl==='calm','and the last event is the level back at calm');
  const c=G.relays.find(r=>r.type==='central');c.captured=true;B.REC.on=true;run(40);B.REC.on=false;ok(B.REC.ev.filter(e=>e.d==='silent').length===1,'the command centre taken is written once');B.REC.ev=[];}
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
