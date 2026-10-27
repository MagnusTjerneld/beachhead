// GÄDDA, the robot boat (26 okt, Magnus): built at Birka's side, finds its way on the water round the land, fires on a target a unit
// sees from a place out of the enemy's reach and kills a bunker with two robots, waits when nobody sees the target, sends a robot at a
// building and at a point, goes home by itself when it is out of robots and loads again only when the captain approves; and an air
// defence shoots about one robot in seven down
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const G=()=>B.G,until=(f,s)=>{for(let i=0;i<s*20;i++){if(f())return true;B.step(.05);}return !!f();};
const wet=(x,y)=>B.heightAt(x,y)<0;
const boat=(x,y)=>{const u=B.makeUnit('gadda',x,y);G().units.push(u);return u;};
// 1. built in the bay for 220 and put in the water by Birka's crane (KROK stays free); KROK lifts it afloat to another place on order
{B.newGame(9052,'fastning');G().running=true;G().netAll=true;const r0=G().res;B.queueBuild('gadda');
  until(()=>G().units.some(u=>u.kind==='gadda'),40);const u=G().units.find(v=>v.kind==='gadda');let lifted=false,t0=G().time;
  ok(r0-G().res===220,'GÄDDA costs 220 ('+(r0-G().res)+')');until(()=>{if(u.carried)lifted=true;return !u.launch;},60);
  ok(!lifted&&!u.launch&&wet(u.x,u.y)&&B.atBirkaSide(u)&&G().time-t0<B.GADDA.crane+2,'built in the bay, the crane puts it in the water beside Birka in '+Math.round(G().time-t0)+' s ('+u.state+')');
  {const k=G().kroks.find(x=>!x.dead),w={x:u.x+Math.cos(B.CARRIER.a)*120,y:u.y+Math.sin(B.CARRIER.a)*120};const o=B.krokDefault(k,{unit:u});B.krokOrder(k,o,false);B.krokOrder(k,{type:'drop',x:w.x,y:w.y},true);let up=false;
    until(()=>{if(u.carried)up=true;return up&&!u.carried;},150);ok(up&&!u.carried&&wet(u.x,u.y)&&Math.hypot(u.x-w.x,u.y-w.y)<30,'KROK lifts it afloat and sets it down in the water '+Math.round(Math.hypot(u.x-w.x,u.y-w.y))+' m from the point');}
  // 2. a way on the water to a point far off round the island, never over land
  let best=null;for(let i=0;i<B.GW*B.GW;i+=7){if(!B.seaPass(i))continue;const c={x:(i%B.GW)*10+5,y:Math.floor(i/B.GW)*10+5},d=Math.hypot(c.x-u.x,c.y-u.y);if(d>700&&d<900&&(!best||d<best.d))best={...c,d};}
  for(const e of G().enemies)e.dead=true;B.giveOrder(u,{type:'move',x:best.x,y:best.y,post:'off'});let dry=0;
  const got=until(()=>{if(!wet(u.x,u.y))dry++;return !u.orders.length;},240);
  ok(got&&Math.hypot(u.x-best.x,u.y-best.y)<15,'reaches a point '+Math.round(best.d)+' m off in '+Math.round(G().time)+' s');ok(!dry,'never on land on the way ('+dry+' steps)');}
