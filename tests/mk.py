# Extracts the game script from ../index.html into g2.js so the headless tests can require() it.
import os
here=os.path.dirname(os.path.abspath(__file__))
s=open(os.path.join(here,'..','index.html'),encoding='utf-8').read()
i=s.rindex('<script>');j=s.rindex('</script>')
open(os.path.join(here,'g2.js'),'w',encoding='utf-8').write(s[i+8:j])
