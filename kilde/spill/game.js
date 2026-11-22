
/* =====================================================================
   SPILL I HUSET – spillsiden bygger på 3D-modellen (samme kode, eget lag)
   Spill 1: Finn nissene
   ===================================================================== */
(function(){
const $=id=>document.getElementById(id);
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const HX=W/2,HZ=D/2;                       // midt i huset
const inHouse=(x,z,m=0)=>x>-T-m&&x<W+T+m&&z>-T-m&&z<D+T+m;
const lvOf=y=>y<-1.2?'B':y<2.2?'G':'U';
const LVN={B:'kjelleren',G:'1. etasje',U:'2. etasje'};
const fmtT=s=>{s=Math.max(0,s);const m=Math.floor(s/60),r=Math.floor(s%60);return m+':'+String(r).padStart(2,'0')};

/* ---------- styring: musestyring (pointer lock), spurt, FOV-spark ---------- */
const G={on:false,paused:true,sprintTouch:false,sens:LS.get('spill-sens',1),fovBase:70,fov:70,bob:0,
  N:LS.get('nisse-n',10),tid:LS.get('nisse-tid','kveld'),music:LS.get('spill-musikk',true)};
window.gSpr=()=>!!(wkeys.ShiftLeft||wkeys.ShiftRight||G.sprintTouch);
window.G_WLK=2.1;window.G_SPR=5.2;
cv.addEventListener('click',()=>{if(G.on&&!G.paused&&!isTouch&&document.pointerLockElement!==cv){lock()}});
// musestyring: rå musebevegelse uten akselerasjon, og filter mot de kjente «hoppene» i Chrome (enkelthendelser med urimelig stor bevegelse)
function lock(){if(document.pointerLockElement===cv)return;try{const p=cv.requestPointerLock({unadjustedMovement:true});if(p&&p.catch)p.catch(()=>{try{cv.requestPointerLock()}catch(e){}})}catch(e){try{cv.requestPointerLock()}catch(e2){}}}
const MS={skip:0,avg:4};
document.addEventListener('pointerlockchange',()=>{MS.skip=3;MS.avg=4});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement!==cv||!G.on||G.paused)return;
  let mx=e.movementX||0,my=e.movementY||0;if(MS.skip>0){MS.skip--;return}
  const m=Math.hypot(mx,my);if(m>Math.max(120,MS.avg*10))return;   // hopp: kast hendelsen
  MS.avg+=(m-MS.avg)*0.15;
  const k=0.0021*G.sens;wyaw-=mx*k;wpitch=Math.max(-1.4,Math.min(1.4,wpitch-my*k))});
document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement!==cv&&G.on&&!G.paused&&!isTouch&&!G.ending&&!(G.mode==='strom'&&ST.skapÅpen))gamePause()});
window.gamePause=()=>{if(!G.on)return;if(G.paused)resume();else pause()};

/* ---------- ekstra jul i spillet: snøfall, snømenn, gaver, lykter, krans ---------- */
const XM=new THREE.Group();XM.name='spillJul';scene.add(XM);
const std=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.8},o));
function snomann(x,z,ry,s=1){const g=new THREE.Group(),gy=groundH(x,z)??0,sn=std(0xf4f7fb,{roughness:.95,emissive:0x1c2633});
  [[0.34,0.3],[0.25,0.8],[0.18,1.18]].forEach(([r,y])=>{const m=new THREE.Mesh(new THREE.SphereGeometry(r,24,16),sn);m.position.y=y;m.castShadow=true;g.add(m)});
  const kull=std(0x161616);[[0.08,1.24,0.16],[-0.08,1.24,0.16]].forEach(p=>{const m=new THREE.Mesh(new THREE.SphereGeometry(0.022,8,6),kull);m.position.set(...p);g.add(m)});
  for(let i=0;i<3;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(0.026,8,6),kull);m.position.set(0,0.66+i*0.13,0.25-Math.abs(i-1)*0.012);g.add(m)}
  const nese=new THREE.Mesh(new THREE.ConeGeometry(0.03,0.2,10),std(0xe8741c));nese.rotation.x=Math.PI/2;nese.position.set(0,1.18,0.27);g.add(nese);
  for(let i=-4;i<=4;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(0.012,6,4),kull);const a=i*0.12;m.position.set(Math.sin(a)*0.15,1.1-Math.cos(a*1.4)*0.02-0.03*Math.cos(a*3),Math.cos(a)*0.15);if(Math.abs(i)<4)g.add(m)}
  const hatt=new THREE.Group();const hm=std(0x1c1c22,{roughness:.6});const k1=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,0.025,24),hm),k2=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.13,0.22,24),hm),bd=new THREE.Mesh(new THREE.CylinderGeometry(0.132,0.132,0.045,24),std(0xb3262b));
  k2.position.y=0.11;bd.position.y=0.035;hatt.add(k1,k2,bd);hatt.position.y=1.33;hatt.rotation.z=0.12;g.add(hatt);
  const skjerf=new THREE.Mesh(new THREE.TorusGeometry(0.19,0.045,10,28),std(0xc0262d));skjerf.rotation.x=Math.PI/2;skjerf.position.y=1.0;g.add(skjerf);
  const flik=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.26,0.03),std(0xc0262d));flik.position.set(0.1,0.88,0.17);flik.rotation.z=0.25;g.add(flik);
  const arm=std(0x5a3b22);[[1,0.85],[-1,-0.7]].forEach(([s_,r])=>{const a=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.016,0.55,6),arm);a.position.set(s_*0.42,0.92,0);a.rotation.z=s_*-1.0;g.add(a)});
  g.position.set(x,gy-0.04,z);g.rotation.y=ry;g.scale.setScalar(s);XM.add(g);return g}
function gave(x,z,w,h,d,c,bc,ry){const g=new THREE.Group(),gy=groundH(x,z)??0;const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),std(c,{roughness:.6}));b.position.y=h/2;g.add(b);
  const bm=std(bc,{roughness:.4,metalness:.2});const r1=new THREE.Mesh(new THREE.BoxGeometry(w+0.004,h+0.004,0.03),bm),r2=new THREE.Mesh(new THREE.BoxGeometry(0.03,h+0.004,d+0.004),bm);r1.position.y=r2.position.y=h/2;g.add(r1,r2);
  [0.8,-0.8].forEach(a=>{const l=new THREE.Mesh(new THREE.TorusGeometry(0.045,0.012,6,14),bm);l.position.y=h+0.03;l.rotation.set(0,a,Math.PI/2);l.position.x=Math.sign(a)*0.035;g.add(l)});
  g.position.set(x,gy,z);g.rotation.y=ry;XM.add(g)}
function lykt(x,z){const g=new THREE.Group(),gy=(typeof RAMPE!=='undefined'&&x<RAMPE.x1&&z>RAMPE.z0&&z<RAMPE.z1)?RAMPE.yw-0.01:(groundH(x,z)??0),fm=std(0x18191b,{roughness:.5,metalness:.5});
  const bunn=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.03,0.2),fm);bunn.position.y=0.015;g.add(bunn);const tak=new THREE.Mesh(new THREE.ConeGeometry(0.16,0.09,4),fm);tak.position.y=0.39;tak.rotation.y=Math.PI/4;g.add(tak);
  for(const [sx,sz] of [[1,1],[1,-1],[-1,1],[-1,-1]]){const p=new THREE.Mesh(new THREE.BoxGeometry(0.018,0.32,0.018),fm);p.position.set(sx*0.09,0.18,sz*0.09);g.add(p)}
  const glass=new THREE.Mesh(new THREE.BoxGeometry(0.17,0.3,0.17),new THREE.MeshStandardMaterial({color:0xfff3dd,transparent:true,opacity:.18,roughness:.1}));glass.position.y=0.18;g.add(glass);
  const lys=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.12,14),std(0xf5f0e6));lys.position.y=0.09;g.add(lys);
  const fl=new THREE.Mesh(new THREE.SphereGeometry(0.016,8,6),new THREE.MeshBasicMaterial({color:0xffd27a}));fl.scale.y=1.8;fl.position.y=0.175;fl.name='flamme';g.add(fl);
  const halo=new THREE.Mesh(new THREE.SphereGeometry(0.09,12,8),new THREE.MeshBasicMaterial({color:0xffb54a,transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false}));halo.position.y=0.18;halo.name='flamme';g.add(halo);
  g.position.set(x,gy,z);XM.add(g);return g}
function krans(x,y,z,ry,r=0.24){const g=new THREE.Group();const gm=std(0x1f5a33,{roughness:.9});
  for(let i=0;i<46;i++){const a=i/46*Math.PI*2,m=new THREE.Mesh(new THREE.IcosahedronGeometry(0.055+0.02*((i*7)%3)/2,0),gm);m.position.set(Math.cos(a)*r,Math.sin(a)*r,0);m.rotation.set(i,i*2,i*3);g.add(m)}
  const bm=std(0xc81e2b,{roughness:.5});for(let i=0;i<10;i++){const a=i/10*Math.PI*2+0.3,m=new THREE.Mesh(new THREE.SphereGeometry(0.022,10,8),bm);m.position.set(Math.cos(a)*(r+0.03*((i%2)*2-1)),Math.sin(a)*(r+0.03*((i%2)*2-1)),0.05);g.add(m)}
  const slo=new THREE.Mesh(new THREE.TorusGeometry(0.045,0.018,8,16),bm);slo.position.set(-0.05,-r,0.06);slo.rotation.z=0.6;const slo2=slo.clone();slo2.position.x=0.05;slo2.rotation.z=-0.6;g.add(slo,slo2);
  [[-0.03,-0.1],[0.03,0.1]].forEach(([dx,rz])=>{const b=new THREE.Mesh(new THREE.BoxGeometry(0.035,0.16,0.01),bm);b.position.set(dx,-r-0.09,0.06);b.rotation.z=rz;g.add(b)});
  g.position.set(x,y,z);g.rotation.y=ry;XM.add(g)}
// plassering (modellkoordinater: x nord, z øst)
const JT={x:11.4,z:0.6};   // juletreet
const PYNT=[snomann(10.2,3.6,-2.2),snomann(-6.2,3.0,Math.PI*0.5,0.85),snomann(12.6,9.2,-1.9,0.7)];
[[0.85,0.2,0.2,0.16,0.26,0xb3262b,0xf1d27a,0.3],[0.6,1.0,0.3,0.22,0.24,0x1f6b45,0xe9e2d0,1.1],[-0.2,0.95,0.22,0.12,0.22,0xf3efe6,0xc81e2b,0.2],[-0.75,0.4,0.26,0.2,0.2,0x2a4f9c,0xf1d27a,2.2],[0.1,-0.9,0.18,0.28,0.18,0xd8a531,0xb3262b,0.7],[-0.6,-0.6,0.34,0.14,0.22,0x7b2a8c,0xf1d27a,1.6]].forEach(([dx,dz,w,h,d,c,bc,ry])=>gave(JT.x+dx,JT.z+dz,w,h,d,c,bc,ry));
const LYKTER=[lykt(W+T+0.25,8.2),lykt(W+T+0.25,10.15)];
krans(W+T+0.025,1.5,10.6,Math.PI/2);
const lyktLys=new THREE.PointLight(0xffb05a,0,5,1.8);lyktLys.position.set(W+T+0.6,0.5,9.2);XM.add(lyktLys);
// snøfall rundt kameraet – regnes ut på skjermkortet (ingen JavaScript-løkke per snøfnugg)
const FL=4500,FB={w:44,h:18},flPos=new Float32Array(FL*3),flA=new Float32Array(FL*2);
for(let i=0;i<FL;i++){flPos[i*3]=Math.random()*FB.w;flPos[i*3+1]=Math.random()*FB.h;flPos[i*3+2]=Math.random()*FB.w;flA[i*2]=0.6+Math.random()*0.7;flA[i*2+1]=Math.random()*6.28}
const flG=new THREE.BufferGeometry();flG.setAttribute('position',new THREE.BufferAttribute(flPos,3));flG.setAttribute('aS',new THREE.BufferAttribute(flA,2));
const flU={uT:{value:0},uC:{value:new THREE.Vector3()},uScale:{value:600},uSize:{value:0.07}};
const flakes=new THREE.Points(flG,new THREE.ShaderMaterial({uniforms:flU,transparent:true,depthWrite:false,
  vertexShader:`#include <common>
#include <logdepthbuf_pars_vertex>
attribute vec2 aS;uniform float uT,uScale,uSize;uniform vec3 uC;varying float vA;
    void main(){vec3 p=position;float W=${FB.w.toFixed(1)},H=${FB.h.toFixed(1)};
      p.y=mod(p.y-uT*aS.x,H)+uC.y-7.0;
      p.x=mod(p.x+sin(uT*0.8+aS.y)*0.3-uC.x+W*0.5,W)+uC.x-W*0.5;
      p.z=mod(p.z+uT*0.15+cos(uT*0.6+aS.y)*0.3-uC.z+W*0.5,W)+uC.z-W*0.5;
      vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=max(1.0,uSize*uScale/-mv.z);
#include <logdepthbuf_vertex>
vA=clamp((-mv.z-0.3)*2.0,0.0,1.0);}`,
  fragmentShader:`#include <common>
#include <logdepthbuf_pars_fragment>
varying float vA;void main(){
#include <logdepthbuf_fragment>
float d=length(gl_PointCoord-0.5);if(d>0.5)discard;gl_FragColor=vec4(1.0,1.0,1.0,0.9*vA*smoothstep(0.5,0.12,d));}`}));
flakes.frustumCulled=false;scene.add(flakes);
function snowStep(dt,t){const c=camera.position;flU.uT.value=t;flU.uC.value.copy(c);
  flU.uScale.value=renderer.domElement.height*0.5/Math.tan(camera.fov*Math.PI/360);
  flakes.visible=!(walkOn&&inHouse(c.x,c.z,-0.05)&&c.y<Y.U+3.2)}

/* ---------- ytelse: Auto / Lav / Middels / Høy ---------- */
const YT={valg:LS.get('spill-ytelse','auto'),niv:-1,fpsT:performance.now(),fpsN:0,fps:60,lav:0,alle:null};
function ytelse(n){n=Math.max(0,Math.min(2,n));if(n===YT.niv)return;YT.niv=n;
  const dpr=window.devicePixelRatio||1;renderer.setPixelRatio([isTouch?0.6:0.75,isTouch?0.85:1,Math.min(dpr,1.5)][n]);resize();
  sun.castShadow=n===2;renderer.shadowMap.enabled=n===2;
  if(!YT.alle)YT.alle=LYS.pool.slice();const k=[3,5,8][n];YT.alle.forEach((l,i)=>{if(i<k){if(!l.parent)scene.add(l)}else{l.intensity=0;scene.remove(l)}});LYS.pool=YT.alle.slice(0,k);LYS.key=null;LYS.t=0;
  window.__noMir=n<2;scene.traverse(o=>{if(o.userData&&o.userData.isMirror)o.visible=n===2});
  flG.setDrawRange(0,[1200,2500,FL][n]);
  YT.lysAv=n===0;JUL.lights.forEach(l=>{l.intensity=n===0?0:l.userData.i0??(l.userData.i0=l.intensity)});
  $('gFps')&&($('gFps').dataset.n=['Lav','Middels','Høy'][n])}
function ytelseStart(){ytelse(YT.valg==='auto'?(isTouch?1:2):({lav:0,middels:1,hoy:2})[YT.valg])}
function ytelseMål(now){YT.fpsN++;if(now-YT.fpsT>=1000){YT.fps=YT.fpsN*1000/(now-YT.fpsT);YT.fpsN=0;YT.fpsT=now;const e=$('gFps');if(e)e.textContent=Math.round(YT.fps)+' fps · '+(e.dataset.n||'');
    if(YT.valg==='auto'&&G.on&&!G.paused&&!document.hidden){if(YT.fps<38)YT.lav++;else YT.lav=0;if(YT.lav>=3&&YT.niv>0){YT.lav=0;ytelse(YT.niv-1);toast('Ytelse senket for jevnere spill')}}}}

/* ---------- nissene ---------- */
function lagNisse(){const g=new THREE.Group();const rod=std(0xc8202c,{roughness:.55,emissive:0x3a0508}),hvit=std(0xf7f5ef,{roughness:.9}),hud=std(0xf0c2a0,{roughness:.7}),gra=std(0x6f7781,{roughness:.9}),sort=std(0x1b1b1d,{roughness:.6});
  const kropp=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.1,0.15,18),gra);kropp.position.y=0.095;g.add(kropp);
  const belte=new THREE.Mesh(new THREE.CylinderGeometry(0.083,0.087,0.022,18),sort);belte.position.y=0.11;g.add(belte);
  [-0.04,0.04].forEach(x=>{const s=new THREE.Mesh(new THREE.SphereGeometry(0.035,10,8),sort);s.scale.set(1,0.6,1.5);s.position.set(x,0.018,0.02);g.add(s)});
  const hode=new THREE.Mesh(new THREE.SphereGeometry(0.068,18,14),hud);hode.position.y=0.215;g.add(hode);
  const nese=new THREE.Mesh(new THREE.SphereGeometry(0.02,10,8),std(0xe39a83,{roughness:.6}));nese.position.set(0,0.215,0.066);g.add(nese);
  [-0.026,0.026].forEach(x=>{const o=new THREE.Mesh(new THREE.SphereGeometry(0.009,8,6),sort);o.position.set(x,0.232,0.06);g.add(o)});
  const skjegg=new THREE.Mesh(new THREE.SphereGeometry(0.07,16,12,0,Math.PI*2,Math.PI*0.45,Math.PI*0.55),hvit);skjegg.position.set(0,0.205,0.012);skjegg.scale.set(1.05,1.25,1);g.add(skjegg);
  const lue=new THREE.Mesh(new THREE.ConeGeometry(0.078,0.2,18,4,true),rod);lue.position.set(0,0.34,-0.012);lue.rotation.x=-0.28;g.add(lue);
  const kant=new THREE.Mesh(new THREE.TorusGeometry(0.07,0.018,8,22),hvit);kant.rotation.x=Math.PI/2-0.1;kant.position.set(0,0.252,0.002);g.add(kant);
  const dusk=new THREE.Mesh(new THREE.SphereGeometry(0.026,10,8),hvit);dusk.position.set(0,0.43,-0.06);g.add(dusk);
  [-1,1].forEach(s_=>{const a=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.022,0.1,8),gra);a.position.set(s_*0.088,0.12,0.01);a.rotation.z=s_*0.5;g.add(a);const v=new THREE.Mesh(new THREE.SphereGeometry(0.022,8,6),rod);v.position.set(s_*0.11,0.08,0.015);g.add(v)});
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.userData.nisse=g}});return g}
const NIS=[],NG=new THREE.Group();NG.name='nisser';scene.add(NG);
function smaObj(){return wcol.filter(e=>{const b=e.b;return(b.max.x-b.min.x)*(b.max.z-b.min.z)<5&&(b.max.y-b.min.y)<2.6})}
function ledig(x,y,z,sm){for(const e of sm){const b=e.b;if(x>b.min.x-0.08&&x<b.max.x+0.08&&z>b.min.z-0.08&&z<b.max.z+0.08&&b.min.y<y+0.4&&b.max.y>y+0.05)return false}return true}
function rndIn(poly){let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;poly.forEach(([x,z])=>{x0=Math.min(x0,x);x1=Math.max(x1,x);z0=Math.min(z0,z);z1=Math.max(z1,z)});
  for(let i=0;i<40;i++){const x=x0+0.25+Math.random()*(x1-x0-0.5),z=z0+0.25+Math.random()*(z1-z0-0.5);if(pip(poly,x,z)&&pip(poly,x+0.2,z)&&pip(poly,x-0.2,z)&&pip(poly,x,z+0.2)&&pip(poly,x,z-0.2))return[x,z]}return null}
const polyA=p=>{let a=0;for(let i=0;i<p.length;i++){const[x1,z1]=p[i],[x2,z2]=p[(i+1)%p.length];a+=x1*z2-x2*z1}return Math.abs(a/2)};
function plasserNisser(n){NIS.forEach(o=>NG.remove(o.g));NIS.length=0;const sm=smaObj(),rom=rooms.filter(r=>!r.custom&&r.poly&&Y[r.lv]!=null&&polyA(r.poly)>1.2),tot=rom.reduce((s,r)=>s+Math.sqrt(polyA(r.poly)),0);
  const pts=[],nInne=Math.round(n*0.55);let tries=0;
  const ok=(x,y,z)=>pts.every(p=>Math.hypot(p.x-x,p.z-z)>2.6||Math.abs(p.y-y)>1.5);
  while(pts.filter(p=>p.inne).length<nInne&&tries++<3000){let a=Math.random()*tot,r=rom[0];for(const q of rom){a-=Math.sqrt(polyA(q.poly));if(a<=0){r=q;break}}
    const p=rndIn(r.poly);if(!p)continue;const[x,z]=p,y=wGround(x,Y[r.lv]+0.3,z);if(!(y>Y[r.lv]-0.15&&y<Y[r.lv]+0.55))continue;if(!ledig(x,y,z,sm)||!ok(x,y,z))continue;
    if(pts.filter(q=>q.rom===r.id).length>=1&&Math.random()<0.8)continue;pts.push({x,y,z,inne:true,rom:r.id,navn:r.name})}
  tries=0;while(pts.length<n&&tries++<4000){const a=Math.random()*Math.PI*2,rr=4+Math.random()*12.5,x=HX+Math.cos(a)*rr*1.05,z=HZ+Math.sin(a)*rr;
    if(inHouse(x,z,0.35))continue;const g0=groundH(x,z);if(g0==null)continue;
    const sl=Math.max(Math.abs((groundH(x+0.4,z)??g0)-g0),Math.abs((groundH(x,z+0.4)??g0)-g0));if(sl>0.28)continue;
    const y=wGround(x,g0+0.3,z);if(!(y>g0-0.4&&y<g0+0.7))continue;if(!ledig(x,y,z,sm)||!ok(x,y,z))continue;pts.push({x,y,z,inne:false,navn:'ute'})}
  pts.forEach((p,i)=>{const g=lagNisse();g.position.set(p.x,p.y,p.z);g.rotation.y=Math.random()*6.28;const s=0.95+Math.random()*0.2;g.scale.setScalar(s);NG.add(g);NIS.push({g,p,funnet:false,ph:Math.random()*6,s,giggleT:0})})}

