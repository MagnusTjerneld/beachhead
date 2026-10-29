// Kustbatteriet made over (issue 73, Magnus 29 okt): the coast artillery stands out of reach of Birka and the landing beach with a way on
// land to its portal, fires at GÄDDA on the sea but not at a VARG on land, is only silenced by fire, goes up to BÄVER's charge at the
// portal, and the mission fails when its time is out. Birka's way to the harbour goes round its reach, and an attack on it ends when it
// falls silent (Magnus 29 okt)
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const G=()=>B.G,until=(f,s)=>{for(let i=0;i<s*20;i++){if(f())return true;B.step(.05);}return !!f();};
const start=()=>{for(let sd=1012;sd<1200;sd++){B.newGame(sd,null,{uppdrag:'kust'});if(G().mission==='kust'&&B.W.harbor&&B.W.birkaPath)return sd;}return null;};
const sd=start();ok(sd!=null,'an island takes the battery (ö '+sd+')');
const bat=()=>G().enemies.find(e=>e.kind==='kust'),put=(k,x,y)=>{const u=B.makeUnit(k,x,y);G().units.push(u);return u;};
const clean=()=>{for(const u of G().units)if(!u.carried)u.dead=true;for(const e of G().enemies)if(e.kind!=='kust')e.dead=true;G().running=true;G().paused=false;};
{const e=bat(),L=B.W.landing,bk=B.shipPos(0,0),R=e.seaRange,p={x:e.x-Math.cos(e.face)*13,y:e.y-Math.sin(e.face)*13},pth=B.astar(L.x,L.y,p.x,p.y,i=>B.W.grid[i]===3||B.W.grid[i]===2,()=>1);
  ok(Math.hypot(e.x-L.x,e.y-L.y)>R&&Math.hypot(e.x-bk[0],e.y-bk[1])>R,'out of reach of the landing beach ('+Math.round(Math.hypot(e.x-L.x,e.y-L.y))+' m) and Birka ('+Math.round(Math.hypot(e.x-bk[0],e.y-bk[1]))+' m)');
  ok(pth&&pth.length>0,'a way on land from the beach to the portal');}
const sea=e=>{for(let d=150;d<=260;d+=10)for(let a=-1;a<=1;a+=.1){const x=e.x+Math.cos(e.face+a)*d,y=e.y+Math.sin(e.face+a)*d;if(B.heightAt(x,y)<-3)return{x,y};}return null;};
{clean();const e=bat(),w=sea(e);ok(!!w,'open water within its reach');const g=put('gadda',w.x,w.y);until(()=>g.hp<g.maxhp,40);ok(g.hp<g.maxhp,'it fires at GÄDDA on the sea ('+Math.round(g.hp)+' of '+g.maxhp+')');}
{clean();const e=bat(),v=put('tank',e.x-Math.cos(e.face)*25,e.y-Math.sin(e.face)*25);until(()=>false,30);ok(v.hp===v.maxhp,'not at a VARG on land');}
{clean();const e=bat(),w=sea(e);e.hp-=60;B.step(.05);const g=put('gadda',w.x,w.y),t0=G().time;until(()=>g.hp<g.maxhp,40);
  ok(!e.dead&&e.hp===e.maxhp,'a robot hit leaves it whole');ok(G().time-t0>30,'and silences it ('+Math.round(G().time-t0)+' s before it fires again)');}
{clean();const e=bat(),p={x:e.x-Math.cos(e.face)*30,y:e.y-Math.sin(e.face)*30},b=put('eng',p.x,p.y),t0=G().time;B.giveOrder(b,B.defaultOrder(b,{enemy:e},'off'));
  ok(b.orders[0]&&b.orders[0].type==='blast','BÄVER on the battery: Spräng');until(()=>e.dead,120);ok(e.dead&&G().time-t0>=30,'BÄVER blows it up at the portal ('+Math.round(G().time-t0)+' s)');
  B.checkWin();ok(G().over&&!G().failed,'and the mission is done');}
{start();clean();const e=bat(),w=sea(e),g=put('gadda',w.x,w.y);g.ammo=4;e.seen=true;e.visibleNow=true;e.silT=G().time+40;B.giveOrder(g,{type:'attack',enemy:e,post:'off'});B.step(.05);
  ok(!g.orders.some(o=>o.type==='attack')&&g.ammo===4,'GÄDDA does not fire at it while it is silent');
  until(()=>!g.orders.length,40);ok(Math.hypot(g.x-e.x,g.y-e.y)>e.seaRange&&g.hp===g.maxhp,'and goes out of its reach before it wakes ('+Math.round(Math.hypot(g.x-e.x,g.y-e.y))+' m)');}
{start();const e=bat(),hr=G().relays.find(r=>r.type==='hamn');G().running=true;G().paused=false;for(const u of G().units)if(!u.carried)u.dead=true;for(const q of G().enemies)q.dead=q!==e?true:q.dead;hr.captured=true;
  until(()=>G().harbor&&G().harbor.route,30);const R=G().harbor&&G().harbor.route||[];let near=1e9;for(const q of R)near=Math.min(near,Math.hypot(q.x-e.x,q.y-e.y));
  ok(R.length>2&&near>e.seaRange+40,'Birka plans her way to the harbour round its reach ('+Math.round(near)+' m at the nearest, '+R.length+' poses)');
  ok(until(()=>G().harbor.docked,600),'and berths in the harbour');}
{start();const g=G();g.running=true;g.time=1801;B.checkWin();ok(g.over&&g.failed,'it fails when the time is out');}
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
