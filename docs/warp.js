/* V10 — fullscreen star warp intro and navigation travel transitions. */
(() => {
  'use strict';
  const intro=document.getElementById('intro-loader');
  const canvas=document.getElementById('warp-canvas');
  const skip=document.getElementById('warp-skip');
  const transition=document.getElementById('warp-transition');
  const destination=document.getElementById('warp-destination');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let raf=0, start=performance.now(), finishing=false, travelling=false;
  let ctx=canvas?.getContext('2d');
  const particles=Array.from({length:190},()=>({x:(Math.random()-.5)*2,y:(Math.random()-.5)*2,z:Math.random()*.98+.015,seed:Math.random()}));
  const endIntro=()=>{
    if(finishing)return;finishing=true;
    intro?.classList.add('hidden');
    document.body.classList.add('intro-complete');
    if(raf)cancelAnimationFrame(raf);
    setTimeout(()=>intro?.remove(),750);
  };
  function draw(time){
    if(!intro||finishing||document.hidden||!ctx)return;
    const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,1.3);
    if(canvas.width!==Math.floor(w*dpr)||canvas.height!==Math.floor(h*dpr)){
      canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    ctx.fillStyle='#030911';ctx.fillRect(0,0,w,h);
    const cx=w*.5,cy=h*.5,scale=Math.max(w,h)*.64;
    const elapsed=(time-start)/1000;
    const speed=.004+Math.min(elapsed/2,1)*.015;
    for(const p of particles){
      const old=p.z;p.z-=speed*(.5+p.seed*.9);if(p.z<=.016){p.z=1;p.x=(Math.random()-.5)*2;p.y=(Math.random()-.5)*2;}
      const sx=cx+p.x/p.z*scale,sy=cy+p.y/p.z*scale;
      const ox=cx+p.x/(old+.05)*scale,oy=cy+p.y/(old+.05)*scale;
      if(sx<0||sx>w||sy<0||sy>h)continue;
      ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(sx,sy);
      ctx.strokeStyle=`rgba(${p.seed>.62?'128,255,220':'149,185,255'},${Math.min(.9,(1-p.z)*.75+.15)})`;
      ctx.lineWidth=Math.max(.5,(1-p.z)*1.8);ctx.stroke();
    }
    raf=requestAnimationFrame(draw);
  }
  skip?.addEventListener('click',endIntro);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){endIntro();if(travelling)transition?.classList.remove('travelling');}});
  if(!intro || reduced.matches)endIntro();
  else {
    // Allow reading the page quickly; never trap the visitor in the intro.
    if(ctx)raf=requestAnimationFrame(draw);
    addEventListener('load',()=>setTimeout(endIntro,1850),{once:true});
    setTimeout(endIntro,3200); // contingency for slow third-party assets
  }
  function travel(id, label){
    const node=document.getElementById(id);
    if(!node||travelling)return false;
    if(reduced.matches){node.scrollIntoView({behavior:'auto',block:'start'});history.replaceState(null,'',`#${id}`);return true;}
    if(!transition){node.scrollIntoView({behavior:'smooth',block:'start'});return true;}
    travelling=true;
    if(destination)destination.textContent=label||id.toUpperCase();
    transition.classList.add('travelling');
    setTimeout(()=>{node.scrollIntoView({behavior:'smooth',block:'start'});history.replaceState(null,'',`#${id}`);},300);
    setTimeout(()=>{transition.classList.remove('travelling');travelling=false;},1050);
    return true;
  }
  document.addEventListener('click',(event)=>{
    const link=event.target.closest('a[href^="#"]');
    if(!link || link.classList.contains('skip-link')||event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const id=link.getAttribute('href').slice(1);
    const label=link.getAttribute('aria-label')?.replace(/^Travel to /,'')||link.textContent.trim().slice(0,25);
    if(document.getElementById(id)){
      event.preventDefault();endIntro();travel(id,label);
    }
  });
  window.V10Warp={travel,endIntro};
})();
