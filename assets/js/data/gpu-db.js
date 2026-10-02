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
        'https://en.wikipedia.org/wiki/List_of_Nvidia_graphics_processing_units'
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
          bandwidthGBs: 1792, pixelRateGps: 392.2, texelRateGts: 1568.8,
          triangleRateGts: null, vramGB: 32, memType: 'GDDR7', busWidth: 512,
          shaderUnits: 21760, baseClockMhz: 2017, boostClockMhz: 2407
        },
        note: 'GB202 满血核心（21760 CUDA / 680 TMU / 176 ROP），512-bit GDDR7 32 Gbps，575W TGP。'
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
          bandwidthGBs: 960, pixelRateGps: 336.6, texelRateGts: 1009.7,
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
          bandwidthGBs: 896, pixelRateGps: 313.9, texelRateGts: 878.9,
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
          bandwidthGBs: 672, pixelRateGps: 200.9, texelRateGts: 642.9,
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
          bandwidthGBs: 448, pixelRateGps: 119.9, texelRateGts: 359.6,
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
          bandwidthGBs: 288, pixelRateGps: 121.4, texelRateGts: 364.1,
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
          bandwidthGBs: 272, pixelRateGps: 94.4, texelRateGts: 236.2,
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
          bandwidthGBs: 224, pixelRateGps: 49.7, texelRateGts: 142,
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
          bandwidthGBs: 256.3, pixelRateGps: 96.4, texelRateGts: 180.7,
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
          bandwidthGBs: 48, pixelRateGps: 22.0, texelRateGts: 35.2,
          triangleRateGts: null, vramGB: 2, memType: 'GDDR5', busWidth: 64,
          shaderUnits: 384, baseClockMhz: 1228, boostClockMhz: 1468
        },
        note: 'GP108（384 CUDA / 24 TMU / 16 ROP），64-bit GDDR5 6 Gbps，30W TDP；另有 DDR4 版（16.8 GB/s）。'
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
          bandwidthGBs: 576, pixelRateGps: 161.1, texelRateGts: 419.1,
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
          bandwidthGBs: 432, pixelRateGps: 130.3, texelRateGts: 326.4,
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
          bandwidthGBs: 256, pixelRateGps: 92.2, texelRateGts: 230.4,
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
          bandwidthGBs: 256, pixelRateGps: 75.8, texelRateGts: 227.5,
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
          bandwidthGBs: 448, pixelRateGps: 130.3, texelRateGts: 260.6,
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
          bandwidthGBs: 448, pixelRateGps: 124.8, texelRateGts: 249.6,
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
          bandwidthGBs: 336, pixelRateGps: 86.4, texelRateGts: 172.8,
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
          bandwidthGBs: 192, pixelRateGps: 58.3, texelRateGts: 116.6,
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
          bandwidthGBs: 128, pixelRateGps: 53.3, texelRateGts: 93.2,
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
          bandwidthGBs: 80, pixelRateGps: 25.0, texelRateGts: 50.1,
          triangleRateGts: null, vramGB: 2, memType: 'GDDR6', busWidth: 64,
          shaderUnits: 896, baseClockMhz: null, boostClockMhz: 1695
        },
        note: 'TU117 低功耗版（896 CUDA），64-bit 显存；按版本分 12W / 25W / 28.5W，GDDR6 为 80 GB/s，GDDR5 为 64 GB/s。'
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
          bandwidthGBs: 800, pixelRateGps: 381.6, texelRateGts: 763.2,
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
          bandwidthGBs: 432, pixelRateGps: 220.3, texelRateGts: 550.8,
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
          bandwidthGBs: 224, pixelRateGps: 99.8, texelRateGts: 279.3,
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
          fp32Tflops: 5.94, fp16Tflops: 5.94, int8Tops: null,
          bandwidthGBs: 128, pixelRateGps: 46.4, texelRateGts: 92.8,
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
          fp32Tflops: 4.45, fp16Tflops: 4.45, int8Tops: null,
          bandwidthGBs: 120, pixelRateGps: 34.8, texelRateGts: 69.6,
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
          fp32Tflops: 4.15, fp16Tflops: 4.15, int8Tops: null,
          bandwidthGBs: 89.6, pixelRateGps: 25, texelRateGts: 50,
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
          fp32Tflops: 3.69, fp16Tflops: 3.69, int8Tops: null,
          bandwidthGBs: 89.6, pixelRateGps: 22.6, texelRateGts: 45.1,
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
          bandwidthGBs: 76.8, pixelRateGps: 25.6, texelRateGts: 51.2,
          triangleRateGts: null, vramGB: null, memType: 'DDR5', busWidth: 128,
          shaderUnits: 768, baseClockMhz: null, boostClockMhz: 2400
        },
        note: 'RDNA 2 核显，12 CU / 768 SP，共享 DDR5-4800 / LPDDR5-6400 双通道。'
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
          bandwidthGBs: 38.4, pixelRateGps: 8, texelRateGts: 32,
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
          fp32Tflops: 2.2, fp16Tflops: 2.2, int8Tops: null,
          bandwidthGBs: 43.7, pixelRateGps: 8, texelRateGts: 32,
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
          fp32Tflops: 4.92, fp16Tflops: 4.92, int8Tops: null,
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
          bandwidthGBs: 136, pixelRateGps: 16, texelRateGts: 128,
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
          bandwidthGBs: 120, pixelRateGps: 16, texelRateGts: 128,
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
          bandwidthGBs: 68, pixelRateGps: 16.8, texelRateGts: 67.2,
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
          bandwidthGBs: 68, pixelRateGps: 16.8, texelRateGts: 67.2,
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
          bandwidthGBs: 41.6, pixelRateGps: 9, texelRateGts: 36,
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
          bandwidthGBs: 34.1, pixelRateGps: 9, texelRateGts: 36,
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
          bandwidthGBs: 34.1, pixelRateGps: 6.9, texelRateGts: 27.6,
          triangleRateGts: null, vramGB: null, memType: 'DDR4', busWidth: 128,
          shaderUnits: 192, baseClockMhz: 350, boostClockMhz: 1150
        },
        note: 'Gen9 GT2，24 EU / 192 ALU；共享 DDR4-2133 双通道（约 34.1 GB/s），另有 DDR3L 版本。'
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
          fp32Tflops: 0.5, fp16Tflops: 1, int8Tops: null,
          bandwidthGBs: 51.2, pixelRateGps: null, texelRateGts: null,
          triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 64,
          shaderUnits: 384, gpuCores: 3, baseClockMhz: null, boostClockMhz: 1300
        },
        note: 'Exynos 2200（Galaxy S22 系列部分市场）；AMD RDNA 2 架构授权，3 CU / 384 ALU，手机端首次支持硬件光追；' +
          'LPDDR5-6400（51.2 GB/s）；ROP/TMU 未公布；「FP32 为推算值：3 CU × 128 FLOP/CU/时钟 × 1300 MHz = 0.50 TFLOPS' +
          '（RDNA 口径：每 CU 64 FP32 FMA/时钟记 128 FLOP，gpuCores 记 CU 数；厂商未公布，仅供横向参照）；FP16 按 2× 打包口径 = 1.00 TFLOPS」'
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
