// GÄDDA, the robot boat (26 okt, Magnus): built at Birka's side, finds its way on the water round the land, fires on a target a unit
// sees from a place out of the enemy's reach and kills a bunker with two robots, waits when nobody sees the target, sends a robot at a
// building and at a point, goes home by itself when it is out of robots and loads again only when the captain approves; and an air
// defence shoots about one robot in seven down
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const G=()=>B.G,until=(f,s)=>{for(let i=0;i<s*20;i++){if(f())return true;B.step(.05);}return !!f();};
const wet=(x,y)=>B.heightAt(x,y)<0;
const boat=(x,y)=>{const u=B.makeUnit('gadda',x,y);G().units.push(u);return u;};
// 1. built in the bay for 220 and put in the water by KROK, or by the crane when there is no KROK
{B.newGame(9052,'fastning');G().running=true;G().netAll=true;const r0=G().res;B.queueBuild('gadda');
  until(()=>G().units.some(u=>u.kind==='gadda'),40);const u=G().units.find(v=>v.kind==='gadda');let lifted=false;
  ok(r0-G().res===220,'GÄDDA costs 220 ('+(r0-G().res)+')');until(()=>{if(u.carried)lifted=true;return !u.launch;},120);
  ok(lifted&&!u.launch&&wet(u.x,u.y)&&B.atBirkaSide(u),'built in the bay, KROK puts it in the water beside Birka ('+u.state+')');
  // with no KROK, Birka's crane launches the next one
  {for(const k of G().kroks)k.dead=true;B.queueBuild('gadda');until(()=>G().units.filter(v=>v.kind==='gadda').length>1,40);const u2=G().units.filter(v=>v.kind==='gadda')[1];
    until(()=>!u2.launch,40);ok(!u2.launch&&wet(u2.x,u2.y),'with no KROK the crane puts it in the water ('+Math.round(G().time)+' s)');G().units=G().units.filter(v=>v!==u2);}
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
process.exit(fail?1:0);