/* ---------- lyd: bjeller, fnis og «Jingle Bells» (folkemelodi, 1857) ---------- */
let AC=null,musGain=null,musNext=0,musI=0;
function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();musGain=AC.createGain();musGain.gain.value=0.11;musGain.connect(AC.destination)}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC}
function tone(f,t,d,v=0.2,type='triangle',dest){const a=ac();if(!a)return;const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+0.008);g.gain.exponentialRampToValueAtTime(0.0008,t+d);o.connect(g);g.connect(dest||a.destination);o.start(t);o.stop(t+d+0.05)}
function bjelle(t,v=0.12,dest){[2637,3520,4186].forEach((f,i)=>tone(f*(1+Math.random()*0.01),t+i*0.012,0.35,v/(i+1),'sine',dest))}
function sfxFunnet(){const a=ac();if(!a)return;const t=a.currentTime;[784,988,1175,1568].forEach((f,i)=>{tone(f,t+i*0.07,0.4,0.16,'triangle');bjelle(t+i*0.07,0.05)})}
function sfxFnis(pan){const a=ac();if(!a)return;const t=a.currentTime;const p=a.createStereoPanner?a.createStereoPanner():null,g=a.createGain();g.gain.value=0.5;if(p){p.pan.value=pan;g.connect(p);p.connect(a.destination)}else g.connect(a.destination);
  [0,0.11,0.22].forEach((d,i)=>{const o=a.createOscillator(),e=a.createGain();o.type='sine';o.frequency.setValueAtTime(1250-i*60,t+d);o.frequency.exponentialRampToValueAtTime(820-i*50,t+d+0.08);e.gain.setValueAtTime(0,t+d);e.gain.linearRampToValueAtTime(0.13,t+d+0.01);e.gain.exponentialRampToValueAtTime(0.001,t+d+0.09);o.connect(e);e.connect(g);o.start(t+d);o.stop(t+d+0.12)})}
function sfxSlutt(){const a=ac();if(!a)return;const t=a.currentTime;[523,659,784,1047,784,1047].forEach((f,i)=>{tone(f,t+i*0.12,0.5,0.15,'triangle');bjelle(t+i*0.12,0.05)})}
const NF={C4:262,D4:294,E4:330,F4:349,G4:392,A4:440,B4:494,C5:523,G3:196,C3:131,F3:175};
const SANG=[['E4',1],['E4',1],['E4',2],['E4',1],['E4',1],['E4',2],['E4',1],['G4',1],['C4',1.5],['D4',0.5],['E4',4],['F4',1],['F4',1],['F4',1.5],['F4',0.5],['F4',1],['E4',1],['E4',1],['E4',0.5],['E4',0.5],['E4',1],['D4',1],['D4',1],['E4',1],['D4',2],['G4',2],
  ['E4',1],['E4',1],['E4',2],['E4',1],['E4',1],['E4',2],['E4',1],['G4',1],['C4',1.5],['D4',0.5],['E4',4],['F4',1],['F4',1],['F4',1.5],['F4',0.5],['F4',1],['E4',1],['E4',1],['E4',0.5],['E4',0.5],['G4',1],['G4',1],['F4',1],['D4',1],['C4',4]];
const BASS=['C3','C3','C3','C3','F3','C3','G3','C3','C3','C3','C3','C3','F3','C3','G3','C3'];
const BEAT=0.27;
function musStep(){if(!G.music||!AC||G.paused&&G.on)return;const now=AC.currentTime;if(musNext<now)musNext=now+0.1;
  while(musNext<now+0.6){const [n,d]=SANG[musI%SANG.length];tone(NF[n]*2,musNext,d*BEAT*0.95+0.1,0.5,'triangle',musGain);
    const beatNo=SANG.slice(0,musI%SANG.length).reduce((s,q)=>s+q[1],0);if(Math.abs(beatNo%2)<1e-6||Math.abs(beatNo%2-0)<0.01){const b=BASS[Math.floor(beatNo/4)%BASS.length];tone(NF[b],musNext,BEAT*1.8,0.35,'sine',musGain)}
    if(Math.abs(beatNo%1)<0.01)bjelle(musNext,0.05,musGain);
    musNext+=d*BEAT;musI++}}

/* ---------- HUD og menyer ---------- */
const ui=document.createElement('div');ui.id='spill';ui.innerHTML=`
<div id="gHud" hidden>
  <div class="gTop">
    <div class="gPill" id="gCount"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 18c1-6 4-12 10-13 2 0 3 1 4 3-2-1-4 0-5 2l3 8z" fill="#d42a35"/><rect x="3.5" y="17" width="15" height="3.4" rx="1.7" fill="#fff"/><circle cx="19" cy="8.2" r="2" fill="#fff"/></svg><b id="gNum">0</b><span>/ <i id="gTot">10</i></span></div>
    <div class="gPill" id="gScore"><span class="gSI">⛄</span><b id="gSc">0</b></div>
    <div class="gPill" id="gLiv"></div>
    <div class="gPill" id="gPort"></div>
    <div class="gPill" id="gPak"></div>
    <div class="gPill" id="gPkN"></div>
    <div class="gPill" id="gBat"></div>
    <div class="gPill" id="gTime">0:00</div>
  </div>
  <div id="gHint" hidden><div id="gArrow">➤</div><div id="gHintTxt"></div></div>
  <div class="gBtns"><button id="gHintB" class="gB">Hint <small>+20 s</small><kbd class="gK">H</kbd></button><button id="gMusB" class="gB" aria-pressed="true">♫<kbd class="gK">M</kbd></button><button id="gFullB" class="gB" title="Fullskjerm" aria-label="Fullskjerm">⛶</button><button id="gPauseB" class="gB">II<kbd class="gK">Esc</kbd></button></div>
  <div class="gAkeL"><button id="aV" class="gR big">◀</button><button id="aH" class="gR big">▶</button></div>
  <div class="gAkeR"><button id="aSkyv" class="gR">Skyv</button><button id="aBrems" class="gR">Brems</button><button id="aHopp" class="gR">Hopp</button></div>
  <div class="gTouch"><button id="gHukB" class="gR">Huk</button><button id="gBrukB" class="gR big">Bruk</button><button id="gKastB" class="gR big">Kast</button><button id="gSprB" class="gR">Spurt</button><button id="gJmpB" class="gR">Hopp</button></div>
  <div id="gSekk"></div>
  <div id="gMål"></div>
  <div id="gPrompt" hidden></div>
  <div id="gVarsel"><span>👁</span><i></i></div>
  <div id="gMeter" hidden><div class="mt-n">MULTIMETER</div><div class="mt-d"><b id="gMeterV">— — —</b><span id="gMeterE"></span></div><div class="mt-s">V~ · AUTO</div></div>
  <div id="gToast"></div>
  <div id="gSplat"></div>
  <div id="gFps"></div>
  <div id="gClick" hidden>Klikk for å styre med musa</div>
</div>
<div id="gMenu" class="gOv">
  <div class="gPanel">
    <p class="gKick">Vardevegen syd 9 · Jul</p>
    <h1>Spill i huset</h1>
    <div class="gCards">
      <button class="gCard" id="cNisse"><span class="gIco">🎅</span><b>Finn nissene</b><span>Nissene har gjemt seg i huset og i hagen. Finn alle så fort du kan.</span></button>
      <button class="gCard" id="cSno"><span class="gIco">⛄</span><b>Snøballkrig</b><span>Snømennene angriper hagen. Treff så mange du kan på to minutter.</span></button>
      <button class="gCard" id="cPakke"><span class="gIco">🎁</span><b>Pakkelevering</b><span>Hent pakker ved juletreet og lever dem i riktig rom i huset.</span></button>
      <button class="gCard" id="cStrom"><span class="gIco">🔦</span><b>Strømbrudd</b><span>Det er mørkt! Finn sikringsskapet, finn feilen og få lyset tilbake.</span></button>
      <button class="gCard" id="cGjem"><span class="gIco">🙈</span><b>Gjemsel</b><span>Gjem deg i huset før nissen begynner å lete. Ikke la ham se deg!</span></button>
      <button class="gCard" id="cMont"><span class="gIco">💡</span><b>Julelysmontøren</b><span>Sett opp stigen og heng julelys langs takrennene før det blir mørkt.</span></button>
      <button class="gCard" id="cEl"><span class="gIco">🧰</span><b>Elektrikerjobben</b><span>Kunden har en feil. Mål deg fram med multimeteret og finn den.</span></button>
      <button class="gCard" id="cAke"><span class="gIco">🛷</span><b>Akebakke</b><span>Ak ned hagen gjennom portene og plukk med deg pakkene på veien.</span></button>
    </div>
    <div id="gOpts">
      <div class="gOpt" id="optN"><span>Antall nisser</span><div class="gSeg" id="oN"><button data-v="5">5</button><button data-v="10">10</button><button data-v="15">15</button></div></div>
      <div class="gOpt" id="optP"><span>Antall pakker</span><div class="gSeg" id="oP"><button data-v="6">6</button><button data-v="10">10</button><button data-v="15">15</button></div></div>
      <div class="gOpt" id="optPil"><span>Pil til rommet</span><div class="gSeg" id="oPil"><button data-v="1">På</button><button data-v="0">Av</button></div></div>
      <div class="gOpt" id="optSN"><span>Vanskelighet</span><div class="gSeg" id="oSN"><button data-v="lett">Lett</button><button data-v="middels">Middels</button><button data-v="vanskelig">Vanskelig</button></div></div>
      <div class="gOpt" id="optNY"><span>Vanskelighet</span><div class="gSeg" id="oNY"><button data-v="lett">Lett</button><button data-v="middels">Middels</button><button data-v="vanskelig">Vanskelig</button></div></div>
      <div class="gOpt" id="optS"><span>Vanskelighet</span><div class="gSeg" id="oD"><button data-v="lett">Lett</button><button data-v="middels">Middels</button><button data-v="vanskelig">Vanskelig</button></div></div>
      <div class="gOpt"><span>Tid på døgnet</span><div class="gSeg" id="oT"><button data-v="dag">Dag</button><button data-v="kveld">Kveld</button></div></div>
      <div class="gOpt" id="optSens"><span>Musefølsomhet</span><div class="gSeg" id="oSens"><button data-v="0.5">Lav</button><button data-v="1">Middels</button><button data-v="1.6">Høy</button></div></div>
      <div class="gOpt"><span>Ytelse</span><div class="gSeg" id="oY"><button data-v="auto">Auto</button><button data-v="lav">Lav</button><button data-v="middels">Middels</button><button data-v="hoy">Høy</button></div></div>
      <div class="gOpt"><span>Musikk</span><div class="gSeg" id="oM"><button data-v="1">På</button><button data-v="0">Av</button></div></div>
      <p class="gBest" id="gBest"></p>
      <button id="gStart" class="gGo" disabled>Laster huset …</button>
      <p class="gHelp" id="gHelp"></p>
    </div>
  </div>
</div>
<div id="gSkap" class="gOv" hidden><div class="gPanel skap"><div class="sk-top"><div><p class="gKick">Sikringsskap · kjeller</p><h2>Kursfortegnelse</h2></div><button id="gSkapX" class="gSec">Lukk</button></div><div id="gSkapK"></div><p class="gHelp" id="gSkapTip"></p></div></div>
<div id="gPause" class="gOv" hidden><div class="gPanel sm"><h2>Pause</h2><p id="gPInfo"></p><button id="gRes" class="gGo">Fortsett</button><button id="gNy" class="gSec">Start på nytt</button><button id="gMeny" class="gSec">Til menyen</button></div></div>
<div id="gDone" class="gOv" hidden><div class="gPanel sm"><p class="gKick" id="gDK">Alle nissene er funnet!</p><h2 id="gDT">0:00</h2><p id="gDInfo"></p><button id="gIgjen" class="gGo">Spill igjen</button><button id="gMeny2" class="gSec">Til menyen</button></div></div>`;
document.body.appendChild(ui);
const HELP={gjem:isTouch?'Du har litt tid på å gjemme deg inne i huset. Så leter nissen. Bjellene på lua forteller hvor han er. <b>Huk</b> gjør deg vanskeligere å se, og spurting hører han.'
  :'<b>W A S D</b> går · <b>C</b> huk (vanskeligere å se) · <b>Shift</b> spurter, men nissen hører deg · <b>Esc</b> pause. Gjem deg inne i huset – bjellene på lua forteller hvor nissen er.',
  montor:isTouch?'Gå bort til takrenna og trykk <b>Bruk</b> for å sette opp stigen. Klatre opp og heng opp lysene du rekker. Hold <b>Bruk</b> for å klatre ned. Strekker du deg for langt, faller du.'
  :'<b>E</b> setter opp stigen / klatrer opp / henger opp lysene · <b>Q</b> klatrer ned · strekker du deg for langt, faller du (+10 s). Til slutt plugges lysene inn ved utekontakten.',
  elektro:isTouch?'Mål med <b>Bruk</b> på kursen i sikringsskapet, stikkontakter og koblingsbokser. Hold <b>Bruk</b> for å åpne en boks eller kontakt. Feil åpnet koster tid.'
  :'<b>E</b> måler (sikringsskapet, stikkontakter, koblingsbokser) · <b>Q</b> åpner boksen eller kontakten · feil åpnet koster tid. Finn det første punktet der målingen ikke stemmer.',
  pakke:isTouch?'Gå til juletreet for å fylle sekken (3 pakker om gangen). Gå inn i rommet som står på pakken for å levere den. <b>Spurt</b> gjør deg raskere.'
  :'<b>Mus</b> ser rundt · <b>W A S D</b> går · <b>Shift</b> spurter · <b>Esc</b> pause. Fyll sekken ved juletreet (3 pakker om gangen) og gå inn i rommet som står på pakken for å levere den.',
  strom:isTouch?'Du har bare en lommelykt. Finn sikringsskapet i kjelleren, få strømmen tilbake og finn feilen. <b>Bruk</b> åpner skapet og trekker ut kontakter. Batterier på gulvet gir lommelykta mer strøm.'
  :'<b>Mus</b> ser rundt · <b>W A S D</b> går · <b>Shift</b> spurter · <b>E</b> åpner skapet / trekker ut kontakter · <b>Esc</b> pause. Finn sikringsskapet i kjelleren og få lyset tilbake. Feilen kan være inne, ute ved julelysene eller ved garasjen. På middels og vanskelig står det flere kontakter rundt omkring – feil kontakt koster 10 s, og på vanskelig er det også noe som overbelaster en kurs.',ake:isTouch?'<b>◀ ▶</b> styrer · <b>Brems</b> bremser · <b>Skyv</b> gir fart på flate partier · <b>Hopp</b> hopper. Kjør gjennom portene (bom gir +3 s) og ta pakkene (−0,3 s hver).'
  :'<b>A D</b> eller <b>piltastene</b> styrer · <b>S</b> bremser · <b>W</b> skyver på flate partier · <b>Mellomrom</b> hopper · <b>R</b> ny tur · <b>Esc</b> pause. Bom på en port gir +3 s, hver pakke gir −0,3 s.',nisse:null,sno:isTouch?'Venstre tommel: gå med spaken · Høyre tommel: dra for å sikte · <b>Kast</b> kaster en snøball mot sikte-prikken · <b>Spurt</b> for å komme deg unna. Treff på hodet gir 2 poeng.'
  :'<b>Mus</b> sikter · <b>Venstreklikk</b> kaster · <b>W A S D</b> går · <b>Shift</b> spurter · <b>Mellomrom</b> hopper · <b>M</b> musikk · <b>Esc</b> pause. Treff på hodet gir 2 poeng.'};
HELP.nisse=isTouch?'Venstre tommel: gå med spaken · Høyre tommel: dra for å se rundt · <b>Spurt</b> slår på løping · Trykk på en nisse for å ta den, eller gå helt bort til den.'
  :'<b>Mus</b> ser rundt · <b>W A S D</b> går · <b>Shift</b> spurter · <b>Mellomrom</b> hopper · <b>Klikk</b> på en nisse eller gå bort til den · <b>H</b> hint · <b>M</b> musikk · <b>Esc</b> pause';
G.mode=LS.get('spill-valgt','nisse');G.diff=LS.get('sno-diff','middels');
function velg(m){G.mode=m;LS.set('spill-valgt',m);ui.dataset.mode=m;[['cNisse','nisse'],['cSno','sno'],['cAke','ake'],['cPakke','pakke'],['cStrom','strom'],['cGjem','gjem'],['cMont','montor'],['cEl','elektro']].forEach(([id,k])=>$(id).setAttribute('aria-pressed',m===k));$('optNY').hidden=!['gjem','montor','elektro'].includes(m);[...$('oNY').children].forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===LS.get('niv-'+m,'middels')));$('optSens').hidden=m==='ake';$('optP').hidden=$('optPil').hidden=m!=='pakke';$('optSN').hidden=m!=='strom';
  $('optN').hidden=m!=='nisse';$('optS').hidden=m!=='sno';$('gHelp').innerHTML=HELP[m];visBest()}
function seg(id,key,val,cb){const el=$(id);const set=v=>{[...el.children].forEach(b=>b.setAttribute('aria-pressed',b.dataset.v==String(v)))};set(val);
  el.onclick=e=>{const b=e.target.closest('button');if(!b)return;set(b.dataset.v);cb(b.dataset.v)}}
seg('oN','n',G.N,v=>{G.N=+v;LS.set('nisse-n',G.N);visBest()});
seg('oT','t',G.tid,v=>{G.tid=v;LS.set('nisse-tid',v);tidSett()});
seg('oM','m',G.music?1:0,v=>{G.music=v==='1';LS.set('spill-musikk',G.music);$('gMusB').setAttribute('aria-pressed',G.music)});
function visBest(){if(G.mode==='gjem'){const n=LS.get('niv-gjem','middels'),b=LS.get('gjem-best-'+n,0);$('gBest').textContent=b?`Du har vunnet ${b} gang${b>1?'er':''} på ${n}`:`Ingen seire på ${n} ennå`;return}
  if(G.mode==='montor'||G.mode==='elektro'){const n=LS.get('niv-'+G.mode,'middels'),b=LS.get(G.mode+'-best-'+n,null);$('gBest').textContent=b!=null?`Beste tid på ${n}: ${fmtT(b)}`:`Ingen rekord på ${n} ennå`;return}
  if(G.mode==='pakke'){const b=LS.get('pakke-best-'+PK.N,null);$('gBest').textContent=b!=null?`Beste tid med ${PK.N} pakker: ${fmtT(b)}`:`Ingen rekord med ${PK.N} pakker ennå`;return}
  if(G.mode==='strom'){const b=LS.get('strom-best-'+ST.niv,null);$('gBest').textContent=b!=null?`Beste tid på ${ST.niv}: ${fmtT(b)}`:`Ingen rekord på ${ST.niv} ennå`;return}
  if(G.mode==='ake'){const b=LS.get('ake-best',null);$('gBest').textContent=b!=null?`Beste tid i akebakken: ${fmtT2(b)}`:'Ingen rekord i akebakken ennå';return}
  if(G.mode==='sno'){const b=LS.get('sno-best-'+G.diff,null);$('gBest').textContent=b!=null?`Rekord på ${G.diff}: ${b} poeng`:`Ingen rekord på ${G.diff} ennå`;return}
  const b=LS.get('nisse-best-'+G.N,null);$('gBest').textContent=b?`Beste tid med ${G.N} nisser: ${fmtT(b)}`:`Ingen rekord med ${G.N} nisser ennå`}
seg('oSens','s',G.sens,v=>{G.sens=+v;LS.set('spill-sens',G.sens)});
seg('oD','d',G.diff,v=>{G.diff=v;LS.set('sno-diff',v);visBest()});

function tidSett(){const kv=G.tid==='kveld';if(!JUL.on)$('tJul').click();if(LYS.kveld!==kv){$('tKveld').click();if(!JUL.on)$('tJul').click()}
  JUL.autoK=false;if(!LYS.on&&$('tLys'))$('tLys').click();lyktLys.intensity=kv?1.3:0}
let toastT=null;function toast(t){const e=$('gToast');e.textContent=t;e.classList.add('vis');clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove('vis'),2200)}

/* ---------- spillflyt ---------- */
const S={t0:0,tid:0,straff:0,funnet:0,hintTil:0,hintN:null,lastT:0};
function startSpill(){G.mode='nisse';ui.dataset.mode='nisse';snoRydd();akeRydd();pakkeRydd();stromRydd();nyeRydd();ac();ui.classList.add('playing');$('gMenu').hidden=true;$('gDone').hidden=true;$('gPause').hidden=true;$('gHud').hidden=false;
  controls.autoRotate=false;tidSett();
  if(!walkOn)walkStart();
  plasserNisser(G.N);$('gTot').textContent=NIS.length;$('gNum').textContent=0;
  const sx=W+T+2.6,sz=9.0;wPlace(sx,sz,null,yawTo(sx,sz,W,sz));wpitch=-0.08;
  Object.assign(S,{tid:0,straff:0,funnet:0,hintTil:0,hintN:null});G.on=true;G.ending=false;G.paused=false;G.sprintTouch=false;$('gSprB').classList.remove('on');
  wkeys={};if(!isTouch){lock()}
  setTimeout(()=>{if(!isTouch&&document.pointerLockElement!==cv&&G.on&&!G.paused)$('gClick').hidden=false},600);
  toast(`Finn ${NIS.length} nisser!`)}
function pause(){G.paused=true;wkeys={};wjoy={x:0,y:0,id:null};knob.style.transform='';if(document.pointerLockElement)document.exitPointerLock();
  $('gPInfo').textContent=G.mode==='gjem'?`${fmtT(Math.ceil(GJ.t))} igjen`:G.mode==='montor'?`${MT.seg.filter(s=>s.hengt).length} av ${MT.seg.length} lysslynger`:G.mode==='elektro'?`${fmtT(EL.tid)}`:G.mode==='pakke'?`${PK.levert} av ${PK.liste.length} levert · ${fmtT(PK.tid)}`:G.mode==='strom'?`${fmtT(ST.tid)}`:G.mode==='ake'?`Tid ${fmtT2(AK.tid+AK.straff-AK.bonus)}`:G.mode==='sno'?`${SNO.poeng} poeng · ${fmtT(Math.ceil(SNO.tid))} igjen`:`${S.funnet} av ${NIS.length} funnet · ${fmtT(S.tid+S.straff)}`;$('gPause').hidden=false}
function resume(){$('gPause').hidden=true;G.paused=false;S.lastT=performance.now();wT=performance.now();if(!isTouch&&G.mode!=='ake'){lock()}}
// tilbakeknappen i Android-appen: pause → meny → lukk appen
window.__spillPause=()=>{if(G.on&&!G.paused)pause();try{AC&&AC.suspend()}catch(e){}};
window.__spillTilbake=()=>{if(typeof ST!=='undefined'&&ST.skapÅpen){skapLukk();return true}if(G.on&&!G.paused){gamePause();return true}if(!$('gMenu').hidden)return false;tilMeny();return true};
function tilMeny(){G.on=false;G.paused=true;if(document.pointerLockElement)document.exitPointerLock();ui.classList.remove('playing');
  $('gHud').hidden=true;$('gPause').hidden=true;$('gDone').hidden=true;$('gMenu').hidden=false;visBest();
  NIS.forEach(o=>NG.remove(o.g));NIS.length=0;snoRydd();akeRydd();pakkeRydd();stromRydd();nyeRydd();walkStop();setLevel('A');controls.autoRotate=true;menyKamera()}
