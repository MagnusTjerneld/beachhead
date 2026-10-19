// a VARG in a firefight (18 okt, issue 61): a move given before the contact is laid by, the VARG stops and fights where it stands and
// drives on when no known threat is in reach; a move the captain gives during the fight is carried out; fire it cannot answer makes
// it pull out of reach and wait there
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const setup=seed=>{B.newGame(seed);const G=B.G;G.running=true;G.netAll=true;for(const e of G.enemies)e.dead=true;for(let i=0;i<40;i++)B.step(.05);return G;};
const foe=(G,kind,x,y)=>{const e=B.makeEnemy({id:'Q'+kind,kind,x,y});e.seen=true;e.lx=x;e.ly=y;e.mobile=false;e.speed=0;G.enemies.push(e);return e;};
// a start on the first point and a line out from it that a VARG can drive, with the foe beside the line halfway
const lane=G=>{const L=G.relays[0];for(let k=0;k<16;k++){const a=k*Math.PI/8,P={x:L.x+Math.cos(a)*420,y:L.y+Math.sin(a)*420};if(P.x<60||P.y<60||P.x>2140||P.y>2140)continue;
  const p=B.astar(L.x,L.y,P.x,P.y,i=>G&&B.W.grid[i]>=1,()=>1);if(!p)continue;return{S:{x:L.x,y:L.y},P,a,side:(d,o)=>({x:L.x+Math.cos(a)*d-Math.sin(a)*o,y:L.y+Math.sin(a)*d+Math.cos(a)*o})};}return null;};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
// 1. a move given before the contact: the VARG stops, fights, and drives on when the bunker is out
{const G=setup(7341),R=lane(G),u=B.makeUnit('tank',R.S.x,R.S.y);u.post='def';G.units.push(u);const q=R.side(230,50),e=foe(G,'turret',q.x,q.y);
  B.setSel([u.id]);B.groupOrder({world:R.P},false);const o=u.orders[0];
  let held=false,near=1e9,t=0;for(;t<180&&!e.dead;t+=.05){B.step(.05);if(u.fh)held=true;near=Math.min(near,dist(u,e));if(u.dead)break;}
  ok(held,'a VARG under fire lays its move by ('+(held?'held':'never held')+')');
  ok(near>75,'and stays where the first shot met it instead of driving past the bunker (it fires first at 80 to 140 m) (nearest '+Math.round(near)+' m, the line passes 50 m from it)');
  ok(e.dead||u.dead,'the fight is settled ('+(e.dead?'bunker out':'VARG lost')+' after '+t.toFixed(0)+' s)');
  if(e.dead&&!u.dead){let s=0;for(;s<90&&dist(u,R.P)>15;s+=.05)B.step(.05);ok(u.orders[0]===o||dist(u,R.P)<=15,'with the bunker out it takes the order up again and reaches the point ('+Math.round(dist(u,R.P))+' m left after '+s.toFixed(0)+' s)');}}
// 2. the captain's move during the fight is carried out
{const G=setup(7341),R=lane(G),u=B.makeUnit('tank',R.S.x,R.S.y);u.post='def';u.hp=u.maxhp=1e4;G.units.push(u);const q=R.side(230,50),e=foe(G,'turret',q.x,q.y);e.hp=e.maxhp=1e5;
  B.setSel([u.id]);B.groupOrder({world:R.P},false);let t=0;for(;t<90&&!u.fh;t+=.05)B.step(.05);
  ok(!!u.fh,'(the VARG holds in the fight after '+t.toFixed(0)+' s)');
  const P2=R.side(330,0);B.setSel([u.id]);B.groupOrder({world:P2},false);const o=u.orders[0];
  ok(o&&o.inFight,'a move given during the fight is the captain\'s and marked so');
  let s=0;for(;s<60&&dist(u,P2)>12;s+=.05)B.step(.05);ok(dist(u,P2)<=12,'and the VARG drives it through the fire ('+Math.round(dist(u,P2))+' m left after '+s.toFixed(0)+' s)');}
// 3. fire it cannot answer: an anti-tank team out of its reach makes it pull out and wait
{const G=setup(7341),R=lane(G),u=B.makeUnit('tank',R.S.x,R.S.y);u.post='def';u.hp=u.maxhp=1e4;G.units.push(u);const q=R.side(300,0),e=foe(G,'at',q.x,q.y);e.range=220;
  /* the VARG reaches 140 and the team (here) 220: the order stops 150 m short of the team */
  const P=R.side(150,0);B.setSel([u.id]);B.groupOrder({world:P},false);let t=0,out=false;for(;t<60;t+=.05){B.step(.05);if(u.fh&&u.fh.out){out=true;break;}}
  ok(out,'a VARG hit by what it cannot answer pulls out ('+(out?'after '+t.toFixed(0)+' s':'never')+')');
  let s=0;for(;s<40;s+=.05)B.step(.05);ok(dist(u,e)>e.range,'out of the team\'s reach ('+Math.round(dist(u,e))+' m from it, reach '+e.range+') and waits there: '+u.state);
  for(s=0;s<30;s+=.05)B.step(.05);ok(!e.dead&&B.G.log.some(l=>l.uid===u.id&&/Väntar fortfarande/.test(l.text)),'a minute out it says so again in the log');}
// 4. a hidden threat that falls silent: after 30 s neither seen nor firing it no longer holds the order (decided 19 okt)
{const G=setup(7341),R=lane(G),u=B.makeUnit('tank',R.S.x,R.S.y);u.post='def';u.hp=u.maxhp=1e4;G.units.push(u);const q=R.side(230,50),e=foe(G,'turret',q.x,q.y);e.hp=e.maxhp=1e6;
  B.setSel([u.id]);B.groupOrder({world:R.P},false);let t=0;for(;t<90&&!u.fh;t+=.05)B.step(.05);
  e.rate=0;e.cd=1e9;e.reveal=0;u.hitBy={};let r=0;for(;r<60&&u.fh;r+=.05)B.step(.05);
  ok(!u.fh&&r>25&&r<45,'a hidden bunker gone silent stops holding the order after about 30 s ('+r.toFixed(0)+' s, '+u.state+')');}
console.log(fail?fail+' FAILED':'all passed');process.exit(fail?1:0);
