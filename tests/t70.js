// service on pads (decided 18 okt, issue 34): four pads at Birka's stern and four plates at a taken workshop or forward yard; a pad
// goes to the first to reach the station, a unit done with service lets it go, one parked gives it up; vehicles board Birka up the
// stern ramp; KROK takes no pad, circles over Birka and is mended low at its bow spot; a landed aircraft is a ground target
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const setup=seed=>{B.newGame(seed);const G=B.G;G.running=true;G.netAll=true;for(const e of G.enemies)e.dead=true;for(let i=0;i<40;i++)B.step(.05);return G;};
const run=s=>{for(let i=0;i<s*20;i++)B.step(.05);};
const loc=p=>{const C=B.CARRIER,f={x:Math.cos(C.a),y:Math.sin(C.a)},dx=p.x-C.x,dy=p.y-C.y;return{lat:-dx*f.y+dy*f.x,fwd:dx*f.x+dy*f.y};};
const onPads=G=>Object.values(G.pads.ship||[]).filter(Boolean).length;
// 1. first come: four HÖK already at Birka take the pads although a VARG far off was sent first; the fifth waits; none is serviced off a pad
{const G=setup(1490),C=B.CARRIER,v=B.makeUnit('tank',C.x+400,C.y+300);v.hp=60;G.units.push(v);B.sendToService(v,'ship');
  const H=[0,1,2,3,4].map(i=>{const h=B.makeUnit('drone',C.x+20+i*4,C.y-30);h.ammo=0;G.units.push(h);return h;});
  run(.5);for(const h of H)B.sendToService(h,'ship');run(4);
  ok(H.filter(h=>h.pad).length===4&&!v.pad,'four HÖK at the station have pads, the VARG sent first and still far off has none');
  const w=H.find(h=>!h.pad);ok(!!w&&/Väntar på en ledig platta/.test(w.state),'the fifth waits ('+(w?w.state:'')+')');
  run(10);ok(H.filter(h=>h.onPad).length===4&&w.ammo<1,'the four have set down; the one waiting is not rearmed ('+w.ammo.toFixed(1)+')');
  run(30);ok(H.every(h=>h.ammo>=4),'all five rearmed in turn ('+H.map(h=>h.ammo.toFixed(0)).join(',')+')');
  ok(onPads(G)<=4,'never more than four on the pads');}
// 2. a unit done with service and orders saved leaves at once; one parked gives its pad up to the next that comes
{const G=setup(1490),C=B.CARRIER,P=B.CARRIER;const h=B.makeUnit('drone',C.x,C.y-40);G.units.push(h);h.ammo=0;
  h.orders=[{type:'move',x:C.x+300,y:C.y,post:'def'}];B.sendToService(h,'ship');run(20);
  ok(!h.pad&&!h.rtb&&h.orders[0]&&h.orders[0].type==='move','done with service, it lets the pad go and goes back to its order');
  const Q=[0,1,2,3].map(i=>{const q=B.makeUnit('drone',C.x+10*i,C.y-40);q.ammo=0;G.units.push(q);B.sendToService(q,'ship');return q;});run(20);
  ok(Q.every(q=>q.parked&&q.onPad),'four with nothing more to do stay parked on the pads');
  const n=B.makeUnit('drone',C.x,C.y-60);n.ammo=0;G.units.push(n);B.sendToService(n,'ship');run(22);
  ok(n.ammo>=4&&Q.filter(q=>q.parked).length===3,'a fifth gets a pad from one parked and is rearmed');}
