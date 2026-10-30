// Results per finished map (issue 99, Magnus 30 okt): an end is saved with island, mission, doctrine, outcome, time, losses and material;
// the record is the fewest net losses and then the shortest time among the won maps, per island/mission/doctrine and per mission;
// nothing is saved headless (the game has no DOM here), and a store that throws does not stop the game
global.performance={now:()=>0};
const mem={};global.localStorage={getItem:k=>k in mem?mem[k]:null,setItem:(k,v)=>{mem[k]=String(v);}};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const R=(o)=>Object.assign({d:'2026-10-30T12:00',s:1234,m:'halshugg',o:'djup',w:true,t:600,l:100,u:2,v:30,r:200},o);
B.newGame(1234,null,{uppdrag:'halshugg'});const G=B.G;
// the result is read from the game
G.time=612.4;G.lostValue=150;G.salvagedOwn=40;G.unitsLost=3;G.salvaged=55;G.res=321.9;
{const r=B.resultOf();ok(r.s===1234&&r.m==='halshugg'&&r.o===G.doc&&r.w===true&&r.t===612&&r.l===110&&r.u===3&&r.v===55&&r.r===321,'the result holds island, mission, doctrine, outcome, time, net loss, units, salvage and material');
  G.failed=true;ok(B.resultOf().w===false,'a failed mission is saved as lost');G.failed=false;}
ok(B.finishResult()===null&&B.resLoad().length===0,'nothing is saved headless');
// the first win is a record everywhere
let q=B.resSave(R({}));ok(q.isle&&q.mis&&!q.prevIsle&&!q.prevMis&&B.resLoad().length===1,'the first win is a record for the island and the mission');
q=B.resSave(R({l:100,t:700}));ok(!q.isle&&!q.mis&&q.prevIsle.t===600,'same losses but slower is no record');
q=B.resSave(R({l:100,t:500}));ok(q.isle&&q.mis,'same losses and faster is a record');
q=B.resSave(R({l:50,t:900}));ok(q.isle&&q.mis,'fewer losses beat a faster time');
q=B.resSave(R({w:false,l:0,t:10}));ok(!q.isle&&!q.mis&&B.resBest(B.resLoad(),()=>true).l===50,'a lost map is saved but is never a record');
// per mission over islands, per island and doctrine separately
q=B.resSave(R({s:2222,l:80}));ok(!q.mis&&q.isle&&!q.prevIsle,'another island: first win there, but not better than the mission record (50)');
q=B.resSave(R({o:'rorligt',l:70}));ok(q.isle&&!q.prevIsle&&!q.mis,'another doctrine on the same island has its own record');
q=B.resSave(R({m:'crew',l:999}));ok(q.mis&&q.isle,'another mission has its own record');
ok(B.resLoad().length===8,'all eight ends are kept ('+B.resLoad().length+')');
// the list is trimmed but a record stays
for(let i=0;i<400;i++)B.resSave(R({s:5000+i%7,m:'frita',l:500+i,t:1000+i}));
{const L=B.resLoad();ok(L.length<=300,'the list is trimmed ('+L.length+')');ok(L.some(r=>r.s===1234&&r.o==='djup'&&r.l===50),'a record survives the trim');}
// a store that throws, or stores junk, does not break the game
global.localStorage={getItem:()=>{throw new Error('blocked');},setItem:()=>{throw new Error('full');}};
{let t=null;try{t=B.resSave(R({s:777}));}catch(e){}ok(t&&t.isle===true,'storage that throws is skipped');}
global.localStorage={getItem:()=>'{not json',setItem:()=>{}};ok(B.resLoad().length===0,'broken data reads as empty');
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
