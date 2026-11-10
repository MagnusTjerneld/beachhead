// Provspel ö 3842 kp02 (10 nov): GÄDDA out of the net chose the nearest water in the net as the crow flies, a lagoon cut off from the sea,
// and lay still a minute. gaddaNetPt now searches over the water from where the boat lies, so its way back is water it can reach.
global.performance={now:()=>Date.now()};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
B.newGame(3842);const G=B.G,W=B.W,GW=220,GH=220;G.running=true;
/* the open sea: the water reached from the map's corner */
const open=new Uint8Array(GW*GH),qu=[0];open[0]=1;for(let h=0;h<qu.length;h++){const c=qu[h],cx=c%GW,cy=(c/GW)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;const n=ny*GW+nx;if(!open[n]&&B.seaPass(n)){open[n]=1;qu.push(n);}}}
let shut=0;for(let i=0;i<GW*GH;i++)if(B.seaPass(i)&&!open[i])shut++;
ok(shut>0,'ö 3842 has water cut off from the sea ('+shut+' cells)');
/* the boat where it lay in the recording, east of the island at I6, and points all round the island */
const spots=[{x:1796,y:1141}];for(let a=0;a<6.28;a+=.4){for(let r=1050;r>300;r-=10){const x=1100+Math.cos(a)*r,y=1100+Math.sin(a)*r,c=B.cellIdx(x,y);if(B.seaPass(c)&&open[c]){spots.push({x,y});break;}}}
let bad=0,none=0;for(const p of spots){const u=B.makeUnit('gadda',p.x,p.y),q=B.gaddaNetPt(u);if(!q){none++;continue;}if(!open[B.cellIdx(q.x,q.y)])bad++;}
ok(bad===0,'every way back lies in water it reaches ('+spots.length+' places, '+bad+' in shut water)');
ok(none<spots.length,'it finds a way back ('+(spots.length-none)+' of '+spots.length+')');
{const u=B.makeUnit('gadda',1796,1141),q=B.gaddaNetPt(u);ok(!!q&&B.inNet(q.x,q.y),'from I6 a point in the net: '+(q?Math.round(q.x)+','+Math.round(q.y):'none'));}
/* the net as in the recording: Birka in the harbour, R1 and H taken; then the shut lagoon at I7 is in the net and the boat at I6 is not.
   The old rule (the nearest water in the net as the crow flies) chose 1745,1225 in the lagoon */
for(const id of['R1','H'])G.relays.find(r=>r.id===id).captured=true;B.CARRIER.x=1093.3;B.CARRIER.y=1717.3;
ok(B.inNet(1720,1225)&&!B.inNet(1796,1141),'as in the recording: the lagoon in the net, the boat out of it');
ok(!open[B.cellIdx(1745,1225)],'1745,1225 (where it went in the recording) is shut water');
{const u=B.makeUnit('gadda',1796,1141),q=B.gaddaNetPt(u);ok(!!q&&open[B.cellIdx(q.x,q.y)]&&B.inNet(q.x,q.y),'its way back is open water in the net: '+(q?Math.round(q.x)+','+Math.round(q.y):'none'));}
console.log(fail?fail+' FAILED':'all ok');process.exit(fail?1:0);
