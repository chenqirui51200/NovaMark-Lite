#!/usr/bin/env node
/* ============================================================================
 * NovaMark-Lite · 零依赖静态服务器
 * 用法： node scripts/serve.js [端口] [目录]
 * 说明： WebGPU / WebGL2 需要「安全上下文」。双击 index.html 用 file:// 打开在
 *        多数浏览器里也能跑，但 localStorage、剪贴板、分享链接等会受到限制。
 *        用 127.0.0.1 本地服务访问即可获得完整能力。
 *        默认端口 1234。
 * ==========================================================================*/
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = parseInt(process.argv[2], 10) || 1234;
const ROOT = path.resolve(process.argv[3] || path.join(__dirname, '..'));
// 默认监听所有网卡：手机 / 平板等局域网设备才能访问。
// 只在本机用可以加 --local 回到 127.0.0.1（更安全）。
const LAN = !process.argv.includes('--local');
const HOST = LAN ? '0.0.0.0' : '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url);
  let pathname = decodeURIComponent(parsed.pathname);
  if (pathname === '/') pathname = '/index.html';

  const target = path.join(ROOT, pathname);
  const resolved = path.resolve(target);

  // 目录穿越防护
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(resolved, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found: ' + pathname);
      return;
    }
    const ext = path.extname(resolved).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    });
    fs.createReadStream(resolved).pipe(res);
  });
});

function lanAddresses() {
  const out = [];
  try {
    const ifs = require('os').networkInterfaces();
    Object.keys(ifs).forEach(name => {
      (ifs[name] || []).forEach(a => {
        if (a.family === 'IPv4' && !a.internal) out.push(a.address);
      });
    });
  } catch (e) { /* noop */ }
  return out;
}

server.listen(PORT, HOST, () => {
  console.log('NovaMark-Lite 本地服务已启动：');
  console.log('  本机   http://127.0.0.1:' + PORT + '/');
  if (LAN) {
    lanAddresses().forEach(function (ip) {
      console.log('  局域网 http://' + ip + ':' + PORT + '/');
    });
    console.log('');
    console.log('  ⚠ 局域网用 HTTP 访问**不是安全上下文**，手机浏览器上 navigator.gpu 会不存在，');
    console.log('    只能跑 WebGL2 后端。想要手机上也能用 WebGPU，见 README「跨设备测试」一节。');
  }
  console.log('  根目录：' + ROOT);
  console.log('按 Ctrl+C 停止。');
});

server.on('error', (e) => {
  console.error('启动失败：' + e.message);
  process.exit(1);
});
