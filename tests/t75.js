// coordinated attack (19 okt, issue 59): in a planned group attack the HÖK waits until the VARG leave their staging points, and the
// group goes in at once when one of it is already in a fight elsewhere and needs backing
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;B.LOS.on=false;/* laid out before the line of sight (issue 38), which t76 tries */B.START.res=500;B.START.units=['drone','tank','tank','eng'];B.SHAPE_CFG.force='rund';B.SHAPE_CFG.rough=0;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const run=s=>{for(let i=0;i<s*20;i++)B.step(.05);};
const setup=()=>{B.newGame(7341);const G=B.G;G.running=true;G.netAll=true;for(const e of G.enemies)e.dead=true;G.known.fill(1);G.knownV++;return G;};
const live=(G,kind,x,y)=>{const e=G.enemies.find(q=>q.dead&&q.kind===kind);e.dead=false;e.hp=e.maxhp;e.x=x;e.y=y;e.hx=x;e.hy=y;e.lx=x;e.ly=y;e.seen=true;e.route=null;e.march=null;e.alert=null;return e;};
const L={x:1175,y:1405};/* laid out like t66 */
// 1. two VARG and two HÖK in a wing on a bunker: no robot leaves a HÖK before the VARG leave their staging points
{const G=setup();const[v1,v2]=G.units.filter(u=>u.kind==='tank'),h1=G.units.find(u=>u.kind==='drone'),h2=B.makeUnit('drone',h1.x+10,h1.y);G.units.push(h2);
  const t=live(G,'turret',L.x+200,L.y);t.hp=t.maxhp=5000;t.camo=false;t.dmg=0;
  v1.x=t.x-230;v1.y=t.y-20;v2.x=t.x-280;v2.y=t.y+20;/* 50 m behind: since 24 okt one more than STAGE_LATE s off is not waited for */for(const h of[h1,h2]){h.x=t.x-260;h.y=t.y;h.alt=30;h.post='off';h.hp=h.maxhp=1e4;}for(const v of[v1,v2])v.hp=v.maxhp=1e5;
  B.setSel([v1.id,v2.id,h1.id,h2.id]);B.groupOrder({enemy:t},false);
  let early=0,go=false;for(let i=0;i<240&&!go;i++){run(.5);go=[v1,v2].some(v=>v.orders[0]&&v.orders[0].go);if(!go&&[h1,h2].some(h=>h.ammo<h.maxAmmo))early++;}
  ok(go,'the VARG go in together ('+(go?'yes':'no')+')');ok(early===0,'and no HÖK fired its robots before that ('+early+' half seconds with a robot gone)');
  run(15);ok([h1,h2].some(h=>h.ammo<h.maxAmmo),'after they go in the HÖK strike too');}
// 2. one of the group already in a fight elsewhere: the planned attack does not wait for the slow one
{const G=setup();const[v1,v2]=G.units.filter(u=>u.kind==='tank');const t=live(G,'turret',L.x+200,L.y);t.hp=t.maxhp=5000;t.camo=false;t.cd=1e9;/* silent, so only the new rule can start the attack */
  v1.x=t.x-230;v1.y=t.y-20;v2.x=t.x-280;v2.y=t.y+20;/* 50 m behind: since 24 okt one more than STAGE_LATE s off is not waited for */for(const v of[v1,v2]){v.hp=v.maxhp=1e5;v.orders=[{type:'attack',enemy:t,post:'off'}];}
  let st=0;for(;st<60&&!/väntar på resten/.test(v1.state||'');st+=.5)run(.5);
  ok(/väntar på resten/.test(v1.state||''),'(VARG-1 waits at its staging point: '+v1.state+')');
  const lp=live(G,'light',v2.x+90,v2.y);lp.mobile=false;lp.speed=0;lp.hp=lp.maxhp=1e4;
  let s=0;for(;s<15&&!(v1.orders[0]&&v1.orders[0].go);s+=.5)run(.5);
  ok(v1.orders[0]&&v1.orders[0].go,'with VARG-2 in a fight with a light tank on its way, VARG-1 goes in at once ('+s+' s)');
  ok(G.log.some(l=>/redan i strid/.test(l.text)),'and the log says why');}
console.log(fail?fail+' FAILED':'all passed');process.exit(fail?1:0);
