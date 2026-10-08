/* Portfolio V10: accessible navigation, live GitHub data and galaxy motion controls. */
(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let motionEnabled = !reduced.matches;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const siteHeader = $('.site-header');
  const menu = $('#menu-toggle');
  const nav = $('#main-navigation');
  const scrollBar = $('#scroll-progress');
  const cursorGlow = $('#cursor-glow');
  const motionToggle = $('#motion-toggle');
  const introLoader = $('#intro-loader');
  const planetNav = $('#planet-nav');

  // Motion is opt-in for users whose operating system requests reduced motion.
  const setMotion = enabled => {
    motionEnabled = enabled;
    document.body.classList.toggle('motion-off',!enabled);
    if (motionToggle) motionToggle.textContent = enabled ? 'Pause motion' : 'Resume motion';
    motionToggle?.setAttribute('aria-pressed',String(!enabled));
    window.Portfolio3D?.setMotion(enabled);
    window.V10Galaxy?.setMotion(enabled);
    window.V10Three?.setMotion(enabled);
    if (!enabled) {$$('.tilt-card').forEach(el=>{el.style.transform='';el.style.removeProperty('--glare-x');el.style.removeProperty('--glare-y');});$$('[data-float-hud]').forEach(el=>el.style.transform='');}
  };
  motionToggle?.addEventListener('click',()=>setMotion(!motionEnabled));
  if (motionToggle) setMotion(motionEnabled);
  reduced.addEventListener?.('change',e=>setMotion(!e.matches));

  // Intro / warp travel is handled by warp.js (with Skip and reduced-motion support).

  // Mobile navigation: keyboard operable and closes when a section is chosen.
  const setMenu = open => {
    nav?.classList.toggle('open',open);
    menu?.setAttribute('aria-expanded',String(open));
    menu?.setAttribute('aria-label',open?'Close navigation':'Open navigation');
  };
  menu?.addEventListener('click',()=>setMenu(menu.getAttribute('aria-expanded')!=='true'));
  nav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>setMenu(false)));
  document.addEventListener('keydown',ev=>{if(ev.key==='Escape')setMenu(false)});
  document.addEventListener('pointerdown',ev=>{if(menu&&nav&&!nav.contains(ev.target)&&!menu.contains(ev.target))setMenu(false)},{passive:true});

  // Progress indicator and soft cursor lighting (no heavy animation libraries).
  let scheduled=false;
  const onScroll=()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      const max=document.documentElement.scrollHeight-window.innerHeight;
      if(scrollBar)scrollBar.style.width=`${max>0?Math.min(100,100*window.scrollY/max):0}%`;
      siteHeader?.classList.toggle('scrolled',window.scrollY>15);
      document.body.style.setProperty('--scroll-y', String(window.scrollY));
      document.body.style.setProperty('--scroll-progress', max>0 ? String(window.scrollY/max) : '0');
      scheduled=false;
    });
  };
  window.addEventListener('scroll',onScroll,{passive:true});
  onScroll();
  if(cursorGlow){
    document.addEventListener('pointermove',ev=>{
      if(!motionEnabled||ev.pointerType==='touch')return;
      const y=ev.pageY;
      cursorGlow.style.opacity='1';
      if(y<1450){cursorGlow.style.left=`${ev.clientX}px`;cursorGlow.style.top=`${y}px`;}
    },{passive:true});
    document.addEventListener('pointerleave',()=>{cursorGlow.style.opacity='0.4';},{passive:true});
  }

  // IntersectionObserver progressively reveals content; hidden content remains
  // accessible when JS is unavailable or prefers-reduced-motion is enabled.
  const reveals=$$('[data-reveal]');
  if('IntersectionObserver' in window&&!reduced.matches){
    document.body.classList.add('motion-ready');
    const revealObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){entry.target.classList.add('revealed');revealObserver.unobserve(entry.target);}
      });
    },{rootMargin:'0px 0px -25px 0px',threshold:.07});
    reveals.forEach((node,i)=>{node.style.transitionDelay=`${Math.min(i%4,2)*75}ms`;revealObserver.observe(node);});
  }else reveals.forEach(el=>el.classList.add('revealed'));


  // Section activation for scroll-based cinematic transitions.
  const sections = $$('main section[id]');
  if ('IntersectionObserver' in window) {
    const sectionStateObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        entry.target.classList.toggle('section-active', entry.isIntersecting);
      });
    }, { threshold: 0.18, rootMargin: '-10% 0px -12% 0px' });
    sections.forEach(sectionStateObserver.observe.bind(sectionStateObserver));
  }

  // Floating HUD panels react slightly to cursor.
  const hudPanels = $$('[data-float-hud]');
  const supportsHudPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (supportsHudPointer && hudPanels.length) {
    hudPanels.forEach(panel => {
      const host = panel.closest('.hero-visual') || panel.parentElement;
      let raf = 0;
      host?.addEventListener('pointermove', (ev) => {
        if (!motionEnabled) return;
        const rect = host.getBoundingClientRect();
        const x = ((ev.clientX - rect.left) / rect.width - 0.5) * 10;
        const y = ((ev.clientY - rect.top) / rect.height - 0.5) * 10;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          panel.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        });
      }, { passive: true });
      host?.addEventListener('pointerleave', () => {
        panel.style.transform = '';
      }, { passive: true });
    });
  }

  // Highlight active section in the main nav and the orbit nav.
  const navLinks=nav ? [...nav.querySelectorAll('a[href^="#"]')] : [];
  const planetLinks=planetNav ? [...planetNav.querySelectorAll('.planet-link')] : [];
  const setActiveSection = id => {
    navLinks.forEach(link=>link.classList.toggle('active',link.getAttribute('href')===`#${id}`));
    planetLinks.forEach(link=>link.classList.toggle('active',link.dataset.planetTarget===id || (id==='top' && link.classList.contains('is-home'))));
  };
  if('IntersectionObserver' in window){
    const sectionObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        setActiveSection(entry.target.id);
      });
    },{rootMargin:'-10% 0px -65% 0px'});
    $$('main section[id]').forEach(sec=>sectionObserver.observe(sec));
  }
  window.addEventListener('scroll',()=>{ if(window.scrollY < 120) setActiveSection('top'); }, {passive:true});
  planetLinks.forEach(link=>link.addEventListener('click',()=>setMenu(false)));

  // Perspective transformations for mouse users; never hijack click or touch.
  const finePointer=window.matchMedia('(hover: hover) and (pointer: fine)');
  if(finePointer.matches){
    $$('[data-tilt]').forEach(card=>{
      let pending=0;
      card.addEventListener('pointermove',ev=>{
        if(!motionEnabled)return;
        const rect=card.getBoundingClientRect();
        const x=(ev.clientX-rect.left)/rect.width;
        const y=(ev.clientY-rect.top)/rect.height;
        if(pending)cancelAnimationFrame(pending);
        pending=requestAnimationFrame(()=>{
          const max=card.matches('.project-card')?6:8;
          card.style.transform=`perspective(1300px) rotateX(${((.5-y)*max*2).toFixed(2)}deg) rotateY(${((x-.5)*max*2).toFixed(2)}deg) translateY(-5px)`;
          card.style.setProperty('--glare-x',`${(x*100).toFixed(1)}%`);
          card.style.setProperty('--glare-y',`${(y*100).toFixed(1)}%`);
        });
      },{passive:true});
      card.addEventListener('pointerleave',()=>{
        if(pending)cancelAnimationFrame(pending);
        card.style.transform='';
      },{passive:true});
      card.addEventListener('focusout',()=>{card.style.transform=''});
    });
  }


  // Global cursor parallax for the cinematic scene.
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let parallaxRaf = 0;
    window.addEventListener('pointermove', ev => {
      if (!motionEnabled) return;
      if (parallaxRaf) cancelAnimationFrame(parallaxRaf);
      parallaxRaf = requestAnimationFrame(() => {
        const px = (ev.clientX / window.innerWidth - 0.5);
        const py = (ev.clientY / window.innerHeight - 0.5);
        document.body.style.setProperty('--pointer-x', px.toFixed(4));
        document.body.style.setProperty('--pointer-y', py.toFixed(4));
        document.body.style.setProperty('--pointer-shift-x', `${(px * 22).toFixed(2)}px`);
        document.body.style.setProperty('--pointer-shift-y', `${(py * 18).toFixed(2)}px`);
        document.body.style.setProperty('--copy-shift-x', `${(-px * 10).toFixed(2)}px`);
        document.body.style.setProperty('--copy-shift-y', `${(-py * 10).toFixed(2)}px`);
        document.body.style.setProperty('--hero-shift-x', `${(px * 6).toFixed(2)}px`);
        document.body.style.setProperty('--hero-shift-y', `${(py * 5).toFixed(2)}px`);
        document.body.style.setProperty('--hero-rotate-x', `${(-py * 4).toFixed(2)}deg`);
        document.body.style.setProperty('--hero-rotate-y', `${(px * 5).toFixed(2)}deg`);
      });
    }, { passive: true });
  }

  // Real public GitHub stats; no invented follower or star totals.
  const USER='Animesh-666';
  const API='https://api.github.com';
  const colors=['#65eac0','#58bdfa','#a48def','#ffbb70','#426f67'];
  const setStat=(name,value)=>{
    if(!Number.isFinite(value))return;
    $$(`[data-stat="${name}"]`).forEach(el=>{
      el.textContent=Intl.NumberFormat('en-US').format(value);
      el.dataset.real='true';
    });
  };
  const fetchJson=async(endpoint,timeout=9500)=>{
    const controller=new AbortController();
    const id=setTimeout(()=>controller.abort(),timeout);
    try{
      const response=await fetch(`${API}${endpoint}`,{headers:{Accept:'application/vnd.github+json'},signal:controller.signal});
      if(!response.ok)throw new Error(`GitHub responded ${response.status}`);
      return await response.json();
    }finally{clearTimeout(id)}
  };
  function renderLanguages(repos){
    const counts=new Map();
    repos.filter(repo=>!repo.fork && repo.language).forEach(repo=>counts.set(repo.language,(counts.get(repo.language)||0)+1));
    const entries=[...counts.entries()].sort((a,b)=>b[1]-a[1]);
    const legend=$('#language-legend');
    const donut=$('#language-donut');
    if(!legend||!donut)return;
    legend.replaceChildren();
    if(!entries.length){legend.textContent='No language data available';return}
    const top=entries.slice(0,4);
    const other=entries.slice(4).reduce((acc,item)=>acc+item[1],0);
    if(other)top.push(['Other',other]);
    const sum=top.reduce((acc,item)=>acc+item[1],0);
    let start=0;
    const wedges=[];
    top.forEach(([language,count],i)=>{
      const end=start+count/sum*100;
      wedges.push(`${colors[i]} ${start.toFixed(2)}% ${end.toFixed(2)}%`);
      start=end;
      const label=document.createElement('div');label.className='legend-item';
      const left=document.createElement('span');
      const bullet=document.createElement('i');bullet.style.background=colors[i];
      left.append(bullet,document.createTextNode(language));
      const amt=document.createElement('b');amt.textContent=String(count);
      label.append(left,amt);legend.append(label);
    });
    donut.style.background=`conic-gradient(${wedges.join(',')})`;
  }
  const note=$('#api-note');
  (async()=>{
    try {
      const [user,repos]=await Promise.all([
        fetchJson(`/users/${USER}`),
        fetchJson(`/users/${USER}/repos?per_page=100&type=owner`)
      ]);
      setStat('repos',user.public_repos);
      setStat('followers',user.followers);
      setStat('gists',user.public_gists);
      setStat('stars',repos.reduce((s,r)=>s+(r.stargazers_count||0),0));
      const center=$('#repo-count-center');if(center)center.textContent=String(user.public_repos);
      renderLanguages(repos);
      const repoStars=new Map(repos.map(r=>[r.full_name.toLowerCase(),r.stargazers_count]));
      $$('[data-project-stars]').forEach(el=>{
        const count=repoStars.get(el.dataset.projectStars.toLowerCase());
        if(Number.isFinite(count))el.textContent=`★ ${count}`;
      });
      if(note)note.textContent='Numbers reflect public GitHub data; language chart counts repositories, not lines of code.';
    }catch(e){
      const legend=$('#language-legend');
      if(legend)legend.textContent='GitHub data temporarily unavailable.';
      if(note)note.textContent='Live data unavailable right now. Visit GitHub for accurate activity and repository statistics.';
      console.info('Unable to load public GitHub data:',e.message);
    }
    const collaborative=$('[data-project-stars="subhadipmondal99/ReFeed"]');
    if(collaborative){
      try{
        const repo=await fetchJson('/repos/subhadipmondal99/ReFeed',6500);
        collaborative.textContent=`★ ${repo.stargazers_count}`;
      }catch{collaborative.textContent='☆ GitHub'}
    }
  })();

  const contribution=$('#contribution-image');
  contribution?.addEventListener('error',()=>{
    contribution.hidden=true;
    const err=$('#contrib-error');if(err)err.hidden=false;
  });
  const year=$('#year');if(year)year.textContent=String(new Date().getFullYear());
})();
