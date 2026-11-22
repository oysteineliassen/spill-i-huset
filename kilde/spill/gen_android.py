#!/usr/bin/env python3
"""Bygger Android-prosjektet (WebView-app i fullskjerm) i ../android fra spill.html + data. Kjør gen.py først."""
import os,shutil,re,sys
from PIL import Image
d=os.path.dirname(os.path.abspath(__file__));plan=os.path.join(d,'..');A=os.path.join(plan,'android')
sys.path.insert(0,d)
www=os.path.join(A,'app/src/main/assets/www');shutil.rmtree(www,ignore_errors=True);os.makedirs(www)
filer=['ortho.jpg','uts1m.json','uts1m.txt','uts_tex.jpg','utsikt.json','planned/ground_plan.txt','planned/ortho_plan.jpg','planned/plan.json','drone/geom.txt','drone/meta.json']+['drone/t%d.jpg'%i for i in range(28)]
for f in filer:
    os.makedirs(os.path.dirname(os.path.join(www,f)) or www,exist_ok=True);shutil.copy(os.path.join(plan,f),os.path.join(www,f))
s=open(os.path.join(d,'spill.html')).read()
for u,f in [('https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js','vend/three.min.js'),('https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/controls/OrbitControls.js','vend/OrbitControls.js')]:
    assert u in s,u;s=s.replace(u,f);os.makedirs(os.path.join(www,'vend'),exist_ok=True)
    shutil.copy(os.path.join(plan,'vend/t',u.split('three@0.147.0/')[1]),os.path.join(www,f))
head='''<!doctype html><html lang="no"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<style>html,body{margin:0;height:100%;background:#0e1622;overscroll-behavior:none;-webkit-user-select:none;user-select:none}</style>
'''
open(os.path.join(www,'index.html'),'w').write(head+s)
# ikoner
import gen_pwa_ikon as gi
for n,dirn in [(48,'mdpi'),(72,'hdpi'),(96,'xhdpi'),(144,'xxhdpi'),(192,'xxxhdpi')]:
    p=os.path.join(A,'app/src/main/res/mipmap-'+dirn);os.makedirs(p,exist_ok=True);gi.ikon(n).save(os.path.join(p,'ic_launcher.png'))
print('ok',sum(os.path.getsize(os.path.join(r,f)) for r,_,fs in os.walk(www) for f in fs)//1024,'KB')