function ferdig(){G.ending=true;G.on=false;G.paused=true;sfxSlutt();if(document.pointerLockElement)document.exitPointerLock();
  const tot=S.tid+S.straff,k='nisse-best-'+NIS.length,b=LS.get(k,null),rek=b==null||tot<b;if(rek)LS.set(k,tot);
  $('gDK').textContent='Alle nissene er funnet!';$('gDT').textContent=fmtT(tot);$('gDInfo').innerHTML=(rek?'<b>Ny rekord!</b> ':`Rekorden er ${fmtT(b)}. `)+(S.straff?`Inkludert ${S.straff} s for hint.`:'Uten hint.');
  setTimeout(()=>{$('gDone').hidden=false},900)}
$('cNisse').onclick=()=>velg('nisse');$('cSno').onclick=()=>velg('sno');
$('cAke').onclick=()=>velg('ake');$('cGjem').onclick=()=>velg('gjem');$('cMont').onclick=()=>velg('montor');$('cEl').onclick=()=>velg('elektro');
$('oNY').onclick=e=>{const b=e.target.closest('button');if(!b)return;LS.set('niv-'+G.mode,b.dataset.v);[...$('oNY').children].forEach(q=>q.setAttribute('aria-pressed',q===b));visBest()};$('cPakke').onclick=()=>velg('pakke');$('cStrom').onclick=()=>velg('strom');
const startValgt=()=>G.mode==='gjem'?startGjem():G.mode==='montor'?startMont():G.mode==='elektro'?startEl():G.mode==='sno'?startSno():G.mode==='ake'?startAke():G.mode==='pakke'?startPakke():G.mode==='strom'?startStrom():startSpill();
$('gStart').onclick=startValgt;$('gRes').onclick=resume;$('gNy').onclick=()=>{$('gPause').hidden=true;startValgt()};$('gMeny').onclick=tilMeny;$('gIgjen').onclick=startValgt;$('gMeny2').onclick=tilMeny;
$('gPauseB').onclick=()=>gamePause();
// fullskjerm der nettleseren tillater det (skjules ellers, og i installert app som allerede er fullskjerm)
{const el=document.documentElement,rq=el.requestFullscreen||el.webkitRequestFullscreen,kan=(document.fullscreenEnabled||document.webkitFullscreenEnabled)&&rq&&!matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
  const b=$('gFullB');if(!kan)b.hidden=true;b.onclick=()=>{if(document.fullscreenElement||document.webkitFullscreenElement){(document.exitFullscreen||document.webkitExitFullscreen).call(document);return}
    try{const p=rq.call(el,{navigationUI:'hide'});if(p&&p.catch)p.catch(()=>{b.hidden=true;toast('Fullskjerm er ikke tillatt her')})}catch(e){b.hidden=true}}}
$('gMusB').onclick=()=>{G.music=!G.music;LS.set('spill-musikk',G.music);$('gMusB').setAttribute('aria-pressed',G.music);ac()};
$('gMusB').setAttribute('aria-pressed',G.music);
$('gHintB').onclick=()=>hint();
$('gSprB').addEventListener('pointerdown',e=>{e.preventDefault();G.sprintTouch=!G.sprintTouch;$('gSprB').classList.toggle('on',G.sprintTouch)});
$('gJmpB').addEventListener('pointerdown',e=>{e.preventDefault();wJump=true});
addEventListener('keydown',e=>{if(!G.on||G.paused)return;if(e.code==='KeyH')hint();if(e.code==='KeyM')$('gMusB').click();if(e.code==='KeyP')gamePause()});
function hint(){if(!G.on||G.paused||G.mode!=='nisse')return;const c=camera.position;let best=null,bd=1e9;NIS.forEach(n=>{if(n.funnet)return;const d=Math.hypot(n.p.x-c.x,n.p.z-c.z)+Math.abs(n.p.y-wp.y)*3;if(d<bd){bd=d;best=n}});
  if(!best)return;S.straff+=20;S.hintN=best;S.hintTil=performance.now()+9000;$('gHint').hidden=false;toast('+20 sekunder')}

// fang nisser: gå bort til dem, eller trykk/klikk på dem
const ray=new THREE.Raycaster(),v2=new THREE.Vector2(),tmpV=new THREE.Vector3(),tmpD=new THREE.Vector3();
function siktFri(n){const c=camera.position,tp=tmpV.set(n.p.x,n.p.y+0.22*n.s,n.p.z),d=tmpD.subVectors(tp,c),L=d.length();d.normalize();
  const x0=Math.min(c.x,tp.x)-0.05,x1=Math.max(c.x,tp.x)+0.05,z0=Math.min(c.z,tp.z)-0.05,z1=Math.max(c.z,tp.z)+0.05,y0=Math.min(c.y,tp.y)-0.05,y1=Math.max(c.y,tp.y)+0.05;
  const cand=[];for(const e of wcol){const b=e.b;if(b.max.x>=x0&&b.min.x<=x1&&b.max.z>=z0&&b.min.z<=z1&&b.max.y>=y0&&b.min.y<=y1)cand.push(e.o)}
  if(!cand.length)return true;ray.set(c,d);ray.far=L-0.08;const h=ray.intersectObjects(cand,false);
  return !h.some(x=>{const m=x.object.material;const ms=Array.isArray(m)?m:[m];return !ms.every(q=>q.transparent&&q.opacity<0.6)})}
function fang(n){if(n.funnet)return;n.funnet=true;n.tf=performance.now();S.funnet++;$('gNum').textContent=S.funnet;$('gCount').classList.remove('pop');void $('gCount').offsetWidth;$('gCount').classList.add('pop');
  sfxFunnet();if(S.hintN===n){S.hintN=null;S.hintTil=0;$('gHint').hidden=true}
  const igjen=NIS.length-S.funnet;toast(igjen?(igjen===1?'Én nisse igjen!':`Fant en! ${igjen} igjen`):'Den siste!');
  if(!igjen)ferdig()}
function trykkFang(cx_,cy_){const r=cv.getBoundingClientRect();v2.set(((cx_-r.left)/r.width)*2-1,-((cy_-r.top)/r.height)*2+1);ray.setFromCamera(v2,camera);ray.far=11;
  const hs=ray.intersectObjects(NIS.filter(n=>!n.funnet).map(n=>n.g),true);if(!hs.length)return false;const n=NIS.find(q=>q.g===hs[0].object.userData.nisse);if(n&&siktFri(n)){fang(n);return true}return false}
let tapS=null;cv.addEventListener('pointerdown',e=>{tapS={x:e.clientX,y:e.clientY,t:performance.now()}});
cv.addEventListener('pointerup',e=>{if(!G.on||G.paused||!tapS)return;const mv=Math.hypot(e.clientX-tapS.x,e.clientY-tapS.y),dt=performance.now()-tapS.t;tapS=null;if(G.mode!=='nisse')return;
  if(document.pointerLockElement===cv){const r=cv.getBoundingClientRect();trykkFang(r.left+r.width/2,r.top+r.height/2);return}
  if(mv<10&&dt<400)trykkFang(e.clientX,e.clientY)});

/* ---------- per bilde ---------- */
function menyKamera(){camera.position.set(HX+19,9,HZ+14);controls.target.set(HX,0,HZ);controls.autoRotateSpeed=0.35;controls.update()}
let tPrev=performance.now(),clock=0;
window.gameStep=function(){const now=performance.now(),dt=Math.min(0.1,(now-tPrev)/1000);tPrev=now;clock+=dt;
  snowStep(dt,clock);musStep();ytelseMål(now);
  LYKTER.forEach((l,i)=>l.children.forEach(o=>{if(o.name==='flamme'){const f=0.85+0.15*Math.sin(clock*13+i*2)+0.08*Math.sin(clock*31+i);o.scale.set(f,1.8*f,f)}}));
  if(lyktLys.intensity>0)lyktLys.intensity=1.2+0.15*Math.sin(clock*11)+0.1*Math.sin(clock*27);
  NIS.forEach(n=>{const g=n.g;if(n.funnet){const k=(now-n.tf)/700;if(k>=1){g.visible=false;return}g.position.y=n.p.y+Math.sin(k*Math.PI)*0.6;g.rotation.y+=dt*14;g.scale.setScalar(n.s*(1-k*0.9));return}
    g.rotation.z=Math.sin(clock*2.2+n.ph)*0.05;g.position.y=n.p.y+Math.abs(Math.sin(clock*3+n.ph))*0.012});
  if(!G.paused||!G.on){SNO.ms+=dt*1000;snoFysikk(dt,SNO.ms)}
  if(!G.on)return;
  if(G.paused){return}
  if(G.mode==='ake'){$('gClick').hidden=true;akeStep(dt,now);return}
  $('gClick').hidden=isTouch||document.pointerLockElement===cv;
  if(G.mode==='nisse'){S.tid+=dt;$('gTime').textContent=fmtT(S.tid+S.straff)}
  // spurt-følelse: litt videre synsfelt og hodebevegelse
  const mv=Math.min(1,Math.hypot((wkeys.KeyW||wkeys.ArrowUp?1:0)-(wkeys.KeyS||wkeys.ArrowDown?1:0)-wjoy.y,(wkeys.KeyD||wkeys.ArrowRight?1:0)-(wkeys.KeyA||wkeys.ArrowLeft?1:0)+wjoy.x));
  if(G.sprintTouch&&mv<0.05&&isTouch){}  // spurt står på til du slår den av
  const asp=camera.aspect||1;G.fovBase=asp<1?Math.min(100,72+(1-asp)*52):72;const spr=gSpr()&&mv>0.05,tf=G.fovBase+(spr?9:0);G.fov+=(tf-G.fov)*Math.min(1,dt*6);if(Math.abs(camera.fov-G.fov)>0.01){camera.fov=G.fov;camera.updateProjectionMatrix()}
  if(mv>0.05){G.bob+=dt*(spr?13:8.5)*mv;camera.position.y+=Math.sin(G.bob)*(spr?0.035:0.018)}
  if(G.mode==='sno'){snoStep(dt,SNO.ms);return}
  if(G.mode==='pakke'){pakkeStep(dt,now);return}
  if(G.mode==='gjem'){gjemStep(dt,now);return}
  if(G.mode==='montor'){montStep(dt,now);return}
  if(G.mode==='elektro'){elStep(dt,now);return}
  if(G.mode==='strom'){if(ST.skapÅpen){wkeys={}}stromStep(dt,now);return}
  // nær nok + fri sikt = funnet; fnis når du er i nærheten
  const c=camera.position;
  NIS.forEach(n=>{if(n.funnet)return;const dx=n.p.x-c.x,dz=n.p.z-c.z,dy=(n.p.y+0.2)-c.y,d=Math.hypot(dx,dz,dy*0.6);
    if(d<1.45&&siktFri(n)){fang(n);return}
    if(d<4.5&&now-n.giggleT>6500+Math.random()*4000){n.giggleT=now;const a=Math.atan2(-dx,-dz)-wyaw;sfxFnis(Math.max(-1,Math.min(1,-Math.sin(a))))}});
  if(S.hintN&&now<S.hintTil){const n=S.hintN,a=yawTo(c.x,c.z,n.p.x,n.p.z)-wyaw,dist=Math.hypot(n.p.x-c.x,n.p.z-c.z);$('gArrow').style.transform=`rotate(${(-a*180/Math.PI)-90}deg)`;
    const nl=inHouse(n.p.x,n.p.z)?lvOf(n.p.y):null,ml=inHouse(c.x,c.z)?lvOf(wp.y):null;
    $('gHintTxt').textContent=(nl?('Inne i '+LVN[nl]):'Ute')+' · '+Math.round(dist)+' m'+(nl&&ml&&nl!==ml?(({B:0,G:1,U:2})[nl]>({B:0,G:1,U:2})[ml]?' · opp':' · ned'):'')}
  else if(!$('gHint').hidden){$('gHint').hidden=true;S.hintN=null}};

/* =====================================================================
   Spill 2: Snøballkrig – snømenn dukker opp i hagen og kaster tilbake
   ===================================================================== */
const SNO={ms:0,poeng:0,treff:0,hode:0,liv:5,tid:120,F:[],B:[],R:[],nesteSpawn:0,kastKlar:0,vel:new THREE.Vector3(),forrige:new THREE.Vector3(),skjelv:0};
const DIFF={lett:{maks:3,mell:[4,5.8],feil:2.0,fart:10,spawn:2.6},middels:{maks:4,mell:[3,4.8],feil:1.3,fart:12,spawn:2.0},vanskelig:{maks:6,mell:[2,3.4],feil:0.8,fart:14.5,spawn:1.4}};
const EN=new THREE.Group();EN.name='snofiender';scene.add(EN);
const ballGeo=new THREE.SphereGeometry(0.075,14,10),ballMat=new THREE.MeshStandardMaterial({color:0xf6f9fd,roughness:.95});
const ruskGeo=new THREE.IcosahedronGeometry(0.035,0),ruskMat=new THREE.MeshStandardMaterial({color:0xf2f6fb,roughness:1});
const GR=5.5;
scene.add(camera);
const handBall=new THREE.Mesh(ballGeo,ballMat);handBall.position.set(0.25,-0.21,-0.62);handBall.scale.setScalar(0.85);handBall.material=new THREE.MeshStandardMaterial({color:0xf6f9fd,roughness:.95,emissive:0x2c3644});handBall.visible=false;camera.add(handBall);
// lyder
let stoyBuf=null;function stoy(){const a=ac();if(!a)return null;if(!stoyBuf){stoyBuf=a.createBuffer(1,a.sampleRate*0.6,a.sampleRate);const d=stoyBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}return stoyBuf}
function sus(f0,f1,d,v,q=1,type='bandpass'){const a=ac(),b=stoy();if(!a||!b)return;const t=a.currentTime,s=a.createBufferSource(),fl=a.createBiquadFilter(),g=a.createGain();s.buffer=b;fl.type=type;fl.Q.value=q;
  fl.frequency.setValueAtTime(f0,t);fl.frequency.exponentialRampToValueAtTime(f1,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.001,t+d);s.connect(fl);fl.connect(g);g.connect(a.destination);s.start(t);s.stop(t+d+0.05)}
const sfxKast=()=>sus(900,2600,0.18,0.25,1.2);
const sfxPoff=(v=0.35)=>sus(1400,300,0.22,v,0.8,'lowpass');
function sfxTreff(hode){sus(2000,400,0.3,0.5,0.7,'lowpass');const a=ac();if(!a)return;const t=a.currentTime;(hode?[880,1175,1568]:[660,880]).forEach((f,i)=>tone(f,t+0.05+i*0.07,0.25,0.13,'triangle'))}
function sfxAu(){sus(800,200,0.35,0.6,0.6,'lowpass');const a=ac();if(!a)return;const t=a.currentTime;tone(330,t,0.25,0.12,'sawtooth');tone(247,t+0.12,0.3,0.1,'sawtooth')}

function losP(a,b){const d=tmpD.subVectors(b,a),L=d.length();d.normalize();
  const x0=Math.min(a.x,b.x)-0.05,x1=Math.max(a.x,b.x)+0.05,z0=Math.min(a.z,b.z)-0.05,z1=Math.max(a.z,b.z)+0.05,y0=Math.min(a.y,b.y)-0.05,y1=Math.max(a.y,b.y)+0.05;
  const cand=[];for(const e of wcol){const q=e.b;if(q.max.x>=x0&&q.min.x<=x1&&q.max.z>=z0&&q.min.z<=z1&&q.max.y>=y0&&q.min.y<=y1)cand.push(e.o)}
  if(!cand.length)return true;ray.set(a,d);ray.far=L-0.1;return !ray.intersectObjects(cand,false).length}
const _a=new THREE.Vector3(),_b=new THREE.Vector3(),_c=new THREE.Vector3();
function lagFiende(x,z,s){const g=snomann(x,z,0,s);EN.add(g);const sort=std(0x111111);
  [-1,1].forEach(k=>{const br=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.016,0.016),sort);br.position.set(k*0.075,1.3,0.165);br.rotation.z=k*0.45;g.add(br)});   // sinte øyenbryn
  const hb=new THREE.Mesh(ballGeo,ballMat);hb.position.set(0.66,1.18,0.05);hb.name='handball';g.add(hb);
  return g}
function spawnFiende(now){const d=DIFF[G.diff],c=camera.position;
  for(let i=0;i<70;i++){const a=Math.random()*Math.PI*2,r=7+Math.random()*10,x=wp.x+Math.cos(a)*r,z=wp.z+Math.sin(a)*r;
    if(inHouse(x,z,0.8))continue;if(Math.hypot(x-HX,z-HZ)>26)continue;const g0=groundH(x,z);if(g0==null)continue;
    const sl=Math.max(Math.abs((groundH(x+0.5,z)??g0)-g0),Math.abs((groundH(x,z+0.5)??g0)-g0));if(sl>0.3)continue;
    if(SNO.F.some(f=>Math.hypot(f.x-x,f.z-z)<2.5))continue;
    if(!losP(c,_a.set(x,g0+1.2,z)))continue;
    if(smaObj().some(e=>x>e.b.min.x-0.4&&x<e.b.max.x+0.4&&z>e.b.min.z-0.4&&z<e.b.max.z+0.4&&e.b.max.y>g0+0.2))continue;
    const s=0.85+Math.random()*0.25,g=lagFiende(x,z,s);g.scale.set(s,0.01,s);
    SNO.F.push({g,x,z,y:g0,s,t0:now,state:'opp',neste:now+800+(d.mell[0]+Math.random()*(d.mell[1]-d.mell[0]))*700,ph:Math.random()*6});return true}
  return false}
function kastBall(p,v,fra){const m=new THREE.Mesh(ballGeo,ballMat);m.position.copy(p);EN.add(m);SNO.B.push({m,v:v.clone(),fra,t:0})}
function kast(){if(!G.on||G.paused||G.mode!=='sno')return;const now=SNO.ms;if(now<SNO.kastKlar)return;SNO.kastKlar=now+380;
  const f=_a.set(0,0,-1).applyQuaternion(camera.quaternion),r=_b.set(1,0,0).applyQuaternion(camera.quaternion),u=_c.set(0,1,0).applyQuaternion(camera.quaternion);
  const p=camera.position.clone().addScaledVector(f,0.35).addScaledVector(r,0.18).addScaledVector(u,-0.12);
  const dir=f.clone().addScaledVector(u,0.045).normalize();kastBall(p,dir.multiplyScalar(25).addScaledVector(SNO.vel,0.6),'meg');sfxKast();handBall.visible=false}
function rusk(p,n=9,fart=2.2,stor=1){for(let i=0;i<n;i++){const m=new THREE.Mesh(ruskGeo,ruskMat);m.position.copy(p);m.scale.setScalar(stor*(0.6+Math.random()*0.8));EN.add(m);
  SNO.R.push({m,v:new THREE.Vector3((Math.random()-0.5)*fart,Math.random()*fart*0.9+0.4,(Math.random()-0.5)*fart),rv:Math.random()*8,life:0.5+Math.random()*0.4,t:0})}}
function knusFiende(f,hode){f.state='dod';const g=f.g;g.updateMatrixWorld(true);
  [...g.children].forEach(ch=>{EN.attach(ch);const v=new THREE.Vector3(ch.position.x-f.x,0.6,ch.position.z-f.z).normalize().multiplyScalar(1.5+Math.random()*2);v.y=1.5+Math.random()*2.5;
    SNO.R.push({m:ch,v,rv:Math.random()*6-3,life:1.3+Math.random()*0.5,t:0,stor:true})});
  EN.remove(g);rusk(_a.set(f.x,f.y+(hode?1.18:0.6)*f.s,f.z),18,3.2,1.5)}
function treff(f,hode){const p=hode?2:1;SNO.poeng+=p;SNO.treff++;if(SNO.treff%5===0&&SNO.liv<5){SNO.liv++;livVis();setTimeout(()=>toast('+1 liv!'),900)}if(hode)SNO.hode++;$('gSc').textContent=SNO.poeng;$('gScore').classList.remove('pop');void $('gScore').offsetWidth;$('gScore').classList.add('pop');
  sfxTreff(hode);toast(hode?'Hodetreff! +2':'Treff! +1');knusFiende(f,hode)}
function livVis(){$('gLiv').innerHTML='<span class="h on">♥</span>'.repeat(Math.max(0,SNO.liv))+'<span class="h">♥</span>'.repeat(Math.max(0,5-SNO.liv))}
function blittTruffet(){SNO.liv--;livVis();sfxAu();SNO.skjelv=0.35;const sp=$('gSplat');sp.classList.remove('vis');void sp.offsetWidth;
  sp.style.setProperty('--sx',(30+Math.random()*40)+'%');sp.style.setProperty('--sy',(30+Math.random()*40)+'%');sp.classList.add('vis');
  if(SNO.liv<=0)sluttSno('liv');else toast(SNO.liv===1?'Siste liv!':'Au!')}
function sluttSno(grunn){if(G.ending)return;G.ending=true;G.on=false;G.paused=true;sfxSlutt();handBall.visible=false;if(document.pointerLockElement)document.exitPointerLock();
  const k='sno-best-'+G.diff,b=LS.get(k,null),rek=b==null||SNO.poeng>b;if(rek)LS.set(k,SNO.poeng);
  $('gDK').textContent=grunn==='liv'?'Du ble snødd ned!':'Tiden er ute!';$('gDT').textContent=SNO.poeng+' poeng';
  $('gDInfo').innerHTML=(rek&&SNO.poeng>0?'<b>Ny rekord!</b> ':b!=null?`Rekorden er ${b} poeng. `:'')+`${SNO.treff} snømenn truffet, ${SNO.hode} av dem på hodet.`;
  setTimeout(()=>{$('gDone').hidden=false},1100)}
function snoRydd(){[...SNO.F.map(f=>f.g),...SNO.B.map(b=>b.m),...SNO.R.map(r=>r.m)].forEach(o=>{if(o.parent)o.parent.remove(o)});SNO.F.length=SNO.B.length=SNO.R.length=0;handBall.visible=false;PYNT.forEach(p=>p.visible=true);$('gSplat').classList.remove('vis')}
function startSno(){snoRydd();akeRydd();pakkeRydd();stromRydd();nyeRydd();G.mode='sno';ui.dataset.mode='sno';ac();ui.classList.add('playing');$('gMenu').hidden=true;$('gDone').hidden=true;$('gPause').hidden=true;$('gHud').hidden=false;
  controls.autoRotate=false;tidSett();PYNT.forEach(p=>p.visible=false);NIS.forEach(o=>NG.remove(o.g));NIS.length=0;
  if(walkOn)walkStop();walkStart();
  const sx=-6.5,sz=5.5;wPlace(sx,sz,null,yawTo(sx,sz,sx-10,sz));wpitch=-0.02;SNO.forrige.copy(wp);SNO.vel.set(0,0,0);
  Object.assign(SNO,{poeng:0,treff:0,hode:0,liv:5,tid:120,nesteSpawn:SNO.ms+1200,kastKlar:0,skjelv:0});$('gSc').textContent=0;livVis();$('gTime').textContent='2:00';
  G.on=true;G.ending=false;G.paused=false;G.sprintTouch=false;$('gSprB').classList.remove('on');handBall.visible=true;
  wkeys={};if(!isTouch){lock()}
  setTimeout(()=>{if(!isTouch&&document.pointerLockElement!==cv&&G.on&&!G.paused)$('gClick').hidden=false},600);
  toast('Snøballkrig!')}
