// Sets VERSION in index.html to the number of commits on the current branch plus one (the commit that carries the change), issue 95.
// Run before each push to main: node tests/version.js, then commit index.html. Idempotent: running it twice gives the same number.
const fs=require('fs'),cp=require('child_process'),path=require('path');
const root=path.join(__dirname,'..'),f=path.join(root,'index.html');
const n=+cp.execSync('git rev-list --count HEAD',{cwd:root}).toString().trim()+1;
let s=fs.readFileSync(f,'utf8');const re=/const VERSION=\d+;/;
if(!re.test(s)){console.error('VERSION not found in index.html');process.exit(1);}
const t=s.replace(re,'const VERSION='+n+';');
if(t!==s)fs.writeFileSync(f,t);
console.log('VERSION='+n+(t!==s?' (written)':' (unchanged)'));
