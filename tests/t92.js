// Kustbatteriet made over (issue 73, Magnus 29 okt): the coast artillery stands out of reach of Birka and the landing beach with a way on
// land to its portal, fires at GÄDDA on the sea but not at a VARG on land, is only silenced by fire, goes up to BÄVER's charge at the
// portal, and the mission fails when its time is out
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const G=()=>B.G,until=(f,s)=>{for(let i=0;i<s*20;i++){if(f())return true;B.step(.05);}return !!f();};
const start=()=>{for(let sd=4000;sd<4060;sd++){B.newGame(sd,null,{uppdrag:'kust'});if(G().mission==='kust')return sd;}return null;};
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
{start();const g=G();g.running=true;g.time=1801;B.checkWin();ok(g.over&&g.failed,'it fails when the time is out');}
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
