#!/usr/bin/env python3
"""Lager en installerbar app (PWA) av spillet i mappen pwa/ og pakker den som spill-i-huset-pwa.zip."""
import os,shutil,json,hashlib,zipfile
from PIL import Image,ImageDraw
d=os.path.dirname(os.path.abspath(__file__));plan=os.path.join(d,'..');out=os.path.join(d,'pwa')
shutil.rmtree(out,ignore_errors=True);os.makedirs(out)
filer=['ortho.jpg','uts1m.json','uts1m.txt','uts_tex.jpg','utsikt.json','planned/ground_plan.txt','planned/ortho_plan.jpg','planned/plan.json','drone/geom.txt','drone/meta.json']+['drone/t%d.jpg'%i for i in range(28)]
for f in filer:
    os.makedirs(os.path.dirname(os.path.join(out,f)) or out,exist_ok=True);shutil.copy(os.path.join(plan,f),os.path.join(out,f))
s=open(os.path.join(d,'spill.html')).read()
# three.js legges i appen, så den virker uten nett
for u,f in [('https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js','vend/three.min.js'),('https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/controls/OrbitControls.js','vend/OrbitControls.js')]:
    assert u in s,u;s=s.replace(u,f);os.makedirs(os.path.join(out,'vend'),exist_ok=True)
    shutil.copy(os.path.join(plan,'vend/t',u.split('three@0.147.0/')[1]),os.path.join(out,f));filer.append(f)
head='''<!doctype html><html lang="no"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<meta name="theme-color" content="#0e1622"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="icon-192.png">
<style>html,body{margin:0;height:100%;background:#0e1622;overscroll-behavior:none}</style>
<script>if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))</script>
'''
open(os.path.join(out,'index.html'),'w').write(head+s)
json.dump({"name":"Spill i huset","short_name":"Spill i huset","start_url":"./","scope":"./","display":"fullscreen","display_override":["fullscreen","standalone"],"orientation":"any",
  "background_color":"#0e1622","theme_color":"#0e1622","icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png","purpose":"any maskable"},{"src":"icon-512.png","sizes":"512x512","type":"image/png","purpose":"any maskable"}]},
  open(os.path.join(out,'manifest.webmanifest'),'w'),ensure_ascii=False,indent=1)
# ikon: hus med snø og en rød nisselue
from gen_pwa_ikon import ikon
ikon(192).save(os.path.join(out,'icon-192.png'));ikon(512).save(os.path.join(out,'icon-512.png'))
# service worker: lagrer alt lokalt så appen starter raskt og virker uten nett
alle=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png']+filer
ver=hashlib.sha1(s.encode()).hexdigest()[:10]
open(os.path.join(out,'sw.js'),'w').write(f'''const C='spill-i-huset-{ver}',F={json.dumps(alle)};
self.addEventListener('install',e=>{{e.waitUntil(caches.open(C).then(c=>c.addAll(F)).then(()=>self.skipWaiting()))}});
self.addEventListener('activate',e=>{{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))}});
self.addEventListener('fetch',e=>{{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request,{{ignoreSearch:true}}).then(r=>r||fetch(e.request).then(res=>{{if(res.ok&&new URL(e.request.url).origin!==location.origin){{const cp=res.clone();caches.open(C).then(c=>c.put(e.request,cp))}}return res}})))}});
''')
z=os.path.join(d,'spill-i-huset-pwa.zip')
with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED) as zf:
    for root,_,fs in os.walk(out):
        for f in fs:p=os.path.join(root,f);zf.write(p,os.path.relpath(p,out))
print('ok',z,os.path.getsize(z)//1024,'KB')