cv.addEventListener('pointerdown',e=>{if(G.mode==='sno'&&G.on&&!G.paused&&e.button===0&&document.pointerLockElement===cv)kast()});
$('gKastB').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();kast()});
addEventListener('keydown',e=>{if(G.mode==='sno'&&G.on&&!G.paused&&(e.code==='KeyF'||e.code==='Enter'))kast()});

// fysikk for snøballer og rusk (går også litt etter at runden er slutt)
const _p=new THREE.Vector3(),_n=new THREE.Vector3(),_eye=new THREE.Vector3();
function ballTreffer(b,p0,p1){   // returnerer treffpunkt eller null
  const g=inHouse(p1.x,p1.z,0.02)?null:groundH(p1.x,p1.z);if(g!=null&&p1.y<g)return _p.set(p1.x,g+0.03,p1.z);
  const x0=Math.min(p0.x,p1.x)-0.1,x1=Math.max(p0.x,p1.x)+0.1,z0=Math.min(p0.z,p1.z)-0.1,z1=Math.max(p0.z,p1.z)+0.1,y0=Math.min(p0.y,p1.y)-0.1,y1=Math.max(p0.y,p1.y)+0.1;
  const cand=[];for(const e of wcol){const q=e.b;if(q.max.x>=x0&&q.min.x<=x1&&q.max.z>=z0&&q.min.z<=z1&&q.max.y>=y0&&q.min.y<=y1)cand.push(e.o)}
  if(cand.length){const d=_n.subVectors(p1,p0),L=d.length();if(L>1e-5){d.normalize();ray.set(p0,d);ray.far=L+0.075;const h=ray.intersectObjects(cand,false)[0];if(h)return _p.copy(h.point)}}
  if(p1.y<-30)return _p.copy(p1);return null}
function snoFysikk(dt,now){
  for(let i=SNO.B.length-1;i>=0;i--){const b=SNO.B[i],p0=b.m.position.clone();b.v.y-=GR*dt;const p1=p0.clone().addScaledVector(b.v,dt);b.t+=dt;let ferdig=false;
    if(b.fra==='meg'){for(const f of SNO.F){if(f.state==='dod'||f.state==='opp'&&now-f.t0<250)continue;const hy=f.y+1.18*f.s,by=f.y+0.62*f.s;
        const dh=Math.hypot(p1.x-f.x,p1.y-hy,p1.z-f.z),db=Math.hypot(p1.x-f.x,(p1.y-by)*0.8,p1.z-f.z);
        if(dh<0.25*f.s){treff(f,true);ferdig=true;break}if(db<0.42*f.s){treff(f,false);ferdig=true;break}}}
    else if(G.on&&!G.paused){_eye.copy(camera.position);_eye.y-=0.35;const d=Math.hypot(p1.x-_eye.x,(p1.y-_eye.y)*0.7,p1.z-_eye.z);if(d<0.36){blittTruffet();rusk(p1,10,2,1);ferdig=true}}
    if(!ferdig){const h=ballTreffer(b,p0,p1);if(h){rusk(h,9,2.2,1);const dd=h.distanceTo(camera.position);if(dd<25)sfxPoff(0.3*Math.max(0.15,1-dd/25));ferdig=true}}
    if(ferdig||b.t>6){EN.remove(b.m);SNO.B.splice(i,1)}else b.m.position.copy(p1)}
  for(let i=SNO.R.length-1;i>=0;i--){const r=SNO.R[i];r.t+=dt;r.v.y-=GR*dt;r.m.position.addScaledVector(r.v,dt);r.m.rotation.x+=r.rv*dt;r.m.rotation.z+=r.rv*0.7*dt;
    const g=groundH(r.m.position.x,r.m.position.z);if(g!=null&&r.m.position.y<g+(r.stor?0.08:0.01)&&!inHouse(r.m.position.x,r.m.position.z)){r.m.position.y=g+(r.stor?0.08:0.01);r.v.multiplyScalar(0.35);r.v.y=Math.abs(r.v.y)*0.2}
    const k=r.t/r.life;if(k>0.6)r.m.scale.multiplyScalar(Math.pow(0.02,dt*1.8));if(k>=1){EN.remove(r.m);SNO.R.splice(i,1)}}}
function snoStep(dt,now){const d=DIFF[G.diff],c=camera.position;
  SNO.tid-=dt;$('gTime').textContent=fmtT(Math.ceil(SNO.tid));$('gTime').classList.toggle('warn',SNO.tid<15);if(SNO.tid<=0){SNO.tid=0;sluttSno('tid');return}
  // spillerens fart (for å sikte foran deg)
  SNO.vel.subVectors(wp,SNO.forrige).divideScalar(Math.max(dt,1e-3));SNO.forrige.copy(wp);if(SNO.vel.length()>12)SNO.vel.set(0,0,0);
  if(now>=SNO.kastKlar&&!handBall.visible)handBall.visible=true;
  if(SNO.skjelv>0){SNO.skjelv-=dt;camera.position.x+=(Math.random()-0.5)*SNO.skjelv*0.15;camera.position.y+=(Math.random()-0.5)*SNO.skjelv*0.15}
  // nye snømenn – flere etter hvert
  const levende=SNO.F.filter(f=>f.state!=='dod').length,maks=d.maks+(SNO.tid<60?1:0)+(SNO.tid<25?1:0);
  if(levende<maks&&now>SNO.nesteSpawn){spawnFiende(now);SNO.nesteSpawn=now+d.spawn*1000*(0.6+Math.random()*0.7)}
  for(let i=SNO.F.length-1;i>=0;i--){const f=SNO.F[i],g=f.g;if(f.state==='dod'){SNO.F.splice(i,1);continue}
    const dx=c.x-f.x,dz=c.z-f.z,dist=Math.hypot(dx,dz);g.rotation.y=Math.atan2(dx,dz);
    if(f.state==='opp'){const k=Math.min(1,(now-f.t0)/550);g.scale.set(f.s,f.s*(k<1?k*(1.15-0.15*k):1),f.s);if(k>=1)f.state='klar';continue}
    g.position.y=f.y-0.04+Math.abs(Math.sin(now/240+f.ph))*0.03;
    const hb=g.getObjectByName('handball');
    if(now>f.neste-450&&now<f.neste){const k=(now-(f.neste-450))/450;g.rotation.x=-0.12*Math.sin(k*Math.PI)}else g.rotation.x=0;
    if(now>=f.neste){f.neste=now+(d.mell[0]+Math.random()*(d.mell[1]-d.mell[0]))*1000;
      if(dist<28&&!(inHouse(c.x,c.z,-0.05))){g.updateMatrixWorld(true);const st=hb?hb.getWorldPosition(new THREE.Vector3()):new THREE.Vector3(f.x,f.y+1.2,f.z);
        const t=Math.max(0.35,dist/d.fart),mal=new THREE.Vector3(c.x,c.y-0.3,c.z).addScaledVector(SNO.vel,t*0.7);
        const e=d.feil*(0.4+dist/14);mal.x+=(Math.random()-0.5)*2*e;mal.y+=(Math.random()-0.5)*e*0.8;mal.z+=(Math.random()-0.5)*2*e;
        const v=mal.sub(st).divideScalar(t);v.y+=0.5*GR*t;kastBall(st,v,'fiende');if(hb){hb.visible=false;setTimeout(()=>{hb.visible=true},700)}
        if(dist<20)sus(700,1800,0.15,0.12*Math.max(0.2,1-dist/20),1.2)}}}}

/* =====================================================================
   Spill 3: Akebakke – ak ned hagen på det ekte terrenget (dronemålingen),
   gjennom portene og forbi pakkene. Fysikken bruker helningen i terrenget.
   ===================================================================== */
// løypa: fra plenen nord i hagen, ned bakkekanten og forbi vest for huset, ned til gjerdet mot sør
const RUTE=[[21.6,-10.8],[17,-11.7],[13,-12.6],[9,-13.5],[4,-14],[0,-14],[-4,-14.5],[-8,-13.5],[-12.5,-14]];
// platået øverst i hagen er nesten flatt, så starten er en oppbygd snøhaug som gir fart ned mot bakkekanten
const RAMP={ax:22.6,az:-10.6,bx:16.9,bz:-11.75,H:1.9,w:1.15,f:1.3};{const dx=RAMP.bx-RAMP.ax,dz=RAMP.bz-RAMP.az;RAMP.L=Math.hypot(dx,dz);RAMP.ux=dx/RAMP.L;RAMP.uz=dz/RAMP.L}
function rampOff(x,z){const s=(x-RAMP.ax)*RAMP.ux+(z-RAMP.az)*RAMP.uz,l=Math.abs(-(x-RAMP.ax)*RAMP.uz+(z-RAMP.az)*RAMP.ux);if(s>RAMP.L||s<-2.6||l>RAMP.w+RAMP.f)return 0;
  let h=s>=0?RAMP.H*Math.pow(1-s/RAMP.L,1.35):s>-1.2?RAMP.H:RAMP.H*Math.max(0,1-(-1.2-s)/1.4);const k=l<=RAMP.w?1:1-(l-RAMP.w)/RAMP.f;return h*(k*k*(3-2*k))}
const AK={on:false,state:'klar',x:0,z:0,y:0,vy:0,vx:0,vz:0,psi:0,luft:false,tid:0,straff:0,bonus:0,porter:[],pakker:[],keys:{},telle:0,still:0,skjelv:0,last:null,camP:new THREE.Vector3(),camL:new THREE.Vector3(),stoy:null,fart:0};
const AKG=new THREE.Group();AKG.name='akebakke';AKG.visible=false;scene.add(AKG);
const gH=(x,z)=>{const h=groundH(x,z);return h==null?null:h+0.03+rampOff(x,z)};
// kjelke med en liten aker
function lagKjelke(){const g=new THREE.Group(),tilt=new THREE.Group();g.add(tilt);
  const pl=std(0xd8262f,{roughness:.45}),pl2=std(0xa81c24,{roughness:.5});
  const bunn=new THREE.Mesh(new THREE.BoxGeometry(0.95,0.05,0.5),pl);bunn.position.y=0.06;tilt.add(bunn);
  const nese=new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.25,0.5,20,1,false,0,Math.PI/2),pl);nese.rotation.x=Math.PI/2;nese.rotation.z=Math.PI;nese.position.set(0.47,0.31,0);nese.scale.set(1,1,1);tilt.add(nese);
  [-1,1].forEach(s=>{const k=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.09,0.04),pl2);k.position.set(0,0.1,s*0.25);tilt.add(k);
    const h=new THREE.Mesh(new THREE.TorusGeometry(0.06,0.015,8,16,Math.PI),std(0x1c1c1e));h.position.set(-0.05,0.15,s*0.27);tilt.add(h)});
  const jakke=std(0x2b6cc4,{roughness:.8}),bukse=std(0x1d2a44,{roughness:.85}),hud=std(0xf0c2a0,{roughness:.7}),lue=std(0xe23b3b,{roughness:.7}),hvit=std(0xf7f5ef);
  const kropp=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.16,0.42,16),jakke);kropp.position.set(-0.18,0.32,0);kropp.rotation.z=0.25;tilt.add(kropp);
  [-1,1].forEach(s=>{const b=new THREE.Mesh(new THREE.CylinderGeometry(0.065,0.06,0.5,10),bukse);b.rotation.z=Math.PI/2-0.15;b.position.set(0.12,0.14,s*0.09);tilt.add(b);
    const st=new THREE.Mesh(new THREE.BoxGeometry(0.14,0.09,0.1),std(0x222222));st.position.set(0.38,0.17,s*0.09);tilt.add(st);
    const a=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,0.36,10),jakke);a.rotation.z=Math.PI/2+0.5;a.position.set(-0.02,0.34,s*0.17);tilt.add(a);
    const v=new THREE.Mesh(new THREE.SphereGeometry(0.05,10,8),lue);v.position.set(0.13,0.26,s*0.2);tilt.add(v)});
  const hode=new THREE.Mesh(new THREE.SphereGeometry(0.11,16,12),hud);hode.position.set(-0.24,0.62,0);tilt.add(hode);
  const l=new THREE.Mesh(new THREE.ConeGeometry(0.115,0.22,16),lue);l.position.set(-0.27,0.75,0);l.rotation.z=0.5;tilt.add(l);
  const d=new THREE.Mesh(new THREE.SphereGeometry(0.04,10,8),hvit);d.position.set(-0.36,0.83,0);tilt.add(d);
  const sk=new THREE.Mesh(new THREE.TorusGeometry(0.1,0.035,8,18),std(0xf1c75b));sk.rotation.x=Math.PI/2;sk.position.set(-0.22,0.5,0);tilt.add(sk);
  g.traverse(o=>{if(o.isMesh)o.castShadow=true});g.userData.tilt=tilt;return g}
const KJ=lagKjelke();AKG.add(KJ);
// selve snøhaugen
{const ns=40,nl=24,pos=[],idx=[],s0=-2.7,s1=RAMP.L+0.1,lw=RAMP.w+RAMP.f+0.1;for(let i=0;i<=ns;i++)for(let j=0;j<=nl;j++){const s=s0+(s1-s0)*i/ns,l=-lw+2*lw*j/nl,x=RAMP.ax+RAMP.ux*s-RAMP.uz*l,z=RAMP.az+RAMP.uz*s+RAMP.ux*l,g=groundH(x,z)??0,o=rampOff(x,z);pos.push(x,g+o+(o>0.01?0.025:-0.03),z)}
  for(let i=0;i<ns;i++)for(let j=0;j<nl;j++){const a=i*(nl+1)+j;idx.push(a,a+1,a+nl+2,a,a+nl+2,a+nl+1)}
  const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));gg.setIndex(idx);gg.computeVertexNormals();
  const m=new THREE.Mesh(gg,new THREE.MeshStandardMaterial({color:0xf3f7fc,roughness:.95,emissive:0x3c4656,side:THREE.DoubleSide}));m.receiveShadow=true;AKG.add(m)}
// porter (stolper med flagg) og pakker
function lagPort(i){const[a,b]=RUTE[i],[c,d]=RUTE[i+1]||RUTE[i],[p,q]=RUTE[i-1];const dx=(c-p),dz=(d-q),L=Math.hypot(dx,dz),ux=dx/L,uz=dz/L,w=1.75;
  const g=new THREE.Group(),farge=i%2?0x2a5fd4:0xd8262f,fm=std(farge,{roughness:.5,emissive:farge,emissiveIntensity:.18});
  [-1,1].forEach(s=>{const x=a-uz*w*s,z=b+ux*w*s,y=gH(x,z)??0;const st=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,1.4,8),std(0xf2f2f2));st.position.set(x,y+0.7,z);g.add(st);
    const fl=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.32,0.5),fm);fl.position.set(x,y+1.18,z);fl.rotation.y=Math.atan2(ux,uz)+Math.PI/2;fl.translateZ(0.26*s);g.add(fl)});
  AKG.add(g);return{g,x:a,z:b,ux,uz,w,ferdig:false,fm}}
function lagPakke(x,z,c){const g=new THREE.Group(),y=gH(x,z)??0,b=new THREE.Mesh(new THREE.BoxGeometry(0.34,0.3,0.34),std(c,{roughness:.5,emissive:c,emissiveIntensity:.15}));b.position.y=0.15;g.add(b);
  const bm=std(0xf1d27a,{roughness:.3,metalness:.3}),r1=new THREE.Mesh(new THREE.BoxGeometry(0.35,0.31,0.06),bm),r2=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.31,0.35),bm);r1.position.y=r2.position.y=0.15;g.add(r1,r2);
  g.position.set(x,y+0.12,z);AKG.add(g);return{g,x,z,y,tatt:false,ph:Math.random()*6}}
// startplan og mål
const MAL=(()=>{const[a,b]=RUTE[RUTE.length-1],g=new THREE.Group();for(let k=-3;k<=3;k++){const z=b+k*0.9,y=gH(a,z)??0;const m=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.03,0.45),std(k%2?0x111111:0xf4f4f4,{roughness:.8}));m.position.set(a,y+0.02,z);g.add(m)}
  [-1,1].forEach(s=>{const z=b+s*3.4,y=gH(a,z)??0,st=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,2.4,10),std(0xd8262f));st.position.set(a,y+1.2,z);g.add(st)});
  const ban=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.45,6.8),std(0xf4f4f4,{emissive:0x333333}));ban.position.set(a,(gH(a,b)??0)+2.2,b);g.add(ban);
  const c=document.createElement('canvas');c.width=512;c.height=64;const x=c.getContext('2d');x.fillStyle='#d8262f';x.fillRect(0,0,512,64);x.fillStyle='#fff';x.font='bold 40px Inter,Arial';x.textAlign='center';x.textBaseline='middle';x.fillText('MÅL',256,34);
  const tm=new THREE.Mesh(new THREE.PlaneGeometry(6.6,0.42),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c)}));tm.rotation.y=Math.PI/2;tm.position.set(a+0.03,(gH(a,b)??0)+2.2,b);g.add(tm);
  const tm2=tm.clone();tm2.rotation.y=-Math.PI/2;tm2.position.x=a-0.03;g.add(tm2);
  AKG.add(g);return{x:a,z:b}})();
AK.porter=RUTE.slice(1,-1).map((_,k)=>lagPort(k+1));
AK.pakker=[[18.6,-11.6,0xd8262f],[15.2,-12.0,0x2a5fd4],[11.3,-13.6,0x1f8a4c],[6.5,-13.2,0xd8a531],[2,-14.6,0x7b2a8c],[-2,-13.6,0xd8262f],[-6.2,-14.7,0x2a5fd4],[-10.3,-13.3,0x1f8a4c]].map(([x,z,c])=>lagPakke(x,z,c));
// løypa merkes med små lykter langs kanten
RUTE.forEach(([a,b],i)=>{if(i===0||i===RUTE.length-1)return;});
// lyd: glidelyd som følger farten
function akeLyd(on){const a=ac();if(!a)return;if(on&&!AK.stoy){const s=a.createBufferSource();s.buffer=stoy();s.loop=true;const f=a.createBiquadFilter();f.type='bandpass';f.frequency.value=900;f.Q.value=0.6;const g=a.createGain();g.gain.value=0;s.connect(f);f.connect(g);g.connect(a.destination);s.start();AK.stoy={s,f,g}}
  if(!on&&AK.stoy){try{AK.stoy.s.stop()}catch(e){}AK.stoy=null}}
const sfxPort=()=>{const a=ac();if(!a)return;const t=a.currentTime;tone(988,t,0.18,0.12,'triangle');tone(1319,t+0.07,0.25,0.12,'triangle')};
const sfxBom=()=>{const a=ac();if(!a)return;const t=a.currentTime;tone(220,t,0.3,0.14,'sawtooth');tone(180,t+0.1,0.3,0.12,'sawtooth')};
const sfxPakke=()=>{const a=ac();if(!a)return;const t=a.currentTime;[1047,1319,1568].forEach((f,i)=>{tone(f,t+i*0.05,0.25,0.1,'triangle');bjelle(t+i*0.05,0.04)})};
// spillflyt
function akeTilStart(){const[a,b]=RUTE[0],[c,d]=RUTE[1];AK.x=a;AK.z=b;AK.y=gH(a,b);AK.vy=0;AK.vx=0;AK.vz=0;AK.psi=Math.atan2(d-b,c-a);AK.luft=false;AK.tid=0;AK.straff=0;AK.bonus=0;AK.still=0;
  AK.porter.forEach(p=>{p.ferdig=false;p.g.children.forEach(o=>{if(o.material===p.fm)o.visible=true})});AK.pakker.forEach(p=>{p.tatt=false;p.g.visible=true;p.g.scale.setScalar(1)});
  AK.state='telle';AK.telle=3.2;AK.camP.set(a-Math.cos(AK.psi)*4,AK.y+2,b-Math.sin(AK.psi)*4);AK.camL.set(a,AK.y+0.5,b);akeHud()}
function akeHud(){$('gPort').innerHTML=`<span class="gSI">⛳</span><b>${AK.porter.filter(p=>p.ferdig==='ok').length}</b><span>/ ${AK.porter.length}</span>`;$('gPak').innerHTML=`<span class="gSI">🎁</span><b>${AK.pakker.filter(p=>p.tatt).length}</b><span>/ ${AK.pakker.length}</span>`}
function startAke(){snoRydd();pakkeRydd();stromRydd();nyeRydd();NIS.forEach(o=>NG.remove(o.g));NIS.length=0;G.mode='ake';ui.dataset.mode='ake';ac();ui.classList.add('playing');$('gMenu').hidden=true;$('gDone').hidden=true;$('gPause').hidden=true;$('gHud').hidden=false;
  if(walkOn)walkStop();controls.autoRotate=false;setLevel('A');tidSett();AKG.visible=true;
  tDrone.setAttribute('aria-pressed','false');applyDrone();   // ren snøbakke: dronemodellens busker og trær tas bort i akebakken
  camera.fov=68;camera.updateProjectionMatrix();G.fov=68;
  G.on=true;G.ending=false;G.paused=false;AK.keys={};akeTilStart();akeLyd(true);toast('Gjør deg klar …')}
function akeRydd(){if(AKG.visible){tDrone.setAttribute('aria-pressed','true');applyDrone()}AKG.visible=false;akeLyd(false);AK.state='klar'}
function akeMal(){AK.state='mal';const tot=AK.tid+AK.straff-AK.bonus,k='ake-best',b=LS.get(k,null),rek=b==null||tot<b;if(rek)LS.set(k,tot);sfxSlutt();
  const miss=AK.porter.filter(p=>p.ferdig!=='ok').length,pk=AK.pakker.filter(p=>p.tatt).length;
  G.ending=true;setTimeout(()=>{if(G.mode!=='ake'||AK.state!=='mal')return;G.on=false;G.paused=true;
    $('gDK').textContent='I mål!';$('gDT').textContent=fmtT2(tot);
    $('gDInfo').innerHTML=(rek?'<b>Ny rekord!</b> ':`Rekorden er ${fmtT2(b)}. `)+`Kjøretid ${fmtT2(AK.tid)}`+(miss?`, ${miss} port${miss>1?'er':''} bom (+${miss*3} s)`:', alle portene')+(pk?`, ${pk} pakke${pk>1?'r':''} (−${(pk*0.3).toFixed(1).replace('.',',')} s)`:'')+(AK.straff-miss*3>0?`, krasj (+${AK.straff-miss*3} s)`:'')+'.';
    $('gDone').hidden=false},1600)}
