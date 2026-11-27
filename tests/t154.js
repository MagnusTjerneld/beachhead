// Provspel ö 9163 (Magnus 27 nov): spärren utan sladdis (kp01), frågan över huvudvyn när en enhet står still och väntar (kp02),
// servicen som stannar på plattan när ett hot dyker upp (kp03), gruppordern som bryter en lagning i fält som inte är en nödlagning (kp04, kp05).
// Slutet efter Spela vidare (kp06) prövas i t113.
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
let G;
function fresh(sd,doc){B.newGame(sd,doc);G=B.G;G.running=true;G.netAll=true;G.mines=[];G.known.fill(1);G.knownV++;B.LOS.on=false;G.krokAuto=false;G.units=[];G.enemies=[];return G;}
const put=(k,x,y)=>{const u=B.makeUnit(k,x,y);G.units.push(u);return u;};

// kp01: S2 on ö 9163 is the five cells in the gap of the wall, not the lone cell 90 m off on the beach
fresh(9163,'framskjutet');
{const S2=G.barriers.find(b=>b.id==='S2'),far=Math.max(...S2.cells.map(c=>Math.hypot((c%B.GW)*10+5-S2.x,Math.floor(c/B.GW)*10+5-S2.y)));
  ok(S2.cells.length===5,'S2 has '+S2.cells.length+' cells (5)');ok(far<20,'none of them more than 20 m from its middle ('+far.toFixed(1)+' m)');}

// kp04, kp05: a VARG waiting for BÄVER's field repair at 67 % takes the group order, and the repair is broken off
fresh(9163,'framskjutet');
{const L=G.relays[0],v1=put('tank',L.x+40,L.y),v2=put('tank',L.x+50,L.y),b=put('eng',L.x+60,L.y);
  v2.hp=v2.maxhp*.67;v2.awaitRep=b.id;b.orders=[{type:'repair',unit:v2,post:'def',auto:true}];
  B.groupOrder({world:{x:L.x+40,y:L.y+120},us:[v1,v2]},false);
  ok(v2.orders[0]&&v2.orders[0].type==='move','the VARG at 67 % takes the move with the group');
  ok(!v2.awaitRep&&!b.orders.length,'its wait is over and BÄVER leaves the repair');
  ok(G.log.some(l=>l.uid===b.id&&/avbryts/.test(l.text)),'BÄVER says the repair is broken off');
  // an emergency, under 30 %, stays with the repair
  v2.orders=[];v2.hp=v2.maxhp*.2;v2.awaitRep=b.id;b.orders=[{type:'repair',unit:v2,post:'def',auto:true}];G.log.length=0;
  B.groupOrder({world:{x:L.x+40,y:L.y+150},us:[v1,v2]},false);
  ok(!v2.orders.length&&v2.awaitRep===b.id&&b.orders.length===1,'the VARG at 20 % waits for the repair');
  const line=G.log.find(l=>l.uid===v2.id);ok(!!line&&/väntar på lagning i fält/.test(line.text),'and says it waits for field repair: '+(line&&line.text));}

// kp03: a unit with a pad at a forward yard keeps the yard when a threat comes within reach of it
fresh(9163,'framskjutet');
{for(const b of G.barriers)b.cleared=true;B.computeLock();
  const r=G.relays.find(q=>q.type==='varv');r.captured=true;const v=put('tank',r.x,r.y);v.hp=v.maxhp*.5;
  const h0=B.svcHome(v);ok(h0&&h0.rid===r.id,'with no threat the yard serves ('+(h0&&h0.name)+')');
  const e=B.makeEnemy({id:'SV9',kind:'tank',x:h0.x+60,y:h0.y});e.seen=true;e.lx=e.x;e.ly=e.y;G.enemies.push(e);
  ok(!!B.threatAt(h0.x,h0.y),'a seen tank 60 m off threatens the yard');
  const h1=B.svcHome(v);ok(h1&&h1.rid!==r.id,'a unit without a pad there is sent elsewhere ('+(h1&&h1.name)+')');
  v.pad={key:r.id,i:0};const h2=B.svcHome(v);ok(h2&&h2.rid===r.id,'one on the yard plate keeps it ('+(h2&&h2.name)+')');v.pad=null;}

// kp02: a line said with an ask is asked while the wait goes on; one without acts is never asked
fresh(9163,'framskjutet');
{const v=put('tank',1000,1000);let waiting=true;
  const L=B.say(v,'Väntar här.',[{l:'Kör',f:()=>{}}],false,()=>waiting);ok(typeof L.ask==='function'&&L.ask(),'the line carries the ask while the unit waits');
  waiting=false;ok(!L.ask(),'and not once the wait is over');
  const L2=B.say(v,'Bara en rad.',null,false,()=>true);ok(!L2.ask,'a line without buttons is not asked');}

console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
