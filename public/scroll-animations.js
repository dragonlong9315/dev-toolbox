/* ═══════════════════════════════════════════
   Dev工具箱 — 滚动动画系统
   Intersection Observer + Apple 风格
   ═══════════════════════════════════════════ */
(function(){
  'use strict';

  // ── 滚动显示动画 ──
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  // 标记所有需要动画的元素
  document.querySelectorAll('.tool-card, .stat, footer, .hero p').forEach(el => {
    el.classList.add('reveal');
    observer.observe(el);
  });

  // ── Nav 滚动阴影 ──
  const nav = document.querySelector('nav');
  if (nav){
    const navObserver = new IntersectionObserver(([e]) => {
      nav.classList.toggle('scrolled', !e.isIntersecting);
    }, { threshold: 1 });
    // 观察 hero 后的第一个元素
    const hero = document.querySelector('.hero');
    if (hero) navObserver.observe(hero);
  }

  // ── 3D Tilt 卡片效果 (桌面端) ──
  if (window.matchMedia('(pointer:fine)').matches){
    document.querySelectorAll('.tool-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 6}deg) translateY(-2px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // ── 横竖屏切换平滑过渡 ──
  let orientationTimer;
  window.addEventListener('orientationchange', () => {
    document.body.style.transition = 'none';
    clearTimeout(orientationTimer);
    orientationTimer = setTimeout(() => {
      document.body.style.transition = '';
    }, 300);
  });

  // ── 平滑滚动 (Safari polyfill) ──
  if (!('scrollBehavior' in document.documentElement.style)){
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e){
        const target = document.querySelector(this.getAttribute('href'));
        if (target){
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }
})();