function fmtT2(s){s=Math.max(0,s);const m=Math.floor(s/60),r=s-m*60;return(m?m+':'+(r<10?'0':''):'')+r.toFixed(1).replace('.',',')+(m?'':' s')}
// tastatur og knapper
addEventListener('keydown',e=>{if(G.mode!=='ake'||!G.on)return;if(e.code==='Escape'){gamePause();return}if(G.paused)return;AK.keys[e.code]=true;
  if(e.code==='KeyR'){akeTilStart();toast('Ny tur!')}if(e.code==='KeyM')$('gMusB').click();if(/^Arrow|Space/.test(e.code))e.preventDefault()});
addEventListener('keyup',e=>{AK.keys[e.code]=false});
const holdBtn=(id,code)=>{const b=$(id);const on=e=>{e.preventDefault();AK.keys[code]=true;b.classList.add('on')},off=()=>{AK.keys[code]=false;b.classList.remove('on')};
  b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off)};
// fysikk
const AG=9.8;
function akeFys(dt){const K=c=>!!AK.keys[c];
  const steer=(K('KeyA')||K('ArrowLeft')?1:0)-(K('KeyD')||K('ArrowRight')?1:0),brems=K('KeyS')||K('ArrowDown'),skyv=K('KeyW')||K('ArrowUp');
  const fx=Math.cos(AK.psi),fz=Math.sin(AK.psi),lx=-fz,lz=fx;let vf=AK.vx*fx+AK.vz*fz,vl=AK.vx*lx+AK.vz*lz;
  const sp=Math.hypot(AK.vx,AK.vz);
  // styring: kjelken svinger lettere i fart, men litt også i ro
  AK.psi-=steer*dt*(0.9+Math.min(1.1,sp*0.18))*(vf<0?-1:1);
  const h=gH(AK.x,AK.z);
  if(!AK.luft){const e=0.35,hx=((gH(AK.x+e,AK.z)??h)-(gH(AK.x-e,AK.z)??h))/(2*e),hz=((gH(AK.x,AK.z+e)??h)-(gH(AK.x,AK.z-e)??h))/(2*e),n2=1+hx*hx+hz*hz;
    const ax=-AG*hx/n2,az=-AG*hz/n2;vf+=(ax*fx+az*fz)*dt;vl+=(ax*lx+az*lz)*dt;
    const mu=brems?0.42:0.022;const fr=mu*AG*dt;vf=Math.abs(vf)<=fr?0:vf-Math.sign(vf)*fr;vf-=0.01*vf*Math.abs(vf)*dt;
    if(skyv&&vf<3.2)vf+=2.6*dt;
    vl*=Math.exp(-dt*(brems?9:steer?3.2:6));   // sidegrep (litt skrens i svingene)
    if(K('Space')&&!AK.hoppT){AK.vy=Math.max(AK.vy,2.6);AK.luft=true;AK.hoppT=true;AK.y+=0.02}
  }else{vf-=0.004*vf*Math.abs(vf)*dt}
  if(!K('Space'))AK.hoppT=false;
  AK.vx=fx*vf+lx*vl;AK.vz=fz*vf+lz*vl;
  let nx=AK.x+AK.vx*dt,nz=AK.z+AK.vz*dt;
  // kollisjon: hus, garasje og kanten av målingen
  const hindr=(x,z)=>inHouse(x,z,0.45)||(x>12.9&&x<20.1&&z>1.95&&z<8.7)||gH(x,z)==null;
  if(hindr(nx,nz)){const bx=hindr(nx,AK.z),bz=hindr(AK.x,nz);if(bx)AK.vx*=-0.35;if(bz)AK.vz*=-0.35;if(!bx&&!bz){AK.vx*=-0.35;AK.vz*=-0.35}
    if(sp>3.5){AK.straff+=2;toast('Krasj! +2 s');sfxBom();AK.skjelv=0.5}nx=AK.x;nz=AK.z}
  const hn=gH(nx,nz)??h;
  if(AK.luft){AK.vy-=AG*dt;AK.y+=AK.vy*dt;if(AK.y<=hn){const slag=AK.vy-(hn-h)/dt;AK.y=hn;AK.luft=false;AK.vy=(hn-h)/dt;if(slag<-5){AK.skjelv=Math.min(0.6,-slag*0.06);sus(600,150,0.25,0.4,0.7,'lowpass')}}}
  else{const yb=AK.y+AK.vy*dt-AG*dt*dt*0.5;if(yb>hn+0.06&&AK.vy>0.6){AK.luft=true;AK.vy-=AG*dt;AK.y=yb}else{const nvy=(hn-AK.y)/dt;AK.vy=AK.vy+(nvy-AK.vy)*Math.min(1,dt*25);AK.y=hn}}
  // porter: kryss planet gjennom porten
  for(const p of AK.porter){if(p.ferdig)continue;const s0=(AK.x-p.x)*p.ux+(AK.z-p.z)*p.uz,s1=(nx-p.x)*p.ux+(nz-p.z)*p.uz;
    if(s0<0&&s1>=0){const t=s0/(s0-s1),cx=AK.x+(nx-AK.x)*t,cz=AK.z+(nz-AK.z)*t,lat=Math.abs((cx-p.x)*-p.uz+(cz-p.z)*p.ux);
      if(lat<=p.w){p.ferdig='ok';sfxPort();p.g.children.forEach(o=>{if(o.material===p.fm)o.visible=false})}else{p.ferdig='bom';AK.straff+=3;toast('Port bom! +3 s');sfxBom()}akeHud()}}
  AK.x=nx;AK.z=nz;
  for(const p of AK.pakker){if(p.tatt)continue;if(Math.hypot(p.x-AK.x,p.z-AK.z)<1.05&&Math.abs(p.y-AK.y)<1.2){p.tatt=true;p.tT=AK.tid;AK.bonus+=0.3;sfxPakke();toast('Pakke! −0,3 s');akeHud()}}
  if(AK.x<MAL.x&&AK.state==='kjor'){akeMal()}
  AK.fart=Math.hypot(AK.vx,AK.vz)}
const _f=new THREE.Vector3();
function akeStep(dt,now){
  if(AK.state==='telle'){const før=Math.ceil(AK.telle);AK.telle-=dt;const nå=Math.ceil(AK.telle);if(nå!==før&&nå>0){toast(String(nå));const a=ac();if(a)tone(660,a.currentTime,0.2,0.12,'triangle')}
    if(AK.telle<=0){AK.state='kjor';toast('Kjør!');const a=ac();if(a)tone(1320,a.currentTime,0.35,0.14,'triangle');AK.vx=Math.cos(AK.psi)*1.2;AK.vz=Math.sin(AK.psi)*1.2}}
  else if(AK.state==='kjor'||AK.state==='mal'){const n=Math.ceil(dt/0.008),h=dt/n;for(let i=0;i<n;i++)akeFys(h);if(AK.state==='kjor')AK.tid+=dt;
    if(AK.state==='kjor'){if(AK.fart<0.25&&!AK.luft){AK.still+=dt;if(AK.still>2.5&&AK.still-dt<=2.5)toast(isTouch?'Trykk Skyv for å skyve':'Trykk W for å skyve')}else AK.still=0}
    if(AK.state==='mal'){AK.vx*=Math.exp(-dt*1.5);AK.vz*=Math.exp(-dt*1.5)}}
  $('gTime').textContent=AK.state==='telle'?'0,0 s':fmtT2(AK.tid+AK.straff-AK.bonus);
  // kjelken følger terrenget
  const e=0.45,fx=Math.cos(AK.psi),fz=Math.sin(AK.psi),hF=gH(AK.x+fx*e,AK.z+fz*e)??AK.y,hB=gH(AK.x-fx*e,AK.z-fz*e)??AK.y,hL=gH(AK.x-fz*0.3,AK.z+fx*0.3)??AK.y,hR=gH(AK.x+fz*0.3,AK.z-fx*0.3)??AK.y;
  KJ.position.set(AK.x,AK.y,AK.z);KJ.rotation.y=-AK.psi;const tl=KJ.userData.tilt;
  const pt=AK.luft?tl.rotation.z+(Math.atan2(AK.vy,Math.max(1,AK.fart))*0.6-tl.rotation.z)*Math.min(1,dt*4):Math.atan2(hF-hB,2*e);tl.rotation.z+=(pt-tl.rotation.z)*Math.min(1,dt*12);
  const rl=Math.atan2(hL-hR,0.6)*0.8;tl.rotation.x+=(-rl-tl.rotation.x)*Math.min(1,dt*10);
  // snøsprut fra meiene
  if(AK.fart>3&&!AK.luft&&Math.random()<dt*AK.fart*2.5)rusk(_f.set(AK.x-fx*0.45,AK.y+0.05,AK.z-fz*0.45),2,1.2,0.6);
  // pakkene snurrer
  AK.pakker.forEach(p=>{if(p.tatt){const k=(AK.tid-p.tT)/0.5;if(k>=1)p.g.visible=false;else{p.g.position.y=p.y+0.12+k*0.8;p.g.scale.setScalar(1-k*0.8)}return}p.g.rotation.y+=dt*1.2;p.g.position.y=p.y+0.12+Math.sin(now/400+p.ph)*0.05});
  // kamera bak kjelken
  const back=3.3+Math.min(1.2,AK.fart*0.08),up=1.55;const tx=AK.x-fx*back,tz=AK.z-fz*back;let ty=AK.y+up;const gc=gH(tx,tz);if(gc!=null)ty=Math.max(ty,gc+0.8);
  AK.camP.x+=(tx-AK.camP.x)*Math.min(1,dt*5);AK.camP.z+=(tz-AK.camP.z)*Math.min(1,dt*5);AK.camP.y+=(ty-AK.camP.y)*Math.min(1,dt*4);
  AK.camL.x+=(AK.x+fx*2.6-AK.camL.x)*Math.min(1,dt*8);AK.camL.z+=(AK.z+fz*2.6-AK.camL.z)*Math.min(1,dt*8);AK.camL.y+=(AK.y+0.45-AK.camL.y)*Math.min(1,dt*6);
  camera.position.copy(AK.camP);if(AK.skjelv>0){AK.skjelv-=dt;camera.position.x+=(Math.random()-0.5)*AK.skjelv*0.2;camera.position.y+=(Math.random()-0.5)*AK.skjelv*0.2}
  camera.lookAt(AK.camL);const tf=68+Math.min(14,AK.fart*1.4);camera.fov+=(tf-camera.fov)*Math.min(1,dt*3);camera.updateProjectionMatrix();
  if(AK.stoy){const a=ac();if(a){const v=AK.luft?0:Math.min(0.28,AK.fart*0.035);AK.stoy.g.gain.setTargetAtTime(v,a.currentTime,0.05);AK.stoy.f.frequency.setTargetAtTime(500+AK.fart*120,a.currentTime,0.1)}}}

holdBtn('aV','ArrowLeft');holdBtn('aH','ArrowRight');holdBtn('aSkyv','ArrowUp');holdBtn('aBrems','ArrowDown');holdBtn('aHopp','Space');
/* =====================================================================
   Spill 4: Pakkelevering – hent pakker ved juletreet og lever dem i riktig rom
   Spill 5: Strømbrudd – finn sikringsskapet i mørket, finn feilen og få lyset tilbake
   ===================================================================== */
const LVK={B:'kjeller',G:'1. etg',U:'2. etg'};
const romNavn=r=>r.id==='veranda'?'Verandaen':r.name+' · '+LVK[r.lv];
const romP=r=>{if(r.lp)return r.lp;let x=0,z=0;r.poly.forEach(p=>{x+=p[0];z+=p[1]});return[x/r.poly.length,z/r.poly.length]};
const iRom=(r,x,y,z)=>pip(r.poly,x,z)&&(r.id==='veranda'?y>-0.6&&y<1.5:lvOf(y)===r.lv);
function hudPil(tx,ty,tz,navn){const c=camera.position,a=yawTo(c.x,c.z,tx,tz)-wyaw,dist=Math.hypot(tx-c.x,tz-c.z);$('gHint').hidden=false;$('gArrow').style.transform=`rotate(${(-a*180/Math.PI)-90}deg)`;
  const tl=inHouse(tx,tz)?lvOf(ty):null,ml=inHouse(c.x,c.z)?lvOf(wp.y):null,o={B:0,G:1,U:2};
  $('gHintTxt').textContent=navn+' · '+Math.round(dist)+' m'+(tl&&ml&&tl!==ml?(o[tl]>o[ml]?' · opp':' · ned'):tl&&!ml&&tl!=='G'?(o[tl]>1?' · opp':' · ned'):'')}
function gåStart(mode){snoRydd();akeRydd();pakkeRydd();stromRydd();nyeRydd();NIS.forEach(o=>NG.remove(o.g));NIS.length=0;G.mode=mode;ui.dataset.mode=mode;ac();ui.classList.add('playing');
  $('gMenu').hidden=true;$('gDone').hidden=true;$('gPause').hidden=true;$('gHud').hidden=false;controls.autoRotate=false;tidSett();if(walkOn)walkStop();walkStart();
  G.on=true;G.ending=false;G.paused=false;G.sprintTouch=false;$('gSprB').classList.remove('on');wkeys={};if(!isTouch)lock();
  setTimeout(()=>{if(!isTouch&&document.pointerLockElement!==cv&&G.on&&!G.paused)$('gClick').hidden=false},600)}

/* ---------------- Pakkelevering ---------------- */
const PK={liste:[],sekk:[],levert:0,tid:0,levertG:[],pil:LS.get('pakke-pil',true),N:LS.get('pakke-n',10)};
const PKF=[0xd8262f,0x2a5fd4,0x1f8a4c,0xd8a531,0x7b2a8c,0xe86f2c,0x2aa3a8];
const SEKK=(()=>{const g=new THREE.Group(),y=groundH(JT.x-1.3,JT.z+0.9)??0;const s=new THREE.Mesh(new THREE.SphereGeometry(0.42,18,14),std(0xb3262b,{roughness:.85}));s.scale.set(1,1.15,0.9);s.position.y=0.42;g.add(s);
  const h=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.2,0.22,14),std(0xb3262b,{roughness:.85}));h.position.y=0.92;g.add(h);
  const t=new THREE.Mesh(new THREE.TorusGeometry(0.12,0.025,8,16),std(0xf1d27a,{roughness:.4,metalness:.3}));t.rotation.x=Math.PI/2;t.position.y=0.86;g.add(t);
  const ring=new THREE.Mesh(new THREE.RingGeometry(1.6,1.9,48),new THREE.MeshBasicMaterial({color:0xf1c75b,transparent:true,opacity:.55,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.set(1.3,0.06,-0.9);ring.name='ring';g.add(ring);
  g.position.set(JT.x-1.3,y,JT.z+0.9);g.visible=false;XM.add(g);return g})();
const vedTre=()=>Math.hypot(wp.x-JT.x,wp.z-JT.z)<2.6&&!inHouse(wp.x,wp.z);
function pakkeHud(){$('gPkN').innerHTML=`<span class="gSI">🎁</span><b>${PK.levert}</b><span>/ ${PK.liste.length}</span>`;
  $('gSekk').innerHTML='<div class="gSH">I sekken</div>'+(PK.sekk.length?PK.sekk.map(p=>`<div class="gSR"><i style="background:#${p.c.toString(16).padStart(6,'0')}"></i>${romNavn(p.r)}</div>`).join(''):`<div class="gSR tom">${PK.levert<PK.liste.length?'Tom – hent flere ved juletreet':'Alt er levert!'}</div>`)}
function fyllSekk(){const igjen=PK.liste.filter(p=>!p.levert&&!p.iSekk);let n=0;while(PK.sekk.length<3&&igjen.length){const p=igjen.shift();p.iSekk=true;PK.sekk.push(p);n++}
  if(n){const a=ac();if(a){const t=a.currentTime;bjelle(t,0.08);bjelle(t+0.12,0.06)}toast(n===1?'1 pakke i sekken':`${n} pakker i sekken`);pakkeHud()}}
function lagGave(c){const g=new THREE.Group(),b=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.24,0.3),std(c,{roughness:.55}));b.position.y=0.12;g.add(b);
  const bm=std(0xf1d27a,{roughness:.35,metalness:.3}),r1=new THREE.Mesh(new THREE.BoxGeometry(0.31,0.25,0.05),bm),r2=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.25,0.31),bm);r1.position.y=r2.position.y=0.12;g.add(r1,r2);
  [0.7,-0.7].forEach(a=>{const l=new THREE.Mesh(new THREE.TorusGeometry(0.04,0.011,6,12),bm);l.position.set(Math.sign(a)*0.03,0.27,0);l.rotation.set(0,a,Math.PI/2);g.add(l)});return g}
function lever(p){p.levert=true;PK.sekk=PK.sekk.filter(q=>q!==p);PK.levert++;sfxFunnet();
  const sm=smaObj();let pos=null;for(let i=0;i<30&&!pos;i++){const q=rndIn(p.r.poly);if(!q)continue;const y=wGround(q[0],(p.r.id==='veranda'?0:Y[p.r.lv])+0.3,q[1]);if(y>-50&&ledig(q[0],y,q[1],sm))pos=[q[0],y,q[1]]}
  if(!pos){const[x,z]=romP(p.r);pos=[x,wGround(x,(p.r.id==='veranda'?0:Y[p.r.lv])+0.3,z),z]}
  const g=lagGave(p.c);g.position.set(...pos);g.rotation.y=Math.random()*6;XM.add(g);PK.levertG.push({g,t:0});
  const igjen=PK.liste.length-PK.levert;toast(igjen?`Levert til ${p.r.name}!`:'Alle pakkene er levert!');pakkeHud();if(!igjen)pakkeFerdig()}
function startPakke(){gåStart('pakke');const rom=rooms.filter(r=>!r.custom&&r.poly&&!['b-trapp','kjtrapp','trapp','u-kott','u-balk'].includes(r.id));
  const L=[];let siste=null;for(let i=0;i<PK.N;i++){let r,k=0;do{r=rom[Math.floor(Math.random()*rom.length)];k++}while(k<20&&(r===siste||L.filter(p=>p.r===r).length>=2));siste=r;L.push({r,c:PKF[i%PKF.length],levert:false,iSekk:false})}
  Object.assign(PK,{liste:L,sekk:[],levert:0,tid:0});SEKK.visible=true;
  const sx=JT.x+3.4,sz=JT.z-3.0;wPlace(sx,sz,null,yawTo(sx,sz,JT.x-1.3,JT.z+0.9));wpitch=-0.05;fyllSekk();pakkeHud();toast(`Lever ${L.length} pakker!`)}
function pakkeRydd(){SEKK.visible=false;PK.levertG.forEach(o=>XM.remove(o.g));PK.levertG.length=0;PK.liste=[];PK.sekk=[]}
function pakkeFerdig(){G.ending=true;G.on=false;G.paused=true;sfxSlutt();if(document.pointerLockElement)document.exitPointerLock();
  const k='pakke-best-'+PK.liste.length,b=LS.get(k,null),rek=b==null||PK.tid<b;if(rek)LS.set(k,PK.tid);
  $('gDK').textContent='Alle pakkene er levert!';$('gDT').textContent=fmtT(PK.tid);$('gDInfo').innerHTML=(rek?'<b>Ny rekord!</b> ':`Rekorden er ${fmtT(b)}. `)+`${PK.liste.length} pakker levert.`;
  setTimeout(()=>{$('gDone').hidden=false},900)}
function pakkeStep(dt,now){PK.tid+=dt;$('gTime').textContent=fmtT(PK.tid);
  SEKK.getObjectByName('ring').material.opacity=0.35+0.25*Math.sin(now/300);
  if(vedTre()&&PK.sekk.length<3)fyllSekk();
  for(const p of [...PK.sekk])if(iRom(p.r,wp.x,wp.y,wp.z)){lever(p);if(!G.on)return}
  PK.levertG.forEach(o=>{if(o.t<1){o.t=Math.min(1,o.t+dt*2.5);const s=o.t<0.6?o.t/0.6*1.25:1.25-(o.t-0.6)/0.4*0.25;o.g.scale.setScalar(s)}});
  if(!PK.pil){$('gHint').hidden=true;return}
  if(PK.sekk.length){const c=camera.position;let best=null,bd=1e9;PK.sekk.forEach(p=>{const[x,z]=romP(p.r),y=p.r.id==='veranda'?0:Y[p.r.lv];const d=Math.hypot(x-c.x,z-c.z)+Math.abs(y-wp.y)*4;if(d<bd){bd=d;best={x,y,z,n:romNavn(p.r)}}});hudPil(best.x,best.y,best.z,best.n)}
  else if(PK.levert<PK.liste.length)hudPil(JT.x,groundH(JT.x,JT.z)??0,JT.z,'Juletreet');else $('gHint').hidden=true}

/* ---------------- Strømbrudd ---------------- */
const KURS=[{id:'-F1',navn:'Kjeller',rom:['b-stor','b-rom','b-gang','b-vask','b-bad','b-trapp']},
  {id:'-F2',navn:'Stue og TV-stue',rom:['stue','tvstue']},
  {id:'-F3',navn:'Kjøkken og spisestue',rom:['kjokken','spise']},
  {id:'-F4',navn:'Entré, gang, bad og trapper',rom:['entre','gang','bad','kjtrapp','trapp']},
  {id:'-F5',navn:'2. etasje',rom:['u-sov1','u-sov2','u-sov3','u-sov4','u-gang','u-kott','u-balk']},
  {id:'-F6',navn:'Utelys og julelys',rom:[],ute:'jul'},
  {id:'-F7',navn:'Garasje og utekontakt',rom:[],ute:'gar'}];
// vanskelighetsgrader
const SNIV={lett:{lure:0,navn:true,røyk:true,rek:1.5,sikt:false,batT:240,bat:3,vinkel:0.42,to:false,kand:[1,2,4,5,6]},
  middels:{lure:8,navn:false,røyk:false,rek:1.05,sikt:true,batT:200,bat:2,vinkel:0.42,to:false,kand:[0,1,2,3,4,5,6]},
  vanskelig:{lure:13,navn:false,røyk:false,rek:0.95,sikt:true,batT:150,bat:1,vinkel:0.3,to:true,kand:[0,1,2,3,4,5,6]}};
const SKAP={x:6.24,y:Y.B+1.25,z:5.84};
const ST={niv:LS.get('strom-niv','lett'),hoved:false,feil:null,fikset:false,tid:0,bat:100,mål:0,dev:[],bat3:[],skapÅpen:false,funnetFeil:false,prompt:null,led:null,
  ovnK:null,ovn:null,ovnAv:true,ovnT:0,utløst:{}};
