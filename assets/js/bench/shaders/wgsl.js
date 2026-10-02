/* ============================================================================
 * NovaMark · WGSL 着色器库（WebGPU 后端）
 * 每个测试用到的着色器都集中在这里，便于审阅与优化。
 * ==========================================================================*/
(function (global) {
  'use strict';

  var Nova = global.Nova = global.Nova || {};

  /* ---------------------- 通用：全屏三角形 ---------------------- */
  var FULLSCREEN_VS = `
@vertex
fn vs_main(@builtin(vertex_index) vi: u32) -> @builtin(position) vec4<f32> {
  var p = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 3.0, -1.0),
    vec2<f32>(-1.0,  3.0));
  return vec4<f32>(p[vi], 0.0, 1.0);
}`;

  /* ---------------------- 1. 填充率 / ROP ---------------------- */
  var FILL = `
struct Params {
  u : vec4<u32>,   // [layers, seed, width, height]
  f : vec4<f32>,   // [alpha, time, 0, 0]
};
@group(0) @binding(0) var<uniform> P : Params;

${FULLSCREEN_VS}

@fragment
fn fs_main(@builtin(position) fc: vec4<f32>) -> @location(0) vec4<f32> {
  let uv = fc.xy / vec2<f32>(f32(P.u.z), f32(P.u.w));
  // 轻量渐变 + 抖动，避免被驱动优化成常量填充
  let g = uv.x * 0.55 + uv.y * 0.45;
  let d = f32((u32(fc.x) ^ u32(fc.y)) & 7u) * 0.0035;
  return vec4<f32>(g + d, 1.0 - g * 0.6, 0.35 + g * 0.4, P.f.x);
}`;

  /* ---------------------- 2. 几何吞吐 ---------------------- */
  var GEOMETRY = `
struct Params {
  u : vec4<u32>,   // [instances, seed, width, height]
  f : vec4<f32>,   // [time, triSize, 0, 0]
};
@group(0) @binding(0) var<uniform> P : Params;

fn hash11(p: f32) -> f32 {
  var x = fract(p * 0.1031);
  x = x * (x + 33.33);
  x = x * (x + x);
  return fract(x);
}

@vertex
fn vs_main(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> @builtin(position) vec4<f32> {
  let W = f32(P.u.z);
  let H = f32(P.u.w);
  let total = f32(P.u.x);
  let rnd = hash11(f32(ii) * 0.719 + 0.37);
  let rnd2 = hash11(f32(ii) * 1.913 + 7.13);

  // 铺成接近正方的网格
  let cols = ceil(sqrt(total));
  let cx = f32(ii % u32(cols));
  let cy = floor(f32(ii) / cols);
  let cell = min(W, H) / cols;

  let px = (cx + 0.5 + (rnd - 0.5) * 0.6) * cell;
  let py = (cy + 0.5 + (rnd2 - 0.5) * 0.6) * cell;

  let size = P.f.y * (0.7 + rnd * 0.6);
  // 顶点着色器里加一点三角函数运算，兼顾顶点 ALU 吞吐
  let ang = P.f.x * (1.2 + rnd * 2.0) + f32(vi) * 2.0943951;
  let ca = cos(ang); let sa = sin(ang);

  var local = vec2<f32>(0.0, 0.0);
  if (vi == 1u) { local = vec2<f32>(size, 0.0); }
  else if (vi == 2u) { local = vec2<f32>(size * 0.5, size * 0.866); }
  local = vec2<f32>(local.x * ca - local.y * sa, local.x * sa + local.y * ca);

  let ndc = vec2<f32>(px / W * 2.0 - 1.0, 1.0 - py / H * 2.0);
  let off = vec2<f32>(local.x / W * 2.0, -local.y / H * 2.0);
  return vec4<f32>(ndc + off, 0.0, 1.0);
}

@fragment
fn fs_main() -> @location(0) vec4<f32> {
  return vec4<f32>(0.25, 0.85, 0.95, 0.55);
}`;

  /* ---------------------- 3. 纹理采样 ---------------------- */
  var TEXTURE = `
struct Params {
  u : vec4<u32>,   // [taps, seed, width, height]
  f : vec4<f32>,   // [time, texSize, 0, 0]
};
@group(0) @binding(0) var<uniform> P : Params;
@group(0) @binding(1) var samp : sampler;
@group(0) @binding(2) var tex : texture_2d<f32>;

${FULLSCREEN_VS}

@fragment
fn fs_main(@builtin(position) fc: vec4<f32>) -> @location(0) vec4<f32> {
  let W = f32(P.u.z);
  let H = f32(P.u.w);
  let base = fc.xy / vec2<f32>(W, H) + vec2<f32>(P.f.x * 0.013, P.f.x * 0.021);
  let texel = 1.0 / max(P.f.y, 1.0);
  // 关键：每 tap 只做一次旋转（常量 cos/sin）+ 一次乘加，绝不在循环里算三角函数。
  // 偏移控制在几个 texel 内，让采样落在纹理缓存与双线性过滤单元上，
  // 这样测到的才是「采样单元吞吐」，而不是被 ALU 或显存延迟拖住。
  let rot = vec2<f32>(0.9335804, 0.3583679);
  var dir = vec2<f32>(1.0, 0.0);
  var acc = vec4<f32>(0.0);
  let taps = i32(P.u.x);
  for (var i = 0; i < taps; i = i + 1) {
    acc = acc + textureSampleLevel(tex, samp, base + dir * (texel * 1.75), 0.0);
    dir = vec2<f32>(dir.x * rot.x - dir.y * rot.y, dir.x * rot.y + dir.y * rot.x);
  }
  return acc * (1.0 / f32(taps));
}`;

  /* ---------------------- 4. 复杂着色器（Mandelbulb 体积光线步进） ----------------------
   * 致敬「毒蘑菇」Volume Shader BM：同类的 Mandelbulb 距离场光线步进，
   * ALU 密度极高（每步 8 次幂/三角函数迭代），是纯算力型负载的标杆。          */
  var SHADER = `
struct Params {
  u : vec4<u32>,   // [steps, seed, width, height]
  f : vec4<f32>,   // [time, power, zoom, 0]
};
@group(0) @binding(0) var<uniform> P : Params;

${FULLSCREEN_VS}

/* Mandelbulb 距离估计器 */
fn mandelbulb(pos: vec3<f32>, power: f32) -> f32 {
  var z = pos;
  var dr = 1.0;
  var r = 0.0;
  for (var i = 0; i < 8; i = i + 1) {
    r = length(z);
    if (r > 2.0) { break; }
    let rr = max(r, 1e-6);
    let theta = acos(clamp(z.z / rr, -1.0, 1.0));
    let phi = atan2(z.y, z.x);
    dr = pow(rr, power - 1.0) * power * dr + 1.0;
    let zr = pow(rr, power);
    let st = sin(theta * power);
    let ct = cos(theta * power);
    z = zr * vec3<f32>(st * cos(phi * power), st * sin(phi * power), ct) + pos;
  }
  return 0.5 * log(max(r, 1e-6)) * r / dr;
}

fn sceneDE(p: vec3<f32>, power: f32, zoom: f32) -> f32 {
  return mandelbulb(p * zoom, power) / zoom;
}

@fragment
fn fs_main(@builtin(position) fc: vec4<f32>) -> @location(0) vec4<f32> {
  let res = vec2<f32>(f32(P.u.z), f32(P.u.w));
  let uv = (fc.xy * 2.0 - res) / res.y;
  let ang = P.f.x * 0.35;
  let ro = vec3<f32>(sin(ang) * 1.15, 0.22, -cos(ang) * 1.15);
  let fwd = normalize(-ro);
  let right = normalize(cross(vec3<f32>(0.0, 1.0, 0.0), fwd));
  let up = cross(fwd, right);
  let rd = normalize(fwd * 1.5 + right * uv.x + up * uv.y);

  var t = 0.0;
  var hit = false;
  let steps = i32(P.u.x);
  for (var i = 0; i < steps; i = i + 1) {
    let p = ro + rd * t;
    let d = sceneDE(p, P.f.y, P.f.z);
    if (d < 0.00035 * t) { hit = true; break; }
    t = t + d * 0.9;
    if (t > 5.0) { break; }
  }

  var col = vec3<f32>(0.02, 0.035, 0.07);
  if (hit) {
    let p = ro + rd * t;
    let e = vec2<f32>(0.0012, 0.0);
    let nx = sceneDE(p + e.xyy, P.f.y, P.f.z) - sceneDE(p - e.xyy, P.f.y, P.f.z);
    let ny = sceneDE(p + e.yxy, P.f.y, P.f.z) - sceneDE(p - e.yxy, P.f.y, P.f.z);
    let nz = sceneDE(p + e.yyx, P.f.y, P.f.z) - sceneDE(p - e.yyx, P.f.y, P.f.z);
    let n = normalize(vec3<f32>(nx, ny, nz));
    let l1 = normalize(vec3<f32>(1.4, 0.9, -0.6));
    let l2 = normalize(vec3<f32>(-0.8, 0.4, 0.7));
    let ao = 1.0;
    let d1 = max(dot(n, l1), 0.0);
    let d2 = max(dot(n, l2), 0.0);
    let rim = pow(1.0 - max(dot(n, -rd), 0.0), 3.5);
    let shadow = clamp(1.0 - t / 5.5, 0.0, 1.0);
    col = vec3<f32>(0.05, 0.07, 0.11) * ao
        + vec3<f32>(0.16, 0.86, 1.0) * d1 * 1.05 * shadow
        + vec3<f32>(0.86, 0.34, 0.96) * d2 * 0.75
        + vec3<f32>(0.45, 0.92, 1.0) * rim * 0.9;
  }
  col = col / (col + vec3<f32>(1.0));
  return vec4<f32>(pow(col, vec3<f32>(0.4545)), 1.0);
}`;

  /* ---------------------- 5. FP32 GEMM（分块，4x4 寄存器） ---------------------- */
  var GEMM_F32 = `
struct Params {
  u : vec4<u32>,   // [N, reps, seed, 0]
  f : vec4<f32>,   // [scale, 0, 0, 0]
};
@group(0) @binding(0) var<uniform> P : Params;
@group(0) @binding(1) var<storage, read> A : array<f32>;
@group(0) @binding(2) var<storage, read> B : array<f32>;
@group(0) @binding(3) var<storage, read_write> C : array<f32>;

var<workgroup> tileA : array<f32, 1024>;   // 64 x 16
var<workgroup> tileB : array<f32, 1024>;   // 64(列) x 16(k)，转置存储

@compute @workgroup_size(16, 16, 1)
fn main(@builtin(workgroup_id) wid: vec3<u32>,
        @builtin(local_invocation_id) lid: vec3<u32>) {
  let N = P.u.x;
  let rowBase = wid.y * 64u;
  let colBase = wid.x * 64u;

  // 4 个 vec4 累加器 = 4 列组 × 4 行组。
  // 刻意不用 array<f32,16>：动态下标的局部数组在多数后端会被放进 local memory
  // （即显存），实测只有理论算力的约 10%；写成 vec4 才能确保落在寄存器里。
  var acc0 = vec4<f32>(0.0);
  var acc1 = vec4<f32>(0.0);
  var acc2 = vec4<f32>(0.0);
  var acc3 = vec4<f32>(0.0);

  let nTiles = (N + 15u) / 16u;
  for (var t = 0u; t < nTiles; t = t + 1u) {
    let kBase = t * 16u;

    for (var r = 0u; r < 4u; r = r + 1u) {
      let gr = rowBase + r * 16u + lid.y;
      let gc = kBase + lid.x;
      var v = 0.0;
      if (gr < N && gc < N) { v = A[gr * N + gc]; }
      tileA[(r * 16u + lid.y) * 16u + lid.x] = v;
    }
    for (var c = 0u; c < 4u; c = c + 1u) {
      let gr = kBase + lid.y;
      let gc = colBase + c * 16u + lid.x;
      var v = 0.0;
      if (gr < N && gc < N) { v = B[gr * N + gc]; }
      tileB[(c * 16u + lid.x) * 16u + lid.y] = v;
    }
    workgroupBarrier();

    for (var k = 0u; k < 16u; k = k + 1u) {
      let aReg = vec4<f32>(
        tileA[(0u * 16u + lid.y) * 16u + k],
        tileA[(1u * 16u + lid.y) * 16u + k],
        tileA[(2u * 16u + lid.y) * 16u + k],
        tileA[(3u * 16u + lid.y) * 16u + k]);
      acc0 = acc0 + aReg * tileB[(0u * 16u + lid.x) * 16u + k];
      acc1 = acc1 + aReg * tileB[(1u * 16u + lid.x) * 16u + k];
      acc2 = acc2 + aReg * tileB[(2u * 16u + lid.x) * 16u + k];
      acc3 = acc3 + aReg * tileB[(3u * 16u + lid.x) * 16u + k];
    }
    workgroupBarrier();
  }

  // accI 的 x/y/z/w 分量对应行组 0/1/2/3，I 对应列组
  let r0 = rowBase + lid.y;
  let r1 = rowBase + 16u + lid.y;
  let r2 = rowBase + 32u + lid.y;
  let r3 = rowBase + 48u + lid.y;
  let c0 = colBase + lid.x;
  let c1 = colBase + 16u + lid.x;
  let c2 = colBase + 32u + lid.x;
  let c3 = colBase + 48u + lid.x;

  if (c0 < N) {
    if (r0 < N) { C[r0 * N + c0] = acc0.x; }
    if (r1 < N) { C[r1 * N + c0] = acc0.y; }
    if (r2 < N) { C[r2 * N + c0] = acc0.z; }
    if (r3 < N) { C[r3 * N + c0] = acc0.w; }
  }
  if (c1 < N) {
    if (r0 < N) { C[r0 * N + c1] = acc1.x; }
    if (r1 < N) { C[r1 * N + c1] = acc1.y; }
    if (r2 < N) { C[r2 * N + c1] = acc1.z; }
    if (r3 < N) { C[r3 * N + c1] = acc1.w; }
  }
  if (c2 < N) {
    if (r0 < N) { C[r0 * N + c2] = acc2.x; }
    if (r1 < N) { C[r1 * N + c2] = acc2.y; }
    if (r2 < N) { C[r2 * N + c2] = acc2.z; }
    if (r3 < N) { C[r3 * N + c2] = acc2.w; }
  }
  if (c3 < N) {
    if (r0 < N) { C[r0 * N + c3] = acc3.x; }
    if (r1 < N) { C[r1 * N + c3] = acc3.y; }
    if (r2 < N) { C[r2 * N + c3] = acc3.z; }
    if (r3 < N) { C[r3 * N + c3] = acc3.w; }
  }
}`;

  /* ---------------------- 5b. FP16 混合精度 GEMM ---------------------- */
  var GEMM_F16 = `enable f16;
struct Params {
  u : vec4<u32>,   // [N, reps, seed, 0]
  f : vec4<f32>,   // [scale, 0, 0, 0]
};
@group(0) @binding(0) var<uniform> P : Params;
@group(0) @binding(1) var<storage, read> A : array<f16>;
@group(0) @binding(2) var<storage, read> B : array<f16>;
@group(0) @binding(3) var<storage, read_write> C : array<f32>;

var<workgroup> tileA : array<f16, 1024>;
var<workgroup> tileB : array<f16, 1024>;

@compute @workgroup_size(16, 16, 1)
fn main(@builtin(workgroup_id) wid: vec3<u32>,
        @builtin(local_invocation_id) lid: vec3<u32>) {
  let N = P.u.x;
  let rowBase = wid.y * 64u;
  let colBase = wid.x * 64u;

  // 同 FP32 版：用 vec4 累加器确保落在寄存器，而不是动态下标的局部数组
  var acc0 = vec4<f32>(0.0);
  var acc1 = vec4<f32>(0.0);
  var acc2 = vec4<f32>(0.0);
  var acc3 = vec4<f32>(0.0);

  let nTiles = (N + 15u) / 16u;
  for (var t = 0u; t < nTiles; t = t + 1u) {
    let kBase = t * 16u;
    for (var r = 0u; r < 4u; r = r + 1u) {
      let gr = rowBase + r * 16u + lid.y;
      let gc = kBase + lid.x;
      var v = f16(0.0);
      if (gr < N && gc < N) { v = A[gr * N + gc]; }
      tileA[(r * 16u + lid.y) * 16u + lid.x] = v;
    }
    for (var c = 0u; c < 4u; c = c + 1u) {
      let gr = kBase + lid.y;
      let gc = colBase + c * 16u + lid.x;
      var v = f16(0.0);
      if (gr < N && gc < N) { v = B[gr * N + gc]; }
      tileB[(c * 16u + lid.x) * 16u + lid.y] = v;
    }
    workgroupBarrier();
    for (var k = 0u; k < 16u; k = k + 1u) {
      let aReg = vec4<f32>(
        f32(tileA[(0u * 16u + lid.y) * 16u + k]),
        f32(tileA[(1u * 16u + lid.y) * 16u + k]),
        f32(tileA[(2u * 16u + lid.y) * 16u + k]),
        f32(tileA[(3u * 16u + lid.y) * 16u + k]));
      acc0 = acc0 + aReg * f32(tileB[(0u * 16u + lid.x) * 16u + k]);
      acc1 = acc1 + aReg * f32(tileB[(1u * 16u + lid.x) * 16u + k]);
      acc2 = acc2 + aReg * f32(tileB[(2u * 16u + lid.x) * 16u + k]);
      acc3 = acc3 + aReg * f32(tileB[(3u * 16u + lid.x) * 16u + k]);
    }
    workgroupBarrier();
  }

  let r0 = rowBase + lid.y;
  let r1 = rowBase + 16u + lid.y;
  let r2 = rowBase + 32u + lid.y;
  let r3 = rowBase + 48u + lid.y;
  let c0 = colBase + lid.x;
  let c1 = colBase + 16u + lid.x;
  let c2 = colBase + 32u + lid.x;
  let c3 = colBase + 48u + lid.x;

  if (c0 < N) {
    if (r0 < N) { C[r0 * N + c0] = acc0.x; }
    if (r1 < N) { C[r1 * N + c0] = acc0.y; }
    if (r2 < N) { C[r2 * N + c0] = acc0.z; }
    if (r3 < N) { C[r3 * N + c0] = acc0.w; }
  }
  if (c1 < N) {
    if (r0 < N) { C[r0 * N + c1] = acc1.x; }
    if (r1 < N) { C[r1 * N + c1] = acc1.y; }
    if (r2 < N) { C[r2 * N + c1] = acc1.z; }
    if (r3 < N) { C[r3 * N + c1] = acc1.w; }
  }
  if (c2 < N) {
    if (r0 < N) { C[r0 * N + c2] = acc2.x; }
    if (r1 < N) { C[r1 * N + c2] = acc2.y; }
    if (r2 < N) { C[r2 * N + c2] = acc2.z; }
    if (r3 < N) { C[r3 * N + c2] = acc2.w; }
  }
  if (c3 < N) {
    if (r0 < N) { C[r0 * N + c3] = acc3.x; }
    if (r1 < N) { C[r1 * N + c3] = acc3.y; }
    if (r2 < N) { C[r2 * N + c3] = acc3.z; }
    if (r3 < N) { C[r3 * N + c3] = acc3.w; }
  }
}`;

  /* ---------------------- 6. INT32 + 原子吞吐 ---------------------- */
  var INT_OPS = `
struct Params {
  u : vec4<u32>,   // [N, reps, seed, mode]
  f : vec4<f32>,   // [0,0,0,0]
};
@group(0) @binding(0) var<uniform> P : Params;
@group(0) @binding(1) var<storage, read> A : array<u32>;
@group(0) @binding(2) var<storage, read> B : array<u32>;
@group(0) @binding(3) var<storage, read_write> C : array<u32>;
@group(0) @binding(4) var<storage, read_write> Counter : array<atomic<u32>>;

var<workgroup> sharedCount : atomic<u32>;

@compute @workgroup_size(256, 1, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>,
        @builtin(local_invocation_id) lid: vec3<u32>) {
  let N = P.u.x;
  let i = gid.x;

  var acc : u32 = 0u;
  // 注意：这里**不能**写成 if (i >= N) { return; }，否则后面的 workgroupBarrier()
  // 会落在非一致性控制流里，WGSL 直接校验失败、整个命令缓冲被拒。
  if (i < N) {
    var a2 : u32 = A[i] ^ 0x9E3779B9u;
    var b2 : u32 = B[i] | 1u;
    for (var r = 0u; r < 32u; r = r + 1u) {
      a2 = (a2 * b2) ^ (a2 >> 7u);
      a2 = a2 + (b2 * 2654435761u);
      b2 = (b2 << 3u) | (b2 >> 29u);
    }
    C[i] = a2;
    acc = a2;
    atomicAdd(&sharedCount, a2 & 1u);
  }

  workgroupBarrier();
  if (lid.x == 0u) {
    atomicAdd(&Counter[0], atomicLoad(&sharedCount));
  }
}`;

  /* ---------------------- 6b. 纯 ALU（FMA 吞吐，计算着色器版） ---------------------- */
  var ALU_F32 = `
struct Params {
  u : vec4<u32>,   // [threads, iters, seed, 0]
  f : vec4<f32>,   // [0,0,0,0]
};
@group(0) @binding(0) var<uniform> P : Params;
@group(0) @binding(1) var<storage, read_write> Dst : array<f32>;

@compute @workgroup_size(256, 1, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let iters = P.u.y;
  var a = vec4<f32>(f32(gid.x & 1023u) * 1e-6, 0.31, 0.72, 1.0);
  var b = vec4<f32>(1.00013, 0.99987, 1.00021, 0.99979);
  var c = vec4<f32>(0.0);
  var d = vec4<f32>(0.00011, 0.00013, 0.00017, 0.00019);

  // 每轮 24 FLOP（vec4 四通道各 6 次运算）：
  //   c = c*0.99991 + a*b  -> 12 FLOP
  //   a = a + c*d          ->  8 FLOP
  //   a = fract(a)         ->  4 FLOP
  //
  // fract 用于破坏递推的闭式解：上面两式是常系数线性系统，理论上可被整体
  // 折叠掉。这里虽然 iters 是运行时 uniform、编译器本来就不好展开，但为了让
  // 两个后端的着色器**抗优化能力一致**（可比性的前提），两边都加同一个非线性项。
  for (var i = 0u; i < iters; i = i + 1u) {
    c = c * 0.99991 + a * b;
    a = a + c * d;
    a = fract(a);
  }

  // 无条件写回一小段结果，确保循环不会被整个优化掉
  Dst[gid.x & 255u] = c.x + c.y + c.z + c.w;
}`;

  /* ---------------------- 7. 显存带宽（拷贝） ---------------------- */
  var BANDWIDTH = `
struct Params {
  u : vec4<u32>,   // [count(元素数,vec4), gridStride, seed, 0]
  f : vec4<f32>,   // [scale, 0, 0, 0]
};
@group(0) @binding(0) var<uniform> P : Params;
@group(0) @binding(1) var<storage, read> Src : array<vec4<f32>>;
@group(0) @binding(2) var<storage, read_write> Dst : array<vec4<f32>>;

@compute @workgroup_size(256, 1, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let count = P.u.x;
  let stride = P.u.y;
  let s = P.f.x;
  let i = gid.x;
  // 每线程沿网格步长处理 4 个 vec4，凑够访存并行度
  for (var r = 0u; r < 4u; r = r + 1u) {
    let idx = i + r * stride;
    if (idx < count) {
      Dst[idx] = Src[idx] * s;
    }
  }
}`;

  /* ---------------------- 8. 延迟 / 提交吞吐（空计算） ---------------------- */
  var TRIVIAL = `
struct Params {
  u : vec4<u32>,   // [count, seed, 0, 0]
  f : vec4<f32>,   // [0,0,0,0]
};
@group(0) @binding(0) var<uniform> P : Params;
@group(0) @binding(1) var<storage, read_write> Dst : array<u32>;

@compute @workgroup_size(64, 1, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x == 0u) {
    Dst[0] = Dst[0] + 1u + P.u.y;
  }
}`;

  /* ---------------------- 9. 综合场景 ---------------------- */
  var SCENE_COMMON = `
struct SceneU {
  viewProj  : mat4x4<f32>,
  camPos    : vec4<f32>,
  lightPos  : array<vec4<f32>, 4>,
  lightCol  : array<vec4<f32>, 4>,
  params    : vec4<f32>,   // [time, count, exposure, fogDensity]
};
`;

  var SCENE_MESH = `
${SCENE_COMMON}
@group(0) @binding(0) var<uniform> S : SceneU;

struct VSOut {
  @builtin(position) pos : vec4<f32>,
  @location(0) nrm : vec3<f32>,
  @location(1) wpos : vec3<f32>,
  @location(2) tint : vec3<f32>,
};

fn hash11(p: f32) -> f32 {
  var x = fract(p * 0.1031);
  x = x * (x + 33.33);
  x = x * (x + x);
  return fract(x);
}

fn rotY(a: f32) -> mat3x3<f32> {
  let c = cos(a); let s = sin(a);
  return mat3x3<f32>(vec3<f32>(c, 0.0, -s), vec3<f32>(0.0, 1.0, 0.0), vec3<f32>(s, 0.0, c));
}
fn rotX(a: f32) -> mat3x3<f32> {
  let c = cos(a); let s = sin(a);
  return mat3x3<f32>(vec3<f32>(1.0, 0.0, 0.0), vec3<f32>(0.0, c, s), vec3<f32>(0.0, -s, c));
}

@vertex
fn vs_main(@location(0) pos: vec3<f32>, @location(1) nrm: vec3<f32>,
           @builtin(instance_index) ii: u32) -> VSOut {
  let total = S.params.y;
  let fii = f32(ii);
  let a = hash11(fii * 0.7311 + 0.17);
  let b = hash11(fii * 1.3177 + 3.71);
  let c = hash11(fii * 2.1139 + 9.23);

  // 环形分布 + 三层高度，形成有纵深的星环场景
  let ring = floor(hash11(fii * 0.311 + 4.4) * 3.0);
  let radius = 2.4 + ring * 2.1 + a * 2.2;
  let angle = fii * 2.3999632 + S.params.x * (0.12 + ring * 0.05);
  let height = (b - 0.5) * 3.4 + sin(fii * 0.31 + S.params.x * 0.8) * 0.35;

  let scale = 0.13 + c * c * 0.24;
  let rot = rotY(angle * 1.7 + S.params.x * 0.35) * rotX(b * 6.28 + S.params.x * 0.22);

  let world = vec3<f32>(cos(angle) * radius, height, sin(angle) * radius);
  let lp = rot * (pos * scale);

  var o : VSOut;
  o.pos = S.viewProj * vec4<f32>(world + lp, 1.0);
  o.nrm = rot * nrm;
  o.wpos = world + lp;
  // 按高度与随机值上色，形成冷暖对比
  let t = clamp((height + 1.7) / 3.4, 0.0, 1.0);
  o.tint = mix(vec3<f32>(0.15, 0.72, 0.98), vec3<f32>(0.85, 0.32, 0.86), t) * (0.7 + c * 0.6);
  return o;
}

@fragment
fn fs_main(in: VSOut) -> @location(0) vec4<f32> {
  let n = normalize(in.nrm);
  let v = normalize(S.camPos.xyz - in.wpos);
  var col = vec3<f32>(0.02, 0.025, 0.045);

  for (var i = 0; i < 4; i = i + 1) {
    let lp = S.lightPos[i].xyz;
    let lc = S.lightCol[i].rgb;
    let d = lp - in.wpos;
    let dist = length(d);
    let l = d / max(dist, 0.0001);
    let atten = 1.0 / (1.0 + dist * dist * 0.14);
    let ndl = max(dot(n, l), 0.0);
    let h = normalize(l + v);
    let spec = pow(max(dot(n, h), 0.0), 48.0);
    col = col + in.tint * lc * ndl * atten * 1.5 + lc * spec * atten * 0.7;
  }

  // 边缘补光 + 菲涅尔
  let fres = pow(1.0 - max(dot(n, v), 0.0), 4.0);
  col = col + vec3<f32>(0.12, 0.45, 0.85) * fres * 0.55;

  // 雾
  let fd = length(S.camPos.xyz - in.wpos) * S.params.w;
  let fog = clamp(1.0 - exp(-fd * fd * 0.02), 0.0, 0.92);
  col = mix(col, vec3<f32>(0.02, 0.04, 0.09), fog);

  col = vec3<f32>(1.0) - exp(-col * S.params.z);
  return vec4<f32>(pow(max(col, vec3<f32>(0.0)), vec3<f32>(0.4545)), 1.0);
}`;

  var SCENE_BG = `
${SCENE_COMMON}
@group(0) @binding(0) var<uniform> S : SceneU;

struct VSOut {
  @builtin(position) pos : vec4<f32>,
  @location(0) uv : vec2<f32>,
};

@vertex
fn vs_bg(@builtin(vertex_index) vi: u32) -> VSOut {
  var p = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0));
  var o : VSOut;
  o.pos = vec4<f32>(p[vi], 0.0, 1.0);
  o.uv = p[vi] * 0.5 + vec2<f32>(0.5, 0.5);
  return o;
}

fn hash21(p: vec2<f32>) -> f32 {
  var q = fract(p * vec2<f32>(123.34, 456.21));
  q = q + dot(q, q + 45.32);
  return fract(q.x * q.y);
}

@fragment
fn fs_bg(in: VSOut) -> @location(0) vec4<f32> {
  let uv = in.uv;
  let d = length(uv - vec2<f32>(0.5, 0.55));
  var col = mix(vec3<f32>(0.035, 0.055, 0.11), vec3<f32>(0.01, 0.012, 0.03), smoothstep(0.1, 0.85, d));
  // 星点
  let g = uv * 260.0;
  let cell = floor(g);
  let rnd = hash21(cell);
  let star = smoothstep(0.9955, 1.0, rnd) * smoothstep(0.9, 0.0, length(fract(g) - vec2<f32>(0.5)));
  col = col + vec3<f32>(0.7, 0.85, 1.0) * star * 1.6;
  // 极光带
  let band = sin(uv.x * 6.0 + S.params.x * 0.35) * 0.5 + 0.5;
  col = col + vec3<f32>(0.05, 0.35, 0.45) * band * smoothstep(0.9, 0.2, uv.y) * 0.35;
  return vec4<f32>(col, 1.0);
}`;

  /* ---------------------- 10. 可视化（把计算结果画出来） ---------------------- */
  var VISUALIZE = `
struct Params {
  u : vec4<u32>,   // [width, height, mode, seed]
  f : vec4<f32>,   // [time, gain, 0, 0]
};
@group(0) @binding(0) var<uniform> P : Params;
@group(0) @binding(1) var<storage, read> Data : array<f32>;

${FULLSCREEN_VS}

@fragment
fn fs_main(@builtin(position) fc: vec4<f32>) -> @location(0) vec4<f32> {
  let res = vec2<f32>(f32(P.u.x), f32(P.u.y));
  let uv = fc.xy / res;
  let mode = P.u.z;

  if (mode == 0u) {
    // 结果矩阵热力图：抽样读取，避免带宽成为瓶颈
    let g = floor(uv * 96.0);
    let n = f32(P.u.w);
    var v = 0.0;
    for (var i = 0u; i < 64u; i = i + 1u) {
      let idx = u32((g.x * 971.0 + g.y * 1237.0 + f32(i) * 7.0)) % u32(n);
      v = v + abs(Data[idx * 37u % u32(n)]);
    }
    v = v / 64.0;
    let h = fract(v * P.f.y);
    let col = vec3<f32>(
      clamp(abs(h * 6.0 - 3.0) - 1.0, 0.0, 1.0),
      clamp(2.0 - abs(h * 6.0 - 2.0), 0.0, 1.0),
      clamp(2.0 - abs(h * 6.0 - 4.0), 0.0, 1.0));
    return vec4<f32>(col * (0.55 + 0.45 * sin(P.f.x * 0.6 + uv.y * 8.0)), 1.0);
  }

  // 模式 1：波形
  let x = uv.x * 6.2831853;
  var acc = 0.0;
  let n2 = f32(P.u.w);
  for (var i = 0u; i < 24u; i = i + 1u) {
    let idx = u32(f32(i) * n2 / 24.0);
    acc = acc + sin(x * (1.0 + f32(i) * 0.35) + Data[idx] * 0.02 + P.f.x);
  }
  let y = acc / 24.0;
  let band = smoothstep(0.02, 0.0, abs(uv.y - (0.5 + y * 0.22)));
  let col2 = vec3<f32>(0.15, 0.9, 1.0) * band + vec3<f32>(0.02, 0.04, 0.09);
  return vec4<f32>(col2, 1.0);
}`;

  Nova.shadersWGSL = {
    FULLSCREEN_VS: FULLSCREEN_VS,
    FILL: FILL,
    GEOMETRY: GEOMETRY,
    TEXTURE: TEXTURE,
    SHADER: SHADER,
    GEMM_F32: GEMM_F32,
    GEMM_F16: GEMM_F16,
    INT_OPS: INT_OPS,
    ALU_F32: ALU_F32,
    ALU: ALU_F32,
    BANDWIDTH: BANDWIDTH,
    TRIVIAL: TRIVIAL,
    SCENE_MESH: SCENE_MESH,
    SCENE_BG: SCENE_BG,
    VISUALIZE: VISUALIZE
  };

})(window);
