// MUS: carried by every VARG, remote-controlled only, reach 200 m from its VARG, sees hidden troops, finds mines without
// setting them off, its charge kills a tank, enemies see it only close, replaced at Birka
global.performance={now:()=>0};
require('./g2.js');const B=globalThis.__BH;B.START.res=300;B.START.units=['drone','tank','tank','eng'];/* the old start, so results compare */let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const run=s=>{for(let i=0;i<s*20;i++)B.step(.05);};
const land=(W,x,y)=>{const t=W.grid[Math.floor(y/10)*220+Math.floor(x/10)];return t===2||t===3;};
// open land around a point, for placing things
function openSpot(W,x,y,r){for(let k=0;k<72;k++){const b=k*Math.PI/36;let okL=true;for(let d=0;d<=r;d+=5)if(!land(W,x+Math.cos(b)*d,y+Math.sin(b)*d)){okL=false;break;}if(okL)return b;}return null;}
{B.newGame(1234);const G=B.G;G.running=true;G.netAll=true;G.known.fill(1);G.knownV++;for(const e of G.enemies)e.dead=true;G.mines=[];
 const L=G.relays[0],v=G.units.find(u=>u.kind==='tank');v.x=L.x;v.y=L.y;v.orders=[];run(.2);
 const m=G.units.find(u=>u.kind==='mus'&&u.owner===v.id);
 ok(m&&m.carried===v.id,'every VARG starts with a MUS aboard');
 B.setSel([v.id,m.id]);ok(G.selIds.length===1&&G.selIds[0]===v.id,'a MUS aboard cannot be selected (a box round its VARG takes only the VARG)');
 ok(G.units.filter(u=>u.kind==='mus').length===G.units.filter(u=>u.kind==='tank').length,'one MUS per VARG');
 B.giveOrder(m,{type:'move',x:L.x+50,y:L.y,post:'def'});ok(!m.orders.length,'a MUS takes no orders: remote control only');
 const a=openSpot(B.W,L.x,L.y,240);ok(a!=null,'open land to drive on');
 v.heading=a+Math.PI;ok(B.roverOut(v)&&!m.carried&&G.ctrl===m.id,'X puts it out and gives the captain control');
 // drive away from the VARG: it stops at the edge of the link
 m.x=L.x+Math.cos(a)*8;m.y=L.y+Math.sin(a)*8;m.heading=a;B.CTRL.thr=1;B.CTRL.steer=0;run(25);B.CTRL.thr=0;
 const d=Math.hypot(m.x-v.x,m.y-v.y);ok(d<=B.ROVER.link+1&&d>B.ROVER.link-30,'it stops at the link edge ('+Math.round(d)+' m)');
 G.ctrl=null;run(3);ok(Math.hypot(m.x-v.x,m.y-v.y)===d,'let go, it stands still (no autonomy)');
 // mines: found, never set off
 const mn={x:m.x+Math.cos(a)*-10,y:m.y+Math.sin(a)*-10,r:9,cleared:false,found:false,cells:[],walled:[]};G.mines=[mn];
const hp0=m.hp;m.x=mn.x;m.y=mn.y;mn.cells=[];{const gx=Math.floor(mn.x/10),gy=Math.floor(mn.y/10);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)mn.cells.push((gy+dy)*220+gx+dx);}
 G.ctrl=m.id;run(1);ok(mn.found&&!m.dead&&m.hp===hp0,'a MUS on a mine finds it and does not set it off');
 ok(mn.walled.length>0,'the found field closes the ground');{const x0=m.x,y0=m.y;m.heading=a+Math.PI;B.CTRL.thr=1;run(2);B.CTRL.thr=0;ok(Math.hypot(m.x-x0,m.y-y0)>15,'a MUS drives on through the closed ground ('+Math.round(Math.hypot(m.x-x0,m.y-y0))+' m)');}
 G.ctrl=null;
 // the charge kills a tank and spares what is beyond 12 m
 const tk=G.enemies.find(e=>e.kind==='tank')||G.enemies[0];tk.kind='tank';tk.dead=false;tk.hp=160;tk.x=m.x+5;tk.y=m.y;tk.hx=tk.x;tk.hy=tk.y;tk.leash=0;
 const far=G.enemies.find(e=>e!==tk);far.dead=false;far.hp=40;far.x=m.x+30;far.y=m.y;far.hx=far.x;far.hy=far.y;far.leash=0;
 G.ctrl=m.id;ok(B.roverBlast(m)&&m.dead,'F detonates the charge');ok(tk.dead,'a tank within 8 m is destroyed');ok(!far.dead&&far.hp===40,'nothing beyond 12 m is hurt');
 ok(G.ctrl!==m.id&&!v.musId,'control returns, the VARG has no MUS');
 // replaced at Birka for 30 material in 15 s
 const C=B.CARRIER;v.x=C.x;v.y=C.y;G.res=100;run(17);const m2=G.units.find(u=>u.kind==='mus'&&!u.dead&&u.owner===v.id);
 ok(m2&&m2.carried===v.id,'a new MUS at Birka');ok(G.res<100-25,'it cost material ('+Math.round(100-G.res)+' net of income)');
 // driving it back to the VARG puts it aboard
 v.x=L.x;v.y=L.y;run(.2);B.roverOut(v);run(4);m2.x=v.x+3;m2.y=v.y;run(.5);ok(m2.carried===v.id&&G.ctrl!==m2.id,'driven back to its VARG, it is aboard again');}
// sight: a MUS sees infantry hidden in the woods at 70 m; enemies see it only close and heavy guns rarely hit it
{B.newGame(7341);const G=B.G;G.running=true;G.netAll=true;G.mines=[];
 const inf=G.enemies.find(e=>e.kind==='inf'&&B.coverAt(e.x,e.y));for(const e of G.enemies)if(e!==inf)e.dead=true;
 const v=G.units.find(u=>u.kind==='tank');run(.2);const m=G.units.find(u=>u.kind==='mus'&&u.owner===v.id);
 if(inf){v.x=inf.x+150;v.y=inf.y;m.carried=null;m.outT=G.time;m.x=inf.x+65;m.y=inf.y;inf.leash=0;const b=G.units.filter(u=>u!==m&&u!==v);for(const u of b){u.x=B.CARRIER.x;u.y=B.CARRIER.y;}
  run(.3);ok(inf.visibleNow,'a MUS sees infantry hidden in the woods at 65 m');ok(m.hp===m.maxhp,'and the infantry has not seen it');}
 else ok(false,'no hidden infantry on this island');
 const t=G.enemies.find(e=>e.kind==='turret');t.dead=false;t.hp=120;m.x=t.x+36;m.y=t.y;m.hp=1e6;m.maxhp=1e6;inf&&(inf.dead=true);let sh=0,hits=0;const h0=m.hp;
 for(let i=0;i<200;i++){const c=t.cd;run(.25);if(t.cd>c+.01)sh++;}hits=Math.round((h0-m.hp)/9);
 ok(sh>20,'a bunker shoots at a MUS 36 m away ('+sh+' shots)');ok(hits<sh*.3,'but rarely hits it ('+hits+' of '+sh+')');
}
console.log(fail?'FAILED '+fail:'all passed');process.exit(fail?1:0);
