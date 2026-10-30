// Sandbox: attack scenarios without taking a whole island (decided 14 okt). A wing of VARG and HÖK meets a fixed set of defenders on
// open ground inside the landing zone, with the surroundings known (as after a SPARV sweep), and the game runs until the defenders are
// gone, the wing is out (dead or pulling back) or time runs out. Each repetition has its own random seed, so two variants run with the
// same seeds meet the same dice where their play does not differ.
//
//   node tests/sandbox.js                       all scenarios, 10 repetitions each
//   node tests/sandbox.js bunker 30             one scenario, 30 repetitions
//   node tests/sandbox.js all 10 ENEMY.at.range=150 TYPES.tank.hp=180      with changed values
//   node tests/sandbox.js linje 1 --log         one game with the radio log, for watching group behaviour
//   node tests/sandbox.js bunker 10 --unseen    the defenders are not known beforehand, so the wing advances instead of pointing them out
//   node tests/sandbox.js pansar 30 --hok         a Defensiv HÖK in wings that have none
//   node tests/sandbox.js --list                the scenarios
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;B.SHAPE_CFG.force='rund';B.SHAPE_CFG.rough=0;
const DT=.05,TMAX=300,SEED=7341;
// defenders: [kind, forward, lateral, hull share at start] in metres from the defence centre, forward pointing away from the attackers;
// own.hp is the attackers' hull share at start
// plan: chain = attack the targets in this order (Shift), advance = move the wing onto the centre, point = move it to S.to metres
// from the centre, hold = stand and receive
const SC={
  bunker:{txt:'3 VARG och en offensiv HÖK mot en bunker med två pansarvärnslag',
    own:{tank:3,hok:['off']},def:[['turret',0,0],['at',-25,55],['at',-20,-60]],plan:'chain',order:[1,2,0]},
  pansar:{txt:'3 VARG mot två stridsvagnar',own:{tank:3},def:[['tank',0,-30],['tank',10,30]],plan:'chain',order:[0,1]},
  lv:{txt:'2 VARG och två offensiva HÖK mot luftvärn, bunker och infanteri; luftvärnet först',
    own:{tank:2,hok:['off','off']},def:[['aa',30,0],['turret',0,40],['inf',-20,-40]],plan:'chain',order:[0,1,2]},
  linje:{txt:'4 VARG och två HÖK (en offensiv, en defensiv) mot en försvarslinje',
    own:{tank:4,hok:['off','def']},def:[['turret',0,-60],['turret',0,60],['at',-30,0],['at',-25,110],['tank',60,0],['aa',90,30]],plan:'chain',order:[2,0,3,1,4,5]},
  stormning:{txt:'4 VARG rakt fram mot bunker, pansarvärn och stridsvagn, utan utpekade mål',
    own:{tank:4},def:[['turret',0,0],['at',-30,50],['at',-30,-50],['tank',50,0]],plan:'advance'},
  slutstrid:{txt:'2 VARG på 40 % mot två stridsvagnar på 20 %: rätt att stanna',own:{tank:2,hp:.4},def:[['tank',0,-25,.2],['tank',0,25,.2]],plan:'chain',order:[0,1],dist:300},
  overmakt:{txt:'1 VARG mot två hela stridsvagnar: rätt att dra sig ur i tid',own:{tank:1},def:[['tank',0,-25],['tank',0,25]],plan:'chain',order:[0,1]},
  hokaa:{txt:'2 offensiva HÖK mot ett ensamt luftvärn',own:{hok:['off','off']},def:[['aa',0,0]],plan:'chain',order:[0]},
  hokaarb:{txt:'2 offensiva HÖK mot luftvärn med en robotskytt bredvid',own:{hok:['off','off']},def:[['aa',0,0],['rb',-20,50]],plan:'chain',order:[0,1]},
  hokrb:{txt:'2 offensiva HÖK mot en bunker med två robotskyttar framför',own:{hok:['off','off']},def:[['turret',0,0],['rb',-40,-30],['rb',-40,30]],plan:'chain',order:[0]},
  hokpv:{txt:'2 offensiva HÖK mot två pansarvärnslag i skydd som flyttat 50 m sedan de sågs',own:{hok:['off','off']},def:[['at',0,-30],['at',10,40]],plan:'chain',order:[0,1],cover:true,moved:50},
  hokpvlv:{txt:'som hokpv, med ett okänt luftvärn 100 m bakom lagen',own:{hok:['off','off']},def:[['at',0,-30],['at',10,40],['aa',100,0]],plan:'chain',order:[0,1],cover:true,moved:50,hide:[2],need:[0,1]},
  pvlv:{txt:'2 VARG mot två pansarvärnslag under ett luftvärn (som vid spärren i inspelningen på ö 1234, skog utan skydd)',own:{tank:2},def:[['at',0,-30],['at',10,40],['aa',100,0]],plan:'chain',order:[0,1],need:[0,1]},
  pvdold:{txt:'2 VARG (Offensiv) kör till en punkt 100 m framför två dolda pansarvärnslag som ingen sett (som på ö 9949, 19 okt: de syns bara när de skjuter)',own:{tank:2},def:[['at',0,-30],['at',10,40]],plan:'point',to:-100,hide:[0,1]},
  getpvlv:{txt:'som pvlv, och kaptenen skickar en GETING på vart och ett av pansarvärnslagen',own:{tank:2,get:['def','def']},def:[['at',0,-30],['at',10,40],['aa',100,0]],plan:'chain',order:[0,1],need:[0,1],getOn:[0,1]},
  korseld:{txt:'2 VARG mot två bunkrar 60 m isär, anfall på den ena först (som T10 och T8 på ö 9949, 20 okt: VARG-1 ställde sig där T8 nådde; en HÖK spanar, som GETING där)',own:{tank:2,hok:['def']},def:[['turret',0,0],['turret',10,60]],plan:'chain',order:[0,1]},
  motanfall:{txt:'3 VARG står kvar och tar emot två stridsvagnar och ett lätt pansarfordon som rycker ut mot dem',
    own:{tank:3},def:[['tank',0,-30],['tank',0,30],['light',20,0]],plan:'hold',dist:330},
  /* GÄDDA (26 okt): the robot boat out at sea and a high GETING spotting, against defenders on the coast; forward is inland from the
     waterline. The boat is told the targets in order; at Birka the reload is approved at once, as a captain would */
  gbunker:{txt:'GÄDDA och en hög GETING mot en bunker 80 m upp från stranden',sea:1,own:{gadda:1,get:['def']},def:[['turret',80,0]],plan:'gadda'},
  gkust:{txt:'GÄDDA och en hög GETING mot två bunkrar och ett pansarvärnslag vid kusten',sea:1,own:{gadda:1,get:['def']},def:[['turret',60,-60],['turret',90,50],['at',40,0]],plan:'gadda'},
  glv:{txt:'GÄDDA och en hög GETING mot en bunker under ett luftvärn 70 m bakom den',sea:1,own:{gadda:1,get:['def']},def:[['turret',80,0],['aa',150,20]],plan:'gadda',order:[0,1]},
  gdjup:{txt:'GÄDDA och en hög GETING mot en bunker 200 m upp från stranden',sea:1,own:{gadda:1,get:['def']},def:[['turret',200,0]],plan:'gadda'},
  /* Kustbatteriet (issue 73, 29 okt): the coast artillery only falls silent to fire, so a win is GÄDDA silencing it */
  gka:{txt:'GÄDDA och en hög GETING mot kustartilleriet 80 m upp från stranden (vinst: tystat)',sea:1,own:{gadda:1,get:['def']},def:[['kust',80,0]],plan:'gadda',tyst:true}
};
const args=process.argv.slice(2),flags=new Set(args.filter(a=>a.startsWith('--'))),pos=args.filter(a=>!a.startsWith('--')&&!a.includes('=')),sets=args.filter(a=>a.includes('='));
if(flags.has('--list')){for(const[k,s]of Object.entries(SC))console.log(k.padEnd(10)+s.txt);process.exit(0);}
const which=!pos[0]||pos[0]==='all'?Object.keys(SC):pos[0].split(','),REPS=+(pos[1]||10),LOG=flags.has('--log'),UNSEEN=flags.has('--unseen'),HOK=flags.has('--hok');
for(const w of which)if(!SC[w]){console.log('okänt scenario: '+w);process.exit(1);}
for(const s of sets){const[p,v]=s.split('='),k=p.split('.');let o=B;for(const q of k.slice(0,-1))o=o[q];if(!o||!(k[k.length-1]in o)){console.log('okänt värde: '+p);process.exit(1);}o[k[k.length-1]]=isNaN(+v)?v:+v;}
const rng=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
// an arena: land near the middle of the island with room for the approach and the defence; rocks and walls in it are levelled so the
// ground is the same open field every time, and barriers are cleared so nothing blocks the way in or the way back to Birka
let ARENA=null;
const arena=()=>{if(ARENA)return ARENA;const W=B.W,c=W.grid,land=(x,y)=>{const v=c[Math.floor(y/10)*220+Math.floor(x/10)];return v>=2&&B.elevAt(x,y,W.seed,W.V)>1.5;};
  let best=null;for(let r=0;r<=700&&!best;r+=30)for(let b=0;b<6.28&&!best;b+=.3){const D={x:1100+Math.cos(b)*r,y:1100+Math.sin(b)*r};
    const a0=Math.atan2(D.y-B.CARRIER.y,D.x-B.CARRIER.x);/* attack from Birka's side, so the way back runs away from the defence */
    for(const da of[0,.4,-.4,.8,-.8]){if(best)break;const a=a0+da,f={x:Math.cos(a),y:Math.sin(a)},n={x:-f.y,y:f.x};let okk=true;
      for(let s=-460;s<=140&&okk;s+=20)for(let l=-130;l<=130&&okk;l+=26)if(!land(D.x+f.x*s+n.x*l,D.y+f.y*s+n.y*l))okk=false;if(okk)best={D,f,n};}}
  if(!best){console.log('hittar ingen öppen plats på ön');process.exit(1);}return ARENA=best;};
