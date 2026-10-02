/* ============================================================================
 * NovaMark · 浏览器端 GPU 参考规格数据库（gpu-db.js）
 * ----------------------------------------------------------------------------
 * 用途：
 *   1) 「实测吞吐 vs 理论峰值」达成率计算 —— 理论峰值取自 specs.*
 *   2) 参考机型对比 —— name / family / type / year
 *   3) 型号识别 —— aliases 用于匹配 WebGL unmaskedRenderer / WebGPU adapter.info
 *
 * 形式：经典脚本（无 import / export），不访问 DOM，结尾挂到 window.NOVA_GPU_DB。
 * 依赖：无。必须在 detect/gpu-match.js 之前加载。
 *
 * 单位约定：
 *   fp32Tflops / fp16Tflops : TFLOPS (10^12 FLOP/s)
 *   int8Tops                : TOPS   (10^12 OPS/s)   —— 非张量/矩阵单元的常规整数率
 *   bandwidthGBs            : GB/s   (10^9 字节/s，厂商标称等效带宽)
 *   pixelRateGps            : GPixel/s (10^9 像素/s，= ROP 数 × 时钟)
 *   texelRateGts            : GTexel/s (10^9 纹素/s，= TMU 数 × 时钟)
 *   triangleRateGts         : 三角形吞吐，几乎无公开数据，统一 null
 *   vramGB                  : GB（独显为显存；核显为共享内存，仅作参考）
 *   busWidth                : bit
 *   shaderUnits             : NVIDIA=CUDA 核心数 / AMD=流处理器数 / Intel=Xe 核心×128 /
 *                             Apple=GPU 核心数×128 / Qualcomm·ARM=ALU 数（若公开）
 *   baseClockMhz / boostClockMhz : MHz
 *
 * 数据原则：仅收录公开规格；不确定的字段一律 null，绝不编造。
 *   · fp16Tflops 为「非张量核心」的向量 FP16 速率：
 *       - NVIDIA 消费级（Ada/Ampere/Turing/Pascal/Maxwell）：FP16 与 FP32 同速 → 与 fp32Tflops 相同
 *       - NVIDIA Volta/数据中心：FP16 为 FP32 的 2 倍（非张量核心路径）
 *       - AMD GCN/RDNA、Intel Xe、Apple、Qualcomm、ARM、Imagination：FP16 与 FP32 同速
 *   · 软件光栅化条目（type:'software'）全部 specs 字段为 null。
 * ==========================================================================*/