// 3. a bunker a HÖK sees: fired on from out of every enemy's reach, two robots
{B.newGame(9052,'fastning');G().running=true;G().netAll=true;const T=G().enemies.find(e=>e.kind==='turret'&&B.gaddaSpot({x:B.CARRIER.x,y:B.CARRIER.y,range:260},e.x,e.y));
  for(const e of G().enemies)if(e!==T)e.dead=true;const sp=B.gaddaSpot({x:B.CARRIER.x,y:B.CARRIER.y,range:260},T.x,T.y);
  const u=boat(sp.x+30,sp.y),v=B.makeUnit('drone',T.x+60,T.y);v.hp=v.maxhp=1e6;v.ammo=v.maxAmmo=0;v.fuel=v.maxFuel=1e6;v.range=v.dmg=0;G().units.push(v);
  B.giveOrder(u,{type:'attack',enemy:T,post:'off'});let near=0;until(()=>{v.x=T.x+60;v.y=T.y;v.orders=[];if(Math.hypot(u.x-T.x,u.y-T.y)<T.range+10)near++;return T.dead;},90);/* the HÖK held over the bunker, unarmed */
  ok(T.dead,'the bunker falls ('+Math.round(G().time)+' s)');ok(4-u.ammo<=3,'with '+(4-u.ammo)+' robots');ok(!near,'the boat never inside the bunker\'s reach');
  // 4. a target nobody sees: the boat goes to its place and waits
  const T2=G().enemies.find(e=>e.kind==='turret'&&e!==T&&B.gaddaSpot(u,e.x,e.y));if(T2){T2.dead=false;T2.hp=T2.maxhp;T2.seen=true;v.dead=true;const a0=u.ammo;
    B.giveOrder(u,{type:'attack',enemy:T2,post:'off'});until(()=>false,40);ok(u.ammo===a0&&!T2.dead,'no robot at a bunker nobody sees ('+u.state+')');}}
// 5. a building and a point: one robot each
{B.newGame(9052,'fastning');G().running=true;G().netAll=true;for(const e of G().enemies)e.dead=true;
  const S=G().structs.find(s=>s.kind==='house'&&B.gaddaSpot({x:B.CARRIER.x,y:B.CARRIER.y,range:260},s.x,s.y));const sp=B.gaddaSpot({x:B.CARRIER.x,y:B.CARRIER.y,range:260},S.x,S.y),u=boat(sp.x,sp.y);
  B.giveOrder(u,{type:'strike',s:S,post:'off'});until(()=>S.dead,40);ok(S.dead&&u.ammo===3,'a farm falls to one robot ('+u.ammo+' left)');
  B.giveOrder(u,B.gaddaOrder(u,{world:{x:S.x+20,y:S.y+10}},'off'));until(()=>!u.orders.length,40);ok(u.ammo===2,'a robot at a point on land ('+u.ammo+' left)');
  // 6. out of robots: home by itself, and the reload waits for the captain
  u.ammo=1;B.giveOrder(u,B.gaddaOrder(u,{world:{x:S.x-15,y:S.y}},'off'));until(()=>u.ammo<1,30);until(()=>B.atBirkaSide(u)&&!u.orders.length,200);
  ok(B.atBirkaSide(u)&&u.ammo===0,'out of robots it goes to Birka by itself and does not load');until(()=>false,15);ok(u.ammo===0,'no robot without the captain\'s word');
  const r0=G().res;B.gaddaRearm(u);until(()=>u.ammo===4,20);ok(r0-G().res===160&&u.ammo===4,'the approved reload costs 160 and fills it ('+(r0-G().res)+', '+u.ammo+')');}
// 7. an air defence shoots about one robot in seven down
{B.newGame(9052,'fastning');const A=G().enemies.find(e=>e.kind==='aa');for(const e of G().enemies)if(e!==A)e.dead=true;A.dead=false;let n=0;const N=4000;
  for(let i=0;i<N;i++){const f={x1:A.x-300,y1:A.y,x2:A.x+50,y2:A.y,h2:2,a:null};if(B.gaddaDown(f))n++;}
  ok(Math.abs(n/N-.15)<.03,'an air defence downs '+Math.round(n/N*100)+' % of the robots over its reach');}
