// faults found in the recorded test round on island 1490 (18 okt): KROK stopping short of a target near its last one or on the
// moving ship (issue 21), a HÖK circling into a known bunker's reach after a move held outside it (issue 29), and a GETING at the
// edge of its radio link losing and finding it every frame (issue 36), and HÖK hovering inside each other
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const setup=seed=>{B.newGame(seed);const G=B.G;G.running=true;G.netAll=true;for(const e of G.enemies)e.dead=true;for(let i=0;i<40;i++)B.step(.05);return G;};
// 1. KROK comes back to its pad with a load, a BÄVER waits 8.6 m away (as on the deck in the round): it fetches it
{const G=setup(1490),k=G.kroks[0],u=G.units.find(v=>v.kind==='eng');
  k.x=k.pad.x+60;k.y=k.pad.y;k.state='back';k.carry={value:10,kind:'x'};k.orders=[];B.krokOrder(k,{type:'lift',unit:u},true);
  u.orders=[];u.x=k.pad.x-2.6;u.y=k.pad.y-8.2;let t=0;for(let i=0;i<600&&k.cargo!==u;i++){B.step(.05);t+=.05;}
  ok(k.cargo===u,'KROK lifts a BÄVER 8.6 m from the pad after landing a load there'+(k.cargo===u?' ('+t.toFixed(1)+' s)':': '+k.status));}
// 2. the pad moves at 5 m/s (Birka under way): the load is still landed
{const G=setup(1490),k=G.kroks[0];k.x=k.pad.x+150;k.y=k.pad.y;k.state='back';k.carry={value:10,kind:'x'};let t=0;
  for(let i=0;i<1200&&k.carry;i++){k.pad.y+=5*.05;B.step(.05);t+=.05;}
  ok(!k.carry,'KROK lands its load on a pad that moves at 5 m/s'+(k.carry?' (still carrying after 60 s)':' ('+t.toFixed(1)+' s)'));}
// 3. a HÖK sent to a point inside a seen bunker's reach waits outside it, and its circle stays outside too
{const G=setup(7341),L=G.relays[0],e=B.makeEnemy({id:'QT',kind:'turret',x:L.x,y:L.y});e.seen=true;e.lx=e.x;e.ly=e.y;e.dmg=0;G.enemies.push(e);
  const h=B.makeUnit('drone',L.x+300,L.y);h.fuel=h.maxFuel=1e5;h.post='def';G.units.push(h);B.giveOrder(h,{type:'move',x:L.x+120,y:L.y,post:'def'});
  let mn=1e9;for(let i=0;i<60*20;i++){B.step(.05);mn=Math.min(mn,Math.hypot(h.x-e.x,h.y-e.y));}
  ok(mn>B.ENEMY.turret.airRange+10,'the HÖK keeps '+mn.toFixed(0)+' m from the bunker, outside its '+B.ENEMY.turret.airRange+' m against aircraft');}
// 4. a GETING drawn just past the edge of its link: it is lost and found far less often, and says so at most every 10 s
{const G=setup(7341),s=B.makeUnit('scout',0,0);G.units.push(s);const C=B.CARRIER,R=B.RADIO.birka;s.x=C.x;s.y=C.y-R+20;let lost=0,was=false,said=0;
  for(let i=0;i<60*20;i++){s.orbit={x:C.x,y:C.y-R-2};B.step(.05);if(s.linkLost&&!was){lost++;if(s.lostMsgT===G.time)said++;}was=!!s.linkLost;}
  ok(lost<100&&said<=7,'at the edge of the link it is lost '+lost+' times a minute (589 before) and says so '+said+' times');}
// 5. four HÖK sent to the same point do not hover inside each other (18 okt)
{const G=setup(7341),L=G.relays[0],H=[0,1,2,3].map(i=>{const h=B.makeUnit('drone',L.x+200+i*3,L.y);h.fuel=h.maxFuel=1e5;G.units.push(h);return h;});
  for(const h of H)B.giveOrder(h,{type:'move',x:L.x,y:L.y+300,post:'def'});let mn=1e9;
  for(let i=0;i<40*20;i++){B.step(.05);if(i>20*20)for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)mn=Math.min(mn,Math.hypot(H[a].x-H[b].x,H[a].y-H[b].y));}
  ok(mn>=13,'four HÖK circling the same point keep '+mn.toFixed(1)+' m apart at the least');}
console.log(fail?'FAILED '+fail:'all passed');if(fail)process.exit(1);
