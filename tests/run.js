// runs the fast tests in parallel (one per core) and prints a short summary; exit code 1 if any failed.
// Issue 181 (10 nov): the slowest first, by the times of the last run (tests/.runtimes.json, not in git); t63, t73, t84 and t109 run in parts
// ('t63#0/2' sets SHARD=0/2 for the test); every test gets the same seeded Math.random (BH_SEED, see mk.py), so a run is the same
// every time; a line fails only if it starts with FAIL or is an uncaught error, not because an ok line contains the word.
const {spawn}=require('child_process'),path=require('path'),os=require('os'),fs=require('fs');
require('child_process').execFileSync('python3',[path.join(__dirname,'mk.py')]);
const list=['t133','t134','t135','t130','t131','t132','t23','t51','t58','t60','t61','t62','t63#0/2','t63#1/2','t64','t65','t66','t67','t68','t69','t70','t71','t72','t73#0/3','t73#1/3','t73#2/3','t74','t75','t76','t77','t79','t80','t81','t82','t83','t84#0/2','t84#1/2','t85','t86','t87','t88','t89','t90','t91','t92','t93','t96','t97','t98','t99','t100','t101','t102','t103','t104','t105','t106','t107','t108','t109#0/2','t109#1/2','t110','t111','t112','t113','t114','t115','t117','t120','t118','t122','t121','t119','t116','t125','t126','t127','t124','t128','t129'];
const TF=path.join(__dirname,'.runtimes.json');let last={};try{last=JSON.parse(fs.readFileSync(TF,'utf8'));}catch(_){}
const tests=list.slice().sort((a,b)=>(last[b]||30)-(last[a]||30));/* unknown tests count as slow, so a new one is not left to the end */
const n=+process.env.RUN_N||Math.max(4,Math.round(os.cpus().length*2/3)),res=[],times={};let next=0,live=0;const t0=Date.now();
const bad=l=>/^FAIL|^\S*Error\b|^\s+at\s/.test(l);
const go=()=>{while(live<n&&next<tests.length){const t=tests[next++],[file,shard]=t.split('#');live++;const s=Date.now();let out='';
  const env={...process.env,BH_SEED:process.env.BH_SEED||'12345'};if(shard)env.SHARD=shard;
  const c=spawn(process.execPath,[path.join(__dirname,file+'.js')],{cwd:__dirname,env});c.stdout.on('data',d=>out+=d);c.stderr.on('data',d=>out+=d);
  c.on('close',code=>{live--;const secs=(Date.now()-s)/1000,fails=out.split(/\r?\n/).filter(bad);times[t]=secs;
    const b=code||fails.length;res.push({t,code:b});console.log((b?'FAIL ':'ok   ')+t+' '+secs.toFixed(1)+' s'+(fails.length?'\n     '+fails.slice(0,5).join('\n     '):''));
    if(res.length===tests.length){try{fs.writeFileSync(TF,JSON.stringify(times));}catch(_){}
      console.log('total '+((Date.now()-t0)/1000).toFixed(1)+' s, '+(res.some(r=>r.code)?'FAILED':'all passed'));process.exit(res.some(r=>r.code)?1:0);}go();});}};go();
