/* ═══════════════════════════════════════════
   Dev工具箱 — Canvas 3D 几何背景
   轻量纯 Canvas，无外部依赖，~4KB
   ═══════════════════════════════════════════ */
(function(){
  'use strict';
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles = [];
  const PARTICLE_COUNT = 50;
  const connectionDist = 120;

  // 粒子类
  class Particle {
    constructor(){
      this.reset(true);
    }
    reset(init){
      this.x = Math.random() * W;
      this.y = init ? Math.random() * H : H + 20;
      this.z = Math.random() * 0.8 + 0.2; // depth 0.2-1.0
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = -(Math.random() * 0.3 + 0.15);
      this.radius = this.z * 3 + 1;
      this.opacity = this.z * 0.6 + 0.1;
    }
    update(){
      this.x += this.vx * this.z;
      this.y += this.vy * this.z;
      if (this.y < -20) this.reset(false);
      if (this.x < -20) this.x = W + 20;
      if (this.x > W + 20) this.x = -20;
    }
    draw(){
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(59,130,246,${this.opacity})`;
      ctx.fill();
    }
  }

  function resize(){
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width;
    H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function initParticles(){
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++){
      particles.push(new Particle());
    }
  }

  function drawConnections(){
    for (let i = 0; i < particles.length; i++){
      for (let j = i + 1; j < particles.length; j++){
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < connectionDist){
          const alpha = (1 - dist / connectionDist) * 0.12;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(59,130,246,${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }

  function animate(){
    ctx.clearRect(0, 0, W, H);
    for (const p of particles){
      p.update();
      p.draw();
    }
    drawConnections();
    requestAnimationFrame(animate);
  }

  // 初始化
  resize();
  initParticles();
  animate();

  // 响应窗口变化
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      initParticles();
    }, 200);
  });

  // 鼠标交互 — 粒子微移
  canvas.parentElement.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    for (const p of particles){
      const dx = p.x - mx;
      const dy = p.y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 80){
        p.x += dx / dist * 1.5;
        p.y += dy / dist * 1.5;
      }
    }
  });
})();
