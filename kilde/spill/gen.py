#!/usr/bin/env python3
"""Bygger spill.html fra huset-3d.html + game.js/game.css. Kjør på nytt når modellen endres."""
import os,re
d=os.path.dirname(os.path.abspath(__file__))
s=open(os.path.join(d,'..','huset-3d.html')).read()
js=open(os.path.join(d,'game.js')).read();css=open(os.path.join(d,'game.css')).read()
def rep(o,n,cnt=1):
    global s
    assert s.count(o)==cnt,(o,s.count(o));s=s.replace(o,n)
rep('<title>Huset i 3D</title>','<title>Spill i huset</title>')
# mer snø i spillet
rep('uSnow*up*mix(smoothstep(0.20,0.40,sn),0.82,','uSnow*up*mix(smoothstep(0.0,0.1,sn),0.97,')
rep('length(fwidth(vSnowP.xz*3.2))))*0.94)','length(fwidth(vSnowP.xz*3.2))))*0.985)')
rep('float up=smoothstep(0.5,0.8,fn.y);','float up=smoothstep(0.12,0.42,fn.y);')   # snø også i brattere bakker
rep('if(!fs||m.transparent||m.blending===THREE.AdditiveBlending)return;','if(!fs||(m.transparent&&m.opacity<0.99&&!m.map)||m.blending===THREE.AdditiveBlending)return;')   # også utsiktsterrenget (gjennomsiktig i kanten)
# strømbrudd: lampene kan slås av per kurs
rep("let vis=LYS.on?items.filter(it=>it.userData.t==='downlight'&&it.visible&&it.parent&&it.parent.parent&&it.parent.parent.visible!==false):[];","let vis=LYS.on?items.filter(it=>it.userData.t==='downlight'&&it.visible&&it.parent&&it.parent.parent&&it.parent.parent.visible!==false&&!(window.__lysAv&&window.__lysAv(it))):[];")
rep("const vc=LYS.on?items.filter(it=>it.userData.t==='cup'&&it.visible&&it.parent&&it.parent.parent&&it.parent.parent.visible!==false):[];","const vc=LYS.on?items.filter(it=>it.userData.t==='cup'&&it.visible&&it.parent&&it.parent.parent&&it.parent.parent.visible!==false&&!(window.__lysAv&&window.__lysAv(it))):[];")
# ytelse: speilene kan slås av, og ingen kantutjevning på mobil (oppløsningen styres av spillet)
rep("if(nw-mirT>1200){mirT=nw;mirScan()}","if(nw-mirT>1200&&!window.__noMir){mirT=nw;mirScan()}")
rep("renderer=new THREE.WebGLRenderer({antialias:true,logarithmicDepthBuffer:true});","renderer=new THREE.WebGLRenderer({antialias:!matchMedia('(pointer:coarse)').matches,logarithmicDepthBuffer:true,powerPreference:'high-performance'});")
# spurt og fart
rep("(K('ShiftLeft')||K('ShiftRight')?3.4:1.5)","(gSpr()?G_SPR:G_WLK)")
# Esc gir pause i stedet for å avslutte
rep("if(e.code==='Escape'){walkStop();return}","if(e.code==='Escape'){if(window.gamePause)gamePause();return}")
# dra-for-å-se skal ikke virke når musa er låst (pointer lock) – ellers kan blikket hoppe
rep("cv.addEventListener('pointerdown',e=>{if(!walkOn||wlook)return;","cv.addEventListener('pointerdown',e=>{if(!walkOn||wlook||document.pointerLockElement===cv)return;")
rep("cv.addEventListener('pointermove',e=>{if(!walkOn||!wlook||e.pointerId!==wlook.id)return;","cv.addEventListener('pointermove',e=>{if(!walkOn||!wlook||e.pointerId!==wlook.id||document.pointerLockElement===cv)return;")
# spillets eget steg hvert bilde
rep('julStep();renderer.render(scene,camera)','julStep();if(window.gameStep)gameStep();renderer.render(scene,camera)')
# CSS og skrift
i=s.index('</style>');s=s[:i]+css+s[i:]
s='<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,800&family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">\n'+s
# spillkoden til slutt i hovedskriptet
i=s.rindex('</script>');i=s.rindex('})();',0,i);s=s[:i]+js+'\n'+s[i:]
open(os.path.join(d,'spill.html'),'w').write(s)
print('ok',len(s))