(function (global) {
  'use strict';

  var DB = {

    /* ------------------------------------------------------------------ meta */
    meta: {
      version: '1.0',
      updated: '2026-10',
      scaleNote: 'NovaMark-Lite 指数单位为无量纲相对分：以「主流桌面独显（约 12 TFLOPS FP32 / 360 GB/s）」的典型实测吞吐为 1000 分基准，分数越高代表同等测试负载下吞吐越高。达成率 = 实测吞吐 ÷ 本库 specs 理论峰值 × 100%，用于判断驱动/编译器/浏览器后端是否为瓶颈。',
      note: '数据为公开规格整理，缺失字段为 null',
      sources: [
        'https://www.techpowerup.com/gpu-specs/',
        'https://en.wikipedia.org/wiki/List_of_AMD_graphics_processing_units',
        'https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units',
        'https://en.wikipedia.org/wiki/GeForce_RTX_50_series',
        'https://en.wikipedia.org/wiki/Radeon_RX_9000_series',
        'https://en.wikipedia.org/wiki/Apple_silicon',
        'https://en.wikipedia.org/wiki/Apple_M3',
        'https://en.wikipedia.org/wiki/Apple_M4',
        'https://en.wikipedia.org/wiki/Apple_M5'
      ]
    },

    /* ------------------------------------------------------------------ gpus */
    gpus: [

      /* ==================================================================
       * 一、NVIDIA 桌面独显（新 → 旧）
       * ================================================================== */

      {
        id: 'nvidia-rtx-5090',
        vendor: 'NVIDIA', name: 'GeForce RTX 5090', family: 'GeForce RTX 50',
        type: 'desktop', year: 2025, api: 'd3d12',
        aliases: [
          'RTX 5090', 'GeForce RTX 5090', 'NVIDIA GeForce RTX 5090',
          'NVIDIA GeForce RTX 5090 Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce RTX 5090 Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'NVIDIA GeForce RTX 5090 Direct3D12 (FL 12_1)',
          'GB202', 'NVIDIA GB202', 'Blackwell'
        ],
        specs: {
          fp32Tflops: 104.8, fp16Tflops: 104.8, int8Tops: null,
          bandwidthGBs: 1792, pixelRateGps: 423.6, texelRateGts: 1636.8,
          triangleRateGts: null, vramGB: 32, memType: 'GDDR7', busWidth: 512,
          shaderUnits: 21760, baseClockMhz: 2017, boostClockMhz: 2407
        },
        note: 'GB202 满血核心（21760 CUDA / 680 TMU / 176 ROP），512-bit GDDR7 28 Gbps（1792 GB/s），575W TGP。'
      },

      {
        id: 'nvidia-rtx-5080',
        vendor: 'NVIDIA', name: 'GeForce RTX 5080', family: 'GeForce RTX 50',
        type: 'desktop', year: 2025, api: 'd3d12',
        aliases: [
          'RTX 5080', 'GeForce RTX 5080', 'NVIDIA GeForce RTX 5080',
          'NVIDIA GeForce RTX 5080 Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce RTX 5080 Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'NVIDIA GeForce RTX 5080 Direct3D12 (FL 12_1)',
          'GB203', 'NVIDIA GB203'
        ],
        specs: {
          fp32Tflops: 56.28, fp16Tflops: 56.28, int8Tops: null,
          bandwidthGBs: 960, pixelRateGps: 293.1, texelRateGts: 879.3,
          triangleRateGts: null, vramGB: 16, memType: 'GDDR7', busWidth: 256,
          shaderUnits: 10752, baseClockMhz: 2295, boostClockMhz: 2617
        },
        note: 'GB203（10752 CUDA / 336 TMU / 112 ROP），256-bit GDDR7 30 Gbps，360W TGP。'
      },

      {
        id: 'nvidia-rtx-5070-ti',
        vendor: 'NVIDIA', name: 'GeForce RTX 5070 Ti', family: 'GeForce RTX 50',
        type: 'desktop', year: 2025, api: 'd3d12',
        aliases: [
          'RTX 5070 Ti', 'GeForce RTX 5070 Ti', 'NVIDIA GeForce RTX 5070 Ti',
          'NVIDIA GeForce RTX 5070 Ti Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce RTX 5070 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'NVIDIA GeForce RTX 5070 Ti Direct3D12 (FL 12_1)',
          'GB203', 'NVIDIA GB203'
        ],
        specs: {
          fp32Tflops: 44.05, fp16Tflops: 44.05, int8Tops: null,
          bandwidthGBs: 896, pixelRateGps: 235.4, texelRateGts: 686.6,
          triangleRateGts: null, vramGB: 16, memType: 'GDDR7', busWidth: 256,
          shaderUnits: 8960, baseClockMhz: 2295, boostClockMhz: 2452
        },
        note: 'GB203 精简版（8960 CUDA / 280 TMU / 96 ROP），256-bit GDDR7 28 Gbps，300W TGP。'
      },

      {
        id: 'nvidia-rtx-5070',
        vendor: 'NVIDIA', name: 'GeForce RTX 5070', family: 'GeForce RTX 50',
        type: 'desktop', year: 2025, api: 'd3d12',
        aliases: [
          'RTX 5070', 'GeForce RTX 5070', 'NVIDIA GeForce RTX 5070',
          'NVIDIA GeForce RTX 5070 Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce RTX 5070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'NVIDIA GeForce RTX 5070 Direct3D12 (FL 12_1)',
          'GB205', 'NVIDIA GB205'
        ],
        specs: {
          fp32Tflops: 30.84, fp16Tflops: 30.84, int8Tops: null,
          bandwidthGBs: 672, pixelRateGps: 200.9, texelRateGts: 482.3,
          triangleRateGts: null, vramGB: 12, memType: 'GDDR7', busWidth: 192,
          shaderUnits: 6144, baseClockMhz: 2160, boostClockMhz: 2512
        },
        note: 'GB205（6144 CUDA / 192 TMU / 80 ROP），192-bit GDDR7 28 Gbps，250W TGP。'
      },

      {
        id: 'nvidia-rtx-5060-ti',
        vendor: 'NVIDIA', name: 'GeForce RTX 5060 Ti', family: 'GeForce RTX 50',
        type: 'desktop', year: 2025, api: 'd3d12',
        aliases: [
          'RTX 5060 Ti', 'GeForce RTX 5060 Ti', 'NVIDIA GeForce RTX 5060 Ti',
          'NVIDIA GeForce RTX 5060 Ti Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce RTX 5060 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'NVIDIA GeForce RTX 5060 Ti Direct3D12 (FL 12_1)',
          'GB206', 'NVIDIA GB206'
        ],
        specs: {
          fp32Tflops: 23.70, fp16Tflops: 23.70, int8Tops: null,
          bandwidthGBs: 448, pixelRateGps: 123.5, texelRateGts: 370.4,
          triangleRateGts: null, vramGB: 16, memType: 'GDDR7', busWidth: 128,
          shaderUnits: 4608, baseClockMhz: 2407, boostClockMhz: 2572
        },
        note: 'GB206（4608 CUDA / 144 TMU / 48 ROP），128-bit GDDR7 28 Gbps，180W TGP；另有 8GB 版本（带宽同为 448 GB/s）。'
      },

      {
        id: 'nvidia-rtx-5060',
        vendor: 'NVIDIA', name: 'GeForce RTX 5060', family: 'GeForce RTX 50',
        type: 'desktop', year: 2025, api: 'd3d12',
        aliases: [
          'RTX 5060', 'GeForce RTX 5060', 'NVIDIA GeForce RTX 5060',
          'NVIDIA GeForce RTX 5060 Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce RTX 5060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'NVIDIA GeForce RTX 5060 Direct3D12 (FL 12_1)',
          'GB206', 'NVIDIA GB206', 'GeForce RTX 5060 Laptop GPU'
        ],
        specs: {
          fp32Tflops: 19.18, fp16Tflops: 19.18, int8Tops: null,
          bandwidthGBs: 448, pixelRateGps: 119.9, texelRateGts: 299.6,
          triangleRateGts: null, vramGB: 8, memType: 'GDDR7', busWidth: 128,
          shaderUnits: 3840, baseClockMhz: 2280, boostClockMhz: 2497
        },
        note: 'GB206 精简版（3840 CUDA / 120 TMU / 48 ROP），128-bit GDDR7 28 Gbps，145W TGP。'
      },

      {
        id: 'nvidia-rtx-4090',
        vendor: 'NVIDIA', name: 'GeForce RTX 4090', family: 'GeForce RTX 40',
        type: 'desktop', year: 2022, api: 'd3d12',
        aliases: [
          'RTX 4090', 'GeForce RTX 4090', 'NVIDIA GeForce RTX 4090',
          'NVIDIA GeForce RTX 4090 Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'NVIDIA GeForce RTX 4090 Direct3D12 (FL 12_1)',
          'AD102', 'NVIDIA AD102'
        ],
        specs: {
          fp32Tflops: 82.58, fp16Tflops: 82.58, int8Tops: null,
          bandwidthGBs: 1008, pixelRateGps: 443.5, texelRateGts: 1290.2,
          triangleRateGts: null, vramGB: 24, memType: 'GDDR6X', busWidth: 384,
          shaderUnits: 16384, baseClockMhz: 2235, boostClockMhz: 2520
        },
        note: 'AD102（16384 CUDA / 512 TMU / 176 ROP），384-bit GDDR6X 21 Gbps，450W TGP。'
      },

      {
        id: 'nvidia-rtx-4080',
        vendor: 'NVIDIA', name: 'GeForce RTX 4080', family: 'GeForce RTX 40',
        type: 'desktop', year: 2022, api: 'd3d12',
        aliases: [
          'RTX 4080', 'GeForce RTX 4080', 'NVIDIA GeForce RTX 4080',
          'NVIDIA GeForce RTX 4080 Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'NVIDIA GeForce RTX 4080 Direct3D12 (FL 12_1)',
          'AD103', 'NVIDIA AD103', 'GeForce RTX 4080 SUPER'
        ],
        specs: {
          fp32Tflops: 48.74, fp16Tflops: 48.74, int8Tops: null,
          bandwidthGBs: 716.8, pixelRateGps: 280.6, texelRateGts: 761.5,
          triangleRateGts: null, vramGB: 16, memType: 'GDDR6X', busWidth: 256,
          shaderUnits: 9728, baseClockMhz: 2205, boostClockMhz: 2505
        },
        note: 'AD103（9728 CUDA / 304 TMU / 112 ROP），256-bit GDDR6X 22.4 Gbps，320W TGP。'
      },

      {
        id: 'nvidia-rtx-4070-ti',
        vendor: 'NVIDIA', name: 'GeForce RTX 4070 Ti', family: 'GeForce RTX 40',
        type: 'desktop', year: 2023, api: 'd3d12',
        aliases: [
          'RTX 4070 Ti', 'GeForce RTX 4070 Ti', 'NVIDIA GeForce RTX 4070 Ti',
          'NVIDIA GeForce RTX 4070 Ti Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'NVIDIA GeForce RTX 4070 Ti Direct3D12 (FL 12_1)',
          'AD104', 'NVIDIA AD104', 'GeForce RTX 4070 Ti SUPER'
        ],
        specs: {
          fp32Tflops: 40.09, fp16Tflops: 40.09, int8Tops: null,
          bandwidthGBs: 504.2, pixelRateGps: 208.8, texelRateGts: 626.4,
          triangleRateGts: null, vramGB: 12, memType: 'GDDR6X', busWidth: 192,
          shaderUnits: 7680, baseClockMhz: 2310, boostClockMhz: 2610
        },
        note: 'AD104（7680 CUDA / 240 TMU / 80 ROP），192-bit GDDR6X 21 Gbps，285W TGP。'
      },

      {
        id: 'nvidia-rtx-4070',
        vendor: 'NVIDIA', name: 'GeForce RTX 4070', family: 'GeForce RTX 40',
        type: 'desktop', year: 2023, api: 'd3d12',
        aliases: [
          'RTX 4070', 'GeForce RTX 4070', 'NVIDIA GeForce RTX 4070',
          'NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'NVIDIA GeForce RTX 4070 Direct3D12 (FL 12_1)',
          'AD104', 'NVIDIA AD104', 'GeForce RTX 4070 SUPER'
        ],
        specs: {
          fp32Tflops: 29.15, fp16Tflops: 29.15, int8Tops: null,
          bandwidthGBs: 504.2, pixelRateGps: 158.4, texelRateGts: 475.2,
          triangleRateGts: null, vramGB: 12, memType: 'GDDR6X', busWidth: 192,
          shaderUnits: 5888, baseClockMhz: 1920, boostClockMhz: 2475
        },
        note: 'AD104 精简版（5888 CUDA / 184 TMU / 64 ROP），192-bit GDDR6X 21 Gbps，200W TGP。'
      },

      {
        id: 'nvidia-rtx-4060-ti',
        vendor: 'NVIDIA', name: 'GeForce RTX 4060 Ti', family: 'GeForce RTX 40',
        type: 'desktop', year: 2023, api: 'd3d12',
        aliases: [
          'RTX 4060 Ti', 'GeForce RTX 4060 Ti', 'NVIDIA GeForce RTX 4060 Ti',
          'NVIDIA GeForce RTX 4060 Ti Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'NVIDIA GeForce RTX 4060 Ti Direct3D12 (FL 12_1)',
          'AD106', 'NVIDIA AD106'
        ],
        specs: {
          fp32Tflops: 22.06, fp16Tflops: 22.06, int8Tops: null,
          bandwidthGBs: 288, pixelRateGps: 121.4, texelRateGts: 344.8,
          triangleRateGts: null, vramGB: 8, memType: 'GDDR6', busWidth: 128,
          shaderUnits: 4352, baseClockMhz: 2310, boostClockMhz: 2535
        },
        note: 'AD106（4352 CUDA / 136 TMU / 48 ROP），128-bit GDDR6 18 Gbps，160W TGP；另有 16GB 版本。'
      },

      {
        id: 'nvidia-rtx-4060',
        vendor: 'NVIDIA', name: 'GeForce RTX 4060', family: 'GeForce RTX 40',
        type: 'desktop', year: 2023, api: 'd3d12',
        aliases: [
          'RTX 4060', 'GeForce RTX 4060', 'NVIDIA GeForce RTX 4060',
          'NVIDIA GeForce RTX 4060 Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'NVIDIA GeForce RTX 4060 Direct3D12 (FL 12_1)',
          'AD107', 'NVIDIA AD107', 'GeForce RTX 4060 Laptop GPU'
        ],
        specs: {
          fp32Tflops: 15.11, fp16Tflops: 15.11, int8Tops: null,
          bandwidthGBs: 272, pixelRateGps: 118.1, texelRateGts: 236.2,
          triangleRateGts: null, vramGB: 8, memType: 'GDDR6', busWidth: 128,
          shaderUnits: 3072, baseClockMhz: 1830, boostClockMhz: 2460
        },
        note: 'AD107（3072 CUDA / 96 TMU / 32 ROP），128-bit GDDR6 17 Gbps，115W TGP。'
      },

      {
        id: 'nvidia-rtx-3090',
        vendor: 'NVIDIA', name: 'GeForce RTX 3090', family: 'GeForce RTX 30',
        type: 'desktop', year: 2020, api: 'd3d12',
        aliases: [
          'RTX 3090', 'GeForce RTX 3090', 'NVIDIA GeForce RTX 3090',
          'NVIDIA GeForce RTX 3090 Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce RTX 3090 Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'NVIDIA GeForce RTX 3090 Direct3D12 (FL 12_1)',
          'GA102', 'NVIDIA GA102', 'GeForce RTX 3090 Ti'
        ],
        specs: {
          fp32Tflops: 35.58, fp16Tflops: 35.58, int8Tops: null,
          bandwidthGBs: 936.2, pixelRateGps: 189.8, texelRateGts: 556.1,
          triangleRateGts: null, vramGB: 24, memType: 'GDDR6X', busWidth: 384,
          shaderUnits: 10496, baseClockMhz: 1395, boostClockMhz: 1695
        },
        note: 'GA102（10496 CUDA / 328 TMU / 112 ROP），384-bit GDDR6X 19.5 Gbps，350W TGP。'
      },

      {
        id: 'nvidia-rtx-3080',
        vendor: 'NVIDIA', name: 'GeForce RTX 3080', family: 'GeForce RTX 30',
        type: 'desktop', year: 2020, api: 'd3d12',
        aliases: [
          'RTX 3080', 'GeForce RTX 3080', 'NVIDIA GeForce RTX 3080',
          'NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'NVIDIA GeForce RTX 3080 Direct3D12 (FL 12_1)',
          'GA102', 'NVIDIA GA102'
        ],
        specs: {
          fp32Tflops: 29.77, fp16Tflops: 29.77, int8Tops: null,
          bandwidthGBs: 760.3, pixelRateGps: 164.2, texelRateGts: 465.1,
          triangleRateGts: null, vramGB: 10, memType: 'GDDR6X', busWidth: 320,
          shaderUnits: 8704, baseClockMhz: 1440, boostClockMhz: 1710
        },
        note: 'GA102（8704 CUDA / 272 TMU / 96 ROP），320-bit GDDR6X 19 Gbps，320W TGP。'
      },

      {
        id: 'nvidia-rtx-3070',
        vendor: 'NVIDIA', name: 'GeForce RTX 3070', family: 'GeForce RTX 30',
        type: 'desktop', year: 2020, api: 'd3d12',
        aliases: [
          'RTX 3070', 'GeForce RTX 3070', 'NVIDIA GeForce RTX 3070',
          'NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'NVIDIA GeForce RTX 3070 Direct3D12 (FL 12_1)',
          'GA104', 'NVIDIA GA104'
        ],
        specs: {
          fp32Tflops: 20.31, fp16Tflops: 20.31, int8Tops: null,
          bandwidthGBs: 448, pixelRateGps: 165.6, texelRateGts: 317.4,
          triangleRateGts: null, vramGB: 8, memType: 'GDDR6', busWidth: 256,
          shaderUnits: 5888, baseClockMhz: 1500, boostClockMhz: 1725
        },
        note: 'GA104（5888 CUDA / 184 TMU / 96 ROP），256-bit GDDR6 14 Gbps，220W TGP。'
      },

      {
        id: 'nvidia-rtx-3060-ti',
        vendor: 'NVIDIA', name: 'GeForce RTX 3060 Ti', family: 'GeForce RTX 30',
        type: 'desktop', year: 2020, api: 'd3d12',
        aliases: [
          'RTX 3060 Ti', 'GeForce RTX 3060 Ti', 'NVIDIA GeForce RTX 3060 Ti',
          'NVIDIA GeForce RTX 3060 Ti Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'NVIDIA GeForce RTX 3060 Ti Direct3D12 (FL 12_1)',
          'GA104', 'NVIDIA GA104'
        ],
        specs: {
          fp32Tflops: 16.20, fp16Tflops: 16.20, int8Tops: null,
          bandwidthGBs: 448, pixelRateGps: 133.2, texelRateGts: 253.1,
          triangleRateGts: null, vramGB: 8, memType: 'GDDR6', busWidth: 256,
          shaderUnits: 4864, baseClockMhz: 1410, boostClockMhz: 1665
        },
        note: 'GA104 精简版（4864 CUDA / 152 TMU / 80 ROP），256-bit GDDR6 14 Gbps，200W TGP。'
      },

      {
        id: 'nvidia-rtx-3060',
        vendor: 'NVIDIA', name: 'GeForce RTX 3060', family: 'GeForce RTX 30',
        type: 'desktop', year: 2021, api: 'd3d12',
        aliases: [
          'RTX 3060', 'GeForce RTX 3060', 'NVIDIA GeForce RTX 3060',
          'NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'NVIDIA GeForce RTX 3060 Direct3D12 (FL 12_1)',
          'GA106', 'NVIDIA GA106', 'GeForce RTX 3060 Laptop GPU'
        ],
        specs: {
          fp32Tflops: 12.74, fp16Tflops: 12.74, int8Tops: null,
          bandwidthGBs: 360, pixelRateGps: 85.3, texelRateGts: 199,
          triangleRateGts: null, vramGB: 12, memType: 'GDDR6', busWidth: 192,
          shaderUnits: 3584, baseClockMhz: 1320, boostClockMhz: 1777
        },
        note: 'GA106（3584 CUDA / 112 TMU / 48 ROP），192-bit GDDR6 15 Gbps，170W TGP；另有 8GB 版（带宽 240 GB/s）。'
      },

      {
        id: 'nvidia-rtx-3050',
        vendor: 'NVIDIA', name: 'GeForce RTX 3050', family: 'GeForce RTX 30',
        type: 'desktop', year: 2022, api: 'd3d12',
        aliases: [
          'RTX 3050', 'GeForce RTX 3050', 'NVIDIA GeForce RTX 3050',
          'NVIDIA GeForce RTX 3050 Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce RTX 3050 Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'NVIDIA GeForce RTX 3050 Direct3D12 (FL 12_1)',
          'GA106', 'NVIDIA GA106', 'GeForce RTX 3050 Laptop GPU'
        ],
        specs: {
          fp32Tflops: 9.09, fp16Tflops: 9.09, int8Tops: null,
          bandwidthGBs: 224, pixelRateGps: 56.9, texelRateGts: 142,
          triangleRateGts: null, vramGB: 8, memType: 'GDDR6', busWidth: 128,
          shaderUnits: 2560, baseClockMhz: 1552, boostClockMhz: 1777
        },
        note: 'GA106（2560 CUDA / 80 TMU / 32 ROP），128-bit GDDR6 14 Gbps，130W TGP；另有 6GB（96-bit）与 8GB 版。'
      },

      {
        id: 'nvidia-gtx-1660-super',
        vendor: 'NVIDIA', name: 'GeForce GTX 1660 SUPER', family: 'GeForce GTX 16',
        type: 'desktop', year: 2019, api: 'd3d12',
        aliases: [
          'GTX 1660 SUPER', 'GTX 1660 Super', 'GeForce GTX 1660 SUPER',
          'NVIDIA GeForce GTX 1660 SUPER', 'NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'TU116', 'NVIDIA TU116'
        ],
        specs: {
          fp32Tflops: 5.03, fp16Tflops: 5.03, int8Tops: null,
          bandwidthGBs: 336, pixelRateGps: 85.7, texelRateGts: 157,
          triangleRateGts: null, vramGB: 6, memType: 'GDDR6', busWidth: 192,
          shaderUnits: 1408, baseClockMhz: 1530, boostClockMhz: 1785
        },
        note: 'TU116（1408 CUDA / 88 TMU / 48 ROP），192-bit GDDR6 14 Gbps，125W TGP；无 FP16 双速路径。'
      },

      {
        id: 'nvidia-gtx-1660',
        vendor: 'NVIDIA', name: 'GeForce GTX 1660', family: 'GeForce GTX 16',
        type: 'desktop', year: 2019, api: 'd3d12',
        aliases: [
          'GTX 1660', 'GeForce GTX 1660', 'NVIDIA GeForce GTX 1660',
          'NVIDIA GeForce GTX 1660 Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'TU116', 'NVIDIA TU116'
        ],
        specs: {
          fp32Tflops: 5.03, fp16Tflops: 5.03, int8Tops: null,
          bandwidthGBs: 192, pixelRateGps: 85.7, texelRateGts: 157,
          triangleRateGts: null, vramGB: 6, memType: 'GDDR5', busWidth: 192,
          shaderUnits: 1408, baseClockMhz: 1530, boostClockMhz: 1785
        },
        note: 'TU116（1408 CUDA / 88 TMU / 48 ROP），192-bit GDDR5 8 Gbps，120W TGP。'
      },

      {
        id: 'nvidia-gtx-1650',
        vendor: 'NVIDIA', name: 'GeForce GTX 1650', family: 'GeForce GTX 16',
        type: 'desktop', year: 2019, api: 'd3d12',
        aliases: [
          'GTX 1650', 'GeForce GTX 1650', 'NVIDIA GeForce GTX 1650',
          'NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'TU117', 'NVIDIA TU117', 'GeForce GTX 1650 Laptop GPU'
        ],
        specs: {
          fp32Tflops: 2.98, fp16Tflops: 2.98, int8Tops: null,
          bandwidthGBs: 128, pixelRateGps: 53.3, texelRateGts: 93.2,
          triangleRateGts: null, vramGB: 4, memType: 'GDDR5', busWidth: 128,
          shaderUnits: 896, baseClockMhz: 1485, boostClockMhz: 1665
        },
        note: 'TU117（896 CUDA / 56 TMU / 32 ROP），128-bit GDDR5 8 Gbps，75W TGP；另有 GDDR6 版（192 GB/s）。'
      },

      {
        id: 'nvidia-gtx-1080-ti',
        vendor: 'NVIDIA', name: 'GeForce GTX 1080 Ti', family: 'GeForce GTX 10',
        type: 'desktop', year: 2017, api: 'd3d12',
        aliases: [
          'GTX 1080 Ti', 'GeForce GTX 1080 Ti', 'NVIDIA GeForce GTX 1080 Ti',
          'NVIDIA GeForce GTX 1080 Ti Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce GTX 1080 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'GP102', 'NVIDIA GP102'
        ],
        specs: {
          fp32Tflops: 11.34, fp16Tflops: 11.34, int8Tops: null,
          bandwidthGBs: 484.4, pixelRateGps: 139.3, texelRateGts: 354.6,
          triangleRateGts: null, vramGB: 11, memType: 'GDDR5X', busWidth: 352,
          shaderUnits: 3584, baseClockMhz: 1481, boostClockMhz: 1582
        },
        note: 'GP102（3584 CUDA / 224 TMU / 88 ROP），352-bit GDDR5X 11 Gbps，250W TGP。'
      },

      {
        id: 'nvidia-gtx-1070',
        vendor: 'NVIDIA', name: 'GeForce GTX 1070', family: 'GeForce GTX 10',
        type: 'desktop', year: 2016, api: 'd3d12',
        aliases: [
          'GTX 1070', 'GeForce GTX 1070', 'NVIDIA GeForce GTX 1070',
          'NVIDIA GeForce GTX 1070 Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce GTX 1070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'GP104', 'NVIDIA GP104'
        ],
        specs: {
          fp32Tflops: 6.46, fp16Tflops: 6.46, int8Tops: null,
          bandwidthGBs: 256.3, pixelRateGps: 107.7, texelRateGts: 202,
          triangleRateGts: null, vramGB: 8, memType: 'GDDR5', busWidth: 256,
          shaderUnits: 1920, baseClockMhz: 1506, boostClockMhz: 1683
        },
        note: 'GP104（1920 CUDA / 120 TMU / 64 ROP），256-bit GDDR5 8 Gbps，150W TGP。'
      },

      {
        id: 'nvidia-gtx-1060-6gb',
        vendor: 'NVIDIA', name: 'GeForce GTX 1060 6GB', family: 'GeForce GTX 10',
        type: 'desktop', year: 2016, api: 'd3d12',
        aliases: [
          'GTX 1060', 'GeForce GTX 1060', 'NVIDIA GeForce GTX 1060',
          'NVIDIA GeForce GTX 1060 6GB', 'NVIDIA GeForce GTX 1060 Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 6GB Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'GP106', 'NVIDIA GP106', 'GeForce GTX 1060 Laptop GPU'
        ],
        specs: {
          fp32Tflops: 4.375, fp16Tflops: 4.375, int8Tops: null,
          bandwidthGBs: 192, pixelRateGps: 82.0, texelRateGts: 136.7,
          triangleRateGts: null, vramGB: 6, memType: 'GDDR5', busWidth: 192,
          shaderUnits: 1280, baseClockMhz: 1506, boostClockMhz: 1708
        },
        note: 'GP106（1280 CUDA / 80 TMU / 48 ROP），192-bit GDDR5 8 Gbps，120W TGP；3GB 版为 1152 CUDA。'
      },

      {
        id: 'nvidia-gtx-1050-ti',
        vendor: 'NVIDIA', name: 'GeForce GTX 1050 Ti', family: 'GeForce GTX 10',
        type: 'desktop', year: 2016, api: 'd3d12',
        aliases: [
          'GTX 1050 Ti', 'GeForce GTX 1050 Ti', 'NVIDIA GeForce GTX 1050 Ti',
          'NVIDIA GeForce GTX 1050 Ti Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce GTX 1050 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'GP107', 'NVIDIA GP107', 'GeForce GTX 1050 Ti Laptop GPU'
        ],
        specs: {
          fp32Tflops: 2.138, fp16Tflops: 2.138, int8Tops: null,
          bandwidthGBs: 112.1, pixelRateGps: 44.5, texelRateGts: 66.8,
          triangleRateGts: null, vramGB: 4, memType: 'GDDR5', busWidth: 128,
          shaderUnits: 768, baseClockMhz: 1290, boostClockMhz: 1392
        },
        note: 'GP107（768 CUDA / 48 TMU / 32 ROP），128-bit GDDR5 7 Gbps，75W TGP。'
      },

      {
        id: 'nvidia-gt-1030',
        vendor: 'NVIDIA', name: 'GeForce GT 1030', family: 'GeForce GT 10',
        type: 'desktop', year: 2017, api: 'd3d12',
        aliases: [
          'GT 1030', 'GeForce GT 1030', 'NVIDIA GeForce GT 1030',
          'NVIDIA GeForce GT 1030 Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce GT 1030 Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'GP108', 'NVIDIA GP108'
        ],
        specs: {
          fp32Tflops: 1.127, fp16Tflops: 1.127, int8Tops: null,
          bandwidthGBs: 48, pixelRateGps: 23.5, texelRateGts: 35.2,
          triangleRateGts: null, vramGB: 2, memType: 'GDDR5', busWidth: 64,
          shaderUnits: 384, baseClockMhz: 1228, boostClockMhz: 1468
        },
        note: 'GP108（384 CUDA / 24 TMU / 16 ROP），64-bit GDDR5 6 Gbps，30W TDP；另有 DDR4 版（16.8 GB/s）。'
      },


      /* ------------------------------------------------------------------
       * NVIDIA 桌面老卡：GeForce 8 / 9 / 200 / 400 / 500（Tesla · Fermi）
       * 数据来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units
       * 说明：老 NVIDIA 卡（Tesla/Fermi）核心与着色器为双时钟域，boostClockMhz 记 NVIDIA
       *   公开的 Shader 时钟（= FP32 计算所用时钟），baseClockMhz 记核心/图形时钟；
       *   像素/纹理填充率按核心时钟计算，与 Wikipedia 列表页一致。
       * ------------------------------------------------------------------ */

      {
        id: 'nvidia-8800-gt',
        vendor: 'NVIDIA', name: 'GeForce 8800 GT', family: 'GeForce 8',
        type: 'desktop', year: 2007, api: 'd3d10',
        aliases: ["GeForce 8800 GT","NVIDIA GeForce 8800 GT","GeForce 8800 GT Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce 8800 GT Direct3D11 vs_5_0 ps_5_0, D3D11)","G92"],
        specs: {
          fp32Tflops: 0.336, fp16Tflops: 0.336, int8Tops: null,
          bandwidthGBs: 57.6, pixelRateGps: 9.6, texelRateGts: 33.6,
          triangleRateGts: null, vramGB: 0.5, memType: 'GDDR3', busWidth: 256,
          shaderUnits: 112, baseClockMhz: 600, boostClockMhz: 1500
        },
        note: "G92；112 CUDA（核心 600 / 着色器 1500 MHz 双时钟），16 光栅 / 56 纹理单元；256-bit GDDR3 1.8 Gbps（57.6 GB/s）。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-8800-gts-512',
        vendor: 'NVIDIA', name: 'GeForce 8800 GTS 512', family: 'GeForce 8',
        type: 'desktop', year: 2007, api: 'd3d10',
        aliases: ["GeForce 8800 GTS 512","NVIDIA GeForce 8800 GTS 512","GeForce 8800 GTS 512 Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce 8800 GTS 512 Direct3D11 vs_5_0 ps_5_0, D3D11)","G92"],
        specs: {
          fp32Tflops: 0.416, fp16Tflops: 0.416, int8Tops: null,
          bandwidthGBs: 52.5, pixelRateGps: 10.4, texelRateGts: 41.6,
          triangleRateGts: null, vramGB: 0.5, memType: 'GDDR3', busWidth: 256,
          shaderUnits: 128, baseClockMhz: 650, boostClockMhz: 1625
        },
        note: "G92；128 CUDA（650 / 1625 MHz），16 光栅 / 64 纹理；256-bit GDDR3 1.6 Gbps。另有 320/640MB 的 G80 版。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-8800-ultra',
        vendor: 'NVIDIA', name: 'GeForce 8800 Ultra', family: 'GeForce 8',
        type: 'desktop', year: 2007, api: 'd3d10',
        aliases: ["GeForce 8800 Ultra","NVIDIA GeForce 8800 Ultra","GeForce 8800 Ultra Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce 8800 Ultra Direct3D11 vs_5_0 ps_5_0, D3D11)","G80"],
        specs: {
          fp32Tflops: 0.387, fp16Tflops: 0.387, int8Tops: null,
          bandwidthGBs: 103.7, pixelRateGps: 14.7, texelRateGts: 19.6,
          triangleRateGts: null, vramGB: 0.75, memType: 'GDDR3', busWidth: 384,
          shaderUnits: 128, baseClockMhz: 612, boostClockMhz: 1512
        },
        note: "G80；128 CUDA（612 / 1512 MHz），24 光栅 / 32 纹理；384-bit GDDR3 2.16 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-9800-gt',
        vendor: 'NVIDIA', name: 'GeForce 9800 GT', family: 'GeForce 9',
        type: 'desktop', year: 2008, api: 'd3d10',
        aliases: ["GeForce 9800 GT","NVIDIA GeForce 9800 GT","GeForce 9800 GT Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce 9800 GT Direct3D11 vs_5_0 ps_5_0, D3D11)","G92b"],
        specs: {
          fp32Tflops: 0.336, fp16Tflops: 0.336, int8Tops: null,
          bandwidthGBs: 57.6, pixelRateGps: 9.6, texelRateGts: 33.6,
          triangleRateGts: null, vramGB: 0.5, memType: 'GDDR3', busWidth: 256,
          shaderUnits: 112, baseClockMhz: 600, boostClockMhz: 1500
        },
        note: "G92b；8800 GT 改名版，112 CUDA（600 / 1500 MHz），16 光栅 / 56 纹理；256-bit GDDR3 1.8 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-9800-gtx-plus',
        vendor: 'NVIDIA', name: 'GeForce 9800 GTX+', family: 'GeForce 9',
        type: 'desktop', year: 2008, api: 'd3d10',
        aliases: ["GeForce 9800 GTX+","NVIDIA GeForce 9800 GTX+","GeForce 9800 GTX+ Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce 9800 GTX+ Direct3D11 vs_5_0 ps_5_0, D3D11)","G92b"],
        specs: {
          fp32Tflops: 0.47, fp16Tflops: 0.47, int8Tops: null,
          bandwidthGBs: 70.4, pixelRateGps: 11.8, texelRateGts: 47.2,
          triangleRateGts: null, vramGB: 0.5, memType: 'GDDR3', busWidth: 256,
          shaderUnits: 128, baseClockMhz: 738, boostClockMhz: 1836
        },
        note: "G92b；128 CUDA（738 / 1836 MHz），16 光栅 / 64 纹理；256-bit GDDR3 2.2 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-9800-gx2',
        vendor: 'NVIDIA', name: 'GeForce 9800 GX2', family: 'GeForce 9',
        type: 'desktop', year: 2008, api: 'd3d10',
        aliases: ["GeForce 9800 GX2","NVIDIA GeForce 9800 GX2","GeForce 9800 GX2 Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce 9800 GX2 Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 0.768, fp16Tflops: 0.768, int8Tops: null,
          bandwidthGBs: 128, pixelRateGps: 19.2, texelRateGts: 67.2,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR3', busWidth: 256,
          shaderUnits: 256, baseClockMhz: 600, boostClockMhz: 1500
        },
        note: "双芯 G92b（2×128 CUDA，600 / 1500 MHz）；规格为两芯合计：32 光栅 / 112 纹理；合计带宽 128 GB/s（等效 4 Gbps × 256-bit，每芯 GDDR3 2.0 Gbps）。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gts-250',
        vendor: 'NVIDIA', name: 'GeForce GTS 250', family: 'GeForce 200',
        type: 'desktop', year: 2009, api: 'd3d10',
        aliases: ["GeForce GTS 250","NVIDIA GeForce GTS 250","GeForce GTS 250 Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTS 250 Direct3D11 vs_5_0 ps_5_0, D3D11)","G92b"],
        specs: {
          fp32Tflops: 0.415, fp16Tflops: 0.415, int8Tops: null,
          bandwidthGBs: 64, pixelRateGps: 10.8, texelRateGts: 43.2,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR3', busWidth: 256,
          shaderUnits: 128, baseClockMhz: 675, boostClockMhz: 1620
        },
        note: "G92b；128 CUDA（675 / 1620 MHz），16 光栅 / 64 纹理；256-bit GDDR3 2.0 Gbps。另有 738/1836 MHz 的 9800 GTX+ 同源版本。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-260',
        vendor: 'NVIDIA', name: 'GeForce GTX 260', family: 'GeForce 200',
        type: 'desktop', year: 2008, api: 'd3d10',
        aliases: ["GeForce GTX 260","NVIDIA GeForce GTX 260","GeForce GTX 260 Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 260 Direct3D11 vs_5_0 ps_5_0, D3D11)","GT200"],
        specs: {
          fp32Tflops: 0.477, fp16Tflops: 0.477, int8Tops: null,
          bandwidthGBs: 111.9, pixelRateGps: 16.1, texelRateGts: 36.9,
          triangleRateGts: null, vramGB: 0.875, memType: 'GDDR3', busWidth: 448,
          shaderUnits: 192, baseClockMhz: 576, boostClockMhz: 1242
        },
        note: "GT200；192 CUDA（576 / 1242 MHz），28 光栅 / 64 纹理；448-bit GDDR3 2.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-260-core216',
        vendor: 'NVIDIA', name: 'GeForce GTX 260 Core 216', family: 'GeForce 200',
        type: 'desktop', year: 2008, api: 'd3d10',
        aliases: ["GeForce GTX 260 Core 216","NVIDIA GeForce GTX 260 Core 216","GeForce GTX 260 Core 216 Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 260 Core 216 Direct3D11 vs_5_0 ps_5_0, D3D11)","GT200"],
        specs: {
          fp32Tflops: 0.537, fp16Tflops: 0.537, int8Tops: null,
          bandwidthGBs: 111.9, pixelRateGps: 16.1, texelRateGts: 41.5,
          triangleRateGts: null, vramGB: 0.875, memType: 'GDDR3', busWidth: 448,
          shaderUnits: 216, baseClockMhz: 576, boostClockMhz: 1242
        },
        note: "GT200；216 CUDA（576 / 1242 MHz），28 光栅 / 72 纹理；448-bit GDDR3 2.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-275',
        vendor: 'NVIDIA', name: 'GeForce GTX 275', family: 'GeForce 200',
        type: 'desktop', year: 2009, api: 'd3d10',
        aliases: ["GeForce GTX 275","NVIDIA GeForce GTX 275","GeForce GTX 275 Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 275 Direct3D11 vs_5_0 ps_5_0, D3D11)","GT200b"],
        specs: {
          fp32Tflops: 0.674, fp16Tflops: 0.674, int8Tops: null,
          bandwidthGBs: 127, pixelRateGps: 17.7, texelRateGts: 50.6,
          triangleRateGts: null, vramGB: 0.875, memType: 'GDDR3', busWidth: 448,
          shaderUnits: 240, baseClockMhz: 633, boostClockMhz: 1404
        },
        note: "GT200b；240 CUDA（633 / 1404 MHz），28 光栅 / 80 纹理；448-bit GDDR3 2.268 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-280',
        vendor: 'NVIDIA', name: 'GeForce GTX 280', family: 'GeForce 200',
        type: 'desktop', year: 2008, api: 'd3d10',
        aliases: ["GeForce GTX 280","NVIDIA GeForce GTX 280","GeForce GTX 280 Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 280 Direct3D11 vs_5_0 ps_5_0, D3D11)","GT200"],
        specs: {
          fp32Tflops: 0.622, fp16Tflops: 0.622, int8Tops: null,
          bandwidthGBs: 141.7, pixelRateGps: 19.3, texelRateGts: 48.2,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR3', busWidth: 512,
          shaderUnits: 240, baseClockMhz: 602, boostClockMhz: 1296
        },
        note: "GT200；240 CUDA（602 / 1296 MHz），32 光栅 / 80 纹理；512-bit GDDR3 2.214 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-285',
        vendor: 'NVIDIA', name: 'GeForce GTX 285', family: 'GeForce 200',
        type: 'desktop', year: 2009, api: 'd3d10',
        aliases: ["GeForce GTX 285","NVIDIA GeForce GTX 285","GeForce GTX 285 Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 285 Direct3D11 vs_5_0 ps_5_0, D3D11)","GT200b"],
        specs: {
          fp32Tflops: 0.708, fp16Tflops: 0.708, int8Tops: null,
          bandwidthGBs: 159, pixelRateGps: 20.7, texelRateGts: 51.8,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR3', busWidth: 512,
          shaderUnits: 240, baseClockMhz: 648, boostClockMhz: 1476
        },
        note: "GT200b；240 CUDA（648 / 1476 MHz），32 光栅 / 80 纹理；512-bit GDDR3 2.484 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-295',
        vendor: 'NVIDIA', name: 'GeForce GTX 295', family: 'GeForce 200',
        type: 'desktop', year: 2009, api: 'd3d10',
        aliases: ["GeForce GTX 295","NVIDIA GeForce GTX 295","GeForce GTX 295 Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 295 Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 1.192, fp16Tflops: 1.192, int8Tops: null,
          bandwidthGBs: 223.8, pixelRateGps: 32.3, texelRateGts: 92.2,
          triangleRateGts: null, vramGB: 1.75, memType: 'GDDR3', busWidth: 448,
          shaderUnits: 480, baseClockMhz: 576, boostClockMhz: 1242
        },
        note: "双芯 GT200b（2×240 CUDA，576 / 1242 MHz）；规格为两芯合计：56 光栅 / 160 纹理；合计带宽 223.8 GB/s（等效 3.996 Gbps × 448-bit，每芯 GDDR3 2.0 Gbps）。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gts-240',
        vendor: 'NVIDIA', name: 'GeForce GTS 240', family: 'GeForce 200',
        type: 'desktop', year: 2009, api: 'd3d10',
        aliases: ["GeForce GTS 240","NVIDIA GeForce GTS 240","GeForce GTS 240 Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTS 240 Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 0.363, fp16Tflops: 0.363, int8Tops: null,
          bandwidthGBs: 70.4, pixelRateGps: 10.8, texelRateGts: 37.8,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR3', busWidth: 256,
          shaderUnits: 112, baseClockMhz: 675, boostClockMhz: 1620
        },
        note: "仅 OEM 渠道（G92b）；112 CUDA（675 / 1620 MHz），16 光栅 / 56 纹理；256-bit GDDR3 2.2 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-220',
        vendor: 'NVIDIA', name: 'GeForce GT 220', family: 'GeForce 200',
        type: 'desktop', year: 2009, api: 'd3d10',
        aliases: ["GeForce GT 220","NVIDIA GeForce GT 220","GeForce GT 220 Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GT 220 Direct3D11 vs_5_0 ps_5_0, D3D11)","GT216"],
        specs: {
          fp32Tflops: 0.131, fp16Tflops: 0.131, int8Tops: null,
          bandwidthGBs: 25.3, pixelRateGps: 5, texelRateGts: 10,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR3', busWidth: 128,
          shaderUnits: 48, baseClockMhz: 625, boostClockMhz: 1360
        },
        note: "GT216；48 CUDA（625 / 1360 MHz），8 光栅 / 16 纹理；128-bit GDDR3 1.58 Gbps。另有 DDR2 版。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-230',
        vendor: 'NVIDIA', name: 'GeForce GT 230', family: 'GeForce 200',
        type: 'desktop', year: 2009, api: 'd3d10',
        aliases: ["GeForce GT 230","NVIDIA GeForce GT 230","GeForce GT 230 Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GT 230 Direct3D11 vs_5_0 ps_5_0, D3D11)","GT215"],
        specs: {
          fp32Tflops: 0.156, fp16Tflops: 0.156, int8Tops: null,
          bandwidthGBs: 57.6, pixelRateGps: 10.4, texelRateGts: 15.6,
          triangleRateGts: null, vramGB: 0.5, memType: 'GDDR3', busWidth: 256,
          shaderUnits: 48, baseClockMhz: 650, boostClockMhz: 1625
        },
        note: "GT215；48 CUDA（650 / 1625 MHz），16 光栅 / 24 纹理；256-bit GDDR3 1.8 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-240',
        vendor: 'NVIDIA', name: 'GeForce GT 240', family: 'GeForce 200',
        type: 'desktop', year: 2009, api: 'd3d10',
        aliases: ["GeForce GT 240","NVIDIA GeForce GT 240","GeForce GT 240 Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GT 240 Direct3D11 vs_5_0 ps_5_0, D3D11)","GT215"],
        specs: {
          fp32Tflops: 0.257, fp16Tflops: 0.257, int8Tops: null,
          bandwidthGBs: 54.4, pixelRateGps: 4.4, texelRateGts: 17.6,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR5', busWidth: 128,
          shaderUnits: 96, baseClockMhz: 550, boostClockMhz: 1340
        },
        note: "GT215；96 CUDA（550 / 1340 MHz），8 光栅 / 32 纹理；128-bit GDDR5 3.4 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-480',
        vendor: 'NVIDIA', name: 'GeForce GTX 480', family: 'GeForce 400',
        type: 'desktop', year: 2010, api: 'd3d11',
        aliases: ["GeForce GTX 480","NVIDIA GeForce GTX 480","GeForce GTX 480 Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 480 Direct3D11 vs_5_0 ps_5_0, D3D11)","GF100"],
        specs: {
          fp32Tflops: 1.345, fp16Tflops: 1.345, int8Tops: null,
          bandwidthGBs: 177.4, pixelRateGps: 33.6, texelRateGts: 42.1,
          triangleRateGts: null, vramGB: 1.5, memType: 'GDDR5', busWidth: 384,
          shaderUnits: 480, baseClockMhz: 701, boostClockMhz: 1401
        },
        note: "GF100；480 CUDA（核心 701 / 着色器 1401 MHz），48 光栅 / 60 纹理；384-bit GDDR5 3.696 Gbps（177.4 GB/s）。Fermi 无 GPU Boost。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-470',
        vendor: 'NVIDIA', name: 'GeForce GTX 470', family: 'GeForce 400',
        type: 'desktop', year: 2010, api: 'd3d11',
        aliases: ["GeForce GTX 470","NVIDIA GeForce GTX 470","GeForce GTX 470 Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 470 Direct3D11 vs_5_0 ps_5_0, D3D11)","GF100"],
        specs: {
          fp32Tflops: 1.089, fp16Tflops: 1.089, int8Tops: null,
          bandwidthGBs: 133.9, pixelRateGps: 24.3, texelRateGts: 34,
          triangleRateGts: null, vramGB: 1.25, memType: 'GDDR5', busWidth: 320,
          shaderUnits: 448, baseClockMhz: 608, boostClockMhz: 1215
        },
        note: "GF100；448 CUDA（608 / 1215 MHz），40 光栅 / 56 纹理；320-bit GDDR5 3.348 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-460',
        vendor: 'NVIDIA', name: 'GeForce GTX 460', family: 'GeForce 400',
        type: 'desktop', year: 2010, api: 'd3d11',
        aliases: ["GeForce GTX 460","NVIDIA GeForce GTX 460","GeForce GTX 460 Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 460 Direct3D11 vs_5_0 ps_5_0, D3D11)","GF104"],
        specs: {
          fp32Tflops: 0.907, fp16Tflops: 0.907, int8Tops: null,
          bandwidthGBs: 115.2, pixelRateGps: 21.6, texelRateGts: 37.8,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR5', busWidth: 256,
          shaderUnits: 336, baseClockMhz: 675, boostClockMhz: 1350
        },
        note: "GF104；336 CUDA（675 / 1350 MHz），32 光栅 / 56 纹理；256-bit GDDR5 3.6 Gbps。另有 768MB 192-bit（86.4 GB/s、24 光栅）版本。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gts-450',
        vendor: 'NVIDIA', name: 'GeForce GTS 450', family: 'GeForce 400',
        type: 'desktop', year: 2010, api: 'd3d11',
        aliases: ["GeForce GTS 450","NVIDIA GeForce GTS 450","GeForce GTS 450 Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTS 450 Direct3D11 vs_5_0 ps_5_0, D3D11)","GF106"],
        specs: {
          fp32Tflops: 0.601, fp16Tflops: 0.601, int8Tops: null,
          bandwidthGBs: 57.7, pixelRateGps: 12.5, texelRateGts: 25.1,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR5', busWidth: 128,
          shaderUnits: 192, baseClockMhz: 783, boostClockMhz: 1566
        },
        note: "GF106；192 CUDA（783 / 1566 MHz），16 光栅 / 32 纹理；128-bit GDDR5 3.6 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-580',
        vendor: 'NVIDIA', name: 'GeForce GTX 580', family: 'GeForce 500',
        type: 'desktop', year: 2010, api: 'd3d11',
        aliases: ["GeForce GTX 580","NVIDIA GeForce GTX 580","GeForce GTX 580 Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 580 Direct3D11 vs_5_0 ps_5_0, D3D11)","GF110"],
        specs: {
          fp32Tflops: 1.581, fp16Tflops: 1.581, int8Tops: null,
          bandwidthGBs: 192.4, pixelRateGps: 37.1, texelRateGts: 49.4,
          triangleRateGts: null, vramGB: 1.5, memType: 'GDDR5', busWidth: 384,
          shaderUnits: 512, baseClockMhz: 772, boostClockMhz: 1544
        },
        note: "GF110；512 CUDA（772 / 1544 MHz），48 光栅 / 64 纹理；384-bit GDDR5 4.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-570',
        vendor: 'NVIDIA', name: 'GeForce GTX 570', family: 'GeForce 500',
        type: 'desktop', year: 2010, api: 'd3d11',
        aliases: ["GeForce GTX 570","NVIDIA GeForce GTX 570","GeForce GTX 570 Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 570 Direct3D11 vs_5_0 ps_5_0, D3D11)","GF110"],
        specs: {
          fp32Tflops: 1.405, fp16Tflops: 1.405, int8Tops: null,
          bandwidthGBs: 152, pixelRateGps: 35.1, texelRateGts: 43.9,
          triangleRateGts: null, vramGB: 1.25, memType: 'GDDR5', busWidth: 320,
          shaderUnits: 480, baseClockMhz: 732, boostClockMhz: 1464
        },
        note: "GF110；480 CUDA（732 / 1464 MHz），48 光栅 / 60 纹理；320-bit GDDR5 3.8 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-560-ti',
        vendor: 'NVIDIA', name: 'GeForce GTX 560 Ti', family: 'GeForce 500',
        type: 'desktop', year: 2011, api: 'd3d11',
        aliases: ["GeForce GTX 560 Ti","NVIDIA GeForce GTX 560 Ti","GeForce GTX 560 Ti Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 560 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)","GF114"],
        specs: {
          fp32Tflops: 1.263, fp16Tflops: 1.263, int8Tops: null,
          bandwidthGBs: 128.3, pixelRateGps: 26.3, texelRateGts: 52.7,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR5', busWidth: 256,
          shaderUnits: 384, baseClockMhz: 823, boostClockMhz: 1645
        },
        note: "GF114；384 CUDA（823 / 1645 MHz），32 光栅 / 64 纹理；256-bit GDDR5 4.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-560',
        vendor: 'NVIDIA', name: 'GeForce GTX 560', family: 'GeForce 500',
        type: 'desktop', year: 2011, api: 'd3d11',
        aliases: ["GeForce GTX 560","NVIDIA GeForce GTX 560","GeForce GTX 560 Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 560 Direct3D11 vs_5_0 ps_5_0, D3D11)","GF114"],
        specs: {
          fp32Tflops: 1.089, fp16Tflops: 1.089, int8Tops: null,
          bandwidthGBs: 128, pixelRateGps: 25.9, texelRateGts: 45.4,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR5', busWidth: 256,
          shaderUnits: 336, baseClockMhz: 810, boostClockMhz: 1620
        },
        note: "GF114；336 CUDA（810 / 1620 MHz），32 光栅 / 56 纹理；256-bit GDDR5 4.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-550-ti',
        vendor: 'NVIDIA', name: 'GeForce GTX 550 Ti', family: 'GeForce 500',
        type: 'desktop', year: 2011, api: 'd3d11',
        aliases: ["GeForce GTX 550 Ti","NVIDIA GeForce GTX 550 Ti","GeForce GTX 550 Ti Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 550 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)","GF116"],
        specs: {
          fp32Tflops: 0.691, fp16Tflops: 0.691, int8Tops: null,
          bandwidthGBs: 98.5, pixelRateGps: 21.6, texelRateGts: 28.8,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR5', busWidth: 192,
          shaderUnits: 192, baseClockMhz: 900, boostClockMhz: 1800
        },
        note: "GF116；192 CUDA（900 / 1800 MHz），24 光栅 / 32 纹理；192-bit GDDR5 4.1 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },
      /* ==================================================================
       * 二、NVIDIA 笔记本独显（新 → 旧）
       * ================================================================== */

      {
        id: 'nvidia-rtx-4090-laptop',
        vendor: 'NVIDIA', name: 'GeForce RTX 4090 Laptop GPU', family: 'GeForce RTX 40 (笔记本)',
        type: 'laptop', year: 2023, api: 'd3d12',
        aliases: [
          'RTX 4090 Laptop', 'GeForce RTX 4090 Laptop GPU', 'NVIDIA GeForce RTX 4090 Laptop GPU',
          'NVIDIA GeForce RTX 4090 Laptop GPU Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'GeForce RTX 4090 Mobile', 'RTX 4090 Mobile', 'NVIDIA GeForce RTX 4090 Mobile',
          'RTX 4090 Laptop GPU Max-Q', 'AD103', 'NVIDIA AD103'
        ],
        specs: {
          fp32Tflops: 39.70, fp16Tflops: 39.70, int8Tops: null,
          bandwidthGBs: 576, pixelRateGps: 228.5, texelRateGts: 620.2,
          triangleRateGts: null, vramGB: 16, memType: 'GDDR6', busWidth: 256,
          shaderUnits: 9728, baseClockMhz: null, boostClockMhz: 2040
        },
        note: 'AD103 笔记本版（9728 CUDA），256-bit GDDR6 18 Gbps；TGP 80–150W 可配，boost 随功耗浮动。'
      },

      {
        id: 'nvidia-rtx-4080-laptop',
        vendor: 'NVIDIA', name: 'GeForce RTX 4080 Laptop GPU', family: 'GeForce RTX 40 (笔记本)',
        type: 'laptop', year: 2023, api: 'd3d12',
        aliases: [
          'RTX 4080 Laptop', 'GeForce RTX 4080 Laptop GPU', 'NVIDIA GeForce RTX 4080 Laptop GPU',
          'NVIDIA GeForce RTX 4080 Laptop GPU Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'GeForce RTX 4080 Mobile', 'RTX 4080 Mobile', 'NVIDIA GeForce RTX 4080 Mobile',
          'RTX 4080 Laptop GPU Max-Q', 'AD104', 'NVIDIA AD104'
        ],
        specs: {
          fp32Tflops: 33.66, fp16Tflops: 33.66, int8Tops: null,
          bandwidthGBs: 432, pixelRateGps: 182.4, texelRateGts: 528.9,
          triangleRateGts: null, vramGB: 12, memType: 'GDDR6', busWidth: 192,
          shaderUnits: 7424, baseClockMhz: null, boostClockMhz: 2280
        },
        note: 'AD104 笔记本版（7424 CUDA），192-bit GDDR6 18 Gbps；TGP 60–150W 可配。'
      },

      {
        id: 'nvidia-rtx-4070-laptop',
        vendor: 'NVIDIA', name: 'GeForce RTX 4070 Laptop GPU', family: 'GeForce RTX 40 (笔记本)',
        type: 'laptop', year: 2023, api: 'd3d12',
        aliases: [
          'RTX 4070 Laptop', 'GeForce RTX 4070 Laptop GPU', 'NVIDIA GeForce RTX 4070 Laptop GPU',
          'NVIDIA GeForce RTX 4070 Laptop GPU Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'GeForce RTX 4070 Mobile', 'RTX 4070 Mobile', 'NVIDIA GeForce RTX 4070 Mobile',
          'RTX 4070 Laptop GPU Max-Q', 'AD106', 'NVIDIA AD106'
        ],
        specs: {
          fp32Tflops: 23.04, fp16Tflops: 23.04, int8Tops: null,
          bandwidthGBs: 256, pixelRateGps: 104.4, texelRateGts: 313.2,
          triangleRateGts: null, vramGB: 8, memType: 'GDDR6', busWidth: 128,
          shaderUnits: 4608, baseClockMhz: null, boostClockMhz: 2175
        },
        note: 'AD106 笔记本版（4608 CUDA），128-bit GDDR6 16 Gbps；TGP 35–115W 可配。'
      },

      {
        id: 'nvidia-rtx-4060-laptop',
        vendor: 'NVIDIA', name: 'GeForce RTX 4060 Laptop GPU', family: 'GeForce RTX 40 (笔记本)',
        type: 'laptop', year: 2023, api: 'd3d12',
        aliases: [
          'RTX 4060 Laptop', 'GeForce RTX 4060 Laptop GPU', 'NVIDIA GeForce RTX 4060 Laptop GPU',
          'NVIDIA GeForce RTX 4060 Laptop GPU Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'GeForce RTX 4060 Mobile', 'RTX 4060 Mobile', 'NVIDIA GeForce RTX 4060 Mobile',
          'RTX 4060 Laptop GPU Max-Q', 'AD107', 'NVIDIA AD107'
        ],
        specs: {
          fp32Tflops: 15.11, fp16Tflops: 15.11, int8Tops: null,
          bandwidthGBs: 256, pixelRateGps: 113.8, texelRateGts: 227.5,
          triangleRateGts: null, vramGB: 8, memType: 'GDDR6', busWidth: 128,
          shaderUnits: 3072, baseClockMhz: null, boostClockMhz: 2370
        },
        note: 'AD107 笔记本版（3072 CUDA），128-bit GDDR6 16 Gbps；TGP 35–115W 可配。'
      },

      {
        id: 'nvidia-rtx-3080-laptop',
        vendor: 'NVIDIA', name: 'GeForce RTX 3080 Laptop GPU', family: 'GeForce RTX 30 (笔记本)',
        type: 'laptop', year: 2021, api: 'd3d12',
        aliases: [
          'RTX 3080 Laptop', 'GeForce RTX 3080 Laptop GPU', 'NVIDIA GeForce RTX 3080 Laptop GPU',
          'NVIDIA GeForce RTX 3080 Laptop GPU Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'GeForce RTX 3080 Mobile', 'RTX 3080 Mobile', 'NVIDIA GeForce RTX 3080 Mobile',
          'RTX 3080 Laptop GPU Max-Q', 'GA104', 'NVIDIA GA104'
        ],
        specs: {
          fp32Tflops: 18.98, fp16Tflops: 18.98, int8Tops: null,
          bandwidthGBs: 448, pixelRateGps: 164.2, texelRateGts: 328.3,
          triangleRateGts: null, vramGB: 8, memType: 'GDDR6', busWidth: 256,
          shaderUnits: 6144, baseClockMhz: null, boostClockMhz: 1545
        },
        note: 'GA104 笔记本版（6144 CUDA），256-bit GDDR6 14 Gbps；TGP 80–165W 可配（8GB / 16GB）。'
      },

      {
        id: 'nvidia-rtx-3070-laptop',
        vendor: 'NVIDIA', name: 'GeForce RTX 3070 Laptop GPU', family: 'GeForce RTX 30 (笔记本)',
        type: 'laptop', year: 2021, api: 'd3d12',
        aliases: [
          'RTX 3070 Laptop', 'GeForce RTX 3070 Laptop GPU', 'NVIDIA GeForce RTX 3070 Laptop GPU',
          'NVIDIA GeForce RTX 3070 Laptop GPU Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'GeForce RTX 3070 Mobile', 'RTX 3070 Mobile', 'NVIDIA GeForce RTX 3070 Mobile',
          'RTX 3070 Laptop GPU Max-Q', 'GA104', 'NVIDIA GA104'
        ],
        specs: {
          fp32Tflops: 15.97, fp16Tflops: 15.97, int8Tops: null,
          bandwidthGBs: 448, pixelRateGps: 155.5, texelRateGts: 259.2,
          triangleRateGts: null, vramGB: 8, memType: 'GDDR6', busWidth: 256,
          shaderUnits: 5120, baseClockMhz: null, boostClockMhz: 1560
        },
        note: 'GA104 笔记本版（5120 CUDA），256-bit GDDR6 14 Gbps；TGP 80–125W 可配。'
      },

      {
        id: 'nvidia-rtx-3060-laptop',
        vendor: 'NVIDIA', name: 'GeForce RTX 3060 Laptop GPU', family: 'GeForce RTX 30 (笔记本)',
        type: 'laptop', year: 2021, api: 'd3d12',
        aliases: [
          'RTX 3060 Laptop', 'GeForce RTX 3060 Laptop GPU', 'NVIDIA GeForce RTX 3060 Laptop GPU',
          'NVIDIA GeForce RTX 3060 Laptop GPU Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'GeForce RTX 3060 Mobile', 'RTX 3060 Mobile', 'NVIDIA GeForce RTX 3060 Mobile',
          'RTX 3060 Laptop GPU Max-Q', 'GA106', 'NVIDIA GA106'
        ],
        specs: {
          fp32Tflops: 13.31, fp16Tflops: 13.31, int8Tops: null,
          bandwidthGBs: 336, pixelRateGps: 81.7, texelRateGts: 204.2,
          triangleRateGts: null, vramGB: 6, memType: 'GDDR6', busWidth: 192,
          shaderUnits: 3840, baseClockMhz: null, boostClockMhz: 1732
        },
        note: 'GA106 笔记本版（3840 CUDA），192-bit GDDR6 14 Gbps；TGP 60–130W 可配（6GB / 12GB）。'
      },

      {
        id: 'nvidia-rtx-3050-laptop',
        vendor: 'NVIDIA', name: 'GeForce RTX 3050 Laptop GPU', family: 'GeForce RTX 30 (笔记本)',
        type: 'laptop', year: 2021, api: 'd3d12',
        aliases: [
          'RTX 3050 Laptop', 'GeForce RTX 3050 Laptop GPU', 'NVIDIA GeForce RTX 3050 Laptop GPU',
          'NVIDIA GeForce RTX 3050 Laptop GPU Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce RTX 3050 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'GeForce RTX 3050 Mobile', 'RTX 3050 Mobile', 'NVIDIA GeForce RTX 3050 Mobile',
          'RTX 3050 Laptop GPU Max-Q', 'GA107', 'NVIDIA GA107'
        ],
        specs: {
          fp32Tflops: 7.12, fp16Tflops: 7.12, int8Tops: null,
          bandwidthGBs: 192, pixelRateGps: 55.7, texelRateGts: 111.4,
          triangleRateGts: null, vramGB: 4, memType: 'GDDR6', busWidth: 128,
          shaderUnits: 2048, baseClockMhz: null, boostClockMhz: 1740
        },
        note: 'GA107 笔记本版（2048 CUDA），128-bit GDDR6 12 Gbps；TGP 35–95W 可配（4GB / 6GB / 8GB）。'
      },

      {
        id: 'nvidia-gtx-1650-laptop',
        vendor: 'NVIDIA', name: 'GeForce GTX 1650 Laptop GPU', family: 'GeForce GTX 16 (笔记本)',
        type: 'laptop', year: 2019, api: 'd3d12',
        aliases: [
          'GTX 1650 Laptop', 'GeForce GTX 1650 Laptop GPU', 'NVIDIA GeForce GTX 1650 Laptop GPU',
          'NVIDIA GeForce GTX 1650 Laptop GPU Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'GeForce GTX 1650 Mobile', 'GTX 1650 Mobile', 'NVIDIA GeForce GTX 1650 Mobile',
          'GTX 1650 Laptop GPU Max-Q', 'TU117', 'NVIDIA TU117'
        ],
        specs: {
          fp32Tflops: 2.98, fp16Tflops: 2.98, int8Tops: null,
          bandwidthGBs: 128, pixelRateGps: 49.9, texelRateGts: 99.8,
          triangleRateGts: null, vramGB: 4, memType: 'GDDR5', busWidth: 128,
          shaderUnits: 896, baseClockMhz: null, boostClockMhz: 1665
        },
        note: 'TU117 笔记本版（896 CUDA），128-bit GDDR5 8 Gbps；TGP 35–50W，部分机型为 GDDR6。'
      },

      {
        id: 'nvidia-mx450',
        vendor: 'NVIDIA', name: 'GeForce MX450', family: 'GeForce MX',
        type: 'laptop', year: 2020, api: 'd3d12',
        aliases: [
          'GeForce MX450', 'NVIDIA GeForce MX450', 'MX450',
          'NVIDIA GeForce MX450 Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (NVIDIA, NVIDIA GeForce MX450 Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'GeForce MX450 Mobile', 'NVIDIA GeForce MX450 Mobile',
          'TU117', 'NVIDIA TU117'
        ],
        specs: {
          fp32Tflops: 3.04, fp16Tflops: 3.04, int8Tops: null,
          bandwidthGBs: 80, pixelRateGps: 50.4, texelRateGts: 50.1,
          triangleRateGts: null, vramGB: 2, memType: 'GDDR6', busWidth: 64,
          shaderUnits: 896, baseClockMhz: null, boostClockMhz: 1695
        },
        note: 'TU117 低功耗版（896 CUDA），64-bit 显存；按版本分 12W / 25W / 28.5W，GDDR6 版为 10 Gbps（80 GB/s），GDDR5 版为 8 Gbps（64 GB/s）。'
      },


      /* ------------------------------------------------------------------
       * NVIDIA 笔记本老卡：GeForce 8M–900M（Tesla · Fermi · Kepler · Maxwell）
       * 数据来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units
       * 说明：老 NVIDIA 卡（Tesla/Fermi）核心与着色器为双时钟域，boostClockMhz 记 NVIDIA
       *   公开的 Shader 时钟（= FP32 计算所用时钟），baseClockMhz 记核心/图形时钟；
       *   像素/纹理填充率按核心时钟计算，与 Wikipedia 列表页一致。
       * ------------------------------------------------------------------ */

      {
        id: 'nvidia-8600m-gt',
        vendor: 'NVIDIA', name: 'GeForce 8600M GT', family: 'GeForce 8000M',
        type: 'laptop', year: 2007, api: 'd3d10',
        aliases: ["GeForce 8600M GT","NVIDIA GeForce 8600M GT","GeForce 8600M GT Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce 8600M GT Direct3D11 vs_5_0 ps_5_0, D3D11)","G84M"],
        specs: {
          fp32Tflops: 0.061, fp16Tflops: 0.061, int8Tops: null,
          bandwidthGBs: 22.4, pixelRateGps: 3.8, texelRateGts: 7.6,
          triangleRateGts: null, vramGB: 0.5, memType: 'GDDR3', busWidth: 128,
          shaderUnits: 32, baseClockMhz: 475, boostClockMhz: 950
        },
        note: "G84M；32 CUDA（475 / 950 MHz），8 光栅 / 16 纹理；128-bit GDDR3 1.4 Gbps。另有 DDR2 版（12.8 GB/s）。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-8700m-gt',
        vendor: 'NVIDIA', name: 'GeForce 8700M GT', family: 'GeForce 8000M',
        type: 'laptop', year: 2007, api: 'd3d10',
        aliases: ["GeForce 8700M GT","NVIDIA GeForce 8700M GT","GeForce 8700M GT Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce 8700M GT Direct3D11 vs_5_0 ps_5_0, D3D11)","G84M"],
        specs: {
          fp32Tflops: 0.08, fp16Tflops: 0.08, int8Tops: null,
          bandwidthGBs: 25.6, pixelRateGps: 5, texelRateGts: 10,
          triangleRateGts: null, vramGB: 0.5, memType: 'GDDR3', busWidth: 128,
          shaderUnits: 32, baseClockMhz: 625, boostClockMhz: 1250
        },
        note: "G84M；32 CUDA（625 / 1250 MHz），8 光栅 / 16 纹理；128-bit GDDR3 1.6 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-8800m-gtx',
        vendor: 'NVIDIA', name: 'GeForce 8800M GTX', family: 'GeForce 8000M',
        type: 'laptop', year: 2007, api: 'd3d10',
        aliases: ["GeForce 8800M GTX","NVIDIA GeForce 8800M GTX","GeForce 8800M GTX Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce 8800M GTX Direct3D11 vs_5_0 ps_5_0, D3D11)","G92M"],
        specs: {
          fp32Tflops: 0.24, fp16Tflops: 0.24, int8Tops: null,
          bandwidthGBs: 51.2, pixelRateGps: 8, texelRateGts: 24,
          triangleRateGts: null, vramGB: 0.5, memType: 'GDDR3', busWidth: 256,
          shaderUnits: 96, baseClockMhz: 500, boostClockMhz: 1250
        },
        note: "G92M；96 CUDA（500 / 1250 MHz），16 光栅 / 48 纹理；256-bit GDDR3 1.6 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-9600m-gt',
        vendor: 'NVIDIA', name: 'GeForce 9600M GT', family: 'GeForce 9000M',
        type: 'laptop', year: 2008, api: 'd3d10',
        aliases: ["GeForce 9600M GT","NVIDIA GeForce 9600M GT","GeForce 9600M GT Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce 9600M GT Direct3D11 vs_5_0 ps_5_0, D3D11)","G96M"],
        specs: {
          fp32Tflops: 0.08, fp16Tflops: 0.08, int8Tops: null,
          bandwidthGBs: 25.6, pixelRateGps: 4, texelRateGts: 8,
          triangleRateGts: null, vramGB: 0.5, memType: 'GDDR3', busWidth: 128,
          shaderUnits: 32, baseClockMhz: 500, boostClockMhz: 1250
        },
        note: "G96M；32 CUDA（500 / 1250 MHz），8 光栅 / 16 纹理；128-bit GDDR3 1.6 Gbps。另有 DDR2 版。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-9700m-gt',
        vendor: 'NVIDIA', name: 'GeForce 9700M GT', family: 'GeForce 9000M',
        type: 'laptop', year: 2008, api: 'd3d10',
        aliases: ["GeForce 9700M GT","NVIDIA GeForce 9700M GT","GeForce 9700M GT Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce 9700M GT Direct3D11 vs_5_0 ps_5_0, D3D11)","G96M"],
        specs: {
          fp32Tflops: 0.099, fp16Tflops: 0.099, int8Tops: null,
          bandwidthGBs: 25.6, pixelRateGps: 5, texelRateGts: 10,
          triangleRateGts: null, vramGB: 0.5, memType: 'GDDR3', busWidth: 128,
          shaderUnits: 32, baseClockMhz: 625, boostClockMhz: 1550
        },
        note: "G96M；32 CUDA（625 / 1550 MHz），8 光栅 / 16 纹理；128-bit GDDR3 1.6 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-9800m-gt',
        vendor: 'NVIDIA', name: 'GeForce 9800M GT', family: 'GeForce 9000M',
        type: 'laptop', year: 2008, api: 'd3d10',
        aliases: ["GeForce 9800M GT","NVIDIA GeForce 9800M GT","GeForce 9800M GT Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce 9800M GT Direct3D11 vs_5_0 ps_5_0, D3D11)","G92M"],
        specs: {
          fp32Tflops: 0.24, fp16Tflops: 0.24, int8Tops: null,
          bandwidthGBs: 51.2, pixelRateGps: 8, texelRateGts: 24,
          triangleRateGts: null, vramGB: 0.5, memType: 'GDDR3', busWidth: 256,
          shaderUnits: 96, baseClockMhz: 500, boostClockMhz: 1250
        },
        note: "G92M；96 CUDA（500 / 1250 MHz），16 光栅 / 48 纹理；256-bit GDDR3 1.6 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-9800m-gtx',
        vendor: 'NVIDIA', name: 'GeForce 9800M GTX', family: 'GeForce 9000M',
        type: 'laptop', year: 2008, api: 'd3d10',
        aliases: ["GeForce 9800M GTX","NVIDIA GeForce 9800M GTX","GeForce 9800M GTX Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce 9800M GTX Direct3D11 vs_5_0 ps_5_0, D3D11)","G92M"],
        specs: {
          fp32Tflops: 0.28, fp16Tflops: 0.28, int8Tops: null,
          bandwidthGBs: 51.2, pixelRateGps: 8, texelRateGts: 28,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR3', busWidth: 256,
          shaderUnits: 112, baseClockMhz: 500, boostClockMhz: 1250
        },
        note: "G92M；112 CUDA（500 / 1250 MHz），16 光栅 / 56 纹理；256-bit GDDR3 1.6 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-g105m',
        vendor: 'NVIDIA', name: 'GeForce G 105M', family: 'GeForce 100M',
        type: 'laptop', year: 2009, api: 'd3d10',
        aliases: ["GeForce G 105M","NVIDIA GeForce G 105M","GeForce G 105M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce G 105M Direct3D11 vs_5_0 ps_5_0, D3D11)","G98M"],
        specs: {
          fp32Tflops: 0.026, fp16Tflops: 0.026, int8Tops: null,
          bandwidthGBs: 12.8, pixelRateGps: 2.6, texelRateGts: 5.1,
          triangleRateGts: null, vramGB: 0.5, memType: 'GDDR3', busWidth: 64,
          shaderUnits: 8, baseClockMhz: 640, boostClockMhz: 1600
        },
        note: "G98M；8 CUDA（640 / 1600 MHz），4 光栅 / 8 纹理；64-bit GDDR3 1.6 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-130m',
        vendor: 'NVIDIA', name: 'GeForce GT 130M', family: 'GeForce 100M',
        type: 'laptop', year: 2009, api: 'd3d10',
        aliases: ["GeForce GT 130M","NVIDIA GeForce GT 130M","GeForce GT 130M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GT 130M Direct3D11 vs_5_0 ps_5_0, D3D11)","G96M"],
        specs: {
          fp32Tflops: 0.096, fp16Tflops: 0.096, int8Tops: null,
          bandwidthGBs: 25.6, pixelRateGps: 4.8, texelRateGts: 9.6,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR3', busWidth: 128,
          shaderUnits: 32, baseClockMhz: 600, boostClockMhz: 1500
        },
        note: "G96M；32 CUDA（600 / 1500 MHz），8 光栅 / 16 纹理；128-bit GDDR3 1.6 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-g210m',
        vendor: 'NVIDIA', name: 'GeForce G 210M', family: 'GeForce 200M',
        type: 'laptop', year: 2009, api: 'd3d10',
        aliases: ["GeForce G 210M","NVIDIA GeForce G 210M","GeForce G 210M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce G 210M Direct3D11 vs_5_0 ps_5_0, D3D11)","GT218M"],
        specs: {
          fp32Tflops: 0.048, fp16Tflops: 0.048, int8Tops: null,
          bandwidthGBs: 12.8, pixelRateGps: 2.5, texelRateGts: 5,
          triangleRateGts: null, vramGB: 0.5, memType: 'GDDR3', busWidth: 64,
          shaderUnits: 16, baseClockMhz: 625, boostClockMhz: 1500
        },
        note: "GT218M；16 CUDA（625 / 1500 MHz），4 光栅 / 8 纹理；64-bit GDDR3 1.6 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-240m',
        vendor: 'NVIDIA', name: 'GeForce GT 240M', family: 'GeForce 200M',
        type: 'laptop', year: 2009, api: 'd3d10',
        aliases: ["GeForce GT 240M","NVIDIA GeForce GT 240M","GeForce GT 240M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GT 240M Direct3D11 vs_5_0 ps_5_0, D3D11)","GT216M"],
        specs: {
          fp32Tflops: 0.116, fp16Tflops: 0.116, int8Tops: null,
          bandwidthGBs: 25.6, pixelRateGps: 4.4, texelRateGts: 8.8,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR3', busWidth: 128,
          shaderUnits: 48, baseClockMhz: 550, boostClockMhz: 1210
        },
        note: "GT216M；48 CUDA（550 / 1210 MHz），8 光栅 / 16 纹理；128-bit GDDR3 1.6 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-260m',
        vendor: 'NVIDIA', name: 'GeForce GTX 260M', family: 'GeForce 200M',
        type: 'laptop', year: 2009, api: 'd3d10',
        aliases: ["GeForce GTX 260M","NVIDIA GeForce GTX 260M","GeForce GTX 260M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 260M Direct3D11 vs_5_0 ps_5_0, D3D11)","G92M"],
        specs: {
          fp32Tflops: 0.308, fp16Tflops: 0.308, int8Tops: null,
          bandwidthGBs: 60.8, pixelRateGps: 8.8, texelRateGts: 30.8,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR3', busWidth: 256,
          shaderUnits: 112, baseClockMhz: 550, boostClockMhz: 1375
        },
        note: "G92M；112 CUDA（550 / 1375 MHz），16 光栅 / 56 纹理；256-bit GDDR3 1.9 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-280m',
        vendor: 'NVIDIA', name: 'GeForce GTX 280M', family: 'GeForce 200M',
        type: 'laptop', year: 2009, api: 'd3d10',
        aliases: ["GeForce GTX 280M","NVIDIA GeForce GTX 280M","GeForce GTX 280M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 280M Direct3D11 vs_5_0 ps_5_0, D3D11)","G92M"],
        specs: {
          fp32Tflops: 0.375, fp16Tflops: 0.375, int8Tops: null,
          bandwidthGBs: 60.8, pixelRateGps: 9.4, texelRateGts: 37.4,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR3', busWidth: 256,
          shaderUnits: 128, baseClockMhz: 585, boostClockMhz: 1463
        },
        note: "G92M；128 CUDA（585 / 1463 MHz），16 光栅 / 64 纹理；256-bit GDDR3 1.9 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-g310m',
        vendor: 'NVIDIA', name: 'GeForce 310M', family: 'GeForce 300M',
        type: 'laptop', year: 2010, api: 'd3d10',
        aliases: ["GeForce 310M","NVIDIA GeForce 310M","GeForce 310M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce 310M Direct3D11 vs_5_0 ps_5_0, D3D11)","GT218M"],
        specs: {
          fp32Tflops: 0.049, fp16Tflops: 0.049, int8Tops: null,
          bandwidthGBs: 12.8, pixelRateGps: 2.5, texelRateGts: 5,
          triangleRateGts: null, vramGB: 0.5, memType: 'GDDR3', busWidth: 64,
          shaderUnits: 16, baseClockMhz: 625, boostClockMhz: 1530
        },
        note: "GT218M；16 CUDA（625 / 1530 MHz），4 光栅 / 8 纹理；64-bit GDDR3 1.6 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-330m',
        vendor: 'NVIDIA', name: 'GeForce GT 330M', family: 'GeForce 300M',
        type: 'laptop', year: 2010, api: 'd3d10',
        aliases: ["GeForce GT 330M","NVIDIA GeForce GT 330M","GeForce GT 330M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GT 330M Direct3D11 vs_5_0 ps_5_0, D3D11)","GT216M"],
        specs: {
          fp32Tflops: 0.121, fp16Tflops: 0.121, int8Tops: null,
          bandwidthGBs: 25.6, pixelRateGps: 4.6, texelRateGts: 9.2,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR3', busWidth: 128,
          shaderUnits: 48, baseClockMhz: 575, boostClockMhz: 1265
        },
        note: "GT216M；48 CUDA（575 / 1265 MHz），8 光栅 / 16 纹理；128-bit GDDR3 1.6 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-335m',
        vendor: 'NVIDIA', name: 'GeForce GT 335M', family: 'GeForce 300M',
        type: 'laptop', year: 2010, api: 'd3d10',
        aliases: ["GeForce GT 335M","NVIDIA GeForce GT 335M","GeForce GT 335M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GT 335M Direct3D11 vs_5_0 ps_5_0, D3D11)","GT215M"],
        specs: {
          fp32Tflops: 0.156, fp16Tflops: 0.156, int8Tops: null,
          bandwidthGBs: 25.6, pixelRateGps: 8.6, texelRateGts: 25.9,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR3', busWidth: 128,
          shaderUnits: 72, baseClockMhz: 1080, boostClockMhz: 1080
        },
        note: "GT215M；72 CUDA（核心 450 / 着色器 1080 MHz），8 光栅 / 24 纹理；128-bit GDDR3 1.6 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-420m',
        vendor: 'NVIDIA', name: 'GeForce GT 420M', family: 'GeForce 400M',
        type: 'laptop', year: 2010, api: 'd3d11',
        aliases: ["GeForce GT 420M","NVIDIA GeForce GT 420M","GeForce GT 420M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GT 420M Direct3D11 vs_5_0 ps_5_0, D3D11)","GF108M"],
        specs: {
          fp32Tflops: 0.192, fp16Tflops: 0.192, int8Tops: null,
          bandwidthGBs: 25.6, pixelRateGps: 2, texelRateGts: 8,
          triangleRateGts: null, vramGB: 1, memType: 'DDR3', busWidth: 128,
          shaderUnits: 96, baseClockMhz: 500, boostClockMhz: 1000
        },
        note: "GF108M；96 CUDA（500 / 1000 MHz），4 光栅 / 16 纹理；128-bit DDR3 1.6 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-425m',
        vendor: 'NVIDIA', name: 'GeForce GT 425M', family: 'GeForce 400M',
        type: 'laptop', year: 2010, api: 'd3d11',
        aliases: ["GeForce GT 425M","NVIDIA GeForce GT 425M","GeForce GT 425M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GT 425M Direct3D11 vs_5_0 ps_5_0, D3D11)","GF108M"],
        specs: {
          fp32Tflops: 0.215, fp16Tflops: 0.215, int8Tops: null,
          bandwidthGBs: 25.6, pixelRateGps: 2.2, texelRateGts: 9,
          triangleRateGts: null, vramGB: 1, memType: 'DDR3', busWidth: 128,
          shaderUnits: 96, baseClockMhz: 560, boostClockMhz: 1120
        },
        note: "GF108M；96 CUDA（560 / 1120 MHz），4 光栅 / 16 纹理；128-bit DDR3 1.6 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-445m',
        vendor: 'NVIDIA', name: 'GeForce GT 445M', family: 'GeForce 400M',
        type: 'laptop', year: 2010, api: 'd3d11',
        aliases: ["GeForce GT 445M","NVIDIA GeForce GT 445M","GeForce GT 445M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GT 445M Direct3D11 vs_5_0 ps_5_0, D3D11)","GF106M"],
        specs: {
          fp32Tflops: 0.34, fp16Tflops: 0.34, int8Tops: null,
          bandwidthGBs: 60, pixelRateGps: 9.4, texelRateGts: 14.2,
          triangleRateGts: null, vramGB: 1.5, memType: 'GDDR5', busWidth: 192,
          shaderUnits: 144, baseClockMhz: 590, boostClockMhz: 1180
        },
        note: "GF106M；144 CUDA（590 / 1180 MHz），16 光栅 / 24 纹理；192-bit GDDR5 2.5 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-460m',
        vendor: 'NVIDIA', name: 'GeForce GTX 460M', family: 'GeForce 400M',
        type: 'laptop', year: 2010, api: 'd3d11',
        aliases: ["GeForce GTX 460M","NVIDIA GeForce GTX 460M","GeForce GTX 460M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 460M Direct3D11 vs_5_0 ps_5_0, D3D11)","GF106M"],
        specs: {
          fp32Tflops: 0.518, fp16Tflops: 0.518, int8Tops: null,
          bandwidthGBs: 60, pixelRateGps: 16.2, texelRateGts: 21.6,
          triangleRateGts: null, vramGB: 1.5, memType: 'GDDR5', busWidth: 192,
          shaderUnits: 192, baseClockMhz: 675, boostClockMhz: 1350
        },
        note: "GF106M；192 CUDA（675 / 1350 MHz），24 光栅 / 32 纹理；192-bit GDDR5 2.5 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-470m',
        vendor: 'NVIDIA', name: 'GeForce GTX 470M', family: 'GeForce 400M',
        type: 'laptop', year: 2010, api: 'd3d11',
        aliases: ["GeForce GTX 470M","NVIDIA GeForce GTX 470M","GeForce GTX 470M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 470M Direct3D11 vs_5_0 ps_5_0, D3D11)","GF104M"],
        specs: {
          fp32Tflops: 0.634, fp16Tflops: 0.634, int8Tops: null,
          bandwidthGBs: 60, pixelRateGps: 13.2, texelRateGts: 26.4,
          triangleRateGts: null, vramGB: 1.5, memType: 'GDDR5', busWidth: 192,
          shaderUnits: 288, baseClockMhz: 550, boostClockMhz: 1100
        },
        note: "GF104M；288 CUDA（550 / 1100 MHz），24 光栅 / 48 纹理；192-bit GDDR5 2.5 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-480m',
        vendor: 'NVIDIA', name: 'GeForce GTX 480M', family: 'GeForce 400M',
        type: 'laptop', year: 2010, api: 'd3d11',
        aliases: ["GeForce GTX 480M","NVIDIA GeForce GTX 480M","GeForce GTX 480M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 480M Direct3D11 vs_5_0 ps_5_0, D3D11)","GF100M"],
        specs: {
          fp32Tflops: 0.598, fp16Tflops: 0.598, int8Tops: null,
          bandwidthGBs: 76.8, pixelRateGps: 13.6, texelRateGts: 18.7,
          triangleRateGts: null, vramGB: 2, memType: 'GDDR5', busWidth: 256,
          shaderUnits: 352, baseClockMhz: 425, boostClockMhz: 850
        },
        note: "GF100M；352 CUDA（425 / 850 MHz），32 光栅 / 44 纹理；256-bit GDDR5 2.4 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-520m',
        vendor: 'NVIDIA', name: 'GeForce GT 520M', family: 'GeForce 500M',
        type: 'laptop', year: 2011, api: 'd3d11',
        aliases: ["GeForce GT 520M","NVIDIA GeForce GT 520M","GeForce GT 520M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GT 520M Direct3D11 vs_5_0 ps_5_0, D3D11)","GF119M"],
        specs: {
          fp32Tflops: 0.142, fp16Tflops: 0.142, int8Tops: null,
          bandwidthGBs: 12.8, pixelRateGps: 3, texelRateGts: 5.9,
          triangleRateGts: null, vramGB: 1, memType: 'DDR3', busWidth: 64,
          shaderUnits: 48, baseClockMhz: 740, boostClockMhz: 1480
        },
        note: "GF119M；48 CUDA（740 / 1480 MHz），4 光栅 / 8 纹理；64-bit DDR3 1.6 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-540m',
        vendor: 'NVIDIA', name: 'GeForce GT 540M', family: 'GeForce 500M',
        type: 'laptop', year: 2011, api: 'd3d11',
        aliases: ["GeForce GT 540M","NVIDIA GeForce GT 540M","GeForce GT 540M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GT 540M Direct3D11 vs_5_0 ps_5_0, D3D11)","GF108M"],
        specs: {
          fp32Tflops: 0.258, fp16Tflops: 0.258, int8Tops: null,
          bandwidthGBs: 28.8, pixelRateGps: 2.7, texelRateGts: 10.8,
          triangleRateGts: null, vramGB: 2, memType: 'DDR3', busWidth: 128,
          shaderUnits: 96, baseClockMhz: 672, boostClockMhz: 1344
        },
        note: "GF108M；96 CUDA（672 / 1344 MHz），4 光栅 / 16 纹理；128-bit DDR3 1.8 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-550m',
        vendor: 'NVIDIA', name: 'GeForce GT 550M', family: 'GeForce 500M',
        type: 'laptop', year: 2011, api: 'd3d11',
        aliases: ["GeForce GT 550M","NVIDIA GeForce GT 550M","GeForce GT 550M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GT 550M Direct3D11 vs_5_0 ps_5_0, D3D11)","GF108M"],
        specs: {
          fp32Tflops: 0.284, fp16Tflops: 0.284, int8Tops: null,
          bandwidthGBs: 28.8, pixelRateGps: 3, texelRateGts: 11.8,
          triangleRateGts: null, vramGB: 1, memType: 'DDR3', busWidth: 128,
          shaderUnits: 96, baseClockMhz: 740, boostClockMhz: 1480
        },
        note: "GF108M；96 CUDA（740 / 1480 MHz），4 光栅 / 16 纹理；128-bit DDR3 1.8 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-555m',
        vendor: 'NVIDIA', name: 'GeForce GT 555M', family: 'GeForce 500M',
        type: 'laptop', year: 2011, api: 'd3d11',
        aliases: ["GeForce GT 555M","NVIDIA GeForce GT 555M","GeForce GT 555M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GT 555M Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 0.434, fp16Tflops: 0.434, int8Tops: null,
          bandwidthGBs: 50.2, pixelRateGps: 12, texelRateGts: 18.1,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR5', busWidth: 128,
          shaderUnits: 144, baseClockMhz: 753, boostClockMhz: 1506
        },
        note: "GF116M 高配版；144 CUDA（753 / 1506 MHz），16 光栅 / 24 纹理；128-bit GDDR5 3.14 Gbps。另有 590 MHz / DDR3 等 OEM 版本。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-560m',
        vendor: 'NVIDIA', name: 'GeForce GTX 560M', family: 'GeForce 500M',
        type: 'laptop', year: 2011, api: 'd3d11',
        aliases: ["GeForce GTX 560M","NVIDIA GeForce GTX 560M","GeForce GTX 560M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 560M Direct3D11 vs_5_0 ps_5_0, D3D11)","GF116M"],
        specs: {
          fp32Tflops: 0.595, fp16Tflops: 0.595, int8Tops: null,
          bandwidthGBs: 60, pixelRateGps: 18.6, texelRateGts: 24.8,
          triangleRateGts: null, vramGB: 1.5, memType: 'GDDR5', busWidth: 192,
          shaderUnits: 192, baseClockMhz: 775, boostClockMhz: 1550
        },
        note: "GF116M；192 CUDA（775 / 1550 MHz），24 光栅 / 32 纹理；192-bit GDDR5 2.5 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-570m',
        vendor: 'NVIDIA', name: 'GeForce GTX 570M', family: 'GeForce 500M',
        type: 'laptop', year: 2011, api: 'd3d11',
        aliases: ["GeForce GTX 570M","NVIDIA GeForce GTX 570M","GeForce GTX 570M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 570M Direct3D11 vs_5_0 ps_5_0, D3D11)","GF114M"],
        specs: {
          fp32Tflops: 0.773, fp16Tflops: 0.773, int8Tops: null,
          bandwidthGBs: 72, pixelRateGps: 13.8, texelRateGts: 32.2,
          triangleRateGts: null, vramGB: 1.5, memType: 'GDDR5', busWidth: 192,
          shaderUnits: 336, baseClockMhz: 575, boostClockMhz: 1150
        },
        note: "GF114M；336 CUDA（575 / 1150 MHz），24 光栅 / 56 纹理；192-bit GDDR5 3.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-580m',
        vendor: 'NVIDIA', name: 'GeForce GTX 580M', family: 'GeForce 500M',
        type: 'laptop', year: 2011, api: 'd3d11',
        aliases: ["GeForce GTX 580M","NVIDIA GeForce GTX 580M","GeForce GTX 580M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 580M Direct3D11 vs_5_0 ps_5_0, D3D11)","GF114M"],
        specs: {
          fp32Tflops: 0.952, fp16Tflops: 0.952, int8Tops: null,
          bandwidthGBs: 96, pixelRateGps: 19.8, texelRateGts: 39.7,
          triangleRateGts: null, vramGB: 2, memType: 'GDDR5', busWidth: 256,
          shaderUnits: 384, baseClockMhz: 620, boostClockMhz: 1240
        },
        note: "GF114M；384 CUDA（620 / 1240 MHz），32 光栅 / 64 纹理；256-bit GDDR5 3.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-620m',
        vendor: 'NVIDIA', name: 'GeForce GT 620M', family: 'GeForce 600M',
        type: 'laptop', year: 2012, api: 'd3d11',
        aliases: ["GeForce GT 620M","NVIDIA GeForce GT 620M","GeForce GT 620M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GT 620M Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 0.24, fp16Tflops: 0.24, int8Tops: null,
          bandwidthGBs: 28.8, pixelRateGps: 2.5, texelRateGts: 10,
          triangleRateGts: null, vramGB: 2, memType: 'DDR3', busWidth: 128,
          shaderUnits: 96, baseClockMhz: 625, boostClockMhz: 1250
        },
        note: "GF117M（Fermi 再版）；96 CUDA（625 / 1250 MHz），4 光栅 / 16 纹理；128-bit DDR3 1.8 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-630m',
        vendor: 'NVIDIA', name: 'GeForce GT 630M', family: 'GeForce 600M',
        type: 'laptop', year: 2012, api: 'd3d11',
        aliases: ["GeForce GT 630M","NVIDIA GeForce GT 630M","GeForce GT 630M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GT 630M Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 0.253, fp16Tflops: 0.253, int8Tops: null,
          bandwidthGBs: 28.8, pixelRateGps: 2.6, texelRateGts: 10.6,
          triangleRateGts: null, vramGB: 2, memType: 'DDR3', busWidth: 128,
          shaderUnits: 96, baseClockMhz: 660, boostClockMhz: 1320
        },
        note: "GF117M（Fermi 再版）；96 CUDA（660 / 1320 MHz），4 光栅 / 16 纹理；128-bit DDR3 1.8 Gbps。另有 800/1600 MHz 的 GDDR5 版本。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-670m',
        vendor: 'NVIDIA', name: 'GeForce GTX 670M', family: 'GeForce 600M',
        type: 'laptop', year: 2012, api: 'd3d11',
        aliases: ["GeForce GTX 670M","NVIDIA GeForce GTX 670M","GeForce GTX 670M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 670M Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 0.833, fp16Tflops: 0.833, int8Tops: null,
          bandwidthGBs: 72, pixelRateGps: 14.9, texelRateGts: 34.7,
          triangleRateGts: null, vramGB: 1.5, memType: 'GDDR5', busWidth: 192,
          shaderUnits: 336, baseClockMhz: 620, boostClockMhz: 1240
        },
        note: "GF114M（Fermi）；336 CUDA（620 / 1240 MHz），24 光栅 / 56 纹理；192-bit GDDR5 3.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-675m',
        vendor: 'NVIDIA', name: 'GeForce GTX 675M', family: 'GeForce 600M',
        type: 'laptop', year: 2012, api: 'd3d11',
        aliases: ["GeForce GTX 675M","NVIDIA GeForce GTX 675M","GeForce GTX 675M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 675M Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 0.972, fp16Tflops: 0.972, int8Tops: null,
          bandwidthGBs: 96, pixelRateGps: 20.2, texelRateGts: 40.4,
          triangleRateGts: null, vramGB: 2, memType: 'GDDR5', busWidth: 256,
          shaderUnits: 384, baseClockMhz: 632, boostClockMhz: 1265
        },
        note: "GF114M（Fermi）；384 CUDA（632 / 1265 MHz），32 光栅 / 64 纹理；256-bit GDDR5 3.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-720m',
        vendor: 'NVIDIA', name: 'GeForce GT 720M', family: 'GeForce 700M',
        type: 'laptop', year: 2013, api: 'd3d11',
        aliases: ["GeForce GT 720M","NVIDIA GeForce GT 720M","GeForce GT 720M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GT 720M Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 0.36, fp16Tflops: 0.36, int8Tops: null,
          bandwidthGBs: 16, pixelRateGps: 3.8, texelRateGts: 15,
          triangleRateGts: null, vramGB: 2, memType: 'DDR3', busWidth: 64,
          shaderUnits: 96, baseClockMhz: 938, boostClockMhz: 1876
        },
        note: "GF117M（Fermi）；96 CUDA（938 / 1876 MHz），4 光栅 / 16 纹理；64-bit DDR3 2.0 Gbps。另有 719 MHz 的 GK208 版本。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-640m',
        vendor: 'NVIDIA', name: 'GeForce GT 640M', family: 'GeForce 600M',
        type: 'laptop', year: 2012, api: 'd3d11',
        aliases: ["GeForce GT 640M","NVIDIA GeForce GT 640M","GeForce GT 640M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GT 640M Direct3D11 vs_5_0 ps_5_0, D3D11)","GK107"],
        specs: {
          fp32Tflops: 0.48, fp16Tflops: 0.48, int8Tops: null,
          bandwidthGBs: 28.8, pixelRateGps: 10, texelRateGts: 20,
          triangleRateGts: null, vramGB: 2, memType: 'DDR3', busWidth: 128,
          shaderUnits: 384, baseClockMhz: 625, boostClockMhz: 625
        },
        note: "GK107；384 CUDA，16 光栅 / 32 纹理；128-bit DDR3 1.8 Gbps。另有 GDDR5 版（64 GB/s）。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-645m',
        vendor: 'NVIDIA', name: 'GeForce GT 645M', family: 'GeForce 600M',
        type: 'laptop', year: 2012, api: 'd3d11',
        aliases: ["GeForce GT 645M","NVIDIA GeForce GT 645M","GeForce GT 645M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GT 645M Direct3D11 vs_5_0 ps_5_0, D3D11)","GK107"],
        specs: {
          fp32Tflops: 0.545, fp16Tflops: 0.545, int8Tops: null,
          bandwidthGBs: 28.8, pixelRateGps: 11.4, texelRateGts: 22.7,
          triangleRateGts: null, vramGB: 2, memType: 'DDR3', busWidth: 128,
          shaderUnits: 384, baseClockMhz: 710, boostClockMhz: 710
        },
        note: "GK107；384 CUDA，16 光栅 / 32 纹理；128-bit DDR3 1.8 Gbps。另有 GDDR5 版（64 GB/s）。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-650m',
        vendor: 'NVIDIA', name: 'GeForce GT 650M', family: 'GeForce 600M',
        type: 'laptop', year: 2012, api: 'd3d11',
        aliases: ["GeForce GT 650M","NVIDIA GeForce GT 650M","GeForce GT 650M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GT 650M Direct3D11 vs_5_0 ps_5_0, D3D11)","GK107"],
        specs: {
          fp32Tflops: 0.641, fp16Tflops: 0.641, int8Tops: null,
          bandwidthGBs: 64, pixelRateGps: 13.4, texelRateGts: 26.7,
          triangleRateGts: null, vramGB: 2, memType: 'GDDR5', busWidth: 128,
          shaderUnits: 384, baseClockMhz: 745, boostClockMhz: 835
        },
        note: "GK107；384 CUDA（745 / 835 MHz），16 光栅 / 32 纹理；128-bit GDDR5 4.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-660m',
        vendor: 'NVIDIA', name: 'GeForce GTX 660M', family: 'GeForce 600M',
        type: 'laptop', year: 2012, api: 'd3d11',
        aliases: ["GeForce GTX 660M","NVIDIA GeForce GTX 660M","GeForce GTX 660M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 660M Direct3D11 vs_5_0 ps_5_0, D3D11)","GK107"],
        specs: {
          fp32Tflops: 0.73, fp16Tflops: 0.73, int8Tops: null,
          bandwidthGBs: 80, pixelRateGps: 15.2, texelRateGts: 30.4,
          triangleRateGts: null, vramGB: 2, memType: 'GDDR5', busWidth: 128,
          shaderUnits: 384, baseClockMhz: 835, boostClockMhz: 950
        },
        note: "GK107；384 CUDA（835 / 950 MHz），16 光栅 / 32 纹理；128-bit GDDR5 5.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-680m',
        vendor: 'NVIDIA', name: 'GeForce GTX 680M', family: 'GeForce 600M',
        type: 'laptop', year: 2012, api: 'd3d11',
        aliases: ["GeForce GTX 680M","NVIDIA GeForce GTX 680M","GeForce GTX 680M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 680M Direct3D11 vs_5_0 ps_5_0, D3D11)","GK104"],
        specs: {
          fp32Tflops: 1.933, fp16Tflops: 1.933, int8Tops: null,
          bandwidthGBs: 115.2, pixelRateGps: 23, texelRateGts: 80.5,
          triangleRateGts: null, vramGB: 4, memType: 'GDDR5', busWidth: 256,
          shaderUnits: 1344, baseClockMhz: 719, boostClockMhz: 719
        },
        note: "GK104；1344 CUDA，32 光栅 / 112 纹理；256-bit GDDR5 3.6 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-740m',
        vendor: 'NVIDIA', name: 'GeForce GT 740M', family: 'GeForce 700M',
        type: 'laptop', year: 2013, api: 'd3d11',
        aliases: ["GeForce GT 740M","NVIDIA GeForce GT 740M","GeForce GT 740M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GT 740M Direct3D11 vs_5_0 ps_5_0, D3D11)","GK208"],
        specs: {
          fp32Tflops: 0.753, fp16Tflops: 0.753, int8Tops: null,
          bandwidthGBs: 14.4, pixelRateGps: 7.8, texelRateGts: 31.4,
          triangleRateGts: null, vramGB: 2, memType: 'DDR3', busWidth: 64,
          shaderUnits: 384, baseClockMhz: 980, boostClockMhz: 980
        },
        note: "GK208；384 CUDA，8 光栅 / 32 纹理；64-bit DDR3 1.8 Gbps。另有 GK107 128-bit 版本（28.8/80 GB/s）。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-745m',
        vendor: 'NVIDIA', name: 'GeForce GT 745M', family: 'GeForce 700M',
        type: 'laptop', year: 2013, api: 'd3d11',
        aliases: ["GeForce GT 745M","NVIDIA GeForce GT 745M","GeForce GT 745M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GT 745M Direct3D11 vs_5_0 ps_5_0, D3D11)","GK107"],
        specs: {
          fp32Tflops: 0.643, fp16Tflops: 0.643, int8Tops: null,
          bandwidthGBs: 80, pixelRateGps: 13.4, texelRateGts: 26.8,
          triangleRateGts: null, vramGB: 2, memType: 'GDDR5', busWidth: 128,
          shaderUnits: 384, baseClockMhz: 837, boostClockMhz: 837
        },
        note: "GK107；384 CUDA，16 光栅 / 32 纹理；128-bit GDDR5 5.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-750m',
        vendor: 'NVIDIA', name: 'GeForce GT 750M', family: 'GeForce 700M',
        type: 'laptop', year: 2013, api: 'd3d11',
        aliases: ["GeForce GT 750M","NVIDIA GeForce GT 750M","GeForce GT 750M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GT 750M Direct3D11 vs_5_0 ps_5_0, D3D11)","GK107"],
        specs: {
          fp32Tflops: 0.743, fp16Tflops: 0.743, int8Tops: null,
          bandwidthGBs: 80, pixelRateGps: 15.5, texelRateGts: 30.9,
          triangleRateGts: null, vramGB: 2, memType: 'GDDR5', busWidth: 128,
          shaderUnits: 384, baseClockMhz: 967, boostClockMhz: 967
        },
        note: "GK107；384 CUDA，16 光栅 / 32 纹理；128-bit GDDR5 5.0 Gbps。另有 DDR3 版（32 GB/s）。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-760m',
        vendor: 'NVIDIA', name: 'GeForce GTX 760M', family: 'GeForce 700M',
        type: 'laptop', year: 2013, api: 'd3d11',
        aliases: ["GeForce GTX 760M","NVIDIA GeForce GTX 760M","GeForce GTX 760M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 760M Direct3D11 vs_5_0 ps_5_0, D3D11)","GK106"],
        specs: {
          fp32Tflops: 1.104, fp16Tflops: 1.104, int8Tops: null,
          bandwidthGBs: 64, pixelRateGps: 11.5, texelRateGts: 46,
          triangleRateGts: null, vramGB: 2, memType: 'GDDR5', busWidth: 128,
          shaderUnits: 768, baseClockMhz: 719, boostClockMhz: 719
        },
        note: "GK106；768 CUDA，16 光栅 / 64 纹理；128-bit GDDR5 4.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-765m',
        vendor: 'NVIDIA', name: 'GeForce GTX 765M', family: 'GeForce 700M',
        type: 'laptop', year: 2013, api: 'd3d11',
        aliases: ["GeForce GTX 765M","NVIDIA GeForce GTX 765M","GeForce GTX 765M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 765M Direct3D11 vs_5_0 ps_5_0, D3D11)","GK106"],
        specs: {
          fp32Tflops: 1.326, fp16Tflops: 1.326, int8Tops: null,
          bandwidthGBs: 64, pixelRateGps: 13.8, texelRateGts: 55.2,
          triangleRateGts: null, vramGB: 2, memType: 'GDDR5', busWidth: 128,
          shaderUnits: 768, baseClockMhz: 863, boostClockMhz: 863
        },
        note: "GK106；768 CUDA，16 光栅 / 64 纹理；128-bit GDDR5 4.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-770m',
        vendor: 'NVIDIA', name: 'GeForce GTX 770M', family: 'GeForce 700M',
        type: 'laptop', year: 2013, api: 'd3d11',
        aliases: ["GeForce GTX 770M","NVIDIA GeForce GTX 770M","GeForce GTX 770M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 770M Direct3D11 vs_5_0 ps_5_0, D3D11)","GK106"],
        specs: {
          fp32Tflops: 1.53, fp16Tflops: 1.53, int8Tops: null,
          bandwidthGBs: 96, pixelRateGps: 19.1, texelRateGts: 63.8,
          triangleRateGts: null, vramGB: 3, memType: 'GDDR5', busWidth: 192,
          shaderUnits: 960, baseClockMhz: 797, boostClockMhz: 797
        },
        note: "GK106；960 CUDA，24 光栅 / 80 纹理；192-bit GDDR5 4.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-780m',
        vendor: 'NVIDIA', name: 'GeForce GTX 780M', family: 'GeForce 700M',
        type: 'laptop', year: 2013, api: 'd3d11',
        aliases: ["GeForce GTX 780M","NVIDIA GeForce GTX 780M","GeForce GTX 780M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 780M Direct3D11 vs_5_0 ps_5_0, D3D11)","GK104"],
        specs: {
          fp32Tflops: 2.448, fp16Tflops: 2.448, int8Tops: null,
          bandwidthGBs: 160, pixelRateGps: 25.5, texelRateGts: 102,
          triangleRateGts: null, vramGB: 4, memType: 'GDDR5', busWidth: 256,
          shaderUnits: 1536, baseClockMhz: 797, boostClockMhz: 797
        },
        note: "GK104；1536 CUDA，32 光栅 / 128 纹理；256-bit GDDR5 5.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-860m-kepler',
        vendor: 'NVIDIA', name: 'GeForce GTX 860M (Kepler)', family: 'GeForce 800M',
        type: 'laptop', year: 2014, api: 'd3d11',
        aliases: ["GeForce GTX 860M (Kepler)","NVIDIA GeForce GTX 860M (Kepler)","GeForce GTX 860M (Kepler) Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 860M (Kepler) Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 2.108, fp16Tflops: 2.108, int8Tops: null,
          bandwidthGBs: 80, pixelRateGps: 29.3, texelRateGts: 87.8,
          triangleRateGts: null, vramGB: 4, memType: 'GDDR5', busWidth: 128,
          shaderUnits: 1152, baseClockMhz: 797, boostClockMhz: 915
        },
        note: "GK104 Kepler 版（与 Maxwell 版同名的两个 SKU 之一）；1152 CUDA（797 / 915 MHz），32 光栅 / 96 纹理；128-bit GDDR5 5.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-870m',
        vendor: 'NVIDIA', name: 'GeForce GTX 870M', family: 'GeForce 800M',
        type: 'laptop', year: 2014, api: 'd3d11',
        aliases: ["GeForce GTX 870M","NVIDIA GeForce GTX 870M","GeForce GTX 870M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 870M Direct3D11 vs_5_0 ps_5_0, D3D11)","GK104"],
        specs: {
          fp32Tflops: 2.599, fp16Tflops: 2.599, int8Tops: null,
          bandwidthGBs: 120, pixelRateGps: 23.2, texelRateGts: 108.3,
          triangleRateGts: null, vramGB: 3, memType: 'GDDR5', busWidth: 192,
          shaderUnits: 1344, baseClockMhz: 941, boostClockMhz: 967
        },
        note: "GK104；1344 CUDA（941 / 967 MHz），24 光栅 / 112 纹理；192-bit GDDR5 5.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-880m',
        vendor: 'NVIDIA', name: 'GeForce GTX 880M', family: 'GeForce 800M',
        type: 'laptop', year: 2014, api: 'd3d11',
        aliases: ["GeForce GTX 880M","NVIDIA GeForce GTX 880M","GeForce GTX 880M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 880M Direct3D11 vs_5_0 ps_5_0, D3D11)","GK104"],
        specs: {
          fp32Tflops: 3.05, fp16Tflops: 3.05, int8Tops: null,
          bandwidthGBs: 160, pixelRateGps: 31.8, texelRateGts: 127.1,
          triangleRateGts: null, vramGB: 4, memType: 'GDDR5', busWidth: 256,
          shaderUnits: 1536, baseClockMhz: 954, boostClockMhz: 993
        },
        note: "GK104；1536 CUDA（954 / 993 MHz），32 光栅 / 128 纹理；256-bit GDDR5 5.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-820m',
        vendor: 'NVIDIA', name: 'GeForce 820M', family: 'GeForce 800M',
        type: 'laptop', year: 2014, api: 'd3d11',
        aliases: ["GeForce 820M","NVIDIA GeForce 820M","GeForce 820M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce 820M Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 0.366, fp16Tflops: 0.366, int8Tops: null,
          bandwidthGBs: 16, pixelRateGps: 3.8, texelRateGts: 15.3,
          triangleRateGts: null, vramGB: 2, memType: 'DDR3', busWidth: 64,
          shaderUnits: 96, baseClockMhz: 954, boostClockMhz: 1908
        },
        note: "GF117（Fermi 再版）；96 CUDA（954 / 1908 MHz），4 光栅 / 16 纹理；64-bit DDR3 2.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-840m',
        vendor: 'NVIDIA', name: 'GeForce 840M', family: 'GeForce 800M',
        type: 'laptop', year: 2014, api: 'd3d11',
        aliases: ["GeForce 840M","NVIDIA GeForce 840M","GeForce 840M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce 840M Direct3D11 vs_5_0 ps_5_0, D3D11)","GM108"],
        specs: {
          fp32Tflops: 0.867, fp16Tflops: 0.867, int8Tops: null,
          bandwidthGBs: 16, pixelRateGps: 9, texelRateGts: 27.1,
          triangleRateGts: null, vramGB: 2, memType: 'DDR3', busWidth: 64,
          shaderUnits: 384, baseClockMhz: 1029, boostClockMhz: 1129
        },
        note: "GM108；384 CUDA（1029 / 1129 MHz），8 光栅 / 24 纹理；64-bit DDR3 2.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-850m',
        vendor: 'NVIDIA', name: 'GeForce GTX 850M', family: 'GeForce 800M',
        type: 'laptop', year: 2014, api: 'd3d11',
        aliases: ["GeForce GTX 850M","NVIDIA GeForce GTX 850M","GeForce GTX 850M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 850M Direct3D11 vs_5_0 ps_5_0, D3D11)","GM107"],
        specs: {
          fp32Tflops: 1.121, fp16Tflops: 1.121, int8Tops: null,
          bandwidthGBs: 80.2, pixelRateGps: 14, texelRateGts: 35,
          triangleRateGts: null, vramGB: 2, memType: 'GDDR5', busWidth: 128,
          shaderUnits: 640, baseClockMhz: 876, boostClockMhz: 876
        },
        note: "GM107；640 CUDA，16 光栅 / 40 纹理；128-bit GDDR5 5.0 Gbps。另有 DDR3 版（32 GB/s）。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-860m-maxwell',
        vendor: 'NVIDIA', name: 'GeForce GTX 860M (Maxwell)', family: 'GeForce 800M',
        type: 'laptop', year: 2014, api: 'd3d11',
        aliases: ["GeForce GTX 860M (Maxwell)","NVIDIA GeForce GTX 860M (Maxwell)","GeForce GTX 860M (Maxwell) Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 860M (Maxwell) Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 1.389, fp16Tflops: 1.389, int8Tops: null,
          bandwidthGBs: 80, pixelRateGps: 17.4, texelRateGts: 43.4,
          triangleRateGts: null, vramGB: 2, memType: 'GDDR5', busWidth: 128,
          shaderUnits: 640, baseClockMhz: 1029, boostClockMhz: 1085
        },
        note: "GM107 Maxwell 版（与 Kepler 版同名的两个 SKU 之一）；640 CUDA（1029 / 1085 MHz），16 光栅 / 40 纹理；128-bit GDDR5 5.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-930m',
        vendor: 'NVIDIA', name: 'GeForce 930M', family: 'GeForce 900M',
        type: 'laptop', year: 2015, api: 'd3d11',
        aliases: ["GeForce 930M","NVIDIA GeForce 930M","GeForce 930M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce 930M Direct3D11 vs_5_0 ps_5_0, D3D11)","GM108"],
        specs: {
          fp32Tflops: 0.723, fp16Tflops: 0.723, int8Tops: null,
          bandwidthGBs: 14.4, pixelRateGps: 7.5, texelRateGts: 22.6,
          triangleRateGts: null, vramGB: 2, memType: 'DDR3', busWidth: 64,
          shaderUnits: 384, baseClockMhz: 928, boostClockMhz: 941
        },
        note: "GM108；384 CUDA（928 / 941 MHz），8 光栅 / 24 纹理；64-bit DDR3 1.8 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-940m',
        vendor: 'NVIDIA', name: 'GeForce 940M', family: 'GeForce 900M',
        type: 'laptop', year: 2015, api: 'd3d11',
        aliases: ["GeForce 940M","NVIDIA GeForce 940M","GeForce 940M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce 940M Direct3D11 vs_5_0 ps_5_0, D3D11)","GM108"],
        specs: {
          fp32Tflops: 0.903, fp16Tflops: 0.903, int8Tops: null,
          bandwidthGBs: 16, pixelRateGps: 9.4, texelRateGts: 28.2,
          triangleRateGts: null, vramGB: 2, memType: 'DDR3', busWidth: 64,
          shaderUnits: 384, baseClockMhz: 1072, boostClockMhz: 1176
        },
        note: "GM108；384 CUDA（1072 / 1176 MHz），8 光栅 / 24 纹理；64-bit DDR3 2.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-950m',
        vendor: 'NVIDIA', name: 'GeForce GTX 950M', family: 'GeForce 900M',
        type: 'laptop', year: 2015, api: 'd3d11',
        aliases: ["GeForce GTX 950M","NVIDIA GeForce GTX 950M","GeForce GTX 950M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 950M Direct3D11 vs_5_0 ps_5_0, D3D11)","GM107"],
        specs: {
          fp32Tflops: 1.17, fp16Tflops: 1.17, int8Tops: null,
          bandwidthGBs: 80, pixelRateGps: 14.6, texelRateGts: 36.6,
          triangleRateGts: null, vramGB: 2, memType: 'GDDR5', busWidth: 128,
          shaderUnits: 640, baseClockMhz: 914, boostClockMhz: 914
        },
        note: "GM107；640 CUDA，16 光栅 / 40 纹理；128-bit GDDR5 5.0 Gbps。另有 DDR3 版（32 GB/s）。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-960m',
        vendor: 'NVIDIA', name: 'GeForce GTX 960M', family: 'GeForce 900M',
        type: 'laptop', year: 2015, api: 'd3d11',
        aliases: ["GeForce GTX 960M","NVIDIA GeForce GTX 960M","GeForce GTX 960M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 960M Direct3D11 vs_5_0 ps_5_0, D3D11)","GM107"],
        specs: {
          fp32Tflops: 1.505, fp16Tflops: 1.505, int8Tops: null,
          bandwidthGBs: 80, pixelRateGps: 18.8, texelRateGts: 47,
          triangleRateGts: null, vramGB: 2, memType: 'GDDR5', busWidth: 128,
          shaderUnits: 640, baseClockMhz: 1097, boostClockMhz: 1176
        },
        note: "GM107；640 CUDA（1097 / 1176 MHz），16 光栅 / 40 纹理；128-bit GDDR5 5.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-965m',
        vendor: 'NVIDIA', name: 'GeForce GTX 965M', family: 'GeForce 900M',
        type: 'laptop', year: 2015, api: 'd3d11',
        aliases: ["GeForce GTX 965M","NVIDIA GeForce GTX 965M","GeForce GTX 965M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 965M Direct3D11 vs_5_0 ps_5_0, D3D11)","GM204"],
        specs: {
          fp32Tflops: 1.933, fp16Tflops: 1.933, int8Tops: null,
          bandwidthGBs: 80, pixelRateGps: 30.2, texelRateGts: 60.4,
          triangleRateGts: null, vramGB: 2, memType: 'GDDR5', busWidth: 128,
          shaderUnits: 1024, baseClockMhz: 944, boostClockMhz: 944
        },
        note: "GM204；1024 CUDA，32 光栅 / 64 纹理；128-bit GDDR5 5.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-970m',
        vendor: 'NVIDIA', name: 'GeForce GTX 970M', family: 'GeForce 900M',
        type: 'laptop', year: 2014, api: 'd3d11',
        aliases: ["GeForce GTX 970M","NVIDIA GeForce GTX 970M","GeForce GTX 970M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 970M Direct3D11 vs_5_0 ps_5_0, D3D11)","GM204"],
        specs: {
          fp32Tflops: 2.542, fp16Tflops: 2.542, int8Tops: null,
          bandwidthGBs: 120, pixelRateGps: 47.7, texelRateGts: 79.4,
          triangleRateGts: null, vramGB: 3, memType: 'GDDR5', busWidth: 192,
          shaderUnits: 1280, baseClockMhz: 944, boostClockMhz: 993
        },
        note: "GM204；1280 CUDA（944 / 993 MHz），48 光栅 / 80 纹理；192-bit GDDR5 5.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gtx-980m',
        vendor: 'NVIDIA', name: 'GeForce GTX 980M', family: 'GeForce 900M',
        type: 'laptop', year: 2014, api: 'd3d11',
        aliases: ["GeForce GTX 980M","NVIDIA GeForce GTX 980M","GeForce GTX 980M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 980M Direct3D11 vs_5_0 ps_5_0, D3D11)","GM204"],
        specs: {
          fp32Tflops: 3.462, fp16Tflops: 3.462, int8Tops: null,
          bandwidthGBs: 160, pixelRateGps: 72.1, texelRateGts: 108.2,
          triangleRateGts: null, vramGB: 4, memType: 'GDDR5', busWidth: 256,
          shaderUnits: 1536, baseClockMhz: 1038, boostClockMhz: 1127
        },
        note: "GM204；1536 CUDA（1038 / 1127 MHz），64 光栅 / 96 纹理；256-bit GDDR5 5.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      /* --- NVIDIA 笔记本：600M / 700M 补齐（Fermi 再版与 GK208） --- */

      {
        id: 'nvidia-gt-610m',
        vendor: 'NVIDIA', name: 'GeForce 610M', family: 'GeForce 600M',
        type: 'laptop', year: 2011, api: 'd3d11',
        aliases: ["GeForce 610M","NVIDIA GeForce 610M","GeForce 610M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce 610M Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 0.173, fp16Tflops: 0.173, int8Tops: null,
          bandwidthGBs: 14.4, pixelRateGps: 3.6, texelRateGts: 7.2,
          triangleRateGts: null, vramGB: 1, memType: 'DDR3', busWidth: 64,
          shaderUnits: 48, baseClockMhz: 900, boostClockMhz: 1800
        },
        note: "GF119M（Fermi）；48 CUDA（900 / 1800 MHz），4 光栅 / 8 纹理；64-bit DDR3 1.8 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-635m',
        vendor: 'NVIDIA', name: 'GeForce GT 635M', family: 'GeForce 600M',
        type: 'laptop', year: 2012, api: 'd3d11',
        aliases: ["GeForce GT 635M","NVIDIA GeForce GT 635M","GeForce GT 635M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GT 635M Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 0.389, fp16Tflops: 0.389, int8Tops: null,
          bandwidthGBs: 43.2, pixelRateGps: 10.8, texelRateGts: 16.2,
          triangleRateGts: null, vramGB: 1.5, memType: 'DDR3', busWidth: 192,
          shaderUnits: 144, baseClockMhz: 675, boostClockMhz: 1350
        },
        note: "GF116M（Fermi）；144 CUDA（675 / 1350 MHz），16 光栅 / 24 纹理；192-bit DDR3 1.8 Gbps。另有 96 CUDA / 128-bit 版本。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-710m',
        vendor: 'NVIDIA', name: 'GeForce 710M', family: 'GeForce 700M',
        type: 'laptop', year: 2013, api: 'd3d11',
        aliases: ["GeForce 710M","NVIDIA GeForce 710M","GeForce 710M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce 710M Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 0.307, fp16Tflops: 0.307, int8Tops: null,
          bandwidthGBs: 14.4, pixelRateGps: 3.2, texelRateGts: 12.8,
          triangleRateGts: null, vramGB: 2, memType: 'DDR3', busWidth: 64,
          shaderUnits: 96, baseClockMhz: 800, boostClockMhz: 1600
        },
        note: "GF117M（Fermi）；96 CUDA（800 / 1600 MHz），4 光栅 / 16 纹理；64-bit DDR3 1.8 Gbps。另有 719 MHz 的 GK208 版本。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      {
        id: 'nvidia-gt-730m',
        vendor: 'NVIDIA', name: 'GeForce GT 730M', family: 'GeForce 700M',
        type: 'laptop', year: 2013, api: 'd3d11',
        aliases: ["GeForce GT 730M","NVIDIA GeForce GT 730M","GeForce GT 730M Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GT 730M Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 0.552, fp16Tflops: 0.552, int8Tops: null,
          bandwidthGBs: 32, pixelRateGps: 5.8, texelRateGts: 23,
          triangleRateGts: null, vramGB: 2, memType: 'DDR3', busWidth: 128,
          shaderUnits: 384, baseClockMhz: 719, boostClockMhz: 719
        },
        note: "GK208；384 CUDA，8 光栅 / 32 纹理；128-bit DDR3 2.0 Gbps（按 2000 MT/s 折算 32 GB/s；Wikipedia 列表页带宽栏写作 16 GB/s，与其自身列出的显存速率不一致）。 来源：https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units"
      },

      /* --- Intel Arc 移动独显 / Xe2 核显 + 骁龙 X Adreno（规格待补者以 null 记录） --- */

      {
        id: 'intel-arc-a350m',
        vendor: 'Intel', name: 'Intel Arc A350M', family: 'Intel Arc A (Alchemist)',
        type: 'laptop', year: 2022, api: 'd3d12',
        aliases: ["Intel Arc A350M","Intel Intel Arc A350M","Intel Arc A350M Direct3D11 vs_5_0 ps_5_0","ANGLE (Intel, Intel Arc A350M Direct3D11 vs_5_0 ps_5_0, D3D11)","ACM-G11","Alchemist"],
        specs: {
          fp32Tflops: null, fp16Tflops: null, int8Tops: null,
          bandwidthGBs: null, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: 4, memType: "GDDR6", busWidth: 64,
          shaderUnits: 768, baseClockMhz: null, boostClockMhz: null
        },
        note: "Alchemist ACM-G11：6 Xe 核心 = 768 ALU。显存类型/位宽为公开资料，容量 4GB；GPU 频率与带宽「规格待补」。核显/独显的填充率 Intel 无统一公开口径 → null。 来源：https://ark.intel.com/"
      },

      {
        id: 'intel-arc-a370m',
        vendor: 'Intel', name: 'Intel Arc A370M', family: 'Intel Arc A (Alchemist)',
        type: 'laptop', year: 2022, api: 'd3d12',
        aliases: ["Intel Arc A370M","Intel Intel Arc A370M","Intel Arc A370M Direct3D11 vs_5_0 ps_5_0","ANGLE (Intel, Intel Arc A370M Direct3D11 vs_5_0 ps_5_0, D3D11)","ACM-G11","Alchemist"],
        specs: {
          fp32Tflops: null, fp16Tflops: null, int8Tops: null,
          bandwidthGBs: null, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: 4, memType: "GDDR6", busWidth: 64,
          shaderUnits: 1024, baseClockMhz: null, boostClockMhz: null
        },
        note: "Alchemist ACM-G11：8 Xe 核心 = 1024 ALU。容量 4GB；GPU 频率与带宽「规格待补」。 来源：https://ark.intel.com/"
      },

      {
        id: 'intel-arc-a550m',
        vendor: 'Intel', name: 'Intel Arc A550M', family: 'Intel Arc A (Alchemist)',
        type: 'laptop', year: 2022, api: 'd3d12',
        aliases: ["Intel Arc A550M","Intel Intel Arc A550M","Intel Arc A550M Direct3D11 vs_5_0 ps_5_0","ANGLE (Intel, Intel Arc A550M Direct3D11 vs_5_0 ps_5_0, D3D11)","ACM-G10","Alchemist"],
        specs: {
          fp32Tflops: null, fp16Tflops: null, int8Tops: null,
          bandwidthGBs: null, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: 8, memType: "GDDR6", busWidth: 128,
          shaderUnits: 2048, baseClockMhz: null, boostClockMhz: null
        },
        note: "Alchemist ACM-G10：16 Xe 核心 = 2048 ALU。容量 8GB；GPU 频率与带宽「规格待补」。 来源：https://ark.intel.com/"
      },

      {
        id: 'intel-arc-a730m',
        vendor: 'Intel', name: 'Intel Arc A730M', family: 'Intel Arc A (Alchemist)',
        type: 'laptop', year: 2022, api: 'd3d12',
        aliases: ["Intel Arc A730M","Intel Intel Arc A730M","Intel Arc A730M Direct3D11 vs_5_0 ps_5_0","ANGLE (Intel, Intel Arc A730M Direct3D11 vs_5_0 ps_5_0, D3D11)","ACM-G10","Alchemist"],
        specs: {
          fp32Tflops: null, fp16Tflops: null, int8Tops: null,
          bandwidthGBs: null, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: 12, memType: "GDDR6", busWidth: 192,
          shaderUnits: 3072, baseClockMhz: null, boostClockMhz: null
        },
        note: "Alchemist ACM-G10：24 Xe 核心 = 3072 ALU。容量 12GB；GPU 频率与带宽「规格待补」。 来源：https://ark.intel.com/"
      },

      {
        id: 'intel-arc-a770m',
        vendor: 'Intel', name: 'Intel Arc A770M', family: 'Intel Arc A (Alchemist)',
        type: 'laptop', year: 2022, api: 'd3d12',
        aliases: ["Intel Arc A770M","Intel Intel Arc A770M","Intel Arc A770M Direct3D11 vs_5_0 ps_5_0","ANGLE (Intel, Intel Arc A770M Direct3D11 vs_5_0 ps_5_0, D3D11)","ACM-G10","Alchemist"],
        specs: {
          fp32Tflops: null, fp16Tflops: null, int8Tops: null,
          bandwidthGBs: null, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: 16, memType: "GDDR6", busWidth: 256,
          shaderUnits: 4096, baseClockMhz: null, boostClockMhz: null
        },
        note: "Alchemist ACM-G10 移动旗舰：32 Xe 核心 = 4096 ALU。容量 16GB；GPU 频率与带宽「规格待补」。 来源：https://ark.intel.com/"
      },

      {
        id: 'intel-arc-130v',
        vendor: 'Intel', name: 'Intel Arc Graphics 130V', family: 'Intel Xe2 (Lunar Lake)',
        type: 'integrated', year: 2024, api: 'd3d12',
        aliases: ["Intel Arc Graphics 130V","Intel Intel Arc Graphics 130V","Intel Arc Graphics 130V Direct3D11 vs_5_0 ps_5_0","ANGLE (Intel, Intel Arc Graphics 130V Direct3D11 vs_5_0 ps_5_0, D3D11)","Arc 130V","Xe2-LPG","Lunar Lake"],
        specs: {
          fp32Tflops: null, fp16Tflops: null, int8Tops: null,
          bandwidthGBs: null, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: "LPDDR5X", busWidth: 128,
          shaderUnits: 896, baseClockMhz: null, boostClockMhz: null
        },
        note: "Lunar Lake 核显，Xe2 精简版：7 Xe2 核心 = 896 ALU；统一内存 LPDDR5X 128-bit。「规格待补」。 来源：https://ark.intel.com/"
      },
      {
        id: 'qualcomm-adreno-x1-85',
        vendor: 'Qualcomm', name: 'Qualcomm Adreno X1-85', family: 'Adreno X1',
        type: 'laptop', year: 2024, api: 'd3d12',
        aliases: ["Qualcomm Adreno X1-85","Qualcomm Qualcomm Adreno X1-85","Qualcomm Adreno X1-85 Direct3D11 vs_5_0 ps_5_0","ANGLE (Qualcomm, Qualcomm Adreno X1-85 Direct3D11 vs_5_0 ps_5_0, D3D11)","Adreno X1","Adreno X1-85","Snapdragon X Elite","Snapdragon X"],
        specs: {
          fp32Tflops: null, fp16Tflops: null, int8Tops: null,
          bandwidthGBs: null, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: "LPDDR5X", busWidth: 128,
          shaderUnits: null, baseClockMhz: null, boostClockMhz: null
        },
        note: "骁龙 X Elite / X Plus 笔记本 GPU（Adreno X1-85）。Qualcomm 未公布 ALU 数与频率的完整口径 → shaderUnits / 频率 / FP32 均为 null，带宽随整机内存配置变化，「规格待补」。 来源：https://en.wikipedia.org/wiki/Snapdragon_X"
      },

      /* --- NVIDIA 10 系笔记本：标准版与 Max-Q（Max-Q 独立 id） --- */

      {
        id: 'nvidia-rtx-5050-laptop',
        vendor: 'NVIDIA', name: 'GeForce RTX 5050 Laptop GPU', family: 'GeForce RTX 50',
        type: 'laptop', year: 2025, api: 'd3d12',
        aliases: ["GeForce RTX 5050 Laptop GPU","NVIDIA GeForce RTX 5050 Laptop GPU","GeForce RTX 5050 Laptop GPU Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce RTX 5050 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)","RTX 5050 Laptop","GeForce RTX 5050 Laptop","GB207","NVIDIA GB207"],
        specs: {
          fp32Tflops: null, fp16Tflops: null, int8Tops: null,
          bandwidthGBs: null, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: 8, memType: "GDDR7", busWidth: 128,
          shaderUnits: 2560, baseClockMhz: null, boostClockMhz: null
        },
        note: "GB207 笔记本版：2560 CUDA，8GB GDDR7 128-bit。GPU 频率随 TGP 配置变化，带宽「规格待补」。 来源：https://en.wikipedia.org/wiki/GeForce_10_series"
      },

      {
        id: 'nvidia-gtx-1080-laptop',
        vendor: 'NVIDIA', name: 'GeForce GTX 1080 Laptop GPU', family: 'GeForce GTX 10',
        type: 'laptop', year: 2016, api: 'd3d12',
        aliases: ["GeForce GTX 1080 Laptop GPU","NVIDIA GeForce GTX 1080 Laptop GPU","GeForce GTX 1080 Laptop GPU Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 1080 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)","GTX 1080 Laptop","GeForce GTX 1080 Laptop","GP104","NVIDIA GP104"],
        specs: {
          fp32Tflops: 8.873, fp16Tflops: 8.873, int8Tops: null,
          bandwidthGBs: 320, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: 8, memType: "GDDR5X", busWidth: 256,
          shaderUnits: 2560, baseClockMhz: 1556, boostClockMhz: 1733
        },
        note: "GP104 满血笔记本版：2560 CUDA（1556 / 1733 MHz），8GB GDDR5X 256-bit 10 Gbps（320 GB/s）。 来源：https://en.wikipedia.org/wiki/GeForce_10_series"
      },

      {
        id: 'nvidia-gtx-1070-laptop',
        vendor: 'NVIDIA', name: 'GeForce GTX 1070 Laptop GPU', family: 'GeForce GTX 10',
        type: 'laptop', year: 2016, api: 'd3d12',
        aliases: ["GeForce GTX 1070 Laptop GPU","NVIDIA GeForce GTX 1070 Laptop GPU","GeForce GTX 1070 Laptop GPU Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 1070 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)","GTX 1070 Laptop","GeForce GTX 1070 Laptop","GP104","NVIDIA GP104"],
        specs: {
          fp32Tflops: 6.738, fp16Tflops: 6.738, int8Tops: null,
          bandwidthGBs: 256, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: 8, memType: "GDDR5", busWidth: 256,
          shaderUnits: 2048, baseClockMhz: 1442, boostClockMhz: 1645
        },
        note: "GP104 笔记本版：2048 CUDA（1442 / 1645 MHz），8GB GDDR5 256-bit 8 Gbps（256 GB/s）。 来源：https://en.wikipedia.org/wiki/GeForce_10_series"
      },

      {
        id: 'nvidia-gtx-1060-laptop',
        vendor: 'NVIDIA', name: 'GeForce GTX 1060 Laptop GPU', family: 'GeForce GTX 10',
        type: 'laptop', year: 2016, api: 'd3d12',
        aliases: ["GeForce GTX 1060 Laptop GPU","NVIDIA GeForce GTX 1060 Laptop GPU","GeForce GTX 1060 Laptop GPU Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 1060 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)","GTX 1060 Laptop","GeForce GTX 1060 Laptop","GP106","NVIDIA GP106"],
        specs: {
          fp32Tflops: 4.275, fp16Tflops: 4.275, int8Tops: null,
          bandwidthGBs: 192, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: 6, memType: "GDDR5", busWidth: 192,
          shaderUnits: 1280, baseClockMhz: 1404, boostClockMhz: 1670
        },
        note: "GP106 笔记本版：1280 CUDA（1404 / 1670 MHz），6GB GDDR5 192-bit 8 Gbps（192 GB/s）。 来源：https://en.wikipedia.org/wiki/GeForce_10_series"
      },

      {
        id: 'nvidia-gtx-1080-maxq',
        vendor: 'NVIDIA', name: 'GeForce GTX 1080 Max-Q', family: 'GeForce GTX 10',
        type: 'laptop', year: 2017, api: 'd3d12',
        aliases: ["GeForce GTX 1080 Max-Q","NVIDIA GeForce GTX 1080 Max-Q","GeForce GTX 1080 Max-Q Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 1080 Max-Q Direct3D11 vs_5_0 ps_5_0, D3D11)","GTX 1080 Max-Q","GeForce GTX 1080 Max-Q","GP104","Max-Q"],
        specs: {
          fp32Tflops: null, fp16Tflops: null, int8Tops: null,
          bandwidthGBs: 320, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: 8, memType: "GDDR5X", busWidth: 256,
          shaderUnits: 2560, baseClockMhz: null, boostClockMhz: null
        },
        note: "Max-Q 版：与标准版同为 2560 CUDA / 8GB GDDR5X 256-bit，但 NVIDIA 与 OEM 按整机散热动态设定频率（典型区间约 1101–1290 MHz，随厂商而异），故频率与 FP32「规格待补」，不做单一取值。 来源：https://en.wikipedia.org/wiki/GeForce_10_series"
      },

      {
        id: 'nvidia-gtx-1070-maxq',
        vendor: 'NVIDIA', name: 'GeForce GTX 1070 Max-Q', family: 'GeForce GTX 10',
        type: 'laptop', year: 2017, api: 'd3d12',
        aliases: ["GeForce GTX 1070 Max-Q","NVIDIA GeForce GTX 1070 Max-Q","GeForce GTX 1070 Max-Q Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 1070 Max-Q Direct3D11 vs_5_0 ps_5_0, D3D11)","GTX 1070 Max-Q","GeForce GTX 1070 Max-Q","GP104","Max-Q"],
        specs: {
          fp32Tflops: null, fp16Tflops: null, int8Tops: null,
          bandwidthGBs: 256, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: 8, memType: "GDDR5", busWidth: 256,
          shaderUnits: 2048, baseClockMhz: null, boostClockMhz: null
        },
        note: "Max-Q 版：2048 CUDA / 8GB GDDR5 256-bit；频率按整机散热在约 1101–1265 MHz 区间动态设定，随厂商而异 → 频率与 FP32「规格待补」。 来源：https://en.wikipedia.org/wiki/GeForce_10_series"
      },

      {
        id: 'nvidia-gtx-1060-maxq',
        vendor: 'NVIDIA', name: 'GeForce GTX 1060 Max-Q', family: 'GeForce GTX 10',
        type: 'laptop', year: 2017, api: 'd3d12',
        aliases: ["GeForce GTX 1060 Max-Q","NVIDIA GeForce GTX 1060 Max-Q","GeForce GTX 1060 Max-Q Direct3D11 vs_5_0 ps_5_0","ANGLE (NVIDIA, GeForce GTX 1060 Max-Q Direct3D11 vs_5_0 ps_5_0, D3D11)","GTX 1060 Max-Q","GeForce GTX 1060 Max-Q","GP106","Max-Q"],
        specs: {
          fp32Tflops: null, fp16Tflops: null, int8Tops: null,
          bandwidthGBs: 192, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: 6, memType: "GDDR5", busWidth: 192,
          shaderUnits: 1280, baseClockMhz: null, boostClockMhz: null
        },
        note: "Max-Q 版：1280 CUDA / 6GB GDDR5 192-bit；频率按整机散热在约 1063–1265 MHz 区间动态设定，随厂商而异 → 频率与 FP32「规格待补」。 来源：https://en.wikipedia.org/wiki/GeForce_10_series"
      },

      /* --- AMD Mobility Radeon HD 6000M / 7000M（规格待补者以 null 记录） --- */

      {
        id: 'amd-mobility-hd-6470m',
        vendor: 'AMD', name: 'Mobility Radeon HD 6470M', family: 'Mobility Radeon HD 6000',
        type: 'laptop', year: 2011, api: 'd3d11',
        aliases: ["Mobility Radeon HD 6470M","AMD Mobility Radeon HD 6470M","Mobility Radeon HD 6470M Direct3D11 vs_5_0 ps_5_0","ANGLE (AMD, Mobility Radeon HD 6470M Direct3D11 vs_5_0 ps_5_0, D3D11)","HD 6470M","Radeon HD 6470M","Seymour"],
        specs: {
          fp32Tflops: null, fp16Tflops: null, int8Tops: null,
          bandwidthGBs: null, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: "DDR3", busWidth: 64,
          shaderUnits: null, baseClockMhz: null, boostClockMhz: null
        },
        note: "Seymour（VLIW5）入门移动独显。Wikipedia 的 HD 6000M 规格表未收录该型号的完整数据 → 流处理器数 / 频率 / 带宽「规格待补」。 来源：https://en.wikipedia.org/wiki/Radeon_HD_6000_series"
      },

      {
        id: 'amd-mobility-hd-6570m',
        vendor: 'AMD', name: 'Mobility Radeon HD 6570M', family: 'Mobility Radeon HD 6000',
        type: 'laptop', year: 2011, api: 'd3d11',
        aliases: ["Mobility Radeon HD 6570M","AMD Mobility Radeon HD 6570M","Mobility Radeon HD 6570M Direct3D11 vs_5_0 ps_5_0","ANGLE (AMD, Mobility Radeon HD 6570M Direct3D11 vs_5_0 ps_5_0, D3D11)","HD 6570M","Radeon HD 6570M","Whistler"],
        specs: {
          fp32Tflops: null, fp16Tflops: null, int8Tops: null,
          bandwidthGBs: null, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: "GDDR3", busWidth: 128,
          shaderUnits: null, baseClockMhz: null, boostClockMhz: null
        },
        note: "Whistler（VLIW5）移动独显；规格「规格待补」。 来源：https://en.wikipedia.org/wiki/Radeon_HD_6000_series"
      },

      {
        id: 'amd-mobility-hd-6770m',
        vendor: 'AMD', name: 'Mobility Radeon HD 6770M', family: 'Mobility Radeon HD 6000',
        type: 'laptop', year: 2011, api: 'd3d11',
        aliases: ["Mobility Radeon HD 6770M","AMD Mobility Radeon HD 6770M","Mobility Radeon HD 6770M Direct3D11 vs_5_0 ps_5_0","ANGLE (AMD, Mobility Radeon HD 6770M Direct3D11 vs_5_0 ps_5_0, D3D11)","HD 6770M","Radeon HD 6770M","Whistler XT"],
        specs: {
          fp32Tflops: null, fp16Tflops: null, int8Tops: null,
          bandwidthGBs: null, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: "GDDR5", busWidth: 128,
          shaderUnits: null, baseClockMhz: null, boostClockMhz: null
        },
        note: "Whistler XT（VLIW5）移动独显；规格「规格待补」。 来源：https://en.wikipedia.org/wiki/Radeon_HD_6000_series"
      },

      {
        id: 'amd-mobility-hd-6970m',
        vendor: 'AMD', name: 'Mobility Radeon HD 6970M', family: 'Mobility Radeon HD 6000',
        type: 'laptop', year: 2011, api: 'd3d11',
        aliases: ["Mobility Radeon HD 6970M","AMD Mobility Radeon HD 6970M","Mobility Radeon HD 6970M Direct3D11 vs_5_0 ps_5_0","ANGLE (AMD, Mobility Radeon HD 6970M Direct3D11 vs_5_0 ps_5_0, D3D11)","HD 6970M","Radeon HD 6970M","Blackcomb"],
        specs: {
          fp32Tflops: null, fp16Tflops: null, int8Tops: null,
          bandwidthGBs: null, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: "GDDR5", busWidth: 256,
          shaderUnits: null, baseClockMhz: null, boostClockMhz: null
        },
        note: "Blackcomb（VLIW5，Cayman 衍生）移动旗舰；规格「规格待补」。 来源：https://en.wikipedia.org/wiki/Radeon_HD_6000_series"
      },

      {
        id: 'amd-mobility-hd-7670m',
        vendor: 'AMD', name: 'Mobility Radeon HD 7670M', family: 'Mobility Radeon HD 7000',
        type: 'laptop', year: 2012, api: 'd3d11',
        aliases: ["Mobility Radeon HD 7670M","AMD Mobility Radeon HD 7670M","Mobility Radeon HD 7670M Direct3D11 vs_5_0 ps_5_0","ANGLE (AMD, Mobility Radeon HD 7670M Direct3D11 vs_5_0 ps_5_0, D3D11)","HD 7670M","Radeon HD 7670M","Thames"],
        specs: {
          fp32Tflops: null, fp16Tflops: null, int8Tops: null,
          bandwidthGBs: null, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: "GDDR3", busWidth: 128,
          shaderUnits: null, baseClockMhz: null, boostClockMhz: null
        },
        note: "Thames（VLIW5）移动独显；规格「规格待补」。 来源：https://en.wikipedia.org/wiki/Radeon_HD_6000_series"
      },

      {
        id: 'amd-mobility-hd-7730m',
        vendor: 'AMD', name: 'Mobility Radeon HD 7730M', family: 'Mobility Radeon HD 7000',
        type: 'laptop', year: 2012, api: 'd3d11',
        aliases: ["Mobility Radeon HD 7730M","AMD Mobility Radeon HD 7730M","Mobility Radeon HD 7730M Direct3D11 vs_5_0 ps_5_0","ANGLE (AMD, Mobility Radeon HD 7730M Direct3D11 vs_5_0 ps_5_0, D3D11)","HD 7730M","Radeon HD 7730M","Chelsea"],
        specs: {
          fp32Tflops: null, fp16Tflops: null, int8Tops: null,
          bandwidthGBs: null, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: "GDDR3", busWidth: 128,
          shaderUnits: null, baseClockMhz: null, boostClockMhz: null
        },
        note: "Chelsea（GCN 1.0）移动独显；规格「规格待补」。 来源：https://en.wikipedia.org/wiki/Radeon_HD_6000_series"
      },

      {
        id: 'amd-mobility-hd-7970m',
        vendor: 'AMD', name: 'Mobility Radeon HD 7970M', family: 'Mobility Radeon HD 7000',
        type: 'laptop', year: 2012, api: 'd3d11',
        aliases: ["Mobility Radeon HD 7970M","AMD Mobility Radeon HD 7970M","Mobility Radeon HD 7970M Direct3D11 vs_5_0 ps_5_0","ANGLE (AMD, Mobility Radeon HD 7970M Direct3D11 vs_5_0 ps_5_0, D3D11)","HD 7970M","Radeon HD 7970M","Wimbledon","GCN"],
        specs: {
          fp32Tflops: 2.176, fp16Tflops: 2.176, int8Tops: null,
          bandwidthGBs: 153.6, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: 2, memType: "GDDR5", busWidth: 256,
          shaderUnits: 1280, baseClockMhz: 850, boostClockMhz: 850
        },
        note: "Wimbledon（GCN 1.0，Pitcairn 衍生）移动旗舰：1280 流处理器，2GB GDDR5 256-bit 4.8 Gbps（153.6 GB/s）。 来源：https://en.wikipedia.org/wiki/Radeon_HD_6000_series"
      },
      /* ==================================================================
       * 三、AMD 桌面独显（新 → 旧）
       * ================================================================== */

      {
        id: 'amd-rx-9070-xt',
        vendor: 'AMD', name: 'Radeon RX 9070 XT', family: 'Radeon RX 9000',
        type: 'desktop', year: 2025, api: 'd3d12',
        aliases: [
          'RX 9070 XT', 'Radeon RX 9070 XT', 'AMD Radeon RX 9070 XT',
          'AMD Radeon RX 9070 XT Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (AMD, AMD Radeon RX 9070 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'AMD Radeon RX 9070 XT Direct3D12 (FL 12_1)',
          'Navi 48', 'AMD Navi 48', 'gfx1201'
        ],
        specs: {
          fp32Tflops: 48.66, fp16Tflops: 48.66, int8Tops: null,
          bandwidthGBs: 644.6, pixelRateGps: 380.2, texelRateGts: 760.3,
          triangleRateGts: null, vramGB: 16, memType: 'GDDR6', busWidth: 256,
          shaderUnits: 4096, baseClockMhz: 1660, boostClockMhz: 2970
        },
        note: 'Navi 48（4096 SP / 64 CU / 64 ROP / 128 TMU），256-bit GDDR6 20 Gbps，304W 总板功耗；RDNA 4 双发射 FP32。'
      },

      {
        id: 'amd-rx-7900-xtx',
        vendor: 'AMD', name: 'Radeon RX 7900 XTX', family: 'Radeon RX 7000',
        type: 'desktop', year: 2022, api: 'd3d12',
        aliases: [
          'RX 7900 XTX', 'Radeon RX 7900 XTX', 'AMD Radeon RX 7900 XTX',
          'AMD Radeon RX 7900 XTX Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (AMD, AMD Radeon RX 7900 XTX Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'Navi 31', 'AMD Navi 31', 'gfx1100'
        ],
        specs: {
          fp32Tflops: 61.42, fp16Tflops: 61.42, int8Tops: null,
          bandwidthGBs: 960, pixelRateGps: 479.8, texelRateGts: 959.7,
          triangleRateGts: null, vramGB: 24, memType: 'GDDR6', busWidth: 384,
          shaderUnits: 6144, baseClockMhz: 1900, boostClockMhz: 2500
        },
        note: 'Navi 31 全规格（6144 SP / 96 CU / 192 ROP / 384 TMU），384-bit GDDR6 20 Gbps，355W；RDNA 3 双发射 FP32。'
      },

      {
        id: 'amd-rx-7900-xt',
        vendor: 'AMD', name: 'Radeon RX 7900 XT', family: 'Radeon RX 7000',
        type: 'desktop', year: 2022, api: 'd3d12',
        aliases: [
          'RX 7900 XT', 'Radeon RX 7900 XT', 'AMD Radeon RX 7900 XT',
          'AMD Radeon RX 7900 XT Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (AMD, AMD Radeon RX 7900 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'Navi 31', 'AMD Navi 31', 'gfx1100'
        ],
        specs: {
          fp32Tflops: 51.48, fp16Tflops: 51.48, int8Tops: null,
          bandwidthGBs: 800, pixelRateGps: 460.8, texelRateGts: 806.4,
          triangleRateGts: null, vramGB: 20, memType: 'GDDR6', busWidth: 320,
          shaderUnits: 5376, baseClockMhz: 2000, boostClockMhz: 2394
        },
        note: 'Navi 31 精简版（5376 SP / 84 CU / 192 ROP / 336 TMU），320-bit GDDR6 20 Gbps，315W。'
      },

      {
        id: 'amd-rx-7800-xt',
        vendor: 'AMD', name: 'Radeon RX 7800 XT', family: 'Radeon RX 7000',
        type: 'desktop', year: 2023, api: 'd3d12',
        aliases: [
          'RX 7800 XT', 'Radeon RX 7800 XT', 'AMD Radeon RX 7800 XT',
          'AMD Radeon RX 7800 XT Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (AMD, AMD Radeon RX 7800 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'Navi 32', 'AMD Navi 32', 'gfx1101'
        ],
        specs: {
          fp32Tflops: 37.32, fp16Tflops: 37.32, int8Tops: null,
          bandwidthGBs: 624.1, pixelRateGps: 233.3, texelRateGts: 583.2,
          triangleRateGts: null, vramGB: 16, memType: 'GDDR6', busWidth: 256,
          shaderUnits: 3840, baseClockMhz: 1800, boostClockMhz: 2430
        },
        note: 'Navi 32 全规格（3840 SP / 60 CU / 96 ROP / 240 TMU），256-bit GDDR6 19.5 Gbps，263W。'
      },

      {
        id: 'amd-rx-7700-xt',
        vendor: 'AMD', name: 'Radeon RX 7700 XT', family: 'Radeon RX 7000',
        type: 'desktop', year: 2023, api: 'd3d12',
        aliases: [
          'RX 7700 XT', 'Radeon RX 7700 XT', 'AMD Radeon RX 7700 XT',
          'AMD Radeon RX 7700 XT Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (AMD, AMD Radeon RX 7700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'Navi 32', 'AMD Navi 32', 'gfx1101'
        ],
        specs: {
          fp32Tflops: 35.17, fp16Tflops: 35.17, int8Tops: null,
          bandwidthGBs: 432, pixelRateGps: 244.2, texelRateGts: 550.8,
          triangleRateGts: null, vramGB: 12, memType: 'GDDR6', busWidth: 192,
          shaderUnits: 3456, baseClockMhz: 1700, boostClockMhz: 2544
        },
        note: 'Navi 32 精简版（3456 SP / 54 CU / 96 ROP / 216 TMU），192-bit GDDR6 18 Gbps，245W。'
      },

      {
        id: 'amd-rx-7600',
        vendor: 'AMD', name: 'Radeon RX 7600', family: 'Radeon RX 7000',
        type: 'desktop', year: 2023, api: 'd3d12',
        aliases: [
          'RX 7600', 'Radeon RX 7600', 'AMD Radeon RX 7600',
          'AMD Radeon RX 7600 Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (AMD, AMD Radeon RX 7600 Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'Navi 33', 'AMD Navi 33', 'gfx1102'
        ],
        specs: {
          fp32Tflops: 21.75, fp16Tflops: 21.75, int8Tops: null,
          bandwidthGBs: 288, pixelRateGps: 169.9, texelRateGts: 339.8,
          triangleRateGts: null, vramGB: 8, memType: 'GDDR6', busWidth: 128,
          shaderUnits: 2048, baseClockMhz: 1720, boostClockMhz: 2655
        },
        note: 'Navi 33（2048 SP / 32 CU / 64 ROP / 128 TMU），128-bit GDDR6 18 Gbps，165W。'
      },

      {
        id: 'amd-rx-6950-xt',
        vendor: 'AMD', name: 'Radeon RX 6950 XT', family: 'Radeon RX 6000',
        type: 'desktop', year: 2022, api: 'd3d12',
        aliases: [
          'RX 6950 XT', 'Radeon RX 6950 XT', 'AMD Radeon RX 6950 XT',
          'AMD Radeon RX 6950 XT Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (AMD, AMD Radeon RX 6950 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'Navi 21', 'AMD Navi 21', 'gfx1030'
        ],
        specs: {
          fp32Tflops: 23.65, fp16Tflops: 23.65, int8Tops: null,
          bandwidthGBs: 576, pixelRateGps: 295.7, texelRateGts: 739.3,
          triangleRateGts: null, vramGB: 16, memType: 'GDDR6', busWidth: 256,
          shaderUnits: 5120, baseClockMhz: 1890, boostClockMhz: 2310
        },
        note: 'Navi 21（5120 SP / 80 CU / 128 ROP / 320 TMU），256-bit GDDR6 18 Gbps，335W；RDNA 2 每 CU 每周期 128 FP32。'
      },

      {
        id: 'amd-rx-6800-xt',
        vendor: 'AMD', name: 'Radeon RX 6800 XT', family: 'Radeon RX 6000',
        type: 'desktop', year: 2020, api: 'd3d12',
        aliases: [
          'RX 6800 XT', 'Radeon RX 6800 XT', 'AMD Radeon RX 6800 XT',
          'AMD Radeon RX 6800 XT Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (AMD, AMD Radeon RX 6800 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'Navi 21', 'AMD Navi 21', 'gfx1030'
        ],
        specs: {
          fp32Tflops: 20.74, fp16Tflops: 20.74, int8Tops: null,
          bandwidthGBs: 512, pixelRateGps: 288, texelRateGts: 648,
          triangleRateGts: null, vramGB: 16, memType: 'GDDR6', busWidth: 256,
          shaderUnits: 4608, baseClockMhz: 1825, boostClockMhz: 2250
        },
        note: 'Navi 21 精简版（4608 SP / 72 CU / 128 ROP / 288 TMU），256-bit GDDR6 16 Gbps，300W。'
      },

      {
        id: 'amd-rx-6700-xt',
        vendor: 'AMD', name: 'Radeon RX 6700 XT', family: 'Radeon RX 6000',
        type: 'desktop', year: 2021, api: 'd3d12',
        aliases: [
          'RX 6700 XT', 'Radeon RX 6700 XT', 'AMD Radeon RX 6700 XT',
          'AMD Radeon RX 6700 XT Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (AMD, AMD Radeon RX 6700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'Navi 22', 'AMD Navi 22', 'gfx1031'
        ],
        specs: {
          fp32Tflops: 13.21, fp16Tflops: 13.21, int8Tops: null,
          bandwidthGBs: 384, pixelRateGps: 165.5, texelRateGts: 413.9,
          triangleRateGts: null, vramGB: 12, memType: 'GDDR6', busWidth: 192,
          shaderUnits: 2560, baseClockMhz: 2321, boostClockMhz: 2581
        },
        note: 'Navi 22（2560 SP / 40 CU / 64 ROP / 160 TMU），192-bit GDDR6 16 Gbps，230W。'
      },

      {
        id: 'amd-rx-6600-xt',
        vendor: 'AMD', name: 'Radeon RX 6600 XT', family: 'Radeon RX 6000',
        type: 'desktop', year: 2021, api: 'd3d12',
        aliases: [
          'RX 6600 XT', 'Radeon RX 6600 XT', 'AMD Radeon RX 6600 XT',
          'AMD Radeon RX 6600 XT Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (AMD, AMD Radeon RX 6600 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'Navi 23', 'AMD Navi 23', 'gfx1032'
        ],
        specs: {
          fp32Tflops: 10.60, fp16Tflops: 10.60, int8Tops: null,
          bandwidthGBs: 256, pixelRateGps: 159.4, texelRateGts: 318.7,
          triangleRateGts: null, vramGB: 8, memType: 'GDDR6', busWidth: 128,
          shaderUnits: 2048, baseClockMhz: 1968, boostClockMhz: 2589
        },
        note: 'Navi 23（2048 SP / 32 CU / 64 ROP / 128 TMU），128-bit GDDR6 16 Gbps，160W。'
      },

      {
        id: 'amd-rx-6600',
        vendor: 'AMD', name: 'Radeon RX 6600', family: 'Radeon RX 6000',
        type: 'desktop', year: 2021, api: 'd3d12',
        aliases: [
          'RX 6600', 'Radeon RX 6600', 'AMD Radeon RX 6600',
          'AMD Radeon RX 6600 Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (AMD, AMD Radeon RX 6600 Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'Navi 23', 'AMD Navi 23', 'gfx1032'
        ],
        specs: {
          fp32Tflops: 8.93, fp16Tflops: 8.93, int8Tops: null,
          bandwidthGBs: 224, pixelRateGps: 159.4, texelRateGts: 279.3,
          triangleRateGts: null, vramGB: 8, memType: 'GDDR6', busWidth: 128,
          shaderUnits: 1792, baseClockMhz: 1626, boostClockMhz: 2491
        },
        note: 'Navi 23 精简版（1792 SP / 28 CU / 64 ROP / 112 TMU），128-bit GDDR6 14 Gbps，132W。'
      },

      {
        id: 'amd-rx-6500-xt',
        vendor: 'AMD', name: 'Radeon RX 6500 XT', family: 'Radeon RX 6000',
        type: 'desktop', year: 2022, api: 'd3d12',
        aliases: [
          'RX 6500 XT', 'Radeon RX 6500 XT', 'AMD Radeon RX 6500 XT',
          'AMD Radeon RX 6500 XT Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (AMD, AMD Radeon RX 6500 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'Navi 24', 'AMD Navi 24', 'gfx1034'
        ],
        specs: {
          fp32Tflops: 5.77, fp16Tflops: 5.77, int8Tops: null,
          bandwidthGBs: 144, pixelRateGps: 90.2, texelRateGts: 180.3,
          triangleRateGts: null, vramGB: 4, memType: 'GDDR6', busWidth: 64,
          shaderUnits: 1024, baseClockMhz: 2310, boostClockMhz: 2815
        },
        note: 'Navi 24（1024 SP / 16 CU / 32 ROP / 64 TMU），64-bit GDDR6 18 Gbps，107W；PCIe 4.0 x4 接口。'
      },

      {
        id: 'amd-rx-580',
        vendor: 'AMD', name: 'Radeon RX 580', family: 'Radeon RX 500',
        type: 'desktop', year: 2017, api: 'd3d12',
        aliases: [
          'RX 580', 'Radeon RX 580', 'AMD Radeon RX 580',
          'AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (AMD, AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'Polaris 20', 'AMD Polaris 20', 'gfx803'
        ],
        specs: {
          fp32Tflops: 6.17, fp16Tflops: 6.17, int8Tops: null,
          bandwidthGBs: 256, pixelRateGps: 42.9, texelRateGts: 193,
          triangleRateGts: null, vramGB: 8, memType: 'GDDR5', busWidth: 256,
          shaderUnits: 2304, baseClockMhz: 1257, boostClockMhz: 1340
        },
        note: 'Polaris 20（2304 SP / 36 CU / 32 ROP / 144 TMU），256-bit GDDR5 8 Gbps，185W；GCN 4 每 CU 每周期 64 FP32。'
      },

      {
        id: 'amd-rx-570',
        vendor: 'AMD', name: 'Radeon RX 570', family: 'Radeon RX 500',
        type: 'desktop', year: 2017, api: 'd3d12',
        aliases: [
          'RX 570', 'Radeon RX 570', 'AMD Radeon RX 570',
          'AMD Radeon RX 570 Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (AMD, AMD Radeon RX 570 Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'Polaris 20', 'AMD Polaris 20', 'gfx803'
        ],
        specs: {
          fp32Tflops: 5.10, fp16Tflops: 5.10, int8Tops: null,
          bandwidthGBs: 224, pixelRateGps: 38.3, texelRateGts: 153.2,
          triangleRateGts: null, vramGB: 4, memType: 'GDDR5', busWidth: 256,
          shaderUnits: 2048, baseClockMhz: 1168, boostClockMhz: 1244
        },
        note: 'Polaris 20 精简版（2048 SP / 32 CU / 32 ROP / 128 TMU），256-bit GDDR5 7 Gbps，120W。'
      },


      /* ------------------------------------------------------------------
       * AMD 桌面老卡：Radeon HD 5000 / HD 6000（TeraScale）
       * 数据来源：https://en.wikipedia.org/wiki/List_of_AMD_graphics_processing_units
       * 说明：老 NVIDIA 卡（Tesla/Fermi）核心与着色器为双时钟域，boostClockMhz 记 NVIDIA
       *   公开的 Shader 时钟（= FP32 计算所用时钟），baseClockMhz 记核心/图形时钟；
       *   像素/纹理填充率按核心时钟计算，与 Wikipedia 列表页一致。
       * ------------------------------------------------------------------ */

      {
        id: 'amd-hd-5850',
        vendor: 'AMD', name: 'Radeon HD 5850', family: 'Radeon HD 5000',
        type: 'desktop', year: 2009, api: 'd3d11',
        aliases: ["Radeon HD 5850","AMD Radeon HD 5850","Radeon HD 5850 Direct3D11 vs_5_0 ps_5_0","ANGLE (AMD, Radeon HD 5850 Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 2.088, fp16Tflops: 2.088, int8Tops: null,
          bandwidthGBs: 128, pixelRateGps: 23.2, texelRateGts: 52.2,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR5', busWidth: 256,
          shaderUnits: 1440, baseClockMhz: 725, boostClockMhz: 725
        },
        note: "Cypress PRO（VLIW5，18 SIMD × 80 SP）；1440 流处理器，32 光栅 / 72 纹理；256-bit GDDR5 4.0 Gbps。仅 D3D11。 来源：https://en.wikipedia.org/wiki/List_of_AMD_graphics_processing_units"
      },

      {
        id: 'amd-hd-5830',
        vendor: 'AMD', name: 'Radeon HD 5830', family: 'Radeon HD 5000',
        type: 'desktop', year: 2010, api: 'd3d11',
        aliases: ["Radeon HD 5830","AMD Radeon HD 5830","Radeon HD 5830 Direct3D11 vs_5_0 ps_5_0","ANGLE (AMD, Radeon HD 5830 Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 1.792, fp16Tflops: 1.792, int8Tops: null,
          bandwidthGBs: 128, pixelRateGps: 12.8, texelRateGts: 44.8,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR5', busWidth: 256,
          shaderUnits: 1120, baseClockMhz: 800, boostClockMhz: 800
        },
        note: "Cypress LE（VLIW5，14 SIMD × 80 SP）；1120 流处理器，16 光栅 / 56 纹理；256-bit GDDR5 4.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_AMD_graphics_processing_units"
      },

      {
        id: 'amd-hd-5770',
        vendor: 'AMD', name: 'Radeon HD 5770', family: 'Radeon HD 5000',
        type: 'desktop', year: 2009, api: 'd3d11',
        aliases: ["Radeon HD 5770","AMD Radeon HD 5770","Radeon HD 5770 Direct3D11 vs_5_0 ps_5_0","ANGLE (AMD, Radeon HD 5770 Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 1.36, fp16Tflops: 1.36, int8Tops: null,
          bandwidthGBs: 76.8, pixelRateGps: 13.6, texelRateGts: 34,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR5', busWidth: 128,
          shaderUnits: 800, baseClockMhz: 850, boostClockMhz: 850
        },
        note: "Juniper XT（VLIW5）；800 流处理器，16 光栅 / 40 纹理；128-bit GDDR5 4.8 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_AMD_graphics_processing_units"
      },

      {
        id: 'amd-hd-5750',
        vendor: 'AMD', name: 'Radeon HD 5750', family: 'Radeon HD 5000',
        type: 'desktop', year: 2009, api: 'd3d11',
        aliases: ["Radeon HD 5750","AMD Radeon HD 5750","Radeon HD 5750 Direct3D11 vs_5_0 ps_5_0","ANGLE (AMD, Radeon HD 5750 Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 1.008, fp16Tflops: 1.008, int8Tops: null,
          bandwidthGBs: 73.6, pixelRateGps: 11.2, texelRateGts: 25.2,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR5', busWidth: 128,
          shaderUnits: 720, baseClockMhz: 700, boostClockMhz: 700
        },
        note: "Juniper PRO（VLIW5）；720 流处理器，16 光栅 / 36 纹理；128-bit GDDR5 4.6 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_AMD_graphics_processing_units"
      },

      {
        id: 'amd-hd-6950',
        vendor: 'AMD', name: 'Radeon HD 6950', family: 'Radeon HD 6000',
        type: 'desktop', year: 2010, api: 'd3d11',
        aliases: ["Radeon HD 6950","AMD Radeon HD 6950","Radeon HD 6950 Direct3D11 vs_5_0 ps_5_0","ANGLE (AMD, Radeon HD 6950 Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 2.253, fp16Tflops: 2.253, int8Tops: null,
          bandwidthGBs: 160, pixelRateGps: 25.6, texelRateGts: 70.4,
          triangleRateGts: null, vramGB: 2, memType: 'GDDR5', busWidth: 256,
          shaderUnits: 1408, baseClockMhz: 800, boostClockMhz: 800
        },
        note: "Cayman PRO（VLIW4）；1408 流处理器，32 光栅 / 88 纹理；256-bit GDDR5 5.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_AMD_graphics_processing_units"
      },

      {
        id: 'amd-hd-6870',
        vendor: 'AMD', name: 'Radeon HD 6870', family: 'Radeon HD 6000',
        type: 'desktop', year: 2010, api: 'd3d11',
        aliases: ["Radeon HD 6870","AMD Radeon HD 6870","Radeon HD 6870 Direct3D11 vs_5_0 ps_5_0","ANGLE (AMD, Radeon HD 6870 Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 2.016, fp16Tflops: 2.016, int8Tops: null,
          bandwidthGBs: 134.4, pixelRateGps: 28.8, texelRateGts: 50.4,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR5', busWidth: 256,
          shaderUnits: 1120, baseClockMhz: 900, boostClockMhz: 900
        },
        note: "Barts XT（VLIW5，14 SIMD × 80 SP）；1120 流处理器，32 光栅 / 56 纹理；256-bit GDDR5 4.2 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_AMD_graphics_processing_units"
      },

      {
        id: 'amd-hd-6850',
        vendor: 'AMD', name: 'Radeon HD 6850', family: 'Radeon HD 6000',
        type: 'desktop', year: 2010, api: 'd3d11',
        aliases: ["Radeon HD 6850","AMD Radeon HD 6850","Radeon HD 6850 Direct3D11 vs_5_0 ps_5_0","ANGLE (AMD, Radeon HD 6850 Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 1.488, fp16Tflops: 1.488, int8Tops: null,
          bandwidthGBs: 128, pixelRateGps: 24.8, texelRateGts: 37.2,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR5', busWidth: 256,
          shaderUnits: 960, baseClockMhz: 775, boostClockMhz: 775
        },
        note: "Barts PRO（VLIW5）；960 流处理器，32 光栅 / 48 纹理；256-bit GDDR5 4.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_AMD_graphics_processing_units"
      },

      {
        id: 'amd-hd-6790',
        vendor: 'AMD', name: 'Radeon HD 6790', family: 'Radeon HD 6000',
        type: 'desktop', year: 2011, api: 'd3d11',
        aliases: ["Radeon HD 6790","AMD Radeon HD 6790","Radeon HD 6790 Direct3D11 vs_5_0 ps_5_0","ANGLE (AMD, Radeon HD 6790 Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 1.344, fp16Tflops: 1.344, int8Tops: null,
          bandwidthGBs: 134.4, pixelRateGps: 13.4, texelRateGts: 33.6,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR5', busWidth: 256,
          shaderUnits: 800, baseClockMhz: 840, boostClockMhz: 840
        },
        note: "Barts LE（VLIW5）；800 流处理器，16 光栅 / 40 纹理；256-bit GDDR5 4.2 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_AMD_graphics_processing_units"
      },

      {
        id: 'amd-hd-6670',
        vendor: 'AMD', name: 'Radeon HD 6670', family: 'Radeon HD 6000',
        type: 'desktop', year: 2011, api: 'd3d11',
        aliases: ["Radeon HD 6670","AMD Radeon HD 6670","Radeon HD 6670 Direct3D11 vs_5_0 ps_5_0","ANGLE (AMD, Radeon HD 6670 Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 0.768, fp16Tflops: 0.768, int8Tops: null,
          bandwidthGBs: 64, pixelRateGps: 6.4, texelRateGts: 19.2,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR5', busWidth: 128,
          shaderUnits: 480, baseClockMhz: 800, boostClockMhz: 800
        },
        note: "Turks XT（VLIW5）；480 流处理器，8 光栅 / 24 纹理；128-bit GDDR5 4.0 Gbps。另有 DDR3 版（25.6 GB/s）。 来源：https://en.wikipedia.org/wiki/List_of_AMD_graphics_processing_units"
      },

      {
        id: 'amd-hd-6570',
        vendor: 'AMD', name: 'Radeon HD 6570', family: 'Radeon HD 6000',
        type: 'desktop', year: 2011, api: 'd3d11',
        aliases: ["Radeon HD 6570","AMD Radeon HD 6570","Radeon HD 6570 Direct3D11 vs_5_0 ps_5_0","ANGLE (AMD, Radeon HD 6570 Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 0.624, fp16Tflops: 0.624, int8Tops: null,
          bandwidthGBs: 64, pixelRateGps: 5.2, texelRateGts: 15.6,
          triangleRateGts: null, vramGB: 2, memType: 'GDDR5', busWidth: 128,
          shaderUnits: 480, baseClockMhz: 650, boostClockMhz: 650
        },
        note: "Turks PRO（VLIW5）；480 流处理器，8 光栅 / 24 纹理；128-bit GDDR5 4.0 Gbps。另有 DDR3 版（21.3 GB/s）。 来源：https://en.wikipedia.org/wiki/List_of_AMD_graphics_processing_units"
      },

      /* ------------------------------------------------------------------
       * AMD 笔记本老卡：Mobility Radeon HD 4000 / HD 5000
       * 数据来源：https://en.wikipedia.org/wiki/List_of_AMD_graphics_processing_units
       * 说明：老 NVIDIA 卡（Tesla/Fermi）核心与着色器为双时钟域，boostClockMhz 记 NVIDIA
       *   公开的 Shader 时钟（= FP32 计算所用时钟），baseClockMhz 记核心/图形时钟；
       *   像素/纹理填充率按核心时钟计算，与 Wikipedia 列表页一致。
       * ------------------------------------------------------------------ */

      {
        id: 'amd-mobility-hd-4330',
        vendor: 'AMD', name: 'Mobility Radeon HD 4330', family: 'Mobility Radeon HD 4000',
        type: 'laptop', year: 2009, api: 'd3d10',
        aliases: ["Mobility Radeon HD 4330","AMD Mobility Radeon HD 4330","Mobility Radeon HD 4330 Direct3D11 vs_5_0 ps_5_0","ANGLE (AMD, Mobility Radeon HD 4330 Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 0.072, fp16Tflops: 0.072, int8Tops: null,
          bandwidthGBs: 9.6, pixelRateGps: 1.8, texelRateGts: 3.6,
          triangleRateGts: null, vramGB: 0.5, memType: 'DDR3', busWidth: 64,
          shaderUnits: 80, baseClockMhz: 450, boostClockMhz: 450
        },
        note: "M92（VLIW5）；80 流处理器，4 光栅 / 8 纹理；64-bit DDR3 1.2 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_AMD_graphics_processing_units"
      },

      {
        id: 'amd-mobility-hd-4570',
        vendor: 'AMD', name: 'Mobility Radeon HD 4570', family: 'Mobility Radeon HD 4000',
        type: 'laptop', year: 2009, api: 'd3d10',
        aliases: ["Mobility Radeon HD 4570","AMD Mobility Radeon HD 4570","Mobility Radeon HD 4570 Direct3D11 vs_5_0 ps_5_0","ANGLE (AMD, Mobility Radeon HD 4570 Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 0.109, fp16Tflops: 0.109, int8Tops: null,
          bandwidthGBs: 12.8, pixelRateGps: 2.7, texelRateGts: 5.4,
          triangleRateGts: null, vramGB: 0.5, memType: 'DDR3', busWidth: 64,
          shaderUnits: 80, baseClockMhz: 680, boostClockMhz: 680
        },
        note: "M92（VLIW5）；80 流处理器，4 光栅 / 8 纹理；64-bit DDR3 1.6 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_AMD_graphics_processing_units"
      },

      {
        id: 'amd-mobility-hd-4670',
        vendor: 'AMD', name: 'Mobility Radeon HD 4670', family: 'Mobility Radeon HD 4000',
        type: 'laptop', year: 2009, api: 'd3d10',
        aliases: ["Mobility Radeon HD 4670","AMD Mobility Radeon HD 4670","Mobility Radeon HD 4670 Direct3D11 vs_5_0 ps_5_0","ANGLE (AMD, Mobility Radeon HD 4670 Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 0.432, fp16Tflops: 0.432, int8Tops: null,
          bandwidthGBs: 25.6, pixelRateGps: 5.4, texelRateGts: 21.6,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR3', busWidth: 128,
          shaderUnits: 320, baseClockMhz: 675, boostClockMhz: 675
        },
        note: "M96（VLIW5）；320 流处理器，8 光栅 / 32 纹理；128-bit GDDR3 1.6 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_AMD_graphics_processing_units"
      },

      {
        id: 'amd-mobility-hd-4850',
        vendor: 'AMD', name: 'Mobility Radeon HD 4850', family: 'Mobility Radeon HD 4000',
        type: 'laptop', year: 2009, api: 'd3d10',
        aliases: ["Mobility Radeon HD 4850","AMD Mobility Radeon HD 4850","Mobility Radeon HD 4850 Direct3D11 vs_5_0 ps_5_0","ANGLE (AMD, Mobility Radeon HD 4850 Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 0.8, fp16Tflops: 0.8, int8Tops: null,
          bandwidthGBs: 89.6, pixelRateGps: 8, texelRateGts: 20,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR5', busWidth: 256,
          shaderUnits: 800, baseClockMhz: 500, boostClockMhz: 500
        },
        note: "M98（RV770，VLIW5）；800 流处理器，16 光栅 / 40 纹理；256-bit GDDR5 2.8 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_AMD_graphics_processing_units"
      },

      {
        id: 'amd-mobility-hd-4870',
        vendor: 'AMD', name: 'Mobility Radeon HD 4870', family: 'Mobility Radeon HD 4000',
        type: 'laptop', year: 2009, api: 'd3d10',
        aliases: ["Mobility Radeon HD 4870","AMD Mobility Radeon HD 4870","Mobility Radeon HD 4870 Direct3D11 vs_5_0 ps_5_0","ANGLE (AMD, Mobility Radeon HD 4870 Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 0.88, fp16Tflops: 0.88, int8Tops: null,
          bandwidthGBs: 89.6, pixelRateGps: 8.8, texelRateGts: 22,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR5', busWidth: 256,
          shaderUnits: 800, baseClockMhz: 550, boostClockMhz: 550
        },
        note: "M98（RV770，VLIW5）；800 流处理器，16 光栅 / 40 纹理；256-bit GDDR5 2.8 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_AMD_graphics_processing_units"
      },

      {
        id: 'amd-mobility-hd-5450',
        vendor: 'AMD', name: 'Mobility Radeon HD 5450', family: 'Mobility Radeon HD 5000',
        type: 'laptop', year: 2010, api: 'd3d11',
        aliases: ["Mobility Radeon HD 5450","AMD Mobility Radeon HD 5450","Mobility Radeon HD 5450 Direct3D11 vs_5_0 ps_5_0","ANGLE (AMD, Mobility Radeon HD 5450 Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 0.108, fp16Tflops: 0.108, int8Tops: null,
          bandwidthGBs: 12.8, pixelRateGps: 2.7, texelRateGts: 5.4,
          triangleRateGts: null, vramGB: 1, memType: 'DDR3', busWidth: 64,
          shaderUnits: 80, baseClockMhz: 675, boostClockMhz: 675
        },
        note: "Park/M92 系（VLIW5）；80 流处理器，4 光栅 / 8 纹理；64-bit DDR3 1.6 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_AMD_graphics_processing_units"
      },

      {
        id: 'amd-mobility-hd-5650',
        vendor: 'AMD', name: 'Mobility Radeon HD 5650', family: 'Mobility Radeon HD 5000',
        type: 'laptop', year: 2010, api: 'd3d11',
        aliases: ["Mobility Radeon HD 5650","AMD Mobility Radeon HD 5650","Mobility Radeon HD 5650 Direct3D11 vs_5_0 ps_5_0","ANGLE (AMD, Mobility Radeon HD 5650 Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 0.52, fp16Tflops: 0.52, int8Tops: null,
          bandwidthGBs: 25.6, pixelRateGps: 5.2, texelRateGts: 13,
          triangleRateGts: null, vramGB: 1, memType: 'DDR3', busWidth: 128,
          shaderUnits: 400, baseClockMhz: 650, boostClockMhz: 650
        },
        note: "Madison（VLIW5）；400 流处理器，8 光栅 / 20 纹理；128-bit DDR3 1.6 Gbps。另有 450 MHz 低频版。 来源：https://en.wikipedia.org/wiki/List_of_AMD_graphics_processing_units"
      },

      {
        id: 'amd-mobility-hd-5730',
        vendor: 'AMD', name: 'Mobility Radeon HD 5730', family: 'Mobility Radeon HD 5000',
        type: 'laptop', year: 2010, api: 'd3d11',
        aliases: ["Mobility Radeon HD 5730","AMD Mobility Radeon HD 5730","Mobility Radeon HD 5730 Direct3D11 vs_5_0 ps_5_0","ANGLE (AMD, Mobility Radeon HD 5730 Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 0.52, fp16Tflops: 0.52, int8Tops: null,
          bandwidthGBs: 25.6, pixelRateGps: 5.2, texelRateGts: 13,
          triangleRateGts: null, vramGB: 1, memType: 'DDR3', busWidth: 128,
          shaderUnits: 400, baseClockMhz: 650, boostClockMhz: 650
        },
        note: "Madison（VLIW5）；400 流处理器，8 光栅 / 20 纹理；128-bit DDR3 1.6 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_AMD_graphics_processing_units"
      },

      {
        id: 'amd-mobility-hd-5850',
        vendor: 'AMD', name: 'Mobility Radeon HD 5850', family: 'Mobility Radeon HD 5000',
        type: 'laptop', year: 2010, api: 'd3d11',
        aliases: ["Mobility Radeon HD 5850","AMD Mobility Radeon HD 5850","Mobility Radeon HD 5850 Direct3D11 vs_5_0 ps_5_0","ANGLE (AMD, Mobility Radeon HD 5850 Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 1, fp16Tflops: 1, int8Tops: null,
          bandwidthGBs: 64, pixelRateGps: 10, texelRateGts: 25,
          triangleRateGts: null, vramGB: 1, memType: 'GDDR5', busWidth: 128,
          shaderUnits: 800, baseClockMhz: 625, boostClockMhz: 625
        },
        note: "Broadway（Juniper，VLIW5）；800 流处理器，16 光栅 / 40 纹理；128-bit GDDR5 4.0 Gbps。 来源：https://en.wikipedia.org/wiki/List_of_AMD_graphics_processing_units"
      },
      /* ==================================================================
       * 四、AMD 核显（RDNA 3 / RDNA 2 / GCN Vega）
       * ================================================================== */

      {
        id: 'amd-radeon-890m',
        vendor: 'AMD', name: 'Radeon 890M', family: 'Radeon 800M (Strix Point)',
        type: 'integrated', year: 2024, api: 'd3d12',
        aliases: [
          'Radeon 890M', 'AMD Radeon 890M', 'AMD Radeon 890M Graphics',
          'AMD Radeon 890M Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (AMD, AMD Radeon 890M Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'gfx1150', 'Strix Point', 'AMD Ryzen AI 9 HX 370'
        ],
        specs: {
          fp32Tflops: 11.88, fp16Tflops: 11.88, int8Tops: null,
          bandwidthGBs: 128, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR5X', busWidth: 128,
          shaderUnits: 1024, baseClockMhz: null, boostClockMhz: 2900
        },
        note: 'RDNA 3.5 核显，16 CU / 1024 SP，无独立显存、与 CPU 共享 LPDDR5X-7500 双通道（约 120 GB/s 级）；带宽与频率随整机配置浮动。'
      },

      {
        id: 'amd-radeon-880m',
        vendor: 'AMD', name: 'Radeon 880M', family: 'Radeon 800M (Strix Point)',
        type: 'integrated', year: 2024, api: 'd3d12',
        aliases: [
          'Radeon 880M', 'AMD Radeon 880M', 'AMD Radeon 880M Graphics',
          'AMD Radeon 880M Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (AMD, AMD Radeon 880M Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'gfx1150', 'Strix Point'
        ],
        specs: {
          fp32Tflops: 8.91, fp16Tflops: 8.91, int8Tops: null,
          bandwidthGBs: 120, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR5X', busWidth: 128,
          shaderUnits: 768, baseClockMhz: null, boostClockMhz: 2900
        },
        note: 'RDNA 3.5 核显，12 CU / 768 SP，共享 LPDDR5X 双通道；带宽为估算参考值。'
      },

      {
        id: 'amd-radeon-780m',
        vendor: 'AMD', name: 'Radeon 780M', family: 'Radeon 700M (Phoenix)',
        type: 'integrated', year: 2023, api: 'd3d12',
        aliases: [
          'Radeon 780M', 'AMD Radeon 780M', 'AMD Radeon 780M Graphics',
          'AMD Radeon 780M Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (AMD, AMD Radeon 780M Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'gfx1103', 'Phoenix', 'AMD Ryzen 7 7840U'
        ],
        specs: {
          fp32Tflops: 8.29, fp16Tflops: 8.29, int8Tops: null,
          bandwidthGBs: 89.6, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 128,
          shaderUnits: 768, baseClockMhz: null, boostClockMhz: 2700
        },
        note: 'RDNA 3 核显，12 CU / 768 SP（16 ROP / 48 TMU）；共享 LPDDR5-5600 双通道（DDR5-5600 约 89.6 GB/s）。'
      },

      {
        id: 'amd-radeon-760m',
        vendor: 'AMD', name: 'Radeon 760M', family: 'Radeon 700M (Phoenix)',
        type: 'integrated', year: 2023, api: 'd3d12',
        aliases: [
          'Radeon 760M', 'AMD Radeon 760M', 'AMD Radeon 760M Graphics',
          'AMD Radeon 760M Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (AMD, AMD Radeon 760M Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'gfx1103', 'Phoenix'
        ],
        specs: {
          fp32Tflops: 5.32, fp16Tflops: 5.32, int8Tops: null,
          bandwidthGBs: 89.6, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 128,
          shaderUnits: 512, baseClockMhz: null, boostClockMhz: 2600
        },
        note: 'RDNA 3 核显，8 CU / 512 SP，共享 DDR5/LPDDR5 双通道。'
      },

      {
        id: 'amd-radeon-680m',
        vendor: 'AMD', name: 'Radeon 680M', family: 'Radeon 600M (Rembrandt)',
        type: 'integrated', year: 2022, api: 'd3d12',
        aliases: [
          'Radeon 680M', 'AMD Radeon 680M', 'AMD Radeon 680M Graphics',
          'AMD Radeon 680M Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (AMD, AMD Radeon 680M Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'gfx1035', 'Rembrandt', 'AMD Ryzen 7 6800H'
        ],
        specs: {
          fp32Tflops: 3.69, fp16Tflops: 3.69, int8Tops: null,
          bandwidthGBs: 102.4, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: 'DDR5', busWidth: 128,
          shaderUnits: 768, baseClockMhz: null, boostClockMhz: 2400
        },
        note: 'RDNA 2 核显，12 CU / 768 SP，共享 LPDDR5-6400 双通道（102.4 GB/s）；DDR5-4800 机型为 76.8 GB/s。'
      },

      {
        id: 'amd-radeon-vega-8',
        vendor: 'AMD', name: 'Radeon Vega 8', family: 'Radeon Vega (Raven Ridge / Picasso / Cezanne)',
        type: 'integrated', year: 2018, api: 'd3d12',
        aliases: [
          'Radeon Vega 8', 'AMD Radeon Vega 8', 'AMD Radeon Vega 8 Graphics',
          'AMD Radeon Vega 8 Graphics Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (AMD, AMD Radeon Vega 8 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'gfx902', 'Raven Ridge', 'AMD Ryzen 5 3500U'
        ],
        specs: {
          fp32Tflops: 2.2, fp16Tflops: 2.2, int8Tops: null,
          bandwidthGBs: 38.4, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: 'DDR4', busWidth: 128,
          shaderUnits: 512, baseClockMhz: null, boostClockMhz: 2100
        },
        note: 'GCN 5（Vega）核显，8 CU / 512 SP；频率按 2200 MHz 与共享 DDR4-2400 双通道估算，不同代 APU 差异较大。'
      },

      {
        id: 'amd-radeon-vega-11',
        vendor: 'AMD', name: 'Radeon Vega 11', family: 'Radeon Vega (Raven Ridge)',
        type: 'integrated', year: 2018, api: 'd3d12',
        aliases: [
          'Radeon Vega 11', 'AMD Radeon Vega 11', 'AMD Radeon Vega 11 Graphics',
          'AMD Radeon Vega 11 Graphics Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (AMD, AMD Radeon Vega 11 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'gfx902', 'Raven Ridge', 'AMD Ryzen 5 2400G'
        ],
        specs: {
          fp32Tflops: 1.76, fp16Tflops: 1.76, int8Tops: null,
          bandwidthGBs: 43.7, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: 'DDR4', busWidth: 128,
          shaderUnits: 704, baseClockMhz: null, boostClockMhz: 1250
        },
        note: 'GCN 5（Vega）核显，11 CU / 704 SP，桌面 Ryzen 2400G/2400GE；共享 DDR4-2666 双通道。'
      },

      /* ==================================================================
       * 五、Intel 独显（Arc B / A 系列）
       * ================================================================== */

      {
        id: 'intel-arc-b580',
        vendor: 'Intel', name: 'Arc B580', family: 'Intel Arc B-Series (Battlemage)',
        type: 'desktop', year: 2024, api: 'd3d12',
        aliases: [
          'Arc B580', 'Intel Arc B580', 'Intel(R) Arc(TM) B580 Graphics',
          'Intel(R) Arc(TM) B580 Graphics Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (Intel, Intel(R) Arc(TM) B580 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'BMG-G21', 'Battlemage', 'Intel Arc B580 Graphics'
        ],
        specs: {
          fp32Tflops: 13.67, fp16Tflops: 13.67, int8Tops: null,
          bandwidthGBs: 456, pixelRateGps: 152, texelRateGts: 380,
          triangleRateGts: null, vramGB: 12, memType: 'GDDR6', busWidth: 192,
          shaderUnits: 2560, baseClockMhz: null, boostClockMhz: 2670
        },
        note: 'BMG-G21（20 Xe2 核心 / 2560 ALU / 160 XMX），192-bit GDDR6 19 Gbps，190W；Xe2 每核心每周期 8 FP32 × 16 通道。'
      },

      {
        id: 'intel-arc-b570',
        vendor: 'Intel', name: 'Arc B570', family: 'Intel Arc B-Series (Battlemage)',
        type: 'desktop', year: 2025, api: 'd3d12',
        aliases: [
          'Arc B570', 'Intel Arc B570', 'Intel(R) Arc(TM) B570 Graphics',
          'Intel(R) Arc(TM) B570 Graphics Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (Intel, Intel(R) Arc(TM) B570 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'BMG-G21', 'Battlemage', 'Intel Arc B570 Graphics'
        ],
        specs: {
          fp32Tflops: 11.52, fp16Tflops: 11.52, int8Tops: null,
          bandwidthGBs: 380, pixelRateGps: 114, texelRateGts: 288,
          triangleRateGts: null, vramGB: 10, memType: 'GDDR6', busWidth: 160,
          shaderUnits: 2304, baseClockMhz: null, boostClockMhz: 2500
        },
        note: 'BMG-G21 精简版（18 Xe2 核心 / 2304 ALU），160-bit GDDR6 19 Gbps，150W。'
      },

      {
        id: 'intel-arc-a770',
        vendor: 'Intel', name: 'Arc A770', family: 'Intel Arc A-Series (Alchemist)',
        type: 'desktop', year: 2022, api: 'd3d12',
        aliases: [
          'Arc A770', 'Intel Arc A770', 'Intel(R) Arc(TM) A770 Graphics',
          'Intel(R) Arc(TM) A770 Graphics Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (Intel, Intel(R) Arc(TM) A770 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'ACM-G10', 'Alchemist', 'Intel Arc A770 Graphics'
        ],
        specs: {
          fp32Tflops: 19.66, fp16Tflops: 19.66, int8Tops: null,
          bandwidthGBs: 560, pixelRateGps: 268.8, texelRateGts: 537.6,
          triangleRateGts: null, vramGB: 16, memType: 'GDDR6', busWidth: 256,
          shaderUnits: 4096, baseClockMhz: null, boostClockMhz: 2100
        },
        note: 'ACM-G10 满血（32 Xe 核心 / 4096 ALU / 512 XMX），256-bit GDDR6 17.5 Gbps，225W；Xe 每核心每周期 8 FP32 × 16 通道。'
      },

      {
        id: 'intel-arc-a750',
        vendor: 'Intel', name: 'Arc A750', family: 'Intel Arc A-Series (Alchemist)',
        type: 'desktop', year: 2022, api: 'd3d12',
        aliases: [
          'Arc A750', 'Intel Arc A750', 'Intel(R) Arc(TM) A750 Graphics',
          'Intel(R) Arc(TM) A750 Graphics Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (Intel, Intel(R) Arc(TM) A750 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'ACM-G10', 'Alchemist', 'Intel Arc A750 Graphics'
        ],
        specs: {
          fp32Tflops: 17.20, fp16Tflops: 17.20, int8Tops: null,
          bandwidthGBs: 512, pixelRateGps: 224, texelRateGts: 448,
          triangleRateGts: null, vramGB: 8, memType: 'GDDR6', busWidth: 256,
          shaderUnits: 3584, baseClockMhz: null, boostClockMhz: 2050
        },
        note: 'ACM-G10 精简版（28 Xe 核心 / 3584 ALU），256-bit GDDR6 16 Gbps，225W。'
      },

      {
        id: 'intel-arc-a580',
        vendor: 'Intel', name: 'Arc A580', family: 'Intel Arc A-Series (Alchemist)',
        type: 'desktop', year: 2023, api: 'd3d12',
        aliases: [
          'Arc A580', 'Intel Arc A580', 'Intel(R) Arc(TM) A580 Graphics',
          'Intel(R) Arc(TM) A580 Graphics Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (Intel, Intel(R) Arc(TM) A580 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'ACM-G10', 'Alchemist', 'Intel Arc A580 Graphics'
        ],
        specs: {
          fp32Tflops: 12.29, fp16Tflops: 12.29, int8Tops: null,
          bandwidthGBs: 512, pixelRateGps: 192, texelRateGts: 384,
          triangleRateGts: null, vramGB: 8, memType: 'GDDR6', busWidth: 256,
          shaderUnits: 3072, baseClockMhz: null, boostClockMhz: 1700
        },
        note: 'ACM-G10 精简版（24 Xe 核心 / 3072 ALU），256-bit GDDR6 16 Gbps，185W。'
      },

      {
        id: 'intel-arc-a380',
        vendor: 'Intel', name: 'Arc A380', family: 'Intel Arc A-Series (Alchemist)',
        type: 'desktop', year: 2022, api: 'd3d12',
        aliases: [
          'Arc A380', 'Intel Arc A380', 'Intel(R) Arc(TM) A380 Graphics',
          'Intel(R) Arc(TM) A380 Graphics Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (Intel, Intel(R) Arc(TM) A380 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'ACM-G11', 'Alchemist', 'Intel Arc A380 Graphics'
        ],
        specs: {
          fp32Tflops: 4.1, fp16Tflops: 4.1, int8Tops: null,
          bandwidthGBs: 186, pixelRateGps: 76.8, texelRateGts: 153.6,
          triangleRateGts: null, vramGB: 6, memType: 'GDDR6', busWidth: 96,
          shaderUnits: 1024, baseClockMhz: null, boostClockMhz: 2000
        },
        note: 'ACM-G11（8 Xe 核心 / 1024 ALU），96-bit GDDR6 15.5 Gbps，75W。'
      },

      /* ==================================================================
       * 六、Intel 核显
       * ================================================================== */

      {
        id: 'intel-arc-140v',
        vendor: 'Intel', name: 'Intel Arc 140V', family: 'Intel Arc Graphics (Lunar Lake)',
        type: 'integrated', year: 2024, api: 'd3d12',
        aliases: [
          'Arc 140V', 'Intel Arc 140V', 'Intel(R) Arc(TM) 140V GPU',
          'Intel(R) Arc(TM) 140V GPU Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (Intel, Intel(R) Arc(TM) 140V GPU Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'Xe2-LPG', 'Lunar Lake', 'Intel Arc Graphics 140V'
        ],
        specs: {
          fp32Tflops: 4.1, fp16Tflops: 4.1, int8Tops: null,
          bandwidthGBs: 136, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR5X', busWidth: 128,
          shaderUnits: 1024, baseClockMhz: null, boostClockMhz: 2000
        },
        note: 'Xe2 核显，8 Xe2 核心 / 1024 ALU（16 ROP / 64 TMU）；LPDDR5X-8533 双通道共享带宽约 136 GB/s。Core Ultra 200V 系列。'
      },

      {
        id: 'intel-arc-graphics-meteor-lake',
        vendor: 'Intel', name: 'Intel Arc Graphics (Meteor Lake)', family: 'Intel Arc Graphics (Meteor Lake)',
        type: 'integrated', year: 2023, api: 'd3d12',
        aliases: [
          'Intel Arc Graphics', 'Arc Graphics', 'Intel(R) Arc(TM) Graphics',
          'Intel(R) Arc(TM) Graphics Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (Intel, Intel(R) Arc(TM) Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'Xe-LPG', 'Meteor Lake', 'Intel Arc Graphics (Meteor Lake)'
        ],
        specs: {
          fp32Tflops: 4.5, fp16Tflops: 4.5, int8Tops: null,
          bandwidthGBs: 120, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR5X', busWidth: 128,
          shaderUnits: 1024, baseClockMhz: null, boostClockMhz: 2200
        },
        note: 'Xe-LPG 核显，最高 8 Xe 核心 / 1024 ALU；共享 LPDDR5X-7467 双通道（约 120 GB/s）。Core Ultra 100H 系列高配。'
      },

      {
        id: 'intel-iris-xe-96eu',
        vendor: 'Intel', name: 'Intel Iris Xe Graphics (96EU)', family: 'Intel Xe (Tiger Lake / Alder Lake)',
        type: 'integrated', year: 2020, api: 'd3d12',
        aliases: [
          'Iris Xe Graphics', 'Intel Iris Xe Graphics', 'Intel(R) Iris(R) Xe Graphics',
          'Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'Tiger Lake', 'TGL GT2', 'Intel Iris Xe Graphics (96EU)'
        ],
        specs: {
          fp32Tflops: 2.15, fp16Tflops: 2.15, int8Tops: null,
          bandwidthGBs: 68, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: 128,
          shaderUnits: 768, baseClockMhz: null, boostClockMhz: 1400
        },
        note: 'Xe-LP 核显，96 EU / 768 ALU（24 ROP / 48 TMU）；共享 LPDDR4X-4266 双通道（约 68 GB/s）。'
      },

      {
        id: 'intel-iris-xe-80eu',
        vendor: 'Intel', name: 'Intel Iris Xe Graphics (80EU)', family: 'Intel Xe (Tiger Lake / Alder Lake)',
        type: 'integrated', year: 2020, api: 'd3d12',
        aliases: [
          'Intel Iris Xe Graphics 80EU', 'Intel(R) Iris(R) Xe Graphics (80EU)',
          'Intel Iris Xe Graphics (80EU)', 'Iris Xe Graphics 80EU',
          'Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'Tiger Lake', 'TGL GT2'
        ],
        specs: {
          fp32Tflops: 1.79, fp16Tflops: 1.79, int8Tops: null,
          bandwidthGBs: 68, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: 128,
          shaderUnits: 640, baseClockMhz: null, boostClockMhz: 1400
        },
        note: 'Xe-LP 核显，80 EU / 640 ALU；与 96EU 版本共用渲染器字符串，靠 WebGPU 设备名或核心数区分。'
      },

      {
        id: 'intel-uhd-630',
        vendor: 'Intel', name: 'Intel UHD Graphics 630', family: 'Intel Gen9.5 (Coffee Lake / Comet Lake)',
        type: 'integrated', year: 2017, api: 'd3d12',
        aliases: [
          'UHD Graphics 630', 'Intel UHD Graphics 630', 'Intel(R) UHD Graphics 630',
          'Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'Mesa Intel(R) UHD Graphics 630 (CFL GT2)', 'Coffee Lake', 'CFL GT2'
        ],
        specs: {
          fp32Tflops: 0.46, fp16Tflops: 0.46, int8Tops: null,
          bandwidthGBs: 41.6, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: 'DDR4', busWidth: 128,
          shaderUnits: 192, baseClockMhz: 350, boostClockMhz: 1150
        },
        note: 'Gen9.5 GT2，24 EU / 192 ALU（4 ROP / 24 TMU）；共享 DDR4-2666 双通道（约 41.6 GB/s），实际随整机内存配置变化。'
      },

      {
        id: 'intel-uhd-620',
        vendor: 'Intel', name: 'Intel UHD Graphics 620', family: 'Intel Gen9.5 (Kaby Lake-R / Whiskey Lake)',
        type: 'integrated', year: 2017, api: 'd3d12',
        aliases: [
          'UHD Graphics 620', 'Intel UHD Graphics 620', 'Intel(R) UHD Graphics 620',
          'Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'Mesa Intel(R) UHD Graphics 620 (KBL GT2)', 'Kaby Lake', 'KBL GT2'
        ],
        specs: {
          fp32Tflops: 0.44, fp16Tflops: 0.44, int8Tops: null,
          bandwidthGBs: 34.1, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: 'DDR4', busWidth: 128,
          shaderUnits: 192, baseClockMhz: 300, boostClockMhz: 1150
        },
        note: 'Gen9.5 GT2，24 EU / 192 ALU；共享 DDR4-2133 双通道（约 34.1 GB/s），低功耗机型为单通道。'
      },

      {
        id: 'intel-hd-530',
        vendor: 'Intel', name: 'Intel HD Graphics 530', family: 'Intel Gen9 (Skylake)',
        type: 'integrated', year: 2015, api: 'd3d12',
        aliases: [
          'HD Graphics 530', 'Intel HD Graphics 530', 'Intel(R) HD Graphics 530',
          'Intel(R) HD Graphics 530 Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (Intel, Intel(R) HD Graphics 530 Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'Mesa Intel(R) HD Graphics 530 (SKL GT2)', 'Skylake', 'SKL GT2'
        ],
        specs: {
          fp32Tflops: 0.44, fp16Tflops: 0.44, int8Tops: null,
          bandwidthGBs: 34.1, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: 'DDR4', busWidth: 128,
          shaderUnits: 192, baseClockMhz: 350, boostClockMhz: 1150
        },
        note: 'Gen9 GT2，24 EU / 192 ALU；共享 DDR4-2133 双通道（约 34.1 GB/s），另有 DDR3L 版本。'
      },


      /* ------------------------------------------------------------------
       * Intel 老核显：HD 3000 / HD 2500（Gen6 / Gen7）
       * 数据来源：https://en.wikipedia.org/wiki/Intel_Graphics_Technology
       * 说明：老 NVIDIA 卡（Tesla/Fermi）核心与着色器为双时钟域，boostClockMhz 记 NVIDIA
       *   公开的 Shader 时钟（= FP32 计算所用时钟），baseClockMhz 记核心/图形时钟；
       *   像素/纹理填充率按核心时钟计算，与 Wikipedia 列表页一致。
       * ------------------------------------------------------------------ */

      {
        id: 'intel-hd-3000',
        vendor: 'Intel', name: 'Intel HD Graphics 3000', family: 'Intel Gen6 (Sandy Bridge)',
        type: 'integrated', year: 2011, api: 'd3d11',
        aliases: ["Intel HD Graphics 3000","Intel Intel HD Graphics 3000","Intel HD Graphics 3000 Direct3D11 vs_5_0 ps_5_0","ANGLE (Intel, Intel HD Graphics 3000 Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 0.259, fp16Tflops: 0.259, int8Tops: null,
          bandwidthGBs: 25.6, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: 'DDR3', busWidth: 128,
          shaderUnits: 96, baseClockMhz: 850, boostClockMhz: 1350
        },
        note: "Sandy Bridge 核显，12 EU（96 ALU）；GPU 最高 1350 MHz（桌面 4 核版），共享 DDR3-1600 双通道约 25.6 GB/s。移动版 EU 数较少（6 EU）。Intel 不公布核显 ROP/TMU，故填充率为 null。 来源：https://en.wikipedia.org/wiki/Intel_Graphics_Technology"
      },

      {
        id: 'intel-hd-2500',
        vendor: 'Intel', name: 'Intel HD Graphics 2500', family: 'Intel Gen7 (Ivy Bridge)',
        type: 'integrated', year: 2012, api: 'd3d11',
        aliases: ["Intel HD Graphics 2500","Intel Intel HD Graphics 2500","Intel HD Graphics 2500 Direct3D11 vs_5_0 ps_5_0","ANGLE (Intel, Intel HD Graphics 2500 Direct3D11 vs_5_0 ps_5_0, D3D11)"],
        specs: {
          fp32Tflops: 0.101, fp16Tflops: 0.101, int8Tops: null,
          bandwidthGBs: 25.6, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: 'DDR3', busWidth: 128,
          shaderUnits: 48, baseClockMhz: 650, boostClockMhz: 1050
        },
        note: "Ivy Bridge GT1 核显，6 EU（48 ALU）；最高 1050 MHz，共享 DDR3-1600 双通道约 25.6 GB/s。Intel 不公布核显 ROP/TMU，故填充率为 null。 来源：https://en.wikipedia.org/wiki/Intel_Graphics_Technology"
      },
      /* ==================================================================
       * 七、Apple Silicon（统一内存；GPU 核心数见 note）
       * ================================================================== */

      {
        id: 'apple-m1',
        vendor: 'Apple', name: 'Apple M1', family: 'Apple M1',
        type: 'apple-soc', year: 2020, api: 'metal',
        aliases: [
          'Apple M1', 'M1', 'Apple M1 GPU', 'Apple GPU (Apple M1)',
          'Apple M1 (8 核 GPU)', 'Apple M1 8-Core GPU', 'Apple M1 Integrated GPU'
        ],
        specs: {
          fp32Tflops: 2.6, fp16Tflops: 2.6, int8Tops: null,
          bandwidthGBs: 68.3, pixelRateGps: 16, texelRateGts: 32,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: 128,
          shaderUnits: 1024, baseClockMhz: null, boostClockMhz: 1278
        },
        note: 'GPU 为 8 核心（128 ALU/核）；统一内存 LPDDR4X-4266，128-bit（68.3 GB/s）。MacBook Air / Pro 13 / Mac mini / iMac 24。'
      },

      {
        id: 'apple-m1-pro',
        vendor: 'Apple', name: 'Apple M1 Pro', family: 'Apple M1',
        type: 'apple-soc', year: 2021, api: 'metal',
        aliases: [
          'Apple M1 Pro', 'M1 Pro', 'Apple M1 Pro GPU',
          'Apple GPU (Apple M1 Pro)', 'Apple M1 Pro 16-Core GPU',
          'Apple M1 Pro 14-Core GPU', 'Apple M1 Pro 16 核 GPU'
        ],
        specs: {
          fp32Tflops: 5.3, fp16Tflops: 5.3, int8Tops: null,
          bandwidthGBs: 204.8, pixelRateGps: 32, texelRateGts: 64,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 256,
          shaderUnits: 2048, baseClockMhz: null, boostClockMhz: 1296
        },
        note: 'GPU 有 14 核与 16 核两档，此处按 16 核（2048 ALU）计；统一内存 LPDDR5-6400，256-bit（204.8 GB/s）。'
      },

      {
        id: 'apple-m1-max',
        vendor: 'Apple', name: 'Apple M1 Max', family: 'Apple M1',
        type: 'apple-soc', year: 2021, api: 'metal',
        aliases: [
          'Apple M1 Max', 'M1 Max', 'Apple M1 Max GPU',
          'Apple GPU (Apple M1 Max)', 'Apple M1 Max 32-Core GPU',
          'Apple M1 Max 24-Core GPU', 'Apple M1 Max 32 核 GPU'
        ],
        specs: {
          fp32Tflops: 10.6, fp16Tflops: 10.6, int8Tops: null,
          bandwidthGBs: 409.6, pixelRateGps: 64, texelRateGts: 128,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 512,
          shaderUnits: 4096, baseClockMhz: null, boostClockMhz: 1296
        },
        note: 'GPU 有 24 核与 32 核两档，此处按 32 核（4096 ALU）计；统一内存 LPDDR5-6400，512-bit（409.6 GB/s）。'
      },

      {
        id: 'apple-m1-ultra',
        vendor: 'Apple', name: 'Apple M1 Ultra', family: 'Apple M1',
        type: 'apple-soc', year: 2022, api: 'metal',
        aliases: [
          'Apple M1 Ultra', 'M1 Ultra', 'Apple M1 Ultra GPU',
          'Apple GPU (Apple M1 Ultra)', 'Apple M1 Ultra 64-Core GPU',
          'Apple M1 Ultra 48-Core GPU', 'Apple M1 Ultra 64 核 GPU'
        ],
        specs: {
          fp32Tflops: 21.2, fp16Tflops: 21.2, int8Tops: null,
          bandwidthGBs: 819.2, pixelRateGps: 128, texelRateGts: 256,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 1024,
          shaderUnits: 8192, baseClockMhz: null, boostClockMhz: 1296
        },
        note: 'GPU 有 48 核与 64 核两档，此处按 64 核（8192 ALU）计；统一内存 LPDDR5-6400，1024-bit（819.2 GB/s）。'
      },

      {
        id: 'apple-m2',
        vendor: 'Apple', name: 'Apple M2', family: 'Apple M2',
        type: 'apple-soc', year: 2022, api: 'metal',
        aliases: [
          'Apple M2', 'M2', 'Apple M2 GPU', 'Apple GPU (Apple M2)',
          'Apple M2 10-Core GPU', 'Apple M2 8-Core GPU', 'Apple M2 10 核 GPU'
        ],
        specs: {
          fp32Tflops: 3.58, fp16Tflops: 3.58, int8Tops: null,
          bandwidthGBs: 102.4, pixelRateGps: 20, texelRateGts: 40,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 128,
          shaderUnits: 1280, baseClockMhz: null, boostClockMhz: 1398
        },
        note: 'GPU 有 8 核与 10 核两档，此处按 10 核（1280 ALU）计；统一内存 LPDDR5-6400，128-bit（102.4 GB/s）。'
      },

      {
        id: 'apple-m2-pro',
        vendor: 'Apple', name: 'Apple M2 Pro', family: 'Apple M2',
        type: 'apple-soc', year: 2023, api: 'metal',
        aliases: [
          'Apple M2 Pro', 'M2 Pro', 'Apple M2 Pro GPU',
          'Apple GPU (Apple M2 Pro)', 'Apple M2 Pro 19-Core GPU',
          'Apple M2 Pro 16-Core GPU', 'Apple M2 Pro 19 核 GPU'
        ],
        specs: {
          fp32Tflops: 6.8, fp16Tflops: 6.8, int8Tops: null,
          bandwidthGBs: 204.8, pixelRateGps: 38, texelRateGts: 76,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 256,
          shaderUnits: 2432, baseClockMhz: null, boostClockMhz: 1398
        },
        note: 'GPU 有 16 核与 19 核两档，此处按 19 核（2432 ALU）计；统一内存 LPDDR5-6400，256-bit（204.8 GB/s）。'
      },

      {
        id: 'apple-m2-max',
        vendor: 'Apple', name: 'Apple M2 Max', family: 'Apple M2',
        type: 'apple-soc', year: 2023, api: 'metal',
        aliases: [
          'Apple M2 Max', 'M2 Max', 'Apple M2 Max GPU',
          'Apple GPU (Apple M2 Max)', 'Apple M2 Max 38-Core GPU',
          'Apple M2 Max 30-Core GPU', 'Apple M2 Max 38 核 GPU'
        ],
        specs: {
          fp32Tflops: 13.6, fp16Tflops: 13.6, int8Tops: null,
          bandwidthGBs: 409.6, pixelRateGps: 76, texelRateGts: 152,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 512,
          shaderUnits: 4864, baseClockMhz: null, boostClockMhz: 1398
        },
        note: 'GPU 有 30 核与 38 核两档，此处按 38 核（4864 ALU）计；统一内存 LPDDR5-6400，512-bit（409.6 GB/s）。'
      },

      {
        id: 'apple-m3',
        vendor: 'Apple', name: 'Apple M3', family: 'Apple M3',
        type: 'apple-soc', year: 2023, api: 'metal',
        aliases: [
          'Apple M3', 'M3', 'Apple M3 GPU', 'Apple GPU (Apple M3)',
          'Apple M3 10-Core GPU', 'Apple M3 8-Core GPU', 'Apple M3 10 核 GPU'
        ],
        specs: {
          fp32Tflops: 4.1, fp16Tflops: 4.1, int8Tops: null,
          bandwidthGBs: 102.4, pixelRateGps: 20, texelRateGts: 40,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 128,
          shaderUnits: 1280, baseClockMhz: null, boostClockMhz: 1600
        },
        note: 'GPU 有 8 核与 10 核两档，此处按 10 核（1280 ALU）计；统一内存 LPDDR5-6400，128-bit（102.4 GB/s）。'
      },

      {
        id: 'apple-m3-pro',
        vendor: 'Apple', name: 'Apple M3 Pro', family: 'Apple M3',
        type: 'apple-soc', year: 2023, api: 'metal',
        aliases: [
          'Apple M3 Pro', 'M3 Pro', 'Apple M3 Pro GPU',
          'Apple GPU (Apple M3 Pro)', 'Apple M3 Pro 18-Core GPU',
          'Apple M3 Pro 14-Core GPU', 'Apple M3 Pro 18 核 GPU'
        ],
        specs: {
          fp32Tflops: 7.4, fp16Tflops: 7.4, int8Tops: null,
          bandwidthGBs: 153.6, pixelRateGps: 36, texelRateGts: 72,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 192,
          shaderUnits: 2304, baseClockMhz: null, boostClockMhz: 1600
        },
        note: 'GPU 有 14 核与 18 核两档，此处按 18 核（2304 ALU）计；统一内存 LPDDR5-6400，192-bit（153.6 GB/s）。'
      },

      {
        id: 'apple-m3-max',
        vendor: 'Apple', name: 'Apple M3 Max', family: 'Apple M3',
        type: 'apple-soc', year: 2023, api: 'metal',
        aliases: [
          'Apple M3 Max', 'M3 Max', 'Apple M3 Max GPU',
          'Apple GPU (Apple M3 Max)', 'Apple M3 Max 40-Core GPU',
          'Apple M3 Max 30-Core GPU', 'Apple M3 Max 40 核 GPU'
        ],
        specs: {
          fp32Tflops: 16.4, fp16Tflops: 16.4, int8Tops: null,
          bandwidthGBs: 409.6, pixelRateGps: 80, texelRateGts: 160,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 512,
          shaderUnits: 5120, baseClockMhz: null, boostClockMhz: 1600
        },
        note: 'GPU 有 30 核与 40 核两档，此处按 40 核（5120 ALU）计；统一内存 LPDDR5-6400，512-bit（409.6 GB/s）。'
      },

      {
        id: 'apple-m4',
        vendor: 'Apple', name: 'Apple M4', family: 'Apple M4',
        type: 'apple-soc', year: 2024, api: 'metal',
        aliases: [
          'Apple M4', 'M4', 'Apple M4 GPU', 'Apple GPU (Apple M4)',
          'Apple M4 10-Core GPU', 'Apple M4 8-Core GPU', 'Apple M4 10 核 GPU'
        ],
        specs: {
          fp32Tflops: 4.3, fp16Tflops: 4.3, int8Tops: null,
          bandwidthGBs: 120, pixelRateGps: 20, texelRateGts: 40,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR5X', busWidth: 128,
          shaderUnits: 1280, baseClockMhz: null, boostClockMhz: 1680
        },
        note: 'GPU 为 10 核（1280 ALU，8 核版本用于入门 iPad Pro）；统一内存 LPDDR5X-7500，128-bit（120 GB/s）。'
      },

      {
        id: 'apple-m4-pro',
        vendor: 'Apple', name: 'Apple M4 Pro', family: 'Apple M4',
        type: 'apple-soc', year: 2024, api: 'metal',
        aliases: [
          'Apple M4 Pro', 'M4 Pro', 'Apple M4 Pro GPU',
          'Apple GPU (Apple M4 Pro)', 'Apple M4 Pro 20-Core GPU',
          'Apple M4 Pro 16-Core GPU', 'Apple M4 Pro 20 核 GPU'
        ],
        specs: {
          fp32Tflops: 9.2, fp16Tflops: 9.2, int8Tops: null,
          bandwidthGBs: 273, pixelRateGps: 42, texelRateGts: 84,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR5X', busWidth: 256,
          shaderUnits: 2560, baseClockMhz: null, boostClockMhz: 1800
        },
        note: 'GPU 有 16 核与 20 核两档，此处按 20 核（2560 ALU）计；统一内存 LPDDR5X-8533，256-bit（273 GB/s）。'
      },

      {
        id: 'apple-m4-max',
        vendor: 'Apple', name: 'Apple M4 Max', family: 'Apple M4',
        type: 'apple-soc', year: 2024, api: 'metal',
        aliases: [
          'Apple M4 Max', 'M4 Max', 'Apple M4 Max GPU',
          'Apple GPU (Apple M4 Max)', 'Apple M4 Max 40-Core GPU',
          'Apple M4 Max 32-Core GPU', 'Apple M4 Max 40 核 GPU'
        ],
        specs: {
          fp32Tflops: 18.4, fp16Tflops: 18.4, int8Tops: null,
          bandwidthGBs: 546, pixelRateGps: 84, texelRateGts: 168,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR5X', busWidth: 512,
          shaderUnits: 5120, baseClockMhz: null, boostClockMhz: 1800
        },
        note: 'GPU 有 32 核与 40 核两档，此处按 40 核（5120 ALU）计；统一内存 LPDDR5X-8533，512-bit（546 GB/s）。'
      },

      /* ==================================================================
       * 八、移动 / 嵌入式 SoC GPU（Android · iOS）
       * ================================================================== */

      {
        id: 'qualcomm-adreno-830',
        vendor: 'Qualcomm', name: 'Adreno 830', family: 'Snapdragon 8 Elite',
        type: 'mobile-soc', year: 2024, api: 'vulkan',
        aliases: [
          'Adreno 830', 'Qualcomm Adreno 830', 'Adreno (TM) 830',
          'ANGLE (Qualcomm, Adreno (TM) 830, OpenGL ES 3.2)',
          'Adreno 830 GPU', 'Snapdragon 8 Elite', 'Qualcomm Snapdragon 8 Elite'
        ],
        specs: {
          fp32Tflops: 4.6, fp16Tflops: 4.6, int8Tops: null,
          bandwidthGBs: 76.8, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR5X', busWidth: 64,
          shaderUnits: null, baseClockMhz: null, boostClockMhz: null
        },
        note: 'Adreno 8 系（Snapdragon 8 Elite），官方称 GPU 性能较上代 +40%；共享 LPDDR5X-9600 双通道（约 76.8 GB/s）。ALU／ROP 数未公开，填 null。'
      },

      {
        id: 'qualcomm-adreno-750',
        vendor: 'Qualcomm', name: 'Adreno 750', family: 'Snapdragon 8 Gen 3',
        type: 'mobile-soc', year: 2023, api: 'vulkan',
        aliases: [
          'Adreno 750', 'Qualcomm Adreno 750', 'Adreno (TM) 750',
          'ANGLE (Qualcomm, Adreno (TM) 750, OpenGL ES 3.2)',
          'Adreno 750 GPU', 'Snapdragon 8 Gen 3', 'Qualcomm Snapdragon 8 Gen 3'
        ],
        specs: {
          fp32Tflops: 2.6, fp16Tflops: 2.6, int8Tops: null,
          bandwidthGBs: 76.8, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR5X', busWidth: 64,
          shaderUnits: null, baseClockMhz: null, boostClockMhz: null
        },
        note: 'Adreno 7 系（Snapdragon 8 Gen 3）；共享 LPDDR5X-9600 双通道。ALU／ROP 数未公开，填 null。'
      },

      {
        id: 'qualcomm-adreno-740',
        vendor: 'Qualcomm', name: 'Adreno 740', family: 'Snapdragon 8 Gen 2 / XR2 Gen 2',
        type: 'mobile-soc', year: 2022, api: 'vulkan',
        aliases: [
          'Adreno 740', 'Qualcomm Adreno 740', 'Adreno (TM) 740',
          'ANGLE (Qualcomm, Adreno (TM) 740, OpenGL ES 3.2)',
          'Adreno 740 GPU', 'Snapdragon 8 Gen 2', 'Qualcomm Snapdragon 8 Gen 2',
          'Quest 3', 'Meta Quest 3'
        ],
        specs: {
          fp32Tflops: 2.4, fp16Tflops: 2.4, int8Tops: null,
          bandwidthGBs: 67.2, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR5X', busWidth: 64,
          shaderUnits: null, baseClockMhz: null, boostClockMhz: null
        },
        note: 'Adreno 7 系（Snapdragon 8 Gen 2；Meta Quest 3 用 Snapdragon XR2 Gen 2，同为 Adreno 740 变体）。LPDDR5X-8400 双通道。'
      },

      {
        id: 'qualcomm-adreno-730',
        vendor: 'Qualcomm', name: 'Adreno 730', family: 'Snapdragon 8 Gen 1',
        type: 'mobile-soc', year: 2021, api: 'vulkan',
        aliases: [
          'Adreno 730', 'Qualcomm Adreno 730', 'Adreno (TM) 730',
          'ANGLE (Qualcomm, Adreno (TM) 730, OpenGL ES 3.2)',
          'Adreno 730 GPU', 'Snapdragon 8 Gen 1', 'Qualcomm Snapdragon 8 Gen 1'
        ],
        specs: {
          fp32Tflops: 2.0, fp16Tflops: 2.0, int8Tops: null,
          bandwidthGBs: 51.2, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 64,
          shaderUnits: null, baseClockMhz: null, boostClockMhz: null
        },
        note: 'Adreno 7 系（Snapdragon 8 Gen 1）；共享 LPDDR5-6400 双通道（约 51.2 GB/s）。ALU／ROP 数未公开，填 null。'
      },

      {
        id: 'arm-immortalis-g715',
        vendor: 'ARM', name: 'Arm Immortalis-G715', family: 'Arm Immortalis (Valhall 5th gen)',
        type: 'mobile-soc', year: 2022, api: 'vulkan',
        aliases: [
          'Immortalis-G715', 'Arm Immortalis-G715', 'Mali-G715 Immortalis',
          'Mali-G715-Immortalis MC11', 'ANGLE (ARM, Mali-G715-Immortalis MC11, OpenGL ES 3.2)',
          'Immortalis G715', 'ARM Immortalis-G715 MC11'
        ],
        specs: {
          fp32Tflops: null, fp16Tflops: null, int8Tops: null,
          bandwidthGBs: null, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: null, busWidth: null,
          shaderUnits: null, baseClockMhz: null, boostClockMhz: null
        },
        note: '旗舰移动 GPU，最多 16 核心（MC16），硬件光追；具体核心数与频率由 SoC 厂商决定，理论峰值无法归一化，全部填 null。'
      },

      {
        id: 'arm-mali-g720',
        vendor: 'ARM', name: 'Arm Mali-G720', family: 'Arm Mali (5th gen)',
        type: 'mobile-soc', year: 2023, api: 'vulkan',
        aliases: [
          'Mali-G720', 'Arm Mali-G720', 'Mali-G720 MC12',
          'ARM Mali-G720-Immortalis MC12', 'ANGLE (ARM, Mali-G720 MC12, OpenGL ES 3.2)',
          'Mali G720', 'ARM Mali-G720 MC10'
        ],
        specs: {
          fp32Tflops: null, fp16Tflops: null, int8Tops: null,
          bandwidthGBs: null, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: null, busWidth: null,
          shaderUnits: null, baseClockMhz: null, boostClockMhz: null
        },
        note: '5th Gen 架构，配置灵活（MC7–MC12 常见）；频率与内存带宽取决于 SoC，无法给出统一理论峰值。'
      },

      {
        id: 'arm-mali-g715',
        vendor: 'ARM', name: 'Arm Mali-G715', family: 'Arm Mali (Valhall 5th gen)',
        type: 'mobile-soc', year: 2022, api: 'vulkan',
        aliases: [
          'Mali-G715', 'Arm Mali-G715', 'Mali-G715 MC7',
          'Mali-G715 MC10', 'ANGLE (ARM, Mali-G715 MC7, OpenGL ES 3.2)',
          'Mali G715', 'ARM Mali-G715 MC7'
        ],
        specs: {
          fp32Tflops: null, fp16Tflops: null, int8Tops: null,
          bandwidthGBs: null, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: null, busWidth: null,
          shaderUnits: null, baseClockMhz: null, boostClockMhz: null
        },
        note: '第五代 Valhall 中端 GPU（典型 MC7–MC10，无硬件光追）；参数随 SoC 变化，理论峰值填 null。'
      },

      {
        id: 'apple-a17-pro',
        vendor: 'Apple', name: 'Apple A17 Pro GPU', family: 'Apple A17 Pro',
        type: 'mobile-soc', year: 2023, api: 'metal',
        aliases: [
          'Apple A17 Pro', 'A17 Pro', 'Apple A17 Pro GPU', 'Apple GPU (A17 Pro)',
          'Apple A17 Pro 6-Core GPU', 'A17 Pro GPU', 'Apple A17'
        ],
        specs: {
          fp32Tflops: 2.15, fp16Tflops: 2.15, int8Tops: null,
          bandwidthGBs: 51.2, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 64,
          shaderUnits: 768, baseClockMhz: null, boostClockMhz: 1398
        },
        note: '6 核 GPU（768 ALU），首次支持硬件光追；统一内存 LPDDR5-6400，64-bit（51.2 GB/s）。iPhone 15 Pro / Pro Max。'
      },

      {
        id: 'apple-a16',
        vendor: 'Apple', name: 'Apple A16 Bionic GPU', family: 'Apple A16',
        type: 'mobile-soc', year: 2022, api: 'metal',
        aliases: [
          'Apple A16', 'A16 Bionic', 'Apple A16 Bionic GPU', 'Apple GPU (A16)',
          'Apple A16 Bionic 5-Core GPU', 'A16 GPU', 'Apple A16 GPU'
        ],
        specs: {
          fp32Tflops: 1.79, fp16Tflops: 1.79, int8Tops: null,
          bandwidthGBs: 51.2, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 64,
          shaderUnits: 640, baseClockMhz: null, boostClockMhz: 1398
        },
        note: '5 核 GPU（640 ALU）；统一内存 LPDDR5-6400，64-bit（51.2 GB/s）。iPhone 14 Pro / 15 / 15 Plus。'
      },

      {
        id: 'apple-a15',
        vendor: 'Apple', name: 'Apple A15 Bionic GPU', family: 'Apple A15',
        type: 'mobile-soc', year: 2021, api: 'metal',
        aliases: [
          'Apple A15', 'A15 Bionic', 'Apple A15 Bionic GPU', 'Apple GPU (A15)',
          'Apple A15 Bionic 5-Core GPU', 'Apple A15 Bionic 4-Core GPU', 'A15 GPU'
        ],
        specs: {
          fp32Tflops: 1.71, fp16Tflops: 1.71, int8Tops: null,
          bandwidthGBs: 34.1, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: 64,
          shaderUnits: 640, baseClockMhz: null, boostClockMhz: 1338
        },
        note: '5 核 GPU（iPhone 13 Pro / 14 与 iPad mini 6 满血；iPhone 13/13 mini 为 4 核，640→512 ALU）；LPDDR4X-4266 64-bit（34.1 GB/s）。'
      },

      {
        id: 'samsung-xclipse-920',
        vendor: 'Samsung', name: 'Samsung Xclipse 920', family: 'Samsung Xclipse (RDNA 2)',
        type: 'mobile-soc', year: 2022, api: 'vulkan',
        aliases: [
          'Xclipse 920', 'Samsung Xclipse 920', 'Xclipse920', 'xclipse 920',
          'ANGLE (Samsung, Xclipse 920, OpenGL ES 3.2)',
          'Samsung Xclipse 920 GPU', 'Exynos 2200', 'Samsung Exynos 2200'
        ],
        specs: {
          fp32Tflops: 1, fp16Tflops: 1, int8Tops: null,
          bandwidthGBs: 51.2, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 64,
          shaderUnits: 384, gpuCores: 6, baseClockMhz: null, boostClockMhz: 1300
        },
        note: 'Exynos 2200（Galaxy S22 系列部分市场）；AMD RDNA 2 架构授权，3 WGP / 6 CU / 384 流处理器，手机端首次支持硬件光追；' +
          'LPDDR5-6400（51.2 GB/s）；ROP/TMU 未公布；「FP32 为推算值：384 SP × 2 FLOP/时钟 × 1300 MHz = 1.00 TFLOPS' +
          '（RDNA 口径：每 CU 64 SP，FMA 记 2 FLOP；gpuCores 记 CU 数；厂商未公布，仅供横向参照）；FP16 同速 = 1.00 TFLOPS」'
      },

      /* ==================================================================
       * 九、软件光栅化 / 虚拟 GPU（所有 specs 字段为 null）
       * ================================================================== */

      {
        id: 'google-swiftshader',
        vendor: 'Google', name: 'Google SwiftShader', family: 'SwiftShader',
        type: 'software', year: 2016, api: 'vulkan',
        aliases: [
          'SwiftShader', 'Google SwiftShader', 'Google SwiftShader Device (Subzero)',
          'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)',
          'ANGLE (Google, Vulkan 1.1.0 (SwiftShader Device (Standard) (0x0000C0DE)), SwiftShader driver)',
          'SwiftShader Device', 'llvmpipe (SwiftShader)'
        ],
        specs: {
          fp32Tflops: null, fp16Tflops: null, int8Tops: null,
          bandwidthGBs: null, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: null, busWidth: null,
          shaderUnits: null, baseClockMhz: null, boostClockMhz: null
        },
        note: 'CPU 软件光栅化后端，Chrome/Edge 在无硬件加速或 WebGPU 无适配器时回退使用；吞吐完全取决于 CPU 核心数与内存带宽，无 GPU 理论峰值。'
      },

      {
        id: 'mesa-llvmpipe',
        vendor: 'Other', name: 'Mesa llvmpipe', family: 'Mesa 软件光栅化',
        type: 'software', year: 2010, api: 'gl',
        aliases: [
          'llvmpipe', 'Mesa llvmpipe', 'llvmpipe (LLVM 15.0.7, 256 bits)',
          'ANGLE (Mesa, llvmpipe (LLVM 15.0.7 256 bits), OpenGL 4.5 (Core Profile) Mesa 23.0)',
          'Mesa DRI llvmpipe', 'llvmpipe (LLVM 17.0.6, 256 bits)', 'softpipe'
        ],
        specs: {
          fp32Tflops: null, fp16Tflops: null, int8Tops: null,
          bandwidthGBs: null, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: null, busWidth: null,
          shaderUnits: null, baseClockMhz: null, boostClockMhz: null
        },
        note: 'Mesa 的 LLVM JIT 软件光栅化器，常见于 Linux 无 GPU／虚拟机／远程会话；性能与 CPU 强相关，无固定理论峰值。'
      },

      {
        id: 'microsoft-basic-render-driver',
        vendor: 'Microsoft', name: 'Microsoft Basic Render Driver', family: 'WARP / 基本显示驱动',
        type: 'software', year: 2015, api: 'd3d12',
        aliases: [
          'Microsoft Basic Render Driver', 'Basic Render Driver',
          'Microsoft Basic Render Driver Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (Microsoft, Microsoft Basic Render Driver Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'Microsoft Basic Display Adapter', 'BasicDisplay', 'WARP'
        ],
        specs: {
          fp32Tflops: null, fp16Tflops: null, int8Tops: null,
          bandwidthGBs: null, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: null, busWidth: null,
          shaderUnits: null, baseClockMhz: null, boostClockMhz: null
        },
        note: 'Windows 在缺少显卡驱动（WARP 软件适配器或安全模式）时提供的基本渲染设备；成绩不代表任何 GPU 性能。'
      },

      {
        id: 'vmware-svga-3d',
        vendor: 'Other', name: 'VMware SVGA 3D', family: '虚拟化 GPU',
        type: 'software', year: 2014, api: 'd3d12',
        aliases: [
          'VMware SVGA 3D', 'VMware SVGA II', 'VMware SVGA 3D (Microsoft Corporation - WDDM)',
          'ANGLE (VMware, VMware SVGA 3D Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'VMware SVGA 3D Direct3D11 vs_5_0 ps_5_0', 'VMware, Inc.', 'svga3d'
        ],
        specs: {
          fp32Tflops: null, fp16Tflops: null, int8Tops: null,
          bandwidthGBs: null, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: null, busWidth: null,
          shaderUnits: null, baseClockMhz: null, boostClockMhz: null
        },
        note: 'VMware 虚拟机的半虚拟化显示设备（vGPU 直通时可能显示为宿主机 GPU）；无公开理论峰值。'
      },

      {
        id: 'parallels-display-adapter',
        vendor: 'Other', name: 'Parallels Display Adapter', family: '虚拟化 GPU',
        type: 'software', year: 2016, api: 'd3d12',
        aliases: [
          'Parallels Display Adapter', 'Parallels Display Adapter (WDDM)',
          'Parallels Display Adapter (WDDM) Direct3D11 vs_5_0 ps_5_0',
          'ANGLE (Parallels, Parallels Display Adapter (WDDM) Direct3D11 vs_5_0 ps_5_0, D3D11)',
          'Parallels Using Intel Iris Xe Graphics', 'Parallels Using Apple M1', 'Parallels'
        ],
        specs: {
          fp32Tflops: null, fp16Tflops: null, int8Tops: null,
          bandwidthGBs: null, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: null, busWidth: null,
          shaderUnits: null, baseClockMhz: null, boostClockMhz: null
        },
        note: 'Parallels Desktop 虚拟机显示适配器（Apple Silicon 上经 Metal 转译，Intel Mac 上经宿主 GPU）；吞吐受虚拟化层影响，无固定峰值。'
      }

    ],

    /* --------------------------------------------------------- fallbackClasses */
    /* 未能精确匹配型号时，按设备探测给出的 kinds 与渲染器关键字分档估算理论峰值。
     * 数组顺序：性能由高到低。assumedSpecs 为「档位代表值」，用于达成率分母。 */
    fallbackClasses: [
      {
        id: 'high-desktop',
        label: '高端桌面独显',
        level: 6,
        kinds: ['desktop-dgpu'],
        matchHints: ['rtx 50', 'rtx 40', 'rtx 3090', 'rtx 3080', 'rx 9', 'rx 7900', 'rx 7800', 'rx 6950', 'rx 6900', 'arc b580', 'arc a770'],
        assumedSpecs: {
          fp32Tflops: 40, fp16Tflops: 40, int8Tops: null, bandwidthGBs: 800, pixelRateGps: 280,
          texelRateGts: 700, triangleRateGts: null, vramGB: 16, memType: 'GDDR6',
          busWidth: 256, shaderUnits: null, baseClockMhz: null, boostClockMhz: null
        },
        note: '代表值约为 RTX 4080 / RX 7900 XT 量级；仅用于兜底估算，误差可能较大。'
      },
      {
        id: 'mid-desktop',
        label: '主流桌面独显',
        level: 5,
        kinds: ['desktop-dgpu'],
        matchHints: ['rtx 30', 'rtx 20', 'gtx 16', 'gtx 10', 'rx 6', 'rx 5', 'arc a580', 'arc a750', 'arc a380'],
        assumedSpecs: {
          fp32Tflops: 12, fp16Tflops: 12, int8Tops: null, bandwidthGBs: 360, pixelRateGps: 120,
          texelRateGts: 280, triangleRateGts: null, vramGB: 8, memType: 'GDDR6',
          busWidth: 192, shaderUnits: null, baseClockMhz: null, boostClockMhz: null
        },
        note: '代表值约为 RTX 3060 / RX 6600 XT 量级。'
      },
      {
        id: 'entry-desktop',
        label: '入门桌面独显',
        level: 3,
        kinds: ['desktop-dgpu'],
        matchHints: ['gt 1030', 'gt 730', 'gt 710', 'rx 550', 'rx 6400', 'arc a310', 'geforce mx'],
        assumedSpecs: {
          fp32Tflops: 3, fp16Tflops: 3, int8Tops: null, bandwidthGBs: 112, pixelRateGps: 45,
          texelRateGts: 70, triangleRateGts: null, vramGB: 4, memType: 'GDDR5',
          busWidth: 128, shaderUnits: null, baseClockMhz: null, boostClockMhz: null
        },
        note: '代表值约为 GTX 1050 Ti / GT 1030 量级。'
      },
      {
        id: 'high-laptop',
        label: '高端笔记本独显',
        level: 4,
        kinds: ['laptop-dgpu'],
        matchHints: ['laptop', 'mobile', 'max-q', 'notebook', 'rtx 40', 'rtx 30', 'rx 7'],
        assumedSpecs: {
          fp32Tflops: 15, fp16Tflops: 15, int8Tops: null, bandwidthGBs: 400, pixelRateGps: 130,
          texelRateGts: 280, triangleRateGts: null, vramGB: 8, memType: 'GDDR6',
          busWidth: 192, shaderUnits: null, baseClockMhz: null, boostClockMhz: null
        },
        note: '代表值约为 RTX 3070 Laptop / RTX 4060 Laptop 量级；笔记本功耗墙差异大，误差可达 ±40%。'
      },
      {
        id: 'integrated',
        label: '核显',
        level: 2,
        kinds: ['integrated'],
        matchHints: ['iris', 'uhd graphics', 'hd graphics', 'vega', 'radeon graphics', 'arc graphics', '680m', '780m', '880m', '890m', 'radeon 7', 'radeon 8'],
        assumedSpecs: {
          fp32Tflops: 2, fp16Tflops: 2, int8Tops: null, bandwidthGBs: 60, pixelRateGps: 16,
          texelRateGts: 60, triangleRateGts: null, vramGB: null, memType: 'DDR5',
          busWidth: 128, shaderUnits: null, baseClockMhz: null, boostClockMhz: null
        },
        note: '代表值约为 Iris Xe 96EU / Radeon 780M 中位量级；核显性能受内存通道数与频率影响极大。'
      },
      {
        id: 'mobile-soc',
        label: '移动 SoC',
        level: 2,
        kinds: ['mobile-soc', 'apple-soc'],
        matchHints: ['adreno', 'mali', 'immortalis', 'powervr', 'xclipse', 'apple a', 'apple m', 'apple gpu'],
        assumedSpecs: {
          fp32Tflops: 1.5, fp16Tflops: 1.5, int8Tops: null, bandwidthGBs: 51.2, pixelRateGps: null,
          texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR5',
          busWidth: 64, shaderUnits: null, baseClockMhz: null, boostClockMhz: null
        },
        note: '代表值约为 Adreno 730 / A15 量级；移动 GPU 的 ALU 与 ROP 数多不公开，像素/纹素率统一为 null。'
      },
      {
        id: 'tablet-soc',
        label: '平板 SoC',
        level: 2,
        kinds: ['tablet'],
        matchHints: ['apple m', 'apple gpu', 'adreno 7', 'immortalis', 'mali-g7'],
        assumedSpecs: {
          fp32Tflops: 2.0, fp16Tflops: 2.0, int8Tops: null, bandwidthGBs: 68.3, pixelRateGps: null,
          texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR5',
          busWidth: 128, shaderUnits: null, baseClockMhz: null, boostClockMhz: null
        },
        note: '平板档代表值；平板散热窗口比手机宽，同芯片实际表现通常略好。'
      },
      {
        id: 'software',
        label: '软件渲染 / 虚拟显卡',
        level: 1,
        kinds: ['software'],
        matchHints: ['swiftshader', 'llvmpipe', 'softpipe', 'basic render', 'basicrender', 'vmware', 'virtualbox', 'parallels', 'citrix', '软件'],
        assumedSpecs: {
          fp32Tflops: null, fp16Tflops: null, int8Tops: null, bandwidthGBs: null, pixelRateGps: null,
          texelRateGts: null, triangleRateGts: null, vramGB: null, memType: null,
          busWidth: null, shaderUnits: null, baseClockMhz: null, boostClockMhz: null
        },
        note: '软件光栅化或虚拟显卡，没有可对照的硬件规格；成绩只作流程验证，不代表任何真实 GPU。'
      }
    ],

    /* ---------------------------------------------------------- angleVendors */
    /* ANGLE 渲染器字符串里的厂商标识 → 本库 vendor 字段取值。
     * 用于把 'ANGLE (NVIDIA, ...)' 之类的字符串归一化到统一厂商名。 */
    angleVendors: {
      'NVIDIA': 'NVIDIA',
      'AMD': 'AMD',
      'Intel': 'Intel',
      'Apple': 'Apple',
      'Qualcomm': 'Qualcomm',
      'Mali': 'ARM',
      'Adreno': 'Qualcomm',
      'Imagination': 'Imagination',
      'Microsoft': 'Microsoft',
      'Google': 'Google',
      'Samsung': 'Samsung',
      'MediaTek': 'MediaTek',
      'Huawei': 'Other',
      'Maleoon': 'Other',
      'ARM': 'ARM'
    }

  };

  /* meta 自校验：条目数（便于控制台快速确认加载成功） */
  DB.meta.gpuCount = DB.gpus.length;
  DB.meta.fallbackClassCount = DB.fallbackClasses.length;

  global.NOVA_GPU_DB = DB;

  /* ==========================================================================
   * 合并各厂商分片（gpu-db-part-*.js）
   * 分片必须先于本文件加载，各自把数据 push 进 window.NOVA_GPU_DB_PARTS。
   * 这样扩充数据库时可以并行维护多个文件，不必改这个巨型字面量。
   * ========================================================================*/
  (function mergeParts(global) {
    var parts = global.NOVA_GPU_DB_PARTS || [];
    if (!parts.length) return;

    var seen = Object.create(null);
    var seenNames = Object.create(null);
    var i;
    function nameKey(g) {
      return String((g && g.name) || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
    }
    for (i = 0; i < DB.gpus.length; i++) {
      if (DB.gpus[i] && DB.gpus[i].id) seen[DB.gpus[i].id] = true;
      var nk0 = nameKey(DB.gpus[i]);
      if (nk0) seenNames[nk0] = DB.gpus[i].id || true;
    }

    function inferPlatform(g) {
      if (g.platform) return g.platform;
      var t = g.type || '';
      if (t === 'mobile-soc') return 'phone';
      if (t === 'laptop') return 'laptop';
      if (t === 'apple-soc') return /max|ultra|pro/i.test(g.name || '') ? 'laptop' : 'phone';
      if (t === 'tablet') return 'tablet';
      return 'desktop';
    }

    function inferOs(g) {
      if (g.os && g.os.length) return g.os;
      var t = g.type || '';
      if (t === 'mobile-soc') return ['android'];
      if (t === 'apple-soc') return ['macos', 'ios'];
      if (t === 'laptop') return ['windows', 'linux'];
      if (t === 'software') return ['windows', 'linux'];
      return ['windows', 'linux', 'macos'];
    }

    var added = 0, dup = 0, mergedByName = 0;
    for (var p = 0; p < parts.length; p++) {
      var list = parts[p].gpus || [];
      for (var k = 0; k < list.length; k++) {
        var g = list[k];
        if (!g || !g.id) continue;
        if (seen[g.id]) { dup++; continue; }

        // 同一款 GPU 在不同分片里可能用了不同 id（例如 Xclipse 920），
        // 这时把别名并入已有条目，而不是在榜单里出现两条一模一样的记录。
        var nk = nameKey(g);
        if (nk && seenNames[nk]) {
          var host = null;
          for (var q = 0; q < DB.gpus.length; q++) {
            if (DB.gpus[q].id === seenNames[nk]) { host = DB.gpus[q]; break; }
          }
          if (host) {
            host.aliases = host.aliases || [host.name];
            var incoming = g.aliases || [g.name];
            for (var ai = 0; ai < incoming.length; ai++) {
              if (incoming[ai] && host.aliases.indexOf(incoming[ai]) < 0) host.aliases.push(incoming[ai]);
            }
            mergedByName++;
          }
          seen[g.id] = true;
          continue;
        }
        seen[g.id] = true;
        if (nk) seenNames[nk] = g.id;

        // 补齐缺省字段，避免下游读到 undefined
        g.vendor = g.vendor || 'Other';
        g.type = g.type || 'unknown';
        g.platform = inferPlatform(g);
        g.apis = g.apis && g.apis.length ? g.apis : (g.api ? [g.api] : []);
        g.os = inferOs(g);
        if (g.unifiedMemory === undefined) {
          g.unifiedMemory = /integrated|apple-soc|mobile-soc|tablet/.test(g.type);
        }
        g.specs = g.specs || {};
        if (g.specs.gpuCores === undefined) g.specs.gpuCores = null;
        if (g.specs.int8Tops === undefined) g.specs.int8Tops = null;
        if (g.specs.triangleRateGts === undefined) g.specs.triangleRateGts = null;
        if (g.aliases === undefined) g.aliases = [g.name];

        // 口径统一：Intel 分片里的 shaderUnits 记的是 EU 数，
        // 而主库 Intel 条目记的是 ALU 数（EU × 8）。统一成 ALU，避免下游误读。
        if (g.vendor === 'Intel' && parts[p].source === 'intel-apple-qualcomm' &&
            g.specs.shaderUnits && g.specs.shaderUnits <= 1024 && /EU/i.test(g.note || '')) {
          g.specs.shaderUnits = g.specs.shaderUnits * 8;
          g.note = (g.note ? g.note + ' ' : '') + '（shaderUnits 已按 EU×8 折算为 ALU 数，与主库口径一致）';
        }

        DB.gpus.push(g);
        added++;
      }
    }

    DB.meta.parts = parts.map(function (pp) {
      return { source: pp.source || 'unknown', count: (pp.gpus || []).length };
    });
    DB.meta.addedFromParts = added;
    DB.meta.skippedDuplicates = dup;
    DB.meta.mergedByName = mergedByName;
    DB.meta.gpuCount = DB.gpus.length;
    DB.meta.mergedAt = '2026-10';
  })(global);

})(typeof window !== 'undefined' ? window : this);