KURS.forEach(k=>k.på=true);
const lommelykt=new THREE.SpotLight(0xfff2d8,0,16,0.42,0.55,1.4);lommelykt.position.set(0.12,-0.1,0);const lyktMål=new THREE.Object3D();lyktMål.position.set(0.08,-0.35,-5);camera.add(lommelykt);camera.add(lyktMål);lommelykt.target=lyktMål;
// lys i garasjen (bare i dette spillet)
const garLys=new THREE.PointLight(0xffe6c0,0,9,1.6);garLys.position.set(16.5,2.2,5.3);garLys.visible=false;scene.add(garLys);
const kursFor=it=>{if(it.userData.__k===undefined){const p=it.getWorldPosition(new THREE.Vector3()),lv=it.userData.lv||lvOf(p.y-2),r=rooms.find(r=>r.lv===lv&&!r.custom&&r.poly&&pip(r.poly,p.x,p.z));it.userData.__k=r?KURS.findIndex(k=>k.rom.includes(r.id)):-1}return it.userData.__k};
const harStrøm=i=>i>=0&&ST.hoved&&KURS[i].på;
function stromLys(){LYS.key=null;LYS.t=0;const på=KCOL[2700],av=new THREE.Color(0x2b2d30);
  items.forEach(it=>{const t=it.userData.t;if(t!=='downlight'&&t!=='cup')return;const on=!window.__lysAv||!window.__lysAv(it);it.traverse(o=>{if(o.name==='dlGlow')o.material.color.copy(on?på:av)})});
  const ute=!window.__lysAv||harStrøm(5);JUL.parts.forEach(p=>p.visible=ute);JUL.lights.forEach(l=>l.visible=ute);LYKTER.forEach(l=>l.visible=ute);lyktLys.visible=ute;
  garLys.intensity=window.__lysAv&&harStrøm(6)?1.4:0;
  if(ST.ovn){const på=harStrøm(ST.ovnK)&&!ST.ovnAv;ST.ovn.userData.lampe.material.color.set(på?0xff3b2f:0x3a1512)}}
// hvor kan ting stå? et tilfeldig sted på en kurs (rom inne, eller ute ved juletreet/verandaen/inngangen, eller ved garasjen)
function sted(ki){const k=KURS[ki],sm=smaObj();
  if(k.ute){for(let i=0;i<40;i++){let x,z;
      if(k.ute==='jul'){const v=Math.floor(Math.random()*4);
        if(v===0){const a=Math.random()*6.28,r=1.2+Math.random()*1.2;x=JT.x+Math.cos(a)*r;z=JT.z+Math.sin(a)*r}
        else if(v===1){x=-3.9-Math.random()*0.5;z=0.5+Math.random()*9.5}
        else if(v===2){x=W+T+0.9+Math.random()*1.5;z=7+Math.random()*4}
        else{x=-0.6+Math.random()*8;z=D+T+0.5+Math.random()*1.2}}
      else{const v=Math.random()<0.6;if(v){x=12.6-Math.random()*0.3;z=2.3+Math.random()*6}else{x=13.4+Math.random()*6.2;z=1.7-Math.random()*0.3}}
      if(inHouse(x,z,0.3))continue;const g0=groundH(x,z);if(g0==null)continue;const y=wGround(x,g0+0.3,z);if(!(y>g0-0.3&&y<g0+0.5))continue;if(!ledig(x,y,z,sm))continue;return[x,y,z]}
    return null}
  const rom=rooms.filter(r=>k.rom.includes(r.id)&&r.poly&&!['u-kott','u-balk'].includes(r.id));
  for(let i=0;i<60;i++){const r=rom[Math.floor(Math.random()*rom.length)],q=rndIn(r.poly);if(!q)continue;const y=wGround(q[0],Y[r.lv]+0.3,q[1]);if(Math.abs(y-Y[r.lv])<0.1&&ledig(q[0],y,q[1],sm))return[q[0],y,q[1]]}
  return null}
// kontakter og ledninger: skjøteledning, lader, julelysplugg, motorvarmer – feilen ser lik ut, men har et svimerke
function lagKontakt(type,feil,svStor){const g=new THREE.Group(),hvit=std(0xf2f2f2,{roughness:.6}),sort=std(0x1e1e20,{roughness:.6}),grønn=std(0x245c32,{roughness:.6}),oransje=std(0xe0741c,{roughness:.6});
  const kabM=type==='jul'?grønn:type==='motor'?oransje:type==='lader'?sort:hvit;let topY=0.06,pX=0.04;
  if(type==='skjøt'){const b=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.045,0.075),hvit);b.position.y=0.023;g.add(b);
    for(let i=0;i<3;i++){const h=new THREE.Mesh(new THREE.CircleGeometry(0.022,14),std(0xdadada));h.rotation.x=-Math.PI/2;h.position.set(-0.09+i*0.09,0.046,0);g.add(h)}topY=0.046;pX=0}
  else if(type==='lader'){const b=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.04,0.05),sort);b.position.y=0.02;g.add(b);topY=0.04;pX=0}
  else if(type==='jul'){const b=new THREE.Mesh(new THREE.BoxGeometry(0.09,0.05,0.06),grønn);b.position.y=0.025;g.add(b);topY=0.05;pX=0}
  else{const b=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.045,0.1,12),oransje);b.rotation.z=Math.PI/2;b.position.y=0.045;g.add(b);topY=0.09;pX=0}
  const pts=[];for(let i=0;i<14;i++)pts.push(new THREE.Vector3(-0.12-i*0.09,0.012,Math.sin(i*0.9+Math.random())*0.08));g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),40,type==='motor'?0.012:0.008,6),kabM));
  const plugg=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.045,0.04),type==='motor'?oransje:sort);plugg.position.set(pX,topY+0.022,0);g.add(plugg);plugg.name='plugg';
  if(feil){const sv=new THREE.Mesh(new THREE.CircleGeometry(svStor,16),new THREE.MeshBasicMaterial({color:0x140f0b,transparent:true,opacity:.8,depthWrite:false}));sv.rotation.x=-Math.PI/2;sv.position.set(pX+0.015,topY+0.002,0.01);g.add(sv);
    const gl=new THREE.PointLight(0x9fd0ff,0,3.5,2);gl.position.set(pX,0.15,0);g.add(gl);g.userData.gl=gl;
    const sp=[];for(let i=0;i<10;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(0.008,6,4),new THREE.MeshBasicMaterial({color:0xfff4c0,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));m.visible=false;g.add(m);sp.push({m,v:new THREE.Vector3(),t:1})}g.userData.sp=sp;
    const rk=[];for(let i=0;i<7;i++){const r=new THREE.Mesh(new THREE.SphereGeometry(0.05,8,6),new THREE.MeshBasicMaterial({color:0x9a9a9a,transparent:true,opacity:0,depthWrite:false}));r.userData.t=i/7;r.visible=false;g.add(r);rk.push(r)}g.userData.rk=rk}
  g.userData.px=pX;g.userData.top=topY;return g}
function typeFor(ki){const k=KURS[ki];if(k.ute==='jul')return'jul';if(k.ute==='gar')return Math.random()<0.6?'motor':'skjøt';return Math.random()<0.55?'skjøt':'lader'}
function plasser(g,ki){const p=sted(ki);if(!p)return false;g.position.set(...p);g.rotation.y=Math.random()*6;XM.add(g);return true}
// varmeovn som trekker for mye strøm (bare på vanskelig)
function lagOvn(){const g=new THREE.Group(),hv=std(0xeeeeea,{roughness:.5});const b=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.42,0.09),hv);b.position.y=0.31;g.add(b);
  for(let i=0;i<6;i++){const r=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.012,0.092),std(0xd8d8d2));r.position.y=0.17+i*0.05;g.add(r)}
  [-0.28,0.28].forEach(x=>{const f=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.1,0.22),hv);f.position.set(x,0.05,0);g.add(f)});
  const l=new THREE.Mesh(new THREE.SphereGeometry(0.012,8,6),new THREE.MeshBasicMaterial({color:0x3a1512}));l.position.set(0.3,0.48,0.046);g.add(l);g.userData.lampe=l;
  const knapp=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,0.02,14),std(0x333333));knapp.rotation.x=Math.PI/2;knapp.position.set(0.24,0.48,0.05);g.add(knapp);return g}
function lagBatteri(){const g=new THREE.Group(),b=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.12,14),std(0xd8a531,{roughness:.4,emissive:0x5a4000}));b.rotation.z=Math.PI/2;b.position.y=0.04;g.add(b);
  const t=new THREE.Mesh(new THREE.CylinderGeometry(0.036,0.036,0.04,14),std(0x111111));t.rotation.z=Math.PI/2;t.position.set(0.05,0.04,0);g.add(t);
  const h=new THREE.Mesh(new THREE.SphereGeometry(0.12,10,8),new THREE.MeshBasicMaterial({color:0xffd060,transparent:true,opacity:.18,blending:THREE.AdditiveBlending,depthWrite:false}));h.position.y=0.05;g.add(h);
  const ki=[0,1,2,3,4][Math.floor(Math.random()*5)];if(!plasser(g,ki))return null;g.position.y+=0.01;return{g,tatt:false}}
const MÅL=['Strømmen er borte! Finn sikringsskapet nede i kjelleren.','Få strømmen tilbake. Slå på jordfeilbryteren.','Jordfeilbryteren løser ut. En av kursene har en feil.',
  '{feilTekst}','Feilen er fjernet. Gå tilbake til sikringsskapet og slå på alle kursene.','Alt lyset er tilbake!'];
function feilTekst(){const n=SNIV[ST.niv];if(n.navn)return`Feilen er på ${KURS[ST.feil].id} ${KURS[ST.feil].navn}. Let etter en svidd kontakt det ryker av der, og trekk den ut.`;
  return'Du har funnet kursen med feil. Let etter en kontakt med svimerke der – sjekk med lommelykta før du trekker ut, feil kontakt koster 10 sekunder.'}
function settMål(i){ST.mål=i;$('gMål').textContent=MÅL[i].replace('{feilTekst}',feilTekst());$('gMål').classList.remove('ny');void $('gMål').offsetWidth;$('gMål').classList.add('ny')}
function startStrom(){gåStart('strom');const n=SNIV[ST.niv];
  ST.feil=n.kand[Math.floor(Math.random()*n.kand.length)];
  Object.assign(ST,{gnistTil:-1,hoved:false,fikset:false,tid:0,bat:100,skapÅpen:false,funnetFeil:false,ovnAv:true,ovnK:null,ovnT:0,utløst:{}});KURS.forEach(k=>k.på=true);
  ST.dev=[];const fe=lagKontakt(typeFor(ST.feil),true,ST.niv==='lett'?0.09:ST.niv==='middels'?0.05:0.035);fe.userData.feil=true;if(!plasser(fe,ST.feil)){ST.feil=1;plasser(fe,1)}ST.dev.push(fe);
  for(let i=0;i<n.lure;i++){const ki=Math.random()<0.4?ST.feil:Math.floor(Math.random()*KURS.length),g=lagKontakt(typeFor(ki),false);if(plasser(g,ki))ST.dev.push(g)}
  if(n.to){const kand=[1,2,3,4].filter(i=>i!==ST.feil);ST.ovnK=kand[Math.floor(Math.random()*kand.length)];ST.ovn=lagOvn();if(plasser(ST.ovn,ST.ovnK)){ST.ovnAv=false}else{ST.ovn=null}}
  ST.bat3=[];for(let i=0;i<n.bat;i++){const b=lagBatteri();if(b)ST.bat3.push(b)}
  lommelykt.angle=n.vinkel;
  if(!LYS.kveld)$('tKveld').click();LYS.on=true;lysApply();window.__lysAv=it=>!harStrøm(kursFor(it));garLys.visible=true;stromLys();
  wToRoom(rooms.find(r=>r.id==='u-sov2'));lommelykt.intensity=1.8;
  if(!ST.led){ST.led=new THREE.Mesh(new THREE.SphereGeometry(0.012,8,6),new THREE.MeshBasicMaterial({color:0xff3030}));ST.led.position.set(SKAP.x+0.18,SKAP.y+0.28,5.885);const h=new THREE.Mesh(new THREE.SphereGeometry(0.05,8,6),new THREE.MeshBasicMaterial({color:0xff3030,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false}));ST.led.add(h);XM.add(ST.led)}
  ST.led.visible=true;settMål(0);skapTegn();batHud();toast('Strømbrudd!');sus(300,80,0.6,0.5,0.6,'lowpass')}
function stromRydd(){if(window.__lysAv){window.__lysAv=null;LYS.key=null;lysApply();JUL.parts.forEach(p=>p.visible=JUL.on);JUL.lights.forEach(l=>l.visible=true);LYKTER.forEach(l=>l.visible=true);lyktLys.visible=true}
  ST.dev.forEach(d=>XM.remove(d));ST.dev=[];if(ST.ovn){XM.remove(ST.ovn);ST.ovn=null}ST.bat3.forEach(b=>XM.remove(b.g));ST.bat3=[];if(ST.led)ST.led.visible=false;lommelykt.intensity=0;garLys.visible=false;garLys.intensity=0;$('gSkap').hidden=true;ST.skapÅpen=false}
function batHud(){$('gBat').innerHTML=`<span class="gSI">🔦</span><span class="gBar"><i style="width:${Math.max(0,ST.bat)}%;background:${ST.bat<20?'#ff4d5a':ST.bat<45?'#f1c75b':'#8fe08a'}"></i></span>`}
// sikringsskapet
function skapTegn(){const el=$('gSkapK');el.innerHTML=`<div class="sk-rad hoved"><button class="sk-b ${ST.hoved?'på':''}" data-i="h"><span class="sk-h"></span></button><div class="sk-l"><b>Jordfeilbryter</b><span>30 mA · Hovedbryter</span></div></div>`+
  KURS.map((k,i)=>`<div class="sk-rad"><button class="sk-b ${k.på?'på':''}" data-i="${i}"><span class="sk-h"></span></button><div class="sk-l"><b>${k.id}</b><span>${k.navn}</span></div><i class="sk-lys ${harStrøm(i)?'på':''}"></i></div>`).join('');
  $('gSkapTip').textContent=ST.niv!=='lett'?'':ST.mål<=2&&!ST.funnetFeil?'Tips: Slå av alle kursene, slå på jordfeilbryteren, og slå så på kursene én og én. Den som får jordfeilbryteren til å løse ut, har feilen.':ST.mål===3?'La kursen med feilen være av til du har funnet og fjernet feilen.':''}
function sjekkFeil(i){if(ST.hoved&&!ST.fikset&&KURS[ST.feil].på){ST.hoved=false;ST.gnistTil=performance.now()+700;const på=KURS.filter(k=>k.på).length;
    const a=ac();if(a){const t=a.currentTime;tone(160,t,0.12,0.25,'square');sus(3000,600,0.12,0.4,0.8,'bandpass')}$('gSkap').classList.remove('trip');void $('gSkap').offsetWidth;$('gSkap').classList.add('trip');
    if(på===1||i===String(ST.feil)){ST.funnetFeil=true;settMål(3)}else if(ST.mål<2)settMål(2);toast('Jordfeilbryteren løste ut!');return true}return false}
function alleOk(){return ST.hoved&&KURS.every(k=>k.på)&&ST.fikset&&ST.ovnAv}
$('gSkapK').addEventListener('click',e=>{const b=e.target.closest('.sk-b');if(!b)return;const i=b.dataset.i,a=ac();if(a)tone(i==='h'?200:900,a.currentTime,0.05,0.2,'square');
  if(i==='h')ST.hoved=!ST.hoved;else KURS[+i].på=!KURS[+i].på;
  if(ST.mål===0)settMål(1);
  sjekkFeil(i);stromLys();skapTegn();
  if(alleOk())stromFerdig()});
function skapÅpne(){ST.skapÅpen=true;wkeys={};wjoy={x:0,y:0,id:null};if(document.pointerLockElement)document.exitPointerLock();$('gSkap').hidden=false;if(ST.mål===0)settMål(1);skapTegn();const a=ac();if(a)sus(500,200,0.2,0.3,0.8,'lowpass')}
function skapLukk(){ST.skapÅpen=false;$('gSkap').hidden=true;if(!isTouch)lock()}
$('gSkapX').onclick=skapLukk;
function bruk(){if(G.mode!=='strom'||!G.on||G.paused)return;if(ST.skapÅpen){skapLukk();return}const p=ST.prompt;if(!p)return;if(p==='skap')skapÅpne();else if(p==='ovn')ovnAv();else trekkUt(p)}
function trekkUt(d){d=d||ST.dev.find(q=>q.userData.feil);if(!d||d.userData.ute)return;d.userData.ute=true;const p=d.getObjectByName('plugg');p.position.set(d.userData.px-0.25,0.03,0.14);p.rotation.y=0.6;
  const a=ac();if(a)sus(1200,300,0.15,0.4,0.7,'lowpass');
  if(d.userData.feil){ST.fikset=true;d.userData.gl.intensity=0;d.userData.sp.forEach(s=>s.m.visible=false);d.userData.rk.forEach(r=>r.visible=false);settMål(4);toast('Feilen er fjernet!');if(alleOk())stromFerdig()}
  else{ST.tid+=10;toast('Den var hel. +10 s');if(a)tone(220,a.currentTime+0.05,0.25,0.12,'sawtooth')}}
function ovnAv(){ST.ovnAv=true;const a=ac();if(a)tone(600,a.currentTime,0.06,0.2,'square');stromLys();toast('Varmeovnen er slått av');if(alleOk())stromFerdig()}
addEventListener('keydown',e=>{if(G.mode!=='strom'||!G.on||G.paused)return;if(e.code==='KeyE'||e.code==='Enter')bruk();if(ST.skapÅpen&&/^Digit[0-7]$/.test(e.code)){const n=+e.code.slice(5);const b=$('gSkapK').querySelector(`.sk-b[data-i="${n===0?'h':n-1}"]`);if(b)b.click()}});
$('gBrukB').addEventListener('pointerdown',e=>{e.preventDefault();bruk()});
function stromFerdig(){settMål(5);G.ending=true;stromLys();sfxSlutt();setTimeout(()=>{if(G.mode!=='strom')return;G.on=false;G.paused=true;$('gSkap').hidden=true;
  const k='strom-best-'+ST.niv,b=LS.get(k,null),rek=b==null||ST.tid<b;if(rek)LS.set(k,ST.tid);
  $('gDK').textContent='Alt lyset er tilbake!';$('gDT').textContent=fmtT(ST.tid);$('gDInfo').innerHTML=(rek?'<b>Ny rekord!</b> ':`Rekorden er ${fmtT(b)}. `)+`Feilen var på ${KURS[ST.feil].id} ${KURS[ST.feil].navn}`+(ST.ovnK!=null?`, og varmeovnen overbelastet ${KURS[ST.ovnK].id}.`:'.');$('gDone').hidden=false},1800)}
const _cf=new THREE.Vector3(),_cd=new THREE.Vector3();
function stromStep(dt,now){const n=SNIV[ST.niv];if(!ST.skapÅpen)ST.tid+=dt;$('gTime').textContent=fmtT(ST.tid);
  // overbelastning: kursen med varmeovnen løser ut etter en stund med strøm
  if(ST.ovn&&!ST.ovnAv&&harStrøm(ST.ovnK)){ST.ovnT+=dt;if(ST.ovnT>9){ST.ovnT=0;KURS[ST.ovnK].på=false;stromLys();if(ST.skapÅpen)skapTegn();const a=ac();if(a)tone(140,a.currentTime,0.1,0.25,'square');
      toast('Klikk! En kurs løste ut');if(!ST.ovnVarslet){ST.ovnVarslet=true;setTimeout(()=>{if(G.mode==='strom'&&G.on)toast('Noe trekker for mye strøm …')},2200)}}}else ST.ovnT=0;
  if(ST.skapÅpen){$('gPrompt').hidden=true;return}
  // lommelykt og batteri
  ST.bat=Math.max(0,ST.bat-dt*100/n.batT);batHud();let li=ST.bat>0?1.8:0.25;if(ST.bat<20&&ST.bat>0&&Math.random()<dt*3)li*=0.2;lommelykt.intensity=li;
  ST.bat3.forEach(b=>{if(b.tatt)return;b.g.rotation.y+=dt*2;if(Math.hypot(b.g.position.x-wp.x,b.g.position.z-wp.z)<0.9&&Math.abs(b.g.position.y-wp.y)<1){b.tatt=true;XM.remove(b.g);ST.bat=Math.min(100,ST.bat+45);toast('Nytt batteri!');const a=ac();if(a)tone(1175,a.currentTime,0.2,0.12,'triangle')}});
  if(ST.led)ST.led.visible=Math.sin(now/260)>0;
  // feilen: helt stille uten strøm. Den gnistrer bare et øyeblikk når kursen får strøm (og jordfeilbryteren løser ut).
  const d=ST.dev.find(q=>q.userData.feil);
  if(d&&!ST.fikset){const dist=Math.hypot(d.position.x-wp.x,d.position.z-wp.z),sam=Math.abs(d.position.y-wp.y)<1.3,gn=now<ST.gnistTil;
    d.userData.gl.intensity=gn&&Math.random()<0.5?2.5+Math.random()*2:0;
    d.userData.sp.forEach(s=>{if(!gn&&s.m.position.y<=0.01){s.m.visible=false;return}s.t+=dt;if(gn&&s.t>0.25+Math.random()*0.3){s.t=0;s.m.position.set(d.userData.px,0.1,0);s.v.set((Math.random()-0.5)*1.2,0.6+Math.random()*1.2,(Math.random()-0.5)*1.2)}s.v.y-=6*dt;s.m.position.addScaledVector(s.v,dt);s.m.visible=s.m.position.y>0.01});
    if(gn&&sam&&dist<9&&Math.random()<dt*6){sus(4000,1500,0.05,0.3*(1-dist/9),1.5,'bandpass')}
    // røyk bare på lett, når kursen er funnet
    d.userData.rk.forEach((r,i)=>{if(!ST.funnetFeil||!n.røyk){r.visible=false;return}r.visible=true;r.userData.t=(r.userData.t+dt*0.35)%1;const t=r.userData.t;r.position.set(d.userData.px+Math.sin(t*6+i)*0.04,0.1+t*0.7,Math.cos(t*5+i)*0.03);r.scale.setScalar(0.5+t*2.2);r.material.opacity=0.22*Math.sin(t*Math.PI)})}
  // hva kan du gjøre her? (på middels/vanskelig må du stå nær og se på tingen)
  const c=camera.position;camera.getWorldDirection(_cf);let pr=null,bd=1e9;
  const ser=(x,y,z,r)=>{const dx=x-wp.x,dz=z-wp.z,h=Math.hypot(dx,dz);if(h>r||Math.abs(y-wp.y)>1)return false;if(!n.sikt)return h;_cd.set(x-c.x,y+0.05-c.y,z-c.z).normalize();return _cd.dot(_cf)>0.8?h:false};
  if(lvOf(wp.y)==='B'&&Math.hypot(c.x-SKAP.x,c.z-SKAP.z)<1.9)pr='skap';
  else{for(const q of ST.dev){if(q.userData.ute)continue;const h=ser(q.position.x,q.position.y,q.position.z,n.rek);if(h!==false&&h<bd){bd=h;pr=q}}
    if(ST.ovn&&!ST.ovnAv){const h=ser(ST.ovn.position.x,ST.ovn.position.y+0.3,ST.ovn.position.z,1.3);if(h!==false&&h<bd){bd=h;pr='ovn'}}}
  ST.prompt=pr;const pe=$('gPrompt');pe.hidden=!pr;if(pr)pe.innerHTML=(isTouch?'Trykk <b>Bruk</b>':'Trykk <b>E</b>')+(pr==='skap'?' for å åpne sikringsskapet':pr==='ovn'?' for å slå av varmeovnen':' for å trekke ut kontakten');
  $('gBrukB').classList.toggle('klar',!!pr)}