// 8. driven by hand into the shore at full speed: damaged and stuck on land until KROK lifts it off; at a crawl nothing happens
{B.newGame(9052,'fastning');G().running=true;G().netAll=true;for(const e of G().enemies)e.dead=true;const T=G().structs.find(s=>B.gaddaSpot({x:B.CARRIER.x,y:B.CARRIER.y,range:260},s.x,s.y));
  const sp=B.gaddaSpot({x:B.CARRIER.x,y:B.CARRIER.y,range:260},T.x,T.y),u=boat(sp.x,sp.y);u.heading=Math.atan2(T.y-u.y,T.x-u.x);G().ctrl=u.id;
  B.CTRL.thr=.06;B.CTRL.steer=0;until(()=>false,90);ok(u.hp===u.maxhp&&!u.aground,'at a crawl it only touches the shore ('+u.state+')');
  {const dx=T.x-sp.x,dy=T.y-sp.y,d=Math.hypot(dx,dy);let k=150;while(k>0&&B.heightAt(sp.x-dx/d*k,sp.y-dy/d*k)>-1)k-=10;u.x=sp.x-dx/d*k;u.y=sp.y-dy/d*k;}u.bvx=u.bvy=u.v=u.rot=0;B.CTRL.thr=1;/* a run-up of up to 150 m */until(()=>u.aground||u.dead,60);B.CTRL.thr=0;
  ok(u.aground&&u.hp<u.maxhp*.4&&!u.dead,'at full speed it runs up and sticks, hull '+Math.round(u.hp/u.maxhp*100)+' %');
  G().ctrl=null;B.gaddaFree(u);until(()=>!u.aground&&!u.carried&&B.heightAt(u.x,u.y)<0,240);ok(!u.aground&&B.heightAt(u.x,u.y)<0,'KROK lifts it off into the water');}
// 9. the island is won when every point is taken, not by the command centre alone; WIN.all false is the testbot's old goal
{B.newGame(9052,'fastning');G().running=true;const R=G().relays,lc=R.find(r=>r.type==='central');lc.captured=true;B.step(.05);B.checkWin&&B.checkWin();
  const early=G().over;for(const r of R)r.captured=true;B.checkWin();ok(!early&&G().over,'taking LC alone does not win, all '+R.length+' points do');
  B.newGame(9052,'fastning');B.WIN.all=false;G().relays.find(r=>r.type==='central').captured=true;B.checkWin();ok(G().over,'the old goal: LC alone');B.WIN.all=true;}
// 10. the enemy guards its coast: COAST.n bunkers up from open water on every island, taken from its own budget
{let all=true,where=[];for(const seed of[2024,9052,1490]){B.newGame(seed);const c=G().enemies.filter(e=>e.coast);if(c.length!==B.COAST.n||G().enemies.length===0)all=false;where.push(seed+': '+c.length);}
  ok(all,'two coastal bunkers on each island ('+where.join(', ')+')');}
