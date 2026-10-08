/* V10 — genuine Three.js/WebGL hero. If CDN/WebGL is unavailable, the native canvas fallback stays visible. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

(() => {
  'use strict';
  const canvas=document.getElementById('hero-webgl');
  const host=document.querySelector('.hero-visual');
  if(!canvas||!host)return;
  let renderer;
  try { renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'}); }
  catch(e){console.warn('Using canvas fallback: WebGL could not start.',e);return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<700?1.2:1.65));
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.42;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(40,1,.1,160);
  camera.position.set(0,1.6,11.8);
  const controls=new OrbitControls(camera,canvas);
  controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.075;
  controls.minDistance=7.9;controls.maxDistance=15.8;
  controls.minPolarAngle=.48;controls.maxPolarAngle=2.52;
  controls.rotateSpeed=.38;controls.zoomSpeed=.44;
  controls.autoRotate=false;
  controls.target.set(0,0,0);

  // Procedural seeded fractal surface texture: no large external asset downloads.
  const texCanvas=document.createElement('canvas');texCanvas.width=512;texCanvas.height=256;
  const cx=texCanvas.getContext('2d');
  if(cx){
    const data=cx.createImageData(512,256);
    const fract=n=>n-Math.floor(n);
    const hash=(x,y)=>fract(Math.sin(x*127.1+y*311.7)*43758.54);
    function noise(x,y){const xi=Math.floor(x),yi=Math.floor(y),a=x-xi,b=y-yi,u=a*a*(3-2*a),v=b*b*(3-2*b);
      const mix=(a,b,t)=>a+(b-a)*t;
      return mix(mix(hash(xi,yi),hash(xi+1,yi),u),mix(hash(xi,yi+1),hash(xi+1,yi+1),u),v);}
    for(let y=0;y<256;y++)for(let x=0;x<512;x++){
      const phi=(y/256-.5)*Math.PI;
      const longitude=x/512*Math.PI*2;
      const bands=Math.sin(phi*16+Math.sin(longitude*3)*1.4)*.11;
      let n=0,a=.5,scale=2.0;
      for(let k=0;k<5;k++){n+=a*noise(x/512*scale*5+4,y/256*scale*4+7);a*=.54;scale*=2;}
      n=Math.max(0,Math.min(1,n+bands));
      const cloud=noise(x/512*23+18,y/256*14+24)*.13;
      const px=(y*512+x)*4;
      data.data[px]=Math.round(9+72*n+cloud*28);
      data.data[px+1]=Math.round(55+112*n+cloud*40);
      data.data[px+2]=Math.round(79+117*n+cloud*55);
      data.data[px+3]=255;
    }
    cx.putImageData(data,0,0);
  }
  const tex=new THREE.CanvasTexture(texCanvas);tex.colorSpace=THREE.SRGBColorSpace;
  tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const world=new THREE.Group();scene.add(world);
  const core=new THREE.Group();world.add(core);
  const planet=new THREE.Mesh(new THREE.SphereGeometry(1.54,68,52),
    new THREE.MeshPhysicalMaterial({map:tex,roughness:.5,metalness:.1,clearcoat:.22,emissive:0x0c2833,emissiveIntensity:.38}));
  core.add(planet);planet.userData.destination='about';
  const network=new THREE.Mesh(new THREE.IcosahedronGeometry(1.574,4),
    new THREE.MeshBasicMaterial({color:0x8bfde1,transparent:true,wireframe:true,opacity:.105,depthWrite:false}));
  core.add(network);
  const atmos=new THREE.Mesh(new THREE.SphereGeometry(1.73,64,48),new THREE.ShaderMaterial({
    transparent:true,side:THREE.BackSide,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{uColor:{value:new THREE.Color(0x4aebcc)}},
    vertexShader:`varying vec3 vNormal; varying vec3 vView; void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vView=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform vec3 uColor; varying vec3 vNormal; varying vec3 vView;void main(){float fres=pow(1.-abs(dot(normalize(vNormal),normalize(vView))),3.0);gl_FragColor=vec4(uColor,fres*.64);}`
  }));core.add(atmos);
  const light=new THREE.DirectionalLight(0xc7fff1,3.2);light.position.set(-5,4,7);scene.add(light);
  const fill=new THREE.PointLight(0x66aaff,64,23,1.65);fill.position.set(5,-3,-4);scene.add(fill);
  const halo=new THREE.AmbientLight(0x4a91aa,1.3);scene.add(halo);
  // Orbital traces in 3D, with visible near/far depth.
  const orbitRadii=[2.55,3.35,4.13,4.95,5.5];
  const orbitAngles=[.28,-.55,.76,-.2,.45];
  orbitRadii.forEach((r,i)=>{
    const curve=new THREE.EllipseCurve(0,0,r,r*.42,0,Math.PI*2,false,0);
    const points=curve.getPoints(230).map(p=>new THREE.Vector3(p.x,p.y,0));
    const geometry=new THREE.BufferGeometry().setFromPoints(points);
    const track=new THREE.LineLoop(geometry,new THREE.LineBasicMaterial({color:i%2?0x86bcff:0x6be9d6,transparent:true,opacity:i%2?.28:.39}));
    track.rotation.x=1.15+i*.12;track.rotation.z=orbitAngles[i];world.add(track);
  });
  const sphereMat=(color)=>new THREE.MeshPhysicalMaterial({color,metalness:.1,roughness:.34,clearcoat:.82});
  const destinations=[
    {label:'ABOUT',id:'about',color:0x95ffe3,size:.29,radius:2.55,speed:.29,phase:.1,tilt:.28},
    {label:'PROJECTS',id:'projects',color:0x88bbff,size:.42,radius:3.35,speed:-.21,phase:2.1,tilt:-.55},
    {label:'SKILLS',id:'skills',color:0xffd197,size:.27,radius:4.13,speed:.17,phase:3.2,tilt:.76},
    {label:'ACTIVITY',id:'activity',color:0xc5b0ff,size:.25,radius:4.95,speed:-.13,phase:1.35,tilt:-.2},
    {label:'CONTACT',id:'contact',color:0x72e7ff,size:.23,radius:5.5,speed:.10,phase:4.7,tilt:.45}
  ];
  const interactables=[planet];
  const satellites=[];
  for(const [i,d] of destinations.entries()){
    const p=new THREE.Mesh(new THREE.SphereGeometry(d.size,40,32),sphereMat(d.color));
    p.userData.destination=d.id;
    p.userData.label=d.label;
    world.add(p);interactables.push(p);
    satellites.push({p,d});
    if(i===1){const ring=new THREE.Mesh(new THREE.TorusGeometry(d.size*1.55,.015,6,100),new THREE.MeshBasicMaterial({color:0xbad8ff,transparent:true,opacity:.66}));ring.rotation.x=1.1;p.add(ring);}
  }
  // Starfield with vertex shader twinkle; moving with cursor camera.
  const N=innerWidth<780?1050:2400;
  const positions=new Float32Array(N*3),sizes=new Float32Array(N),phases=new Float32Array(N);
  for(let i=0;i<N;i++){
    const radius=11+Math.random()*32,theta=Math.random()*Math.PI*2,z=(Math.random()-.5)*1.5;
    positions[i*3]=Math.cos(theta)*radius;positions[i*3+1]=z*radius*.55;positions[i*3+2]=Math.sin(theta)*radius-12;
    sizes[i]=Math.random()*1.8+.6;phases[i]=Math.random()*6.28;
  }
  const starsGeo=new THREE.BufferGeometry();
  starsGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
  starsGeo.setAttribute('aSize',new THREE.BufferAttribute(sizes,1));
  starsGeo.setAttribute('aPhase',new THREE.BufferAttribute(phases,1));
  const starsMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{uTime:{value:0},uRatio:{value:Math.min(devicePixelRatio||1,1.65)}},
    vertexShader:`attribute float aSize; attribute float aPhase;uniform float uTime;uniform float uRatio;varying float vFade;
      void main(){vec4 view=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*view;
        vFade=.45+.45*sin(uTime*1.4+aPhase);gl_PointSize=min(4.,aSize*uRatio*25./max(5.,-view.z));}`,
    fragmentShader:`varying float vFade;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.0,d)*vFade;gl_FragColor=vec4(vec3(.58,.92,1.),a);}`
  });
  const stars=new THREE.Points(starsGeo,starsMat);scene.add(stars);
  // A diffuse spiral of orbiting dust points around the planets.
  const count=620,spiral=new Float32Array(count*3);
  for(let i=0;i<count;i++){
    const r=1.7+Math.random()*4.3,angle=r*3.5+(i%3)*2.09+(Math.random()-.5)*.6;
    spiral[i*3]=Math.cos(angle)*r;spiral[i*3+1]=(Math.random()-.5)*.9;spiral[i*3+2]=Math.sin(angle)*r;
  }
  const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(spiral,3));
  const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({size:.033,color:0x77dccb,transparent:true,opacity:.52,depthWrite:false,blending:THREE.AdditiveBlending}));
  dust.rotation.x=.85;world.add(dust);
  // Orbital comet: coloured glowing bead + history samples (actual particle trails).
  const comet=new THREE.Mesh(new THREE.SphereGeometry(.055,12,10),new THREE.MeshBasicMaterial({color:0xd1fff8}));world.add(comet);
  const trailSegments=64,trailBuffer=new Float32Array(trailSegments*3);
  const trailGeo=new THREE.BufferGeometry();trailGeo.setAttribute('position',new THREE.BufferAttribute(trailBuffer,3));
  const trail=new THREE.Line(trailGeo,new THREE.LineBasicMaterial({color:0x66ffdc,transparent:true,opacity:.59}));world.add(trail);

  const raycaster=new THREE.Raycaster(),cursorVec=new THREE.Vector2(),pointer={x:0,y:0,tx:0,ty:0};
  let motion=!matchMedia('(prefers-reduced-motion: reduce)').matches,visible=true,inView=true,disposed=false,raf=0,last=0,elapsed=0,down=null;
  function resize(){const r=host.getBoundingClientRect();if(r.width<2||r.height<2)return;
    renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
  const intersection=new IntersectionObserver(entries=>{inView=!!entries[0]?.isIntersecting;if(inView)requestFrame();else{cancelAnimationFrame(raf);raf=0;}},{threshold:.03});intersection.observe(host);
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
  function coordinates(event){const r=canvas.getBoundingClientRect();cursorVec.set((event.clientX-r.left)/r.width*2-1,-((event.clientY-r.top)/r.height)*2+1);}
  function pick(event){coordinates(event);raycaster.setFromCamera(cursorVec,camera);return raycaster.intersectObjects(interactables,false)[0]?.object||null;}
  canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();pointer.tx=((e.clientX-r.left)/r.width-.5)*2;pointer.ty=((e.clientY-r.top)/r.height-.5)*2;
    if(e.buttons===0)canvas.style.cursor=pick(e)?'pointer':'grab';},{passive:true});
  canvas.addEventListener('pointerleave',()=>{pointer.tx=0;pointer.ty=0;canvas.style.cursor='grab';},{passive:true});
  canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,t:performance.now()};},{passive:true});
  canvas.addEventListener('pointerup',e=>{if(!down)return;
    const dist=Math.hypot(e.clientX-down.x,e.clientY-down.y);down=null;
    if(dist>8)return;
    const object=pick(e);const id=object?.userData.destination;
    if(id)window.V10Warp?.travel(id,object.userData.label||id.toUpperCase());
  },{passive:true});
  const startDistance=11.8;
  function update(time){
    raf=0;if(!visible||!inView||disposed)return;
    const dt=Math.min((time-last||16)/1000,.055);last=time;
    if(motion)elapsed+=dt;
    pointer.x+=(pointer.tx-pointer.x)*.045;pointer.y+=(pointer.ty-pointer.y)*.045;
    const entry=Math.min(1,elapsed/2.1),ease=1-Math.pow(1-entry,3);
    // Camera approaches on arrival; mouse gives a subtle parallax orbit.
    controls.target.set(0,0,0);
    camera.position.x+=(pointer.x*.8-camera.position.x)*.025;
    const desiredY=1.25-pointer.y*.5;
    camera.position.y+=(desiredY-camera.position.y)*.023;
    const desiredZ=11.8-ease*1.4;
    camera.position.z+=(desiredZ-camera.position.z)*.018;
    if(motion){
      controls.autoRotate=innerWidth>700;controls.autoRotateSpeed=.32;controls.update();
      world.rotation.y+=dt*.10;planet.rotation.y+=dt*.15;network.rotation.y-=dt*.11;network.rotation.z+=dt*.06;
      stars.rotation.y+=dt*.0012;dust.rotation.y+=dt*.035;
      for(const {p,d} of satellites){const a=elapsed*d.speed+d.phase;
        p.position.set(Math.cos(a)*d.radius,Math.sin(a*.75+d.tilt)*.7,Math.sin(a)*d.radius*.66);
        p.rotation.y+=dt*.6;}
      const phase=elapsed*.74;
      comet.position.set(Math.cos(phase)*4,Math.sin(phase*1.8)*.55,Math.sin(phase)*2.2);
      for(let i=0;i<trailSegments;i++){const a=phase-i*.032;trailBuffer[i*3]=Math.cos(a)*4;trailBuffer[i*3+1]=Math.sin(a*1.8)*.55;trailBuffer[i*3+2]=Math.sin(a)*2.2;}
      trailGeo.attributes.position.needsUpdate=true;
      starsMat.uniforms.uTime.value=elapsed;
    }else{controls.autoRotate=false;controls.update();}
    renderer.render(scene,camera);
    if(motion)requestFrame();
  }
  function requestFrame(){if(!raf&&visible&&inView&&!disposed)raf=requestAnimationFrame(update);}
  window.addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',()=>{visible=!document.hidden;if(!visible){cancelAnimationFrame(raf);raf=0;}else requestFrame();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();disposed=true;document.body.classList.remove('three-ready');},false);
  resize();
  try{renderer.render(scene,camera);document.body.classList.add('three-ready');document.body.dataset.heroEngine='threejs';}
  catch(e){console.warn('Three.js render failed; using canvas fallback.',e);return;}
  window.V10Three={setMotion(enabled){motion=!!enabled;if(!motion){cancelAnimationFrame(raf);raf=0;update(performance.now());}else requestFrame();}};
  requestFrame();
})();