// 3. a VARG boards Birka up the stern ramp, is mended on its pad, and drives off down the ramp
{const G=setup(1490),C=B.CARRIER,v=B.makeUnit('tank',0,0);const s=B.CARRIER;const p0=(()=>{const f={x:Math.cos(C.a),y:Math.sin(C.a)};return{x:C.x+f.x*90-f.y*0,y:C.y+f.y*90+f.x*0};})();
  v.x=p0.x;v.y=p0.y;v.hp=50;G.units.push(v);B.sendToService(v,'ship');let bad=0,wasOut=true,maxIn=0;
  for(let i=0;i<20*90&&!(v.onPad&&v.hp>=v.maxhp);i++){B.step(.05);const l=loc(v),inHull=Math.abs(l.lat)<16&&l.fwd>-45&&l.fwd<45;if(inHull&&wasOut&&l.fwd>-43)bad++;wasOut=!inHull;}
  ok(!bad,'it reaches the deck only over the stern ramp');ok(v.onPad&&v.hp>=v.maxhp,'and is mended on its pad ('+Math.round(v.hp)+')');
  B.giveOrder(v,{type:'move',x:C.x+200,y:C.y+150,post:'def'});let side=0;wasOut=false;
  for(let i=0;i<20*30;i++){B.step(.05);const l=loc(v),inHull=Math.abs(l.lat)<16&&l.fwd>-45&&l.fwd<45;if(!inHull&&!wasOut&&l.fwd>-43)side++;wasOut=!inHull;if(wasOut)break;}
  ok(!side,'it leaves the deck over the stern ramp');}
// 4. the field station: four plates on flat land, 8.5 m apart; a VARG drives onto one and is mended; an enemy close by does not close it
{const G=setup(7341),R=G.relays.find(r=>r.type==='verkstad'||r.type==='varv');R.captured=true;const P=B.servicePads(R);
  ok(P.length===4&&P.every((a,i)=>P.every((b,j)=>i===j||Math.hypot(a.x-b.x,a.y-b.y)>=8.5)),'four plates at '+R.id+', at least 8.5 m apart');
  ok(P.every(q=>q.y3-q.lo<=2.5),'on land as flat as found (rise under a plate up to '+Math.max(...P.map(q=>q.y3-q.lo-.25)).toFixed(1)+' m)');
  const e=B.makeEnemy({id:'QZ',kind:'inf',x:R.x+120,y:R.y});e.dead=false;e.dmg=0;G.enemies.push(e);
  ok(!!B.homeAt({air:false},R.id),'an enemy 120 m away does not close the station');e.dead=true;
  const v=B.makeUnit('tank',R.x+60,R.y+40);v.hp=60;G.units.push(v);B.sendToService(v,R.id);run(40);
  ok(v.pad&&v.onPad&&v.hp>=v.maxhp,'a VARG drives onto a plate and is mended ('+Math.round(v.hp)+(v.pad?', plate '+v.pad.i:'')+')');}
// 5. KROK takes no pad: idle it circles over Birka, hurt it comes down low at its bow spot and is mended there
{const G=setup(1490),C=B.CARRIER,k=G.kroks[0];k.orders=[];run(20);const d0=Math.hypot(k.x-C.x,k.y-C.y);
  ok(d0>25&&d0<60,'an idle KROK circles over Birka ('+d0.toFixed(0)+' m from its centre)');
  k.hp=k.maxhp*.6;run(30);ok(k.hp>=k.maxhp-1&&!Object.values(G.pads).some(s=>s.includes(k.id)),'a hurt KROK is mended at its own spot, on no pad ('+Math.round(k.hp/k.maxhp*100)+' %)');}
// 6. a landed HÖK is a ground target: a bunker can fire on it, an air defence that only fires at the sky cannot
{const G=setup(7341),R=G.relays.find(r=>r.type==='verkstad'||r.type==='varv');R.captured=true;const q=B.servicePads(R)[0];
  const h=B.makeUnit('drone',q.x,q.y);h.pad={key:R.id,i:0,t:5};G.pads[R.id]=[h.id,null,null,null];h.onPad=true;h.orders=[{type:'rtb',post:'def',svc:R.id}];h.rtb=true;G.units.push(h);
  const aa=B.makeEnemy({id:'QA',kind:'aa',x:q.x+60,y:q.y});aa.seen=true;G.enemies.push(aa);const t=B.makeEnemy({id:'QT',kind:'turret',x:q.x-60,y:q.y});t.seen=true;G.enemies.push(t);
  B.step(.05);ok(t.tgtU===h,'the bunker takes the landed HÖK as its target');ok(aa.tgtU!==h,'the air defence does not');}
console.log(fail?fail+' failed':'all passed');process.exit(fail?1:0);
