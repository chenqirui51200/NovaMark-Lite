/* ============================================================================
 * NovaMark-Lite · 评分 / 归一化 / 诊断模型
 *
 * 与完整版的区别：本版**只保留「场景类」测试**，共三个：
 *   ring  球体环（原版最简场景） / vsbm  毒蘑菇（Volume Shader BM） / scene 综合测试（四段序列）
 * 全部**微基准**（填充率 / 几何 / 纹理 / 着色器 ALU / 矩阵乘 / 带宽 / 上传 / 回读 /
 * 延迟 / 提交吞吐）仍然不在本版范围内，因此维度只剩一个。
 *
 * 设计要点：
 *  1) 打分曲线 s = 100 · x / (x + x_base)  —— 论文风格饱和曲线。
 *     基线设备（x = x_base）恰好得 50 分，且分数天然落在 (0, 100)，无需截断。
 *  2) 只有一个维度「综合场景」（权重 1.0），含 ring / vsbm / scene 三个子项，
 *     维度分 = 三个子项分的加权几何平均（权重各 1），防止单点虚高掩盖短板。
 *  3) 总分 = 20 · 维度分。基线设备（GTX 1060 6GB 级：ring 365 / vsbm 176 / scene 147 FPS）
 *     三项各 50 分 → 几何平均 50 → 恰好 1000 分。
 *  4) 稳定性（稳定性压力测试 / 帧时间）单独成项，不影响 total。
 *  5) 绝对值指数只做「硬件爱好者对照」，不进总分。
 *
 * 约束：零依赖、经典脚本（无 import/export）、不访问 DOM、无 console.log、
 *      除 setBaseline 外全部为纯函数，任何非法输入都不抛异常。
 * ==========================================================================*/
