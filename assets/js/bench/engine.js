/* ============================================================================
 * NovaMark · 基准测试引擎
 *  - Nova.engine.create(canvas, opts)  创建测量上下文（WebGPU 优先，WebGL2 兜底）
 *  - Nova.bench.Harness                统一的测量框架（预热 / 自适应批量 / 多轮取中位）
 * ==========================================================================*/
(function (global) {
  'use strict';

  var Nova = global.Nova = global.Nova || {};
  var U = Nova.util;

  /**
   * 廉价地让出一个宏任务（让浏览器有机会合成 / 跑 rAF）。
   *
   * 为什么不用 setTimeout(0)：嵌套层级超过 5 之后 Chrome 会把 setTimeout 钳到 ~4ms，
   * 而 WebGL2 的围栏轮询要在一次同步里让出很多次 —— 每次 4ms 的代价会把轻负载段
   * （单帧 1–2ms 的球体环）直接拖慢数倍，测量值被让出开销主导。
   * MessageChannel 的 postMessage 同样是宏任务（任务之间浏览器可以插入渲染步骤），
   * 但没有钳位，实测代价约 0.1–0.5ms。
   */
  var _yieldChan = (typeof MessageChannel === 'function') ? new MessageChannel() : null;
  var _yieldFn = null;
  if (_yieldChan) {
    _yieldChan.port1.onmessage = function () {
      var f = _yieldFn; _yieldFn = null;
      if (f) f();
    };
  }
  function yieldMacro() {
    if (!_yieldChan) return new Promise(function (r) { setTimeout(r, 0); });
    return new Promise(function (r) { _yieldFn = r; _yieldChan.port2.postMessage(0); });
  }

  /**
   * 实测 performance.now() 的有效分辨率。
   *
   * 移动端浏览器（尤其 iOS Safari）会把时钟粒度放大到 0.5ms 甚至 1ms。
   * 若单批耗时只有 1–2ms，相对误差就是几十个百分点，校准据此把迭代数放大、
   * 报出远超物理极限的假值 —— iPhone SE 3 上的 A15 就是这样被算成
   * 15817 GFLOPS（理论约 1500）的。所以测量框架需要知道这个粒度，
   * 用来判断「一批要跑多久才算够长」。
   */
  /**
   * 建一个 1×1 的 RGBA8 离屏目标，专供同步读回使用。
   * 选 RGBA8 是因为它的 readPixels(RGBA, UNSIGNED_BYTE) 在任何实现上都合法 ——
   * 而测试自己的目标常是 RGBA16F，iOS Safari 上直接读它会报 INVALID_OPERATION。
   */
  function createSyncFbo(gl, ctx) {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    var fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    ctx._syncFbo = fbo;
    ctx._syncTex = tex;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    // 清掉搭建期产生的错误，避免把噪声算进测量
    for (var i = 0; i < 8; i++) { if (!gl.getError()) break; }
  }
  function measureTimerRes() {
    var best = Infinity;
    for (var r = 0; r < 24; r++) {
      var prev = performance.now();
      for (var i = 0; i < 8000; i++) {
        var now = performance.now();
        if (now > prev) { var d = now - prev; if (d > 0 && d < best) best = d; prev = now; }
      }
    }
    return isFinite(best) ? best : 0;
  }
  /* ==========================================================================
   * 上下文：WebGPU
   * ========================================================================*/
  function createWebGPUContext(canvas, opts) {
    return new Promise(function (resolve, reject) {
      var wg = opts.deviceInfo && opts.deviceInfo.webgpu;
      if (!wg || !wg.adapter) { reject(new Error('没有可用的 WebGPU 适配器')); return; }

      function finish(device) {
        var context = canvas.getContext('webgpu');
        if (!context) { reject(new Error('canvas.getContext("webgpu") 返回 null')); return; }
        var format;
        try { format = navigator.gpu.getPreferredCanvasFormat(); } catch (e) { format = 'bgra8unorm'; }
        try {
          context.configure({ device: device, format: format, alphaMode: 'opaque' });
        } catch (e2) { reject(new Error('configure 失败：' + e2.message)); return; }

        var gpuErrors = [];
        device.addEventListener('uncapturederror', function (ev) {
          gpuErrors.push(String(ev.error && ev.error.message ? ev.error.message : ev.error));
          U.log('gpu', 'uncaptured error', gpuErrors[gpuErrors.length - 1]);
        });

        var gpuCtx = null;
        // 设备丢失（移动端最常见：切后台、显存吃紧、驱动重置）
        device.lost.then(function (infoLost) {
          var reason = (infoLost && infoLost.reason) || 'unknown';
          gpuErrors.push('WebGPU 设备丢失：' + reason +
            (infoLost && infoLost.message ? '（' + infoLost.message + '）' : ''));
          if (gpuCtx) gpuCtx.contextLost = true;
          U.log('gpu', 'device lost: ' + reason);
        }).catch(function () { });

        // GPU 侧围栏：用于 sync() 的可靠完成判定（见 ctx.sync 注释）
        var fenceBuf = null, fenceSrc = null;
        try {
          fenceBuf = device.createBuffer({ size: 4, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
          fenceSrc = device.createBuffer({ size: 4, usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST });
        } catch (e) { fenceBuf = null; }
        var ctx = {
          kind: 'webgpu',
          backendLabel: 'WebGPU',
          canvas: canvas,
          width: opts.width, height: opts.height,
          deviceInfo: opts.deviceInfo,
          profile: opts.profile,
          workloadScale: opts.workloadScale,
          memoryBudgetMB: opts.memoryBudgetMB,
          adapter: wg.adapter,
          device: device,
          context: context,
          format: format,
          errors: gpuErrors,
          contextLost: false,

          now: U.now,
          timerResMs: measureTimerRes(),

          /**
           * 提交并等待 GPU 真正完成。
           *
           * 不能只依赖 queue.onSubmittedWorkDone()：对照实验（完整版 NovaMark 的
           * bench/diagnostics/knownwork.js，该诊断脚本不在本版范围内）
           * 显示，在一个紧循环里连续提交多批命令时它会**提前 resolve** ——
           * 明明需要 ≥3.37ms 的固定 FMA 工作量，它报出 0.41ms，跌破物理下限 8 倍。
           *
           * 这里改用「GPU 侧围栏」：提交一个 4 字节的回读拷贝，然后等 mapAsync。
           * mapAsync 只在 GPU 真正执行完那次拷贝后才 resolve，而命令队列是有序的，
           * 所以它一旦完成，就保证之前提交的所有工作都已经执行完毕。
           */
          sync: function () {
            if (!fenceBuf) return device.queue.onSubmittedWorkDone();
            var enc = device.createCommandEncoder();
            enc.copyBufferToBuffer(fenceSrc, 0, fenceBuf, 0, 4);
            device.queue.submit([enc.finish()]);
            return fenceBuf.mapAsync(GPUMapMode.READ).then(function () {
              fenceBuf.unmap();
              return device.queue.onSubmittedWorkDone();
            }).catch(function () {
              return device.queue.onSubmittedWorkDone();
            });
          },

          /* ------------------------- GPU 时间戳查询 -------------------------
           * 支持 timestamp-query 的设备上，用 GPU 侧时间戳直接测一个测量窗口
           * 的真实 GPU 耗时 —— 不受 CPU 逐帧编码速度影响，也不需要靠提高
           * pipelineDepth 去「猜」掉多少 CPU 开销。
           *
           * 用法：窗口的第一帧在首个 pass 上 write(…, 0)，
           *       最后一帧在末个 pass 上 write(…, 1) 并调用 resolve(enc)，
           *       同步完成后调用 read() 拿到该窗口的 GPU 毫秒数。
           * ------------------------------------------------------------------ */
          timestamps: (function () {
            var supported = !!(device.features && device.features.has && device.features.has('timestamp-query'));
            if (!supported) return { supported: false, period: 0 };
            var qs, resolveBuf, readBuf;
            try {
              qs = device.createQuerySet({ type: 'timestamp', count: 2 });
              resolveBuf = device.createBuffer({
                size: 16, usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC
              });
              readBuf = device.createBuffer({
                size: 16, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
              });
            } catch (e) {
              return { supported: false, period: 0, error: e.message };
            }
            var period = (device.queue.getTimestampPeriod && device.queue.getTimestampPeriod()) || 1;
            var mapping = false;
            return {
              supported: true,
              period: period,
              /** 在某个 pass 上打时间戳；slot 0 = 窗口开始，1 = 窗口结束 */
              write: function (pass, slot) {
                // Chrome 下在 render pass 内部调 writeTimestamp() 需要实验特性
                // chromium-experimental-timestamp-query-inside-passes，因此这条路径
                // 只作为兜底；正式路径用 passDesc() 把时间戳写进 pass 描述符。
                try { pass.writeTimestamp(qs, slot); } catch (e) { /* 走 passDesc 路径 */ }
              },
              /**
               * 返回可直接展开进 pass 描述符的 timestampWrites 片段。
               * 这是规范做法，只需要标准的 timestamp-query 特性，不需要实验开关。
               */
              passDesc: function (slot) {
                return slot === 0
                  ? { querySet: qs, beginningOfPassWriteIndex: 0 }
                  : { querySet: qs, endOfPassWriteIndex: 1 };
              },
              /** 把两个时间戳解析到可回读缓冲（必须在最后一帧的 encoder 上调用） */
              resolve: function (enc) {
                try {
                  enc.resolveQuerySet(qs, 0, 2, resolveBuf, 0);
                  enc.copyBufferToBuffer(resolveBuf, 0, readBuf, 0, 16);
                } catch (e) { /* noop */ }
              },
              /** 同步完成后读取；返回该窗口的 GPU 毫秒数，不可用时返回 null */
              read: function () {
                if (mapping || readBuf.mapState !== 'unmapped') return Promise.resolve(null);
                mapping = true;
                return readBuf.mapAsync(GPUMapMode.READ).then(function () {
                  var view = new BigUint64Array(readBuf.getMappedRange());
                  var t0 = Number(view[0]), t1 = Number(view[1]);
                  readBuf.unmap();
                  mapping = false;
                  if (!t1 || t1 <= t0) return null;
                  return (t1 - t0) * period / 1e6;
                }).catch(function () { mapping = false; return null; });
              }
            };
          })(),

          submit: function (commandBuffers) { device.queue.submit(commandBuffers); },

          /** 创建渲染目标视图（默认画布） */
          targetView: function () { return context.getCurrentTexture().createView(); },

          createShaderModule: function (code, label) {
            return device.createShaderModule({ code: code, label: label || 'nova' });
          },

          /** 带错误检查的管线创建 */
          createRenderPipeline: function (desc) {
            try { return device.createRenderPipeline(desc); }
            catch (e) { throw new Error('创建渲染管线失败：' + e.message); }
          },
          createComputePipeline: function (desc) {
            try { return device.createComputePipeline(desc); }
            catch (e) { throw new Error('创建计算管线失败：' + e.message); }
          },

          makeBuffer: function (size, usage, data) {
            var sizeAligned = Math.ceil(size / 4) * 4;
            var buf = device.createBuffer({ size: sizeAligned, usage: usage, mappedAtCreation: !!data });
            if (data) {
              var range = new (data.constructor)(buf.getMappedRange());
              range.set(data);
              buf.unmap();
            }
            return buf;
          },

          writeBuffer: function (buffer, offset, data) {
            if (data instanceof ArrayBuffer) device.queue.writeBuffer(buffer, offset, data);
            else device.queue.writeBuffer(buffer, offset, data.buffer || data, data.byteOffset || 0, data.byteLength);
          },

          dispose: function () {
            try { context.unconfigure(); } catch (e) { /* noop */ }
          },

          gpulimits: wg.limits || {}
        };
        gpuCtx = ctx;
        resolve(ctx);
      }

      if (wg.device) { finish(wg.device); return; }      // 极端情况下（探测阶段设备被释放）重新申请
      var req = {};
      // 时间戳查询：能拿到 GPU 侧真实的逐帧耗时，不受 CPU 提交速度污染
      if (wg.adapter.features && wg.adapter.features.has && wg.adapter.features.has('timestamp-query')) {
        req.requiredFeatures = ['timestamp-query'];
      }
      wg.adapter.requestDevice(req).then(finish).catch(function (e) {
        // 带特性申请失败就退回不带特性的申请，不能让整个后端挂掉
        wg.adapter.requestDevice().then(finish).catch(function (e2) {
          reject(new Error('requestDevice 失败：' + (e2 && e2.message ? e2.message : e.message)));
        });
      });
    });
  }

  /* ==========================================================================
   * 上下文：WebGL2
   * ========================================================================*/
  function createWebGL2Context(canvas, opts) {
    return new Promise(function (resolve, reject) {
      var attrs = {
        alpha: false, depth: true, stencil: false, antialias: false,
        premultipliedAlpha: false,
        // preserveDrawingBuffer 改回 false。
        // 它曾被设成 true（想让 readPixels 读默认帧缓冲时不被优化掉），但同步
        // 现在读的是自建的 1×1 RGBA8 FBO（见 ctx.sync），不再需要保留绘制缓冲；
        // 而在移动端保留整帧绘制缓冲是实打实的内存与带宽开销。
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance', desynchronized: true,
        failIfMajorPerformanceCaveat: false
      };
      var gl = null;
      try { gl = canvas.getContext('webgl2', attrs); } catch (e) { gl = null; }
      if (!gl) {
        try { gl = canvas.getContext('webgl2'); } catch (e2) { gl = null; }
      }
      if (!gl) { reject(new Error('无法创建 WebGL2 上下文')); return; }

      // 移动端切后台、显存吃紧时上下文会被浏览器回收，必须能识别出来
      try {
        canvas.addEventListener('webglcontextlost', function (ev) {
          ev.preventDefault();
          ctx.contextLost = true;
          ctx.errors.push('WebGL 上下文丢失（通常是显存不足或系统回收，移动端切后台也会触发）');
          U.log('gpu', 'webgl context lost');
        }, false);
      } catch (e) { /* noop */ }

      var extCBF = gl.getExtension('EXT_color_buffer_float');
      var extCBI = gl.getExtension('EXT_color_buffer_half_float');
      var extTF = gl.getExtension('EXT_float_blend');
      var timerExt = gl.getExtension('EXT_disjoint_timer_query_webgl2');

      var ctx = {
        kind: 'webgl2',
        backendLabel: 'WebGL2',
        canvas: canvas,
        width: opts.width, height: opts.height,
        deviceInfo: opts.deviceInfo,
        profile: opts.profile,
        workloadScale: opts.workloadScale,
        memoryBudgetMB: opts.memoryBudgetMB,
        gl: gl,
        errors: [],

        /**
         * 记录 GL 错误。
         *
         * WebGL 的错误是**粘性**的：必须显式调用 getError() 才能取到，而且取走就没了。
         * 以前这个数组在 WebGL2 路径上**从来没人写入**，测试框架的 API 错误守卫
         * 又只读它，于是下面这类问题全部静默通过：
         *   • 帧缓冲不完整 / 绑定错目标  -> INVALID_FRAMEBUFFER_OPERATION
         *   • 实例数或参数越界           -> INVALID_VALUE / INVALID_OPERATION
         *   • 显存不足                   -> OUT_OF_MEMORY
         * 这些情况下 draw 会变成**空操作**，但计时照跑，于是报出一条高得离谱的
         * 吞吐并获得 valid = true。iPhone SE 3 上实测到的
         * texture 11278 GTexel/s、alu 119121 GFLOPS、int 15084 GOPS 就是这么来的。
         *
         * 现在每个批次同步后都会收集一次，报告里能看到真实的 GL 错误码。
         */
        noteGlError: function (where) {
          for (var gi = 0; gi < 8; gi++) {
            var e = gl.getError();
            if (!e) break;
            if (ctx.errors.length < 24) {
              ctx.errors.push({ where: where || 'encode', code: '0x' + Number(e).toString(16) });
            }
          }
        },

        /**
         * 延迟同步开关。
         *
         * 置为 true 时 sync() 立即返回、不等待 GPU。用途见「正式测量」阶段：
         * iOS Safari 的 readPixels 只保证等到「下一次合成边界」—— 实测无论排队
         * 多少工作，耗时恒定在 ~18ms（一帧），所以**逐批同步会把每批都记成一帧**，
         * 吞吐被虚高数倍（alu 报 3 万 GFLOPS、int 报 5 千 GOPS 就是这么来的）。
         * 正确做法是连续提交、整轮结束时只同步一次，用整轮墙钟做分母。
         */
        _deferSync: false,
        setDeferSync: function (on) { ctx._deferSync = !!on; },

        contextLost: false,
        extensions: { colorBufferFloat: !!extCBF, colorBufferHalfFloat: !!extCBI, floatBlend: !!extTF, timerQuery: !!timerExt },
        timerExt: timerExt,

        now: U.now,
        timerResMs: measureTimerRes(),

        sync: function () {
          // 延迟同步模式：立即返回，但仍定期让出事件循环（否则界面会卡死）。
          // 见 _deferSync 的说明。
          if (ctx._deferSync) {
            if (!ctx._lastYieldAt) ctx._lastYieldAt = 0;
            var dt = U.now();
            if (dt - ctx._lastYieldAt < 100) return Promise.resolve();
            ctx._lastYieldAt = dt;
            return new Promise(function (r) { setTimeout(r, 0); });
          }
          // WebGL2 没有 WebGPU 那样的 onSubmittedWorkDone()，而实测发现：
          //   • fenceSync + clientWaitSync 在部分 ANGLE 后端（D3D11 延迟上下文）会过早置位；
          //   • gl.finish() 也可能直接返回，完全不等待 GPU。
          // 两者都失效时，校准阶段会把「没等 GPU」当成「GPU 极快」，把迭代数放大到失控。
          // 唯一可靠的手段是发起一次需要 GPU 回传数据的操作：读回 1 个像素。
          // 代价是每次同步约 0.2–1 ms，相对于 50 ms 级别的批量可以忽略。
          //
          // 【两阶段同步】原实现是「围栏忙等最多 8 ms」，而且**没有先 flush**：
          // 命令还压在客户端缓冲里时围栏根本不会前进，那 8 ms 基本是白等，
          // 真正等住 GPU 的是后面的 readPixels —— 于是每 8 帧就把主线程整段按住一次，
          // 表现就是「帧率正常但画面卡」。现在改成：
          //   ① gl.flush() 真正提交命令 → 分片轮询围栏（每片最多忙等 2 ms，
          //      片间让出宏任务让浏览器合成），并设 3 s 硬上限兜底，绝不无限等；
          //   ② 围栏就绪后再做原来的 blit/readPixels 完成确认 —— 它仍然是可靠性兜底
          //      （围栏过早置位的后端靠它等住 GPU），但此时 GPU 已经跑完，几乎瞬时返回。
          var fence = null;
          try {
            gl.flush();
            fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
          } catch (e0) { fence = null; }

          function waitFence() {
            if (!fence) return Promise.resolve();
            var t0 = U.now();
            var HARD_CAP_MS = 3000;
            var BUSY_MS = 10;      // 前 10ms 纯轮询：短窗口（轻负载段）根本不进入让出路径
            var SLICE_MS = 2;      // 让出之后的每一片最多忙等 2ms
            function slice() {
              var since = U.now() - t0;
              var sliceEnd = U.now() + (since < BUSY_MS ? (BUSY_MS - since) : SLICE_MS);
              for (;;) {
                // 超时必须传 0。
                // WebGL2 规定：带**非零**超时的 clientWaitSync 对同一个 sync 对象
                // 只能调用一次，之后再调会生成 INVALID_OPERATION（0x502）——
                // 而这里原本正是在循环里反复调用它（想分片等待）。
                // 于是每一批同步都会污染一个 GL 错误，同时也让错误队列失去了诊断价值：
                // 真正的问题（帧缓冲不兼容等）会被这些噪声淹没。
                // 超时 0 属于纯轮询，可以安全地重复调用。
                var status = gl.clientWaitSync(fence, 0, 0);
                if (status === gl.ALREADY_SIGNALED || status === gl.CONDITION_SATISFIED ||
                    status === gl.WAIT_FAILED) return Promise.resolve();
                if (U.now() - t0 > HARD_CAP_MS) return Promise.resolve();
                if (U.now() > sliceEnd) break;      // 让出主线程，下一片继续
              }
              // 用 setTimeout(0) 而不是 MessageChannel：让出越频繁，合成器抢 GPU 越多，
              // 轻负载段的测量值被让出开销主导；setTimeout 的 ~4ms 钳位反而更稳。
              return new Promise(function (r) { setTimeout(r, 0); }).then(slice);
            }
            return slice().then(function () {
              try { gl.deleteSync(fence); } catch (e1) { /* noop */ }
            });
          }

          return waitFence().then(function () {
          try {
            if (!ctx._syncPixel) ctx._syncPixel = new Uint8Array(4);
            if (!ctx._syncFbo) createSyncFbo(gl, ctx);

            // 同步策略（按可靠性排序，实机验证得出）：
            //
            // ① blitFramebuffer：把**测试自己的渲染目标**拷 1 像素到我们的 RGBA8 目标，
            //    再从 RGBA8 目标 readPixels。
            //    · blit 是 GPU 操作且依赖源内容 → 驱动必须让源渲染真正完成；
            //    · RGBA8 的 readPixels 格式恒定合法。
            //    这一步在 Apple 的 TBDR（分块延迟渲染）架构上尤其关键：从**另一个
            //    无关的** FBO 读像素并不会强制当前 FBO 的 tile 渲染完成。
            //    iPhone SE 3 上实测就是这样（alu 报 105448 GFLOPS、shader 报 933 GStep/s，
            //    都是同步形同虚设的结果）。
            //
            // ② 源目标是 RGBA16F 时**不能**直接 readPixels(RGBA, UNSIGNED_BYTE)：
            //    iOS Safari 上会报 INVALID_OPERATION(0x502) 并读回全 0（诊断页实测）。
            //    所以 ① 不可用时退回用实现自己上报的可读格式，再不行就 gl.finish()。
            var src = gl.getParameter(gl.FRAMEBUFFER_BINDING);
            var done = false;
            if (src) {
              try {
                gl.bindFramebuffer(gl.READ_FRAMEBUFFER, src);
                gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, ctx._syncFbo);
                gl.blitFramebuffer(0, 0, 1, 1, 0, 0, 1, 1, gl.COLOR_BUFFER_BIT, gl.NEAREST);
                gl.bindFramebuffer(gl.FRAMEBUFFER, ctx._syncFbo);
                gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, ctx._syncPixel);
                gl.bindFramebuffer(gl.FRAMEBUFFER, src);
                if (!gl.getError()) { done = true; ctx._syncMode = 'blit'; }
              } catch (e1) { done = false; }
            }
            if (!done) {
              if (src) gl.bindFramebuffer(gl.FRAMEBUFFER, src);
              try {
                var rf = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT);
                var rt = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE);
                gl.readPixels(0, 0, 1, 1, rf, rt, ctx._syncPixel);
                ctx._syncMode = 'direct';
              } catch (e2) { ctx._syncMode = 'finish'; }
              if (gl.getError()) { gl.finish(); ctx._syncMode = 'finish'; }
              if (src) gl.bindFramebuffer(gl.FRAMEBUFFER, src);
            }
          } catch (e) {
            gl.finish();
          }
          gl.flush();
          // 收集这一批产生的 GL 错误。必须在 flush 之后读，否则错误还没进队列。
          // 这些错误以前被完全丢弃，导致「draw 变空操作」却被当成有效测量。
          ctx.noteGlError('batch');
          // ---- 定期让出事件循环（移动端卡死的关键修复）----
          // 这里如果直接 return Promise.resolve()，整个测试就变成一条**纯微任务链**：
          // 微任务队列会被抽干才会回到事件循环，浏览器因此没有机会重绘、
          // 也处理不了任何输入 —— 手机上的表现就是「点开始就卡死，跑完才直接出结果」。
          // （WebGPU 后端没这个问题：onSubmittedWorkDone() 是真正的异步任务。）
          // 顺带这也让 WebGL2 的计时器查询结果有机会就绪 —— 它需要合成器跑起来。
          // 每 ~100ms 让出一次，既保证界面能动，又不至于把吞吐拖垮。
          if (!ctx._lastYieldAt) ctx._lastYieldAt = 0;
          var nowTs = U.now();
          if (nowTs - ctx._lastYieldAt < 100) return;
          ctx._lastYieldAt = nowTs;
          return new Promise(function (r) { setTimeout(r, 0); });
          });
        },

        /* ------------------------- GPU 计时器查询 -------------------------
         * WebGL2 对应 WebGPU 的 timestamp-query：EXT_disjoint_timer_query_webgl2。
         * 接口与 WebGPU 侧保持同形（write/resolve/read），这样测试代码两边通用：
         *   write(_, 0) → beginQuery（窗口开始）
         *   write(_, 1) → endQuery（窗口结束）
         *   read()      → 查询结果，单位毫秒；不可用/结果未就绪返回 null
         *
         * 注意两点：
         *   1. Chrome 对计时器结果做 100µs 量化，除非页面处于跨源隔离（COOP/COEP）。
         *      帧时间在 10ms 量级时误差约 1%，20ms 以上可忽略；跨源隔离下无量化。
         *   2. GPU_DISJOINT_EXT 为真说明期间发生了频率切换/上下文切换，该次结果必须作废。
         * ------------------------------------------------------------------ */
        timestamps: (function () {
          if (!timerExt) return { supported: false, period: 0 };
          var EXT = timerExt.TIME_ELAPSED_EXT;
          // 计时器结果**不会在同一个窗口内就绪**：endQuery 之后要等这一批命令真正跑完
          // 才有结果。所以这里保留「上一个窗口」的 query，下一个窗口开始时再读它。
          // 稳态负载下相邻窗口的耗时基本一致，滞后一个窗口不影响结论。
          //
          // 注意：beginQuery / endQuery 是 **gl 上的方法**（WebGL2 核心 API），
          // 扩展对象只提供 TIME_ELAPSED_EXT 与 GPU_DISJOINT_EXT 两个常量。
          // 写成 timerExt.beginQuery(...) 会抛异常，被 try/catch 吞掉后静默退回墙钟。
          var ring = [];
          var lastError = null;
          function dropOldest() {
            var q = ring.shift();
            if (q) { try { gl.deleteQuery(q); } catch (e) { /* noop */ } }
          }
          return {
            supported: true,
            period: 1e-6,                     // 查询结果单位是纳秒 → 毫秒
            quantized: !(opts.deviceInfo && opts.deviceInfo.flags && opts.deviceInfo.flags.crossOriginIsolated),
            lastError: function () { return lastError; },
            pending: function () { return ring.length; },
            write: function (_pass, slot) {
              try {
                if (slot === 0) {
                  // 结果就绪有**几十毫秒**的延迟（实测：readPixels 之后仍要等 ~120ms），
                  // 只回溯一个窗口远远不够，所以保留一个环形队列，读最老的那个。
                  // 实测查询结果就绪滞后可达 ~120ms，按当前帧率折算约 20+ 个窗口，
                  // 所以队列要够深才能取到「已经就绪」的那个。
                  if (ring.length >= 24) dropOldest();
                  var q = gl.createQuery();
                  if (q) { ring.push(q); gl.beginQuery(EXT, q); }
                } else if (ring.length) {
                  gl.endQuery(EXT);
                }
              } catch (e) { lastError = String(e && e.message || e); }
            },
            resolve: function () { /* WebGL2 无需解析步骤 */ },
            read: function () {
              // 取队列里最老的那个：它已经被提交很久，结果通常已就绪
              if (ring.length < 10) return Promise.resolve(null);
              var q = ring[0];
              try {
                if (gl.getParameter(timerExt.GPU_DISJOINT_EXT)) {
                  while (ring.length) dropOldest();
                  return Promise.resolve(null);
                }
                if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) return Promise.resolve(null);
                dropOldest();
                var ns = gl.getQueryParameter(q, gl.QUERY_RESULT);
                gl.deleteQuery(q);
                return Promise.resolve(ns > 0 ? ns / 1e6 : null);
              } catch (e) { lastError = String(e && e.message || e); return Promise.resolve(null); }
            }
          };
        })(),

        compileShader: function (type, src, label) {
          var sh = gl.createShader(type);
          gl.shaderSource(sh, src);
          gl.compileShader(sh);
          if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            var info = gl.getShaderInfoLog(sh);
            gl.deleteShader(sh);
            throw new Error('着色器编译失败 [' + (label || '') + ']：' + info);
          }
          return sh;
        },

        createProgram: function (vsSrc, fsSrc, label, defines) {
          var pre = '';
          if (defines) { for (var k in defines) pre += '#define ' + k + ' ' + defines[k] + '\n'; }
          var vs = ctx.compileShader(gl.VERTEX_SHADER, insertDefines(vsSrc, pre), label + '.vs');
          var fs = ctx.compileShader(gl.FRAGMENT_SHADER, insertDefines(fsSrc, pre), label + '.fs');
          var p = gl.createProgram();
          gl.attachShader(p, vs); gl.attachShader(p, fs);
          gl.linkProgram(p);
          gl.deleteShader(vs); gl.deleteShader(fs);
          if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
            var info = gl.getProgramInfoLog(p);
            gl.deleteProgram(p);
            throw new Error('着色器链接失败 [' + (label || '') + ']：' + info);
          }
          return p;
        },

        dispose: function () {
          try {
            var lose = gl.getExtension('WEBGL_lose_context');
            if (lose) lose.loseContext();
          } catch (e) { /* noop */ }
        }
      };
      resolve(ctx);
    });
  }

  /** 把 #define 插到 #version 之后 */
  function insertDefines(src, defines) {
    if (!defines) return src;
    var idx = src.indexOf('\n');
    if (src.indexOf('#version') === 0) return src.slice(0, idx + 1) + defines + src.slice(idx + 1);
    return defines + src;
  }

  /* ==========================================================================
   * 总入口
   * ========================================================================*/
  function create(canvas, opts) {
    opts = opts || {};
    var res = opts.resolution || { width: 1280, height: 720 };
    canvas.width = res.width;
    canvas.height = res.height;

    var base = {
      width: res.width, height: res.height,
      pixels: res.width * res.height,
      deviceInfo: opts.deviceInfo,
      // 设备档位画像：工作量缩放 + 显存预算。测试靠它决定迭代上限与缓冲区大小，
      // 这样同一套测试在桌面独显与手机上都能跑到合理时长且不会爆内存。
      profile: opts.profile || (opts.deviceInfo && opts.deviceInfo.profile) || {
        tier: 'unknown', label: '未知档位', workloadScale: 0.45, memoryBudgetMB: 224, isUnified: false
      }
    };
    base.workloadScale = opts.workloadScale || base.profile.workloadScale || 0.45;
    base.memoryBudgetMB = opts.memoryBudgetMB || base.profile.memoryBudgetMB || 224;

    var prefer = opts.prefer || 'auto';
    var canWgpu = !!(opts.deviceInfo && opts.deviceInfo.webgpu && opts.deviceInfo.webgpu.adapter);
    var canGl = true;

    if (prefer === 'webgl2' || !canWgpu) {
      return createWebGL2Context(canvas, base).catch(function (e) {
        if (prefer === 'webgl2') throw e;
        return createWebGPUContext(canvas, base);
      });
    }
    return createWebGPUContext(canvas, base).catch(function (e) {
      U.log('engine', 'WebGPU 上下文创建失败，回退 WebGL2: ' + e.message);
      return createWebGL2Context(canvas, base);
    });
  }

  /* ==========================================================================
   * 测量框架
   * ========================================================================*/

  /**
   * 每个测试的迭代上限与「物理合理性」上限。
   *  - maxIterations：校准阶段单批迭代数的硬上限。防止在计时失效（软件渲染、
   *    驱动异常）时把迭代数放大到天文数字，进而耗尽显存或把 GPU 进程打崩。
   *  - maxPlausible / minPlausible：实测指标（已除以 unitScale）的合理区间。
   *    超出范围说明计时或驱动异常，结果标记为无效 —— 这同时也是一道防伪校验。
   *
   * Lite说明：本版三项都是场景类负载，runTest() 仍保留在引擎里
   * （任何自定义单项测试都可以继续复用它），但已经没有任何微基准注册进来，
   * 因此这张表只剩场景与稳定性两项。完整版那 13 项微基准的上限不在本版范围内。
   */
  var LIMITS = {
    scene: { maxIterations: 1, maxPlausible: 100000 },
    stability: { maxIterations: 1, maxPlausible: 100 }
  };

  function limitsOf(test, opt) {
    var l = LIMITS[test.id] || {};
    var maxIter = test.maxIterations || l.maxIterations || opt.maxIterations;
    return {
      // 迭代上限**不按设备档位缩放**。
      //
      // 早期版本把上限乘以档位系数（桌面 ×1、手机 ×0.18），本意是"让弱设备
      // 一批别跑太久"。但那是错的，两个原因：
      //   1) 每批要跑多久由校准环节按**时间**收敛（targetBatchMs），根本不需要
      //      靠上限去压；上限只是个安全边界。
      //   2) 更重要的是它**破坏了跨平台可比性**：手机的上限只有桌面的 1/5.5，
      //      一旦撞顶，单批就落在 1ms 量级，而 iOS 的时钟粒度是 0.5ms —— 相对
      //      误差几十个百分点，校准据此把迭代数放大，报出远超物理极限的假值
      //      （iPhone SE 3 实测把 A15 的 ALU 报成 15339 GFLOPS，理论约 1500）。
      // 现在所有平台用同一个上限，实际批量由校准按时间收敛，压力完全一致。
      maxIterations: Math.max(1, Math.round(maxIter)),
      maxPlausible: test.maxPlausible || l.maxPlausible || null,
      minPlausible: test.minPlausible || l.minPlausible || null,
      workloadScale: 1
    };
  }

  function Harness(ctx, options) {
    this.ctx = ctx;
    this.options = Object.assign({
      warmupMs: 450,
      targetBatchMs: 55,
      measureMs: 2200,
      rounds: 3,
      maxIterations: 1 << 22,
      minIterations: 1,
      workloadScale: (ctx && ctx.workloadScale) || 1
    }, options || {});
    this.aborted = false;
  }

  Harness.prototype.abort = function () { this.aborted = true; };

  /**
   * 运行一个微基准测试。
   * test = {
   *   id, name, group, unit, unitScale, desc,
   *   support(ctx) -> {ok, reason},
   *   setup(ctx) -> state,
   *   encode(ctx, state, n) -> Promise<units>,          // 执行 n 个工作单元
   *   unitsPerIteration,                                 // 每个工作单元产生的计量数
   *   visualize(ctx, state),                             // 可选：把中间结果画到画布
   *   teardown(ctx, state)
   * }
   */
  Harness.prototype.runTest = function (test, hooks) {
    hooks = hooks || {};
    var self = this;
    var ctx = this.ctx;
    var opt = this.options;

    var result = {
      id: test.id, name: test.name, group: test.group,
      unit: test.unit, unitScale: test.unitScale || 1,
      backend: ctx.kind, status: 'pending',
      raw: null, metric: null, samples: [], cv: 0, valid: false,
      batchIterations: 0, batches: 0, rounds: 0,
      wallMs: 0, error: null, reason: null, meta: {}
    };
    var errBase = 0;

    function report(phase, data) {
      if (hooks.onProgress) {
        try { hooks.onProgress(Object.assign({ id: test.id, phase: phase }, data || {})); } catch (e) { /* noop */ }
      }
    }

    return Promise.resolve()
      .then(function () {
        errBase = (ctx.errors && ctx.errors.length) || 0;
        if (test.support) {
          var s = test.support(ctx);
          if (s && s.ok === false) {
            result.status = 'skipped';
            result.reason = s.reason || '环境不支持';
            return null;
          }
        }
        result.status = 'setup';
        return Promise.resolve(test.setup ? test.setup(ctx) : {});
      })
      .then(function (state) {
        // state === null 表示 support() 判定环境不支持：直接返回**结果对象**，
        // 不能返回 null，否则调用方拿到的会是空值，评分阶段读 r.id 就会炸。
        if (state === null) return result;

        var unitsPer = (typeof test.unitsPerIteration === 'function')
          ? test.unitsPerIteration(ctx) : (test.unitsPerIteration || 1);
        var lim = limitsOf(test, opt);
        result.maxIterations = lim.maxIterations;
        // 同步本身有固定开销（WebGPU 的围栏要 mapAsync 往返；WebGL2 的 readPixels
        // 要等一次回读）。这个开销会加在每个批次的墙钟时间里，批量越短占比越大，
        // 必须实测出来并扣掉，否则短批次会被系统性高估。
        // 同步开销只做**记录**，不做扣除。
        //
        // 曾经尝试把它从每批耗时里减掉，结果是一场灾难：开销是在 GPU 空闲时
        // 用 7 次连续同步测出来的中位数，忙时并不成立；一旦高估，raw - overhead
        // 变负，被夹到极小值，吞吐就放大几十万倍 —— 实测 fill 报出 44956.10 GPixel/s、
        // geometry 报出 2048000.00 GTri/s，校准据此把批量推到天文数字，
        // 手机上直接卡死甚至重启。
        //
        // 结论：宁可让数值略微偏高（同步开销占比本来就 <1%），也不能引入
        // 一个会把错误放大的减法。这里只记录，供诊断查看。
        var syncOverhead = 0;
        var measure = function (n) {
          var t0 = U.now();
          return Promise.resolve(test.encode(ctx, state, n)).then(function (units) {
            var raw = U.now() - t0;
            return { units: (units === undefined || units === null) ? n * unitsPer : units, ms: raw, rawMs: raw, n: n };
          });
        };

        /* ---------- 1) 预热：着色器编译、缓存、电源策略都进入稳态 ----------
         * 同时把单批迭代数 n 逐步抬到「一批约等于 targetBatchMs 的一半」，
         * 这样后面的正式测量不会因为批量太小而被驱动开销污染。          */
        /* ---------- 0) 标定同步开销 ---------- */
        var calSamples = [];
        function calSync(i) {
          if (i >= 7) {
            calSamples.sort(function (a, b) { return a - b; });
            syncOverhead = calSamples[Math.floor(calSamples.length / 2)] || 0;
            result.syncOverheadMs = syncOverhead;
            return Promise.resolve();
          }
          var t0 = U.now();
          return ctx.sync().then(function () {
            calSamples.push(U.now() - t0);
            return calSync(i + 1);
          });
        }

        result.status = 'warmup';
        report('warmup', {});
        var warmStart = U.now();
        var n = Math.max(1, test.initialIterations || 1);
        var warmCount = 0;
        var halfBatch = opt.targetBatchMs * 0.5;
        return calSync(0).then(function () {
          return (function warmLoop() {
            if (self.aborted) throw new Error('用户中止');
            return measure(n).then(function (r) {
              warmCount++;
              if (r.ms < halfBatch && n < lim.maxIterations) {
                var f = r.ms < 0.5 ? 8 : Math.max(1.5, Math.min(8, halfBatch / Math.max(r.ms, 0.05)));
                n = Math.max(n + 1, Math.min(lim.maxIterations, Math.floor(n * f)));
              }
              if (U.now() - warmStart > opt.warmupMs && warmCount >= 3) return null;
              return warmLoop();
            });
          })();
        })
          .then(function () {
            /* ---------- 2) 校准：把单批耗时收敛到 targetBatchMs ---------- */
            result.status = 'calibrate';
            report('calibrate', {});
            // 测量分辨率下限：单批必须至少是这个时长的若干倍，否则时钟粒度会
            // 把结果放大几十倍。iOS Safari 的 performance.now() 只有 0.5ms 粒度，
            // 而移动端档位会把迭代上限砍到 1/5.5，导致批量撞顶后仍在 1ms 量级 ——
            // iPhone SE 3 实测因此把 A15 的 ALU 报成 15817 GFLOPS（理论约 1500）。
            // 解决办法不是跳过，而是**把上限抬上去**，直到批量足够长。
            var minUsefulMs = Math.max(opt.targetBatchMs * 0.25, (ctx.timerResMs || 0) * 20);
            if (!isFinite(minUsefulMs) || minUsefulMs > opt.targetBatchMs) minUsefulMs = opt.targetBatchMs * 0.25;
            // 校准的硬性看门狗：无论如何最多 15 秒。
            // 曾经为了「让手机上的批量足够长」在这里自动抬高迭代上限，但没有
            // 次数与绝对上限约束，设备一旦始终达不到目标批量就会无限放大，
            // 表现就是进度卡在个位数百分比不动、手机死机重启。
            // 现在**不再抬高上限**（回到原始行为：撞顶就标记精度存疑），
            // 并加这道看门狗，保证任何情况下校准都会结束。
            var calDeadline = U.now() + 15000;
            return measure(n).then(function calibrate(probe) {
              if (self.aborted) throw new Error('用户中止');
              if (probe.ms >= opt.targetBatchMs || probe.n >= lim.maxIterations) {
                n = probe.n;
                if (n >= lim.maxIterations && probe.ms < minUsefulMs) {
                  result.meta.timingSuspect = true;
                  result.meta.timingNote = '单批耗时 ' + U.fmt.num(probe.ms, 2) +
                    ' ms 仍低于可靠测量所需（' + U.fmt.num(minUsefulMs, 2) +
                    ' ms，受本机时钟粒度 ' + U.fmt.num(ctx.timerResMs || 0, 3) + ' ms 限制），结果精度有限。';
                }
                return null;
              }
              if (U.now() > calDeadline) {
                n = probe.n;
                result.meta.calTimeout = true;
                return null;
              }
              var factor = probe.ms < 0.5 ? 8 : Math.max(1.5, Math.min(8, opt.targetBatchMs / Math.max(probe.ms, 0.05)));
              var next = Math.max(opt.minIterations, Math.min(lim.maxIterations, Math.floor(n * factor)));
              if (next === n) return null;
              n = next;
              return measure(n).then(calibrate);
            });
          })
          .then(function () {
            result.batchIterations = n;
            // 若某项测试因为硬件/预算硬约束缩小了工作规模，标记出来：
            // 它与其它平台不是完全相同的负载，报告里要能看见。
            if (test.id === 'bandwidth' && ctx._bwScaledDown) {
              result.meta.scaledDown = true;
              result.meta.scaleNote = '该设备的显存/绑定上限不足以容纳标准 33.5 MB×2 缓冲，已按硬件上限缩小；此项与其它平台的工作量不完全相同。';
            }
            /* ---------- 3) 正式测量：多轮，每轮固定时长 ---------- */
            result.status = 'measure';
            var samples = [];
            var t0 = U.now();
            var round = 0;
            return (function roundLoop() {
              if (self.aborted) throw new Error('用户中止');
              if (round >= opt.rounds) return null;
              round++;
              var elapsed = 0, units = 0, batches = 0;
              var roundStart = U.now();
              return (function batchLoop() {
                if (self.aborted) throw new Error('用户中止');
                if (elapsed >= opt.measureMs) return null;
                return measure(n).then(function (res) {
                  elapsed += res.ms;
                  units += res.units;
                  batches++;
                  report('measuring', {
                    round: round, rounds: opt.rounds,
                    progress: Math.min(1, elapsed / opt.measureMs),
                    overall: ((round - 1) + Math.min(1, elapsed / opt.measureMs)) / opt.rounds,
                    current: res.units / (res.ms / 1000)
                  });
                  return batchLoop();
                });
              })().then(function () {
                result.batches += batches;
                var perSec = units / (elapsed / 1000);
                samples.push(perSec);
                result.samples = samples.slice();
                result.rounds = samples.length;
                report('round-done', { round: samples.length, rounds: opt.rounds, value: perSec });
                if (test.visualize) { try { test.visualize(ctx, state); } catch (e) { /* noop */ } }
                return roundLoop();
              });
            })().then(function () {
              result.wallMs = U.now() - t0;
              if (!samples.length) throw new Error('没有采集到有效样本');
              result.raw = U.stats.median(samples);
              result.best = U.stats.max(samples);
              result.worst = U.stats.min(samples);
              result.mean = U.stats.mean(samples);
              result.cv = samples.length > 1 ? U.stats.cv(samples) : 0;
              result.metric = result.raw / result.unitScale;
              result.valid = result.cv <= 0.10;
              if (!result.valid) {
                result.reason = '样本波动较大（CV ' + U.fmt.pct(result.cv) + '），结果仅供参考';
              }

              // 先让测试自己换算最终指标（例如延迟类会把 ops/s 换成 ms），再做合理性校验
              if (test.postProcess) {
                try { test.postProcess(result, ctx, state); }
                catch (e) { U.log('bench', 'postProcess 失败 ' + test.id + ': ' + e.message); }
              }

              // 物理合理性校验：既是异常计时的兜底，也是一道基础防伪
              var m = result.metric;
              if (lim.maxPlausible !== null && isFinite(m) && m > lim.maxPlausible) {
                result.valid = false;
                result.suspect = true;
                result.reason = '实测值 ' + U.fmt.num(m, 2) + ' ' + result.unit +
                  ' 超出该测试的物理上限 ' + U.fmt.num(lim.maxPlausible, 2) + ' ' + result.unit +
                  '，说明计时或驱动异常（软件渲染 / 命令被丢弃 / 上下文异常），结果已标记为无效。';
              }
              if (lim.minPlausible !== null && isFinite(m) && m < lim.minPlausible) {
                result.valid = false;
                result.suspect = true;
                result.reason = '实测值 ' + U.fmt.num(m, 4) + ' ' + result.unit +
                  ' 低于物理下限 ' + U.fmt.num(lim.minPlausible, 4) + ' ' + result.unit + '，结果已标记为无效。';
              }
              // 设备感知的带宽上限：显存实际吞吐不可能显著超过参考库给出的理论带宽。
              // 后端同步失效时校准会误判 GPU 极快、把迭代数放大，从而报出超理论的假值
              // （实测 WebGL2 上出现过 386 GB/s，而这张卡理论只有 192 GB/s）。
              if (result.valid && test.id === 'bandwidth' && ctx.theoreticalGBs > 0 &&
                  isFinite(m) && m > ctx.theoreticalGBs * 1.25) {
                result.valid = false;
                result.suspect = true;
                result.reason = '实测带宽 ' + U.fmt.num(m, 1) + ' GB/s 超过该 GPU 理论带宽 ' +
                  U.fmt.num(ctx.theoreticalGBs, 0) + ' GB/s 的 1.25 倍，说明测量未真正等到 GPU 完成，结果已作废。';
              }
              // 纹理采样率同样有物理上限：采样源是 16 MB 的纹理，远超任何 GPU 的
              // 纹理缓存，所以每次采样基本都要访问显存。按「带宽 ÷ 4 字节 × 8 倍局部性」
              // 给一个宽松上限，足以挡住 10 倍级的虚高而不误伤真实高端卡
              // （RTX 4090：1008 GB/s → 上限约 2016 GTexel/s，实测约 1000）。
              if (result.valid && test.id === 'texture' && ctx.theoreticalGBs > 0 &&
                  isFinite(m) && m > ctx.theoreticalGBs / 4 * 8) {
                result.valid = false;
                result.suspect = true;
                result.reason = '实测纹素率 ' + U.fmt.num(m, 0) + ' GTexel/s 超过由理论带宽 ' +
                  U.fmt.num(ctx.theoreticalGBs, 0) + ' GB/s 推导的上限 ' +
                  U.fmt.num(ctx.theoreticalGBs / 4 * 8, 0) + ' GTexel/s，说明测量未真正等到 GPU 完成，结果已作废。';
              }              // 同理卡住 FP32 类算力：纯 ALU 循环的实测吞吐不可能超过该 GPU 的
              // 理论 FP32 峰值的 1.25 倍。实测 iPhone A15 报出 15817 GFLOPS
              // （理论约 1500），把总分从约 300 抬到 973 —— 必须挡掉。
              if (result.valid && ctx.theoreticalFp32 > 0 &&
                  /GFLOPS|GOPS/i.test(result.unit) && isFinite(m) && m > ctx.theoreticalFp32 * 1000 * 1.25) {
                result.valid = false;
                result.suspect = true;
                result.reason = '实测 ' + U.fmt.num(m, 0) + ' ' + result.unit + ' 超过该 GPU 理论 FP32 峰值 ' +
                  U.fmt.num(ctx.theoreticalFp32, 2) + ' TFLOPS 的 1.25 倍，说明测量未真正等到 GPU 完成，结果已作废。';
              }
              if (result.meta.timingSuspect && result.valid) {
                result.meta.timingNote = '单批迭代数已达上限但耗时仍远低于目标，测量粒度可能偏粗。';
              }

              // 图形 API 层面的校验错误：命令缓冲被整体拒绝时，GPU 什么都不会执行，
              // 计时却照跑，于是产生「快得离谱」的假数据。这里主动识别并作废。
              if (ctx.errors && ctx.errors.length > errBase) {
                var newErrs = ctx.errors.slice(errBase);
                result.valid = false;
                result.suspect = true;
                result.reason = '测试期间出现 ' + newErrs.length + ' 条图形 API 校验错误，命令未真正执行，结果已作废。首个错误：' +
                  String(newErrs[0]).slice(0, 200);
                result.meta.apiErrors = newErrs.slice(0, 5);
              }
              if (ctx.contextLost) {
                result.valid = false;
                result.suspect = true;
                result.reason = '图形上下文在测试期间丢失（显存不足 / 系统回收 / 驱动重置），结果无效。' +
                  '请降低渲染分辨率或关闭其他占用显卡的程序后重测。';
              }

              result.status = 'done';
            });
          })
          .then(function () {
            if (test.teardown) { try { test.teardown(ctx, state); } catch (e) { /* noop */ } }
            return result;
          })
          .catch(function (err) {
            result.status = 'failed';
            result.error = err && err.message ? err.message : String(err);
            U.log('bench', test.id + ' 失败: ' + result.error);
            try { if (test.teardown) test.teardown(ctx, state); } catch (e2) { /* noop */ }
            return result;
          });
      })
      .catch(function (err) {
        result.status = 'failed';
        result.error = err && err.message ? err.message : String(err);
        return result;
      });
  };

  /**
   * 运行自定义测试（例如长时间的综合场景测试）。
   * test = { id, name, group, support, run(ctx, hooks) -> Promise<result部分字段> }
   */
  Harness.prototype.runCustom = function (test, hooks) {
    var self = this, ctx = this.ctx;
    hooks = hooks || {};
    var errBase = (ctx.errors && ctx.errors.length) || 0;
    var result = {
      id: test.id, name: test.name, group: test.group,
      unit: test.unit, unitScale: test.unitScale || 1,
      backend: ctx.kind, status: 'pending',
      raw: null, metric: null, samples: [], cv: 0, valid: false,
      error: null, reason: null, meta: {}
    };
    function report(phase, data) {
      if (hooks.onProgress) {
        try { hooks.onProgress(Object.assign({ id: test.id, phase: phase }, data || {})); } catch (e) { /* noop */ }
      }
    }
    return Promise.resolve().then(function () {
      if (test.support) {
        var s = test.support(ctx);
        if (s && s.ok === false) { result.status = 'skipped'; result.reason = s.reason; return null; }
      }
      result.status = 'measure';
      return test.run(ctx, {
        report: report,
        isAborted: function () { return self.aborted; }
      }).then(function (out) {
        Object.assign(result, out || {});
        result.status = result.status === 'failed' ? 'failed' : 'done';
        // 自定义测试同样做合理性校验
        var lim = limitsOf(test, self.options);
        if (result.status === 'done' && typeof result.metric === 'number' && isFinite(result.metric)) {
          if (lim.maxPlausible !== null && result.metric > lim.maxPlausible) {
            result.valid = false;
            result.reason = '实测值 ' + U.fmt.num(result.metric, 2) + ' ' + result.unit +
              ' 超出物理上限，结果已标记为无效。';
          }
          // 设备感知的带宽上限：显存实际吞吐不可能显著超过参考库给出的理论带宽。
          // 后端同步失效时校准会误判 GPU 极快、把迭代数放大，从而报出超理论的假值
          // （实测 WebGL2 上出现过 381 GB/s，而这张卡理论只有 192 GB/s）。
          if (result.valid && test.id === 'bandwidth' && ctx.theoreticalGBs > 0) {
            var bwCap = ctx.theoreticalGBs * 1.25;
            if (result.metric > bwCap) {
              result.valid = false;
              result.suspect = true;
              result.reason = '实测带宽 ' + U.fmt.num(result.metric, 1) + ' GB/s 超过该 GPU 理论带宽 ' +
                U.fmt.num(ctx.theoreticalGBs, 0) + ' GB/s 的 1.25 倍，说明测量未真正等到 GPU 完成，结果已作废。';
            }
          }
        }
        // 图形 API 校验错误：着色器没编译过 / 管线创建失败时 GPU 什么都不画，
        // 计时却照跑，会得到一条「快得离谱」的假数据，必须作废。
        if (ctx.errors && ctx.errors.length > errBase) {
          var newErrs = ctx.errors.slice(errBase);
          result.valid = false;
          result.suspect = true;
          result.reason = '测试期间出现 ' + newErrs.length + ' 条图形 API 校验错误，渲染未真正执行，结果已作废。首个错误：' +
            String(newErrs[0]).slice(0, 300);
          result.meta.apiErrors = newErrs.slice(0, 5);
        }
        if (ctx.contextLost) {
          result.valid = false;
          result.suspect = true;
          result.reason = '图形上下文在测试期间丢失，结果无效。';
        }
        return result;
      });
    }).catch(function (err) {
      result.status = 'failed';
      result.error = err && err.message ? err.message : String(err);
      return result;
    });
  };

  Nova.engine = {
    create: create,
    Harness: Harness,
    insertDefines: insertDefines
  };
  Nova.bench = Nova.bench || {};

})(window);
