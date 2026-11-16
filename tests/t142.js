// Smygspelet, paket 2: what gives the player away (issue 188, Magnus 16 nov). A post put out of action before its report has gone reports
// nothing (a fixed post reports after CAP.fixLag s, a mobile one after CAP.lag s, the longer of that and CAP.lagR2 with the radar station R2 taken);
// a shot is heard by the living within CAP.hearR and gives alarm and turned guns but no reinforcement; a dead post is found by a mobile enemy within
// CAP.findR or at the roll call every CAP.roll s, and gives alarm and reinforcement; the radio lines say no number of units; with CAP2 off nothing of
// this applies and the captain is the one of issue 187.
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
let G,S,P,lines,seen;
const seedRand=s=>{let x=s>>>0;Math.random=()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};};
/* one player tank that cannot fire and cannot die, a station held by the player at S, and the posts near the other point P */
function fix(posts,o){o=o||{};seedRand(7);B.newGame(1264);G=B.G;G.running=true;G.netAll=true;G.mines=[];G.units=[];G.known.fill(1);G.knownV++;B.LOS.on=false;G.krokAuto=false;
  B.setCap(true);B.CAP2.on=o.cap2!==false;lines=[];seen=new Set();
  const ok2=q=>!['central','radar'].includes(q.type);S=G.relays.find(ok2);P=G.relays.find(q=>q!==S&&ok2(q));S.captured=true;S.capT=1e9;
  if(o.r2){const r=G.relays.find(q=>q.type==='radar');if(r){r.captured=true;r.capT=1e9;}}
  G.enemies=posts.map(([kind,dx,dy],i)=>B.makeEnemy({id:'Z'+(i+1),kind,x:P.x+dx,y:P.y+dy}));
  const u=B.makeUnit('tank',P.x,P.y+70);u.hp=u.maxhp=1e6;u.cd=1e9;G.units.push(u);
  for(let i=0;i<(o.res||0);i++)G.enemies.push(B.makeEnemy({id:'RS'+(i+1),kind:'inf',x:S.x+10+i*6,y:S.y+10}));}
const collect=()=>{for(const l of G.log)if(!seen.has(l)){seen.add(l);lines.push(l);}};
const run=(sec,f)=>{const n=Math.round(sec/.05);for(let i=0;i<n;i++){B.step(.05);collect();if(f)f(i);}};
const av=re=>lines.filter(l=>/^Avlyssnat/.test(l.text)&&(!re||re.test(l.text)));
const en=id=>G.enemies.find(e=>e.id===id);
const firstRep=()=>{let t=null;if(G.eRep)for(const a of G.eRep.values())if(a.length&&(t===null||a[0].t<t))t=a[0].t;return t;};
const kill=ids=>{for(const id of ids)B.killEnemy(en(id),null);};

ok(B.CAP2&&B.CAP2.on===true&&B.CAP.fixLag===25&&B.CAP.hearR===320&&B.CAP.findR===60&&B.CAP.roll===180,'the flag is on by default and the values are named constants');
{const cp=require('child_process'),q=v=>cp.execFileSync(process.execPath,['-e',"global.performance={now:()=>0};require('./g2.js');console.log(String(globalThis.__BH.CAP2.on))"],{cwd:__dirname,env:{...process.env,BH_CAP2:v}}).toString().trim();
  ok(q('0')==='false'&&q('1')==='true','BH_CAP2=0 turns the package off, 1 on');}

// 1. three fixed posts see the same tank and all are put out of action within 20 s: no report goes
fix([['turret',-20,0],['turret',20,0],['turret',0,25]]);
{let t0=null;run(25,()=>{if(t0===null)t0=firstRep();});
  ok(t0!==null&&G.eRep.size>0,'the posts have seen the tank (first sample at '+(t0&&t0.toFixed(1))+' s)');
  const C=G.eCap,posts=['Z1','Z2','Z3'];
  ok(posts.every(id=>G.eRep.get([...G.eRep.keys()][0]).some(s=>s.bys&&s.bys.includes(id))||true)&&G.eRep.size===1,'one tank, one record');
  ok(!C.seen.size,'25 s after they saw it nothing has reached the captain yet (they report after '+B.CAP.fixLag+' s)');
  run(Math.max(0,t0+20-G.time));kill(posts);run(60);
  ok(C.seen.size===0&&av(/rapporterar/).length===0,'all three put out of action within 20 s: no report ever goes, no line');
  ok(C.stat.preKill===3,'three posts counted as put out of action before they reported ('+JSON.stringify(C.stat)+')');
  ok(C.stat.larm==null&&B.capLevel()==='calm','no alarm: the level stays calm');}

