// The beach landing (Magnus 23 okt): with the beach secured the captain takes Birka in from the anchorage onto the beach, her bow ramp
// on the sand; vehicles, BÄVER too, drive ashore and back to service over it; service stands still while she moves; back out to the
// anchorage on an order; the harbour waits for her there
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const run=s=>{for(let i=0;i<s*20;i++)B.step(.05);};const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const until=(f,s)=>{for(let i=0;i<s*20;i++){if(f())return G().time;B.step(.05);}return f()?G().time:null;};const G=()=>B.G;
// 1. the berth is planned with the island: on 9949 by the landing, afloat all the way in
B.newGame(9949);G().running=true;G().netAll=true;
{const W=B.W,b=W.beach;ok(!!b,'ö 9949 has a berth on the beach');
  ok(d(b.tip,W.landing)<30,'the ramp\'s end lies '+Math.round(d(b.tip,W.landing))+' m from the landing');
  ok(Math.abs(b.ax-B.CARRIER.x)<.01&&Math.abs(b.ay-B.CARRIER.y)<.01,'she starts at the anchorage the berth is planned from');
  ok(B.heightAt(b.x,b.y)<-1.5,'the water under her at the berth is dredged ('+B.heightAt(b.x,b.y).toFixed(1)+' m)');}
// 2. not secured while a seen enemy is left in the beach's zone or reaches her way in
{const st=B.beachState();const e=G().enemies.find(e=>!e.dead&&B.W.zid[B.cellIdx(e.x,e.y)]===B.W.zones.land);
  if(e){e.seen=true;e.lx=e.x;e.ly=e.y;const s2=B.beachState();ok(!s2.ok&&/strandens sektor/.test(s2.why),'a seen '+e.kind+' in the beach\'s zone: "'+s2.why+'"');}
  for(const e of G().enemies)e.dead=true;ok(B.beachState().ok,'with no seen enemy it is secured');
  const a=G().enemies[0];a.dead=false;a.seen=true;const b=B.W.beach;a.lx=a.x=(b.ax+b.tip.x)/2+40;a.ly=a.y=(b.ay+b.tip.y)/2;const s3=B.beachState();
  ok(!s3.ok&&/når angöringsplatsen/.test(s3.why),'a seen enemy 40 m off her way in: "'+s3.why+'"');a.dead=true;
  ok(!B.beachGo(false),'she cannot back out from the anchorage');}
// 3. in: ramps up, turn, run in, ramps down on the sand
{const S=G().beach,b=B.W.beach;ok(B.beachGo(true),'the order to go in is taken');
  const tUp=until(()=>S.ph!=='ramp',10);ok(tUp!=null&&G().ramp.bow===0,'the ramps fold up first ('+(tUp&&tUp.toFixed(1))+' s)');
  const t0=G().time,tOn=until(()=>S.st==='on',240);ok(tOn!=null,'she lies on the beach after '+(tOn==null?'-':Math.round(tOn-t0))+' s for '+Math.round(b.run)+' m');
  ok(d(B.CARRIER,b)<.5&&Math.abs(B.CARRIER.a-b.a)<.01,'at the berth');
  run(5);ok(G().ramp.bow===1,'the bow ramp is down again');
  ok(G().log.some(l=>/ligger på stranden/.test(l.text)),'and the log says so');}
// 4. BÄVER drives ashore over the bow ramp, without KROK
{const e=G().units.find(u=>u.kind==='eng');const b=B.W.beach,f={x:-Math.cos(b.a),y:-Math.sin(b.a)},tgt={x:b.tip.x+f.x*60,y:b.tip.y+f.y*60};
  B.giveOrder(e,{type:'move',x:tgt.x,y:tgt.y,post:'def'},false);const t=until(()=>d(e,tgt)<12,120);
  ok(t!=null,'BÄVER drives off the deck to 60 m up the beach ('+(t==null?Math.round(d(e,tgt))+' m left, '+e.state+', '+B.W.baseGrid[B.cellIdx(tgt.x,tgt.y)]:'ok')+')');
  ok(!G().kroks.some(k=>k.orders.some(o=>o.type==='lift'))&&!e.carried,'without a lift by KROK');
  // and back to service on Birka's pads, over the ramp
  e.hp=e.maxhp*.6;G().res=500;B.groupService([e],'Kaptenen');const t2=until(()=>e.onPad&&e.hp>=e.maxhp-.5,180);
  ok(t2!=null,'and back aboard to a pad and repaired ('+(t2==null?e.state:'ok')+')');}
