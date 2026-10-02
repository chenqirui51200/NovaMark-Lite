/* ============================================================================
 * NovaMark 浏览器端 GPU 参考规格数据库 —— 分片：NVIDIA / AMD
 * ----------------------------------------------------------------------------
 * 形式：经典脚本（无 import / export），不访问 DOM，不写 window.NOVA_GPU_DB。
 *       仅向 window.NOVA_GPU_DB_PARTS 追加一个分片对象，由聚合器合并。
 *
 * 单位约定：
 *   fp32Tflops / fp16Tflops : TFLOPS (10^12 FLOP/s)，fp16 为非张量核心向量速率
 *   bandwidthGBs            : GB/s  (10^9 字节/s)
 *   pixelRateGps            : GPixel/s (10^9 像素/s)   = ROP 数 x 加速频率
 *   texelRateGts            : GTexel/s (10^9 纹素/s)   = TMU 数 x 加速频率
 *   vramGB / busWidth / shaderUnits / baseClockMhz / boostClockMhz
 *
 * 数据原则：仅收录公开规格；不确定的字段一律 null，绝不编造。
 * 排序：新 -> 旧；同一代内桌面在前、笔记本在后。
 * ==========================================================================*/
window.NOVA_GPU_DB_PARTS = window.NOVA_GPU_DB_PARTS || [];
window.NOVA_GPU_DB_PARTS.push({
  source: 'nvidia-amd',
  updated: '2026-10',
  gpus: [

    /* ==================================================================
     * 一、NVIDIA 桌面独显（新 -> 旧）
     * ================================================================== */

    /* ---------------------------------------------------- RTX 50 (Blackwell) */
    {
      id: 'nvidia-rtx-5090', vendor: 'NVIDIA', name: 'GeForce RTX 5090', family: 'GeForce RTX 50',
      type: 'desktop', platform: 'desktop', year: 2025, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 5090', 'GeForce RTX 5090', 'NVIDIA GeForce RTX 5090', 'NVIDIA GeForce RTX 5090 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 5090 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GB202', 'NVIDIA GB202'],
      specs: { fp32Tflops: 104.8, fp16Tflops: 104.8, bandwidthGBs: 1792, pixelRateGps: 423.6, texelRateGts: 1636.8, vramGB: 32, memType: 'GDDR7', busWidth: 512, shaderUnits: 21760, gpuCores: null, baseClockMhz: 2017, boostClockMhz: 2407 },
      note: 'GB202 满血核心（176 ROP / 680 TMU），512-bit GDDR7'
    },
    {
      id: 'nvidia-rtx-5080', vendor: 'NVIDIA', name: 'GeForce RTX 5080', family: 'GeForce RTX 50',
      type: 'desktop', platform: 'desktop', year: 2025, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 5080', 'GeForce RTX 5080', 'NVIDIA GeForce RTX 5080', 'NVIDIA GeForce RTX 5080 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 5080 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GB203', 'NVIDIA GB203'],
      specs: { fp32Tflops: 56.28, fp16Tflops: 56.28, bandwidthGBs: 960, pixelRateGps: 293.1, texelRateGts: 879.3, vramGB: 16, memType: 'GDDR7', busWidth: 256, shaderUnits: 10752, gpuCores: null, baseClockMhz: 2295, boostClockMhz: 2617 },
      note: 'GB203（112 ROP / 336 TMU），256-bit GDDR7 30 Gbps'
    },
    {
      id: 'nvidia-rtx-5070-ti', vendor: 'NVIDIA', name: 'GeForce RTX 5070 Ti', family: 'GeForce RTX 50',
      type: 'desktop', platform: 'desktop', year: 2025, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 5070 Ti', 'GeForce RTX 5070 Ti', 'NVIDIA GeForce RTX 5070 Ti', 'NVIDIA GeForce RTX 5070 Ti Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 5070 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GB203', 'NVIDIA GB203'],
      specs: { fp32Tflops: 43.94, fp16Tflops: 43.94, bandwidthGBs: 896, pixelRateGps: 235.4, texelRateGts: 686.6, vramGB: 16, memType: 'GDDR7', busWidth: 256, shaderUnits: 8960, gpuCores: null, baseClockMhz: 2295, boostClockMhz: 2452 },
      note: 'GB203 削减版（96 ROP / 280 TMU）'
    },
    {
      id: 'nvidia-rtx-5070', vendor: 'NVIDIA', name: 'GeForce RTX 5070', family: 'GeForce RTX 50',
      type: 'desktop', platform: 'desktop', year: 2025, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 5070', 'GeForce RTX 5070', 'NVIDIA GeForce RTX 5070', 'NVIDIA GeForce RTX 5070 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 5070 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GB205', 'NVIDIA GB205'],
      specs: { fp32Tflops: 30.87, fp16Tflops: 30.87, bandwidthGBs: 672, pixelRateGps: 201.0, texelRateGts: 482.3, vramGB: 12, memType: 'GDDR7', busWidth: 192, shaderUnits: 6144, gpuCores: null, baseClockMhz: 2160, boostClockMhz: 2512 },
      note: 'GB205（80 ROP / 192 TMU），192-bit GDDR7'
    },
    {
      id: 'nvidia-rtx-5060-ti', vendor: 'NVIDIA', name: 'GeForce RTX 5060 Ti', family: 'GeForce RTX 50',
      type: 'desktop', platform: 'desktop', year: 2025, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 5060 Ti', 'GeForce RTX 5060 Ti', 'NVIDIA GeForce RTX 5060 Ti', 'NVIDIA GeForce RTX 5060 Ti Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 5060 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GB206', 'NVIDIA GB206'],
      specs: { fp32Tflops: 23.70, fp16Tflops: 23.70, bandwidthGBs: 448, pixelRateGps: 123.5, texelRateGts: 370.4, vramGB: 16, memType: 'GDDR7', busWidth: 128, shaderUnits: 4608, gpuCores: null, baseClockMhz: 2407, boostClockMhz: 2572 },
      note: 'GB206（48 ROP / 144 TMU），有 8GB / 16GB 两种显存版本'
    },
    {
      id: 'nvidia-rtx-5060', vendor: 'NVIDIA', name: 'GeForce RTX 5060', family: 'GeForce RTX 50',
      type: 'desktop', platform: 'desktop', year: 2025, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 5060', 'GeForce RTX 5060', 'NVIDIA GeForce RTX 5060', 'NVIDIA GeForce RTX 5060 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 5060 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GB206', 'NVIDIA GB206'],
      specs: { fp32Tflops: 19.18, fp16Tflops: 19.18, bandwidthGBs: 448, pixelRateGps: 119.9, texelRateGts: 299.6, vramGB: 8, memType: 'GDDR7', busWidth: 128, shaderUnits: 3840, gpuCores: null, baseClockMhz: 2280, boostClockMhz: 2497 },
      note: 'GB206（48 ROP / 120 TMU）'
    },

    /* ---------------------------------------------------- RTX 40 (Ada Lovelace) */
    {
      id: 'nvidia-rtx-4090', vendor: 'NVIDIA', name: 'GeForce RTX 4090', family: 'GeForce RTX 40',
      type: 'desktop', platform: 'desktop', year: 2022, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 4090', 'GeForce RTX 4090', 'NVIDIA GeForce RTX 4090', 'NVIDIA GeForce RTX 4090 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'AD102', 'NVIDIA AD102'],
      specs: { fp32Tflops: 82.58, fp16Tflops: 82.58, bandwidthGBs: 1008, pixelRateGps: 443.5, texelRateGts: 1290.2, vramGB: 24, memType: 'GDDR6X', busWidth: 384, shaderUnits: 16384, gpuCores: null, baseClockMhz: 2235, boostClockMhz: 2520 },
      note: 'AD102（176 ROP / 512 TMU），384-bit GDDR6X 21 Gbps'
    },
    {
      id: 'nvidia-rtx-4080-super', vendor: 'NVIDIA', name: 'GeForce RTX 4080 SUPER', family: 'GeForce RTX 40',
      type: 'desktop', platform: 'desktop', year: 2024, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 4080 SUPER', 'RTX 4080 Super', 'GeForce RTX 4080 SUPER', 'NVIDIA GeForce RTX 4080 SUPER', 'NVIDIA GeForce RTX 4080 SUPER Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)', 'AD103', 'NVIDIA AD103'],
      specs: { fp32Tflops: 52.22, fp16Tflops: 52.22, bandwidthGBs: 736, pixelRateGps: 285.6, texelRateGts: 816.0, vramGB: 16, memType: 'GDDR6X', busWidth: 256, shaderUnits: 10240, gpuCores: null, baseClockMhz: 2295, boostClockMhz: 2550 },
      note: 'AD103 满血（112 ROP / 320 TMU）'
    },
    {
      id: 'nvidia-rtx-4080', vendor: 'NVIDIA', name: 'GeForce RTX 4080', family: 'GeForce RTX 40',
      type: 'desktop', platform: 'desktop', year: 2022, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 4080', 'GeForce RTX 4080', 'NVIDIA GeForce RTX 4080', 'NVIDIA GeForce RTX 4080 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'AD103', 'NVIDIA AD103'],
      specs: { fp32Tflops: 48.74, fp16Tflops: 48.74, bandwidthGBs: 717, pixelRateGps: 280.6, texelRateGts: 761.5, vramGB: 16, memType: 'GDDR6X', busWidth: 256, shaderUnits: 9728, gpuCores: null, baseClockMhz: 2205, boostClockMhz: 2505 },
      note: 'AD103（112 ROP / 304 TMU），22.4 Gbps GDDR6X'
    },
    {
      id: 'nvidia-rtx-4070-ti-super', vendor: 'NVIDIA', name: 'GeForce RTX 4070 Ti SUPER', family: 'GeForce RTX 40',
      type: 'desktop', platform: 'desktop', year: 2024, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 4070 Ti SUPER', 'RTX 4070 Ti Super', 'GeForce RTX 4070 Ti SUPER', 'NVIDIA GeForce RTX 4070 Ti SUPER', 'NVIDIA GeForce RTX 4070 Ti SUPER Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Ti SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)', 'AD103', 'NVIDIA AD103'],
      specs: { fp32Tflops: 44.10, fp16Tflops: 44.10, bandwidthGBs: 672, pixelRateGps: 292.3, texelRateGts: 689.0, vramGB: 16, memType: 'GDDR6X', busWidth: 256, shaderUnits: 8448, gpuCores: null, baseClockMhz: 2340, boostClockMhz: 2610 },
      note: 'AD103（112 ROP / 264 TMU）'
    },
    {
      id: 'nvidia-rtx-4070-ti', vendor: 'NVIDIA', name: 'GeForce RTX 4070 Ti', family: 'GeForce RTX 40',
      type: 'desktop', platform: 'desktop', year: 2023, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 4070 Ti', 'GeForce RTX 4070 Ti', 'NVIDIA GeForce RTX 4070 Ti', 'NVIDIA GeForce RTX 4070 Ti Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)', 'AD104', 'NVIDIA AD104'],
      specs: { fp32Tflops: 40.09, fp16Tflops: 40.09, bandwidthGBs: 504, pixelRateGps: 208.8, texelRateGts: 626.4, vramGB: 12, memType: 'GDDR6X', busWidth: 192, shaderUnits: 7680, gpuCores: null, baseClockMhz: 2310, boostClockMhz: 2610 },
      note: 'AD104 满血（80 ROP / 240 TMU）'
    },
    {
      id: 'nvidia-rtx-4070-super', vendor: 'NVIDIA', name: 'GeForce RTX 4070 SUPER', family: 'GeForce RTX 40',
      type: 'desktop', platform: 'desktop', year: 2024, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 4070 SUPER', 'RTX 4070 Super', 'GeForce RTX 4070 SUPER', 'NVIDIA GeForce RTX 4070 SUPER', 'NVIDIA GeForce RTX 4070 SUPER Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)', 'AD104', 'NVIDIA AD104'],
      specs: { fp32Tflops: 35.48, fp16Tflops: 35.48, bandwidthGBs: 504, pixelRateGps: 198.0, texelRateGts: 554.4, vramGB: 12, memType: 'GDDR6X', busWidth: 192, shaderUnits: 7168, gpuCores: null, baseClockMhz: 1980, boostClockMhz: 2475 },
      note: 'AD104（80 ROP / 224 TMU）'
    },
    {
      id: 'nvidia-rtx-4070', vendor: 'NVIDIA', name: 'GeForce RTX 4070', family: 'GeForce RTX 40',
      type: 'desktop', platform: 'desktop', year: 2023, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 4070', 'GeForce RTX 4070', 'NVIDIA GeForce RTX 4070', 'NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'AD104', 'NVIDIA AD104'],
      specs: { fp32Tflops: 29.15, fp16Tflops: 29.15, bandwidthGBs: 504, pixelRateGps: 158.4, texelRateGts: 455.4, vramGB: 12, memType: 'GDDR6X', busWidth: 192, shaderUnits: 5888, gpuCores: null, baseClockMhz: 1920, boostClockMhz: 2475 },
      note: 'AD104（64 ROP / 184 TMU）'
    },
    {
      id: 'nvidia-rtx-4060-ti', vendor: 'NVIDIA', name: 'GeForce RTX 4060 Ti', family: 'GeForce RTX 40',
      type: 'desktop', platform: 'desktop', year: 2023, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 4060 Ti', 'GeForce RTX 4060 Ti', 'NVIDIA GeForce RTX 4060 Ti', 'NVIDIA GeForce RTX 4060 Ti Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)', 'AD106', 'NVIDIA AD106'],
      specs: { fp32Tflops: 22.07, fp16Tflops: 22.07, bandwidthGBs: 288, pixelRateGps: 121.7, texelRateGts: 344.8, vramGB: 8, memType: 'GDDR6', busWidth: 128, shaderUnits: 4352, gpuCores: null, baseClockMhz: 2310, boostClockMhz: 2535 },
      note: 'AD106（48 ROP / 136 TMU），另有 16GB 版本'
    },
    {
      id: 'nvidia-rtx-4060', vendor: 'NVIDIA', name: 'GeForce RTX 4060', family: 'GeForce RTX 40',
      type: 'desktop', platform: 'desktop', year: 2023, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 4060', 'GeForce RTX 4060', 'NVIDIA GeForce RTX 4060', 'NVIDIA GeForce RTX 4060 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'AD107', 'NVIDIA AD107'],
      specs: { fp32Tflops: 15.11, fp16Tflops: 15.11, bandwidthGBs: 272, pixelRateGps: 118.1, texelRateGts: 236.2, vramGB: 8, memType: 'GDDR6', busWidth: 128, shaderUnits: 3072, gpuCores: null, baseClockMhz: 1830, boostClockMhz: 2460 },
      note: 'AD107 满血（48 ROP / 96 TMU）'
    },

    {
      id: 'nvidia-rtx-4060-ti-16gb', vendor: 'NVIDIA', name: 'GeForce RTX 4060 Ti 16GB', family: 'GeForce RTX 40',
      type: 'desktop', platform: 'desktop', year: 2023, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 4060 Ti 16GB', 'RTX 4060 Ti', 'GeForce RTX 4060 Ti 16GB', 'NVIDIA GeForce RTX 4060 Ti 16GB', 'NVIDIA GeForce RTX 4060 Ti 16GB Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Ti 16GB Direct3D11 vs_5_0 ps_5_0, D3D11)', 'AD106', 'NVIDIA AD106'],
      specs: { fp32Tflops: 22.07, fp16Tflops: 22.07, bandwidthGBs: 288, pixelRateGps: 121.7, texelRateGts: 344.8, vramGB: 16, memType: 'GDDR6', busWidth: 128, shaderUnits: 4352, gpuCores: null, baseClockMhz: 2310, boostClockMhz: 2535 },
      note: 'AD106（48 ROP / 136 TMU），显存翻倍版'
    },

    /* ---------------------------------------------------- RTX 30 (Ampere) */
    {
      id: 'nvidia-rtx-3090-ti', vendor: 'NVIDIA', name: 'GeForce RTX 3090 Ti', family: 'GeForce RTX 30',
      type: 'desktop', platform: 'desktop', year: 2022, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 3090 Ti', 'GeForce RTX 3090 Ti', 'NVIDIA GeForce RTX 3090 Ti', 'NVIDIA GeForce RTX 3090 Ti Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3090 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GA102', 'NVIDIA GA102'],
      specs: { fp32Tflops: 40.00, fp16Tflops: 40.00, bandwidthGBs: 1008, pixelRateGps: 208.3, texelRateGts: 625.0, vramGB: 24, memType: 'GDDR6X', busWidth: 384, shaderUnits: 10752, gpuCores: null, baseClockMhz: 1560, boostClockMhz: 1860 },
      note: 'GA102 满血（112 ROP / 336 TMU）'
    },
    {
      id: 'nvidia-rtx-3090', vendor: 'NVIDIA', name: 'GeForce RTX 3090', family: 'GeForce RTX 30',
      type: 'desktop', platform: 'desktop', year: 2020, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 3090', 'GeForce RTX 3090', 'NVIDIA GeForce RTX 3090', 'NVIDIA GeForce RTX 3090 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3090 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GA102', 'NVIDIA GA102'],
      specs: { fp32Tflops: 35.58, fp16Tflops: 35.58, bandwidthGBs: 936, pixelRateGps: 189.8, texelRateGts: 556.0, vramGB: 24, memType: 'GDDR6X', busWidth: 384, shaderUnits: 10496, gpuCores: null, baseClockMhz: 1395, boostClockMhz: 1695 },
      note: 'GA102（112 ROP / 328 TMU），19.5 Gbps GDDR6X'
    },
    {
      id: 'nvidia-rtx-3080-ti', vendor: 'NVIDIA', name: 'GeForce RTX 3080 Ti', family: 'GeForce RTX 30',
      type: 'desktop', platform: 'desktop', year: 2021, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 3080 Ti', 'GeForce RTX 3080 Ti', 'NVIDIA GeForce RTX 3080 Ti', 'NVIDIA GeForce RTX 3080 Ti Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GA102', 'NVIDIA GA102'],
      specs: { fp32Tflops: 34.10, fp16Tflops: 34.10, bandwidthGBs: 912, pixelRateGps: 186.5, texelRateGts: 532.8, vramGB: 12, memType: 'GDDR6X', busWidth: 384, shaderUnits: 10240, gpuCores: null, baseClockMhz: 1365, boostClockMhz: 1665 },
      note: 'GA102（112 ROP / 320 TMU）'
    },
    {
      id: 'nvidia-rtx-3080', vendor: 'NVIDIA', name: 'GeForce RTX 3080', family: 'GeForce RTX 30',
      type: 'desktop', platform: 'desktop', year: 2020, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 3080', 'GeForce RTX 3080', 'NVIDIA GeForce RTX 3080', 'NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GA102', 'NVIDIA GA102'],
      specs: { fp32Tflops: 29.77, fp16Tflops: 29.77, bandwidthGBs: 760, pixelRateGps: 164.2, texelRateGts: 465.1, vramGB: 10, memType: 'GDDR6X', busWidth: 320, shaderUnits: 8704, gpuCores: null, baseClockMhz: 1440, boostClockMhz: 1710 },
      note: 'GA102（96 ROP / 272 TMU）'
    },
    {
      id: 'nvidia-rtx-3080-12gb', vendor: 'NVIDIA', name: 'GeForce RTX 3080 12GB', family: 'GeForce RTX 30',
      type: 'desktop', platform: 'desktop', year: 2022, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 3080 12GB', 'GeForce RTX 3080 12GB', 'NVIDIA GeForce RTX 3080 12GB', 'NVIDIA GeForce RTX 3080 12GB Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 12GB Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GA102', 'NVIDIA GA102'],
      specs: { fp32Tflops: 30.64, fp16Tflops: 30.64, bandwidthGBs: 912, pixelRateGps: 191.5, texelRateGts: 478.8, vramGB: 12, memType: 'GDDR6X', busWidth: 384, shaderUnits: 8960, gpuCores: null, baseClockMhz: 1260, boostClockMhz: 1710 },
      note: '2022 年追加版本，384-bit 384 GB/s+ 显存带宽'
    },
    {
      id: 'nvidia-rtx-3070-ti', vendor: 'NVIDIA', name: 'GeForce RTX 3070 Ti', family: 'GeForce RTX 30',
      type: 'desktop', platform: 'desktop', year: 2021, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 3070 Ti', 'GeForce RTX 3070 Ti', 'NVIDIA GeForce RTX 3070 Ti', 'NVIDIA GeForce RTX 3070 Ti Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GA104', 'NVIDIA GA104'],
      specs: { fp32Tflops: 21.75, fp16Tflops: 21.75, bandwidthGBs: 608, pixelRateGps: 169.9, texelRateGts: 339.8, vramGB: 8, memType: 'GDDR6X', busWidth: 256, shaderUnits: 6144, gpuCores: null, baseClockMhz: 1575, boostClockMhz: 1770 },
      note: 'GA104 满血（96 ROP / 192 TMU）'
    },
    {
      id: 'nvidia-rtx-3070', vendor: 'NVIDIA', name: 'GeForce RTX 3070', family: 'GeForce RTX 30',
      type: 'desktop', platform: 'desktop', year: 2020, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 3070', 'GeForce RTX 3070', 'NVIDIA GeForce RTX 3070', 'NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GA104', 'NVIDIA GA104'],
      specs: { fp32Tflops: 20.31, fp16Tflops: 20.31, bandwidthGBs: 448, pixelRateGps: 165.6, texelRateGts: 317.4, vramGB: 8, memType: 'GDDR6', busWidth: 256, shaderUnits: 5888, gpuCores: null, baseClockMhz: 1500, boostClockMhz: 1725 },
      note: 'GA104（96 ROP / 184 TMU），14 Gbps GDDR6'
    },
    {
      id: 'nvidia-rtx-3060-ti', vendor: 'NVIDIA', name: 'GeForce RTX 3060 Ti', family: 'GeForce RTX 30',
      type: 'desktop', platform: 'desktop', year: 2020, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 3060 Ti', 'GeForce RTX 3060 Ti', 'NVIDIA GeForce RTX 3060 Ti', 'NVIDIA GeForce RTX 3060 Ti Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GA104', 'NVIDIA GA104'],
      specs: { fp32Tflops: 16.20, fp16Tflops: 16.20, bandwidthGBs: 448, pixelRateGps: 133.2, texelRateGts: 253.1, vramGB: 8, memType: 'GDDR6', busWidth: 256, shaderUnits: 4864, gpuCores: null, baseClockMhz: 1410, boostClockMhz: 1665 },
      note: 'GA104（80 ROP / 152 TMU）'
    },
    {
      id: 'nvidia-rtx-3060', vendor: 'NVIDIA', name: 'GeForce RTX 3060', family: 'GeForce RTX 30',
      type: 'desktop', platform: 'desktop', year: 2021, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 3060', 'GeForce RTX 3060', 'NVIDIA GeForce RTX 3060', 'NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GA106', 'NVIDIA GA106'],
      specs: { fp32Tflops: 12.74, fp16Tflops: 12.74, bandwidthGBs: 360, pixelRateGps: 85.3, texelRateGts: 199.0, vramGB: 12, memType: 'GDDR6', busWidth: 192, shaderUnits: 3584, gpuCores: null, baseClockMhz: 1320, boostClockMhz: 1777 },
      note: 'GA106（48 ROP / 112 TMU）；另有 8GB 版本（128-bit）'
    },
    {
      id: 'nvidia-rtx-3050', vendor: 'NVIDIA', name: 'GeForce RTX 3050', family: 'GeForce RTX 30',
      type: 'desktop', platform: 'desktop', year: 2022, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 3050', 'GeForce RTX 3050', 'NVIDIA GeForce RTX 3050', 'NVIDIA GeForce RTX 3050 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3050 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GA106', 'NVIDIA GA106'],
      specs: { fp32Tflops: 9.10, fp16Tflops: 9.10, bandwidthGBs: 224, pixelRateGps: 56.9, texelRateGts: 142.2, vramGB: 8, memType: 'GDDR6', busWidth: 128, shaderUnits: 2560, gpuCores: null, baseClockMhz: 1552, boostClockMhz: 1777 },
      note: 'GA106（32 ROP / 80 TMU）；2024 年另有 6GB / 96-bit 版本'
    },

    {
      id: 'nvidia-rtx-3060-8gb', vendor: 'NVIDIA', name: 'GeForce RTX 3060 8GB', family: 'GeForce RTX 30',
      type: 'desktop', platform: 'desktop', year: 2022, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 3060 8GB', 'GeForce RTX 3060 8GB', 'NVIDIA GeForce RTX 3060 8GB', 'NVIDIA GeForce RTX 3060 8GB Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 8GB Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GA106', 'NVIDIA GA106'],
      specs: { fp32Tflops: 12.74, fp16Tflops: 12.74, bandwidthGBs: 240, pixelRateGps: 85.3, texelRateGts: 199.0, vramGB: 8, memType: 'GDDR6', busWidth: 128, shaderUnits: 3584, gpuCores: null, baseClockMhz: 1320, boostClockMhz: 1777 },
      note: 'GA106，128-bit 8GB（带宽比 12GB 版低）'
    },
    {
      id: 'nvidia-rtx-3050-6gb', vendor: 'NVIDIA', name: 'GeForce RTX 3050 6GB', family: 'GeForce RTX 30',
      type: 'desktop', platform: 'desktop', year: 2024, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 3050 6GB', 'GeForce RTX 3050 6GB', 'NVIDIA GeForce RTX 3050 6GB', 'NVIDIA GeForce RTX 3050 6GB Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3050 6GB Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GA107', 'NVIDIA GA107'],
      specs: { fp32Tflops: 6.77, fp16Tflops: 6.77, bandwidthGBs: 168, pixelRateGps: 47.0, texelRateGts: 105.8, vramGB: 6, memType: 'GDDR6', busWidth: 96, shaderUnits: 2304, gpuCores: null, baseClockMhz: null, boostClockMhz: 1470 },
      note: 'GA107（32 ROP / 72 TMU），96-bit 6GB，70W 无需外接供电'
    },

    /* ---------------------------------------------------- RTX 20 (Turing) */
    {
      id: 'nvidia-rtx-2080-ti', vendor: 'NVIDIA', name: 'GeForce RTX 2080 Ti', family: 'GeForce RTX 20',
      type: 'desktop', platform: 'desktop', year: 2018, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 2080 Ti', 'GeForce RTX 2080 Ti', 'NVIDIA GeForce RTX 2080 Ti', 'NVIDIA GeForce RTX 2080 Ti Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 2080 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)', 'TU102', 'NVIDIA TU102'],
      specs: { fp32Tflops: 13.45, fp16Tflops: 13.45, bandwidthGBs: 616, pixelRateGps: 136.0, texelRateGts: 420.2, vramGB: 11, memType: 'GDDR6', busWidth: 352, shaderUnits: 4352, gpuCores: null, baseClockMhz: 1350, boostClockMhz: 1545 },
      note: 'TU102（88 ROP / 272 TMU），14 Gbps GDDR6'
    },
    {
      id: 'nvidia-rtx-2080-super', vendor: 'NVIDIA', name: 'GeForce RTX 2080 SUPER', family: 'GeForce RTX 20',
      type: 'desktop', platform: 'desktop', year: 2019, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 2080 SUPER', 'RTX 2080 Super', 'GeForce RTX 2080 SUPER', 'NVIDIA GeForce RTX 2080 SUPER', 'NVIDIA GeForce RTX 2080 SUPER Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 2080 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)', 'TU104', 'NVIDIA TU104'],
      specs: { fp32Tflops: 11.15, fp16Tflops: 11.15, bandwidthGBs: 496, pixelRateGps: 116.2, texelRateGts: 348.5, vramGB: 8, memType: 'GDDR6', busWidth: 256, shaderUnits: 3072, gpuCores: null, baseClockMhz: 1650, boostClockMhz: 1815 },
      note: 'TU104 满血（64 ROP / 192 TMU），15.5 Gbps GDDR6'
    },
    {
      id: 'nvidia-rtx-2080', vendor: 'NVIDIA', name: 'GeForce RTX 2080', family: 'GeForce RTX 20',
      type: 'desktop', platform: 'desktop', year: 2018, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 2080', 'GeForce RTX 2080', 'NVIDIA GeForce RTX 2080', 'NVIDIA GeForce RTX 2080 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 2080 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'TU104', 'NVIDIA TU104'],
      specs: { fp32Tflops: 10.07, fp16Tflops: 10.07, bandwidthGBs: 448, pixelRateGps: 109.4, texelRateGts: 314.6, vramGB: 8, memType: 'GDDR6', busWidth: 256, shaderUnits: 2944, gpuCores: null, baseClockMhz: 1515, boostClockMhz: 1710 },
      note: 'TU104（64 ROP / 184 TMU）；公版 FE 加速频率 1800 MHz'
    },
    {
      id: 'nvidia-rtx-2070-super', vendor: 'NVIDIA', name: 'GeForce RTX 2070 SUPER', family: 'GeForce RTX 20',
      type: 'desktop', platform: 'desktop', year: 2019, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 2070 SUPER', 'RTX 2070 Super', 'GeForce RTX 2070 SUPER', 'NVIDIA GeForce RTX 2070 SUPER', 'NVIDIA GeForce RTX 2070 SUPER Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 2070 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)', 'TU104', 'NVIDIA TU104'],
      specs: { fp32Tflops: 9.06, fp16Tflops: 9.06, bandwidthGBs: 448, pixelRateGps: 113.3, texelRateGts: 283.2, vramGB: 8, memType: 'GDDR6', busWidth: 256, shaderUnits: 2560, gpuCores: null, baseClockMhz: 1605, boostClockMhz: 1770 },
      note: 'TU104（64 ROP / 160 TMU）'
    },
    {
      id: 'nvidia-rtx-2070', vendor: 'NVIDIA', name: 'GeForce RTX 2070', family: 'GeForce RTX 20',
      type: 'desktop', platform: 'desktop', year: 2018, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 2070', 'GeForce RTX 2070', 'NVIDIA GeForce RTX 2070', 'NVIDIA GeForce RTX 2070 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 2070 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'TU106', 'NVIDIA TU106'],
      specs: { fp32Tflops: 7.46, fp16Tflops: 7.46, bandwidthGBs: 448, pixelRateGps: 103.7, texelRateGts: 233.3, vramGB: 8, memType: 'GDDR6', busWidth: 256, shaderUnits: 2304, gpuCores: null, baseClockMhz: 1410, boostClockMhz: 1620 },
      note: 'TU106 满血（64 ROP / 144 TMU）'
    },
    {
      id: 'nvidia-rtx-2060-super', vendor: 'NVIDIA', name: 'GeForce RTX 2060 SUPER', family: 'GeForce RTX 20',
      type: 'desktop', platform: 'desktop', year: 2019, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 2060 SUPER', 'RTX 2060 Super', 'GeForce RTX 2060 SUPER', 'NVIDIA GeForce RTX 2060 SUPER', 'NVIDIA GeForce RTX 2060 SUPER Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 2060 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)', 'TU106', 'NVIDIA TU106'],
      specs: { fp32Tflops: 7.18, fp16Tflops: 7.18, bandwidthGBs: 448, pixelRateGps: 105.6, texelRateGts: 224.4, vramGB: 8, memType: 'GDDR6', busWidth: 256, shaderUnits: 2176, gpuCores: null, baseClockMhz: 1470, boostClockMhz: 1650 },
      note: 'TU106（64 ROP / 136 TMU）'
    },
    {
      id: 'nvidia-rtx-2060', vendor: 'NVIDIA', name: 'GeForce RTX 2060', family: 'GeForce RTX 20',
      type: 'desktop', platform: 'desktop', year: 2019, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 2060', 'GeForce RTX 2060', 'NVIDIA GeForce RTX 2060', 'NVIDIA GeForce RTX 2060 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 2060 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'TU106', 'NVIDIA TU106'],
      specs: { fp32Tflops: 6.45, fp16Tflops: 6.45, bandwidthGBs: 336, pixelRateGps: 80.6, texelRateGts: 201.6, vramGB: 6, memType: 'GDDR6', busWidth: 192, shaderUnits: 1920, gpuCores: null, baseClockMhz: 1365, boostClockMhz: 1680 },
      note: 'TU106（48 ROP / 120 TMU）；2021 年另有 12GB 版本'
    },
    {
      id: 'nvidia-rtx-2060-12gb', vendor: 'NVIDIA', name: 'GeForce RTX 2060 12GB', family: 'GeForce RTX 20',
      type: 'desktop', platform: 'desktop', year: 2021, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 2060 12GB', 'GeForce RTX 2060 12GB', 'NVIDIA GeForce RTX 2060 12GB', 'NVIDIA GeForce RTX 2060 12GB Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 2060 12GB Direct3D11 vs_5_0 ps_5_0, D3D11)', 'TU106', 'NVIDIA TU106'],
      specs: { fp32Tflops: 7.18, fp16Tflops: 7.18, bandwidthGBs: 336, pixelRateGps: 79.2, texelRateGts: 224.4, vramGB: 12, memType: 'GDDR6', busWidth: 192, shaderUnits: 2176, gpuCores: null, baseClockMhz: 1470, boostClockMhz: 1650 },
      note: 'TU106，2176 CUDA 核心，192-bit 12GB 显存'
    },

    /* ---------------------------------------------------- GTX 16 (Turing) */
    {
      id: 'nvidia-gtx-1660-ti', vendor: 'NVIDIA', name: 'GeForce GTX 1660 Ti', family: 'GeForce GTX 16',
      type: 'desktop', platform: 'desktop', year: 2019, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 1660 Ti', 'GeForce GTX 1660 Ti', 'NVIDIA GeForce GTX 1660 Ti', 'NVIDIA GeForce GTX 1660 Ti Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)', 'TU116', 'NVIDIA TU116'],
      specs: { fp32Tflops: 5.44, fp16Tflops: 5.44, bandwidthGBs: 288, pixelRateGps: 85.0, texelRateGts: 169.9, vramGB: 6, memType: 'GDDR6', busWidth: 192, shaderUnits: 1536, gpuCores: null, baseClockMhz: 1500, boostClockMhz: 1770 },
      note: 'TU116（48 ROP / 96 TMU），12 Gbps GDDR6'
    },
    {
      id: 'nvidia-gtx-1660-super', vendor: 'NVIDIA', name: 'GeForce GTX 1660 SUPER', family: 'GeForce GTX 16',
      type: 'desktop', platform: 'desktop', year: 2019, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 1660 SUPER', 'GTX 1660 Super', 'GeForce GTX 1660 SUPER', 'NVIDIA GeForce GTX 1660 SUPER', 'NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)', 'TU116', 'NVIDIA TU116'],
      specs: { fp32Tflops: 5.03, fp16Tflops: 5.03, bandwidthGBs: 336, pixelRateGps: 85.7, texelRateGts: 157.1, vramGB: 6, memType: 'GDDR6', busWidth: 192, shaderUnits: 1408, gpuCores: null, baseClockMhz: 1530, boostClockMhz: 1785 },
      note: 'TU116（48 ROP / 88 TMU），14 Gbps GDDR6'
    },
    {
      id: 'nvidia-gtx-1660', vendor: 'NVIDIA', name: 'GeForce GTX 1660', family: 'GeForce GTX 16',
      type: 'desktop', platform: 'desktop', year: 2019, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 1660', 'GeForce GTX 1660', 'NVIDIA GeForce GTX 1660', 'NVIDIA GeForce GTX 1660 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'TU116', 'NVIDIA TU116'],
      specs: { fp32Tflops: 5.03, fp16Tflops: 5.03, bandwidthGBs: 192, pixelRateGps: 85.7, texelRateGts: 157.1, vramGB: 6, memType: 'GDDR5', busWidth: 192, shaderUnits: 1408, gpuCores: null, baseClockMhz: 1530, boostClockMhz: 1785 },
      note: 'TU116（48 ROP / 88 TMU），8 Gbps GDDR5'
    },
    {
      id: 'nvidia-gtx-1650-super', vendor: 'NVIDIA', name: 'GeForce GTX 1650 SUPER', family: 'GeForce GTX 16',
      type: 'desktop', platform: 'desktop', year: 2019, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 1650 SUPER', 'GTX 1650 Super', 'GeForce GTX 1650 SUPER', 'NVIDIA GeForce GTX 1650 SUPER', 'NVIDIA GeForce GTX 1650 SUPER Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)', 'TU116', 'NVIDIA TU116'],
      specs: { fp32Tflops: 4.42, fp16Tflops: 4.42, bandwidthGBs: 192, pixelRateGps: 55.2, texelRateGts: 138.0, vramGB: 4, memType: 'GDDR6', busWidth: 128, shaderUnits: 1280, gpuCores: null, baseClockMhz: 1530, boostClockMhz: 1725 },
      note: 'TU116（32 ROP / 80 TMU）'
    },
    {
      id: 'nvidia-gtx-1650', vendor: 'NVIDIA', name: 'GeForce GTX 1650', family: 'GeForce GTX 16',
      type: 'desktop', platform: 'desktop', year: 2019, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 1650', 'GeForce GTX 1650', 'NVIDIA GeForce GTX 1650', 'NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'TU117', 'NVIDIA TU117'],
      specs: { fp32Tflops: 2.98, fp16Tflops: 2.98, bandwidthGBs: 128, pixelRateGps: 53.3, texelRateGts: 93.2, vramGB: 4, memType: 'GDDR5', busWidth: 128, shaderUnits: 896, gpuCores: null, baseClockMhz: 1485, boostClockMhz: 1665 },
      note: 'TU117（32 ROP / 56 TMU）；另有 GDDR6 版本（带宽 192 GB/s）'
    },
    {
      id: 'nvidia-gtx-1630', vendor: 'NVIDIA', name: 'GeForce GTX 1630', family: 'GeForce GTX 16',
      type: 'desktop', platform: 'desktop', year: 2022, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 1630', 'GeForce GTX 1630', 'NVIDIA GeForce GTX 1630', 'NVIDIA GeForce GTX 1630 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1630 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'TU117', 'NVIDIA TU117'],
      specs: { fp32Tflops: 1.83, fp16Tflops: 1.83, bandwidthGBs: 96, pixelRateGps: 28.6, texelRateGts: 57.1, vramGB: 4, memType: 'GDDR6', busWidth: 64, shaderUnits: 512, gpuCores: null, baseClockMhz: 1740, boostClockMhz: 1785 },
      note: 'TU117 削减版（16 ROP / 32 TMU），64-bit'
    },

    {
      id: 'nvidia-gtx-1650-gddr6', vendor: 'NVIDIA', name: 'GeForce GTX 1650 GDDR6', family: 'GeForce GTX 16',
      type: 'desktop', platform: 'desktop', year: 2020, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 1650 GDDR6', 'GTX 1650', 'GeForce GTX 1650 GDDR6', 'NVIDIA GeForce GTX 1650 GDDR6', 'NVIDIA GeForce GTX 1650 GDDR6 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 GDDR6 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'TU117', 'NVIDIA TU117'],
      specs: { fp32Tflops: 2.85, fp16Tflops: 2.85, bandwidthGBs: 192, pixelRateGps: 50.9, texelRateGts: 89.0, vramGB: 4, memType: 'GDDR6', busWidth: 128, shaderUnits: 896, gpuCores: null, baseClockMhz: 1410, boostClockMhz: 1590 },
      note: 'TU117（32 ROP / 56 TMU），12 Gbps GDDR6'
    },

    /* ---------------------------------------------------- GTX 10 (Pascal) */
    {
      id: 'nvidia-gtx-1080-ti', vendor: 'NVIDIA', name: 'GeForce GTX 1080 Ti', family: 'GeForce GTX 10',
      type: 'desktop', platform: 'desktop', year: 2017, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 1080 Ti', 'GeForce GTX 1080 Ti', 'NVIDIA GeForce GTX 1080 Ti', 'NVIDIA GeForce GTX 1080 Ti Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1080 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GP102', 'NVIDIA GP102'],
      specs: { fp32Tflops: 11.34, fp16Tflops: 11.34, bandwidthGBs: 484, pixelRateGps: 139.2, texelRateGts: 354.4, vramGB: 11, memType: 'GDDR5X', busWidth: 352, shaderUnits: 3584, gpuCores: null, baseClockMhz: 1480, boostClockMhz: 1582 },
      note: 'GP102（88 ROP / 224 TMU），11 Gbps GDDR5X'
    },
    {
      id: 'nvidia-gtx-1080', vendor: 'NVIDIA', name: 'GeForce GTX 1080', family: 'GeForce GTX 10',
      type: 'desktop', platform: 'desktop', year: 2016, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 1080', 'GeForce GTX 1080', 'NVIDIA GeForce GTX 1080', 'NVIDIA GeForce GTX 1080 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1080 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GP104', 'NVIDIA GP104'],
      specs: { fp32Tflops: 8.87, fp16Tflops: 8.87, bandwidthGBs: 320, pixelRateGps: 110.9, texelRateGts: 277.3, vramGB: 8, memType: 'GDDR5X', busWidth: 256, shaderUnits: 2560, gpuCores: null, baseClockMhz: 1607, boostClockMhz: 1733 },
      note: 'GP104 满血（64 ROP / 160 TMU），10 Gbps GDDR5X'
    },
    {
      id: 'nvidia-gtx-1070-ti', vendor: 'NVIDIA', name: 'GeForce GTX 1070 Ti', family: 'GeForce GTX 10',
      type: 'desktop', platform: 'desktop', year: 2017, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 1070 Ti', 'GeForce GTX 1070 Ti', 'NVIDIA GeForce GTX 1070 Ti', 'NVIDIA GeForce GTX 1070 Ti Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1070 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GP104', 'NVIDIA GP104'],
      specs: { fp32Tflops: 8.19, fp16Tflops: 8.19, bandwidthGBs: 256, pixelRateGps: 107.7, texelRateGts: 255.8, vramGB: 8, memType: 'GDDR5', busWidth: 256, shaderUnits: 2432, gpuCores: null, baseClockMhz: 1607, boostClockMhz: 1683 },
      note: 'GP104（64 ROP / 152 TMU）'
    },
    {
      id: 'nvidia-gtx-1070', vendor: 'NVIDIA', name: 'GeForce GTX 1070', family: 'GeForce GTX 10',
      type: 'desktop', platform: 'desktop', year: 2016, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 1070', 'GeForce GTX 1070', 'NVIDIA GeForce GTX 1070', 'NVIDIA GeForce GTX 1070 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1070 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GP104', 'NVIDIA GP104'],
      specs: { fp32Tflops: 6.46, fp16Tflops: 6.46, bandwidthGBs: 256, pixelRateGps: 107.7, texelRateGts: 202.0, vramGB: 8, memType: 'GDDR5', busWidth: 256, shaderUnits: 1920, gpuCores: null, baseClockMhz: 1506, boostClockMhz: 1683 },
      note: 'GP104（64 ROP / 120 TMU）'
    },
    {
      id: 'nvidia-gtx-1060-6gb', vendor: 'NVIDIA', name: 'GeForce GTX 1060 6GB', family: 'GeForce GTX 10',
      type: 'desktop', platform: 'desktop', year: 2016, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 1060', 'GTX 1060 6GB', 'GeForce GTX 1060', 'GeForce GTX 1060 6GB', 'NVIDIA GeForce GTX 1060', 'NVIDIA GeForce GTX 1060 6GB', 'NVIDIA GeForce GTX 1060 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 6GB Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GP106', 'NVIDIA GP106'],
      specs: { fp32Tflops: 4.37, fp16Tflops: 4.37, bandwidthGBs: 192, pixelRateGps: 82.0, texelRateGts: 136.6, vramGB: 6, memType: 'GDDR5', busWidth: 192, shaderUnits: 1280, gpuCores: null, baseClockMhz: 1506, boostClockMhz: 1708 },
      note: 'GP106 满血（48 ROP / 80 TMU）'
    },
    {
      id: 'nvidia-gtx-1060-3gb', vendor: 'NVIDIA', name: 'GeForce GTX 1060 3GB', family: 'GeForce GTX 10',
      type: 'desktop', platform: 'desktop', year: 2016, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 1060 3GB', 'GeForce GTX 1060 3GB', 'NVIDIA GeForce GTX 1060 3GB', 'NVIDIA GeForce GTX 1060 3GB Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 3GB Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GP106', 'NVIDIA GP106'],
      specs: { fp32Tflops: 3.94, fp16Tflops: 3.94, bandwidthGBs: 192, pixelRateGps: 82.0, texelRateGts: 123.0, vramGB: 3, memType: 'GDDR5', busWidth: 192, shaderUnits: 1152, gpuCores: null, baseClockMhz: 1506, boostClockMhz: 1708 },
      note: 'GP106 削减版（48 ROP / 72 TMU）'
    },
    {
      id: 'nvidia-gtx-1050-ti', vendor: 'NVIDIA', name: 'GeForce GTX 1050 Ti', family: 'GeForce GTX 10',
      type: 'desktop', platform: 'desktop', year: 2017, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 1050 Ti', 'GeForce GTX 1050 Ti', 'NVIDIA GeForce GTX 1050 Ti', 'NVIDIA GeForce GTX 1050 Ti Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1050 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GP107', 'NVIDIA GP107'],
      specs: { fp32Tflops: 2.14, fp16Tflops: 2.14, bandwidthGBs: 112, pixelRateGps: 44.5, texelRateGts: 66.8, vramGB: 4, memType: 'GDDR5', busWidth: 128, shaderUnits: 768, gpuCores: null, baseClockMhz: 1290, boostClockMhz: 1392 },
      note: 'GP107 满血（32 ROP / 48 TMU）'
    },
    {
      id: 'nvidia-gtx-1050', vendor: 'NVIDIA', name: 'GeForce GTX 1050', family: 'GeForce GTX 10',
      type: 'desktop', platform: 'desktop', year: 2016, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 1050', 'GeForce GTX 1050', 'NVIDIA GeForce GTX 1050', 'NVIDIA GeForce GTX 1050 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1050 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GP107', 'NVIDIA GP107'],
      specs: { fp32Tflops: 1.86, fp16Tflops: 1.86, bandwidthGBs: 112, pixelRateGps: 46.6, texelRateGts: 58.2, vramGB: 2, memType: 'GDDR5', busWidth: 128, shaderUnits: 640, gpuCores: null, baseClockMhz: 1354, boostClockMhz: 1455 },
      note: 'GP107（32 ROP / 40 TMU）'
    },
    {
      id: 'nvidia-gt-1030', vendor: 'NVIDIA', name: 'GeForce GT 1030', family: 'GeForce GTX 10',
      type: 'desktop', platform: 'desktop', year: 2017, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GT 1030', 'GeForce GT 1030', 'NVIDIA GeForce GT 1030', 'NVIDIA GeForce GT 1030 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GT 1030 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GP108', 'NVIDIA GP108'],
      specs: { fp32Tflops: 1.13, fp16Tflops: 1.13, bandwidthGBs: 48, pixelRateGps: 23.5, texelRateGts: 35.2, vramGB: 2, memType: 'GDDR5', busWidth: 64, shaderUnits: 384, gpuCores: null, baseClockMhz: 1227, boostClockMhz: 1468 },
      note: 'GP108（16 ROP / 24 TMU）；另有 DDR4 版本（带宽 16.8 GB/s）'
    },

    {
      id: 'nvidia-gtx-1060-5gb', vendor: 'NVIDIA', name: 'GeForce GTX 1060 5GB', family: 'GeForce GTX 10',
      type: 'desktop', platform: 'desktop', year: 2017, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 1060 5GB', 'GeForce GTX 1060 5GB', 'NVIDIA GeForce GTX 1060 5GB', 'NVIDIA GeForce GTX 1060 5GB Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 5GB Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GP106', 'NVIDIA GP106'],
      specs: { fp32Tflops: 4.37, fp16Tflops: 4.37, bandwidthGBs: 160, pixelRateGps: null, texelRateGts: 136.6, vramGB: 5, memType: 'GDDR5', busWidth: 160, shaderUnits: 1280, gpuCores: null, baseClockMhz: 1506, boostClockMhz: 1708 },
      note: '网吧/中国特供版本，160-bit 5GB；ROP 数未确认故像素率留 null'
    },

    /* ---------------------------------------------------- GTX 9 (Maxwell) */
    {
      id: 'nvidia-gtx-980-ti', vendor: 'NVIDIA', name: 'GeForce GTX 980 Ti', family: 'GeForce GTX 9',
      type: 'desktop', platform: 'desktop', year: 2015, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 980 Ti', 'GeForce GTX 980 Ti', 'NVIDIA GeForce GTX 980 Ti', 'NVIDIA GeForce GTX 980 Ti Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 980 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GM200', 'NVIDIA GM200'],
      specs: { fp32Tflops: 6.05, fp16Tflops: 6.05, bandwidthGBs: 336, pixelRateGps: 103.2, texelRateGts: 189.2, vramGB: 6, memType: 'GDDR5', busWidth: 384, shaderUnits: 2816, gpuCores: null, baseClockMhz: 1000, boostClockMhz: 1075 },
      note: 'GM200（96 ROP / 176 TMU），7 Gbps GDDR5'
    },
    {
      id: 'nvidia-gtx-980', vendor: 'NVIDIA', name: 'GeForce GTX 980', family: 'GeForce GTX 9',
      type: 'desktop', platform: 'desktop', year: 2014, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 980', 'GeForce GTX 980', 'NVIDIA GeForce GTX 980', 'NVIDIA GeForce GTX 980 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 980 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GM204', 'NVIDIA GM204'],
      specs: { fp32Tflops: 4.98, fp16Tflops: 4.98, bandwidthGBs: 224, pixelRateGps: 77.8, texelRateGts: 155.6, vramGB: 4, memType: 'GDDR5', busWidth: 256, shaderUnits: 2048, gpuCores: null, baseClockMhz: 1126, boostClockMhz: 1216 },
      note: 'GM204 满血（64 ROP / 128 TMU）'
    },
    {
      id: 'nvidia-gtx-970', vendor: 'NVIDIA', name: 'GeForce GTX 970', family: 'GeForce GTX 9',
      type: 'desktop', platform: 'desktop', year: 2014, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 970', 'GeForce GTX 970', 'NVIDIA GeForce GTX 970', 'NVIDIA GeForce GTX 970 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 970 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GM204', 'NVIDIA GM204'],
      specs: { fp32Tflops: 3.92, fp16Tflops: 3.92, bandwidthGBs: 224, pixelRateGps: 66.0, texelRateGts: 122.5, vramGB: 4, memType: 'GDDR5', busWidth: 256, shaderUnits: 1664, gpuCores: null, baseClockMhz: 1050, boostClockMhz: 1178 },
      note: 'GM204（56 ROP / 104 TMU），3.5GB+0.5GB 分段显存'
    },
    {
      id: 'nvidia-gtx-960', vendor: 'NVIDIA', name: 'GeForce GTX 960', family: 'GeForce GTX 9',
      type: 'desktop', platform: 'desktop', year: 2015, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 960', 'GeForce GTX 960', 'NVIDIA GeForce GTX 960', 'NVIDIA GeForce GTX 960 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 960 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GM206', 'NVIDIA GM206'],
      specs: { fp32Tflops: 2.41, fp16Tflops: 2.41, bandwidthGBs: 112, pixelRateGps: 37.7, texelRateGts: 75.4, vramGB: 2, memType: 'GDDR5', busWidth: 128, shaderUnits: 1024, gpuCores: null, baseClockMhz: 1127, boostClockMhz: 1178 },
      note: 'GM206 满血（32 ROP / 64 TMU）'
    },
    {
      id: 'nvidia-gtx-950', vendor: 'NVIDIA', name: 'GeForce GTX 950', family: 'GeForce GTX 9',
      type: 'desktop', platform: 'desktop', year: 2015, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 950', 'GeForce GTX 950', 'NVIDIA GeForce GTX 950', 'NVIDIA GeForce GTX 950 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 950 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GM206', 'NVIDIA GM206'],
      specs: { fp32Tflops: 1.82, fp16Tflops: 1.82, bandwidthGBs: 105.6, pixelRateGps: 38.0, texelRateGts: 57.0, vramGB: 2, memType: 'GDDR5', busWidth: 128, shaderUnits: 768, gpuCores: null, baseClockMhz: 1024, boostClockMhz: 1188 },
      note: 'GM206（32 ROP / 48 TMU），6.6 Gbps GDDR5'
    },

    /* ---------------------------------------------------- GTX 7 (Kepler / Maxwell) */
    {
      id: 'nvidia-gtx-780-ti', vendor: 'NVIDIA', name: 'GeForce GTX 780 Ti', family: 'GeForce GTX 7',
      type: 'desktop', platform: 'desktop', year: 2013, api: 'd3d11', apis: ['d3d11', 'd3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 780 Ti', 'GeForce GTX 780 Ti', 'NVIDIA GeForce GTX 780 Ti', 'NVIDIA GeForce GTX 780 Ti Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 780 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GK110', 'NVIDIA GK110'],
      specs: { fp32Tflops: 5.35, fp16Tflops: 5.35, bandwidthGBs: 336, pixelRateGps: 44.5, texelRateGts: 222.7, vramGB: 3, memType: 'GDDR5', busWidth: 384, shaderUnits: 2880, gpuCores: null, baseClockMhz: 875, boostClockMhz: 928 },
      note: 'GK110 满血（48 ROP / 240 TMU）'
    },
    {
      id: 'nvidia-gtx-780', vendor: 'NVIDIA', name: 'GeForce GTX 780', family: 'GeForce GTX 7',
      type: 'desktop', platform: 'desktop', year: 2013, api: 'd3d11', apis: ['d3d11', 'd3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 780', 'GeForce GTX 780', 'NVIDIA GeForce GTX 780', 'NVIDIA GeForce GTX 780 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 780 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GK110', 'NVIDIA GK110'],
      specs: { fp32Tflops: 4.15, fp16Tflops: 4.15, bandwidthGBs: 288, pixelRateGps: 43.2, texelRateGts: 172.8, vramGB: 3, memType: 'GDDR5', busWidth: 384, shaderUnits: 2304, gpuCores: null, baseClockMhz: 863, boostClockMhz: 900 },
      note: 'GK110（48 ROP / 192 TMU），6 Gbps GDDR5'
    },
    {
      id: 'nvidia-gtx-770', vendor: 'NVIDIA', name: 'GeForce GTX 770', family: 'GeForce GTX 7',
      type: 'desktop', platform: 'desktop', year: 2013, api: 'd3d11', apis: ['d3d11', 'd3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 770', 'GeForce GTX 770', 'NVIDIA GeForce GTX 770', 'NVIDIA GeForce GTX 770 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 770 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GK104', 'NVIDIA GK104'],
      specs: { fp32Tflops: 3.33, fp16Tflops: 3.33, bandwidthGBs: 224, pixelRateGps: 34.7, texelRateGts: 138.9, vramGB: 2, memType: 'GDDR5', busWidth: 256, shaderUnits: 1536, gpuCores: null, baseClockMhz: 1046, boostClockMhz: 1085 },
      note: 'GK104（32 ROP / 128 TMU），7 Gbps GDDR5'
    },
    {
      id: 'nvidia-gtx-760', vendor: 'NVIDIA', name: 'GeForce GTX 760', family: 'GeForce GTX 7',
      type: 'desktop', platform: 'desktop', year: 2013, api: 'd3d11', apis: ['d3d11', 'd3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 760', 'GeForce GTX 760', 'NVIDIA GeForce GTX 760', 'NVIDIA GeForce GTX 760 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 760 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GK104', 'NVIDIA GK104'],
      specs: { fp32Tflops: 2.38, fp16Tflops: 2.38, bandwidthGBs: 192, pixelRateGps: 33.1, texelRateGts: 99.2, vramGB: 2, memType: 'GDDR5', busWidth: 256, shaderUnits: 1152, gpuCores: null, baseClockMhz: 980, boostClockMhz: 1033 },
      note: 'GK104（32 ROP / 96 TMU），6 Gbps GDDR5'
    },
    {
      id: 'nvidia-gtx-750-ti', vendor: 'NVIDIA', name: 'GeForce GTX 750 Ti', family: 'GeForce GTX 7',
      type: 'desktop', platform: 'desktop', year: 2014, api: 'd3d11', apis: ['d3d11', 'd3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 750 Ti', 'GeForce GTX 750 Ti', 'NVIDIA GeForce GTX 750 Ti', 'NVIDIA GeForce GTX 750 Ti Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 750 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GM107', 'NVIDIA GM107'],
      specs: { fp32Tflops: 1.39, fp16Tflops: 1.39, bandwidthGBs: 86.4, pixelRateGps: 17.4, texelRateGts: 43.4, vramGB: 2, memType: 'GDDR5', busWidth: 128, shaderUnits: 640, gpuCores: null, baseClockMhz: 1020, boostClockMhz: 1085 },
      note: 'GM107（Maxwell 一代，仅 D3D 11_0；16 ROP / 40 TMU）'
    },
    {
      id: 'nvidia-gtx-750', vendor: 'NVIDIA', name: 'GeForce GTX 750', family: 'GeForce GTX 7',
      type: 'desktop', platform: 'desktop', year: 2014, api: 'd3d11', apis: ['d3d11', 'd3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 750', 'GeForce GTX 750', 'NVIDIA GeForce GTX 750', 'NVIDIA GeForce GTX 750 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 750 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GM107', 'NVIDIA GM107'],
      specs: { fp32Tflops: 1.11, fp16Tflops: 1.11, bandwidthGBs: 80, pixelRateGps: 17.4, texelRateGts: 34.7, vramGB: 1, memType: 'GDDR5', busWidth: 128, shaderUnits: 512, gpuCores: null, baseClockMhz: 1020, boostClockMhz: 1085 },
      note: 'GM107（Maxwell 一代；16 ROP / 32 TMU），有 1GB / 2GB 版本'
    },

    /* ---------------------------------------------------- GTX 6 (Kepler) */
    {
      id: 'nvidia-gtx-680', vendor: 'NVIDIA', name: 'GeForce GTX 680', family: 'GeForce GTX 6',
      type: 'desktop', platform: 'desktop', year: 2012, api: 'd3d11', apis: ['d3d11', 'd3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 680', 'GeForce GTX 680', 'NVIDIA GeForce GTX 680', 'NVIDIA GeForce GTX 680 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 680 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GK104', 'NVIDIA GK104'],
      specs: { fp32Tflops: 3.25, fp16Tflops: 3.25, bandwidthGBs: 192, pixelRateGps: 33.9, texelRateGts: 135.4, vramGB: 2, memType: 'GDDR5', busWidth: 256, shaderUnits: 1536, gpuCores: null, baseClockMhz: 1006, boostClockMhz: 1058 },
      note: 'GK104 满血（32 ROP / 128 TMU）'
    },
    {
      id: 'nvidia-gtx-670', vendor: 'NVIDIA', name: 'GeForce GTX 670', family: 'GeForce GTX 6',
      type: 'desktop', platform: 'desktop', year: 2012, api: 'd3d11', apis: ['d3d11', 'd3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 670', 'GeForce GTX 670', 'NVIDIA GeForce GTX 670', 'NVIDIA GeForce GTX 670 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 670 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GK104', 'NVIDIA GK104'],
      specs: { fp32Tflops: 2.63, fp16Tflops: 2.63, bandwidthGBs: 192, pixelRateGps: 31.4, texelRateGts: 109.8, vramGB: 2, memType: 'GDDR5', busWidth: 256, shaderUnits: 1344, gpuCores: null, baseClockMhz: 915, boostClockMhz: 980 },
      note: 'GK104（32 ROP / 112 TMU）'
    },
    {
      id: 'nvidia-gtx-660-ti', vendor: 'NVIDIA', name: 'GeForce GTX 660 Ti', family: 'GeForce GTX 6',
      type: 'desktop', platform: 'desktop', year: 2012, api: 'd3d11', apis: ['d3d11', 'd3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 660 Ti', 'GeForce GTX 660 Ti', 'NVIDIA GeForce GTX 660 Ti', 'NVIDIA GeForce GTX 660 Ti Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 660 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GK104', 'NVIDIA GK104'],
      specs: { fp32Tflops: 2.63, fp16Tflops: 2.63, bandwidthGBs: 144, pixelRateGps: 23.5, texelRateGts: 109.8, vramGB: 2, memType: 'GDDR5', busWidth: 192, shaderUnits: 1344, gpuCores: null, baseClockMhz: 915, boostClockMhz: 980 },
      note: 'GK104（24 ROP / 112 TMU），192-bit'
    },
    {
      id: 'nvidia-gtx-660', vendor: 'NVIDIA', name: 'GeForce GTX 660', family: 'GeForce GTX 6',
      type: 'desktop', platform: 'desktop', year: 2012, api: 'd3d11', apis: ['d3d11', 'd3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 660', 'GeForce GTX 660', 'NVIDIA GeForce GTX 660', 'NVIDIA GeForce GTX 660 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 660 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GK106', 'NVIDIA GK106'],
      specs: { fp32Tflops: 1.98, fp16Tflops: 1.98, bandwidthGBs: 144, pixelRateGps: 24.8, texelRateGts: 82.6, vramGB: 2, memType: 'GDDR5', busWidth: 192, shaderUnits: 960, gpuCores: null, baseClockMhz: 980, boostClockMhz: 1033 },
      note: 'GK106（24 ROP / 80 TMU）'
    },
    {
      id: 'nvidia-gtx-650-ti', vendor: 'NVIDIA', name: 'GeForce GTX 650 Ti', family: 'GeForce GTX 6',
      type: 'desktop', platform: 'desktop', year: 2012, api: 'd3d11', apis: ['d3d11', 'd3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 650 Ti', 'GeForce GTX 650 Ti', 'NVIDIA GeForce GTX 650 Ti', 'NVIDIA GeForce GTX 650 Ti Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 650 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GK106', 'NVIDIA GK106'],
      specs: { fp32Tflops: 1.43, fp16Tflops: 1.43, bandwidthGBs: 86.4, pixelRateGps: 14.8, texelRateGts: 59.4, vramGB: 1, memType: 'GDDR5', busWidth: 128, shaderUnits: 768, gpuCores: null, baseClockMhz: 928, boostClockMhz: 928 },
      note: 'GK106（16 ROP / 64 TMU），无加速频率'
    },
    {
      id: 'nvidia-gtx-650', vendor: 'NVIDIA', name: 'GeForce GTX 650', family: 'GeForce GTX 6',
      type: 'desktop', platform: 'desktop', year: 2012, api: 'd3d11', apis: ['d3d11', 'd3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 650', 'GeForce GTX 650', 'NVIDIA GeForce GTX 650', 'NVIDIA GeForce GTX 650 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 650 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GK107', 'NVIDIA GK107'],
      specs: { fp32Tflops: 0.81, fp16Tflops: 0.81, bandwidthGBs: 80, pixelRateGps: 16.9, texelRateGts: 33.9, vramGB: 1, memType: 'GDDR5', busWidth: 128, shaderUnits: 384, gpuCores: null, baseClockMhz: 1058, boostClockMhz: 1058 },
      note: 'GK107（16 ROP / 32 TMU），5 Gbps GDDR5'
    },

    /* ---------------------------------------------------- Titan 系列 */
    {
      id: 'nvidia-titan-xp', vendor: 'NVIDIA', name: 'NVIDIA Titan Xp', family: 'GeForce Titan',
      type: 'desktop', platform: 'desktop', year: 2017, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['Titan Xp', 'NVIDIA Titan Xp', 'GeForce GTX Titan Xp', 'NVIDIA Titan Xp Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA Titan Xp Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GP102', 'NVIDIA GP102'],
      specs: { fp32Tflops: 12.15, fp16Tflops: 12.15, bandwidthGBs: 547.6, pixelRateGps: 151.9, texelRateGts: 379.7, vramGB: 12, memType: 'GDDR5X', busWidth: 384, shaderUnits: 3840, gpuCores: null, baseClockMhz: 1405, boostClockMhz: 1582 },
      note: 'GP102（96 ROP / 240 TMU），11.4 Gbps GDDR5X'
    },
    {
      id: 'nvidia-titan-x-pascal', vendor: 'NVIDIA', name: 'NVIDIA Titan X (Pascal)', family: 'GeForce Titan',
      type: 'desktop', platform: 'desktop', year: 2016, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['Titan X Pascal', 'NVIDIA Titan X Pascal', 'NVIDIA Titan X (Pascal)', 'NVIDIA Titan X Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA Titan X (Pascal) Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GP102', 'NVIDIA GP102'],
      specs: { fp32Tflops: 10.97, fp16Tflops: 10.97, bandwidthGBs: 480, pixelRateGps: 147.0, texelRateGts: 342.9, vramGB: 12, memType: 'GDDR5X', busWidth: 384, shaderUnits: 3584, gpuCores: null, baseClockMhz: 1417, boostClockMhz: 1531 },
      note: 'GP102（96 ROP / 224 TMU），10 Gbps GDDR5X'
    },
    {
      id: 'nvidia-titan-x-maxwell', vendor: 'NVIDIA', name: 'NVIDIA Titan X (Maxwell)', family: 'GeForce Titan',
      type: 'desktop', platform: 'desktop', year: 2015, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['Titan X Maxwell', 'NVIDIA Titan X Maxwell', 'NVIDIA Titan X (Maxwell)', 'NVIDIA Titan X Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA Titan X (Maxwell) Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GM200', 'NVIDIA GM200'],
      specs: { fp32Tflops: 6.60, fp16Tflops: 6.60, bandwidthGBs: 336.5, pixelRateGps: 103.2, texelRateGts: 206.4, vramGB: 12, memType: 'GDDR5', busWidth: 384, shaderUnits: 3072, gpuCores: null, baseClockMhz: 1000, boostClockMhz: 1075 },
      note: 'GM200 满血（96 ROP / 192 TMU）'
    },
    {
      id: 'nvidia-titan-v', vendor: 'NVIDIA', name: 'NVIDIA Titan V', family: 'GeForce Titan',
      type: 'desktop', platform: 'desktop', year: 2017, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['Titan V', 'NVIDIA Titan V', 'NVIDIA TITAN V', 'NVIDIA Titan V Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA Titan V Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GV100', 'NVIDIA GV100'],
      specs: { fp32Tflops: 14.90, fp16Tflops: 29.80, bandwidthGBs: 652.8, pixelRateGps: 139.7, texelRateGts: 465.6, vramGB: 12, memType: 'HBM2', busWidth: 3072, shaderUnits: 5120, gpuCores: null, baseClockMhz: 1200, boostClockMhz: 1455 },
      note: 'GV100（Volta，96 ROP / 320 TMU），向量 FP16 为 FP32 的 2 倍'
    },
    {
      id: 'nvidia-rtx-titan', vendor: 'NVIDIA', name: 'NVIDIA TITAN RTX', family: 'GeForce Titan',
      type: 'desktop', platform: 'desktop', year: 2018, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['TITAN RTX', 'Titan RTX', 'NVIDIA TITAN RTX', 'NVIDIA TITAN RTX Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA TITAN RTX Direct3D11 vs_5_0 ps_5_0, D3D11)', 'TU102', 'NVIDIA TU102'],
      specs: { fp32Tflops: 16.31, fp16Tflops: 16.31, bandwidthGBs: 672, pixelRateGps: 169.9, texelRateGts: 509.8, vramGB: 24, memType: 'GDDR6', busWidth: 384, shaderUnits: 4608, gpuCores: null, baseClockMhz: 1350, boostClockMhz: 1770 },
      note: 'TU102 满血（96 ROP / 288 TMU），14 Gbps GDDR6'
    },

    {
      id: 'nvidia-gtx-titan-black', vendor: 'NVIDIA', name: 'GeForce GTX Titan Black', family: 'GeForce Titan',
      type: 'desktop', platform: 'desktop', year: 2014, api: 'd3d11', apis: ['d3d11', 'd3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX Titan Black', 'GeForce GTX Titan Black', 'NVIDIA GeForce GTX Titan Black', 'NVIDIA GeForce GTX Titan Black Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX Titan Black Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GK110', 'NVIDIA GK110'],
      specs: { fp32Tflops: 5.65, fp16Tflops: 5.65, bandwidthGBs: 336, pixelRateGps: 47.0, texelRateGts: 219.5, vramGB: 6, memType: 'GDDR5', busWidth: 384, shaderUnits: 2880, gpuCores: null, baseClockMhz: 889, boostClockMhz: 980 },
      note: 'GK110 满血 2880 CUDA（48 ROP / 224 TMU）'
    },
    {
      id: 'nvidia-gtx-titan', vendor: 'NVIDIA', name: 'GeForce GTX Titan', family: 'GeForce Titan',
      type: 'desktop', platform: 'desktop', year: 2013, api: 'd3d11', apis: ['d3d11', 'd3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX Titan', 'GeForce GTX Titan', 'NVIDIA GeForce GTX Titan', 'NVIDIA GeForce GTX Titan Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX Titan Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GK110', 'NVIDIA GK110'],
      specs: { fp32Tflops: 4.71, fp16Tflops: 4.71, bandwidthGBs: 288, pixelRateGps: 42.0, texelRateGts: 196.2, vramGB: 6, memType: 'GDDR5', busWidth: 384, shaderUnits: 2688, gpuCores: null, baseClockMhz: 837, boostClockMhz: 876 },
      note: 'GK110（48 ROP / 224 TMU），首代 Titan'
    },

    /* ---------------------------------------------------- 挖矿专用卡（同核心消费级规格） */
    {
      id: 'nvidia-p106-100', vendor: 'NVIDIA', name: 'NVIDIA P106-100 (挖矿版 GTX 1060)', family: 'GeForce Mining (P 系列)',
      type: 'desktop', platform: 'desktop', year: 2017, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['P106-100', 'NVIDIA P106-100', 'P106 100', 'NVIDIA P106-100 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA P106-100 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GP106', 'NVIDIA GP106'],
      specs: { fp32Tflops: 4.37, fp16Tflops: 4.37, bandwidthGBs: 192, pixelRateGps: 82.0, texelRateGts: 136.6, vramGB: 6, memType: 'GDDR5', busWidth: 192, shaderUnits: 1280, gpuCores: null, baseClockMhz: 1506, boostClockMhz: 1708 },
      note: '挖矿专用，无显示输出（GP106 / GTX 1060 6GB 同核心）'
    },
    {
      id: 'nvidia-p104-100', vendor: 'NVIDIA', name: 'NVIDIA P104-100 (挖矿版 GTX 1070)', family: 'GeForce Mining (P 系列)',
      type: 'desktop', platform: 'desktop', year: 2017, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['P104-100', 'NVIDIA P104-100', 'P104 100', 'NVIDIA P104-100 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA P104-100 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GP104', 'NVIDIA GP104'],
      specs: { fp32Tflops: 6.65, fp16Tflops: 6.65, bandwidthGBs: 320, pixelRateGps: 110.9, texelRateGts: 207.9, vramGB: 4, memType: 'GDDR5X', busWidth: 256, shaderUnits: 1920, gpuCores: null, baseClockMhz: 1607, boostClockMhz: 1733 },
      note: '挖矿专用（GP104 / GTX 1070 同核心），另有 8GB 版本'
    },
    {
      id: 'nvidia-p102-100', vendor: 'NVIDIA', name: 'NVIDIA P102-100 (挖矿版 GTX 1080 Ti)', family: 'GeForce Mining (P 系列)',
      type: 'desktop', platform: 'desktop', year: 2018, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['P102-100', 'NVIDIA P102-100', 'P102 100', 'NVIDIA P102-100 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA P102-100 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GP102', 'NVIDIA GP102'],
      specs: { fp32Tflops: 10.77, fp16Tflops: 10.77, bandwidthGBs: 440, pixelRateGps: 134.6, texelRateGts: 336.6, vramGB: 5, memType: 'GDDR5X', busWidth: 320, shaderUnits: 3200, gpuCores: null, baseClockMhz: 1582, boostClockMhz: 1683 },
      note: '挖矿专用（GP102），320-bit 5GB 显存'
    },
    {
      id: 'nvidia-cmp-30hx', vendor: 'NVIDIA', name: 'NVIDIA CMP 30HX (挖矿版 GTX 1660 SUPER)', family: 'GeForce Mining (CMP 系列)',
      type: 'desktop', platform: 'desktop', year: 2021, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['CMP 30HX', 'NVIDIA CMP 30HX', 'CMP 30HX Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA CMP 30HX Direct3D11 vs_5_0 ps_5_0, D3D11)', 'TU116', 'NVIDIA TU116'],
      specs: { fp32Tflops: 5.03, fp16Tflops: 5.03, bandwidthGBs: 336, pixelRateGps: 85.7, texelRateGts: 157.1, vramGB: 6, memType: 'GDDR6', busWidth: 192, shaderUnits: 1408, gpuCores: null, baseClockMhz: 1530, boostClockMhz: 1785 },
      note: '挖矿专用（TU116 / GTX 1660 SUPER 同核心），无视频输出'
    },
    {
      id: 'nvidia-cmp-40hx', vendor: 'NVIDIA', name: 'NVIDIA CMP 40HX (挖矿版 RTX 2060 SUPER)', family: 'GeForce Mining (CMP 系列)',
      type: 'desktop', platform: 'desktop', year: 2021, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['CMP 40HX', 'NVIDIA CMP 40HX', 'CMP 40HX Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA CMP 40HX Direct3D11 vs_5_0 ps_5_0, D3D11)', 'TU106', 'NVIDIA TU106'],
      specs: { fp32Tflops: 7.18, fp16Tflops: 7.18, bandwidthGBs: 448, pixelRateGps: 105.6, texelRateGts: 224.4, vramGB: 8, memType: 'GDDR6', busWidth: 256, shaderUnits: 2176, gpuCores: null, baseClockMhz: 1470, boostClockMhz: 1650 },
      note: '挖矿专用（TU106 / RTX 2060 SUPER 同核心）'
    },
    {
      id: 'nvidia-cmp-50hx', vendor: 'NVIDIA', name: 'NVIDIA CMP 50HX (挖矿版 RTX 2080 Ti)', family: 'GeForce Mining (CMP 系列)',
      type: 'desktop', platform: 'desktop', year: 2021, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['CMP 50HX', 'NVIDIA CMP 50HX', 'CMP 50HX Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA CMP 50HX Direct3D11 vs_5_0 ps_5_0, D3D11)', 'TU102', 'NVIDIA TU102'],
      specs: { fp32Tflops: 13.45, fp16Tflops: 13.45, bandwidthGBs: 560, pixelRateGps: 136.0, texelRateGts: 420.2, vramGB: 10, memType: 'GDDR6', busWidth: 320, shaderUnits: 4352, gpuCores: null, baseClockMhz: 1350, boostClockMhz: 1545 },
      note: '挖矿专用（TU102 / RTX 2080 Ti 同核心），320-bit 10GB'
    },
    {
      id: 'nvidia-cmp-90hx', vendor: 'NVIDIA', name: 'NVIDIA CMP 90HX (挖矿版 RTX 3080)', family: 'GeForce Mining (CMP 系列)',
      type: 'desktop', platform: 'desktop', year: 2021, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['CMP 90HX', 'NVIDIA CMP 90HX', 'CMP 90HX Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA CMP 90HX Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GA102', 'NVIDIA GA102'],
      specs: { fp32Tflops: 21.89, fp16Tflops: 21.89, bandwidthGBs: 760, pixelRateGps: 136.8, texelRateGts: 342.0, vramGB: 10, memType: 'GDDR6X', busWidth: 320, shaderUnits: 6400, gpuCores: null, baseClockMhz: 1440, boostClockMhz: 1710 },
      note: '挖矿专用（GA102 削减至 6400 CUDA），320-bit GDDR6X'
    },

    /* ==================================================================
     * 二、NVIDIA 笔记本 / 专业卡
     * ================================================================== */

    /* ---------------------------------------------------- RTX 50 Laptop (Blackwell) */
    {
      id: 'nvidia-rtx-5090-laptop', vendor: 'NVIDIA', name: 'GeForce RTX 5090 Laptop GPU', family: 'GeForce RTX 50 Laptop',
      type: 'laptop', platform: 'laptop', year: 2025, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 5090 Laptop', 'RTX 5090 Laptop GPU', 'GeForce RTX 5090 Laptop GPU', 'NVIDIA GeForce RTX 5090 Laptop GPU', 'NVIDIA GeForce RTX 5090 Laptop GPU Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 5090 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GB203', 'NVIDIA GB203'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: 896, pixelRateGps: null, texelRateGts: null, vramGB: 24, memType: 'GDDR7', busWidth: 256, shaderUnits: 10496, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: '移动版频率随 TGP 变化，未收录确认值，故 FP32 留 null'
    },
    {
      id: 'nvidia-rtx-5080-laptop', vendor: 'NVIDIA', name: 'GeForce RTX 5080 Laptop GPU', family: 'GeForce RTX 50 Laptop',
      type: 'laptop', platform: 'laptop', year: 2025, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 5080 Laptop', 'RTX 5080 Laptop GPU', 'GeForce RTX 5080 Laptop GPU', 'NVIDIA GeForce RTX 5080 Laptop GPU', 'NVIDIA GeForce RTX 5080 Laptop GPU Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 5080 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GB203', 'NVIDIA GB203'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: 896, pixelRateGps: null, texelRateGts: null, vramGB: 16, memType: 'GDDR7', busWidth: 256, shaderUnits: 7680, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: 'GB203 移动版，频率随 TGP 变化'
    },
    {
      id: 'nvidia-rtx-5070-ti-laptop', vendor: 'NVIDIA', name: 'GeForce RTX 5070 Ti Laptop GPU', family: 'GeForce RTX 50 Laptop',
      type: 'laptop', platform: 'laptop', year: 2025, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 5070 Ti Laptop', 'RTX 5070 Ti Laptop GPU', 'GeForce RTX 5070 Ti Laptop GPU', 'NVIDIA GeForce RTX 5070 Ti Laptop GPU', 'NVIDIA GeForce RTX 5070 Ti Laptop GPU Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 5070 Ti Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GB205', 'NVIDIA GB205'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: 672, pixelRateGps: null, texelRateGts: null, vramGB: 12, memType: 'GDDR7', busWidth: 192, shaderUnits: 5888, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: 'GB205 移动版'
    },
    {
      id: 'nvidia-rtx-5070-laptop', vendor: 'NVIDIA', name: 'GeForce RTX 5070 Laptop GPU', family: 'GeForce RTX 50 Laptop',
      type: 'laptop', platform: 'laptop', year: 2025, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 5070 Laptop', 'RTX 5070 Laptop GPU', 'GeForce RTX 5070 Laptop GPU', 'NVIDIA GeForce RTX 5070 Laptop GPU', 'NVIDIA GeForce RTX 5070 Laptop GPU Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 5070 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GB206', 'NVIDIA GB206'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: 448, pixelRateGps: null, texelRateGts: null, vramGB: 8, memType: 'GDDR7', busWidth: 128, shaderUnits: 4608, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: 'GB206 移动版'
    },
    {
      id: 'nvidia-rtx-5060-laptop', vendor: 'NVIDIA', name: 'GeForce RTX 5060 Laptop GPU', family: 'GeForce RTX 50 Laptop',
      type: 'laptop', platform: 'laptop', year: 2025, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 5060 Laptop', 'RTX 5060 Laptop GPU', 'GeForce RTX 5060 Laptop GPU', 'NVIDIA GeForce RTX 5060 Laptop GPU', 'NVIDIA GeForce RTX 5060 Laptop GPU Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 5060 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GB206', 'NVIDIA GB206'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: 448, pixelRateGps: null, texelRateGts: null, vramGB: 8, memType: 'GDDR7', busWidth: 128, shaderUnits: 3328, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: 'GB206 移动版'
    },

    /* ---------------------------------------------------- RTX 40 Laptop (Ada) */
    {
      id: 'nvidia-rtx-4090-laptop', vendor: 'NVIDIA', name: 'GeForce RTX 4090 Laptop GPU', family: 'GeForce RTX 40 Laptop',
      type: 'laptop', platform: 'laptop', year: 2023, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 4090 Laptop', 'RTX 4090 Laptop GPU', 'GeForce RTX 4090 Laptop GPU', 'NVIDIA GeForce RTX 4090 Laptop GPU', 'NVIDIA GeForce RTX 4090 Laptop GPU Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)', 'AD103', 'NVIDIA AD103'],
      specs: { fp32Tflops: 39.69, fp16Tflops: 39.69, bandwidthGBs: 576, pixelRateGps: 228.5, texelRateGts: 620.2, vramGB: 16, memType: 'GDDR6', busWidth: 256, shaderUnits: 9728, gpuCores: null, baseClockMhz: 1455, boostClockMhz: 2040 },
      note: 'AD103 移动版（112 ROP / 304 TMU），18 Gbps GDDR6'
    },
    {
      id: 'nvidia-rtx-4080-laptop', vendor: 'NVIDIA', name: 'GeForce RTX 4080 Laptop GPU', family: 'GeForce RTX 40 Laptop',
      type: 'laptop', platform: 'laptop', year: 2023, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 4080 Laptop', 'RTX 4080 Laptop GPU', 'GeForce RTX 4080 Laptop GPU', 'NVIDIA GeForce RTX 4080 Laptop GPU', 'NVIDIA GeForce RTX 4080 Laptop GPU Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)', 'AD104', 'NVIDIA AD104'],
      specs: { fp32Tflops: 33.85, fp16Tflops: 33.85, bandwidthGBs: 432, pixelRateGps: 182.4, texelRateGts: 528.9, vramGB: 12, memType: 'GDDR6', busWidth: 192, shaderUnits: 7424, gpuCores: null, baseClockMhz: 1350, boostClockMhz: 2280 },
      note: 'AD104 移动版（80 ROP / 232 TMU）'
    },
    {
      id: 'nvidia-rtx-4070-laptop', vendor: 'NVIDIA', name: 'GeForce RTX 4070 Laptop GPU', family: 'GeForce RTX 40 Laptop',
      type: 'laptop', platform: 'laptop', year: 2023, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 4070 Laptop', 'RTX 4070 Laptop GPU', 'GeForce RTX 4070 Laptop GPU', 'NVIDIA GeForce RTX 4070 Laptop GPU', 'NVIDIA GeForce RTX 4070 Laptop GPU Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)', 'AD106', 'NVIDIA AD106'],
      specs: { fp32Tflops: 20.04, fp16Tflops: 20.04, bandwidthGBs: 256, pixelRateGps: 104.4, texelRateGts: 313.2, vramGB: 8, memType: 'GDDR6', busWidth: 128, shaderUnits: 4608, gpuCores: null, baseClockMhz: 1230, boostClockMhz: 2175 },
      note: 'AD106 满血移动版（48 ROP / 144 TMU）'
    },
    {
      id: 'nvidia-rtx-4060-laptop', vendor: 'NVIDIA', name: 'GeForce RTX 4060 Laptop GPU', family: 'GeForce RTX 40 Laptop',
      type: 'laptop', platform: 'laptop', year: 2023, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 4060 Laptop', 'RTX 4060 Laptop GPU', 'GeForce RTX 4060 Laptop GPU', 'NVIDIA GeForce RTX 4060 Laptop GPU', 'NVIDIA GeForce RTX 4060 Laptop GPU Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)', 'AD107', 'NVIDIA AD107'],
      specs: { fp32Tflops: 14.56, fp16Tflops: 14.56, bandwidthGBs: 256, pixelRateGps: 113.8, texelRateGts: 227.5, vramGB: 8, memType: 'GDDR6', busWidth: 128, shaderUnits: 3072, gpuCores: null, baseClockMhz: 1470, boostClockMhz: 2370 },
      note: 'AD107 满血移动版（48 ROP / 96 TMU）'
    },
    {
      id: 'nvidia-rtx-4050-laptop', vendor: 'NVIDIA', name: 'GeForce RTX 4050 Laptop GPU', family: 'GeForce RTX 40 Laptop',
      type: 'laptop', platform: 'laptop', year: 2023, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 4050 Laptop', 'RTX 4050 Laptop GPU', 'GeForce RTX 4050 Laptop GPU', 'NVIDIA GeForce RTX 4050 Laptop GPU', 'NVIDIA GeForce RTX 4050 Laptop GPU Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4050 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)', 'AD107', 'NVIDIA AD107'],
      specs: { fp32Tflops: 12.13, fp16Tflops: 12.13, bandwidthGBs: 192, pixelRateGps: 75.8, texelRateGts: 189.6, vramGB: 6, memType: 'GDDR6', busWidth: 96, shaderUnits: 2560, gpuCores: null, baseClockMhz: 1605, boostClockMhz: 2370 },
      note: 'AD107 移动版（32 ROP / 80 TMU），96-bit'
    },

    /* ---------------------------------------------------- RTX 30 Laptop (Ampere) */
    {
      id: 'nvidia-rtx-3080-ti-laptop', vendor: 'NVIDIA', name: 'GeForce RTX 3080 Ti Laptop GPU', family: 'GeForce RTX 30 Laptop',
      type: 'laptop', platform: 'laptop', year: 2022, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 3080 Ti Laptop', 'RTX 3080 Ti Laptop GPU', 'GeForce RTX 3080 Ti Laptop GPU', 'NVIDIA GeForce RTX 3080 Ti Laptop GPU', 'NVIDIA GeForce RTX 3080 Ti Laptop GPU Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Ti Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GA103', 'NVIDIA GA103'],
      specs: { fp32Tflops: 23.61, fp16Tflops: 23.61, bandwidthGBs: 512, pixelRateGps: 152.6, texelRateGts: 368.9, vramGB: 16, memType: 'GDDR6', busWidth: 256, shaderUnits: 7424, gpuCores: null, baseClockMhz: 975, boostClockMhz: 1590 },
      note: 'GA103 移动版（96 ROP / 232 TMU），16 Gbps GDDR6'
    },
    {
      id: 'nvidia-rtx-3080-laptop', vendor: 'NVIDIA', name: 'GeForce RTX 3080 Laptop GPU', family: 'GeForce RTX 30 Laptop',
      type: 'laptop', platform: 'laptop', year: 2021, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 3080 Laptop', 'RTX 3080 Laptop GPU', 'GeForce RTX 3080 Laptop GPU', 'NVIDIA GeForce RTX 3080 Laptop GPU', 'NVIDIA GeForce RTX 3080 Laptop GPU Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GA104', 'NVIDIA GA104'],
      specs: { fp32Tflops: 21.01, fp16Tflops: 21.01, bandwidthGBs: 448, pixelRateGps: 164.2, texelRateGts: 328.3, vramGB: 8, memType: 'GDDR6', busWidth: 256, shaderUnits: 6144, gpuCores: null, baseClockMhz: 1110, boostClockMhz: 1710 },
      note: 'GA104 满血移动版（96 ROP / 192 TMU），8GB / 16GB 两种配置'
    },
    {
      id: 'nvidia-rtx-3070-ti-laptop', vendor: 'NVIDIA', name: 'GeForce RTX 3070 Ti Laptop GPU', family: 'GeForce RTX 30 Laptop',
      type: 'laptop', platform: 'laptop', year: 2022, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 3070 Ti Laptop', 'RTX 3070 Ti Laptop GPU', 'GeForce RTX 3070 Ti Laptop GPU', 'NVIDIA GeForce RTX 3070 Ti Laptop GPU', 'NVIDIA GeForce RTX 3070 Ti Laptop GPU Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Ti Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GA104', 'NVIDIA GA104'],
      specs: { fp32Tflops: 17.49, fp16Tflops: 17.49, bandwidthGBs: 448, pixelRateGps: 142.6, texelRateGts: 273.2, vramGB: 8, memType: 'GDDR6', busWidth: 256, shaderUnits: 5888, gpuCores: null, baseClockMhz: 915, boostClockMhz: 1485 },
      note: 'GA104 移动版（96 ROP / 184 TMU）'
    },
    {
      id: 'nvidia-rtx-3070-laptop', vendor: 'NVIDIA', name: 'GeForce RTX 3070 Laptop GPU', family: 'GeForce RTX 30 Laptop',
      type: 'laptop', platform: 'laptop', year: 2021, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 3070 Laptop', 'RTX 3070 Laptop GPU', 'GeForce RTX 3070 Laptop GPU', 'NVIDIA GeForce RTX 3070 Laptop GPU', 'NVIDIA GeForce RTX 3070 Laptop GPU Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GA104', 'NVIDIA GA104'],
      specs: { fp32Tflops: 16.59, fp16Tflops: 16.59, bandwidthGBs: 448, pixelRateGps: 155.5, texelRateGts: 259.2, vramGB: 8, memType: 'GDDR6', busWidth: 256, shaderUnits: 5120, gpuCores: null, baseClockMhz: 1110, boostClockMhz: 1620 },
      note: 'GA104 移动版（96 ROP / 160 TMU）'
    },
    {
      id: 'nvidia-rtx-3060-laptop', vendor: 'NVIDIA', name: 'GeForce RTX 3060 Laptop GPU', family: 'GeForce RTX 30 Laptop',
      type: 'laptop', platform: 'laptop', year: 2021, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 3060 Laptop', 'RTX 3060 Laptop GPU', 'GeForce RTX 3060 Laptop GPU', 'NVIDIA GeForce RTX 3060 Laptop GPU', 'NVIDIA GeForce RTX 3060 Laptop GPU Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GA106', 'NVIDIA GA106'],
      specs: { fp32Tflops: 13.07, fp16Tflops: 13.07, bandwidthGBs: 336, pixelRateGps: 81.7, texelRateGts: 204.2, vramGB: 6, memType: 'GDDR6', busWidth: 192, shaderUnits: 3840, gpuCores: null, baseClockMhz: 900, boostClockMhz: 1702 },
      note: 'GA106 移动版（48 ROP / 120 TMU）'
    },
    {
      id: 'nvidia-rtx-3050-ti-laptop', vendor: 'NVIDIA', name: 'GeForce RTX 3050 Ti Laptop GPU', family: 'GeForce RTX 30 Laptop',
      type: 'laptop', platform: 'laptop', year: 2021, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 3050 Ti Laptop', 'RTX 3050 Ti Laptop GPU', 'GeForce RTX 3050 Ti Laptop GPU', 'NVIDIA GeForce RTX 3050 Ti Laptop GPU', 'NVIDIA GeForce RTX 3050 Ti Laptop GPU Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3050 Ti Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GA107', 'NVIDIA GA107'],
      specs: { fp32Tflops: 8.68, fp16Tflops: 8.68, bandwidthGBs: 192, pixelRateGps: 54.2, texelRateGts: 135.6, vramGB: 4, memType: 'GDDR6', busWidth: 128, shaderUnits: 2560, gpuCores: null, baseClockMhz: 915, boostClockMhz: 1695 },
      note: 'GA107 移动版（32 ROP / 80 TMU）'
    },
    {
      id: 'nvidia-rtx-3050-laptop', vendor: 'NVIDIA', name: 'GeForce RTX 3050 Laptop GPU', family: 'GeForce RTX 30 Laptop',
      type: 'laptop', platform: 'laptop', year: 2021, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 3050 Laptop', 'RTX 3050 Laptop GPU', 'GeForce RTX 3050 Laptop GPU', 'NVIDIA GeForce RTX 3050 Laptop GPU', 'NVIDIA GeForce RTX 3050 Laptop GPU Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3050 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GA107', 'NVIDIA GA107'],
      specs: { fp32Tflops: 7.13, fp16Tflops: 7.13, bandwidthGBs: 192, pixelRateGps: 55.7, texelRateGts: 111.4, vramGB: 4, memType: 'GDDR6', busWidth: 128, shaderUnits: 2048, gpuCores: null, baseClockMhz: 1237, boostClockMhz: 1740 },
      note: 'GA107 移动版（32 ROP / 64 TMU）'
    },

    {
      id: 'nvidia-rtx-2080-laptop', vendor: 'NVIDIA', name: 'GeForce RTX 2080 Laptop GPU', family: 'GeForce RTX 20 Laptop',
      type: 'laptop', platform: 'laptop', year: 2019, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 2080 Laptop', 'RTX 2080 Laptop GPU', 'GeForce RTX 2080 Laptop GPU', 'GeForce RTX 2080 Max-Q', 'NVIDIA GeForce RTX 2080 Laptop GPU', 'NVIDIA GeForce RTX 2080 Laptop GPU Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 2080 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)', 'TU104', 'NVIDIA TU104'],
      specs: { fp32Tflops: 9.36, fp16Tflops: 9.36, bandwidthGBs: 448, pixelRateGps: 101.8, texelRateGts: 292.6, vramGB: 8, memType: 'GDDR6', busWidth: 256, shaderUnits: 2944, gpuCores: null, baseClockMhz: null, boostClockMhz: 1590 },
      note: 'TU104 移动版（64 ROP / 184 TMU）'
    },
    {
      id: 'nvidia-rtx-2070-laptop', vendor: 'NVIDIA', name: 'GeForce RTX 2070 Laptop GPU', family: 'GeForce RTX 20 Laptop',
      type: 'laptop', platform: 'laptop', year: 2019, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 2070 Laptop', 'RTX 2070 Laptop GPU', 'GeForce RTX 2070 Laptop GPU', 'GeForce RTX 2070 Max-Q', 'NVIDIA GeForce RTX 2070 Laptop GPU', 'NVIDIA GeForce RTX 2070 Laptop GPU Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 2070 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)', 'TU106', 'NVIDIA TU106'],
      specs: { fp32Tflops: 6.64, fp16Tflops: 6.64, bandwidthGBs: 448, pixelRateGps: 92.2, texelRateGts: 207.4, vramGB: 8, memType: 'GDDR6', busWidth: 256, shaderUnits: 2304, gpuCores: null, baseClockMhz: null, boostClockMhz: 1440 },
      note: 'TU106 移动版（64 ROP / 144 TMU）；另有 Max-Q 低功耗版本'
    },
    {
      id: 'nvidia-rtx-2060-laptop', vendor: 'NVIDIA', name: 'GeForce RTX 2060 Laptop GPU', family: 'GeForce RTX 20 Laptop',
      type: 'laptop', platform: 'laptop', year: 2019, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 2060 Laptop', 'RTX 2060 Laptop GPU', 'GeForce RTX 2060 Laptop GPU', 'GeForce RTX 2060 Max-Q', 'NVIDIA GeForce RTX 2060 Laptop GPU', 'NVIDIA GeForce RTX 2060 Laptop GPU Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 2060 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)', 'TU106', 'NVIDIA TU106'],
      specs: { fp32Tflops: 5.99, fp16Tflops: 5.99, bandwidthGBs: 336, pixelRateGps: 74.9, texelRateGts: 187.2, vramGB: 6, memType: 'GDDR6', busWidth: 192, shaderUnits: 1920, gpuCores: null, baseClockMhz: null, boostClockMhz: 1560 },
      note: 'TU106 移动版（48 ROP / 120 TMU）'
    },

    /* ---------------------------------------------------- GTX 16 Laptop (Turing) */
    {
      id: 'nvidia-gtx-1660-ti-laptop', vendor: 'NVIDIA', name: 'GeForce GTX 1660 Ti Laptop GPU', family: 'GeForce GTX 16 Laptop',
      type: 'laptop', platform: 'laptop', year: 2019, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 1660 Ti Laptop', 'GTX 1660 Ti Laptop GPU', 'GeForce GTX 1660 Ti Laptop GPU', 'NVIDIA GeForce GTX 1660 Ti Laptop GPU', 'NVIDIA GeForce GTX 1660 Ti Laptop GPU Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Ti Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)', 'TU116', 'NVIDIA TU116'],
      specs: { fp32Tflops: 4.88, fp16Tflops: 4.88, bandwidthGBs: 288, pixelRateGps: 76.3, texelRateGts: 152.6, vramGB: 6, memType: 'GDDR6', busWidth: 192, shaderUnits: 1536, gpuCores: null, baseClockMhz: 1455, boostClockMhz: 1590 },
      note: 'TU116 移动版（48 ROP / 96 TMU）'
    },
    {
      id: 'nvidia-gtx-1650-laptop', vendor: 'NVIDIA', name: 'GeForce GTX 1650 Laptop GPU', family: 'GeForce GTX 16 Laptop',
      type: 'laptop', platform: 'laptop', year: 2019, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 1650 Laptop', 'GTX 1650 Laptop GPU', 'GeForce GTX 1650 Laptop GPU', 'NVIDIA GeForce GTX 1650 Laptop GPU', 'NVIDIA GeForce GTX 1650 Laptop GPU Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)', 'TU117', 'NVIDIA TU117'],
      specs: { fp32Tflops: 3.19, fp16Tflops: 3.19, bandwidthGBs: 128, pixelRateGps: 49.9, texelRateGts: 99.8, vramGB: 4, memType: 'GDDR5', busWidth: 128, shaderUnits: 1024, gpuCores: null, baseClockMhz: 1395, boostClockMhz: 1560 },
      note: 'TU117 移动版（32 ROP / 64 TMU）；另有 GDDR6 版本'
    },

    {
      id: 'nvidia-gtx-1070-laptop', vendor: 'NVIDIA', name: 'GeForce GTX 1070 Laptop GPU', family: 'GeForce GTX 10 Laptop',
      type: 'laptop', platform: 'laptop', year: 2016, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 1070 Laptop', 'GTX 1070 Laptop GPU', 'GeForce GTX 1070 Laptop GPU', 'NVIDIA GeForce GTX 1070 Laptop GPU', 'NVIDIA GeForce GTX 1070 Laptop GPU Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1070 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GP104', 'NVIDIA GP104'],
      specs: { fp32Tflops: 5.91, fp16Tflops: 5.91, bandwidthGBs: 256, pixelRateGps: 92.4, texelRateGts: 184.7, vramGB: 8, memType: 'GDDR5', busWidth: 256, shaderUnits: 2048, gpuCores: null, baseClockMhz: null, boostClockMhz: 1443 },
      note: 'GP104 移动版（64 ROP / 128 TMU）'
    },
    {
      id: 'nvidia-gtx-1060-laptop', vendor: 'NVIDIA', name: 'GeForce GTX 1060 Laptop GPU', family: 'GeForce GTX 10 Laptop',
      type: 'laptop', platform: 'laptop', year: 2016, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 1060 Laptop', 'GTX 1060 Laptop GPU', 'GeForce GTX 1060 Laptop GPU', 'NVIDIA GeForce GTX 1060 Laptop GPU', 'NVIDIA GeForce GTX 1060 Laptop GPU Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GP106', 'NVIDIA GP106'],
      specs: { fp32Tflops: 4.28, fp16Tflops: 4.28, bandwidthGBs: 192, pixelRateGps: 80.2, texelRateGts: 133.6, vramGB: 6, memType: 'GDDR5', busWidth: 192, shaderUnits: 1280, gpuCores: null, baseClockMhz: null, boostClockMhz: 1670 },
      note: 'GP106 移动版（48 ROP / 80 TMU）；另有 3GB / 6GB 版本'
    },
    {
      id: 'nvidia-gtx-1050-laptop', vendor: 'NVIDIA', name: 'GeForce GTX 1050 Laptop GPU', family: 'GeForce GTX 10 Laptop',
      type: 'laptop', platform: 'laptop', year: 2017, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['GTX 1050 Laptop', 'GTX 1050 Laptop GPU', 'GeForce GTX 1050 Laptop GPU', 'NVIDIA GeForce GTX 1050 Laptop GPU', 'NVIDIA GeForce GTX 1050 Laptop GPU Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1050 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GP107', 'NVIDIA GP107'],
      specs: { fp32Tflops: 1.91, fp16Tflops: 1.91, bandwidthGBs: 112, pixelRateGps: 47.8, texelRateGts: 59.7, vramGB: 4, memType: 'GDDR5', busWidth: 128, shaderUnits: 640, gpuCores: null, baseClockMhz: null, boostClockMhz: 1493 },
      note: 'GP107 移动版（32 ROP / 40 TMU）'
    },

    /* ---------------------------------------------------- MX 系列（入门独显） */
    {
      id: 'nvidia-mx570', vendor: 'NVIDIA', name: 'GeForce MX570', family: 'GeForce MX',
      type: 'laptop', platform: 'laptop', year: 2022, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['MX570', 'GeForce MX570', 'NVIDIA GeForce MX570', 'NVIDIA GeForce MX570 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce MX570 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GA107', 'NVIDIA GA107'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: 96, pixelRateGps: null, texelRateGts: null, vramGB: 2, memType: 'GDDR6', busWidth: 64, shaderUnits: 2048, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: 'GA107 入门独显，频率随 OEM 配置变化，未收录确认值'
    },
    {
      id: 'nvidia-mx550', vendor: 'NVIDIA', name: 'GeForce MX550', family: 'GeForce MX',
      type: 'laptop', platform: 'laptop', year: 2022, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['MX550', 'GeForce MX550', 'NVIDIA GeForce MX550', 'NVIDIA GeForce MX550 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce MX550 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'TU117', 'NVIDIA TU117'],
      specs: { fp32Tflops: 2.70, fp16Tflops: 2.70, bandwidthGBs: 96, pixelRateGps: 42.2, texelRateGts: 84.5, vramGB: 2, memType: 'GDDR6', busWidth: 64, shaderUnits: 1024, gpuCores: null, baseClockMhz: null, boostClockMhz: 1320 },
      note: 'TU117 入门独显（32 ROP / 64 TMU）'
    },
    {
      id: 'nvidia-mx450', vendor: 'NVIDIA', name: 'GeForce MX450', family: 'GeForce MX',
      type: 'laptop', platform: 'laptop', year: 2020, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['MX450', 'GeForce MX450', 'NVIDIA GeForce MX450', 'NVIDIA GeForce MX450 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce MX450 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'TU117', 'NVIDIA TU117'],
      specs: { fp32Tflops: 2.82, fp16Tflops: 2.82, bandwidthGBs: 80, pixelRateGps: 50.4, texelRateGts: 88.2, vramGB: 2, memType: 'GDDR6', busWidth: 64, shaderUnits: 896, gpuCores: null, baseClockMhz: 1395, boostClockMhz: 1575 },
      note: 'TU117 入门独显（32 ROP / 64 TMU），有多个 TGP 档位'
    },
    {
      id: 'nvidia-mx350', vendor: 'NVIDIA', name: 'GeForce MX350', family: 'GeForce MX',
      type: 'laptop', platform: 'laptop', year: 2020, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['MX350', 'GeForce MX350', 'NVIDIA GeForce MX350', 'NVIDIA GeForce MX350 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA GeForce MX350 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GP107', 'NVIDIA GP107'],
      specs: { fp32Tflops: 1.88, fp16Tflops: 1.88, bandwidthGBs: 56.1, pixelRateGps: 23.5, texelRateGts: 58.7, vramGB: 2, memType: 'GDDR5', busWidth: 64, shaderUnits: 640, gpuCores: null, baseClockMhz: 1354, boostClockMhz: 1468 },
      note: 'GP107 入门独显（16 ROP / 32 TMU）'
    },

    /* ---------------------------------------------------- 专业卡（Quadro / RTX A / Ada） */
    {
      id: 'nvidia-rtx-5000-ada', vendor: 'NVIDIA', name: 'NVIDIA RTX 5000 Ada Generation', family: 'RTX Professional (Ada)',
      type: 'workstation', platform: 'desktop', year: 2023, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 5000 Ada', 'NVIDIA RTX 5000 Ada', 'NVIDIA RTX 5000 Ada Generation', 'NVIDIA RTX 5000 Ada Generation Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA RTX 5000 Ada Generation Direct3D11 vs_5_0 ps_5_0, D3D11)', 'AD102', 'NVIDIA AD102'],
      specs: { fp32Tflops: 65.28, fp16Tflops: 65.28, bandwidthGBs: 576, pixelRateGps: null, texelRateGts: 1020.0, vramGB: 32, memType: 'GDDR6', busWidth: 256, shaderUnits: 12800, gpuCores: null, baseClockMhz: null, boostClockMhz: 2550 },
      note: 'AD102 工作站版（100 SM / 400 TMU），ROP 数未确认故像素率留 null'
    },
    {
      id: 'nvidia-rtx-4000-ada', vendor: 'NVIDIA', name: 'NVIDIA RTX 4000 Ada Generation', family: 'RTX Professional (Ada)',
      type: 'workstation', platform: 'desktop', year: 2023, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX 4000 Ada', 'NVIDIA RTX 4000 Ada', 'NVIDIA RTX 4000 Ada Generation', 'NVIDIA RTX 4000 Ada Generation Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA RTX 4000 Ada Generation Direct3D11 vs_5_0 ps_5_0, D3D11)', 'AD104', 'NVIDIA AD104'],
      specs: { fp32Tflops: 26.72, fp16Tflops: 26.72, bandwidthGBs: 360, pixelRateGps: 174.0, texelRateGts: 417.6, vramGB: 20, memType: 'GDDR6', busWidth: 160, shaderUnits: 6144, gpuCores: null, baseClockMhz: null, boostClockMhz: 2175 },
      note: 'AD104 工作站版（80 ROP / 192 TMU），20GB 单颗 160-bit'
    },
    {
      id: 'nvidia-rtx-a6000', vendor: 'NVIDIA', name: 'NVIDIA RTX A6000', family: 'RTX Professional (Ampere)',
      type: 'workstation', platform: 'desktop', year: 2020, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX A6000', 'NVIDIA RTX A6000', 'NVIDIA RTX A6000 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA RTX A6000 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GA102', 'NVIDIA GA102'],
      specs: { fp32Tflops: 38.71, fp16Tflops: 38.71, bandwidthGBs: 768, pixelRateGps: 201.6, texelRateGts: 604.8, vramGB: 48, memType: 'GDDR6', busWidth: 384, shaderUnits: 10752, gpuCores: null, baseClockMhz: 1455, boostClockMhz: 1800 },
      note: 'GA102（112 ROP / 336 TMU），48GB GDDR6 ECC'
    },
    {
      id: 'nvidia-rtx-a5000', vendor: 'NVIDIA', name: 'NVIDIA RTX A5000', family: 'RTX Professional (Ampere)',
      type: 'workstation', platform: 'desktop', year: 2021, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX A5000', 'NVIDIA RTX A5000', 'NVIDIA RTX A5000 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA RTX A5000 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GA102', 'NVIDIA GA102'],
      specs: { fp32Tflops: 27.77, fp16Tflops: 27.77, bandwidthGBs: 768, pixelRateGps: 162.7, texelRateGts: 434.0, vramGB: 24, memType: 'GDDR6', busWidth: 384, shaderUnits: 8192, gpuCores: null, baseClockMhz: 1170, boostClockMhz: 1695 },
      note: 'GA102（96 ROP / 256 TMU）'
    },
    {
      id: 'nvidia-rtx-a4000', vendor: 'NVIDIA', name: 'NVIDIA RTX A4000', family: 'RTX Professional (Ampere)',
      type: 'workstation', platform: 'desktop', year: 2021, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX A4000', 'NVIDIA RTX A4000', 'NVIDIA RTX A4000 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA RTX A4000 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GA104', 'NVIDIA GA104'],
      specs: { fp32Tflops: 19.17, fp16Tflops: 19.17, bandwidthGBs: 448, pixelRateGps: 149.8, texelRateGts: 299.5, vramGB: 16, memType: 'GDDR6', busWidth: 256, shaderUnits: 6144, gpuCores: null, baseClockMhz: 735, boostClockMhz: 1560 },
      note: 'GA104 满血（96 ROP / 192 TMU），单槽半高'
    },
    {
      id: 'nvidia-rtx-a2000', vendor: 'NVIDIA', name: 'NVIDIA RTX A2000 12GB', family: 'RTX Professional (Ampere)',
      type: 'workstation', platform: 'desktop', year: 2021, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RTX A2000', 'NVIDIA RTX A2000', 'NVIDIA RTX A2000 12GB', 'NVIDIA RTX A2000 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA RTX A2000 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GA106', 'NVIDIA GA106'],
      specs: { fp32Tflops: 7.99, fp16Tflops: 7.99, bandwidthGBs: 288, pixelRateGps: null, texelRateGts: 124.8, vramGB: 12, memType: 'GDDR6', busWidth: 192, shaderUnits: 3328, gpuCores: null, baseClockMhz: 562, boostClockMhz: 1200 },
      note: 'GA106（26 SM / 104 TMU），低功耗双槽'
    },
    {
      id: 'nvidia-quadro-rtx-6000', vendor: 'NVIDIA', name: 'NVIDIA Quadro RTX 6000', family: 'Quadro (Turing)',
      type: 'workstation', platform: 'desktop', year: 2018, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['Quadro RTX 6000', 'NVIDIA Quadro RTX 6000', 'NVIDIA Quadro RTX 6000 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA Quadro RTX 6000 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'TU102', 'NVIDIA TU102'],
      specs: { fp32Tflops: 16.31, fp16Tflops: 16.31, bandwidthGBs: 672, pixelRateGps: 169.9, texelRateGts: 509.8, vramGB: 24, memType: 'GDDR6', busWidth: 384, shaderUnits: 4608, gpuCores: null, baseClockMhz: 1440, boostClockMhz: 1770 },
      note: 'TU102 满血（96 ROP / 288 TMU）'
    },
    {
      id: 'nvidia-quadro-p4000', vendor: 'NVIDIA', name: 'NVIDIA Quadro P4000', family: 'Quadro (Pascal)',
      type: 'workstation', platform: 'desktop', year: 2017, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['Quadro P4000', 'NVIDIA Quadro P4000', 'NVIDIA Quadro P4000 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (NVIDIA, NVIDIA Quadro P4000 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'GP104', 'NVIDIA GP104'],
      specs: { fp32Tflops: 5.30, fp16Tflops: 5.30, bandwidthGBs: 243, pixelRateGps: 94.7, texelRateGts: 165.8, vramGB: 8, memType: 'GDDR5', busWidth: 256, shaderUnits: 1792, gpuCores: null, baseClockMhz: 1202, boostClockMhz: 1480 },
      note: 'GP104（64 ROP / 112 TMU），单槽 105W'
    },

    /* ==================================================================
     * 三、AMD 桌面独显（新 -> 旧）
     * ================================================================== */

    /* ---------------------------------------------------- RX 9000 (RDNA 4) */
    {
      id: 'amd-rx-9070-xt', vendor: 'AMD', name: 'Radeon RX 9070 XT', family: 'Radeon RX 9000',
      type: 'desktop', platform: 'desktop', year: 2025, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 9070 XT', 'Radeon RX 9070 XT', 'AMD Radeon RX 9070 XT', 'AMD Radeon RX 9070 XT Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 9070 XT Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 48', 'AMD Navi 48', 'gfx1201'],
      specs: { fp32Tflops: 24.33, fp16Tflops: 24.33, bandwidthGBs: 644.6, pixelRateGps: 380.2, texelRateGts: 760.3, vramGB: 16, memType: 'GDDR6', busWidth: 256, shaderUnits: 4096, gpuCores: null, baseClockMhz: 1660, boostClockMhz: 2970 },
      note: 'Navi 48（128 ROP / 256 TMU），20 Gbps GDDR6'
    },
    {
      id: 'amd-rx-9070', vendor: 'AMD', name: 'Radeon RX 9070', family: 'Radeon RX 9000',
      type: 'desktop', platform: 'desktop', year: 2025, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 9070', 'Radeon RX 9070', 'AMD Radeon RX 9070', 'AMD Radeon RX 9070 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 9070 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 48', 'AMD Navi 48', 'gfx1201'],
      specs: { fp32Tflops: 18.06, fp16Tflops: 18.06, bandwidthGBs: 644.6, pixelRateGps: 322.6, texelRateGts: 564.5, vramGB: 16, memType: 'GDDR6', busWidth: 256, shaderUnits: 3584, gpuCores: null, baseClockMhz: 1330, boostClockMhz: 2520 },
      note: 'Navi 48 削减版（128 ROP / 224 TMU）'
    },
    {
      id: 'amd-rx-9070-gre', vendor: 'AMD', name: 'Radeon RX 9070 GRE', family: 'Radeon RX 9000',
      type: 'desktop', platform: 'desktop', year: 2025, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 9070 GRE', 'Radeon RX 9070 GRE', 'AMD Radeon RX 9070 GRE', 'AMD Radeon RX 9070 GRE Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 9070 GRE Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 48', 'AMD Navi 48', 'gfx1201'],
      specs: { fp32Tflops: 17.14, fp16Tflops: 17.14, bandwidthGBs: 480, pixelRateGps: 267.8, texelRateGts: 535.7, vramGB: 12, memType: 'GDDR6', busWidth: 192, shaderUnits: 3072, gpuCores: null, baseClockMhz: null, boostClockMhz: 2790 },
      note: '中国特供版本，96 ROP / 192 TMU，192-bit 12GB'
    },
    {
      id: 'amd-rx-9060-xt', vendor: 'AMD', name: 'Radeon RX 9060 XT', family: 'Radeon RX 9000',
      type: 'desktop', platform: 'desktop', year: 2025, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 9060 XT', 'Radeon RX 9060 XT', 'AMD Radeon RX 9060 XT', 'AMD Radeon RX 9060 XT Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 9060 XT Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 44', 'AMD Navi 44', 'gfx1200'],
      specs: { fp32Tflops: 12.82, fp16Tflops: 12.82, bandwidthGBs: 322, pixelRateGps: 200.3, texelRateGts: 400.6, vramGB: 16, memType: 'GDDR6', busWidth: 128, shaderUnits: 2048, gpuCores: null, baseClockMhz: 1700, boostClockMhz: 3130 },
      note: 'Navi 44（64 ROP / 128 TMU），有 8GB / 16GB 两种版本'
    },

    /* ---------------------------------------------------- RX 7000 (RDNA 3) */
    {
      id: 'amd-rx-7900-xtx', vendor: 'AMD', name: 'Radeon RX 7900 XTX', family: 'Radeon RX 7000',
      type: 'desktop', platform: 'desktop', year: 2022, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 7900 XTX', 'Radeon RX 7900 XTX', 'AMD Radeon RX 7900 XTX', 'AMD Radeon RX 7900 XTX Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 7900 XTX Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 31', 'AMD Navi 31', 'gfx1100'],
      specs: { fp32Tflops: 30.72, fp16Tflops: 30.72, bandwidthGBs: 960, pixelRateGps: 480.0, texelRateGts: 960.0, vramGB: 24, memType: 'GDDR6', busWidth: 384, shaderUnits: 6144, gpuCores: null, baseClockMhz: 1900, boostClockMhz: 2500 },
      note: 'Navi 31（192 ROP / 384 TMU），20 Gbps GDDR6'
    },
    {
      id: 'amd-rx-7900-xt', vendor: 'AMD', name: 'Radeon RX 7900 XT', family: 'Radeon RX 7000',
      type: 'desktop', platform: 'desktop', year: 2022, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 7900 XT', 'Radeon RX 7900 XT', 'AMD Radeon RX 7900 XT', 'AMD Radeon RX 7900 XT Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 7900 XT Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 31', 'AMD Navi 31', 'gfx1100'],
      specs: { fp32Tflops: 25.80, fp16Tflops: 25.80, bandwidthGBs: 800, pixelRateGps: 460.8, texelRateGts: 806.4, vramGB: 20, memType: 'GDDR6', busWidth: 320, shaderUnits: 5376, gpuCores: null, baseClockMhz: 1500, boostClockMhz: 2400 },
      note: 'Navi 31（192 ROP / 336 TMU），320-bit 20GB'
    },
    {
      id: 'amd-rx-7900-gre', vendor: 'AMD', name: 'Radeon RX 7900 GRE', family: 'Radeon RX 7000',
      type: 'desktop', platform: 'desktop', year: 2023, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 7900 GRE', 'Radeon RX 7900 GRE', 'AMD Radeon RX 7900 GRE', 'AMD Radeon RX 7900 GRE Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 7900 GRE Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 31', 'AMD Navi 31', 'gfx1100'],
      specs: { fp32Tflops: 22.99, fp16Tflops: 22.99, bandwidthGBs: 576, pixelRateGps: 359.2, texelRateGts: 718.4, vramGB: 16, memType: 'GDDR6', busWidth: 256, shaderUnits: 5120, gpuCores: null, baseClockMhz: 1270, boostClockMhz: 2245 },
      note: 'Navi 31（160 ROP / 320 TMU），256-bit 16GB'
    },
    {
      id: 'amd-rx-7800-xt', vendor: 'AMD', name: 'Radeon RX 7800 XT', family: 'Radeon RX 7000',
      type: 'desktop', platform: 'desktop', year: 2023, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 7800 XT', 'Radeon RX 7800 XT', 'AMD Radeon RX 7800 XT', 'AMD Radeon RX 7800 XT Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 7800 XT Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 32', 'AMD Navi 32', 'gfx1101'],
      specs: { fp32Tflops: 18.66, fp16Tflops: 18.66, bandwidthGBs: 624.1, pixelRateGps: 233.3, texelRateGts: 583.2, vramGB: 16, memType: 'GDDR6', busWidth: 256, shaderUnits: 3840, gpuCores: null, baseClockMhz: 1295, boostClockMhz: 2430 },
      note: 'Navi 32（96 ROP / 240 TMU），19.5 Gbps GDDR6'
    },
    {
      id: 'amd-rx-7700-xt', vendor: 'AMD', name: 'Radeon RX 7700 XT', family: 'Radeon RX 7000',
      type: 'desktop', platform: 'desktop', year: 2023, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 7700 XT', 'Radeon RX 7700 XT', 'AMD Radeon RX 7700 XT', 'AMD Radeon RX 7700 XT Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 7700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 32', 'AMD Navi 32', 'gfx1101'],
      specs: { fp32Tflops: 17.58, fp16Tflops: 17.58, bandwidthGBs: 432, pixelRateGps: 244.2, texelRateGts: 549.5, vramGB: 12, memType: 'GDDR6', busWidth: 192, shaderUnits: 3456, gpuCores: null, baseClockMhz: 1700, boostClockMhz: 2544 },
      note: 'Navi 32（96 ROP / 216 TMU），192-bit 12GB'
    },
    {
      id: 'amd-rx-7600-xt', vendor: 'AMD', name: 'Radeon RX 7600 XT', family: 'Radeon RX 7000',
      type: 'desktop', platform: 'desktop', year: 2024, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 7600 XT', 'Radeon RX 7600 XT', 'AMD Radeon RX 7600 XT', 'AMD Radeon RX 7600 XT Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 7600 XT Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 33', 'AMD Navi 33', 'gfx1102'],
      specs: { fp32Tflops: 11.29, fp16Tflops: 11.29, bandwidthGBs: 288, pixelRateGps: 176.3, texelRateGts: 352.6, vramGB: 16, memType: 'GDDR6', busWidth: 128, shaderUnits: 2048, gpuCores: null, baseClockMhz: 1720, boostClockMhz: 2755 },
      note: 'Navi 33（64 ROP / 128 TMU），128-bit 16GB'
    },
    {
      id: 'amd-rx-7600', vendor: 'AMD', name: 'Radeon RX 7600', family: 'Radeon RX 7000',
      type: 'desktop', platform: 'desktop', year: 2023, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 7600', 'Radeon RX 7600', 'AMD Radeon RX 7600', 'AMD Radeon RX 7600 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 7600 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 33', 'AMD Navi 33', 'gfx1102'],
      specs: { fp32Tflops: 10.88, fp16Tflops: 10.88, bandwidthGBs: 288, pixelRateGps: 169.9, texelRateGts: 339.8, vramGB: 8, memType: 'GDDR6', busWidth: 128, shaderUnits: 2048, gpuCores: null, baseClockMhz: 1720, boostClockMhz: 2655 },
      note: 'Navi 33 满血（64 ROP / 128 TMU）'
    },
    {
      id: 'amd-rx-7650-gre', vendor: 'AMD', name: 'Radeon RX 7650 GRE', family: 'Radeon RX 7000',
      type: 'desktop', platform: 'desktop', year: 2025, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 7650 GRE', 'Radeon RX 7650 GRE', 'AMD Radeon RX 7650 GRE', 'AMD Radeon RX 7650 GRE Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 7650 GRE Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 33', 'AMD Navi 33', 'gfx1102'],
      specs: { fp32Tflops: 11.04, fp16Tflops: 11.04, bandwidthGBs: 288, pixelRateGps: 172.5, texelRateGts: 344.9, vramGB: 8, memType: 'GDDR6', busWidth: 128, shaderUnits: 2048, gpuCores: null, baseClockMhz: null, boostClockMhz: 2695 },
      note: '2025 年中国特供版本（Navi 33）'
    },

    /* ---------------------------------------------------- RX 6000 (RDNA 2) */
    {
      id: 'amd-rx-6950-xt', vendor: 'AMD', name: 'Radeon RX 6950 XT', family: 'Radeon RX 6000',
      type: 'desktop', platform: 'desktop', year: 2022, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 6950 XT', 'Radeon RX 6950 XT', 'AMD Radeon RX 6950 XT', 'AMD Radeon RX 6950 XT Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 6950 XT Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 21', 'AMD Navi 21', 'gfx1030'],
      specs: { fp32Tflops: 23.65, fp16Tflops: 23.65, bandwidthGBs: 576, pixelRateGps: 295.7, texelRateGts: 739.2, vramGB: 16, memType: 'GDDR6', busWidth: 256, shaderUnits: 5120, gpuCores: null, baseClockMhz: 1850, boostClockMhz: 2310 },
      note: 'Navi 21（128 ROP / 320 TMU），18 Gbps GDDR6'
    },
    {
      id: 'amd-rx-6900-xt', vendor: 'AMD', name: 'Radeon RX 6900 XT', family: 'Radeon RX 6000',
      type: 'desktop', platform: 'desktop', year: 2020, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 6900 XT', 'Radeon RX 6900 XT', 'AMD Radeon RX 6900 XT', 'AMD Radeon RX 6900 XT Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 6900 XT Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 21', 'AMD Navi 21', 'gfx1030'],
      specs: { fp32Tflops: 23.04, fp16Tflops: 23.04, bandwidthGBs: 512, pixelRateGps: 288.0, texelRateGts: 720.0, vramGB: 16, memType: 'GDDR6', busWidth: 256, shaderUnits: 5120, gpuCores: null, baseClockMhz: 1825, boostClockMhz: 2250 },
      note: 'Navi 21 满血（128 ROP / 320 TMU），16 Gbps GDDR6 + 128MB Infinity Cache'
    },
    {
      id: 'amd-rx-6800-xt', vendor: 'AMD', name: 'Radeon RX 6800 XT', family: 'Radeon RX 6000',
      type: 'desktop', platform: 'desktop', year: 2020, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 6800 XT', 'Radeon RX 6800 XT', 'AMD Radeon RX 6800 XT', 'AMD Radeon RX 6800 XT Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 6800 XT Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 21', 'AMD Navi 21', 'gfx1030'],
      specs: { fp32Tflops: 20.74, fp16Tflops: 20.74, bandwidthGBs: 512, pixelRateGps: 288.0, texelRateGts: 648.0, vramGB: 16, memType: 'GDDR6', busWidth: 256, shaderUnits: 4608, gpuCores: null, baseClockMhz: 1825, boostClockMhz: 2250 },
      note: 'Navi 21（128 ROP / 288 TMU）'
    },
    {
      id: 'amd-rx-6800', vendor: 'AMD', name: 'Radeon RX 6800', family: 'Radeon RX 6000',
      type: 'desktop', platform: 'desktop', year: 2020, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 6800', 'Radeon RX 6800', 'AMD Radeon RX 6800', 'AMD Radeon RX 6800 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 6800 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 21', 'AMD Navi 21', 'gfx1030'],
      specs: { fp32Tflops: 16.17, fp16Tflops: 16.17, bandwidthGBs: 512, pixelRateGps: 202.1, texelRateGts: 505.2, vramGB: 16, memType: 'GDDR6', busWidth: 256, shaderUnits: 3840, gpuCores: null, baseClockMhz: 1700, boostClockMhz: 2105 },
      note: 'Navi 21（96 ROP / 240 TMU）'
    },
    {
      id: 'amd-rx-6750-xt', vendor: 'AMD', name: 'Radeon RX 6750 XT', family: 'Radeon RX 6000',
      type: 'desktop', platform: 'desktop', year: 2022, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 6750 XT', 'Radeon RX 6750 XT', 'AMD Radeon RX 6750 XT', 'AMD Radeon RX 6750 XT Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 6750 XT Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 22', 'AMD Navi 22', 'gfx1031'],
      specs: { fp32Tflops: 13.31, fp16Tflops: 13.31, bandwidthGBs: 432, pixelRateGps: 166.4, texelRateGts: 416.0, vramGB: 12, memType: 'GDDR6', busWidth: 192, shaderUnits: 2560, gpuCores: null, baseClockMhz: 2150, boostClockMhz: 2600 },
      note: 'Navi 22（64 ROP / 160 TMU），18 Gbps GDDR6'
    },
    {
      id: 'amd-rx-6750-gre', vendor: 'AMD', name: 'Radeon RX 6750 GRE 12GB', family: 'Radeon RX 6000',
      type: 'desktop', platform: 'desktop', year: 2023, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 6750 GRE', 'Radeon RX 6750 GRE', 'AMD Radeon RX 6750 GRE', 'AMD Radeon RX 6750 GRE 12GB', 'AMD Radeon RX 6750 GRE Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 6750 GRE 12GB Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 22', 'AMD Navi 22', 'gfx1031'],
      specs: { fp32Tflops: 12.48, fp16Tflops: 12.48, bandwidthGBs: 432, pixelRateGps: 156.0, texelRateGts: 390.1, vramGB: 12, memType: 'GDDR6', busWidth: 192, shaderUnits: 2560, gpuCores: null, baseClockMhz: null, boostClockMhz: 2438 },
      note: '中国特供版本，Navi 22（64 ROP / 160 TMU）'
    },
    {
      id: 'amd-rx-6700-xt', vendor: 'AMD', name: 'Radeon RX 6700 XT', family: 'Radeon RX 6000',
      type: 'desktop', platform: 'desktop', year: 2021, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 6700 XT', 'Radeon RX 6700 XT', 'AMD Radeon RX 6700 XT', 'AMD Radeon RX 6700 XT Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 6700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 22', 'AMD Navi 22', 'gfx1031'],
      specs: { fp32Tflops: 13.21, fp16Tflops: 13.21, bandwidthGBs: 432, pixelRateGps: 165.2, texelRateGts: 413.0, vramGB: 12, memType: 'GDDR6', busWidth: 192, shaderUnits: 2560, gpuCores: null, baseClockMhz: 2321, boostClockMhz: 2581 },
      note: 'Navi 22 满血（64 ROP / 160 TMU）'
    },
    {
      id: 'amd-rx-6700', vendor: 'AMD', name: 'Radeon RX 6700 10GB', family: 'Radeon RX 6000',
      type: 'desktop', platform: 'desktop', year: 2021, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 6700', 'Radeon RX 6700', 'Radeon RX 6700 10GB', 'AMD Radeon RX 6700', 'AMD Radeon RX 6700 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 6700 10GB Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 22', 'AMD Navi 22', 'gfx1031'],
      specs: { fp32Tflops: 11.29, fp16Tflops: 11.29, bandwidthGBs: 320, pixelRateGps: 156.8, texelRateGts: 352.8, vramGB: 10, memType: 'GDDR6', busWidth: 160, shaderUnits: 2304, gpuCores: null, baseClockMhz: 1941, boostClockMhz: 2450 },
      note: 'Navi 22（64 ROP / 144 TMU），160-bit 10GB'
    },
    {
      id: 'amd-rx-6650-xt', vendor: 'AMD', name: 'Radeon RX 6650 XT', family: 'Radeon RX 6000',
      type: 'desktop', platform: 'desktop', year: 2022, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 6650 XT', 'Radeon RX 6650 XT', 'AMD Radeon RX 6650 XT', 'AMD Radeon RX 6650 XT Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 6650 XT Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 23', 'AMD Navi 23', 'gfx1032'],
      specs: { fp32Tflops: 10.79, fp16Tflops: 10.79, bandwidthGBs: 280, pixelRateGps: 168.6, texelRateGts: 337.3, vramGB: 8, memType: 'GDDR6', busWidth: 128, shaderUnits: 2048, gpuCores: null, baseClockMhz: 2055, boostClockMhz: 2635 },
      note: 'Navi 23 满血（64 ROP / 128 TMU），17.5 Gbps GDDR6'
    },
    {
      id: 'amd-rx-6600-xt', vendor: 'AMD', name: 'Radeon RX 6600 XT', family: 'Radeon RX 6000',
      type: 'desktop', platform: 'desktop', year: 2021, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 6600 XT', 'Radeon RX 6600 XT', 'AMD Radeon RX 6600 XT', 'AMD Radeon RX 6600 XT Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 6600 XT Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 23', 'AMD Navi 23', 'gfx1032'],
      specs: { fp32Tflops: 10.60, fp16Tflops: 10.60, bandwidthGBs: 256, pixelRateGps: 165.7, texelRateGts: 331.4, vramGB: 8, memType: 'GDDR6', busWidth: 128, shaderUnits: 2048, gpuCores: null, baseClockMhz: 1968, boostClockMhz: 2589 },
      note: 'Navi 23 满血（64 ROP / 128 TMU），16 Gbps GDDR6'
    },
    {
      id: 'amd-rx-6600', vendor: 'AMD', name: 'Radeon RX 6600', family: 'Radeon RX 6000',
      type: 'desktop', platform: 'desktop', year: 2021, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 6600', 'Radeon RX 6600', 'AMD Radeon RX 6600', 'AMD Radeon RX 6600 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 6600 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 23', 'AMD Navi 23', 'gfx1032'],
      specs: { fp32Tflops: 8.93, fp16Tflops: 8.93, bandwidthGBs: 224, pixelRateGps: 159.4, texelRateGts: 279.0, vramGB: 8, memType: 'GDDR6', busWidth: 128, shaderUnits: 1792, gpuCores: null, baseClockMhz: 1626, boostClockMhz: 2491 },
      note: 'Navi 23（64 ROP / 112 TMU），14 Gbps GDDR6'
    },
    {
      id: 'amd-rx-6500-xt', vendor: 'AMD', name: 'Radeon RX 6500 XT', family: 'Radeon RX 6000',
      type: 'desktop', platform: 'desktop', year: 2022, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 6500 XT', 'Radeon RX 6500 XT', 'AMD Radeon RX 6500 XT', 'AMD Radeon RX 6500 XT Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 6500 XT Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 24', 'AMD Navi 24', 'gfx1034'],
      specs: { fp32Tflops: 5.77, fp16Tflops: 5.77, bandwidthGBs: 144, pixelRateGps: 90.1, texelRateGts: 180.2, vramGB: 4, memType: 'GDDR6', busWidth: 64, shaderUnits: 1024, gpuCores: null, baseClockMhz: 2200, boostClockMhz: 2815 },
      note: 'Navi 24 满血（32 ROP / 64 TMU），64-bit 18 Gbps'
    },
    {
      id: 'amd-rx-6400', vendor: 'AMD', name: 'Radeon RX 6400', family: 'Radeon RX 6000',
      type: 'desktop', platform: 'desktop', year: 2022, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 6400', 'Radeon RX 6400', 'AMD Radeon RX 6400', 'AMD Radeon RX 6400 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 6400 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 24', 'AMD Navi 24', 'gfx1034'],
      specs: { fp32Tflops: 3.57, fp16Tflops: 3.57, bandwidthGBs: 128, pixelRateGps: 74.3, texelRateGts: 111.4, vramGB: 4, memType: 'GDDR6', busWidth: 64, shaderUnits: 768, gpuCores: null, baseClockMhz: 1923, boostClockMhz: 2321 },
      note: 'Navi 24（32 ROP / 48 TMU），半高无外接供电'
    },

    /* ---------------------------------------------------- Radeon VII（Vega 20） */
    {
      id: 'amd-radeon-vii', vendor: 'AMD', name: 'Radeon VII', family: 'Radeon Vega',
      type: 'desktop', platform: 'desktop', year: 2019, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl', 'metal'], os: ['windows', 'linux', 'macos'], unifiedMemory: false,
      aliases: ['Radeon VII', 'AMD Radeon VII', 'AMD Radeon VII Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon VII Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Vega 20', 'AMD Vega 20', 'gfx906'],
      specs: { fp32Tflops: 13.44, fp16Tflops: 13.44, bandwidthGBs: 1024, pixelRateGps: 112.0, texelRateGts: 420.0, vramGB: 16, memType: 'HBM2', busWidth: 4096, shaderUnits: 3840, gpuCores: null, baseClockMhz: 1400, boostClockMhz: 1750 },
      note: 'Vega 20（64 ROP / 240 TMU），16GB HBM2 1TB/s；Mac Pro 2019 可选'
    },

    /* ---------------------------------------------------- RX 5000 (RDNA 1) */
    {
      id: 'amd-rx-5700-xt', vendor: 'AMD', name: 'Radeon RX 5700 XT', family: 'Radeon RX 5000',
      type: 'desktop', platform: 'desktop', year: 2019, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 5700 XT', 'Radeon RX 5700 XT', 'AMD Radeon RX 5700 XT', 'AMD Radeon RX 5700 XT Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 5700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 10', 'AMD Navi 10', 'gfx1010'],
      specs: { fp32Tflops: 9.75, fp16Tflops: 9.75, bandwidthGBs: 448, pixelRateGps: 121.9, texelRateGts: 304.8, vramGB: 8, memType: 'GDDR6', busWidth: 256, shaderUnits: 2560, gpuCores: null, baseClockMhz: 1605, boostClockMhz: 1905 },
      note: 'Navi 10 满血（64 ROP / 160 TMU），14 Gbps GDDR6'
    },
    {
      id: 'amd-rx-5700', vendor: 'AMD', name: 'Radeon RX 5700', family: 'Radeon RX 5000',
      type: 'desktop', platform: 'desktop', year: 2019, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 5700', 'Radeon RX 5700', 'AMD Radeon RX 5700', 'AMD Radeon RX 5700 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 5700 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 10', 'AMD Navi 10', 'gfx1010'],
      specs: { fp32Tflops: 7.95, fp16Tflops: 7.95, bandwidthGBs: 448, pixelRateGps: 110.4, texelRateGts: 248.4, vramGB: 8, memType: 'GDDR6', busWidth: 256, shaderUnits: 2304, gpuCores: null, baseClockMhz: 1465, boostClockMhz: 1725 },
      note: 'Navi 10（64 ROP / 144 TMU）'
    },
    {
      id: 'amd-rx-5600-xt', vendor: 'AMD', name: 'Radeon RX 5600 XT', family: 'Radeon RX 5000',
      type: 'desktop', platform: 'desktop', year: 2020, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 5600 XT', 'Radeon RX 5600 XT', 'AMD Radeon RX 5600 XT', 'AMD Radeon RX 5600 XT Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 5600 XT Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 10', 'AMD Navi 10', 'gfx1010'],
      specs: { fp32Tflops: 7.19, fp16Tflops: 7.19, bandwidthGBs: 336, pixelRateGps: 99.8, texelRateGts: 224.6, vramGB: 6, memType: 'GDDR6', busWidth: 192, shaderUnits: 2304, gpuCores: null, baseClockMhz: 1130, boostClockMhz: 1560 },
      note: 'Navi 10（64 ROP / 144 TMU），192-bit 6GB'
    },
    {
      id: 'amd-rx-5500-xt', vendor: 'AMD', name: 'Radeon RX 5500 XT', family: 'Radeon RX 5000',
      type: 'desktop', platform: 'desktop', year: 2019, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 5500 XT', 'Radeon RX 5500 XT', 'AMD Radeon RX 5500 XT', 'AMD Radeon RX 5500 XT Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 5500 XT Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 14', 'AMD Navi 14', 'gfx1012'],
      specs: { fp32Tflops: 5.20, fp16Tflops: 5.20, bandwidthGBs: 224, pixelRateGps: 59.0, texelRateGts: 162.4, vramGB: 8, memType: 'GDDR6', busWidth: 128, shaderUnits: 1408, gpuCores: null, baseClockMhz: 1607, boostClockMhz: 1845 },
      note: 'Navi 14 满血（32 ROP / 88 TMU），4GB / 8GB 两种版本'
    },

    /* ---------------------------------------------------- RX Vega（GCN 5 / Vega 10） */
    {
      id: 'amd-rx-vega-64', vendor: 'AMD', name: 'Radeon RX Vega 64', family: 'Radeon RX Vega',
      type: 'desktop', platform: 'desktop', year: 2017, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl', 'metal'], os: ['windows', 'linux', 'macos'], unifiedMemory: false,
      aliases: ['RX Vega 64', 'Radeon RX Vega 64', 'AMD Radeon RX Vega 64', 'AMD Radeon RX Vega 64 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX Vega 64 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Vega 10', 'AMD Vega 10', 'gfx900'],
      specs: { fp32Tflops: 12.66, fp16Tflops: 12.66, bandwidthGBs: 483.8, pixelRateGps: 98.9, texelRateGts: 395.8, vramGB: 8, memType: 'HBM2', busWidth: 2048, shaderUnits: 4096, gpuCores: null, baseClockMhz: 1247, boostClockMhz: 1546 },
      note: 'Vega 10 满血（64 ROP / 256 TMU），2048-bit HBM2'
    },
    {
      id: 'amd-rx-vega-56', vendor: 'AMD', name: 'Radeon RX Vega 56', family: 'Radeon RX Vega',
      type: 'desktop', platform: 'desktop', year: 2017, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl', 'metal'], os: ['windows', 'linux', 'macos'], unifiedMemory: false,
      aliases: ['RX Vega 56', 'Radeon RX Vega 56', 'AMD Radeon RX Vega 56', 'AMD Radeon RX Vega 56 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX Vega 56 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Vega 10', 'AMD Vega 10', 'gfx900'],
      specs: { fp32Tflops: 10.54, fp16Tflops: 10.54, bandwidthGBs: 409.6, pixelRateGps: 94.1, texelRateGts: 329.5, vramGB: 8, memType: 'HBM2', busWidth: 2048, shaderUnits: 3584, gpuCores: null, baseClockMhz: 1156, boostClockMhz: 1471 },
      note: 'Vega 10（64 ROP / 224 TMU）'
    },
    {
      id: 'amd-rx-vega-frontier', vendor: 'AMD', name: 'Radeon Vega Frontier Edition', family: 'Radeon RX Vega',
      type: 'workstation', platform: 'desktop', year: 2017, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['Vega Frontier Edition', 'Radeon Vega Frontier Edition', 'AMD Radeon Vega Frontier Edition', 'AMD Radeon Vega Frontier Edition Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon Vega Frontier Edition Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Vega 10', 'AMD Vega 10', 'gfx900'],
      specs: { fp32Tflops: 13.11, fp16Tflops: 13.11, bandwidthGBs: 483.8, pixelRateGps: 102.4, texelRateGts: 409.6, vramGB: 16, memType: 'HBM2', busWidth: 2048, shaderUnits: 4096, gpuCores: null, baseClockMhz: 1382, boostClockMhz: 1600 },
      note: 'Vega 10 专业定位版本，16GB HBM2'
    },

    /* ---------------------------------------------------- RX 500 / 400 (Polaris) */
    {
      id: 'amd-rx-590', vendor: 'AMD', name: 'Radeon RX 590', family: 'Radeon RX 500',
      type: 'desktop', platform: 'desktop', year: 2018, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 590', 'Radeon RX 590', 'AMD Radeon RX 590', 'AMD Radeon RX 590 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 590 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Polaris 30', 'AMD Polaris 30', 'gfx803'],
      specs: { fp32Tflops: 7.12, fp16Tflops: 7.12, bandwidthGBs: 256, pixelRateGps: 49.4, texelRateGts: 222.5, vramGB: 8, memType: 'GDDR5', busWidth: 256, shaderUnits: 2304, gpuCores: null, baseClockMhz: 1469, boostClockMhz: 1545 },
      note: 'Polaris 30（32 ROP / 144 TMU），12nm 版 Polaris 10'
    },
    {
      id: 'amd-rx-580', vendor: 'AMD', name: 'Radeon RX 580', family: 'Radeon RX 500',
      type: 'desktop', platform: 'desktop', year: 2017, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl', 'metal'], os: ['windows', 'linux', 'macos'], unifiedMemory: false,
      aliases: ['RX 580', 'Radeon RX 580', 'AMD Radeon RX 580', 'AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Polaris 20', 'AMD Polaris 20', 'gfx803'],
      specs: { fp32Tflops: 6.17, fp16Tflops: 6.17, bandwidthGBs: 256, pixelRateGps: 42.9, texelRateGts: 193.0, vramGB: 8, memType: 'GDDR5', busWidth: 256, shaderUnits: 2304, gpuCores: null, baseClockMhz: 1257, boostClockMhz: 1340 },
      note: 'Polaris 20 满血（32 ROP / 144 TMU），4GB / 8GB 两种版本'
    },
    {
      id: 'amd-rx-570', vendor: 'AMD', name: 'Radeon RX 570', family: 'Radeon RX 500',
      type: 'desktop', platform: 'desktop', year: 2017, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl', 'metal'], os: ['windows', 'linux', 'macos'], unifiedMemory: false,
      aliases: ['RX 570', 'Radeon RX 570', 'AMD Radeon RX 570', 'AMD Radeon RX 570 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 570 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Polaris 20', 'AMD Polaris 20', 'gfx803'],
      specs: { fp32Tflops: 5.10, fp16Tflops: 5.10, bandwidthGBs: 224, pixelRateGps: 39.8, texelRateGts: 159.2, vramGB: 4, memType: 'GDDR5', busWidth: 256, shaderUnits: 2048, gpuCores: null, baseClockMhz: 1168, boostClockMhz: 1244 },
      note: 'Polaris 20（32 ROP / 128 TMU），7 Gbps GDDR5'
    },
    {
      id: 'amd-rx-560', vendor: 'AMD', name: 'Radeon RX 560', family: 'Radeon RX 500',
      type: 'desktop', platform: 'desktop', year: 2017, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl', 'metal'], os: ['windows', 'linux', 'macos'], unifiedMemory: false,
      aliases: ['RX 560', 'Radeon RX 560', 'AMD Radeon RX 560', 'AMD Radeon RX 560 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 560 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Polaris 21', 'AMD Polaris 21', 'gfx803'],
      specs: { fp32Tflops: 2.61, fp16Tflops: 2.61, bandwidthGBs: 112, pixelRateGps: 20.4, texelRateGts: 81.6, vramGB: 4, memType: 'GDDR5', busWidth: 128, shaderUnits: 1024, gpuCores: null, baseClockMhz: 1175, boostClockMhz: 1275 },
      note: 'Polaris 21（16 ROP / 64 TMU），另有 896 SP 版本'
    },
    {
      id: 'amd-rx-550', vendor: 'AMD', name: 'Radeon RX 550', family: 'Radeon RX 500',
      type: 'desktop', platform: 'desktop', year: 2017, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 550', 'Radeon RX 550', 'AMD Radeon RX 550', 'AMD Radeon RX 550 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 550 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Polaris 12', 'AMD Polaris 12', 'gfx803'],
      specs: { fp32Tflops: 1.21, fp16Tflops: 1.21, bandwidthGBs: 112, pixelRateGps: 18.9, texelRateGts: 37.9, vramGB: 2, memType: 'GDDR5', busWidth: 128, shaderUnits: 512, gpuCores: null, baseClockMhz: 1100, boostClockMhz: 1183 },
      note: 'Polaris 12（16 ROP / 32 TMU）'
    },
    {
      id: 'amd-rx-480', vendor: 'AMD', name: 'Radeon RX 480', family: 'Radeon RX 400',
      type: 'desktop', platform: 'desktop', year: 2016, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 480', 'Radeon RX 480', 'AMD Radeon RX 480', 'AMD Radeon RX 480 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 480 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Polaris 10', 'AMD Polaris 10', 'gfx803'],
      specs: { fp32Tflops: 5.83, fp16Tflops: 5.83, bandwidthGBs: 256, pixelRateGps: 40.5, texelRateGts: 182.3, vramGB: 8, memType: 'GDDR5', busWidth: 256, shaderUnits: 2304, gpuCores: null, baseClockMhz: 1120, boostClockMhz: 1266 },
      note: 'Polaris 10（32 ROP / 144 TMU），4GB / 8GB 两种版本'
    },
    {
      id: 'amd-rx-470', vendor: 'AMD', name: 'Radeon RX 470', family: 'Radeon RX 400',
      type: 'desktop', platform: 'desktop', year: 2016, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 470', 'Radeon RX 470', 'AMD Radeon RX 470', 'AMD Radeon RX 470 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 470 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Polaris 10', 'AMD Polaris 10', 'gfx803'],
      specs: { fp32Tflops: 4.94, fp16Tflops: 4.94, bandwidthGBs: 211, pixelRateGps: 38.6, texelRateGts: 154.4, vramGB: 4, memType: 'GDDR5', busWidth: 256, shaderUnits: 2048, gpuCores: null, baseClockMhz: 926, boostClockMhz: 1206 },
      note: 'Polaris 10（32 ROP / 128 TMU），6.6 Gbps GDDR5'
    },
    {
      id: 'amd-rx-460', vendor: 'AMD', name: 'Radeon RX 460', family: 'Radeon RX 400',
      type: 'desktop', platform: 'desktop', year: 2016, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 460', 'Radeon RX 460', 'AMD Radeon RX 460', 'AMD Radeon RX 460 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 460 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Polaris 11', 'AMD Polaris 11', 'gfx803'],
      specs: { fp32Tflops: 2.15, fp16Tflops: 2.15, bandwidthGBs: 112, pixelRateGps: 19.2, texelRateGts: 67.2, vramGB: 4, memType: 'GDDR5', busWidth: 128, shaderUnits: 896, gpuCores: null, baseClockMhz: 1090, boostClockMhz: 1200 },
      note: 'Polaris 11（16 ROP / 56 TMU）'
    },

    /* ---------------------------------------------------- R9 300 / Fury (GCN 3) */
    {
      id: 'amd-r9-fury-x', vendor: 'AMD', name: 'Radeon R9 Fury X', family: 'Radeon R9 300',
      type: 'desktop', platform: 'desktop', year: 2015, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['R9 Fury X', 'Radeon R9 Fury X', 'AMD Radeon R9 Fury X', 'AMD Radeon R9 Fury X Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon R9 Fury X Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Fiji', 'AMD Fiji', 'gfx803'],
      specs: { fp32Tflops: 8.60, fp16Tflops: 8.60, bandwidthGBs: 512, pixelRateGps: 67.2, texelRateGts: 268.8, vramGB: 4, memType: 'HBM', busWidth: 4096, shaderUnits: 4096, gpuCores: null, baseClockMhz: 1050, boostClockMhz: 1050 },
      note: 'Fiji 满血（64 ROP / 256 TMU），首款 HBM 显卡'
    },
    {
      id: 'amd-r9-nano', vendor: 'AMD', name: 'Radeon R9 Nano', family: 'Radeon R9 300',
      type: 'desktop', platform: 'desktop', year: 2015, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['R9 Nano', 'Radeon R9 Nano', 'AMD Radeon R9 Nano', 'AMD Radeon R9 Nano Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon R9 Nano Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Fiji', 'AMD Fiji', 'gfx803'],
      specs: { fp32Tflops: 8.19, fp16Tflops: 8.19, bandwidthGBs: 512, pixelRateGps: 64.0, texelRateGts: 256.0, vramGB: 4, memType: 'HBM', busWidth: 4096, shaderUnits: 4096, gpuCores: null, baseClockMhz: 1000, boostClockMhz: 1000 },
      note: 'Fiji，175W 短卡版本'
    },
    {
      id: 'amd-r9-390x', vendor: 'AMD', name: 'Radeon R9 390X', family: 'Radeon R9 300',
      type: 'desktop', platform: 'desktop', year: 2015, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['R9 390X', 'Radeon R9 390X', 'AMD Radeon R9 390X', 'AMD Radeon R9 390X Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon R9 390X Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Hawaii', 'AMD Hawaii', 'gfx701'],
      specs: { fp32Tflops: 5.91, fp16Tflops: 5.91, bandwidthGBs: 384, pixelRateGps: 67.2, texelRateGts: 184.8, vramGB: 8, memType: 'GDDR5', busWidth: 512, shaderUnits: 2816, gpuCores: null, baseClockMhz: 1050, boostClockMhz: 1050 },
      note: 'Hawaii 满血（64 ROP / 176 TMU），512-bit'
    },
    {
      id: 'amd-r9-390', vendor: 'AMD', name: 'Radeon R9 390', family: 'Radeon R9 300',
      type: 'desktop', platform: 'desktop', year: 2015, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['R9 390', 'Radeon R9 390', 'AMD Radeon R9 390', 'AMD Radeon R9 390 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon R9 390 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Hawaii', 'AMD Hawaii', 'gfx701'],
      specs: { fp32Tflops: 5.12, fp16Tflops: 5.12, bandwidthGBs: 384, pixelRateGps: 64.0, texelRateGts: 160.0, vramGB: 8, memType: 'GDDR5', busWidth: 512, shaderUnits: 2560, gpuCores: null, baseClockMhz: 1000, boostClockMhz: 1000 },
      note: 'Hawaii（64 ROP / 160 TMU）'
    },
    {
      id: 'amd-r9-380', vendor: 'AMD', name: 'Radeon R9 380', family: 'Radeon R9 300',
      type: 'desktop', platform: 'desktop', year: 2015, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['R9 380', 'Radeon R9 380', 'AMD Radeon R9 380', 'AMD Radeon R9 380 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon R9 380 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Tonga', 'AMD Tonga', 'gfx802'],
      specs: { fp32Tflops: 3.48, fp16Tflops: 3.48, bandwidthGBs: 182.4, pixelRateGps: 31.0, texelRateGts: 108.6, vramGB: 4, memType: 'GDDR5', busWidth: 256, shaderUnits: 1792, gpuCores: null, baseClockMhz: 970, boostClockMhz: 970 },
      note: 'Tonga 满血（32 ROP / 112 TMU）'
    },

    /* ---------------------------------------------------- R9 200 (GCN 2 / Hawaii-Tahiti) */
    {
      id: 'amd-r9-290x', vendor: 'AMD', name: 'Radeon R9 290X', family: 'Radeon R9 200',
      type: 'desktop', platform: 'desktop', year: 2013, api: 'd3d11', apis: ['d3d11', 'd3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['R9 290X', 'Radeon R9 290X', 'AMD Radeon R9 290X', 'AMD Radeon R9 290X Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon R9 290X Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Hawaii', 'AMD Hawaii', 'gfx701'],
      specs: { fp32Tflops: 5.63, fp16Tflops: 5.63, bandwidthGBs: 320, pixelRateGps: 64.0, texelRateGts: 176.0, vramGB: 4, memType: 'GDDR5', busWidth: 512, shaderUnits: 2816, gpuCores: null, baseClockMhz: 1000, boostClockMhz: 1000 },
      note: 'Hawaii XT（64 ROP / 176 TMU）'
    },
    {
      id: 'amd-r9-290', vendor: 'AMD', name: 'Radeon R9 290', family: 'Radeon R9 200',
      type: 'desktop', platform: 'desktop', year: 2013, api: 'd3d11', apis: ['d3d11', 'd3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['R9 290', 'Radeon R9 290', 'AMD Radeon R9 290', 'AMD Radeon R9 290 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon R9 290 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Hawaii', 'AMD Hawaii', 'gfx701'],
      specs: { fp32Tflops: 4.85, fp16Tflops: 4.85, bandwidthGBs: 320, pixelRateGps: 60.6, texelRateGts: 151.5, vramGB: 4, memType: 'GDDR5', busWidth: 512, shaderUnits: 2560, gpuCores: null, baseClockMhz: 947, boostClockMhz: 947 },
      note: 'Hawaii Pro（64 ROP / 160 TMU）'
    },
    {
      id: 'amd-r9-280x', vendor: 'AMD', name: 'Radeon R9 280X', family: 'Radeon R9 200',
      type: 'desktop', platform: 'desktop', year: 2013, api: 'd3d11', apis: ['d3d11', 'd3d12', 'vulkan', 'opengl', 'metal'], os: ['windows', 'linux', 'macos'], unifiedMemory: false,
      aliases: ['R9 280X', 'Radeon R9 280X', 'AMD Radeon R9 280X', 'AMD Radeon R9 280X Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon R9 280X Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Tahiti', 'AMD Tahiti', 'gfx600'],
      specs: { fp32Tflops: 4.10, fp16Tflops: 4.10, bandwidthGBs: 288, pixelRateGps: 32.0, texelRateGts: 128.0, vramGB: 3, memType: 'GDDR5', busWidth: 384, shaderUnits: 2048, gpuCores: null, baseClockMhz: 1000, boostClockMhz: 1000 },
      note: 'Tahiti XTL（32 ROP / 128 TMU），Mac Pro 2013 D700 同源'
    },
    {
      id: 'amd-r9-270x', vendor: 'AMD', name: 'Radeon R9 270X', family: 'Radeon R9 200',
      type: 'desktop', platform: 'desktop', year: 2013, api: 'd3d11', apis: ['d3d11', 'd3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['R9 270X', 'Radeon R9 270X', 'AMD Radeon R9 270X', 'AMD Radeon R9 270X Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon R9 270X Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Curacao', 'Pitcairn', 'AMD Curacao', 'gfx601'],
      specs: { fp32Tflops: 2.69, fp16Tflops: 2.69, bandwidthGBs: 179, pixelRateGps: 33.6, texelRateGts: 84.0, vramGB: 2, memType: 'GDDR5', busWidth: 256, shaderUnits: 1280, gpuCores: null, baseClockMhz: 1050, boostClockMhz: 1050 },
      note: 'Curacao XT / Pitcairn 核心（32 ROP / 80 TMU）'
    },

    /* ---------------------------------------------------- HD 7000 (GCN 1.0) */
    {
      id: 'amd-hd-7970', vendor: 'AMD', name: 'Radeon HD 7970', family: 'Radeon HD 7000',
      type: 'desktop', platform: 'desktop', year: 2012, api: 'd3d11', apis: ['d3d11', 'd3d12', 'vulkan', 'opengl', 'metal'], os: ['windows', 'linux', 'macos'], unifiedMemory: false,
      aliases: ['HD 7970', 'Radeon HD 7970', 'AMD Radeon HD 7970', 'AMD Radeon HD 7970 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon HD 7970 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Tahiti', 'AMD Tahiti', 'gfx600'],
      specs: { fp32Tflops: 3.79, fp16Tflops: 3.79, bandwidthGBs: 264, pixelRateGps: 29.6, texelRateGts: 118.4, vramGB: 3, memType: 'GDDR5', busWidth: 384, shaderUnits: 2048, gpuCores: null, baseClockMhz: 925, boostClockMhz: 925 },
      note: 'Tahiti XT（32 ROP / 128 TMU），首发 GCN 1.0 旗舰'
    },
    {
      id: 'amd-hd-7950', vendor: 'AMD', name: 'Radeon HD 7950', family: 'Radeon HD 7000',
      type: 'desktop', platform: 'desktop', year: 2012, api: 'd3d11', apis: ['d3d11', 'd3d12', 'vulkan', 'opengl', 'metal'], os: ['windows', 'linux', 'macos'], unifiedMemory: false,
      aliases: ['HD 7950', 'Radeon HD 7950', 'AMD Radeon HD 7950', 'AMD Radeon HD 7950 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon HD 7950 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Tahiti', 'AMD Tahiti', 'gfx600'],
      specs: { fp32Tflops: 3.32, fp16Tflops: 3.32, bandwidthGBs: 240, pixelRateGps: 29.6, texelRateGts: 103.6, vramGB: 3, memType: 'GDDR5', busWidth: 384, shaderUnits: 1792, gpuCores: null, baseClockMhz: 800, boostClockMhz: 925 },
      note: 'Tahiti Pro（32 ROP / 112 TMU），Mac Pro 2013 D500 同源'
    },
    {
      id: 'amd-hd-7870', vendor: 'AMD', name: 'Radeon HD 7870', family: 'Radeon HD 7000',
      type: 'desktop', platform: 'desktop', year: 2012, api: 'd3d11', apis: ['d3d11', 'd3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['HD 7870', 'Radeon HD 7870', 'AMD Radeon HD 7870', 'AMD Radeon HD 7870 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon HD 7870 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Pitcairn', 'AMD Pitcairn', 'gfx601'],
      specs: { fp32Tflops: 2.56, fp16Tflops: 2.56, bandwidthGBs: 153.6, pixelRateGps: 32.0, texelRateGts: 80.0, vramGB: 2, memType: 'GDDR5', busWidth: 256, shaderUnits: 1280, gpuCores: null, baseClockMhz: 1000, boostClockMhz: 1000 },
      note: 'Pitcairn XT（32 ROP / 80 TMU）'
    },
    {
      id: 'amd-hd-7850', vendor: 'AMD', name: 'Radeon HD 7850', family: 'Radeon HD 7000',
      type: 'desktop', platform: 'desktop', year: 2012, api: 'd3d11', apis: ['d3d11', 'd3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['HD 7850', 'Radeon HD 7850', 'AMD Radeon HD 7850', 'AMD Radeon HD 7850 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon HD 7850 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Pitcairn', 'AMD Pitcairn', 'gfx601'],
      specs: { fp32Tflops: 1.76, fp16Tflops: 1.76, bandwidthGBs: 153.6, pixelRateGps: 27.5, texelRateGts: 55.0, vramGB: 2, memType: 'GDDR5', busWidth: 256, shaderUnits: 1024, gpuCores: null, baseClockMhz: 860, boostClockMhz: 860 },
      note: 'Pitcairn Pro（32 ROP / 64 TMU）'
    },
    {
      id: 'amd-hd-7770', vendor: 'AMD', name: 'Radeon HD 7770', family: 'Radeon HD 7000',
      type: 'desktop', platform: 'desktop', year: 2012, api: 'd3d11', apis: ['d3d11', 'd3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['HD 7770', 'Radeon HD 7770', 'AMD Radeon HD 7770', 'AMD Radeon HD 7770 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon HD 7770 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Cape Verde', 'AMD Cape Verde', 'gfx602'],
      specs: { fp32Tflops: 1.28, fp16Tflops: 1.28, bandwidthGBs: 72, pixelRateGps: 16.0, texelRateGts: 40.0, vramGB: 1, memType: 'GDDR5', busWidth: 128, shaderUnits: 640, gpuCores: null, baseClockMhz: 1000, boostClockMhz: 1000 },
      note: 'Cape Verde XT（16 ROP / 40 TMU）'
    },
    {
      id: 'amd-hd-6970', vendor: 'AMD', name: 'Radeon HD 6970', family: 'Radeon HD 6000',
      type: 'desktop', platform: 'desktop', year: 2010, api: 'd3d11', apis: ['d3d11', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['HD 6970', 'Radeon HD 6970', 'AMD Radeon HD 6970', 'AMD Radeon HD 6970 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon HD 6970 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Cayman', 'AMD Cayman'],
      specs: { fp32Tflops: 2.70, fp16Tflops: 2.70, bandwidthGBs: 176, pixelRateGps: 28.2, texelRateGts: 84.5, vramGB: 2, memType: 'GDDR5', busWidth: 256, shaderUnits: 1536, gpuCores: null, baseClockMhz: 880, boostClockMhz: 880 },
      note: 'Cayman XT（VLIW4，32 ROP / 96 TMU），仅 D3D11'
    },
    {
      id: 'amd-hd-5870', vendor: 'AMD', name: 'Radeon HD 5870', family: 'Radeon HD 5000',
      type: 'desktop', platform: 'desktop', year: 2009, api: 'd3d11', apis: ['d3d11', 'opengl'], os: ['windows', 'linux', 'macos'], unifiedMemory: false,
      aliases: ['HD 5870', 'Radeon HD 5870', 'AMD Radeon HD 5870', 'ATI Radeon HD 5870', 'AMD Radeon HD 5870 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon HD 5870 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Cypress', 'AMD Cypress'],
      specs: { fp32Tflops: 2.72, fp16Tflops: 2.72, bandwidthGBs: 153.6, pixelRateGps: 27.2, texelRateGts: 68.0, vramGB: 1, memType: 'GDDR5', busWidth: 256, shaderUnits: 1600, gpuCores: null, baseClockMhz: 850, boostClockMhz: 850 },
      note: 'Cypress XT（VLIW5，32 ROP / 80 TMU），仅 D3D11'
    },

    /* ==================================================================
     * 四、AMD 笔记本独显 / 核显 APU / 专业卡
     * ================================================================== */

    /* ---------------------------------------------------- RX 7000M / 6000M 移动独显 */
    {
      id: 'amd-rx-7900m', vendor: 'AMD', name: 'Radeon RX 7900M', family: 'Radeon RX 7000M',
      type: 'laptop', platform: 'laptop', year: 2023, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 7900M', 'Radeon RX 7900M', 'AMD Radeon RX 7900M', 'AMD Radeon RX 7900M Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 7900M Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 31', 'AMD Navi 31', 'gfx1100'],
      specs: { fp32Tflops: 19.26, fp16Tflops: 19.26, bandwidthGBs: 576, pixelRateGps: 267.5, texelRateGts: 601.9, vramGB: 16, memType: 'GDDR6', busWidth: 256, shaderUnits: 4608, gpuCores: null, baseClockMhz: null, boostClockMhz: 2090 },
      note: 'Navi 31 移动旗舰（128 ROP / 288 TMU）'
    },
    {
      id: 'amd-rx-7600m-xt', vendor: 'AMD', name: 'Radeon RX 7600M XT', family: 'Radeon RX 7000M',
      type: 'laptop', platform: 'laptop', year: 2023, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 7600M XT', 'Radeon RX 7600M XT', 'AMD Radeon RX 7600M XT', 'AMD Radeon RX 7600M XT Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 7600M XT Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 33', 'AMD Navi 33', 'gfx1102'],
      specs: { fp32Tflops: 9.42, fp16Tflops: 9.42, bandwidthGBs: 288, pixelRateGps: 147.2, texelRateGts: 294.4, vramGB: 8, memType: 'GDDR6', busWidth: 128, shaderUnits: 2048, gpuCores: null, baseClockMhz: null, boostClockMhz: 2300 },
      note: 'Navi 33 满血移动版（64 ROP / 128 TMU）'
    },
    {
      id: 'amd-rx-7600m', vendor: 'AMD', name: 'Radeon RX 7600M', family: 'Radeon RX 7000M',
      type: 'laptop', platform: 'laptop', year: 2023, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 7600M', 'Radeon RX 7600M', 'AMD Radeon RX 7600M', 'AMD Radeon RX 7600M Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 7600M Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 33', 'AMD Navi 33', 'gfx1102'],
      specs: { fp32Tflops: 7.42, fp16Tflops: 7.42, bandwidthGBs: 288, pixelRateGps: 132.5, texelRateGts: 231.8, vramGB: 8, memType: 'GDDR6', busWidth: 128, shaderUnits: 1792, gpuCores: null, baseClockMhz: null, boostClockMhz: 2070 },
      note: 'Navi 33 移动版（64 ROP / 112 TMU）'
    },
    {
      id: 'amd-rx-6850m-xt', vendor: 'AMD', name: 'Radeon RX 6850M XT', family: 'Radeon RX 6000M',
      type: 'laptop', platform: 'laptop', year: 2022, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 6850M XT', 'Radeon RX 6850M XT', 'AMD Radeon RX 6850M XT', 'AMD Radeon RX 6850M XT Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 6850M XT Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 22', 'AMD Navi 22', 'gfx1031'],
      specs: { fp32Tflops: 12.61, fp16Tflops: 12.61, bandwidthGBs: 432, pixelRateGps: 157.6, texelRateGts: 394.1, vramGB: 12, memType: 'GDDR6', busWidth: 192, shaderUnits: 2560, gpuCores: null, baseClockMhz: null, boostClockMhz: 2463 },
      note: 'Navi 22 移动版（64 ROP / 160 TMU）'
    },
    {
      id: 'amd-rx-6800m', vendor: 'AMD', name: 'Radeon RX 6800M', family: 'Radeon RX 6000M',
      type: 'laptop', platform: 'laptop', year: 2021, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 6800M', 'Radeon RX 6800M', 'AMD Radeon RX 6800M', 'AMD Radeon RX 6800M Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 6800M Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 22', 'AMD Navi 22', 'gfx1031'],
      specs: { fp32Tflops: 11.78, fp16Tflops: 11.78, bandwidthGBs: 384, pixelRateGps: 147.2, texelRateGts: 368.0, vramGB: 12, memType: 'GDDR6', busWidth: 192, shaderUnits: 2560, gpuCores: null, baseClockMhz: null, boostClockMhz: 2300 },
      note: 'Navi 22 移动版（64 ROP / 160 TMU），16 Gbps GDDR6'
    },
    {
      id: 'amd-rx-6700m', vendor: 'AMD', name: 'Radeon RX 6700M', family: 'Radeon RX 6000M',
      type: 'laptop', platform: 'laptop', year: 2021, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 6700M', 'Radeon RX 6700M', 'AMD Radeon RX 6700M', 'AMD Radeon RX 6700M Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 6700M Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 22', 'AMD Navi 22', 'gfx1031'],
      specs: { fp32Tflops: 10.60, fp16Tflops: 10.60, bandwidthGBs: 320, pixelRateGps: 147.2, texelRateGts: 331.2, vramGB: 10, memType: 'GDDR6', busWidth: 160, shaderUnits: 2304, gpuCores: null, baseClockMhz: null, boostClockMhz: 2300 },
      note: 'Navi 22 移动版（64 ROP / 144 TMU），160-bit 10GB'
    },
    {
      id: 'amd-rx-6600m', vendor: 'AMD', name: 'Radeon RX 6600M', family: 'Radeon RX 6000M',
      type: 'laptop', platform: 'laptop', year: 2021, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 6600M', 'Radeon RX 6600M', 'AMD Radeon RX 6600M', 'AMD Radeon RX 6600M Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 6600M Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 23', 'AMD Navi 23', 'gfx1032'],
      specs: { fp32Tflops: 7.80, fp16Tflops: 7.80, bandwidthGBs: 224, pixelRateGps: 139.3, texelRateGts: 243.8, vramGB: 8, memType: 'GDDR6', busWidth: 128, shaderUnits: 1792, gpuCores: null, baseClockMhz: null, boostClockMhz: 2177 },
      note: 'Navi 23 移动版（64 ROP / 112 TMU）'
    },
    {
      id: 'amd-rx-6500m', vendor: 'AMD', name: 'Radeon RX 6500M', family: 'Radeon RX 6000M',
      type: 'laptop', platform: 'laptop', year: 2022, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['RX 6500M', 'Radeon RX 6500M', 'AMD Radeon RX 6500M', 'AMD Radeon RX 6500M Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX 6500M Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 24', 'AMD Navi 24', 'gfx1034'],
      specs: { fp32Tflops: 4.49, fp16Tflops: 4.49, bandwidthGBs: 144, pixelRateGps: 70.1, texelRateGts: 140.2, vramGB: 4, memType: 'GDDR6', busWidth: 64, shaderUnits: 1024, gpuCores: null, baseClockMhz: null, boostClockMhz: 2191 },
      note: 'Navi 24 移动版（32 ROP / 64 TMU）'
    },

    /* ---------------------------------------------------- 核显 APU（统一内存） */
    {
      id: 'amd-radeon-890m', vendor: 'AMD', name: 'AMD Radeon 890M', family: 'Radeon 800M (APU)',
      type: 'laptop', platform: 'laptop', year: 2024, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: true,
      aliases: ['Radeon 890M', 'AMD Radeon 890M', 'AMD Radeon 890M Graphics', 'AMD Radeon 890M Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon 890M Direct3D11 vs_5_0 ps_5_0, D3D11)', 'gfx1150', 'Strix Point', 'AMD Strix Point'],
      specs: { fp32Tflops: 5.94, fp16Tflops: 5.94, bandwidthGBs: null, pixelRateGps: null, texelRateGts: 185.6, vramGB: null, memType: 'LPDDR5X', busWidth: null, shaderUnits: 1024, gpuCores: 16, baseClockMhz: null, boostClockMhz: 2900 },
      note: 'Strix Point 核显，RDNA 3.5，16 CU；显存与带宽取决于系统内存'
    },
    {
      id: 'amd-radeon-880m', vendor: 'AMD', name: 'AMD Radeon 880M', family: 'Radeon 800M (APU)',
      type: 'laptop', platform: 'laptop', year: 2024, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: true,
      aliases: ['Radeon 880M', 'AMD Radeon 880M', 'AMD Radeon 880M Graphics', 'AMD Radeon 880M Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon 880M Direct3D11 vs_5_0 ps_5_0, D3D11)', 'gfx1150', 'Strix Point', 'AMD Strix Point'],
      specs: { fp32Tflops: 4.45, fp16Tflops: 4.45, bandwidthGBs: null, pixelRateGps: null, texelRateGts: 139.2, vramGB: null, memType: 'LPDDR5X', busWidth: null, shaderUnits: 768, gpuCores: 12, baseClockMhz: null, boostClockMhz: 2900 },
      note: 'Strix Point 核显，RDNA 3.5，12 CU'
    },
    {
      id: 'amd-radeon-780m', vendor: 'AMD', name: 'AMD Radeon 780M', family: 'Radeon 700M (APU)',
      type: 'laptop', platform: 'laptop', year: 2023, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: true,
      aliases: ['Radeon 780M', 'AMD Radeon 780M', 'AMD Radeon 780M Graphics', 'AMD Radeon 780M Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon 780M Direct3D11 vs_5_0 ps_5_0, D3D11)', 'gfx1103', 'Phoenix', 'AMD Phoenix'],
      specs: { fp32Tflops: 4.15, fp16Tflops: 4.15, bandwidthGBs: null, pixelRateGps: null, texelRateGts: 129.6, vramGB: null, memType: 'DDR5/LPDDR5', busWidth: null, shaderUnits: 768, gpuCores: 12, baseClockMhz: null, boostClockMhz: 2700 },
      note: 'Phoenix 核显，RDNA 3，12 CU；共享系统内存'
    },
    {
      id: 'amd-radeon-760m', vendor: 'AMD', name: 'AMD Radeon 760M', family: 'Radeon 700M (APU)',
      type: 'laptop', platform: 'laptop', year: 2023, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: true,
      aliases: ['Radeon 760M', 'AMD Radeon 760M', 'AMD Radeon 760M Graphics', 'AMD Radeon 760M Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon 760M Direct3D11 vs_5_0 ps_5_0, D3D11)', 'gfx1103', 'Phoenix', 'AMD Phoenix'],
      specs: { fp32Tflops: 2.66, fp16Tflops: 2.66, bandwidthGBs: null, pixelRateGps: null, texelRateGts: 83.2, vramGB: null, memType: 'DDR5/LPDDR5', busWidth: null, shaderUnits: 512, gpuCores: 8, baseClockMhz: null, boostClockMhz: 2600 },
      note: 'Phoenix 核显，RDNA 3，8 CU'
    },
    {
      id: 'amd-radeon-740m', vendor: 'AMD', name: 'AMD Radeon 740M', family: 'Radeon 700M (APU)',
      type: 'laptop', platform: 'laptop', year: 2023, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: true,
      aliases: ['Radeon 740M', 'AMD Radeon 740M', 'AMD Radeon 740M Graphics', 'AMD Radeon 740M Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon 740M Direct3D11 vs_5_0 ps_5_0, D3D11)', 'gfx1103', 'Phoenix', 'AMD Phoenix'],
      specs: { fp32Tflops: 1.28, fp16Tflops: 1.28, bandwidthGBs: null, pixelRateGps: null, texelRateGts: 40.0, vramGB: null, memType: 'DDR5/LPDDR5', busWidth: null, shaderUnits: 256, gpuCores: 4, baseClockMhz: null, boostClockMhz: 2500 },
      note: 'Phoenix 核显，RDNA 3，4 CU'
    },
    {
      id: 'amd-radeon-680m', vendor: 'AMD', name: 'AMD Radeon 680M', family: 'Radeon 600M (APU)',
      type: 'laptop', platform: 'laptop', year: 2022, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: true,
      aliases: ['Radeon 680M', 'AMD Radeon 680M', 'AMD Radeon 680M Graphics', 'AMD Radeon 680M Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon 680M Direct3D11 vs_5_0 ps_5_0, D3D11)', 'gfx1035', 'Rembrandt', 'AMD Rembrandt'],
      specs: { fp32Tflops: 3.38, fp16Tflops: 3.38, bandwidthGBs: null, pixelRateGps: null, texelRateGts: 105.6, vramGB: null, memType: 'DDR5/LPDDR5', busWidth: null, shaderUnits: 768, gpuCores: 12, baseClockMhz: null, boostClockMhz: 2200 },
      note: 'Rembrandt 核显，RDNA 2，12 CU'
    },
    {
      id: 'amd-radeon-660m', vendor: 'AMD', name: 'AMD Radeon 660M', family: 'Radeon 600M (APU)',
      type: 'laptop', platform: 'laptop', year: 2022, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: true,
      aliases: ['Radeon 660M', 'AMD Radeon 660M', 'AMD Radeon 660M Graphics', 'AMD Radeon 660M Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon 660M Direct3D11 vs_5_0 ps_5_0, D3D11)', 'gfx1035', 'Rembrandt', 'AMD Rembrandt'],
      specs: { fp32Tflops: 1.46, fp16Tflops: 1.46, bandwidthGBs: null, pixelRateGps: null, texelRateGts: 45.6, vramGB: null, memType: 'DDR5/LPDDR5', busWidth: null, shaderUnits: 384, gpuCores: 6, baseClockMhz: null, boostClockMhz: 1900 },
      note: 'Rembrandt 核显，RDNA 2，6 CU'
    },
    {
      id: 'amd-radeon-graphics-rdna2', vendor: 'AMD', name: 'AMD Radeon Graphics (Ryzen 7000 核显)', family: 'Radeon (APU)',
      type: 'desktop', platform: 'desktop', year: 2022, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: true,
      aliases: ['Radeon Graphics', 'AMD Radeon Graphics', 'AMD Radeon Graphics (Raphael)', 'AMD Radeon Graphics Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)', 'gfx1036', 'Raphael', 'AMD Raphael'],
      specs: { fp32Tflops: 0.56, fp16Tflops: 0.56, bandwidthGBs: null, pixelRateGps: null, texelRateGts: 17.6, vramGB: null, memType: 'DDR5', busWidth: null, shaderUnits: 128, gpuCores: 2, baseClockMhz: null, boostClockMhz: 2200 },
      note: 'Ryzen 7000 桌面核显，RDNA 2，2 CU（Raphael）'
    },
    {
      id: 'amd-vega-11', vendor: 'AMD', name: 'AMD Radeon RX Vega 11', family: 'Radeon Vega (APU)',
      type: 'desktop', platform: 'desktop', year: 2018, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: true,
      aliases: ['Vega 11', 'Radeon RX Vega 11', 'AMD Radeon RX Vega 11', 'AMD Radeon RX Vega 11 Graphics', 'AMD Radeon RX Vega 11 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX Vega 11 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'gfx902', 'Raven Ridge', 'AMD Raven Ridge'],
      specs: { fp32Tflops: 1.76, fp16Tflops: 1.76, bandwidthGBs: null, pixelRateGps: null, texelRateGts: 55.0, vramGB: null, memType: 'DDR4', busWidth: null, shaderUnits: 704, gpuCores: 11, baseClockMhz: null, boostClockMhz: 1250 },
      note: 'Raven Ridge 核显（Ryzen 5 2400G 等），Vega 11 CU'
    },
    {
      id: 'amd-vega-8', vendor: 'AMD', name: 'AMD Radeon RX Vega 8', family: 'Radeon Vega (APU)',
      type: 'laptop', platform: 'laptop', year: 2018, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: true,
      aliases: ['Vega 8', 'Radeon RX Vega 8', 'AMD Radeon RX Vega 8', 'AMD Radeon Vega 8 Graphics', 'AMD Radeon RX Vega 8 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX Vega 8 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'gfx902', 'gfx90c', 'Raven Ridge', 'AMD Raven Ridge'],
      specs: { fp32Tflops: 1.13, fp16Tflops: 1.13, bandwidthGBs: null, pixelRateGps: null, texelRateGts: 35.2, vramGB: null, memType: 'DDR4', busWidth: null, shaderUnits: 512, gpuCores: 8, baseClockMhz: null, boostClockMhz: 1100 },
      note: 'Raven Ridge / Renoir 核显，8 CU；频率随型号 1100-2000 MHz 变动'
    },
    {
      id: 'amd-vega-10', vendor: 'AMD', name: 'AMD Radeon RX Vega 10', family: 'Radeon Vega (APU)',
      type: 'laptop', platform: 'laptop', year: 2017, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: true,
      aliases: ['Vega 10', 'Radeon RX Vega 10', 'AMD Radeon RX Vega 10', 'AMD Radeon Vega 10 Graphics', 'AMD Radeon RX Vega 10 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX Vega 10 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'gfx902', 'Raven Ridge', 'AMD Raven Ridge'],
      specs: { fp32Tflops: 1.66, fp16Tflops: 1.66, bandwidthGBs: null, pixelRateGps: null, texelRateGts: 52.0, vramGB: null, memType: 'DDR4', busWidth: null, shaderUnits: 640, gpuCores: 10, baseClockMhz: null, boostClockMhz: 1300 },
      note: 'Raven Ridge 核显（Ryzen 7 2700U 等），10 CU'
    },
    {
      id: 'amd-vega-7', vendor: 'AMD', name: 'AMD Radeon RX Vega 7', family: 'Radeon Vega (APU)',
      type: 'laptop', platform: 'laptop', year: 2020, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: true,
      aliases: ['Vega 7', 'Radeon RX Vega 7', 'AMD Radeon RX Vega 7', 'AMD Radeon Vega 7 Graphics', 'AMD Radeon RX Vega 7 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX Vega 7 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'gfx90c', 'Renoir', 'AMD Renoir', 'Lucienne'],
      specs: { fp32Tflops: 1.43, fp16Tflops: 1.43, bandwidthGBs: null, pixelRateGps: null, texelRateGts: 44.8, vramGB: null, memType: 'DDR4/LPDDR4X', busWidth: null, shaderUnits: 448, gpuCores: 7, baseClockMhz: null, boostClockMhz: 1600 },
      note: 'Renoir / Lucienne 核显（Ryzen 4000/5000U），7 CU'
    },
    {
      id: 'amd-vega-6', vendor: 'AMD', name: 'AMD Radeon RX Vega 6', family: 'Radeon Vega (APU)',
      type: 'laptop', platform: 'laptop', year: 2020, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: true,
      aliases: ['Vega 6', 'Radeon RX Vega 6', 'AMD Radeon RX Vega 6', 'AMD Radeon Vega 6 Graphics', 'AMD Radeon RX Vega 6 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon RX Vega 6 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'gfx90c', 'Renoir', 'AMD Renoir', 'Lucienne'],
      specs: { fp32Tflops: 1.15, fp16Tflops: 1.15, bandwidthGBs: null, pixelRateGps: null, texelRateGts: 36.0, vramGB: null, memType: 'DDR4/LPDDR4X', busWidth: null, shaderUnits: 384, gpuCores: 6, baseClockMhz: null, boostClockMhz: 1500 },
      note: 'Renoir / Lucienne 核显（Ryzen 5 4500U 等），6 CU'
    },
    {
      id: 'amd-vega-3', vendor: 'AMD', name: 'AMD Radeon Vega 3', family: 'Radeon Vega (APU)',
      type: 'laptop', platform: 'laptop', year: 2019, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: true,
      aliases: ['Vega 3', 'Radeon Vega 3', 'AMD Radeon Vega 3', 'AMD Radeon Vega 3 Graphics', 'AMD Radeon Vega 3 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon Vega 3 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'gfx902', 'gfx909', 'Raven Ridge', 'AMD Raven Ridge'],
      specs: { fp32Tflops: 0.46, fp16Tflops: 0.46, bandwidthGBs: null, pixelRateGps: null, texelRateGts: 14.4, vramGB: null, memType: 'DDR4', busWidth: null, shaderUnits: 192, gpuCores: 3, baseClockMhz: null, boostClockMhz: 1200 },
      note: '入门 APU / Athlon 核显，3 CU'
    },

    /* ---------------------------------------------------- Radeon Pro（专业卡） */
    {
      id: 'amd-radeon-pro-w7900', vendor: 'AMD', name: 'Radeon Pro W7900', family: 'Radeon Pro W7000',
      type: 'workstation', platform: 'desktop', year: 2023, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl', 'metal'], os: ['windows', 'linux', 'macos'], unifiedMemory: false,
      aliases: ['Radeon Pro W7900', 'AMD Radeon Pro W7900', 'AMD Radeon Pro W7900 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon Pro W7900 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 31', 'AMD Navi 31', 'gfx1100'],
      specs: { fp32Tflops: 30.66, fp16Tflops: 30.66, bandwidthGBs: 864, pixelRateGps: 479.0, texelRateGts: 958.1, vramGB: 48, memType: 'GDDR6', busWidth: 384, shaderUnits: 6144, gpuCores: null, baseClockMhz: null, boostClockMhz: 2495 },
      note: 'Navi 31（192 ROP / 384 TMU），48GB ECC 显存'
    },
    {
      id: 'amd-radeon-pro-w7800', vendor: 'AMD', name: 'Radeon Pro W7800', family: 'Radeon Pro W7000',
      type: 'workstation', platform: 'desktop', year: 2023, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl', 'metal'], os: ['windows', 'linux', 'macos'], unifiedMemory: false,
      aliases: ['Radeon Pro W7800', 'AMD Radeon Pro W7800', 'AMD Radeon Pro W7800 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon Pro W7800 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 31', 'AMD Navi 31', 'gfx1100'],
      specs: { fp32Tflops: 22.39, fp16Tflops: 22.39, bandwidthGBs: 576, pixelRateGps: null, texelRateGts: 699.7, vramGB: 32, memType: 'GDDR6', busWidth: 256, shaderUnits: 4480, gpuCores: null, baseClockMhz: null, boostClockMhz: 2499 },
      note: 'Navi 31 削减版（70 CU / 280 TMU），ROP 数未确认故像素率留 null'
    },
    {
      id: 'amd-radeon-pro-w7700', vendor: 'AMD', name: 'Radeon Pro W7700', family: 'Radeon Pro W7000',
      type: 'workstation', platform: 'desktop', year: 2023, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['Radeon Pro W7700', 'AMD Radeon Pro W7700', 'AMD Radeon Pro W7700 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon Pro W7700 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 32', 'AMD Navi 32', 'gfx1101'],
      specs: { fp32Tflops: 15.97, fp16Tflops: 15.97, bandwidthGBs: 576, pixelRateGps: null, texelRateGts: 499.2, vramGB: 16, memType: 'GDDR6', busWidth: 256, shaderUnits: 3072, gpuCores: null, baseClockMhz: null, boostClockMhz: 2600 },
      note: 'Navi 32（48 CU / 192 TMU），16GB'
    },
    {
      id: 'amd-radeon-pro-w6800', vendor: 'AMD', name: 'Radeon Pro W6800', family: 'Radeon Pro W6000',
      type: 'workstation', platform: 'desktop', year: 2021, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl', 'metal'], os: ['windows', 'linux', 'macos'], unifiedMemory: false,
      aliases: ['Radeon Pro W6800', 'AMD Radeon Pro W6800', 'AMD Radeon Pro W6800 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon Pro W6800 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 21', 'AMD Navi 21', 'gfx1030'],
      specs: { fp32Tflops: 17.82, fp16Tflops: 17.82, bandwidthGBs: 512, pixelRateGps: 222.7, texelRateGts: 556.8, vramGB: 32, memType: 'GDDR6', busWidth: 256, shaderUnits: 3840, gpuCores: null, baseClockMhz: null, boostClockMhz: 2320 },
      note: 'Navi 21（96 ROP / 240 TMU），32GB ECC；Mac Pro 2019 可选模块'
    },
    {
      id: 'amd-radeon-pro-w6600', vendor: 'AMD', name: 'Radeon Pro W6600', family: 'Radeon Pro W6000',
      type: 'workstation', platform: 'desktop', year: 2021, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['Radeon Pro W6600', 'AMD Radeon Pro W6600', 'AMD Radeon Pro W6600 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon Pro W6600 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 23', 'AMD Navi 23', 'gfx1032'],
      specs: { fp32Tflops: 10.40, fp16Tflops: 10.40, bandwidthGBs: 224, pixelRateGps: 185.6, texelRateGts: 324.8, vramGB: 8, memType: 'GDDR6', busWidth: 128, shaderUnits: 1792, gpuCores: null, baseClockMhz: null, boostClockMhz: 2900 },
      note: 'Navi 23（64 ROP / 128 TMU），单槽 100W'
    },
    {
      id: 'amd-radeon-pro-w5700', vendor: 'AMD', name: 'Radeon Pro W5700', family: 'Radeon Pro W5000',
      type: 'workstation', platform: 'desktop', year: 2019, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl', 'metal'], os: ['windows', 'linux', 'macos'], unifiedMemory: false,
      aliases: ['Radeon Pro W5700', 'AMD Radeon Pro W5700', 'AMD Radeon Pro W5700 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon Pro W5700 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 10', 'AMD Navi 10', 'gfx1010'],
      specs: { fp32Tflops: 8.66, fp16Tflops: 8.66, bandwidthGBs: 448, pixelRateGps: 120.3, texelRateGts: 270.7, vramGB: 8, memType: 'GDDR6', busWidth: 256, shaderUnits: 2304, gpuCores: null, baseClockMhz: null, boostClockMhz: 1880 },
      note: 'Navi 10（64 ROP / 144 TMU）；Mac Pro 2019 可选模块'
    },
    {
      id: 'amd-radeon-pro-w5500', vendor: 'AMD', name: 'Radeon Pro W5500', family: 'Radeon Pro W5000',
      type: 'workstation', platform: 'desktop', year: 2020, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['Radeon Pro W5500', 'AMD Radeon Pro W5500', 'AMD Radeon Pro W5500 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon Pro W5500 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Navi 14', 'AMD Navi 14', 'gfx1012'],
      specs: { fp32Tflops: 5.20, fp16Tflops: 5.20, bandwidthGBs: 224, pixelRateGps: 59.1, texelRateGts: 162.4, vramGB: 8, memType: 'GDDR6', busWidth: 128, shaderUnits: 1408, gpuCores: null, baseClockMhz: null, boostClockMhz: 1846 },
      note: 'Navi 14（32 ROP / 88 TMU），125W 单槽'
    },
    {
      id: 'amd-radeon-pro-wx-9100', vendor: 'AMD', name: 'Radeon Pro WX 9100', family: 'Radeon Pro WX',
      type: 'workstation', platform: 'desktop', year: 2017, api: 'd3d12', apis: ['d3d12', 'vulkan', 'opengl'], os: ['windows', 'linux'], unifiedMemory: false,
      aliases: ['Radeon Pro WX 9100', 'AMD Radeon Pro WX 9100', 'AMD Radeon Pro WX 9100 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon Pro WX 9100 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Vega 10', 'AMD Vega 10', 'gfx900'],
      specs: { fp32Tflops: 12.29, fp16Tflops: 12.29, bandwidthGBs: 483.8, pixelRateGps: 96.0, texelRateGts: 384.0, vramGB: 16, memType: 'HBM2', busWidth: 2048, shaderUnits: 4096, gpuCores: null, baseClockMhz: null, boostClockMhz: 1500 },
      note: 'Vega 10 专业版（64 ROP / 256 TMU），16GB HBM2'
    },

    /* ---------------------------------------------------- Instinct（数据中心） */
    {
      id: 'amd-instinct-mi300x', vendor: 'AMD', name: 'AMD Instinct MI300X', family: 'Radeon Instinct MI',
      type: 'workstation', platform: 'desktop', year: 2023, api: 'vulkan', apis: ['vulkan', 'opengl'], os: ['linux', 'windows'], unifiedMemory: false,
      aliases: ['Instinct MI300X', 'AMD Instinct MI300X', 'MI300X', 'AMD Instinct MI300X Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Instinct MI300X Direct3D11 vs_5_0 ps_5_0, D3D11)', 'CDNA 3', 'AMD CDNA 3', 'gfx942'],
      specs: { fp32Tflops: 81.72, fp16Tflops: 163.44, bandwidthGBs: 5300, pixelRateGps: null, texelRateGts: null, vramGB: 192, memType: 'HBM3', busWidth: 8192, shaderUnits: 19456, gpuCores: null, baseClockMhz: null, boostClockMhz: 2100 },
      note: 'CDNA 3 数据中心加速卡，304 CU，192GB HBM3；向量 FP16 为 FP32 的 2 倍'
    },
    {
      id: 'amd-instinct-mi250x', vendor: 'AMD', name: 'AMD Instinct MI250X', family: 'Radeon Instinct MI',
      type: 'workstation', platform: 'desktop', year: 2021, api: 'vulkan', apis: ['vulkan', 'opengl'], os: ['linux', 'windows'], unifiedMemory: false,
      aliases: ['Instinct MI250X', 'AMD Instinct MI250X', 'MI250X', 'AMD Instinct MI250X Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Instinct MI250X Direct3D11 vs_5_0 ps_5_0, D3D11)', 'CDNA 2', 'AMD CDNA 2', 'gfx90a'],
      specs: { fp32Tflops: 47.87, fp16Tflops: 95.74, bandwidthGBs: 3277, pixelRateGps: null, texelRateGts: null, vramGB: 128, memType: 'HBM2e', busWidth: 8192, shaderUnits: 14080, gpuCores: null, baseClockMhz: null, boostClockMhz: 1700 },
      note: 'CDNA 2 双芯封装（2 x 110 CU），128GB HBM2e'
    },
    {
      id: 'amd-instinct-mi210', vendor: 'AMD', name: 'AMD Instinct MI210', family: 'Radeon Instinct MI',
      type: 'workstation', platform: 'desktop', year: 2021, api: 'vulkan', apis: ['vulkan', 'opengl'], os: ['linux', 'windows'], unifiedMemory: false,
      aliases: ['Instinct MI210', 'AMD Instinct MI210', 'MI210', 'AMD Instinct MI210 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Instinct MI210 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'CDNA 2', 'AMD CDNA 2', 'gfx90a'],
      specs: { fp32Tflops: 22.63, fp16Tflops: 45.26, bandwidthGBs: 1638, pixelRateGps: null, texelRateGts: null, vramGB: 64, memType: 'HBM2e', busWidth: 4096, shaderUnits: 6656, gpuCores: null, baseClockMhz: null, boostClockMhz: 1700 },
      note: 'CDNA 2 单芯（104 CU），64GB HBM2e，PCIe 双槽'
    },
    {
      id: 'amd-instinct-mi100', vendor: 'AMD', name: 'AMD Instinct MI100', family: 'Radeon Instinct MI',
      type: 'workstation', platform: 'desktop', year: 2020, api: 'vulkan', apis: ['vulkan', 'opengl'], os: ['linux', 'windows'], unifiedMemory: false,
      aliases: ['Instinct MI100', 'AMD Instinct MI100', 'MI100', 'AMD Instinct MI100 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Instinct MI100 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'CDNA 1', 'AMD CDNA', 'gfx908'],
      specs: { fp32Tflops: 23.07, fp16Tflops: 46.14, bandwidthGBs: 1229, pixelRateGps: null, texelRateGts: null, vramGB: 32, memType: 'HBM2', busWidth: 4096, shaderUnits: 7680, gpuCores: null, baseClockMhz: null, boostClockMhz: 1502 },
      note: 'CDNA 1（120 CU），32GB HBM2'
    },
    {
      id: 'amd-instinct-mi50', vendor: 'AMD', name: 'AMD Radeon Instinct MI50 (32GB)', family: 'Radeon Instinct MI',
      type: 'workstation', platform: 'desktop', year: 2018, api: 'vulkan', apis: ['vulkan', 'opengl'], os: ['linux', 'windows'], unifiedMemory: false,
      aliases: ['Instinct MI50', 'AMD Radeon Instinct MI50', 'Radeon Instinct MI50', 'AMD Radeon Instinct MI50 Direct3D11 vs_5_0 ps_5_0', 'ANGLE (AMD, AMD Radeon Instinct MI50 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'Vega 20', 'AMD Vega 20', 'gfx906'],
      specs: { fp32Tflops: 13.41, fp16Tflops: 26.82, bandwidthGBs: 1024, pixelRateGps: 111.7, texelRateGts: 419.0, vramGB: 32, memType: 'HBM2', busWidth: 4096, shaderUnits: 3840, gpuCores: null, baseClockMhz: null, boostClockMhz: 1746 },
      note: 'Vega 20 计算卡（64 ROP / 240 TMU），32GB HBM2'
    }
  ]
});
