/* ============================================================================
 * NovaMark-Lite · 报告渲染与导出
 *
 * 本版报告描述三个「场景类」测试项（全部归入唯一的「综合场景」维度）：
 *   1) 球体环（原版最简场景）        —— 纯几何提交
 *   2) 毒蘑菇低压力测试（Volume Shader BM）—— 逐像素隐式曲面光线求交
 *   3) 综合测试（四段场景序列）      —— 逐段成绩表 + 帧率曲线 + 帧时间统计
 * 另可含稳定性压力测试（仅「完整测试 / 稳定性压力测试」预设；独立成项，不进总分）。
 * 完整版的「分项测试成绩」大表（15 项微基准）仍不在本版范围内，
 * 报告中取而代之的是三个场景子项 + 综合场景的逐段成绩表（segmentTable）。
 *
 *  - build(container, data)  渲染完整报告
 *  - 导出：纯文本 / JSON / 分享链接 / 1200×675 成绩单长图 / 打印为 PDF
 * ==========================================================================*/
(function (global) {
  'use strict';

  var Nova = global.Nova = global.Nova || {};
  var U = Nova.util;
  var el = U.el, fmt = U.fmt;

  /* --------------------------- 参考机型对比 --------------------------- */

  /* GTX 1060 6GB 的公开规格，作为「指数 1000」的锚点 */
  var REF_SPECS = { fp32Tflops: 4.375, bandwidthGBs: 192, pixelRateGps: 82.0, texelRateGts: 136.6 };

  /** 用公开规格估算一个「理论综合指数」，仅用于横向对照 */
  function specIndex(specs) {
    if (!specs) return null;
    var parts = [
      { v: specs.fp32Tflops, r: REF_SPECS.fp32Tflops, w: 0.40 },
      { v: specs.bandwidthGBs, r: REF_SPECS.bandwidthGBs, w: 0.28 },
      { v: specs.pixelRateGps, r: REF_SPECS.pixelRateGps, w: 0.16 },
      { v: specs.texelRateGts, r: REF_SPECS.texelRateGts, w: 0.16 }
    ];
    var wsum = 0, logsum = 0, used = 0;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (!isFinite(p.v) || p.v === null || p.v <= 0) continue;
      logsum += p.w * Math.log(p.v / p.r);
      wsum += p.w;
      used++;
    }
    if (used < 2 || wsum <= 0) return null;
    return 1000 * Math.exp(logsum / wsum);
  }

  /** 按设备类型找对应的兜底档位代表值 */
  var TYPE_TO_KIND = {
    desktop: 'desktop-dgpu', workstation: 'desktop-dgpu', laptop: 'laptop-dgpu',
    integrated: 'integrated', 'apple-soc': 'apple-soc',
    'mobile-soc': 'mobile-soc', tablet: 'mobile-soc'
  };

  function tierIndex(type, db) {
    var kind = TYPE_TO_KIND[type];
    if (!kind || !db || !db.fallbackClasses) return null;
    for (var i = 0; i < db.fallbackClasses.length; i++) {
      var c = db.fallbackClasses[i];
      if (c.kinds && c.kinds.indexOf(kind) >= 0) return specIndex(c.assumedSpecs);
    }
    return null;
  }

  /** 优先用真实规格；规格不全（移动 GPU 的 ROP/TMU/ALU 多不公开）时退回档位估算 */
  function indexForGpu(g, db) {
    var idx = specIndex(g.specs);
    if (idx !== null) return { index: idx, estimated: false };
    var t = tierIndex(g.type, db);
    return t === null ? null : { index: t, estimated: true };
  }

  /** 生成参考机型对比列表（含本机） */
  function buildComparison(results, gpuMatch) {
    var db = global.NOVA_GPU_DB;
    var list = [];
    var selfIndex = null;

    var measuredTotal = null;
    if (results && results.score && isFinite(results.score.total)) measuredTotal = results.score.total;

    if (db && db.gpus) {
      for (var i = 0; i < db.gpus.length; i++) {
        var g = db.gpus[i];
        if (!g.specs || g.type === 'software') continue;
        var got = indexForGpu(g, db);
        if (!got) continue;
        list.push({
          name: g.name, vendor: g.vendor, type: g.type, year: g.year,
          index: got.index, id: g.id, estimated: got.estimated
        });
      }
    }
    list.sort(function (a, b) { return b.index - a.index; });

    var selfEntry = null;
    if (gpuMatch && gpuMatch.gpu && gpuMatch.gpu.type !== 'software') {
      var selfGot = indexForGpu(gpuMatch.gpu, db);
      if (selfGot) {
        selfIndex = selfGot.index;
        selfEntry = {
          name: gpuMatch.gpu.name, vendor: gpuMatch.gpu.vendor, type: gpuMatch.gpu.type,
          year: gpuMatch.gpu.year, index: selfIndex, id: gpuMatch.gpu.id, self: true,
          estimated: selfGot.estimated, measured: measuredTotal
        };
      }
    } else if (gpuMatch && gpuMatch.class) {
      // 只匹配到档位（例如 Safari 只上报「Apple GPU」）也要让本机出现在榜单里，
      // 否则手机用户会看到一排桌面卡却没有自己。
      var cls = gpuMatch.class;
      var kind = (cls.kinds && cls.kinds[0]) || cls.id;
      var clsIdx = specIndex(cls.assumedSpecs);
      if (clsIdx !== null) {
        selfIndex = clsIdx;
        selfEntry = {
          name: (gpuMatch.displayName || cls.label) + '（型号未识别，按档位估算）',
          vendor: '', type: kind, year: null, index: clsIdx, id: cls.id,
          self: true, estimated: true, measured: measuredTotal
        };
      }
    }

    // 找到本机在榜单中的位置，取前后各 4 个（并把榜单中同一型号那条去掉，避免重复列出）
    var window_ = [];
    if (selfEntry) {
      var pool = list.filter(function (e) { return e.id !== selfEntry.id; });
      var pos = 0;
      while (pos < pool.length && pool[pos].index > selfEntry.index) pos++;
      var from = Math.max(0, pos - 4);
      var to = Math.min(pool.length, pos + 5);
      window_ = pool.slice(from, to);
      window_.splice(Math.min(4, window_.length), 0, selfEntry);
    } else {
      window_ = list.slice(0, 8);
    }

    return {
      entries: window_,
      self: selfEntry,
      dbSize: list.length,
      top: list.slice(0, 3),
      all: list
    };
  }

  /* ------------------------------ 小组件 ------------------------------ */

  function card(title, children, extraClass) {
    var head = title ? el('div', { class: 'card-head' }, [
      el('div', { class: 'card-title', text: title })
    ]) : null;
    return el('div', { class: 'card ' + (extraClass || '') }, head ? [head].concat(children) : children);
  }

  function statTile(k, v, s) {
    return el('div', { class: 'stat-tile' }, [
      el('div', { class: 'k', text: k }),
      el('div', { class: 'v', text: v }),
      s ? el('div', { class: 's', text: s }) : null
    ]);
  }

  /** 场景序列的逐段成绩表（条形长度按该序列内的最高帧率归一化） */
  function segmentTable(segs) {
    if (!segs || !segs.length) return el('div');
    var maxFps = 0;
    segs.forEach(function (s) { if (s.fps > maxFps) maxFps = s.fps; });
    return el('div', { class: 'seg-table mb16' }, segs.map(function (s, i) {
      var w = maxFps > 0 ? Math.max(2, (s.fps / maxFps) * 100) : 0;
      return el('div', { class: 'seg-row' }, [
        el('span', { class: 'seg-idx', text: String(i + 1) }),
        el('span', { class: 'seg-name', text: s.name }),
        el('span', { class: 'seg-bar' }, [el('i', { style: { width: w + '%' } })]),
        el('span', { class: 'seg-fps', text: fmt.num(s.fps, 1) + ' FPS' }),
        el('span', { class: 'seg-meta', text: ((s.durationMs || 0) / 1000).toFixed(1) + 's · ' + fmt.int(s.frames) + ' 帧' })
      ]);
    }));
  }

  function kvTable(pairs) {    var nodes = [];
    for (var i = 0; i < pairs.length; i++) {
      if (!pairs[i]) continue;
      nodes.push(el('div', { text: pairs[i][0] }));
      nodes.push(el('div', { text: pairs[i][1] === null || pairs[i][1] === undefined || pairs[i][1] === '' ? '—' : String(pairs[i][1]) }));
    }
    return el('div', { class: 'kv' }, nodes);
  }

  function statusBadge(status, note) {
    if (status === 'done') return el('span', { class: 'badge ok', text: '有效' });
    if (status === 'skipped') return el('span', { class: 'badge', text: '已跳过', title: note || '' });
    if (status === 'failed') return el('span', { class: 'badge bad', text: '失败', title: note || '' });
    return el('span', { class: 'badge warn', text: '无效', title: note || '' });
  }

  function metricText(part) {
    if (part.metric === null || part.metric === undefined || !isFinite(part.metric)) return '—';
    var v = part.metric;
    var digits = Math.abs(v) >= 100 ? 0 : (Math.abs(v) >= 10 ? 1 : 2);
    return fmt.num(v, digits) + ' ' + (part.unit || '');
  }

  /* ------------------------------ 主体渲染 ------------------------------ */

  /**
   * @param {HTMLElement} container
   * @param {object} data { id, hash, timestamp, device, gpu, results:{results,score,comparison,extra}, config, version }
   */
  function build(container, data) {
    U.clear(container);
    var after = [];
    var sc = data.results.score || {};
    var grade = sc.grade || { letter: '—', label: '—', color: '#8fa3c4' };

    /* ---- 1. 总分 Hero ---- */
    var hero = el('div', { class: 'score-hero' }, [
      el('div', { class: 'label', text: 'NovaMark-Lite 综合得分' }),
      el('div', { class: 'value', text: sc.total === null || sc.total === undefined ? '—' : fmt.int(sc.total) }),
      el('div', { class: 'grade' }, [
        el('b', { style: { color: grade.color }, text: grade.letter }),
        el('span', { class: 'muted', text: grade.label || '' })
      ]),
      el('div', { class: 'sub', text: Nova.score && Nova.score.verdictLine ? Nova.score.verdictLine(sc.total, grade, sc) : '' })
    ]);

    var conf = sc.confidence === undefined ? null : sc.confidence;
    var heroSide = el('div', { class: 'card' }, [
      el('div', { class: 'grid c2', style: { gap: '10px' } }, [
        statTile('有效测试项', (sc.validParts || 0) + ' / ' + (sc.totalParts || 0), '球体环 / 毒蘑菇 / 综合场景 三项'),
        statTile('可信度', conf === null ? '—' : fmt.pct(conf, 0), '由完整度与场景帧率波动决定'),
        statTile('渲染后端', (data.config && data.config.backendLabel) || '—', (data.config && data.config.presetName) || ''),
        statTile('参考机型指数', comparisonSelfIndex(data), '按公开规格估算')
      ]),
      el('div', { class: 'mt16' }, [
        el('div', { class: 'small muted mb8', text: '维度概览（满分 100，基线 50）' }),
        el('div', { id: 'nova-hero-bars' })
      ])
    ]);

    container.appendChild(el('div', { class: 'report-hero mb16' }, [hero, heroSide]));

    /* ---- 2. 维度得分 ---- */
    var dimCanvas = el('canvas', { class: 'chart-canvas', dataset: { chart: 'dim' }, style: { height: '230px' } });
    container.appendChild(el('div', { class: 'mb16' }, [
      card('维度得分（本版只有「综合场景」一个维度，权重 100%；维度分 = 三项的加权几何平均）', [dimCanvas])
    ]));

    after.push(function () {
      var dims = sc.dimensions || [];
      var items = dims.map(function (d, i) {
        return {
          label: d.name,
          value: d.score === null ? 0 : d.score,
          max: 100,
          color: NovaCharts.theme.series[i % NovaCharts.theme.series.length],
          display: d.score === null ? 'N/A' : fmt.num(d.score, 1),
          sub: '权重 ' + fmt.pct(d.weight, 0) + (d.estimated ? ' · 数据不全' : '')
        };
      });
      NovaCharts.hbar(dimCanvas, { items: items, rowHeight: 34 });
    });

    /* ---- 3. 综合场景：逐段成绩表 + 帧率曲线 ---- */
    var scene = findResult(data, 'scene');
    if (scene && scene.status === 'done' && scene.meta && scene.meta.frameTimes) {
      var ft = scene.meta.frameTimes;
      var fpsSeries = ft.map(function (ms, i) { return [i, ms > 0 ? 1000 / ms : 0]; });
      var sceneCanvas = el('canvas', { class: 'chart-canvas', dataset: { chart: 'fps' }, style: { height: '250px' } });
      var histCanvas = el('canvas', { class: 'chart-canvas', dataset: { chart: 'frame-hist' }, style: { height: '220px' } });
      container.appendChild(card('综合测试 · 四段场景序列成绩', [
        el('div', { class: 'grid c4 mb16', style: { gap: '10px' } }, [
          statTile('平均帧率', fmt.num(scene.meta.fpsAvg, 1) + ' FPS', (scene.meta.renderWidth || '') + '×' + (scene.meta.renderHeight || '')),
          statTile('1% Low', fmt.num(scene.meta.fps1Low, 1) + ' FPS', '最慢 1% 帧的平均帧率'),
          statTile('0.1% Low', fmt.num(scene.meta.fps01Low, 1) + ' FPS', '卡顿敏感指标'),
          statTile('帧时间 P99', fmt.num(scene.meta.p99FrameMs, 2) + ' ms', '抖动 ' + fmt.pct(scene.meta.jitter || 0, 1))
        ]),
        el('div', { class: 'small muted mb8', text: '逐段成绩（条形长度按本序列内最高帧率归一化；各段权重等于其时长，场景分 = 整条序列的平均帧率）' }),
        segmentTable(scene.meta.segments),
        sceneCanvas,
        el('div', { class: 'small muted mt16 mb8', text:
          '帧时间分布直方图（横轴为帧时间区间，柱高 = 落在该区间的帧数；柱子整体越靠右、右侧长尾越长，说明卡顿越多。鼠标悬停或触摸按住某根柱子可读出任一区间的帧数与占比）' }),
        histCanvas,
        el('div', { class: 'row wrap mt16', style: { gap: '18px' } }, [
          el('span', { class: 'small muted', text: '渲染分辨率 ' + (scene.meta.renderWidth || '?') + '×' + (scene.meta.renderHeight || '?') + '（' + fmt.si(scene.meta.renderPixels, 2) + ' 像素）' }),
          el('span', { class: 'small muted', text: '一帧 ' + (scene.meta.passes || '?') + ' 个 pass' }),
          el('span', { class: 'small muted', text: '测量帧数 ' + fmt.int(scene.meta.frames) + '（每段丢弃前 ' + ((scene.meta.warmupMs || 0) / 1000).toFixed(1) + 's 预热）' }),
          el('span', { class: 'small muted', text: '几何量 ' + fmt.si(scene.meta.triangles, 2) + ' 三角形/帧 · 阴影贴图 ' + (scene.meta.shadowSize || '?') + '²' }),
          el('span', { class: 'small muted', text: '平滑度 ' + fmt.num(scene.meta.smoothness, 0) + '/100' })
        ])
      ])).classList.add('mb16');
      after.push(function () {
        NovaCharts.lineChart(sceneCanvas, {
          series: [{ label: '帧率 FPS', color: NovaCharts.theme.cyan, points: fpsSeries, width: 1.6, fill: true }],
          xLabel: '帧序号', yLabel: 'FPS', yMin: 0,
          legend: false,
          bands: [{ from: 0, to: (scene.meta.fps1Low || 0), color: 'rgba(248,113,113,0.10)' }],
          annotations: [{ x: 0, label: '1% Low ' + fmt.num(scene.meta.fps1Low, 1) + ' FPS', color: '#f87171' }],
          /* 悬停 / 触摸读数：竖直参考线 + 该点圆点，显示帧序号与该点帧率、帧时间 */
          hover: {
            title: function (hit) { return '帧序号 ' + fmt.int(hit.x); },
            lines: function (hit) {
              var pt = hit.marks[0];
              var ms = (pt.index >= 0 && pt.index < ft.length) ? ft[pt.index] : (pt.y > 0 ? 1000 / pt.y : 0);
              return [
                { text: '帧率 ' + fmt.num(pt.y, 1) + ' FPS', color: NovaCharts.theme.cyan, weight: '600' },
                { text: '帧时间 ' + fmt.num(ms, 2) + ' ms', muted: true }
              ];
            }
          }
        });

        /* 帧时间分布直方图：同一套 NovaCharts.bars，附带区间元数据供悬停读数使用 */
        var hist = frameHistogram(ft, { bins: 22 });
        if (hist) {
          NovaCharts.bars(histCanvas, {
            categories: hist.categories,
            unit: 'ms',
            yLabel: '帧数',
            yTicks: 4,
            showValues: false
          });
        } else {
          NovaCharts.bars(histCanvas, { categories: [] });
        }
      });
    }

    /* ---- 4. 评分明细（球体环 / 毒蘑菇 / 综合场景 三项） ---- */
    var rows = [];
    (sc.dimensions || []).forEach(function (d) {
      (d.parts || []).forEach(function (p) { rows.push({ dim: d.name, part: p }); });
    });
    var tbody = rows.map(function (r) {
      var p = r.part;
      return el('tr', {}, [
        el('td', {}, [el('div', { text: p.name }), el('div', { class: 'tiny dim', text: r.dim })]),
        el('td', { class: 'num' }, [document.createTextNode(metricText(p))]),
        el('td', { class: 'num', text: p.score === null ? '—' : fmt.num(p.score, 1) }),
        el('td', { class: 'num', text: absoluteIndexOf(data, p.id) }),
        el('td', {}, [statusBadge(p.status, p.note)])
      ]);
    });
    container.appendChild(card('评分明细', [
      el('div', { style: { overflowX: 'auto' } }, [
        el('table', { class: 'tbl' }, [
          el('thead', {}, [el('tr', {}, [
            el('th', { text: '测试项' }),
            el('th', { class: 'num', text: '实测值' }),
            el('th', { class: 'num', text: '得分' }),
            el('th', { class: 'num', text: '绝对指数' }),
            el('th', { text: '状态' })
          ])]),
          el('tbody', {}, tbody)
        ])
      ]),
      el('div', { class: 'tiny dim mt8', text:
        '得分：基线设备（GTX 1060 6GB 级）三项各自的基线为 球体环 ' +
        ((Nova.score && Nova.score.BASELINE && Nova.score.BASELINE.ring) || '—') + ' FPS / 毒蘑菇 ' +
        ((Nova.score && Nova.score.BASELINE && Nova.score.BASELINE.vsbm) || '—') + ' FPS / 综合场景 ' +
        ((Nova.score && Nova.score.BASELINE && Nova.score.BASELINE.scene) || '—') +
        ' FPS，各得 50 分；维度分 = 三项的加权几何平均，总分 = 20 × 维度分，因此基线设备总分恰好 1000 分。' +
        '绝对指数：1000 = 恰好等于该子项的基线。本版不含微基准，因此不再计算「理论达成率」。' })
    ])).classList.add('mb16');

    /* ---- 5. 稳定性（仅「完整测试 / 稳定性压力测试」预设才有，独立成项不进总分） ---- */
    var stab = stabilityOf(data);
    var stabSeries = stab ? (stab.fpsSeries || (Array.isArray(stab.rounds) ? stab.rounds : null)) : null;
    if (stab && stabSeries && stabSeries.length > 1) {
      var stCanvas = el('canvas', { class: 'chart-canvas', dataset: { chart: 'stability' }, style: { height: '240px' } });
      var verdictMap = { excellent: ['ok', '优秀'], good: ['info', '良好'], fair: ['warn', '一般'], poor: ['bad', '较差'] };
      var v = verdictMap[stab.verdict] || ['info', '—'];
      container.appendChild(card('稳定性压力测试（独立成项，不计入总分）', [
        el('div', { class: 'grid c4 mb16', style: { gap: '10px' } }, [
          statTile('稳定性', fmt.num(stab.stability, 1) + '%', '3DMark 口径：最低轮 ÷ 最高轮'),
          statTile('判定', stab.passed ? '通过' : '未通过', '阈值 97%，共 ' + stabSeries.length + ' 轮'),
          statTile('最高 / 最低轮', fmt.num(stab.fpsHigh, 1) + ' / ' + fmt.num(stab.fpsLow, 1) + ' FPS', '每轮平均帧率'),
          statTile('性能衰减', fmt.num(stab.decayPct, 1) + '%', '线性拟合首尾差')
        ]),
        el('div', { class: 'mb16' }, [el('span', { class: 'badge ' + v[0] + ' lg', text: '稳定性评定：' + v[1] })]),
        stab.note ? el('div', { class: 'small muted mb16', text: stab.note }) : null,
        stCanvas
      ])).classList.add('mb16');
      after.push(function () {
        var pts = stabSeries.map(function (f, i) { return [i + 1, f]; });
        // 稳定性图的重点是「波动幅度」，从 0 起会把曲线压成一条直线，
        // 因此把 y 轴下限抬到最低轮次的 85%，让起伏看得见。
        var lo = Math.min.apply(null, stabSeries);
        var hi = Math.max.apply(null, stabSeries);
        var yMin = Math.max(0, Math.floor(lo * 0.85));
        var yMax = Math.ceil(hi * 1.05);
        NovaCharts.lineChart(stCanvas, {
          series: [{ label: '每轮平均帧率', color: NovaCharts.theme.lime, points: pts, width: 2, fill: true }],
          xLabel: '轮次', yLabel: 'FPS', yMin: yMin, yMax: yMax, legend: false,
          annotations: [{ x: 0, label: '97% 通过线', color: '#fbbf24' }],
          bands: [{ from: yMin, to: (stab.fpsHigh || 0) * 0.97, color: 'rgba(248,113,113,0.10)' }],
          /* 悬停 / 触摸读数：轮次序号 + 该轮帧率 + 相对首轮的衰减百分比 */
          hover: {
            title: function (hit) { return '第 ' + fmt.int(hit.x) + ' 轮'; },
            lines: function (hit) {
              var pt = hit.marks[0];
              var first = stabSeries.length ? stabSeries[0] : pt.y;
              var diff = first > 0 ? (first - pt.y) / first * 100 : 0;
              return [
                { text: '本轮平均帧率 ' + fmt.num(pt.y, 1) + ' FPS', color: NovaCharts.theme.lime, weight: '600' },
                { text: '相对首轮 ' + fmt.num(first, 1) + ' FPS：' + (diff >= 0 ? '衰减 ' : '提升 ') + fmt.num(Math.abs(diff), 1) + '%', muted: true }
              ];
            }
          }
        });
      });
    }

    /* ---- 6. 参考机型对比 ---- */
    var cmp = data.results.comparison || buildComparison(data.results, data.gpu && data.gpu.match);
    if (cmp && cmp.entries && cmp.entries.length) {
      var maxIdx = 0;
      cmp.entries.forEach(function (e) { maxIdx = Math.max(maxIdx, e.index); });
      var cmpRows = cmp.entries.map(function (e) {
        var w = maxIdx > 0 ? (e.index / maxIdx) * 100 : 0;
        var label = e.name + (e.self ? '（本机）' : '') + (e.estimated ? ' · 档位估算' : '');
        return el('div', { class: 'cmp-row' + (e.self ? ' self' : '') }, [
          el('div', { class: 'cmp-name', style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, title: label, text: label }),
          el('div', { class: 'cmp-track' }, [
            el('i', {
              style: {
                width: w + '%',
                background: e.self ? 'linear-gradient(90deg,var(--accent-fill),var(--violet))'
                  : (e.estimated ? 'var(--border)' : 'color-mix(in srgb, var(--muted) 45%, transparent)')
              }
            })
          ]),
          el('div', { class: 'right mono small', text: fmt.int(e.index) })
        ]);
      });
      container.appendChild(card('参考机型对比（按公开规格估算的理论指数）', [
        el('div', { class: 'col', style: { gap: '7px' } }, cmpRows),
        el('div', { class: 'tiny dim mt16', text: '理论指数由 FP32 算力、显存带宽、像素/纹理填充率的公开规格按 40/28/16/16 加权几何平均估算，锚点为 GTX 1060 6GB = 1000。它衡量的是「硬件规格强弱」，与本版的综合场景实测分不是同一把尺子（综合场景是几何 + 粒子 + 体积步进 + 后处理的混合负载），只用于判断「实测是否明显偏离该型号应有的水平」。数据库共收录 ' + (cmp.dbSize || 0) + ' 款设备；标注「档位估算」的条目缺少公开的 ALU/ROP 数，用同档位代表值代替。' })
      ])).classList.add('mb16');
    }

    /* ---- 7. 诊断建议 ---- */
    var diags = (data.results.diagnostics && data.results.diagnostics.length)
      ? data.results.diagnostics
      : (Nova.score && Nova.score.diagnose ? Nova.score.diagnose(data.results.results || [], data.device, data.gpu && data.gpu.match && data.gpu.match.gpu, data.results.extra || {}) : []);
    if (diags.length) {
      container.appendChild(card('诊断与结论', diags.map(function (d) {
        return el('div', { class: 'diag ' + (d.level || 'info') }, [
          el('div', { class: 'ico', text: d.icon || '•' }),
          el('div', {}, [
            el('div', { class: 't', text: d.title }),
            el('div', { class: 'd', text: d.detail })
          ])
        ]);
      }))).classList.add('mb16');
    }

    /* ---- 8. 硬件与环境信息 ---- */
    container.appendChild(buildHardwareSection(data)).classList.add('mb16');

    /* ---- 9. 证书 ---- */
    container.appendChild(buildCertificate(data));

    /* ---- 执行挂载后的图表渲染 ---- */
    requestAnimationFrame(function () {
      for (var i = 0; i < after.length; i++) {
        try { after[i](); } catch (e) { U.log('report', '图表渲染失败: ' + e.message); }
      }
    });

    return container;
  }

  function comparisonSelfIndex(data) {
    var cmp = data.results.comparison || buildComparison(data.results, data.gpu && data.gpu.match);
    if (cmp && cmp.self && cmp.self.index) return fmt.int(cmp.self.index);
    return '—';
  }

  function findResult(data, id) {
    var list = (data.results && data.results.results) || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function stabilityOf(data) {
    if (data.results && data.results.stability) return data.results.stability;
    var st = findResult(data, 'stability');
    if (st && st.meta && st.meta.stability) {
      var s = st.meta.stability;
      var model = Nova.score && Nova.score.stability ? Nova.score.stability(s.rounds) : null;
      if (model) return model;
      return { stability: s.stability, fpsHigh: s.fpsHigh, fpsLow: s.fpsLow, rounds: s.rounds, passed: s.stability >= 97, decayPct: NaN, verdict: s.stability >= 97 ? 'excellent' : (s.stability >= 90 ? 'good' : (s.stability >= 80 ? 'fair' : 'poor')) };
    }
    return null;
  }

  /* --------------------------- 帧时间分布直方图 --------------------------- */

  /**
   * 把帧时间序列分箱成直方图（柱高 = 该区间的帧数），返回 NovaCharts.bars 的 categories。
   * 只统计有限正数；上界取 P97 适当外扩，避免个别极端长尾把有用的箱子压扁 ——
   * 超出上界的帧并入最后一箱（区间如实标到真实最大值），长尾因此在图上仍然可见。
   * @returns {{categories:Array, total:number, bins:number, from:number, to:number}|null}
   */
  function frameHistogram(frameTimes, opts) {
    var o = opts || {};
    var vals = [];
    var i;
    for (i = 0; i < (frameTimes ? frameTimes.length : 0); i++) {
      var v = Number(frameTimes[i]);
      if (isFinite(v) && v > 0) vals.push(v);
    }
    if (vals.length < 4) return null;

    var sorted = vals.slice().sort(function (a, b) { return a - b; });
    var lo = sorted[0];
    var maxVal = sorted[sorted.length - 1];
    /* 上界取 P97 外扩：极端长尾（偶尔的百毫秒级卡顿）不参与定标，
     * 否则整张图会被拉成「一根柱 + 一条几乎为零的长尾」。
     * 超出上界的帧并入最后一箱，该箱区间如实标到真实最大值。 */
    var p97 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.97))];
    var hi = Math.max(lo * 1.6, p97 * 1.12);
    if (!(hi > lo)) hi = lo * 1.2;

    var bins = Math.round(o.bins === undefined ? Math.sqrt(vals.length) * 1.2 : o.bins);
    if (!isFinite(bins)) bins = 12;
    bins = Math.max(6, Math.min(30, bins));

    var width = (hi - lo) / bins;
    if (!(width > 0)) return null;

    var counts = [];
    for (i = 0; i < bins; i++) counts.push(0);
    for (i = 0; i < vals.length; i++) {
      var k = Math.floor((vals[i] - lo) / width);
      if (k < 0) k = 0;
      if (k > bins - 1) k = bins - 1;
      counts[k]++;
    }

    var total = vals.length;
    /* 标签过密时只标一部分，小屏上才不会糊成一片（精确值由悬停读数给出） */
    var every = Math.max(1, Math.ceil(bins / 8));
    var cats = [];
    for (i = 0; i < bins; i++) {
      var from = lo + width * i;
      var to = from + width;
      /* 最后一箱吸收溢出：区间如实标到真实最大值，读数不会低估长尾 */
      if (i === bins - 1 && maxVal > to) to = maxVal;
      cats.push({
        label: (i % every === 0) ? fmt.num(from, 1) : '',
        value: counts[i],
        display: String(counts[i]),
        color: NovaCharts.theme.cyan,
        from: from,
        to: to,
        count: counts[i],
        percent: total > 0 ? (counts[i] / total) * 100 : 0
      });
    }
    return { categories: cats, total: total, bins: bins, from: lo, to: hi, max: maxVal };
  }

  function absoluteIndexOf(data, id) {
    var list = data.results.absolute || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        return list[i].index === null || list[i].index === undefined ? '—' : fmt.int(list[i].index);
      }
    }
    return '—';
  }

  /* 本版不含微基准，不再计算「理论达成率」，因此这里没有 efficiencyOf()。 */

  /* --------------------------- 硬件信息区 --------------------------- */

  function buildHardwareSection(data) {
    var d = data.device || {};
    var wg = d.webgl || {}, gp = d.webgpu || {}, hw = d.hardware || {};
    var gm = (data.gpu && data.gpu.match) || {};
    var gpu = gm.gpu;

    var prof = d.profile || {};
    var gpuKv = [
      ['识别型号', gpu ? gpu.name : (data.gpu && data.gpu.displayName) || '未知'],
      ['厂商 / 类型', gpu ? (gpu.vendor + ' · ' + typeLabel(gpu.type)) : (d.flags && d.flags.vendorHint) || '—'],
      ['运行平台', gpu ? (platformLabel(gpu.platform) + (gpu.unifiedMemory ? ' · 统一内存' : ' · 独立显存') + (gpu.os && gpu.os.length ? ' · ' + gpu.os.join('/') : '')) : '—'],
      ['识别置信度', gm.ok ? fmt.pct(gm.confidence, 0) + '（' + gm.method + '）' : '未匹配到数据库型号'],
      ['设备档位', prof.label ? (prof.label + '（工作量系数 ' + fmt.num(prof.workloadScale, 2) + '，测试显存预算 ' + prof.memoryBudgetMB + ' MB）') : '—'],
      ['WebGL 渲染器', wg.unmaskedRenderer || wg.renderer || '—'],
      ['WebGPU 适配器', gp.info ? [gp.info.vendor, gp.info.architecture, gp.info.device, gp.info.description].filter(Boolean).join(' · ') : '不可用'],
      ['WebGPU 特性', (gp.features && gp.features.length) ? gp.features.join(', ') : '—']
    ];
    if (gpu && gpu.specs) {
      var sp = gpu.specs;
      gpuKv.push(['理论 FP32', sp.fp32Tflops ? fmt.num(sp.fp32Tflops, 2) + ' TFLOPS' : '—']);
      gpuKv.push(['理论带宽', sp.bandwidthGBs ? fmt.num(sp.bandwidthGBs, 1) + ' GB/s' : '—']);
      gpuKv.push(['像素 / 纹理填充率', (sp.pixelRateGps ? fmt.num(sp.pixelRateGps, 1) + ' GP/s' : '—') + ' · ' + (sp.texelRateGts ? fmt.num(sp.texelRateGts, 1) + ' GT/s' : '—')]);
      gpuKv.push(['显存', (sp.vramGB ? sp.vramGB + ' GB' : '—') + (sp.memType ? ' ' + sp.memType : '') + (sp.busWidth ? ' / ' + sp.busWidth + '-bit' : '')]);
    }

    var sysKv = [
      ['浏览器', d.browser ? (d.browser.name + ' ' + d.browser.version + ' · ' + d.browser.engine) : '—'],
      ['操作系统', d.os ? (d.os.name + ' ' + d.os.version + (d.os.arch ? ' (' + d.os.arch + ')' : '')) : '—'],
      ['CPU 逻辑核心', hw.cpuCores || '—'],
      ['设备内存（浏览器上报）', hw.deviceMemoryGB ? hw.deviceMemoryGB + ' GB' : '未上报'],
      ['屏幕', hw.screen ? (hw.screen.width + '×' + hw.screen.height + ' @ ' + (hw.devicePixelRatio || 1) + 'x' + (hw.refreshRateHz ? ' · ' + hw.refreshRateHz + ' Hz' : '')) : '—'],
      ['测试分辨率', (data.config && data.config.resolution) || '—'],
      ['渲染后端', (data.config && data.config.backendLabel) || '—'],
      ['计时方式', (data.config && data.config.timing) || '—'],
      ['Cross-Origin Isolated', d.flags ? (d.flags.crossOriginIsolated ? '是（高精度计时可用）' : '否') : '—']
    ];

    var webglKv = [
      ['WebGL 版本', wg.version || '不可用'],
      ['GLSL 版本', wg.glslVersion || '—'],
      ['最大纹理尺寸', wg.limits && wg.limits.MAX_TEXTURE_SIZE ? wg.limits.MAX_TEXTURE_SIZE : '—'],
      ['最大 MSAA 采样', wg.maxSamples || '—'],
      ['各向异性上限', wg.anisotropy || '—'],
      ['GPU 计时扩展', wg.timerQuery ? (wg.timerQueryExt || '可用') : '不可用'],
      ['扩展数量', (wg.extensions && wg.extensions.length) || 0]
    ];

    return card('硬件与环境信息', [
      el('div', { class: 'grid c2', style: { gap: '22px' } }, [
        el('div', {}, [el('h3', { class: 'small muted', text: '图形处理器' }), kvTable(gpuKv)]),
        el('div', {}, [el('h3', { class: 'small muted', text: '系统与浏览器' }), kvTable(sysKv)]),
        el('div', {}, [el('h3', { class: 'small muted', text: 'WebGL 能力' }), kvTable(webglKv)]),
        el('div', {}, [
          el('h3', { class: 'small muted', text: 'WebGPU 限制（浏览器可能分层上报）' }),
          kvTable([
            ['最大纹理 2D', gp.limits ? gp.limits.maxTextureDimension2D : '—'],
            ['最大缓冲区', gp.limits ? fmt.bytes(gp.limits.maxBufferSize) : '—'],
            ['最大存储绑定', gp.limits ? fmt.bytes(gp.limits.maxStorageBufferBindingSize) : '—'],
            ['计算工作组上限', gp.limits && gp.limits.maxComputeInvocationsPerWorkgroup ? gp.limits.maxComputeInvocationsPerWorkgroup + ' 线程' : '—'],
            ['共享内存上限', gp.limits && gp.limits.maxComputeWorkgroupStorageSize ? fmt.bytes(gp.limits.maxComputeWorkgroupStorageSize) : '—'],
            ['时间戳查询', gp.timestamp ? '可用（纳秒精度，浏览器可能粗化到 100µs）' : '不可用'],
            ['shader-f16', gp.shaderF16 ? '可用' : '不可用']
          ])
        ])
      ])
    ]);
  }

  function typeLabel(t) {
    return ({
      desktop: '桌面独显', laptop: '笔记本独显', integrated: '核显',
      'apple-soc': 'Apple 统一内存', 'mobile-soc': '移动 SoC', tablet: '平板 SoC',
      workstation: '专业卡', software: '软件渲染'
    })[t] || t || '—';
  }

  function platformLabel(p) {
    return ({
      desktop: '桌面端', laptop: '笔记本', phone: '手机', tablet: '平板',
      console: '游戏主机', unknown: '未知'
    })[p] || p || '—';
  }

  /* ----------------------------- 证书区 ----------------------------- */

  function buildCertificate(data) {
    var d = data.device || {};
    return el('div', { class: 'cert' }, [
      el('div', { class: 'row between wrap', style: { gap: '12px' } }, [
        el('div', {}, [
          el('div', { class: 'small muted', text: 'NovaMark-Lite 成绩编号' }),
          el('div', { class: 'cert-id', text: data.id || '—' })
        ]),
        el('div', { class: 'right' }, [
          el('div', { class: 'small muted', text: '测试时间' }),
          el('div', { text: fmt.date(data.timestamp || Date.now()) })
        ])
      ]),
      el('div', { class: 'mt16' }, [
        el('div', { class: 'small muted', text: '结果指纹 SHA-256' }),
        el('div', { class: 'cert-hash', text: data.hash || '（未生成）' })
      ]),
      el('div', { class: 'mt16 small dim', text:
        (data.version || 'NovaMark-Lite') + ' · 基线版本 ' + ((data.results.score && data.results.score.baselineVersion) || '-') +
        ' · 后端 ' + ((data.config && data.config.backendLabel) || '-') +
        ' · 预设 ' + ((data.config && data.config.presetName) || '-') +
        // 全局预热：排在所有计分测试之前，不进结果。写进证书是为了让「同一台机器不同次成绩」
        // 之间的口径透明（有没有预热会明显影响最轻那个负载的读数）。
        (((data.results.extra && data.results.extra.warmupMs) || 0) > 0
          ? ' · 全局预热 ' + (data.results.extra.warmupMs / 1000).toFixed(1) + ' s' : '') +
        ' · 渲染器指纹 ' + U.fnv1a((d.webgl && d.webgl.unmaskedRenderer) || 'unknown')
      }),
      el('div', { class: 'mt16 small dim', text:
        '说明：本成绩由浏览器端自测生成，指纹仅保证数据未被改动，不等同于第三方认证。软件渲染、虚拟机、后台运行或系统降频都会影响结果。' +
        '本版为 NovaMark-Lite：只包含三个场景类测试（球体环 / 毒蘑菇 Volume Shader BM / 四段综合场景），' +
        '不含微基准；评分维度收敛为「综合场景」一个（权重 100%），维度分为三项的加权几何平均，总分 = 20 × 维度分；' +
        '基线设备（GTX 1060 6GB 级）总分 ≈ 1000 分，三项基线可用 ' +
        'Nova.score.setBaseline({ ring: 实测值, vsbm: 实测值, scene: 实测值 }) 校准。'
      }),
      el('div', { class: 'mt16 copyright' }, [
        el('div', {}, [
          el('b', { text: '版权所有 © 2026 CR_527' }),
          el('span', { class: 'dim', text: ' · NovaMark · 保留所有权利' })
        ]),
        el('div', { class: 'dim', text:
          '本报告由 NovaMark 生成。NovaMark 的全部源代码、着色器、测试负载、评分模型、界面设计与文档的著作权归 CR_527 所有；' +
          '转载、引用或用于评测发布时，请保留本声明并注明来源「NovaMark / CR_527」；商业用途须事先取得授权。'
        })
      ])
    ]);
  }

  /* ------------------------------ 导出 ------------------------------ */

  function plainReport(data) {
    var sc = data.results.score || {};
    var lines = [];
    var gpu = data.gpu && data.gpu.match && data.gpu.match.gpu;
    lines.push('===== NovaMark-Lite 显卡性能评测报告 =====');
    lines.push('成绩编号: ' + (data.id || '-'));
    lines.push('测试时间: ' + fmt.date(data.timestamp || Date.now()));
    lines.push('GPU: ' + ((gpu && gpu.name) || (data.gpu && data.gpu.displayName) || '未知'));
    lines.push('浏览器/系统: ' + ((data.device.browser && data.device.browser.name + ' ' + data.device.browser.version) || '-') +
      ' / ' + ((data.device.os && data.device.os.name + ' ' + data.device.os.version) || '-'));
    lines.push('渲染后端: ' + ((data.config && data.config.backendLabel) || '-') + ' · 分辨率 ' + ((data.config && data.config.resolution) || '-'));
    lines.push('测试内容: 球体环（原版最简场景） + 毒蘑菇（Volume Shader BM） + 综合测试（四段场景序列：星环 → 峡谷·黄昏 → 峡谷·云海 → 都市·风暴）');
    lines.push('');
    lines.push('综合得分: ' + (sc.total === null ? '-' : fmt.int(sc.total)) + '  (' + (sc.grade ? sc.grade.letter + ' ' + sc.grade.label : '-') + ')');
    if (Nova.score && Nova.score.verdictLine) lines.push(Nova.score.verdictLine(sc.total, sc.grade, sc));
    lines.push('');
    lines.push('-- 维度得分 --');
    (sc.dimensions || []).forEach(function (d) {
      lines.push('  ' + pad(d.name, 14) + (d.score === null ? 'N/A' : fmt.num(d.score, 1)) + ' / 100  权重 ' + fmt.pct(d.weight, 0) +
        '   总分系数 ×20');
    });
    lines.push('  有效测试项 ' + (sc.validParts || 0) + ' / ' + (sc.totalParts || 0) +
      ' · 可信度 ' + (sc.confidence === null || sc.confidence === undefined ? '-' : fmt.pct(sc.confidence, 0)));
    lines.push('  （本版只有「综合场景」一个维度，维度分 = 球体环 / 毒蘑菇 / 综合场景 三项的加权几何平均）');
    lines.push('');
    lines.push('-- 评分明细 --');
    (sc.dimensions || []).forEach(function (d) {
      (d.parts || []).forEach(function (p) {
        lines.push('  ' + pad(p.name, 22) + pad(metricText(p), 16) +
          (p.score === null ? '  —' : '  得分 ' + fmt.num(p.score, 1)) +
          '   绝对指数 ' + absoluteIndexOf(data, p.id));
      });
    });
    var scene = findResult(data, 'scene');
    if (scene && scene.meta) {
      lines.push('');
      lines.push('-- 综合测试 · 四段场景序列 --');
      lines.push('  平均帧率 ' + fmt.num(scene.meta.fpsAvg, 1) + ' FPS · 1% low ' + fmt.num(scene.meta.fps1Low, 1) +
        ' · 0.1% low ' + fmt.num(scene.meta.fps01Low, 1) + ' · P99 帧时间 ' + fmt.num(scene.meta.p99FrameMs, 2) + ' ms');
      var segs = scene.meta.segments || [];
      segs.forEach(function (s, i) {
        lines.push('  ' + (i + 1) + ') ' + pad(s.name, 20) + pad(fmt.num(s.fps, 1) + ' FPS', 12) +
          ((s.durationMs || 0) / 1000).toFixed(1) + 's · ' + fmt.int(s.frames) + ' 帧');
      });
      lines.push('  渲染分辨率 ' + (scene.meta.renderWidth || '?') + '×' + (scene.meta.renderHeight || '?') +
        ' · 一帧 ' + (scene.meta.passes || '?') + ' 个 pass · 质量档 ' + (scene.meta.preset || '-'));
    }
    var stab = stabilityOf(data);
    if (stab) {
      lines.push('');
      lines.push('-- 稳定性压力测试（独立成项，不计入总分）--');
      lines.push('  稳定性 ' + fmt.num(stab.stability, 1) + '%（' + (stab.passed ? '通过' : '未通过') + '）· ' +
        (stab.rounds || []).length + ' 轮 · 最高 ' + fmt.num(stab.fpsHigh, 1) + ' FPS / 最低 ' + fmt.num(stab.fpsLow, 1) + ' FPS');
    }
    var diags = data.results.diagnostics || [];
    if (diags.length) {
      lines.push('');
      lines.push('-- 诊断 --');
      diags.forEach(function (d) { lines.push('  [' + d.level + '] ' + d.title + '：' + d.detail); });
    }
    lines.push('');
    lines.push('指纹: ' + (data.hash || '-'));
    var warmS = ((data.results.extra && data.results.extra.warmupMs) || 0) / 1000;
    lines.push('全局预热: ' + (warmS > 0 ? warmS.toFixed(1) + ' s（排在所有计分测试之前，不计入结果）' : '未启用'));
    lines.push('（NovaMark-Lite ' + (data.version || '') + ' · 基线 ' + (sc.baselineVersion || '-') + '）');
    lines.push('（本版只含场景类测试：球体环 / 毒蘑菇 / 综合场景 三项，不含微基准；');
    lines.push('  维度分 = 三项加权几何平均，总分 = 20 × 维度分）');
    lines.push('');
    lines.push('------------------------------------------------------------');
    lines.push('版权所有 (C) 2026 CR_527. All Rights Reserved.');
    lines.push('本报告由 NovaMark 生成。NovaMark 的全部源代码、着色器、测试负载、');
    lines.push('评分模型、界面设计与文档的著作权归 CR_527 所有。');
    lines.push('转载 / 引用 / 用于评测发布时，请保留本声明并注明来源「NovaMark / CR_527」；');
    lines.push('商业用途须事先取得著作权人书面授权。');
    lines.push('------------------------------------------------------------');
    return lines.join('\n');
  }

  function pad(s, n) {
    s = String(s);
    var w = 0;
    for (var i = 0; i < s.length; i++) w += s.charCodeAt(i) > 255 ? 2 : 1;
    var need = n - w;
    while (need-- > 0) s += ' ';
    return s;
  }

  /** 生成紧凑的分享数据（去掉大数组） */
  function compact(data) {
    var sc = data.results.score || {};
    return {
      v: 1,
      t: data.timestamp,
      id: data.id,
      g: data.gpu && data.gpu.match && data.gpu.match.gpu ? data.gpu.match.gpu.name : (data.gpu && data.gpu.displayName) || '未知 GPU',
      b: data.config && data.config.backendLabel,
      r: data.config && data.config.resolution,
      p: data.config && data.config.presetName,
      s: sc.total,
      gl: sc.grade && sc.grade.letter,
      d: (sc.dimensions || []).map(function (d) { return [d.name, d.score === null ? null : Math.round(d.score * 10) / 10]; }),
      m: (sc.dimensions || []).reduce(function (acc, d) {
        (d.parts || []).forEach(function (p) { acc.push([p.name, p.metric, p.unit]); });
        return acc;
      }, []),
      dev: data.device ? {
        b: data.device.browser && (data.device.browser.name + ' ' + data.device.browser.version),
        o: data.device.os && (data.device.os.name + ' ' + data.device.os.version),
        c: data.device.hardware && data.device.hardware.cpuCores,
        s: data.device.hardware && data.device.hardware.screen && (data.device.hardware.screen.width + 'x' + data.device.hardware.screen.height)
      } : null
    };
  }

  function shareUrl(data, base) {
    var origin = base || (location.origin === 'null' || location.protocol === 'file:'
      ? location.href.split('#')[0]
      : location.origin + location.pathname);
    var payload = U.b64encodeUtf8(JSON.stringify(compact(data)));
    return origin + '#share=' + payload;
  }

  function parseShare(hash) {
    try {
      var m = String(hash || location.hash || '').match(/share=([A-Za-z0-9\-_]+)/);
      if (!m) return null;
      return JSON.parse(U.b64decodeUtf8(m[1]));
    } catch (e) { return null; }
  }

  /* --------------------------- 成绩单长图 --------------------------- */

  /**
   * 在离屏 canvas 上绘制一张 1200×675 的成绩单长图。
   * @returns {HTMLCanvasElement}
   */
  /* 成绩单长图专用的**固定深色**配色。
   * 不能复用 NovaCharts.theme —— 那个会跟随页面主题切换，浅色主题下 text 接近黑色，
   * 画在长图的深色底上等于隐形（这正是「报告数字很难看清」的原因）。 */
  var CARD = {
    text: '#f4f8ff',
    heading: '#cfe0f5',
    label: '#9fb4d0',
    value: '#ffffff',
    muted: '#8ba0bd',
    dim: '#63768f',
    cyan: '#22d3ee',
    violet: '#8b5cf6',
    rowA: 'rgba(255,255,255,0.030)',
    panel: 'rgba(255,255,255,0.045)',
    line: 'rgba(255,255,255,0.13)'
  };
  function renderCard(data) {
    // 逻辑坐标 1200×700（画布按 dpr 放大）。高度留够页脚版权两行，
    // 否则版权说明会被画到画布外被裁掉。
    var W = 1200, H = 700, dpr = 2;
    var cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var T = NovaCharts.theme;

    // 背景
    var bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#070b14');
    bg.addColorStop(0.55, '#0b1224');
    bg.addColorStop(1, '#0a0f1e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 光晕
    var glow = ctx.createRadialGradient(230, 120, 10, 230, 120, 420);
    glow.addColorStop(0, 'rgba(34,211,238,0.20)');
    glow.addColorStop(1, 'rgba(34,211,238,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    var glow2 = ctx.createRadialGradient(980, 560, 10, 980, 560, 420);
    glow2.addColorStop(0, 'rgba(139,92,246,0.20)');
    glow2.addColorStop(1, 'rgba(139,92,246,0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, W, H);

    // 斜纹
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    for (var x = -H; x < W; x += 26) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + H, H); ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = CARD.text;
    ctx.font = '700 26px -apple-system,"Segoe UI","Microsoft YaHei",sans-serif';
    ctx.fillText('NovaMark-Lite', 56, 66);
    ctx.fillStyle = CARD.cyan;
    ctx.font = '600 13px ui-monospace,Consolas,monospace';
    ctx.fillText('SCENE EDITION · 球体环 / 毒蘑菇 / 综合场景', 56, 90);

    var sc = data.results.score || {};
    var grade = sc.grade || { letter: '-', label: '', color: CARD.muted };

    // 总分
    ctx.fillStyle = CARD.muted;
    ctx.font = '600 14px -apple-system,"Segoe UI","Microsoft YaHei",sans-serif';
    ctx.fillText('综合得分', 56, 172);
    var g2 = ctx.createLinearGradient(56, 200, 420, 300);
    g2.addColorStop(0, '#ffffff');
    g2.addColorStop(0.55, CARD.cyan);
    g2.addColorStop(1, CARD.violet);
    ctx.fillStyle = g2;
    ctx.font = '800 108px ui-monospace,Consolas,monospace';
    ctx.fillText(sc.total === null || sc.total === undefined ? '—' : String(Math.round(sc.total)), 52, 282);

    ctx.fillStyle = grade.color;
    ctx.font = '800 44px -apple-system,"Segoe UI",sans-serif';
    ctx.fillText(grade.letter || '-', 56, 350);
    ctx.fillStyle = CARD.muted;
    ctx.font = '600 18px -apple-system,"Segoe UI","Microsoft YaHei",sans-serif';
    ctx.fillText(grade.label || '', 110, 348);

    // GPU 与设备
    var gpuName = (data.gpu && data.gpu.match && data.gpu.match.gpu && data.gpu.match.gpu.name) ||
      (data.gpu && data.gpu.displayName) || '未知 GPU';
    ctx.fillStyle = CARD.text;
    ctx.font = '700 30px -apple-system,"Segoe UI","Microsoft YaHei",sans-serif';
    ctx.fillText(clipText(ctx, gpuName, 640), 56, 420);

    ctx.fillStyle = CARD.muted;
    ctx.font = '400 15px -apple-system,"Segoe UI","Microsoft YaHei",sans-serif';
    var dev = data.device || {};
    var line1 = ((dev.browser && (dev.browser.name + ' ' + dev.browser.version)) || '-') + ' · ' +
      ((dev.os && (dev.os.name + ' ' + dev.os.version)) || '-');
    ctx.fillText(clipText(ctx, line1, 640), 56, 448);
    var line2 = (data.config && data.config.backendLabel || '-') + ' · ' + (data.config && data.config.resolution || '-') +
      ' · ' + (data.config && data.config.presetName || '-');
    ctx.fillText(clipText(ctx, line2, 640), 56, 472);
    if (sc.total !== null && data.results && data.results.comparison && data.results.comparison.self) {
      ctx.fillStyle = CARD.cyan;
      ctx.fillText('理论指数 ' + fmt.int(data.results.comparison.self.index) + ' · 数据库 ' + data.results.comparison.dbSize + ' 款设备', 56, 496);
    }

    // 左侧维度条
    var dims = (sc.dimensions || []).slice(0, 6);
    var bx = 56, by = 540, bw = 470, bh = 9;
    dims.forEach(function (d, i) {
      var y = by + i * 0;
    });
    // 用两列布局画维度条
    dims.forEach(function (d, i) {
      var col = i % 2, row = Math.floor(i / 2);
      var x = bx + col * 250, y = 540 + row * 34;
      ctx.fillStyle = CARD.muted;
      ctx.font = '500 12px -apple-system,"Segoe UI","Microsoft YaHei",sans-serif';
      ctx.fillText(d.name, x, y);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(x, y + 6, 200, 6);
      var w = d.score === null ? 0 : Math.max(0, Math.min(100, d.score)) / 100 * 200;
      var gr = ctx.createLinearGradient(x, 0, x + 200, 0);
      gr.addColorStop(0, CARD.cyan);
      gr.addColorStop(1, CARD.violet);
      ctx.fillStyle = gr;
      ctx.fillRect(x, y + 6, w, 6);
      ctx.fillStyle = CARD.text;
      ctx.font = '600 12px ui-monospace,Consolas,monospace';
      ctx.fillText(d.score === null ? 'N/A' : fmt.num(d.score, 1), x + 208, y + 12);
    });

    // 右侧：关键实测帧率 —— 三个场景子项各一行，综合场景再逐段展开
    var scene = findResult(data, 'scene');
    var rx = 640, ry = 132;
    var kvs = [];
    (sc.dimensions || []).forEach(function (d) {
      (d.parts || []).forEach(function (p) {
        if (p.id === 'scene') return;                 // 综合场景改在下面按段展开
        if (p.metric === null || p.metric === undefined) return;
        kvs.push([p.name, metricText(p)]);
      });
    });
    if (scene && scene.meta) {
      kvs.push(['综合场景平均帧率', fmt.num(scene.meta.fpsAvg, 1) + ' FPS']);
      kvs.push(['综合场景 1% Low', fmt.num(scene.meta.fps1Low, 1) + ' FPS']);
      var segs0 = scene.meta.segments || [];
      for (var si = 0; si < segs0.length; si++) {
        kvs.push(['  ↳ ' + segs0[si].name, fmt.num(segs0[si].fps, 1) + ' FPS']);
      }
    }
    // 数值面板：加底衬 + 斑马纹 + 右对齐等宽数字，远看也能读清
    var rw = 470;
    ctx.fillStyle = CARD.panel;
    ctx.fillRect(rx - 18, ry - 26, rw + 36, 26 + kvs.length * 32 + 10);
    ctx.fillStyle = CARD.heading;
    ctx.font = '700 14px -apple-system,"Segoe UI","Microsoft YaHei",sans-serif';
    ctx.fillText('关键实测帧率', rx, ry);
    kvs.forEach(function (kv, i) {
      var y = ry + 30 + i * 32;
      if (i % 2 === 1) {
        ctx.fillStyle = CARD.rowA;
        ctx.fillRect(rx - 18, y - 20, rw + 36, 30);
      }
      ctx.fillStyle = CARD.label;
      ctx.font = '500 13.5px -apple-system,"Segoe UI","Microsoft YaHei",sans-serif';
      ctx.fillText(kv[0], rx, y);
      ctx.fillStyle = CARD.value;
      ctx.font = '700 16px ui-monospace,Consolas,monospace';
      var val = kv[1];
      ctx.fillText(val, rx + rw - ctx.measureText(val).width, y);
    });

    // 底部
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath(); ctx.moveTo(56, 620); ctx.lineTo(W - 56, 620); ctx.stroke();
    ctx.fillStyle = CARD.dim;
    ctx.font = '400 11.5px ui-monospace,Consolas,monospace';
    ctx.fillText((data.id || '') + '  ·  ' + (data.hash ? data.hash.slice(0, 32) : '') + '  ·  ' + fmt.date(data.timestamp || Date.now()), 56, 642);
    var verText = String(data.version || '');
    ctx.fillText(/^NovaMark/i.test(verText) ? verText : ('NovaMark-Lite ' + verText), W - 200, 642);

    // 版权标识：成绩单长图会被转发传播，版权必须画进图里
    ctx.fillStyle = 'rgba(255,255,255,0.46)';
    ctx.font = '600 12px -apple-system,"Segoe UI","Microsoft YaHei",sans-serif';
    ctx.fillText('版权所有 © 2026 CR_527 · NovaMark · All Rights Reserved', 56, 666);
    ctx.fillStyle = 'rgba(255,255,255,0.26)';
    ctx.font = '400 10.5px -apple-system,"Segoe UI","Microsoft YaHei",sans-serif';
    ctx.fillText('转载、引用或用于评测发布请注明来源「NovaMark / CR_527」；商业用途须事先取得著作权人书面授权。', 56, 683);

    return cv;
  }

  function clipText(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    var s = text;
    while (s.length > 4 && ctx.measureText(s + '…').width > maxWidth) s = s.slice(0, -1);
    return s + '…';
  }

  function buildExportBar(data, onShare) {
    return el('div', { class: 'row wrap no-print', style: { gap: '10px' } }, [
      el('button', { class: 'btn primary', onclick: function () { downloadText(plainReport(data), 'NovaMark-Lite-' + (data.id || 'report') + '.txt'); } }, ['下载文本报告']),
      el('button', { class: 'btn', onclick: function () { downloadJSON(data); } }, ['下载 JSON']),
      el('button', { class: 'btn', onclick: function () { downloadCardPNG(data); } }, ['导出成绩单长图']),
      el('button', { class: 'btn', onclick: function () { window.print(); } }, ['打印 / 存为 PDF']),
      el('button', { class: 'btn ghost', onclick: function () {
        var url = shareUrl(data);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () { if (onShare) onShare('分享链接已复制到剪贴板', 'ok'); },
            function () { if (onShare) onShare(url, 'info'); });
        } else if (onShare) onShare(url, 'info');
      } }, ['复制分享链接']),
      el('button', { class: 'btn ghost', onclick: function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(plainReport(data)).then(function () { if (onShare) onShare('文本报告已复制', 'ok'); });
        } else if (onShare) onShare('当前环境不支持剪贴板', 'bad');
      } }, ['复制文本报告'])
    ]);
  }

  /* ------------------------------ 下载 ------------------------------ */

  function triggerDownload(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 500);
  }

  function downloadText(text, filename) {
    triggerDownload(new Blob([text], { type: 'text/plain;charset=utf-8' }), filename);
  }

  function downloadJSON(data) {
    var out = {
      generator: 'NovaMark-Lite ' + (data.version || ''),
      edition: 'Lite（NovaMark-Lite：球体环 / 毒蘑菇 Volume Shader BM / 四段综合场景；不含微基准）',
      // 版权字段必须始终保留（本版同样是强制声明）
      copyright: '版权所有 © 2026 CR_527. All Rights Reserved.',
      copyrightNote: 'NovaMark 的全部源代码、着色器、测试负载、评分模型、界面设计与文档的著作权归 CR_527 所有；' +
        '转载、引用或用于评测发布时请保留本声明并注明来源「NovaMark / CR_527」；商业用途须事先取得授权。',
      id: data.id, hash: data.hash, timestamp: data.timestamp,
      config: data.config,
      device: data.device,
      gpu: data.gpu,
      results: data.results
    };
    triggerDownload(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json;charset=utf-8' }),
      'NovaMark-Lite-' + (data.id || 'report') + '.json');
  }

  function downloadCardPNG(data) {
    var cv = renderCard(data);
    if (cv.toBlob) {
      cv.toBlob(function (blob) {
        if (blob) triggerDownload(blob, 'NovaMark-Lite-' + (data.id || 'card') + '.png');
      }, 'image/png');
    } else {
      var url = cv.toDataURL('image/png');
      var a = document.createElement('a');
      a.href = url; a.download = 'NovaMark-Lite-' + (data.id || 'card') + '.png';
      a.click();
    }
  }

  /* ------------------------------ 导出接口 ------------------------------ */

  Nova.report = {
    build: build,
    buildComparison: buildComparison,
    specIndex: specIndex,
    plainReport: plainReport,
    renderCard: renderCard,
    buildExportBar: buildExportBar,
    downloadText: downloadText,
    downloadJSON: downloadJSON,
    downloadCardPNG: downloadCardPNG,
    triggerDownload: triggerDownload,
    shareUrl: shareUrl,
    parseShare: parseShare,
    compact: compact,
    findResult: findResult,
    REF_SPECS: REF_SPECS
  };

})(window);
