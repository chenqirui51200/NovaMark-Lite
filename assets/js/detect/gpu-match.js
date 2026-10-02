/* ============================================================================
 * NovaMark · GPU 型号识别
 * 把 WebGL 的 ANGLE/OpenGL 渲染器字符串、WebGPU 的 adapter.info 映射到
 * 参考规格数据库（NOVA_GPU_DB）里的具体型号。
 * ==========================================================================*/
(function (global) {
  'use strict';

  var Nova = global.Nova = global.Nova || {};
  var U = Nova.util;

  /* 需要从字符串里剔除的噪声片段 */
  var NOISE = [
    /angle\s*\(/gi, /\)\s*$/g,
    /direct3d\d+\s*vs_\d+_\d+\s*ps_\d+_\d+/gi,
    /direct3d\d+/gi, /d3d\d+/gi, /vs_\d+_\d+/gi, /ps_\d+_\d+/gi,
    /opengl\s*engine/gi, /opengl/gi, /vulkan\s*[\d.]+/gi, /vulkan/gi,
    /metal\s*-?\s*\d*/gi, /\(metal\)/gi,
    /pci\s*id:\s*[0-9a-fx]+/gi, /\(0x[0-9a-f]+\)/gi,
    /subsys\s*[0-9a-fx]+/gi,
    /generic\s*renderer/gi, /renderer/gi,
    /integrated\s*graphics\s*controller/gi,
    /compatibility\s*profile/gi,
    /\(tm\)/gi, /\(r\)/gi, /\(c\)/gi, /™/g, /®/g,
    /graphics\s*adapter/gi, /video\s*controller/gi
  ];

  function normalize(s) {
    if (!s) return '';
    var t = ' ' + String(s) + ' ';
    for (var i = 0; i < NOISE.length; i++) t = t.replace(NOISE[i], ' ');
    return t.replace(/[,;|/\\]+/g, ' ')
      .replace(/[\s\u3000]+/g, ' ')
      .trim()
      .toLowerCase();
  }

  /** 生成候选型号关键词（用于打分） */
  function keyTokens(s) {
    var n = normalize(s);
    return n.split(' ').filter(function (w) { return w.length >= 2; });
  }

  /**
   * 通用串黑名单。
   * Safari 在 iOS/iPadOS 上只上报「Apple GPU」，如果某个型号的别名里恰好也有这一条，
   * 就会把任何 Apple 设备都匹配成那一个型号（实测会被匹配成 M3 Ultra）。
   * 这类「什么都没说」的字符串一律不参与具体型号匹配，直接走档位兜底。
   */
  var GENERIC_ALIASES = {
    'apple gpu': true, 'apple': true, 'gpu': true, 'graphics': true, 'gpu 0': true,
    'generic renderer': true, 'generic': true, 'unknown': true,
    'microsoft basic render driver': true, 'microsoft basic display adapter': true,
    'display adapter': true, 'video controller': true, 'vga compatible controller': true,
    'mesa': true, 'mesa dri': true, 'swiftshader': true, 'llvmpipe': true
  };

  function isGeneric(alias) {
    if (!alias) return true;
    if (GENERIC_ALIASES[alias]) return true;
    // 只有一两个词的别名太容易误伤，比如 "Apple"、"Intel Graphics"
    var words = alias.split(' ').filter(Boolean);
    if (words.length <= 1 && alias.length <= 12) return true;
    return false;
  }

  function db() { return global.NOVA_GPU_DB || null; }

  function findById(id) {
    var database = db();
    if (!database || !database.gpus) return null;
    for (var i = 0; i < database.gpus.length; i++) {
      if (database.gpus[i].id === id) return database.gpus[i];
    }
    return null;
  }

  /**
   * 矿卡 / OEM 改名卡：这些型号的渲染器字符串里不会出现消费级型号名，
   * 但核心与消费级型号完全相同，直接映射过去，否则会掉进「未识别」兜底。
   */
  var REBRANDS = [
    { re: /p106-100|p106-090/, id: 'nvidia-gtx-1060-6gb', label: 'NVIDIA P106-100（GTX 1060 6GB 挖矿专用版）' },
    { re: /p104-100|p104-101/, id: 'nvidia-gtx-1070', label: 'NVIDIA P104-100（GTX 1070 挖矿专用版）' },
    { re: /p102-100/, id: 'nvidia-gtx-1080-ti', label: 'NVIDIA P102-100（GTX 1080 Ti 挖矿专用版）' },
    { re: /cmp 30hx|30hx/, id: 'nvidia-gtx-1660-super', label: 'NVIDIA CMP 30HX（GTX 1660 Super 挖矿专用版）' },
    { re: /cmp 40hx|40hx/, id: 'nvidia-rtx-2060', label: 'NVIDIA CMP 40HX（RTX 2060 挖矿专用版）' },
    { re: /cmp 50hx|50hx/, id: 'nvidia-rtx-3070', label: 'NVIDIA CMP 50HX（RTX 3070 挖矿专用版）' },
    { re: /cmp 90hx|90hx/, id: 'nvidia-rtx-3080', label: 'NVIDIA CMP 90HX（RTX 3080 挖矿专用版）' }
  ];

  /**
   * 主匹配函数。
   * @param {object} deviceInfo Nova.detect.collect() 的结果
   * @returns {object} 匹配结果
   */
  function match(deviceInfo) {
    var database = db();
    var wg = (deviceInfo && deviceInfo.webgl) || {};
    var gp = (deviceInfo && deviceInfo.webgpu) || {};

    var samples = [];
    if (wg.unmaskedRenderer) samples.push({ text: wg.unmaskedRenderer, src: 'WebGL 渲染器(未屏蔽)', weight: 1.0 });
    if (wg.renderer && wg.renderer !== wg.unmaskedRenderer) samples.push({ text: wg.renderer, src: 'WebGL 渲染器', weight: 0.7 });
    if (gp.info) {
      var desc = [gp.info.vendor, gp.info.device, gp.info.description, gp.info.architecture].filter(Boolean).join(' ');
      if (desc) samples.push({ text: desc, src: 'WebGPU 适配器', weight: 0.9 });
    }

    var result = {
      ok: false, confidence: 0, gpu: null, class: null,
      method: 'none', input: samples.length ? samples[0].text : '',
      samples: samples.map(function (s) { return { src: s.src, text: s.text }; }),
      normalized: samples.length ? normalize(samples[0].text) : '',
      notes: []
    };

    if (!database || !database.gpus || !database.gpus.length) {
      result.notes.push('参考数据库缺失（gpu-db.js 未加载）');
      return result;
    }

    // 0) 先处理矿卡 / 改名卡
    for (var sr = 0; sr < samples.length; sr++) {
      var normRebrand = normalize(samples[sr].text);
      for (var rr = 0; rr < REBRANDS.length; rr++) {
        if (REBRANDS[rr].re.test(normRebrand)) {
          var rg = findById(REBRANDS[rr].id);
          if (rg) {
            result.ok = true;
            result.gpu = rg;
            result.matchedAlias = REBRANDS[rr].label;
            result.confidence = 0.82;
            result.method = 'rebrand';
            result.notes.push('识别为 ' + REBRANDS[rr].label + '，理论规格按对应消费级型号估算。');
            return result;
          }
        }
      }
    }

    var best = null, bestScore = 0, bestAlias = '';

    for (var s = 0; s < samples.length; s++) {
      var sample = samples[s];
      var normSample = normalize(sample.text);
      var tokens = keyTokens(sample.text);
      if (!normSample) continue;
      // 「Apple GPU」这种什么都没说的字符串不能拿去匹配具体型号：
      // 它会被反向包含判据命中任意带 "Apple GPU" 字样的别名（实测会被匹配成 M3 Ultra）。
      if (isGeneric(normSample)) continue;

      for (var i = 0; i < database.gpus.length; i++) {
        var g = database.gpus[i];
        var aliases = g.aliases && g.aliases.length ? g.aliases : [g.name];
        for (var a = 0; a < aliases.length; a++) {
          var alias = normalize(aliases[a]);
          if (!alias || alias.length < 3) continue;
          if (isGeneric(alias)) continue;   // 「Apple GPU」这类通用串不参与匹配

          var score = 0;
          if (normSample === alias) score = 100;                        // 完全一致
          else if (normSample.indexOf(alias) >= 0) {
            // 别名被完整包含：别名越长越可信
            score = 60 + Math.min(30, alias.length / 2);
            // 别名由多个词组成时更可信
            var words = alias.split(' ').length;
            score += Math.min(10, words * 2);
          } else if (alias.indexOf(normSample) >= 0 && normSample.length > 6) {
            score = 40;                                                  // 反向包含
          } else {
            // 关键词覆盖率
            var aliasTokens = keyTokens(aliases[a]);
            if (aliasTokens.length) {
              var hit = 0;
              for (var t = 0; t < aliasTokens.length; t++) {
                if (tokens.indexOf(aliasTokens[t]) >= 0) hit++;
              }
              var cover = hit / aliasTokens.length;
              if (cover >= 0.6) score = 20 + cover * 25;
            }
          }
          if (score <= 0) continue;
          score *= sample.weight;
          // 同分时偏向更新的产品
          score += (g.year || 2015) / 100000;
          if (score > bestScore) { bestScore = score; best = g; bestAlias = aliases[a]; }
        }
      }
    }

    if (best && bestScore >= 30) {
      result.ok = true;
      result.gpu = best;
      result.matchedAlias = bestAlias;
      result.confidence = bestScore >= 90 ? 0.98 : (bestScore >= 70 ? 0.9 : (bestScore >= 50 ? 0.75 : 0.55));
      result.method = bestScore >= 70 ? 'exact' : (bestScore >= 50 ? 'alias' : 'fuzzy');
      if (best.type === 'software') {
        result.notes.push('识别为软件渲染设备，成绩仅作参考。');
      }
      return result;
    }

    // 兜底：按关键字分档
    var fallback = pickFallbackClass(deviceInfo);
    if (fallback) {
      result.method = 'heuristic';
      result.class = fallback;
      result.confidence = 0.3;
      result.notes.push('未能精确匹配型号，已按「' + fallback.label + '」档位估算理论峰值。');
      return result;
    }

    result.notes.push('无法识别 GPU 型号，将只给出绝对性能指数，不做达成率分析。');
    return result;
  }

  function pickFallbackClass(deviceInfo) {
    var database = db();
    if (!database || !database.fallbackClasses) return null;
    var wg = (deviceInfo && deviceInfo.webgl) || {};
    var gp = (deviceInfo && deviceInfo.webgpu) || {};
    var text = [
      wg.unmaskedRenderer, wg.renderer,
      gp.info ? [gp.info.vendor, gp.info.device, gp.info.description, gp.info.architecture].join(' ') : ''
    ].join(' ');
    var lower = text.toLowerCase();
    var kind = (deviceInfo && deviceInfo.flags && deviceInfo.flags.gpuKindHint) || 'unknown';

    var list = database.fallbackClasses;
    var best = null, bestScore = 0;
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      var score = 0;
      var hints = c.matchHints || [];
      for (var h = 0; h < hints.length; h++) {
        var hint = String(hints[h]).toLowerCase();
        if (hint && lower.indexOf(hint) >= 0) score += 10 + hint.length / 4;
      }
      if (c.kinds && c.kinds.indexOf(kind) >= 0) score += 8;
      if (score > bestScore) { bestScore = score; best = c; }
    }
    if (best && bestScore > 0) return best;

    // 最后按 kind 粗分
    for (var j = 0; j < list.length; j++) {
      if (list[j].kinds && list[j].kinds.indexOf(kind) >= 0) return list[j];
    }
    return null;
  }

  /** 判断两个型号是否是同一款 */
  function sameGpu(a, b) {
    if (!a || !b) return false;
    if (a.id && b.id) return a.id === b.id;
    return normalize(a.name) === normalize(b.name);
  }

  /** 生成一个用于报告的简短 GPU 名称 */
  function displayName(matchResult, deviceInfo) {
    if (matchResult && matchResult.gpu) return matchResult.gpu.name;
    var wg = (deviceInfo && deviceInfo.webgl) || {};
    var raw = wg.unmaskedRenderer || wg.renderer || '';
    if (!raw) {
      var gp = (deviceInfo && deviceInfo.webgpu) || {};
      if (gp.info) raw = [gp.info.vendor, gp.info.device || gp.info.description || gp.info.architecture].filter(Boolean).join(' ');
    }
    if (!raw) return '未知 GPU';
    return cleanRendererName(raw);
  }

  /** 把原始的 ANGLE / 驱动渲染器字符串洗成人能读的型号名 */
  function cleanRendererName(raw) {
    var original = String(raw);
    var s = original;

    // 剥掉 ANGLE (Vendor, ......) 外壳：取逗号后面那一整段（可能自带括号与逗号）
    var m = s.match(/^ANGLE\s*\(\s*[^,]+,\s*([\s\S]+)\)\s*$/i);
    if (m) s = m[1];

    s = s
      .replace(/\(0x[0-9A-Fa-f]+\)/g, ' ')                 // PCI ID
      .replace(/\bPCI\s*ID:?\s*[0-9A-Fa-fx]+/gi, ' ')
      .replace(/\b(Direct3D|D3D)\s*\d*/gi, ' ')            // Direct3D11 / D3D11
      .replace(/\b[vp]s_\d+_\d+/gi, ' ')                    // vs_5_0 ps_5_0
      .replace(/\b(OpenGL|Vulkan|Metal|OpenGLES)\b(\s*[\d.]+)?/gi, ' ')
      .replace(/^\s*\(*\s*(compatibility profile|core profile)\s*\)*\s*$/gi, ' ')
      .replace(/\(TM\)|\(R\)|\(C\)|™|®/gi, ' ')
      .replace(/,\s*(D3D\d*|Metal|Vulkan|OpenGL)\s*$/i, ' ')
      .replace(/[(),]+\s*$/g, ' ')                          // 结尾的括号与逗号
      .replace(/^\s*[(),]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // 全剥没了就退回原串，至少不要给出空名字
    if (!s || s.length < 2) {
      s = original.replace(/^ANGLE\s*\(/i, '').replace(/\)\s*$/, '').trim() || original;
    }
    return s;
  }

  Nova.gpuMatch = {
    match: match,
    normalize: normalize,
    sameGpu: sameGpu,
    displayName: displayName,
    cleanRendererName: cleanRendererName,
    hasDatabase: function () { return !!db(); }
  };

})(window);
