/* ============================================================================
 * NovaMark · 设备与环境探测
 * 收集浏览器 / 操作系统 / CPU / WebGL / WebGPU 全量信息，供报告与评分使用。
 * ==========================================================================*/
(function (global) {
  'use strict';

  var Nova = global.Nova = global.Nova || {};
  var U = Nova.util;

  /* ------------------------- 浏览器 / 系统 ------------------------- */

  function detectBrowser() {
    var ua = navigator.userAgent || '';
    var brands = (navigator.userAgentData && navigator.userAgentData.brands) || [];
    var name = '未知浏览器', version = '';
    var m;

    if ((m = ua.match(/Edg\/([\d.]+)/))) { name = 'Microsoft Edge'; version = m[1]; }
    else if ((m = ua.match(/OPR\/([\d.]+)/))) { name = 'Opera'; version = m[1]; }
    else if ((m = ua.match(/Chrome\/([\d.]+)/))) { name = 'Google Chrome'; version = m[1]; }
    else if ((m = ua.match(/Firefox\/([\d.]+)/))) { name = 'Mozilla Firefox'; version = m[1]; }
    else if ((m = ua.match(/Version\/([\d.]+).*Safari/))) { name = 'Apple Safari'; version = m[1]; }

    var engine = '未知';
    if (/Gecko\/|Firefox/.test(ua) && !/like Gecko/.test(ua)) engine = 'Gecko';
    else if (/AppleWebKit/.test(ua)) engine = /Chrome|Chromium|Edg\//.test(ua) ? 'Blink' : 'WebKit';

    var os = detectOS(ua);

    return {
      name: name, version: version, engine: engine,
      brands: brands.slice(),
      mobile: !!navigator.userAgentData ? !!navigator.userAgentData.mobile : /Mobi|Android|iPhone|iPad/.test(ua),
      ua: ua,
      languages: (navigator.languages || [navigator.language]).slice(0, 4),
      cookiesEnabled: navigator.cookieEnabled,
      online: navigator.onLine,
      os: os
    };
  }

  function detectOS(ua) {
    var o = { name: '未知', version: '', platform: navigator.platform || '' };
    var m;
    if (/Windows NT 10/.test(ua)) { o.name = 'Windows'; o.version = '10 / 11'; }
    else if ((m = ua.match(/Windows NT ([\d.]+)/))) { o.name = 'Windows'; o.version = 'NT ' + m[1]; }
    else if ((m = ua.match(/Mac OS X ([\d_.]+)/))) { o.name = 'macOS'; o.version = m[1].replace(/_/g, '.'); }
    else if (/Android/.test(ua)) {
      o.name = 'Android';
      m = ua.match(/Android ([\d.]+)/); if (m) o.version = m[1];
      m = ua.match(/;\s*([^;)]+)\s+Build/); if (m) o.model = m[1].trim();
    }
    else if (/(iPhone|iPad|iPod)/.test(ua)) {
      o.name = 'iOS / iPadOS';
      m = ua.match(/OS ([\d_]+)/); if (m) o.version = m[1].replace(/_/g, '.');
    }
    else if (/CrOS/.test(ua)) { o.name = 'ChromeOS'; }
    else if (/Linux/.test(ua)) { o.name = 'Linux'; }
    return o;
  }

  /** 高熵 UA-CH：能拿到精确架构/位数/系统版本 */
  function detectHighEntropy() {
    try {
      if (!navigator.userAgentData || !navigator.userAgentData.getHighEntropyValues) {
        return Promise.resolve(null);
      }
      return navigator.userAgentData.getHighEntropyValues([
        'architecture', 'bitness', 'model', 'platform', 'platformVersion',
        'uaFullVersion', 'fullVersionList', 'wow64'
      ]).then(function (v) {
        return {
          architecture: v.architecture || '',
          bitness: v.bitness || '',
          model: v.model || '',
          platform: v.platform || '',
          platformVersion: v.platformVersion || '',
          uaFullVersion: v.uaFullVersion || '',
          fullVersionList: (v.fullVersionList || []).map(function (b) { return b.brand + ' ' + b.version; }),
          wow64: !!v.wow64
        };
      }).catch(function () { return null; });
    } catch (e) { return Promise.resolve(null); }
  }

  /* ----------------------------- WebGL ----------------------------- */

  var GL_PARAMS = [
    ['MAX_TEXTURE_SIZE', '最大纹理尺寸'],
    ['MAX_CUBE_MAP_TEXTURE_SIZE', '最大立方体贴图尺寸'],
    ['MAX_RENDERBUFFER_SIZE', '最大渲染缓冲尺寸'],
    ['MAX_VIEWPORT_DIMS', '最大视口'],
    ['MAX_VERTEX_ATTRIBS', '顶点属性数'],
    ['MAX_TEXTURE_IMAGE_UNITS', '片段纹理单元'],
    ['MAX_VERTEX_TEXTURE_IMAGE_UNITS', '顶点纹理单元'],
    ['MAX_COMBINED_TEXTURE_IMAGE_UNITS', '合并纹理单元'],
    ['MAX_VERTEX_UNIFORM_VECTORS', '顶点 uniform 向量'],
    ['MAX_FRAGMENT_UNIFORM_VECTORS', '片段 uniform 向量'],
    ['MAX_VARYING_VECTORS', '插值变量数'],
    ['MAX_3D_TEXTURE_SIZE', '最大 3D 纹理'],
    ['MAX_ARRAY_TEXTURE_LAYERS', '纹理数组层数'],
    ['MAX_DRAW_BUFFERS', 'MRT 数量'],
    ['MAX_COLOR_ATTACHMENTS', '颜色附件数'],
    ['MAX_SAMPLES', 'MSAA 最大采样'],
    ['MAX_UNIFORM_BLOCK_SIZE', 'UBO 最大字节'],
    ['UNIFORM_BUFFER_OFFSET_ALIGNMENT', 'UBO 对齐'],
    ['MAX_ELEMENT_INDEX', '最大索引值'],
    ['MAX_TEXTURE_LOD_BIAS', '纹理 LOD 偏移'],
    ['MAX_CLIENT_WAIT_TIMEOUT_WEBGL', 'fence 等待超时']
  ];

  function webglInfo() {
    var out = {
      supported: false, webgl1: false, webgl2: false,
      vendor: '', renderer: '', unmaskedVendor: '', unmaskedRenderer: '',
      version: '', glslVersion: '', masked: false,
      maxSamples: 0, timerQuery: false, timerQueryExt: '',
      anisotropy: 0, extensions: [], params: {}, limits: {},
      rendererSource: ''
    };
    var canvas = document.createElement('canvas');
    canvas.width = canvas.height = 8;
    var gl = null, kind = '';
    try { gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }); if (gl) kind = 'webgl2'; } catch (e) { gl = null; }
    if (!gl) {
      try { gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl'); if (gl) kind = 'webgl1'; } catch (e2) { gl = null; }
    }
    if (!gl) {
      out.supported = false;
      return out;
    }
    out.supported = true;
    out.webgl2 = kind === 'webgl2';
    out.webgl1 = true;
    out.version = gl.getParameter(gl.VERSION) || '';
    out.vendor = gl.getParameter(gl.VENDOR) || '';
    out.renderer = gl.getParameter(gl.RENDERER) || '';
    out.glslVersion = out.webgl2 ? (gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || '') : '';

    var dbg = gl.getExtension('WEBGL_debug_renderer_info');
    if (dbg) {
      out.unmaskedVendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) || '';
      out.unmaskedRenderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '';
      out.masked = false;
      out.rendererSource = 'WEBGL_debug_renderer_info';
    } else {
      // 被隐私保护屏蔽：退回普通 VENDOR/RENDERER
      out.masked = true;
      out.unmaskedVendor = out.vendor;
      out.unmaskedRenderer = out.renderer;
      out.rendererSource = 'gl.getParameter(RENDERER)';
    }

    out.extensions = (gl.getSupportedExtensions() || []).slice().sort();
    for (var i = 0; i < GL_PARAMS.length; i++) {
      var key = GL_PARAMS[i][0], label = GL_PARAMS[i][1];
      try {
        var pname = gl[key];
        if (pname === undefined) continue;
        var val = gl.getParameter(pname);
        if (val && val.length !== undefined && typeof val !== 'string') val = Array.prototype.slice.call(val);
        out.params[label] = val;
        out.limits[key] = val;
      } catch (e) { /* 部分参数在 WebGL1 不存在 */ }
    }
    out.maxSamples = typeof out.limits.MAX_SAMPLES === 'number' ? out.limits.MAX_SAMPLES : 0;

    var aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    if (aniso) {
      try { out.anisotropy = gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 0; } catch (e) { out.anisotropy = 0; }
    }

    // GPU 计时能力
    if (out.webgl2 && gl.getExtension('EXT_disjoint_timer_query_webgl2')) {
      out.timerQuery = true; out.timerQueryExt = 'EXT_disjoint_timer_query_webgl2';
    } else if (gl.getExtension('EXT_disjoint_timer_query')) {
      out.timerQuery = true; out.timerQueryExt = 'EXT_disjoint_timer_query';
    }

    // 释放上下文
    try {
      var lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
    } catch (e) { /* noop */ }

    out.raw = {
      canvas: canvas, kind: kind
    };
    return out;
  }

  /* ----------------------------- WebGPU ----------------------------- */

  var WGPU_LIMITS = [
    'maxTextureDimension1D', 'maxTextureDimension2D', 'maxTextureDimension3D',
    'maxTextureArrayLayers', 'maxBindGroups', 'maxBindingsPerBindGroup',
    'maxDynamicUniformBuffersPerPipelineLayout', 'maxDynamicStorageBuffersPerPipelineLayout',
    'maxSampledTexturesPerShaderStage', 'maxSamplersPerShaderStage',
    'maxStorageBuffersPerShaderStage', 'maxStorageTexturesPerShaderStage',
    'maxUniformBuffersPerShaderStage', 'maxUniformBufferBindingSize',
    'maxStorageBufferBindingSize', 'minUniformBufferOffsetAlignment', 'minStorageBufferOffsetAlignment',
    'maxVertexBuffers', 'maxBufferSize', 'maxVertexAttributes', 'maxVertexBufferArrayStride',
    'maxInterStageShaderVariables', 'maxColorAttachments', 'maxColorAttachmentBytesPerSample',
    'maxComputeWorkgroupStorageSize', 'maxComputeInvocationsPerWorkgroup',
    'maxComputeWorkgroupSizeX', 'maxComputeWorkgroupSizeY', 'maxComputeWorkgroupSizeZ',
    'maxComputeWorkgroupsPerDimension'
  ];

  var WANTED_FEATURES = ['timestamp-query', 'shader-f16', 'float32-filterable', 'depth-clip-control',
    'texture-compression-bc', 'texture-compression-etc2', 'texture-compression-astc',
    'indirect-first-instance', 'rg11b10ufloat-renderable', 'bgra8unorm-storage', 'dual-source-blending'];

  function webgpuInfo() {
    var out = {
      supported: false,
      adapterInfo: null, info: null, features: [], wanted: {}, limits: {},
      preferredCanvasFormat: 'bgra8unorm', fallback: false, isCompatibility: false,
      wgslLanguageFeatures: [], subgroup: {}, timestamp: false, shaderF16: false,
      adapter: null, device: null, deviceLostReason: null, error: null
    };
    if (!navigator.gpu) return Promise.resolve(out);

    return navigator.gpu.requestAdapter({ powerPreference: 'high-performance' })
      .catch(function () { return navigator.gpu.requestAdapter(); })
      .then(function (adapter) {
        if (!adapter) { out.error = 'requestAdapter() 返回 null，系统可能没有可用的 GPU 适配器'; return out; }
        out.supported = true;
        out.adapter = adapter;
        out.fallback = !!adapter.isFallbackAdapter;
        out.isCompatibility = !!adapter.isFallbackAdapter;

        // adapter.info 在新版规范里是同步属性；老版本要用 requestAdapterInfo()
        var infoPromise;
        if (adapter.info && typeof adapter.info === 'object') {
          infoPromise = Promise.resolve(adapter.info);
        } else if (typeof adapter.requestAdapterInfo === 'function') {
          infoPromise = adapter.requestAdapterInfo().catch(function () { return null; });
        } else {
          infoPromise = Promise.resolve(null);
        }

        return infoPromise.then(function (info) {
          var raw = info ? {
            vendor: info.vendor || '', architecture: info.architecture || '',
            device: info.device || '', description: info.description || '',
            subgroupMinSize: info.subgroupMinSize, subgroupMaxSize: info.subgroupMaxSize
          } : null;
          out.adapterInfo = raw;
          out.info = raw ? {
            vendor: raw.vendor || '未知厂商',
            architecture: raw.architecture || '',
            device: raw.device || '',
            description: raw.description || ''
          } : null;
          if (raw) {
            out.subgroup = { min: raw.subgroupMinSize, max: raw.subgroupMaxSize };
          }

          out.features = Array.from(adapter.features || []).sort();
          for (var i = 0; i < WANTED_FEATURES.length; i++) {
            var f = WANTED_FEATURES[i];
            out.wanted[f] = !!(adapter.features && adapter.features.has && adapter.features.has(f));
          }
          out.timestamp = out.wanted['timestamp-query'];
          out.shaderF16 = out.wanted['shader-f16'];

          try {
            out.limits = {};
            for (var j = 0; j < WGPU_LIMITS.length; j++) {
              var k = WGPU_LIMITS[j];
              if (adapter.limits && adapter.limits[k] !== undefined) out.limits[k] = adapter.limits[k];
            }
            if (adapter.limits && adapter.limits.maxComputeWorkgroupSizeX !== undefined) {
              out.limits.maxComputeWorkgroupSize = [
                adapter.limits.maxComputeWorkgroupSizeX,
                adapter.limits.maxComputeWorkgroupSizeY,
                adapter.limits.maxComputeWorkgroupSizeZ];
            }
          } catch (e) { out.limits = {}; }

          try {
            if (navigator.gpu.wgslLanguageFeatures) {
              out.wgslLanguageFeatures = Array.from(navigator.gpu.wgslLanguageFeatures).sort();
            }
            out.preferredCanvasFormat = navigator.gpu.getPreferredCanvasFormat();
          } catch (e2) { /* noop */ }

          // 申请一个尽可能全功能的设备，供基准引擎复用
          var required = [];
          for (var w = 0; w < WANTED_FEATURES.length; w++) {
            if (out.wanted[WANTED_FEATURES[w]]) required.push(WANTED_FEATURES[w]);
          }
          return adapter.requestDevice({ requiredFeatures: required })
            .then(function (device) {
              out.device = device;
              device.lost.then(function (infoLost) {
                out.deviceLostReason = (infoLost && infoLost.reason) || 'unknown';
                U.log('gpu', 'device lost: ' + out.deviceLostReason);
              }).catch(function () { });
              return out;
            })
            .catch(function (err) {
              // 特性申请失败时退回默认设备
              return adapter.requestDevice().then(function (device) {
                out.device = device;
                out.error = '申请全部特性失败，已退回默认设备：' + (err && err.message ? err.message : err);
                return out;
              }).catch(function (err2) {
                out.error = 'requestDevice() 失败：' + (err2 && err2.message ? err2.message : err2);
                return out;
              });
            });
        });
      })
      .catch(function (err) {
        out.error = 'WebGPU 初始化异常：' + (err && err.message ? err.message : err);
        return out;
      });
  }

  /* --------------------------- 综合探测 --------------------------- */

  function softwareRenderers() {
    return ['swiftshader', 'llvmpipe', 'softpipe', 'basic render', 'basicrender',
      'microsoft basic', 'software adapter', 'software rasterizer', 'mesa offscreen',
      'vmware svga', 'virtualbox', 'paralleldisplay', 'citrix', 'remote display',
      'google swiftshader', 'angle (google, vulkan 1.3.0 (swiftshader'];
  }

  function isSoftwareString(s) {
    if (!s) return false;
    var t = String(s).toLowerCase();
    for (var i = 0; i < softwareRenderers().length; i++) {
      if (t.indexOf(softwareRenderers()[i]) >= 0) return true;
    }
    return false;
  }

  /**
   * 全量探测。返回 Promise<deviceInfo>
   * opts: { wantDevice: true } —— 是否申请 WebGPU 设备（会占用一点显存）
   */
  function collect(opts) {
    opts = opts || {};
    var t0 = U.now();
    var info = {
      collectedAt: Date.now(),
      collectedAtText: U.fmt.date(Date.now()),
      durationMs: 0,
      browser: null, os: null, hardware: null,
      webgl: null, webgpu: null,
      flags: {}, warnings: [], errors: []
    };

    info.browser = detectBrowser();
    info.os = info.browser.os;

    info.hardware = {
      cpuCores: navigator.hardwareConcurrency || null,
      deviceMemoryGB: navigator.deviceMemory || null,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      screen: {
        width: screen.width, height: screen.height,
        availWidth: screen.availWidth, availHeight: screen.availHeight,
        colorDepth: screen.colorDepth, pixelDepth: screen.pixelDepth,
        orientation: (screen.orientation && screen.orientation.type) || ''
      },
      window: { innerWidth: innerWidth, innerHeight: innerHeight, outerWidth: outerWidth, outerHeight: outerHeight },
      devicePixelRatio: devicePixelRatio,
      refreshRateHz: null,
      timezone: (function () {
        try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { return ''; }
      })(),
      gpuFromUAData: null
    };

    info.webgl = webglInfo();

    var hePromise = detectHighEntropy().then(function (he) {
      info.highEntropy = he;
      if (he) {
        info.os.version = he.platformVersion || info.os.version;
        info.os.arch = he.architecture ? (he.architecture + (he.bitness ? '-' + he.bitness : '')) : '';
        info.os.model = he.model || info.os.model || '';
        info.browser.fullVersion = he.uaFullVersion || '';
      }
      return he;
    });

    var gpuPromise = Promise.resolve({ supported: false });
    if (navigator.gpu) {
      gpuPromise = webgpuInfo().then(function (g) {
        info.webgpu = g;
        if (!opts.wantDevice && g.device) {
          // 调用方不需要设备时释放它，避免占用
          try { g.device.destroy(); } catch (e) { /* noop */ }
          g.device = null;
        }
        return g;
      });
    } else {
      info.webgpu = {
        supported: false, error: '当前浏览器不支持 WebGPU（navigator.gpu 不存在）',
        adapterInfo: null, features: [], limits: {}, wanted: {}
      };
      gpuPromise = Promise.resolve(info.webgpu);
    }

    return Promise.all([hePromise, gpuPromise]).then(function () {
      classify(info);
      info.durationMs = U.now() - t0;
      return info;
    });
  }

  function classify(info) {
    var wg = info.webgl || {};
    var gp = info.webgpu || {};
    var renderer = wg.unmaskedRenderer || wg.renderer || '';
    var vendor = wg.unmaskedVendor || wg.vendor || '';
    var wgpuDesc = gp.info ? [gp.info.vendor, gp.info.architecture, gp.info.device, gp.info.description].filter(Boolean).join(' ') : '';

    var combined = (renderer + ' ' + vendor + ' ' + wgpuDesc).toLowerCase();

    info.flags.webglAvailable = !!wg.supported;
    info.flags.webgpuAvailable = !!gp.supported && !!gp.adapter;
    info.flags.webgpuDevice = !!(gp.device);
    info.flags.hardwareAccelerated = !isSoftwareString(renderer) && !isSoftwareString(wgpuDesc);
    info.flags.softwareRenderer = !info.flags.hardwareAccelerated;
    info.flags.fallbackAdapter = !!gp.fallback;
    info.flags.timerQueryWG = !!wg.timerQuery;
    info.flags.timerQueryWGPU = !!gp.timestamp;
    info.flags.shaderF16 = !!gp.shaderF16;
    info.flags.maskedRenderer = !!wg.masked;
    info.flags.crossOriginIsolated = !!global.crossOriginIsolated;
    info.flags.secureContext = !!global.isSecureContext;
    info.flags.fileProtocol = location.protocol === 'file:';

    info.flags.vendorHint = guessVendor(combined);
    info.flags.gpuKindHint = guessKind(combined, info);
    info.flags.canBenchmark = info.flags.hardwareAccelerated && (info.flags.webgpuAvailable || info.flags.webglAvailable);

    if (!wg.supported) info.warnings.push('当前环境不支持 WebGL，无法运行任何图形测试。');
    if (!gp.supported) info.warnings.push('当前浏览器不支持 WebGPU，将使用 WebGL2 后端（功能与精度略低）。');
    if (info.flags.softwareRenderer) info.warnings.push('检测到软件光栅化（如 SwiftShader / llvmpipe / 基本渲染驱动），成绩不代表真实 GPU 性能。');
    if (info.flags.fallbackAdapter) info.warnings.push('WebGPU 返回的是 fallback adapter，性能会显著低于真实 GPU。');
    if (wg.masked) info.warnings.push('浏览器屏蔽了 WebGL 渲染器字符串，GPU 型号识别可能不准确。');
    if (/^\s*apple gpu\s*$/i.test(renderer.trim())) {
      info.warnings.push('Safari 只上报通用名「Apple GPU」，无法识别具体型号；报告会按设备档位估算理论峰值，实测分数不受影响。');
    }
    if (info.hardware.devicePixelRatio >= 2 && info.browser.mobile) {
      info.warnings.push('检测到高分屏移动设备：测试统一按固定像素数渲染（与 DPR 无关），分数与其他设备可比。');
    }
    if (info.flags.fileProtocol) info.warnings.push('当前通过 file:// 打开，部分功能（如历史记录/分享链接）可能受限，建议用本地 HTTP 服务访问。');
    if (!info.flags.timerQueryWGPU && !info.flags.timerQueryWG) info.warnings.push('当前环境没有 GPU 计时扩展，将使用 CPU 墙钟计时（结果会包含驱动开销）。');

    // CPU 侧 GPU 提示（比如核显/独显）
    if (info.highEntropy && /nvidia|amd|radeon|geforce|intel/i.test(combined)) {
      info.hardware.gpuFromUAData = null;
    }

    info.profile = profileOf(info);
    return info;
  }

  /* --------------------------------------------------------------------------
   * 设备档位画像
   *   workloadScale —— 各测试「单批迭代数」的缩放系数。
   *     不同档位的绝对算力差 50 倍以上（RTX 4090 vs 入门手机），
   *     若用同一套迭代上限，手机端会跑到几百秒甚至直接把上下文跑丢。
   *     缩放后各档位都能把单批耗时压到目标区间，而**计量单位不变**，
   *     所以分数依然可比。
   *   memoryBudgetMB —— 给基准测试用的显存/统一内存预算（保守值）。
   *     移动端统一内存要和系统、浏览器、页面共用，取太大会闪退，
   *     各测试按这个预算决定缓冲区与纹理尺寸。
   * ------------------------------------------------------------------------*/
  var TIER_PROFILE = {
    'desktop-dgpu': { label: '桌面独显', workloadScale: 1.00, memMB: 640, chips: '独显' },
    'laptop-dgpu': { label: '笔记本独显', workloadScale: 0.65, memMB: 448, chips: '独显' },
    'apple-soc': { label: 'Apple 统一内存', workloadScale: 0.50, memMB: 320, chips: '统一内存' },
    'integrated': { label: '核显', workloadScale: 0.30, memMB: 224, chips: '统一内存' },
    'mobile-soc': { label: '移动 SoC', workloadScale: 0.18, memMB: 160, chips: '统一内存' },
    'software': { label: '软件渲染', workloadScale: 0.02, memMB: 64, chips: '软件' },
    'unknown': { label: '未知档位', workloadScale: 0.45, memMB: 224, chips: '未知' }
  };

  /** 数据库里的 type 与档位 key 不是同一套命名，做一层映射 */
  var KIND_ALIAS = {
    desktop: 'desktop-dgpu',
    workstation: 'desktop-dgpu',
    laptop: 'laptop-dgpu',
    integrated: 'integrated',
    'apple-soc': 'apple-soc',
    'mobile-soc': 'mobile-soc',
    tablet: 'mobile-soc',
    software: 'software'
  };

  function profileOf(info, kindOverride) {
    var rawKind = kindOverride || (info.flags && info.flags.gpuKindHint) || 'unknown';
    var kind = KIND_ALIAS[rawKind] || rawKind;
    var base = TIER_PROFILE[kind] || TIER_PROFILE.unknown;
    var memMB = base.memMB;
    var scale = base.workloadScale;

    // 统一内存档位再按浏览器上报的设备内存收紧（独显不受系统内存影响）
    var dm = info.hardware && info.hardware.deviceMemoryGB;
    var unified = base.chips === '统一内存';
    if (unified && dm) {
      // 只敢用设备内存的一小部分：系统 + 浏览器 + 页面都要用
      var cap = Math.max(48, Math.round(dm * 1024 * 0.06));
      memMB = Math.min(memMB, cap);
    }
    if (info.flags && info.flags.softwareRenderer) {
      memMB = Math.min(memMB, 96);
      scale = Math.min(scale, 0.05);
    }
    // WebGPU 上报的绑定上限也要尊重，避免申请出绑定不了的缓冲区
    var maxBind = info.webgpu && info.webgpu.limits && info.webgpu.limits.maxStorageBufferBindingSize;
    if (maxBind) memMB = Math.min(memMB, Math.max(32, Math.round(maxBind / (1024 * 1024) * 0.6)));

    return {
      tier: kind,
      label: base.label,
      isUnified: unified,
      workloadScale: scale,
      memoryBudgetMB: memMB,
      deviceMemoryGB: dm || null,
      note: base.chips === '统一内存'
        ? '统一内存设备：基准测试的缓冲区总预算按 ' + memMB + ' MB 控制' +
          (dm ? '（浏览器上报设备内存 ' + dm + ' GB）' : '（浏览器未上报设备内存，用档位默认值）')
        : '独立显存设备：基准测试缓冲区预算 ' + memMB + ' MB'
    };
  }

  function guessVendor(s) {
    if (/nvidia|geforce|quadro|rtx|gtx|tesla/.test(s)) return 'NVIDIA';
    if (/amd|radeon|ati |advanced micro/.test(s)) return 'AMD';
    if (/intel|iris|uhd graphics|hd graphics|arc /.test(s)) return 'Intel';
    if (/apple|m1|m2|m3|m4|a1[0-9] |a[0-9]{2} gpu/.test(s)) return 'Apple';
    if (/qualcomm|adreno/.test(s)) return 'Qualcomm';
    if (/maleoon|kirin|huawei/.test(s)) return 'Huawei';
    if (/xclipse/.test(s)) return 'Samsung';
    if (/mali|arm |immortalis/.test(s)) return 'ARM';
    if (/imagination|powervr|img /i.test(s)) return 'Imagination';
    if (/microsoft|basic render|swiftshader|llvmpipe/.test(s)) return 'Microsoft / 软件';
    return '未知';
  }

  function guessKind(s, info) {
    if (isSoftwareString(s)) return 'software';

    // 移动端优先判断：手机 SoC 的名字里也可能出现 "mobile" 之类的词，
    // 如果先走桌面分支会被误判成笔记本独显。
    if (/adreno|mali-|mali |immortalis|powervr|maleoon|xclipse|videocore/.test(s)) return 'mobile-soc';

    if (/rtx 50|rtx 40|rtx 30|rtx 20|gtx 16|gtx 10|rx 9\d{3}|rx 7\d{3}|rx 6\d{3}|arc [ab]\d{3}|titan/.test(s)) {
      if (/laptop|mobile|max-q|notebook/.test(s)) return 'laptop-dgpu';
      return 'desktop-dgpu';
    }
    if (/laptop|max-q|notebook/.test(s)) return 'laptop-dgpu';
    if (/apple m\d|apple gpu|apple a\d/.test(s)) return 'apple-soc';
    if (/iris|uhd graphics|hd graphics|vega \d+|radeon graphics|\d+m\b|arc graphics/.test(s)) return 'integrated';

    // 型号没认出来时，用 WebGPU 上报的架构名兜底（例如矿卡 P106-100 会报 pascal）
    if (/pascal|turing|ampere|lovelace|blackwell|maxwell|kepler|rdna-[1-9]|gcn-\d/.test(s)) {
      return /laptop|mobile|max-q/.test(s) ? 'laptop-dgpu' : 'desktop-dgpu';
    }
    if (/gen-\d|xe-lpg|xe-2lpg|xe-hpg|valhall|bifrost/.test(s)) {
      return /valhall|bifrost/.test(s) ? 'mobile-soc' : 'integrated';
    }

    if (info && info.browser && info.browser.mobile) return 'mobile-soc';
    return 'unknown';
  }

  /* --------------------------- 刷新率测量 --------------------------- */

  /**
   * 用 rAF 测显示器刷新率（约 0.6 秒）。
   * 注意：无头环境、后台标签页、某些虚拟显示器下 rAF 可能完全不触发，
   * 因此必须有超时兜底，否则整个 UI 会永远卡在「测量中…」。
   */
  function measureRefreshRate(samples) {
    samples = samples || 45;
    return new Promise(function (resolve) {
      var settled = false;
      var timer = setTimeout(function () {
        if (settled) return;
        settled = true;
        resolve({ hz: 60, snapped: 60, frameMs: 1000 / 60, samples: 0, timeout: true });
      }, 3000);

      function finish(list) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        var med = U.stats.median(list);
        var hz = med > 0 ? 1000 / med : 60;
        var common = [30, 48, 50, 60, 72, 75, 90, 100, 120, 144, 165, 180, 240, 360];
        var best = common[0], bestD = Infinity;
        for (var i = 0; i < common.length; i++) {
          var d = Math.abs(common[i] - hz);
          if (d < bestD) { bestD = d; best = common[i]; }
        }
        resolve({ hz: hz, snapped: best, frameMs: med, samples: list.length });
      }

      var times = [], last = 0, n = 0;
      function tick(t) {
        if (settled) return;
        if (last) times.push(t - last);
        last = t;
        n++;
        if (n < samples) requestAnimationFrame(tick);
        else finish(times);
      }
      try { requestAnimationFrame(tick); } catch (e) { finish([1000 / 60]); }
    });
  }

  Nova.detect = {
    collect: collect,
    webglInfo: webglInfo,
    webgpuInfo: webgpuInfo,
    detectBrowser: detectBrowser,
    measureRefreshRate: measureRefreshRate,
    isSoftwareString: isSoftwareString,
    profileOf: profileOf,
    TIER_PROFILE: TIER_PROFILE
  };

})(window);
