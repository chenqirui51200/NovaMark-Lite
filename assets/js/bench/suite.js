/* ============================================================================
 * NovaMark-Lite · 测试套件编排
 *
 * 本版的测试清单是三个「场景类」测试项（全部归入唯一的「综合场景」维度）：
 *   1) ring  球体环（原版最简场景）  —— 单一几何 pass，最轻负载的基准参照
 *   2) vsbm  毒蘑菇（Volume Shader BM）—— 隐式曲面光线求交，纯逐像素 ALU/分支负载
 *   3) scene 综合测试（四段序列）    —— 星环 → 峡谷·黄昏 → 峡谷·云海 → 都市·风暴
 *
 * 全部**微基准**（填充率 / 几何 / 纹理 / 着色器 ALU / 矩阵乘 / 带宽 / 上传 / 回读 /
 * 延迟 / 提交吞吐）仍然不在本版范围内。
 * 「完整测试」预设会额外追加一轮稳定性压力测试（复用同一套场景负载，
 * 只统计帧率衰减，独立成项、不计入总分）。
 *
 * 职责：先做一段**全局预热**把 GPU 拉到稳态，再把设备探测、三个场景测试、
 *       稳定性循环串成一次完整评测，并调用评分模型产出最终报告数据。
 *
 * 关于全局预热为什么必要，见下面 WARMUP_MS 的注释 —— 简言之：
 * 排在第一位的「球体环」是最轻（单帧 1–2 ms）也最敏感的负载，
 * 不预热就会因 GPU 冷启动而系统性偏低，而基准结果不该因执行顺序而变。
 * ==========================================================================*/
