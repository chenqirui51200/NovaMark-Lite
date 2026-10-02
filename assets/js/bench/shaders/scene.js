/* ============================================================================
 * NovaMark · 综合场景着色器（WGSL）
 *
 * 渲染管线（8 个 pass，对标 3DMark 这类场景测试的构成）：
 *   1) 阴影 pass      —— 平行光视角渲染地形与岩石到 2048² 深度图
 *   2) 背景 pass      —— 全屏程序化星云（5 阶 fbm）+ 星空 + 太阳光晕
 *   3) 主体 pass      —— PBR(Cook-Torrance/GGX) + 5 光源 + 阴影 PCF + 程序化法线细节 + 高度雾
 *   4) 粒子 pass      —— 2 万+ 实例化广告牌，加法混合，制造大量 overdraw
 *   5) 亮度提取 pass  —— 半分辨率阈值提取
 *   6) 模糊 H pass    —— 四分之一分辨率高斯横向
 *   7) 模糊 V pass    —— 四分之一分辨率高斯纵向
 *   8) 合成 pass      —— bloom 叠加 + ACES 色调映射 + 暗角 + 色散 + 颗粒
 *
 * uniform 布局（96 个 float / 384 字节，全部 16 字节对齐）：
 *   0   mat4 viewProj        主相机
 *   16  mat4 lightViewProj   阴影相机
 *   32  vec4 camPos
 *   36  vec4 camRight
 *   40  vec4 camUp
 *   44  vec4 camFwd
 *   48  vec4[4] lightPos
 *   64  vec4[4] lightCol
 *   80  vec4 sunDir          xyz=方向 w=强度
 *   84  vec4 params          [time, rockCount, exposure, fogDensity]
 *   88  vec4 params2         [particleCount, bloomStrength, terrainSize, shadowTexel]
 *   92  vec4 resolution      [w, h, 0, 0]
 * ==========================================================================*/