(function (global) {
  'use strict';

  var Nova = global.Nova = global.Nova || {};

  /* ---------- 对 Nova.util 的容错引用（util 未加载时也要能跑） ---------- */

  var U = Nova.util || (Nova.util = {});

  /** 兜底工具：任何情况下都不抛异常 */
  function hasU() { return !!(U && U.stats && typeof U.stats.mean === 'function'); }
  function cclamp(v, lo, hi) {
    if (typeof U.clamp === 'function') return U.clamp(v, lo, hi);
    return v < lo ? lo : (v > hi ? hi : v);
  }

  /** 有限数字判定（NaN / Infinity / 非数字 / null / undefined 全部为 false） */
  function isFin(v) { return typeof v === 'number' && isFinite(v); }

  /** 安全取数：不能转成有限数字时返回 null */
  function numOrNull(v) {
    if (v === null || v === undefined || v === '') return null;
    var n = +v;
    return isFin(n) ? n : null;
  }

  /* 小工具集（优先用 Nova.util.stats / fmt，运行时惰性取，确保 util 后加载也生效） */

  function stMean(a) {
    if (hasU()) return U.stats.mean(a);
    if (!a || !a.length) return NaN;
    var s = 0;
    for (var i = 0; i < a.length; i++) s += a[i];
    return s / a.length;
  }
  function stMedian(a) {
    if (hasU()) return U.stats.median(a);
    if (!a || !a.length) return NaN;
    var b = a.slice().sort(function (x, y) { return x - y; });
    var m = b.length >> 1;
    return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2;
  }
  function stStd(a) {
    if (hasU()) return U.stats.std(a);
    if (!a || a.length < 2) return 0;
    var m = stMean(a), s = 0;
    for (var i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m);
    return Math.sqrt(s / (a.length - 1));
  }
  function stPct(a, p) {
    if (hasU()) return U.stats.percentile(a, p);
    if (!a || !a.length) return NaN;
    var b = a.slice().sort(function (x, y) { return x - y; });
    if (b.length === 1) return b[0];
    var idx = (b.length - 1) * cclamp(p, 0, 1);
    var lo = Math.floor(idx), hi = Math.ceil(idx);
    return b[lo] + (b[hi] - b[lo]) * (idx - lo);
  }
  function stLowFps(times, ratio) {
    if (hasU()) return U.stats.lowFps(times, ratio);
    if (!times || times.length < 10) return NaN;
    var s = times.slice().sort(function (a, b) { return b - a; });
    var n = Math.max(1, Math.floor(s.length * ratio));
    var m = stMean(s.slice(0, n));
    return m > 0 ? 1000 / m : NaN;
  }
  function stSlope(ys) {
    if (hasU()) return U.stats.slope(ys);
    var n = ys.length;
    if (n < 2) return 0;
    var sx = 0, sy = 0, sxy = 0, sxx = 0;
    for (var i = 0; i < n; i++) { sx += i; sy += ys[i]; sxy += i * ys[i]; sxx += i * i; }
    var den = n * sxx - sx * sx;
    return den === 0 ? 0 : (n * sxy - sx * sy) / den;
  }
  /** 数字格式化，非法值给 '—' */
  function fnum(v, d) {
    if (U.fmt && typeof U.fmt.num === 'function') return U.fmt.num(v, d);
    if (!isFin(v)) return '—';
    return Number(v).toFixed(d === undefined ? 2 : d);
  }

  /* ==========================================================================
   * 1. 基线常量 + 元数据表
   * ========================================================================*/

  /**
   * 参考机基线 x_base（该设备每一项应得 50 分 / 总分 1000 分）。
   * 数值单位与测试的 metric 单位一致（即测试输出单位）。
   *
   * 【2026-10-03 重新标定 · 口径：墙钟（含 ctx.sync() 同步开销）】
   * 综合场景原来优先用 GPU 时间戳定帧时间，它只统计 GPU 忙的时间、不含每窗口同步
   * 往返期间 GPU 的空转，轻负载段会把帧率报成实际产出（frames ÷ elapsed）的近 2 倍。
   * 口径改成墙钟后实测帧率下降约一半，因此**两套基线都必须按新口径重标**，
   * 否则参考机会被旧尺子量成 300 分左右（用户实际看到的现象）。
   *
   * 标定条件（参考机 NVIDIA P106-100 = GTX 1060 6GB 同芯片，Chrome / Windows 11）：
   *   · ring：1200ms 预热 + 5s 测量窗口
   *   · vsbm：三档各 2.5s（levelScale 1.0）
   *   · scene：四段序列 segmentScale 0.3（约 2.4/3.6/4.5/5.1s），900ms 预热
   * 用上述条件实测时参考机三项各得 50 分、总分 1000。换预设/换机器都会整体偏移。
   *
   * 本版三个测试项都是场景类负载：ring / vsbm / scene。
   * 全部微基准（fill / geometry / texture / … / submit）仍然不在本版范围内。
   */
  var BASELINE = {
    scene: 151.37,    // FPS（四段场景序列整体平均；墙钟口径，两个后端同源）
    vsbm: 228.23,     // FPS（毒蘑菇三档整体平均，档位压力约为原版的 60%/80%/99%）
    ring: 573.78      // FPS（原版球体环最简场景：288k 三角形 / 900 实例 / 单几何 pass）
  };

  /**
   * 基线版本标记。
   * 数值是在一台 GTX 1060 6GB 级别（NVIDIA P106-100）的机器上，
   * 用 Chrome / Windows 11 实测标定的，因此该级别设备在理想环境下总分应落在 1000 分附近。
   * 换机器、换后端、换浏览器都可能整体偏移，建议用自己的机器做一次校准：
   *   Nova.score.setBaseline({ ring: 实测值, vsbm: 实测值, scene: 实测值, baselineVersion: '1.5-my-machine' });
   *
   * 版本号必须跟着口径走：1.3 及以前是「GPU 时间戳」口径，1.4 起是「墙钟（含 sync）」
   * 口径 —— 同一个数字在两套刻度下含义不同，不能混着比。
   * 后缀 -ringfix：WebGL2 综合场景第一段（ring）此前主体几何被驱动整条丢弃
   * （见 tests/scene.js 的 whiteDepth 说明），补齐后负载才是完整值，故重标一版。
   */
  var BASELINE_VERSION = '1.4-wallclock-ringfix-p106-20261003';

  /**
   * id → 元数据。weight 为该测试在**自有维度内**的相对权重（默认相等）。
   * 本版三个测试项在唯一的「综合场景」维度内权重相同（各 1）。
   */
  var META = {
    scene: { name: '综合场景 / 游戏负载（四段序列）', group: 'scene', unit: 'FPS', lowerIsBetter: false, weight: 1 },
    vsbm: { name: '毒蘑菇低压力测试（Volume Shader BM）', group: 'scene', unit: 'FPS', lowerIsBetter: false, weight: 1 },
    ring: { name: '球体环（原版最简场景）', group: 'scene', unit: 'FPS', lowerIsBetter: false, weight: 1 }
  };

  /**
   * 合并式覆盖基线。外部校准（用已知型号反算）时调用。
   * @param {object} obj 例如 { fill: 52, bandwidth: 190, baselineVersion: '1.1-calibrated' }
   * @returns {boolean} 是否成功（至少要覆盖到一个已知 id）
   */
  function setBaseline(obj) {
    if (!obj || typeof obj !== 'object') return false;
    var applied = 0;
    for (var k in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
      if (k === 'baselineVersion') {
        if (typeof obj[k] === 'string' && obj[k]) BASELINE_VERSION = obj[k];
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(BASELINE, k)) continue;  // 未知 id 忽略
      var v = numOrNull(obj[k]);
      if (v === null || v <= 0) continue;                                // 基线必须为正有限数
      BASELINE[k] = v;
      applied++;
    }
    return applied > 0;
  }

  /* ==========================================================================
   * 2. 维度定义
   * ========================================================================*/

  /**
   * 本版只有一个维度「综合场景」，权重之和 = 1；
   * 它包含三个场景类子项：球体环（ring）、毒蘑菇（vsbm）、综合测试（scene）。
   * 维度分 = 三个子项分的**加权几何平均**（权重各 1），因此基线设备三项各 50 分、
   * 几何平均仍是 50 → 总分 20 × 50 = 1000。
   * 稳定性（stability）仍然单独成项，不在其中、也不进总分。
   */
  var DIMENSIONS = [
    { id: 'scene', name: '综合场景', weight: 1.0, ids: ['ring', 'vsbm', 'scene'] }
  ];

  /**
   * 测试 id 归一化：容忍 'scene-test' / 'bench:fill' / 'test_fill' 等写法。
   * 规则：小写 → 去掉前缀 test/bench → 剥离非字母数字 → 去掉 scene 的测试后缀。
   */
  function canonId(id) {
    if (id === null || id === undefined) return '';
    var s = String(id).toLowerCase().replace(/[^a-z0-9]/g, '');
    s = s.replace(/^(test|bench)+/, '');
    if (s.indexOf('scene') === 0) s = 'scene';
    return s;
  }

  /** id → 维度定义 */
  function dimensionOf(id) {
    var c = canonId(id);
    if (!c) return null;
    for (var i = 0; i < DIMENSIONS.length; i++) {
      if (DIMENSIONS[i].ids.indexOf(c) >= 0) return DIMENSIONS[i];
    }
    return null;
  }

  /**
   * 分后端基线覆盖。
   *
   * 为什么必须分开：两个后端的**测量机制根本不同** ——
   *   WebGPU：GPU 时间戳查询（timestamp-query），测的是 GPU 侧真实耗时；
   *   WebGL2：墙钟 + readPixels 同步，在部分设备/项目上无法保证等到 GPU 完成。
   * 同一台机器上，同一套场景 WebGPU 报 196 FPS、WebGL2 报 443 FPS（2.3 倍差）。
   * 用同一套基线，等于强迫两个不同的尺子去量同一个刻度，分数必然失真。
   *
   * 表里没列到的后端沿用上面的通用 BASELINE（那套是按 WebGPU 实测标定的）。
   */
  var BASELINE_BY_BACKEND = {
    webgl2: {
      // 在参考机（GTX 1060 级 / P106-100）上用 WebGL2 后端、**墙钟口径**实测标定
      // （与上面 BASELINE 同一场次、同一批预设）。
      // WebGL2 的同步（围栏分片轮询 + 1 像素回读）比 WebGPU 的 mapAsync 贵得多，
      // 而且这部分开销是真实占用主线程/GPU 的，所以同一台机器上 WebGL2 的
      // 实测帧率反而可能低于 WebGPU —— 两套基线必须各用各的，不能跨后端比分数。
      // 注意：readPixels 同步在部分设备（尤其 iOS Safari）上不会真正等到 GPU 完成，
      // 那类设备上 WebGL2 实测值仍会系统性偏高；这套基线只保证**同一后端内部**的相对可比性。
      ring: 123.73,
      vsbm: 120.27,
      scene: 145.78
    }
  };

  /** 结果 id → 基线 / 元数据（id 归一化 + META 兜底） */
  function baselineOf(id, backend) {
    var c = canonId(id);
    if (!c) return { id: '', value: null, meta: null, lowerIsBetter: false, weight: 1 };
    var meta = Object.prototype.hasOwnProperty.call(META, c) ? META[c] : null;
    var lib = meta && meta.library ? meta.library : c;          // 预留：允许 META 指向别的基线键
    var value = Object.prototype.hasOwnProperty.call(BASELINE, lib) ? BASELINE[lib] : null;
    // 分后端覆盖优先：两个后端的测量口径不同，不能共用一套基线
    var bk = backend && /webgl/i.test(String(backend)) ? 'webgl2' : (backend ? 'webgpu' : null);
    if (bk && BASELINE_BY_BACKEND[bk] && Object.prototype.hasOwnProperty.call(BASELINE_BY_BACKEND[bk], lib)) {
      value = BASELINE_BY_BACKEND[bk][lib];
    }
    return {
      id: c,
      value: value,
      meta: meta,
      lowerIsBetter: meta ? !!meta.lowerIsBetter : false,
      weight: meta && isFin(meta.weight) && meta.weight > 0 ? meta.weight : 1
    };
  }

  /* ==========================================================================
   * 3. 单项打分
   * ========================================================================*/

  /**
   * 单项满分曲线。
   *   越高越好：s = 100 · x / (x + x_base)      —— x = x_base 时为 50
   *   越低越好：s = 100 · x_base / (x + x_base) —— x = x_base 时为 50
   * @returns {number|null} null 表示不可评分（样本无效 / 基线缺失 / 数值非法）
   */
  function partScore(x, xBase, lowerIsBetter) {
    var v = numOrNull(x), b = numOrNull(xBase);
    if (v === null || b === null) return null;
    if (b <= 0) return null;                                   // 基线必须为正
    if (v < 0) v = 0;                                          // 负测量值按 0 处理
    if (lowerIsBetter) return 100 * b / (v + b);
    return 100 * v / (v + b);
  }

  /** 判断单个测试结果是否「可用于评分」 */
  function isUsable(r) {
    if (!r || typeof r !== 'object') return false;
    if (r.valid === false) return false;                       // CV 过大等被标记为无效
    if (typeof r.status === 'string' && r.status !== 'done') return false;  // skipped / failed / pending
    if (numOrNull(r.metric) === null) return false;
    return true;
  }

  /* ==========================================================================
   * 4. dimensions —— 维度分 + 总分 + 等级
   * ========================================================================*/

  var GRADE_TABLE = [
    { min: 2200, letter: 'S', label: '旗舰级', color: '#22d3ee', desc: '旗舰级水准，可高画质高帧率驾驭全部主流 3A 大作与重负载创作场景。' },
    { min: 1500, letter: 'A', label: '高端', color: '#a3e635', desc: '高端独显水平，可流畅运行主流 3A 大作的高画质设置。' },
    { min: 1000, letter: 'B', label: '主流', color: '#fbbf24', desc: '主流独显水平，中高画质下可稳定流畅运行绝大多数 3A 大作。' },
    { min: 600, letter: 'C', label: '入门', color: '#fb923c', desc: '入门级水平，适合电竞网游与 3A 大作的中低画质设置。' },
    { min: -Infinity, letter: 'D', label: '基础', color: '#f87171', desc: '基础水平，建议以电竞网游、轻度创作与日常办公为主。' }
  ];

  /**
   * 按 total 取等级。total 非法时返回最低档并给予说明。
   */
  function gradeOf(total) {
    var t = numOrNull(total);
    for (var i = 0; i < GRADE_TABLE.length; i++) {
      if (t !== null && t >= GRADE_TABLE[i].min) {
        return {
          letter: GRADE_TABLE[i].letter, label: GRADE_TABLE[i].label,
          color: GRADE_TABLE[i].color, desc: GRADE_TABLE[i].desc, min: GRADE_TABLE[i].min
        };
      }
    }
    return {
      letter: 'D', label: '基础', color: '#f87171',
      desc: GRADE_TABLE[GRADE_TABLE.length - 1].desc, min: 0
    };
  }

  /** 加权几何平均：exp(Σ w·ln s / Σ w)；任一有效项为 0 则整体为 0 */
  function weightedGeoMean(parts) {
    var wsum = 0, acc = 0, n = 0;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (!p || p.score === null || !isFin(p.score)) continue;
      if (p.score <= 0) return 0;                              // 有一项挂零 → 维度挂零
      var w = isFin(p.weight) && p.weight > 0 ? p.weight : 1;
      if (w <= 0) continue;
      acc += w * Math.log(p.score);
      wsum += w;
      n++;
    }
    if (n === 0 || wsum <= 0) return null;
    return Math.exp(acc / wsum);
  }

  /** 置信度：有效项覆盖率（0.75）+ 样本波动（0.25） */
  function confidenceOf(validParts, totalParts, results) {
    var cover = totalParts > 0 ? cclamp(validParts / totalParts, 0, 1) : 0;
    var parts = [], i;
    if (results && results.length) {
      for (i = 0; i < results.length; i++) {
        var r = results[i] || {};
        if (!isUsable(r)) continue;
        var cv = numOrNull(r.cv);
        parts.push(cv === null || cv < 0 ? 0.5 : cv);          // CV 未知按中等波动记
      }
    }
    var cvMean = parts.length ? stMean(parts) : 0.5;
    var noise;
    if (cvMean <= 0.02) noise = 1;
    else if (cvMean >= 0.15) noise = 0.3;
    else noise = 1 - (cvMean - 0.02) / 0.13 * 0.7;
    return Math.round(cclamp(0.75 * cover + 0.25 * noise, 0, 1) * 1000) / 1000;
  }

  /** 四位有效数字取整（例如 1000 / 1246 / 1004） */
  function sig4(v) {
    if (!isFin(v)) return null;
    if (v === 0) return 0;
    var mag = Math.floor(Math.log(Math.abs(v)) / Math.LN10);
    var f = Math.pow(10, 3 - mag);
    return Math.round(v * f) / f;
  }

  /**
   * 计算维度分、总分、等级。
   *
   * 本版只有「综合场景」一个维度（权重 1.0），它由三个场景类子项组成
   * （ring 球体环 / vsbm 毒蘑菇 / scene 四段序列），权重各 1：
   *   子项得分 s_i = 100 · fps_i / (fps_i + BASELINE[i])
   *   维度得分 S   = exp( Σ ln s_i / 3 )        —— 三个子项的几何平均
   *   总分         = 20 × S
   * 基线设备三项各 50 分 → S = 50 → 总分恰好 1000。
   * 某个子项被跳过/失败时不参与几何平均，权重在有效子项间重新归一化。
   *
   * @param {Array} results 测试结果数组（engine.runTest / runCustom 的返回值）
   * @param {object} [deviceInfo] 设备信息（当前不参与计分，保留接口）
   */
  function dimensions(results, deviceInfo) {
    var list = Array.isArray(results) ? results : [];
    var used = {}, totalParts = 0, validParts = 0, i, j;

    // 分后端基线：结果里带 backend 字段。WebGPU 与 WebGL2 的测量口径不同，
    // 必须各用各的基线，否则两个后端会被同一把尺子量出系统性偏差。
    var backendHint = null;
    for (i = 0; i < list.length; i++) {
      if (list[i] && list[i].backend) { backendHint = list[i].backend; break; }
    }

    // id → 结果（归一化后），重复 id 时以第一个可用结果为准
    var byId = {};
    for (i = 0; i < list.length; i++) {
      var r = list[i];
      if (!r || typeof r !== 'object') continue;
      var c = canonId(r.id);
      if (!c) continue;
      totalParts++;
      if (!byId[c] || (!isUsable(byId[c]) && isUsable(r))) byId[c] = r;
      if (isUsable(r)) validParts++;
    }

    var dims = [];
    for (i = 0; i < DIMENSIONS.length; i++) {
      var def = DIMENSIONS[i];
      var parts = [], weightSum = 0, k;

      for (j = 0; j < def.ids.length; j++) {
        var pid = def.ids[j];
        used[pid] = true;
        var res = byId[pid] || null;
        var base = baselineOf(pid, (res && res.backend) || backendHint);
        var meta = base.meta || {};
        var plannedW = base.weight;
        var score = null;
        var status = res ? (res.status || 'pending') : 'missing';
        var metric = res ? numOrNull(res.metric) : null;
        var note = null;
        var usable = isUsable(res);

        if (!res) {
          note = '未执行该测试';
        } else if (status === 'skipped') {
          note = res.reason || '环境不支持，已跳过';
        } else if (status === 'failed') {
          note = res.error || res.reason || '测试失败';
        } else if (res.valid === false) {
          note = res.reason || '样本无效';
        } else if (metric === null) {
          note = '没有有效数值';
        } else if (base.value === null) {
          note = '缺少基线值，无法评分';
        } else {
          score = partScore(metric, base.value, base.lowerIsBetter);
          if (score === null) note = '数值不可评分';
        }
        if (score !== null) weightSum += plannedW;
        parts.push({
          id: pid,
          name: meta.name || (res && res.name) || pid,
          metric: metric,
          unit: (res && res.unit) || meta.unit || '',
          score: score,
          weight: plannedW,
          status: status,
          note: note
        });
        if (usable) validParts = validParts; // 计数在主循环完成，这里只保持可读性
      }

      // 有效子项权重按比例重新分配（此处记录归一化后的权重，权重和恒为 1）
      var sum = 0, vcount = 0;
      for (k = 0; k < parts.length; k++) {
        if (parts[k].score === null) continue;
        parts[k].weight = weightSum > 0 ? parts[k].weight / weightSum : 0;
        sum += parts[k].weight;
        vcount++;
      }
      // 浮点归一化兜底
      if (sum > 0 && Math.abs(sum - 1) > 1e-12) {
        for (k = 0; k < parts.length; k++) {
          if (parts[k].score !== null) parts[k].weight = parts[k].weight / sum;
        }
      }

      var dscore = vcount > 0 ? weightedGeoMean(parts) : null;
      dims.push({
        id: def.id,
        name: def.name,
        score: dscore,
        weight: def.weight,
        estimated: dscore === null,
        validCount: vcount,
        parts: parts
      });
    }

    // 未归入任何维度的测试：仅提示，不影响分数
    var extras = [];
    for (i = 0; i < list.length; i++) {
      var rr = list[i];
      if (!rr || typeof rr !== 'object') continue;
      var cc = canonId(rr.id);
      if (!cc || used[cc] || extras.indexOf(cc) >= 0) continue;
      extras.push(cc);
    }

    // 总分：对 null 维度按比例归一
    var wSum = 0, wScore = 0, validDims = 0;
    for (i = 0; i < dims.length; i++) {
      if (dims[i].score === null || !isFin(dims[i].score)) continue;
      wSum += dims[i].weight;
      wScore += dims[i].weight * dims[i].score;
      validDims++;
    }
    var total = null;
    if (wSum > 0) total = 20 * (wScore / wSum);
    total = sig4(total) === null ? null : sig4(total);

    var conf = confidenceOf(validParts, totalParts, list);
    var grade = gradeOf(total);

    return {
      dimensions: dims,
      total: total,
      absolute: Math.round(100 * (isFin(total) ? total : 0) / 10) / 10,   // 见下方覆盖说明
      confidence: conf,
      grade: grade,
      baselineVersion: BASELINE_VERSION,
      validParts: validParts,
      totalParts: totalParts,
      validDimensions: validDims,
      unassigned: extras,
      note: total === null
        ? '没有任何维度获得有效分数（全部测试被跳过/失败/无效），总分不可用。'
        : null
    };
  }

  /* ==========================================================================
   * 5. absolute —— 绝对性能指数（不进总分）
   * ========================================================================*/

  /**
   * 绝对指数：1000 表示「正好等于基线设备」。
   *   越高越好：index = 1000 · metric / baseline
   *   越低越好：index = 1000 · baseline / metric
   * @param {object} result 单个测试结果（或 {id, metric} 形式的裸对象）
   * @returns {object} { id, metric, baseline, lowerIsBetter, index, note }
   */
  function absolute(result) {
    var r = result && typeof result === 'object' ? result : {};
    var base = baselineOf(r.id, r.backend);
    var metric = numOrNull(r.metric);
    var out = {
      id: base.id || (r.id === undefined ? '' : String(r.id)),
      metric: metric,
      baseline: base.value,
      lowerIsBetter: base.lowerIsBetter,
      unit: (r.unit) || (base.meta && base.meta.unit) || '',
      index: null,
      note: null
    };
    if (metric === null) { out.note = '没有有效测量值'; return out; }
    if (base.value === null || base.value <= 0) { out.note = '缺少基线值，无法计算绝对指数'; return out; }
    if (metric <= 0) {
      out.index = base.lowerIsBetter ? null : 0;
      out.note = base.lowerIsBetter ? '测量值非正，延迟指数不可计算' : '测量值为 0，绝对指数为 0';
      return out;
    }
    out.index = base.lowerIsBetter
      ? Math.round(1000 * base.value / metric * 10) / 10
      : Math.round(1000 * metric / base.value * 10) / 10;
    return out;
  }

  /** 批量：对结果数组逐个算绝对指数 */
  function absoluteAll(results) {
    var list = Array.isArray(results) ? results : [];
    var out = [];
    for (var i = 0; i < list.length; i++) {
      if (!list[i] || typeof list[i] !== 'object') continue;
      out.push(absolute(list[i]));
    }
    return out;
  }

  /* ==========================================================================
   * 6. efficiency —— 理论达成率（本版已停用）
   * ========================================================================*/

  /**
   * 完整版的「理论达成率」是「微基准实测值 ÷ GPU 公开理论峰值」，
   * 只对 fill / texture / geometry / alu / fp32gemm / fp16 / bandwidth 这些
   * 有明确理论峰值的微基准有意义。
   *
   * 本版保留的三个测试项都是场景类负载（ring / vsbm / scene），
   * 没有可直接对应的单一理论峰值（综合场景是几何 + 粒子 + 体积步进 + 后处理的混合体，
   * 毒蘑菇是纯逐像素的隐式曲面求交，球体环是最简几何提交），
   * 因此这里保留同名同签名的空实现，让上层（suite / report）无需分支即可继续调用。
   *
   * @returns {Array} 恒为空数组
   */
  function efficiency(results, gpuSpecs) {
    return [];
  }

  var EFF_NOTE = '本版只保留场景类测试（球体环 / 毒蘑菇 / 综合场景），不再计算「理论达成率」——' +
    '这三项都没有可直接对应的单一理论峰值（综合场景是多 pass 混合负载，毒蘑菇是逐像素隐式曲面求交，' +
    '球体环是纯几何提交），无法用「实测 ÷ 理论峰值」换算。';

  /* ==========================================================================
   * 7. stability —— 稳定性（对齐 3DMark 口径）
   * ========================================================================*/

  /**
   * @param {Array<number>} rounds 每轮平均 FPS
   */
  function stability(rounds) {
    var list = [];
    if (Array.isArray(rounds)) {
      for (var i = 0; i < rounds.length; i++) {
        var v = numOrNull(rounds[i]);
        if (v !== null && v > 0) list.push(v);
      }
    }
    var n = list.length;
    var blank = {
      stability: null, passed: false, fpsHigh: null, fpsLow: null, decayPct: null,
      verdict: 'fair', rounds: n, fpsSeries: list.slice(),
      percentiles: { p10: null, p50: null, p90: null },
      note: null
    };
    if (n === 0) {
      blank.note = '没有有效的每轮 FPS 数据，稳定性无法评估。';
      return blank;
    }

    var high = list[0], low = list[0];
    for (var k = 1; k < n; k++) {
      if (list[k] > high) high = list[k];
      if (list[k] < low) low = list[k];
    }
    var stab = high > 0 ? cclamp(low / high * 100, 0, 100) : null;
    var passed = stab !== null && stab >= 97 && n >= 20;
    var mean = stMean(list);
    var slope = n >= 2 ? stSlope(list) : 0;
    var decay = (isFin(slope) && isFin(mean) && mean !== 0) ? (slope * (n - 1) / mean * 100) : 0;
    var p = {
      p10: stPct(list, 0.10), p50: stPct(list, 0.50), p90: stPct(list, 0.90)
    };
    var verdict = stab === null ? 'poor'
      : (stab >= 97 ? 'excellent' : (stab >= 90 ? 'good' : (stab >= 80 ? 'fair' : 'poor')));
    var note;
    if (n < 20) note = '只有 ' + n + ' 轮数据（建议 20 轮），不足以判定通过 97% 稳定性门槛。';
    else if (passed) note = '最低轮次 FPS 不低于最高轮次的 97%，达到 3DMark 稳定性通过口径。';
    else note = '最低轮次 FPS 仅为最高轮次的 ' + fnum(stab, 1) + '%，低于 97% 门槛。';
    if (decay < -1) note += '整体呈衰减趋势（' + fnum(decay, 2) + '%），可能存在积热降频。';

    return {
      stability: stab === null ? null : Math.round(stab * 100) / 100,
      passed: passed,
      fpsHigh: high,
      fpsLow: low,
      decayPct: Math.round(decay * 100) / 100,
      verdict: verdict,
      rounds: n,
      fpsSeries: list.slice(),   // 逐轮 FPS，供报告画折线
      percentiles: {
        p10: isFin(p.p10) ? Math.round(p.p10 * 100) / 100 : null,
        p50: isFin(p.p50) ? Math.round(p.p50 * 100) / 100 : null,
        p90: isFin(p.p90) ? Math.round(p.p90 * 100) / 100 : null
      },
      note: note
    };
  }

  /* ==========================================================================
   * 8. frameStats —— 帧时间统计
   * ========================================================================*/

  /**
   * @param {Array<number>} frameTimesMs 逐帧耗时（毫秒）
   */
  function frameStats(frameTimesMs) {
    var times = [];
    if (Array.isArray(frameTimesMs)) {
      for (var i = 0; i < frameTimesMs.length; i++) {
        var v = numOrNull(frameTimesMs[i]);
        if (v !== null && v > 0) times.push(v);                 // 过滤 <=0 / 非有限值
      }
    }
    var out = {
      n: times.length, avg: null, median: null, p95: null, p99: null, max: null,
      fpsAvg: null, fps1Low: null, fps01Low: null, jitter: null, smoothness: null,
      note: null
    };
    if (!times.length) {
      out.note = '没有有效帧时间样本（全部为非正或非有限值），统计不可用。';
      return out;
    }

    var mean = stMean(times);
    var median = stMedian(times);
    var p99 = stPct(times, 0.99);
    var sd = stStd(times);
    out.avg = Math.round(mean * 1000) / 1000;
    out.median = Math.round(median * 1000) / 1000;
    out.p95 = Math.round(stPct(times, 0.95) * 1000) / 1000;
    out.p99 = Math.round(p99 * 1000) / 1000;
    out.max = Math.round(Math.max.apply(null, times) * 1000) / 1000;
    out.fpsAvg = mean > 0 ? Math.round(1000 / mean * 100) / 100 : null;
    var l1 = stLowFps(times, 0.01), l01 = stLowFps(times, 0.001);
    out.fps1Low = isFin(l1) ? Math.round(l1 * 100) / 100 : null;
    out.fps01Low = isFin(l01) ? Math.round(l01 * 100) / 100 : null;
    out.jitter = mean > 0 ? Math.round(sd / mean * 10000) / 10000 : null;

    if (times.length < 10) {
      out.note = '样本少于 10 帧，1% low / 0.1% low 不可靠（已给出空值）。';
    }
    if (median > 0 && isFin(p99)) {
      var ratio = p99 / median;
      out.smoothness = Math.round(cclamp(100 - (ratio - 1) * 55, 0, 100) * 100) / 100;
      out.p99OverMedian = Math.round(ratio * 1000) / 1000;
    } else {
      out.smoothness = null;
    }
    return out;
  }

  /* ==========================================================================
   * 9. diagnose —— 诊断结论
   * ========================================================================*/

  function item(level, title, detail, icon) {
    return { level: level, title: title, detail: detail, icon: icon || '' };
  }

  /** 从结果数组里按 id 取可用结果的 metric */
  function metricOf(results, id, validOnly) {
    var list = Array.isArray(results) ? results : [];
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (!r || typeof r !== 'object') continue;
      if (canonId(r.id) !== id) continue;
      if (validOnly !== false && !isUsable(r)) continue;
      return numOrNull(r.metric);
    }
    return null;
  }

  /**
   * 综合诊断。
   * @param {Array} results 测试结果
   * @param {object} deviceInfo Nova.detect.collect() 的结果（可为 null）
   * @param {object|null} gpuSpecs 匹配到的 GPU 参考规格（可为 null）
   * @param {object} [extra] { sceneFps, refreshRateHz, frameStats, stability, dimensions, backend, total, confidence }
   * @returns {Array} [{ level, title, detail, icon }]
   */
  function diagnose(results, deviceInfo, gpuSpecs, extra) {
    var out = [];
    var list = Array.isArray(results) ? results : [];
    var d = deviceInfo && typeof deviceInfo === 'object' ? deviceInfo : {};
    var flags = d.flags || {};
    var hw = d.hardware || {};
    var wg = d.webgl || {};
    var gp = d.webgpu || {};
    var ex = extra && typeof extra === 'object' ? extra : {};
    var i;

    var rendererText = [wg.unmaskedRenderer, wg.renderer, wg.unmaskedVendor, wg.vendor].filter(Boolean).join(' ');
    var gpuText = gp.info ? [gp.info.vendor, gp.info.architecture, gp.info.device, gp.info.description].filter(Boolean).join(' ') : '';
    var softwareRe = /swiftshader|llvmpipe|softpipe|basic render|basicrender|microsoft basic|software (adapter|rasterizer)|mesa offscreen/i;
    var isSoftware = !!flags.softwareRenderer || softwareRe.test(rendererText) || softwareRe.test(gpuText);

    /* --- 规则 1：软件渲染 --- */
    if (isSoftware) {
      out.push(item('bad', '检测到软件光栅化',
        '渲染器标识为「' + (rendererText || gpuText || '未知') + '」，命中 SwiftShader / llvmpipe / Basic Render 等软件实现。' +
        '所有测试实际跑在 CPU 上，本次成绩不代表真实 GPU 性能，请勿用于横向对比。',
        '⚠'));
    }

    /* --- 规则 2：WebGPU fallback adapter --- */
    if (flags.fallbackAdapter || gp.fallback) {
      out.push(item('warn', 'WebGPU 返回 fallback adapter',
        '当前 WebGPU 设备标记为 fallback（isFallbackAdapter = true），它是驱动缺失时的兜底实现，' +
        '吞吐与延迟都会显著低于真实 GPU；本次成绩只能作为「能否跑起来」的参考。',
        '⚠'));
    }

    /* --- 规则 3：WebGL2 后端替代 WebGPU --- */
    var backend = ex.backend || (function () {
      for (var b = 0; b < list.length; b++) {
        if (list[b] && list[b].backend) return list[b].backend;
      }
      return null;
    })();
    var skippedIds = [], failedIds = [];
    for (i = 0; i < list.length; i++) {
      var rr = list[i];
      if (!rr || typeof rr !== 'object') continue;
      if (rr.status === 'skipped') skippedIds.push((rr.name || rr.id) + (rr.reason ? '（' + rr.reason + '）' : ''));
      if (rr.status === 'failed') failedIds.push((rr.name || rr.id) + (rr.error ? '（' + rr.error + '）' : ''));
    }
    var usingWebGL = /webgl/i.test(String(backend || '')) || (!flags.webgpuAvailable && !!flags.webglAvailable);
    if (usingWebGL) {
      out.push(item('info', '当前使用 WebGL2 后端而非 WebGPU',
        'WebGL2 没有计算着色器、存储缓冲与原子操作，本版的综合场景在 WebGL2 上走的是' +
        '「片元着色器 + 多 pass 渲染」的等效实现，GPU 计时精度也不如 WebGPU 的时间戳查询。' +
        '两个后端的基线是分别标定的，分数只在**同一后端内部**可比，不要跨后端直接对比。' +
        (skippedIds.length ? '本次跳过 ' + skippedIds.length + ' 项：' + skippedIds.join('、') + '。' : '') +
        (failedIds.length ? '本次失败 ' + failedIds.length + ' 项：' + failedIds.join('、') + '。' : ''),
        'ℹ'));
    } else if (skippedIds.length || failedIds.length) {
      out.push(item('info', '有测试项被跳过或失败',
        '跳过 ' + skippedIds.length + ' 项' + (skippedIds.length ? '：' + skippedIds.join('、') : '') + '；' +
        '失败 ' + failedIds.length + ' 项' + (failedIds.length ? '：' + failedIds.join('、') : '') + '。' +
        '本版只有一个维度、一个子项，一旦它被跳过或失败，总分就不可用。',
        'ℹ'));
    }

    /* --- 维度分（内部计算一次，供规则 9 使用） --- */
    var model = ex.dimensions && ex.dimensions.dimensions ? ex.dimensions : dimensions(list, d);
    var dims = model.dimensions || [];

    /* --- 规则 5：稳定性 --- */
    var stab = ex.stability;
    if (!stab && Array.isArray(ex.rounds)) stab = stability(ex.rounds);
    if (stab && isFin(stab.stability)) {
      if (stab.verdict === 'excellent') {
        out.push(item('good', '稳定性优秀',
          '最低轮次 FPS 为最高轮次的 ' + fnum(stab.stability, 2) + '%（' + fnum(stab.fpsLow, 1) + ' / ' +
          fnum(stab.fpsHigh, 1) + ' FPS），共 ' + stab.rounds + ' 轮，衰减 ' + fnum(stab.decayPct, 2) + '%。' +
          (stab.passed ? '已通过 97% 稳定性门槛。' : '（轮数不足 20，未判定通过。）'),
          '✔'));
      } else if (stab.verdict === 'fair' || stab.verdict === 'poor') {
        out.push(item('warn', '稳定性不足（' + (stab.verdict === 'poor' ? '较差' : '一般') + '）',
          '最低轮次 FPS 为最高轮次的 ' + fnum(stab.stability, 2) + '%（' + fnum(stab.fpsLow, 1) + ' / ' +
          fnum(stab.fpsHigh, 1) + ' FPS），拟合衰减 ' + fnum(stab.decayPct, 2) + '%，' + stab.rounds + ' 轮数据。' +
          '常见原因是积热降频、电源/功耗墙、后台占用或浏览器标签页被节流。',
          '⚠'));
      }
    }

    /* --- 规则 6：综合场景的帧时间波动 ---
     * 综合场景的「样本」是逐帧耗时，实时负载下帧时间天然抖动，
     * 它的 CV 高并不代表测量有问题，因此不走「CV 超限」告警，
     * 改为结合 1% low 与帧时间 P99 给一句更有意义的说明。*/
    var sceneRes = null;
    for (i = 0; i < list.length; i++) {
      if (list[i] && canonId(list[i].id) === 'scene') { sceneRes = list[i]; break; }
    }
    if (sceneRes && sceneRes.meta && isUsable(sceneRes)) {
      var m6 = sceneRes.meta;
      var avg6 = numOrNull(m6.fpsAvg), low6 = numOrNull(m6.fps1Low);
      if (avg6 !== null && low6 !== null && avg6 > 0 && low6 < avg6 * 0.7) {
        out.push(item('warn', '场景帧率波动偏大',
          '平均 ' + fnum(avg6, 1) + ' FPS，但 1% low 只有 ' + fnum(low6, 1) + ' FPS（' +
          fnum(low6 / avg6 * 100, 1) + '%），帧时间 P99 为 ' + fnum(m6.p99FrameMs, 2) + ' ms。' +
          '密集的卡顿通常来自体积云海段的 40 步光线步进、粒子 overdraw，或后台程序抢占 GPU。',
          '⚠'));
      }
    }

    /* --- 规则 9：完整性与可信度 --- */
    if (model.total !== null && isFin(model.total) && model.validDimensions === dims.length && model.confidence >= 0.8) {
      out.push(item('good', '测试完整，结果可信度高',
        dims.length + ' 个维度全部有有效数据，' + model.validParts + '/' + model.totalParts + ' 项测试有效，' +
        '置信度 ' + fnum(model.confidence * 100, 0) + '%。',
        '✔'));
    }

    /* --- 规则 10：高分屏对场景负载的影响 --- */
    var dpr = numOrNull(hw.devicePixelRatio);
    if (dpr !== null && dpr >= 2) {
      out.push(item('info', '高分屏（devicePixelRatio ' + fnum(dpr, 2) + '）会明显压低场景成绩',
        '当前 devicePixelRatio = ' + fnum(dpr, 2) + '。综合场景里的背景星云、体积云海、bloom 与合成都是逐像素负载，' +
        '若画布按物理像素渲染，实际光栅化像素数是 CSS 像素的 ' + fnum(dpr * dpr, 2) + ' 倍，帧率会显著下降。' +
        'NovaMark-Lite 固定用配置里选定的分辨率渲染（默认 1280×720），对比其他成绩时请确认渲染分辨率一致。',
        'ℹ'));
    }

    /* --- 规则 11：场景测试未开垂直同步 --- */
    var refresh = numOrNull(ex.refreshRateHz) !== null ? numOrNull(ex.refreshRateHz) : numOrNull(hw.refreshRateHz);
    var sceneFps = numOrNull(ex.sceneFps) !== null ? numOrNull(ex.sceneFps) : metricOf(list, 'scene');
    if (refresh !== null && refresh > 0 && sceneFps !== null && sceneFps > refresh) {
      out.push(item('info', '场景测试未开启垂直同步',
        '场景测试平均 ' + fnum(sceneFps, 1) + ' FPS，已超过显示器刷新率 ' + fnum(refresh, 1) + ' Hz，' +
        '说明该测试没有开垂直同步，帧率可以高于刷新率（实际观感受刷新率上限限制）。',
        'ℹ'));
    }

    /* --- 规则 12：未能识别 GPU 型号 --- */
    if (!gpuSpecs || typeof gpuSpecs !== 'object' || !gpuSpecs.specs) {
      out.push(item('info', '未识别 GPU 型号，只提供绝对指数',
        '没有匹配到参考规格（NOVA_GPU_DB 未命中或浏览器屏蔽了渲染器字符串），因此不参与参考机型对比，' +
        '只给出以 GTX 1060 级基线为 1000 的绝对性能指数。绝对指数的横向对比依然有效。',
        'ℹ'));
    }

    return out;
  }

  /* ==========================================================================
   * 10. verdictLine —— 一句中文评价
   * ========================================================================*/

  /** 找出最弱的有效维度（本版里只可能是「综合场景」） */
  function weakestDimension(model) {
    if (!model || !model.dimensions) return null;
    var best = null;
    for (var i = 0; i < model.dimensions.length; i++) {
      var dm = model.dimensions[i];
      if (dm.score === null || !isFin(dm.score)) continue;
      if (!best || dm.score < best.score) best = dm;
    }
    return best;
  }

  var WEAK_TAIL = {
    scene: '，综合场景帧率偏弱。'
  };

  /**
   * 生成一句评价。
   * @param {number} total 总分
   * @param {object|string} grade gradeOf() 的结果，或等级字母
   * @param {object} [model] dimensions() 的结果（可选，用于追加短板半句）
   */
  function verdictLine(total, grade, model) {
    var t = numOrNull(total);
    var g = grade;
    if (typeof g === 'string') {
      for (var i = 0; i < GRADE_TABLE.length; i++) {
        if (GRADE_TABLE[i].letter === g) { g = gradeOf(GRADE_TABLE[i].min); break; }
      }
    }
    if (!g || typeof g !== 'object') g = gradeOf(t);

    if (t === null) {
      return '本次场景测试没有获得有效分数（被跳过、失败或样本无效），无法给出综合评价。' +
        '建议确认浏览器已启用硬件加速、WebGPU/WebGL2 可用后重测。';
    }

    var line = '综合得分 ' + Math.round(t) + ' 分（综合场景 ' + fnum(t / 20, 1) + ' 分/100）· ' +
      g.label + '：' + g.desc;

    var weak = weakestDimension(model && model.dimensions ? model : null);
    // 只有当维度确实拖后腿（低于 50 分基线）时才追加短板半句。
    // 这里必须留浮点容差：三项都在基线上时几何平均算出来是 49.99999999999999，
    // 直接和 50 比较会把「正好等于基线」误判成「偏弱」。
    if (weak && weak.score < 50 - 0.05) {
      var tail = WEAK_TAIL[weak.id] || ('，' + weak.name + '维度是当前短板。');
      line += tail;
    }
    return line;
  }

  /* ==========================================================================
   * 导出
   * ========================================================================*/

  var NovaScore = {
    /* 常量与元数据 */
    BASELINE: BASELINE,
    BASELINE_BY_BACKEND: BASELINE_BY_BACKEND,
    META: META,
    BASELINE_VERSION: BASELINE_VERSION,
    DIMENSIONS: DIMENSIONS,
    GRADE_TABLE: GRADE_TABLE,

    /* 配置 */
    setBaseline: setBaseline,

    /* 评分 */
    dimensions: dimensions,
    absolute: absolute,
    absoluteAll: absoluteAll,
    efficiency: efficiency,
    stability: stability,
    frameStats: frameStats,
    diagnose: diagnose,

    /* 展示 */
    verdictLine: verdictLine,

    /* 低层工具（便于报告页/图表复用与单测） */
    canonId: canonId,
    dimensionOf: dimensionOf,
    partScore: partScore,
    gradeOf: gradeOf,
    weightedGeoMean: weightedGeoMean,
    sig4: sig4,

    /* 说明文本 */
    notes: {
      efficiency: EFF_NOTE,
      baseline: '基线为 GTX 1060 6GB 级别的估算值（' + BASELINE_VERSION + '）：' +
        '球体环 ' + BASELINE.ring + ' FPS / 毒蘑菇 ' + BASELINE.vsbm + ' FPS / 综合场景 ' + BASELINE.scene + ' FPS。' +
        '基线设备三个子项各 50 分，几何平均后维度分 50 分 → 总分恰好 1000 分。' +
        '接入实测校准数据后请调用 Nova.score.setBaseline({ ring: 实测值, vsbm: 实测值, scene: 实测值 }) 覆盖。'
    }
  };

  Nova.score = NovaScore;

})(typeof window !== 'undefined' ? window : this);

window.Nova.score = Nova.score;