(function (global) {
  'use strict';

  var Nova = global.Nova = global.Nova || {};
  var U = Nova.util;

  /* --------------------------- 全局预热 --------------------------- */

  /**
   * 正式测试列表**之前**的全局预热时长（毫秒）。
   *
   * 为什么必须有这一段：
   *   三项测试里 `ring`（球体环）排在第一位，单帧只有 1–2 ms，是最轻、也最敏感的负载。
   *   页面刚加载完时 GPU 还处在低频 / 低功耗状态，核心时钟尚未爬升到稳态，
   *   于是 ring 会**系统性偏低**——实测参考机上 ring 中位数 263 FPS（基线 365，仅 72%），
   *   而排在它后面的 vsbm 是 88%、scene 是 96%。ring 的极差也远大于另两项（22% vs 4% / 3.5%）。
   *
   *   根因是**执行顺序**，而不是负载本身：
   *   完整版 NovaMark 里 ring 排在 13 项微基准之后，是被充分预热过的；本版它成了第一个重负载。
   *
   * 为什么是「预热」而不是「调顺序」或「改基线」：
   *   基准测试的结果不该因执行顺序而变。调顺序只是把问题推给另一个测试，
   *   改基线则是拿标定值去迁就一个测量缺陷。正确做法是让所有测试都在同一稳态下起跑。
   *
   * 时长取 5000 ms 的依据：
   *   现代 GPU 从空闲爬到稳态核心时钟通常只需 1–2 秒量级。最初取 3000 ms，
   *   实测把 ring 从 263 FPS 拉回 298 FPS（+13%），证明有效；
   *   再加到 5000 ms 是留足余量（边际收益递减，不必更长），
   *   相对标准预设约 85 s 的正式测量约占 6%。
   *   快速预设整体只有约 41 s，按 quickWarmupMs 缩到 2500 ms（约 6%）。
   */
  var WARMUP_MS = 5000;         // 标准 / 完整 / 稳定性预设
  var WARMUP_MS_QUICK = 2500;   // 快速扫描（整体时长本来就短）

  /**
   * 球体环的**测量窗口**时长（秒）。
   *
   * 为什么单独给 ring 一个更长的窗口：
   *   ring 单帧只有 1–2 ms，是所有测试里最轻的负载；同样的帧时间抖动，
   *   在 ring 上被放大的倍数远大于 scene（scene 单帧约 7 ms）。
   *   统计窗口越长，抖动被平均掉的越多 —— 这比继续加预热更对症。
   *
   * 原实现用 `sceneSeconds × 0.14` 折算，标准预设约 7 s（偏短，实测三次极差 22%）；
   * 现在改为显式取值，与各预设总时长成比例。
   *
   * 注意：这只加长**统计窗口**，不改负载本身（实例数、几何、着色器一律不动），
   * 因此 ring 的分数口径与其他项、与完整版仍然可比。
   */
  var RING_SECONDS = { quick: 8, standard: 15, full: 24 };

  /** 预热用哪种负载：球体环（中等档 900 实例，单几何 pass + 基础着色）——
   *  属于「中等负载」，既能把 GPU 时钟拉起来，又不会像综合场景的云海段那样
   *  在弱设备上耗时过久，保证预热本身不会成为负担。 */
  var WARMUP_PRESET = 'medium';

  /* ------------------------------ 预设 ------------------------------ */

  /**
   * 本版三个测试项都是「场景负载」，预设的差异体现在
   * 「各段时长 / 场景质量档 / 毒蘑菇压力档 / 是否追加稳定性压力测试」上。
   * warmupMs / measureMs / rounds / targetBatchMs 仍然保留：
   * 微基准（runTest）已不在本版范围内，但 Harness 构造时仍需要这几个字段存在。
   * 注意：这里的 warmupMs 是**单项内部**的预热（丢帧用），与上面的全局预热 WARMUP_MS 不是一回事。
   */
  var PRESETS = {
    quick: {
      key: 'quick', name: '快速扫描', desc: '约 41 秒（含 2.5 秒全局预热），球体环 8 秒 + 毒蘑菇低档 + 四段场景各缩短到 2 秒',
      warmupMs: 250, measureMs: 900, rounds: 2, targetBatchMs: 35,
      sceneSeconds: 15, sceneScale: 0.30, scenePreset: 'low', vsbmScale: 0.6, stabilityRounds: 0
    },
    standard: {
      key: 'standard', name: '标准测试', desc: '约 2 分 35 秒（含 5 秒全局预热），球体环 15 秒 + 毒蘑菇三档 + 四段完整场景序列',
      warmupMs: 450, measureMs: 2000, rounds: 3, targetBatchMs: 55,
      sceneSeconds: 50, sceneScale: 1.0, scenePreset: 'medium', vsbmScale: 1.0, stabilityRounds: 0
    },
    full: {
      key: 'full', name: '完整测试', desc: '约 5 分 30 秒（含 5 秒全局预热），含加长场景序列、毒蘑菇高压力档与 20 轮稳定性压力测试',
      warmupMs: 600, measureMs: 3000, rounds: 4, targetBatchMs: 60,
      sceneSeconds: 80, sceneScale: 1.6, scenePreset: 'medium', vsbmScale: 1.5, stabilityRounds: 20,
      stabilityRoundMs: 5000
    },
    stress: {
      key: 'stress', name: '稳定性压力测试', desc: '约 2 分钟（含 5 秒全局预热），只跑 20 轮重负载场景循环，看散热与降频',
      warmupMs: 400, measureMs: 1200, rounds: 2, targetBatchMs: 50,
      sceneSeconds: 0, sceneScale: 0.25, scenePreset: 'medium', vsbmScale: 1.0, stabilityRounds: 20,
      stabilityRoundMs: 5000
    }
  };

  /** 该预设的球体环测量窗口（毫秒） */
  function ringMsOf(preset) {
    var s = RING_SECONDS[(preset && preset.key) || 'standard'];
    return (s === undefined ? RING_SECONDS.standard : s) * 1000;
  }

  /** 该预设的全局预热时长（毫秒） */
  function warmupMsOf(preset) {
    return preset && preset.key === 'quick' ? WARMUP_MS_QUICK : WARMUP_MS;
  }

  function presetOf(key) { return PRESETS[key] || PRESETS.standard; }

  /* --------------------------- 组装测试列表 --------------------------- */

  /**
   * 测试清单：球体环 → 毒蘑菇 → 综合测试（四段序列）。
   * 稳定性预设只跑稳定性循环；「完整测试」extra 追加稳定性压力测试（独立成项，不进总分）。
   *
   * @param {object} ctx 测量上下文
   * @param {object} opts { preset:'standard', scenePreset:'medium' }
   */
  function buildList(ctx, opts) {
    opts = opts || {};
    var preset = presetOf(opts.preset);
    var list = [];

    // 原版「球体环」最简场景：保留最初那一版，作为最轻负载的基准参照。
    // 测量窗口用 RING_SECONDS 显式指定（比原先的 sceneSeconds×0.14 更长）：
    // ring 单帧仅 1–2 ms，抖动放大倍数最大，窗口长一些才能把方差压下来。
    if (preset.sceneSeconds > 0 && Nova.makeRingSceneTest) {
      list.push({ kind: 'custom', test: Nova.makeRingSceneTest(ctx, {
        preset: 'medium',
        durationMs: ringMsOf(preset),
        warmupMs: 1500, rounds: 1
      }) });
    }

    // 毒蘑菇低压力测试：排在综合场景之前（逐像素 ALU/分支负载）
    if (preset.sceneSeconds > 0 && Nova.makeVsbmTest) {
      list.push({ kind: 'custom', test: Nova.makeVsbmTest(ctx, { levelScale: preset.vsbmScale || 1 }) });
    }

    if (preset.sceneSeconds > 0) {
      var sceneTest = Nova.makeSceneTest(ctx, {
        preset: opts.scenePreset || preset.scenePreset,
        segmentScale: preset.sceneScale || 1,
        durationMs: preset.sceneSeconds * 1000,
        warmupMs: 900,
        rounds: 1
      });
      list.push({ kind: 'custom', test: sceneTest });
    }

    if (preset.stabilityRounds > 1) {
      var stabTest = Nova.makeStabilityTest(ctx, {
        preset: opts.scenePreset || preset.scenePreset,
        rounds: preset.stabilityRounds,
        roundMs: preset.stabilityRoundMs || 5000
      });
      list.push({ kind: 'custom', test: stabTest });
    }

    return list;
  }

  /* ------------------------------ 执行 ------------------------------ */

  /**
   * 全局预热：在正式测试列表之前跑一段中等负载，把 GPU 时钟/功耗拉到稳态。
   *
   * 实现要点：
   *  - 复用「球体环（中等档）」的**同一套编码器**，与后面正式测的项目同构，
   *    因此预热到的是同一批着色器 / 管线 / 缓存状态；
   *  - 全程不创建结果对象、不参与评分 —— 预热不该影响分数；
   *  - 任何异常都吞掉（预热失败不应该让整轮测试跑不起来），只是没有预热效果；
   *  - 通过 onProgress 发一条 phase:'warmup' 事件，界面可以显示「正在预热」。
   *
   * @returns Promise<number> 实际预热耗时（毫秒）
   */
  function warmup(ctx, ms, opts) {
    opts = opts || {};
    if (!(ms > 0)) return Promise.resolve(0);
    if (!Nova.makeRingSceneTest) return Promise.resolve(0);   // 没有可用负载就跳过

    var emit = opts.emit || function () { };
    var t0 = U.now();
    var test;
    try {
      test = Nova.makeRingSceneTest(ctx, {
        preset: WARMUP_PRESET,
        durationMs: ms,
        warmupMs: 400,      // 预热阶段本身不需要再丢多少帧
        tailMs: 100,
        rounds: 1
      });
    } catch (e) {
      return Promise.resolve(0);
    }
    if (!test || typeof test.run !== 'function') return Promise.resolve(0);

    emit({ phase: 'warmup', ms: ms, name: '全局预热' });

    var harness = new Nova.engine.Harness(ctx, {
      warmupMs: 200, measureMs: 300, rounds: 1, targetBatchMs: 30
    });

    return Promise.resolve()
      .then(function () {
        return harness.runCustom(test, {
          report: function () { },                        // 预热不对外报进度
          isAborted: opts.isAborted || function () { return false; }
        });
      })
      .then(function () { return U.now() - t0; })
      .catch(function () { return U.now() - t0; });       // 预热失败照样继续
  }

  /**
   * 跑完整套件。
   * @returns Promise<{results, score, absolute, efficiency, diagnostics, stability, comparison, extra, meta}>
   */
  function run(ctx, opts) {
    opts = opts || {};
    var preset = presetOf(opts.preset);
    var report = opts.onProgress || function () { };
    var harness = new Nova.engine.Harness(ctx, {
      warmupMs: preset.warmupMs,
      measureMs: preset.measureMs,
      rounds: preset.rounds,
      targetBatchMs: preset.targetBatchMs
    });

    var list = buildList(ctx, opts);
    var results = [];
    var totalPlanned = list.length;
    var t0 = 0;                 // 计时从「预热结束、正式测试开始」起算
    var warmupTook = 0;         // 全局预热实际耗时（毫秒）

    function emit(evt) { try { report(evt); } catch (e) { /* noop */ } }

    function step(i) {
      if (i >= list.length) return Promise.resolve();
      if (opts.isAborted && opts.isAborted() || harness.aborted) {
        return Promise.resolve();
      }
      var entry = list[i];
      var test = entry.test;
      emit({
        phase: 'test-start', index: i, total: totalPlanned,
        id: test.id, name: test.name, group: test.group, unit: test.unit
      });

      var hooks = {
        onProgress: function (p) {
          // 只有 measuring 阶段才有有意义的进度值。
          // 早期版本把 round-done / warmup / calibrate 也当成 progress=0 上报，
          // 于是每轮结束时进度条被拉回该测试的起点，看起来就是「闪一下又恢复」。
          var isMeasure = p.phase === 'measuring';
          emit({
            phase: 'test-progress', subPhase: p.phase,
            index: i, total: totalPlanned,
            id: test.id, name: test.name, group: test.group, unit: test.unit,
            progress: isMeasure ? (p.overall === undefined ? (p.progress || 0) : p.overall) : null,
            sub: p,
            elapsedMs: U.now() - t0
          });
        }
      };

      var p = (entry.kind === 'custom')
        ? harness.runCustom(test, hooks)
        : harness.runTest(test, hooks);

      return p.then(function (res) {
        results.push(res);
        emit({
          phase: 'test-done', index: i, total: totalPlanned,
          id: test.id, name: test.name, group: test.group, unit: test.unit,
          result: res, elapsedMs: U.now() - t0
        });
        return step(i + 1);
      });
    }

    // 正式测试之前先做全局预热：让 GPU 进入稳态，使排在第一位的 ring 不再因冷启动而偏低。
    // 计时从预热之后起算，所以报告里的「耗时」仍然是正式测量的耗时。
    return warmup(ctx, warmupMsOf(preset), { emit: emit, isAborted: opts.isAborted })
      .then(function (took) {
        warmupTook = took;
        t0 = U.now();
        return step(0);
      })
      .then(function () {
        emit({ phase: 'scoring' });
        return finalize(ctx, opts, results, U.now() - t0, warmupTook);
      });
  }

  /* ---------------------------- 汇总评分 ---------------------------- */

  function finalize(ctx, opts, results, elapsedMs, warmupTook) {
    var deviceInfo = ctx.deviceInfo;
    var gpuMatch = opts.gpuMatch || (Nova.gpuMatch ? Nova.gpuMatch.match(deviceInfo) : null);
    var gpuSpecs = (gpuMatch && gpuMatch.gpu) ? gpuMatch.gpu : null;

    var score = Nova.score.dimensions(results, deviceInfo);
    var absolute = Nova.score.absoluteAll(results);
    var efficiency = Nova.score.efficiency(results, gpuSpecs);

    // 稳定性：优先用独立稳定性测试的结果
    var stability = null;
    var stabResult = findById(results, 'stability');
    if (stabResult && stabResult.meta && stabResult.meta.stability && stabResult.meta.stability.rounds) {
      stability = Nova.score.stability(stabResult.meta.stability.rounds);
    }
    var sceneResult = findById(results, 'scene');

    var extra = {
      refreshRateHz: opts.refreshRateHz || (deviceInfo.hardware && deviceInfo.hardware.refreshRateHz) || null,
      sceneFps: sceneResult && sceneResult.meta ? sceneResult.meta.fpsAvg : null,
      backend: ctx.kind === 'webgpu' ? 'WebGPU' : 'WebGL2',
      elapsedMs: elapsedMs,
      // 全局预热：跑在正式测试之前，不进结果、不计分，只用于把 GPU 拉到稳态
      warmupMs: warmupTook || 0
    };

    var diagnostics = Nova.score.diagnose(results, deviceInfo, gpuSpecs, extra);

    var comparison = Nova.report ? Nova.report.buildComparison({ results: results, score: score }, gpuMatch) : null;

    return {
      results: results,
      score: score,
      absolute: absolute,
      efficiency: efficiency,
      diagnostics: diagnostics,
      stability: stability,
      comparison: comparison,
      extra: extra,
      elapsedMs: elapsedMs,
      warmupMs: warmupTook || 0,
      gpuMatch: gpuMatch
    };
  }

  function findById(results, id) {
    for (var i = 0; i < results.length; i++) if (results[i].id === id) return results[i];
    return null;
  }

  /* ------------------------------ 编号 ------------------------------ */

  function makeRunId() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var s = '';
    for (var i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return 'NM-' + s.slice(0, 4) + '-' + s.slice(4);
  }

  /** 生成结果指纹：把关键结果规范化后做 SHA-256 */
  function fingerprint(deviceInfo, results, config) {
    var payload = {
      renderer: (deviceInfo.webgl && (deviceInfo.webgl.unmaskedRenderer || deviceInfo.webgl.renderer)) || '',
      adapter: deviceInfo.webgpu && deviceInfo.webgpu.info ? deviceInfo.webgpu.info : null,
      ua: deviceInfo.browser ? deviceInfo.browser.ua : '',
      config: config,
      metrics: (results || []).map(function (r) {
        return [r.id, r.status, r.metric === null || r.metric === undefined ? null : Math.round(r.metric * 1000) / 1000];
      })
    };
    return U.sha256Hex(JSON.stringify(payload));
  }

  Nova.suite = {
    PRESETS: PRESETS,
    presetOf: presetOf,
    warmupMsOf: warmupMsOf,     // 全局预热时长（毫秒），供界面/自检读取
    ringMsOf: ringMsOf,         // 球体环测量窗口（毫秒）
    WARMUP_MS: WARMUP_MS,
    WARMUP_MS_QUICK: WARMUP_MS_QUICK,
    RING_SECONDS: RING_SECONDS,
    WARMUP_PRESET: WARMUP_PRESET,
    warmup: warmup,             // 也可单独调用（自检里用来验证预热本身能跑通）
    buildList: buildList,
    run: run,
    finalize: finalize,
    makeRunId: makeRunId,
    fingerprint: fingerprint
  };

})(window);
