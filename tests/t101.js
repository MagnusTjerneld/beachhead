// A coordinated attack for every unit that got the order together (issue 104, Magnus 30 okt): VARG and HÖK given one attack order
// share a stamp (grp) and go in together; the HÖK holds outside the target's reach and waits for the VARG however long it takes (Magnus 30 okt; 20 s at the longest only without VARG); a
// unit sent at the same target later is not in the group and is not waited for
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
B.newGame(7341);const W=B.W,c=W.grid,land=(x,y)=>{const v=c[Math.floor(y/10)*220+Math.floor(x/10)];return v>=2&&B.elevAt(x,y,W.seed,W.V)>1.5;};
function arena(){for(let r=0;r<=700;r+=30)for(let b=0;b<6.28;b+=.3){const D={x:1100+Math.cos(b)*r,y:1100+Math.sin(b)*r};
  const a=Math.atan2(D.y-B.CARRIER.y,D.x-B.CARRIER.x),f={x:Math.cos(a),y:Math.sin(a)},n={x:-f.y,y:f.x};let k=true;
  for(let s=-460;s<=140&&k;s+=20)for(let l=-130;l<=130&&k;l+=26)if(!land(D.x+f.x*s+n.x*l,D.y+f.y*s+n.y*l))k=false;if(k)return{D,f,n};}
  console.log('FAIL no open ground');process.exit(1);}
function run(){Math.random=(s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;})(77);
  B.newGame(7341);const G=B.G;G.running=true;G.netAll=true;G.mines=[];
  for(const b of G.barriers)if(!b.cleared){b.cleared=true;for(const q of b.cells)W.grid[q]=W.baseGrid[q];}
  const{D,f,n}=arena();for(let s=-480;s<=160;s+=5)for(let l=-150;l<=150;l+=5){const i=Math.floor((D.y+f.y*s+n.y*l)/10)*220+Math.floor((D.x+f.x*s+n.x*l)/10);if(W.grid[i]>=4)W.grid[i]=W.baseGrid[i]=3;}
  G.reachAll=null;B.computeLock();const at=(fw,la)=>({x:D.x+f.x*fw+n.x*la,y:D.y+f.y*fw+n.y*la});
  G.enemies=[['turret',0,0],['aa',90,0]].map(([kind,fw,la],i)=>{const p=at(fw,la),e=B.makeEnemy({id:'X'+(i+1),kind,x:p.x,y:p.y});e.aim=Math.atan2(-f.y,-f.x);e.seen=true;return e;});
  G.known.fill(1);G.knownV++;G.units=[];const own=[];
  for(let i=0;i<2;i++){const p=at(-420,(i-.5)*26),u=B.makeUnit('tank',p.x,p.y);u.heading=u.turret=Math.atan2(f.y,f.x);G.units.push(u);own.push(u);}
  {const p=at(-450,0),u=B.makeUnit('drone',p.x,p.y);u.post='off';u.heading=Math.atan2(f.y,f.x);G.units.push(u);own.push(u);}
  G.wings={'1':own.map(u=>u.id)};G.selIds=own.map(u=>u.id);G.sel=own[0].id;
  B.groupOrder({enemy:G.enemies[0]},false);return{G,own,e:G.enemies[0]};}
{const{G,own,e}=run();const[v1,v2,h]=own;
  ok(v1.orders[0].grp!=null&&v1.orders[0].grp===v2.orders[0].grp&&h.orders[0]&&h.orders[0].grp===v1.orders[0].grp,'VARG and HÖK got the same group stamp');
  ok(B.groupAll(e,v1.orders[0].grp).length===3,'the group is the three of them');
  let hold0=null,holdEnd=null,goT=null,minD=1e9;
  for(let t=0;t<200;t+=.05){B.step(.05);const o=h.orders[0];
    if(o&&o.holdT0!=null&&hold0==null)hold0=G.time;
    if(goT==null&&v1.orders[0]&&v1.orders[0].go)goT=G.time;
    if(hold0!=null&&holdEnd==null&&o&&/^(Anfaller|Bekämpar)/.test(h.state))holdEnd=G.time;
    if(holdEnd==null)minD=Math.min(minD,Math.hypot(h.x-e.lx,h.y-e.ly));
    if(process.env.T99&&Math.abs(t%2)<.025)console.log(t.toFixed(0),Math.round(Math.hypot(h.x-e.lx,h.y-e.ly)),h.state,o&&o.holdT0,o&&o.holdDone,'V',Math.round(Math.hypot(v1.x-e.lx,v1.y-e.ly)),v1.state.slice(0,45),v1.orders[0]&&v1.orders[0].go);
    if(e.dead||goT!=null&&holdEnd!=null&&G.time-Math.max(goT,holdEnd)>5)break;}
  ok(hold0!=null,'the HÖK reached its holding point');
  const w=holdEnd!=null&&hold0!=null?holdEnd-hold0:null;
  ok(goT!=null,'the VARG went in');
  const d=goT!=null&&holdEnd!=null?holdEnd-goT:null;
  ok(d!=null&&Math.abs(d)<=1.5,'the HÖK went in with the VARG ('+(d!=null?d.toFixed(1):'-')+' s after, waited '+(w!=null?w.toFixed(1):'-')+' s)');
  ok(minD>(e.range||0),'the HÖK stayed outside the target\'s reach while it waited ('+Math.round(minD)+' m)');}
{const{G,own,e}=run();const[v1]=own;
  /* a VARG sent later at the same target is support, not waited for */
  const g=B.newGrp(),late=B.makeUnit('tank',v1.x,v1.y);G.units.push(late);B.giveOrder(late,{type:'attack',enemy:e,post:'off',grp:g},false);
  ok(B.groupAll(e,v1.orders[0].grp).indexOf(late)<0,'a unit sent later is not in the group');}
{/* slow VARG: the HÖK waits for them past 20 s and goes in with them */
  const{G,own,e}=run();const[v1,v2,h]=own;v1.speed=v2.speed=6;let hold0=null,hit=null,vgo=null;
  for(let t=0;t<300&&hit==null;t+=.05){B.step(.05);const o=h.orders[0];if(o&&o.holdT0!=null&&hold0==null)hold0=G.time;if(vgo==null&&v1.orders[0]&&v1.orders[0].go)vgo=G.time;if(hold0!=null&&/^(Anfaller|Bekämpar)/.test(h.state))hit=G.time;}
  ok(hit!=null&&vgo!=null&&hit-hold0>22&&Math.abs(hit-vgo)<=1.5,'with slow VARG the HÖK waits past 20 s ('+(hit!=null?(hit-hold0).toFixed(1):'-')+' s) and goes in with them ('+(hit!=null&&vgo!=null?(hit-vgo).toFixed(1):'-')+' s after)');}
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
