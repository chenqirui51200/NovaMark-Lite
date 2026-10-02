/* ============================================================================
 * NovaMark · 毒蘑菇低压力测试（Volume Shader BM）
 *
 * 算法来自开源项目 cznull / volumeshader_bm（volumeshader.html，WebGL1）。
 * 它是一个**隐式曲面光线求交**：对每个像素沿视线步进，检测 kernal 函数的符号变化，
 * 再用二分法 / 黄金分割法把交点收敛到亚像素精度，最后用有限差分求法线并着色。
 *
 * 原版参数（压力很高，每像素约 220 次 kernal 求值）：
 *   step = 0.01，外层最多 200 步，SOLVER = 8 次二分，MAXR = 8 次黄金分割，
 *   命中后还要 6 次 kernal 求法线。每次 kernal 含 3 个 cos + 3 次除法。
 *
 * 本测试**刻意大幅降低压力**，分三档递进（都远低于原版）：
 *   档位  最大步数  步长   二分 黄金分割   每像素求值   相对原版
 *   低      80     0.024    5     4          ≈ 99       ≈ 45%
 *   中     120     0.017    6     5          ≈ 142      ≈ 65%
 *   高     160     0.013    7     6          ≈ 186      ≈ 85%
 * 三档共用同一套算法与相机路径，只有这三个旋钮不同，所以档内可跨设备对比。
 * 三档的光线总行程都约 5 个单位（与原版一致），保证打到的是同一层曲面细节。
 *
 * 之所以要降压：原版是为「把显卡压满」设计的，在手机上会直接掉到个位数帧率、
 * 甚至触发浏览器杀页面。降压后既保留了同一套数学负载，又能跑遍桌面到移动端。
 * ==========================================================================*/
