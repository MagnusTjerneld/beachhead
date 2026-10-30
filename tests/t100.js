// Camouflaged points (issue 106, Magnus 30 okt): the field yard / workshop and the command centre are unknown from the start, become known
// when a ground unit comes within 60 m (or an aircraft flying low within its sight), and a high GETING never spots them; the radar and the harbour
// are known from the start. In Halshuggning the chart gives a ring round the command centre and the briefing names the ring, not the place
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const put=(k,x,y)=>{const u=B.makeUnit(k,x,y);B.G.units.push(u);return u;};
const run=n=>{for(let i=0;i<n;i++)B.step(.05);};
for(const s of [2024,9052,3402]){
  B.newGame(s,null,{uppdrag:'halshugg'});const G=B.G;G.running=true;G.netAll=true;
  const hid=G.relays.filter(r=>['varv','verkstad','central'].includes(r.type)),vis=G.relays.filter(r=>r.type==='radar'||r.type==='hamn');
  ok(hid.length===2&&hid.every(r=>r.hid&&!r.seen&&!B.rKnown(r)),'ö '+s+': the yard and the command centre are unknown from the start');
  ok(vis.every(r=>B.rKnown(r)),'ö '+s+': the radar and the harbour are known');
  ok(!!G.misRing&&G.misRing.r>0,'ö '+s+': Halshuggning has a ring');
  const c=G.relays.find(r=>r.type==='central'),y=G.relays.find(r=>r.type!=='central'&&r.hid);
  ok(Math.hypot(G.misRing.x-c.x,G.misRing.y-c.y)<G.misRing.r,'ö '+s+': the command centre lies inside the ring');
  const t=B.misBriefText();ok(!t.includes(Math.round(c.x)+'')&&/ringen/.test(t)&&/kamouflerad/.test(t),'ö '+s+': the briefing names the ring and the camouflage');
  // a high GETING over the command centre sees only ground
  const g=put('scout',c.x,c.y);g.high=true;g.dive=false;g.ga=null;run(40);
  ok(!c.seen,'ö '+s+': a high GETING over the command centre does not spot it');
  g.dead=true;
  // a ground unit 200 m away does not, one inside 60 m does
  const far=put('tank',c.x+200,c.y);far.post='off';run(20);ok(!c.seen,'ö '+s+': a VARG 200 m away does not spot it');far.dead=true;
  const near=put('tank',c.x+30,c.y);near.post='off';run(40);
  ok(c.seen&&B.rKnown(c),'ö '+s+': a VARG within 60 m spots it');
  ok(!y.seen,'ö '+s+': the other hidden point stays unknown');
  // a low GETING spots the other one
  const l=put('scout',y.x,y.y);l.high=false;run(40);
  ok(y.seen,'ö '+s+': a low GETING spots the yard');
}
console.log(fail?'FAILED':'all ok');process.exit(fail?1:0);
