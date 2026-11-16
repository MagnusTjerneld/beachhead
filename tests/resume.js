// Resume of a recorded game (issue 194 point 2, Magnus 16 nov): reads a recording (Spela in testrunda, the format is described in the file's
// legend) and writes the game as a timeline: the player's taken points and losses beside what the enemy captain knew (seen, lost) and decided
// (alarm, counter, reinf, wait, noreserve, hear, mute, level, silent). Usage: node tests/resume.js fil.json [--utan-vet] [--bara-beslut]
//   --utan-vet     leave out the captain's seen and lost lines (what he knew)
//   --bara-beslut  only the captain's decisions and the player's taken points
// The player's side comes from the log lines of the recording (the points "X tagen.", the units "Träffad. Signalen bruten." and the crew),
// the captain's from the events of the type kapten. Not DOM, not the game: it reads the file only (export: resume(rec, opt) -> lines).
const fs=require('fs');
const fmt=t=>{t=Math.max(0,Math.floor(t));return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');};
const refTxt=refs=>(refs||[]).map(r=>r.u+(r.age!=null?' ('+Math.round(r.age)+' s sedan)':'')).join(', ');
const whyTxt=w=>w?Object.keys(w).map(k=>k+' '+w[k]).join(', '):'';
function resume(rec,opt){
  opt=opt||{};const out=[],ev=(rec&&rec.events)||[];
  for(const e of ev){
    if(e.type==='meddelande'&&e.text){
      let m;
      if(!/^Avlyssnat/.test(e.text)&&(m=/^(.+?) tagen\./.exec(e.text)))out.push({t:e.t,side:'du',p:0,txt:'tog '+m[1].replace(/^Radiomasten vid /,'radiomasten vid ')});
      else if(/Signalen bruten|^Besättningen föll/.test(e.text))out.push({t:e.t,side:'du',p:1,txt:e.who?'förlorade '+e.who:'förlorade besättningen'});
      else if(/^Avlyssnat/.test(e.text)&&!opt.bara)out.push({t:e.t,side:'hör',p:3,txt:e.text.replace(/^Avlyssnat: /,'')});}
    else if(e.type==='kapten'){
      const z=e.p||(e.z!=null?'zon '+e.z:'');
      switch(e.d){
        case'seen':if(!opt.utanVet&&!opt.bara)out.push({t:e.t,side:'kapten vet',p:3,txt:'ser '+e.u+(e.by?' ('+e.by+' såg, '+Math.round(e.age||0)+' s gammalt)':'')+(e.x!=null?' vid '+e.x+','+e.y:'')});break;
        case'lost':if(!opt.utanVet&&!opt.bara)out.push({t:e.t,side:'kapten vet',p:3,txt:'tappar '+e.u+(e.dead?' (utslagen)':'')});break;
        case'alarm':out.push({t:e.t,side:'kapten',p:2,txt:'larm vid '+z+', '+e.n+' pjäser vrids'+(e.refs&&e.refs.length?' mot '+refTxt(e.refs):'')});break;
        case'counter':out.push({t:e.t,side:'kapten',p:1,txt:'motanfall mot '+z+' med '+e.n+' förband'+(e.refs&&e.refs.length?', byggt på '+refTxt(e.refs):', utan sedd styrka')+(e.why?' ['+whyTxt(e.why)+']':'')});break;
        case'reinf':out.push({t:e.t,side:'kapten',p:1,txt:'förstärker '+z+' med '+e.n+' förband'+(e.why?' ['+whyTxt(e.why)+']':'')});break;
        case'wait':out.push({t:e.t,side:'kapten',p:2,txt:'avvaktar vid '+z+' (för svag för motanfall)'+(e.why?' ['+whyTxt(e.why)+']':'')});break;
        case'noreserve':out.push({t:e.t,side:'kapten',p:2,txt:'ingen reserv ledig'+(e.for?' för '+e.for:'')+(z?' vid '+z:'')});break;
        case'hear':out.push({t:e.t,side:'kapten',p:2,txt:'hör skott och larmar vid '+z+(e.n?', '+e.n+' pjäser vrids':'')});break;
        case'mute':out.push({t:e.t,side:'kapten',p:2,txt:'en tyst post vid '+z+' ger larm'+(e.n?', '+e.n+' pjäser vrids':'')});break;
        case'level':if(!opt.bara)out.push({t:e.t,side:'kapten',p:3,txt:'nivå '+(e.lvl==='alarm'?'larm':'lugnt')});break;
        case'silent':out.push({t:e.t,side:'kapten',p:0,txt:'ledningen tystnar (ledningscentralen tagen)'});break;}}}
  out.sort((a,b)=>a.t-b.t);
  return out.map(o=>fmt(o.t)+'  '+o.side.padEnd(10)+' '+o.txt);}
module.exports={resume,fmt};
if(require.main===module){
  const f=process.argv[2];if(!f){console.log('node tests/resume.js inspelning.json [--utan-vet] [--bara-beslut]');process.exit(1);}
  const rec=JSON.parse(fs.readFileSync(f,'utf8'));
  const a=process.argv.slice(3),opt={utanVet:a.includes('--utan-vet'),bara:a.includes('--bara-beslut')};
  const last=(rec.events||[]).find(e=>e.type==='slut');
  console.log('Ö '+rec.seed+(rec.island?' '+rec.island:'')+(rec.doctrine?' · '+rec.doctrine:'')+(last?' · '+(last.won?'vunnet':'förlorat')+' vid '+fmt(last.t):''));
  for(const l of resume(rec,opt))console.log(l);}
