// Guard teams of air defence follow the same sight rules as other troops (issue 97, Magnus 30 okt): the 40 m from the air applies
// only to infantry and anti-tank teams among buildings, not to a team that merely guards a site (its .cover is the site's id)
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;B.START.res=500;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
let n=0,bad=0,badR=0,hid=0;
for(const s of [1234,7341,4242,9001,2718,5555]){B.newGame(s);const G=B.G;const h={vision:120};
  for(const e of G.enemies){if(e.kind!=='at'||!e.cover)continue;n++;e.lx=e.x;e.ly=e.y;
    const id=e.cover,w=B.hides(e);e.cover=null;const w0=B.hides(e);e.cover=id;/* same answer with and without the site id */
    if(w!==w0)bad++;if(!w&&B.airSeeR(h,e)<h.vision)badR++;if(w)hid++;}}
ok(n>0,'guard teams exist ('+n+')');
ok(bad===0,'a guard team is hidden from the air only when it stands among buildings ('+hid+' of '+n+' do)');
ok(badR===0,'an aircraft sees a guard team in the open at its full vision');
{B.newGame(1234);const G=B.G;const e=G.enemies.find(x=>x.kind==='at'&&x.cover);const h={vision:120};e.lx=e.x;e.ly=e.y;
 const was=B.hides(e);e.inCover=true;ok(B.hides(e)&&B.airSeeR(h,e)===40,'troops placed in cover by hand still show only within 40 m');
 e.inCover=false;ok(B.hides(e)===was,'and the cover id of a guard alone does not hide it');}
console.log(fail?'FAILED':'all ok');process.exit(fail?1:0);
