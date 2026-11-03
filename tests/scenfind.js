// Finds a fixed seed for a scenario's island (issue 129): the first island from a start seed on that holds the scenario's places
// (scenSites) and a way in for the tanker (scenTankerPlan). node tests/scenfind.js [startSeed] [tries]
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;
const s0=+process.argv[2]||3100,n=+process.argv[3]||60,SC=B.SCEN.stroemmen;
B.ENEMY_CFG.budget=SC.budget;
let found=0;
for(let seed=s0;seed<s0+n;seed++){
  const t=Date.now();let why='';
  try{
    B.buildWorld(seed,SC.doc);const W=B.W;
    if(!W||!W.harbor||!W.birkaPath)why='no harbour';
    else{W._sites=undefined;W._tf=undefined;const s=B.scenSites();if(!s)why='no sites: '+W._sitesWhy;else{const p=B.scenTankerPlan();if(!p)why='no tanker way';else{
      const hq=W.harborQ,L=W.birkaPath.L;console.log('FOUND',seed,'quay L',Math.round(L),'cist',Math.round(Math.hypot(s.cist.x-hq.x,s.cist.y-hq.y)),'tf from',Math.round(Math.hypot(p.from.x-hq.x,p.from.y-hq.y)),'route',p.route.length);found++;}}}
  }catch(e){why='error '+e.message;}
  if(why)console.log(seed,why,Date.now()-t,'ms');
  if(found>=3)break;
}
