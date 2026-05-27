#!/usr/bin/env node
/**
 * Dev工具箱 — 安全服务器 + 内建访问统计
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');

// 确保数据目录存在
try { fs.mkdirSync(DATA_DIR); } catch (e) {}

const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

// ═══════════════════════════════════════
// 访问统计引擎
// ═══════════════════════════════════════

function loadAnalytics() {
  try {
    return JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf-8'));
  } catch (e) {
    return { views: [], startTime: Date.now() };
  }
}

function saveAnalytics(data) {
  // 只保留最近 30 天数据
  const cutoff = Date.now() - 30 * 86400000;
  data.views = data.views.filter(v => v.ts > cutoff);
  fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data), 'utf-8');
}

function logVisit(req) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '?').split(',')[0].trim();
  const ua = (req.headers['user-agent'] || '').substring(0, 200);
  const ref = (req.headers['referer'] || '').substring(0, 300);
  const url = req.url.split('?')[0].substring(0, 200);
  const now = Date.now();

  const data = loadAnalytics();
  data.views.push({ ts: now, ip, url, ua, ref });
  saveAnalytics(data);
}

function getStats() {
  const data = loadAnalytics();
  const views = data.views;
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTs = todayStart.getTime();

  const todayViews = views.filter(v => v.ts >= todayTs);
  const uniqueIPs = new Set(views.map(v => v.ip));
  const todayIPs = new Set(todayViews.map(v => v.ip));

  // 页面统计
  const pageStats = {};
  for (const v of views) {
    const page = v.url || '/';
    if (!pageStats[page]) pageStats[page] = { views: 0, today: 0 };
    pageStats[page].views++;
    if (v.ts >= todayTs) pageStats[page].today++;
  }

  // 每小时统计（今天）
  const hourly = Array(24).fill(0);
  for (const v of todayViews) {
    const h = new Date(v.ts).getHours();
    hourly[h]++;
  }

  // 每日统计（最近14天）
  const daily = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const key = d.toISOString().split('T')[0];
    daily[key] = 0;
  }
  for (const v of views) {
    const key = new Date(v.ts).toISOString().split('T')[0];
    if (daily[key] !== undefined) daily[key]++;
  }

  // 引荐来源
  const referrers = {};
  for (const v of views) {
    if (!v.ref) continue;
    try {
      const host = new URL(v.ref).hostname;
      referrers[host] = (referrers[host] || 0) + 1;
    } catch (e) {}
  }

  // 最近访问
  const recent = views.slice(-20).reverse().map(v => ({
    time: new Date(v.ts).toLocaleString('zh-CN'),
    page: v.url,
    ip: v.ip.replace(/:\d+$/, '').replace(/^::ffff:/, ''),
    ref: v.ref ? new URL(v.ref).hostname : '直接访问',
  }));

  return {
    totalViews: views.length,
    totalIPs: uniqueIPs.size,
    todayViews: todayViews.length,
    todayIPs: todayIPs.size,
    startTime: new Date(data.startTime).toLocaleString('zh-CN'),
    pages: Object.entries(pageStats)
      .filter(([p]) => !p.startsWith('/api/'))
      .map(([p, s]) => ({ page: p, ...s }))
      .sort((a, b) => b.views - a.views),
    hourly,
    daily: Object.entries(daily).map(([d, c]) => ({ date: d, count: c })),
    referrers: Object.entries(referrers)
      .map(([h, c]) => ({ host: h, count: c }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    recent,
  };
}

// ═══════════════════════════════════════
// HTTP 服务器
// ═══════════════════════════════════════

const rateLimit = new Map();
const RATE_WINDOW = 60000;
const RATE_MAX = 200;

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://api.qrserver.com https:",
    "connect-src 'self'",
    "font-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Access-Control-Allow-Origin': '*',
};

const server = http.createServer((req, res) => {
  const ip = req.socket.remoteAddress || '?';
  const now = Date.now();

  // 速率限制
  if (!rateLimit.has(ip)) rateLimit.set(ip, []);
  const timestamps = rateLimit.get(ip).filter(t => now - t < RATE_WINDOW);
  timestamps.push(now);
  rateLimit.set(ip, timestamps);

  if (timestamps.length > RATE_MAX) {
    res.writeHead(429, { 'Content-Type': 'text/plain' });
    return res.end('Too Many Requests');
  }

  // API: 统计数据
  const apiHeaders = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, apiHeaders);
    return res.end();
  }

  if (req.url === '/api/analytics') {
    const stats = getStats();
    res.writeHead(200, apiHeaders);
    return res.end(JSON.stringify(stats));
  }

  // API: 实时计数（轻量，用于前端轮询）
  if (req.url === '/api/count') {
    const data = loadAnalytics();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const today = data.views.filter(v => v.ts >= todayStart.getTime()).length;
    const ips = new Set(data.views.map(v => v.ip));
    res.writeHead(200, apiHeaders);
    return res.end(JSON.stringify({ total: data.views.length, today, ips: ips.size }));
  }

  // 记录访问（排除 API 请求和静态资源）
  if (!req.url.startsWith('/api/') && !/\.(css|js|svg|png|ico|woff2?)$/.test(req.url)) {
    try { logVisit(req); } catch (e) {}
  }

  // 路径解析
  let reqPath = path.normalize(req.url.split('?')[0]).replace(/^\/+/, '');
  if (!reqPath || reqPath.endsWith('/')) reqPath += 'index.html';

  let filePath = path.join(ROOT, reqPath);

  // 无后缀路径自动补 .html（如 /analytics → /analytics.html）
  if (!path.extname(filePath)) {
    const htmlPath = filePath + '.html';
    try { if (fs.statSync(htmlPath).isFile()) filePath = htmlPath; } catch (e) {}
  }

  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  if (path.basename(filePath).startsWith('.')) { res.writeHead(403); return res.end('Forbidden'); }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const fallback = path.join(ROOT, 'index.html');
      fs.readFile(fallback, (e2, data) => {
        res.writeHead(e2 ? 404 : 200, { ...SECURITY_HEADERS, 'Content-Type': 'text/html; charset=utf-8' });
        res.end(e2 ? 'Not Found' : data);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const ct = MIME[ext] || 'application/octet-stream';
    fs.readFile(filePath, (e, data) => {
      if (e) { res.writeHead(500); return res.end('Error'); }
      res.writeHead(200, { ...SECURITY_HEADERS, 'Content-Type': ct });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`🔒 服务器: http://localhost:${PORT}`);
  console.log(`📊 统计 API: http://localhost:${PORT}/api/analytics`);
  console.log(`📈 后台面板: http://localhost:${PORT}/analytics`);
});
