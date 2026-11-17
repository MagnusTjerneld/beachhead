// Natt 17 nov: GÄDDA keeps apart and gives way (issue 193), fires instead of circling (issue 196), and an attack order that gets no firing
// spot is refused after ATK_TRIES tries (two since 17 nov, about 3 s), or fired from where the unit stands (issue 199); BJÖRN has its own place after VARG in the unit list (issue 202).
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const G=()=>B.G,until=(f,s)=>{for(let i=0;i<s*20;i++){if(f())return true;B.step(.05);}return !!f();};
const boat=(x,y)=>{const u=B.makeUnit('gadda',x,y);G().units.push(u);return u;},d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const open=()=>{const nf=B.navField(B.W);let bi=-1;for(let i=0;i<nf.length;i++)if(B.seaPass(i)&&nf[i]<400&&(i%220)*10>250&&(i%220)*10<1950&&Math.floor(i/220)*10>250&&Math.floor(i/220)*10<1950&&(bi<0||nf[i]>nf[bi]))bi=i;return{x:(bi%220)*10+5,y:Math.floor(bi/220)*10+5};};
const fresh=()=>{B.newGame(9052,'fastning');G().running=true;G().netAll=true;};
const sp0=e=>B.gaddaSpot({x:B.CARRIER.x,y:B.CARRIER.y,range:260},e.x,e.y);
const painter=T=>{const v=B.makeUnit('drone',T.x+60,T.y);v.hp=v.maxhp=1e6;v.ammo=v.maxAmmo=0;v.fuel=v.maxFuel=1e6;v.range=v.dmg=0;G().units.push(v);return()=>{v.x=T.x+60;v.y=T.y;v.orders=[];};};

// issue 193: two boats with an attack on the same target choose firing spots at least GADDA.form apart, and lie that far apart
{fresh();const T=G().enemies.find(e=>e.kind==='turret'&&sp0(e));for(const e of G().enemies)if(e!==T)e.dead=true;
  const sp=sp0(T),a=boat(sp.x+20,sp.y),b=boat(sp.x+26,sp.y+6),hold=painter(T);T.hp=T.maxhp=1e6;
  B.giveOrder(a,{type:'attack',enemy:T,post:'off'});B.giveOrder(b,{type:'attack',enemy:T,post:'off'});
  let fa=null,fb=null,lie=1e9;until(()=>{hold();const x=a.orders[0]&&a.orders[0].fp,y=b.orders[0]&&b.orders[0].fp;if(x&&y&&!fa){fa=x;fb=y;}
    if(x&&y&&(a.v||0)<1.5&&(b.v||0)<1.5&&/Skjuter|skjutläge/.test(a.state+b.state))lie=Math.min(lie,d(a,b));return false;},40);
  ok(fa&&fb&&d(fa,fb)>=B.GADDA.form-.5,'two attack orders on one target get firing spots '+(fa&&fb?Math.round(d(fa,fb)):'?')+' m apart (at least '+B.GADDA.form+')');
  ok(lie<1e9&&lie>=B.GADDA.form-12,'and the boats lie '+Math.round(lie)+' m apart at their spots');}
// a boat that comes to lie still on another moves off to GADDA.form m
{fresh();for(const e of G().enemies)e.dead=true;const p=open(),a=boat(p.x,p.y),b=boat(p.x+8,p.y+3);until(()=>false,40);
  ok(d(a,b)>=B.GADDA.form-4&&(a.v||0)<2&&(b.v||0)<2,'two boats lying 8 m apart: one moves off, now '+Math.round(d(a,b))+' m');}
// give way under way: head on, and crossing, never nearer than a few metres
for(const kind of['head','cross']){fresh();for(const e of G().enemies)e.dead=true;const p=open(),a=boat(p.x-100,p.y),b=kind==='head'?boat(p.x+100,p.y):boat(p.x,p.y+100);
  a.heading=0;b.heading=kind==='head'?Math.PI:-Math.PI/2;let near=1e9,dry=0;
  B.giveOrder(a,{type:'move',x:p.x+100,y:p.y,post:'off'});B.giveOrder(b,kind==='head'?{type:'move',x:p.x-100,y:p.y,post:'off'}:{type:'move',x:p.x,y:p.y-100,post:'off'});
  const done=until(()=>{near=Math.min(near,d(a,b));if(B.heightAt(a.x,a.y)>=0||B.heightAt(b.x,b.y)>=0)dry++;return !a.orders.length&&!b.orders.length;},120);
  if(!done)console.log('dbg',a.state,'|',b.state,Math.round(a.x),Math.round(a.y),Math.round(b.x),Math.round(b.y),a.orders.length,b.orders.length);ok(done&&near>8&&!dry,kind+': two boats on a collision course pass each other at '+Math.round(near)+' m and both arrive ('+Math.round(G().time)+' s)');}