(function (global) {
  'use strict';

  var Nova = global.Nova = global.Nova || {};
  var U = Nova.util;

  /* ------------------------------ 档位定义 ------------------------------ */

  var LEVELS = [
    { key: 'low', name: '低', maxSteps: 110, step: 0.020, solve: 6, golden: 5, seconds: 5 },
    { key: 'mid', name: '中', maxSteps: 150, step: 0.014, solve: 7, golden: 6, seconds: 6 },
    { key: 'high', name: '高', maxSteps: 190, step: 0.011, solve: 8, golden: 7, seconds: 8 }
  ];

  /** 每像素 kernal 求值次数的估算（用于报告里说明负载量级） */
  function kernalPerPixel(lv) {
    return lv.maxSteps + lv.solve + lv.golden * 2 + 6;
  }

  /* ------------------------------ 着色器 ------------------------------ */

  var KERNEL = [
    'fn kernal(ver: vec3<f32>) -> f32 {',
    '  let x = cos(1.0 / (ver.x * ver.x + 0.06));',
    '  let y = cos(1.0 / (ver.y * ver.y + 0.06));',
    '  let z = cos(1.0 / (ver.z * ver.z + 0.06));',
    '  return -x - y - z - 1.2;',
    '}'
  ].join('\n');

  var KERNEL_GLSL = [
    'float kernal(vec3 ver) {',
    '  float x = cos(1.0 / (ver.x * ver.x + 0.06));',
    '  float y = cos(1.0 / (ver.y * ver.y + 0.06));',
    '  float z = cos(1.0 / (ver.z * ver.z + 0.06));',
    '  return -x - y - z - 1.2;',
    '}'
  ].join('\n');

  /** 生成 WGSL 片元着色器（MAX_STEPS 等用字面量注入，保证循环边界是编译期常量） */
  function wgslFragment(lv) {
    return `
struct VsbmU {
  origin  : vec4<f32>,
  right   : vec4<f32>,
  up      : vec4<f32>,
  forward : vec4<f32>,
  params  : vec4<f32>,   // [x, y, len, step]
};
@group(0) @binding(0) var<uniform> U : VsbmU;

const M_L : f32 = 0.3819660113;
const M_R : f32 = 0.6180339887;
const MAXS : i32 = ${lv.maxSteps};
const SOLVER : i32 = ${lv.solve};
const GOLDEN : i32 = ${lv.golden};

${KERNEL}

struct VSOut {
  @builtin(position) pos : vec4<f32>,
  @location(0) dir : vec3<f32>,
  @location(1) localdir : vec3<f32>,
};

@vertex
fn vs_main(@location(0) position : vec3<f32>) -> VSOut {
  var o : VSOut;
  o.pos = vec4<f32>(position, 1.0);
  o.dir = U.forward.xyz + U.right.xyz * (position.x * U.params.x) + U.up.xyz * (position.y * U.params.y);
  o.localdir = vec3<f32>(position.x * U.params.x, position.y * U.params.y, -1.0);
  return o;
}

@fragment
fn fs_main(in: VSOut) -> @location(0) vec4<f32> {
  var color = vec3<f32>(0.0);
  var hit = 0;
  var r1 = 0.0;
  var r2 = 0.0;
  var r3 = 0.0;
  var r4 = 0.0;
  var m1 = 0.0;
  var m2 = 0.0;
  var m3 = 0.0;

  let step = U.params.w;
  let len = U.params.z;
  let dir = in.dir;

  var v1 = kernal(U.origin.xyz + dir * (step * len));
  var v2 = kernal(U.origin.xyz);

  for (var k = 2; k < MAXS; k = k + 1) {
    let fk = f32(k);
    let ver = U.origin.xyz + dir * (step * len * fk);
    let v = kernal(ver);

    // 情况一：从内部穿到外部，二分收敛
    if (v > 0.0 && v1 < 0.0) {
      r1 = step * len * (fk - 1.0);
      r2 = step * len * fk;
      m1 = kernal(U.origin.xyz + dir * r1);
      m2 = kernal(U.origin.xyz + dir * r2);
      for (var l = 0; l < SOLVER; l = l + 1) {
        r3 = r1 * 0.5 + r2 * 0.5;
        m3 = kernal(U.origin.xyz + dir * r3);
        if (m3 > 0.0) { r2 = r3; m2 = m3; } else { r1 = r3; m1 = m3; }
      }
      if (r3 < 2.0 * len) { hit = 1; break; }
    }

    // 情况二：发现局部极小值 → 先用黄金分割把极值夹逼出来，再二分
    if (v < v1 && v1 > v2 && v1 < 0.0 && (v1 * 2.0 > v || v1 * 2.0 > v2)) {
      r1 = step * len * (fk - 2.0);
      r2 = step * len * (fk - 2.0 + 2.0 * M_L);
      r3 = step * len * (fk - 2.0 + 2.0 * M_R);
      r4 = step * len * fk;
      m2 = kernal(U.origin.xyz + dir * r2);
      m3 = kernal(U.origin.xyz + dir * r3);
      for (var l2 = 0; l2 < GOLDEN; l2 = l2 + 1) {
        if (m2 > m3) {
          r4 = r3; r3 = r2;
          r2 = r4 * M_L + r1 * M_R;
          m3 = m2;
          m2 = kernal(U.origin.xyz + dir * r2);
        } else {
          r1 = r2; r2 = r3;
          r3 = r4 * M_R + r1 * M_L;
          m2 = m3;
          m3 = kernal(U.origin.xyz + dir * r3);
        }
      }
      if (m2 > 0.0) {
        r1 = step * len * (fk - 2.0);
        m1 = kernal(U.origin.xyz + dir * r1);
        m2 = kernal(U.origin.xyz + dir * r2);
        for (var l3 = 0; l3 < SOLVER; l3 = l3 + 1) {
          r3 = r1 * 0.5 + r2 * 0.5;
          m3 = kernal(U.origin.xyz + dir * r3);
          if (m3 > 0.0) { r2 = r3; m2 = m3; } else { r1 = r3; m1 = m3; }
        }
        if (r3 < 2.0 * len && r3 > step * len) { hit = 1; break; }
      } else if (m3 > 0.0) {
        r1 = step * len * (fk - 2.0);
        r2 = r3;
        m1 = kernal(U.origin.xyz + dir * r1);
        m2 = kernal(U.origin.xyz + dir * r2);
        for (var l4 = 0; l4 < SOLVER; l4 = l4 + 1) {
          r3 = r1 * 0.5 + r2 * 0.5;
          m3 = kernal(U.origin.xyz + dir * r3);
          if (m3 > 0.0) { r2 = r3; m2 = m3; } else { r1 = r3; m1 = m3; }
        }
        if (r3 < 2.0 * len && r3 > step * len) { hit = 1; break; }
      }
    }

    v2 = v1;
    v1 = v;
  }

  if (hit == 1) {
    let p = U.origin.xyz + dir * r3;
    let eps = r3 * 0.001;
    var n = vec3<f32>(0.0);
    n.x = kernal(p - U.right.xyz * eps) - kernal(p + U.right.xyz * eps);
    n.y = kernal(p - U.up.xyz * eps) - kernal(p + U.up.xyz * eps);
    n.z = kernal(p + U.forward.xyz * eps) - kernal(p - U.forward.xyz * eps);
    n = normalize(n);

    let ld = normalize(in.localdir);
    let refl = n * (-2.0 * dot(ld, n)) + ld;
    let spec = max(0.0, refl.x * 0.276 + refl.y * 0.920 + refl.z * 0.276);
    let diff = n.x * 0.276 + n.y * 0.920 + n.z * 0.276;
    let s4 = spec * spec * spec * spec;
    color = vec3<f32>(0.0, 1.0, 1.0) * (s4 * 0.45 + diff * 0.25 + 0.3);
  }

  return vec4<f32>(color, 1.0);
}`;
  }

  /** 生成 GLSL ES 3.00 片元着色器（同一算法的对译） */
  function glslFragment(lv) {
    return `#version 300 es
precision highp float;

uniform vec3 uOrigin;
uniform vec3 uRight;
uniform vec3 uUp;
uniform vec3 uForward;
uniform vec4 uParams;   // [x, y, len, step]

in vec3 vDir;
in vec3 vLocalDir;
layout(location = 0) out vec4 fragColor;

#define M_L 0.3819660113
#define M_R 0.6180339887
#define MAXS ${lv.maxSteps}
#define SOLVER ${lv.solve}
#define GOLDEN ${lv.golden}

${KERNEL_GLSL}

void main() {
  vec3 color = vec3(0.0);
  int hit = 0;
  float r1 = 0.0, r2 = 0.0, r3 = 0.0, r4 = 0.0;
  float m1 = 0.0, m2 = 0.0, m3 = 0.0;

  float stepLen = uParams.w;
  float len = uParams.z;
  vec3 dir = vDir;

  float v1 = kernal(uOrigin + dir * (stepLen * len));
  float v2 = kernal(uOrigin);

  for (int k = 2; k < MAXS; k++) {
    float fk = float(k);
    vec3 ver = uOrigin + dir * (stepLen * len * fk);
    float v = kernal(ver);

    if (v > 0.0 && v1 < 0.0) {
      r1 = stepLen * len * (fk - 1.0);
      r2 = stepLen * len * fk;
      m1 = kernal(uOrigin + dir * r1);
      m2 = kernal(uOrigin + dir * r2);
      for (int l = 0; l < SOLVER; l++) {
        r3 = r1 * 0.5 + r2 * 0.5;
        m3 = kernal(uOrigin + dir * r3);
        if (m3 > 0.0) { r2 = r3; m2 = m3; } else { r1 = r3; m1 = m3; }
      }
      if (r3 < 2.0 * len) { hit = 1; break; }
    }

    if (v < v1 && v1 > v2 && v1 < 0.0 && (v1 * 2.0 > v || v1 * 2.0 > v2)) {
      r1 = stepLen * len * (fk - 2.0);
      r2 = stepLen * len * (fk - 2.0 + 2.0 * M_L);
      r3 = stepLen * len * (fk - 2.0 + 2.0 * M_R);
      r4 = stepLen * len * fk;
      m2 = kernal(uOrigin + dir * r2);
      m3 = kernal(uOrigin + dir * r3);
      for (int l = 0; l < GOLDEN; l++) {
        if (m2 > m3) {
          r4 = r3; r3 = r2;
          r2 = r4 * M_L + r1 * M_R;
          m3 = m2;
          m2 = kernal(uOrigin + dir * r2);
        } else {
          r1 = r2; r2 = r3;
          r3 = r4 * M_R + r1 * M_L;
          m2 = m3;
          m3 = kernal(uOrigin + dir * r3);
        }
      }
      if (m2 > 0.0) {
        r1 = stepLen * len * (fk - 2.0);
        m1 = kernal(uOrigin + dir * r1);
        m2 = kernal(uOrigin + dir * r2);
        for (int l = 0; l < SOLVER; l++) {
          r3 = r1 * 0.5 + r2 * 0.5;
          m3 = kernal(uOrigin + dir * r3);
          if (m3 > 0.0) { r2 = r3; m2 = m3; } else { r1 = r3; m1 = m3; }
        }
        if (r3 < 2.0 * len && r3 > stepLen * len) { hit = 1; break; }
      } else if (m3 > 0.0) {
        r1 = stepLen * len * (fk - 2.0);
        r2 = r3;
        m1 = kernal(uOrigin + dir * r1);
        m2 = kernal(uOrigin + dir * r2);
        for (int l = 0; l < SOLVER; l++) {
          r3 = r1 * 0.5 + r2 * 0.5;
          m3 = kernal(uOrigin + dir * r3);
          if (m3 > 0.0) { r2 = r3; m2 = m3; } else { r1 = r3; m1 = m3; }
        }
        if (r3 < 2.0 * len && r3 > stepLen * len) { hit = 1; break; }
      }
    }

    v2 = v1;
    v1 = v;
  }

  if (hit == 1) {
    vec3 p = uOrigin + dir * r3;
    float eps = r3 * 0.001;
    vec3 n = vec3(0.0);
    n.x = kernal(p - uRight * eps) - kernal(p + uRight * eps);
    n.y = kernal(p - uUp * eps) - kernal(p + uUp * eps);
    n.z = kernal(p + uForward * eps) - kernal(p - uForward * eps);
    n = normalize(n);

    vec3 ld = normalize(vLocalDir);
    vec3 refl = n * (-2.0 * dot(ld, n)) + ld;
    float spec = max(0.0, refl.x * 0.276 + refl.y * 0.920 + refl.z * 0.276);
    float diff = n.x * 0.276 + n.y * 0.920 + n.z * 0.276;
    float s4 = spec * spec * spec * spec;
    color = vec3(0.0, 1.0, 1.0) * (s4 * 0.45 + diff * 0.25 + 0.3);
  }

  fragColor = vec4(color, 1.0);
}`;
  }

  var GLSL_VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPos;
uniform vec3 uRight;
uniform vec3 uUp;
uniform vec3 uForward;
uniform vec4 uParams;
out vec3 vDir;
out vec3 vLocalDir;
void main() {
  gl_Position = vec4(aPos, 1.0);
  vDir = uForward + uRight * (aPos.x * uParams.x) + uUp * (aPos.y * uParams.y);
  vLocalDir = vec3(aPos.x * uParams.x, aPos.y * uParams.y, -1.0);
}`;

  /* ------------------------------ 相机 ------------------------------ */

  /** 复刻原项目的相机模型：球坐标 + 环绕角速度 */
  function cameraAt(t) {
    var ang1 = t * 0.18;
    var ang2 = Math.sin(t * 0.07) * 0.55;
    var len = 2.5;
    var ca = Math.cos(ang1), sa = Math.sin(ang1);
    var cb = Math.cos(ang2), sb = Math.sin(ang2);
    return {
      origin: [len * ca * cb, len * sb, len * sa * cb],
      right: [sa, 0, -ca],
      up: [-sb * ca, cb, -sb * sa],
      forward: [-ca * cb, -sb, -sa * cb],
      len: len
    };
  }

  function fillUniform(arr, t, lv, aspect) {
    var c = cameraAt(t);
    arr[0] = c.origin[0]; arr[1] = c.origin[1]; arr[2] = c.origin[2]; arr[3] = 0;
    arr[4] = c.right[0]; arr[5] = c.right[1]; arr[6] = c.right[2]; arr[7] = 0;
    arr[8] = c.up[0]; arr[9] = c.up[1]; arr[10] = c.up[2]; arr[11] = 0;
    arr[12] = c.forward[0]; arr[13] = c.forward[1]; arr[14] = c.forward[2]; arr[15] = 0;
    arr[16] = 2.0;              // x 缩放（原项目用 cx*2/(cx+cy)，这里恒为 2/(1+1/aspect) 形式）
    arr[17] = 2.0 / aspect;
    arr[18] = c.len;
    arr[19] = lv.step;
    return arr;
  }

  /* ------------------------------ 测试定义 ------------------------------ */

  function makeTest(ctx, opts) {
    opts = opts || {};
    var scale = opts.levelScale || 1;
    var levels = LEVELS.map(function (lv) {
      var o = {};
      for (var k in lv) if (Object.prototype.hasOwnProperty.call(lv, k)) o[k] = lv[k];
      o.seconds = Math.max(2.5, Math.round(lv.seconds * scale));
      return o;
    });
    var totalSteps = levels.reduce(function (a, l) { return a + kernalPerPixel(l); }, 0);
    var isGPU = ctx.kind === 'webgpu';

    return {
      id: 'vsbm',
      name: '毒蘑菇低压力测试（Volume Shader BM）',
      group: 'scene',
      unit: 'FPS',
      unitScale: 1,
      desc: '开源项目 Volume Shader BM 的隐式曲面光线求交负载，分低/中/高三档递进。',
      detail: '算法取自 cznull / volumeshader_bm：每个像素沿视线步进 kernal 函数并做符号变化检测，' +
        '再用二分法与黄金分割法收敛交点、有限差分求法线。原版最多 200 步 + 8 次二分 + 8 次黄金分割（每像素约 220 次求值），' +
        '本测试降至 ' + levels.map(function (l) { return l.maxSteps; }).join(' / ') +
        ' 步（每像素约 ' + kernalPerPixel(levels[0]) + '–' + kernalPerPixel(levels[2]) + ' 次求值），' +
        '相对原版约 ' + Math.round(kernalPerPixel(levels[0]) / 220 * 100) + '%–' +
        Math.round(kernalPerPixel(levels[2]) / 220 * 100) + '%，以便从桌面到移动端都能跑完。',
      run: function (cc, rp) {
        return isGPU
          ? runWebGPU(cc, levels, rp)
          : runWebGL2(cc, levels, rp);
      }
    };
  }

  /* ------------------------------ WebGPU 实现 ------------------------------ */

  function runWebGPU(ctx, levels, rp) {
    var device = ctx.device;
    var W = ctx.width, H = ctx.height;
    var F = GPUBufferUsage;

    var quad = new Float32Array([
      -1, -1, 0, 1, -1, 0, 1, 1, 0,
      -1, -1, 0, 1, 1, 0, -1, 1, 0
    ]);
    var vbuf = device.createBuffer({ size: quad.byteLength, usage: F.VERTEX | F.COPY_DST });
    device.queue.writeBuffer(vbuf, 0, quad);

    var uni = device.createBuffer({ size: 80, usage: F.UNIFORM | F.COPY_DST });
    var uData = new Float32Array(20);
    var bgl = device.createBindGroupLayout({
      entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }]
    });
    var pl = device.createPipelineLayout({ bindGroupLayouts: [bgl] });
    var bg = device.createBindGroup({ layout: bgl, entries: [{ binding: 0, resource: { buffer: uni } }] });

    var pipes = levels.map(function (lv) {
      var mod = ctx.createShaderModule(wgslFragment(lv), 'vsbm-' + lv.key);
      return ctx.createRenderPipeline({
        layout: pl,
        vertex: {
          module: mod, entryPoint: 'vs_main',
          buffers: [{
            arrayStride: 12,
            attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }]
          }]
        },
        fragment: { module: mod, entryPoint: 'fs_main', targets: [{ format: ctx.format }] },
        primitive: { topology: 'triangle-list' }
      });
    });

    return runLevels(ctx, levels, rp, function (li, t) {
      fillUniform(uData, t, levels[li], W / H);
      device.queue.writeBuffer(uni, 0, uData);
      var enc = device.createCommandEncoder();
      var p = enc.beginRenderPass({
        colorAttachments: [{
          view: ctx.targetView(), loadOp: 'clear', storeOp: 'store',
          clearValue: { r: 0.976, g: 0.969, b: 0.996, a: 1 }
        }]
      });
      p.setPipeline(pipes[li]);
      p.setBindGroup(0, bg);
      p.setVertexBuffer(0, vbuf);
      p.draw(6, 1, 0, 0);
      p.end();
      return enc.finish();
    });
  }

  /* ------------------------------ WebGL2 实现 ------------------------------ */

  function runWebGL2(ctx, levels, rp) {
    var gl = ctx.gl;

    var vao = gl.createVertexArray();
    var vbuf = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 0, 1, -1, 0, 1, 1, 0,
      -1, -1, 0, 1, 1, 0, -1, 1, 0
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
    gl.bindVertexArray(null);

    var progs = levels.map(function (lv) {
      var p = ctx.createProgram(GLSL_VERTEX, glslFragment(lv), 'vsbm-' + lv.key);
      gl.useProgram(p);
      var loc = {
        origin: gl.getUniformLocation(p, 'uOrigin'),
        right: gl.getUniformLocation(p, 'uRight'),
        up: gl.getUniformLocation(p, 'uUp'),
        forward: gl.getUniformLocation(p, 'uForward'),
        params: gl.getUniformLocation(p, 'uParams')
      };
      gl.useProgram(null);
      return { prog: p, loc: loc };
    });

    function locateUsed() {
      return progs[0];
    }

    return runLevels(ctx, levels, rp, function (li, t) {
      var c = cameraAt(t);
      var pr = progs[li];
      gl.useProgram(pr.prog);
      gl.uniform3f(pr.loc.origin, c.origin[0], c.origin[1], c.origin[2]);
      gl.uniform3f(pr.loc.right, c.right[0], c.right[1], c.right[2]);
      gl.uniform3f(pr.loc.up, c.up[0], c.up[1], c.up[2]);
      gl.uniform3f(pr.loc.forward, c.forward[0], c.forward[1], c.forward[2]);
      gl.uniform4f(pr.loc.params, 2.0, 2.0 / (ctx.width / ctx.height), c.len, levels[li].step);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, ctx.width, ctx.height);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.clearColor(0.976, 0.969, 0.996, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindVertexArray(null);
      return null;
    });
  }

  /* ------------------------------ 通用：三档依次跑 ------------------------------ */

  function runLevels(ctx, levels, rp, encode) {
    var perLevel = [];
    var allFrames = [];
    var totalMs = 0;
    var idx = 0;
    var depth = 2;

    function oneLevel() {
      if (idx >= levels.length) return Promise.resolve();
      var li = idx;
      var lv = levels[li];
      return new Promise(function (resolve, reject) {
        var frames = [];
        var start = U.now();
        var lastMark = start;
        var n = 0;
        var warmAcc = 0;
        function step() {
          if (rp && rp.isAborted && rp.isAborted()) { reject(new Error('用户中止')); return; }
          var elapsed = U.now() - start;
          if (elapsed >= lv.seconds * 1000 || n >= 400000) {
            return ctx.sync().then(function () {
              var tail = U.now() - lastMark;
              if (tail > 0) frames.push(tail / depth);
              var sum = 0;
              for (var i = 0; i < frames.length; i++) sum += frames[i];
              resolve({
                frames: frames,
                elapsed: U.now() - start,
                fps: sum > 0 ? (frames.length * 1000) / sum : 0
              });
            }).catch(reject);
          }
          try {
            var cb = encode(li, elapsed / 1000);
            if (cb) ctx.submit([cb]);
          } catch (e) { reject(e); return; }
          n++;
          if (n % depth === 0) {
            ctx.sync().then(function () {
              var t2 = U.now();
              var per = (t2 - lastMark) / depth;
              lastMark = t2;
              warmAcc += per * depth;
              if (warmAcc >= 700) frames.push(per);
              if (rp && rp.report) {
                try {
                  var inLv = Math.min(1, (t2 - start) / (lv.seconds * 1000));
                  rp.report('measuring', {
                    round: li + 1, rounds: levels.length,
                    progress: inLv,
                    overall: (li + inLv) / levels.length,
                    fps: per > 0 ? 1000 / per : 0,
                    frames: n
                  });
                } catch (e2) { /* noop */ }
              }
              step();
            }).catch(reject);
          } else step();
        }
        step();
      }).then(function (res) {
        perLevel.push({
          id: lv.key, name: '档 ' + lv.name,
          fps: res.fps, frames: res.frames, durationMs: res.elapsed,
          maxSteps: lv.maxSteps, step: lv.step, kernalPerPixel: kernalPerPixel(lv)
        });
        totalMs += res.elapsed;
        for (var i = 0; i < res.frames.length; i++) allFrames.push(res.frames[i]);
        if (rp && rp.report) {
          try { rp.report('round-done', { round: li + 1, rounds: levels.length, value: res.fps }); } catch (e) { /* noop */ }
        }
        idx++;
        return oneLevel();
      });
    }

    return oneLevel().then(function () {
      var sum = 0;
      for (var i = 0; i < allFrames.length; i++) sum += allFrames[i];
      var fpsAvg = sum > 0 ? (allFrames.length * 1000) / sum : 0;
      var sorted = allFrames.slice().sort(function (a, b) { return b - a; });
      var lowN = Math.max(1, Math.floor(sorted.length * 0.01));
      var lowSum = 0;
      for (var j = 0; j < lowN; j++) lowSum += sorted[j];
      var p99 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.01))] || 0;

      return {
        status: 'done',
        raw: fpsAvg,
        metric: fpsAvg,
        unit: 'FPS',
        rawFps: fpsAvg,
        samples: allFrames.map(function (ms) { return ms > 0 ? 1000 / ms : 0; }),
        cv: allFrames.length ? U.stats.cv(allFrames) : 0,
        valid: allFrames.length > 20,
        meta: {
          frames: allFrames.length,
          fpsAvg: fpsAvg,
          fps1Low: lowN > 0 ? 1000 / (lowSum / lowN) : 0,
          fps01Low: 0,
          p99FrameMs: p99,
          medianFrameMs: sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0,
          jitter: 0,
          smoothness: 0,
          frameTimes: [],
          levels: perLevel,
          levelCount: levels.length,
          kernalPerPixel: levels.map(kernalPerPixel),
          originalKernalPerPixel: 220,
          totalDurationMs: totalMs,
          renderWidth: ctx.width,
          renderHeight: ctx.height,
          renderPixels: ctx.width * ctx.height,
          warmupMs: 700,
          pipelineDepth: depth,
          source: 'cznull / volumeshader_bm（volumeshader.html）',
          scoreBasis: '三档共用同一算法与相机路径，只有步数/步长/迭代数不同；档内可跨设备对比'
        }
      };
    });
  }

  Nova.makeVsbmTest = function (ctx, opts) {
    return makeTest(ctx, opts);
  };

  Nova.vsbmInfo = function () {
    return {
      levels: LEVELS.map(function (l) {
        return { key: l.key, name: l.name, maxSteps: l.maxSteps, step: l.step, kernalPerPixel: kernalPerPixel(l) };
      }),
      original: { maxSteps: 200, solve: 8, golden: 8, kernalPerPixel: 220 }
    };
  };

})(window);
