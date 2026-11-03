// Bärgningen (issue 121, Magnus 2 nov after ö 4741): the vehicle stands BARG.dMin to dMax m from the landing beach behind at least BARG.nMin
// fixed positions near the line to it (or fewer where the island has no such place), the time follows from the distance and the positions,
// and the vehicle is drawn in 3D only once an own unit has had it within its sight
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
let full=0,n=0;const lims=[];
for(const sd of[5555,1012,2024,3402,4741,6531,7670,9052]){
  B.newGame(sd,null,{uppdrag:'barg'});const G=B.G,L=B.LANDING;if(G.mission!=='barg'){console.log('     ö '+sd+': no place, played as '+G.mission);continue;}n++;
  const w=G.misW,d=Math.hypot(w.x-L.x,w.y-L.y),k=B.bargLine(L,w);if(d>B.BARG.dMin&&k>=B.BARG.nMin)full++;
  ok(d>350&&d<B.BARG.dMax,'ö '+sd+': the vehicle '+Math.round(d)+' m from the beach, '+k+' positions on the way');
  ok(B.misLimit()===B.bargTime(d,k)&&B.misLimit()%60===0,'ö '+sd+': the time '+B.misLimit()/60+' min from the distance and the positions');lims.push(B.misLimit()/60);
  ok(new RegExp('inom '+B.misLimit()/60+' minuter').test(B.misBriefText()),'ö '+sd+': the briefing states it');
  ok(!w.seen,'ö '+sd+': not seen at the start');}
ok(n>=6&&full>=n-2,'most islands have a place behind '+B.BARG.nMin+' positions ('+full+' of '+n+')');
ok(Math.min(...lims)<Math.max(...lims),'the time differs between islands ('+lims.join(', ')+' min)');
// seen: a unit far off does not see it, one within its sight does, and it stays seen
{B.newGame(5555,null,{uppdrag:'barg'});const G=B.G,w=G.misW;G.running=true;G.enemies=[];B.LOS.on=false;
  const u=B.makeUnit('scout',w.x+600,w.y);G.units.push(u);G.time+=1;B.misSeen();ok(!w.seen,'a GETING 600 m off does not see it');
  u.x=w.x+u.vision*.5;G.time+=1;B.misSeen();ok(w.seen===true,'within its sight it does');
  u.x=w.x+900;G.time+=1;B.misSeen();ok(w.seen===true,'and it stays seen');}
// the enemy answers (issue 121, Magnus 3 nov after ö 9730): mobile units march on the vehicle when it is first seen, and more when it is coupled
{B.newGame(9730,null,{uppdrag:'barg'});const G=B.G,w=G.misW;G.running=true;const mob=()=>G.enemies.filter(e=>!e.dead&&e.march).length;
  B.misTick(.05);ok(mob()===0,'nobody marches before it is seen');
  w.seen=true;B.misTick(.05);const n1=mob();ok(n1>=1&&n1<=B.BARG.react[0],'seen: '+n1+' mobile enemies march on it');
  w.tow='x';B.misTick(.05);const n2=mob();w.tow=null;ok(n2>n1,'coupled: more follow ('+n2+')');}
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
