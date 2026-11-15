// Magnus 15 nov. A HÖK shot down in the air blows up where she is hit, and the wreck falls on from there with most of the speed she
// had: it lies at the point of impact from the start, with the fall as data on it (w.fall, drawn by wreckFall), and the blast and the
// fire where it strikes come when it is down; at sea there is neither. A HÖK that is not flying leaves her wreck where she stood.
// And a mine costs twice what it did: a VARG 110 of 150, a BÄVER its life.
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const setup=seed=>{B.newGame(seed);const G=B.G;G.running=true;G.netAll=true;for(const e of G.enemies)e.dead=true;G.mines=[];for(let i=0;i<40;i++)B.step(.05);return G;};
const run=s=>{for(let i=0;i<s*20;i++)B.step(.05);};
const fly=(G,x,y)=>{const h=B.makeUnit('drone',x,y);G.units.push(h);B.giveOrder(h,{type:'move',x:x+400,y,post:'def'});run(4);return h;};
const kill=(G,h)=>{const n=G.wrecks.length,f0=G.fires.length,x=h.x,y=h.y,t=G.time;G.fx.length=0;B.killUnit(h,'Nedskjuten (prov).');return{n,f0,x,y,t,w:G.wrecks[G.wrecks.length-1]};};
// 1. over land: the wreck ahead of her with the fall on it, the blast in the air now, the blast and the fire on the ground after the fall
{const G=setup(6795),L=G.relays[0],h=fly(G,L.x-90,L.y),sp=Math.hypot(h.vx||0,h.vy||0),K=kill(G,h),w=K.w,F=w&&w.fall;
  ok(h.dead&&G.wrecks.length===K.n+1&&w.kind==='drone'&&w.own&&w.value===60,'a HÖK shot down leaves a wreck worth half of her ('+(w&&w.value)+')');
  ok(!!F&&F.T>.5&&F.T<6&&F.h>10&&h.fell===1,'the wreck carries a fall from her height ('+(F?F.h.toFixed(0)+' m, '+F.T.toFixed(2)+' s':'none')+')');
  if(F){const v=Math.hypot(F.vx,F.vy),d=Math.hypot(w.x-K.x,w.y-K.y);
    ok(sp>15&&Math.abs(v-sp*.7)<.5,'it keeps 70 % of her speed ('+sp.toFixed(1)+' m/s gives '+v.toFixed(1)+')');
    ok(Math.abs(d-v*F.T)<1&&d>12&&w.x>K.x,'and lies where the fall ends, ahead of where she was hit ('+d.toFixed(0)+' m)');
    ok(Math.abs(F.h-.5*13*F.T*F.T-Math.max(0,B.heightAt(w.x,w.y)))<3,'the fall ends at the ground');
    ok(Math.abs(w.t0-(K.t+F.T))<.01,'the wreck glows from when it is down');
    const air=G.fx.filter(f=>f.k==='boom'&&f.air),gr=G.fx.filter(f=>f.k==='boom'&&!f.air);
    ok(air.length===1&&air[0].t===0&&air[0].h===F.h&&air[0].x===K.x,'she blows up in the air where she is hit');
    ok(B.heightAt(w.x,w.y)>0,'the wreck lies on land here');
    ok(gr.length===1&&gr[0].small&&Math.abs(gr[0].t+F.T)<1e-9&&gr[0].x===w.x&&gr[0].y===w.y,'the blast where it strikes waits for the fall');
    const fi=G.fires[G.fires.length-1];ok(G.fires.length===K.f0+1&&fi.x===w.x&&Math.abs(fi.t0-(K.t+F.T))<.01,'and so does the fire there');
    run(F.T+.3);ok(gr[0].t>0&&gr[0].t<.9&&G.fx.includes(gr[0])&&G.fires.includes(fi),'after the fall both are there');
    ok(G.wrecks.includes(w)&&!w.claimed,'and the wreck is there to salvage');}}
// 2. over the sea: the same fall, and no blast and no fire where it strikes
{const G=setup(6795);let P=null;for(let y=200;y<2000&&!P;y+=50)for(let x=200;x<1700&&!P;x+=50){let o=true;for(let d=0;d<=300;d+=25)if(B.heightAt(x+d,y)>-1)o=false;if(o)P={x,y};}
  ok(!!P,'300 m of open water is found');
  if(P){const h=fly(G,P.x,P.y),K=kill(G,h),w=K.w,F=w.fall;
    ok(!!F&&w.x>K.x+12&&B.heightAt(w.x,w.y)<0,'over the sea the wreck falls ahead of her into the water');
    ok(G.fx.filter(f=>f.k==='boom').length===1&&G.fx[0].air&&G.fires.length===K.f0,'with the blast in the air only, and no fire');}}
// 3. not flying: no fall, the wreck where she stood
{const G=setup(6795),L=G.relays[0],h=B.makeUnit('drone',L.x-90,L.y);G.units.push(h);h.landed=true;const K=kill(G,h),w=K.w;
  ok(!w.fall&&w.x===K.x&&w.y===K.y&&!h.fell&&G.fx.filter(f=>f.k==='boom').length===1&&!G.fx[0].air&&Math.abs(w.t0-K.t)<1e-9,'a HÖK on the ground leaves her wreck where she stood, with no fall');}
// 4. the mines: twice the damage (110 for VARG, 90 for the soft ones; 55 and 45 before)
{const G=setup(6795),L=G.relays[0],mine=()=>{const m={id:'mt'+G.mines.length,x:L.x,y:L.y,r:12,cells:[],walled:[],found:false,cleared:false,prog:0};G.mines.push(m);return m;};
  const v=B.makeUnit('tank',L.x+3,L.y);G.units.push(v);const m=mine();run(.5);
  ok(m.found&&!v.dead&&v.maxhp===150&&v.hp===40,'a mine costs a VARG 110 of 150 ('+v.hp+' left)');
  ok(G.log.some(l=>/^Mina! 27 % skrov kvar/.test(l.text)),'and she says how much is left');
  const b=B.makeUnit('eng',L.x+200,L.y);G.units.push(b);const m2=mine();m2.x=b.x;m2.y=b.y;b.x+=3;
  /* a BÄVER finds a field within 20 m at the scan four times a second; this one is laid under it between two scans */
  G.mineT=.2;run(.05);ok(m2.found&&b.dead&&b.maxhp<90,'and a BÄVER its life (90 against a hull of '+b.maxhp+')');}
console.log(fail?fail+' failed':'all passed');process.exit(fail?1:0);
