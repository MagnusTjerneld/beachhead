// VARG in the water leaves the same wake rings as GÄDDA, smaller (issue 81, Magnus 30 okt): drives out from Birka's side over open water,
// leaves rings of the small size, none on the deck or ashore, and the shared pool is not outgrown by one more boat
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const G=()=>B.G,until=(f,s)=>{for(let i=0;i<s*20;i++){if(f())return true;B.step(.05);}return !!f();};
B.testfall('flank');G().paused=false;const t=G().units.find(u=>u.kind==='tank'),boat=t;
ok(!!t,'a VARG to try with');
const a=t.heading,x0=t.x,y0=t.y;
t.orders=[];t.wk=null;t.wkL=null;t.wkP=null;
ok(B.heightAt(t.x,t.y)<=.05,'it stands on the water');
B.giveOrder(t,{type:'move',x:x0+Math.cos(a)*120,y:y0+Math.sin(a)*120,post:'off'});until(()=>!t.orders.length,40);
const W=t.wk||[];ok(W.length>0,'VARG on the water leaves rings ('+W.length+')');
ok(W.every(q=>q.z===B.WRING.vargK),'the rings are the small size ('+B.WRING.vargK+')');
const b=G().units.find(u=>u.kind==='tank'&&u!==t);if(b){const n=(b.wk||[]).length;ok(!b.wk||b.wk.every(q=>q.z),'other VARG list is fine ('+n+')');}
ok(W.length<=40,'few enough rings to be cheap ('+W.length+' of '+t.speed+' m/s)');
// the second round (issue 81, Magnus 30 okt): a foam trail behind it, not much of it, and none ashore
const F=t.wf||[];ok(F.length>0,'VARG on the water leaves foam patches ('+F.length+')');ok(F.length<=24&&F.length<=B.WRING.foamPool,'the foam trail is kept short ('+F.length+' of '+B.WRING.foamPool+')');
ok(F.every(q=>q.o>0&&q.o<=.6&&q.g<=5),'the patches are soft and small');
{const L=B.LANDING;let pt=null;for(let r=20;r<200&&!pt;r+=10)for(let k=0;k<16&&!pt;k++){const x=L.x+Math.cos(k)*r,y=L.y+Math.sin(k)*r;if(B.heightAt(x,y)>2)pt={x,y};}
  if(pt&&b){b.x=pt.x;b.y=pt.y;b.wk=null;b.wf=null;b.wkL=null;b.wkP=null;b.orders=[];B.giveOrder(b,{type:'move',x:pt.x+40,y:pt.y,post:'off'});for(let i=0;i<60;i++)B.step(.05);
    ok(!(b.wf&&b.wf.length)&&!(b.wk&&b.wk.length),'no rings or foam on land');}}
// the particle cap: four VARG at speed on the water never push the spray past what the shared list allows
{let n=0;for(const u of G().units)if(u.kind==='tank')n+=(u.wf||[]).length;ok(n<=B.WRING.foamPool,'foam in all stays inside its pool ('+n+')');}
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
