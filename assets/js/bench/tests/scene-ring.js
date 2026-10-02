/* ============================================================================
 * NovaMark · 原版「球体环」场景（v1 保留，独立成项）
 *
 * 这是项目最初那一版最简场景：900 个实例化球体排成一圈，单个几何 pass、
 * 无阴影 / 无粒子 / 无后处理。它被保留下来作为「最轻负载」的基准参照，
 * 与后面多 pass 的峡谷 / 云海 / 都市序列形成对照。
 *
 * 实现取自 v1 备份，未做渲染改动；仅调整了对外导出名，避免覆盖新场景。
 * ==========================================================================
 * 原说明：
 * NovaMark · 综合场景测试（3DMark 式可见场景 + 稳定性循环）
 *  - 程序化生成球体网格 + 大量实例，构成有纵深的星环场景
 *  - 固定渲染分辨率、不使用垂直同步，因此 FPS 可以超过显示器刷新率
 *  - 丢弃前段预热与末段收尾，统计 1% low / 0.1% low / 帧时间分布
 *  - WebGPU 与 WebGL2 两套实现，负载参数完全一致，保证跨后端可比
 * ==========================================================================*/
(function (global) {
  'use strict';

  var Nova = global.Nova = global.Nova || {};
  var U = Nova.util;

  /* ============================ 数学工具 ============================ */

  function mat4Identity() {
    return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  }

  function mat4Perspective(out, fovy, aspect, near, far) {
    var f = 1.0 / Math.tan(fovy / 2), nf = 1 / (near - far);
    out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
    out[8] = 0; out[9] = 0; out[10] = (far + near) * nf; out[11] = -1;
    out[12] = 0; out[13] = 0; out[14] = 2 * far * near * nf; out[15] = 0;
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

  /**
   * 生成 icosphere（细分二十面体）：顶点位置 + 法线交错存放，单位球。
   * @returns {vertices:Float32Array, indices:Uint16Array|Uint32Array, triangles:number}
   */
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

    function normalize(v) {
      var l = Math.hypot(v[0], v[1], v[2]) || 1;
      return [v[0] / l, v[1] / l, v[2] / l];
    }
    verts = verts.map(normalize);

    var cache = {};
    function midpoint(a, b) {
      var key = a < b ? a + '_' + b : b + '_' + a;
      if (cache[key] !== undefined) return cache[key];
      var va = verts[a], vb = verts[b];
      verts.push(normalize([(va[0] + vb[0]) / 2, (va[1] + vb[1]) / 2, (va[2] + vb[2]) / 2]));
      var idx = verts.length - 1;
      cache[key] = idx;
      return idx;
    }

    for (var s = 0; s < (subdivisions || 2); s++) {
      var next = [];
      for (var i = 0; i < faces.length; i++) {
        var f = faces[i];
        var a = midpoint(f[0], f[1]);
        var b = midpoint(f[1], f[2]);
        var c = midpoint(f[2], f[0]);
        next.push([f[0], a, c], [f[1], b, a], [f[2], c, b], [a, b, c]);
      }
      faces = next;
    }

    var data = new Float32Array(verts.length * 6);
    for (var v = 0; v < verts.length; v++) {
      data[v * 6 + 0] = verts[v][0];
      data[v * 6 + 1] = verts[v][1];
      data[v * 6 + 2] = verts[v][2];
      data[v * 6 + 3] = verts[v][0];
      data[v * 6 + 4] = verts[v][1];
      data[v * 6 + 5] = verts[v][2];
    }
    var indices = (verts.length > 65535) ? new Uint32Array(faces.length * 3) : new Uint16Array(faces.length * 3);
    for (var j = 0; j < faces.length; j++) {
      indices[j * 3] = faces[j][0];
      indices[j * 3 + 1] = faces[j][1];
      indices[j * 3 + 2] = faces[j][2];
    }
    return { vertices: data, indices: indices, triangles: faces.length, vertexCount: verts.length };
  }

  /* ============================ 场景参数 ============================ */

  var PRESETS = {
    low: { instances: 420, subdivisions: 2 },
    medium: { instances: 900, subdivisions: 2 },
    high: { instances: 1800, subdivisions: 3 }
  };

  function sceneConfig(opts) {
    opts = opts || {};
    var preset = PRESETS[opts.preset] || PRESETS.medium;
    return {
      instances: opts.instances || preset.instances,
      subdivisions: opts.subdivisions === undefined ? preset.subdivisions : opts.subdivisions,
      durationMs: opts.durationMs || 18000,
      warmupMs: opts.warmupMs || 1600,
      tailMs: opts.tailMs || 600,
      rounds: opts.rounds || 1,
      roundMs: opts.roundMs || 5000,
      pipelineDepth: opts.pipelineDepth || 2
    };
  }

  var LIGHTS = [
    { pos: [4.5, 3.2, -2.5], col: [1.00, 0.55, 0.30], orbit: 0.24 },
    { pos: [-4.0, 1.8, 3.5], col: [0.30, 0.65, 1.00], orbit: -0.31 },
    { pos: [2.2, -2.6, 4.0], col: [0.75, 0.35, 1.00], orbit: 0.17 },
    { pos: [-3.2, 3.6, -3.0], col: [0.30, 1.00, 0.85], orbit: -0.13 }
  ];

  /** 填充场景 uniform（56 个 float / 224 字节） */
  function fillSceneUniform(arr, t, cfg, aspect) {
    var camAng = t * 0.18;
    var camR = 7.6 + Math.sin(t * 0.23) * 0.9;
    var eye = [Math.sin(camAng) * camR, 1.9 + Math.sin(t * 0.31) * 1.1, Math.cos(camAng) * camR];
    var center = [0, 0, 0];

    var proj = mat4Perspective(new Float32Array(16), 55 * Math.PI / 180, aspect, 0.1, 90);
    var view = mat4LookAt(new Float32Array(16), eye, center, [0, 1, 0]);
    var vp = mat4Multiply(new Float32Array(16), proj, view);
    for (var i = 0; i < 16; i++) arr[i] = vp[i];

    arr[16] = eye[0]; arr[17] = eye[1]; arr[18] = eye[2]; arr[19] = 1.0;

    for (var l = 0; l < 4; l++) {
      var L = LIGHTS[l];
      var a = t * L.orbit;
      var ca = Math.cos(a), sa = Math.sin(a);
      arr[20 + l * 4 + 0] = L.pos[0] * ca - L.pos[2] * sa;
      arr[20 + l * 4 + 1] = L.pos[1];
      arr[20 + l * 4 + 2] = L.pos[0] * sa + L.pos[2] * ca;
      arr[20 + l * 4 + 3] = 1.0;
    }
    for (var c2 = 0; c2 < 4; c2++) {
      var C = LIGHTS[c2];
      arr[36 + c2 * 4 + 0] = C.col[0];
      arr[36 + c2 * 4 + 1] = C.col[1];
      arr[36 + c2 * 4 + 2] = C.col[2];
      arr[36 + c2 * 4 + 3] = 1.0;
    }
    arr[52] = t;              // time
    arr[53] = cfg.instances;  // count
    arr[54] = 1.25;           // exposure
    arr[55] = 0.045;          // fog density
    return arr;
  }

  /* ======================= 帧时间采集与收敛判定 ======================= */

  function analyzeFrames(frameTimesMs, opts) {
    opts = opts || {};
    var warm = opts.warmupMs || 0, tail = opts.tailMs || 0;
    var times = [], acc = 0;
    for (var i = 0; i < frameTimesMs.length; i++) {
      acc += frameTimesMs[i];
      if (acc >= warm && acc <= (opts.totalMs || Infinity) - tail) times.push(frameTimesMs[i]);
    }
    if (times.length < 8) times = frameTimesMs.slice();

    var fs = Nova.score && Nova.score.frameStats ? Nova.score.frameStats(times) : fallbackFrameStats(times);
    return {
      frames: times.length,
      fpsAvg: fs.fpsAvg,
      fps1Low: fs.fps1Low,
      fps01Low: fs.fps01Low,
      p99FrameMs: fs.p99,
      medianFrameMs: fs.median,
      jitter: fs.jitter,
      smoothness: fs.smoothness,
      frameTimes: downsample(times, 600)
    };
  }

  function fallbackFrameStats(times) {
    var s = U.stats;
    var mean = s.mean(times);
    return {
      fpsAvg: mean > 0 ? 1000 / mean : NaN,
      fps1Low: s.lowFps(times, 0.01),
      fps01Low: s.lowFps(times, 0.001),
      p99: s.percentile(times, 0.99),
      median: s.median(times),
      jitter: mean > 0 ? s.std(times) / mean : 0,
      smoothness: 0
    };
  }

  function downsample(arr, maxPoints) {
    if (arr.length <= maxPoints) return arr.slice();
    var out = [], step = arr.length / maxPoints;
    for (var i = 0; i < maxPoints; i++) out.push(arr[Math.floor(i * step)]);
    return out;
  }

  /* ========================== WebGPU 场景 ========================== */

  function createWebGPUScene(cfg, hooks) {
    var S = Nova.shadersWGSL;
    return {
      id: 'ring',
      name: '球体环（原版最简场景）',
      group: 'scene',
      unit: 'FPS',
      unitScale: 1,
      desc: '程序化星环场景：' + cfg.instances + ' 个实例化球体 + 4 点光源 + 雾效 + 色调映射，持续渲染并统计帧率。',
      detail: '这是最接近真实游戏的负载：几何、着色、带宽、填充率同时受压。测试不使用垂直同步，因此帧率可以超过显示器刷新率。',
      run: function (ctx, rp) {
        var U3 = U;
        var mesh = buildIcosphere(cfg.subdivisions);
        var device = ctx.device;
        var instBuf, idxBuf;

        // 顶点/索引缓冲
        var vertBuf = device.createBuffer({
          size: mesh.vertices.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
        device.queue.writeBuffer(vertBuf, 0, mesh.vertices);
        idxBuf = device.createBuffer({
          size: Math.ceil(mesh.indices.byteLength / 4) * 4,
          usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
        });
        device.queue.writeBuffer(idxBuf, 0, mesh.indices);

        var uniformData = new Float32Array(56);
        var sceneBuf = device.createBuffer({
          size: 224,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        var meshModule = ctx.createShaderModule(S.SCENE_MESH, 'scene-mesh');
        var bgModule = ctx.createShaderModule(S.SCENE_BG, 'scene-bg');

        var meshPipeline = ctx.createRenderPipeline({
          layout: 'auto',
          vertex: {
            module: meshModule, entryPoint: 'vs_main',
            buffers: [{
              arrayStride: 24,
              attributes: [
                { shaderLocation: 0, offset: 0, format: 'float32x3' },
                { shaderLocation: 1, offset: 12, format: 'float32x3' }
              ]
            }]
          },
          fragment: { module: meshModule, entryPoint: 'fs_main', targets: [{ format: ctx.format }] },
          primitive: { topology: 'triangle-list', cullMode: 'back' },
          depthStencil: { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less' }
        });

        var bgPipeline = ctx.createRenderPipeline({
          layout: 'auto',
          vertex: { module: bgModule, entryPoint: 'vs_bg' },
          fragment: { module: bgModule, entryPoint: 'fs_bg', targets: [{ format: ctx.format }] },
          primitive: { topology: 'triangle-list' }
        });

        var meshBG = device.createBindGroup({
          layout: meshPipeline.getBindGroupLayout(0),
          entries: [{ binding: 0, resource: { buffer: sceneBuf } }]
        });
        var bgBG = device.createBindGroup({
          layout: bgPipeline.getBindGroupLayout(0),
          entries: [{ binding: 0, resource: { buffer: sceneBuf } }]
        });

        var depth = device.createTexture({
          size: [ctx.width, ctx.height],
          format: 'depth24plus',
          usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
        var depthView = depth.createView();

        var aspect = ctx.width / ctx.height;

        function encodeFrame(t) {
          fillSceneUniform(uniformData, t, cfg, aspect);
          device.queue.writeBuffer(sceneBuf, 0, uniformData);

          var enc = device.createCommandEncoder();

          var bgPass = enc.beginRenderPass({
            colorAttachments: [{
              view: ctx.targetView(), loadOp: 'clear', storeOp: 'store',
              clearValue: { r: 0.01, g: 0.015, b: 0.035, a: 1 }
            }]
          });
          bgPass.setPipeline(bgPipeline);
          bgPass.setBindGroup(0, bgBG);
          bgPass.draw(3, 1, 0, 0);
          bgPass.end();

          var pass = enc.beginRenderPass({
            colorAttachments: [{
              view: ctx.targetView(), loadOp: 'load', storeOp: 'store'
            }],
            depthStencilAttachment: {
              view: depthView, depthLoadOp: 'clear', depthStoreOp: 'store', depthClearValue: 1.0
            }
          });
          pass.setPipeline(meshPipeline);
          pass.setBindGroup(0, meshBG);
          pass.setVertexBuffer(0, vertBuf);
          pass.setIndexBuffer(idxBuf, mesh.indices instanceof Uint32Array ? 'uint32' : 'uint16');
          pass.drawIndexed(mesh.indices.length, cfg.instances, 0, 0, 0);
          pass.end();

          return enc.finish();
        }

        return runLoop(ctx, cfg, encodeFrame, rp, {
          triangles: mesh.triangles * cfg.instances,
          vertexCount: mesh.vertexCount,
          instances: cfg.instances
        });
      }
    };
  }

  /* ========================== WebGL2 场景 ========================== */

  function createWebGL2Scene(cfg, hooks) {
    var S = Nova.shadersGLSL;
    return {
      id: 'ring',
      name: '球体环（原版最简场景）',
      group: 'scene',
      unit: 'FPS',
      unitScale: 1,
      desc: '程序化星环场景：' + cfg.instances + ' 个实例化球体 + 4 点光源 + 雾效 + 色调映射，持续渲染并统计帧率。',
      detail: '这是最接近真实游戏的负载：几何、着色、带宽、填充率同时受压。测试不使用垂直同步，因此帧率可以超过显示器刷新率。',
      run: function (ctx, rp) {
        var gl = ctx.gl;
        var mesh = buildIcosphere(cfg.subdivisions);

        var meshProg = ctx.createProgram(S.SCENE_VS, S.SCENE_FS, 'scene-mesh');
        var bgProg = ctx.createProgram(S.FULLSCREEN_VS, S.SCENE_BG_FS, 'scene-bg');

        var vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        var vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);
        var ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
        var locPos = gl.getAttribLocation(meshProg, 'aPos');
        var locNrm = gl.getAttribLocation(meshProg, 'aNrm');
        gl.enableVertexAttribArray(locPos);
        gl.vertexAttribPointer(locPos, 3, gl.FLOAT, false, 24, 0);
        gl.enableVertexAttribArray(locNrm);
        gl.vertexAttribPointer(locNrm, 3, gl.FLOAT, false, 24, 12);

        var emptyVao = gl.createVertexArray();

        var uMesh = {
          viewProj: gl.getUniformLocation(meshProg, 'uViewProj'),
          camPos: gl.getUniformLocation(meshProg, 'uCamPos'),
          lights: gl.getUniformLocation(meshProg, 'uLights'),
          params: gl.getUniformLocation(meshProg, 'uParams')
        };
        var uBg = { params: gl.getUniformLocation(bgProg, 'uParams') };

        // 深度缓冲
        var depthRb = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthRb);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, ctx.width, ctx.height);

        var fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        var colorTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, colorTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, ctx.width, ctx.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTex, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRb);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
          throw new Error('综合场景的离屏帧缓冲不完整');
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        var uniformData = new Float32Array(56);
        var vp = new Float32Array(16);
        var lightArr = new Float32Array(32);
        var aspect = ctx.width / ctx.height;

        function encodeFrame(t) {
          fillSceneUniform(uniformData, t, cfg, aspect);
          for (var i = 0; i < 16; i++) vp[i] = uniformData[i];
          for (var l = 0; l < 32; l++) lightArr[l] = uniformData[20 + l];

          gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
          gl.viewport(0, 0, ctx.width, ctx.height);
          gl.disable(gl.BLEND);
          gl.disable(gl.CULL_FACE);

          // 背景
          gl.depthMask(false);
          gl.disable(gl.DEPTH_TEST);
          gl.useProgram(bgProg);
          gl.uniform4f(uBg.params, t, cfg.instances, 1.25, 0.045);
          gl.bindVertexArray(emptyVao);
          gl.drawArrays(gl.TRIANGLES, 0, 3);

          // 主体
          gl.enable(gl.DEPTH_TEST);
          gl.depthFunc(gl.LESS);
          gl.depthMask(true);
          gl.clear(gl.DEPTH_BUFFER_BIT);
          gl.useProgram(meshProg);
          gl.uniformMatrix4fv(uMesh.viewProj, false, vp);
          gl.uniform3f(uMesh.camPos, uniformData[16], uniformData[17], uniformData[18]);
          gl.uniform4fv(uMesh.lights, lightArr);
          gl.uniform4f(uMesh.params, t, cfg.instances, 1.25, 0.045);
          gl.bindVertexArray(vao);
          gl.drawElementsInstanced(gl.TRIANGLES, mesh.indices.length, mesh.indices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0, cfg.instances);

          // 呈现到画布
          gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fbo);
          gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
          gl.blitFramebuffer(0, 0, ctx.width, ctx.height, 0, 0, ctx.width, ctx.height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        return runLoop(ctx, cfg, encodeFrame, rp, {
          triangles: mesh.triangles * cfg.instances,
          vertexCount: mesh.vertexCount,
          instances: cfg.instances
        });
      }
    };
  }

  /* ============================ 通用渲染循环 ============================ */

  /**
   * 依次跑 cfg.rounds 轮；每轮渲染 cfg.roundMs（或首轮 cfg.durationMs）。
   * encodeFrame(t) 负责把一帧提交出去（内部自行 submit / 或写入默认帧缓冲）。
   */
  function runLoop(ctx, cfg, encodeFrame, rp, extraMeta) {
    var roundFps = [];
    var firstRoundFrameTimes = null;
    var firstRoundDuration = 0;
    var round = 0;
    var globalStart = U.now();
    var depth = cfg.pipelineDepth;

    function oneRound(durationMs, isFirst) {
      return new Promise(function (resolve, reject) {
        var frameTimes = [];
        var start = U.now();
        var lastMark = start;
        var frames = 0;
        var error = null;

        function frame() {
          if (rp && rp.isAborted && rp.isAborted()) { error = new Error('用户中止'); }
          var now = U.now();
          if (error) { reject(error); return; }
          var elapsed = now - start;
          if (elapsed >= durationMs || frames >= 200000) {
            // 收尾：等待最后一批帧
            return ctx.sync().then(function () {
              var tailMs = now - lastMark;
              if (tailMs > 0) frameTimes.push(tailMs / depth);
              resolve({ frameTimes: frameTimes, elapsed: U.now() - start, frames: frames });
            });
          }

          try {
            var cb = encodeFrame(elapsed / 1000);
            if (cb) ctx.submit([cb]);
          } catch (e) { reject(e); return; }

          frames++;
          if (frames % depth === 0) {
            ctx.sync().then(function () {
              var t2 = U.now();
              var perFrame = (t2 - lastMark) / depth;
              frameTimes.push(perFrame);
              lastMark = t2;
              if (rp && rp.report) {
                try {
                  rp.report('measuring', {
                    round: round, rounds: cfg.rounds,
                    progress: Math.min(1, (t2 - start) / durationMs),
                    overall: ((round - 1) + Math.min(1, (t2 - start) / durationMs)) / cfg.rounds,
                    fps: perFrame > 0 ? 1000 / perFrame : 0,
                    frames: frames
                  });
                } catch (e2) { /* noop */ }
              }
              frame();
            }).catch(reject);
          } else {
            frame();
          }
        }
        frame();
      });
    }

    function nextRound() {
      if (round >= cfg.rounds) return Promise.resolve();
      round++;
      var dur = (round === 1) ? cfg.durationMs : cfg.roundMs;
      return oneRound(dur, round === 1).then(function (res) {
        var times = res.frameTimes;
        if (round === 1) {
          firstRoundFrameTimes = times;
          firstRoundDuration = res.elapsed;
        }
        var avg = times.length ? 1000 / U.stats.mean(times) : 0;
        roundFps.push(avg);
        if (rp && rp.report) {
          try { rp.report('round-done', { round: round, rounds: cfg.rounds, value: avg }); } catch (e) { /* noop */ }
        }
        return nextRound();
      });
    }

    return nextRound().then(function () {
      var analysis = analyzeFrames(firstRoundFrameTimes, {
        warmupMs: cfg.warmupMs, tailMs: cfg.tailMs, totalMs: firstRoundDuration
      });
      var stability = null;
      if (cfg.rounds > 1 && roundFps.length > 1) {
        var hi = U.stats.max(roundFps), lo = U.stats.min(roundFps);
        stability = {
          stability: hi > 0 ? (lo / hi) * 100 : 0,
          fpsHigh: hi, fpsLow: lo,
          rounds: roundFps.slice()
        };
      }
      // 不同质量档的实例数不同，直接比 FPS 不公平。
      // 统一折算到「中档 900 实例」再进评分；报告里展示的仍是原始帧率。
      var normFactor = 900 / Math.max(1, extraMeta.instances);
      var scoreMetric = stability ? stability.stability : analysis.fpsAvg * normFactor;
      return {
        status: 'done',
        raw: scoreMetric,
        metric: scoreMetric,
        unit: stability ? '%' : 'FPS',
        rawFps: analysis.fpsAvg,
        samples: stability ? stability.rounds : (firstRoundFrameTimes || []).map(function (ms) { return ms > 0 ? 1000 / ms : 0; }),
        cv: firstRoundFrameTimes ? U.stats.cv(firstRoundFrameTimes) : 0,
        valid: analysis.frames > 30,
        meta: {
          frames: analysis.frames,
          fpsAvg: analysis.fpsAvg,
          fps1Low: analysis.fps1Low,
          fps01Low: analysis.fps01Low,
          p99FrameMs: analysis.p99FrameMs,
          medianFrameMs: analysis.medianFrameMs,
          jitter: analysis.jitter,
          smoothness: analysis.smoothness,
          frameTimes: analysis.frameTimes,
          roundFps: roundFps.slice(),
          stability: stability,
          warmupMs: cfg.warmupMs,
          tailMs: cfg.tailMs,
          pipelineDepth: depth,
          renderWidth: ctx.width,
          renderHeight: ctx.height,
          renderPixels: ctx.width * ctx.height,
          preset: cfg.preset || 'medium',
          instances: extraMeta.instances,
          triangles: extraMeta.triangles,
          vertexCount: extraMeta.vertexCount,
          durationMs: firstRoundDuration,
          normFactor: normFactor,
          scoreMetric: scoreMetric,
          scoreBasis: stability ? null : '已按中档 900 实例归一化后计分（表格里是归一化分，报告展示原始帧率）'
        }
      };
    });
  }

  /* ============================== 对外接口 ============================== */

  Nova.ringSceneFactory = {
    PRESETS: PRESETS,
    buildIcosphere: buildIcosphere,
    createWebGPUScene: createWebGPUScene,
    createWebGL2Scene: createWebGL2Scene,
    sceneConfig: sceneConfig,
    analyzeFrames: analyzeFrames
  };

  Nova.makeRingSceneTest = function (ctx, opts) {
    var cfg = sceneConfig(opts);
    cfg.preset = (opts && opts.preset) || 'medium';
    return ctx.kind === 'webgpu' ? createWebGPUScene(cfg, opts) : createWebGL2Scene(cfg, opts);
  };

})(window);
