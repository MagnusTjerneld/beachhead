# Builds proto/enhetsgalleri.html, the unit gallery, from proto/enhetsgalleri.src.html and the game's own model code and value tables
# in ../index.html, so the gallery always shows the units and numbers that are in the game.
import os,re
here=os.path.dirname(os.path.abspath(__file__))
g=open(os.path.join(here,'..','index.html'),encoding='utf-8').read()
def grab(start,end_marker='\n}\n'):
    i=g.index(start);j=g.index(end_marker,i)+len(end_marker);return g[i:j]
def stmt(start):
    i=g.index(start);j=g.index(';\n',i)+2;return g[i:j]
models=[grab('function mat(c){','\n'),grab('function box(w,h,d){','\n'),grab('function cyl(a,b,h,n){','\n'),grab('function mesh(geo,m,x,y,z){','\n'),grab('function sh(g){','\n'),
        grab('const _bm=new THREE.Matrix4();','\nconst drawCalls'),grab('function mkUnitMesh(u){'),grab('function mkEnemyMesh(e){')]
code='const MATS=new Map(),GEOS=new Map(),TAU=Math.PI*2;\n'+''.join(models).replace('\nconst drawCalls','\n')
code+='const R3={lampMat:new THREE.MeshLambertMaterial({color:0xe8e4d0,emissive:0x3a3826})};\n'
cost=re.search(r'COST=(\{[^}]*\})',g).group(1)
krok=re.search(r"kind:'krok',name:n===1\?'KROK'[^\n]*",g).group(0)
stats='\n'.join([stmt('const ENEMY={'),stmt('const TYPES={'),stmt('const MG='),stmt('const ROCKET_EXT='),stmt('const SCOOT='),stmt('const SIZE_ACC='),stmt('const KROK_COST='),
                 'const COST='+cost+';','const KROK_SRC='+repr(krok)+';'])
src=open(os.path.join(here,'enhetsgalleri.src.html'),encoding='utf-8').read()
src=src.replace('/*GAME-MODELS*/',code).replace('/*GAME-STATS*/',stats)
open(os.path.join(here,'enhetsgalleri.html'),'w',encoding='utf-8').write(src)
print('ok',len(src))