// 11. after the test round of 26 okt: the robot's flight, the air defence firing at it, a robot at a known place, the berth along Birka
{const f={x1:0,y1:0,h1:2,x2:260,y2:0,h2:2};B.launch({x:1.6,y:0,kind:'gadda',heading:0},null,260,0,2,'gadda','f',true,0,'gadda');const r=G().fx[G().fx.length-2];
  ok(r.ttl>2.6&&r.ttl<3.4&&B.gaddaAt(r,.35).s<.06&&r.arc>=80,'a robot flies 260 m in '+r.ttl.toFixed(1)+' s, slowly out of the box ('+Math.round(B.gaddaAt(r,.35).s*100)+' % after 0.35 s), up to '+Math.round(r.arc)+' m');G().fx.length=0;
  /* out of the box over the bow and round onto the target (Magnus 26 okt): abeam it starts ahead, astern it comes round wide, not over the boat */
  const fire=hd=>{G().fx.length=0;B.launch({x:0,y:0,kind:'gadda',heading:hd},null,260,0,2,'gadda','f',true,0,'gadda');return G().fx[G().fx.length-2];};
  const b=fire(Math.PI/2),p=B.gaddaAt(b,.4),c=fire(Math.PI);let near=1e9;for(let i=8;i<=40;i++){const q=B.gaddaAt(c,c.ttl*i/40);near=Math.min(near,Math.hypot(q.x,q.y));}
  ok(p.y>2*Math.abs(p.x)&&b.ttl<r.ttl+.8&&near>15&&c.ttl<r.ttl+1.6,'abeam it leaves ahead ('+p.y.toFixed(1)+' m ahead, '+p.x.toFixed(1)+' m toward the target after 0.4 s) in '+b.ttl.toFixed(1)+' s; astern it turns wide (never nearer the boat than '+Math.round(near)+' m after the start) in '+c.ttl.toFixed(1)+' s');G().fx.length=0;}
{B.newGame(9052,'fastning');G().running=true;G().netAll=true;B.testfall('glv');G().paused=false;const u=G().units.find(v=>v.kind==='gadda'),T=G().enemies.find(e=>!e.dead&&e.kind==='turret'),A=G().enemies.find(e=>!e.dead&&e.kind==='aa');
  const k0=B.GADDA.aaDown;B.GADDA.aaDown=1;B.giveOrder(u,{type:'attack',enemy:T,post:'off'});let flak=0,mid=false;const seen=new Set();
  until(()=>{for(const f of G().fx){if(f.k==='shot'&&f.ws==='flak'&&f.a===A&&!seen.has(f)){seen.add(f);flak++;}if(f.k==='shot'&&f.ws==='gadda'&&f.done&&f.t<f.ttl-.05)mid=true;}return (G().gaddaDown||0)>0;},40);B.GADDA.aaDown=k0;
  ok((G().gaddaDown||0)>0&&mid&&flak>=3&&T.hp===T.maxhp,'the air defence fires at the robot ('+flak+' bursts) and brings it down in the air');}
{B.newGame(9052,'fastning');G().running=true;B.testfall('gvanta');G().paused=false;const u=G().units.find(v=>v.kind==='gadda'),T=G().enemies.find(e=>!e.dead&&e.kind==='turret');
  for(const v of G().units)if(v.kind==='drone')v.dead=true;B.giveOrder(u,{type:'attack',enemy:T,post:'off'});until(()=>u.orders[0]&&u.orders[0].waitTold,40);ok(u.orders[0]&&u.orders[0].waitTold&&u.ammo===4,'waiting for a painter, it says so once in the log');
  B.giveOrder(u,{type:'strike',x:T.lx,y:T.ly,n:1,post:'off'});until(()=>u.ammo<4&&!G().fx.some(f=>f.k==='shot'&&f.ws==='gadda'&&!f.done),30);ok(u.ammo===3,'Robot mot platsen fires at once at an unseen bunker ('+Math.round(T.hp/T.maxhp*100)+' % left)');}
{B.newGame(9052,'fastning');G().running=true;G().netAll=true;for(const e of G().enemies)e.dead=true;const C=B.CARRIER,f={x:Math.cos(C.a),y:Math.sin(C.a)};let bad=0,ok2=0;
  for(const[lat,fwd]of[[-200,-150],[180,120],[60,-260],[-90,240]]){const u=B.makeUnit('gadda',C.x-f.y*lat+f.x*fwd,C.y+f.x*lat+f.y*fwd);if(!B.seaPass(B.cellIdx(u.x,u.y))){G().units.length;continue;}G().units.push(u);u.ammo=0;B.giveOrder(u,{type:'rtb',post:'off'});u.rtb=true;
    until(()=>{const dx=u.x-C.x,dy=u.y-C.y,L={lat:-dx*f.y+dy*f.x,fwd:dx*f.x+dy*f.y};if(Math.abs(L.lat)<20&&Math.abs(L.fwd)<56)bad++;return !u.orders.length;},150);
    const dx=u.x-C.x,dy=u.y-C.y,lt=-dx*f.y+dy*f.x,fw=dx*f.x+dy*f.y;if(!u.orders.length&&Math.abs(lt)>20&&Math.abs(lt)<40&&Math.abs(fw)<35)ok2++;G().units=G().units.filter(v=>v!==u);}
  ok(ok2>=3&&!bad,'home from four sides it lies along Birkas side ('+ok2+' of 4), never in her hull or on her ramps ('+bad+' steps)');}
