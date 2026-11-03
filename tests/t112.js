// Provspel ö 2547 (Magnus 3 nov): KROK gets off its pad while Birka is under way (issue 130), a badly hit VARG gets its order to BÄVER once
// and BÄVER does not chase a unit bound for Birka (issue 131), a mast outside the net is refused at the order (issue 132), Auto never draws
// the fortress for Bärgningen or Nedskjuten besättning (issue 133), and the flight pads work on under way (issue 134)
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const run=(n,f)=>{for(let i=0;i<n;i++){B.step(.05);if(f&&f())return i;}return n;};
let G;
function fresh(){B.newGame(7341);G=B.G;G.running=true;G.netAll=true;G.mines=[];G.enemies=[];G.units=[];G.known.fill(1);G.knownV++;B.LOS.on=false;G.krokAuto=false;}
const put=(k,x,y)=>{const u=B.makeUnit(k,x,y);G.units.push(u);return u;};
function landAt(r0){const L=B.LANDING;for(let r=r0;r<r0+600;r+=20)for(let a=0;a<6.28;a+=.15){const x=L.x+Math.cos(a)*r,y=L.y+Math.sin(a)*r;let all=true;
  for(let dy=-60;dy<=60&&all;dy+=10)for(let dx=-60;dx<=60&&all;dx+=10)if(!B.passLand(B.cellIdx(x+dx,y+dy)))all=false;
  if(all)return{x,y};}return null;}
// 130: a KROK leaving its pad as the ship moves gets away from it; one standing on it still rides along
fresh();{const k=G.kroks[0],C=B.CARRIER,x0=C.x,y0=C.y,a0=C.a;k.x=k.pad.x;k.y=k.pad.y;
  const kp=G.kroks[1]||null;const tx=k.pad.x-400,ty=k.pad.y-300;let far=0;
  for(let i=0;i<200;i++){B.moveCarrier(x0+Math.cos(a0)*(i+1)*.5,y0+Math.sin(a0)*(i+1)*.5,a0);const a=Math.atan2(ty-k.y,tx-k.x);k.x+=Math.cos(a)*.9;k.y+=Math.sin(a)*.9;far=Math.hypot(k.x-k.pad.x,k.y-k.pad.y);}
  ok(far>100,'a KROK flying off as Birka goes gets away from the pad ('+Math.round(far)+' m)');
  const k2=B.makeKrok();G.kroks.push(k2);k2.x=k2.pad.x;k2.y=k2.pad.y;const c0=B.CARRIER.x;B.moveCarrier(c0+5,B.CARRIER.y,B.CARRIER.a);
  ok(Math.hypot(k2.x-k2.pad.x,k2.y-k2.pad.y)<.01,'one standing on its pad rides along with it');B.moveCarrier(x0,y0,a0);}
// 131: the order to BÄVER is given once, and BÄVER does not pick a VARG on its way to Birka
fresh();{const P=landAt(200);const b=put('eng',P.x,P.y),v=put('tank',P.x+120,P.y);G.time=50;B.giveOrder(v,{type:'move',x:P.x+300,y:P.y,post:'def'},false);run(2);v.hp=v.maxhp*.2;v.lastHit=-99;
  run(40,()=>v.orders[0]&&v.orders[0].toRep);const o=v.orders[0];ok(o&&o.toRep===b.id,'a VARG at 20 % on the move turns to BÄVER');run(2);const p0=v.path;run(10);
  ok(v.orders[0]===o&&v.path===p0,'and keeps the same order and way, not a new one every frame');
  v.orders=[];v.rtb=true;v.orders=[{type:'rtb',post:'def'}];ok(B.repairCand(b,150)===null,'BÄVER does not pick a VARG bound for Birka');
  v.rtb=false;v.orders=[];ok(B.repairCand(b,150)===v,'it picks one standing still');}
// 132: a mast outside the net is refused when the order is given
fresh();{G.netAll=false;G.masts=[];const P=landAt(200);const st=G.structs.find(s=>s.kind==='mast'&&!B.inNet(s.x,s.y));
  if(st){const b=put('eng',P.x,P.y);B.giveOrder(b,{type:'mast',s:st,post:'def'},false);ok(!b.orders.some(o=>o.type==='mast'),'a mast outside the net ('+st.id+') is refused at the order');
    ok(G.log.some(l=>/utanför ledningsnätet och kan inte kopplas in/.test(l.text)),'with the reason');}
  else ok(false,'a mast outside the net on ö 7341');}
// 133: Auto never draws the fortress in Bärgningen or Nedskjuten besättning, but still can in Frita ön
{B.newGame(7341);const W=B.W;const n={barg:0,crew:0,frita:0};for(let i=0;i<400;i++)for(const m in n)if(B.drawDoctrine(W,B.MISSION[m].docW)==='fastning')n[m]++;
  ok(n.barg===0&&n.crew===0,'no fortress in Bärgningen or Nedskjuten besättning (of 400 draws: '+n.barg+', '+n.crew+')');ok(n.frita>0,'it is still drawn in Frita ön ('+n.frita+' of 400)');}
// 134: a HÖK on Birka's pad is charged and mended under way; a VARG on her pad is not
fresh();{const h=put('drone',B.CARRIER.x,B.CARRIER.y);h.hp=h.maxhp*.5;h.fuel=h.maxFuel*.3;B.giveOrder(h,{type:'rtb',post:'def'},false);
  run(1200,()=>h.onPad&&h.pad&&h.pad.key==='ship');const ready=h.onPad;G.beach=G.beach||{};const hb=G.harbor;
  if(hb){hb.secured=true;hb.docked=false;hb.wait=false;}ok(ready&&B.birkaMoving(),'a HÖK down on the ship\'s pad, Birka under way');
  const f0=h.fuel,h0=h.hp;run(100);ok(h.fuel>f0||h.hp>h0,'it is charged or mended under way');}
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
