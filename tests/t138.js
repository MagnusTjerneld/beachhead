// The robot box trains (Magnus 11 nov, provspel ö 3842 kp03: turning the whole boat took four to five seconds a shot): abeam the boat
// keeps its heading and fires as soon as the box is up and on the target, the robot leaves in the box's direction; astern, past the arc,
// it turns the bow as before; the box comes home to the bow before it lies down
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const G=()=>B.G,deg=a=>Math.round(a*180/Math.PI),aw=a=>Math.atan2(Math.sin(a),Math.cos(a));
function setup(off){B.newGame(9052,'fastning');G().running=true;G().netAll=true;
  const T=G().enemies.find(e=>e.kind==='turret'&&B.gaddaSpot({x:B.CARRIER.x,y:B.CARRIER.y,range:260},e.x,e.y));for(const e of G().enemies)if(e!==T)e.dead=true;
  const sp=B.gaddaSpot({x:B.CARRIER.x,y:B.CARRIER.y,range:260},T.x,T.y),u=B.makeUnit('gadda',sp.x,sp.y);G().units.push(u);
  u.heading=Math.atan2(T.y-u.y,T.x-u.x)+off;T.hp=T.maxhp=1e6;
  const v=B.makeUnit('drone',T.x+60,T.y);v.hp=v.maxhp=1e6;v.ammo=v.maxAmmo=0;v.fuel=v.maxFuel=1e6;v.range=v.dmg=0;G().units.push(v);
  B.giveOrder(u,{type:'attack',enemy:T,post:'off'});return{u,T,v};}
function run(S,s){const{u,T,v}=S,h0=u.heading,a0=u.ammo,t0=G().time;let turned=false,shot=null,maxTr=0;
  for(let i=0;i<s*20&&u.ammo===a0;i++){v.x=T.x+60;v.y=T.y;v.orders=[];B.step(.05);if(/^Vrider fören/.test(u.state))turned=true;maxTr=Math.max(maxTr,Math.abs(u.train||0));}
  shot=G().fx.find(f=>f.k==='shot'&&f.ws==='gadda');return{t:G().time-t0,dh:Math.abs(aw(u.heading-h0)),turned,shot,fired:u.ammo<a0,maxTr};}
/* abeam: the box trains 90 degrees, the boat stays on its heading */
{const S=setup(Math.PI/2),r=run(S,10),u=S.u;
  ok(r.fired&&r.t<3.5,'abeam it fires in '+r.t.toFixed(1)+' s (the box up and trained)');
  ok(!r.turned&&r.dh<.25,'without turning the bow ('+deg(r.dh)+' degrees)');
  ok(Math.abs(Math.abs(u.train)-Math.PI/2)<.2,'the box trained '+deg(u.train)+' degrees');
  const f=r.shot,d=f&&aw(Math.atan2(f.cy-f.y1,f.cx-f.x1)-(u.heading+u.train));ok(!!f&&Math.abs(d)<.3,'the robot leaves in the box\'s direction ('+(f?deg(d):'?')+' degrees off)');
  /* the target gone: the box comes home before it lies down */
  S.T.dead=true;let low=false;for(let i=0;i<200;i++){B.step(.05);if((u.lift||0)<B.GADDA.trainLift-.01&&Math.abs(u.train||0)>.02)low=true;}
  ok(!low&&Math.abs(u.train||0)<.02&&(u.lift||0)===0,'it trains home to the bow before it lies down ('+deg(u.train||0)+' degrees, lift '+(u.lift||0).toFixed(2)+')');}
/* astern, past the arc: the bow turns as before */
{const S=setup(Math.PI),r=run(S,12);
  ok(r.fired&&r.turned,'astern it turns the bow and fires ('+r.t.toFixed(1)+' s, '+deg(r.dh)+' degrees)');
  ok(r.maxTr<=B.GADDA.arc+1e-6,'the box never past its arc ('+deg(r.maxTr)+' degrees)');}
/* the model trains its box */
{const src=require('fs').readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');ok(/setTrain=t=>\{TT\.rotation\.y=-t;\}/.test(src)&&/U\.setTrain\(u\.train\|\|0\)/.test(src),'the 3D box follows u.train');}
console.log(fail?fail+' FAILED':'all ok');process.exit(fail?1:0);
