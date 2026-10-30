// The mission briefing (issue 91, Magnus 30 okt): the order written from the mission and the island's facts. It must be the same every time for an
// island, differ in wording between islands, never name the doctrine or the enemy's numbers, and contain no en or em dashes
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const bad=/doktrin|framskjutet|djupförsvar|fästning|rörligt försvar|reserv|–|—/i,seen=[],texts=new Set();
for(const [sd,mis] of [[1012,'frita'],[2024,'halshugg'],[3402,'crew'],[5555,'barg'],[9052,'halshugg'],[7670,'frita'],[1035,'crew'],[1100,'kust']]){
  B.newGame(sd,null,{uppdrag:mis});const t=B.misBriefText(),again=B.misBriefText();
  ok(t===again,'ö '+sd+' '+B.G.mission+': same text every time');
  ok(!bad.test(t),'ö '+sd+' '+B.G.mission+': no doctrine, no dash');
  ok(/LÄGE: /.test(t)&&/UPPGIFT: /.test(t)&&/GENOMFÖRANDE: /.test(t)&&/BEGRÄNSNINGAR: /.test(t),'ö '+sd+': the four headings');
  const lim=B.G.mission==='frita'||B.G.mission==='crew'?true:/inom \d+ minuter/.test(t);ok(lim,'ö '+sd+': the time limit is stated where there is one');
  ok(!/undefined|NaN|\{T\}/.test(t),'ö '+sd+': nothing left unfilled');
  texts.add(t);seen.push([sd,B.G.mission,t]);}
ok(texts.size===8,'every island has a text of its own');
{const r=[];for(let sd=1000;sd<1005;sd++){B.newGame(sd,null);r.push(B.misBriefText().split('\n')[1]);}ok(new Set(r).size>1,'the wording varies with the island');}
for(const [sd,mis,t] of seen.filter(x=>[1012,2024,3402].includes(x[0])))console.log('--- ö '+sd+' '+mis+'\n'+t);
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