(function (global) {
  'use strict';

  var Nova = global.Nova = global.Nova || {};
  var S = Nova.sceneShaders = Nova.sceneShaders || {};

  /* ------------------------------ 公共部分 ------------------------------ */

  var COMMON = `
struct SceneU {
  viewProj      : mat4x4<f32>,
  lightViewProj : mat4x4<f32>,
  camPos        : vec4<f32>,
  camRight      : vec4<f32>,
  camUp         : vec4<f32>,
  camFwd        : vec4<f32>,
  lightPos      : array<vec4<f32>, 4>,
  lightCol      : array<vec4<f32>, 4>,
  sunDir        : vec4<f32>,
  params        : vec4<f32>,
  params2       : vec4<f32>,
  resolution    : vec4<f32>,
};

fn hash11(p: f32) -> f32 {
  var x = fract(p * 0.1031);
  x = x * (x + 33.33);
  x = x * (x + x);
  return fract(x);
}

fn hash21(p: vec2<f32>) -> f32 {
  var q = fract(p * vec2<f32>(123.34, 456.21));
  q = q + dot(q, q + 45.32);
  return fract(q.x * q.y);
}

fn hash31(p: vec3<f32>) -> f32 {
  var q = fract(p * vec3<f32>(0.1031, 0.1030, 0.0973));
  q = q + dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

/* 二维值噪声 */
fn vnoise(p: vec2<f32>) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = hash21(i);
  let b = hash21(i + vec2<f32>(1.0, 0.0));
  let c = hash21(i + vec2<f32>(0.0, 1.0));
  let d = hash21(i + vec2<f32>(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

/* 五阶 fbm：地形与星云共用 */
fn fbm5(p0: vec2<f32>) -> f32 {
  var p = p0;
  var s = 0.0;
  var a = 0.5;
  for (var i = 0; i < 5; i = i + 1) {
    s = s + a * vnoise(p);
    p = p * 2.03 + vec2<f32>(11.3, 7.7);
    a = a * 0.5;
  }
  return s;
}

fn rotY(a: f32) -> mat3x3<f32> {
  let c = cos(a); let s = sin(a);
  return mat3x3<f32>(vec3<f32>(c, 0.0, -s), vec3<f32>(0.0, 1.0, 0.0), vec3<f32>(s, 0.0, c));
}
fn rotX(a: f32) -> mat3x3<f32> {
  let c = cos(a); let s = sin(a);
  return mat3x3<f32>(vec3<f32>(1.0, 0.0, 0.0), vec3<f32>(0.0, c, s), vec3<f32>(0.0, -s, c));
}

const PI : f32 = 3.14159265359;
`;

  var FULLSCREEN_VS = `
struct FSOut { @builtin(position) pos : vec4<f32>, @location(0) uv : vec2<f32> };

@vertex
fn vs_fullscreen(@builtin(vertex_index) vi: u32) -> FSOut {
  var p = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0));
  var o : FSOut;
  o.pos = vec4<f32>(p[vi], 0.0, 1.0);
  o.uv = p[vi] * 0.5 + vec2<f32>(0.5, 0.5);
  return o;
}`;

  /* ------------------------------ 1. 阴影 pass ------------------------------ */

  var SHADOW = COMMON + `
@group(0) @binding(0) var<uniform> S : SceneU;

@vertex
fn vs_terrain(@location(0) pos: vec3<f32>, @location(1) nrm: vec3<f32>,
              @location(2) uv: vec2<f32>) -> @builtin(position) vec4<f32> {
  var p = pos;
  // 顶点侧的细节位移：让阴影轮廓也有起伏，同时加大顶点着色负载
  let d = fbm5(uv * 7.0 + vec2<f32>(3.1, 1.7)) - 0.5;
  p.y = p.y + d * 0.55;
  return S.lightViewProj * vec4<f32>(p, 1.0);
}

@vertex
fn vs_rock(@location(0) pos: vec3<f32>, @location(1) nrm: vec3<f32>,
           @builtin(instance_index) ii: u32) -> @builtin(position) vec4<f32> {
  let fii = f32(ii);
  let a = hash11(fii * 0.7311 + 0.17);
  let b = hash11(fii * 1.3177 + 3.71);
  let c = hash11(fii * 2.1139 + 9.23);
  let ring = floor(hash11(fii * 0.311 + 4.4) * 3.0);
  let radius = 26.0 + ring * 16.0 + a * 22.0;
  let angle = fii * 2.3999632 + S.params.x * (0.03 + ring * 0.012);
  let height = (b - 0.5) * 16.0 + sin(fii * 0.31 + S.params.x * 0.4) * 1.2;
  let scale = 0.5 + c * c * 2.6;
  let rot = rotY(angle * 1.7 + S.params.x * 0.06) * rotX(b * 6.28 + S.params.x * 0.05);
  let world = vec3<f32>(cos(angle) * radius, height, sin(angle) * radius);
  // 逐顶点扰动，让每块石头形状都不同
  let disp = 1.0 + (hash31(pos * 3.7 + fii) - 0.5) * 0.34;
  let lp = rot * (pos * scale * disp);
  return S.lightViewProj * vec4<f32>(world + lp, 1.0);
}

@fragment
fn fs_shadow() -> @location(0) vec4<f32> {
  return vec4<f32>(1.0);
}`;

  /* ------------------------------ 2. 背景 pass ------------------------------ */

  var BACKGROUND = COMMON + `
@group(0) @binding(0) var<uniform> S : SceneU;

struct FSOut { @builtin(position) pos : vec4<f32>, @location(0) uv : vec2<f32> };

@vertex
fn vs_fullscreen(@builtin(vertex_index) vi: u32) -> FSOut {
  var p = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0));
  var o : FSOut;
  o.pos = vec4<f32>(p[vi], 0.0, 1.0);
  o.uv = p[vi] * 0.5 + vec2<f32>(0.5, 0.5);
  return o;
}

@fragment
fn fs_background(in: FSOut) -> @location(0) vec4<f32> {
  let res = S.resolution.xy;
  // 与主相机的透视投影严格对齐：viewProj[1][1] 就是 1/tan(fovy/2)
  let p = (in.uv * res - res * 0.5) / res.y;
  let tanHalf = 1.0 / max(S.viewProj[1][1], 1e-4);
  let rd = normalize(S.camFwd.xyz + S.camRight.xyz * (p.x * 2.0 * tanHalf) + S.camUp.xyz * (p.y * 2.0 * tanHalf));

  // 星空：空间哈希出的稀疏亮点
  let sp = rd * 220.0;
  var col = vec3<f32>(0.004, 0.006, 0.014);
  let cell = floor(sp.xz + sp.yy);
  let rnd = hash21(cell);
  let star = smoothstep(0.9975, 1.0, rnd);
  col = col + vec3<f32>(0.8, 0.9, 1.0) * star * 1.4;

  // 星云：五阶 fbm，两层次叠加
  let np = rd.xz / max(0.12, rd.y * 0.5 + 0.35) + vec2<f32>(S.params.x * 0.006, 0.0);
  let n1 = fbm5(np * 2.1);
  let n2 = fbm5(np * 5.3 + vec2<f32>(4.7, 2.3));
  let cloud = clamp(n1 * 1.25 - 0.32, 0.0, 1.0) * clamp(n2 * 1.4, 0.0, 1.0);
  let nebA = vec3<f32>(0.16, 0.34, 0.82);
  let nebB = vec3<f32>(0.72, 0.20, 0.62);
  col = col + mix(nebA, nebB, clamp(n2 * 0.9, 0.0, 1.0)) * cloud * 0.75;

  // 太阳与光晕
  let sd = max(dot(rd, normalize(-S.sunDir.xyz)), 0.0);
  col = col + vec3<f32>(1.0, 0.74, 0.46) * pow(sd, 220.0) * 9.0;
  col = col + vec3<f32>(1.0, 0.58, 0.34) * pow(sd, 6.0) * 0.16 * S.sunDir.w;

  // 地平线暖光
  col = col + vec3<f32>(0.10, 0.06, 0.03) * (1.0 - clamp(rd.y * 3.0, 0.0, 1.0));

  // 视线朝下时压暗成远处雾色。
  // 相机在切线方向飞行时，画面下缘可能看不到地形（被视锥切掉），
  // 如果这里还画星空，就会出现「天空跑到脚底下」的诡异画面。
  let belowH = clamp(-rd.y * 5.0, 0.0, 1.0);
  col = mix(col, vec3<f32>(0.030, 0.036, 0.055), belowH);
  return vec4<f32>(col, 1.0);
}`;

  /* --------------------------- 3. 主体几何 pass --------------------------- */

  var MAIN = COMMON + `
@group(0) @binding(0) var<uniform> S : SceneU;
@group(0) @binding(1) var shadowMap : texture_depth_2d;
@group(0) @binding(2) var shadowSamp : sampler_comparison;

struct VSOut {
  @builtin(position) pos : vec4<f32>,
  @location(0) nrm : vec3<f32>,
  @location(1) wpos : vec3<f32>,
  @location(2) uv : vec2<f32>,
  @location(3) tint : vec3<f32>,
  @location(4) matId : f32,
};

/* 与 CPU 生成地形时同构的高度场，用来把岩石摆到地面上，避免悬空 */
fn terrainHeight(wx: f32, wz: f32) -> f32 {
  let base = fbm5(vec2<f32>(wx * 0.035, wz * 0.035)) * 5.2 - 2.6;
  let ridge = fbm5(vec2<f32>(wx * 0.011, wz * 0.011)) * 18.0 - 9.0;
  let radial = length(vec2<f32>(wx, wz)) / max(S.params2.z, 1.0);
  let wall = pow(max(0.0, radial - 0.34), 2.0) * 46.0;
  let trench = -pow(max(0.0, 0.34 - radial), 2.0) * 9.0;
  return base + ridge + wall + trench - 4.0;
}
/* 地形：网格本身是 CPU 生成的低频起伏，这里再叠高频细节 */
@vertex
fn vs_terrain(@location(0) pos: vec3<f32>, @location(1) nrm: vec3<f32>,
              @location(2) uv: vec2<f32>) -> VSOut {
  var p = pos;
  let d = fbm5(uv * 7.0 + vec2<f32>(3.1, 1.7)) - 0.5;
  p.y = p.y + d * 0.55;

  // 用有限差分重建扰动后的法线，否则细节会显得很"平"
  let e = 0.02;
  let dx = (fbm5((uv + vec2<f32>(e, 0.0)) * 7.0 + vec2<f32>(3.1, 1.7)) - 0.5) * 0.55;
  let dz = (fbm5((uv + vec2<f32>(0.0, e)) * 7.0 + vec2<f32>(3.1, 1.7)) - 0.5) * 0.55;
  let perturbed = normalize(nrm + vec3<f32>(-dx / e, 0.0, -dz / e) * 0.02);

  let h = (p.y + 6.0) / 18.0;
  var o : VSOut;
  o.pos = S.viewProj * vec4<f32>(p, 1.0);
  o.nrm = perturbed;
  o.wpos = p;
  o.uv = uv;
  o.tint = mix(vec3<f32>(0.075, 0.072, 0.085), vec3<f32>(0.30, 0.215, 0.145), clamp(fbm5(uv * 3.0) * 1.35 - 0.12, 0.0, 1.0));
  o.matId = 0.0;
  return o;
}

@vertex
fn vs_rock(@location(0) pos: vec3<f32>, @location(1) nrm: vec3<f32>,
           @builtin(instance_index) ii: u32) -> VSOut {
  let fii = f32(ii);
  let a = hash11(fii * 0.7311 + 0.17);
  let b = hash11(fii * 1.3177 + 3.71);
  let c = hash11(fii * 2.1139 + 9.23);
  let ring = floor(hash11(fii * 0.311 + 4.4) * 3.0);
  let radius = 26.0 + ring * 16.0 + a * 22.0;
  let angle = fii * 2.3999632 + S.params.x * (0.03 + ring * 0.012);
  let height = (b - 0.5) * 16.0 + sin(fii * 0.31 + S.params.x * 0.4) * 1.2;
  let scale = 0.5 + c * c * 2.6;
  let rot = rotY(angle * 1.7 + S.params.x * 0.06) * rotX(b * 6.28 + S.params.x * 0.05);
  let gx = cos(angle) * radius;
  let gz = sin(angle) * radius;
  // 贴地：坐在高度场上，略微埋进地面，避免悬空
  let groundY = terrainHeight(gx, gz) + scale * 0.42;
  let world = vec3<f32>(gx, groundY + height * 0.12, gz);
  let disp = 1.0 + (hash31(pos * 3.7 + fii) - 0.5) * 0.34;
  let lp = rot * (pos * scale * disp);

  var o : VSOut;
  o.pos = S.viewProj * vec4<f32>(world + lp, 1.0);
  o.nrm = normalize(rot * nrm);
  o.wpos = world + lp;
  o.uv = pos.xz * 2.0 + fii * 0.13;
  let t = clamp((height + 8.0) / 16.0, 0.0, 1.0);
  o.tint = mix(vec3<f32>(0.16, 0.30, 0.44), vec3<f32>(0.68, 0.28, 0.36), t) * (0.6 + c * 0.7);
  o.matId = 1.0;
  return o;
}

/* 都市场景：网格排布的高楼。复用岩石管线的顶点布局（盒体网格），
 * 窗格灯火在片元里按 matId=2 程序化生成。 */
@vertex
fn vs_city(@location(0) pos: vec3<f32>, @location(1) nrm: vec3<f32>,
           @builtin(instance_index) ii: u32) -> VSOut {
  let fii = f32(ii);
  let a = hash11(fii * 0.7311 + 0.17);
  let b = hash11(fii * 1.3177 + 3.71);
  let c = hash11(fii * 2.1139 + 9.23);
  let col = floor(fii / 44.0);
  let row = fii - col * 44.0;
  let cell = 8.5;
  let gx = (row - 21.5) * cell + (a - 0.5) * 2.2;
  let gz = (col - 21.5) * cell + (b - 0.5) * 2.2;
  // 越靠近市中心楼越高
  let r = length(vec2<f32>(gx, gz)) / 190.0;
  let h = 6.0 + c * c * 96.0 * clamp(1.0 - r * 1.15, 0.18, 1.0);
  let w = 1.5 + b * 2.2;
  let world = vec3<f32>(gx, h * 0.5 - 8.0, gz);
  let lp = pos * vec3<f32>(w, h * 0.5, w);

  var o : VSOut;
  o.pos = S.viewProj * vec4<f32>(world + lp, 1.0);
  o.nrm = nrm;
  o.wpos = world + lp;
  o.uv = vec2<f32>((pos.x + pos.z) * w, pos.y * h * 0.5);
  let t = clamp(c * 1.4, 0.0, 1.0);
  o.tint = mix(vec3<f32>(0.10, 0.12, 0.17), vec3<f32>(0.26, 0.24, 0.30), t);
  o.matId = 2.0;
  return o;
}


/* 3×3 PCF 阴影采样 */
fn shadowFactor(wpos: vec3<f32>, ndl: f32) -> f32 {
  var lp = S.lightViewProj * vec4<f32>(wpos, 1.0);
  lp = lp / lp.w;
  let uv = vec2<f32>(lp.x * 0.5 + 0.5, 0.5 - lp.y * 0.5);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0 || lp.z > 1.0) { return 1.0; }
  let texel = S.params2.w;
  // 斜率缩放，缓解自阴影产生的条纹
  let bias = clamp(0.0016 * tan(acos(clamp(ndl, 0.02, 1.0))), 0.0006, 0.006);
  let refZ = lp.z - bias;   // 注意：ref 在 WGSL 里是保留字，不能用作变量名
  var sum = 0.0;
  for (var y = -1; y <= 1; y = y + 1) {
    for (var x = -1; x <= 1; x = x + 1) {
      sum = sum + textureSampleCompareLevel(shadowMap, shadowSamp,
        uv + vec2<f32>(f32(x), f32(y)) * texel, refZ);
    }
  }
  return sum / 9.0;
}

/* Cook-Torrance GGX */
fn ggxSpec(n: vec3<f32>, v: vec3<f32>, l: vec3<f32>, rough: f32, f0: vec3<f32>) -> vec3<f32> {
  let h = normalize(v + l);
  let ndl = max(dot(n, l), 0.0);
  let ndv = max(dot(n, v), 1e-4);
  let ndh = max(dot(n, h), 0.0);
  let vdh = max(dot(v, h), 0.0);
  let a = rough * rough;
  let a2 = a * a;
  let d = a2 / max(PI * pow(ndh * ndh * (a2 - 1.0) + 1.0, 2.0), 1e-6);
  let k = a * 0.5;
  let g = (ndl / (ndl * (1.0 - k) + k)) * (ndv / (ndv * (1.0 - k) + k));
  let f = f0 + (vec3<f32>(1.0) - f0) * pow(1.0 - vdh, 5.0);
  return d * g * f / max(4.0 * ndl * ndv, 1e-4) * ndl;
}

@fragment
fn fs_main(in: VSOut) -> @location(0) vec4<f32> {
  let n0 = normalize(in.nrm);
  let v = normalize(S.camPos.xyz - in.wpos);
  let ndv = max(dot(n0, v), 1e-4);

  // 程序化法线细节：让表面在近处有质感，同时增加 ALU 密度
  let e = 0.35;
  let h0 = fbm5(in.uv * 9.0);
  let hx = fbm5((in.uv + vec2<f32>(e, 0.0)) * 9.0);
  let hz = fbm5((in.uv + vec2<f32>(0.0, e)) * 9.0);
  let t1 = normalize(cross(n0, vec3<f32>(0.0, 1.0, 0.0)) + vec3<f32>(1e-4, 0.0, 0.0));
  let t2 = cross(n0, t1);
  let n = normalize(n0 + (t1 * (hx - h0) + t2 * (hz - h0)) * 3.5);

  let isRock = in.matId > 0.5;
  let isCity = in.matId > 1.5;
  let albedo = in.tint * (0.72 + h0 * 0.55);
  let rough = select(0.86, 0.62, isRock) + (h0 - 0.5) * 0.22;
  let f0 = select(vec3<f32>(0.04), vec3<f32>(0.05), isRock);

  var col = albedo * 0.035;   // 环境项

  // 太阳（平行光 + 阴影）
  let sunL = normalize(-S.sunDir.xyz);
  let ndlSun = max(dot(n, sunL), 0.0);
  let shadow = shadowFactor(in.wpos, ndlSun);
  col = col + albedo * vec3<f32>(1.0, 0.84, 0.66) * ndlSun * shadow * 1.15 * S.sunDir.w;
  col = col + ggxSpec(n, v, sunL, clamp(rough, 0.08, 1.0), f0) * shadow * 0.9 * S.sunDir.w;

  // 四个彩色点光源
  for (var i = 0; i < 4; i = i + 1) {
    let lp = S.lightPos[i].xyz;
    let lc = S.lightCol[i].rgb;
    let d = lp - in.wpos;
    let dist = length(d);
    let l = d / max(dist, 1e-4);
    let atten = 1.0 / (1.0 + dist * dist * 0.006);
    let ndl = max(dot(n, l), 0.0);
    col = col + albedo * lc * ndl * atten * 1.5;
    col = col + ggxSpec(n, v, l, clamp(rough, 0.08, 1.0), f0) * atten * 1.2;
  }

  // 半球环境光 + 菲涅尔补光
  col = col + albedo * mix(vec3<f32>(0.018, 0.016, 0.015), vec3<f32>(0.035, 0.05, 0.085), n.y * 0.5 + 0.5);
  col = col + vec3<f32>(0.14, 0.40, 0.72) * pow(1.0 - ndv, 5.0) * 0.10;

  // 高度雾
  let dist = length(S.camPos.xyz - in.wpos);
  let fog = 1.0 - exp(-pow(dist * S.params.w, 2.0));
  col = mix(col, vec3<f32>(0.030, 0.036, 0.055), clamp(fog, 0.0, 0.97));

  // 都市：程序化窗格灯火（每扇窗有独立的开/关与色温）
  if (isCity) {
    let cellUV = vec2<f32>(in.uv.x * 0.55, in.uv.y * 0.42);
    let cell = floor(cellUV);
    let f = fract(cellUV);
    let lit = hash21(cell + floor(S.params.x * 0.25) * 0.013);
    let win = step(0.22, f.x) * step(f.x, 0.78) * step(0.24, f.y) * step(f.y, 0.76);
    var lamp = vec3<f32>(1.0, 0.82, 0.52);
    if (lit > 0.72) { lamp = vec3<f32>(0.62, 0.82, 1.0); }
    let on = step(0.32, lit);
    col = col + lamp * win * on * 1.05;
    // 楼体自发光边缘，夜里轮廓更清楚
    col = col + vec3<f32>(0.24, 0.38, 0.68) * pow(1.0 - max(dot(n, v), 0.0), 3.0) * 0.22;
  }

  return vec4<f32>(col, 1.0);
}`;

  /* ------------------------------ 4. 粒子 pass ------------------------------ */

  var PARTICLES = COMMON + `
@group(0) @binding(0) var<uniform> S : SceneU;

struct POut {
  @builtin(position) pos : vec4<f32>,
  @location(0) uv : vec2<f32>,
  @location(1) col : vec3<f32>,
};

@vertex
fn vs_particle(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> POut {
  let fii = f32(ii);
  let a = hash11(fii * 0.7113 + 0.31);
  let b = hash11(fii * 1.9431 + 5.17);
  let c = hash11(fii * 3.1177 + 2.71);
  let d = hash11(fii * 0.4139 + 8.23);

  let radius = 6.0 + a * 46.0;
  let ang = fii * 2.3999632 + S.params.x * (0.16 + b * 0.30);
  let rise = fract(c + S.params.x * (0.02 + d * 0.05));
  let height = -10.0 + rise * 30.0;

  let center = vec3<f32>(cos(ang) * radius, height, sin(ang) * radius);
  let size = (0.05 + b * 0.20) * (1.0 - rise * 0.35);

  var quad = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0));
  let q = quad[vi] * size;

  let world = center + S.camRight.xyz * q.x + S.camUp.xyz * q.y;
  var o : POut;
  o.pos = S.viewProj * vec4<f32>(world, 1.0);
  o.uv = quad[vi];
  let warm = vec3<f32>(1.0, 0.62, 0.28);
  let cool = vec3<f32>(0.36, 0.72, 1.0);
  o.col = mix(cool, warm, d) * (0.22 + c * 0.42) * (1.0 - rise * 0.55);
  return o;
}

@fragment
fn fs_particle(in: POut) -> @location(0) vec4<f32> {
  let r = length(in.uv);
  if (r > 1.0) { discard; }
  let falloff = pow(1.0 - r, 2.4);
  return vec4<f32>(in.col * falloff * 0.85, falloff);
}`;

  /* ------------------------------ 5~8. 后处理 ------------------------------ */

  /* ---------------------- 4.5 体积云海 / 尘埃 pass ---------------------- */

  var VOLUMETRIC = COMMON + `
@group(0) @binding(0) var<uniform> S : SceneU;

struct FSOut { @builtin(position) pos : vec4<f32>, @location(0) uv : vec2<f32> };

@vertex
fn vs_fullscreen(@builtin(vertex_index) vi: u32) -> FSOut {
  var p = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0));
  var o : FSOut;
  o.pos = vec4<f32>(p[vi], 0.0, 1.0);
  o.uv = p[vi] * 0.5 + vec2<f32>(0.5, 0.5);
  return o;
}

/* 参与介质：定步长光线步进一层云（或沙尘），带 4 次朝日方向的透光估算。
 * 这是整个场景里单个像素最贵的一段：40 步 × (2 次 5 阶 fbm + 4 次透光 fbm)，
 * 每像素约 700 次哈希。用来把「大量像素 × 深度循环」这类负载压满。
 * 密度由 resolution.z 控制，为 0 时整个 pass 直接返回，不产生开销。 */
@fragment
fn fs_volumetric(in: FSOut) -> @location(0) vec4<f32> {
  let densityScale = S.resolution.z;
  if (densityScale <= 0.0) { return vec4<f32>(0.0, 0.0, 0.0, 1.0); }

  let res = S.resolution.xy;
  let p = (in.uv * res - res * 0.5) / res.y;
  let tanHalf = 1.0 / max(S.viewProj[1][1], 1e-4);
  let rd = normalize(S.camFwd.xyz + S.camRight.xyz * (p.x * 2.0 * tanHalf) + S.camUp.xyz * (p.y * 2.0 * tanHalf));
  let ro = S.camPos.xyz;
  let sunL = normalize(-S.sunDir.xyz);

  // 云层高度范围；都市场景（sceneMode=1）压得更低、更脏，做成沙尘暴
  let isDust = S.resolution.w > 0.5;
  let base = select(24.0, -6.0, isDust);
  let top = select(86.0, 44.0, isDust);
  let sunCol = select(vec3<f32>(1.0, 0.88, 0.70), vec3<f32>(0.86, 0.62, 0.34), isDust);
  let ambCol = select(vec3<f32>(0.30, 0.42, 0.68), vec3<f32>(0.32, 0.24, 0.18), isDust);
  let noiseScale = select(0.011, 0.026, isDust);
  let drift = vec2<f32>(S.params.x * select(0.018, 0.05, isDust), S.params.x * 0.009);

  var acc = vec3<f32>(0.0);
  var trans = 1.0;

  var t0 = 0.0;
  var t1 = 0.0;
  if (abs(rd.y) > 1e-4) {
    t0 = (base - ro.y) / rd.y;
    t1 = (top - ro.y) / rd.y;
    if (t0 > t1) { let tmp = t0; t0 = t1; t1 = tmp; }
    t0 = max(t0, 1.0);
    t1 = min(t1, 900.0);
  }

  if (t1 > t0) {
    let steps = 40;
    let dt = (t1 - t0) / f32(steps);
    var t = t0 + dt * hash21(in.uv * res + vec2<f32>(S.params.x, 0.0));
    for (var i = 0; i < 40; i = i + 1) {
      let cp = ro + rd * t;
      let hh = clamp((cp.y - base) / (top - base), 0.0, 1.0);
      let shape = fbm5(cp.xz * noiseScale + drift);
      let detail = fbm5(cp.xz * noiseScale * 4.3 - drift * 1.7);
      var d = shape * 0.78 + detail * 0.30;
      d = d - 0.60 + (1.0 - abs(hh * 2.0 - 1.0)) * 0.34;
      d = max(d, 0.0) * densityScale;

      if (d > 0.002) {
        // 朝太阳方向再走 4 步，估算被遮挡多少
        var shade = 0.0;
        for (var j = 1; j <= 4; j = j + 1) {
          let sp = cp + sunL * (f32(j) * 11.0);
          let sh = fbm5(sp.xz * noiseScale + drift);
          shade = shade + max(sh - 0.55, 0.0);
        }
        let lit = exp(-shade * 1.7) * 0.78 + 0.22;
        let stepT = exp(-d * dt * 0.055);
        acc = acc + trans * (1.0 - stepT) * (sunCol * lit * 1.05 + ambCol * 0.30);
        trans = trans * stepT;
        if (trans < 0.015) { break; }
      }
      t = t + dt;
    }
  }

  // 面朝太阳的整体散射
  let sunDot = max(dot(rd, sunL), 0.0);
  acc = acc + sunCol * pow(sunDot, 5.0) * 0.09 * densityScale;
  return vec4<f32>(acc, 1.0);
}`;

  var POST = COMMON + `
@group(0) @binding(0) var<uniform> S : SceneU;
@group(0) @binding(1) var srcTex : texture_2d<f32>;
@group(0) @binding(2) var srcSamp : sampler;
@group(0) @binding(3) var bloomTex : texture_2d<f32>;
@group(0) @binding(4) var bloomSamp : sampler;

struct FSOut { @builtin(position) pos : vec4<f32>, @location(0) uv : vec2<f32> };

@vertex
fn vs_fullscreen(@builtin(vertex_index) vi: u32) -> FSOut {
  var p = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0));
  var o : FSOut;
  o.pos = vec4<f32>(p[vi], 0.0, 1.0);
  o.uv = p[vi] * 0.5 + vec2<f32>(0.5, 0.5);
  return o;
}

/* 亮度阈值提取 */
@fragment
fn fs_bright(in: FSOut) -> @location(0) vec4<f32> {
  let c = textureSampleLevel(srcTex, srcSamp, in.uv, 0.0).rgb;
  let lum = dot(c, vec3<f32>(0.2126, 0.7152, 0.0722));
  let k = max(lum - 0.85, 0.0) / max(lum, 1e-4);
  return vec4<f32>(c * k, 1.0);
}

/* 可分离高斯模糊：dir = (1,0) 横向 / (0,1) 纵向 */
fn blurDir(in: FSOut, dir: vec2<f32>) -> vec4<f32> {
  let texel = 1.0 / S.resolution.xy;
  var sum = vec3<f32>(0.0);
  var wsum = 0.0;
  for (var i = -4; i <= 4; i = i + 1) {
    let fi = f32(i);
    let w = exp(-fi * fi * 0.16);
    sum = sum + textureSampleLevel(srcTex, srcSamp, in.uv + dir * texel * fi * 2.0, 0.0).rgb * w;
    wsum = wsum + w;
  }
  return vec4<f32>(sum / wsum, 1.0);
}

@fragment
fn fs_blurH(in: FSOut) -> @location(0) vec4<f32> { return blurDir(in, vec2<f32>(1.0, 0.0)); }

@fragment
fn fs_blurV(in: FSOut) -> @location(0) vec4<f32> { return blurDir(in, vec2<f32>(0.0, 1.0)); }

/* ACES 近似色调映射 */
fn aces(x: vec3<f32>) -> vec3<f32> {
  let a = 2.51; let b = 0.03; let c = 2.43; let d = 0.59; let e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), vec3<f32>(0.0), vec3<f32>(1.0));
}

@fragment
fn fs_composite(in: FSOut) -> @location(0) vec4<f32> {
  // 垂直翻转：整条场景序列渲染出来的画面是上下颠倒的（用户实测确认），
  // 这里在**最后的合成 pass** 统一翻回来 —— 所有几何、光照、后处理都不动，
  // 只在写入画布前把采样坐标的 y 取反。
  let uv = vec2<f32>(in.uv.x, 1.0 - in.uv.y);
  // 色散：R/G/B 各偏移一点点
  let res = S.resolution.xy;
  let center = uv - vec2<f32>(0.5, 0.5);
  let ca = 0.0022 * dot(center, center) * 4.0;
  let r = textureSampleLevel(srcTex, srcSamp, uv + center * ca, 0.0).r;
  let g = textureSampleLevel(srcTex, srcSamp, uv, 0.0).g;
  let b = textureSampleLevel(srcTex, srcSamp, uv - center * ca, 0.0).b;
  var col = vec3<f32>(r, g, b);

  // bloom
  col = col + textureSampleLevel(bloomTex, bloomSamp, uv, 0.0).rgb * S.params2.y;

  // 曝光 + ACES
  col = aces(col * S.params.z);

  // 暗角
  let d = length(center) * 1.42;
  col = col * (1.0 - clamp(d * d * 0.85, 0.0, 0.72));

  // 胶片颗粒
  let grain = hash21(uv * res + vec2<f32>(S.params.x * 37.0, S.params.x * 19.0)) - 0.5;
  col = col + grain * 0.016;

  // gamma
  return vec4<f32>(pow(max(col, vec3<f32>(0.0)), vec3<f32>(1.0 / 2.2)), 1.0);
}`;

  S.wgsl = {
    COMMON: COMMON,
    FULLSCREEN_VS: FULLSCREEN_VS,
    SHADOW: SHADOW,
    BACKGROUND: BACKGROUND,
    MAIN: MAIN,
    PARTICLES: PARTICLES,
    VOLUMETRIC: VOLUMETRIC,
    POST: POST,
    UNIFORM_FLOATS: 96
  };

})(window);
