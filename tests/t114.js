// issue 148 (Magnus 4 nov, provspel ö 2169): a VARG that has lost its MUS stays on its service pad until the new one is aboard, but never
// sets out for it; issue 149: GÄDDA fires only with the robot box raised (u.lift 1), which takes 1.25 s
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const setup=seed=>{B.newGame(seed);const G=B.G;G.running=true;G.netAll=true;for(const e of G.enemies)e.dead=true;for(let i=0;i<40;i++)B.step(.05);G.known.fill(1);G.knownV++;return G;};
const run=s=>{for(let i=0;i<s*20;i++)B.step(.05);};
const vargAt=G=>{const C=B.CARRIER,f={x:Math.cos(C.a),y:Math.sin(C.a)},v=B.makeUnit('tank',C.x+f.x*90,C.y+f.y*90);v.musGiven=true;v.musId=null;G.units.push(v);return v;};
const timeOnPad=(v,max)=>{let on=0,left=-1;for(let i=0;i<20*max&&left<0;i++){B.step(.05);if(v.onPad&&!on)on=i/20;if(on&&!v.pad&&!v.rtb)left=i/20;}return{on,left};};
// 148: full hull, no MUS, sent to service: waits on the pad for the new MUS, then leaves
{const G=setup(1490);G.res=500;const v=vargAt(G);v.orders=[{type:'move',x:v.x+300,y:v.y,post:'def'}];B.sendToService(v,'ship');
  const r=timeOnPad(v,120);
  ok(r.on>0&&r.left>0,'it reached the pad ('+r.on.toFixed(1)+' s) and left it ('+r.left.toFixed(1)+' s)');
  ok(r.left-r.on>=8,'it stayed on the pad while the new MUS was built ('+(r.left-r.on).toFixed(1)+' s; 15 s count from entering the station radius)');
  const m=v.musId&&B.unitById(v.musId);ok(!!m&&!m.dead&&!!v.musT===false,'a new MUS is aboard when it leaves');
  ok(!B.musWait(v),'no longer waiting');}
// without material it does not wait
{const G=setup(1490);G.res=10;const v=vargAt(G);B.sendToService(v,'ship');const r=timeOnPad(v,60);
  ok(r.left>0&&r.left-r.on<6,'with too little material it leaves as before ('+(r.left-r.on).toFixed(1)+' s)');}
// a VARG that never had a MUS gets one at once, as before
{const G=setup(1490);G.res=500;const v=vargAt(G);v.musGiven=false;B.step(.05);ok(!!v.musId&&v.musGiven,'the first MUS is given without a wait');}
// a VARG without MUS and with full hull does not go to service by itself
{const G=setup(1490);G.res=500;const v=vargAt(G);v.x+=500;const x0=v.x,y0=v.y;run(30);ok(!v.rtb&&Math.hypot(v.x-x0,v.y-y0)<3&&!(v.orders[0]&&v.orders[0].type==='rtb'),'no MUS alone does not send it to service');}
// 149: the box rises before the first robot
{const G=setup(1264),C=B.CARRIER;
  const u=B.makeUnit('gadda',C.x+60,C.y);G.units.push(u);ok((u.lift||0)===0,'lift starts at 0');
  u.cd=0;u.ammo=u.maxAmmo;const a0=u.ammo;
  u.lift=.9;ok(B.gaddaFirePt(u,u.x+300,u.y)===false&&u.ammo===a0,'lift 0.9: no shot');
  u.lift=1;ok(B.gaddaFirePt(u,u.x+300,u.y)===true&&u.ammo===a0-1,'lift 1: a shot is fired');
  const G2=setup(1264);const u2=B.makeUnit('gadda',C.x+60,C.y);G2.units.push(u2);
  u2.orders=[{type:'strike',x:u2.x+200,y:u2.y,n:1,post:'off'}];u2.heading=0;
  let t0=-1,t1=-1;for(let i=0;i<20*20&&t1<0;i++){B.step(.05);const l=u2.lift||0;if(t0<0&&l>0)t0=i/20;if(u2.ammo<u2.maxAmmo)t1=i/20;}
  console.log('   lift started at '+t0+' s, first shot at '+t1+' s, state '+u2.state);
  ok(t0>=0&&t1>=0&&t1-t0>=1.15,'the first shot comes about 1.25 s after the box starts rising ('+(t1-t0).toFixed(2)+' s)');
  u2.orders=[];run(3);ok((u2.lift||0)<=.01,'with no target the box is lowered again ('+(u2.lift||0).toFixed(2)+')');}
console.log(fail?fail+' FAIL':'alla ok');process.exit(fail?1:0);
