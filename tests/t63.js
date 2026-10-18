// island shapes: every shape builds a valid island whose points can be reached over land from the beach once the barriers are
// open, with Birka in open water and the island inside the map
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;B.START.res=300;B.START.units=['drone','tank','tank','eng'];let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const GW=220,DEEP=0,SHAL=1,BEACH=2,LAND=3,ROCK=4;
const seeds=[1000,1037,1074,1111];
for(const f of Object.keys(B.SHAPES)){
  B.SHAPE_CFG.force=f;let valid=0,reach=0,ship=0,inside=0,forms=0,ms=0,zones=0;
  for(const seed of seeds){const t0=Date.now();B.newGame(seed);ms+=Date.now()-t0;const G=B.G,W=B.W;
    if(W.valid)valid++;if(W.V.shape.type===f)forms++;zones+=W.V.zones.length;
    // land-only flood from the landing with the barriers open (BÄVER cannot cross water)
    const g=W.baseGrid,rc=p=>Math.floor(p.y/10)*GW+Math.floor(p.x/10),r=new Uint8Array(g.length),s0=rc(W.landing),st=[s0];r[s0]=1;
    while(st.length){const c=st.pop(),x=c%GW,y=(c/GW)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=GW||ny>=GW)continue;const n=ny*GW+nx;if(r[n])continue;const t=g[n];if(t!==LAND&&t!==BEACH)continue;r[n]=1;st.push(n);}}
    if(G.relays.every(p=>r[rc(p)]))reach++;
    const cs=rc(B.CARRIER);if((g[cs]===DEEP||g[cs]===SHAL)&&B.CARRIER.x>=140&&B.CARRIER.y>=140&&B.CARRIER.x<=2060&&B.CARRIER.y<=2060)ship++;
    let edge=false;for(let i=0;i<g.length;i++){const x=i%GW,y=(i/GW)|0;if((x<12||y<12||x>=GW-12||y>=GW-12)&&(g[i]===LAND||g[i]===BEACH)&&!W.isletMask[i]){edge=true;break;}}if(!edge)inside++;}
  const n=seeds.length;
  ok(forms===n,f+': the forced shape is used ('+forms+'/'+n+')');
  ok(valid===n,f+': valid islands '+valid+'/'+n);
  ok(reach===n,f+': all points reachable over land from the beach '+reach+'/'+n);
  ok(ship===n,f+': Birka in open water inside the map '+ship+'/'+n);
  ok(inside===n,f+': island clear of the map edge '+inside+'/'+n);
  ok(zones/n>=8,f+': on average '+(zones/n).toFixed(1)+' zones');
  console.log('     '+f+' builds in '+Math.round(ms/n)+' ms on average');
}
// the mix picks every shape over a spread of seeds, and the round island is the old one
B.SHAPE_CFG.force=null;const seen={};for(let s=2000;s<2020;s++){B.newGame(s);seen[B.W.V.shape.type]=1;}
ok(Object.keys(B.SHAPES).every(k=>seen[k]),'the mix gives every shape over 20 islands ('+Object.keys(seen).join(', ')+')');
/* since 19 okt (issue 57) R1 there keeps 300 m from the harbour and stands in its yard, so R1 moved from 1175,1405; R2 and R3 are as before */
B.SHAPE_CFG.force='rund';B.SHAPE_CFG.rough=0;B.newGame(7341);{const R=B.G.relays.map(r=>Math.round(r.x)+','+Math.round(r.y)).join(' ');ok(R==='1140,1440 1115,945 955,815','round island 7341 is the same as before the shapes, R1 moved by the harbour rule ('+R+')');}
console.log(fail?'FAILED '+fail:'all passed');if(fail)process.exit(1);
