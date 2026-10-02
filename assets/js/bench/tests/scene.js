/* ============================================================================
 * NovaMark-Lite · 综合测试（多 pass 渲染 + 稳定性循环）
 *
 * 本版三项测试之一（球体环 / 毒蘑菇 / 综合测试），也是唯一的四段连续场景序列：
 *   1) 星环      —— 基础单场景（8000ms）
 *   2) 峡谷·黄昏 —— 8 pass（12000ms）
 *   3) 峡谷·云海 —— 叠加体积云海（14000ms）
 *   4) 都市·风暴 —— 城市几何 + 沙尘（16000ms）
 * （上面的时长是标准预设；quality/preset 不同会按比例缩放）
 *
 * 对标 3DMark 这类场景测试的构成，一帧包含 8 个 pass：
 *   1) 阴影        —— 平行光视角渲染地形 + 岩石到 2048² 深度图
 *   2) 背景        —— 全屏程序化星云（5 阶 fbm）+ 星空 + 太阳光晕
 *   3) 主体几何    —— PBR(Cook-Torrance) + 5 光源 + 3×3 PCF 阴影 + 程序化法线 + 高度雾
 *   4) 粒子        —— 2.4 万实例化广告牌，加法混合，制造大量 overdraw
 *   5) 亮度提取    —— 半分辨率阈值提取
 *   6) 高斯模糊 H  —— 半分辨率
 *   7) 高斯模糊 V  —— 半分辨率
 *   8) 合成        —— bloom + ACES 色调映射 + 暗角 + 色散 + 胶片颗粒
 * （云海 / 沙尘段额外插入一个全屏体积介质 pass，共 9 个 pass）
 *
 * 场景内容全部程序化生成，不依赖任何外部资源：
 *   · 地形：384×384 网格（约 29 万三角形），CPU 生成低频起伏，顶点着色器叠高频细节
 *   · 岩石：1600 个实例化球体（约 51 万三角形），逐实例随机形状与朝向
 *   · 粒子：24000 个实例化广告牌
 * 一帧几何量约 80 万三角形，加上阴影 pass 翻倍，合计约 160 万三角形/帧。
 *
 * 跨平台可比性：所有档位使用**同一套场景内容**，只有时长不同，因此分数可直接横向对比。
 * ==========================================================================*/
