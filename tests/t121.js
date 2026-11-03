// Provspel ö 2169 (Magnus 3 nov), issue 150 and 151: the light patrol P1 that Birka's air had left with a 6 m stub of road now gets a patrol
// outside her reach and walks it, and a fire on snow throws less light than a fire on bare ground
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
// 150: Kråkö as in the recording (doctrine fastning, 22 feb, night, mission halshugg)
B.newGame(2169,'fastning',{doy:53,tod:1.5,uppdrag:'halshugg'});
{const G=B.G,p=G.enemies.find(e=>e.id==='P1'),C=B.CARRIER;G.running=true;G.units=[];
  ok(!!p&&!!p.route,'P1 has a patrol route');
  let L=0;for(let i=1;i<p.route.length;i++)L+=Math.hypot(p.route[i].x-p.route[i-1].x,p.route[i].y-p.route[i-1].y);
  ok(L>=B.BIRKA_PATROL.min,'the patrol is not a stub (' +L.toFixed(0)+' m)');
  ok(p.route.every(q=>!B.inBirka(p,q.x,q.y)),'and it lies outside Birka\'s air');
  let cum=0,px=p.x,py=p.y;for(let i=0;i<1200;i++){B.step(.05);if(i%10===0){cum+=Math.hypot(p.x-px,p.y-py);px=p.x;py=p.y;}}
  ok(cum>150,'P1 walks it: '+cum.toFixed(0)+' m in 60 s');
  ok(!B.inBirka(p,p.x,p.y),'and stays outside Birka\'s air');}
// 151: snow lowers a fire's light and reach, bare ground leaves it as it was
{const a=B.snowFireK(0),b=B.snowFireK(1),m=B.snowFireK(.5);
  ok(a[0]===1&&a[1]===1,'no snow: the fire as before');
  ok(b[0]<a[0]*.7&&b[1]<a[1],'full snow: less light ('+b[0].toFixed(2)+') and shorter reach ('+b[1].toFixed(2)+')');
  ok(m[0]>b[0]&&m[0]<a[0],'half snow lies between');}
process.exit(fail?1:0);
