# Builds proto/bjorn.html, the BJÖRN workshop page, from proto/bjorn.src.html and the game's own model code in ../index.html,
# so the vehicles shown beside BJÖRN are always the ones in the game.
import os,re
here=os.path.dirname(os.path.abspath(__file__))
g=open(os.path.join(here,'..','index.html'),encoding='utf-8').read()
def grab(start,end_marker='\n}\n'):
    i=g.index(start);j=g.index(end_marker,i)+len(end_marker);return g[i:j]
parts=[grab('function mat(c){','\n'),grab('function box(w,h,d){','\n'),grab('function cyl(a,b,h,n){','\n'),grab('function mesh(geo,m,x,y,z){','\n'),grab('function sh(g){','\n'),
       grab('const _bm=new THREE.Matrix4();','\nconst drawCalls'),grab('function mkUnitMesh(u){'),grab('function mkEnemyMesh(e){')]
code='const MATS=new Map(),GEOS=new Map(),TAU=Math.PI*2;\n'+''.join(parts).replace('\nconst drawCalls','\n')
code+='const R3={lampMat:new THREE.MeshLambertMaterial({color:0xe8e4d0,emissive:0x3a3826})};\n'
src=open(os.path.join(here,'bjorn.src.html'),encoding='utf-8').read()
src=src.replace('/*GAME-MODELS*/',code)
open(os.path.join(here,'bjorn.html'),'w',encoding='utf-8').write(src)
print('ok',len(src))
