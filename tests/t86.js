// No material to repair with (Magnus 23 okt): the repair that waits for material shows in the unit's status and on the chart, and a
// KROK hit below 60 % goes out to salvage again from 30 %, since salvage is the only way material comes back
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const run=s=>{for(let i=0;i<s*20;i++)B.step(.05);};const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const setup=()=>{B.newGame(9949);const G=B.G;G.running=true;G.netAll=true;for(const e of G.enemies)e.dead=true;G.known.fill(1);G.knownHi.fill(0);G.knownV++;
  const k=G.kroks[0];k.x=k.pad.x;k.y=k.pad.y;k.low=true;k.state='idle';k.orders=[];k.retreat=true;k.lastHit=-99;G.res=0;
  G.wrecks.length=0;const L=B.W.landing;const w={id:'wt',x:L.x,y:L.y,value:40,own:false,kind:'hulk',claimed:false,rot:0,t0:0};G.wrecks.push(w);return{G,k,w};};
// 1. a KROK at 40 % with no material goes out
{const{G,k,w}=setup();k.hp=k.maxhp*.4;run(3);
  ok(B.noRes(k)||k.state!=='idle','its repair waits for material');
  ok(!k.retreat&&k.target===w&&k.state==='out','at 40 % with no material it ends the retreat and goes for the pile ('+k.state+', '+(k.target&&k.target.id)+')');
  ok(G.log.some(l=>/Inget material att laga med/.test(l.text)),'and says so');}
// 2. below 30 % it stays and waits
{const{G,k}=setup();k.hp=k.maxhp*.25;run(5);
  ok(k.retreat&&k.state==='idle'&&!k.target,'at 25 % it stays on its pad ('+k.state+')');
  ok(/Väntar på material för lagning/.test(k.status),'its status says it waits for material ('+k.status+')');}
// 3. hit within 30 s it stays, the place it was hit is still near
{const{G,k}=setup();k.hp=k.maxhp*.4;k.lastHit=G.time;run(3);ok(k.retreat&&!k.target,"hit 3 s ago it stays on its pad ("+[k.retreat,k.state,k.lastHit,G.time,k.orders.length]+")");run(30);ok(!k.retreat&&k.target,'30 s later it goes');}
// 4. with material it is repaired as before and goes at 60 %
{const{G,k}=setup();k.hp=k.maxhp*.4;G.res=500;run(1);ok(k.retreat&&!B.noRes(k)&&k.hp>k.maxhp*.4,'with material it is repaired on its pad ('+Math.round(k.hp/k.maxhp*100)+' %)');}
// 5. switched off it stays for good
{B.KROK_BROKE.on=false;const{G,k}=setup();k.hp=k.maxhp*.4;run(10);ok(k.retreat&&!k.target,'with KROK_BROKE off it stays as before');B.KROK_BROKE.on=true;}
// 6. a VARG on its pad with no material says so
{const{G}=setup();const v=B.makeUnit('tank',B.W.landing.x,B.W.landing.y);G.units.push(v);v.hp=v.maxhp*.5;B.groupService([v],'Kaptenen');let st='';for(let i=0;i<120*20&&!/Väntar på material/.test(st);i++){B.step(.05);st=v.state||'';}
  ok(/Väntar på material för lagning \(50 %\) på plattan/.test(st),'a VARG on its pad with no material: "'+st+'"');
  G.res=500;run(2);ok(/^Service på plattan/.test(v.state)&&!B.noRes(v),'with material it is serviced again ("'+v.state+'")');}
console.log(fail?fail+' failed':'all passed');process.exit(fail?1:0);
