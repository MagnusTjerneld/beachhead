# Builds proto/ljud.html, the sound bench for HÖK, GETING and GÄDDA, from proto/ljud.src.html and the game's rotorVoice in ../index.html,
# so that the bench always plays the game's own sound. Run it whenever rotorVoice changes.
import os
here=os.path.dirname(os.path.abspath(__file__))
game=open(os.path.join(here,'..','index.html'),encoding='utf-8').read()
i=game.index('function rotorVoice(');j=game.index('function mkVoice(',i)
src=open(os.path.join(here,'ljud.src.html'),encoding='utf-8').read()
assert '/* ROTORVOICE */' in src
open(os.path.join(here,'ljud.html'),'w',encoding='utf-8').write(src.replace('/* ROTORVOICE */','// from index.html (rotorVoice)\n'+game[i:j].rstrip()))
print('proto/ljud.html')
