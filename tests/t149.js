// Mission weights in Auto, the resume tool and the end screen's timeline (issue 191 and issue 194 points 2 and 3, Magnus 16 nov).
// 1. Frita ön weighs .35 and the three others (Halshuggning, Nedskjuten besättning, Bärgningen) .65/3 each; the share over many islands is near that.
// 2. tests/resume.js writes a recording as a timeline: the player's points and losses beside what the captain saw and decided.
// 3. The timeline of the end screen (tlBuild): the player's points and losses from the game, the captain's decisions from G.eCap.log, in time order,
//    at most TLINE.max rows with "N more" counted, only the player's events with the captain off.
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;B.CAP2.on=false;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const seedRand=s=>{let x=s>>>0;Math.random=()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};};

// 1. the weights
{const W=B.MIS_W,M=B.MISSION;
  ok(W.frita===.35&&Math.abs(W.halshugg-.65/3)<1e-9&&W.halshugg===W.crew&&W.crew===W.barg,'the weights: Frita ön .35, the other three .65/3');
  ok(M.frita.w===W.frita&&M.halshugg.w===W.halshugg&&M.crew.w===W.crew&&M.barg.w===W.barg&&!M.kust.w,'MISSION carries them (Kustbatteriet is not drawn)');
  const N=1500,c={};for(let i=0;i<N;i++){const m=B.missionOf(1000+i*7);c[m]=(c[m]||0)+1;}
  const tot=W.frita+W.halshugg+W.crew+W.barg,near=(k,w)=>Math.abs(c[k]/N-w/tot)<.04;
  ok(near('frita',W.frita)&&near('halshugg',W.halshugg)&&near('crew',W.crew)&&near('barg',W.barg)&&!c.kust,'over '+N+' islands the shares are near the weights: '+JSON.stringify(c));}