seg('oP','p',PK.N,v=>{PK.N=+v;LS.set('pakke-n',PK.N);visBest()});seg('oPil','pil',PK.pil?1:0,v=>{PK.pil=v==='1';LS.set('pakke-pil',PK.pil)});
seg('oSN','sn',ST.niv,v=>{ST.niv=v;LS.set('strom-niv',v);visBest()});
velg(G.mode);
seg('oY','y',YT.valg,v=>{YT.valg=v;LS.set('spill-ytelse',v);YT.lav=0;ytelseStart()});
/* =====================================================================
   Spill 6: Gjemsel  ·  Spill 7: Julelysmontøren  ·  Spill 8: Elektrikerjobben
   ===================================================================== */
const NIV=m=>LS.get('niv-'+m,'middels');
function nyeRydd(){gjemRydd();montRydd();elRydd();G.huk=false;$('gHukB')&&$('gHukB').classList.remove('on')}
function dagSett(){if(LYS.kveld)$('tKveld').click();if(!LYS.on&&$('tLys'))$('tLys').click()}
const _e1=new THREE.Vector3(),_e2=new THREE.Vector3();
function sikt(x,y,z,r,strengt){const c=camera.position,dx=x-wp.x,dz=z-wp.z,h=Math.hypot(dx,dz);if(h>r||Math.abs(y-(wp.y+0.8))>1.6)return false;if(!strengt)return h;
  camera.getWorldDirection(_e1);_e2.set(x-c.x,y-c.y,z-c.z).normalize();return _e2.dot(_e1)>0.8?h:false}
function visPrompt(tekst){const pe=$('gPrompt');pe.hidden=!tekst;if(tekst)pe.innerHTML=(isTouch?'Trykk <b>Bruk</b>':'Trykk <b>E</b>')+' '+tekst;$('gBrukB').classList.toggle('klar',!!tekst)}
function målTekst(t){const e=$('gMål');if(e.textContent===t)return;e.textContent=t;e.classList.remove('ny');void e.offsetWidth;e.classList.add('ny')}

/* ---------------- Gjemsel ---------------- */
const GJN={lett:{gjem:35,leter:60,fart:1.0,syn:5,fyll:1.3},middels:{gjem:30,leter:90,fart:1.35,syn:6.5,fyll:0.85},vanskelig:{gjem:25,leter:120,fart:1.7,syn:8,fyll:0.5}};
const GJ={fase:null,t:0,nis:null,lys:null,rom:null,vei:[],pause:0,sett:0,mål:null,steg:0,hørtT:0,besøkt:[],graf:null,niv:'middels'};
function romGraf(){if(GJ.graf)return GJ.graf;const R=rooms.filter(r=>!r.custom&&r.poly&&Y[r.lv]!=null&&!['u-balk','tomt','veranda'].includes(r.id));const E=new Map();R.forEach(r=>E.set(r,[]));
  const kant=(a,b,c,d)=>{// felles vegg: parallelle kanter som ligger tett og overlapper
    const ax=b[0]-a[0],az=b[1]-a[1],cx=d[0]-c[0],cz=d[1]-c[1],la=Math.hypot(ax,az),lc=Math.hypot(cx,cz);if(la<0.3||lc<0.3)return null;
    const ux=ax/la,uz=az/la;if(Math.abs(ux*cz/lc-uz*cx/lc)>0.05)return null;const dist=Math.abs((c[0]-a[0])*-uz+(c[1]-a[1])*ux);if(dist>0.4)return null;
    const t1=(c[0]-a[0])*ux+(c[1]-a[1])*uz,t2=(d[0]-a[0])*ux+(d[1]-a[1])*uz,lo=Math.max(0,Math.min(t1,t2)),hi=Math.min(la,Math.max(t1,t2));if(hi-lo<0.6)return null;
    const m=(lo+hi)/2;return[a[0]+ux*m-uz*dist/2*Math.sign((c[0]-a[0])*-uz+(c[1]-a[1])*ux),a[1]+uz*m+ux*dist/2*Math.sign((c[0]-a[0])*-uz+(c[1]-a[1])*ux)]};
  for(let i=0;i<R.length;i++)for(let j=i+1;j<R.length;j++){const A=R[i],B=R[j];if(A.lv!==B.lv)continue;let best=null;
    for(let p=0;p<A.poly.length&&!best;p++)for(let q=0;q<B.poly.length&&!best;q++){best=kant(A.poly[p],A.poly[(p+1)%A.poly.length],B.poly[q],B.poly[(q+1)%B.poly.length])}
    if(best){E.get(A).push({til:B,p:best});E.get(B).push({til:A,p:best})}}
  [['b-trapp','kjtrapp'],['trapp','u-gang']].forEach(([a,b])=>{const A=R.find(r=>r.id===a),B=R.find(r=>r.id===b);if(A&&B){E.get(A).push({til:B,p:romP(A),trapp:true});E.get(B).push({til:A,p:romP(A),trapp:true})}});
  GJ.graf={R,E};return GJ.graf}
function romVed(x,y,z){const lv=lvOf(y);return romGraf().R.find(r=>r.lv===lv&&pip(r.poly,x,z))||null}
function finnVei(fra,til){const{E}=romGraf(),prev=new Map([[fra,null]]),q=[fra];while(q.length){const r=q.shift();if(r===til)break;for(const e of E.get(r)||[])if(!prev.has(e.til)){prev.set(e.til,{r,e});q.push(e.til)}}
  if(!prev.has(til))return null;const v=[];let r=til;while(prev.get(r)){const{r:p,e}=prev.get(r);v.unshift({x:e.p[0],z:e.p[1],y:Y[r.lv],rom:r,trapp:e.trapp,fraY:Y[p.lv]});r=p}return v}
function gjemNytt(mål){const n=GJ.nis,fra=GJ.rom;const vei=finnVei(fra,mål)||[];const q=rndIn(mål.poly)||romP(mål);vei.push({x:q[0],z:q[1],y:Y[mål.lv],rom:mål});GJ.vei=vei;GJ.mål=mål}
function velgRom(){const{R,E}=romGraf(),meg=romVed(wp.x,wp.y,wp.z);GJ.besøkt=GJ.besøkt.slice(-4);
  if(meg&&Math.random()<0.45){const nb=(E.get(meg)||[]).map(e=>e.til).concat([meg]);return nb[Math.floor(Math.random()*nb.length)]}
  const k=R.filter(r=>!GJ.besøkt.includes(r)&&r!==GJ.rom);return k[Math.floor(Math.random()*k.length)]||R[0]}
function startGjem(){gåStart('gjem');GJ.niv=NIV('gjem');const n=GJN[GJ.niv];
  if(!GJ.nis){const g=lagNisse();g.scale.setScalar(2.7);g.traverse(o=>{if(o.isMesh)o.raycast=()=>{}});XM.add(g);GJ.nis=g;const l=new THREE.PointLight(0xffc070,0,5,1.6);l.position.set(0.25,0.45,0.15);g.add(l);GJ.lys=l}
  GJ.nis.visible=true;GJ.lys.intensity=YT.niv>0&&LYS.kveld?0.9:0;GJ.nis.position.set(W+T+1.8,RAMPE.yw,9.2);GJ.nis.rotation.y=-Math.PI/2;
  Object.assign(GJ,{fase:'gjem',t:n.gjem,rom:null,vei:[],pause:0,sett:0,steg:0,besøkt:[],hørtT:0});
  wToRoom(rooms.find(r=>r.id==='stue'));målTekst(`Gjem deg inne i huset! Nissen begynner å lete om ${n.gjem} sekunder.`);$('gVarsel').style.setProperty('--v',0);toast('Gjem deg!')}
function gjemRydd(){if(GJ.nis){GJ.nis.visible=false;GJ.lys.intensity=0}GJ.fase=null;window.G_WLK=2.1}
function gjemSlutt(vant){if(G.ending)return;G.ending=true;sfxSlutt();if(document.pointerLockElement)document.exitPointerLock();
  const n=GJN[GJ.niv],k='gjem-best-'+GJ.niv,b=LS.get(k,0)||0;let rek=false;if(vant&&!b){LS.set(k,1)}if(vant)LS.set(k,(b||0)+1);
  setTimeout(()=>{if(G.mode!=='gjem')return;G.on=false;G.paused=true;$('gDK').textContent=vant?'Nissen fant deg ikke!':'Nissen fant deg!';$('gDT').textContent=vant?'Du vant':'Tatt!';
    $('gDInfo').innerHTML=vant?`Du holdt deg skjult i ${n.leter} sekunder. Seire på ${GJ.niv}: ${(b||0)+1}.`:`Du klarte ${fmtT(n.leter-GJ.t)} av ${fmtT(n.leter)}.`;$('gDone').hidden=false},vant?900:1400)}
function gjemStep(dt,now){const n=GJN[GJ.niv],g=GJ.nis,c=camera.position;
  window.G_WLK=G.huk?1.0:2.1;if(G.huk){camera.position.y-=0.72;if(G.sprintTouch||wkeys.ShiftLeft||wkeys.ShiftRight){}}
  GJ.t-=dt;$('gTime').textContent=fmtT(Math.ceil(GJ.t));
  if(GJ.fase==='gjem'){målTekst(`Gjem deg inne i huset! Nissen begynner å lete om ${Math.ceil(GJ.t)} sekunder.`);
    if(GJ.t<=0){if(!inHouse(wp.x,wp.z)||!romVed(wp.x,wp.y,wp.z)){målTekst('Du var ikke inne i huset!');gjemSlutt(false);return}
      GJ.fase='leter';GJ.t=n.leter;GJ.rom=romGraf().R.find(r=>r.id==='entre')||romGraf().R[0];const q=romP(GJ.rom);g.position.set(q[0],Y[GJ.rom.lv],q[1]);gjemNytt(velgRom());
      toast('Nissen leter!');const a=ac();if(a){const t=a.currentTime;[0,0.15,0.3].forEach(d=>bjelle(t+d,0.12))}}
    return}
  if(GJ.fase!=='leter')return;
  målTekst(`Hold deg skjult! ${G.huk?'Du sitter på huk.':isTouch?'Trykk Huk for å bli mindre synlig.':'Trykk C for å gå ned på huk.'}`);
  if(GJ.t<=0){GJ.t=0;GJ.fase='slutt';gjemSlutt(true);return}
  // hører nissen deg?
  const dist=Math.hypot(g.position.x-wp.x,g.position.z-wp.z),sammeLv=lvOf(wp.y)===lvOf(g.position.y+0.5),spr=gSpr()&&(wkeys.KeyW||wkeys.KeyA||wkeys.KeyS||wkeys.KeyD||Math.hypot(wjoy.x,wjoy.y)>0.1);
  const går=!G.huk&&(wkeys.KeyW||wkeys.KeyA||wkeys.KeyS||wkeys.KeyD||Math.hypot(wjoy.x,wjoy.y)>0.1);
  if(now-GJ.hørtT>4000&&((spr&&dist<(sammeLv?10:6))||(går&&dist<3.2&&sammeLv))){const meg=romVed(wp.x,wp.y,wp.z);if(meg&&GJ.rom){GJ.hørtT=now;gjemNytt(meg);toast('Nissen hørte noe …')}}
  // ser nissen deg?
  const øye=_e1.set(g.position.x,g.position.y+1.05,g.position.z),fx=Math.sin(g.rotation.y),fz=Math.cos(g.rotation.y),dx=c.x-øye.x,dz=c.z-øye.z,dd=Math.hypot(dx,dz);
  const syn=n.syn*(G.huk?0.5:1),vink=(dx*fx+dz*fz)/Math.max(dd,1e-3);
  const ser=sammeLv&&dd<syn&&vink>0.55&&losP(øye.clone(),c.clone());
  GJ.sett=Math.max(0,Math.min(1,GJ.sett+(ser?dt/n.fyll*(dd<2?2:1):-dt*0.35)));$('gVarsel').style.setProperty('--v',GJ.sett.toFixed(3));$('gVarsel').classList.toggle('ser',ser);
  if(GJ.sett>=1){målTekst('Nissen så deg!');gjemSlutt(false);return}
  // bevegelse
  let fart=n.fart*(GJ.sett>0.35?1.6:1);
  if(GJ.sett>0.35&&ser){const a=Math.atan2(dx,dz);g.rotation.y=a;const s=Math.min(fart*dt,Math.max(0,dd-0.5));g.position.x+=Math.sin(a)*s;g.position.z+=Math.cos(a)*s;GJ.rom=romVed(g.position.x,g.position.y+0.5,g.position.z)||GJ.rom;GJ.vei=[]}
  else if(GJ.pause>0){GJ.pause-=dt;g.rotation.y+=Math.sin(now/500)*dt*1.4}
  else{if(!GJ.vei.length){GJ.besøkt.push(GJ.rom);gjemNytt(velgRom());GJ.pause=0.8+Math.random()*1.4}
    const p=GJ.vei[0];if(p){const vx=p.x-g.position.x,vz=p.z-g.position.z,L=Math.hypot(vx,vz);
      if(L<0.08){g.position.set(p.x,p.y,p.z);GJ.rom=p.rom;GJ.vei.shift();if(!GJ.vei.length)GJ.pause=1.2+Math.random()*1.5}
      else{const s=Math.min(L,fart*dt);g.position.x+=vx/L*s;g.position.z+=vz/L*s;g.rotation.y=Math.atan2(vx,vz);
        if(p.trapp){const k=1-Math.min(1,L/2.5);g.position.y=p.fraY+(p.y-p.fraY)*k}else g.position.y+=(p.y-g.position.y)*Math.min(1,dt*6)}}}
  g.children.forEach(()=>{});g.position.y+=0;GJ.nis.rotation.z=Math.sin(now/180)*0.04;
  // bjeller på lua: lyden forteller hvor nissen er
  GJ.steg+=dt;if(GJ.steg>0.5&&GJ.pause<=0){GJ.steg=0;const d=Math.hypot(g.position.x-wp.x,g.position.z-wp.z)+Math.abs(g.position.y-wp.y)*3;if(d<16){const a=ac();if(a){const pan=Math.max(-1,Math.min(1,-Math.sin(Math.atan2(g.position.x-c.x,g.position.z-c.z)-wyaw-Math.PI)));
    const v=0.07*(1-d/16)*(sammeLv?1:0.5);const pn=a.createStereoPanner?a.createStereoPanner():null,gn=a.createGain();gn.gain.value=1;if(pn){pn.pan.value=pan;gn.connect(pn);pn.connect(a.destination)}else gn.connect(a.destination);bjelle(a.currentTime,v,gn)}}}}

/* ---------------- Julelysmontøren ---------------- */
const MTN={lett:{deler:['N'],tid:300,rek:1.45},middels:{deler:['N','S'],tid:330,rek:1.35},vanskelig:{deler:['N','S','GS','GN'],tid:360,rek:1.25}};
// takrennene: linje, høyde, hvilken vei stigen står ut fra veggen
const RENNER={N:{akse:'z',fast:8.04,fra:-0.6,til:11.55,y:2.66,ut:+1,n:5,navn:'nordsiden av huset'},S:{akse:'z',fast:-0.72,fra:-0.6,til:11.55,y:2.66,ut:-1,n:5,navn:'sørsiden av huset'},
  GS:{akse:'x',fast:1.92,fra:13.05,til:19.35,y:3.27,ut:-1,n:3,navn:'garasjen'},GN:{akse:'x',fast:8.73,fra:13.05,til:19.35,y:3.27,ut:+1,n:3,navn:'garasjen'}};
const MT={seg:[],stige:null,påStige:false,stigePos:null,tid:0,frist:0,plugget:false,kontakt:null,falt:0,niv:'middels',skumring:false};
const STIGE=(()=>{const g=new THREE.Group(),inn=new THREE.Group();inn.name='helning';g.add(inn);const m=std(0xb8bcc2,{roughness:.4,metalness:.6});
  [-0.22,0.22].forEach(z=>{const r=new THREE.Mesh(new THREE.BoxGeometry(0.035,1,0.05),m);r.position.z=z;r.name='ski';inn.add(r)});
  for(let i=0;i<14;i++){const t=new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.014,0.44,8),m);t.rotation.x=Math.PI/2;t.name='trinn';t.userData.i=i;inn.add(t)}g.visible=false;XM.add(g);return g})();
function stigeForm(h){const inn=STIGE.getObjectByName('helning');const n=Math.max(6,Math.round(h/0.28));inn.children.forEach(o=>{if(o.name==='ski'){o.scale.y=h;o.position.y=h/2}else{o.visible=o.userData.i<n;o.position.y=(o.userData.i+0.5)/n*h}})}
function lagSeg(r,a,b){const L=Math.abs(b-a),n=Math.max(6,Math.round(L/0.25)),g=new THREE.Group(),farger=[0xff4d4d,0xffd24d,0x5dd36a,0x4da3ff,0xff8df0];
  const mats=farger.map(c=>new THREE.MeshBasicMaterial({color:0x3a3a3a}));const geo=new THREE.SphereGeometry(0.035,8,6);const pts=[];
  for(let i=0;i<=n;i++){const t=i/n,v=a+(b-a)*t,sag=-Math.sin(t*Math.PI)*0.08;const x=r.akse==='z'?r.fast:v,z=r.akse==='z'?v:r.fast;pts.push(new THREE.Vector3(x,r.y+sag,z));
    if(i%1===0){const m=new THREE.Mesh(geo,mats[i%5]);m.position.set(x,r.y+sag-0.05,z);m.userData.farge=farger[i%5];g.add(m)}}
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x1d3b23})));g.visible=false;XM.add(g);
  // kroker som viser hvor lysene skal henge
  const kr=new THREE.Group();[a+(b-a)*0.15,(a+b)/2,a+(b-a)*0.85].forEach(v=>{const m=new THREE.Mesh(new THREE.TorusGeometry(0.035,0.008,6,12,Math.PI*1.4),new THREE.MeshBasicMaterial({color:0xf1c75b}));m.position.set(r.akse==='z'?r.fast:v,r.y-0.04,r.akse==='z'?v:r.fast);kr.add(m)});XM.add(kr);
  const mid=(a+b)/2;return{r,a,b,g,kr,hengt:false,x:r.akse==='z'?r.fast:mid,z:r.akse==='z'?mid:r.fast,y:r.y}}
const KONTAKT=(()=>{const g=new THREE.Group(),b=new THREE.Mesh(new THREE.BoxGeometry(0.03,0.11,0.11),std(0x9aa0a6,{roughness:.5}));g.add(b);const l=new THREE.Mesh(new THREE.BoxGeometry(0.035,0.04,0.08),std(0x6b7076));l.position.y=0.04;g.add(l);
  g.position.set(W+T+0.02,0.55,7.9);g.visible=false;XM.add(g);return g})();
function startMont(){gåStart('montor');MT.niv=NIV('montor');const n=MTN[MT.niv];dagSett();JUL.parts.forEach(p=>p.visible=false);JUL.lights.forEach(l=>l.visible=false);LYKTER.forEach(l=>l.visible=false);
  MT.seg.forEach(s=>{XM.remove(s.g);XM.remove(s.kr)});MT.seg=[];n.deler.forEach(k=>{const r=RENNER[k],L=(r.til-r.fra)/r.n;for(let i=0;i<r.n;i++)MT.seg.push(lagSeg(r,r.fra+i*L,r.fra+(i+1)*L))});
  Object.assign(MT,{påStige:false,stigePos:null,tid:0,frist:n.tid,plugget:false,falt:0,skumring:false});STIGE.visible=false;KONTAKT.visible=true;
  const sx=W+T+3.5,sz=4;wPlace(sx,sz,null,yawTo(sx,sz,W,sz));wpitch=0.15;montHud();toast('Heng opp julelysene før det blir mørkt!')}
function montRydd(){MT.seg.forEach(s=>{XM.remove(s.g);XM.remove(s.kr)});MT.seg=[];STIGE.visible=false;KONTAKT.visible=false;if(MT.påStige){MT.påStige=false;walkOn=true}
  if(G.mode!=='montor'&&MT.skjult){}JUL.parts.forEach(p=>p.visible=JUL.on);JUL.lights.forEach(l=>l.visible=true);LYKTER.forEach(l=>l.visible=true)}
function montHud(){const h=MT.seg.filter(s=>s.hengt).length;$('gPkN').innerHTML=`<span class="gSI">💡</span><b>${h}</b><span>/ ${MT.seg.length}</span>`}
function rennerNær(){let best=null,bd=1e9;for(const k of MTN[MT.niv].deler){const r=RENNER[k],v=r.akse==='z'?wp.z:wp.x,perp=(r.akse==='z'?wp.x:wp.z)-r.fast;
    if(v<r.fra-0.3||v>r.til+0.3)continue;const ut=perp*r.ut;if(ut<0.15||ut>2.2)continue;if(ut<bd){bd=ut;best={r,v:Math.max(r.fra+0.2,Math.min(r.til-0.2,v))}}}return best}
function settStige(p){const r=p.r,ut=0.75;const bx=r.akse==='z'?r.fast+r.ut*ut:p.v,bz=r.akse==='z'?p.v:r.fast+r.ut*ut;let gy=wGround(bx,r.y-0.3,bz);if(!(gy>-50))gy=groundH(bx,bz)??0;
  const h=r.y-0.02-gy,θ=Math.atan2(ut-0.12,h),L=Math.hypot(h,ut-0.12);stigeForm(L);STIGE.position.set(bx,gy,bz);STIGE.rotation.set(0,r.akse==='z'?0:Math.PI/2,0);
  STIGE.getObjectByName('helning').rotation.set(0,0,θ*r.ut*(r.akse==='z'?1:-1));STIGE.visible=true;MT.stigePos={r,v:p.v,x:bx,z:bz,gy};const a=ac();if(a)sus(600,200,0.2,0.3,0.7,'lowpass')}
function klatreOpp(){const s=MT.stigePos,r=s.r;MT.påStige=true;walkOn=false;MT.topp={x:r.akse==='z'?r.fast+r.ut*0.42:s.v,y:r.y-0.25,z:r.akse==='z'?s.v:r.fast+r.ut*0.42};
  wyaw=r.akse==='z'?(r.ut>0?Math.PI/2:-Math.PI/2):(r.ut>0?0:Math.PI);wyaw=yawTo(MT.topp.x,MT.topp.z,r.akse==='z'?r.fast:s.v,r.akse==='z'?s.v:r.fast);wpitch=0.1}
