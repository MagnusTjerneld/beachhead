// runs the fast tests in parallel (one per core) and prints a short summary; exit code 1 if any failed
const {spawn}=require('child_process'),path=require('path'),os=require('os');
require('child_process').execFileSync('python3',[path.join(__dirname,'mk.py')]);
const tests=['t23','t51','t58','t60','t61','t62','t63','t64','t65','t66','t67','t68','t69','t70','t71','t72','t73','t74','t75','t76','t77','t78','t79','t80','t81','t82','t83','t84','t85','t86','t87','t88'],n=os.cpus().length,res=[];let next=0,live=0;const t0=Date.now();
const go=()=>{while(live<n&&next<tests.length){const t=tests[next++];live++;const s=Date.now();let out='';
  const c=spawn(process.execPath,[path.join(__dirname,t+'.js')],{cwd:__dirname});c.stdout.on('data',d=>out+=d);c.stderr.on('data',d=>out+=d);
  c.on('close',code=>{live--;const fails=out.split('\n').filter(l=>/FAIL|Error/.test(l));res.push({t,code,secs:((Date.now()-s)/1000).toFixed(1),fails});
    const bad=code||fails.length;res[res.length-1].code=bad;console.log((bad?'FAIL ':'ok   ')+t+' '+((Date.now()-s)/1000).toFixed(1)+' s'+(fails.length?'\n     '+fails.slice(0,5).join('\n     '):''));
    if(res.length===tests.length){console.log('total '+((Date.now()-t0)/1000).toFixed(1)+' s, '+(res.some(r=>r.code)?'FAILED':'all passed'));process.exit(res.some(r=>r.code)?1:0);}go();});}};go();
