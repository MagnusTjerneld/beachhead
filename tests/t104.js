// The minefield decal and the lighthouse's reach (issue 117, Magnus 2 nov): a found minefield is a decal draped over the ground (one mesh, every
// vertex at the ground's height plus a small lift, a ring at the edge and diagonal stripes in the texture) and not a ring in the air; the
// lighthouse's two spotlights reach 350 m (650 before), so the cone fades out before the backdrop. mineDecal is cut out of g2.js by name.
const fs=require('fs'),path=require('path');global.performance={now:()=>0};
const THREE=require('three');let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const src=fs.readFileSync(path.join(__dirname,'g2.js'),'utf8').split('\r').join('');
const a=src.indexOf('\nfunction mineDecal(');ok(a>0,'mineDecal is in the game script');
const fn=src.slice(a,src.indexOf('\n',src.indexOf('return m;}',a))+1);
// a canvas that records its strokes, so that the ring and the stripes are known to be drawn
let strokes=0,arcs=0,clip=0;const ctx=new Proxy({},{get:(t,p)=>p==='stroke'?()=>{strokes++;}:p==='arc'?()=>{arcs++;}:p==='clip'?()=>{clip++;}:()=>{},set:()=>true});
const mkCanvas=(w,h)=>({width:w,height:h,getContext:()=>ctx});
const mk=new Function('THREE','mkCanvas','TAU','PI',fn+'\nreturn mineDecal;')(THREE,mkCanvas,Math.PI*2,Math.PI);
// a hill (a slope of 0.5 up to the east, and a ridge) so that the decal has to follow the ground
const gh=(x,z)=>10+.5*(x-1000)+6*Math.sin(z/9);
const r=16,cx=1000,cz=500,m=mk(cx,cz,r,gh),P=m.geometry.attributes.position,y0=gh(cx,cz);
ok(m.isMesh&&Array.isArray(m.material)===false,'one mesh with one material (one draw call)');
ok(m.material.map&&m.material.transparent&&m.material.depthWrite===false&&m.material.polygonOffset,'a transparent textured material, no depth write, polygonOffset against flicker');
let worst=0,lo=1e9,hi=-1e9,rmax=0,bad=0;
for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i),z=P.getZ(i);if(![x,y,z].every(isFinite))bad++;const g=gh(cx+x,cz+z)-y0,lift=y-g;lo=Math.min(lo,lift);hi=Math.max(hi,lift);worst=Math.max(worst,Math.abs(lift-.45));rmax=Math.max(rmax,Math.hypot(x,z));}
ok(!bad,'no NaN in the vertices');
ok(worst<.01&&lo>.2&&hi<1,'every vertex lies 0.2 to 1 m above the ground (lift '+lo.toFixed(2)+' to '+hi.toFixed(2)+')');
ok(Math.abs(rmax-r)<.01,'the net reaches the field radius ('+rmax.toFixed(2)+' of '+r+')');
let span=-1e9,span2=1e9;for(let i=0;i<P.count;i++){span=Math.max(span,P.getY(i));span2=Math.min(span2,P.getY(i));}
ok(span-span2>10,'the net really follows the slope and the ridge, not a flat disc (height range '+(span-span2).toFixed(1)+' m)');
const T=m.geometry.index.count/3;ok(T===48+(Math.ceil(r/3.5)-1)*48*2,'triangle count: a fan in the middle and two a quad outside it ('+T+')');
ok(strokes>=5&&arcs>=2&&clip>=1,'the texture draws the ring, the clipped stripes ('+strokes+' strokes)');
const uv=m.geometry.attributes.uv;let uvbad=0;for(let i=0;i<uv.count;i++)if(uv.getX(i)<-1e-6||uv.getX(i)>1+1e-6||uv.getY(i)<-1e-6||uv.getY(i)>1+1e-6)uvbad++;ok(!uvbad,'the texture coordinates stay inside 0 to 1');
ok(m.raycast()===undefined,'the decal takes no clicks');
// the game: the old ring in the air is gone, the decal is hung under the tag, and it is disposed when the field is cleared
ok(!/RingGeometry\(w\.ring/.test(src),'the old RingGeometry around the minefield is gone');
ok(/o0=mineDecal\(w\.x,w\.y,w\.ring,groundY\)/.test(src),'syncTags builds the decal from the field radius and the ground height');
ok(/if\(o\.dc\)\{o\.dc\.geometry\.dispose\(\)/.test(src),'the decal is disposed with its tag');
// the lighthouse
const sp=src.match(/new THREE\.SpotLight\(0xfff2d8,0,(\d+),/);ok(sp&&+sp[1]===350,'the lighthouse spotlights reach 350 m ('+(sp&&sp[1])+')');
console.log(fail?'FAILED':'all passed');process.exit(fail?1:0);
