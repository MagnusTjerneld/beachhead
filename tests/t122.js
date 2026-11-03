// Issue 138 (Magnus 3 nov, provspel ö 2547 kp03): a VARG takes the road when it is the faster way. The road costs 1/ROAD_V a metre in the search
// (as fast as the move code drives on it) and the straightening of the search's way keeps a bend of road that the chord across the ground does
// not beat in cost; before, the chord was taken whenever it was passable.
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const fs=require('fs'),h=fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8');
ok(/const ROAD_V=1\.4;/.test(h)&&(h.match(/sp\*=ROAD_V/g)||[]).length===2&&/1\/ROAD_V;/.test(h),'speed on road and cost of road share ROAD_V');
B.newGame(1264);const G=B.G,W=B.WORLD,GW=B.GW;G.known.fill(1);G.knownV++;G.enemies=[];
const CELL=10,LAND=3;
const flat=()=>{for(let gy=20;gy<80;gy++)for(let gx=20;gx<90;gx++){const i=gy*GW+gx;W.grid[i]=LAND;if(W.baseGrid)W.baseGrid[i]=LAND;W.road[i]=0;}};
const road=pts=>{for(let k=0;k<pts.length-1;k++){const a=pts[k],b=pts[k+1],n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/3);for(let j=0;j<=n;j++){const x=a.x+(b.x-a.x)*j/n,y=a.y+(b.y-a.y)*j/n;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)W.road[B.cellIdx(x+dx*CELL,y+dy*CELL)]=1;}}};
// time along a polyline at the move code's rule: road x ROAD_V, sampled each 2 m
const SPD=11;
function time(s,pts){let t=0,x=s.x,y=s.y;for(const p of pts){const L=Math.hypot(p.x-x,p.y-y),n=Math.max(1,Math.ceil(L/2));for(let k=0;k<n;k++){const c=B.cellIdx(x+(p.x-x)*(k+.5)/n,y+(p.y-y)*(k+.5)/n);t+=(L/n)/(SPD*(W.road[c]?1.4:1));}x=p.x;y=p.y;}return t;}
const len=(s,pts)=>{let d=0,x=s.x,y=s.y;for(const p of pts){d+=Math.hypot(p.x-x,p.y-y);x=p.x;y=p.y;}return d;};
const S={x:236,y:350},T={x:664,y:350};
const way=()=>B.astar(S.x,S.y,T.x,T.y,B.passTank,B.costFor('def',null,6));
// cost per metre follows 1/speed
flat();road([{x:300,y:350},{x:400,y:350}]);{const c=B.costFor('def',null,6);ok(Math.abs(c(B.cellIdx(350,350))*1.4-1)<1e-6&&c(B.cellIdx(500,550))===1,'a road cell costs 1/1.4 of a land cell');}
// 1: a road that bows 120 m off the straight line (the ends of the trip stand a little off the road, as a wing at its pad does): 431 m at 1.4 is 308 against the 428 m chord
flat();road([{x:250,y:350},{x:450,y:470},{x:650,y:350}]);
{const p=way(),tr=time(S,p),tc=time(S,[T]);ok(tr<tc-3,'the road is faster ('+tr.toFixed(1)+' s against '+tc.toFixed(1)+' s straight)');
 ok(p.some(q=>Math.abs(q.y-350)>60),'the way follows the road ('+p.length+' points, '+Math.round(len(S,p))+' m)');
 ok(tr<=tc,'travel time on the chosen way is not longer than the straight one');}
// 2: a road that bows 250 m off: 2*sqrt(200^2+250^2) = 640 m at 1.4 is 457 against 400, so the ground is faster
flat();road([{x:250,y:350},{x:450,y:600},{x:650,y:350}]);
{const p=way(),tr=time(S,p),tc=time(S,[T]);ok(p.length<=2&&Math.abs(len(S,p)-len(S,[T]))<20,'the ground is faster: the way is the chord ('+p.length+' points, '+Math.round(len(S,p))+' m)');
 ok(tr<=tc+.5,'travel time on the chosen way is not longer than the road ('+tr.toFixed(1)+' s)');}
// 3: a right-angle road (400 m at 1.4 is about as fast as the 283 m chord); whichever is taken, it is no slower than the chord
flat();road([{x:250,y:350},{x:250,y:550},{x:450,y:550}]);
{const A={x:250,y:350},Bp={x:450,y:550};const p=B.astar(A.x,A.y,Bp.x,Bp.y,B.passTank,B.costFor('def',null,6)),tr=time(A,p),tc=time(A,[Bp]);ok(tr<=tc+.5,'the right-angle road: not slower than the chord ('+tr.toFixed(1)+' against '+tc.toFixed(1)+' s)');}
// 4: the island's own roads: the way of a VARG is never slower than its straight line where the line is passable
B.newGame(2547);{const G2=B.G,W2=B.WORLD;G2.known.fill(1);G2.knownV++;let n=0,slower=0,gain=0;const R=((s)=>()=>(s=(s*1103515245+12345)&0x7fffffff)/0x7fffffff)(7);
  const cf=B.costFor('def',null,6);
  for(let k=0;k<400&&n<60;k++){const a={x:200+R()*1500,y:200+R()*1500},b={x:a.x+(R()-.5)*600,y:a.y+(R()-.5)*600};const ia=B.cellIdx(a.x,a.y),ib=B.cellIdx(b.x,b.y);if(!B.passTank(ia)||!B.passTank(ib))continue;
    const p=B.astar(a.x,a.y,b.x,b.y,B.passTank,cf);if(!p||!B.lineOK(a,b,B.passTank))continue;n++;
    const tt=(pts)=>{let t=0,x=a.x,y=a.y;for(const q of pts){const L=Math.hypot(q.x-x,q.y-y),m=Math.max(1,Math.ceil(L/2));for(let j=0;j<m;j++){const c=B.cellIdx(x+(q.x-x)*(j+.5)/m,y+(q.y-y)*(j+.5)/m);t+=(L/m)/(SPD*(W2.road[c]?1.4:1));}x=q.x;y=q.y;}return t;};
    const d=tt(p)-tt([b]);if(d>1.5)slower++;if(d<-1.5)gain++;}
  ok(n>=20&&slower===0,'on island 2547 no sampled way is slower than its straight line ('+n+' pairs, '+gain+' faster, '+slower+' slower)');}
console.log(fail?'\n'+fail+' FEL':'\nalla ok');process.exit(fail?1:0);
