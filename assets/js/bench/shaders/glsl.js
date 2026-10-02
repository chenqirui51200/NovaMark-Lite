/* ============================================================================
 * NovaMark · GLSL ES 3.00 着色器库（WebGL2 后端）
 * WebGL2 没有计算着色器，通用计算类测试用「片元 ALU / 纹理吞吐」等价替代，
 * 报告中会明确标注后端差异。
 * ==========================================================================*/
(function (global) {
  'use strict';

  var Nova = global.Nova = global.Nova || {};

  var HEAD = '#version 300 es\nprecision highp float;\nprecision highp int;\n';

  /* 全屏三角形顶点着色器（无需 VBO） */
  var FULLSCREEN_VS = HEAD + `
out vec2 vUV;
void main() {
  vec2 p = vec2((gl_VertexID == 1) ? 3.0 : -1.0, (gl_VertexID == 2) ? 3.0 : -1.0);
  vUV = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}`;

  /* ---------------------- 1. 填充率 ---------------------- */
  var FILL_FS = HEAD + `
in vec2 vUV;
uniform vec4 uParams;   // x=alpha, y=time, z=width, dpr, w=height
out vec4 fragColor;
void main() {
  vec2 uv = vUV;
  float g = uv.x * 0.55 + uv.y * 0.45;
  float d = float((uint(gl_FragCoord.x) ^ uint(gl_FragCoord.y)) & 7u) * 0.0035;
  fragColor = vec4(g + d, 1.0 - g * 0.6, 0.35 + g * 0.4, uParams.x);
}`;

  /* ---------------------- 2. 几何吞吐 ---------------------- */
  var GEOMETRY_VS = HEAD + `
uniform vec4 uParams;   // x=instances, y=time, z=width, w=height
uniform vec4 uGeom;     // x=triSize
out vec3 vCol;
float hash11(float p) {
  float x = fract(p * 0.1031);
  x *= x + 33.33;
  x *= x + x;
  return fract(x);
}
void main() {
  float W = uParams.z, H = uParams.w;
  float total = uParams.x;
  float ii = float(gl_InstanceID);
  float rnd = hash11(ii * 0.719 + 0.37);
  float rnd2 = hash11(ii * 1.913 + 7.13);
  float cols = ceil(sqrt(total));
  float cx = mod(ii, cols);
  float cy = floor(ii / cols);
  float cell = min(W, H) / cols;
  vec2 px = vec2((cx + 0.5 + (rnd - 0.5) * 0.6) * cell,
                 (cy + 0.5 + (rnd2 - 0.5) * 0.6) * cell);
  float size = uGeom.x * (0.7 + rnd * 0.6);
  float ang = uParams.y * (1.2 + rnd * 2.0) + float(gl_VertexID) * 2.0943951;
  float ca = cos(ang), sa = sin(ang);
  vec2 local = vec2(0.0);
  if (gl_VertexID == 1) local = vec2(size, 0.0);
  else if (gl_VertexID == 2) local = vec2(size * 0.5, size * 0.866);
  local = vec2(local.x * ca - local.y * sa, local.x * sa + local.y * ca);
  vec2 ndc = vec2(px.x / W * 2.0 - 1.0, 1.0 - px.y / H * 2.0);
  vec2 off = vec2(local.x / W * 2.0, -local.y / H * 2.0);
  gl_Position = vec4(ndc + off, 0.0, 1.0);
  vCol = vec3(0.25, 0.85, 0.95);
}`;

  var GEOMETRY_FS = HEAD + `
in vec3 vCol;
out vec4 fragColor;
void main() { fragColor = vec4(vCol, 0.55); }`;

  /* ---------------------- 3. 纹理采样 ---------------------- */
  var TEXTURE_FS = HEAD + `
in vec2 vUV;
uniform highp sampler2D uTex;
uniform vec4 uParams;   // x=taps, y=time, z=width, w=height
out vec4 fragColor;
void main() {
  vec2 base = vUV + vec2(uParams.y * 0.013, uParams.y * 0.021);
  float texel = 1.0 / max(float(textureSize(uTex, 0).x), 1.0);
  // 每 tap 只做一次旋转（常量 cos/sin）+ 一次乘加，绝不在循环里算三角函数；
  // 偏移控制在几个 texel 内，测的是采样单元吞吐而不是 ALU 或显存延迟。
  vec2 rot = vec2(0.9335804, 0.3583679);
  vec2 dir = vec2(1.0, 0.0);
  vec4 acc = vec4(0.0);
  int taps = int(uParams.x);
  for (int i = 0; i < taps; i++) {
    acc += textureLod(uTex, base + dir * (texel * 1.75), 0.0);
    dir = vec2(dir.x * rot.x - dir.y * rot.y, dir.x * rot.y + dir.y * rot.x);
  }
  fragColor = acc * (1.0 / float(taps));
}`;

  /* ---------------------- 4. 复杂着色器（Mandelbulb 体积光线步进） ---------------------- */
  var SHADER_FS = HEAD + `
in vec2 vUV;
uniform vec4 uParams;   // x=steps, y=time, z=width, w=height
uniform vec4 uShape;    // x=power, y=zoom
out vec4 fragColor;

float mandelbulb(vec3 pos, float power) {
  vec3 z = pos;
  float dr = 1.0;
  float r = 0.0;
  for (int i = 0; i < 8; i++) {
    r = length(z);
    if (r > 2.0) break;
    float rr = max(r, 1e-6);
    float theta = acos(clamp(z.z / rr, -1.0, 1.0));
    float phi = atan(z.y, z.x);
    dr = pow(rr, power - 1.0) * power * dr + 1.0;
    float zr = pow(rr, power);
    float st = sin(theta * power);
    float ct = cos(theta * power);
    z = zr * vec3(st * cos(phi * power), st * sin(phi * power), ct) + pos;
  }
  return 0.5 * log(max(r, 1e-6)) * r / dr;
}

float sceneDE(vec3 p, float power, float zoom) {
  return mandelbulb(p * zoom, power) / zoom;
}

void main() {
  vec2 res = uParams.zw;
  vec2 uv = (gl_FragCoord.xy * 2.0 - res) / res.y;
  float ang = uParams.y * 0.35;
  vec3 ro = vec3(sin(ang) * 1.15, 0.22, -cos(ang) * 1.15);
  vec3 fwd = normalize(-ro);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), fwd));
  vec3 up = cross(fwd, right);
  vec3 rd = normalize(fwd * 1.5 + right * uv.x + up * uv.y);

  float t = 0.0;
  bool hit = false;
  int steps = int(uParams.x);
  for (int i = 0; i < steps; i++) {
    vec3 p = ro + rd * t;
    float d = sceneDE(p, uShape.x, uShape.y);
    if (d < 0.00035 * t) { hit = true; break; }
    t += d * 0.9;
    if (t > 5.0) break;
  }

  vec3 col = vec3(0.02, 0.035, 0.07);
  if (hit) {
    vec3 p = ro + rd * t;
    vec2 e = vec2(0.0012, 0.0);
    float nx = sceneDE(p + e.xyy, uShape.x, uShape.y) - sceneDE(p - e.xyy, uShape.x, uShape.y);
    float ny = sceneDE(p + e.yxy, uShape.x, uShape.y) - sceneDE(p - e.yxy, uShape.x, uShape.y);
    float nz = sceneDE(p + e.yyx, uShape.x, uShape.y) - sceneDE(p - e.yyx, uShape.x, uShape.y);
    vec3 n = normalize(vec3(nx, ny, nz));
    vec3 l1 = normalize(vec3(1.4, 0.9, -0.6));
    vec3 l2 = normalize(vec3(-0.8, 0.4, 0.7));
    float d1 = max(dot(n, l1), 0.0);
    float d2 = max(dot(n, l2), 0.0);
    float rim = pow(1.0 - max(dot(n, -rd), 0.0), 3.5);
    float shadow = clamp(1.0 - t / 5.5, 0.0, 1.0);
    col = vec3(0.05, 0.07, 0.11)
        + vec3(0.16, 0.86, 1.0) * d1 * 1.05 * shadow
        + vec3(0.86, 0.34, 0.96) * d2 * 0.75
        + vec3(0.45, 0.92, 1.0) * rim * 0.9;
  }
  col = col / (col + vec3(1.0));
  fragColor = vec4(pow(col, vec3(0.4545)), 1.0);
}`;

  /* ---------------------- 5. 纯 ALU（FMA 吞吐） ---------------------- */
  /* NOVA_ITER 由 JS 在编译前注入 */
  var ALU_FS = HEAD + `
in vec2 vUV;
uniform vec4 uParams;   // x=迭代次数（运行时 uniform）, y=seed, z=width, w=height
out vec4 fragColor;
void main() {
  vec2 uv = gl_FragCoord.xy / uParams.zw;
  vec4 a = vec4(uv.x, uv.y, 0.31 + uv.x * 0.1, 0.72 + uv.y * 0.1);
  vec4 b = vec4(1.00013, 0.99987, 1.00021, 0.99979);
  vec4 c = vec4(0.0);
  vec4 d = vec4(0.00011, 0.00013, 0.00017, 0.00019);
  // 每轮 24 FLOP（vec4 四通道各 6 次运算）：
  //   c = c*0.99991 + a*b  -> 4 乘 + 4 乘 + 4 加 = 12
  //   a = a + c*d          -> 4 乘 + 4 加       =  8
  //   a = fract(a)         -> 4 次取小数       =  4
  //
  // fract 不是装饰：上面的递推是**常系数线性系统，存在闭式解**，编译器
  // （尤其 Apple Metal）可以把它整体折叠掉，导致 GPU 实际几乎没干活、
  // 却报出远超物理峰值的吞吐（iPhone SE 3 上 A15 报 15817 GFLOPS，理论约 1500）。
  // fract 是非线性且不连续的，闭式化不再成立，循环体必须被真实执行。
  // 同时它把 a 限制在 [0,1) 内，也避免了数值发散。
  // 循环次数由 uniform 决定，**不能用编译期 #define**：
  // 定长循环会被完全展开成 3000+ 条指令，Apple 的着色器编译器面对这种规模
  // 会降级甚至产出空程序，draw 变成空操作，于是报出高得离谱的吞吐
  // （iPhone SE 3 实测：alu 119121 GFLOPS、A15 理论约 1500）。
  // 改成运行时 uniform 后与 WGSL 后端结构一致，两边都无法展开，可比性也更好。
  int iters = int(uParams.x);
  for (int i = 0; i < iters; i++) {
    c = c * 0.99991 + a * b;
    a = a + c * d;
    a = fract(a);
  }
  fragColor = c * 1e-6 + vec4(uv, 0.0, 1.0) * 1e-6;
}`;

  /* ---------------------- 6. 整数 ALU ---------------------- */
  var INT_FS = HEAD + `
in vec2 vUV;
uniform vec4 uParams;
// 采样器也需要显式精度限定：Safari / WebKit 的 GLSL 编译器会报
// "No precision specified for (usampler2D)" 而直接编译失败。
uniform highp usampler2D uMask;
out vec4 fragColor;
void main() {
  uvec2 g = uvec2(gl_FragCoord.xy);
  uint seed = texture(uMask, vUV).r ^ (g.x * 2654435761u) ^ (g.y * 40503u);
  uint acc = seed | 1u;
  uint b = seed ^ 0x9E3779B9u;
  // 同 ALU_FS：循环次数走 uniform，避免定长循环被完全展开导致编译器降级
  int iters = int(uParams.x);
  for (int i = 0; i < iters; i++) {
    acc = (acc * b) ^ (acc >> 7u);
    acc = acc + (b * 2654435761u);
    b = (b << 3u) | (b >> 29u);
  }
  fragColor = vec4(float(acc & 255u) / 255.0,
                   float((acc >> 8u) & 255u) / 255.0,
                   float((acc >> 16u) & 255u) / 255.0, 1.0);
}`;

  /* ---------------------- 7. 综合场景 ---------------------- */
  var SCENE_VS = HEAD + `
uniform mat4 uViewProj;
uniform vec4 uParams;    // x=time, y=count, z=exposure, w=fog
uniform vec4 uLights[8]; // 0..3 位置, 4..7 颜色

in vec3 aPos;
in vec3 aNrm;

out vec3 vNrm;
out vec3 vWPos;
out vec3 vTint;

float hash11(float p) {
  float x = fract(p * 0.1031);
  x *= x + 33.33;
  x *= x + x;
  return fract(x);
}
mat3 rotY(float a) {
  float c = cos(a), s = sin(a);
  return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
}
mat3 rotX(float a) {
  float c = cos(a), s = sin(a);
  return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c);
}

void main() {
  float ii = float(gl_InstanceID);
  float a = hash11(ii * 0.7311 + 0.17);
  float b = hash11(ii * 1.3177 + 3.71);
  float c = hash11(ii * 2.1139 + 9.23);
  float ring = floor(hash11(ii * 0.311 + 4.4) * 3.0);
  float radius = 2.4 + ring * 2.1 + a * 2.2;
  float angle = ii * 2.3999632 + uParams.x * (0.12 + ring * 0.05);
  float height = (b - 0.5) * 3.4 + sin(ii * 0.31 + uParams.x * 0.8) * 0.35;
  float scale = 0.13 + c * c * 0.24;
  mat3 rot = rotY(angle * 1.7 + uParams.x * 0.35) * rotX(b * 6.28 + uParams.x * 0.22);
  vec3 world = vec3(cos(angle) * radius, height, sin(angle) * radius);
  vec3 lp = rot * (aPos * scale);
  vWPos = world + lp;
  vNrm = rot * aNrm;
  float t = clamp((height + 1.7) / 3.4, 0.0, 1.0);
  vTint = mix(vec3(0.15, 0.72, 0.98), vec3(0.85, 0.32, 0.86), t) * (0.7 + c * 0.6);
  gl_Position = uViewProj * vec4(vWPos, 1.0);
}`;

  var SCENE_FS = HEAD + `
in vec3 vNrm;
in vec3 vWPos;
in vec3 vTint;
uniform vec4 uParams;
uniform vec4 uLights[8];
uniform vec3 uCamPos;
out vec4 fragColor;
void main() {
  vec3 n = normalize(vNrm);
  vec3 v = normalize(uCamPos - vWPos);
  vec3 col = vec3(0.02, 0.025, 0.045);
  for (int i = 0; i < 4; i++) {
    vec3 lp = uLights[i].xyz;
    vec3 lc = uLights[i + 4].rgb;
    vec3 dd = lp - vWPos;
    float dist = length(dd);
    vec3 l = dd / max(dist, 0.0001);
    float atten = 1.0 / (1.0 + dist * dist * 0.14);
    float ndl = max(dot(n, l), 0.0);
    vec3 h = normalize(l + v);
    float spec = pow(max(dot(n, h), 0.0), 48.0);
    col += vTint * lc * ndl * atten * 1.5 + lc * spec * atten * 0.7;
  }
  float fres = pow(1.0 - max(dot(n, v), 0.0), 4.0);
  col += vec3(0.12, 0.45, 0.85) * fres * 0.55;
  float fd = length(uCamPos - vWPos) * uParams.w;
  float fog = clamp(1.0 - exp(-fd * fd * 0.02), 0.0, 0.92);
  col = mix(col, vec3(0.02, 0.04, 0.09), fog);
  col = vec3(1.0) - exp(-col * uParams.z);
  fragColor = vec4(pow(max(col, vec3(0.0)), vec3(0.4545)), 1.0);
}`;

  var SCENE_BG_FS = HEAD + `
in vec2 vUV;
uniform vec4 uParams;
out vec4 fragColor;
float hash21(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(123.34, 456.21, 789.11));
  q += dot(q, q + 45.32);
  return fract(q.x * q.y);
}
void main() {
  vec2 uv = vUV;
  float d = length(uv - vec2(0.5, 0.55));
  vec3 col = mix(vec3(0.035, 0.055, 0.11), vec3(0.01, 0.012, 0.03), smoothstep(0.1, 0.85, d));
  vec2 g = uv * 260.0;
  vec2 cell = floor(g);
  float rnd = hash21(cell);
  float star = smoothstep(0.9955, 1.0, rnd) * smoothstep(0.9, 0.0, length(fract(g) - 0.5));
  col += vec3(0.7, 0.85, 1.0) * star * 1.6;
  float band = sin(uv.x * 6.0 + uParams.x * 0.35) * 0.5 + 0.5;
  col += vec3(0.05, 0.35, 0.45) * band * smoothstep(0.9, 0.2, uv.y) * 0.35;
  fragColor = vec4(col, 1.0);
}`;

  /* ---------------------- 8. 纹理填充（上传/回读用） ---------------------- */
  var COPY_FS = HEAD + `
in vec2 vUV;
uniform highp sampler2D uTex;
out vec4 fragColor;
void main() { fragColor = texture(uTex, vUV); }`;

  Nova.shadersGLSL = {
    FULLSCREEN_VS: FULLSCREEN_VS,
    FILL_FS: FILL_FS,
    GEOMETRY_VS: GEOMETRY_VS,
    GEOMETRY_FS: GEOMETRY_FS,
    TEXTURE_FS: TEXTURE_FS,
    SHADER_FS: SHADER_FS,
    ALU_FS: ALU_FS,
    INT_FS: INT_FS,
    SCENE_VS: SCENE_VS,
    SCENE_FS: SCENE_FS,
    SCENE_BG_FS: SCENE_BG_FS,
    COPY_FS: COPY_FS
  };

})(window);
