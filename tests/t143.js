// Issue 190 (Magnus 16 nov): the bunker's embrasure (TURRET: 90 degrees, 60 m of sight behind it) and directional armour on the enemy's
// tanks and light armour (ARMOR). A bunker fires only into its cone, turns no further than the cone's edge, and outside it sees only
// TURRET.backSee m; the chart draws the cone of a spotted bunker; the damage factors front, side and rear for tank and light, BJÖRN unchanged;
// over a sample of islands every bunker has its face and the cones at each point cover the way in but not the whole circle.
global.performance={now:()=>Date.now()};
require('./g2.js');const B=globalThis.__BH;let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const PI=Math.PI,ang=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
ok(B.TURRET.on===true&&Math.abs(B.TURRET.arc-PI/2)<1e-9&&B.TURRET.backSee===60,'TURRET: on, 90 degrees, 60 m behind');
ok(B.ARMOR.on===true&&B.ARMOR.tank.front===.6&&B.ARMOR.tank.side===1&&B.ARMOR.tank.rear===1.5&&B.ARMOR.light.front===.8&&B.ARMOR.light.rear===1.3,'ARMOR: the values of the order');
/* ---- the embrasure ---- */
B.newGame(1185);let G=B.G;G.running=true;B.LOS.on=false;
const e=G.enemies.find(q=>q.kind==='turret'&&!q.coast&&q.cone);
ok(!!e,'a bunker with a cone on 1185');
ok(Math.abs((e.cone.a1-e.cone.a0)-PI/2)<1e-9&&ang((e.cone.a0+e.cone.a1)/2,e.face)<1e-9,'its cone is 90 degrees round its face');
ok(ang(e.aim,e.face)<1e-9,'it rests with the gun on its face (the 3D model turns its head to e.aim)');
G.enemies=G.enemies.filter(q=>q===e);e.hp=e.maxhp=9999;
const g=B.makeUnit('tank',e.x,e.y);g.hp=g.maxhp=99999;G.units.length=0;G.units.push(g);
const at=(a,r)=>({x:e.x+Math.cos(a)*r,y:e.y+Math.sin(a)*r}),put=p=>{g.x=p.x;g.y=p.y;held=p;};
const tick=n=>{for(let i=0;i<n;i++){if(held)put(held);B.step(.05);}};let held=null;/* the unit is put back every step: it has orders of its own */
put(at(e.face,100));e.tgtU=null;e.cd=0;tick(30);
ok(e.tgtU===g,'in the cone at 100 m it takes the target as before');
put(at(e.face+PI,100));e.tgtU=null;e.cd=0;const hp0=g.hp;tick(60);
ok(e.tgtU!==g&&g.hp===hp0,'behind it at 100 m it neither targets nor hits');
const calm=()=>{e.aim=e.face;e.alert=null;e.cone=B.coneOf(e.face,B.TURRET.arc);e.tgtU=null;e.cd=0;};
ok(Math.abs(B.TURRET.turn-30*PI/180)<1e-9,'TURRET.turn: 30 degrees a second (Magnus 18 nov)');
put(at(e.face+PI,B.TURRET.backSee-10));calm();tick(20);
ok(e.tgtU!==g&&!!e.alert&&ang(e.aim,e.face)>.2,'behind it at '+(B.TURRET.backSee-10)+' m (inside backSee) it does not fire at once but starts to turn');
tick(140);ok(ang(e.aim,Math.atan2(g.y-e.y,g.x-e.x))<.05&&B.inCone(e,g),'after a turn at 30 degrees a second its gun is on it and its cone, which followed the gun, holds it (too close below it to fire: depOK)');
calm();put(at(e.face+PI/4+.1,100));e.tgtU=null;e.cd=0;tick(40);
ok(e.tgtU!==g,'just past the edge of the cone (45 degrees plus) no target');
put(at(e.face+PI/4-.05,100));e.tgtU=null;e.cd=0;tick(40);
ok(e.tgtU===g,'just inside the edge: target');
/* Magnus 18 nov: an alarm from behind turns it all the way round, and 20 s after the alarm it turns back to the way in */
put(at(e.face,400));calm();const al=at(e.face+PI-.2,200);e.alert={t:G.time,x:al.x,y:al.y};tick(80);
const half=ang(e.aim,e.face);ok(half>PI/2&&half<PI*.9,'4 s after an alarm from behind it has turned '+(half*180/PI).toFixed(0)+' degrees (30 a second)');
tick(60);ok(ang(e.aim,e.face+PI-.2)<.05&&B.inCone(e,al),'it ends facing the alarm, its cone with it');
const cap0=B.CAP.on,sh0=B.ENEMY_SHARE.on;B.CAP.on=false;B.ENEMY_SHARE.on=false;/* the captain's alarms and shared sight of what it saw would hold it */e.alert.t=G.time-21;tick(140);ok(ang(e.aim,e.face)<.05,'20 s after the alarm, with no shared sight, it is back on its face');B.CAP.on=cap0;B.ENEMY_SHARE.on=sh0;
/* shot at from behind: it turns to the shooter */
calm();const sh=B.makeUnit('tank',at(e.face+PI,300).x,at(e.face+PI,300).y);B.shoot(sh,e,0,0,'f','cannon');
ok(!!e.alert&&Math.hypot(e.alert.x-sh.x,e.alert.y-sh.y)<1,'a shot at it from behind gives it the shooter as its alarm');
calm();put(at(e.face,400));
/* flag off: the old all round bunker */
B.TURRET.on=false;put(at(e.face+PI,100));e.tgtU=null;e.cd=0;e.alert=null;tick(40);
ok(e.tgtU===g&&B.turrCone(e)===null,'TURRET.on false: it takes a target behind it as before');
B.TURRET.on=true;
/* the chart: the cone for a spotted bunker only */
const src=require('fs').readFileSync(require('path').join(__dirname,'..','index.html'),'utf8').split(String.fromCharCode(13)).join('');/* a Windows checkout has CRLF */
const i0=src.indexOf('// enemies\n  for(const e of G.enemies){'),dr=src.slice(i0,i0+5000);
ok(i0>0&&/if\(!e\.seen\|\|e\.dead\)continue;/.test(dr.slice(0,200))&&/else if\(e\.kind==='turret'\)\{[^]*?const tc=turrCone\(e\);if\(tc\)\{[^]*?ctx\.arc\(x,y,e\.range,tc\.a0,tc\.a1\)/.test(dr),'the map draws a bunker only when it is spotted, and as a cone');
ok(B.turrCone(e)===e.cone&&B.turrCone({kind:'tank',cone:e.cone})===null,'turrCone: a bunker with a cone; nothing else');
/* ---- the armour ---- */
const T={kind:'tank',x:0,y:0,hd:0,hp:160,maxhp:160},Lt={kind:'light',x:0,y:0,hd:0,hp:60,maxhp:60},side=(t,a)=>B.armorF(t,{x:Math.cos(a)*100,y:Math.sin(a)*100});
const near=(a,b)=>Math.abs(a-b)<1e-9;
ok(near(side(T,0),.6)&&near(side(T,PI/2),1)&&near(side(T,-PI/2),1)&&near(side(T,PI),1.5),'enemy tank: front .6, side 1, rear 1.5');
ok(near(side(Lt,0),.8)&&near(side(Lt,PI/2),1)&&near(side(Lt,PI),1.3),'light armour: front .8, side 1, rear 1.3');
ok(near(side(T,PI/3-.01),.6)&&near(side(T,PI/3+.01),1)&&near(side(T,2*PI/3-.01),1)&&near(side(T,2*PI/3+.01),1.5),'the cone is BJÖRN.cone (60 degrees) round the hull');
T.hd=PI/2;ok(near(side(T,PI/2),.6)&&near(side(T,-PI/2),1.5),'counted against the hull (hd), not the turret');T.hd=0;
const bj={ty:'bjorn',kind:'tank',x:0,y:0,heading:0};
ok(near(side(bj,0),.5)&&near(side(bj,PI/2),1)&&near(side(bj,PI),1.5),'BJÖRN as before: .5, 1, 1.5');
const vg={ty:'tank',kind:'tank',x:0,y:0,heading:0,hd:0};ok(near(side(vg,PI),1),'a VARG of ours has no armour table (it shares the kind name)');
ok(near(B.armorF({kind:'aa',x:0,y:0,hd:0},{x:100,y:0}),1)&&near(B.armorF(T,null),1),'other enemies, and an unknown direction: 1');
B.ARMOR.on=false;ok(near(side(T,PI),1)&&near(side(Lt,0),1)&&near(side(bj,0),.5),'ARMOR.on false: enemy vehicles 1, BJÖRN still .5');B.ARMOR.on=true;
/* a shot through resolveShot takes more from behind */
const shotHp=(a)=>{const t={kind:'tank',x:0,y:0,hd:0,hp:160,maxhp:160,id:'T1'};G.enemies.push(t);const f={k:'shot',x2:0,y2:0,h2:1,ws:'cannon',side:'f',a:{x:Math.cos(a)*100,y:Math.sin(a)*100,kind:'tank',ty:'tank'},tg:t,hit:true,dmg:10,w:'cannon',done:false};B.resolveShot(f);G.enemies.pop();return 160-t.hp;};
const hF=shotHp(0),hS=shotHp(PI/2),hR=shotHp(PI);
ok(hF>0&&Math.abs(hS/hF-1/.6)<.01&&Math.abs(hR/hS-1.5)<.01,'a cannon hit costs '+hF.toFixed(2)+' from the front, '+hS.toFixed(2)+' from the side, '+hR.toFixed(2)+' from behind');
/* the card line */
const sl=B.strikeSide({kind:'tank',x:0,y:0,hd:0,hp:1,maxhp:1},{x:-50,y:0});
ok(/bakifrån/.test(sl)&&/1,5/.test(sl),'the target card says from which side the selected unit hits: "'+sl+'"');
/* ---- the generator ---- */
const seeds=[1185,2024,3402,9052,5555,7670,3410,6795,4787,7968,1364,2915];const nearOut={};let nb=0,np=0,badFace=0,full=0,infartIn=0,seaB=0;
for(const sd of seeds){B.newGame(sd);const W=B.W,L=W.landing,bs=W.enemies.filter(q=>q.kind==='turret');
  for(const b of bs){nb++;if(b.face==null||!b.cone||Math.abs((b.cone.a1-b.cone.a0)-PI/2)>1e-9||ang(b.face,(b.cone.a0+b.cone.a1)/2)>1e-9)badFace++;if(b.coast)seaB++;}
  for(let pi=0;pi<W.relays.length;pi++){const p=W.relays[pi],mine=bs.filter(b=>!b.coast&&b.facePt===pi);if(!mine.length)continue;np++;
    /* the way in: the last stretch of the land route from the landing, as the generator found it */
    const a=W._appr.get(Math.round(p.x)+','+Math.round(p.y)),qd=d=>({x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d}),q=qd(B.BUNK_AIM);
    const cov=d=>mine.some(b=>ang(b.face,d)<=B.TURRET.arc/2+1e-9);
    for(const d of[40,120])if(mine.some(b=>B.inCone(b,qd(d))))nearOut[d]=(nearOut[d]||0)+1;
    if(mine.some(b=>B.inCone(b,q)))infartIn++;else console.log("  miss",sd,p.id,"mine",mine.length,"a",(a*180/PI).toFixed(0),mine.map(b=>b.id+":"+(b.face*180/PI).toFixed(0)+"@"+Math.hypot(b.x-p.x,b.y-p.y).toFixed(0)).join(" "));
    let unc=false;for(let k=0;k<72;k++)if(!cov(k/72*2*PI))unc=true;if(!unc){full++;console.log("  full",sd,p.id,mine.map(b=>b.id+":"+(b.face*180/PI).toFixed(0)+"@"+Math.hypot(b.x-p.x,b.y-p.y).toFixed(0)).join(" "));}}}
ok(nb>0&&badFace===0,nb+' bunkers on '+seeds.length+' islands, all with a face and a 90 degree cone ('+badFace+' without; '+seaB+' coast bunkers facing the sea)');
ok(np>0&&infartIn===np,'the way in of every point with bunkers lies in some cone, '+B.BUNK_AIM+' m out along it ('+infartIn+' of '+np+'); 40 m out: '+nearOut[40]+', 120 m out: '+nearOut[120]);
ok(full===0,'no point has bunkers that cover the whole circle ('+full+' of '+np+')');
console.log(fail?'FAILED':'all ok');process.exit(fail?1:0);
