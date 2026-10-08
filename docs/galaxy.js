/* V10 — real fragment-shader galaxy. WebGL1, no dependency, accessible CSS fallback. */
(() => {
  'use strict';
  const canvas = document.getElementById('galaxy-field');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', {alpha: true, antialias: false, depth: false, powerPreference: 'low-power'});
  if (!gl) { document.body.classList.add('galaxy-fallback'); return; }

  const vertex = `attribute vec2 a_position;
    void main(){gl_Position=vec4(a_position,0.,1.);}`;
  const fragment = `precision highp float;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform float u_time;
    uniform float u_scroll;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
    float fbm(vec2 p){float n=0.,a=.5;for(int i=0;i<5;i++){n+=a*noise(p);p=p*2.02+vec2(37.1,11.7);a*=.49;}return n;}
    float stars(vec2 p,float density,float cutoff){vec2 id=floor(p*density),f=fract(p*density)-.5;
      float h=hash(id),r=length(f-vec2(hash(id+2.1)-.5,hash(id+9.4)-.5)*.54);
      float core=smoothstep(.065,.0,r)*(step(cutoff,h));
      float twinkle=.55+.45*sin(u_time*(.9+hash(id+6.3)*1.9)+h*6.28);
      float halo=smoothstep(.2,.015,r)*step(cutoff+.035,h)*.17;
      return core*twinkle+halo;}
    void main(){vec2 uv=gl_FragCoord.xy/u_resolution;
      float aspect=u_resolution.x/u_resolution.y;
      vec2 pos=(uv-.5)*vec2(aspect,1.);
      pos-= (u_mouse-.5)*vec2(.045,.035);
      float t=u_time*.052;
      vec2 drift=vec2(t*.24,-t*.13)+vec2(u_scroll*.015,0.);
      float radial=length(pos-vec2(.05,-.06));
      float angle=atan(pos.y-.02,pos.x+.02)+radial*2.1+t*.10;
      vec2 swirl=vec2(cos(angle),sin(angle))*radial;
      float wave=fbm(swirl*2.65+drift);
      float ridge=fbm(swirl*4.1-drift*1.25+wave*.75);
      float cloud=smoothstep(.29,.76,wave*.73+ridge*.43);
      float broad=exp(-radial*1.85);
      vec3 teal=vec3(.021,.24,.24);
      vec3 cyan=vec3(.045,.15,.29);
      vec3 violet=vec3(.09,.072,.23);
      float hue=fbm(pos*1.1+drift*.45);
      vec3 color=mix(teal,cyan,smoothstep(.28,.72,hue));
      color=mix(color,violet,smoothstep(.53,.83,ridge)*.46);
      color*=cloud*broad*.49;
      float filaments=pow(max(0.,sin(angle*3.1+radial*8.5+wave*3.6)),7.)*broad*.026;
      color+=vec3(.05,.18,.21)*filaments;
      vec2 layers=pos*vec2(1.,.92);
      float s1=stars(layers+drift*.025,34.,.982);
      float s2=stars(layers*1.4-drift*.045,66.,.989);
      color+=vec3(.45,.73,.85)*s1*.65+vec3(.3,.6,.72)*s2*.39;
      float dust=hash(floor(uv*u_resolution*.44+u_time*.01))-.5;
      color+=dust*.0028;
      float vignette=1.-smoothstep(.53,1.1,length(pos));
      color*=vignette*.75+.25;
      gl_FragColor=vec4(max(color,0.),.9);
    }`;

  const makeShader = (type, code) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, code); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('Galaxy shader:', gl.getShaderInfoLog(shader)); gl.deleteShader(shader); return null;
    }
    return shader;
  };
  const vs = makeShader(gl.VERTEX_SHADER, vertex);
  const fs = makeShader(gl.FRAGMENT_SHADER, fragment);
  if (!vs || !fs) { document.body.classList.add('galaxy-fallback'); return; }
  const program = gl.createProgram();
  gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { document.body.classList.add('galaxy-fallback'); return; }
  gl.useProgram(program);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const posLoc=gl.getAttribLocation(program,'a_position');
  gl.enableVertexAttribArray(posLoc);gl.vertexAttribPointer(posLoc,2,gl.FLOAT,false,0,0);
  const uRes=gl.getUniformLocation(program,'u_resolution');
  const uMouse=gl.getUniformLocation(program,'u_mouse');
  const uTime=gl.getUniformLocation(program,'u_time');
  const uScroll=gl.getUniformLocation(program,'u_scroll');

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let playing = !reduced.matches, visible = !document.hidden, raf=0;
  let pointer={x:.5,y:.5}, smooth={x:.5,y:.5}, time=0, last=0, first=0;
  function resize(){
    const ratio=Math.min(devicePixelRatio||1,innerWidth<760?.82:1.1);
    const w=Math.max(1,Math.floor(innerWidth*ratio)),h=Math.max(1,Math.floor(innerHeight*ratio));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
  }
  function paint(now){
    raf=0;if(!visible)return;
    if(playing&&now-last<26){raf=requestAnimationFrame(paint);return;}
    if(!first)first=now;
    if(playing)time+=(Math.min(now-last||16,50)/1000);
    last=now;
    smooth.x+=(pointer.x-smooth.x)*.035;
    smooth.y+=(pointer.y-smooth.y)*.035;
    resize();
    gl.useProgram(program);
    gl.uniform2f(uRes,canvas.width,canvas.height);
    gl.uniform2f(uMouse,smooth.x,1-smooth.y);
    gl.uniform1f(uTime,time);
    gl.uniform1f(uScroll,scrollY/Math.max(innerHeight,1));
    gl.drawArrays(gl.TRIANGLES,0,6);
    if(playing)raf=requestAnimationFrame(paint);
  }
  function kick(){if(visible&&!raf)raf=requestAnimationFrame(paint);}
  window.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;pointer.x=e.clientX/innerWidth;pointer.y=e.clientY/innerHeight;},{passive:true});
  window.addEventListener('resize',kick,{passive:true});
  document.addEventListener('visibilitychange',()=>{visible=!document.hidden;if(!visible){cancelAnimationFrame(raf);raf=0;}else kick();});
  window.V10Galaxy={setMotion(value){playing=!!value;if(!playing){cancelAnimationFrame(raf);raf=0;paint(performance.now());}else kick();}};
  kick();
})();
