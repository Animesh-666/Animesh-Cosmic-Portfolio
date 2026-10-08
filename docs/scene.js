/* Portfolio V8: ultra-cinematic sci-fi scenes, orbit navigation ambience, starfields, and reactive section globes. */
(() => {
  'use strict';

  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let motionEnabled = !reducedQuery.matches;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function initAmbientNetwork() {
    const canvas = document.getElementById('ambient-network');
    if (!canvas) return { setMotion() {} };
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return { setMotion() {} };

    const state = {
      width: 0,
      height: 0,
      ratio: 1,
      nodes: [],
      pointer: { x: window.innerWidth * 0.5, y: window.innerHeight * 0.3, active: false },
      visible: !document.hidden,
      running: motionEnabled,
      raf: 0,
      cols: 0,
      rows: 0,
    };

    function buildNodes() {
      const spacing = window.innerWidth < 768 ? 78 : 92;
      state.cols = Math.ceil(state.width / spacing) + 1;
      state.rows = Math.ceil(state.height / spacing) + 1;
      state.nodes = [];
      for (let y = 0; y < state.rows; y += 1) {
        for (let x = 0; x < state.cols; x += 1) {
          state.nodes.push({
            x: x * spacing + (Math.random() - 0.5) * 18,
            y: y * spacing + (Math.random() - 0.5) * 18,
            phase: Math.random() * Math.PI * 2,
            size: Math.random() * 1.6 + 0.8,
          });
        }
      }
    }

    function resize() {
      state.ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      state.width = Math.max(window.innerWidth, document.documentElement.clientWidth);
      state.height = Math.max(window.innerHeight, document.documentElement.clientHeight);
      canvas.width = Math.floor(state.width * state.ratio);
      canvas.height = Math.floor(state.height * state.ratio);
      canvas.style.width = `${state.width}px`;
      canvas.style.height = `${state.height}px`;
      ctx.setTransform(state.ratio, 0, 0, state.ratio, 0, 0);
      buildNodes();
    }

    function draw(now) {
      state.raf = 0;
      if (!state.visible) return;
      const t = now * 0.001;
      ctx.clearRect(0, 0, state.width, state.height);

      const nodes = state.nodes.map((node) => {
        const fx = Math.cos(t * 0.22 + node.phase) * 8;
        const fy = Math.sin(t * 0.17 + node.phase) * 8;
        const x = node.x + fx;
        const y = node.y + fy;
        const dx = state.pointer.x - x;
        const dy = state.pointer.y - y;
        const d = Math.hypot(dx, dy);
        const influence = state.pointer.active ? Math.max(0, 1 - d / 180) : 0;
        return {
          x: x - dx * influence * 0.04,
          y: y - dy * influence * 0.04,
          size: node.size,
          influence,
        };
      });

      const radial = ctx.createRadialGradient(state.pointer.x, state.pointer.y, 10, state.pointer.x, state.pointer.y, 240);
      radial.addColorStop(0, 'rgba(76, 255, 205, 0.10)');
      radial.addColorStop(0.5, 'rgba(76, 255, 205, 0.05)');
      radial.addColorStop(1, 'rgba(76, 255, 205, 0)');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, state.width, state.height);

      const linkRadius = window.innerWidth < 768 ? 120 : 132;
      for (let i = 0; i < nodes.length; i += 1) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j += 1) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist > linkRadius) continue;
          const alpha = (1 - dist / linkRadius) * 0.12 + Math.max(a.influence, b.influence) * 0.32;
          ctx.strokeStyle = `rgba(90, 231, 212, ${alpha.toFixed(3)})`;
          ctx.lineWidth = Math.max(0.3, 1 - dist / linkRadius);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      nodes.forEach((node) => {
        ctx.beginPath();
        ctx.fillStyle = `rgba(166,255,238, ${(0.30 + node.influence * 0.5).toFixed(3)})`;
        ctx.arc(node.x, node.y, node.size + node.influence * 1.6, 0, Math.PI * 2);
        ctx.fill();
        if (node.influence > 0.12) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(88, 238, 197, ${(node.influence * 0.16).toFixed(3)})`;
          ctx.arc(node.x, node.y, node.size + node.influence * 8, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      if (state.running) state.raf = requestAnimationFrame(draw);
    }

    function kick() {
      if (!state.visible || state.raf) return;
      state.raf = requestAnimationFrame(draw);
    }

    function stop() {
      if (state.raf) cancelAnimationFrame(state.raf);
      state.raf = 0;
    }

    resize();
    if (state.running) kick(); else draw(performance.now());

    window.addEventListener('resize', () => { resize(); if (state.running) kick(); else draw(performance.now()); }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      state.visible = !document.hidden;
      if (!state.visible) stop(); else if (state.running) kick(); else draw(performance.now());
    });
    window.addEventListener('pointermove', (ev) => {
      if (ev.pointerType === 'touch') return;
      state.pointer.x = ev.clientX;
      state.pointer.y = ev.clientY;
      state.pointer.active = true;
      if (state.running) kick(); else draw(performance.now());
    }, { passive: true });
    window.addEventListener('pointerleave', () => { state.pointer.active = false; }, { passive: true });

    return {
      setMotion(enabled) {
        state.running = enabled;
        if (!enabled) { stop(); draw(performance.now()); }
        else kick();
      }
    };
  }

  function initHeroScene() {
    const canvas = document.getElementById('hero-scene');
    const visual = document.querySelector('.hero-visual');
    const fallback = document.getElementById('scene-fallback');
    if (!canvas || !visual) return { setMotion() {} };
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return { setMotion() {} };
    if (fallback) fallback.hidden = true;

    const state = {
      width: 0,
      height: 0,
      ratio: 1,
      globePoints: [],
      stars: [],
      deepStars: [],
      visible: !document.hidden,
      running: motionEnabled,
      inView: true,
      pointer: { x: 0, y: 0, tx: 0, ty: 0 },
      raf: 0,
      planets: [
        { rx: 1.65, ry: 0.52, angle: 0.3, speed: 0.42, size: 8, color: '#8ff7d3', phase: 0.8, zBias: 0.24 },
        { rx: 1.42, ry: 0.36, angle: -0.7, speed: -0.54, size: 6, color: '#a6c8ff', phase: 2.4, zBias: -0.18 },
        { rx: 1.85, ry: 0.44, angle: 1.2, speed: 0.26, size: 5, color: '#ffcc83', phase: 4.3, zBias: 0.05 },
        { rx: 1.25, ry: 0.62, angle: 0.9, speed: -0.34, size: 7, color: '#7ef8ea', phase: 5.1, zBias: 0.14 },
      ],
      rings: [
        { rx: 1.18, ry: 0.32, rz: Math.PI / 5, alpha: 0.8, width: 1.6, color: [127, 244, 219], speed: 0.38 },
        { rx: 1.42, ry: 0.52, rz: Math.PI / 2.5, alpha: 0.55, width: 1.4, color: [198, 228, 255], speed: -0.25 },
        { rx: 1.75, ry: 0.42, rz: Math.PI / 8, alpha: 0.28, width: 1.2, color: [113, 167, 255], speed: 0.18 },
      ],
    };

    // Fibonacci sphere points for the network globe.
    const count = 340;
    for (let i = 0; i < count; i += 1) {
      const y = 1 - (i / (count - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = Math.PI * (3 - Math.sqrt(5)) * i;
      state.globePoints.push({ x: Math.cos(theta) * radius, y, z: Math.sin(theta) * radius });
    }

    function buildStars() {
      const total = window.innerWidth < 768 ? 95 : 130;
      const deepTotal = window.innerWidth < 768 ? 42 : 64;
      state.stars = [];
      state.deepStars = [];
      for (let i = 0; i < total; i += 1) {
        state.stars.push({
          x: Math.random(),
          y: Math.random() * 0.92,
          size: Math.random() * 1.7 + 0.35,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.5 + 0.5,
          drift: (Math.random() - 0.5) * 0.0015,
          depth: Math.random() * 0.65 + 0.35,
        });
      }
      for (let i = 0; i < deepTotal; i += 1) {
        state.deepStars.push({
          x: Math.random(),
          y: Math.random(),
          size: Math.random() * 1.2 + 0.2,
          speed: Math.random() * 0.35 + 0.25,
          phase: Math.random() * Math.PI * 2,
          trail: Math.random() * 10 + 6,
          drift: (Math.random() - 0.5) * 0.0012
        });
      }
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      state.ratio = Math.min(window.devicePixelRatio || 1, 1.6);
      state.width = Math.max(1, rect.width);
      state.height = Math.max(1, rect.height);
      canvas.width = Math.floor(state.width * state.ratio);
      canvas.height = Math.floor(state.height * state.ratio);
      canvas.style.width = `${state.width}px`;
      canvas.style.height = `${state.height}px`;
      ctx.setTransform(state.ratio, 0, 0, state.ratio, 0, 0);
      buildStars();
    }

    function rotate3D(point, ax, ay, az) {
      let { x, y, z } = point;
      const cy = Math.cos(ay), sy = Math.sin(ay);
      [x, z] = [x * cy - z * sy, x * sy + z * cy];
      const cx = Math.cos(ax), sx = Math.sin(ax);
      [y, z] = [y * cx - z * sx, y * sx + z * cx];
      const cz = Math.cos(az), sz = Math.sin(az);
      [x, y] = [x * cz - y * sz, x * sz + y * cz];
      return { x, y, z };
    }

    function project(point, scale, cx, cy, perspective = 4.4) {
      const factor = perspective / (perspective - point.z * 1.12);
      return { x: cx + point.x * scale * factor, y: cy + point.y * scale * factor, factor, z: point.z };
    }

    function drawStars(t) {
      const px = state.pointer.x * 14;
      const py = state.pointer.y * 12;
      state.deepStars.forEach((star, i) => {
        const twinkle = (Math.sin(t * star.speed + star.phase) + 1) * 0.5;
        const x = ((star.x + t * star.drift) % 1) * state.width - px * 0.2;
        const y = star.y * state.height - py * 0.18;
        const trail = star.trail * (0.75 + twinkle * 0.45);
        ctx.strokeStyle = `rgba(125, 184, 255, ${(0.06 + twinkle * 0.08).toFixed(3)})`;
        ctx.lineWidth = Math.max(0.4, star.size * 0.8);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - trail, y + trail * 0.16);
        ctx.stroke();
      });

      state.stars.forEach((star, i) => {
        const twinkle = (Math.sin(t * star.speed + star.phase) + 1) * 0.5;
        const x = ((star.x + t * star.drift + i * 0.00003) % 1) * state.width - px * star.depth * 0.12;
        const y = star.y * state.height - py * star.depth * 0.1;
        ctx.beginPath();
        ctx.fillStyle = `rgba(190, 236, 255, ${(0.18 + twinkle * 0.42).toFixed(3)})`;
        ctx.arc(x, y, star.size + twinkle * 0.8, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function drawGrid(vanishX, horizonY) {
      ctx.save();
      ctx.strokeStyle = 'rgba(84, 201, 180, 0.12)';
      ctx.lineWidth = 1;
      const bottom = state.height - 18;
      for (let i = -9; i <= 9; i += 1) {
        const x = vanishX + i * state.width * 0.1;
        ctx.beginPath();
        ctx.moveTo(x, bottom);
        ctx.lineTo(vanishX + i * 6, horizonY);
        ctx.stroke();
      }
      for (let i = 0; i < 9; i += 1) {
        const p = i / 8;
        const eased = p * p;
        const y = horizonY + eased * (bottom - horizonY);
        ctx.beginPath();
        ctx.moveTo(16, y);
        ctx.lineTo(state.width - 16, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawEllipseRing(ring, centerX, centerY, scale, ax, ay, t) {
      const points = [];
      for (let i = 0; i <= 150; i += 1) {
        const a = (i / 150) * Math.PI * 2;
        let p = { x: Math.cos(a) * ring.rx, y: Math.sin(a) * ring.ry, z: 0 };
        p = rotate3D(p, ay * 0.4, ax + ring.rz + t * 0.18 * ring.speed, t * 0.07 * ring.speed);
        points.push(project(p, scale, centerX, centerY, 4.7));
      }
      for (let phase = 0; phase < 2; phase += 1) {
        ctx.beginPath();
        let started = false;
        points.forEach((p) => {
          const front = p.z > 0;
          if ((phase === 0 && !front) || (phase === 1 && front)) { started = false; return; }
          if (!started) { ctx.moveTo(p.x, p.y); started = true; }
          else ctx.lineTo(p.x, p.y);
        });
        const alpha = phase === 1 ? ring.alpha : ring.alpha * 0.28;
        ctx.strokeStyle = `rgba(${ring.color[0]}, ${ring.color[1]}, ${ring.color[2]}, ${alpha.toFixed(3)})`;
        ctx.lineWidth = phase === 1 ? ring.width : ring.width * 0.85;
        ctx.stroke();
      }
    }

    function drawPlanets(centerX, centerY, scale, ax, ay, az, t) {
      state.planets.forEach((planet) => {
        const theta = t * planet.speed + planet.phase;
        let p = { x: Math.cos(theta) * planet.rx, y: Math.sin(theta) * planet.ry, z: planet.zBias };
        p = rotate3D(p, ax * 0.6, ay * 0.82 + planet.angle, az + planet.angle * 0.3);
        const projected = project(p, scale, centerX, centerY, 4.8);
        const radius = planet.size * projected.factor * 0.72;

        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${0.04 + projected.factor * 0.06})`;
        ctx.arc(projected.x, projected.y, radius * 3.2, 0, Math.PI * 2);
        ctx.fill();

        const grad = ctx.createRadialGradient(projected.x - radius * 0.35, projected.y - radius * 0.35, radius * 0.2, projected.x, projected.y, radius * 1.4);
        grad.addColorStop(0, 'rgba(255,255,255,0.92)');
        grad.addColorStop(0.35, planet.color + 'cc');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(projected.x, projected.y, radius * 1.3, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function drawGlobe(now) {
      state.raf = 0;
      if (document.body.classList.contains('three-ready')) return;
      if (!state.visible || !state.inView) return;
      const t = now * 0.001;
      ctx.clearRect(0, 0, state.width, state.height);

      const scrollY = window.scrollY || 0;
      const scrollFactor = clamp(scrollY / Math.max(window.innerHeight * 1.6, 1), 0, 1.35);
      state.pointer.x += (state.pointer.tx - state.pointer.x) * 0.05;
      state.pointer.y += (state.pointer.ty - state.pointer.y) * 0.05;
      const centerX = state.width * 0.56 + state.pointer.x * 28;
      const centerY = state.height * 0.49 + state.pointer.y * 18 - scrollFactor * 16;
      const scale = Math.min(state.width, state.height) * (0.24 + scrollFactor * 0.012);
      const ax = (state.running ? t * 0.28 : 0.5) + state.pointer.y * 0.48 + scrollFactor * 0.04;
      const ay = (state.running ? t * 0.42 : 0.9) + state.pointer.x * 0.68 + scrollFactor * 0.08;
      const az = Math.sin(t * 0.22) * 0.08 + state.pointer.x * 0.06;

      // Space backdrop inside hero.
      const bg = ctx.createLinearGradient(0, 0, state.width, state.height);
      bg.addColorStop(0, 'rgba(4, 10, 18, 0.24)');
      bg.addColorStop(0.35, 'rgba(6, 14, 22, 0.10)');
      bg.addColorStop(1, 'rgba(3, 8, 14, 0.20)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, state.width, state.height);

      const starSun = ctx.createRadialGradient(state.width * 0.16, state.height * 0.16, 8, state.width * 0.16, state.height * 0.16, state.width * 0.22);
      starSun.addColorStop(0, 'rgba(128, 194, 255, 0.10)');
      starSun.addColorStop(0.45, 'rgba(87, 255, 214, 0.08)');
      starSun.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = starSun;
      ctx.fillRect(0, 0, state.width, state.height);
      drawStars(t);

      const nebula = ctx.createRadialGradient(centerX + scale * 0.4, centerY - scale * 0.65, 10, centerX, centerY, scale * 2.8);
      nebula.addColorStop(0, 'rgba(69, 186, 255, 0.08)');
      nebula.addColorStop(0.35, 'rgba(70, 255, 190, 0.08)');
      nebula.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, state.width, state.height);

      // Perspective grid like the sci-fi reference.
      const vanishX = state.width * (0.5 + state.pointer.x * 0.08);
      const horizonY = state.height * (0.71 - scrollFactor * 0.02);
      drawGrid(vanishX, horizonY);

      // Planet aura and base sphere.
      const aura = ctx.createRadialGradient(centerX, centerY, scale * 0.2, centerX, centerY, scale * 1.9);
      aura.addColorStop(0, 'rgba(92, 252, 219, 0.20)');
      aura.addColorStop(0.45, 'rgba(62, 190, 170, 0.14)');
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(centerX, centerY, scale * 1.85, 0, Math.PI * 2);
      ctx.fill();

      const fillGrad = ctx.createRadialGradient(centerX - scale * 0.25, centerY - scale * 0.24, scale * 0.08, centerX, centerY, scale * 1.08);
      fillGrad.addColorStop(0, 'rgba(188,255,247,0.72)');
      fillGrad.addColorStop(0.2, 'rgba(88,239,212,0.54)');
      fillGrad.addColorStop(1, 'rgba(11,55,60,0.08)');
      ctx.fillStyle = fillGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, scale * 1.03, 0, Math.PI * 2);
      ctx.fill();

      const projected = state.globePoints.map((point) => project(rotate3D(point, ax, ay, az), scale, centerX, centerY, 4.35));
      const front = projected.filter((p) => p.z >= -0.04);
      const back = projected.filter((p) => p.z < -0.04);

      function drawConnections(group, frontLayer) {
        const maxDistance = scale * 0.24;
        for (let i = 0; i < group.length; i += 1) {
          const a = group[i];
          for (let j = i + 1; j < group.length; j += 1) {
            const b = group[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.hypot(dx, dy);
            if (dist > maxDistance) continue;
            const alpha = (1 - dist / maxDistance) * (frontLayer ? 0.42 : 0.08) * clamp((a.factor + b.factor) * 0.38, 0.65, 1.25);
            ctx.strokeStyle = frontLayer ? `rgba(96,255,222,${alpha.toFixed(3)})` : `rgba(107,196,176,${alpha.toFixed(3)})`;
            ctx.lineWidth = frontLayer ? 1 : 0.55;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      drawConnections(back, false);
      state.rings.forEach((ring) => drawEllipseRing(ring, centerX, centerY, scale, ax, ay, t));
      drawConnections(front, true);

      back.forEach((p) => {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(100, 192, 174, 0.18)';
        ctx.arc(p.x, p.y, Math.max(0.7, p.factor * 1.2), 0, Math.PI * 2);
        ctx.fill();
      });
      front.sort((a, b) => a.z - b.z).forEach((p) => {
        ctx.beginPath();
        ctx.fillStyle = `rgba(188,255,247,${clamp(0.34 + p.factor * 0.25, 0.38, 0.88).toFixed(3)})`;
        ctx.arc(p.x, p.y, Math.max(1.05, p.factor * 2.2), 0, Math.PI * 2);
        ctx.fill();
      });

      // glossy highlight
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, scale * 1.03, 0, Math.PI * 2);
      ctx.clip();
      const gloss = ctx.createLinearGradient(centerX - scale, centerY - scale, centerX + scale * 0.8, centerY + scale * 0.8);
      gloss.addColorStop(0, 'rgba(255,255,255,0.18)');
      gloss.addColorStop(0.28, 'rgba(255,255,255,0.06)');
      gloss.addColorStop(0.6, 'rgba(255,255,255,0)');
      ctx.fillStyle = gloss;
      ctx.fillRect(centerX - scale * 1.2, centerY - scale * 1.2, scale * 2.4, scale * 2.4);
      ctx.restore();

      drawPlanets(centerX, centerY, scale, ax, ay, az, t);

      // Cinematic travel routes between orbiting bodies.
      ctx.save();
      ctx.strokeStyle = 'rgba(122, 247, 219, 0.12)';
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX - scale * 1.55, centerY + scale * 0.72);
      ctx.quadraticCurveTo(centerX - scale * 0.25, centerY + scale * 0.08, centerX + scale * 1.35, centerY - scale * 0.52);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Tiny free-floating particles.
      for (let i = 0; i < 28; i += 1) {
        const a = t * 0.18 + i * 0.57;
        const x = centerX + Math.cos(a + i) * scale * (1.6 + (i % 4) * 0.05);
        const y = centerY + Math.sin(a * 1.33 + i) * scale * (0.85 + (i % 5) * 0.03);
        ctx.beginPath();
        ctx.fillStyle = 'rgba(112, 246, 211, 0.34)';
        ctx.arc(x, y, i % 3 === 0 ? 1.5 : 0.9, 0, Math.PI * 2);
        ctx.fill();
      }

      if (state.running) state.raf = requestAnimationFrame(drawGlobe);
    }

    function kick() {
      if (!state.visible || !state.inView || state.raf) return;
      state.raf = requestAnimationFrame(drawGlobe);
    }

    function stop() {
      if (state.raf) cancelAnimationFrame(state.raf);
      state.raf = 0;
    }

    const observer = new IntersectionObserver((entries) => {
      state.inView = Boolean(entries[0]?.isIntersecting);
      if (!state.inView) stop();
      else if (state.running) kick();
      else drawGlobe(performance.now());
    }, { threshold: 0.06 });
    observer.observe(visual);

    visual.addEventListener('pointermove', (ev) => {
      const rect = visual.getBoundingClientRect();
      state.pointer.tx = ((ev.clientX - rect.left) / rect.width - 0.5) * 1.08;
      state.pointer.ty = ((ev.clientY - rect.top) / rect.height - 0.5) * 0.92;
      if (state.running) kick(); else drawGlobe(performance.now());
    }, { passive: true });
    visual.addEventListener('pointerleave', () => {
      state.pointer.tx = 0;
      state.pointer.ty = 0;
    }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      state.visible = !document.hidden;
      if (!state.visible) stop();
      else if (state.running) kick();
      else drawGlobe(performance.now());
    });
    window.addEventListener('resize', () => { resize(); if (state.running) kick(); else drawGlobe(performance.now()); }, { passive: true });

    resize();
    if (state.running) kick(); else drawGlobe(performance.now());

    return {
      setMotion(enabled) {
        state.running = enabled;
        if (!enabled) { stop(); drawGlobe(performance.now()); }
        else kick();
      }
    };
  }


  function initSectionGlobe(canvasId, hostSelector, options = {}) {
    const canvas = document.getElementById(canvasId);
    const host = hostSelector ? document.querySelector(hostSelector) : canvas?.parentElement;
    if (!canvas || !host) return { setMotion() {} };
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return { setMotion() {} };

    const state = {
      width: 0,
      height: 0,
      ratio: 1,
      visible: !document.hidden,
      inView: true,
      running: motionEnabled,
      raf: 0,
      pointer: { x: 0, y: 0, tx: 0, ty: 0 },
      points: [],
      orbits: options.orbits || 2,
      glow: options.glow || 'rgba(104,245,211,0.18)',
    };

    const count = options.count || 150;
    for (let i = 0; i < count; i += 1) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = Math.PI * (3 - Math.sqrt(5)) * i;
      state.points.push({ x: Math.cos(theta) * r, y, z: Math.sin(theta) * r });
    }

    function resize() {
      const rect = host.getBoundingClientRect();
      state.width = Math.max(1, rect.width);
      state.height = Math.max(1, rect.height);
      state.ratio = Math.min(window.devicePixelRatio || 1, 1.6);
      canvas.width = Math.floor(state.width * state.ratio);
      canvas.height = Math.floor(state.height * state.ratio);
      canvas.style.width = `${state.width}px`;
      canvas.style.height = `${state.height}px`;
      ctx.setTransform(state.ratio, 0, 0, state.ratio, 0, 0);
    }

    function rotate(point, ax, ay, az) {
      let { x, y, z } = point;
      const cy = Math.cos(ay), sy = Math.sin(ay);
      [x, z] = [x * cy - z * sy, x * sy + z * cy];
      const cx = Math.cos(ax), sx = Math.sin(ax);
      [y, z] = [y * cx - z * sx, y * sx + z * cx];
      const cz = Math.cos(az), sz = Math.sin(az);
      [x, y] = [x * cz - y * sz, x * sz + y * cz];
      return { x, y, z };
    }

    function project(point, scale, cx, cy, perspective = 4.2) {
      const factor = perspective / (perspective - point.z * 1.1);
      return { x: cx + point.x * scale * factor, y: cy + point.y * scale * factor, z: point.z, factor };
    }

    function draw(now) {
      state.raf = 0;
      if (!state.visible || !state.inView) return;
      const t = now * 0.001;
      ctx.clearRect(0, 0, state.width, state.height);

      state.pointer.x += (state.pointer.tx - state.pointer.x) * 0.08;
      state.pointer.y += (state.pointer.ty - state.pointer.y) * 0.08;
      const cx = state.width * 0.5;
      const cy = state.height * 0.5;
      const scale = Math.min(state.width, state.height) * (options.scale || 0.28);
      const ax = t * (options.speedY || 0.18) + state.pointer.y * 0.4;
      const ay = t * (options.speedX || 0.28) + state.pointer.x * 0.6;
      const az = Math.sin(t * 0.2) * 0.08;

      const aura = ctx.createRadialGradient(cx, cy, scale * 0.15, cx, cy, scale * 1.8);
      aura.addColorStop(0, 'rgba(142,255,230,0.18)');
      aura.addColorStop(0.35, state.glow);
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(cx, cy, scale * 1.7, 0, Math.PI * 2);
      ctx.fill();

      const points = state.points.map((p) => project(rotate(p, ax, ay, az), scale, cx, cy, 4.25));
      const front = points.filter((p) => p.z >= -0.02);
      const back = points.filter((p) => p.z < -0.02);
      const linkDistance = scale * 0.34;

      const drawLinks = (group, alphaBase) => {
        for (let i = 0; i < group.length; i += 1) {
          const a = group[i];
          for (let j = i + 1; j < group.length; j += 1) {
            const b = group[j];
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (dist > linkDistance) continue;
            const alpha = (1 - dist / linkDistance) * alphaBase;
            ctx.strokeStyle = `rgba(105, 248, 213, ${alpha.toFixed(3)})`;
            ctx.lineWidth = alphaBase > 0.15 ? 0.95 : 0.45;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      };

      drawLinks(back, 0.06);
      for (let i = 0; i < state.orbits; i += 1) {
        ctx.beginPath();
        for (let step = 0; step <= 130; step += 1) {
          const a = (step / 130) * Math.PI * 2;
          const p = rotate({ x: Math.cos(a) * (1.2 + i * 0.24), y: Math.sin(a) * (0.35 + i * 0.07), z: 0 }, ax * 0.4, ay * 0.25 + i, az + i * 0.4);
          const pr = project(p, scale, cx, cy, 4.45);
          if (step === 0) ctx.moveTo(pr.x, pr.y); else ctx.lineTo(pr.x, pr.y);
        }
        ctx.strokeStyle = i % 2 === 0 ? 'rgba(109, 250, 216, 0.28)' : 'rgba(135, 185, 255, 0.18)';
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }
      drawLinks(front, 0.22);
      back.forEach((p) => {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(111, 211, 191, 0.16)';
        ctx.arc(p.x, p.y, Math.max(0.5, p.factor * 1.0), 0, Math.PI * 2);
        ctx.fill();
      });
      front.forEach((p) => {
        ctx.beginPath();
        ctx.fillStyle = `rgba(206,255,245,${clamp(0.38 + p.factor * 0.2, 0.4, 0.9).toFixed(3)})`;
        ctx.arc(p.x, p.y, Math.max(1, p.factor * 1.9), 0, Math.PI * 2);
        ctx.fill();
      });

      if (state.running) state.raf = requestAnimationFrame(draw);
    }

    function kick() { if (!state.visible || !state.inView || state.raf) return; state.raf = requestAnimationFrame(draw); }
    function stop() { if (state.raf) cancelAnimationFrame(state.raf); state.raf = 0; }

    const observer = new IntersectionObserver((entries) => {
      state.inView = Boolean(entries[0]?.isIntersecting);
      if (!state.inView) stop();
      else if (state.running) kick();
      else draw(performance.now());
    }, { threshold: 0.06 });
    observer.observe(host);

    host.addEventListener('pointermove', (ev) => {
      const rect = host.getBoundingClientRect();
      state.pointer.tx = ((ev.clientX - rect.left) / rect.width - 0.5) * 0.8;
      state.pointer.ty = ((ev.clientY - rect.top) / rect.height - 0.5) * 0.7;
      if (state.running) kick(); else draw(performance.now());
    }, { passive: true });
    host.addEventListener('pointerleave', () => { state.pointer.tx = 0; state.pointer.ty = 0; }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      state.visible = !document.hidden;
      if (!state.visible) stop();
      else if (state.running) kick();
      else draw(performance.now());
    });
    window.addEventListener('resize', () => { resize(); if (state.running) kick(); else draw(performance.now()); }, { passive: true });

    resize();
    if (state.running) kick(); else draw(performance.now());
    return { setMotion(enabled) { state.running = enabled; if (!enabled) { stop(); draw(performance.now()); } else kick(); } };
  }

  const ambient = initAmbientNetwork();
  const hero = initHeroScene();
  const aboutGlobe = initSectionGlobe('about-globe', '.about-mini-visual', { count: 135, scale: 0.28, orbits: 2, speedX: 0.23, speedY: 0.14 });
  const contactGlobe = initSectionGlobe('contact-globe', '.contact-visual', { count: 190, scale: 0.31, orbits: 3, speedX: 0.29, speedY: 0.18, glow: 'rgba(120, 186, 255, 0.15)' });

  const existingPortfolio3D = window.Portfolio3D || {};
  window.Portfolio3D = {
    ...existingPortfolio3D,
    setMotion(enabled) {
      motionEnabled = enabled;
      ambient.setMotion(enabled);
      hero.setMotion(enabled);
      aboutGlobe.setMotion(enabled);
      contactGlobe.setMotion(enabled);
      existingPortfolio3D.setMotion?.(enabled);
    }
  };
})();