// 2. resume.js on a synthetic recording
{const R=require('./resume.js');
  const rec={seed:1,events:[
    {t:100,type:'meddelande',who:null,text:'Verkstad R1 tagen. Flygande enheter laddar och fordon repareras här.'},
    {t:130,type:'meddelande',who:'u7',text:'Träffad. Signalen bruten.'},
    {t:60,type:'kapten',d:'seen',u:'u3',x:10,y:20,by:'T1',age:5},
    {t:110,type:'kapten',d:'alarm',z:0,p:'R1',n:3,refs:[{u:'u3',x:1,y:2,age:12}]},
    {t:150,type:'kapten',d:'counter',z:0,p:'R1',n:2,refs:[],why:{res:300,seen:0}},
    {t:160,type:'kapten',d:'noreserve',z:1,p:'R2',for:'reinf'},
    {t:170,type:'kapten',d:'hear',z:1,p:'R2',n:2},
    {t:175,type:'kapten',d:'mute',z:1,p:'R2',n:1},
    {t:180,type:'kapten',d:'lost',u:'u3'},
    {t:200,type:'meddelande',who:null,text:'Avlyssnat: larm från posten vid R2.'},
    {t:300,type:'meddelande',who:null,text:'Ledningscentralen R3 tagen.'},
    {t:300,type:'kapten',d:'silent'}]};
  const L=R.resume(rec),t=l=>l.slice(0,5);
  ok(L.length===12&&L.map(t).join()===['01:00','01:40','01:50','02:10','02:30','02:40','02:50','02:55','03:00','03:20','05:00','05:00'].join(),'resume: every event once, in time order ('+L.length+' rows)');
  ok(/kapten vet\s+ser u3 \(T1 såg/.test(L[0])&&/tog verkstad|tog Verkstad/.test(L[1])&&/larm vid R1, 3 pjäser vrids mot u3/.test(L[2]),'resume: seen, the player\'s point and the alarm with what it was built on');
  ok(/förlorade u7/.test(L[3])&&/motanfall mot R1 med 2 förband, utan sedd styrka \[res 300, seen 0\]/.test(L[4]),'resume: the loss, and the counterattack without a seen force with the forces it weighed');
  ok(/ingen reserv ledig för reinf vid R2/.test(L[5])&&/hör skott/.test(L[6])&&/tyst post vid R2/.test(L[7])&&/tappar u3/.test(L[8]),'resume: noreserve, hear, mute, lost');
  ok(/ledningen tystnar/.test(L[11])||/ledningen tystnar/.test(L[10]),'resume: silent');
  ok(R.resume(rec,{utanVet:true}).every(l=>!/kapten vet/.test(l))&&R.resume(rec,{bara:true}).every(l=>!/kapten vet|hör  |nivå/.test(l)),'resume: the options leave out what the captain knew');
  ok(R.resume({events:[]}).length===0&&R.resume(null).length===0,'resume: an empty recording gives no rows');}

// 3. the timeline in the game
let G;
function fresh(cap){seedRand(7);B.newGame(1264);G=B.G;G.running=true;G.netAll=true;G.mines=[];G.units=[];G.known.fill(1);G.knownV++;B.LOS.on=false;G.krokAuto=false;B.setCap(!!cap);if(!cap)B.ENEMY_SHARE.on=false;
  const r0=G.relays[0];for(let i=0;i<4;i++){const u=B.makeUnit('tank',r0.x-60+i*8,r0.y-40);u.hp=u.maxhp=150;G.units.push(u);}}
ok(B.TLINE&&B.TLINE.on&&B.TLINE.max===15,'TLINE is on by default, 15 rows');
fresh(true);
for(let i=0;i<400;i++)B.step(.05);
G.time=300;{const r=G.relays.find(q=>q.type!=='central'&&q.type!=='radar'&&!q.captured);B.capturePoint(r,null);}
G.time=420;B.killUnit(G.units[0]);
{const q=B.tlBuild(),T=q.rows.map(r=>r.t);
  ok(q.rows.some(r=>/^Du tog /.test(r.txt))&&q.rows.some(r=>/^Du förlorade VARG /.test(r.txt)),'the timeline holds the point the player took and the unit lost');
  ok(T.every((x,i)=>!i||T[i-1]<=x),'the rows are in time order');
  ok(q.rows.length<=15&&q.more===0,'few events: no "more" line ('+q.rows.length+' rows)');
  ok(G.eCap&&G.eCap.log.length>0?q.rows.some(r=>/^Fienden /.test(r.txt)):true,'with the captain on his decisions are there too ('+(G.eCap?G.eCap.log.length:0)+' in his log)');}
// many events: the most important first, the rest counted
fresh(true);
{G.eCap=G.eCap||{log:[]};G.eCap.log=[];for(let i=0;i<12;i++){G.time=10+i*400;G.eCap.log.push({type:'alarm',z:i%2,n:1,t:G.time});}
  G.time=100;B.capturePoint(G.relays.find(q=>q.type==='verkstad')||G.relays[1],null);
  G.time=200;B.capturePoint(G.relays.find(q=>q.type==='hamn')||G.relays[2],null);
  for(let i=0;i<10;i++){G.time=3000+i*10;B.killUnit(B.makeUnit('tank',0,0));}
  G.eCap.log.push({type:'counter',z:0,n:2,t:3200});G.eCap.log.push({type:'reinf',z:1,n:2,t:3300});
  const q=B.tlBuild();
  ok(q.rows.length===15&&q.more>0,'over 15 events: 15 rows and "och '+q.more+' händelser till"');
  ok(q.rows.filter(r=>/^Du tog /.test(r.txt)).length===2&&q.rows.some(r=>/motanfall/.test(r.txt))&&q.rows.some(r=>/förstärker/.test(r.txt)),'the points and the captain\'s counterattack and reinforcement are kept first');
  const T=q.rows.map(r=>r.t);ok(T.every((x,i)=>!i||T[i-1]<=x),'the kept rows are still in time order');}
// the captain off: only the player's events
fresh(false);
G.time=300;B.capturePoint(G.relays.find(q=>q.type!=='central'&&q.type!=='radar'&&!q.captured),null);G.time=420;B.killUnit(G.units[0]);
{const q=B.tlBuild();ok(!G.eCap&&q.rows.length===2&&q.rows.every(r=>/^Du /.test(r.txt)),'captain off: only the player\'s two events');}
// the switch: with TLINE off nothing is noted
fresh(false);B.TLINE.on=false;G.time=300;B.killUnit(G.units[0]);ok(!(G.tl&&G.tl.length),'TLINE off: nothing is collected');B.TLINE.on=true;
process.exit(fail?1:0);