/* the coast: a waterline with open land 220 m inland and navigable water 420 m out, forward pointing inland */
let SEA=null;
const seaArena=()=>{if(SEA)return SEA;const W=B.W,c=W.grid,land=(x,y)=>{const v=c[Math.floor(y/10)*220+Math.floor(x/10)];return v>=2&&B.elevAt(x,y,W.seed,W.V)>1.5;},sea=(x,y)=>B.seaPass(B.cellIdx(x,y));
  for(let b=0;b<6.28&&!SEA;b+=.05){const o={x:Math.cos(b),y:Math.sin(b)};let D=null;for(let r=1050;r>200;r-=5){const x=1100+o.x*r,y=1100+o.y*r;if(land(x,y)){D={x,y};break;}}if(!D)continue;
    const f={x:-o.x,y:-o.y},n={x:-f.y,y:f.x};let okk=true;
    for(let s2=20;s2<=220&&okk;s2+=20)for(let l=-90;l<=90&&okk;l+=30)if(!land(D.x+f.x*s2+n.x*l,D.y+f.y*s2+n.y*l))okk=false;
    for(let s2=-420;s2<=-60&&okk;s2+=30)for(let l=-120;l<=120&&okk;l+=40)if(!sea(D.x+f.x*s2+n.x*l,D.y+f.y*s2+n.y*l))okk=false;
    if(okk)SEA={D,f,n};}
  if(!SEA){console.log('hittar ingen kust för GÄDDA');process.exit(1);}return SEA;};
