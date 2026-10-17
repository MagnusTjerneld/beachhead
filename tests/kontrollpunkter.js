// Checkpoints of a recorded test round (17 okt): prints each checkpoint's time, comment and view, and writes its screen picture
// (the marks drawn in) and the marks on their own as files, so that they can be looked at beside the comment.
//   node tests/kontrollpunkter.js inspelning.json [utmapp]
// utmapp defaults to a folder named after the recording, next to it.
const fs=require('fs'),path=require('path');
const src=process.argv[2];if(!src){console.error('användning: node tests/kontrollpunkter.js inspelning.json [utmapp]');process.exit(1);}
const R=JSON.parse(fs.readFileSync(src,'utf8')),out=process.argv[3]||src.replace(/\.json$/i,'')+'-kontrollpunkter';
const mmss=t=>{t=Math.max(0,Math.floor(t||0));return String(Math.floor(t/60)).padStart(2,'0')+'-'+String(t%60).padStart(2,'0');};
const save=(url,file)=>{const m=/^data:image\/(\w+);base64,(.*)$/.exec(url||'');if(!m)return null;fs.writeFileSync(file,Buffer.from(m[2],'base64'));return file;};
const K=(R.events||[]).filter(e=>e.type==='kontrollpunkt');
console.log((R.island||'?')+' (ö '+R.seed+'), '+K.length+' kontrollpunkter, skärm '+(R.screen||'?'));
if(K.length)fs.mkdirSync(out,{recursive:true});
K.forEach((e,i)=>{const n=String(i+1).padStart(2,'0'),base=path.join(out,'kp'+n+'-'+mmss(e.t)),v=e.view||{};
  console.log('\n'+n+'  T+'+mmss(e.t).replace('-',':')+'  huvudvy '+(v.main||'?')+', kamera '+(v.cam||'-')+(v.layout?', layout '+v.layout:''));
  console.log('    '+(e.note||'(ingen kommentar)'));
  if(e.shot){const a=save(e.shot.img,base+'.jpg'),b=e.shot.marks?save(e.shot.marks,base+'-markering.png'):null;console.log('    bild: '+a+(b?'\n    markering: '+b:' (inget ritat)'));}
  else console.log('    (ingen skärmbild)');});
