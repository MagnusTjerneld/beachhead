# Extracts the game script from ../index.html into g2.js so the headless tests can require() it.
# Issue 181 (10 nov): with BH_SEED set (run.js sets it) Math.random is a seeded generator, so a test gives the same result every run;
# without it the game's own Math.random, as before (the bots, the sandbox and a test run by hand).
import os
here=os.path.dirname(os.path.abspath(__file__))
s=open(os.path.join(here,'..','index.html'),encoding='utf-8').read()
i=s.rindex('<script>');j=s.rindex('</script>')
head=("if(typeof process!=='undefined'&&process.env&&process.env.BH_SEED){let s=(+process.env.BH_SEED)>>>0;"
      "Math.random=()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}\n")
open(os.path.join(here,'g2.js'),'w',encoding='utf-8').write(head+s[i+8:j])
