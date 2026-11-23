// Provspel ö 5756 (Magnus 23 nov): när ingen säker spaningspunkt finns namnger raden en GETING som kunde spana och har Skicka GETING ändå,
// den närmaste först; och flaggan Kameran följer valet finns och är av som standard.
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const run=(n)=>{for(let i=0;i<n;i++)B.step(.05);};
let G;
function fresh(sd){B.newGame(sd);G=B.G;G.running=true;G.netAll=true;G.mines=[];G.known.fill(1);G.knownV++;B.LOS.on=false;G.krokAuto=false;G.units=[];G.enemies=[];return G;}
const put=(k,x,y)=>{const u=B.makeUnit(k,x,y);G.units.push(u);return u;};
ok(B.SELCAM&&B.SELCAM.on===false,'Kameran följer valet is off by default');

// an AA site everyone stays clear of: no safe spotting point, GETING named and offered first when nearest
fresh(5756);
{const e=B.makeEnemy({id:'L6',kind:'aa',x:1036,y:1636});G.enemies.push(e);e.seen=true;e.lx=e.x;e.ly=e.y;e.shown=false;e.visibleNow=false;
  const v=put('tank',1083,1452);const g=put('scout',1082,1412);const h=put('drone',1473,1538);
  G.log.length=0;B.requestSpot(v,e);
  const line=G.log.find(l=>/Ser inte luftvärn L6/.test(l.text));
  ok(!!line,'a line is said: '+(line&&line.text));
  const sent=G.units.find(x=>x.orders[0]&&x.orders[0].spotFor===e);
  if(sent)ok(true,'a spotter found a safe point ('+sent.name+'), nothing more to test on this ground');
  else{
    ok(new RegExp(g.name+' (utforskar vid|väntar)').test(line.text)&&/\d+ m bort/.test(line.text)&&!/för HÖK/.test(line.text),'the line names the GETING and how far');
    const acts=(line.acts||[]).map(a=>a.l);ok(acts[0]==='Skicka '+g.name+' ändå'&&acts.some(l=>l.startsWith('Skicka '+h.name)),'GETING first, HÖK too: '+acts.join(' | '));
    line.acts[0].f();ok(g.orders[0]&&g.orders[0].spotFor===e,'the button sends the GETING');}
}
if(fail){console.log(fail+' FAIL');process.exit(1);}console.log('alla ok');