// the same head-on meeting with the rule switched off ends in a collision course, so the test above shows the rule at work
{const y0=B.GADDA.yieldD,l0=B.GADDA.yieldLead;B.GADDA.yieldD=0;B.GADDA.yieldLead=0;fresh();for(const e of G().enemies)e.dead=true;const p=open(),a=boat(p.x-100,p.y),b=boat(p.x+100,p.y);a.heading=0;b.heading=Math.PI;let near=1e9;
  B.giveOrder(a,{type:'move',x:p.x+100,y:p.y,post:'off'});B.giveOrder(b,{type:'move',x:p.x-100,y:p.y,post:'off'});until(()=>{near=Math.min(near,d(a,b));return !a.orders.length&&!b.orders.length;},120);B.GADDA.yieldD=y0;B.GADDA.yieldLead=l0;
  ok(near<8,'without the rule the same meeting passes at '+Math.round(near)+' m');}
// issue 196: in reach of a spotted, still target a boat comes to rest and fires; it never circles
{let fired=0,tried=0;
  for(const off of[[200,0],[0,200],[-200,0],[60,-150]]){fresh();const T=G().enemies.find(e=>e.kind==='turret'&&sp0(e));for(const e of G().enemies)if(e!==T)e.dead=true;T.hp=T.maxhp=1e6;
    const s=sp0(T),u=boat(s.x+off[0],s.y+off[1]);if(!B.seaPass(B.cellIdx(u.x,u.y)))continue;tried++;u.heading=Math.atan2(T.y-u.y,T.x-u.x);const hold=painter(T);
    B.giveOrder(u,{type:'attack',enemy:T,post:'off'});const a0=u.ammo;until(()=>{hold();return u.ammo<a0;},60);
    ok(u.ammo<a0,'from '+off.join(',')+' off its spot the boat fires at a still target ('+Math.round(G().time)+' s, '+u.state+')');if(u.ammo<a0)fired++;}
  ok(tried>=2&&fired===tried,'it fired from '+fired+' of '+tried+' starts');}
// issue 199: an attack order with no firing spot it can reach is refused at once, with a message (a way that fails is tried ATK_TRIES times, two since 17 nov); one that can be fired on from here is fired on from here
{const run=(dist,direct)=>{fresh();for(const e of G().enemies)e.dead=true;const r=G().relays.find(q=>q.type!=='central')||G().relays[0];
    const cx=Math.floor(r.x/10),cy=Math.floor(r.y/10),g=B.W.grid;let bx=-1,by=-1;
    for(let a=0;a<64&&bx<0;a++){const x=r.x+Math.cos(a*.1)*dist,y=r.y+Math.sin(a*.1)*dist;if(B.heightAt(x,y)>2&&B.heightAt(x,y)<20){bx=x;by=y;}}
    const u=B.makeUnit('tank',r.x,r.y);u.hp=u.maxhp=1e4;G().units.push(u);
    const sv=[];for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))<3)continue;const i=(cy+dy)*B.GW+cx+dx;sv.push([i,g[i]]);g[i]=4;/* ROCK: VARG drives through water, so a ring of water was no wall (found 17 nov when ATK_TRIES went to 2) */}
    const E=B.makeEnemy({kind:'turret',x:bx,y:by});E.seen=true;E.visibleNow=true;E.lx=bx;E.ly=by;E.canGround=true;E.hp=E.maxhp=1e6;G().enemies.push(E);B.LOS.on=false;const hold=painter(E);
    const n0=G().log.length;B.giveOrder(u,{type:'attack',enemy:E,post:'off'});const t0=G().time;
    if(direct){B.step(.05);const o=u.orders[0];if(o){o.fp=null;B.spotFail(u,o,{none:true});}}else until(()=>{hold();return !u.orders.length;},6);
    const msg=G().log.slice(n0).map(l=>l.text).join(' | ');for(const[i,v]of sv)g[i]=v;
    return{u,msg,gone:!u.orders.length,t:G().time-t0,here:u.orders[0]&&u.orders[0].here,bx,dist:Math.hypot(E.x-u.x,E.y-u.y),range:B.effRange?0:0};};
  const far=run(900,false);
  ok(far.bx>0&&far.gone&&far.t<5&&/eldställning|framkomlig|spärr|rimlig/.test(far.msg),'a target out of reach with no way: refused in '+far.t.toFixed(1)+' s with a message ('+far.msg.slice(0,110)+')');
  ok(B.ATK_TRIES===2,'ATK_TRIES is 2 (Magnus 17 nov): a way that fails is tried once more after u.waitT, about 3 s, before the refusal');
  const near=run(110,true);
  ok(near.bx>0&&!near.gone&&near.here,'a target in reach and in sight, no way to a spot: fired on from where the unit stands ('+(near.here?'here':'no')+')');
  // the same unit given the same order again is told again
  {run(900,false);const b=run(900,false);ok(b.gone&&b.msg.length>0,'a second order gets its message too');}}
// issue 202: BJÖRN has its own place straight after VARG in the unit list
{const src=require('fs').readFileSync(__dirname+'/../index.html','utf8');ok(/KO=\{eng:0,tank:1,bjorn:1\.5,drone:2/.test(src)&&/rk\(a\.u\)/.test(src),'buildRoster sorts BJÖRN (ty bjorn) between VARG and HÖK');}
process.exit(fail?1:0);
