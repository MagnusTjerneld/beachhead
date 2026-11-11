// The enemy's alert level and the intercepted radio traffic (issue 187, Magnus 11 nov): two levels, calm and alarm, derived from the captain's
// own picture; the lines "Avlyssnat: ..." come only while the player holds a point (a station), name only points the player knows, and stop
// when the command centre is taken ("Fiendens ledning har tystnat." once); with the captain off nothing is shown and nothing changes.
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
  ok(g2>=B.CAP.qAlarm*.79,'an alarm from a post at most once per CAP.qAlarm ('+(g2>1e8?'only once':g2.toFixed(1)+' s')+')');}
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

// the command centre taken: silent, one line, no new traffic
fresh(true,true);run(600);
{const c=G.relays.find(r=>r.type==='central');c.captured=true;c.capT=G.time;run(40);const nAfter=av().length;run(1200);
  ok(B.capLevel()==='silent','the command centre taken: the level is silent');
  ok(lines.filter(l=>l.text===SILENT).length===1,'"'+SILENT+'" is written once');
  ok(av().length===nAfter,'no new traffic after it ('+nAfter+' at the first seconds, '+av().length+' at the end)');}
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
