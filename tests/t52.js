global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;B.START.res=300;B.START.units=['drone','tank','tank','eng'];/* the old start, so results compare */
for(const seed of [7341,1234,9001,31,77]){B.newGame(seed);const G=B.G;G.running=true;const k=G.kroks[0];
 const st=[];let first=null;for(let i=0;i<20*60;i++){B.step(.05);if(!first&&k.target)first={t:Math.round(G.time),id:k.target.id};if(i%400===0)st.push(Math.round(G.time)+':'+k.status);}
 const vis=G.wrecks.filter(w=>B.G.known[Math.floor(w.y/10)*220+Math.floor(w.x/10)]).length;
 // order one visible but unscouted pile explicitly
 console.log(seed,'first pick',first?first.t+'s':'none','| known piles',vis,'|',st.join(' / '));}
