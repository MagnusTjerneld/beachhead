/* GÄDDA, the robot boat (concept 25 okt, Magnus: "ett litet robotfartyg" that runs along the coast, sees next to nothing on land
   itself and fires robots of longer reach at what a unit ashore has spotted). A low unmanned boat of about 9 m: a sharp faceted V hull
   in marine grey with a dark bottom, a strip in the side's colour along the sheer, a low sensor house with no windows (nobody is
   aboard) and a dark sensor band, an electro-optical ball on its front, a short mast with a radar dome, whips and a mast light,
   red and green side lights, a box of four robot tubes on the after deck that lifts on a hinge at its after end when it fires
   (userData.launcher, userData.lift 0 to 1), the tubes' caps going one by one as they fire (userData.caps), and two water jets in
   the transom (userData.jets). Its own frame: x forward, y up, z to starboard, the waterline at y 0. Built from plain lit pieces so the
   game's bake() can merge it like the other units. mkGadda(THREE,{color,lift,robots}) */
(function(root){
function mkGadda(THREE,o){o=o||{};const col=o.color!=null?o.color:0x2fb3a8,TAU=Math.PI*2,PI=Math.PI;
  const M=c=>new THREE.MeshLambertMaterial({color:c}),B=c=>new THREE.MeshBasicMaterial({color:c});
  const mesh=(ge,m,x,y,z)=>{const q=new THREE.Mesh(ge,m);q.position.set(x||0,y||0,z||0);return q;};
  const box=(a,b,c)=>new THREE.BoxGeometry(a,b,c),cyl=(a,b,h,n)=>new THREE.CylinderGeometry(a,b,h,n||8);
  const HULL=M(0x4c5864),HULL2=M(0x56626e),BOT=M(0x22272b),DECK=M(0x5e6973),DK=M(0x2a2e33),BLK=M(0x15181c),MET=M(0x7d7a72),
    LCH=M(0x606b75),CAP=M(0xd8dde0),T=M(col),WH=B(0xf4f6f8),RED=B(0xd8261c),GRN=B(0x1fbf4a);
  const g=new THREE.Group();
  /* a side profile (x,y) extruded across the boat, narrowed towards the bow (bowT) and towards the keel (vee), so the hull reads as a V
     with flat facets; the same shape cut at the waterline gives the dark bottom */
  const hullGeo=(pts,beam,y0,y1)=>{const s=new THREE.Shape();s.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)s.lineTo(pts[i][0],pts[i][1]);
    const ge=new THREE.ExtrudeGeometry(s,{depth:beam,bevelEnabled:false,curveSegments:1,steps:1});ge.translate(0,0,-beam/2);
    const p=ge.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);
      const bowT=x>1.6?Math.max(.04,1-(x-1.6)/3.05):1,vee=y<.25?.3+.7*Math.max(0,(y+.55)/.8):1;p.setZ(i,p.getZ(i)*bowT*vee);}
    ge.computeVertexNormals();return ge;};
  const prof=[[-4.35,-.42],[2.4,-.5],[4.15,-.05],[4.65,.98],[1.5,1.0],[-4.35,.82]];
  g.add(mesh(hullGeo(prof,2.6),HULL));
  // the dark bottom: the hull below the waterline drawn again a hair wider, so the line between them is crisp
  {const bp=[[-4.37,-.44],[2.42,-.52],[4.12,-.07],[4.28,.08],[-4.37,.08]];const b=mesh(hullGeo(bp,2.64),BOT);g.add(b);}
  // the deck, a rubbing strip along the sheer, the side's colour under it, a lighter band on the bow's flare
  const dk=new THREE.Shape();dk.moveTo(-4.25,-1.18);dk.lineTo(1.4,-1.18);dk.lineTo(4.4,0);dk.lineTo(1.4,1.18);dk.lineTo(-4.25,1.18);dk.lineTo(-4.25,-1.18);
  const dg=new THREE.ExtrudeGeometry(dk,{depth:.06,bevelEnabled:false});dg.rotateX(-PI/2);
  const deck=mesh(dg,DECK,0,.86,0);g.add(deck);
  for(const sz of[-1,1]){
    const rs=mesh(box(5.9,.09,.09),DK,-1.35,.86,sz*1.28);g.add(rs);
    const st=mesh(box(5.6,.16,.04),T,-1.45,.66,sz*1.3);g.add(st);
    const fw=mesh(box(3.2,.08,.08),DK,2.9,.92,sz*.64);fw.rotation.y=sz*.39;fw.rotation.z=.01;g.add(fw);
    const fs=mesh(box(2.9,.14,.04),T,2.75,.72,sz*.66);fs.rotation.y=sz*.39;g.add(fs);}
  // a non-slip walkway down the middle and two cleats aft
  g.add(mesh(box(4.6,.02,.9),M(0x4a545d),-1.2,.93,0));for(const z of[-.95,.95])g.add(mesh(box(.3,.08,.08),MET,-3.95,.97,z));
  /* the sensor house: faceted, lower and narrower forward, no windows, a dark band of sensors round its front and sides */
  {const hs=new THREE.Shape();hs.moveTo(-.2,0);hs.lineTo(2.5,0);hs.lineTo(2.15,.62);hs.lineTo(1.9,.95);hs.lineTo(.2,1.05);hs.lineTo(-.2,.95);hs.lineTo(-.2,0);
    const hg=new THREE.ExtrudeGeometry(hs,{depth:1.5,bevelEnabled:true,bevelThickness:.08,bevelSize:.08,bevelSegments:1,curveSegments:1});hg.translate(0,0,-.75);
    g.add(mesh(hg,HULL2,0,.92,0));
    const bs=new THREE.Shape();bs.moveTo(1.55,.52);bs.lineTo(2.33,.52);bs.lineTo(2.2,.7);bs.lineTo(1.98,.84);bs.lineTo(1.55,.84);
    const bg=new THREE.ExtrudeGeometry(bs,{depth:1.72,bevelEnabled:false});bg.translate(0,0,-.86);g.add(mesh(bg,BLK,0,.92,0));
    // the side lights on the house's flanks, red to port and green to starboard
    g.add(mesh(box(.18,.1,.04),RED,1.2,1.62,-.86));g.add(mesh(box(.18,.1,.04),GRN,1.2,1.62,.86));
    // the electro-optical ball under the front of the house's roof
    const eo=new THREE.Group();eo.position.set(2.35,1.72,0);eo.add(mesh(cyl(.09,.09,.18,8),DK,0,.12,0));eo.add(mesh(new THREE.SphereGeometry(.24,10,8),DK,0,-.08,0));
    eo.add(mesh(box(.06,.12,.2),BLK,.21,-.08,0));g.add(eo);
    // a hatch and a vent on the roof
    g.add(mesh(box(.7,.05,.7),DK,.6,2.03,0));g.add(mesh(box(.35,.12,.25),DK,-.05,2.06,.45));}
  /* the mast: a tripod of short legs to a platform, the radar dome on top, two whips, the white mast light; a band in the side's colour */
  {const mx=.85,my=2.0;g.add(mesh(cyl(.07,.09,1.0,6),DK,mx,my+.5,0));
    for(const z of[-.35,.35]){const l=mesh(cyl(.035,.035,1.05,4),DK,mx-.15,my+.48,z*.55);l.rotation.x=z>0?-.33:.33;g.add(l);}
    g.add(mesh(cyl(.32,.32,.06,10),DK,mx,my+1.0,0));g.add(mesh(cyl(.33,.33,.08,10),T,mx,my+1.07,0));
    g.add(mesh(new THREE.SphereGeometry(.38,12,8,0,TAU,0,PI/2),M(0xdfe3e6),mx,my+1.1,0));
    g.add(mesh(cyl(.07,.07,.12,6),WH,mx,my+1.53,0));
    for(const z of[-.3,.3]){const w=mesh(cyl(.012,.02,1.7,4),BLK,mx-.35,my+1.5,z);w.rotation.z=.12;g.add(w);}}
  /* the launcher: a box of four tubes, two by two, on a hinge at its after end; it lies along the deck and lifts its front to fire. The
     caps on the tubes' front ends go one by one as they fire (robots: how many are left) */
  {const L=new THREE.Group();L.position.set(-3.75,1.02,0);g.add(L);g.userData.launcher=L;
    const lg=new THREE.Group();L.add(lg);
    lg.add(mesh(box(2.55,.62,1.46),LCH,1.27,.31,0));lg.add(mesh(box(2.6,.05,1.5),HULL2,1.27,.64,0));
    for(const z of[-.74,.74])lg.add(mesh(box(2.3,.05,.03),DK,1.2,.12,z));
    lg.add(mesh(box(.08,.5,1.36),T,2.36,.31,0));
    const caps=[];for(const[y,z]of[[.46,-.34],[.46,.34],[.16,-.34],[.16,.34]]){const c=mesh(cyl(.13,.13,.06,10),CAP,2.58,y,z);c.rotation.z=PI/2;lg.add(c);
      const h=mesh(cyl(.12,.12,.05,10),BLK,2.56,y,z);h.rotation.z=PI/2;lg.add(h);caps.push(c);}
    g.userData.caps=caps;
    // the hinge block and the lifting ram, which stretches as the box lifts
    g.add(mesh(box(.4,.22,1.2),DK,-3.75,.98,0));
    const ram=mesh(cyl(.07,.07,1,6),MET,0,0,0);g.add(ram);g.userData.ram=ram;
    const rob=o.robots==null?4:o.robots;caps.forEach((c,i)=>{c.visible=i<rob;});
    g.userData.setLift=t=>{L.rotation.z=t*.62;L.updateMatrix();const a=new THREE.Vector3(-1.9,.98,0),b=new THREE.Vector3(1.6,.08,0).applyAxisAngle(new THREE.Vector3(0,0,1),t*.62).add(L.position);
      const d=b.clone().sub(a);ram.position.copy(a).addScaledVector(d,.5);ram.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());ram.scale.set(1,Math.max(.2,d.length()),1);};
    g.userData.setLift(o.lift||0);}
  // the transom: two water jets with steering buckets, a step, the stern light
  {const jets=[];for(const z of[-.62,.62]){const j=new THREE.Group();j.position.set(-4.38,.12,z);j.add(mesh(cyl(.2,.24,.36,10),DK,0,0,0).rotateZ(PI/2));j.add(mesh(cyl(.17,.2,.2,10),BLK,-.24,0,0).rotateZ(PI/2));g.add(j);jets.push(j);}
    g.userData.jets=jets;g.add(mesh(box(.12,.1,2.1),DK,-4.38,.55,0));g.add(mesh(box(.06,.08,.14),WH,-4.4,.84,0));}
  // a fender line low on the bow and the towing eye
  g.add(mesh(cyl(.05,.05,.3,6),MET,4.52,.95,0).rotateZ(PI/2));
  g.traverse(q=>{if(q.isMesh){q.castShadow=true;q.receiveShadow=true;}});
  return g;}
/* the robot in flight: the same painted pieces as HÖK's robots, nose in the side's colour */
function mkGaddaRobot(THREE,col){const g=new THREE.Group(),M=c=>new THREE.MeshLambertMaterial({color:c});
  for(const[y0,y1,c]of[[-.55,-.33,col],[-.33,-.24,0x16191c],[-.24,.4,0xd8dde0],[.4,.55,0x2a2e33]]){const m=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,y1-y0,8),M(c));m.position.y=-(y0+y1)/2;g.add(m);}
  for(let i=0;i<4;i++){const f=new THREE.Mesh(new THREE.BoxGeometry(.02,.22,.18),M(0x2a2e33));f.position.set(0,-.45,0);f.rotation.y=i*Math.PI/2;f.translateZ(.15);g.add(f);}
  return g;}
root.mkGadda=mkGadda;root.mkGaddaRobot=mkGaddaRobot;
})(typeof globalThis!=='undefined'?globalThis:window);
