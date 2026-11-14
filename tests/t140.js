// Provspel ö 6795 (Magnus 14 nov). Issue 201: the captain's set-down where the vehicle's stance wants secured land and the point is not
// it is neither moved nor struck: KROK waits with the load and asks, with where the unscouted land lies and where it would set down
// instead; "Sätt ned här ändå" sets it down at the point without changing a stance, the other button at the secured place, and when
// the land is scouted meanwhile the order is carried out. Automation, with nobody to ask, keeps the old rules.
// Issue 203: a unit outside the command net is flagged for the chart, the card and the panel, and an order does not reach it.
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const setup=seed=>{B.newGame(seed);const G=B.G;G.running=true;G.netAll=true;for(const e of G.enemies)e.dead=true;for(let i=0;i<40;i++)B.step(.05);return G;};
const run=s=>{for(let i=0;i<s*20;i++)B.step(.05);};
const hook=(G,x,y,post)=>{const k=G.kroks[0],u=G.units.find(v=>v.kind==='eng');k.x=x+40;k.y=y;k.orders=[];k.cargo=u;u.carried=k.id;u.post=post;return{k,u};};
const island90=G=>{const L=G.relays[0];G.known.fill(0);for(let y=-90;y<=90;y+=5)for(let x=-90;x<=90;x+=5)if(x*x+y*y<90*90)G.known[B.cellIdx(L.x+x,L.y+y)]=1;G.knownV++;return L;};
// 1. nothing secured near the point: KROK waits there and asks; "Sätt ned här ändå" sets BÄVER down at the point, still on Defensiv
{const G=setup(1490),L=island90(G),{k,u}=hook(G,L.x,L.y,'def');B.krokOrder(k,{type:'drop',x:L.x,y:L.y});run(2);
  const W=k.waitDrop,m=G.log.find(l=>l.uid===k.id&&l.acts);
  ok(k.cargo===u&&!!W&&!!W.ask,'a BÄVER on Defensiv is not set down on unsecured land, and KROK holds a question');
  ok(!!W&&W.ask.can&&W.ask.why==='ok'&&!W.ask.alt&&!!W.ask.un&&W.ask.un.d>60&&W.ask.un.d<130,'the question knows the nearest unscouted land ('+(W&&W.ask.un?W.ask.un.d.toFixed(0)+' m':'none')+') and that no secured place is near');
  ok(!!m&&/Ingen säkrad landningsplats nära punkten i ruta/.test(m.text)&&/ospanat land \d+ m åt /.test(m.text)&&/tills du bestämmer/.test(m.text),'the log says where the unscouted land lies: '+(m&&m.text));
  ok(!!m&&m.acts.length===1&&m.acts[0].l==='Sätt ned här ändå','with one button, Sätt ned här ändå: '+(m&&m.acts.map(a=>a.l).join(', ')));
  run(8);ok(k.cargo===u&&k.waitDrop===W&&Math.hypot(k.x-L.x,k.y-L.y)<12,'it waits over the point with BÄVER on the hook ('+Math.hypot(k.x-L.x,k.y-L.y).toFixed(0)+' m)');
  if(m){m.acts[0].f();for(let i=0;i<40*20&&k.cargo;i++)B.step(.05);}
  ok(!k.cargo&&Math.hypot(u.x-L.x,u.y-L.y)<15&&u.post==='def'&&k.post!=='off','the button sets it down at the point, and no stance is changed ('+Math.hypot(u.x-L.x,u.y-L.y).toFixed(0)+' m off, '+u.post+')');
  ok(!k.waitDrop&&G.log.some(l=>/sätts ned på osäkrad mark/.test(l.text)),'the question is gone and the log says the ground was unsecured');}
// 2. automation has nobody to ask: no question, the old wait
{const G=setup(1490),L=island90(G),{k,u}=hook(G,L.x,L.y,'def');B.krokOrder(k,{type:'drop',x:L.x,y:L.y,cap:false});run(2);
  ok(k.cargo===u&&!!k.waitDrop&&!k.waitDrop.ask&&!G.log.some(l=>l.uid===k.id&&l.acts),'a set-down by automation waits as before, with no question and no button');}
// a point with one patch of unscouted land 200 m off: unsecured itself, with secured ground on the far side
const patchCase=()=>{const G=setup(1490),Wd=B.W;G.known.fill(1);G.knownV++;
  for(const L of G.relays)for(let a=0;a<8;a++){const px=L.x+Math.cos(a*Math.PI/4)*200,py=L.y+Math.sin(a*Math.PI/4)*200,cs=[];
    for(let y=-20;y<=20;y+=10)for(let x=-20;x<=20;x+=10){const c=B.cellIdx(px+x,py+y);if(Wd.zid[c]>=0)cs.push(c);}
    if(cs.length<20)continue;for(const c of cs)G.known[c]=0;G.knownV++;const ks=B.knownSafe(G.kroks[0],L.x,L.y,true,true);
    if(!B.isSecured(L.x,L.y)&&ks&&ks.moved)return{G,L,cs,px,py,a};for(const c of cs)G.known[c]=1;G.knownV++;}
  return null;};