const KILLER={};
function play(name,rep){
  const S=SC[name];Math.random=rng(1000+rep*7919);B.newGame(SEED);const G=B.G;G.running=true;G.netAll=true;G.mines=[];
  for(const b of G.barriers)if(!b.cleared){b.cleared=true;for(const c of b.cells)B.W.grid[c]=B.W.baseGrid[c];}
  {const{D,f,n}=S.sea?seaArena():arena();for(let s=S.sea?0:-480;s<=(S.sea?240:160);s+=5)for(let l=-150;l<=150;l+=5){const i=Math.floor((D.y+f.y*s+n.y*l)/10)*220+Math.floor((D.x+f.x*s+n.x*l)/10);if(B.W.grid[i]>=4)B.W.grid[i]=B.W.baseGrid[i]=3;}}
  G.reachAll=null;B.computeLock();
  const{D,f,n}=S.sea?seaArena():arena(),at=(fw,la)=>({x:D.x+f.x*fw+n.x*la,y:D.y+f.y*fw+n.y*la});
  G.enemies=S.def.map(([kind,fw,la,hf],i)=>{const p=at(fw,la),e=B.makeEnemy({id:'X'+(i+1),kind,x:p.x,y:p.y});if(hf)e.hp=Math.round(e.maxhp*hf);e.aim=Math.atan2(-f.y,-f.x)+(Math.random()-.5)*.6;if(kind==='kust')e.face=Math.atan2(-f.y,-f.x);if(!UNSEEN)e.seen=true;return e;});
  if(!UNSEEN){G.known.fill(1);G.knownV++;}
  /* cover: troops hidden from the air as in buildings; moved: they moved this far since they were seen, so the known place is stale;
     hide: defenders nobody has seen yet; need: the ones that must fall for a win (default all) */
  if(S.cover)for(const e of G.enemies)if(e.kind==='at'||e.kind==='inf')e.inCover=true;
  if(S.moved)G.enemies.forEach((e,i)=>{if(e.kind!=='at'&&e.kind!=='inf')return;const a=Math.random()*6.283;e.lx=e.x+Math.cos(a)*S.moved;e.ly=e.y+Math.sin(a)*S.moved;});
  for(const k of S.hide||[])G.enemies[k].seen=false;
  G.units=[];const own=[],nt=S.own.tank||0,hk=(S.own.hok&&S.own.hok.length)?S.own.hok:HOK?['def']:[],back=-(S.dist||420);
  for(let i=0;i<nt;i++){const p=at(back,(i-(nt-1)/2)*26),u=B.makeUnit('tank',p.x,p.y);u.heading=u.turret=Math.atan2(f.y,f.x);if(S.own.hp)u.hp=Math.round(u.maxhp*S.own.hp);G.units.push(u);own.push(u);}
  hk.forEach((post,i)=>{const p=at(back-30,(i-(hk.length-1)/2)*30),u=B.makeUnit('drone',p.x,p.y);u.post=post;u.heading=Math.atan2(f.y,f.x);G.units.push(u);own.push(u);});
  (S.own.get||[]).forEach((post,i)=>{const p=at(back-50,(i-((S.own.get.length-1)/2))*30),u=B.makeUnit('scout',p.x,p.y);u.post=post;u.heading=Math.atan2(f.y,f.x);G.units.push(u);own.push(u);});
  if(S.own.gadda){const p=at(-380,0),u=B.makeUnit('gadda',p.x,p.y);u.heading=Math.atan2(f.y,f.x);G.units.push(u);own.push(u);
    for(const g of own.filter(v=>v.kind==='scout')){const q=at(-260,30);g.x=q.x;g.y=q.y;B.setHigh(g,true,true);}}
  G.wings={'1':own.map(u=>u.id)};G.selIds=own.map(u=>u.id);G.sel=own[0].id;
  const plan=UNSEEN&&S.plan==='chain'?'advance':S.plan;/* unknown defenders cannot be pointed out: the wing advances on the centre */
  if(plan==='chain')(S.order||S.def.map((_,i)=>i)).forEach((k,j)=>B.groupOrder({enemy:G.enemies[k]},j>0));
  else if(plan==='advance')B.groupOrder({world:at(0,0)},false,'off');
  else if(plan==='point')B.groupOrder({world:at(S.to,0)},false,'off');/* to a point short of the defence */
  else if(plan==='gadda'){const bt=own.find(u=>u.kind==='gadda');(S.order||S.def.map((_,i)=>i)).forEach((k,j)=>B.giveOrder(bt,{type:'attack',enemy:G.enemies[k],post:'off'},j>0));
    for(const g of own.filter(u=>u.kind==='scout'))B.giveOrder(g,{type:'obs',x:at(40,0).x,y:at(40,0).y,post:'def'},false);}
  else if(plan==='hold'){const c=at(back,0);B.counterattack({id:'sandlådan',x:c.x,y:c.y});G.log=G.log.filter(l=>!/fältvarvet/.test(l.text));}
  if(S.getOn){const gs=own.filter(u=>u.kind==='scout');S.getOn.forEach((k,i)=>{if(gs[i])B.giveOrder(gs[i],{type:'attack',enemy:G.enemies[k],post:'off'},false);});}/* the captain sends a GETING at each */
  const hp0=own.reduce((s,u)=>s+u.hp,0),dmg0=G.enemies.reduce((s,e)=>s+e.hp,0),deaths=[],seenDead=new Set(),rtbOnce=new Set(),rtbT={};let t=0,res='tid',outT=null;
  for(;t<TMAX;t+=DT){B.step(DT);
    for(const u of own)if(u.kind==='gadda'&&!u.dead&&B.atBirkaSide(u)&&u.ammo<u.maxAmmo&&!(u.rearm>0))B.gaddaRearm(u);
    if(LOG&&S.sea&&Math.abs(t%10)<DT/2)for(const u of own)console.log(('     '+t.toFixed(0)).slice(-5)+'  · '+u.name+' '+Math.round(u.x)+','+Math.round(u.y)+' '+u.state+(u.kind==='gadda'?' · robotar '+u.ammo:''));
    for(const u of own){if(u.rtb&&!u.dead){rtbOnce.add(u.id);if(rtbT[u.id]==null)rtbT[u.id]=t;}else if(!u.dead)rtbT[u.id]=null;if(u.dead&&!seenDead.has(u.id)&&!u.spent){seenDead.add(u.id);const h=Object.entries(u.hitBy).sort((a,b)=>b[1]-a[1])[0],k=h&&G.enemies.find(e=>e.id===h[0]);
      deaths.push({kind:u.kind,rtb:rtbT[u.id]!=null,rtbS:rtbT[u.id]!=null?t-rtbT[u.id]:null,killer:k?k.kind:'?',d:k?Math.round(Math.hypot(k.x-u.x,k.y-u.y)):0});}}
    if(S.tyst?G.enemies.some(e=>e.silT>0):(S.need?S.need.map(k=>G.enemies[k]):G.enemies).every(e=>e.dead)){res='vinst';break;}
    // everyone out (the VARG, when there are any): play on for 25 s so that deaths on the way back count, then stop
    if(!S.sea&&own.filter(u=>!u.air||!own.some(v=>!v.air)).every(u=>u.dead||u.rtb||(u.air&&u.orders[0]&&u.orders[0].type==='rtb'))){/* HÖK in a wing with VARG follows them out */if(outT==null)outT=t;else if(t-outT>25){res='ute';break;}}else outT=null;}
  if(LOG)for(const l of [...G.log].reverse())console.log(('     '+(l.t!=null?l.t.toFixed(0):'')).slice(-5)+'  '+l.text);
  for(const d of deaths){KILLER[d.killer]=(KILLER[d.killer]||0)+1;if(d.rtbS!=null)RTBS.push(d.rtbS);}
  return{res,t,tankLost:deaths.filter(d=>d.kind==='tank').length,hokLost:deaths.filter(d=>d.kind==='drone').length,getSpent:G.getingSpent||0,getLost:deaths.filter(d=>d.kind==='scout').length,rtbDeaths:deaths.filter(d=>d.rtb).length,
    retreats:rtbOnce.size,kills:G.enemies.filter(e=>e.dead).length,nDef:G.enemies.length,dealt:dmg0-G.enemies.reduce((s,e)=>s+(e.dead?0:Math.max(0,e.hp)),0),
    taken:hp0-own.reduce((s,u)=>s+(u.dead?0:Math.max(0,u.hp)),0),deaths,fired:G.gaddaFired||0,down:G.gaddaDown||0,boatLost:deaths.filter(d=>d.kind==='gadda').length,
    boatHit:own.filter(u=>u.kind==='gadda').reduce((s2,u)=>s2+(u.maxhp-(u.dead?0:u.hp)),0)};
}
const RTBS=[];const avg=(a,k)=>a.reduce((s,r)=>s+r[k],0)/a.length,med=a=>{const b=[...a].sort((x,y)=>x-y);return b.length?b[b.length>>1]:NaN;};
const t0=Date.now();
console.log((sets.length?'ändrat: '+sets.join(' ')+'\n':'')+(UNSEEN?'försvararna okända från start\n':'')+(HOK?'en defensiv HÖK i wingar som saknar HÖK\n':'')+'scenario      vinst   tid(med)  VARG förl  HÖK förl  dog i reträtt  reträtter  fiender tagna  GETING förbr/nedsk');
for(const name of which){const R=[];for(let r=0;r<REPS;r++)R.push(play(name,r));const W=R.filter(r=>r.res==='vinst'),dead=R.reduce((s,r)=>s+r.tankLost+r.hokLost,0),rd=R.reduce((s,r)=>s+r.rtbDeaths,0);
  console.log(name.padEnd(12)+(Math.round(W.length/REPS*100)+' %').padStart(7)+(W.length?Math.round(med(W.map(r=>r.t)))+' s':'-').padStart(10)+
    avg(R,'tankLost').toFixed(2).padStart(11)+avg(R,'hokLost').toFixed(2).padStart(10)+((dead?Math.round(rd/dead*100):0)+' %').padStart(15)+avg(R,'retreats').toFixed(2).padStart(11)+
    (avg(R,'kills').toFixed(1)+'/'+R[0].nDef).padStart(15)+(avg(R,'getSpent').toFixed(2)+'/'+avg(R,'getLost').toFixed(2)).padStart(20)+(R.some(r=>r.res==='tid')?'   ('+R.filter(r=>r.res==='tid').length+' på tid)':''));
  if(SC[name].sea)console.log('            GÄDDA: robotar '+avg(R,'fired').toFixed(1)+', nedskjutna '+avg(R,'down').toFixed(2)+', robotar per vinst '+(W.length?(W.reduce((s2,r)=>s2+r.fired,0)/W.length).toFixed(1):'-')+', båten förlorad '+avg(R,'boatLost').toFixed(2)+', skrovskada '+avg(R,'boatHit').toFixed(1)+' av 50');}
console.log((RTBS.length?'de som dog i reträtt dog i median '+med(RTBS).toFixed(1)+' s efter att de vänt\n':'')+'dödande vapen: '+Object.entries(KILLER).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+' '+v).join(', ')+'   ('+((Date.now()-t0)/1000).toFixed(0)+' s)');