// 12. omprov 26 okt: a full turn at full speed keeps its way (36 knots, not 27) on a tighter turn than before
{B.newGame(9052,'fastning');G().running=true;G().netAll=true;for(const e of G().enemies)e.dead=true;const nf=B.navField(B.W);let bi=0;for(let i=0;i<nf.length;i++)if(B.seaPass(i)&&nf[i]>nf[bi]&&nf[i]<400)bi=i;
  const u=boat((bi%220)*10+5,Math.floor(bi/220)*10+5);u.heading=0;u.v=0;G().ctrl=u.id;B.CTRL.thr=1;B.CTRL.steer=0;until(()=>false,15);B.CTRL.steer=1;const pts=[];for(let i=0;i<200;i++){B.step(.05);if(i>100)pts.push([u.x,u.y]);}
  let mx=0,my=0;pts.forEach(q=>{mx+=q[0];my+=q[1];});mx/=pts.length;my/=pts.length;const r=pts.reduce((s,q)=>s+Math.hypot(q[0]-mx,q[1]-my),0)/pts.length;B.CTRL.thr=0;B.CTRL.steer=0;G().ctrl=null;
  ok(u.v>17&&r<18,'full lock at full speed: '+(u.v*1.944).toFixed(0)+' knots on a turn of '+r.toFixed(1)+' m');}
// 13. the crane: the boat goes up clear of the gantry before it leaves the bay, and the gantry is not in the way
{B.newGame(9052,'fastning');G().running=true;G().netAll=true;B.queueBuild('gadda');until(()=>G().units.some(u=>u.kind==='gadda'),40);const u=G().units.find(v=>v.kind==='gadda');let low=0,ph=new Set();
  until(()=>{const P=u.launch&&u.launch.pose;if(P){ph.add(P.ph);const L=B.shipLocal(u.x,u.y);if(P.ph===2&&Math.hypot(L.lat-9,L.fwd-2)>2&&u.craneH<B.DECK_Y+15)low++;}return !u.launch;},40);
  ok(ph.size===4&&!low&&B.heightAt(u.x,u.y)<0,'the crane takes it through all four steps, '+(low?low+' steps low over the deck':'over the gantry')+', into the water');}
// 14. issue 84 (provspel 27 okt, ö 3022): new orders at full speed. Braking into a bend on the reverse buckets it puts the wheel over the
//     other way and carves round the point (it turned away, overshot and came round the long way at a crawl); and run aground head on at
//     a dry edge the grid does not show, it backs off and plans round it (on 1490 it stood nose to a rock for good)
{B.newGame(3022,'fastning');G().running=true;G().netAll=true;for(const e of G().enemies)e.dead=true;const u=boat(586,748);
  u.heading=Math.PI*174/180;u.bvx=Math.cos(u.heading)*22;u.bvy=Math.sin(u.heading)*22;u.vf=u.v=22;B.giveOrder(u,{type:'move',x:385,y:875,post:'off'});let crawl=0;
  const got=until(()=>{if(G().time>1&&u.v<6&&Math.hypot(u.x-385,u.y-875)>30)crawl+=.05;return !u.orders.length;},40);
  ok(got&&crawl<1,'from 22 m/s west round the point to the south in '+Math.round(G().time)+' s, '+crawl.toFixed(1)+' s under 6 m/s (was 5)');}
{B.newGame(1490,'fastning');G().running=true;G().netAll=true;for(const e of G().enemies)e.dead=true;const u=boat(235,1095);B.giveOrder(u,{type:'move',x:495,y:535,post:'off'});
  until(()=>false,6);B.giveOrder(u,{type:'move',x:505,y:1455,post:'off'});const t0=G().time;let st=0,stMax=0;
  const got=until(()=>{st=u.v<1?st+.05:0;stMax=Math.max(stMax,st);return !u.orders.length;},120);
  ok(got&&stMax<2,'turned about by a rock on 1490, it gets off and reaches the point in '+Math.round(G().time-t0)+' s, still for at most '+stMax.toFixed(1)+' s');}
process.exit(fail?1:0);
