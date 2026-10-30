// GÄDDA's testfall (26 okt) played through as the note says: driving into the shore fast and slow, over a shoal fast and at half speed,
// two robots at a seen bunker, none at an unseen one, a farm and a point, the reload that waits for the captain, and the launch by KROK
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const G=()=>B.G,until=(f,s)=>{for(let i=0;i<s*20;i++){if(f())return true;B.step(.05);}return !!f();};
const boat=()=>G().units.find(u=>u.kind==='gadda'),go=id=>{B.testfall(id);G().paused=false;return boat();};
const drive=(u,thr,s)=>{G().ctrl=u.id;B.CTRL.thr=thr;B.CTRL.steer=0;until(()=>u.aground||u.dead||u.hp<u.maxhp,s);B.CTRL.thr=0;G().ctrl=null;};
{const u=go('gland');drive(u,1,40);ok(u.aground&&u.hp>0&&u.hp<u.maxhp*.4,'gland: full speed into the shore, stuck with '+Math.round(u.hp/u.maxhp*100)+' %');
  B.gaddaFree(u);ok(until(()=>!u.aground&&!u.carried&&B.heightAt(u.x,u.y)<0,200),'gland: KROK puts it back in the water');}
{const u=go('gland');drive(u,.06,90);ok(u.hp===u.maxhp&&!u.aground,'gland: slowly, it only touches ('+u.state+')');}
{const u=go('ggrund');drive(u,1,40);ok(u.aground&&u.hp<u.maxhp,'ggrund: full speed onto the shoal, stuck with '+Math.round(u.hp/u.maxhp*100)+' %');}
{const u=go('ggrund');G().ctrl=u.id;B.CTRL.thr=1;until(()=>u.v>=8,20);B.CTRL.thr=.25;until(()=>u.aground||u.hp<u.maxhp,40);B.CTRL.thr=0;G().ctrl=null;
  ok(!u.aground&&u.hp<u.maxhp&&u.hp>u.maxhp*.6,'ggrund: at half speed damaged ('+Math.round(u.hp/u.maxhp*100)+' %) but not stuck');}
{const u=go('ggrund'),S=B.W.decor.shoals.slice().sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))[0],a=u.heading,tx=S.x+Math.cos(a)*(S.r+90),ty=S.y+Math.sin(a)*(S.r+90);
  B.giveOrder(u,{type:'move',x:tx,y:ty,post:'off'});let over=0;until(()=>{if(B.gaddaShoal(u.x,u.y))over++;return !u.orders.length;},120);ok(!over&&Math.hypot(u.x-tx,u.y-ty)<20,'ggrund: an order past the shoal goes round it');}
{const u=go('gskjut'),T=G().enemies.find(e=>!e.dead&&e.kind==='turret');B.giveOrder(u,{type:'attack',enemy:T,post:'off'});until(()=>T.dead,40);ok(T.dead&&u.ammo===2,'gskjut: the bunker falls to two robots ('+u.ammo+' left)');}
{const u=go('gvanta'),T=G().enemies.find(e=>!e.dead&&e.kind==='turret');B.giveOrder(u,{type:'attack',enemy:T,post:'off'});until(()=>false,25);ok(u.ammo===4&&/väntar på att någon målar/.test(u.state),'gvanta: no robot at an unseen bunker ('+u.state+')');}
{const u=go('glv'),T=G().enemies.find(e=>!e.dead&&e.kind==='turret');B.giveOrder(u,{type:'attack',enemy:T,post:'off'});until(()=>T.dead||u.ammo<1,60);ok(T.dead||(G().gaddaDown||0)>0,'glv: the bunker falls or a robot is shot down ('+(G().gaddaDown||0)+' down)');}
{const u=go('gpunkt'),S=G().structs.filter(s=>s.kind==='house'&&!s.dead).sort((a,b)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(b.x-u.x,b.y-u.y))[0];B.giveOrder(u,B.gaddaOrder(u,{struct:S},'off'));until(()=>S.dead,30);
  ok(S.dead&&u.ammo===3,'gpunkt: the farm falls to one robot');B.giveOrder(u,B.gaddaOrder(u,{world:{x:S.x+15,y:S.y}},'off'));until(()=>!u.orders.length,30);ok(u.ammo===2,'gpunkt: a robot at a point');}
{const u=go('gomlad'),T=G().enemies.find(e=>!e.dead&&e.kind==='turret');B.giveOrder(u,{type:'attack',enemy:T,post:'off'});until(()=>u.ammo<1,30);
  ok(until(()=>B.atBirkaSide(u)&&u.ammo===0&&!(u.orders[0]&&u.orders[0].type==='rtb'),200),'gomlad: out of robots it goes to Birka');until(()=>false,10);ok(u.ammo===0,'gomlad: and waits for the captain');
  const r0=G().svcSpent||0;B.gaddaRearm(u);const h=G().units.find(v=>v.kind==='drone');const dead=until(()=>{if(h)h.fuel=h.maxFuel;return T.dead;},320);/* the HÖK's battery kept up: the round trip outlasts it */ok(dead&&(G().svcSpent||0)-r0===160,'gomlad: approved, it loads four for 160 and goes on to finish the bunker ('+((G().svcSpent||0)-r0)+', '+u.state+')');}
{const u=go('gvanta'),T=G().enemies.find(e=>!e.dead&&e.kind==='turret');G().netAll=false;B.giveOrder(u,{type:'attack',enemy:T,post:'off'});const t0=G().time;
  ok(until(()=>!u.orders.length||u.orders[0].toNet,40)&&G().time-t0>=19&&/Kommer inte vidare mot/.test(G().log.map(l=>l.text).join(' ')),'gvanta with the real net: out of it and waiting for a paint, it gives up after 20 s ('+Math.round(G().time-t0)+' s)');
  ok(until(()=>B.inNet(u.x,u.y)&&!u.offNet,120),'and heads back into the net by water');}
{go('gsjo');B.queueBuild('gadda');let lifted=false;ok(until(()=>{const u=boat();if(u&&u.carried)lifted=true;return u&&!u.launch;},80)&&!lifted&&B.heightAt(boat().x,boat().y)<0,'gsjo: built and put in the water by the crane, KROK left alone');}
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