// 3. a secured place near: the question names it, and its button sets BÄVER down there
{const P=patchCase();ok(!!P,'a point with unscouted land 200 m off and secured ground near is found on ö 1490');
  if(P){const{G,L}=P,{k,u}=hook(G,L.x,L.y,'def');B.krokOrder(k,{type:'drop',x:L.x,y:L.y});run(2);const W=k.waitDrop,m=G.log.find(l=>l.uid===k.id&&l.acts),A=W&&W.ask;
    ok(!!A&&!!A.alt&&!!A.un&&Math.abs(A.un.d-185)<40,'the question holds the unscouted land ('+(A&&A.un?A.un.d.toFixed(0)+' m':'none')+') and the secured place');
    const dirs=['öster','sydost','söder','sydväst','väster','nordväst','norr','nordost'];/* the patch lies at a*45 degrees with y growing southward */
    ok(!!m&&/Platsen i ruta \S+ är inte säkrad: ospanat land \d+ m åt /.test(m.text)&&m.text.includes(' åt '+dirs[P.a]+'.')&&/Närmaste säkrade plats ligger \d+ m bort, i ruta/.test(m.text),'the log names the direction ('+dirs[P.a]+') and the secured place: '+(m&&m.text));
    ok(!!m&&m.acts.length===2&&/^Sätt ned i \S+ \(säkrad\)$/.test(m.acts[1].l),'with two buttons: '+(m&&m.acts.map(a=>a.l).join(', ')));
    const T=B.askText(k,W);ok(/osäkrad mark/.test(T.title)&&/Närmaste säkrade plats/.test(T.body),'the banner asks the same: '+T.title+' '+T.body);
    if(m&&m.acts[1]){const alt={x:A.alt.x,y:A.alt.y};m.acts[1].f();for(let i=0;i<40*20&&k.cargo;i++)B.step(.05);
      ok(!k.cargo&&Math.hypot(u.x-alt.x,u.y-alt.y)<15&&B.isSecured(u.x,u.y)&&!k.waitDrop,'the second button sets it down at the secured place ('+Math.hypot(u.x-alt.x,u.y-alt.y).toFixed(0)+' m off)');
      ok(!G.log.some(l=>l.uid===k.id&&l.acts),'and the question has no button left in the log');}}}
// 4. the land is scouted while KROK waits: the order is carried out at the point
{const P=patchCase();if(P){const{G,L,cs}=P,{k,u}=hook(G,L.x,L.y,'def');B.krokOrder(k,{type:'drop',x:L.x,y:L.y});run(3);const W=k.waitDrop;
    ok(k.cargo===u&&!!W&&!!W.ask,'KROK waits with the question');for(const c of cs)G.known[c]=1;G.knownV++;for(let i=0;i<40*20&&k.cargo;i++)B.step(.05);
    ok(!k.cargo&&Math.hypot(u.x-L.x,u.y-L.y)<15&&G.log.some(l=>/är säkrad nu\. Sätter ned/.test(l.text)),'when the place is secured it sets BÄVER down at the point and says so ('+Math.hypot(u.x-L.x,u.y-L.y).toFixed(0)+' m off)');}}
// 4b. the vehicle is put on Offensiv while KROK waits: set down at the point, as before
{const G=setup(1490),L=island90(G),{k,u}=hook(G,L.x,L.y,'def');B.krokOrder(k,{type:'drop',x:L.x,y:L.y});run(3);ok(k.cargo===u&&!!k.waitDrop&&!!k.waitDrop.ask,'KROK waits with the question');
  u.post='off';for(let i=0;i<40*20&&k.cargo;i++)B.step(.05);
  ok(!k.cargo&&!k.waitDrop&&Math.hypot(u.x-L.x,u.y-L.y)<15&&G.log.some(l=>/står nu på Offensiv. Sätter ned/.test(l.text))&&!G.log.some(l=>l.acts),'put on Offensiv, BÄVER is set down at the point, and the question is gone ('+Math.hypot(u.x-L.x,u.y-L.y).toFixed(0)+' m off)');}
// 5. a unit outside the net: flagged, and no order reaches it
{const G=setup(1490);G.netAll=false;const C=B.CARRIER;let p=null;
  for(let r=600;r<1500&&!p;r+=50)for(let a=0;a<32&&!p;a++){const x=C.x+Math.cos(a/32*6.283)*r,y=C.y+Math.sin(a/32*6.283)*r;if(x>50&&y>50&&x<2150&&y<2150&&!B.inNet(x,y)&&B.W.zid[B.cellIdx(x,y)]>=0)p={x,y};}
  ok(!!p,'a point on the island outside the net is found');
  if(p){const v=B.makeUnit('tank',p.x,p.y);G.units.push(v);run(1.5);
    ok(v.offNet&&B.noNet(v),'a VARG outside the net is flagged');const o0=JSON.stringify(v.orders);
    ok(B.noContact([v]).length===0&&/Ingen radiokontakt med/.test(G.log[0].text),'noContact keeps it out of the order and says so');
    G.selIds=[v.id];G.sel=v.id;B.groupOrder({world:{x:p.x+60,y:p.y}});ok(JSON.stringify(v.orders)===o0&&!v.orders.some(o=>o.type==='move'&&Math.abs(o.x-p.x-60)<1),'a move order from the chart does not reach it');
    G.netAll=true;run(1.5);ok(!v.offNet&&!B.noNet(v),'inside the net again the flag is gone');
    const o1=JSON.stringify(v.orders);G.selIds=[v.id];G.sel=v.id;B.groupOrder({world:{x:v.x+60,y:v.y}});ok(JSON.stringify(v.orders)!==o1&&v.orders.length>0,'and the same order reaches it ('+(v.orders[0]&&v.orders[0].type)+')');}}
console.log(fail?fail+' failed':'all passed');process.exit(fail?1:0);
