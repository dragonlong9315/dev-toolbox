/* ═══════════════════════════════════════════
   Dev工具箱 — 多语言引擎 (UN 五常)
   ═══════════════════════════════════════════ */
(function(){
  const STORAGE = 'devtoolbox-lang';
  const DEF = 'zh';
  const LANGS = ['zh','en','ru','fr','es'];
  let dict = null;
  let current = DEF;

  // 国旗 + 语言名
  const FLAGS = { zh:'🇨🇳 中文', en:'🇬🇧 English', ru:'🇷🇺 Русский', fr:'🇫🇷 Français', es:'🇪🇸 Español' };

  function load(cb){
    const saved = localStorage.getItem(STORAGE);
    current = saved && LANGS.includes(saved) ? saved : DEF;

    fetch('/dev-toolbox/i18n.json')
      .then(r => r.json())
      .then(d => { dict = d; apply(current); if(cb) cb(); })
      .catch(() => { if(cb) cb(); });
  }

  function apply(lang){
    if(!dict || !dict[lang]) return;
    current = lang;
    localStorage.setItem(STORAGE, lang);

    // 更新 data-i18n 元素
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if(dict[lang][key]) {
        // 处理包含 HTML 的翻译
        el.innerHTML = dict[lang][key];
      }
    });

    // 更新 data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      if(dict[lang][key]) el.placeholder = dict[lang][key];
    });

    // 更新 data-i18n-title
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.dataset.i18nTitle;
      if(dict[lang][key]) el.title = dict[lang][key];
    });

    // 更新 lang 按钮文本
    document.querySelectorAll('.lang-btn-text').forEach(el => {
      el.textContent = FLAGS[lang] || FLAGS[DEF];
    });

    // 更新页面的 lang 属性
    document.documentElement.lang = lang;

    // 更新 homepage stats
    if(dict[lang].tools_count){
      const num = document.querySelector('.stat .num[data-i18n="tools_count"]');
      if(num){
        const count = num.closest('.stat')?.querySelector('.lbl');
        if(count) count.setAttribute('data-i18n', 'tools_label');
      }
    }
  }

  // 语言切换下拉
  function renderSwitcher(container){
    const btn = document.createElement('div');
    btn.className = 'lang-link';
    btn.innerHTML = `<button class="lang-btn"><span class="lang-btn-text">${FLAGS[current]||FLAGS[DEF]}</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></button>`;

    const dropdown = document.createElement('div');
    dropdown.className = 'lang-dropdown';
    dropdown.style.display = 'none';

    LANGS.forEach(code => {
      const opt = document.createElement('button');
      opt.textContent = FLAGS[code];
      opt.onclick = (e) => { e.stopPropagation(); apply(code); dropdown.style.display = 'none'; };
      dropdown.appendChild(opt);
    });

    btn.appendChild(dropdown);
    btn.onclick = (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'none' ? 'flex' : 'none';
    };
    document.addEventListener('click', () => { dropdown.style.display = 'none'; });

    container.appendChild(btn);
  }

  // 暴露全局
  window.i18n = { load, apply, renderSwitcher, current: () => current };

  // 自动初始化
  document.addEventListener('DOMContentLoaded', function(){
    const container = document.getElementById('langSwitcher');
    if(container) renderSwitcher(container);
    load();
  });
})();
