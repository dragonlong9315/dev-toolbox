/* ── Dev工具箱 Monet 引擎 ── */
(function () {
  'use strict';

  // 预设莫奈风格源色
  const PRESETS = [
    { name: '海洋蓝', h: 221, s: 83, l: 53 },
    { name: '森林绿', h: 150, s: 55, l: 42 },
    { name: '日落橙', h: 25, s: 90, l: 55 },
    { name: '薰衣草紫', h: 270, s: 70, l: 55 },
    { name: '玫瑰粉', h: 340, s: 75, l: 55 },
    { name: '深海青', h: 185, s: 70, l: 42 },
  ];

  const STORAGE_KEY = 'devtoolbox-theme';
  const STORAGE_COLOR = 'devtoolbox-color';

  // 从 HSL 生成色调调色板
  function tonalPalette(h, s, baseL) {
    // Material Design 3 色调阶梯 (简化版)
    const tones = { source: [h, s, baseL] };
    // 亮色阶梯
    tones[0] = [h, s * 0.3, 98];
    tones[10] = [h, s * 0.6, 95];
    tones[20] = [h, s * 0.85, 90];
    tones[30] = [h, s, 84];
    tones[40] = [h, s * 1.1, 72];
    tones[50] = [h, s, baseL];
    // 暗色阶梯
    tones[60] = [h, s * 1.05, 40];
    tones[70] = [h, s * 0.9, 30];
    tones[80] = [h, s * 0.7, 22];
    tones[90] = [h, s * 0.5, 16];
    tones[100] = [h, s * 0.3, 8];
    return tones;
  }

  function hslStr(h, s, l) {
    return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`;
  }

  // 应用主题
  function applyTheme(light, h, s, l) {
    const root = document.documentElement;
    const theme = light ? 'light' : 'dark';
    root.setAttribute('data-theme', theme);

    const palette = tonalPalette(h, s, l);

    if (light) {
      root.style.setProperty('--md-primary', hslStr(h, s, l));
      root.style.setProperty('--md-on-primary', '#fff');
      root.style.setProperty('--md-primary-container', hslStr(...palette[20]));
      root.style.setProperty('--md-on-primary-container', hslStr(...palette[80]));
      root.style.setProperty('--md-surface', hslStr(h, s * 0.08, 98));
      root.style.setProperty('--md-on-surface', hslStr(h, 4, 10));
      root.style.setProperty('--md-surface-variant', hslStr(h, s * 0.15, 93));
      root.style.setProperty('--md-on-surface-variant', hslStr(h, 10, 40));
      root.style.setProperty('--md-background', hslStr(h, s * 0.06, 98));
      root.style.setProperty('--md-on-background', hslStr(h, 4, 10));
      root.style.setProperty('--md-outline', hslStr(h, 8, 78));
      root.style.setProperty('--md-outline-variant', hslStr(h, 8, 90));
    // 同步背景颜色 — 使用 hsl 渐变
    const heroGrad = `linear-gradient(180deg,hsl(${h},${s}%,8%) 0%,hsl(${h},${s}%,16%) 40%,hsl(${h},${s}%,26%) 70%,#fafafa 100%)`;
    root.style.setProperty('--hero-bg', heroGrad);
    root.style.setProperty('--tools-bg', `linear-gradient(180deg,#fafafa 0%,hsl(${h},${Math.min(s*0.5,50)}%,96%) 40%,hsl(${h-20},${Math.min(s*0.4,40)}%,94%) 100%)`);
    root.style.setProperty('--pri-gr', `linear-gradient(135deg,hsl(${h},${s}%,60%),hsl(${h+30},${Math.min(s*0.8,60)}%,55%))`);
    } else {
      root.style.setProperty('--md-primary', hslStr(h, s * 0.7, 65));
      root.style.setProperty('--md-on-primary', hslStr(h, s, 14));
      root.style.setProperty('--md-primary-container', hslStr(...palette[80]));
      root.style.setProperty('--md-on-primary-container', hslStr(...palette[20]));
      root.style.setProperty('--md-surface', hslStr(h, 8, 10));
      root.style.setProperty('--md-on-surface', hslStr(h, 6, 90));
      root.style.setProperty('--md-surface-variant', hslStr(h, 10, 18));
      root.style.setProperty('--md-on-surface-variant', hslStr(h, 8, 72));
      root.style.setProperty('--md-background', hslStr(h, 8, 7));
      root.style.setProperty('--md-on-background', hslStr(h, 6, 90));
      root.style.setProperty('--md-outline', hslStr(h, 8, 40));
      root.style.setProperty('--md-outline-variant', hslStr(h, 8, 24));
      // 暗色同步背景
      root.style.setProperty('--hero-bg', `linear-gradient(180deg,hsl(${h},8%,5%) 0%,hsl(${h},${s*0.5}%,10%) 70%,#09090b 100%)`);
      root.style.setProperty('--tools-bg', `linear-gradient(180deg,hsl(${h},10%,8%) 0%,hsl(${h},8%,10%) 100%)`);
    }
  }

  // 持久化
  function savePrefs(light, h, s, l) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ light, h, s, l }));
    } catch (e) {}
  }

  function loadPrefs() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (data) return data;
    } catch (e) {}
    return null;
  }

  // 初始化
  function init() {
    const saved = loadPrefs();
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const light = saved ? saved.light : !prefersDark;
    const h = saved ? saved.h : PRESETS[0].h;
    const s = saved ? saved.s : PRESETS[0].s;
    const l = saved ? saved.l : PRESETS[0].l;

    applyTheme(light, h, s, l);

    return { light, h, s, l };
  }

  // 切换暗/亮
  function toggleTheme(state) {
    state.light = !state.light;
    applyTheme(state.light, state.h, state.s, state.l);
    savePrefs(state.light, state.h, state.s, state.l);
  }

  // 更换源色
  function setSourceColor(state, h, s, l) {
    state.h = h; state.s = s; state.l = l;
    applyTheme(state.light, h, s, l);
    savePrefs(state.light, h, s, l);
  }

  // ── DOM 初始化 ──
  document.addEventListener('DOMContentLoaded', function () {
    const state = init();

    // 主题切换按钮
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        toggleTheme(state);
        updateToggleIcon(state.light);
      });
      updateToggleIcon(state.light);
    }

    // 色板选择器
    const paletteEl = document.getElementById('monetPalette');
    if (paletteEl) {
      PRESETS.forEach(function (p, i) {
        const dot = document.createElement('button');
        dot.className = 'monet-dot';
        dot.title = p.name;
        dot.style.cssText = 'width:22px;height:22px;border-radius:50%;border:2px solid transparent;cursor:pointer;transition:.15s;' +
          'background:' + hslStr(p.h, p.s, p.l);
        dot.addEventListener('click', function () {
          setSourceColor(state, p.h, p.s, p.l);
          document.querySelectorAll('.monet-dot').forEach(function (d) {
            d.style.borderColor = 'transparent';
          });
          dot.style.borderColor = 'var(--md-primary)';
        });
        paletteEl.appendChild(dot);
      });
    }

    // 自定义颜色选择器
    const colorPicker = document.getElementById('monetColorPicker');
    if (colorPicker) {
      colorPicker.addEventListener('input', function () {
        const hex = this.value;
        const rgb = hexToRgb(hex);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        setSourceColor(state, hsl.h, hsl.s, hsl.l);
      });
    }
  });

  function updateToggleIcon(light) {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.innerHTML = light
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  }

  // 工具函数
  function hexToRgb(hex) {
    const v = parseInt(hex.replace('#', ''), 16);
    return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }
})();
