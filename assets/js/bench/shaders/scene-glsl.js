/* ============================================================================
 * NovaMark · 综合场景着色器（GLSL ES 3.00 / WebGL2）
 *
 * 与 scene.js（WGSL 版）逐段对译，语义完全等价，管线构成一致：
 *   1) 阴影 pass      —— 平行光视角渲染地形与岩石到 2048² 深度图
 *   2) 背景 pass      —— 全屏程序化星云（5 阶 fbm）+ 星空 + 太阳光晕
 *   3) 主体 pass      —— PBR(Cook-Torrance/GGX) + 5 光源 + 阴影 PCF + 程序化法线细节 + 高度雾
 *   4) 粒子 pass      —— 2 万+ 实例化广告牌，加法混合，制造大量 overdraw
 *   5) 亮度提取 pass  —— 半分辨率阈值提取
 *   6) 模糊 H pass    —— 四分之一分辨率高斯横向
 *   7) 模糊 V pass    —— 四分之一分辨率高斯纵向
 *   8) 合成 pass      —— bloom 叠加 + ACES 色调映射 + 暗角 + 色散 + 颗粒
 *
 * WGSL → GLSL 的主要差异（均为语言差异，语义不变）：
 *   · uniform 由 `@group(0) @binding(0) var<uniform> S : SceneU` 变成
 *     `layout(std140) uniform SceneU { ... };`（块名固定 SceneU，无实例名，
 *     于是 WGSL 的 S.xxx 在 GLSL 里直接写 xxx）；
 *   · `fn` → 返回类型前置的函数；`let/var` → `float/vec3/...` 或 `var` 省略（GLSL 无类型推导）；
 *   · `vec3<f32>` → `vec3`，`f32(...)` → `float(...)`，`u32` → `int`（循环）或 `float`（索引）；
 *   · `select(a, b, c)` → `(c ? b : a)`；`textureSampleLevel(t, s, uv, 0.0)` → `textureLod(t, uv, 0.0)`；
 *   · `texture_depth_2d + sampler_comparison + textureSampleCompareLevel` →
 *     `sampler2DShadow + texture(shadowMap, vec3(uv, ref))`；
 *   · 所有循环边界改为编译期常量（GLSL ES 3.00 对非常量循环条件支持不好）；
 *   · 顶点/片元入口改为 `void main()`，属性用显式 `layout(location=N) in`，
 *     varying 两侧显式同名同类型，片元输出 `layout(location=0) out vec4 fragColor;`。
 *
 * uniform 布局（96 个 float / 384 字节，全部 16 字节对齐，std140 下逐字节一致）：
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

  /* 注意：#version 必须是整个源码的第一个字符，因此 COMMON 串本体即以它开头，
     所有 shader 串一律使用 `COMMON + ...` 拼接，保证 #version 永远在最前面。 */
  var COMMON = `#version 300 es
precision highp float;
precision highp int;

layout(std140) uniform SceneU {
  mat4 viewProj;
  mat4 lightViewProj;
  vec4 camPos;
  vec4 camRight;
  vec4 camUp;
  vec4 camFwd;
  vec4 lightPos[4];
  vec4 lightCol[4];
  vec4 sunDir;
  vec4 params;
  vec4 params2;
  vec4 resolution;
};

const float PI = 3.14159265359;

float hash11(float p) {
  float x = fract(p * 0.1031);
  x = x * (x + 33.33);
  x = x * (x + x);
  return fract(x);
}

float hash21(vec2 p) {
  vec2 q = fract(p * vec2(123.34, 456.21));
  q = q + dot(q, q + 45.32);
  return fract(q.x * q.y);
}

float hash31(vec3 p) {
  vec3 q = fract(p * vec3(0.1031, 0.1030, 0.0973));
  q = q + dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

/* 二维值噪声 */
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

/* 五阶 fbm：地形与星云共用（循环边界为常量 5，便于驱动展开） */
float fbm5(vec2 p0) {
  vec2 p = p0;
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    s = s + a * vnoise(p);
    p = p * 2.03 + vec2(11.3, 7.7);
    a = a * 0.5;
  }
  return s;
}

/* 与 CPU 生成地形时同构的高度场，用来把岩石摆到地面上，避免悬空。
 * 必须放在 COMMON 里且位于 fbm5 之后：GLSL 每个着色器是独立编译单元，
 * 只放进 MAIN_FS 的话 MAIN_VS_ROCK 看不到；放在 fbm5 之前则调用不到它。 */
float terrainHeight(float wx, float wz) {
  float base = fbm5(vec2(wx * 0.035, wz * 0.035)) * 5.2 - 2.6;
  float ridge = fbm5(vec2(wx * 0.011, wz * 0.011)) * 18.0 - 9.0;
  float radial = length(vec2(wx, wz)) / max(params2.z, 1.0);
  float wall = pow(max(0.0, radial - 0.34), 2.0) * 46.0;
  float trench = -pow(max(0.0, 0.34 - radial), 2.0) * 9.0;
  return base + ridge + wall + trench - 4.0;
}


mat3 rotY(float a) {
  float c = cos(a); float s = sin(a);
  return mat3(vec3(c, 0.0, -s), vec3(0.0, 1.0, 0.0), vec3(s, 0.0, c));
}
mat3 rotX(float a) {
  float c = cos(a); float s = sin(a);
  return mat3(vec3(1.0, 0.0, 0.0), vec3(0.0, c, s), vec3(0.0, -s, c));
}
`;

  /* ------------------- 全屏三角形顶点着色器（后处理/背景共用） ------------------- */

  var FULLSCREEN_VS = COMMON + `
out vec2 vUV;

/* 与 WGSL vs_fullscreen 一致：用 gl_VertexID 生成一个覆盖屏幕的大三角形 */
void main() {
  vec2 p[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  vec2 q = p[gl_VertexID];
  gl_Position = vec4(q, 0.0, 1.0);
  vUV = q * 0.5 + vec2(0.5, 0.5);
}`;

  /* ------------------------------ 1. 阴影 pass ------------------------------ */

  var SHADOW_VS = COMMON + `
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNrm;
layout(location = 2) in vec2 aUV;

void main() {
  vec3 p = aPos;
  // 顶点侧的细节位移：让阴影轮廓也有起伏，同时加大顶点着色负载
  float d = fbm5(aUV * 7.0 + vec2(3.1, 1.7)) - 0.5;
  p.y = p.y + d * 0.55;
  gl_Position = lightViewProj * vec4(p, 1.0);
}`;

  /* 阴影 pass 的岩石版本（WGSL SHADOW 里的 vs_rock），实例号来自 gl_InstanceID */
  var SHADOW_VS_ROCK = COMMON + `
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNrm;

void main() {
  float fii = float(gl_InstanceID);
  float a = hash11(fii * 0.7311 + 0.17);
  float b = hash11(fii * 1.3177 + 3.71);
  float c = hash11(fii * 2.1139 + 9.23);
  float ring = floor(hash11(fii * 0.311 + 4.4) * 3.0);
  float radius = 26.0 + ring * 16.0 + a * 22.0;
  float angle = fii * 2.3999632 + params.x * (0.03 + ring * 0.012);
  float height = (b - 0.5) * 16.0 + sin(fii * 0.31 + params.x * 0.4) * 1.2;
  float scale = 0.5 + c * c * 2.6;
  mat3 rot = rotY(angle * 1.7 + params.x * 0.06) * rotX(b * 6.28 + params.x * 0.05);
  vec3 world = vec3(cos(angle) * radius, height, sin(angle) * radius);
  // 逐顶点扰动，让每块石头形状都不同
  float disp = 1.0 + (hash31(aPos * 3.7 + fii) - 0.5) * 0.34;
  vec3 lp = rot * (aPos * scale * disp);
  gl_Position = lightViewProj * vec4(world + lp, 1.0);
}`;

  var SHADOW_FS = COMMON + `
layout(location = 0) out vec4 fragColor;

void main() {
  fragColor = vec4(1.0);
}`;

  var SHADOW_VS_TERRAIN = SHADOW_VS;   /* 语义别名：SHADOW_VS 即地形版本 */

  /* ------------------------------ 2. 背景 pass ------------------------------ */

  var BACKGROUND_VS = COMMON + `
out vec2 vUV;

void main() {
  vec2 p[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  vec2 q = p[gl_VertexID];
  gl_Position = vec4(q, 0.0, 1.0);
  vUV = q * 0.5 + vec2(0.5, 0.5);
}`;

  var BACKGROUND_FS = COMMON + `
in vec2 vUV;
layout(location = 0) out vec4 fragColor;

void main() {
  vec2 res = resolution.xy;
  // 与主相机的透视投影严格对齐：viewProj[1][1] 就是 1/tan(fovy/2)
  vec2 p = (vUV * res - res * 0.5) / res.y;
  float tanHalf = 1.0 / max(viewProj[1][1], 1e-4);
  vec3 rd = normalize(camFwd.xyz + camRight.xyz * (p.x * 2.0 * tanHalf) + camUp.xyz * (p.y * 2.0 * tanHalf));

  // 星空：空间哈希出的稀疏亮点
  vec3 sp = rd * 220.0;
  vec3 col = vec3(0.004, 0.006, 0.014);
  vec2 cell = floor(sp.xz + sp.yy);
  float rnd = hash21(cell);
  float star = smoothstep(0.9975, 1.0, rnd);
  col = col + vec3(0.8, 0.9, 1.0) * star * 1.4;

  // 星云：五阶 fbm，两层次叠加
  vec2 np = rd.xz / max(0.12, rd.y * 0.5 + 0.35) + vec2(params.x * 0.006, 0.0);
  float n1 = fbm5(np * 2.1);
  float n2 = fbm5(np * 5.3 + vec2(4.7, 2.3));
  float cloud = clamp(n1 * 1.25 - 0.32, 0.0, 1.0) * clamp(n2 * 1.4, 0.0, 1.0);
  vec3 nebA = vec3(0.16, 0.34, 0.82);
  vec3 nebB = vec3(0.72, 0.20, 0.62);
  col = col + mix(nebA, nebB, clamp(n2 * 0.9, 0.0, 1.0)) * cloud * 0.75;

  // 太阳与光晕
  float sd = max(dot(rd, normalize(-sunDir.xyz)), 0.0);
  col = col + vec3(1.0, 0.74, 0.46) * pow(sd, 220.0) * 9.0;
  col = col + vec3(1.0, 0.58, 0.34) * pow(sd, 6.0) * 0.16 * sunDir.w;

  // 地平线暖光
  col = col + vec3(0.10, 0.06, 0.03) * (1.0 - clamp(rd.y * 3.0, 0.0, 1.0));

  // 视线朝下时压暗成远处雾色。
  // 相机在切线方向飞行时，画面下缘可能看不到地形（被视锥切掉），
  // 如果这里还画星空，就会出现「天空跑到脚底下」的诡异画面。
  float belowH = clamp(-rd.y * 5.0, 0.0, 1.0);
  col = mix(col, vec3(0.030, 0.036, 0.055), belowH);
  fragColor = vec4(col, 1.0);
}`;

  /* --------------------------- 3. 主体几何 pass --------------------------- */

  /* 地形与岩石是两个不同的顶点着色器（WGSL 里是两个 @vertex 入口），
     两者的 varying 名字/类型与 MAIN_FS 的 in 完全一致。 */
  var MAIN_VS_TERRAIN = COMMON + `
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNrm;
layout(location = 2) in vec2 aUV;

/* 注意：GLSL ES 3.00 的 layout(location=) 只能出现在顶点着色器的输入（属性）
   和片元着色器的输出（fragColor）上；顶点输出 / 片元输入的 varying 不允许带
   location，只能靠"同名同类型"配对。下面 5 个 varying 的书写顺序即约定的编号
   0..4：nrm / wpos / uv / tint / matId。 */
out vec3 nrm;
out vec3 wpos;
out vec2 uv;
out vec3 tint;
out float matId;

/* 地形：网格本身是 CPU 生成的低频起伏，这里再叠高频细节 */
void main() {
  vec3 p = aPos;
  float d = fbm5(aUV * 7.0 + vec2(3.1, 1.7)) - 0.5;
  p.y = p.y + d * 0.55;

  // 用有限差分重建扰动后的法线，否则细节会显得很"平"
  float e = 0.02;
  float dx = (fbm5((aUV + vec2(e, 0.0)) * 7.0 + vec2(3.1, 1.7)) - 0.5) * 0.55;
  float dz = (fbm5((aUV + vec2(0.0, e)) * 7.0 + vec2(3.1, 1.7)) - 0.5) * 0.55;
  vec3 perturbed = normalize(aNrm + vec3(-dx / e, 0.0, -dz / e) * 0.02);

  gl_Position = viewProj * vec4(p, 1.0);
  nrm = perturbed;
  wpos = p;
  uv = aUV;
  tint = mix(vec3(0.075, 0.072, 0.085), vec3(0.30, 0.215, 0.145), clamp(fbm5(aUV * 3.0) * 1.35 - 0.12, 0.0, 1.0));
  matId = 0.0;
}`;

  var MAIN_VS_ROCK = COMMON + `
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNrm;

/* 注意：GLSL ES 3.00 的 layout(location=) 只能出现在顶点着色器的输入（属性）
   和片元着色器的输出（fragColor）上；顶点输出 / 片元输入的 varying 不允许带
   location，只能靠"同名同类型"配对。下面 5 个 varying 的书写顺序即约定的编号
   0..4：nrm / wpos / uv / tint / matId。 */
out vec3 nrm;
out vec3 wpos;
out vec2 uv;
out vec3 tint;
out float matId;

void main() {
  float fii = float(gl_InstanceID);
  float a = hash11(fii * 0.7311 + 0.17);
  float b = hash11(fii * 1.3177 + 3.71);
  float c = hash11(fii * 2.1139 + 9.23);
  float ring = floor(hash11(fii * 0.311 + 4.4) * 3.0);
  float radius = 26.0 + ring * 16.0 + a * 22.0;
  float angle = fii * 2.3999632 + params.x * (0.03 + ring * 0.012);
  float height = (b - 0.5) * 16.0 + sin(fii * 0.31 + params.x * 0.4) * 1.2;
  float scale = 0.5 + c * c * 2.6;
  mat3 rot = rotY(angle * 1.7 + params.x * 0.06) * rotX(b * 6.28 + params.x * 0.05);
  float gx = cos(angle) * radius;
  float gz = sin(angle) * radius;
  // 贴地：坐在高度场上，略微埋进地面，避免悬空
  float groundY = terrainHeight(gx, gz) + scale * 0.42;
  vec3 world = vec3(gx, groundY + height * 0.12, gz);
  float disp = 1.0 + (hash31(aPos * 3.7 + fii) - 0.5) * 0.34;
  vec3 lp = rot * (aPos * scale * disp);
  vec3 wp = world + lp;

  gl_Position = viewProj * vec4(wp, 1.0);
  nrm = normalize(rot * aNrm);
  wpos = wp;
  uv = aPos.xz * 2.0 + fii * 0.13;
  float t = clamp((height + 8.0) / 16.0, 0.0, 1.0);
  tint = mix(vec3(0.16, 0.30, 0.44), vec3(0.68, 0.28, 0.36), t) * (0.6 + c * 0.7);
  matId = 1.0;
}`;

  var MAIN_VS_CITY = COMMON + `
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNrm;

/* 同 MAIN_VS_ROCK：varying 名字/类型必须与 MAIN_FS 的 in 完全一致 */
out vec3 nrm;
out vec3 wpos;
out vec2 uv;
out vec3 tint;
out float matId;

/* 都市场景：网格排布的高楼。复用岩石管线的顶点布局（盒体网格），
 * 窗格灯火在片元里按 matId=2 程序化生成。 */
void main() {
  float fii = float(gl_InstanceID);
  float a = hash11(fii * 0.7311 + 0.17);
  float b = hash11(fii * 1.3177 + 3.71);
  float c = hash11(fii * 2.1139 + 9.23);
  float col = floor(fii / 44.0);
  float row = fii - col * 44.0;
  float cell = 8.5;
  float gx = (row - 21.5) * cell + (a - 0.5) * 2.2;
  float gz = (col - 21.5) * cell + (b - 0.5) * 2.2;
  // 越靠近市中心楼越高
  float r = length(vec2(gx, gz)) / 190.0;
  float h = 6.0 + c * c * 96.0 * clamp(1.0 - r * 1.15, 0.18, 1.0);
  float w = 1.5 + b * 2.2;
  vec3 world = vec3(gx, h * 0.5 - 8.0, gz);
  vec3 lp = aPos * vec3(w, h * 0.5, w);

  gl_Position = viewProj * vec4(world + lp, 1.0);
  nrm = aNrm;
  wpos = world + lp;
  uv = vec2((aPos.x + aPos.z) * w, aPos.y * h * 0.5);
  float t = clamp(c * 1.4, 0.0, 1.0);
  tint = mix(vec3(0.10, 0.12, 0.17), vec3(0.26, 0.24, 0.30), t);
  matId = 2.0;
}`;

  var MAIN_VS = MAIN_VS_TERRAIN;   /* 语义别名：默认网格路径即地形版本 */

  var MAIN_FS = COMMON + `
/* 深度比较采样：WGSL 的 texture_depth_2d + sampler_comparison 在 GLSL 里就是 sampler2DShadow */
uniform highp sampler2DShadow shadowMap;

/* 与两个 VS 的 out 同名同类型（ES 3.00 的 varying 靠名字配对，不能写 location）：
   顺序对应 nrm / wpos / uv / tint / matId */
in vec3 nrm;
in vec3 wpos;
in vec2 uv;
in vec3 tint;
in float matId;

layout(location = 0) out vec4 fragColor;


/* 3×3 PCF 阴影采样（循环边界为常量，PCF 用 texture() 的比较采样） */
float shadowFactor(vec3 pw, float ndl) {
  vec4 lp = lightViewProj * vec4(pw, 1.0);
  lp = lp / lp.w;
  vec2 suv = vec2(lp.x * 0.5 + 0.5, 0.5 - lp.y * 0.5);
  if (suv.x < 0.0 || suv.x > 1.0 || suv.y < 0.0 || suv.y > 1.0 || lp.z > 1.0) { return 1.0; }
  float texel = params2.w;
  // 斜率缩放，缓解自阴影产生的条纹
  float bias = clamp(0.0016 * tan(acos(clamp(ndl, 0.02, 1.0))), 0.0006, 0.006);
  float refZ = lp.z - bias;   // 注意：ref 在 WGSL 里是保留字，不能用作变量名
  float sum = 0.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      sum = sum + texture(shadowMap, vec3(suv + vec2(float(x), float(y)) * texel, refZ));
    }
  }
  return sum / 9.0;
}

/* Cook-Torrance GGX */
vec3 ggxSpec(vec3 n, vec3 v, vec3 l, float rough, vec3 f0) {
  vec3 h = normalize(v + l);
  float ndl = max(dot(n, l), 0.0);
  float ndv = max(dot(n, v), 1e-4);
  float ndh = max(dot(n, h), 0.0);
  float vdh = max(dot(v, h), 0.0);
  float a = rough * rough;
  float a2 = a * a;
  float dd = a2 / max(PI * pow(ndh * ndh * (a2 - 1.0) + 1.0, 2.0), 1e-6);
  float k = a * 0.5;
  float g = (ndl / (ndl * (1.0 - k) + k)) * (ndv / (ndv * (1.0 - k) + k));
  vec3 f = f0 + (vec3(1.0) - f0) * pow(1.0 - vdh, 5.0);
  return dd * g * f / max(4.0 * ndl * ndv, 1e-4) * ndl;
}

void main() {
  vec3 n0 = normalize(nrm);
  vec3 v = normalize(camPos.xyz - wpos);
  float ndv = max(dot(n0, v), 1e-4);

  // 程序化法线细节：让表面在近处有质感，同时增加 ALU 密度
  float e = 0.35;
  float h0 = fbm5(uv * 9.0);
  float hx = fbm5((uv + vec2(e, 0.0)) * 9.0);
  float hz = fbm5((uv + vec2(0.0, e)) * 9.0);
  vec3 t1 = normalize(cross(n0, vec3(0.0, 1.0, 0.0)) + vec3(1e-4, 0.0, 0.0));
  vec3 t2 = cross(n0, t1);
  vec3 n = normalize(n0 + (t1 * (hx - h0) + t2 * (hz - h0)) * 3.5);

  bool isRock = matId > 0.5;
  bool isCity = matId > 1.5;                                  // WGSL: select(0.86, 0.62, isRock)
  vec3 albedo = tint * (0.72 + h0 * 0.55);
  float rough = (isRock ? 0.62 : 0.86) + (h0 - 0.5) * 0.22;
  vec3 f0 = (isRock ? vec3(0.05) : vec3(0.04));

  vec3 col = albedo * 0.035;   // 环境项

  // 太阳（平行光 + 阴影）
  vec3 sunL = normalize(-sunDir.xyz);
  float ndlSun = max(dot(n, sunL), 0.0);
  float shadow = shadowFactor(wpos, ndlSun);
  col = col + albedo * vec3(1.0, 0.84, 0.66) * ndlSun * shadow * 1.15 * sunDir.w;
  col = col + ggxSpec(n, v, sunL, clamp(rough, 0.08, 1.0), f0) * shadow * 0.9 * sunDir.w;

  // 四个彩色点光源
  for (int i = 0; i < 4; i++) {
    vec3 lp = lightPos[i].xyz;
    vec3 lc = lightCol[i].rgb;
    vec3 dv = lp - wpos;
    float dl = length(dv);
    vec3 l = dv / max(dl, 1e-4);
    float atten = 1.0 / (1.0 + dl * dl * 0.006);
    float ndl = max(dot(n, l), 0.0);
    col = col + albedo * lc * ndl * atten * 1.5;
    col = col + ggxSpec(n, v, l, clamp(rough, 0.08, 1.0), f0) * atten * 1.2;
  }

  // 半球环境光 + 菲涅尔补光
  col = col + albedo * mix(vec3(0.018, 0.016, 0.015), vec3(0.035, 0.05, 0.085), n.y * 0.5 + 0.5);
  col = col + vec3(0.14, 0.40, 0.72) * pow(1.0 - ndv, 5.0) * 0.10;

  // 高度雾
  float fdist = length(camPos.xyz - wpos);
  float fog = 1.0 - exp(-pow(fdist * params.w, 2.0));
  col = mix(col, vec3(0.030, 0.036, 0.055), clamp(fog, 0.0, 0.97));

  // 都市：程序化窗格灯火（每扇窗有独立的开/关与色温）
  if (isCity) {
    vec2 cellUV = vec2(uv.x * 0.55, uv.y * 0.42);
    vec2 cellIdx = floor(cellUV);
    vec2 f = fract(cellUV);
    float lit = hash21(cellIdx + floor(params.x * 0.25) * 0.013);
    float win = step(0.22, f.x) * step(f.x, 0.78) * step(0.24, f.y) * step(f.y, 0.76);
    vec3 lamp = vec3(1.0, 0.82, 0.52);
    if (lit > 0.72) { lamp = vec3(0.62, 0.82, 1.0); }
    float on = step(0.32, lit);
    col = col + lamp * win * on * 1.05;
    // 楼体自发光边缘，夜里轮廓更清楚
    col = col + vec3(0.24, 0.38, 0.68) * pow(1.0 - max(dot(n, v), 0.0), 3.0) * 0.22;
  }

  fragColor = vec4(col, 1.0);
}`;

  /* ------------------------------ 4. 粒子 pass ------------------------------ */

  var PARTICLE_VS = COMMON + `
out vec2 vUV;
out vec3 vCol;

void main() {
  float fii = float(gl_InstanceID);
  float a = hash11(fii * 0.7113 + 0.31);
  float b = hash11(fii * 1.9431 + 5.17);
  float c = hash11(fii * 3.1177 + 2.71);
  float d = hash11(fii * 0.4139 + 8.23);

  float radius = 6.0 + a * 46.0;
  float ang = fii * 2.3999632 + params.x * (0.16 + b * 0.30);
  float rise = fract(c + params.x * (0.02 + d * 0.05));
  float height = -10.0 + rise * 30.0;

  vec3 center = vec3(cos(ang) * radius, height, sin(ang) * radius);
  float size = (0.05 + b * 0.20) * (1.0 - rise * 0.35);

  vec2 quad[6] = vec2[6](
    vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0),
    vec2(-1.0, 1.0), vec2(1.0, -1.0), vec2(1.0, 1.0));
  vec2 q = quad[gl_VertexID] * size;

  vec3 world = center + camRight.xyz * q.x + camUp.xyz * q.y;
  gl_Position = viewProj * vec4(world, 1.0);
  vUV = quad[gl_VertexID];
  vec3 warm = vec3(1.0, 0.62, 0.28);
  vec3 cool = vec3(0.36, 0.72, 1.0);
  vCol = mix(cool, warm, d) * (0.22 + c * 0.42) * (1.0 - rise * 0.55);
}`;

  var PARTICLE_FS = COMMON + `
in vec2 vUV;
in vec3 vCol;
layout(location = 0) out vec4 fragColor;

void main() {
  float r = length(vUV);
  if (r > 1.0) { discard; }
  float falloff = pow(1.0 - r, 2.4);
  fragColor = vec4(vCol * falloff * 0.85, falloff);
}`;

  /* ------------------------------ 5~8. 后处理 ------------------------------ */

  /* ---------------------- 4.5 体积云海 / 尘埃 pass ---------------------- */

  var VOLUMETRIC_VS = COMMON + `
out vec2 vUV;

/* 全屏三角形，与 POST_VS 相同 */
void main() {
  vec2 p[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  vec2 q = p[gl_VertexID];
  gl_Position = vec4(q, 0.0, 1.0);
  vUV = q * 0.5 + vec2(0.5, 0.5);
}`;

  /* 参与介质：定步长光线步进一层云（或沙尘），带 4 次朝日方向的透光估算。
   * 这是整个场景里单个像素最贵的一段：40 步 × (2 次 5 阶 fbm + 4 次透光 fbm)，
   * 每像素约 700 次哈希。用来把「大量像素 × 深度循环」这类负载压满。
   * 密度由 resolution.z 控制，为 0 时整个 pass 直接返回，不产生开销。 */
  var VOLUMETRIC_FS = COMMON + `
in vec2 vUV;
layout(location = 0) out vec4 fragColor;

void main() {
  float densityScale = resolution.z;
  if (densityScale <= 0.0) { fragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }

  vec2 res = resolution.xy;
  vec2 p = (vUV * res - res * 0.5) / res.y;
  float tanHalf = 1.0 / max(viewProj[1][1], 1e-4);
  vec3 rd = normalize(camFwd.xyz + camRight.xyz * (p.x * 2.0 * tanHalf) + camUp.xyz * (p.y * 2.0 * tanHalf));
  vec3 ro = camPos.xyz;
  vec3 sunL = normalize(-sunDir.xyz);

  bool isDust = resolution.w > 0.5;
  float base = (isDust ? -6.0 : 24.0);
  float top = (isDust ? 44.0 : 86.0);
  vec3 sunCol = (isDust ? vec3(0.86, 0.62, 0.34) : vec3(1.0, 0.88, 0.70));
  vec3 ambCol = (isDust ? vec3(0.32, 0.24, 0.18) : vec3(0.30, 0.42, 0.68));
  float noiseScale = (isDust ? 0.026 : 0.011);
  vec2 drift = vec2(params.x * (isDust ? 0.05 : 0.018), params.x * 0.009);

  vec3 acc = vec3(0.0);
  float trans = 1.0;

  float t0 = 0.0;
  float t1 = 0.0;
  if (abs(rd.y) > 1e-4) {
    t0 = (base - ro.y) / rd.y;
    t1 = (top - ro.y) / rd.y;
    if (t0 > t1) { float tmp = t0; t0 = t1; t1 = tmp; }
    t0 = max(t0, 1.0);
    t1 = min(t1, 900.0);
  }

  const int STEPS = 40;
  if (t1 > t0) {
    float dt = (t1 - t0) / float(STEPS);
    float t = t0 + dt * hash21(vUV * res + vec2(params.x, 0.0));
    for (int i = 0; i < STEPS; i++) {
      vec3 cp = ro + rd * t;
      float hh = clamp((cp.y - base) / (top - base), 0.0, 1.0);
      float shape = fbm5(cp.xz * noiseScale + drift);
      float detail = fbm5(cp.xz * noiseScale * 4.3 - drift * 1.7);
      float d = shape * 0.78 + detail * 0.30;
      d = d - 0.60 + (1.0 - abs(hh * 2.0 - 1.0)) * 0.34;
      d = max(d, 0.0) * densityScale;

      if (d > 0.002) {
        // 朝太阳方向再走 4 步，估算被遮挡多少
        float shade = 0.0;
        for (int j = 1; j <= 4; j++) {
          vec3 sp = cp + sunL * (float(j) * 11.0);
          float sh = fbm5(sp.xz * noiseScale + drift);
          shade = shade + max(sh - 0.55, 0.0);
        }
        float lit = exp(-shade * 1.7) * 0.78 + 0.22;
        float stepT = exp(-d * dt * 0.055);
        acc = acc + trans * (1.0 - stepT) * (sunCol * lit * 1.05 + ambCol * 0.30);
        trans = trans * stepT;
        if (trans < 0.015) { break; }
      }
      t = t + dt;
    }
  }

  // 面朝太阳的整体散射
  float sunDot = max(dot(rd, sunL), 0.0);
  acc = acc + sunCol * pow(sunDot, 5.0) * 0.09 * densityScale;
  fragColor = vec4(acc, 1.0);
}`;

  var POST_VS = COMMON + `
out vec2 vUV;

/* 全屏三角形：无顶点缓冲，靠 gl_VertexID 生成 (-1,-1) (3,-1) (-1,3) */
void main() {
  vec2 p[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  vec2 q = p[gl_VertexID];
  gl_Position = vec4(q, 0.0, 1.0);
  vUV = q * 0.5 + vec2(0.5, 0.5);
}`;

  /* 亮度阈值提取 */
  var BRIGHT_FS = COMMON + `
uniform sampler2D srcTex;

in vec2 vUV;
layout(location = 0) out vec4 fragColor;

void main() {
  vec3 c = textureLod(srcTex, vUV, 0.0).rgb;
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float k = max(lum - 0.85, 0.0) / max(lum, 1e-4);
  fragColor = vec4(c * k, 1.0);
}`;

  /* 可分离高斯模糊：dir = (1,0) 横向 / (0,1) 纵向（循环边界常量 -4..4） */
  var BLUR_H_FS = COMMON + `
uniform sampler2D srcTex;

in vec2 vUV;
layout(location = 0) out vec4 fragColor;

vec4 blurDir(vec2 uvIn, vec2 dir) {
  vec2 texel = 1.0 / resolution.xy;
  vec3 sum = vec3(0.0);
  float wsum = 0.0;
  for (int i = -4; i <= 4; i++) {
    float fi = float(i);
    float w = exp(-fi * fi * 0.16);
    sum = sum + textureLod(srcTex, uvIn + dir * texel * fi * 2.0, 0.0).rgb * w;
    wsum = wsum + w;
  }
  return vec4(sum / wsum, 1.0);
}

void main() {
  fragColor = blurDir(vUV, vec2(1.0, 0.0));
}`;

  var BLUR_V_FS = COMMON + `
uniform sampler2D srcTex;

in vec2 vUV;
layout(location = 0) out vec4 fragColor;

vec4 blurDir(vec2 uvIn, vec2 dir) {
  vec2 texel = 1.0 / resolution.xy;
  vec3 sum = vec3(0.0);
  float wsum = 0.0;
  for (int i = -4; i <= 4; i++) {
    float fi = float(i);
    float w = exp(-fi * fi * 0.16);
    sum = sum + textureLod(srcTex, uvIn + dir * texel * fi * 2.0, 0.0).rgb * w;
    wsum = wsum + w;
  }
  return vec4(sum / wsum, 1.0);
}

void main() {
  fragColor = blurDir(vUV, vec2(0.0, 1.0));
}`;

  /* ACES 近似色调映射 */
  var COMPOSITE_FS = COMMON + `
uniform sampler2D srcTex;
uniform sampler2D bloomTex;

in vec2 vUV;
layout(location = 0) out vec4 fragColor;

/* ACES 近似色调映射 */
vec3 aces(vec3 x) {
  float a = 2.51; float b = 0.03; float c = 2.43; float d = 0.59; float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), vec3(0.0), vec3(1.0));
}

void main() {
  // 垂直翻转：整条场景序列渲染出的画面是上下颠倒的，
  // 在最后的合成 pass 统一翻回来（几何/光照/后处理全不动）
  vec2 uv = vUV;
  // 色散：R/G/B 各偏移一点点
  vec2 res = resolution.xy;
  vec2 center = uv - vec2(0.5, 0.5);
  float ca = 0.0022 * dot(center, center) * 4.0;
  float r = textureLod(srcTex, uv + center * ca, 0.0).r;
  float g = textureLod(srcTex, uv, 0.0).g;
  float b = textureLod(srcTex, uv - center * ca, 0.0).b;
  vec3 col = vec3(r, g, b);

  // bloom
  col = col + textureLod(bloomTex, uv, 0.0).rgb * params2.y;

  // 曝光 + ACES
  col = aces(col * params.z);

  // 暗角
  float d = length(center) * 1.42;
  col = col * (1.0 - clamp(d * d * 0.85, 0.0, 0.72));

  // 胶片颗粒
  float grain = hash21(uv * res + vec2(params.x * 37.0, params.x * 19.0)) - 0.5;
  col = col + grain * 0.016;

  // gamma
  fragColor = vec4(pow(max(col, vec3(0.0)), vec3(1.0 / 2.2)), 1.0);
}`;

  S.glsl = {
    COMMON: COMMON,
    FULLSCREEN_VS: FULLSCREEN_VS,

    SHADOW_VS: SHADOW_VS,
    SHADOW_VS_TERRAIN: SHADOW_VS_TERRAIN,
    SHADOW_VS_ROCK: SHADOW_VS_ROCK,
    SHADOW_FS: SHADOW_FS,

    BACKGROUND_VS: BACKGROUND_VS,
    BACKGROUND_FS: BACKGROUND_FS,

    MAIN_VS: MAIN_VS,
    MAIN_VS_TERRAIN: MAIN_VS_TERRAIN,
    MAIN_VS_ROCK: MAIN_VS_ROCK,
    MAIN_VS_CITY: MAIN_VS_CITY,
    MAIN_FS: MAIN_FS,

    PARTICLE_VS: PARTICLE_VS,
    PARTICLE_FS: PARTICLE_FS,

    VOLUMETRIC_VS: VOLUMETRIC_VS,
    VOLUMETRIC_FS: VOLUMETRIC_FS,

    POST_VS: POST_VS,
    BRIGHT_FS: BRIGHT_FS,
    BLUR_H_FS: BLUR_H_FS,
    BLUR_V_FS: BLUR_V_FS,
    COMPOSITE_FS: COMPOSITE_FS,

    UNIFORM_FLOATS: 96,
    UNIFORM_BYTES: 384
  };

})(window);