function klatreNed(){MT.påStige=false;walkOn=true;wT=performance.now();const s=MT.stigePos,r=s.r;wPlace(r.akse==='z'?s.x+r.ut*0.5:s.x,r.akse==='z'?s.z:s.z+r.ut*0.5,null,wyaw)}
function heng(){const s=MT.stigePos,r=s.r,n=MTN[MT.niv];let best=null,bd=1e9;MT.seg.forEach(q=>{if(q.hengt||q.r!==r)return;const d=Math.abs((q.a+q.b)/2-s.v);if(d<bd){bd=d;best=q}});
  if(!best){toast('Her er det ferdig – flytt stigen');return}
  if(bd>n.rek+0.55){MT.tid+=10;MT.falt++;toast('Du strakk deg for langt og falt! +10 s');const a=ac();if(a){sus(900,120,0.4,0.6,0.6,'lowpass')}klatreNed();return}
  if(bd>n.rek){toast('For langt unna – flytt stigen nærmere');return}
  best.hengt=true;best.g.visible=true;best.kr.visible=false;montHud();const a=ac();if(a){const t=a.currentTime;tone(880,t,0.12,0.12,'triangle');tone(1175,t+0.08,0.15,0.12,'triangle')}
  const igjen=MT.seg.filter(q=>!q.hengt).length;toast(igjen?`Hengt opp! ${igjen} igjen`:'Alt er hengt opp – plugg inn ved utekontakten!')}
function plugg(){MT.plugget=true;MT.seg.forEach(s=>s.g.children.forEach(m=>{if(m.isMesh&&m.userData.farge)m.material.color.set(m.userData.farge)}));JUL.parts.forEach(p=>p.visible=true);JUL.lights.forEach(l=>l.visible=true);LYKTER.forEach(l=>l.visible=true);
  sfxSlutt();G.ending=true;setTimeout(()=>{if(G.mode!=='montor')return;G.on=false;G.paused=true;if(document.pointerLockElement)document.exitPointerLock();const k='montor-best-'+MT.niv,b=LS.get(k,null),rek=b==null||MT.tid<b;if(rek)LS.set(k,MT.tid);
    $('gDK').textContent='Julelysene er på!';$('gDT').textContent=fmtT(MT.tid);$('gDInfo').innerHTML=(rek?'<b>Ny rekord!</b> ':`Rekorden er ${fmtT(b)}. `)+`${MT.seg.length} lysslynger hengt opp`+(MT.falt?`, ${MT.falt} fall (+${MT.falt*10} s).`:', uten å falle.');$('gDone').hidden=false},2200)}
function montStep(dt,now){const n=MTN[MT.niv];MT.tid+=dt;const igjen=n.tid-MT.tid;$('gTime').textContent=fmtT(Math.max(0,igjen));$('gTime').classList.toggle('warn',igjen<30);
  if(!MT.skumring&&igjen<n.tid*0.25){MT.skumring=true;if(!LYS.kveld)$('tKveld').click();JUL.parts.forEach(p=>p.visible=false);JUL.lights.forEach(l=>l.visible=false);LYKTER.forEach(l=>l.visible=false);toast('Det begynner å bli mørkt!')}
  if(igjen<=0&&!G.ending){G.ending=true;sfxSlutt();setTimeout(()=>{G.on=false;G.paused=true;$('gDK').textContent='Det ble mørkt!';$('gDT').textContent=`${MT.seg.filter(s=>s.hengt).length} / ${MT.seg.length}`;$('gDInfo').textContent='Du rakk ikke å henge opp alle lysene før mørket kom.';$('gDone').hidden=false},900);return}
  MT.seg.forEach(s=>{if(!s.hengt)s.kr.children.forEach(k=>k.rotation.y=now/400)});
  if(MT.plugget)MT.seg.forEach(s=>s.g.children.forEach((m,i)=>{if(m.isMesh&&m.userData.farge)m.visible=Math.sin(now/300+i)>-0.7}));
  if(MT.påStige){const t=MT.topp;camera.position.set(t.x,t.y,t.z);camera.rotation.order='YXZ';camera.rotation.set(wpitch,wyaw,0);
    // nærmeste ledige del: grønn = rekker, gul = for langt
    const s=MT.stigePos;let bd=1e9;MT.seg.forEach(q=>{if(!q.hengt&&q.r===s.r)bd=Math.min(bd,Math.abs((q.a+q.b)/2-s.v))});
    målTekst(bd<=n.rek?'Du rekker en lysslynge herfra.':bd<1e8?'Det er for langt å strekke seg – klatre ned og flytt stigen.':'Alt er hengt opp her.');
    visPrompt(bd<=n.rek+0.55?'for å henge opp lysene':'for å klatre ned');MT.prompt=bd<=n.rek+0.55?'heng':'ned';$('gPrompt').innerHTML+=bd<=n.rek+0.55?'<br><small>'+(isTouch?'Hold <b>Bruk</b> lenger':'Q')+' for å klatre ned</small>':'';return}
  const alle=MT.seg.every(s=>s.hengt);
  if(alle){målTekst('Alle lysene henger! Plugg inn ved utekontakten ved inngangsdøra.');const d=Math.hypot(KONTAKT.position.x-wp.x,KONTAKT.position.z-wp.z);MT.prompt=d<1.6?'plugg':null;visPrompt(MT.prompt?'for å plugge inn julelysene':null);hudPil(KONTAKT.position.x,0.5,KONTAKT.position.z,'Utekontakten');return}
  $('gHint').hidden=true;
  const p=rennerNær();const st=MT.stigePos;const vedStige=st&&STIGE.visible&&Math.hypot(st.x-wp.x,st.z-wp.z)<1.2;
  if(vedStige){MT.prompt='opp';visPrompt('for å klatre opp – eller gå bort og trykk igjen for å flytte stigen');målTekst(`Klatre opp stigen ved ${st.r.navn}.`)}
  else if(p){MT.prompt={sett:p};visPrompt('for å sette opp stigen her');målTekst(`Sett stigen inntil takrenna (${p.r.navn}) under en lysslynge som mangler.`)}
  else{MT.prompt=null;visPrompt(null);const rest=MT.seg.filter(s=>!s.hengt).map(s=>s.r.navn);målTekst(`Gå bort til takrenna på ${rest[0]} for å sette opp stigen.`)}}
function montBruk(lang){const p=MT.prompt;if(!p)return;if(MT.påStige){if(lang||p==='ned')klatreNed();else heng();return}if(p==='opp')klatreOpp();else if(p==='plugg')plugg();else if(p.sett)settStige(p.sett)}
// på stigen: se rundt med fingeren (vanlig dra-for-å-se virker bare når du går)
{let ld=null;cv.addEventListener('pointerdown',e=>{if(G.mode==='montor'&&MT.påStige&&isTouch)ld={x:e.clientX,y:e.clientY,id:e.pointerId}});
 cv.addEventListener('pointermove',e=>{if(!ld||e.pointerId!==ld.id)return;wyaw-=(e.clientX-ld.x)*0.005;wpitch=Math.max(-1.2,Math.min(1.2,wpitch-(e.clientY-ld.y)*0.005));ld.x=e.clientX;ld.y=e.clientY});
 addEventListener('pointerup',()=>{ld=null})}

/* ---------------- Elektrikerjobben ---------------- */
const ELN={lett:{n:5,typer:['brudd'],straff:15,sikt:false},middels:{n:7,typer:['brudd','overgang'],straff:20,sikt:true},vanskelig:{n:9,typer:['brudd','overgang'],straff:25,sikt:true}};
const EL={pkt:[],feil:0,type:'brudd',kurs:1,tid:0,niv:'middels',målt:new Map(),åpnet:0,fikset:false,bil:null,prompt:null,måler:null};
const BIL=(()=>{const g=new THREE.Group(),hv=std(0xf4f5f6,{roughness:.35,metalness:.2}),gl=std(0x1d2733,{roughness:.1,metalness:.4}),sv=std(0x18191b,{roughness:.8});
  const k=new THREE.Mesh(new THREE.BoxGeometry(4.4,1.2,1.85),hv);k.position.y=0.95;g.add(k);const t=new THREE.Mesh(new THREE.BoxGeometry(3.0,0.75,1.8),hv);t.position.set(-0.55,1.9,0);g.add(t);
  const pa=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.6,1.78),hv);pa.position.set(1.15,1.75,0);pa.rotation.z=-0.55;g.add(pa);
  const fr=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.55,1.6),gl);fr.position.set(1.3,1.8,0);fr.rotation.z=-0.55;g.add(fr);
  [-1,1].forEach(s=>{const w=new THREE.Mesh(new THREE.BoxGeometry(0.8,0.45,0.02),gl);w.position.set(0.55,1.85,s*0.92);g.add(w);
    [-1.4,1.35].forEach(x=>{const h=new THREE.Mesh(new THREE.CylinderGeometry(0.33,0.33,0.25,18),sv);h.rotation.x=Math.PI/2;h.position.set(x,0.33,s*0.85);g.add(h)})});
  // firmalogo på sidene (Avitell Elektro)
  const c=document.createElement('canvas');c.width=1024;c.height=280;const x=c.getContext('2d');x.fillStyle='#f4f5f6';x.fillRect(0,0,1024,280);const tex=new THREE.CanvasTexture(c);tex.anisotropy=4;
  const img=new Image();img.onload=()=>{x.drawImage(img,12,10,1000,260);tex.needsUpdate=true};img.src='data:image/png;base64,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';
  [-1,1].forEach(s=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(2.7,0.74),new THREE.MeshBasicMaterial({map:tex}));p.position.set(-0.5,1.05,s*0.935);if(s<0)p.rotation.y=Math.PI;g.add(p)});
  const bak=new THREE.Mesh(new THREE.PlaneGeometry(1.5,0.4),new THREE.MeshBasicMaterial({map:tex}));bak.position.set(-2.205,1.0,0);bak.rotation.y=-Math.PI/2;g.add(bak);
  g.visible=false;XM.add(g);return g})();
function elPunkt(type,x,y,z,ry,rom){const g=new THREE.Group(),hv=std(0xf3f3f0,{roughness:.6});
  if(type==='kontakt'){const b=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.08,0.03),hv);g.add(b);[-0.015,0.015].forEach(dx=>{const h=new THREE.Mesh(new THREE.CylinderGeometry(0.005,0.005,0.01,6),std(0x333333));h.rotation.x=Math.PI/2;h.position.set(dx,0,0.016);g.add(h)})}
  else{const b=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.1,0.04),hv);g.add(b);const l=new THREE.Mesh(new THREE.BoxGeometry(0.085,0.085,0.008),std(0xe6e6e0));l.position.z=0.022;l.name='lokk';g.add(l)}
  g.position.set(x,y,z);g.rotation.y=ry;XM.add(g);return{g,type,rom,x,y,z,åpnet:false}}
const _vr=new THREE.Raycaster(),_vo=new THREE.Vector3(),_vd=new THREE.Vector3();
function erVegg(o){for(let p=o;p;p=p.parent){if(p.userData&&p.userData.door)return false}const m=Array.isArray(o.material)?o.material[0]:o.material;return !(m&&m.transparent&&m.opacity<0.6)}
function treffVegg(x,y,z,nx,nz){// skyt en stråle fra rommet mot veggen; svar = treffpunkt hvis det er en ekte vegg der
  _vo.set(x+nx*0.35,y,z+nz*0.35);_vd.set(-nx,0,-nz);const cand=[];for(const e of wcol){const b=e.b;if(b.max.x>=x-0.5&&b.min.x<=x+0.5&&b.max.z>=z-0.5&&b.min.z<=z+0.5&&b.max.y>=y&&b.min.y<=y)cand.push(e.o)}
  if(!cand.length)return null;_vr.set(_vo,_vd);_vr.far=0.6;const h=_vr.intersectObjects(cand,false)[0];if(!h||!erVegg(h.object))return null;
  const n=h.face?h.face.normal.clone().transformDirection(h.object.matrixWorld):null;if(n&&Math.abs(n.x*nx+n.z*nz)<0.8)return null;return h.point}
function veggPunkt(rom,høyde){// et tilfeldig sted på en ekte vegg i rommet (ikke i døråpninger eller åpninger mot trappa)
  for(let i=0;i<80;i++){const p=rom.poly,k=Math.floor(Math.random()*p.length),a=p[k],b=p[(k+1)%p.length],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<0.8)continue;const t=0.15+Math.random()*0.7;
    let x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;let nx=-(b[1]-a[1])/L,nz=(b[0]-a[0])/L;if(!pip(p,x+nx*0.2,z+nz*0.2)){nx=-nx;nz=-nz}
    const y=Y[rom.lv]+høyde;
    // veggen må være hel både der punktet sitter, litt til sidene og ned mot gulvet (døråpninger går helt ned)
    const tx=(b[0]-a[0])/L,tz=(b[1]-a[1])/L;let ok=true,hp=null;
    for(const [ds,dy] of [[0,0],[-0.2,0],[0.2,0],[0,-høyde+0.15],[-0.2,-høyde+0.15],[0.2,-høyde+0.15]]){const q=treffVegg(x+tx*ds,y+dy,z+tz*ds,nx,nz);if(!q){ok=false;break}if(ds===0&&dy===0)hp=q}
    if(!ok)continue;x=hp.x+nx*0.016;z=hp.z+nz*0.016;
    if(høyde<1&&!ledig(x+nx*0.15,Y[rom.lv],z+nz*0.15,smaObj()))continue;return{x,y,z,ry:Math.atan2(nx,nz)}}return null}
const KLAGE={'-F1':'i kjelleren','-F2':'i stua','-F3':'på kjøkkenet','-F4':'i gangen','-F5':'i andre etasje'};
function startEl(){gåStart('elektro');EL.niv=NIV('elektro');const n=ELN[EL.niv];dagSett();
  EL.pkt.forEach(p=>XM.remove(p.g));EL.pkt=[];EL.målt=new Map();EL.kurs=[0,1,2,3,4][Math.floor(Math.random()*5)];const k=KURS[EL.kurs];EL.type=n.typer[Math.floor(Math.random()*n.typer.length)];
  const rom=rooms.filter(r=>k.rom.includes(r.id)&&r.poly&&!['u-kott','u-balk','b-trapp','kjtrapp','trapp'].includes(r.id));
  for(let i=0;i<n.n*3&&EL.pkt.length<n.n;i++){const r=rom[i%rom.length],type=Math.random()<0.55?'kontakt':'boks',q=veggPunkt(r,type==='kontakt'?0.3:2.15);if(!q)continue;
    if(EL.pkt.some(o=>Math.hypot(o.x-q.x,o.z-q.z)<1.2&&Math.abs(o.y-q.y)<1))continue;EL.pkt.push(elPunkt(type,q.x,q.y,q.z,q.ry,r))}
  // rekkefølgen på kursen: fra sikringsskapet og videre til nærmeste punkt
  const ord=[];let cx=SKAP.x,cz=SKAP.z,cy=SKAP.y;const rest=EL.pkt.slice();while(rest.length){rest.sort((a,b)=>Math.hypot(a.x-cx,a.z-cz)+Math.abs(a.y-cy)*2-(Math.hypot(b.x-cx,b.z-cz)+Math.abs(b.y-cy)*2));const p=rest.shift();ord.push(p);cx=p.x;cz=p.z;cy=p.y}EL.pkt=ord;
  EL.feil=1+Math.floor(Math.random()*(EL.pkt.length-1));Object.assign(EL,{tid:0,åpnet:0,fikset:false});
  BIL.visible=true;const bx=23.4,bz=3.85,by=groundH(bx,bz)??0;BIL.position.set(bx,by,bz);BIL.rotation.y=Math.PI;   // parkert foran garasjeporten
  const sx=bx-0.4,sz=bz+2.4;wPlace(sx,sz,null,yawTo(sx,sz,W/2,D/2));
  const sist=EL.pkt[EL.pkt.length-1],stedT=KLAGE[k.id]||'';
  $('gMeter').hidden=false;meterVis('— — —','');
  målTekst(`Kunden ringer: «Det er ${EL.type==='brudd'?'ingen strøm':'noe rart med strømmen – lyset blafrer og kontaktene blir varme –'} ${stedT}!» Mål deg fram fra sikringsskapet (${k.id}) i kjelleren.`);
  toast('Ny jobb!');const a=ac();if(a){const t=a.currentTime;[0,0.25].forEach(d=>{tone(880,t+d,0.18,0.12,'square');tone(660,t+d+0.09,0.18,0.12,'square')})}}
function elRydd(){EL.pkt.forEach(p=>XM.remove(p.g));EL.pkt=[];BIL.visible=false;$('gMeter')&&($('gMeter').hidden=true)}
function verdi(i){// i=-1 er sikringsskapet
  if(i<0||i<EL.feil||EL.fikset)return{v:'230',enhet:'V',ok:true};if(EL.type==='brudd')return{v:'0',enhet:'V',ok:false};
  return{v:String(186+Math.floor(Math.random()*14)),enhet:'V',ok:false}}
function meterVis(v,enhet,klasse){$('gMeterV').textContent=v;$('gMeterE').textContent=enhet;$('gMeter').className=klasse||''}
function mål(i){const r=verdi(i);meterVis('· · ·','');const a=ac();if(a)tone(1400,a.currentTime,0.05,0.08,'square');
  setTimeout(()=>{meterVis(r.v,r.enhet,r.ok?'ok':'feil');if(i>=0){EL.målt.set(i,r);const p=EL.pkt[i];p.g.children[0].material=std(r.ok?0xe8f5e6:0xf7e2e0,{roughness:.6})}},500)}
function åpne(i){const p=EL.pkt[i];if(p.åpnet)return;p.åpnet=true;const l=p.g.getObjectByName('lokk');if(l){l.position.z=0.06;l.rotation.x=0.9}
  if(i===EL.feil){EL.fikset=true;const a=ac();if(a)sus(1500,500,0.2,0.3,0.8,'bandpass');toast(EL.type==='brudd'?'Løs leder i klemmen – skrudd fast!':'Svidd klemme med dårlig kontakt – byttet!');
    setTimeout(()=>{if(G.mode!=='elektro')return;sfxSlutt();G.ending=true;setTimeout(()=>{G.on=false;G.paused=true;if(document.pointerLockElement)document.exitPointerLock();const k='elektro-best-'+EL.niv,b=LS.get(k,null),rek=b==null||EL.tid<b;if(rek)LS.set(k,EL.tid);
      $('gDK').textContent='Jobben er ferdig!';$('gDT').textContent=fmtT(EL.tid);$('gDInfo').innerHTML=(rek?'<b>Ny rekord!</b> ':`Rekorden er ${fmtT(b)}. `)+`Feilen var ${EL.type==='brudd'?'et brudd':'en dårlig forbindelse (overgang)'} i ${p.type==='boks'?'en koblingsboks':'en stikkontakt'} på ${KURS[EL.kurs].id}, ${p.rom.name.toLowerCase()}. ${EL.målt.size} målinger`+(EL.åpnet?`, ${EL.åpnet} feil åpnet (+${EL.åpnet*ELN[EL.niv].straff} s).`:'.');$('gDone').hidden=false},900)},900)}
  else{EL.åpnet++;EL.tid+=ELN[EL.niv].straff;toast(`Alt ser fint ut her. +${ELN[EL.niv].straff} s`);const a=ac();if(a)tone(220,a.currentTime,0.25,0.12,'sawtooth')}}
function elStep(dt,now){const n=ELN[EL.niv];EL.tid+=dt;$('gTime').textContent=fmtT(EL.tid);
  let pr=null,bd=1e9;
  if(lvOf(wp.y)==='B'&&Math.hypot(camera.position.x-SKAP.x,camera.position.z-SKAP.z)<1.9){pr={i:-1}}
  else EL.pkt.forEach((p,i)=>{const h=sikt(p.x,p.y,p.z,1.3,n.sikt);if(h!==false&&h<bd){bd=h;pr={i}}});
  EL.prompt=pr;
  if(pr){const p=pr.i<0?null:EL.pkt[pr.i];const navn=pr.i<0?`kursen ${KURS[EL.kurs].id} i sikringsskapet`:p.type==='boks'?'koblingsboksen':'stikkontakten';
    $('gPrompt').hidden=false;$('gPrompt').innerHTML=(isTouch?'<b>Bruk</b>':'<b>E</b>')+` måler ${navn}`+(pr.i>=0&&!p.åpnet?(isTouch?' · hold <b>Bruk</b> for å åpne':' · <b>Q</b> åpner'):'');$('gBrukB').classList.add('klar')}
  else{$('gPrompt').hidden=true;$('gBrukB').classList.remove('klar')}}
function elBruk(lang){const p=EL.prompt;if(!p)return;if(lang&&p.i>=0)åpne(p.i);else mål(p.i)}
// felles taster og «Bruk»-knappen for de nye spillene (E = bruk, Q = alternativ, C = huk)
addEventListener('keydown',e=>{if(G.mode==='montor'&&MT.påStige&&G.on&&e.code==='Escape'){gamePause();return}if(!G.on||G.paused||e.repeat)return;
  if(G.mode==='gjem'&&(e.code==='KeyC'||e.code==='ControlLeft')){G.huk=!G.huk;$('gHukB').classList.toggle('on',G.huk)}
  if(G.mode==='montor'&&(e.code==='KeyE'||e.code==='Enter'))montBruk(false);if(G.mode==='montor'&&e.code==='KeyQ'&&MT.påStige)klatreNed();
  if(G.mode==='elektro'&&(e.code==='KeyE'||e.code==='Enter'))elBruk(false);if(G.mode==='elektro'&&e.code==='KeyQ')elBruk(true)});
{let t0=0,tm=null;const b=$('gBrukB');b.addEventListener('pointerdown',()=>{if(G.mode!=='montor'&&G.mode!=='elektro')return;t0=performance.now();tm=setTimeout(()=>{tm=null;if(G.mode==='montor')montBruk(true);else elBruk(true)},600)});
 b.addEventListener('pointerup',()=>{if(G.mode!=='montor'&&G.mode!=='elektro')return;if(tm){clearTimeout(tm);tm=null;if(G.mode==='montor')montBruk(false);else elBruk(false)}})}
$('gHukB').addEventListener('pointerdown',e=>{e.preventDefault();G.huk=!G.huk;$('gHukB').classList.toggle('on',G.huk)});

/* ---------- oppstart ---------- */
window.__spill={GJ,MT,EL,startGjem,startMont,startEl,gjemStep,montStep,elStep,montBruk,elBruk,settStige,klatreOpp,heng,romGraf,åpne,mål,YT,ytelse,flG,PK,ST,KURS,startPakke,startStrom,pakkeStep,stromStep,skapÅpne,trekkUt,AK,akeStep,startAke,NIS,S,G,fang,SNO,kast,snoStep,snoFysikk,sim:(n,dt)=>{for(let i=0;i<n;i++){SNO.ms+=dt*1000;snoFysikk(dt,SNO.ms);if(G.on&&!G.paused)snoStep(dt,SNO.ms)}}};
ui.classList.add('menu');setLevel('A');controls.autoRotate=true;menyKamera();
const klar=()=>{$('gStart').disabled=false;$('gStart').textContent='Start'};
const t0=performance.now();(function vent(){if((typeof droneG!=='undefined'&&droneG.children.length>0&&terrainMesh)||performance.now()-t0>15000){tidSett();ytelseStart();klar()}else setTimeout(vent,300)})();
})();
