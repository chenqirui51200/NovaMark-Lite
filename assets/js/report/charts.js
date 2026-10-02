/* ============================================================================
 * NovaCharts v1.0.0 —— 零依赖纯 Canvas 2D 图表库（深色科幻风）
 * 供网页 GPU 跑分工具使用。
 *
 * 特性：
 *   - 经典脚本，无 import / export，通过 window.NovaCharts 暴露
 *   - 零依赖：无外部库 / 字体 / 图片 / 网络请求
 *   - 自适应高 DPI：CSS 尺寸 × devicePixelRatio（上限 3），绘制坐标统一为 CSS 像素
 *   - 窗口缩放（防抖 150ms）自动重绘所有已注册 canvas
 *   - 健壮性：空数组 / 全 0 / NaN / Infinity / 单点 / max<=min 均不抛异常
 *
 * 语法目标：ES2018 以内（可选链等新语法未使用），无顶层 await。
 * ========================================================================== */
var NovaCharts = (function () {
  'use strict';

  var version = '1.0.0';

  /* 统一系统字体栈（禁止外部字体） */
  var FONT_STACK = '-apple-system, "Segoe UI", "Microsoft YaHei", "PingFang SC", sans-serif';

  /* 主题色（外部可直接修改 NovaCharts.theme 覆盖） */
  var theme = {
    bg: '#0d1424',
    panel: '#111a2e',
    border: '#1e2b45',
    grid: '#1b2740',
    text: '#e6edf7',
    muted: '#8fa3c4',
    dim: '#5b6b8a',
    cyan: '#22d3ee',
    blue: '#3b82f6',
    violet: '#8b5cf6',
    magenta: '#f472b6',
    lime: '#a3e635',
    amber: '#fbbf24',
    orange: '#fb923c',
    red: '#f87171',
    series: ['#22d3ee', '#f472b6', '#a3e635', '#fbbf24', '#8b5cf6', '#3b82f6', '#fb923c', '#f87171']
  };

  /* ==========================================================================
   * 一、基础工具
   * ======================================================================== */

  /* 有限数字判定 */
  function isNum(v) {
    return typeof v === 'number' && isFinite(v);
  }

  /* 转数字：非法值返回 dflt（dflt 省略时返回 0），显式传 NaN 则返回 NaN */
  function toNum(v, dflt) {
    var fallback = dflt === undefined ? 0 : dflt;
    if (typeof v === 'number') return isFinite(v) ? v : fallback;
    if (typeof v === 'string' && v.trim() !== '') {
      var n = parseFloat(v);
      if (isFinite(n)) return n;
    }
    return fallback;
  }

  function clamp(v, lo, hi) {
    if (!isFinite(v)) return lo;
    return v < lo ? lo : (v > hi ? hi : v);
  }

  function clampInt(v, lo, hi) {
    var n = Math.round(toNum(v, lo));
    if (!isFinite(n)) n = lo;
    return n < lo ? lo : (n > hi ? hi : n);
  }

  /* 生成字体串 */
  function font(size, weight) {
    return (weight || '400') + ' ' + size + 'px ' + FONT_STACK;
  }

  /* 数值裁剪小数位并去掉多余的 0 */
  function trimNum(v, digits) {
    if (!isFinite(v)) return '0';
    var d = digits === undefined ? (Math.abs(v) >= 10 ? 1 : 2) : digits;
    var s = v.toFixed(d);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return s;
  }

  /* 紧凑数值（K/M/G 缩写），用于刻度与数值标签 */
  function fmtCompact(v) {
    if (!isFinite(v)) return '—';
    var a = Math.abs(v);
    if (a >= 1e9) return trimNum(v / 1e9) + 'G';
    if (a >= 1e6) return trimNum(v / 1e6) + 'M';
    if (a >= 1e3) return trimNum(v / 1e3) + 'K';
    if (a === 0) return '0';
    if (Number.isInteger(v)) return String(v);
    if (a >= 100) return String(Math.round(v));
    if (a >= 1) return trimNum(v, 1);
    return trimNum(v, 2);
  }

  /* 刻度数值格式（带小数位处理） */
  function fmtTick(v) {
    if (!isFinite(v)) return '0';
    var a = Math.abs(v);
    if (a >= 1e9) return trimNum(v / 1e9) + 'G';
    if (a >= 1e6) return trimNum(v / 1e6) + 'M';
    if (a >= 1e3) return trimNum(v / 1e3) + 'K';
    if (a === 0) return '0';
    if (a >= 100) return String(Math.round(v));
    if (a >= 1) return trimNum(v, 1);
    return trimNum(v, 2);
  }

  /* 普通数值（仪表盘 / 环形图中心大字） */
  function fmtPlain(v) {
    if (!isFinite(v)) return '—';
    if (Number.isInteger(v)) return String(v);
    var a = Math.abs(v);
    if (a >= 100) return String(Math.round(v));
    if (a >= 1) return trimNum(v, 1);
    return trimNum(v, 2);
  }

  /* 向上取整到 "好看" 的最大值，用于自动坐标轴上限 */
  function niceMax(v) {
    if (!isFinite(v) || v <= 0) return 1;
    var e = Math.pow(10, Math.floor(Math.log10(v)));
    var m = v / e;
    var mult = m <= 1 ? 1 : m <= 1.5 ? 1.5 : m <= 2 ? 2 : m <= 2.5 ? 2.5 :
      m <= 3 ? 3 : m <= 4 ? 4 : m <= 5 ? 5 : m <= 6 ? 6 : m <= 8 ? 8 : 10;
    return mult * e;
  }

  /* 颜色转 rgba（支持 #rgb / #rrggbb / #rrggbbaa / rgb() / rgba()） */
  function toRgba(color, alpha) {
    var a = isNum(alpha) ? clamp(alpha, 0, 1) : 1;
    if (typeof color !== 'string') return 'rgba(34,211,238,' + a + ')';
    var c = color.trim();
    if (c.charAt(0) === '#') {
      var hex = c.slice(1);
      if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      if (hex.length === 6 || hex.length === 8) {
        var r = parseInt(hex.slice(0, 2), 16);
        var g = parseInt(hex.slice(2, 4), 16);
        var b = parseInt(hex.slice(4, 6), 16);
        if (isFinite(r) && isFinite(g) && isFinite(b)) {
          var base = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
          var out = base * a;
          return 'rgba(' + r + ',' + g + ',' + b + ',' + Math.round(out * 1000) / 1000 + ')';
        }
      }
    }
    var m = /^rgba?\(([^)]+)\)$/i.exec(c);
    if (m) {
      var p = m[1].split(',');
      if (p.length >= 3) {
        var rr = parseFloat(p[0]);
        var gg = parseFloat(p[1]);
        var bb = parseFloat(p[2]);
        var aa = p.length > 3 ? parseFloat(p[3]) : 1;
        if (!isFinite(aa)) aa = 1;
        if (isFinite(rr) && isFinite(gg) && isFinite(bb)) {
          var res = aa * a;
          return 'rgba(' + rr + ',' + gg + ',' + bb + ',' + Math.round(res * 1000) / 1000 + ')';
        }
      }
    }
    return color;
  }

  /* 文本按最大宽度截断并加省略号 */
  function fitText(ctx, text, maxWidth) {
    var t = text === undefined || text === null ? '' : String(text);
    if (!(maxWidth > 0)) return '';
    if (ctx.measureText(t).width <= maxWidth) return t;
    var ell = '…';
    var n = t.length;
    while (n > 0) {
      var cand = t.slice(0, n) + ell;
      if (ctx.measureText(cand).width <= maxWidth) return cand;
      n--;
    }
    return ell;
  }

  /* 圆角矩形路径（只建路径，不填充） */
  function roundRect(ctx, x, y, w, h, r) {
    var rr = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  /* 仅顶部圆角的矩形路径（柱状图用） */
  function roundRectTop(ctx, x, y, w, h, r) {
    var rr = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h)));
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
  }

  /* 虚线设置（带兼容判断） */
  function setDash(ctx, on, pattern) {
    if (!ctx.setLineDash) return;
    ctx.setLineDash(on ? (pattern || [5, 4]) : []);
  }

  /* 等分刻度（含首尾端点） */
  function ticksOf(min, max, count) {
    var n = clampInt(count, 1, 24);
    var out = [];
    if (!(max > min)) {
      out.push(isFinite(min) ? min : 0);
      return out;
    }
    if (n === 1) {
      out.push(max);
      return out;
    }
    for (var i = 0; i < n; i++) out.push(min + ((max - min) * i) / (n - 1));
    return out;
  }

  /* ==========================================================================
   * 二、画布初始化（自适应高 DPI）
   * ======================================================================== */

  function isCanvasLike(v) {
    return !!v && typeof v === 'object' && typeof v.getContext === 'function';
  }

  /**
   * 统一初始化：读取 clientWidth/clientHeight → 回退 opts.width/height → 回退 600x300，
   * 设置真实像素尺寸（× dpr，上限 3）并重置变换，返回 CSS 像素坐标系。
   */
  function setupCanvas(canvas, opts) {
    if (!isCanvasLike(canvas)) return null;
    var o = opts || {};
    var rawDpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
    if (!isNum(rawDpr) || rawDpr <= 0) rawDpr = 1;
    var dpr = Math.min(rawDpr, 3);

    var cw = canvas.clientWidth || o.width || 600;
    var ch = canvas.clientHeight || o.height || 300;
    if (!isNum(cw) || cw <= 0) cw = 600;
    if (!isNum(ch) || ch <= 0) ch = 300;
    cw = Math.round(cw);
    ch = Math.round(ch);

    var pw = Math.max(1, Math.round(cw * dpr));
    var ph = Math.max(1, Math.round(ch * dpr));
    if (canvas.width !== pw) canvas.width = pw;
    if (canvas.height !== ph) canvas.height = ph;

    var ctx = null;
    try {
      ctx = canvas.getContext('2d');
    } catch (e) {
      ctx = null;
    }
    if (!ctx) return null;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'butt';
    setDash(ctx, false);
    return { ctx: ctx, w: cw, h: ch, dpr: dpr };
  }

  /* 背景（opts.bg 可覆盖；传 'transparent' / 'none' 则不画） */
  function paintBg(ctx, w, h, opts) {
    var bg = (opts && opts.bg !== undefined) ? opts.bg : theme.bg;
    if (!bg || bg === 'transparent' || bg === 'none') return;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  }

  /* 空数据兜底图形：虚线框 + 文案 */
  function drawNoData(ctx, x, y, w, h, text) {
    if (!(w > 2) || !(h > 2)) return;
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = toRgba(theme.dim, 0.35);
    roundRect(ctx, x + 0.5, y + 0.5, Math.max(1, w - 1), Math.max(1, h - 1), 6);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = theme.dim;
    ctx.font = font(12, '400');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(text || '暂无数据'), x + w / 2, y + h / 2);
    ctx.restore();
  }

  /* ==========================================================================
   * 三、雷达图
   * ======================================================================== */

  function renderRadar(canvas, opts) {
    var o = opts || {};
    var s = setupCanvas(canvas, o);
    if (!s) return;
    var ctx = s.ctx, w = s.w, h = s.h;
    paintBg(ctx, w, h, o);

    var axesIn = Array.isArray(o.axes) ? o.axes : [];
    var axes = [];
    for (var ai = 0; ai < axesIn.length; ai++) {
      var a0 = axesIn[ai];
      if (!a0 || typeof a0 !== 'object') continue;
      axes.push(a0);
    }
    if (axes.length === 0) {
      drawNoData(ctx, w * 0.1, h * 0.12, w * 0.8, h * 0.76, '暂无数据');
      return;
    }

    var n = axes.length;
    var levels = clampInt(o.levels === undefined ? 4 : o.levels, 1, 10);
    var startAngle = isNum(o.startAngle) ? o.startAngle : -Math.PI / 2;
    var fillColor = o.fill === undefined ? 'rgba(34,211,238,0.18)' : o.fill;
    var stroke = o.stroke || theme.cyan;
    var gridColor = o.gridColor || theme.grid;
    var labelColor = o.labelColor || theme.muted;
    var valueColor = o.valueColor || theme.text;
    var showValues = o.showValues !== false;
    var ringLabels = o.ringLabels !== false;
    var radiusRatio = isNum(o.radiusRatio) ? clamp(o.radiusRatio, 0.3, 0.95) : 0.72;

    var cx = w / 2;
    var cy = h / 2 + 4;
    var radius = Math.max(10, (Math.min(w, h) / 2) * radiusRatio);

    /* 数据与轴上限（NaN / Infinity 视为 0，不丢轴） */
    var vals = [];
    var maxes = [];
    var i;
    for (i = 0; i < n; i++) {
      var v = toNum(axes[i].value, NaN);
      vals.push(isFinite(v) ? v : 0);
      maxes.push(isNum(axes[i].max) && axes[i].max > 0 ? axes[i].max : NaN);
    }
    var repMax = 0;
    for (i = 0; i < n; i++) if (isNum(maxes[i])) repMax = Math.max(repMax, maxes[i]);
    if (!(repMax > 0)) {
      var mv = 0;
      for (i = 0; i < n; i++) mv = Math.max(mv, vals[i]);
      repMax = mv > 0 ? niceMax(mv) : 100;
    }
    var axMax = [];
    for (i = 0; i < n; i++) axMax.push(isNum(maxes[i]) ? maxes[i] : repMax);

    function angleOf(idx) {
      return startAngle + (Math.PI * 2 * idx) / n;
    }
    function ptAt(idx, r) {
      var ang = angleOf(idx);
      return [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r];
    }

    /* 网格：>=3 轴画同心多边形，1~2 轴退化为同心圆 */
    ctx.save();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (var lv = 1; lv <= levels; lv++) {
      var rl = (radius * lv) / levels;
      ctx.beginPath();
      if (n >= 3) {
        for (i = 0; i < n; i++) {
          var gp = ptAt(i, rl);
          if (i === 0) ctx.moveTo(gp[0], gp[1]);
          else ctx.lineTo(gp[0], gp[1]);
        }
        ctx.closePath();
      } else {
        ctx.arc(cx, cy, Math.max(0.5, rl), 0, Math.PI * 2);
      }
      ctx.stroke();
    }
    /* 轴线 */
    ctx.beginPath();
    for (i = 0; i < n; i++) {
      var ep = ptAt(i, radius);
      ctx.moveTo(cx, cy);
      ctx.lineTo(ep[0], ep[1]);
    }
    ctx.stroke();
    ctx.restore();

    /* 环数值：沿竖直（向上）方向标注 */
    if (ringLabels) {
      ctx.save();
      ctx.font = font(10, '400');
      ctx.fillStyle = theme.dim;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      for (var r2 = 1; r2 <= levels; r2++) {
        var rr = (radius * r2) / levels;
        var rtxt = fmtTick((repMax * r2) / levels);
        ctx.fillText(rtxt, cx + 5, cy - rr);
      }
      ctx.restore();
    }

    /* 数据多边形 */
    var pts = [];
    for (i = 0; i < n; i++) {
      var m = axMax[i];
      var ratio = m > 0 ? vals[i] / m : 0;
      if (!isFinite(ratio)) ratio = 0;
      ratio = clamp(ratio, 0, 1);
      pts.push(ptAt(i, Math.max(0, radius * ratio)));
    }

    ctx.save();
    if (n >= 3 && fillColor) {
      ctx.beginPath();
      for (i = 0; i < n; i++) {
        if (i === 0) ctx.moveTo(pts[i][0], pts[i][1]);
        else ctx.lineTo(pts[i][0], pts[i][1]);
      }
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    ctx.beginPath();
    if (n === 1) {
      ctx.moveTo(pts[0][0], pts[0][1]);
      ctx.lineTo(pts[0][0], pts[0][1]);
    } else {
      for (i = 0; i < n; i++) {
        if (i === 0) ctx.moveTo(pts[i][0], pts[i][1]);
        else ctx.lineTo(pts[i][0], pts[i][1]);
      }
      if (n >= 3) ctx.closePath();
    }
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    /* 顶点光点 */
    for (i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.arc(pts[i][0], pts[i][1], 6, 0, Math.PI * 2);
      ctx.fillStyle = toRgba(stroke, 0.16);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pts[i][0], pts[i][1], 3.2, 0, Math.PI * 2);
      ctx.fillStyle = stroke;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pts[i][0], pts[i][1], 1.3, 0, Math.PI * 2);
      ctx.fillStyle = theme.bg;
      ctx.fill();
    }
    ctx.restore();

    /* 顶点数值（朝圆心方向内缩，避免压住轴线） */
    if (showValues) {
      ctx.save();
      ctx.font = font(10, '600');
      ctx.fillStyle = valueColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (i = 0; i < n; i++) {
        var dx = cx - pts[i][0];
        var dy = cy - pts[i][1];
        var len = Math.sqrt(dx * dx + dy * dy);
        if (len < 12) continue; /* 太靠近圆心不画，避免文字堆叠 */
        var tx = pts[i][0] + (dx / len) * 15;
        var ty = pts[i][1] + (dy / len) * 15;
        ctx.fillText(fmtTick(vals[i]), tx, ty);
      }
      ctx.restore();
    }

    /* 轴标签（末端外侧 + 超长截断 + display 小字） */
    ctx.save();
    ctx.font = font(11, '500');
    var labelR = radius + 14;
    for (i = 0; i < n; i++) {
      var aang = angleOf(i);
      var c = Math.cos(aang);
      var lx = cx + c * labelR;
      var ly = cy + Math.sin(aang) * labelR;
      var align = 'center';
      if (c > 0.25) align = 'left';
      else if (c < -0.25) align = 'right';
      var avail;
      if (align === 'left') avail = w - lx - 4;
      else if (align === 'right') avail = lx - 4;
      else avail = Math.min(lx, w - lx) * 2 - 8;
      avail = Math.max(24, avail);

      var rawLabel = axes[i].label === undefined || axes[i].label === null ? '' : String(axes[i].label);
      var disp = axes[i].display;
      var hasDisp = disp !== undefined && disp !== null && String(disp) !== '';

      ctx.textAlign = align;
      ctx.font = font(11, '500');
      ctx.fillStyle = labelColor;
      if (hasDisp) {
        ctx.textBaseline = 'bottom';
        ctx.fillText(fitText(ctx, rawLabel, avail), lx, ly - 1);
        ctx.font = font(10, '700');
        ctx.fillStyle = stroke;
        ctx.textBaseline = 'top';
        ctx.fillText(fitText(ctx, String(disp), avail), lx, ly + 1);
      } else {
        ctx.textBaseline = 'middle';
        ctx.fillText(fitText(ctx, rawLabel, avail), lx, ly);
      }
    }
    ctx.restore();
  }

  /* ==========================================================================
   * 四、折线图
   * ======================================================================== */

  function renderLineChart(canvas, opts) {
    var o = opts || {};
    var s = setupCanvas(canvas, o);
    if (!s) return;
    var ctx = s.ctx, w = s.w, h = s.h;
    paintBg(ctx, w, h, o);

    /* --- 归一化 series（过滤 NaN / Infinity 点） --- */
    var rawSeries = Array.isArray(o.series) ? o.series : [];
    var series = [];
    var i, j;
    for (i = 0; i < rawSeries.length; i++) {
      var rs = rawSeries[i];
      if (!rs || typeof rs !== 'object') continue;
      var ptsIn = Array.isArray(rs.points) ? rs.points : [];
      var pts = [];
      for (j = 0; j < ptsIn.length; j++) {
        var p = ptsIn[j];
        var px, py;
        if (Array.isArray(p)) {
          px = toNum(p[0], NaN);
          py = toNum(p[1], NaN);
        } else if (p && typeof p === 'object') {
          px = toNum(p.x, NaN);
          py = toNum(p.y, NaN);
        } else {
          continue;
        }
        if (isFinite(px) && isFinite(py)) pts.push([px, py]);
      }
      series.push({
        label: rs.label === undefined || rs.label === null ? '' : String(rs.label),
        color: rs.color || theme.series[series.length % theme.series.length],
        points: pts,
        width: isNum(rs.width) && rs.width > 0 ? rs.width : 2,
        fill: !!rs.fill,
        dashed: !!rs.dashed
      });
    }

    /* --- 数据范围 --- */
    var dxMin = Infinity, dxMax = -Infinity, dyMin = Infinity, dyMax = -Infinity;
    for (i = 0; i < series.length; i++) {
      var sp = series[i].points;
      for (j = 0; j < sp.length; j++) {
        if (sp[j][0] < dxMin) dxMin = sp[j][0];
        if (sp[j][0] > dxMax) dxMax = sp[j][0];
        if (sp[j][1] < dyMin) dyMin = sp[j][1];
        if (sp[j][1] > dyMax) dyMax = sp[j][1];
      }
    }
    var haveData = isFinite(dxMin) && isFinite(dxMax);

    var xMin = toNum(o.xMin, NaN);
    var xMax = toNum(o.xMax, NaN);
    var yMin = toNum(o.yMin, NaN);
    var yMax = toNum(o.yMax, NaN);

    if (!isFinite(xMin)) xMin = haveData ? dxMin : 0;
    if (!isFinite(xMax)) xMax = haveData ? dxMax : 1;
    if (!(xMax > xMin)) {
      /* max<=min 兜底：单点居中，其余向上扩 1 */
      if (xMax === xMin) {
        xMin = xMin - 0.5;
        xMax = xMax + 0.5;
      } else {
        var tmpX = xMin;
        xMin = Math.min(tmpX, xMax);
        xMax = Math.max(tmpX, xMax);
      }
    }
    if (!isFinite(yMin)) yMin = 0; /* 默认 yMin = 0 */
    if (!isFinite(yMax)) {
      if (haveData && dyMax > 0) yMax = niceMax(dyMax);
      else if (haveData && dyMax <= 0 && dyMin < 0) yMax = 0;
      else yMax = 1;
    }
    if (!(yMax > yMin)) yMax = yMin + 1; /* 兜底，绝不出现除零 */

    var xTicks = clampInt(o.xTicks === undefined ? 6 : o.xTicks, 1, 20);
    var yTicks = clampInt(o.yTicks === undefined ? 5 : o.yTicks, 1, 12);
    var xVals = ticksOf(xMin, xMax, xTicks);
    var yVals = ticksOf(yMin, yMax, yTicks);

    /* --- annotations / bands --- */
    var bands = [];
    if (Array.isArray(o.bands)) {
      for (i = 0; i < o.bands.length; i++) {
        var bd = o.bands[i];
        if (!bd) continue;
        var bf = toNum(bd.from, NaN);
        var bt = toNum(bd.to, NaN);
        if (!isFinite(bf) || !isFinite(bt)) continue;
        bands.push({ from: bf, to: bt, color: bd.color || 'rgba(255,255,255,0.04)' });
      }
    }
    var annos = [];
    if (Array.isArray(o.annotations)) {
      for (i = 0; i < o.annotations.length; i++) {
        var an = o.annotations[i];
        if (!an) continue;
        var ax = toNum(an.x, NaN);
        if (!isFinite(ax)) continue;
        annos.push({
          x: ax,
          label: an.label === undefined || an.label === null ? '' : String(an.label),
          color: an.color || theme.amber,
          dashed: an.dashed !== false
        });
      }
    }

    var legend = o.legend !== false && series.length > 0;
    var yLabelText = o.yLabel ? String(o.yLabel) : '';
    var xLabelText = o.xLabel ? String(o.xLabel) : '';

    /* --- 自适应 padding（按 y 轴刻度宽度 / x 轴文本高度） --- */
    ctx.font = font(10, '400');
    var yTickW = 0;
    for (i = 0; i < yVals.length; i++) {
      var lw = ctx.measureText(fmtTick(yVals[i])).width;
      if (lw > yTickW) yTickW = lw;
    }
    var left = 10 + Math.min(yTickW, 64) + 8 + (yLabelText ? 15 : 0);
    var bottom = 10 + 12 + (xLabelText ? 15 : 0);
    var right = 14;
    var top = 10 + (legend ? 16 : 0) + (annos.length ? 15 : 0);
    if (left > w * 0.5) left = Math.round(w * 0.5);
    if (bottom > h * 0.5) bottom = Math.round(h * 0.5);

    var plot = {
      x: left,
      y: top,
      w: Math.max(16, w - left - right),
      h: Math.max(16, h - top - bottom)
    };

    function xs(v) {
      return plot.x + ((v - xMin) / (xMax - xMin)) * plot.w;
    }
    function ys(v) {
      return plot.y + plot.h - ((v - yMin) / (yMax - yMin)) * plot.h;
    }

    /* --- 横向色带（优秀 / 良好 / 一般） --- */
    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.x, plot.y, plot.w, plot.h);
    ctx.clip();
    for (i = 0; i < bands.length; i++) {
      var y1 = ys(bands[i].from);
      var y2 = ys(bands[i].to);
      var bandTop = Math.min(y1, y2);
      var bandH = Math.abs(y2 - y1);
      if (bandH < 0.5) bandH = 0.5;
      ctx.fillStyle = bands[i].color;
      ctx.fillRect(plot.x, bandTop, plot.w, bandH);
    }
    ctx.restore();

    /* --- 网格与边框 --- */
    ctx.save();
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < yVals.length; i++) {
      var gy = Math.round(ys(yVals[i])) + 0.5;
      ctx.moveTo(plot.x, gy);
      ctx.lineTo(plot.x + plot.w, gy);
    }
    for (i = 0; i < xVals.length; i++) {
      var gx = Math.round(xs(xVals[i])) + 0.5;
      ctx.moveTo(gx, plot.y);
      ctx.lineTo(gx, plot.y + plot.h);
    }
    ctx.stroke();
    ctx.strokeStyle = theme.border;
    ctx.strokeRect(plot.x + 0.5, plot.y + 0.5, Math.max(1, plot.w - 1), Math.max(1, plot.h - 1));
    ctx.restore();

    /* --- y 轴刻度值 --- */
    ctx.save();
    ctx.font = font(10, '400');
    ctx.fillStyle = theme.muted;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (i = 0; i < yVals.length; i++) {
      ctx.fillText(fmtTick(yVals[i]), plot.x - 8, ys(yVals[i]));
    }
    ctx.restore();

    /* --- x 轴刻度值（相邻重叠时跳过） --- */
    ctx.save();
    ctx.font = font(10, '400');
    ctx.fillStyle = theme.muted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    var slotW = xVals.length > 1 ? plot.w / (xVals.length - 1) : plot.w;
    var lastRight = -Infinity;
    for (i = 0; i < xVals.length; i++) {
      var labX = xs(xVals[i]);
      var maxLabelW = Math.max(18, slotW - 6);
      var txt = fitText(ctx, fmtTick(xVals[i]), maxLabelW);
      var tw = ctx.measureText(txt).width;
      var clampedX = clamp(labX, plot.x + tw / 2, plot.x + plot.w - tw / 2);
      if (clampedX - tw / 2 < lastRight + 4) continue;
      ctx.fillText(txt, clampedX, plot.y + plot.h + 5);
      lastRight = clampedX + tw / 2;
    }
    ctx.restore();

    /* --- 各种标量标签 --- */
    ctx.save();
    ctx.font = font(10, '400');
    ctx.fillStyle = theme.muted;
    if (yLabelText) {
      ctx.save();
      ctx.translate(Math.max(10, 11), plot.y + plot.h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(fitText(ctx, yLabelText, plot.h), 0, 0);
      ctx.restore();
    }
    if (xLabelText) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(fitText(ctx, xLabelText, plot.w), plot.x + plot.w / 2, plot.y + plot.h + 19);
    }
    ctx.restore();

    /* --- 图例（放在绘图区上方的留白里） --- */
    if (legend) {
      ctx.save();
      ctx.font = font(10, '500');
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      var sw = 9, gap = 6, itemGap = 14;
      var total = 0;
      for (i = 0; i < series.length; i++) {
        total += sw + gap + ctx.measureText(series[i].label).width + itemGap;
      }
      var labelMax = Infinity;
      if (total > plot.w && series.length > 0) {
        labelMax = Math.max(16, (plot.w - series.length * (sw + gap + itemGap)) / series.length);
      }
      var lx = plot.x;
      var ly = plot.y - 8;
      for (i = 0; i < series.length; i++) {
        if (lx > plot.x + plot.w) break;
        roundRect(ctx, lx, ly - 1.5, sw, 3, 1.5);
        ctx.fillStyle = series[i].color;
        ctx.fill();
        ctx.fillStyle = theme.muted;
        var lt = fitText(ctx, series[i].label, labelMax);
        ctx.fillText(lt, lx + sw + gap, ly);
        lx += sw + gap + ctx.measureText(lt).width + itemGap;
      }
      ctx.restore();
    }

    /* --- 数据曲线 --- */
    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.x, plot.y, plot.w, plot.h);
    ctx.clip();
    for (i = 0; i < series.length; i++) {
      var sr = series[i];
      var pl = sr.points;
      if (pl.length === 0) continue;

      if (sr.fill && pl.length > 1) {
        ctx.beginPath();
        for (j = 0; j < pl.length; j++) {
          var fx = xs(pl[j][0]);
          var fy = ys(pl[j][1]);
          if (j === 0) ctx.moveTo(fx, fy);
          else ctx.lineTo(fx, fy);
        }
        ctx.lineTo(xs(pl[pl.length - 1][0]), ys(yMin));
        ctx.lineTo(xs(pl[0][0]), ys(yMin));
        ctx.closePath();
        var grad = ctx.createLinearGradient(0, plot.y, 0, plot.y + plot.h);
        grad.addColorStop(0, toRgba(sr.color, 0.3));
        grad.addColorStop(1, toRgba(sr.color, 0.02));
        ctx.fillStyle = grad;
        ctx.fill();
      }

      ctx.beginPath();
      for (j = 0; j < pl.length; j++) {
        var lpx = xs(pl[j][0]);
        var lpy = ys(pl[j][1]);
        if (j === 0) ctx.moveTo(lpx, lpy);
        else ctx.lineTo(lpx, lpy);
      }
      setDash(ctx, sr.dashed, [6, 4]);
      if (!sr.dashed && sr.width >= 1.5) {
        /* 细描一层外发光 */
        ctx.strokeStyle = toRgba(sr.color, 0.12);
        ctx.lineWidth = sr.width + 3;
        ctx.stroke();
      }
      ctx.strokeStyle = sr.color;
      ctx.lineWidth = sr.width;
      ctx.stroke();
      setDash(ctx, false);

      /* 单点：画圆点，避免什么都看不到 */
      if (pl.length === 1) {
        ctx.beginPath();
        ctx.arc(xs(pl[0][0]), ys(pl[0][1]), 3, 0, Math.PI * 2);
        ctx.fillStyle = sr.color;
        ctx.fill();
      }
    }
    ctx.restore();

    /* --- 竖直标注线 + 顶部文字 --- */
    for (i = 0; i < annos.length; i++) {
      var an2 = annos[i];
      if (an2.x < Math.min(xMin, xMax) || an2.x > Math.max(xMin, xMax)) continue;
      var apx = xs(an2.x);
      ctx.save();
      ctx.beginPath();
      ctx.rect(plot.x, plot.y, plot.w, plot.h);
      ctx.clip();
      ctx.strokeStyle = an2.color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.85;
      setDash(ctx, an2.dashed, [4, 4]);
      ctx.beginPath();
      ctx.moveTo(apx, plot.y);
      ctx.lineTo(apx, plot.y + plot.h);
      ctx.stroke();
      ctx.restore();

      if (an2.label) {
        ctx.save();
        ctx.font = font(10, '600');
        var tw2 = ctx.measureText(an2.label).width;
        var chipW = tw2 + 10;
        var chipX = apx + 4;
        if (chipX + chipW > plot.x + plot.w) chipX = apx - 4 - chipW;
        chipX = clamp(chipX, plot.x, plot.x + plot.w - chipW);
        var chipY = plot.y + 3;
        roundRect(ctx, chipX, chipY, chipW, 14, 3);
        ctx.fillStyle = toRgba(theme.panel, 0.92);
        ctx.fill();
        ctx.strokeStyle = toRgba(an2.color, 0.6);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = an2.color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(an2.label, chipX + 5, chipY + 7.5);
        ctx.restore();
      }
    }

    /* --- 完全无数据兜底 --- */
    if (!haveData) {
      drawNoData(ctx, plot.x + 4, plot.y + 4, plot.w - 8, plot.h - 8, '暂无数据');
    }
  }

  /* ==========================================================================
   * 五、横向条形图
   * ======================================================================== */

  function renderHBar(canvas, opts) {
    var o = opts || {};
    var s = setupCanvas(canvas, o);
    if (!s) return;
    var ctx = s.ctx, w = s.w, h = s.h;
    paintBg(ctx, w, h, o);

    var itemsIn = Array.isArray(o.items) ? o.items : [];
    var items = [];
    var i;
    for (i = 0; i < itemsIn.length; i++) {
      var it = itemsIn[i];
      if (!it || typeof it !== 'object') continue;
      var raw = toNum(it.value, NaN);
      items.push({
        label: it.label === undefined || it.label === null ? '' : String(it.label),
        value: isFinite(raw) ? raw : 0,
        finite: isFinite(raw),
        max: isNum(it.max) && it.max > 0 ? it.max : NaN,
        color: it.color || theme.series[items.length % theme.series.length],
        display: it.display === undefined || it.display === null ? '' : String(it.display),
        sub: it.sub === undefined || it.sub === null ? '' : String(it.sub)
      });
    }
    if (items.length === 0) {
      drawNoData(ctx, 8, 8, w - 16, h - 16, '暂无数据');
      return;
    }

    /* 全局最大值兜底（全 0 / 全 NaN 时不会除零） */
    var gmax = 0;
    for (i = 0; i < items.length; i++) if (items[i].finite && items[i].value > gmax) gmax = items[i].value;
    var allZero = !(gmax > 0);
    if (allZero) gmax = 1;

    var padX = 12;
    var padY = 10;

    /* 左侧标签列宽（自动） */
    ctx.font = font(12, '500');
    var labelW = isNum(o.labelWidth) && o.labelWidth > 0 ? o.labelWidth : 0;
    if (!labelW) {
      var mx = 0;
      for (i = 0; i < items.length; i++) {
        var mw = ctx.measureText(items[i].label).width;
        if (mw > mx) mx = mw;
      }
      labelW = Math.min(mx + 10, Math.max(40, w * 0.42));
    }
    labelW = clamp(labelW, 24, Math.max(30, w * 0.6));

    /* 右侧数值列宽 */
    var valueW = 44;
    for (i = 0; i < items.length; i++) {
      ctx.font = font(12, '700');
      valueW = Math.max(valueW, ctx.measureText(items[i].display || fmtCompact(items[i].value)).width);
      if (items[i].sub) {
        ctx.font = font(10, '400');
        valueW = Math.max(valueW, ctx.measureText(items[i].sub).width);
      }
    }
    valueW = clamp(valueW + 10, 32, Math.max(32, w * 0.42));

    var barX = padX + labelW + 8;
    var barW = Math.max(10, w - barX - valueW - padX);

    /* 行高与间距（空间不足时等比压缩，且垂直居中） */
    var rowH0 = Math.max(12, toNum(o.rowHeight, 38));
    var gap0 = Math.max(2, toNum(o.gap, 10));
    var availH = h - padY * 2;
    var need = items.length * rowH0 + (items.length - 1) * gap0;
    var rowH = rowH0, gap = gap0;
    if (need > availH && need > 0) {
      var k = availH / need;
      rowH = Math.max(14, rowH0 * k);
      gap = Math.max(2, gap0 * k);
      need = items.length * rowH + (items.length - 1) * gap;
    }
    var y0 = padY + Math.max(0, (availH - need) / 2);

    var barRadius = Math.max(0, Math.min(toNum(o.barRadius, 4), rowH / 2));
    var showTrack = o.showTrack !== false;
    var barH = Math.max(5, Math.min(rowH * 0.44, 18));
    if (barH > rowH - 2) barH = Math.max(4, rowH - 2);

    for (i = 0; i < items.length; i++) {
      var cur = items[i];
      var cy = y0 + i * (rowH + gap) + rowH / 2;
      var m = isNum(cur.max) ? cur.max : gmax;
      var ratio = m > 0 ? cur.value / m : 0;
      if (!isFinite(ratio)) ratio = 0;
      ratio = clamp(ratio, 0, 1);

      /* 轨道 */
      if (showTrack) {
        roundRect(ctx, barX, cy - barH / 2, barW, barH, barRadius);
        ctx.fillStyle = toRgba(theme.grid, 0.9);
        ctx.fill();
      }

      /* 条体 */
      var bw = 0;
      if (ratio > 0) bw = Math.min(barW, Math.max(3, barW * ratio));
      if (bw > 0) {
        var barGrad = ctx.createLinearGradient(barX, 0, barX + bw, 0);
        barGrad.addColorStop(0, toRgba(cur.color, 0.5));
        barGrad.addColorStop(1, cur.color);
        roundRect(ctx, barX, cy - barH / 2, bw, barH, Math.min(barRadius, bw / 2));
        ctx.fillStyle = barGrad;
        ctx.fill();
        /* 右端高光 */
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = toRgba(cur.color, 0.9);
        ctx.fillRect(Math.max(barX, barX + bw - 2), cy - barH / 2, 2, barH);
        ctx.restore();
      } else if (allZero) {
        /* 全 0 兜底：留一小段暗色基座，避免整行空白 */
        roundRect(ctx, barX, cy - barH / 2, Math.min(barW, 4), barH, Math.min(barRadius, 2));
        ctx.fillStyle = toRgba(theme.dim, 0.45);
        ctx.fill();
      }

      /* 左侧标签 */
      ctx.font = font(12, '500');
      ctx.fillStyle = theme.muted;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(fitText(ctx, cur.label, labelW - 2), barX - 8, cy);

      /* 右侧数值（display 优先）+ sub 小字 */
      var vtxt = cur.display || fmtCompact(cur.value);
      ctx.textAlign = 'right';
      if (cur.sub) {
        ctx.font = font(12, '700');
        ctx.fillStyle = theme.text;
        ctx.textBaseline = 'bottom';
        ctx.fillText(fitText(ctx, vtxt, valueW - 4), w - padX, cy - 1);
        ctx.font = font(10, '400');
        ctx.fillStyle = theme.dim;
        ctx.textBaseline = 'top';
        ctx.fillText(fitText(ctx, cur.sub, valueW - 4), w - padX, cy + 1);
      } else {
        ctx.font = font(12, '700');
        ctx.fillStyle = theme.text;
        ctx.textBaseline = 'middle';
        ctx.fillText(fitText(ctx, vtxt, valueW - 4), w - padX, cy);
      }
    }
  }

  /* ==========================================================================
   * 六、仪表盘（270° 圆弧）
   * ======================================================================== */

  function renderGauge(canvas, opts) {
    var o = opts || {};
    var s = setupCanvas(canvas, o);
    if (!s) return;
    var ctx = s.ctx, w = s.w, h = s.h;
    paintBg(ctx, w, h, o);

    var min = isNum(o.min) ? o.min : 0;
    var max = isNum(o.max) ? o.max : 100;
    if (!(max > min)) max = min + 1; /* max<=min 兜底 */

    var raw = toNum(o.value, NaN);
    var value = isFinite(raw) ? raw : min;
    var t = clamp((value - min) / (max - min), 0, 1);

    var cx = w / 2;
    var cy = h * 0.56;
    var radius = Math.max(8, Math.min(w / 2, h / 2) * 0.82);
    var thickness = isNum(o.thickness) && o.thickness > 0 ? o.thickness : radius * 0.16;
    thickness = clamp(thickness, 4, Math.max(5, radius * 0.5));
    var arcR = Math.max(4, radius - thickness / 2);

    var A0 = Math.PI * 0.75;       /* 135° */
    var SWEEP = Math.PI * 1.5;     /* 270° → 405° */
    function ang(tt) {
      return A0 + SWEEP * clamp(tt, 0, 1);
    }

    /* 轨道 */
    ctx.save();
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.arc(cx, cy, arcR, ang(0), ang(1), false);
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = thickness;
    ctx.stroke();
    ctx.restore();

    /* 分段 */
    var segs = [];
    if (Array.isArray(o.segments)) {
      for (var si = 0; si < o.segments.length; si++) {
        var sg = o.segments[si];
        if (!sg || typeof sg !== 'object') continue;
        var f = toNum(sg.from, NaN);
        var tt2 = toNum(sg.to, NaN);
        if (!isFinite(f) || !isFinite(tt2) || !(tt2 > f)) continue;
        segs.push({ from: f, to: tt2, color: sg.color || theme.series[segs.length % theme.series.length] });
      }
    }

    var arcColor = o.color || theme.cyan;
    if (segs.length > 0) {
      /* 分段刻度轨道（弱化） */
      ctx.save();
      ctx.lineCap = 'butt';
      for (var k = 0; k < segs.length; k++) {
        var t0 = clamp((segs[k].from - min) / (max - min), 0, 1);
        var t1 = clamp((segs[k].to - min) / (max - min), 0, 1);
        if (!(t1 > t0)) continue;
        ctx.beginPath();
        ctx.arc(cx, cy, arcR, ang(t0), ang(t1), false);
        ctx.strokeStyle = toRgba(segs[k].color, 0.22);
        ctx.lineWidth = thickness;
        ctx.stroke();
      }
      ctx.restore();

      /* 当前值所在分段高亮 */
      var active = null;
      for (var m2 = 0; m2 < segs.length; m2++) {
        if (value >= segs[m2].from && value <= segs[m2].to) {
          active = segs[m2];
          break;
        }
      }
      if (!active) active = value < segs[0].from ? segs[0] : segs[segs.length - 1];
      arcColor = active.color;
    }

    /* 当前值圆弧（带柔光） */
    if (t > 0.0005) {
      ctx.save();
      ctx.lineCap = t < 0.02 ? 'butt' : 'round';
      ctx.shadowColor = toRgba(arcColor, 0.55);
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(cx, cy, arcR, ang(0), ang(t), false);
      ctx.strokeStyle = arcColor;
      ctx.lineWidth = thickness;
      ctx.stroke();
      ctx.restore();
    }

    /* 刻度线（画在圆弧内侧） */
    var tickCount = clampInt(o.ticks === undefined ? 0 : o.ticks, 0, 60);
    if (tickCount > 0) {
      ctx.save();
      ctx.strokeStyle = toRgba(theme.dim, 0.9);
      ctx.lineWidth = 1;
      var r1 = arcR - thickness / 2 - 3;
      var r2 = r1 - Math.max(2, Math.min(6, thickness * 0.5));
      ctx.beginPath();
      for (var ti = 0; ti <= tickCount; ti++) {
        var aa = ang(ti / tickCount);
        ctx.moveTo(cx + Math.cos(aa) * r1, cy + Math.sin(aa) * r1);
        ctx.lineTo(cx + Math.cos(aa) * r2, cy + Math.sin(aa) * r2);
      }
      ctx.stroke();
      ctx.restore();
    }

    /* 中心大字与说明 */
    var valueText = o.valueText === undefined || o.valueText === null
      ? (isFinite(raw) ? fmtPlain(value) : '—')
      : String(o.valueText);
    var big = clamp(arcR * 0.5, 18, 46);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = font(big, '700');
    ctx.fillStyle = theme.text;
    ctx.fillText(fitText(ctx, valueText, Math.max(24, arcR * 1.5)), cx, cy - big * 0.06);

    var ly = cy + big * 0.62 + 10;
    var labelText = o.label ? String(o.label) : '';
    var subText = o.sublabel ? String(o.sublabel) : '';
    if (labelText) {
      ctx.font = font(12, '500');
      ctx.fillStyle = theme.muted;
      ctx.fillText(fitText(ctx, labelText, Math.max(24, w - 16)), cx, ly);
      ly += 15;
    }
    if (subText) {
      ctx.font = font(10, '400');
      ctx.fillStyle = theme.dim;
      ctx.fillText(fitText(ctx, subText, Math.max(24, w - 16)), cx, ly);
    }
    ctx.restore();
  }

  /* ==========================================================================
   * 七、环形进度图
   * ======================================================================== */

  function renderDonut(canvas, opts) {
    var o = opts || {};
    var s = setupCanvas(canvas, o);
    if (!s) return;
    var ctx = s.ctx, w = s.w, h = s.h;
    paintBg(ctx, w, h, o);

    var max = isNum(o.max) && o.max > 0 ? o.max : 100;
    var raw = toNum(o.value, NaN);
    var value = isFinite(raw) ? raw : 0;
    var t = clamp(value / max, 0, 1);

    var cx = w / 2;
    var cy = h / 2;
    var half = Math.min(w, h) / 2;
    var thickness = isNum(o.thickness) && o.thickness > 0 ? o.thickness : 18;
    thickness = clamp(thickness, 3, Math.max(4, half - 4));
    var r = Math.max(3, half - thickness / 2 - 4);
    var A0 = -Math.PI / 2;

    /* 轨道 */
    ctx.save();
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = thickness;
    ctx.stroke();
    ctx.restore();

    /* 进度弧 */
    var color = o.color || theme.cyan;
    if (t > 0.0005) {
      ctx.save();
      ctx.lineCap = t < 0.02 ? 'butt' : 'round';
      ctx.shadowColor = toRgba(color, 0.5);
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(cx, cy, r, A0, A0 + Math.PI * 2 * t, false);
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      ctx.stroke();
      ctx.restore();
    }

    /* 中心文案：大字数值 + label + sublabel */
    var inner = Math.max(20, (r - thickness / 2) * 1.7);
    var big = clamp(r * 0.44, 14, 34);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = font(big, '700');
    ctx.fillStyle = theme.text;
    ctx.fillText(fitText(ctx, fmtPlain(value), inner), cx, cy - big * 0.1 - 4);

    var labelText = o.label ? String(o.label) : '';
    var subText = o.sublabel ? String(o.sublabel) : '';
    var ly = cy + big * 0.62;
    if (!labelText && !subText) {
      ctx.font = font(11, '500');
      ctx.fillStyle = theme.muted;
      ctx.fillText(Math.round(t * 100) + '%', cx, ly);
    } else {
      if (labelText) {
        ctx.font = font(11, '500');
        ctx.fillStyle = theme.muted;
        ctx.fillText(fitText(ctx, labelText, inner), cx, ly);
        ly += 14;
      }
      if (subText) {
        ctx.font = font(10, '400');
        ctx.fillStyle = theme.dim;
        ctx.fillText(fitText(ctx, subText, inner), cx, ly);
      }
    }
    ctx.restore();
  }

  /* ==========================================================================
   * 八、迷你趋势图（实时帧率）
   * ======================================================================== */

  function renderSparkline(canvas, opts) {
    var o = opts || {};
    var s = setupCanvas(canvas, o);
    if (!s) return;
    var ctx = s.ctx, w = s.w, h = s.h;
    paintBg(ctx, w, h, o);

    var pad = isNum(o.padding) ? Math.max(0, o.padding) : 2;
    var plot = {
      x: pad,
      y: pad,
      w: Math.max(1, w - pad * 2),
      h: Math.max(1, h - pad * 2)
    };
    var color = o.color || theme.cyan;
    var fill = o.fill !== false;
    var marker = o.marker !== false;
    var lineW = isNum(o.width) && o.width > 0 ? o.width : 1.6;

    /* 过滤 NaN / Infinity */
    var vals = [];
    if (Array.isArray(o.values)) {
      for (var i = 0; i < o.values.length; i++) {
        var v = toNum(o.values[i], NaN);
        if (isFinite(v)) vals.push(v);
      }
    }

    /* 空数据兜底：中间一条暗线 */
    if (vals.length === 0) {
      ctx.save();
      ctx.strokeStyle = toRgba(theme.dim, 0.5);
      ctx.lineWidth = 1;
      ctx.beginPath();
      var my = plot.y + plot.h / 2;
      ctx.moveTo(plot.x, my);
      ctx.lineTo(plot.x + plot.w, my);
      ctx.stroke();
      if (h >= 60) {
        ctx.fillStyle = theme.dim;
        ctx.font = font(10, '400');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('暂无数据', plot.x + plot.w / 2, my - 10);
      }
      ctx.restore();
      return;
    }

    /* 值域 */
    var d0 = Infinity, d1 = -Infinity;
    for (i = 0; i < vals.length; i++) {
      if (vals[i] < d0) d0 = vals[i];
      if (vals[i] > d1) d1 = vals[i];
    }
    var mn = isNum(o.min) ? o.min : d0;
    var mx = isNum(o.max) ? o.max : d1;
    if (d0 === d1 && !isNum(o.min) && !isNum(o.max)) {
      /* 全 0 / 恒定值兜底：上下各撑开一点，线条居中 */
      var span = Math.abs(d0) * 0.1 || 1;
      mn = d0 - span;
      mx = d1 + span;
    }
    if (!(mx > mn)) mx = mn + 1; /* max<=min 兜底 */

    function ys(v) {
      return plot.y + plot.h - ((v - mn) / (mx - mn)) * plot.h;
    }

    function strokePath(pts, closeFill) {
      ctx.beginPath();
      for (var p = 0; p < pts.length; p++) {
        if (p === 0) ctx.moveTo(pts[p][0], pts[p][1]);
        else ctx.lineTo(pts[p][0], pts[p][1]);
      }
      if (closeFill) {
        ctx.lineTo(pts[pts.length - 1][0], plot.y + plot.h);
        ctx.lineTo(pts[0][0], plot.y + plot.h);
        ctx.closePath();
      }
    }

    /* 单点兜底：整条水平线 + 右端标记 */
    if (vals.length === 1) {
      var onlyY = ys(vals[0]);
      if (fill) {
        var g0 = ctx.createLinearGradient(0, plot.y, 0, plot.y + plot.h);
        g0.addColorStop(0, toRgba(color, 0.28));
        g0.addColorStop(1, toRgba(color, 0.02));
        ctx.fillStyle = g0;
        ctx.fillRect(plot.x, onlyY, plot.w, Math.max(0, plot.y + plot.h - onlyY));
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = lineW;
      ctx.beginPath();
      ctx.moveTo(plot.x, onlyY);
      ctx.lineTo(plot.x + plot.w, onlyY);
      ctx.stroke();
      if (marker) drawSparkMarker(ctx, plot.x + plot.w, onlyY, color, theme.bg);
      return;
    }

    /* 降采样：按像素列取最大 / 最小，保留尖峰 */
    var cols = Math.max(1, Math.round(plot.w));
    var pts = [];
    if (vals.length <= cols * 2) {
      for (i = 0; i < vals.length; i++) {
        pts.push([plot.x + (plot.w * i) / (vals.length - 1), ys(vals[i])]);
      }
    } else {
      var bucket = vals.length / cols;
      for (var c = 0; c < cols; c++) {
        var i0 = Math.floor(c * bucket);
        var i1 = Math.max(i0 + 1, Math.floor((c + 1) * bucket));
        if (i1 > vals.length) i1 = vals.length;
        var vmin = Infinity, vmax = -Infinity, imin = i0, imax = i0;
        for (i = i0; i < i1; i++) {
          var cv = vals[i];
          if (cv < vmin) { vmin = cv; imin = i; }
          if (cv > vmax) { vmax = cv; imax = i; }
        }
        if (!isFinite(vmin)) continue;
        var cxp = plot.x + (cols === 1 ? 0 : (plot.w * c) / (cols - 1));
        if (imax === imin) {
          pts.push([cxp, ys(vmax)]);
        } else if (imax < imin) {
          pts.push([cxp, ys(vmax)]);
          pts.push([cxp, ys(vmin)]);
        } else {
          pts.push([cxp, ys(vmin)]);
          pts.push([cxp, ys(vmax)]);
        }
      }
    }

    if (pts.length >= 2) {
      if (fill) {
        var g = ctx.createLinearGradient(0, plot.y, 0, plot.y + plot.h);
        g.addColorStop(0, toRgba(color, 0.3));
        g.addColorStop(1, toRgba(color, 0.02));
        strokePath(pts, true);
        ctx.fillStyle = g;
        ctx.fill();
      }
      ctx.save();
      strokePath(pts, false);
      ctx.strokeStyle = toRgba(color, 0.12);
      ctx.lineWidth = lineW + 3;
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineW;
      ctx.stroke();
      ctx.restore();
    }

    /* 末端标记 */
    if (marker && pts.length > 0) {
      var last = pts[pts.length - 1];
      if (last[1] < pts[0][1]) last = pts[0];
      drawSparkMarker(ctx, plot.x + plot.w, ys(vals[vals.length - 1]), color, theme.bg);
    }
  }

  /* 迷你图末端光点 */
  function drawSparkMarker(ctx, x, y, color, bg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = toRgba(color, 0.18);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 2.6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 1.1, 0, Math.PI * 2);
    ctx.fillStyle = bg || theme.bg;
    ctx.fill();
    ctx.restore();
  }

  /* ==========================================================================
   * 九、竖向柱状图
   * ======================================================================== */

  function renderBars(canvas, opts) {
    var o = opts || {};
    var s = setupCanvas(canvas, o);
    if (!s) return;
    var ctx = s.ctx, w = s.w, h = s.h;
    paintBg(ctx, w, h, o);

    var catsIn = Array.isArray(o.categories) ? o.categories : [];
    var cats = [];
    var i;
    for (i = 0; i < catsIn.length; i++) {
      var c0 = catsIn[i];
      if (!c0 || typeof c0 !== 'object') continue;
      var raw = toNum(c0.value, NaN);
      cats.push({
        label: c0.label === undefined || c0.label === null ? '' : String(c0.label),
        value: isFinite(raw) ? raw : 0,
        color: c0.color || theme.series[cats.length % theme.series.length],
        display: c0.display === undefined || c0.display === null ? '' : String(c0.display)
      });
    }
    if (cats.length === 0) {
      drawNoData(ctx, 8, 8, w - 16, h - 16, '暂无数据');
      return;
    }

    var maxV = 0;
    for (i = 0; i < cats.length; i++) if (cats[i].value > maxV) maxV = cats[i].value;
    var yMax = isNum(o.yMax) && o.yMax > 0 ? o.yMax : (maxV > 0 ? niceMax(maxV) : 1);

    var showValues = o.showValues !== false;
    var yLabelText = o.yLabel ? String(o.yLabel) : '';
    var yTicks = clampInt(o.yTicks === undefined ? 5 : o.yTicks, 1, 10);
    var yVals = ticksOf(0, yMax, yTicks);

    ctx.font = font(10, '400');
    var yTickW = 0;
    for (i = 0; i < yVals.length; i++) {
      var tw = ctx.measureText(fmtTick(yVals[i])).width;
      if (tw > yTickW) yTickW = tw;
    }
    var left = 10 + Math.min(yTickW, 64) + 8 + (yLabelText ? 15 : 0);
    var right = 12;
    var bottom = 10 + 13 + 4;
    var top = 12 + (showValues ? 14 : 0);
    if (left > w * 0.5) left = Math.round(w * 0.5);
    if (bottom > h * 0.5) bottom = Math.round(h * 0.5);

    var plot = {
      x: left,
      y: top,
      w: Math.max(16, w - left - right),
      h: Math.max(16, h - top - bottom)
    };

    function yPos(v) {
      return plot.y + plot.h - (clamp(v / yMax, 0, 1)) * plot.h;
    }

    /* 网格 + 边框 */
    ctx.save();
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 0; i < yVals.length; i++) {
      var gy = Math.round(yPos(yVals[i])) + 0.5;
      ctx.moveTo(plot.x, gy);
      ctx.lineTo(plot.x + plot.w, gy);
    }
    ctx.stroke();
    ctx.strokeStyle = theme.border;
    ctx.strokeRect(plot.x + 0.5, plot.y + 0.5, Math.max(1, plot.w - 1), Math.max(1, plot.h - 1));
    ctx.restore();

    /* y 轴刻度 */
    ctx.save();
    ctx.font = font(10, '400');
    ctx.fillStyle = theme.muted;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (i = 0; i < yVals.length; i++) {
      ctx.fillText(fmtTick(yVals[i]), plot.x - 8, yPos(yVals[i]));
    }
    if (yLabelText) {
      ctx.save();
      ctx.translate(11, plot.y + plot.h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(fitText(ctx, yLabelText, plot.h), 0, 0);
      ctx.restore();
    }
    ctx.restore();

    /* 柱体 */
    var n = cats.length;
    var slot = plot.w / n;
    var barW = Math.max(2, Math.min(slot * 0.62, 46));
    var baseline = plot.y + plot.h;
    for (i = 0; i < n; i++) {
      var cat = cats[i];
      var cxc = plot.x + slot * i + slot / 2;
      var bx = cxc - barW / 2;
      var bhReal = plot.h * clamp(cat.value / yMax, 0, 1);
      var bh = bhReal > 0.5 ? Math.max(2, bhReal) : 0;
      var by = baseline - bh;

      if (bh > 0) {
        var g = ctx.createLinearGradient(0, by, 0, baseline);
        g.addColorStop(0, cat.color);
        g.addColorStop(1, toRgba(cat.color, 0.3));
        roundRectTop(ctx, bx, by, barW, bh, Math.min(4, barW / 2));
        ctx.fillStyle = g;
        ctx.fill();
      } else {
        /* 0 值兜底：细小暗色基座 */
        roundRectTop(ctx, bx, baseline - 2, barW, 2, 1);
        ctx.fillStyle = toRgba(theme.dim, 0.45);
        ctx.fill();
      }

      if (showValues && barW >= 14) {
        ctx.font = font(10, '700');
        ctx.fillStyle = theme.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(fitText(ctx, cat.display || fmtCompact(cat.value), slot - 2), cxc, by - 3);
      }

      ctx.font = font(10, '400');
      ctx.fillStyle = theme.muted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(fitText(ctx, cat.label, slot - 2), cxc, baseline + 5);
    }
  }

  /* ==========================================================================
   * 十、文本块
   * ======================================================================== */

  function renderText(canvas, opts) {
    var o = opts || {};
    var s = setupCanvas(canvas, o);
    if (!s) return;
    var ctx = s.ctx, w = s.w, h = s.h;
    paintBg(ctx, w, h, o);

    var linesIn = Array.isArray(o.lines) ? o.lines : [];
    var rows = [];
    var i, j;
    for (i = 0; i < linesIn.length; i++) {
      var ln = linesIn[i];
      if (ln === undefined || ln === null) continue;
      var obj = typeof ln === 'object' ? ln : { text: ln };
      var text = obj.text === undefined || obj.text === null ? '' : String(obj.text);
      var size = isNum(obj.size) && obj.size > 0 ? obj.size : 14;
      var color = obj.color || theme.text;
      var weight = obj.weight === undefined || obj.weight === null ? '400' : String(obj.weight);
      var align = obj.align || 'left';
      var parts = text.split('\n');
      for (j = 0; j < parts.length; j++) {
        rows.push({ text: parts[j], size: size, color: color, weight: weight, align: align });
      }
    }
    if (rows.length === 0) return;

    var padding = isNum(o.padding) ? Math.max(0, o.padding) : 12;
    var total = 0;
    for (i = 0; i < rows.length; i++) total += rows[i].size * 1.45;
    var availH = Math.max(1, h - padding * 2);
    /* 内容超高时等比缩小字号，保证全部可见 */
    var scale = total > availH ? Math.max(0.55, availH / total) : 1;

    var y = padding;
    var maxW = Math.max(10, w - padding * 2);
    for (i = 0; i < rows.length; i++) {
      var r = rows[i];
      var fsize = Math.max(6, r.size * scale);
      var lh = fsize * 1.45;
      var align = r.align === 'center' ? 'center' : (r.align === 'right' ? 'right' : 'left');
      var x = align === 'center' ? w / 2 : (align === 'right' ? w - padding : padding);
      ctx.save();
      ctx.font = font(fsize, r.weight);
      ctx.fillStyle = r.color;
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';
      ctx.fillText(fitText(ctx, r.text, maxW), x, y + lh / 2);
      ctx.restore();
      y += lh;
    }
  }

  /* ==========================================================================
   * 十一、注册表 / 自动重绘
   * ======================================================================== */

  var registry = []; /* [{ canvas, fn, opts }] —— 顺序即重绘顺序 */
  var resizeTimer = null;

  function register(canvas, fn, opts) {
    for (var i = 0; i < registry.length; i++) {
      if (registry[i].canvas === canvas) {
        registry[i].fn = fn;
        registry[i].opts = opts;
        return;
      }
    }
    registry.push({ canvas: canvas, fn: fn, opts: opts });
  }

  /* 重绘全部已注册 canvas（按注册顺序；单个失败不影响其他） */
  function redrawAll() {
    for (var i = registry.length - 1; i >= 0; i--) {
      var e = registry[i];
      if (e.canvas && e.canvas.isConnected === false) registry.splice(i, 1);
    }
    for (var j = 0; j < registry.length; j++) {
      var entry = registry[j];
      try {
        entry.fn(entry.canvas, entry.opts);
      } catch (err) {
        /* 静默跳过：单个图表异常不影响其余图表 */
      }
    }
  }

  /* 取消注册并清空画布 */
  function clearCanvas(canvas) {
    if (!canvas) return false;
    var removed = false;
    for (var i = registry.length - 1; i >= 0; i--) {
      if (registry[i].canvas === canvas) {
        registry.splice(i, 1);
        removed = true;
      }
    }
    try {
      var ctx = canvas.getContext ? canvas.getContext('2d') : null;
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width || 0, canvas.height || 0);
      }
    } catch (e) {
      /* 忽略：仅尽量清空 */
    }
    return removed;
  }

  /* 公开函数包装：先登记再绘制 */
  function wrap(renderer) {
    return function (canvas, opts) {
      if (!isCanvasLike(canvas)) return;
      var o = opts || {};
      register(canvas, renderer, o);
      renderer(canvas, o);
    };
  }

  /* 窗口缩放：防抖 150ms 后重绘全部 */
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('resize', function () {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        resizeTimer = null;
        redrawAll();
      }, 150);
    });
  }

  /* ==========================================================================
   * 十二、示例（开发自检）
   * ======================================================================== */

  /* 稳定的伪随机（避免每次刷新形状变化太大） */
  function makeRand(seed) {
    var s = seed || 12345;
    return function () {
      s = (s * 1103515245 + 12345) % 2147483648;
      return s / 2147483648;
    };
  }

  function demo(container) {
    var root = container;
    if (typeof root === 'string') {
      root = (typeof document !== 'undefined')
        ? (document.querySelector(root) || document.getElementById(root))
        : null;
    }
    if (!root || typeof root.appendChild !== 'function') return null;
    if (typeof document === 'undefined') return null;

    root.innerHTML = '';
    var canvases = [];
    var rand = makeRand(97531);

    /* 假数据：雷达图 */
    var radarAxes = [
      { label: '图形渲染', value: 8420, max: 10000, display: '8420 分' },
      { label: '计算性能', value: 7310, max: 10000, display: '7310 分' },
      { label: '显存带宽', value: 6150, max: 10000, display: '6150 分' },
      { label: '着色器编译', value: 9280, max: 10000, display: '9280 分' },
      { label: '三角形吞吐', value: 5480, max: 10000, display: '5480 分' },
      { label: '填充率', value: 7020, max: 10000, display: '7020 分' },
      { label: '长时间稳定性', value: 8640, max: 10000, display: '8640 分' }
    ];

    /* 假数据：折线图 */
    var fps = [], fpsLow = [];
    for (var ti = 0; ti <= 60; ti++) {
      var base = 138 + Math.sin(ti / 5) * 12 + (rand() - 0.5) * 6;
      fps.push([ti, Math.round(base * 10) / 10]);
      fpsLow.push([ti, Math.round((base - 34 - rand() * 8) * 10) / 10]);
    }

    /* 假数据：横向条形图 */
    var hbarItems = [
      { label: 'RTX 5080', value: 18640, max: 20000, display: '18640', sub: '当前设备' },
      { label: 'RTX 4080 Super', value: 16120, max: 20000, display: '16120', sub: '+15.6% 差距' },
      { label: 'RX 7900 XTX', value: 15480, max: 20000, display: '15480' },
      { label: 'RTX 3090', value: 11930, max: 20000, display: '11930' },
      { label: 'Arc B580', value: 8240, max: 20000, display: '8240' }
    ];

    /* 假数据：柱状图 */
    var barCats = [
      { label: '光栅化', value: 8420, display: '8420' },
      { label: '光追', value: 5180, display: '5180' },
      { label: '计算', value: 7310, display: '7310' },
      { label: '显存', value: 6150, display: '6150' },
      { label: 'AI 推理', value: 9640, display: '9640' }
    ];

    /* 假数据：迷你趋势图（几千个点） */
    var spark = [];
    for (var si = 0; si < 3000; si++) {
      var sv = 60 + Math.sin(si / 90) * 8 + (rand() - 0.5) * 10;
      if (si % 431 === 0) sv = 18;           /* 偶发掉帧尖峰 */
      spark.push(Math.max(1, Math.round(sv * 10) / 10));
    }

    var defs = [
      {
        title: '雷达图 radar · 分项能力',
        fn: 'radar',
        opts: {
          axes: radarAxes, levels: 4, ringLabels: true, showValues: true,
          width: 640, height: 220
        }
      },
      {
        title: '折线图 lineChart · 帧率随时间变化',
        fn: 'lineChart',
        opts: {
          series: [
            { label: '平均帧率', color: theme.cyan, points: fps, fill: true, width: 2 },
            { label: '1% 低帧', color: theme.magenta, points: fpsLow, dashed: true, width: 1.6 }
          ],
          xLabel: '时间 (秒)', yLabel: '帧率 (FPS)',
          annotations: [{ x: 30, label: '压力测试开始', color: theme.amber }],
          bands: [
            { from: 120, to: 1000, color: 'rgba(163,230,53,0.07)' },
            { from: 60, to: 120, color: 'rgba(251,191,36,0.07)' },
            { from: 0, to: 60, color: 'rgba(248,113,113,0.08)' }
          ],
          width: 640, height: 220
        }
      },
      {
        title: '横向条形 hbar · 同级显卡对比',
        fn: 'hbar',
        opts: { items: hbarItems, rowHeight: 38, gap: 8, width: 640, height: 220 }
      },
      {
        title: '仪表盘 gauge · 综合得分',
        fn: 'gauge',
        opts: {
          value: 8420, min: 0, max: 10000, label: '综合得分', sublabel: '超越 92% 的同类设备',
          segments: [
            { from: 0, to: 4000, color: theme.red },
            { from: 4000, to: 6500, color: theme.amber },
            { from: 6500, to: 8500, color: theme.lime },
            { from: 8500, to: 10000, color: theme.cyan }
          ],
          ticks: 10, width: 640, height: 220
        }
      },
      {
        title: '环形图 donut · 显存占用',
        fn: 'donut',
        opts: {
          value: 5.2, max: 8, thickness: 18, color: theme.violet,
          label: '显存占用', sublabel: '5.2 GB / 8 GB', width: 640, height: 220
        }
      },
      {
        title: '趋势图 sparkline · 实时帧率（3000 点降采样）',
        fn: 'sparkline',
        opts: { values: spark, color: theme.cyan, fill: true, marker: true, width: 640, height: 220 }
      },
      {
        title: '柱状图 bars · 各测试项得分',
        fn: 'bars',
        opts: { categories: barCats, yLabel: '得分', showValues: true, width: 640, height: 220 }
      },
      {
        title: '文本 text · 说明',
        fn: 'text',
        opts: {
          lines: [
            { text: 'WebGPU 跑分报告', size: 18, color: theme.text, weight: '700' },
            { text: '设备：Apple M3 Pro · 适配器：Apple Metal', size: 12, color: theme.muted },
            { text: '本次测试持续 60 秒，共采集 3600 帧。', size: 12, color: theme.muted },
            { text: '提示：分数受驱动版本与散热状态影响，仅供横向参考。', size: 11, color: theme.dim }
          ],
          padding: 14, width: 640, height: 220
        }
      }
    ];

    for (var d = 0; d < defs.length; d++) {
      var def = defs[d];
      var card = document.createElement('div');
      card.setAttribute('style',
        'background:' + theme.panel + ';border:1px solid ' + theme.border +
        ';border-radius:10px;padding:10px 12px;margin:0 0 14px 0;box-sizing:border-box;font-family:' + FONT_STACK);

      var titleEl = document.createElement('div');
      titleEl.setAttribute('style',
        'color:' + theme.muted + ';font-size:12px;font-weight:600;letter-spacing:0.4px;margin:0 0 6px 0');
      titleEl.textContent = def.title;

      var cv = document.createElement('canvas');
      cv.setAttribute('style', 'width:100%;height:220px;display:block');

      card.appendChild(titleEl);
      card.appendChild(cv);
      root.appendChild(card);
      canvases.push(cv);

      var pub = api[def.fn];
      if (typeof pub === 'function') pub(cv, def.opts);
    }
    return canvases;
  }

  /* ==========================================================================
   * 十三、公开 API
   * ======================================================================== */

  var api = {
    version: version,
    theme: theme,
    radar: wrap(renderRadar),
    lineChart: wrap(renderLineChart),
    hbar: wrap(renderHBar),
    gauge: wrap(renderGauge),
    donut: wrap(renderDonut),
    sparkline: wrap(renderSparkline),
    bars: wrap(renderBars),
    text: wrap(renderText),
    demo: demo,
    clear: clearCanvas,
    redrawAll: redrawAll
  };

  return api;
})();

window.NovaCharts = NovaCharts;