(function (global) {
  'use strict';

  var Nova = global.Nova = global.Nova || {};
  var U = Nova.util;

  /* ============================ 数学工具 ============================ */

  function mat4Perspective(out, fovy, aspect, near, far) {
    var f = 1.0 / Math.tan(fovy / 2), nf = 1 / (near - far);
    out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
    out[8] = 0; out[9] = 0; out[10] = (far + near) * nf; out[11] = -1;
    out[12] = 0; out[13] = 0; out[14] = 2 * far * near * nf; out[15] = 0;
    return out;
  }

  /** 对称正交投影（阴影相机用） */
  function mat4Ortho(out, half, near, far) {
    out[0] = 1 / half; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = 1 / half; out[6] = 0; out[7] = 0;
    out[8] = 0; out[9] = 0; out[10] = 2 / (near - far); out[11] = 0;
    out[12] = 0; out[13] = 0; out[14] = (far + near) / (near - far); out[15] = 1;
    return out;
  }

  function mat4LookAt(out, eye, center, up) {
    var zx = eye[0] - center[0], zy = eye[1] - center[1], zz = eye[2] - center[2];
    var zl = Math.hypot(zx, zy, zz) || 1;
    zx /= zl; zy /= zl; zz /= zl;
    var xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
    var xl = Math.hypot(xx, xy, xz) || 1;
    xx /= xl; xy /= xl; xz /= xl;
    var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
    out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
    out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
    out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
    out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
    out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
    out[15] = 1;
    return out;
  }

  function mat4Multiply(out, a, b) {
    for (var c = 0; c < 4; c++) {
      for (var r = 0; r < 4; r++) {
        out[c * 4 + r] = a[0 * 4 + r] * b[c * 4 + 0] + a[1 * 4 + r] * b[c * 4 + 1] +
          a[2 * 4 + r] * b[c * 4 + 2] + a[3 * 4 + r] * b[c * 4 + 3];
      }
    }
    return out;
  }

  /* ============================ 网格生成 ============================ */

  /* CPU 侧噪声：与着色器里的 fbm 同一套思路，但只做 3 阶（着色器会补高频细节） */
  function hash21(x, y) {
    var qx = (x * 123.34) % 1, qy = (y * 456.21) % 1;
    if (qx < 0) qx += 1;
    if (qy < 0) qy += 1;
    var d = qx * qx + qy * qy + 45.32;
    qx += d; qy += d;
    var v = (qx * qy) % 1;
    return v < 0 ? v + 1 : v;
  }
  function vnoise(x, y) {
    var ix = Math.floor(x), iy = Math.floor(y);
    var fx = x - ix, fy = y - iy;
    var ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    var a = hash21(ix, iy), b = hash21(ix + 1, iy);
    var c = hash21(ix, iy + 1), d = hash21(ix + 1, iy + 1);
    var top = a + (b - a) * ux;
    var bot = c + (d - c) * ux;
    return top + (bot - top) * uy;
  }
  function fbm3(x, y) {
    var s = 0, a = 0.5, px = x, py = y;
    for (var i = 0; i < 3; i++) {
      s += a * (vnoise(px, py) * 2 - 1);
      px = px * 2.03 + 11.3; py = py * 2.03 + 7.7;
      a *= 0.5;
    }
    return s;
  }

  /**
   * 生成峡谷地形网格：外圈抬升成岩壁，中心下沉成谷底。
   * 顶点布局 pos(3) + normal(3) + uv(2) = 32 字节。
   */
  function buildTerrain(segments, extent) {
    var n = segments + 1;
    var pos = new Float32Array(n * n * 8);
    var height = new Float32Array(n * n);
    var i, j;

    function sampleH(wx, wz) {
      var base = fbm3(wx * 0.035, wz * 0.035) * 2.6;
      var ridge = fbm3(wx * 0.011, wz * 0.011) * 9.0;
      var radial = Math.hypot(wx, wz) / extent;
      var wall = Math.pow(Math.max(0, radial - 0.34), 2.0) * 46.0;
      var trench = -Math.pow(Math.max(0, 0.34 - radial), 2.0) * 9.0;
      return base + ridge + wall + trench - 4.0;
    }

    for (j = 0; j < n; j++) {
      for (i = 0; i < n; i++) {
        var u = (i / segments) * 2 - 1;
        var v = (j / segments) * 2 - 1;
        height[j * n + i] = sampleH(u * extent, v * extent);
      }
    }

    var step = (extent * 2) / segments;
    for (j = 0; j < n; j++) {
      for (i = 0; i < n; i++) {
        var idx = j * n + i;
        var hl = height[j * n + Math.max(0, i - 1)];
        var hr = height[j * n + Math.min(n - 1, i + 1)];
        var hd = height[Math.max(0, j - 1) * n + i];
        var hu = height[Math.min(n - 1, j + 1) * n + i];
        var nx = (hl - hr), ny = 2 * step, nz = (hd - hu);
        var len = Math.hypot(nx, ny, nz) || 1;
        var o = idx * 8;
        pos[o + 0] = ((i / segments) * 2 - 1) * extent;
        pos[o + 1] = height[idx];
        pos[o + 2] = ((j / segments) * 2 - 1) * extent;
        pos[o + 3] = nx / len;
        pos[o + 4] = ny / len;
        pos[o + 5] = nz / len;
        pos[o + 6] = i / segments;
        pos[o + 7] = j / segments;
      }
    }

    var quads = segments * segments;
    var indices = new Uint32Array(quads * 6);
    var k = 0;
    for (j = 0; j < segments; j++) {
      for (i = 0; i < segments; i++) {
        var a = j * n + i, b = a + 1, c = a + n, d = c + 1;
        indices[k++] = a; indices[k++] = c; indices[k++] = b;
        indices[k++] = b; indices[k++] = c; indices[k++] = d;
      }
    }
    return { vertices: pos, indices: indices, indexCount: indices.length, triangles: quads * 2 };
  }

  /** 生成 icosphere（岩石基础形状）：pos(3) + normal(3) 交错，24 字节 */
  function buildIcosphere(subdivisions) {
    var t = (1 + Math.sqrt(5)) / 2;
    var verts = [
      [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
      [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
    ];
    var faces = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
    ];
    function norm(v) {
      var l = Math.hypot(v[0], v[1], v[2]) || 1;
      return [v[0] / l, v[1] / l, v[2] / l];
    }
    verts = verts.map(norm);
    var cache = {};
    function mid(a, b) {
      var key = a < b ? a + '_' + b : b + '_' + a;
      if (cache[key] !== undefined) return cache[key];
      var va = verts[a], vb = verts[b];
      verts.push(norm([(va[0] + vb[0]) / 2, (va[1] + vb[1]) / 2, (va[2] + vb[2]) / 2]));
      cache[key] = verts.length - 1;
      return cache[key];
    }
    for (var s = 0; s < (subdivisions || 2); s++) {
      var next = [];
      for (var i = 0; i < faces.length; i++) {
        var f = faces[i];
        var a2 = mid(f[0], f[1]), b2 = mid(f[1], f[2]), c2 = mid(f[2], f[0]);
        next.push([f[0], a2, c2], [f[1], b2, a2], [f[2], c2, b2], [a2, b2, c2]);
      }
      faces = next;
    }
    var data = new Float32Array(verts.length * 6);
    for (var v = 0; v < verts.length; v++) {
      data[v * 6 + 0] = verts[v][0]; data[v * 6 + 1] = verts[v][1]; data[v * 6 + 2] = verts[v][2];
      data[v * 6 + 3] = verts[v][0]; data[v * 6 + 4] = verts[v][1]; data[v * 6 + 5] = verts[v][2];
    }
    var idxs = new Uint32Array(faces.length * 3);
    for (var m = 0; m < faces.length; m++) {
      idxs[m * 3] = faces[m][0]; idxs[m * 3 + 1] = faces[m][1]; idxs[m * 3 + 2] = faces[m][2];
    }
    return { vertices: data, indices: idxs, indexCount: idxs.length, triangles: faces.length };
  }

  /* ============================ 场景参数 ============================ */

  var PRESETS = {
    low: { rocks: 700, terrainSegments: 192, particles: 9000, shadowSize: 1024 },
    medium: { rocks: 1600, terrainSegments: 384, particles: 24000, shadowSize: 2048 },
    high: { rocks: 3200, terrainSegments: 512, particles: 48000, shadowSize: 2048 }
  };
  var TERRAIN_EXTENT = 150;

  function sceneConfig(opts) {
    opts = opts || {};
    var p = PRESETS[opts.preset] || PRESETS.medium;
    return {
      preset: opts.preset || 'medium',
      rocks: opts.rocks || p.rocks,
      terrainSegments: opts.terrainSegments || p.terrainSegments,
      particles: opts.particles || p.particles,
      shadowSize: opts.shadowSize || p.shadowSize,
      terrainExtent: TERRAIN_EXTENT,
      bloomScale: 0.5,
      bloomStrength: 0.32,
      exposure: 0.85,
      fogDensity: 0.0075,
      durationMs: opts.durationMs || 18000,
      warmupMs: opts.warmupMs || 1600,
      tailMs: opts.tailMs || 600,
      rounds: opts.rounds || 1,
      roundMs: opts.roundMs || 5000,
      // 窗口内**一次性提交** depth 帧，再用 GPU 时间戳量这个窗口的 GPU 耗时。
      // 因为不再逐帧提交，GPU 不会在帧间跑空，depth 对结果几乎没有影响
      // （实测 821 vs 818 FPS），所以取 2 换取更细的采样粒度。
      pipelineDepth: opts.pipelineDepth || 2,
      // 场景序列按时长缩放：快速扫描接近原速，完整测试拉长
      segmentScale: opts.segmentScale || 1,
      sceneMode: opts.sceneMode || null,
      volumetricDensity: opts.volumetricDensity || 0,
      stabilityMode: !!opts.stabilityMode
    };
  }

  /* ------------------------- 多场景序列定义 -------------------------
   * 综合测试由若干**连续场景**组成，一段比一段复杂：
   *   1) 星环      —— 单一几何 pass，无阴影/粒子/后处理（作为序列里的基准段）
   *   2) 峡谷·黄昏 —— 8 pass：阴影 + 背景 + PBR 几何 + 粒子 + bloom 三级 + 合成
   *   3) 峡谷·云海 —— 再加体积云海 pass（每像素 40 步 × 9 次 fbm 光线步进）
   *   4) 都市·风暴 —— 换成城市几何（窗格灯火）+ 6 万粒子 + 低空沙尘
   * Lite说明：综合测试的四段序列是本版唯一的「场景序列」负载；
   * 完整版里那个独立的「球体环」测试项（Nova.makeRingSceneTest）在本版同样保留，
   * 序列的第一段「星环」是它在序列内的等价负载。微基准不在本版范围内。
   *
   * 每段都独立计时，最终场景分 = 全部段的总帧数 ÷ 总时长，
   * 也就是「整条序列的平均帧率」，各段权重自然等于其时长。
   * ------------------------------------------------------------------ */

  function segmentList(presetKey, scale) {
    scale = scale || 1;
    var s = PRESETS[presetKey] || PRESETS.medium;
    var base = [

      {
        id: 'ring', name: '星环（基础单场景）', ms: 8000, mode: 'ring',
        terrain: false, shadow: false, particles: 0, volumetric: 0, bloom: false,
        instances: 900, exposure: 1.0, fogDensity: 0.0035
      },
      {
        id: 'canyon', name: '峡谷·黄昏', ms: 12000, mode: 'canyon',
        terrain: true, shadow: true, particles: s.particles, volumetric: 0, bloom: true,
        fogDensity: 0.0090
      },
      {
        id: 'cloud', name: '峡谷·云海', ms: 14000, mode: 'canyon',
        terrain: true, shadow: true, particles: s.particles, volumetric: 0.52, bloom: true,
        fogDensity: 0.0110
      },
      {
        id: 'city', name: '都市·风暴', ms: 16000, mode: 'city',
        terrain: false, shadow: true, particles: Math.round(s.particles * 2.5), volumetric: 0.24, bloom: true,
        instances: 1936, exposure: 0.62, fogDensity: 0.0180
      }
    ];
    return base.map(function (seg) {
      var out = {};
      for (var k in seg) if (Object.prototype.hasOwnProperty.call(seg, k)) out[k] = seg[k];
      out.ms = Math.max(2000, Math.round(seg.ms * scale));
      return out;
    });
  }

  /** 稳定性模式：把「峡谷·黄昏」这一重负载段重复 N 轮，逐轮比较帧率衰减 */
  function stabilitySegments(cfg) {
    var n = Math.max(2, cfg.rounds || 20);
    var ms = Math.max(1500, cfg.roundMs || 5000);
    var src = segmentList(cfg.preset, 1)[1];
    var out = [];
    for (var i = 0; i < n; i++) {
      var s = {};
      for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) s[k] = src[k];
      s.ms = ms;
      s.name = '压力轮次 ' + (i + 1) + '/' + n;
      s.id = 'stress-' + (i + 1);
      out.push(s);
    }
    return out;
  }

  /** 把「全局场景配置」与「某一段的覆盖项」合成该段实际使用的配置 */
  function mergeSegment(cfg, seg) {
    var sc = {};
    for (var k in cfg) if (Object.prototype.hasOwnProperty.call(cfg, k)) sc[k] = cfg[k];
    for (var k2 in seg) {
      if (!Object.prototype.hasOwnProperty.call(seg, k2)) continue;
      if (k2 === 'rocks') continue;               // 只认 instances
      sc[k2 === 'ms' ? 'durationMs' : k2] = seg[k2];
    }
    sc.rocks = seg.instances || cfg.rocks;
    sc.sceneMode = seg.mode || 'canyon';
    sc.volumetricDensity = seg.volumetric || 0;
    sc.useTerrain = seg.terrain !== false;
    sc.useShadow = seg.shadow !== false;
    sc.useBloom = seg.bloom !== false;
    return sc;
  }

  var LIGHTS = [
    { pos: [46, 16, -30], col: [1.00, 0.48, 0.22], orbit: 0.10 },
    { pos: [-38, 20, 34], col: [0.26, 0.62, 1.00], orbit: -0.13 },
    { pos: [22, -8, 44], col: [0.80, 0.30, 1.00], orbit: 0.07 },
    { pos: [-30, 26, -36], col: [0.24, 1.00, 0.78], orbit: -0.05 }
  ];

  /** 电影感相机路径。峡谷段在谷上方环绕俯视；都市段压到楼群之间穿行。 */
  function cameraAt(t, mode) {
    var a, r, eye, center;
    if (mode === 'city') {
      // 都市：低空穿行，仰角小，能同时看到近景高楼与远景天际线
      a = t * 0.055;
      r = 118 + Math.sin(t * 0.09) * 26;
      eye = [Math.cos(a) * r, 26 + Math.sin(t * 0.17) * 12, Math.sin(a) * r];
      var b2 = a + 0.42;
      center = [Math.cos(b2) * 30, 34 + Math.sin(t * 0.21) * 10, Math.sin(b2) * 30];
    } else {
      a = t * 0.072;
      r = 84 + Math.sin(t * 0.11) * 18;
      // 高度必须稳稳高于地形（谷底约 -14，外圈岩壁最高约 +42），否则相机会钻进地里，
      // 背面剔除之后会直接看穿地形、画面上下颠倒
      eye = [Math.cos(a) * r, 34 + Math.sin(t * 0.19) * 9, Math.sin(a) * r];
      var b = a + 0.78;
      center = [Math.cos(b) * 26, -3 + Math.sin(t * 0.23) * 4, Math.sin(b) * 26];
    }
    var fwd = [center[0] - eye[0], center[1] - eye[1], center[2] - eye[2]];
    var fl = Math.hypot(fwd[0], fwd[1], fwd[2]) || 1;
    fwd = [fwd[0] / fl, fwd[1] / fl, fwd[2] / fl];
    var right = [
      fwd[1] * 0 - fwd[2] * 1,
      fwd[2] * 0 - fwd[0] * 0,
      fwd[0] * 1 - fwd[1] * 0
    ];
    var rl = Math.hypot(right[0], right[1], right[2]) || 1;
    right = [right[0] / rl, right[1] / rl, right[2] / rl];
    var up = [
      right[1] * fwd[2] - right[2] * fwd[1],
      right[2] * fwd[0] - right[0] * fwd[2],
      right[0] * fwd[1] - right[1] * fwd[0]
    ];
    return { eye: eye, center: center, fwd: fwd, right: right, up: up };
  }

  /** 填充 384 字节的场景 uniform（96 个 float） */
  function fillSceneUniform(arr, t, cfg, cam, aspect, resW, resH) {
    var cam2 = cam || cameraAt(t);
    var proj = mat4Perspective(new Float32Array(16), 58 * Math.PI / 180, aspect, 0.5, 480);
    var view = mat4LookAt(new Float32Array(16), cam2.eye, cam2.center, [0, 1, 0]);
    var vp = mat4Multiply(new Float32Array(16), proj, view);
    var i;
    for (i = 0; i < 16; i++) arr[i] = vp[i];

    // 阴影相机：从太阳方向俯视整个场景
    var sd = [-0.42, -0.72, 0.55];
    var sl = Math.hypot(sd[0], sd[1], sd[2]);
    sd = [sd[0] / sl, sd[1] / sl, sd[2] / sl];
    var lightEye = [-sd[0] * 190, -sd[1] * 190, -sd[2] * 190];
    var lproj = mat4Ortho(new Float32Array(16), 190, 1, 420);
    var lview = mat4LookAt(new Float32Array(16), lightEye, [0, 0, 0], [0, 1, 0]);
    var lvp = mat4Multiply(new Float32Array(16), lproj, lview);
    for (i = 0; i < 16; i++) arr[16 + i] = lvp[i];

    arr[32] = cam2.eye[0]; arr[33] = cam2.eye[1]; arr[34] = cam2.eye[2]; arr[35] = 1;
    arr[36] = cam2.right[0]; arr[37] = cam2.right[1]; arr[38] = cam2.right[2]; arr[39] = 0;
    arr[40] = cam2.up[0]; arr[41] = cam2.up[1]; arr[42] = cam2.up[2]; arr[43] = 0;
    arr[44] = cam2.fwd[0]; arr[45] = cam2.fwd[1]; arr[46] = cam2.fwd[2]; arr[47] = 0;

    for (var l = 0; l < 4; l++) {
      var L = LIGHTS[l];
      var a = t * L.orbit;
      var ca = Math.cos(a), sa = Math.sin(a);
      arr[48 + l * 4 + 0] = L.pos[0] * ca - L.pos[2] * sa;
      arr[48 + l * 4 + 1] = L.pos[1] + Math.sin(t * 0.4 + l) * 6;
      arr[48 + l * 4 + 2] = L.pos[0] * sa + L.pos[2] * ca;
      arr[48 + l * 4 + 3] = 1;
    }
    for (var c2 = 0; c2 < 4; c2++) {
      arr[64 + c2 * 4 + 0] = LIGHTS[c2].col[0];
      arr[64 + c2 * 4 + 1] = LIGHTS[c2].col[1];
      arr[64 + c2 * 4 + 2] = LIGHTS[c2].col[2];
      arr[64 + c2 * 4 + 3] = 1;
    }

    arr[80] = sd[0]; arr[81] = sd[1]; arr[82] = sd[2]; arr[83] = 1.0;
    arr[84] = t;
    arr[85] = cfg.rocks;
    arr[86] = cfg.exposure;
    arr[87] = cfg.fogDensity;
    arr[88] = cfg.particles;
    arr[89] = cfg.bloomStrength;
    arr[90] = cfg.terrainExtent;
    arr[91] = 1 / cfg.shadowSize;
    arr[92] = resW; arr[93] = resH;
    arr[94] = (cfg.volumetricDensity === undefined || cfg.volumetricDensity === null)
      ? 0 : cfg.volumetricDensity;            // 体积介质密度，0 = 该 pass 直接返回
    arr[95] = cfg.sceneMode === 'city' ? 1 : 0; // 0 = 峡谷岩石 / 1 = 都市沙尘
    return arr;
  }

  /* ======================= 帧时间采集与收敛判定 ======================= */

  function downsample(arr, maxPoints) {
    if (arr.length <= maxPoints) return arr.slice();
    var out = [], step = arr.length / maxPoints;
    for (var i = 0; i < maxPoints; i++) out.push(arr[Math.floor(i * step)]);
    return out;
  }

  function analyzeFrames(frameTimesMs, opts) {
    opts = opts || {};
    var warm = opts.warmupMs || 0, tail = opts.tailMs || 0;
    var times = [], acc = 0;
    for (var i = 0; i < frameTimesMs.length; i++) {
      acc += frameTimesMs[i];
      if (acc >= warm && acc <= (opts.totalMs || Infinity) - tail) times.push(frameTimesMs[i]);
    }
    if (times.length < 8) times = frameTimesMs.slice();

    var fs = (Nova.score && Nova.score.frameStats) ? Nova.score.frameStats(times) : {
      fpsAvg: times.length ? 1000 / U.stats.mean(times) : NaN,
      fps1Low: U.stats.lowFps(times, 0.01), fps01Low: U.stats.lowFps(times, 0.001),
      p99: U.stats.percentile(times, 0.99), median: U.stats.median(times),
      jitter: 0, smoothness: 0
    };
    return {
      frames: times.length,
      fpsAvg: fs.fpsAvg, fps1Low: fs.fps1Low, fps01Low: fs.fps01Low,
      p99FrameMs: fs.p99, medianFrameMs: fs.median,
      jitter: fs.jitter, smoothness: fs.smoothness,
      frameTimes: downsample(times, 600)
    };
  }

  /* ========================== WebGPU 场景 ========================== */

  /** 盒体网格（都市场景的建筑），布局与岩石一致：pos(3)+normal(3)，24 字节 */
  function buildBox() {
    var faces = [
      { n: [0, 0, 1], v: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]] },
      { n: [0, 0, -1], v: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]] },
      { n: [1, 0, 0], v: [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]] },
      { n: [-1, 0, 0], v: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]] },
      { n: [0, 1, 0], v: [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]] },
      { n: [0, -1, 0], v: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]] }
    ];
    var verts = [], idx = [];
    faces.forEach(function (f, fi) {
      var base = fi * 4;
      f.v.forEach(function (p) { verts.push(p[0], p[1], p[2], f.n[0], f.n[1], f.n[2]); });
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    });
    return {
      vertices: new Float32Array(verts),
      indices: new Uint32Array(idx),
      indexCount: idx.length,
      triangles: idx.length / 3
    };
  }

  function createWebGPUScene(cfg) {
    var SH = Nova.sceneShaders.wgsl;
    return {
      id: 'scene',
      name: '综合场景测试',
      group: 'scene',
      unit: 'FPS',
      unitScale: 1,
      desc: '四段连续场景：星环 → 峡谷·黄昏 → 峡谷·云海 → 都市·风暴，复杂度逐段递增。',
      detail: '整条序列 9 个渲染 pass（阴影 / 背景 / PBR 几何 / 粒子 / 体积云海 40 步光线步进 / ' +
        '亮度提取 / 两次高斯模糊 / 合成）。星环段保留最初的单场景形态（单几何 pass、无后处理）作为基准；' +
        '峡谷段为 ' + cfg.terrainSegments + '² 地形 + ' + cfg.rocks + ' 块岩石；' +
        '云海段在几何之上再叠一层参与介质；都市段换成近 2000 栋楼的城市几何 + ' +
        Math.round(cfg.particles * 2.5) + ' 粒子 + 低空沙尘。各段独立计时，场景分 = 整条序列的平均帧率。',
      run: function (ctx, rp) {
        var device = ctx.device;
        if (!SH) throw new Error('缺少 WGSL 场景着色器：assets/js/bench/shaders/scene.js 未加载');
        var W = ctx.width, H = ctx.height;
        var bw = Math.max(2, Math.round(W * cfg.bloomScale));
        var bh = Math.max(2, Math.round(H * cfg.bloomScale));
        var F = GPUBufferUsage, TU = GPUTextureUsage;

        var terrain = buildTerrain(cfg.terrainSegments, cfg.terrainExtent);
        var rock = buildIcosphere(2);
        var box = buildBox();

        function vbuf(data) {
          var b = device.createBuffer({ size: Math.ceil(data.byteLength / 4) * 4, usage: F.VERTEX | F.COPY_DST });
          device.queue.writeBuffer(b, 0, data);
          return b;
        }
        function ibuf(data) {
          var b = device.createBuffer({ size: Math.ceil(data.byteLength / 4) * 4, usage: F.INDEX | F.COPY_DST });
          device.queue.writeBuffer(b, 0, data);
          return b;
        }
        var terrainVB = vbuf(terrain.vertices), terrainIB = ibuf(terrain.indices);
        var rockVB = vbuf(rock.vertices), rockIB = ibuf(rock.indices);
        var boxVB = vbuf(box.vertices), boxIB = ibuf(box.indices);

        function uni() {
          return { buf: device.createBuffer({ size: 384, usage: F.UNIFORM | F.COPY_DST }), data: new Float32Array(96) };
        }
        var uniScene = uni(), uniBloom = uni(), uniComp = uni();

        function tex(w, h, format, usage) {
          var t = device.createTexture({ size: [w, h], format: format, usage: usage });
          return { tex: t, view: t.createView() };
        }
        var hdr = tex(W, H, 'rgba16float', TU.RENDER_ATTACHMENT | TU.TEXTURE_BINDING);
        var depth = tex(W, H, 'depth24plus', TU.RENDER_ATTACHMENT);
        var bright = tex(bw, bh, 'rgba16float', TU.RENDER_ATTACHMENT | TU.TEXTURE_BINDING);
        var blurA = tex(bw, bh, 'rgba16float', TU.RENDER_ATTACHMENT | TU.TEXTURE_BINDING);
        var blurB = tex(bw, bh, 'rgba16float', TU.RENDER_ATTACHMENT | TU.TEXTURE_BINDING);
        var shadow = tex(cfg.shadowSize, cfg.shadowSize, 'depth32float', TU.RENDER_ATTACHMENT | TU.TEXTURE_BINDING);

        var linearSamp = device.createSampler({ magFilter: 'linear', minFilter: 'linear' });
        var compareSamp = device.createSampler({ compare: 'less', magFilter: 'linear', minFilter: 'linear' });

        var modShadow = ctx.createShaderModule(SH.SHADOW, 'shadow');
        var modBg = ctx.createShaderModule(SH.BACKGROUND, 'bg');
        var modMain = ctx.createShaderModule(SH.MAIN, 'main');
        var modPart = ctx.createShaderModule(SH.PARTICLES, 'particles');
        var modVol = ctx.createShaderModule(SH.VOLUMETRIC, 'volumetric');
        var modPost = ctx.createShaderModule(SH.POST, 'post');

        var VS_FS = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT;
        var bglSolo = device.createBindGroupLayout({
          entries: [{ binding: 0, visibility: VS_FS, buffer: { type: 'uniform' } }]
        });
        var bglShadowed = device.createBindGroupLayout({
          entries: [
            { binding: 0, visibility: VS_FS, buffer: { type: 'uniform' } },
            { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth' } },
            { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'comparison' } }
          ]
        });
        var bglPost = device.createBindGroupLayout({
          entries: [
            { binding: 0, visibility: VS_FS, buffer: { type: 'uniform' } },
            { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
            { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
            { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
            { binding: 4, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } }
          ]
        });
        var plSolo = device.createPipelineLayout({ bindGroupLayouts: [bglSolo] });
        var plShadowed = device.createPipelineLayout({ bindGroupLayouts: [bglShadowed] });
        var plPost = device.createPipelineLayout({ bindGroupLayouts: [bglPost] });

        var terrainLayout = [{
          arrayStride: 32,
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x3' },
            { shaderLocation: 1, offset: 12, format: 'float32x3' },
            { shaderLocation: 2, offset: 24, format: 'float32x2' }
          ]
        }];
        var rockLayout = [{
          arrayStride: 24,
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x3' },
            { shaderLocation: 1, offset: 12, format: 'float32x3' }
          ]
        }];

        function shadowPipe(entry, buffers) {
          return ctx.createRenderPipeline({
            layout: plSolo,
            vertex: { module: modShadow, entryPoint: entry, buffers: buffers },
            fragment: { module: modShadow, entryPoint: 'fs_shadow', targets: [] },
            primitive: { topology: 'triangle-list', cullMode: 'front' },
            depthStencil: { format: 'depth32float', depthWriteEnabled: true, depthCompare: 'less' }
          });
        }
        var shadowPipeTerrain = shadowPipe('vs_terrain', terrainLayout);
        var shadowPipeRock = shadowPipe('vs_rock', rockLayout);

        var bgPipe = ctx.createRenderPipeline({
          layout: plSolo,
          vertex: { module: modBg, entryPoint: 'vs_fullscreen' },
          fragment: { module: modBg, entryPoint: 'fs_background', targets: [{ format: 'rgba16float' }] },
          primitive: { topology: 'triangle-list' }
        });

        function mainPipe(entry, buffers) {
          return ctx.createRenderPipeline({
            layout: plShadowed,
            vertex: { module: modMain, entryPoint: entry, buffers: buffers },
            fragment: { module: modMain, entryPoint: 'fs_main', targets: [{ format: 'rgba16float' }] },
            primitive: { topology: 'triangle-list', cullMode: 'back' },
            depthStencil: { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less' }
          });
        }
        var mainPipeTerrain = mainPipe('vs_terrain', terrainLayout);
        var mainPipeRock = mainPipe('vs_rock', rockLayout);
        var mainPipeCity = mainPipe('vs_city', rockLayout);

        var partPipe = ctx.createRenderPipeline({
          layout: plSolo,
          vertex: { module: modPart, entryPoint: 'vs_particle' },
          fragment: {
            module: modPart, entryPoint: 'fs_particle',
            targets: [{
              format: 'rgba16float',
              blend: {
                color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
                alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' }
              }
            }]
          },
          primitive: { topology: 'triangle-list', cullMode: 'none' },
          depthStencil: { format: 'depth24plus', depthWriteEnabled: false, depthCompare: 'less' }
        });

        // 体积云海：全屏加法混合，叠在几何与粒子之上
        var volPipe = ctx.createRenderPipeline({
          layout: plSolo,
          vertex: { module: modVol, entryPoint: 'vs_fullscreen' },
          fragment: {
            module: modVol, entryPoint: 'fs_volumetric',
            targets: [{
              format: 'rgba16float',
              blend: {
                color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
                alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' }
              }
            }]
          },
          primitive: { topology: 'triangle-list' }
        });

        function postPipe(entry) {
          return ctx.createRenderPipeline({
            layout: plPost,
            vertex: { module: modPost, entryPoint: 'vs_fullscreen' },
            fragment: { module: modPost, entryPoint: entry, targets: [{ format: 'rgba16float' }] },
            primitive: { topology: 'triangle-list' }
          });
        }
        var brightPipe = postPipe('fs_bright');
        var blurHPipe = postPipe('fs_blurH');
        var blurVPipe = postPipe('fs_blurV');
        var compPipe = ctx.createRenderPipeline({
          layout: plPost,
          vertex: { module: modPost, entryPoint: 'vs_fullscreen' },
          fragment: { module: modPost, entryPoint: 'fs_composite', targets: [{ format: ctx.format }] },
          primitive: { topology: 'triangle-list' }
        });

        function soloGroup(u) {
          return device.createBindGroup({
            layout: bglSolo, entries: [{ binding: 0, resource: { buffer: u.buf } }]
          });
        }
        function shadowedGroup(u) {
          return device.createBindGroup({
            layout: bglShadowed,
            entries: [
              { binding: 0, resource: { buffer: u.buf } },
              { binding: 1, resource: shadow.view },
              { binding: 2, resource: compareSamp }
            ]
          });
        }
        function postGroup(u, srcView, bloomView) {
          return device.createBindGroup({
            layout: bglPost,
            entries: [
              { binding: 0, resource: { buffer: u.buf } },
              { binding: 1, resource: srcView },
              { binding: 2, resource: linearSamp },
              { binding: 3, resource: bloomView || srcView },
              { binding: 4, resource: linearSamp }
            ]
          });
        }

        var gShadowT = soloGroup(uniScene);
        var gShadowR = soloGroup(uniScene);
        var gBg = soloGroup(uniScene);
        var gMainT = shadowedGroup(uniScene);
        var gMainR = shadowedGroup(uniScene);
        var gPart = soloGroup(uniScene);
        var gVol = soloGroup(uniScene);
        var gBright = postGroup(uniBloom, hdr.view, null);
        var gBlurH = postGroup(uniBloom, bright.view, null);
        var gBlurV = postGroup(uniBloom, blurA.view, null);
        var gComp = postGroup(uniComp, hdr.view, blurB.view);
        // 不做 bloom 的段：直接把 hdr 当作 bloom 贴图绑定，并把强度置 0
        var gCompNoBloom = postGroup(uniComp, hdr.view, hdr.view);

        function passColor(enc, view, loadOp, tsWrites) {
          var d = {
            colorAttachments: [{
              view: view, loadOp: loadOp, storeOp: 'store', clearValue: { r: 0, g: 0, b: 0, a: 1 }
            }]
          };
          if (tsWrites) d.timestampWrites = tsWrites;
          return enc.beginRenderPass(d);
        }
        function drawMesh(pass, pipe, group, vb, ib, indexCount, instances) {
          pass.setPipeline(pipe);
          pass.setBindGroup(0, group);
          pass.setVertexBuffer(0, vb);
          pass.setIndexBuffer(ib, 'uint32');
          pass.drawIndexed(indexCount, instances, 0, 0, 0);
        }

        return runSequence(ctx, cfg.stabilityMode ? stabilitySegments(cfg) : segmentList(cfg.preset, cfg.segmentScale), function (sc) {
          var mesh = sc.sceneMode === 'city'
            ? { pipe: mainPipeCity, vb: boxVB, ib: boxIB, count: box.indexCount }
            : { pipe: mainPipeRock, vb: rockVB, ib: rockIB, count: rock.indexCount };

          function encodeFrame(t, tsMode) {
            // 时间戳走 pass 描述符（规范做法），不用 pass.writeTimestamp()（需实验特性）
            var tsB = (tsMode === 'begin' && ctx.timestamps.supported) ? ctx.timestamps.passDesc(0) : null;
            var tsE = (tsMode === 'end' && ctx.timestamps.supported) ? ctx.timestamps.passDesc(1) : null;
            var cam = cameraAt(t, sc.sceneMode);
            fillSceneUniform(uniScene.data, t, sc, cam, W / H, W, H);
            fillSceneUniform(uniBloom.data, t, sc, cam, W / H, bw, bh);
            fillSceneUniform(uniComp.data, t, sc, cam, W / H, W, H);
            device.queue.writeBuffer(uniScene.buf, 0, uniScene.data);
            device.queue.writeBuffer(uniBloom.buf, 0, uniBloom.data);
            device.queue.writeBuffer(uniComp.buf, 0, uniComp.data);

            var enc = device.createCommandEncoder();

            if (sc.useShadow) {
              var spDesc = {
                colorAttachments: [],
                depthStencilAttachment: {
                  view: shadow.view, depthLoadOp: 'clear', depthStoreOp: 'store', depthClearValue: 1.0
                }
              };
              if (tsB) spDesc.timestampWrites = tsB;
              var sp = enc.beginRenderPass(spDesc);
              if (sc.useTerrain) drawMesh(sp, shadowPipeTerrain, gShadowT, terrainVB, terrainIB, terrain.indexCount, 1);
              drawMesh(sp, mesh.pipe === mainPipeCity ? shadowPipeRock : shadowPipeRock, gShadowR,
                mesh.vb, mesh.ib, mesh.count, sc.rocks);
              sp.end();
            }

            var bp = passColor(enc, hdr.view, 'clear', (!sc.useShadow && tsB) ? tsB : null);
            bp.setPipeline(bgPipe); bp.setBindGroup(0, gBg); bp.draw(3, 1, 0, 0);
            bp.end();

            var mp = enc.beginRenderPass({
              colorAttachments: [{ view: hdr.view, loadOp: 'load', storeOp: 'store' }],
              depthStencilAttachment: {
                view: depth.view, depthLoadOp: 'clear', depthStoreOp: 'store', depthClearValue: 1.0
              }
            });
            if (sc.useTerrain) drawMesh(mp, mainPipeTerrain, gMainT, terrainVB, terrainIB, terrain.indexCount, 1);
            drawMesh(mp, mesh.pipe, mesh.pipe === mainPipeCity ? gMainR : gMainR, mesh.vb, mesh.ib, mesh.count, sc.rocks);
            mp.end();

            if (sc.particles > 0) {
              var pp = enc.beginRenderPass({
                colorAttachments: [{ view: hdr.view, loadOp: 'load', storeOp: 'store' }],
                depthStencilAttachment: { view: depth.view, depthLoadOp: 'load', depthStoreOp: 'store' }
              });
              pp.setPipeline(partPipe); pp.setBindGroup(0, gPart);
              pp.draw(6, sc.particles, 0, 0);
              pp.end();
            }

            if (sc.volumetricDensity > 0) {
              var vp = enc.beginRenderPass({
                colorAttachments: [{
                  view: hdr.view, loadOp: 'load', storeOp: 'store'
                }]
              });
              vp.setPipeline(volPipe); vp.setBindGroup(0, gVol); vp.draw(3, 1, 0, 0);
              vp.end();
            }

            if (sc.useBloom) {
              var q1 = passColor(enc, bright.view, 'clear');
              q1.setPipeline(brightPipe); q1.setBindGroup(0, gBright); q1.draw(3, 1, 0, 0); q1.end();
              var q2 = passColor(enc, blurA.view, 'clear');
              q2.setPipeline(blurHPipe); q2.setBindGroup(0, gBlurH); q2.draw(3, 1, 0, 0); q2.end();
              var q3 = passColor(enc, blurB.view, 'clear');
              q3.setPipeline(blurVPipe); q3.setBindGroup(0, gBlurV); q3.draw(3, 1, 0, 0); q3.end();
            }

            var cp = passColor(enc, ctx.targetView(), 'clear', tsE);
            cp.setPipeline(compPipe);
            cp.setBindGroup(0, sc.useBloom ? gComp : gCompNoBloom);
            cp.draw(3, 1, 0, 0);
            cp.end();
            if (tsMode === 'end') ctx.timestamps.resolve(enc);   // 必须在 pass 之外
            return enc.finish();
          }
          return encodeFrame;
        }, rp, {
          cfg: cfg,
          triangles: terrain.triangles + rock.triangles * cfg.rocks,
          terrainTriangles: terrain.triangles,
          rockTriangles: rock.triangles * cfg.rocks,
          particles: cfg.particles,
          instances: cfg.rocks,
          passes: 9
        });
      }
    };
  }

  /* ========================== WebGL2 场景 ========================== */

  function createWebGL2Scene(cfg) {
    var SH = Nova.sceneShaders.glsl;
    return {
      id: 'scene',
      name: '综合场景测试',
      group: 'scene',
      unit: 'FPS',
      unitScale: 1,
      desc: '四段连续场景：星环 → 峡谷·黄昏 → 峡谷·云海 → 都市·风暴，复杂度逐段递增。',
      detail: '整条序列 9 个渲染 pass。星环段保留最初的单场景形态（单几何 pass、无后处理）；' +
        '峡谷段为 ' + cfg.terrainSegments + '² 地形 + ' + cfg.rocks + ' 块岩石；' +
        '云海段再叠一层 40 步光线步进的参与介质；都市段换成近 2000 栋楼的城市几何 + ' +
        Math.round(cfg.particles * 2.5) + ' 粒子 + 低空沙尘。各段独立计时，场景分 = 整条序列的平均帧率。',
      run: function (ctx, rp) {
        var gl = ctx.gl;
        if (!SH) throw new Error('缺少 GLSL 场景着色器：assets/js/bench/shaders/scene-glsl.js 未加载');
        var W = ctx.width, H = ctx.height;
        var bw = Math.max(2, Math.round(W * cfg.bloomScale));
        var bh = Math.max(2, Math.round(H * cfg.bloomScale));

        var terrain = buildTerrain(cfg.terrainSegments, cfg.terrainExtent);
        var rock = buildIcosphere(2);
        var box = buildBox();
        var hdrFormat = (ctx.extensions && ctx.extensions.colorBufferFloat) ? gl.RGBA16F : gl.RGBA8;

        function mkVB(data) { var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); return b; }
        function mkIB(data) { var b = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW); return b; }
        var terrainVB = mkVB(terrain.vertices), terrainIB = mkIB(terrain.indices);
        var rockVB = mkVB(rock.vertices), rockIB = mkIB(rock.indices);
        var boxVB = mkVB(box.vertices), boxIB = mkIB(box.indices);

        var uboScene = gl.createBuffer(), uboBloom = gl.createBuffer(), uboComp = gl.createBuffer();
        [uboScene, uboBloom, uboComp].forEach(function (b) {
          gl.bindBuffer(gl.UNIFORM_BUFFER, b);
          gl.bufferData(gl.UNIFORM_BUFFER, 384, gl.DYNAMIC_DRAW);
        });
        var uScene = new Float32Array(96), uBloom = new Float32Array(96), uComp = new Float32Array(96);

        function mkTarget(w, h, internal) {
          var tex = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, gl.RGBA,
            internal === gl.RGBA16F ? gl.FLOAT : gl.UNSIGNED_BYTE, null);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          var fbo = gl.createFramebuffer();
          gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          return { tex: tex, fbo: fbo, w: w, h: h };
        }
        function mkShadowTarget(size) {
          var tex = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, size, size, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
          var fbo = gl.createFramebuffer();
          gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, tex, 0);
          var ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          if (!ok) throw new Error('阴影深度帧缓冲不完整（设备可能不支持深度纹理）');
          return { tex: tex, fbo: fbo, w: size, h: size };
        }

        var hdr = mkTarget(W, H, hdrFormat);
        var depthRB = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthRB);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, W, H);
        gl.bindFramebuffer(gl.FRAMEBUFFER, hdr.fbo);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRB);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
          throw new Error('主 HDR 帧缓冲不完整');
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        var bright = mkTarget(bw, bh, hdrFormat);
        var blurA = mkTarget(bw, bh, hdrFormat);
        var blurB = mkTarget(bw, bh, hdrFormat);
        var shadow = mkShadowTarget(cfg.shadowSize);

        // 【修复：第一段（ring）缺主体几何】MAIN_FS 里 shadowMap 是 sampler2DShadow，
        // 而阴影关闭的段（ring 段 shadow:false，且它是整条序列的第一段）unit 0 从未绑定过
        // 任何纹理，仍是默认纹理对象 —— ANGLE/D3D11 对「比较采样器绑着不完整纹理」的 draw
        // 会直接丢弃且不报 GL 错误。实测：drawElementsInstanced(count=960, instances=900)
        // 每帧都提交、参数合法、网格正常（icosphere(2) 972 顶点 / 960 索引），但 HDR 目标里
        // 只有背景；把 gl_Position 换成铺满视口 + 把 FS 强制成品红，画面仍逐字节不变
        // （即一个片元都没被光栅化），而同样补丁在 2/3/4 段立刻生效。
        // 这里准备一张 1×1、深度值 1.0 的深度纹理：阴影关闭时绑到 unit 0，
        // 采样结果恒为「无遮挡」（LEQUAL 比较下 refZ ≤ 1.0 恒真），语义上正是"完全受光"，
        // 同时保证 unit 0 在任何段、任何时刻都有一个完整的纹理对象。
        var whiteDepth = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, whiteDepth);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, 1, 1, 0,
          gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, new Uint32Array([0xFFFFFFFF]));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);

        var pShadow = ctx.createProgram(SH.SHADOW_VS, SH.SHADOW_FS, 'shadow');
        var pBg = ctx.createProgram(SH.BACKGROUND_VS, SH.BACKGROUND_FS, 'bg');
        var pMainT = ctx.createProgram(SH.MAIN_VS_TERRAIN, SH.MAIN_FS, 'mainT');
        var pMainR = ctx.createProgram(SH.MAIN_VS_ROCK, SH.MAIN_FS, 'mainR');
        var pMainC = ctx.createProgram(SH.MAIN_VS_CITY, SH.MAIN_FS, 'mainC');
        var pPart = ctx.createProgram(SH.PARTICLE_VS, SH.PARTICLE_FS, 'particles');
        var pVol = ctx.createProgram(SH.VOLUMETRIC_VS, SH.VOLUMETRIC_FS, 'volumetric');
        var pBright = ctx.createProgram(SH.POST_VS, SH.BRIGHT_FS, 'bright');
        var pBlurH = ctx.createProgram(SH.POST_VS, SH.BLUR_H_FS, 'blurH');
        var pBlurV = ctx.createProgram(SH.POST_VS, SH.BLUR_V_FS, 'blurV');
        var pComp = ctx.createProgram(SH.POST_VS, SH.COMPOSITE_FS, 'composite');

        [pShadow, pBg, pMainT, pMainR, pMainC, pPart, pVol, pBright, pBlurH, pBlurV, pComp].forEach(function (p) {
          var idx = gl.getUniformBlockIndex(p, 'SceneU');
          if (idx === gl.INVALID_INDEX) throw new Error('着色器里找不到 uniform 块 SceneU');
          gl.uniformBlockBinding(p, idx, 0);
        });

        var emptyVAO = gl.createVertexArray();
        function makeVAO(vb, ib, stride, hasUV) {
          var vao = gl.createVertexArray();
          gl.bindVertexArray(vao);
          gl.bindBuffer(gl.ARRAY_BUFFER, vb);
          gl.enableVertexAttribArray(0);
          gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
          gl.enableVertexAttribArray(1);
          gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 12);
          if (hasUV) {
            gl.enableVertexAttribArray(2);
            gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, 24);
          }
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
          gl.bindVertexArray(null);
          return vao;
        }
        var vaoTerrain = makeVAO(terrainVB, terrainIB, 32, true);
        var vaoRock = makeVAO(rockVB, rockIB, 24, false);
        var vaoBox = makeVAO(boxVB, boxIB, 24, false);

        function setSamplers(p, list) {
          gl.useProgram(p);
          for (var i = 0; i < list.length; i++) {
            var loc = gl.getUniformLocation(p, list[i].name);
            if (loc) gl.uniform1i(loc, list[i].unit);
          }
        }
        [pMainT, pMainR, pMainC].forEach(function (p) { setSamplers(p, [{ name: 'shadowMap', unit: 0 }]); });
        [pBright, pBlurH, pBlurV, pVol].forEach(function (p) { setSamplers(p, [{ name: 'srcTex', unit: 0 }]); });
        setSamplers(pComp, [{ name: 'srcTex', unit: 0 }, { name: 'bloomTex', unit: 1 }]);
        gl.useProgram(null);

        function uploadUBO(buf, data) {
          gl.bindBuffer(gl.UNIFORM_BUFFER, buf);
          gl.bufferSubData(gl.UNIFORM_BUFFER, 0, data);
        }
        function bindTarget(t) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, t ? t.fbo : null);
          gl.viewport(0, 0, t ? t.w : W, t ? t.h : H);
        }
        function bindTex(unit, tex) {
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, tex);
        }
        function useP(p) { gl.useProgram(p); gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, uboScene); }
        function drawIndexed(vao, count, instances) {
          gl.bindVertexArray(vao);
          if (instances && instances > 1) gl.drawElementsInstanced(gl.TRIANGLES, count, gl.UNSIGNED_INT, 0, instances);
          else gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_INT, 0);
        }

        return runSequence(ctx, cfg.stabilityMode ? stabilitySegments(cfg) : segmentList(cfg.preset, cfg.segmentScale), function (sc) {
          var mesh = sc.sceneMode === 'city'
            ? { prog: pMainC, vao: vaoBox, count: box.indexCount }
            : { prog: pMainR, vao: vaoRock, count: rock.indexCount };

          function encodeFrame(t, tsMode) {
            // WebGL2 的计时器查询直接夹在命令流首尾即可（无需 pass 对象）
            if (tsMode === 'begin' && ctx.timestamps) ctx.timestamps.write(null, 0);
            var cam = cameraAt(t, sc.sceneMode);
            fillSceneUniform(uScene, t, sc, cam, W / H, W, H);
            fillSceneUniform(uBloom, t, sc, cam, W / H, bw, bh);
            fillSceneUniform(uComp, t, sc, cam, W / H, W, H);
            uploadUBO(uboScene, uScene);
            uploadUBO(uboBloom, uBloom);
            uploadUBO(uboComp, uComp);

            gl.disable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LESS);
            gl.depthMask(true);

            // 1) 阴影：depth-only，正面剔除减轻阴影粉刺
            if (sc.useShadow) {
              bindTarget(shadow);
              gl.clear(gl.DEPTH_BUFFER_BIT);
              gl.enable(gl.CULL_FACE);
              gl.cullFace(gl.FRONT);
              gl.colorMask(false, false, false, false);
              useP(pShadow);
              if (sc.useTerrain) drawIndexed(vaoTerrain, terrain.indexCount, 1);
              drawIndexed(mesh.vao, mesh.count, sc.rocks);
              gl.colorMask(true, true, true, true);
              gl.cullFace(gl.BACK);
            }

            // 2) 背景
            bindTarget(hdr);
            gl.disable(gl.DEPTH_TEST);
            gl.disable(gl.CULL_FACE);
            gl.disable(gl.BLEND);
            gl.useProgram(pBg); gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, uboScene);
            gl.bindVertexArray(emptyVAO);
            gl.drawArrays(gl.TRIANGLES, 0, 3);

            // 3) 主体几何
            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.CULL_FACE);
            gl.clear(gl.DEPTH_BUFFER_BIT);
            // unit 0 必须始终绑着完整纹理：阴影关闭时绑 1×1 白色深度（恒「无遮挡」），
            // 否则比较采样器会绑着默认纹理，整条 draw 会被驱动丢弃（见 whiteDepth 处的说明）
            bindTex(0, sc.useShadow ? shadow.tex : whiteDepth);
            if (sc.useTerrain) { useP(pMainT); drawIndexed(vaoTerrain, terrain.indexCount, 1); }
            gl.useProgram(mesh.prog); gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, uboScene);
            drawIndexed(mesh.vao, mesh.count, sc.rocks);

            // 4) 粒子（加法混合，不写深度）
            if (sc.particles > 0) {
              gl.enable(gl.BLEND);
              gl.blendFunc(gl.ONE, gl.ONE);
              gl.depthMask(false);
              gl.disable(gl.CULL_FACE);
              gl.useProgram(pPart); gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, uboScene);
              gl.bindVertexArray(emptyVAO);
              gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, sc.particles);
              gl.depthMask(true);
              gl.disable(gl.BLEND);
            }

            // 5) 体积云海 / 尘埃（全屏加法混合）
            if (sc.volumetricDensity > 0) {
              gl.enable(gl.BLEND);
              gl.blendFunc(gl.ONE, gl.ONE);
              gl.disable(gl.DEPTH_TEST);
              gl.useProgram(pVol); gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, uboScene);
              gl.bindVertexArray(emptyVAO);
              gl.drawArrays(gl.TRIANGLES, 0, 3);
              gl.disable(gl.BLEND);
            }
            gl.disable(gl.DEPTH_TEST);

            // 6~8) bloom
            if (sc.useBloom) {
              bindTarget(bright);
              gl.useProgram(pBright); gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, uboBloom); bindTex(0, hdr.tex);
              gl.bindVertexArray(emptyVAO); gl.drawArrays(gl.TRIANGLES, 0, 3);

              bindTarget(blurA);
              gl.useProgram(pBlurH); gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, uboBloom); bindTex(0, bright.tex);
              gl.bindVertexArray(emptyVAO); gl.drawArrays(gl.TRIANGLES, 0, 3);

              bindTarget(blurB);
              gl.useProgram(pBlurV); gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, uboBloom); bindTex(0, blurA.tex);
              gl.bindVertexArray(emptyVAO); gl.drawArrays(gl.TRIANGLES, 0, 3);
            }

            // 9) 合成到画布
            bindTarget(null);
            gl.useProgram(pComp); gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, uboComp);
            bindTex(0, hdr.tex);
            bindTex(1, sc.useBloom ? blurB.tex : hdr.tex);
            gl.bindVertexArray(emptyVAO); gl.drawArrays(gl.TRIANGLES, 0, 3);
            gl.bindVertexArray(null);
            if (tsMode === 'end' && ctx.timestamps) ctx.timestamps.write(null, 1);
          }
          return encodeFrame;
        }, rp, {
          cfg: cfg,
          triangles: terrain.triangles + rock.triangles * cfg.rocks,
          terrainTriangles: terrain.triangles,
          rockTriangles: rock.triangles * cfg.rocks,
          particles: cfg.particles,
          instances: cfg.rocks,
          passes: 9
        });
      }
    };
  }

  /* ============================ 通用渲染循环 ============================ */

  /**
   * 跑一个场景段：连续提交帧，按 pipelineDepth 深度同步并采样帧时间。
   * 预热期的帧只计入总时长、不计入 FPS 统计（切换场景后首批帧会包含管线切换开销）。
   */
  /**
   * 让出一个宏任务，给浏览器合成 / 跑 rAF 的机会。
   * WebGL2 的窗口同步会在主线程上同步等待（围栏轮询 + readPixels），
   * 整段测量期间不让出的话，页面会长时间不重绘 —— 表现就是「画面卡死但帧率照报」。
   */
  function yieldToBrowser() {
    return new Promise(function (r) { setTimeout(r, 0); });
  }

  function runSegment(ctx, encode, durationMs, segIdx, segCount, rp, warmupMs, depth) {
    return new Promise(function (resolve, reject) {
      var frameTimes = [];
      var start = U.now();
      var lastMark = start;
      var frames = 0;
      var warmAcc = 0;
      var aborted = false;
      // 重负载段是否逐帧让出主线程（见窗口结尾处的判定）
      var yieldEachFrame = false;
      // 窗口内的命令缓冲先攒着，最后一次性提交。
      // 逐帧提交会让 GPU 在帧间跑空，而 GPU 时间戳跨了整个窗口，
      // 会把这段「等 CPU 编码下一帧」的空转也算进 GPU 耗时里。
      var pending = [];

      function finish() {
        var tailMs = U.now() - lastMark;
        if (tailMs > 0) frameTimes.push(tailMs / depth);
        var elapsed = U.now() - start;
        var sum = 0;
        for (var i = 0; i < frameTimes.length; i++) sum += frameTimes[i];
        resolve({
          frameTimes: frameTimes,
          elapsed: elapsed,
          frames: frames,
          fps: sum > 0 ? (frameTimes.length * 1000) / sum : 0,
          // frameTimes 里每个采样代表 depth 帧，所以它对应的墙钟时长是 sum*depth。
          // 这个值用来算整体平均帧率，必须与 totalFrames 的口径一致。
          measuredMs: sum * depth,
          measuredFrames: frameTimes.length * depth
        });
      }

      function frame() {
        if (aborted) return;
        if (rp && rp.isAborted && rp.isAborted()) { reject(new Error('用户中止')); return; }
        var elapsed = U.now() - start;
        if (elapsed >= durationMs || frames >= 400000) {
          if (pending.length) { ctx.submit(pending); pending = []; }
          return ctx.sync().then(finish).catch(reject);
        }
        try {
          // 窗口内的首帧与末帧分别打开始 / 结束时间戳
          var wi = frames % depth;
          var tsMode = !(ctx.timestamps && ctx.timestamps.supported) ? null
            : (wi === 0 ? 'begin' : (wi === depth - 1 ? 'end' : null));
          var cb = encode(elapsed / 1000, tsMode);
          if (cb) pending.push(cb);
          if (pending.length >= depth) { ctx.submit(pending); pending = []; }
        } catch (e) { reject(e); return; }

        frames++;
        if (frames % depth === 0) {
          var wallPer = 0;
          // 【帧率口径修正】每窗口都必须等到 GPU 真正跑完再取墙钟，否则墙钟测到的是
          // 「提交耗时」（CPU 编码命令的耗时），帧率会被放大成天文数字。
          // 之前 WebGL2 上跳过了这次同步，正是踩了这个坑。
          ctx.sync().then(function () {
            var t2 = U.now();
            wallPer = (t2 - lastMark) / depth;
            lastMark = t2;
          }).then(function () {
            var t2 = U.now();
            // 【帧率口径修正】帧时间一律用「上一窗口完成 → 本窗口完成」的墙钟间隔 ÷ depth。
            // 旧代码优先用 GPU 时间戳（gpuMs/depth）：它只统计 GPU 忙的时间，不含每窗口
            // ctx.sync() 往返期间 GPU 的空转；轻负载段这段空转能占到窗口墙钟的一半，
            // 于是 HUD / 报告里的帧率会达到「实际产出帧率（frames ÷ elapsed）」的近 2 倍，
            // 而最终结果又是另一套加总口径 → 三处对不上，看起来就是「画面卡但帧率正常」。
            // 墙钟口径与 frames ÷ elapsed 天然一致，HUD / 报告 / 最终结果才会同源。
            var perFrame = wallPer;
            warmAcc += perFrame * depth;
            if (warmAcc >= warmupMs) frameTimes.push(perFrame);

            // 重负载段单帧就十几毫秒，一个窗口的同步等待会一口气阻塞主线程 200ms+。
            // 这种时候 GPU 已经被喂饱，逐帧让出宏任务几乎不损失吞吐，却能让页面持续合成；
            // 轻负载段（单帧 <6ms）CPU 才是瓶颈，让出反而拖慢测量，所以只在重负载段开启。
            yieldEachFrame = ctx.kind === 'webgl2' && perFrame >= 6;

            if (rp && rp.report) {
              try {
                var inSeg = Math.min(1, (t2 - start) / durationMs);
                rp.report('measuring', {
                  round: segIdx + 1, rounds: segCount,
                  progress: inSeg,
                  overall: (segIdx + inSeg) / segCount,
                  fps: perFrame > 0 ? 1000 / perFrame : 0,
                  frames: frames
                });
              } catch (e2) { /* noop */ }
            }
          }).then(function () {
            // WebGL2：窗口同步是全同步等待，每个窗口结束后让出一个宏任务，
            // 浏览器才有机会合成/跑 rAF。让出的这段时间会被计入下一个窗口的墙钟，
            // 所以帧率口径仍与 frames÷elapsed 同源（WebGPU 的 mapAsync 本身就让出主线程）。
            return ctx.kind === 'webgl2' ? yieldToBrowser() : undefined;
          }).then(function () {
            frame();
          }).catch(reject);
        } else if (yieldEachFrame) {
          // 重负载段：窗口之间也逐帧让出，避免一次同步把主线程按住 200ms+
          yieldToBrowser().then(function () { frame(); }).catch(reject);
        } else {
          frame();
        }
      }
      frame();
    });
  }

  /**
   * 跑完一整条场景序列。
   * 场景分 = 全部段的总帧数 ÷ 总时长 = 整条序列的平均帧率，各段权重自然等于其时长。
   */
  function runSequence(ctx, segments, makeEncoder, rp, extraMeta) {
    var cfg0 = extraMeta.cfg;
    var depth = cfg0.pipelineDepth || 2;
    var warmupMs = Math.min(900, Math.max(220, Math.round(cfg0.warmupMs / 3)));
    var perSeg = [];
    var allFrames = [];
    var totalFrames = 0;
    var totalMs = 0;
    var totalElapsed = 0;

    function step(i) {
      if (i >= segments.length) return Promise.resolve();
      var seg = segments[i];
      var sc = mergeSegment(cfg0, seg);
      var encode = makeEncoder(sc, i);
      // 每段开始前清一次队列，避免上一段的尾巴算进这一段
      return ctx.sync().then(function () {
        return runSegment(ctx, encode, seg.ms, i, segments.length, rp, warmupMs, depth);
      }).then(function (res) {
        perSeg.push({
          id: seg.id, name: seg.name, fps: res.fps,
          frames: res.frames, durationMs: res.elapsed, mode: seg.mode || 'canyon'
        });
        // 注意：frameTimes.length 是「采样数」，每个采样 = pipelineDepth 帧。
        // 早期这里直接用采样数当帧数，导致整体平均帧率被算成实际值的 1/depth。
        totalFrames += res.measuredFrames;
        totalMs += res.measuredMs;
        totalElapsed += res.elapsed;
        for (var k = 0; k < res.frameTimes.length; k++) allFrames.push(res.frameTimes[k]);
        if (rp && rp.report) {
          try {
            rp.report('round-done', { round: i + 1, rounds: segments.length, value: res.fps, name: seg.name });
          } catch (e) { /* noop */ }
        }
        return step(i + 1);
      });
    }

    return step(0).then(function () {
      var analysis = analyzeFrames(allFrames, { warmupMs: 0, tailMs: 0, totalMs: totalMs });
      var fpsAvg = totalMs > 0 ? (totalFrames * 1000) / totalMs : 0;

      // 稳定性模式：各段是同一负载的重复轮次，取最差/最好一轮算稳定性
      var stability = null;
      if (cfg0.stabilityMode && perSeg.length > 1) {
        var hi = 0, lo = Infinity;
        perSeg.forEach(function (s) {
          if (s.fps > hi) hi = s.fps;
          if (s.fps < lo) lo = s.fps;
        });
        stability = {
          stability: hi > 0 ? (lo / hi) * 100 : 0,
          fpsHigh: hi, fpsLow: lo,
          rounds: perSeg.map(function (s) { return s.fps; })
        };
      }
      var metric = stability ? stability.stability : fpsAvg;
      var unit = stability ? '%' : 'FPS';

      return {
        status: 'done',
        raw: metric,
        metric: metric,
        unit: unit,
        rawFps: fpsAvg,
        samples: stability ? stability.rounds : allFrames.map(function (ms) { return ms > 0 ? 1000 / ms : 0; }),
        cv: allFrames.length ? U.stats.cv(allFrames) : 0,
        valid: analysis.frames > 40,
        meta: {
          frames: analysis.frames,
          fpsAvg: fpsAvg,
          fps1Low: analysis.fps1Low,
          fps01Low: analysis.fps01Low,
          p99FrameMs: analysis.p99FrameMs,
          medianFrameMs: analysis.medianFrameMs,
          jitter: analysis.jitter,
          smoothness: analysis.smoothness,
          frameTimes: analysis.frameTimes,
          segments: perSeg,
          segmentCount: segments.length,
          stability: stability,
          totalDurationMs: totalElapsed,
          warmupMs: warmupMs,
          pipelineDepth: depth,
          renderWidth: ctx.width,
          renderHeight: ctx.height,
          renderPixels: ctx.width * ctx.height,
          preset: cfg0.preset,
          instances: extraMeta.instances,
          triangles: extraMeta.triangles,
          terrainTriangles: extraMeta.terrainTriangles,
          rockTriangles: extraMeta.rockTriangles,
          particles: extraMeta.particles,
          passes: extraMeta.passes,
          shadowSize: cfg0.shadowSize,
          durationMs: totalElapsed,
          normFactor: 1,
          scoreMetric: metric,
          scoreBasis: stability
            ? '连续多轮同一负载，稳定性 = 最差一轮 ÷ 最好一轮 × 100%'
            : '所有档位使用同一套场景序列，仅每段时长不同，分数可直接横向对比'
        }
      };
    });
  }

  /* ============================== 对外接口 ============================== */

  Nova.sceneFactory = {
    PRESETS: PRESETS,
    buildTerrain: buildTerrain,
    buildIcosphere: buildIcosphere,
    cameraAt: cameraAt,
    fillSceneUniform: fillSceneUniform,
    createWebGPUScene: createWebGPUScene,
    createWebGL2Scene: createWebGL2Scene,
    sceneConfig: sceneConfig,
    analyzeFrames: analyzeFrames
  };

  /**
   * WebGL2 的窗口同步是「全同步阻塞」（围栏轮询 + readPixels，见 engine.js），
   * 窗口越小这份固定开销被摊得越薄：depth=2 时它占到每个窗口墙钟的一半，
   * 既压低了实测帧率，也让主线程长期不让出（实测 rAF p99÷p50 高达 57）。
   * 所以 WebGL2 把窗口放大到 8 帧；WebGPU 走 mapAsync 本来就会让出主线程，
   * 保持 2 帧的细采样粒度即可（实测 p99÷p50 = 1.03，不必动）。
   * 显式传入 opts.pipelineDepth 时以调用方为准。
   */
  function tuneDepth(ctx, opts, cfg) {
    if (ctx.kind === 'webgl2' && !(opts && opts.pipelineDepth)) cfg.pipelineDepth = 8;
    return cfg;
  }

  Nova.makeSceneTest = function (ctx, opts) {
    var cfg = sceneConfig(opts);
    tuneDepth(ctx, opts, cfg);
    return ctx.kind === 'webgpu' ? createWebGPUScene(cfg) : createWebGL2Scene(cfg);
  };

  Nova.makeStabilityTest = function (ctx, opts) {
    var rounds = (opts && opts.rounds) || 20;
    var cfg = sceneConfig(Object.assign({}, opts, {
      rounds: rounds,
      roundMs: (opts && opts.roundMs) || 5000,
      durationMs: (opts && opts.roundMs) || 5000,
      stabilityMode: true
    }));
    tuneDepth(ctx, opts, cfg);
    var t = ctx.kind === 'webgpu' ? createWebGPUScene(cfg) : createWebGL2Scene(cfg);
    t.id = 'stability';
    t.name = '稳定性压力测试';
    t.group = 'stability';
    t.unit = '%';
    t.desc = '连续 ' + cfg.rounds + ' 轮综合场景循环（每轮 ' + (cfg.roundMs / 1000) + ' 秒），衡量长时间负载下的性能衰减。';
    t.detail = '稳定性 = 最差一轮帧率 ÷ 最好一轮帧率 × 100%。97% 以上为通过（对齐 3DMark 压力测试口径）；' +
      '明显低于 100% 说明存在降频、温度墙或驱动节流。';
    return t;
  };

})(window);