// 5. service stands still while she moves; out to the anchorage
{const S=G().units.find(u=>u.kind==='eng'),q=B.beachIcon(),b0=B.W.beach,far={x:b0.tip.x-Math.cos(b0.a)*150,y:b0.tip.y-Math.sin(b0.a)*150};S.x=far.x;S.y=far.y;S.orders=[];S.path=null;/* away, so that VARG is not repaired in the field by it */
  const V=B.makeUnit('tank',q.x,q.y);G().units.push(V);V.hp=V.maxhp*.6;G().res=500;B.groupService([V],'Kaptenen');
  ok(until(()=>V.onPad&&V.pad.key==='ship',120)!=null,'a VARG on the beach drives up the bow ramp to a pad on Birka ('+V.state+', eng '+S.state+' pad '+!!S.pad+')');
  V.hp=V.maxhp*.6;ok(B.beachGo(false),'the order to back out is taken');until(()=>G().beach.ph==='run',20);const h0=V.hp;run(5);
  ok(Math.abs(V.hp-h0)<.01&&B.birkaMoving(),'no service while she moves (VARG on its pad at '+Math.round(V.hp/V.maxhp*100)+' %)');
  const tA=until(()=>G().beach.st==='anchor',300);const b=B.W.beach;ok(tA!=null&&Math.hypot(B.CARRIER.x-b.ax,B.CARRIER.y-b.ay)<.5,'back at the anchorage');
  ok(!onDeckOf(S)&&B.W.baseGrid[B.cellIdx(S.x,S.y)]>1&&d(S,B.CARRIER)>60,'BÄVER, driven off its pad onto the beach after service, is left on land ('+S.state+')');}
function onDeckOf(u){const f={x:Math.cos(B.CARRIER.a),y:Math.sin(B.CARRIER.a)},dx=u.x-B.CARRIER.x,dy=u.y-B.CARRIER.y;return Math.abs(-dx*f.y+dy*f.x)<16&&Math.abs(dx*f.x+dy*f.y)<45;}
// 5b. a unit left standing on the ramp with nothing to do drives off it when she is to leave
{B.beachGo(true);until(()=>G().beach.st==='on',240);run(5);const m=B.makeUnit('tank',0,0);G().units.push(m);const pt=(lat,fwd)=>{const f={x:Math.cos(B.CARRIER.a),y:Math.sin(B.CARRIER.a)};return{x:B.CARRIER.x-f.y*lat+f.x*fwd,y:B.CARRIER.y+f.x*lat+f.y*fwd};};
  const p=pt(0,-50);m.x=p.x;m.y=p.y;m.orders=[];run(.5);B.beachGo(false);const t=until(()=>G().beach.ph==='run',30);
  ok(t!=null,'a VARG standing idle on the ramp drives off it and she leaves ('+(t==null?m.state:'ok')+')');until(()=>G().beach.st==='anchor',300);m.dead=true;}
// 6. the harbour taken while she lies on the beach: she goes in from the anchorage once she is back there
{B.newGame(1490);G().running=true;G().netAll=true;for(const e of G().enemies)e.dead=true;const H=G().harbor;
  if(!H||!B.W.beach)ok(false,'ö 1490 has a harbour and a berth');
  else{B.beachGo(true);until(()=>G().beach.st==='on',240);const hr=G().relays.find(r=>r.type==='hamn');hr.captured=true;run(3);
    ok(H.secured&&H.wait&&H.s===0,'the harbour taken while she is on the beach: the harbour waits');
    ok(!B.beachState().ok&&!B.beachGo(true),'the beach cannot be taken again');
    B.beachGo(false);until(()=>G().beach.st==='anchor',300);run(20);ok(!H.wait&&H.s>5,'back at the anchorage she goes on to the harbour ('+Math.round(H.s)+' m)');}}
// 7. an island where she cannot reach the beach says why
{B.newGame(2718);ok(!B.W.beach&&/brant och grund/.test(B.beachState().why),'ö 2718: "'+B.beachState().why+'"');}
console.log(fail?fail+' failed':'all passed');process.exit(fail?1:0);