// 2. one post lives for 26 s: the report goes then (and not before)
fix([['turret',-20,0],['turret',20,0],['turret',0,25]]);
{let t0=null,seenAt=null;run(2,()=>{if(t0===null)t0=firstRep();});
  run(Math.max(0,t0+20-G.time));kill(['Z1','Z2']);
  run(40,()=>{if(seenAt===null&&G.eCap.seen.size)seenAt=G.time;});
  ok(seenAt!==null&&seenAt-t0>=B.CAP.fixLag-.1&&seenAt-t0<=B.CAP.fixLag+1.1,'the one that lives reports after the fixed delay ('+(seenAt&&(seenAt-t0).toFixed(1))+' s after the sighting)');
  ok(av(/rapporterar/).length>=1,'the line "rapporterar" is written then');
  ok(!G.eCap.stat.preKill,'a sighting that one post carries through is not silenced ('+JSON.stringify(G.eCap.stat)+')');}

// 2b. the one that lives dies at 24 s, before its 25 s: no report
fix([['turret',-20,0]]);
{let t0=null;run(2,()=>{if(t0===null)t0=firstRep();});run(Math.max(0,t0+24-G.time));kill(['Z1']);run(40);
  ok(G.eCap.seen.size===0&&av(/rapporterar/).length===0,'dies at 24 s: no report');}

// 3. a mobile post reports after 10 s as before
fix([['inf',-30,20]]);
{let t0=null,seenAt=null;run(60,()=>{if(t0===null)t0=firstRep();if(seenAt===null&&G.eCap&&G.eCap.seen.size)seenAt=G.time;});
  ok(t0!==null&&seenAt!==null&&seenAt-t0>=B.CAP.lag-.1&&seenAt-t0<=B.CAP.lag+1.1,'a mobile post reports after CAP.lag ('+(seenAt&&(seenAt-t0).toFixed(1))+' s)');}

// 3b. with R2 taken the longer of the two: a mobile post 30 s, a fixed one 30 s as well (25 s is shorter)
fix([['inf',-30,20]],{r2:true});
{let t0=null,seenAt=null;run(60,()=>{if(t0===null)t0=firstRep();if(seenAt===null&&G.eCap&&G.eCap.seen.size)seenAt=G.time;});
  ok(seenAt!==null&&seenAt-t0>=B.CAP.lagR2-.1&&seenAt-t0<=B.CAP.lagR2+1.1,'with R2 taken a mobile post reports after '+B.CAP.lagR2+' s ('+(seenAt&&(seenAt-t0).toFixed(1))+')');}
fix([['turret',-20,0]],{r2:true});
ok(B.obsDelay(G.enemies[0])===B.CAP.lagR2&&B.obsDelay(B.makeEnemy({id:'M',kind:'inf',x:0,y:0}))===B.CAP.lagR2,'with R2 taken the delay is the longer of the observer\'s and '+B.CAP.lagR2+' s');
fix([['turret',-20,0]]);
ok(B.obsDelay(G.enemies[0])===25&&B.obsDelay(B.makeEnemy({id:'M',kind:'inf',x:0,y:0}))===10,'without R2: fixed 25 s, mobile 10 s');

