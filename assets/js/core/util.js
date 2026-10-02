/* ============================================================================
 * NovaMark · 核心工具库
 * 零依赖、经典脚本。所有模块挂在全局 window.Nova 命名空间下。
 * ==========================================================================*/
(function (global) {
  'use strict';

  var Nova = global.Nova = global.Nova || {};

  /* ----------------------------- DOM ----------------------------- */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /**
   * 创建元素。
   * el('div', {class:'a', text:'hi', dataset:{x:1}, onclick:fn}, [child, 'string'])
   */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        var v = attrs[k];
        if (v === null || v === undefined || v === false) continue;
        if (k === 'class' || k === 'className') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') { for (var s in v) node.style[s] = v[s]; }
        else if (k === 'dataset' && typeof v === 'object') { for (var d in v) node.dataset[d] = v[d]; }
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
        else if (v === true) node.setAttribute(k, '');
        else node.setAttribute(k, v);
      }
    }
    appendChildren(node, children);
    return node;
  }

  function appendChildren(node, children) {
    if (children === null || children === undefined) return node;
    if (!Array.isArray(children)) children = [children];
    for (var i = 0; i < children.length; i++) {
      var c = children[i];
      if (c === null || c === undefined || c === false) continue;
      node.appendChild(typeof c === 'object' && c.nodeType ? c : document.createTextNode(String(c)));
    }
    return node;
  }

  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); return node; }
  function show(node, on) { if (node) node.classList[on === false ? 'add' : 'remove']('hidden'); }
  function setText(node, t) { if (node) node.textContent = t; }

  /* --------------------------- 数值格式化 --------------------------- */

  var fmt = {
    /** 保留 n 位小数，去掉尾随 0 */
    num: function (v, digits) {
      if (v === null || v === undefined || !isFinite(v)) return '—';
      var d = digits === undefined ? 2 : digits;
      var s = Number(v).toFixed(d);
      if (d > 0) s = s.replace(/\.?0+$/, '');
      return s;
    },
    int: function (v) {
      if (v === null || v === undefined || !isFinite(v)) return '—';
      return Math.round(v).toLocaleString('en-US');
    },
    /** 千分位 + K/M/G 缩写 */
    si: function (v, digits) {
      if (v === null || v === undefined || !isFinite(v)) return '—';
      var a = Math.abs(v), d = digits === undefined ? 1 : digits;
      if (a >= 1e9) return (v / 1e9).toFixed(d) + 'G';
      if (a >= 1e6) return (v / 1e6).toFixed(d) + 'M';
      if (a >= 1e3) return (v / 1e3).toFixed(d) + 'K';
      return fmt.num(v, d);
    },
    pct: function (v, digits) {
      if (v === null || v === undefined || !isFinite(v)) return '—';
      return (v * 100).toFixed(digits === undefined ? 1 : digits) + '%';
    },
    bytes: function (b) {
      if (b === null || b === undefined || !isFinite(b)) return '—';
      var u = ['B', 'KB', 'MB', 'GB', 'TB'], i = 0;
      while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; }
      return b.toFixed(i === 0 ? 0 : 1) + ' ' + u[i];
    },
    dur: function (ms) {
      if (!isFinite(ms)) return '—';
      if (ms < 1000) return Math.round(ms) + ' ms';
      if (ms < 60000) return (ms / 1000).toFixed(1) + ' s';
      return Math.floor(ms / 60000) + ' min ' + Math.round((ms % 60000) / 1000) + ' s';
    },
    date: function (ts) {
      var d = ts instanceof Date ? ts : new Date(ts);
      function p(n) { return n < 10 ? '0' + n : '' + n; }
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' +
        p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
    }
  };

  /* ----------------------------- 统计 ----------------------------- */

  var stats = {
    sum: function (a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; },
    mean: function (a) {
      if (!a || !a.length) return NaN;
      return stats.sum(a) / a.length;
    },
    median: function (a) {
      if (!a || !a.length) return NaN;
      var b = a.slice().sort(function (x, y) { return x - y; });
      var m = b.length >> 1;
      return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2;
    },
    /** 样本标准差 */
    std: function (a) {
      if (!a || a.length < 2) return 0;
      var m = stats.mean(a), s = 0;
      for (var i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m);
      return Math.sqrt(s / (a.length - 1));
    },
    /** 变异系数（相对波动） */
    cv: function (a) {
      var m = stats.mean(a);
      if (!m || !isFinite(m)) return 0;
      return stats.std(a) / Math.abs(m);
    },
    /** 线性插值分位数，p ∈ [0,1] */
    percentile: function (a, p) {
      if (!a || !a.length) return NaN;
      var b = a.slice().sort(function (x, y) { return x - y; });
      if (b.length === 1) return b[0];
      var idx = (b.length - 1) * Math.min(1, Math.max(0, p));
      var lo = Math.floor(idx), hi = Math.ceil(idx);
      return b[lo] + (b[hi] - b[lo]) * (idx - lo);
    },
    min: function (a) { return a && a.length ? Math.min.apply(null, a) : NaN; },
    max: function (a) { return a && a.length ? Math.max.apply(null, a) : NaN; },
    /** 去掉最高最低各 trimRatio 比例后的均值，抗离群 */
    trimmedMean: function (a, trimRatio) {
      if (!a || !a.length) return NaN;
      var r = trimRatio === undefined ? 0.1 : trimRatio;
      var b = a.slice().sort(function (x, y) { return x - y; });
      var k = Math.floor(b.length * r);
      var c = b.slice(k, b.length - k);
      return c.length ? stats.mean(c) : stats.median(b);
    },
    /**
     * 由逐帧耗时（ms）计算 1% low / 0.1% low 帧率。
     * 业界做法：把帧耗时从大到小排序，取最慢的 1% 帧，其平均帧率的倒数即 1% low FPS。
     */
    lowFps: function (frameTimesMs, ratio) {
      if (!frameTimesMs || frameTimesMs.length < 10) return NaN;
      var sorted = frameTimesMs.slice().sort(function (a, b) { return b - a; }); // 慢 → 快
      var n = Math.max(1, Math.floor(sorted.length * (ratio || 0.01)));
      var slice = sorted.slice(0, n);
      var avgMs = stats.mean(slice);
      return avgMs > 0 ? 1000 / avgMs : NaN;
    },
    /** 线性回归斜率（用于稳定性衰减拟合），返回 y 对 index 的斜率 */
    slope: function (ys) {
      var n = ys.length;
      if (n < 2) return 0;
      var sx = 0, sy = 0, sxy = 0, sxx = 0;
      for (var i = 0; i < n; i++) { sx += i; sy += ys[i]; sxy += i * ys[i]; sxx += i * i; }
      var den = n * sxx - sx * sx;
      return den === 0 ? 0 : (n * sxy - sx * sy) / den;
    }
  };

  /* ----------------------------- 其他 ----------------------------- */

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function now() { return (global.performance && performance.now) ? performance.now() : Date.now(); }
  function raf() { return new Promise(function (r) { requestAnimationFrame(function () { r(now()); }); }); }
  /** 让浏览器有机会处理输入/重绘 */
  function yieldUI() { return new Promise(function (r) { setTimeout(r, 0); }); }

  function debounce(fn, wait) {
    var t = null;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, wait || 150);
    };
  }

  var uidCounter = 0;
  function uid(prefix) { uidCounter++; return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + uidCounter; }

  /** FNV-1a 32 位哈希，返回 8 位十六进制 */
  function fnv1a(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return ('00000000' + h.toString(16)).slice(-8);
  }

  /** SHA-256（可用时），不可用则回退 FNV-1a 级联 */
  function sha256Hex(str) {
    try {
      if (global.crypto && global.crypto.subtle && global.TextEncoder) {
        var buf = new TextEncoder().encode(str);
        return global.crypto.subtle.digest('SHA-256', buf).then(function (h) {
          var b = new Uint8Array(h), out = '';
          for (var i = 0; i < b.length; i++) out += ('0' + b[i].toString(16)).slice(-2);
          return out;
        });
      }
    } catch (e) { /* 忽略，走回退 */ }
    var seed = fnv1a(str);
    return Promise.resolve(fnv1a(seed + str + seed) + fnv1a(str + seed) + fnv1a(seed + seed + str) + fnv1a(str + str));
  }

  /* --------------------------- localStorage --------------------------- */

  var storage = {
    prefix: 'novamark:',
    get: function (key, dflt) {
      try {
        var raw = global.localStorage.getItem(storage.prefix + key);
        return raw === null ? dflt : JSON.parse(raw);
      } catch (e) { return dflt; }
    },
    set: function (key, value) {
      try { global.localStorage.setItem(storage.prefix + key, JSON.stringify(value)); return true; }
      catch (e) { return false; }
    },
    remove: function (key) {
      try { global.localStorage.removeItem(storage.prefix + key); } catch (e) { /* noop */ }
    },
    available: (function () {
      try {
        var k = '__nova_probe__';
        global.localStorage.setItem(k, '1');
        global.localStorage.removeItem(k);
        return true;
      } catch (e) { return false; }
    })()
  };

  /* --------------------------- 事件总线 --------------------------- */

  function EventBus() { this._map = {}; }
  EventBus.prototype.on = function (evt, fn) {
    (this._map[evt] = this._map[evt] || []).push(fn);
    return this;
  };
  EventBus.prototype.off = function (evt, fn) {
    var l = this._map[evt];
    if (!l) return this;
    var i = l.indexOf(fn);
    if (i >= 0) l.splice(i, 1);
    return this;
  };
  EventBus.prototype.emit = function (evt, payload) {
    var l = this._map[evt];
    if (l) for (var i = 0; i < l.length; i++) {
      try { l[i](payload); } catch (e) { console.error('[Nova.bus] ' + evt, e); }
    }
    var any = this._map['*'];
    if (any) for (var j = 0; j < any.length; j++) {
      try { any[j](evt, payload); } catch (e2) { /* noop */ }
    }
    return this;
  };

  /* --------------------------- Base64 URL --------------------------- */
  /* 用于把报告压进 URL hash，支持 UTF-8 */
  function b64encodeUtf8(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return global.btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64decodeUtf8(b64) {
    var s = b64.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = global.atob(s);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  /* --------------------------- 简易日志 --------------------------- */

  var logs = [];
  function log(tag, msg, data) {
    var entry = { t: Date.now(), tag: tag, msg: msg, data: data };
    logs.push(entry);
    if (logs.length > 500) logs.shift();
    if (global.NOVA_DEBUG) console.log('[Nova/' + tag + ']', msg, data === undefined ? '' : data);
    return entry;
  }
  function dumpLogs() { return logs.slice(); }

  /* --------------------------- 导出 --------------------------- */

  Nova.util = {
    $: $, $$: $$, el: el, clear: clear, show: show, setText: setText, appendChildren: appendChildren,
    fmt: fmt, stats: stats,
    clamp: clamp, lerp: lerp, sleep: sleep, now: now, raf: raf, yieldUI: yieldUI,
    debounce: debounce, uid: uid, fnv1a: fnv1a, sha256Hex: sha256Hex,
    storage: storage, EventBus: EventBus,
    b64encodeUtf8: b64encodeUtf8, b64decodeUtf8: b64decodeUtf8,
    log: log, dumpLogs: dumpLogs
  };
  Nova.bus = new EventBus();
  // NovaMark-Lite 与完整版 NovaMark 共用 1.0.0 主线，用后缀区分分支
  Nova.VERSION = '1.0.0-lite';

})(typeof window !== 'undefined' ? window : this);
