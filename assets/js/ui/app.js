/* ============================================================================
 * NovaMark · 应用主控（视图 / 流程 / 历史 / 分享）
 * ==========================================================================*/
(function (global) {
  'use strict';

  var Nova = global.Nova = global.Nova || {};
  var U = Nova.util;
  var el = U.el, $ = U.$, fmt = U.fmt;

  var app = {
    view: 'overview',
    deviceInfo: null,
    gpuMatch: null,
    ctx: null,
    running: false,
    aborted: false,
    plan: [],
    results: null,
    reportData: null,
    history: [],
    refresh: null,
    options: {
      preset: 'standard',
      backend: 'auto',
      resolution: '1280x720',
      scenePreset: 'medium'
    },
    _stageCanvas: null,
    _sparkData: [],
    _hudTimer: null
  };

  var RESOLUTIONS = {
    '1280x720': { width: 1280, height: 720, label: '1280 × 720（推荐，跨设备可比）' },
    '1600x900': { width: 1600, height: 900, label: '1600 × 900' },
    '1920x1080': { width: 1920, height: 1080, label: '1920 × 1080（高画质压力）' },
    '2560x1440': { width: 2560, height: 1440, label: '2560 × 1440（极限，慎用）' }
  };

  /* ============================== 主题 ==============================
   * 默认浅色。图表库有自己的调色板，切主题时要同步覆盖并重绘，
   * 否则会出现「深色页面 + 深色坐标轴文字」这种看不清的组合。 */
  var CHART_THEMES = {
    light: {
      bg: 'transparent', panel: '#ffffff', border: '#d9e2ef', grid: '#e4ebf5',
      text: '#0f1a2e', muted: '#5f6f8c', dim: '#8b9ab5',
      cyan: '#0e7490', blue: '#1d4ed8', violet: '#6d28d9', magenta: '#be185d',
      lime: '#4d7c0f', amber: '#b45309', orange: '#c2410c', red: '#b91c1c',
      series: ['#0e7490', '#be185d', '#4d7c0f', '#b45309', '#6d28d9', '#1d4ed8', '#c2410c', '#b91c1c']
    },
    dark: {
      bg: 'transparent', panel: '#111a2e', border: '#1e2b45', grid: '#1b2740',
      text: '#e6edf7', muted: '#8fa3c4', dim: '#5b6b8a',
      cyan: '#22d3ee', blue: '#3b82f6', violet: '#8b5cf6', magenta: '#f472b6',
      lime: '#a3e635', amber: '#fbbf24', orange: '#fb923c', red: '#f87171',
      series: ['#22d3ee', '#f472b6', '#a3e635', '#fbbf24', '#8b5cf6', '#3b82f6', '#fb923c', '#f87171']
    }
  };

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function applyTheme(name, opts) {
    opts = opts || {};
    var theme = name === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    try { U.storage.set('theme', theme); } catch (e) { /* noop */ }

    var btn = $('#theme-toggle');
    if (btn) {
      btn.textContent = theme === 'dark' ? '☀️' : '🌙';
      btn.title = theme === 'dark' ? '切换到浅色主题' : '切换到深色主题';
    }

    if (global.NovaCharts) {
      var pal = CHART_THEMES[theme];
      for (var k in pal) {
        if (!Object.prototype.hasOwnProperty.call(pal, k)) continue;
        NovaCharts.theme[k] = pal[k];
      }
      // 图表的背景色是建立时读取的，重绘时必须让它们跟着换
      if (opts.redraw !== false) {
        try { NovaCharts.redrawAll(); } catch (e) { /* noop */ }
      }
    }
    return theme;
  }

  function toggleTheme() {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    toast('已切换到' + (next === 'dark' ? '深色' : '浅色') + '主题', 'info', 1800);
  }

  /* ============================== 提示与弹窗 ============================== */

  function toast(msg, kind, ms) {
    var host = $('#toast-host');
    if (!host) return;
    var t = el('div', { class: 'toast ' + (kind || ''), text: msg });
    host.appendChild(t);
    setTimeout(function () {
      t.style.transition = 'opacity .3s, transform .3s';
      t.style.opacity = '0';
      t.style.transform = 'translateX(18px)';
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 320);
    }, ms || 3600);
  }

  /* ============================== 导航 ============================== */

  function setView(name) {
    var changed = app.view !== name;
    app.view = name;
    U.$$('.view').forEach(function (v) { v.classList.add('hidden'); });
    var target = $('#view-' + name);
    if (target) target.classList.remove('hidden');
    U.$$('.nav button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.view === name);
    });
    if (name === 'overview') renderOverview();
    if (name === 'report') renderReportView();
    if (name === 'history') renderHistory();
    if (name === 'about') renderAbout();
    // 只有在「真的切换了视图」时才回到页首；同一视图内的局部刷新不该动滚动位置
    if (changed) window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* ============================== 概览页 ============================== */

  function renderOverview() {
    var host = $('#view-overview');
    U.clear(host);
    var d = app.deviceInfo;
    var gm = app.gpuMatch;
    var gpu = gm && gm.gpu;
    var backendLabel = app.options.backend === 'webgl2' ? 'WebGL2（手动指定）'
      : (d && d.flags.webgpuAvailable ? 'WebGPU（推荐）' : 'WebGL2（WebGPU 不可用）');

    /* ---- 标题 ---- */
    host.appendChild(el('div', { class: 'row between wrap mb16', style: { gap: '16px' } }, [
      el('div', {}, [
        el('h1', { text: '显卡性能评测 · NovaMark-Lite' }),
        el('div', { class: 'muted', text: '全部在浏览器本地运行，不上传任何数据。只跑三项场景类测试（球体环 / 毒蘑菇 / 四段综合场景），完成后生成完整报告与可分享成绩单。' })
      ]),
      el('div', { class: 'row', style: { gap: '8px' } }, [
        el('span', { class: 'badge info lg', id: 'backend-badge', text: '后端：' + backendLabel }),
        d && d.flags.hardwareAccelerated ? el('span', { class: 'badge ok lg', text: '硬件加速正常' })
          : el('span', { class: 'badge bad lg', text: '软件渲染' })
      ])
    ]));

    /* ---- 警告 ---- */
    if (d && d.warnings && d.warnings.length) {
      var warns = d.warnings.map(function (w) {
        var bad = /软件光栅化|fallback|无法/.test(w);
        return el('div', { class: 'alert ' + (bad ? 'bad' : 'warn') + ' mb8' }, [
          el('span', { text: bad ? '⛔' : '⚠️' }),
          el('span', { text: w })
        ]);
      });
      host.appendChild(el('div', { class: 'mb16' }, warns));
    }

    /* ---- GPU 卡片 ---- */
    var gpuKv = [
      ['识别型号', gpu ? gpu.name : (gm ? gm.displayName : '未知')],
      ['厂商 / 类型', gpu ? gpu.vendor + ' · ' + typeLabel(gpu.type) : (d && d.flags.vendorHint) || '—'],
      ['识别方式', gm && gm.ok ? gm.method + '（置信度 ' + fmt.pct(gm.confidence, 0) + '）' : '未匹配到数据库型号'],
      ['WebGL 渲染器', (d && d.webgl && (d.webgl.unmaskedRenderer || d.webgl.renderer)) || '—'],
      ['WebGPU 适配器', (d && d.webgpu && d.webgpu.info)
        ? [d.webgpu.info.vendor, d.webgpu.info.architecture, d.webgpu.info.device].filter(Boolean).join(' · ') : '不可用']
    ];
    if (gpu && gpu.specs) {
      gpuKv.push(['理论 FP32 算力', gpu.specs.fp32Tflops ? fmt.num(gpu.specs.fp32Tflops, 2) + ' TFLOPS' : '—']);
      gpuKv.push(['理论显存带宽', gpu.specs.bandwidthGBs ? fmt.num(gpu.specs.bandwidthGBs, 1) + ' GB/s' : '—']);
      gpuKv.push(['理论填充率', (gpu.specs.pixelRateGps ? fmt.num(gpu.specs.pixelRateGps, 1) + ' GPixel/s' : '—') +
        ' · ' + (gpu.specs.texelRateGts ? fmt.num(gpu.specs.texelRateGts, 1) + ' GTexel/s' : '—')]);
    }

    host.appendChild(el('div', { class: 'grid c2-1 mb16' }, [
      el('div', { class: 'card' }, [
        el('div', { class: 'card-head' }, [el('div', { class: 'card-title', text: '图形处理器' })]),
        kvBlock(gpuKv)
      ]),
      el('div', { class: 'card' }, [
        el('div', { class: 'card-head' }, [el('div', { class: 'card-title', text: '系统环境' })]),
        kvBlock([
          ['浏览器', d ? d.browser.name + ' ' + d.browser.version + ' · ' + d.browser.engine : '—'],
          ['操作系统', d ? d.os.name + ' ' + d.os.version + (d.os.arch ? ' (' + d.os.arch + ')' : '') : '—'],
          ['CPU 逻辑核心', d && d.hardware.cpuCores ? d.hardware.cpuCores : '未上报'],
          ['设备档位', d && d.profile ? (d.profile.label + '（工作量 ×' + fmt.num(d.profile.workloadScale, 2) + ' · 显存预算 ' + d.profile.memoryBudgetMB + ' MB）') : '—'],
          ['屏幕 / DPR', d && d.hardware.screen ? d.hardware.screen.width + '×' + d.hardware.screen.height + ' @ ' + d.hardware.devicePixelRatio + 'x' : '—'],
          ['刷新率', app.refresh ? (app.refresh.timeout ? '未能测得（rAF 未触发，按 60Hz 估算）' : fmt.num(app.refresh.hz, 1) + ' Hz') : '测量中…'],
          ['Cross-Origin Isolated', d && d.flags.crossOriginIsolated ? '是（高精度计时）' : '否（计时精度约 100µs）']
        ])
      ])
    ]));

    /* ---- 能力徽标 ---- */
    var caps = [
      ['WebGPU', d && d.flags.webgpuAvailable],
      ['WebGL2', d && d.flags.webglAvailable],
      ['时间戳查询', d && d.flags.timerQueryWGPU],
      ['WebGL 计时扩展', d && d.flags.timerQueryWG],
      ['shader-f16', d && d.flags.shaderF16],
      ['高精度时钟', d && d.flags.crossOriginIsolated]
    ];
    host.appendChild(el('div', { class: 'card mb16' }, [
      el('div', { class: 'card-head' }, [el('div', { class: 'card-title', text: '能力探测' })]),
      el('div', { class: 'row wrap', style: { gap: '8px' } }, caps.map(function (c) {
        return el('span', { class: 'badge ' + (c[1] ? 'ok' : '') + ' lg', text: (c[1] ? '✓ ' : '✕ ') + c[0] });
      }))
    ]));

    /* ---- 配置 + 开始 ----
     * 注意：这里的每个选项都**只做局部更新**，不再整页重建。
     * 早期版本点击任意按钮都会 clear 整个视图再重建，清空的瞬间页面高度塌陷，
     * 浏览器会把滚动位置钳到 0 —— 用户每点一下就被弹回页首，体验极差。*/
    var presetSeg = buildSeg(
      Object.keys(Nova.suite.PRESETS).map(function (k) {
        return { value: k, label: Nova.suite.PRESETS[k].name, title: Nova.suite.PRESETS[k].desc };
      }),
      app.options.preset,
      function (v) { app.options.preset = v; updatePlanUI(); }
    );

    var backendSeg = buildSeg(
      [{ value: 'auto', label: '自动' }, { value: 'webgl2', label: '强制 WebGL2' }],
      app.options.backend,
      function (v) { app.options.backend = v; updateBackendBadge(); updatePlanUI(); }
    );

    var resSel = el('select', {
      class: 'btn',
      style: { paddingRight: '10px' },
      onchange: function (e) { app.options.resolution = e.target.value; }
    }, Object.keys(RESOLUTIONS).map(function (k) {
      return el('option', { value: k, selected: app.options.resolution === k, text: RESOLUTIONS[k].label });
    }));

    var sceneSeg = buildSeg(
      [{ value: 'low', label: '低' }, { value: 'medium', label: '中' }, { value: 'high', label: '高' }],
      app.options.scenePreset,
      function (v) { app.options.scenePreset = v; }
    );

    // ?force=1 允许在软件渲染 / 虚拟机环境下仍然跑一遍（成绩会被标记为不可信），
    // 便于 CI 自检和排障；正常情况下这个开关不该被用到。
    var canRun = (d && d.flags.canBenchmark) || app.options.force;
    host.appendChild(el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [
        el('div', { class: 'card-title', text: '测试配置' }),
        el('span', { class: 'badge', id: 'plan-count', text: '共 ' + planCount() + ' 项测试' })
      ]),
      el('div', { class: 'grid c2', style: { gap: '20px' } }, [
        el('div', { class: 'col' }, [
          el('div', { class: 'small muted', text: '测试预设' }), presetSeg,
          el('div', { class: 'small muted mt16', text: '渲染后端' }), backendSeg,
          el('div', { class: 'small muted mt16', text: '渲染分辨率（测试会固定用该分辨率渲染）' }), resSel
        ]),
        el('div', { class: 'col' }, [
          el('div', { class: 'small muted', text: '综合场景质量档（低 / 中 / 高，决定几何量、粒子数与阴影贴图尺寸）' }), sceneSeg,
          el('div', { class: 'small dim mt16', text:
            '三项测试都不使用垂直同步，帧率可以超过显示器刷新率，因此能测出 GPU 的真实吞吐上限。' +
            '球体环 = 单一几何 pass（约 288k 三角形 / 900 实例）；毒蘑菇 = 逐像素隐式曲面光线求交（三档递进）；' +
            '综合场景四段依次为星环（8s）→ 峡谷·黄昏（12s）→ 峡谷·云海（14s）→ 都市·风暴（16s）' +
            '（预设不同时长按比例缩放）。' +
            '测试期间请保持标签页在前台、插上电源、关闭其他占用 GPU 的程序。' })
        ])
      ]),
      el('div', { class: 'row mt24', style: { gap: '12px' } }, [
        el('button', {
          class: 'btn primary lg', disabled: !canRun,
          onclick: function () { startRun(); }
        }, ['▶ 开始测试']),
        el('button', { class: 'btn lg ghost', onclick: function () { location.reload(); } }, ['重新探测硬件']),
        !canRun ? el('span', { class: 'small', style: { color: 'var(--red)' }, text: '当前环境无法运行图形测试（缺少 WebGL/WebGPU 或处于软件渲染）' }) : null
      ])
    ]));

    /* ---- 测试清单预览 ---- */
    host.appendChild(renderPlanPreview());
  }

  /** 分段控件：点击时只切换自身的 active 类并回调，绝不重建页面 */
  function buildSeg(items, current, onPick) {
    return el('div', { class: 'seg' }, items.map(function (it) {
      return el('button', {
        class: current === it.value ? 'active' : '',
        title: it.title || '',
        dataset: { value: it.value },
        onclick: function (ev) {
          var segEl = ev.currentTarget.parentNode;
          U.$$('button', segEl).forEach(function (b) {
            b.classList.toggle('active', b.dataset.value === it.value);
          });
          onPick(it.value);
        }
      }, [it.label]);
    }));
  }

  /** 后端徽标随选项实时更新（局部） */
  function updateBackendBadge() {
    var bb = $('#backend-badge');
    if (!bb) return;
    var d = app.deviceInfo;
    bb.textContent = '后端：' + (app.options.backend === 'webgl2' ? 'WebGL2（手动指定）'
      : (d && d.flags.webgpuAvailable ? 'WebGPU（推荐）' : 'WebGL2（WebGPU 不可用）'));
  }

  /** 测试项数量与清单只重绘自己那一小块 */
  function updatePlanUI() {
    var pc = $('#plan-count');
    if (pc) pc.textContent = '共 ' + planCount() + ' 项测试';
    var pp = $('#plan-preview');
    if (pp) {
      U.clear(pp);
      pp.appendChild(renderPlanPreview());
    }
  }

  function planCount() { return buildPlan().length; }

  function renderPlanPreview() {
    var backend = app.options.backend === 'webgl2' ? 'webgl2'
      : ((app.deviceInfo && app.deviceInfo.flags.webgpuAvailable) ? 'webgpu' : 'webgl2');
    var plan = buildPlan();
    return el('div', { class: 'card mt16', id: 'plan-preview' }, [
      el('div', { class: 'card-head' }, [
        el('div', { class: 'card-title', text: '测试项目清单' }),
        el('span', { class: 'badge ' + (backend === 'webgpu' ? 'info' : 'warn'), text: backend === 'webgpu' ? 'WebGPU 后端' : 'WebGL2 后端' })
      ]),
      el('div', { class: 'grid c2', style: { gap: '8px 24px' } }, plan.map(function (t, i) {
        return el('div', { class: 'row', style: { gap: '10px', padding: '4px 0' } }, [
          el('span', { class: 'mono dim tiny', text: String(i + 1).padStart(2, '0') }),
          el('span', { class: 'grow small', text: t.name }),
          el('span', { class: 'badge', text: t.unit })
        ]);
      })),
      el('div', { class: 'small dim mt16', text:
        'Lite只保留「场景类」测试，共三项：球体环（原版最简场景）、' +
        '毒蘑菇（Volume Shader BM）、综合测试（四段场景序列），三项归入唯一的「综合场景」维度。' +
        '全部微基准（填充率 / 几何 / 纹理 / 着色器 ALU / 矩阵乘 / 带宽 / 传输 / 延迟 / 提交）仍不在本版范围内；' +
        '「完整测试」预设会额外追加一轮稳定性压力测试（独立成项，不计入总分）。' })
    ]);
  }

  /**
   * 本版的测试清单：球体环 → 毒蘑菇 → 综合测试（四段序列）。
   * 「完整测试」/「稳定性压力测试」预设会额外追加稳定性循环（不进总分）。
   */
  function buildPlan() {
    var preset = Nova.suite.presetOf(app.options.preset);
    var plan = [];
    if (preset.sceneSeconds > 0) {
      plan.push({
        id: 'ring',
        name: '球体环（原版最简场景，单一几何 pass）',
        unit: 'FPS', group: 'scene', available: true
      });
      plan.push({
        id: 'vsbm',
        name: '毒蘑菇低压力测试（Volume Shader BM，隐式曲面光线求交）',
        unit: 'FPS', group: 'scene', available: true
      });
      plan.push({
        id: 'scene',
        name: '综合测试 · 四段场景序列（星环 → 峡谷·黄昏 → 峡谷·云海 → 都市·风暴）',
        unit: 'FPS', group: 'scene', available: true
      });
    }
    if (preset.stabilityRounds > 1) {
      plan.push({ id: 'stability', name: '稳定性压力测试（' + preset.stabilityRounds + ' 轮）', unit: '%', group: 'stability', available: true });
    }
    return plan;
  }

  function kvBlock(pairs) {
    var nodes = [];
    pairs.forEach(function (p) {
      nodes.push(el('div', { text: p[0] }));
      nodes.push(el('div', { text: p[1] === null || p[1] === undefined || p[1] === '' ? '—' : String(p[1]) }));
    });
    return el('div', { class: 'kv' }, nodes);
  }

  function typeLabel(t) {
    return ({ desktop: '桌面独显', laptop: '笔记本独显', integrated: '核显', 'apple-soc': 'Apple 统一内存', 'mobile-soc': '移动 SoC', workstation: '专业卡', software: '软件渲染' })[t] || t || '—';
  }

  /* ============================== 测试执行 ============================== */

  function startRun() {
    if (app.running) return;
    app.running = true;
    app.aborted = false;
    app.results = null;
    app._sparkData = [];
    app._maxOverall = 0;
    app._lastRingValue = -1;
    app._lastRingAt = 0;

    setView('bench');
    renderBenchShell();
    updateHud({ phase: 'init', name: '正在初始化图形上下文…' });

    var res = RESOLUTIONS[app.options.resolution] || RESOLUTIONS['1280x720'];
    var prefer = app.options.backend === 'auto' ? 'auto' : app.options.backend;

    // 每次运行创建全新的 canvas，避免 WebGPU/WebGL2 上下文互斥
    var host = $('#stage-host');
    U.clear(host);
    var canvas = el('canvas');
    host.appendChild(canvas);
    app._stageCanvas = canvas;

    Nova.engine.create(canvas, {
      deviceInfo: app.deviceInfo,
      prefer: prefer,
      resolution: { width: res.width, height: res.height }
    }).then(function (ctx) {
      app.ctx = ctx;
    // 把参考库给出的理论带宽挂到上下文上，供测量校验做「设备感知」的合理性判断
    try {
      var spec = app.gpuMatch && app.gpuMatch.gpu && app.gpuMatch.gpu.specs;
      // 没有精确匹配时退回档位代表值（例如 iPhone 只上报通用名「Apple GPU」）
      var cls = app.gpuMatch && app.gpuMatch.class && app.gpuMatch.class.assumedSpecs;
      if (spec && spec.bandwidthGBs) ctx.theoreticalGBs = spec.bandwidthGBs;
      else if (cls && cls.bandwidthGBs) ctx.theoreticalGBs = cls.bandwidthGBs;
      if (spec && spec.fp32Tflops) ctx.theoreticalFp32 = spec.fp32Tflops;
      else if (cls && cls.fp32Tflops) ctx.theoreticalFp32 = cls.fp32Tflops;
    } catch (e) { /* noop */ }
      updateHud({ phase: 'init', name: '图形上下文就绪：' + ctx.backendLabel });
      var list = Nova.suite.buildList(ctx, {
        preset: app.options.preset,
        scenePreset: app.options.scenePreset
      });
      app.plan = list.map(function (e) { return { id: e.test.id, name: e.test.name, unit: e.test.unit, group: e.test.group }; });
      renderBenchList(app.plan, ctx);
      return Nova.suite.run(ctx, {
        preset: app.options.preset,
        scenePreset: app.options.scenePreset,
        gpuMatch: app.gpuMatch,
        refreshRateHz: app.refresh ? app.refresh.hz : null,
        isAborted: function () { return app.aborted; },
        onProgress: onProgress
      });
    }).then(function (bundle) {
      return finishRun(bundle);
    }).catch(function (err) {
      U.log('app', 'run failed: ' + (err && err.message));
      app.running = false;
      updateHud({ phase: 'failed', name: '测试失败：' + (err && err.message ? err.message : err) });
      toast('测试失败：' + (err && err.message ? err.message : err), 'bad', 6000);
      setView('overview');
    });
  }

  function onProgress(evt) {
    if (evt.phase === 'warmup') {
      // 全局预热：正式测试之前的稳态准备，不属于任何测试项
      updateHud({ phase: 'warmup', name: '全局预热（把 GPU 拉到稳态）', index: 0, total: app.plan.length || 1 });
      var ws = $('#bench-sub');
      if (ws) ws.textContent = '全局预热中：约 ' + ((evt.ms || 0) / 1000).toFixed(1) + ' 秒，让 GPU 时钟进入稳态后再开始计分测量';
      app._sparkData = [];
    } else if (evt.phase === 'test-start') {
      updateHud({ phase: 'running', name: evt.name, index: evt.index, total: evt.total, unit: evt.unit });
      markRow(evt.id, 'running', null);
      app._sparkData = [];
    } else if (evt.phase === 'test-progress') {
      // progress 为 null 表示这条消息不含进度（轮次结束、预热、校准），
      // 此时既不要动进度环，也不要动单项进度条
      if (evt.progress !== null && evt.progress !== undefined) {
        var p = evt.progress;
        setRowProgress(evt.id, p);
        updateHud({
          phase: 'running', name: evt.name, index: evt.index, total: evt.total, unit: evt.unit,
          overall: ((evt.index || 0) + p) / (evt.total || 1),
          sub: evt.sub
        });
      } else {
        updateHud({ phase: 'running', name: evt.name, index: evt.index, total: evt.total, unit: evt.unit, sub: evt.sub });
      }
      if (evt.sub) {
        var v = evt.sub.current !== undefined ? evt.sub.current : evt.sub.fps;
        if (v !== undefined && isFinite(v)) {
          app._sparkData.push(v);
          if (app._sparkData.length > 4000) app._sparkData.shift();
          drawSpark();
        }
      }
    } else if (evt.phase === 'test-done') {
      var r = evt.result;
      markRow(evt.id, r.status, r);
    } else if (evt.phase === 'scoring') {
      updateHud({ phase: 'scoring', name: '正在计算得分与生成报告…', overall: 1 });
    }
  }

  function finishRun(bundle) {
    var res = RESOLUTIONS[app.options.resolution] || RESOLUTIONS['1280x720'];
    var preset = Nova.suite.presetOf(app.options.preset);
    var timing = (app.deviceInfo.flags.timerQueryWGPU)
      ? 'WebGPU 时间戳可用（本版仍以墙钟 + GPU 同步为准，含极少量驱动开销）'
      : (app.deviceInfo.flags.timerQueryWG ? 'WebGL2 计时扩展可用（本版以墙钟 + GPU 同步为准）' : '墙钟计时 + GPU 同步（无 GPU 计时扩展）');

    var data = {
      id: Nova.suite.makeRunId(),
      hash: null,
      timestamp: Date.now(),
      version: 'NovaMark-Lite ' + Nova.VERSION,
      device: app.deviceInfo,
      gpu: {
        match: bundle.gpuMatch,
        displayName: bundle.gpuMatch ? bundle.gpuMatch.displayName : '未知 GPU'
      },
      results: bundle,
      config: {
        preset: preset.key,
        presetName: preset.name,
        scenePreset: app.options.scenePreset,
        backendLabel: app.ctx ? app.ctx.backendLabel : '—',
        backend: app.ctx ? app.ctx.kind : '—',
        resolution: res.width + ' × ' + res.height,
        renderWidth: res.width, renderHeight: res.height,
        timing: timing,
        refreshRateHz: app.refresh ? app.refresh.hz : null
      }
    };

    return Nova.suite.fingerprint(app.deviceInfo, bundle.results, data.config).then(function (hash) {
      data.hash = hash;
      app.reportData = data;
      saveHistory(data);
      app.running = false;
      updateHud({ phase: 'done', name: '测试完成' });
      toast('测试完成，综合得分 ' + (bundle.score.total === null ? '—' : Math.round(bundle.score.total)) + ' 分', 'ok', 5000);
      setView('report');
    });
  }

  function abortRun() {
    if (!app.running) return;
    app.aborted = true;
    if (app.ctx && app.ctx.kind === 'webgpu') app.aborted = true;
    toast('正在中止测试…', 'info');
  }

  /* ------------------------------ 测试台 UI ------------------------------ */

  /**
   * HUD 计时器复位。
   * 修复：不刷新连跑第二次时，renderBenchShell() 已建过 DOM 而提前返回，导致
   *       app._hudStart 仍是上一次的起点、旧 interval 继续跑，画面上的秒表就从上
   *       次的值接着走而不归零。抽成函数让「重建」与「复用」两条路径都复位。
   */
  function resetHudTimer() {
    app._hudStart = U.now();
    var e0 = $('#hud-elapsed');
    if (e0) e0.textContent = '0.0 s';
    if (app._hudTimer) clearInterval(app._hudTimer);
    app._hudTimer = setInterval(function () {
      var el = $('#hud-elapsed');
      if (el && app.running) el.textContent = ((U.now() - app._hudStart) / 1000).toFixed(1) + ' s';
    }, 100);
  }

  function renderBenchShell() {
    var host = $('#view-bench');
    if (host.dataset.built === '1') {
      $('#bench-title').textContent = '正在测试';
      resetHudTimer();          // 不刷新跑第二次：计时器必须归零
      return;
    }
    U.clear(host);
    host.dataset.built = '1';

    host.appendChild(el('div', { class: 'row between wrap mb16', style: { gap: '12px' } }, [
      el('div', {}, [
        el('h1', { id: 'bench-title', text: '正在测试' }),
        el('div', { class: 'muted small', id: 'bench-sub', text: '测试期间请保持本标签页在前台' })
      ]),
      el('button', { class: 'btn danger', onclick: abortRun }, ['■ 中止测试'])
    ]));

    host.appendChild(el('div', { class: 'grid c2-1 mb16' }, [
      el('div', { class: 'stage-wrap', id: 'stage-wrap' }, [
        el('div', { id: 'stage-host', style: { position: 'absolute', inset: '0' } }),
        el('div', { class: 'stage-hud' }, [
          el('div', { class: 'hud-top' }, [
            el('div', { class: 'hud-box', id: 'hud-current', html: '准备中…' }),
            el('div', { class: 'hud-box', id: 'hud-metric', html: '—' })
          ]),
          el('div', { class: 'hud-bottom' }, [
            el('div', { class: 'hud-box', id: 'hud-extra', html: '—' }),
            el('div', { class: 'hud-box', id: 'hud-elapsed', html: '0.0 s' })
          ])
        ])
      ]),
      el('div', { class: 'card' }, [
        el('div', { class: 'card-head' }, [el('div', { class: 'card-title', text: '总体进度' })]),
        el('div', { class: 'row', style: { gap: '16px', alignItems: 'center' } }, [
          el('div', { class: 'ring-wrap' }, [
            el('canvas', { id: 'ring-canvas' }),
            el('div', { class: 'ring-center' }, [
              el('div', {}, [
                el('div', { class: 'v', id: 'ring-value', text: '0%' }),
                el('div', { class: 'l', text: 'PROGRESS' })
              ])
            ])
          ]),
          el('div', { class: 'grow' }, [
            el('div', { class: 'small muted', text: '当前指标' }),
            el('div', { class: 'mono', id: 'ring-metric', style: { fontSize: '18px', marginTop: '4px' }, text: '—' }),
            el('div', { class: 'small dim mt8', id: 'ring-test', text: '—' })
          ])
        ]),
        el('div', { class: 'mt16' }, [
          el('div', { class: 'small muted mb8', text: '实时数值曲线' }),
          el('canvas', { class: 'spark-canvas', id: 'spark-canvas' })
        ])
      ])
    ]));

    host.appendChild(el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [
        el('div', { class: 'card-title', text: '测试项目' }),
        el('span', { class: 'badge', id: 'bench-count', text: '0 / 0' })
      ]),
      el('div', { class: 'test-list', id: 'test-list' })
    ]));

    resetHudTimer();
  }

  function renderBenchList(plan, ctx) {
    var host = $('#test-list');
    U.clear(host);
    if (!plan.length) return;
    plan.forEach(function (t, i) {
      host.appendChild(el('div', { class: 'test-row', id: 'row-' + t.id }, [
        el('span', { class: 'idx', text: String(i + 1).padStart(2, '0') }),
        el('div', { class: 'name' }, [
          el('span', { text: t.name }),
          el('em', { text: groupLabel(t.group) + ' · ' + t.unit })
        ]),
        el('div', { class: 'meter' }, [el('i', { id: 'meter-' + t.id })]),
        el('div', { class: 'val', id: 'val-' + t.id, text: '等待' })
      ]));
    });
    var c = $('#bench-count');
    if (c) c.textContent = '0 / ' + plan.length;
  }

  function groupLabel(g) {
    return ({ graphics: '图形渲染', compute: '通用计算', memory: '显存与传输', latency: '交互延迟', scene: '综合场景', stability: '稳定性' })[g] || g || '';
  }

  function markRow(id, status, result) {
    var row = $('#row-' + id);
    if (!row) return;
    row.classList.remove('running', 'done', 'fail', 'skip');
    var val = $('#val-' + id);
    var meter = $('#meter-' + id);
    if (status === 'done') {
      row.classList.add('done');
      if (val && result) val.textContent = metricShort(result);
      if (meter) meter.style.width = '100%';
    } else if (status === 'running') {
      row.classList.add('running');
      if (val) val.textContent = '测量中…';
    } else if (status === 'skipped') {
      row.classList.add('skip');
      if (val) val.textContent = '已跳过';
      if (meter) meter.style.width = '100%';
    } else {
      row.classList.add('fail');
      if (val) val.textContent = '失败';
      if (meter) meter.style.width = '100%';
    }
  }

  function setRowProgress(id, p) {
    var meter = $('#meter-' + id);
    if (meter) meter.style.width = Math.round(Math.min(1, p) * 100) + '%';
  }

  function metricShort(r) {
    if (r.metric === null || r.metric === undefined || !isFinite(r.metric)) return '—';
    var v = r.metric;
    var d = Math.abs(v) >= 100 ? 0 : (Math.abs(v) >= 10 ? 1 : 2);
    return fmt.num(v, d) + ' ' + (r.unit || '');
  }

  function updateHud(info) {
    var cur = $('#hud-current');
    if (cur) {
      cur.innerHTML = '';
      cur.appendChild(document.createTextNode('测试项 '));
      var b = document.createElement('b');
      b.textContent = (info.index !== undefined ? (info.index + 1) + '/' + info.total + ' ' : '') + (info.name || '');
      cur.appendChild(b);
    }
    var extra = $('#hud-extra');
    if (extra && info.unit) extra.innerHTML = '单位 <b>' + info.unit + '</b>';

    // 进度只许前进：任何消息源把进度往回带都会被这里挡住。
    // （历史 bug：round-done 事件不带进度，被当成 0，导致每轮结束时进度条闪回起点）
    if (info.overall !== undefined && info.overall !== null) {
      var raw = Math.max(0, Math.min(1, info.overall));
      app._maxOverall = Math.max(app._maxOverall || 0, raw);
      var v = Math.round(app._maxOverall * 100);
      var rv = $('#ring-value');
      if (rv) rv.textContent = v + '%';
      drawRing(app._maxOverall, v);
    }
    if (info.name) {
      var rt = $('#ring-test');
      if (rt) rt.textContent = info.name;
    }
    if (info.sub) {
      var rm = $('#ring-metric');
      var val = info.sub.current !== undefined ? info.sub.current : info.sub.fps;
      if (rm && val !== undefined && isFinite(val)) rm.textContent = fmt.si(val, 2);
    }
    var bc = $('#bench-count');
    if (bc && info.index !== undefined) bc.textContent = (info.index + 1) + ' / ' + info.total;
    var sub = $('#bench-sub');
    if (sub && info.phase === 'running') sub.textContent = '测试期间请保持本标签页在前台（切到后台会导致结果无效）';
  }

  function drawRing(p, pct) {
    var cv = $('#ring-canvas');
    if (!cv || !NovaCharts) return;
    var v = pct === undefined ? Math.round(Math.max(0, Math.min(1, p)) * 100) : pct;
    // 环形进度按 ~12Hz 重绘：读数照常每帧更新，但避免每秒几十次画布重绘造成的闪烁
    var now = U.now();
    if (v === app._lastRingValue) return;
    if (app._lastRingAt && now - app._lastRingAt < 80 && v < 100) return;
    app._lastRingAt = now;
    app._lastRingValue = v;
    NovaCharts.gauge(cv, { value: v, max: 100, valueText: '', thickness: 12 });
  }

  function drawSpark() {
    var cv = $('#spark-canvas');
    if (!cv || !NovaCharts) return;
    NovaCharts.sparkline(cv, { values: app._sparkData, color: NovaCharts.theme.cyan, fill: true, marker: true });
  }

  /* ============================== 报告页 ============================== */

  function renderReportView() {
    var host = $('#view-report');
    U.clear(host);
    var data = app.reportData;
    if (!data) {
      host.appendChild(el('div', { class: 'card' }, [
        el('div', { class: 'card-title mb8', text: '还没有成绩' }),
        el('div', { class: 'muted', text: '先运行一次测试，或者从历史记录里选择一次已有成绩。' }),
        el('div', { class: 'mt16' }, [
          el('button', { class: 'btn primary', onclick: function () { setView('overview'); } }, ['去测试'])
        ])
      ]));
      return;
    }
    host.appendChild(el('div', { class: 'row between wrap mb16', style: { gap: '12px' } }, [
      el('div', {}, [
        el('h1', { text: '性能评测报告' }),
        el('div', { class: 'muted small', text: '成绩编号 ' + (data.id || '—') + ' · ' + fmt.date(data.timestamp) })
      ])
    ]));
    host.appendChild(el('div', { class: 'mb16' }, [
      Nova.report.buildExportBar(data, function (msg, kind) { toast(msg, kind); })
    ]));

    var prev = previousRun(data.timestamp);
    if (prev && prev.total !== null && data.results.score.total !== null) {
      var diff = data.results.score.total - prev.total;
      host.appendChild(el('div', { class: 'alert ' + (diff >= 0 ? 'ok' : 'warn') + ' mb16' }, [
        el('span', { text: diff >= 0 ? '📈' : '📉' }),
        el('span', { text: '与上一次测试（' + fmt.date(prev.timestamp) + '，' + Math.round(prev.total) + ' 分）相比：' +
          (diff >= 0 ? '+' : '') + fmt.num(diff, 0) + ' 分（' + fmt.num(prev.total ? diff / prev.total * 100 : 0, 1) + '%）' })
      ]));
    }

    var container = el('div', { id: 'report-body' });
    host.appendChild(container);
    Nova.report.build(container, data);
  }

  /* ============================== 历史页 ============================== */

  function loadHistory() {
    app.history = U.storage.get('history', []);
    if (!Array.isArray(app.history)) app.history = [];
  }

  function saveHistory(data) {
    var score = data.results.score || {};
    var scene = Nova.report.findResult(data, 'scene');
    var entry = {
      id: data.id, hash: data.hash, timestamp: data.timestamp,
      total: score.total, grade: score.grade,
      backend: data.config.backendLabel, resolution: data.config.resolution,
      preset: data.config.presetName,
      gpu: data.gpu.match && data.gpu.match.gpu ? data.gpu.match.gpu.name : data.gpu.displayName,
      browser: data.device.browser.name + ' ' + data.device.browser.version,
      dims: (score.dimensions || []).map(function (d) { return { id: d.id, name: d.name, score: d.score }; }),
      sceneFps: scene && scene.meta ? scene.meta.fpsAvg : null,
      scene1Low: scene && scene.meta ? scene.meta.fps1Low : null,
      stability: data.results.stability ? data.results.stability.stability : null,
      config: data.config
    };
    app.history.unshift(entry);
    if (app.history.length > 20) app.history = app.history.slice(0, 20);
    U.storage.set('history', app.history);

    // 保存完整成绩（截断长数组，避免超出 localStorage 配额）
    try {
      var slim = JSON.parse(JSON.stringify(data, function (k, v) {
        if (k === 'frameTimes' && Array.isArray(v) && v.length > 240) {
          var out = [], step = v.length / 240;
          for (var i = 0; i < 240; i++) out.push(v[Math.floor(i * step)]);
          return out;
        }
        if (k === 'samples' && Array.isArray(v) && v.length > 120) return v.slice(0, 120);
        return v;
      }));
      if (!U.storage.set('run:' + data.id, slim)) {
        // 配额不足时清理最旧的完整成绩
        for (var j = app.history.length - 1; j >= 5; j--) U.storage.remove('run:' + app.history[j].id);
        U.storage.set('run:' + data.id, slim);
      }
    } catch (e) {
      U.log('app', '保存完整成绩失败: ' + e.message);
    }
  }

  function previousRun(ts) {
    for (var i = 0; i < app.history.length; i++) {
      if (app.history[i].timestamp < ts) return app.history[i];
    }
    return null;
  }

  function renderHistory() {
    var host = $('#view-history');
    U.clear(host);
    host.appendChild(el('div', { class: 'row between wrap mb16', style: { gap: '12px' } }, [
      el('div', {}, [
        el('h1', { text: '历史成绩' }),
        el('div', { class: 'muted small', text: '保存在本机浏览器（localStorage），最多保留 20 条，不会上传到任何服务器。' +
          '「稳定性」列只在「完整测试 / 稳定性压力测试」预设下才有数据。' })
      ]),
      el('div', { class: 'row', style: { gap: '8px' } }, [
        el('button', { class: 'btn ghost sm', onclick: exportHistory }, ['导出全部 JSON']),
        el('button', { class: 'btn danger sm', onclick: function () {
          if (confirm('确定清空全部历史成绩？')) { app.history = []; U.storage.set('history', []); renderHistory(); toast('已清空历史', 'ok'); }
        } }, ['清空历史'])
      ])
    ]));

    if (!app.history.length) {
      host.appendChild(el('div', { class: 'card' }, [
        el('div', { class: 'muted', text: '还没有历史成绩。' })
      ]));
      return;
    }

    var tbody = app.history.map(function (h) {
      var g = h.grade || {};
      return el('tr', {}, [
        el('td', { class: 'mono tiny', text: fmt.date(h.timestamp).slice(5) }),
        el('td', {}, [el('div', { text: h.gpu || '—' }), el('div', { class: 'tiny dim', text: (h.browser || '') + ' · ' + (h.backend || '') })]),
        el('td', { class: 'num' }, [el('b', { style: { color: g.color || 'inherit' }, text: h.total === null ? '—' : fmt.int(h.total) })]),
        el('td', { class: 'num', text: h.sceneFps ? fmt.num(h.sceneFps, 1) : '—' }),
        el('td', { class: 'num', text: h.scene1Low ? fmt.num(h.scene1Low, 1) : '—' }),
        el('td', { class: 'num', text: h.stability ? fmt.num(h.stability, 1) + '%' : '—' }),
        el('td', { class: 'tiny dim', text: (h.preset || '') + ' · ' + (h.resolution || '') }),
        el('td', {}, [
          el('button', { class: 'btn sm ghost', onclick: function () { viewHistoryDetail(h); } }, ['查看'])
        ])
      ]);
    });

    host.appendChild(el('div', { class: 'card mb16' }, [
      el('div', { style: { overflowX: 'auto' } }, [
        el('table', { class: 'tbl' }, [
          el('thead', {}, [el('tr', {}, [
            el('th', { text: '时间' }), el('th', { text: '设备' }), el('th', { class: 'num', text: '总分' }),
            el('th', { class: 'num', text: '场景 FPS' }), el('th', { class: 'num', text: '1% Low' }),
            el('th', { class: 'num', text: '稳定性' }), el('th', { text: '配置' }), el('th', { text: '' })
          ])]),
          el('tbody', {}, tbody)
        ])
      ])
    ]));

    // 趋势图
    if (app.history.length > 1) {
      var cv = el('canvas', { class: 'chart-canvas', style: { height: '260px' } });
      host.appendChild(el('div', { class: 'card' }, [
        el('div', { class: 'card-head' }, [el('div', { class: 'card-title', text: '总分趋势' })]),
        cv
      ]));
      requestAnimationFrame(function () {
        var pts = app.history.slice().reverse().map(function (h, i) { return [i + 1, h.total || 0]; });
        NovaCharts.lineChart(cv, {
          series: [{ label: '综合得分', color: NovaCharts.theme.violet, points: pts, width: 2, fill: true }],
          xLabel: '第 N 次测试', yLabel: '得分', yMin: 0, legend: false
        });
      });
    }
  }

  function viewHistoryDetail(h) {
    var full = U.storage.get('run:' + h.id, null);
    if (full) {
      app.reportData = full;
      setView('report');
      toast('已载入 ' + fmt.date(h.timestamp) + ' 的成绩', 'ok');
    } else {
      toast('该成绩的完整数据已被清理，只保留了摘要', 'info');
    }
  }

  function exportHistory() {
    var out = { generator: 'NovaMark-Lite ' + Nova.VERSION, exportedAt: new Date().toISOString(), runs: app.history };
    Nova.report.downloadText(JSON.stringify(out, null, 2), 'NovaMark-Lite-history.json');
  }

  /* ============================== 关于页 ============================== */

  function renderAbout() {
    var host = $('#view-about');
    U.clear(host);
    host.appendChild(el('h1', { text: '测试方法与说明' }));

    var sections = [
      ['这工具是什么', [
        'NovaMark-Lite 是一个完全运行在浏览器里的 GPU 场景性能评测工具。它不安装任何客户端、不上传任何数据，打开网页就能跑出可对比的分数与完整报告。',
        '本版是完整版 NovaMark 的精简分支：**只保留「场景类」测试**——球体环（原版最简场景）、毒蘑菇（Volume Shader BM）、综合测试（四段场景序列），' +
        '共三项，全部归入唯一的「综合场景」维度。全部微基准测试（填充率 / 几何 / 纹理 / 着色器 ALU / 矩阵乘 / 带宽 / 传输 / 延迟 / 提交）不在本版范围内。',
        '评分模型、报告、界面与版权声明与完整版一致，只是把维度收敛为一个（三项做几何平均）。',
        '设计目标对标 3DMark 这类场景测试的报告形态：维度分、总分、帧时间分布、逐段成绩表、可分享成绩单与结果指纹。'
      ]],
      ['三项测试分别测了什么', [
        '三项全部程序化生成、不依赖任何外部资源，都不使用垂直同步，因此帧率可以超过显示器刷新率。',
        '① 球体环（原版最简场景）：约 288k 三角形 / 900 个实例、单一几何 pass、无阴影无后处理，是最轻负载的基准参照，用来量「纯几何提交 + 基础着色」的上限。',
        '② 毒蘑菇低压力测试（Volume Shader BM）：对每个像素沿视线步进、检测隐式曲面的符号变化，再用二分法 / 黄金分割收敛交点并求法线着色。' +
        '它压的是纯逐像素 ALU 与分支吞吐。本工具刻意**大幅降压**并分三档递进（每像素约 99 / 142 / 186 次 kernal 求值，约为原版的 45% / 65% / 85%），' +
        '既保留同一套数学负载，又能从桌面端跑到移动端不触发浏览器杀页面。三档共用同一套算法与相机路径，所以档内可跨设备对比。',
        '③ 综合测试（四段连续序列）：复杂度逐段递增，每段独立计时：',
        '   星环（基础单场景）：单一几何 pass、900 实例，序列里的最轻基准段。',
        '   峡谷·黄昏：地形网格 + 实例化岩石 + 2.4 万粒子，8 个 pass（阴影深度图 → 程序化星云背景 → PBR 几何 + 3×3 PCF → 粒子 → bloom 亮度提取 / 两次高斯模糊 → ACES 合成）。',
        '   峡谷·云海：在黄昏段之上再叠一层参与介质体积云海（每像素 40 步光线步进 × 每步 9 次 fbm）。',
        '   都市·风暴：换成近 2000 栋楼的城市几何（窗格灯火）+ 6 万粒子 + 低空沙尘，相机在楼群间低空穿行。',
        '综合场景分 = 整段序列的平均帧率（各段权重自然等于其时长），同时给出 1% low / 0.1% low / 帧时间 P99。',
        '稳定性压力测试（仅「完整测试」与「稳定性压力测试」预设）：把重负载段连跑 20 轮，稳定性 = 最差轮 ÷ 最好轮 × 100%，97% 以上为通过；它独立成项，不计入总分。'
      ]],
      ['分数是怎么算的', [
        '本版只有一个维度「综合场景」（权重 1.0），含三个子项：球体环、毒蘑菇、综合测试，权重各 1。',
        '每个子项得分用饱和曲线 s = 100 × x / (x + x_base)，x 是实测平均帧率，x_base 是该后端的对应基线：' +
        '基线设备每个子项恰好得 50 分，分数天然落在 0–100 之间。',
        '维度分 = 三个子项的**加权几何平均**（用几何平均而不是算术平均，是为了让短板被充分暴露，而不是被高分项掩盖）；总分 = 20 × 维度分。',
        '基线设备（GTX 1060 6GB 级：球体环 ' + Nova.score.BASELINE.ring + ' / 毒蘑菇 ' + Nova.score.BASELINE.vsbm +
        ' / 综合场景 ' + Nova.score.BASELINE.scene + ' FPS）三项各 50 分 → 几何平均 50 → 总分 20 × 50 = 1000 分。',
        '有效项统计是「三项里几项有效」，例如 3/3 或 2/3；被跳过 / 失败 / 样本无效的子项不参与几何平均，' +
        '权重在有效子项间重新归一化。三项全部无效时总分不可用。',
        '基线数值（版本 ' + Nova.score.BASELINE_VERSION + '）是在一台 GTX 1060 6GB 级机器上、用 Chrome / WebGPU(D3D12) 后端实测标定的。' +
        '换机器、换后端、换浏览器都可能整体偏移，建议写入自己的基线：' +
        'Nova.score.setBaseline({ ring: 实测值, vsbm: 实测值, scene: 实测值, baselineVersion: \'1.4-my-rig\' })。',
        'WebGL2 后端另有一套单独标定的基线（球体环 / 毒蘑菇 / 综合场景各一个）：' +
        'WebGPU 走 GPU 时间戳查询，WebGL2 走墙钟 + 同步回读，两者测量口径不同，因此分数只在同一后端内部可比，不要跨后端直接对比。'
      ]],
      ['为什么结果可能和你预期不一样', [
        '浏览器只能拿到「被浏览器和驱动包装过」的 GPU：同一块显卡，Windows 走 D3D12、macOS 走 Metal、Linux 走 Vulkan，分数会有差异。',
        '场景质量档（低 / 中 / 高）会改变综合场景的几何量、粒子数与阴影贴图尺寸；毒蘑菇的压力档由预设（快速 / 标准 / 完整）决定。' +
        '渲染分辨率（默认 1280×720）也直接决定逐像素负载。对比成绩前请先确认这几项一致。',
        '笔记本双显卡机型如果跑在核显上，帧率会明显偏低 —— 这是最常见的「跑分异常」原因。',
        '后台标签页会被浏览器降频，测试期间请保持前台；电源模式、散热、其他占用 GPU 的程序都会影响结果。',
        '体积云海段的 40 步光线步进是综合场景里最重的逐像素负载，弱 GPU 在这段掉帧最多，会把整体平均帧率明显拉低；' +
        '毒蘑菇同样是逐像素负载，对显存带宽不敏感、对 ALU 与分支吞吐极其敏感，因此它和球体环的分数高低往往不同步。'
      ]],
      ['免责声明', [
        '本工具的成绩由浏览器端自测生成，结果指纹只能证明数据未被改动，不等同于第三方认证。',
        '软件渲染（SwiftShader / llvmpipe / 基本渲染驱动）、虚拟机、后台运行等情况下的成绩不具备参考价值，报告里会被标记出来。',
        '分数带与基线一旦公布就不应静默变更 —— 如果基线做了调整，会同步升级基线版本号并写进报告。'
      ]]
    ];

    sections.forEach(function (s) {
      host.appendChild(el('div', { class: 'card mb16' }, [
        el('div', { class: 'card-head' }, [el('div', { class: 'card-title', text: s[0] })]),
        el('div', {}, s[1].map(function (p) { return el('p', { class: 'muted', text: p }); }))
      ]));
    });

    /* ---- 版权与许可（独立成块，锚点 #copyright） ---- */
    host.appendChild(el('div', { class: 'copyright-card mb16', id: 'copyright' }, [
      el('div', { class: 'row between wrap mb16', style: { gap: '12px' } }, [
        el('div', {}, [
          el('div', { class: 'small muted', text: 'NOVAMARK · 著作权声明' }),
          el('div', { class: 'owner', text: '版权所有 © 2026 CR_527' })
        ]),
        el('span', { class: 'badge violet lg', text: 'All Rights Reserved' })
      ]),

      el('div', { class: 'small muted mb8', text: '本声明的覆盖范围' }),
      el('div', { class: 'scope mb16' }, [
        el('div', { text: '· 全部源代码：引擎、测试框架、评分模型、设备探测、GPU 型号识别' }),
        el('div', { text: '· 全部着色器：WGSL 与 GLSL ES 3.00 的场景负载（球体环、毒蘑菇隐式曲面求交、四段序列多 pass 管线与体积介质）' }),
        el('div', { text: '· 测试负载与场景设计：球体环最简场景、毒蘑菇低压力三档负载、四段综合场景序列（星环 / 峡谷·黄昏 / 峡谷·云海 / 都市·风暴）、稳定性压力测试' }),
        el('div', { text: '· 评分与基线体系：饱和曲线、维度权重、等级划分、NovaMark-Lite 分数刻度' }),
        el('div', { text: '· 界面与视觉设计：主题系统、图表库、报告版式、成绩单长图' }),
        el('div', { text: '· 文档：README、设计文档、测试方法论说明' }),
        el('div', { text: '· GPU 参考规格数据库的整理、校验、匹配规则与矿卡映射' })
      ]),

      el('div', { class: 'small muted mb8', text: 'NovaMark-Lite 与完整版的关系' }),
      el('div', { class: 'scope mb16' }, [
        el('div', { text: '· 本版（Lite）是 NovaMark 的精简分支：只保留「场景类」测试——' +
          '球体环（原版最简场景）、毒蘑菇（Volume Shader BM）、综合测试（四段场景序列），共三项。' }),
        el('div', { text: '· 全部微基准测试（填充率 / 几何 / 纹理 / 着色器 ALU / 矩阵乘 / 带宽 / 传输 / 延迟 / 提交）不在本版范围内。' }),
        el('div', { text: '· 评分模型与完整版同源：单项饱和曲线不变，维度收敛为「综合场景」一个（权重 1.0），' +
          '维度分为三项的加权几何平均，总分 = 20 × 维度得分。' }),
        el('div', { text: '· 两个版本的著作权归同一权利人 CR_527，版权声明、使用条款与免责声明完全一致。' })
      ]),

      el('div', { class: 'small muted mb8', text: '使用条款' }),
      el('div', { class: 'scope mb16' }, [
        el('div', { text: '1. 允许个人在非商业场景下自由使用、复制与修改本工具。' }),
        el('div', { text: '2. 转载、引用、二次分发或用于评测报告时，必须保留本版权声明，并注明来源为「NovaMark / CR_527」。' }),
        el('div', { text: '3. 用于商业用途（含商业产品集成、付费服务、商业评测发布）须事先取得著作权人书面授权。' }),
        el('div', { text: '4. 不得移除、遮蔽或篡改界面、报告、成绩单长图与导出文件中的版权标识与成绩编号。' }),
        el('div', { text: '5. 不得以伪造成绩、篡改指纹或冒用本工具名义的方式发布结果。' }),
        el('div', { text: '6. 本工具按「现状」提供，不对分数的绝对准确性作任何担保；测试结果仅供参考。' })
      ]),

      el('div', { class: 'small muted mb8', text: '第三方说明' }),
      el('div', { class: 'scope mb16' }, [
        el('div', { text: '· 本工具不包含任何第三方运行时代码，所有依赖均为自研零依赖实现。' }),
        el('div', { text: '· GPU 参考规格数据整理自公开资料（厂商规格页、TechPowerUp GPU Database、Wikipedia 等），' +
          '仅用于参考机型对比与显存预算估算，著作权归各原始来源所有。' }),
        el('div', { text: '· 毒蘑菇低压力测试的算法参考「毒蘑菇 Volume Shader BM」（作者 cznull，' +
          'https://github.com/cznull/cznull.github.io）的公开实现；综合场景与球体环的体积渲染、多 pass 管线思路也参考了同类公开实践。' +
          '本工具为完全独立的实现，与该项目的著作权人无隶属关系。' }),
        el('div', { text: '· 文中提及的 3DMark、鲁大师、Geekbench 等为各自权利人的商标，此处仅作方法学对照说明。' })
      ]),

      el('div', { class: 'tiny dim', text:
        'Copyright © 2026 CR_527. All Rights Reserved.  ' +
        'NovaMark 及其全部源代码、着色器、测试负载、评分模型、界面设计与文档的著作权归 CR_527 所有。  ' +
        'NovaMark-Lite v' + Nova.VERSION + ' · 基线版本 ' + Nova.score.BASELINE_VERSION
      })
    ]));

    // 开发者自检信息
    host.appendChild(el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [el('div', { class: 'card-title', text: '运行环境自检' })]),
      kvBlock([
        ['NovaMark-Lite 版本', Nova.VERSION],
        ['基线版本', Nova.score.BASELINE_VERSION],
        ['GPU 数据库', (global.NOVA_GPU_DB ? global.NOVA_GPU_DB.gpus.length + ' 款' : '未加载')],
        ['测试项数量', planCount() + '（' + buildPlan().map(function (t) { return t.name.split('（')[0]; }).join(' / ') + '）'],
        ['评分维度', (Nova.score.DIMENSIONS || []).map(function (d) {
          return d.name + ' ' + Math.round(d.weight * 100) + '%（' + d.ids.join(' + ') + '）';
        }).join(' / ') || '—'],
        ['场景基线（当前后端）', '球体环 ' + Nova.score.BASELINE.ring + ' / 毒蘑菇 ' + Nova.score.BASELINE.vsbm +
          ' / 综合场景 ' + Nova.score.BASELINE.scene + ' FPS（WebGPU）；WebGL2 单独标定'],
        ['图表库', NovaCharts ? NovaCharts.version : '未加载'],
        ['页面协议', location.protocol],
        ['本地存储', U.storage.available ? '可用' : '不可用（隐私模式？）']
      ])
    ]));
  }

  /* ============================== 分享恢复 ============================== */

  function renderShared(payload) {
    var host = $('#view-report');
    U.clear(host);
    host.appendChild(el('div', { class: 'alert info mb16' }, [
      el('span', { text: '🔗' }),
      el('span', { text: '这是通过分享链接打开的成绩摘要（完整测试数据未被包含）。想看完整报告，请在本机重新运行一次测试。' })
    ]));

    var dims = (payload.d || []).map(function (d) { return { name: d[0], score: d[1] }; });
    var gradeColors = { S: '#22d3ee', A: '#a3e635', B: '#fbbf24', C: '#fb923c', D: '#f87171' };

    host.appendChild(el('div', { class: 'report-hero mb16' }, [
      el('div', { class: 'score-hero' }, [
        el('div', { class: 'label', text: 'NovaMark-Lite 综合得分' }),
        el('div', { class: 'value', text: payload.s === null ? '—' : fmt.int(payload.s) }),
        el('div', { class: 'grade' }, [
          el('b', { style: { color: gradeColors[payload.gl] || '#8fa3c4' }, text: payload.gl || '—' })
        ]),
        el('div', { class: 'sub', text: (payload.g || '未知 GPU') + ' · ' + (payload.b || '') + ' · ' + (payload.r || '') })
      ]),
      el('div', { class: 'card' }, [
        el('div', { class: 'card-title mb16', text: '维度得分' }),
        NovaCharts ? el('canvas', { class: 'chart-canvas', id: 'share-radar', style: { height: '260px' } }) : null
      ])
    ]));

    host.appendChild(el('div', { class: 'card' }, [
      el('div', { class: 'card-title mb16', text: '场景实测帧率' }),
      kvBlock((payload.m || []).map(function (m) {
        return [m[0], (m[1] === null || m[1] === undefined ? '—' : fmt.num(m[1], 2)) + ' ' + (m[2] || '')];
      }).concat(payload.dev ? [
        ['设备', (payload.dev.o || '') + ' · ' + (payload.dev.b || '')],
        ['CPU 核心 / 屏幕', (payload.dev.c || '—') + ' / ' + (payload.dev.s || '—')]
      ] : []))
    ]));

    requestAnimationFrame(function () {
      var cv = $('#share-radar');
      if (cv && NovaCharts) {
        NovaCharts.radar(cv, {
          axes: dims.map(function (d) { return { label: d.name, value: d.score || 0, max: 100, display: d.score === null ? 'N/A' : fmt.num(d.score, 1) }; }),
          levels: 4
        });
      }
    });
  }

  /* ============================== 启动 ============================== */

  function boot() {
    loadHistory();
    applyTheme(currentTheme(), { redraw: false });   // 同步按钮图标与图表调色板

    var themeBtn = $('#theme-toggle');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    // URL 参数：?preset=quick|standard|full|stress &backend=auto|webgl2
    //           &resolution=1280x720 &scene=low|medium|high &force=1 &autorun=1
    try {
      var q = {};
      location.search.replace(/^\?/, '').split('&').forEach(function (kv) {
        if (!kv) return;
        var p = kv.split('=');
        q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] === undefined ? '' : p[1]);
      });
      if (q.preset && Nova.suite.PRESETS[q.preset]) app.options.preset = q.preset;
      if (q.backend === 'webgl2' || q.backend === 'auto') app.options.backend = q.backend;
      if (q.resolution && RESOLUTIONS[q.resolution]) app.options.resolution = q.resolution;
      if (q.scene && /^(low|medium|high)$/.test(q.scene)) app.options.scenePreset = q.scene;
      app.options.force = q.force === '1' || q.force === 'true';
      app.options.autorun = q.autorun === '1' || q.autorun === 'true';
    } catch (e) { /* 忽略参数解析错误 */ }

    U.$$('.nav button').forEach(function (b) {
      b.addEventListener('click', function () { setView(b.dataset.view); });
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && app.running) {
        toast('检测到标签页切到后台，浏览器可能降低 GPU 调度频率，本次成绩可能偏低', 'bad', 6000);
      }
    });

    var shared = Nova.report.parseShare();
    if (shared) {
      setView('report');
      renderShared(shared);
      // 仍然后台探测设备，方便用户直接开测
      detectAll(true);
      return;
    }

    setView('overview');
    detectAll(false).then(function () {
      if (app.options.autorun) {
        setTimeout(function () { startRun(); }, 400);
      }
    });
  }

  function detectAll(silent) {
    var host = $('#view-overview');
    if (!silent && host) {
      U.clear(host);
      host.appendChild(el('div', { class: 'card center', style: { padding: '60px 20px' } }, [
        el('div', { class: 'muted', text: '正在探测硬件与浏览器能力…' })
      ]));
    }
    return Nova.detect.collect({ wantDevice: true }).then(function (info) {
      app.deviceInfo = info;
      app.gpuMatch = Nova.gpuMatch.match(info);
      app.gpuMatch.displayName = Nova.gpuMatch.displayName(app.gpuMatch, info);
      // 型号识别成功时，用数据库里的权威类型覆盖字符串猜测出来的档位；
      // 只兜底到分级档（class）时，也用它的 kinds 校准一次。
      var dbType = (app.gpuMatch && app.gpuMatch.gpu && app.gpuMatch.gpu.type) ||
        (app.gpuMatch && app.gpuMatch.class && app.gpuMatch.class.kinds && app.gpuMatch.class.kinds[0]) || null;
      if (dbType) app.deviceInfo.flags.gpuKindHint = dbType;
      app.deviceInfo.profile = Nova.detect.profileOf(app.deviceInfo, dbType);
      if (app.view === 'overview') renderOverview();   // 先出界面，刷新率稍后补上
      return Nova.detect.measureRefreshRate(45);
    }).then(function (rr) {
      app.refresh = rr;
      if (app.deviceInfo && app.deviceInfo.hardware) {
        app.deviceInfo.hardware.refreshRateHz = rr.timeout ? null : Math.round(rr.hz * 10) / 10;
      }
      if (app.view === 'overview') renderOverview();
    }).catch(function (err) {
      U.log('app', 'detect failed: ' + (err && err.message));
      toast('硬件探测失败：' + (err && err.message), 'bad', 6000);
      if (host) {
        U.clear(host);
        host.appendChild(el('div', { class: 'alert bad' }, [el('span', { text: '硬件探测失败：' + (err && err.message) })]));
      }
    });
  }

  Nova.app = { boot: boot, setView: setView, state: app, toast: toast };
  Nova.boot = boot;

})(window);