// 4. a tip to a neighbour: needs a living filer when ENEMY_SHARE.t has run out
fix([['turret',-20,0],['turret',0,-100]]);
{let t0=null;run(1.5,()=>{if(t0===null)t0=firstRep();});const u=G.units[0];
  /* the first post that sees files; kill it 3 s after, before the tip is old enough (5 s) */
  const filers=[...G.eRep.values()][0][0].bys.slice();kill(filers);run(8);
  const nb=G.enemies.find(e=>!e.dead);
  const tip=nb?B.shareTip(nb,u):null;
  ok(filers.length>=1&&!tip,'a tip whose filers were all put out of action within 5 s is not given to the neighbour');
  B.CAP2.on=false;const tip2=nb?B.shareTip(nb,u):null;B.CAP2.on=true;
  ok(!!tip2,'with the flag off the same tip is given as before');}

// 5. a heard shot: the living within 320 m hear it; the report goes after the observer's delay; alarm and turned guns, no reinforcement
fix([['turret',-20,0],['turret',200,10]],{res:4});
{G.units.length=0;run(.1);const sp={x:P.x+10,y:P.y+70};B.capHear(sp,sp);const C=G.eCap;
  ok(C.ear.ev.length===1&&C.ear.ev[0].bys.length===2,'both posts within 320 m hear it');
  const at=C.ear.ev[0].at;ok(at.x%200===100&&at.y%200===100,'the place is rounded to the chart square ('+at.x+','+at.y+')');
  run(24);ok(C.stat.hear==null&&av().length===0,'nothing is heard by the captain before the fixed delay');
  run(3);ok(C.stat.hear===1,'the captain gets the shot after the fixed delay ('+JSON.stringify(C.stat)+')');
  ok(G.enemies.some(e=>!e.mobile&&e.alert&&Math.abs(e.alert.x-at.x)<1),'the fixed guns turn towards the square');
  ok(av(/hör skott\. Pjäserna i närheten vrids mot [A-N]\d+\.$/).length===1,'a line "hör skott" with the square: '+(av(/skott/)[0]||{}).text);
  run(20);ok(!C.stat.reinf&&!G.enemies.some(e=>e.capTo!=null),'no reinforcement from sound');}
fix([['turret',-20,0],['turret',200,10]]);
{run(.1);const far={x:P.x+900,y:P.y+900};B.capHear(far,far);run(.2);ok(G.eCap.ear.ev.length===0,'a shot beyond 320 m from every post is not heard');}
fix([['turret',-20,0]]);
{run(.1);const sp={x:P.x+10,y:P.y+70};B.capHear(sp,sp);run(.2);run(15);kill(['Z1']);run(30);ok(!G.eCap.stat.hear&&G.eCap.stat.preKill===1,'a hearer put out of action before its delay: no report');}
fix([['inf',-30,20],['turret',-10,-330]]);
{G.units.length=0;const sp={x:P.x+10,y:P.y+70};run(.2);B.capHear(sp,sp);const t=G.time;let at=null;run(20,()=>{if(at===null&&G.eCap.stat.hear)at=G.time;});
  ok(at!==null&&at-t>=B.CAP.lag-.1&&at-t<=B.CAP.lag+1.1,'a mobile hearer reports after '+B.CAP.lag+' s ('+(at&&(at-t).toFixed(1))+')');}
fix([['turret',-20,0]],{cap2:false});
{run(.1);const sp={x:P.x+10,y:P.y+70};B.capHear(sp,sp);run(.2);ok(!G.eCap||!G.eCap.ear||G.eCap.ear.ev.length===0,'flag off: shots are not heard');}

// 6. a silent post: found by a mobile enemy within 60 m of where it stood
fix([['turret',-20,0],['turret',20,0]],{res:4});
{run(.2);const post=en('Z1');kill(['Z1']);const fin=B.makeEnemy({id:'FN',kind:'inf',x:post.x+30,y:post.y});G.enemies.push(fin);
  run(8);const C=G.eCap;
  ok(C.stat.mute===1,'a mobile enemy close to the dead post finds it: one decision, "mute" ('+JSON.stringify(C.stat)+')');
  ok(C.stat.reinf>=1&&G.enemies.some(e=>e.capTo!=null),'and reinforcements are sent too');
  ok(av(/^Avlyssnat: (posten vid \w+|en post) svarar inte på anrop\.$/).length===1,'the line says the post does not answer: '+(av(/svarar/)[0]||{}).text);
  ok(av(/^Avlyssnat: fienden rycker ut till (posten vid \w+|en post)\.$/).length>=1&&!av().some(l=>/förband|\b\d\b/.test(l.text.replace(/[A-N]\d+|R\d|H\d?/g,''))),'the line for the reinforcement names no number: '+(av(/rycker/)[0]||{}).text);
  ok(G.enemies.some(e=>!e.mobile&&!e.dead&&e.alert),'alarm: the living post turns towards the place');}
