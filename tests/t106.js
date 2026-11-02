// Shared sight between enemies in a zone (issue 80, Magnus 30 okt and 2 nov): a flag, off by default. With it on, an enemy in the same zone
// learns of a unit another enemy has seen after ENEMY_SHARE.t s (not before), from the position then, and not after the command centre is taken.
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
B.newGame(7341);const W=B.W,c=W.grid,land=(x,y)=>{const v=c[Math.floor(y/10)*220+Math.floor(x/10)];return v>=2&&B.elevAt(x,y,W.seed,W.V)>1.5;};
function arena(){for(let r=0;r<=700;r+=30)for(let b=0;b<6.28;b+=.3){const D={x:1100+Math.cos(b)*r,y:1100+Math.sin(b)*r};
  let k=true;let z0=null;for(let s=-110;s<=110&&k;s+=20)for(let l=-110;l<=110&&k;l+=20){const z=W.zid[B.cellIdx(D.x+s,D.y+l)];if(!land(D.x+s,D.y+l)||z<0||(z0!=null&&z!==z0))k=false;z0=z;}if(k)return D;}
  console.log('FAIL no open ground');process.exit(1);}
function run(on){Math.random=(s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;})(5);
  B.newGame(7341);const G=B.G;G.running=true;G.netAll=true;G.mines=[];B.ENEMY_SHARE.on=on;
  for(const b of G.barriers)if(!b.cleared){b.cleared=true;for(const q of b.cells)W.grid[q]=W.baseGrid[q];}
  const D=arena();for(let s=-170;s<=170;s+=5)for(let l=-170;l<=170;l+=5){const i=Math.floor((D.y+l)/10)*220+Math.floor((D.x+s)/10);if(W.grid[i]>=4)W.grid[i]=W.baseGrid[i]=3;}
  G.reachAll=null;B.computeLock();
  /* X1 an infantry team 25 m from the MUS, X2 a tank 90 m away (a MUS is seen only within 35 m by a mobile enemy); neither may fire */
  const mk=(id,kind,x,y)=>{const e=B.makeEnemy({id,kind,x:D.x+x,y:D.y+y});e.cd=1e9;e.seen=true;return e;};
  G.enemies=[mk('X1','inf',25,0),mk('X2','tank',90,0)];G.known.fill(1);G.knownV++;G.units=[];
  const m=B.makeUnit('mus',D.x,D.y);m.hp=m.maxhp=1e6;G.units.push(m);
  return{G,m,x1:G.enemies[0],x2:G.enemies[1]};}
{const{G,m,x1,x2}=run(true);
  ok(B.W.zid[B.cellIdx(x1.x,x1.y)]===B.W.zid[B.cellIdx(x2.x,x2.y)]&&B.W.zid[B.cellIdx(x1.x,x1.y)]>=0,'both enemies stand in the same zone');
  let tOwn=null,gotAt=null;
  for(let t=0;t<12;t+=.05){B.step(.05);
    if(x1.tgtU===m&&tOwn==null)tOwn=G.time;
    if(tOwn!=null&&gotAt==null){if(x2.tgtU===m)gotAt=G.time;}}
  ok(tOwn!=null&&tOwn<1,'X1 sees the MUS itself at once ('+(tOwn!=null?tOwn.toFixed(1):'-')+' s)');
  ok(gotAt!=null&&gotAt-tOwn>=4.9&&gotAt-tOwn<=6.5,'with the flag on X2 takes the MUS as a target after about 5 s, not before ('+(gotAt!=null&&tOwn!=null?(gotAt-tOwn).toFixed(1):'-')+' s)');
  const s0=B.shareTip(x2,m);
  ok(s0&&Math.hypot(s0.x-m.x,s0.y-m.y)<1,'the tip holds the position from then');
  /* the tip is a point, not the live unit */
  m.x+=300;const tp=B.shareTip(x2,m);ok(!tp||Math.hypot(tp.x-m.x,tp.y-m.y)>=250,'the tip does not follow the live unit');
  m.x-=300;
  /* the command centre taken: no more sharing */
  const cen=G.relays.find(r=>r.type==='central');cen.captured=true;x2.tgtU=null;
  ok(B.shareTip(x2,m)===null,'after the command centre is taken the tip is gone');
  cen.captured=false;ok(B.shareTip(x2,m)!==null,'and back while it stands');}
{const{G,m,x1,x2}=run(true);
  /* a MUS that neither of them sees gives X2 nothing */
  m.x+=200;let got=false;for(let t=0;t<10;t+=.05){B.step(.05);if(x2.tgtU===m)got=true;}
  ok(!got&&!B.shareTip(x2,m),'nothing seen, nothing shared');}
{const{G,m,x1,x2}=run(false);
  let got=false,gotAny=false;for(let t=0;t<12;t+=.05){B.step(.05);if(x2.tgtU===m)got=true;if(B.shareTip(x2,m))gotAny=true;}
  ok(x1.tgtU===m&&!got&&!gotAny&&!G.eRep,'with the flag off X2 never learns of it (as before)');}
{/* a fixed gun turns towards the shared point */
  const{G,m,x1,x2}=run(true);x2.mobile=false;x2.kind='turret';x2.aim=Math.PI;
  for(let t=0;t<8;t+=.05)B.step(.05);const a=Math.atan2(m.y-x2.y,m.x-x2.x),dA=Math.abs(Math.atan2(Math.sin(x2.aim-a),Math.cos(x2.aim-a)));
  ok(dA<.3||x2.tgtU===m,'a fixed gun turns towards the shared point ('+dA.toFixed(2)+' rad off)');}
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