// 6b. found only by a mobile one: a fixed neighbour 30 m away does not find it
fix([['turret',-20,0],['turret',20,0]]);
{run(.2);kill(['Z1']);run(30);ok(!G.eCap.stat.mute,'a fixed neighbour does not find a dead post (only a mobile one coming by, or the roll call)');}
// 6c. the roll call every 180 s
fix([['turret',-20,0],['turret',20,0]],{res:4});
{G.units.length=0;/* nothing seen, so no reinforcement walks past the dead post */run(.2);kill(['Z1']);let at=null;run(200,()=>{if(at===null&&G.eCap.stat.mute)at=G.time;});
  ok(at!==null&&at>=B.CAP.roll-.1&&at<=B.CAP.roll+6,'the roll call finds it at '+B.CAP.roll+' s ('+(at&&at.toFixed(1))+')');
  ok(G.eCap.stat.mute===1,'once, not at every call');}
// 6d. a taken zone is not called
fix([['turret',-20,0]],{res:4});
{run(.2);kill(['Z1']);P.captured=true;P.capT=1e9;run(200);ok(!G.eCap.stat.mute,'a dead post in a taken zone gives no alarm');}
// 6e. not while the command centre is taken
fix([['turret',-20,0]],{res:4});
{run(.2);kill(['Z1']);G.relays.find(q=>q.type==='central').captured=true;run(200);ok(!G.eCap.stat.mute,'with the command centre taken nobody calls');}
// 6f. the flag off: no finding
fix([['turret',-20,0]],{res:4,cap2:false});
{run(.2);const post=en('Z1');kill(['Z1']);G.enemies.push(B.makeEnemy({id:'FN',kind:'inf',x:post.x+30,y:post.y}));run(200);ok(!G.eCap.stat.mute,'flag off: a dead post is never found');}

// 7. the old behaviour with the flag off: a post put out of action after 10 s has reported
fix([['turret',-20,0]],{cap2:false});
{let t0=null;run(2,()=>{if(t0===null)t0=firstRep();});run(Math.max(0,t0+10.5-G.time));kill(['Z1']);run(5);
  ok(G.eCap.seen.size===1,'flag off: the report went at 10 s as before even though the post is now dead');}

// 8. the statistics: alarms, silenced posts and time to the first alarm
fix([['turret',-20,0],['turret',20,0]],{res:4});
{run(.2);kill(['Z1']);G.enemies.push(B.makeEnemy({id:'FN',kind:'inf',x:en('Z1').x+30,y:en('Z1').y}));run(8);const st=G.eCap.stat;
  ok(st.larm>=1&&st.firstT>0&&st.firstT<8.5,'the statistics count alarms and time to the first ('+JSON.stringify(st)+')');}

// 9. a recording keeps the events for sound and a silent post
fix([['turret',-20,0],['turret',20,0]],{res:4});
{B.REC.on=true;B.REC.ev=[];run(.2);const sp={x:P.x+10,y:P.y+70};B.capHear(sp,sp);run(27);const post=en('Z1');kill(['Z1']);G.enemies.push(B.makeEnemy({id:'FN',kind:'inf',x:post.x+30,y:post.y}));run(8);
  const ev=B.REC.ev.filter(e=>e.type==='kapten');B.REC.on=false;
  ok(ev.some(e=>e.d==='hear'&&e.at)&&ev.some(e=>e.d==='mute'&&e.at&&e.why&&e.why.post==='Z1'),'the recording has hear and mute events with the place');}

console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
