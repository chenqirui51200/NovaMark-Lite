/* ============================================================================
 * NovaMark 浏览器端 GPU 参考规格数据库 —— 分片：移动端
 * （ARM Mali / Immortalis · 华为 Maleoon 与麒麟 · 三星 Xclipse · Imagination PowerVR · MediaTek）
 * ----------------------------------------------------------------------------
 * 形式：经典脚本（无 import / export），不访问 DOM，不写 window.NOVA_GPU_DB。
 *       仅向 window.NOVA_GPU_DB_PARTS 追加一个分片对象，由聚合器合并。
 *
 * 单位约定：
 *   fp32Tflops / fp16Tflops : TFLOPS (10^12 FLOP/s)，fp16 为打包 2x 的向量速率口径
 *                             （统一推算口径见下方「数据原则 1」，逐条依据写在各自 note 里）
 *   bandwidthGBs            : GB/s  (10^9 字节/s) = 内存速率(MT/s) x 位宽(bit) / 8
 *   pixelRateGps / texelRateGts / triangleRateGts
 *                           : 移动端厂商一律不公布 ROP / TMU / 三角形吞吐 → 统一 null
 *   vramGB                  : 移动端均为统一内存 → 统一 null，内存档位写进 note
 *   gpuCores                : Mali 的 MC / MP 核心数（Adreno、华为不公开 → null）
 *                             Xclipse 条目记 CU 数（推算口径见下）
 *
 * 数据原则（与 gpu-db.js 保持一致：不确定就 null，绝不编造）：
 *   1) FP32 峰值统一按可审计公式推算，且仅当 gpuCores 与 boostClockMhz 都已知时才填：
 *        fp32Tflops = gpuCores x FLOP_per_core_per_clock x boostClockMhz / 1e6（保留两位小数）
 *      FLOP_per_core_per_clock 取值（每时钟每核心的 FP32 FLOP 数）：
 *        · Bifrost / Valhall / Immortalis（Mali-G71 及之后，含 G31/G51/G52/G57/G76/G78/
 *          G310/G510/G610/G710/G715/G720/G925 与 Immortalis 全系）= 64
 *          （ARM 文档化：每核心 32 个 FP32 FMA 通道 x 2 FLOP）
 *        · Midgard（Mali-T720/T760/T830/T860/T880）= 32（16-wide 向量 + 标量单元，保守口径）
 *        · IMG PowerVR（Rogue / Series8XT / BXM / BXT / CXT / DXT）= 64
 *        · 三星 Xclipse（RDNA）= 128，即每 CU 64 FP32 FMA/时钟；该类条目 gpuCores 记 CU 数
 *        · 华为 Maleoon = 无公开口径，不推算，保持 null
 *      fp16Tflops = fp32Tflops x 2（打包 2x FP16 口径）；Midgard 按 1x（与 FP32 同速）。
 *      说明：这些是**推算值**而非厂商公布值，仅供横向参照；每条 note 末尾都写明算式与口径，
 *      可逐条复核。第三方对同一颗 Mali 的口径差异极大（Immortalis-G715 MC11 从 0.7 到 2.4
 *      TFLOPS 都有），本库统一采用上表公式，不混用来源，因此不要再混入外部数字。
 *      若 gpuCores 或频率任一未知，则 fp32/fp16 保持 null 并在 note 写明原因。
 *   2) bandwidthGBs 只在「内存类型 + 速率 + 位宽」三者都确定时填写，否则 null。
 *   3) boostClockMhz 只在 SoC 资料口径较一致时填写，否则 null。
 *   4) aliases 覆盖真实渲染器字符串的各种写法：带/不带空格、大小写、ARM 前缀、
 *      Mali-xxx-Immortalis、ANGLE (厂商标识, 型号, OpenGL ES 3.2) 外壳。
 *
 * 排序：按厂商分组（ARM → 华为 → 三星 → Imagination → MediaTek），组内新 → 旧。
 * ==========================================================================*/
window.NOVA_GPU_DB_PARTS = window.NOVA_GPU_DB_PARTS || [];
window.NOVA_GPU_DB_PARTS.push({
  source: 'mobile',
  updated: '2026-10',
  gpus: [

    /* ==================================================================
     * 一、ARM Immortalis / Mali —— 第五代 Valhall（2022 - 2024）
     * ================================================================== */

    {
      id: 'arm-immortalis-g925-mc16', vendor: 'ARM', name: 'Immortalis-G925 MC16', family: 'Immortalis-G9',
      type: 'mobile-soc', platform: 'phone', year: 2024, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Immortalis-G925 MC16', 'Mali-G925 MC16', 'Mali-G925-Immortalis MC16', 'ARM Mali-G925 MC16', 'Immortalis-G925MC16', 'mali-g925', 'Immortalis-G925', 'ANGLE (ARM, Mali-G925-Immortalis MC16, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: 85.3, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR5X', busWidth: 64, shaderUnits: null, gpuCores: 16, baseClockMhz: null, boostClockMhz: null },
      note: 'ARM 旗舰 16 核配置（天玑 9400 系列高配 / 9500 系列）；统一内存 LPDDR5X-10667 四通道（85.3 GB/s）；「GPU 频率无可靠公开口径（核心数 16 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-immortalis-g925-mc12', vendor: 'ARM', name: 'Immortalis-G925 MC12', family: 'Immortalis-G9',
      type: 'mobile-soc', platform: 'phone', year: 2024, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Immortalis-G925 MC12', 'Mali-G925 MC12', 'Mali-G925-Immortalis MC12', 'ARM Mali-G925 MC12', 'Immortalis-G925MC12', 'mali-g925mc12', 'Immortalis-G925', 'ANGLE (ARM, Mali-G925-Immortalis MC12, OpenGL ES 3.2)', '天玑 9400'],
      specs: { fp32Tflops: 1, fp16Tflops: 2, bandwidthGBs: 85.3, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR5X', busWidth: 64, shaderUnits: null, gpuCores: 12, baseClockMhz: null, boostClockMhz: 1300 },
      note: '联发科 天玑 9400 / 9400+；统一内存 LPDDR5X-10667 四通道（85.3 GB/s）；频率为公开资料典型峰值；「FP32 为推算值：12 核心 × 64 FLOP/核心/时钟 × 1300 MHz = 1.00 TFLOPS（Bifrost/Valhall 口径，厂商未公布，仅供横向参照）；FP16 按 2× 打包口径 = 2.00 TFLOPS」'
    },
    {
      id: 'arm-immortalis-g720-mc12', vendor: 'ARM', name: 'Immortalis-G720 MC12', family: 'Immortalis-G7',
      type: 'mobile-soc', platform: 'phone', year: 2023, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Immortalis-G720 MC12', 'Mali-G720 MC12', 'Mali-G720-Immortalis MC12', 'ARM Mali-G720 MC12', 'Mali-G720MC12', 'mali-g720', 'Immortalis-G720', 'ANGLE (ARM, Mali-G720-Immortalis MC12, OpenGL ES 3.2)', '天玑 9300'],
      specs: { fp32Tflops: 1, fp16Tflops: 2, bandwidthGBs: 76.8, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR5T', busWidth: 64, shaderUnits: null, gpuCores: 12, baseClockMhz: null, boostClockMhz: 1300 },
      note: '联发科 天玑 9300 / 9300+；统一内存 LPDDR5T-9600 四通道（76.8 GB/s）；硬件光追；「FP32 为推算值：12 核心 × 64 FLOP/核心/时钟 × 1300 MHz = 1.00 TFLOPS（Bifrost/Valhall 口径，厂商未公布，仅供横向参照）；FP16 按 2× 打包口径 = 2.00 TFLOPS」'
    },
    {
      id: 'arm-immortalis-g720-mc10', vendor: 'ARM', name: 'Immortalis-G720 MC10', family: 'Immortalis-G7',
      type: 'mobile-soc', platform: 'phone', year: 2023, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Immortalis-G720 MC10', 'Mali-G720 MC10', 'Mali-G720-Immortalis MC10', 'ARM Mali-G720 MC10', 'Mali-G720MC10', 'mali-g720mc10', 'ARM Mali-G720 MC10', 'ANGLE (ARM, Mali-G720 MC10, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: null, busWidth: null, shaderUnits: null, gpuCores: 10, baseClockMhz: null, boostClockMhz: null },
      note: '十核 Mali-G720 配置（天玑 9300 系列降配机型 / 平板 SoC）；内存与频率随机型变化，带宽填 null；「GPU 频率无可靠公开口径（核心数 10 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g715-mc11', vendor: 'ARM', name: 'Mali-G715 MC11', family: 'Mali-G7',
      type: 'mobile-soc', platform: 'phone', year: 2022, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G715', 'Mali-G715 MC11', 'Mali-G715-Immortalis MC11', 'ARM Mali-G715', 'ANGLE (ARM, Mali-G715, OpenGL ES 3.2)', 'Mali-G715MC11', 'mali-g715', 'Immortalis-G715 MC11', 'Mali G715 MC11'],
      specs: { fp32Tflops: 0.7, fp16Tflops: 1.4, bandwidthGBs: 68.3, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR5X', busWidth: 64, shaderUnits: null, gpuCores: 11, baseClockMhz: null, boostClockMhz: 1000 },
      note: '天玑 9200 / 9200+；统一内存 LPDDR5X-8533 四通道（68.3 GB/s）；「FP32 为推算值：11 核心 × 64 FLOP/核心/时钟 × 1000 MHz = 0.70 TFLOPS（Bifrost/Valhall 口径，厂商未公布，仅供横向参照）；FP16 按 2× 打包口径 = 1.40 TFLOPS」'
    },
    {
      id: 'arm-mali-g715-mc10', vendor: 'ARM', name: 'Mali-G715 MC10', family: 'Mali-G7',
      type: 'mobile-soc', platform: 'phone', year: 2022, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G715 MC10', 'Mali-G715-Immortalis MC10', 'ARM Mali-G715 MC10', 'Mali-G715MC10', 'mali-g715mc10', 'Immortalis-G715 MC10', 'ANGLE (ARM, Mali-G715 MC10, OpenGL ES 3.2)', 'Google Tensor G3', 'Google Tensor G4'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: 68.3, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR5X', busWidth: 64, shaderUnits: null, gpuCores: 10, baseClockMhz: null, boostClockMhz: null },
      note: 'Google Tensor G3 / G4 采用十核 Mali-G715（Pixel 8 / 9 系列）；统一内存 LPDDR5X-8533（68.3 GB/s）；「GPU 频率无可靠公开口径（核心数 10 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },

    /* ==================================================================
     * 二、ARM Mali-G7 系（Valhall / Bifrost，2016 - 2021）
     * ================================================================== */

    {
      id: 'arm-mali-g78-mp24', vendor: 'ARM', name: 'Mali-G78 MP24', family: 'Mali-G78',
      type: 'mobile-soc', platform: 'phone', year: 2020, api: 'gles', apis: ['gles', 'vulkan'], os: ['android', 'harmonyos'], unifiedMemory: true,
      aliases: ['Mali-G78 MP24', 'Mali-G78MP24', 'ARM Mali-G78 MP24', 'mali-g78 mp24', 'Mali-G78', 'ANGLE (ARM, Mali-G78 MP24, OpenGL ES 3.2)', 'Kirin 9000', 'HUAWEI Kirin 9000'],
      specs: { fp32Tflops: 1.15, fp16Tflops: 2.3, bandwidthGBs: 44.0, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 64, shaderUnits: null, gpuCores: 24, baseClockMhz: null, boostClockMhz: 750 },
      note: '麒麟 9000（Mate 40 / P40 系列）；LPDDR5-5500 或 LPDDR4X-4266（44.0 GB/s）；「FP32 为推算值：24 核心 × 64 FLOP/核心/时钟 × 750 MHz = 1.15 TFLOPS（Bifrost/Valhall 口径，厂商未公布，仅供横向参照）；FP16 按 2× 打包口径 = 2.30 TFLOPS」'
    },
    {
      id: 'arm-mali-g78-mp22', vendor: 'ARM', name: 'Mali-G78 MP22', family: 'Mali-G78',
      type: 'mobile-soc', platform: 'phone', year: 2020, api: 'gles', apis: ['gles', 'vulkan'], os: ['android', 'harmonyos'], unifiedMemory: true,
      aliases: ['Mali-G78 MP22', 'Mali-G78MP22', 'ARM Mali-G78 MP22', 'mali-g78 mp22', 'ANGLE (ARM, Mali-G78 MP22, OpenGL ES 3.2)', 'Kirin 9000E', 'HUAWEI Kirin 9000E'],
      specs: { fp32Tflops: 1.06, fp16Tflops: 2.12, bandwidthGBs: 44.0, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 64, shaderUnits: null, gpuCores: 22, baseClockMhz: null, boostClockMhz: 750 },
      note: '麒麟 9000E（Mate 40 标准版 / MatePad Pro 12.6）；LPDDR5-5500（44.0 GB/s）；「FP32 为推算值：22 核心 × 64 FLOP/核心/时钟 × 750 MHz = 1.06 TFLOPS（Bifrost/Valhall 口径，厂商未公布，仅供横向参照）；FP16 按 2× 打包口径 = 2.12 TFLOPS」'
    },
    {
      id: 'arm-mali-g78-mp20', vendor: 'ARM', name: 'Mali-G78 MP20', family: 'Mali-G78',
      type: 'mobile-soc', platform: 'phone', year: 2021, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G78 MP20', 'Mali-G78MP20', 'ARM Mali-G78 MP20', 'mali-g78 mp20', 'ANGLE (ARM, Mali-G78 MP20, OpenGL ES 3.2)', 'Google Tensor', 'Google Tensor G1'],
      specs: { fp32Tflops: 1.09, fp16Tflops: 2.18, bandwidthGBs: 51.2, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 64, shaderUnits: null, gpuCores: 20, baseClockMhz: null, boostClockMhz: 850 },
      note: 'Google Tensor G1（Pixel 6 / 6 Pro）；统一内存 LPDDR5-6400 四通道（51.2 GB/s）；「FP32 为推算值：20 核心 × 64 FLOP/核心/时钟 × 850 MHz = 1.09 TFLOPS（Bifrost/Valhall 口径，厂商未公布，仅供横向参照）；FP16 按 2× 打包口径 = 2.18 TFLOPS」'
    },
    {
      id: 'arm-mali-g78-mp18', vendor: 'ARM', name: 'Mali-G78 MP18', family: 'Mali-G78',
      type: 'mobile-soc', platform: 'phone', year: 2020, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G78 MP18', 'Mali-G78MP18', 'ARM Mali-G78 MP18', 'mali-g78 mp18', 'ANGLE (ARM, Mali-G78 MP18, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: null, busWidth: null, shaderUnits: null, gpuCores: 18, baseClockMhz: null, boostClockMhz: null },
      note: 'Mali-G78 MP18 配置（部分平板 / 定制 SoC）；核心数与频率由 SoC 厂商决定，带宽填 null；「GPU 频率无可靠公开口径（核心数 18 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g78-mp14', vendor: 'ARM', name: 'Mali-G78 MP14', family: 'Mali-G78',
      type: 'mobile-soc', platform: 'phone', year: 2021, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G78 MP14', 'Mali-G78MP14', 'ARM Mali-G78 MP14', 'mali-g78 mp14', 'ANGLE (ARM, Mali-G78 MP14, OpenGL ES 3.2)', 'Exynos 2100', 'Samsung Exynos 2100'],
      specs: { fp32Tflops: 0.72, fp16Tflops: 1.44, bandwidthGBs: 51.2, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 64, shaderUnits: null, gpuCores: 14, baseClockMhz: null, boostClockMhz: 800 },
      note: '三星 Exynos 2100（Galaxy S21 系列，部分市场）；LPDDR5-6400（51.2 GB/s）；「FP32 为推算值：14 核心 × 64 FLOP/核心/时钟 × 800 MHz = 0.72 TFLOPS（Bifrost/Valhall 口径，厂商未公布，仅供横向参照）；FP16 按 2× 打包口径 = 1.44 TFLOPS」'
    },
    {
      id: 'arm-mali-g78-mp12', vendor: 'ARM', name: 'Mali-G78 MP12', family: 'Mali-G78',
      type: 'mobile-soc', platform: 'phone', year: 2020, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G78 MP12', 'Mali-G78MP12', 'ARM Mali-G78 MP12', 'mali-g78 mp12', 'ANGLE (ARM, Mali-G78 MP12, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: null, busWidth: null, shaderUnits: null, gpuCores: 12, baseClockMhz: null, boostClockMhz: null },
      note: 'Mali-G78 MP12 中配（部分中高端 SoC / 平板）；内存与频率口径不一致，带宽填 null；「GPU 频率无可靠公开口径（核心数 12 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g78-mp10', vendor: 'ARM', name: 'Mali-G78 MP10', family: 'Mali-G78',
      type: 'mobile-soc', platform: 'phone', year: 2020, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G78 MP10', 'Mali-G78MP10', 'ARM Mali-G78 MP10', 'mali-g78 mp10', 'ANGLE (ARM, Mali-G78 MP10, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: null, busWidth: null, shaderUnits: null, gpuCores: 10, baseClockMhz: null, boostClockMhz: null },
      note: 'Mali-G78 MP10 低配（中端 / 平板 SoC）；无公开内存与频率口径，带宽填 null；「GPU 频率无可靠公开口径（核心数 10 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g77-mp11', vendor: 'ARM', name: 'Mali-G77 MP11', family: 'Mali-G77',
      type: 'mobile-soc', platform: 'phone', year: 2020, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G77 MP11', 'Mali-G77MP11', 'ARM Mali-G77 MP11', 'mali-g77', 'Mali-G77', 'ANGLE (ARM, Mali-G77 MP11, OpenGL ES 3.2)', 'Exynos 990', 'Samsung Exynos 990'],
      specs: { fp32Tflops: 0.56, fp16Tflops: 1.12, bandwidthGBs: 44.0, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 64, shaderUnits: null, gpuCores: 11, baseClockMhz: null, boostClockMhz: 800 },
      note: '三星 Exynos 990（Galaxy S20 / Note 20）；LPDDR5-5500（44.0 GB/s）；ARM 不公布 ROP/TMU，像素率与纹素率恒为 null；「FP32 为推算值：11 核心 × 64 FLOP/核心/时钟 × 800 MHz = 0.56 TFLOPS（Bifrost/Valhall 口径，厂商未公布，仅供横向参照）；FP16 按 2× 打包口径 = 1.12 TFLOPS」'
    },
    {
      id: 'arm-mali-g77-mp9', vendor: 'ARM', name: 'Mali-G77 MP9', family: 'Mali-G77',
      type: 'mobile-soc', platform: 'phone', year: 2020, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G77 MP9', 'Mali-G77MP9', 'ARM Mali-G77 MP9', 'mali-g77 mp9', 'ANGLE (ARM, Mali-G77 MP9, OpenGL ES 3.2)', '天玑 1000', '天玑 1200'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: 34.1, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: 64, shaderUnits: null, gpuCores: 9, baseClockMhz: null, boostClockMhz: null },
      note: '联发科 天玑 1000 / 1100 / 1200；LPDDR4X-4266 四通道（34.1 GB/s）；「GPU 频率无可靠公开口径（核心数 9 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g77-mp8', vendor: 'ARM', name: 'Mali-G77 MP8', family: 'Mali-G77',
      type: 'mobile-soc', platform: 'phone', year: 2020, api: 'gles', apis: ['gles', 'vulkan'], os: ['android', 'harmonyos'], unifiedMemory: true,
      aliases: ['Mali-G77 MP8', 'Mali-G77MP8', 'ARM Mali-G77 MP8', 'mali-g77 mp8', 'ANGLE (ARM, Mali-G77 MP8, OpenGL ES 3.2)', 'Kirin 985', 'HUAWEI Kirin 985'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: 34.1, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: 64, shaderUnits: null, gpuCores: 8, baseClockMhz: null, boostClockMhz: null },
      note: '麒麟 985（nova 7 系列 / 荣耀 30）；Mali-G77 八核配置，LPDDR4X-4266（34.1 GB/s）；「GPU 频率无可靠公开口径（核心数 8 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g76-mp16', vendor: 'ARM', name: 'Mali-G76 MP16', family: 'Mali-G76',
      type: 'mobile-soc', platform: 'phone', year: 2019, api: 'gles', apis: ['gles', 'vulkan'], os: ['android', 'harmonyos'], unifiedMemory: true,
      aliases: ['Mali-G76 MP16', 'Mali-G76MP16', 'ARM Mali-G76 MP16', 'mali-g76', 'Mali-G76', 'ANGLE (ARM, Mali-G76 MP16, OpenGL ES 3.2)', 'Kirin 990', 'HUAWEI Kirin 990 5G'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: 34.1, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: 64, shaderUnits: null, gpuCores: 16, baseClockMhz: null, boostClockMhz: null },
      note: '麒麟 990 / 990 5G（Mate 30 / P40 系列）；LPDDR4X-4266（34.1 GB/s）；「GPU 频率无可靠公开口径（核心数 16 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g76-mp12', vendor: 'ARM', name: 'Mali-G76 MP12', family: 'Mali-G76',
      type: 'mobile-soc', platform: 'phone', year: 2019, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G76 MP12', 'Mali-G76MP12', 'ARM Mali-G76 MP12', 'mali-g76 mp12', 'ANGLE (ARM, Mali-G76 MP12, OpenGL ES 3.2)', 'Exynos 9820', 'Exynos 9825'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: 34.1, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: 64, shaderUnits: null, gpuCores: 12, baseClockMhz: null, boostClockMhz: null },
      note: '三星 Exynos 9820 / 9825（Galaxy S10 / Note 10）；LPDDR4X-4266（34.1 GB/s）；「GPU 频率无可靠公开口径（核心数 12 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g76-mp10', vendor: 'ARM', name: 'Mali-G76 MP10', family: 'Mali-G76',
      type: 'mobile-soc', platform: 'phone', year: 2018, api: 'gles', apis: ['gles', 'vulkan'], os: ['android', 'harmonyos'], unifiedMemory: true,
      aliases: ['Mali-G76 MP10', 'Mali-G76MP10', 'ARM Mali-G76 MP10', 'mali-g76 mp10', 'ANGLE (ARM, Mali-G76 MP10, OpenGL ES 3.2)', 'Kirin 980', 'HUAWEI Kirin 980'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: 34.1, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: 64, shaderUnits: null, gpuCores: 10, baseClockMhz: null, boostClockMhz: null },
      note: '麒麟 980（Mate 20 / P30 系列）；LPDDR4X-4266（34.1 GB/s）；「GPU 频率无可靠公开口径（核心数 10 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g76-mc4', vendor: 'ARM', name: 'Mali-G76 MC4', family: 'Mali-G76',
      type: 'mobile-soc', platform: 'phone', year: 2021, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G76 MC4', 'Mali-G76MC4', 'ARM Mali-G76 MC4', 'mali-g76mc4', 'ANGLE (ARM, Mali-G76 MC4, OpenGL ES 3.2)', '天玑 920'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: null, busWidth: null, shaderUnits: null, gpuCores: 4, baseClockMhz: null, boostClockMhz: null },
      note: 'Mali-G76 四核配置（联发科 天玑 920 等中端 SoC）；内存配置随机型变化，带宽填 null；「GPU 频率无可靠公开口径（核心数 4 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g72-mp18', vendor: 'ARM', name: 'Mali-G72 MP18', family: 'Mali-G72',
      type: 'mobile-soc', platform: 'phone', year: 2018, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G72 MP18', 'Mali-G72MP18', 'ARM Mali-G72 MP18', 'mali-g72', 'Mali-G72', 'ANGLE (ARM, Mali-G72 MP18, OpenGL ES 3.2)', 'Exynos 9810', 'Samsung Exynos 9810'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: 34.1, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: 64, shaderUnits: null, gpuCores: 18, baseClockMhz: null, boostClockMhz: null },
      note: '三星 Exynos 9810（Galaxy S9 / Note 9）；LPDDR4X-4266（34.1 GB/s）；「GPU 频率无可靠公开口径（核心数 18 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g72-mp12', vendor: 'ARM', name: 'Mali-G72 MP12', family: 'Mali-G72',
      type: 'mobile-soc', platform: 'phone', year: 2017, api: 'gles', apis: ['gles', 'vulkan'], os: ['android', 'harmonyos'], unifiedMemory: true,
      aliases: ['Mali-G72 MP12', 'Mali-G72MP12', 'ARM Mali-G72 MP12', 'mali-g72 mp12', 'ANGLE (ARM, Mali-G72 MP12, OpenGL ES 3.2)', 'Kirin 970', 'HUAWEI Kirin 970'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: null, shaderUnits: null, gpuCores: 12, baseClockMhz: null, boostClockMhz: null },
      note: '麒麟 970（Mate 10 / P20 系列）；LPDDR4X-1866，位宽口径不一致故带宽填 null；「GPU 频率无可靠公开口径（核心数 12 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g72-mp8', vendor: 'ARM', name: 'Mali-G72 MP8', family: 'Mali-G72',
      type: 'mobile-soc', platform: 'phone', year: 2017, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G72 MP8', 'Mali-G72MP8', 'ARM Mali-G72 MP8', 'mali-g72 mp8', 'ANGLE (ARM, Mali-G72 MP8, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: null, busWidth: null, shaderUnits: null, gpuCores: 8, baseClockMhz: null, boostClockMhz: null },
      note: 'Mali-G72 MP8（2017-2018 中端 SoC / 平板）；无公开内存与频率口径，带宽填 null；「GPU 频率无可靠公开口径（核心数 8 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g71-mp20', vendor: 'ARM', name: 'Mali-G71 MP20', family: 'Mali-G71',
      type: 'tablet', platform: 'tablet', year: 2016, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G71 MP20', 'Mali-G71MP20', 'ARM Mali-G71 MP20', 'mali-g71', 'Mali-G71', 'ANGLE (ARM, Mali-G71 MP20, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: null, busWidth: null, shaderUnits: null, gpuCores: 20, baseClockMhz: null, boostClockMhz: null },
      note: 'Mali-G71 MP20（平板 / 大屏设备）；平台标记 tablet，带宽填 null；「GPU 频率无可靠公开口径（核心数 20 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g71-mp16', vendor: 'ARM', name: 'Mali-G71 MP16', family: 'Mali-G71',
      type: 'mobile-soc', platform: 'phone', year: 2016, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G71 MP16', 'Mali-G71MP16', 'ARM Mali-G71 MP16', 'mali-g71 mp16', 'ANGLE (ARM, Mali-G71 MP16, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: null, busWidth: null, shaderUnits: null, gpuCores: 16, baseClockMhz: null, boostClockMhz: null },
      note: 'Mali-G71 MP16（2016-2017 中高端 SoC）；无公开内存与频率口径，带宽填 null；「GPU 频率无可靠公开口径（核心数 16 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g71-mp8', vendor: 'ARM', name: 'Mali-G71 MP8', family: 'Mali-G71',
      type: 'mobile-soc', platform: 'phone', year: 2016, api: 'gles', apis: ['gles', 'vulkan'], os: ['android', 'harmonyos'], unifiedMemory: true,
      aliases: ['Mali-G71 MP8', 'Mali-G71MP8', 'ARM Mali-G71 MP8', 'mali-g71 mp8', 'ANGLE (ARM, Mali-G71 MP8, OpenGL ES 3.2)', 'Kirin 960', 'HUAWEI Kirin 960'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4', busWidth: null, shaderUnits: null, gpuCores: 8, baseClockMhz: null, boostClockMhz: null },
      note: '麒麟 960（Mate 9 / P10 系列）；LPDDR4-1866（位宽口径不一致，带宽填 null）；「GPU 频率无可靠公开口径（核心数 8 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },

    /* ==================================================================
     * 三、ARM Mali-G6x / G5x / G3x（Valhall，2018 - 2023）
     * ================================================================== */

    {
      id: 'arm-mali-g710-mc10', vendor: 'ARM', name: 'Mali-G710 MC10', family: 'Mali-G710',
      type: 'mobile-soc', platform: 'phone', year: 2021, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G710 MC10', 'Mali-G710MC10', 'ARM Mali-G710 MC10', 'mali-g710', 'Mali-G710', 'ANGLE (ARM, Mali-G710 MC10, OpenGL ES 3.2)', '天玑 9000'],
      specs: { fp32Tflops: 0.54, fp16Tflops: 1.08, bandwidthGBs: 51.2, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 64, shaderUnits: null, gpuCores: 10, baseClockMhz: null, boostClockMhz: 850 },
      note: '联发科 天玑 9000 / 9000+；统一内存 LPDDR5-6400 四通道（51.2 GB/s）；「FP32 为推算值：10 核心 × 64 FLOP/核心/时钟 × 850 MHz = 0.54 TFLOPS（Bifrost/Valhall 口径，厂商未公布，仅供横向参照）；FP16 按 2× 打包口径 = 1.08 TFLOPS」'
    },
    {
      id: 'arm-mali-g710-mc7', vendor: 'ARM', name: 'Mali-G710 MC7', family: 'Mali-G710',
      type: 'mobile-soc', platform: 'phone', year: 2022, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G710 MC7', 'Mali-G710MC7', 'ARM Mali-G710 MC7', 'mali-g710 mc7', 'ANGLE (ARM, Mali-G710 MC7, OpenGL ES 3.2)', 'Google Tensor G2'],
      specs: { fp32Tflops: 0.38, fp16Tflops: 0.76, bandwidthGBs: 51.2, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 64, shaderUnits: null, gpuCores: 7, baseClockMhz: null, boostClockMhz: 850 },
      note: 'Google Tensor G2（Pixel 7 / 7 Pro / Pixel Fold）；统一内存 LPDDR5-6400（51.2 GB/s）；「FP32 为推算值：7 核心 × 64 FLOP/核心/时钟 × 850 MHz = 0.38 TFLOPS（Bifrost/Valhall 口径，厂商未公布，仅供横向参照）；FP16 按 2× 打包口径 = 0.76 TFLOPS」'
    },
    {
      id: 'arm-mali-g68-mc4', vendor: 'ARM', name: 'Mali-G68 MC4', family: 'Mali-G68',
      type: 'mobile-soc', platform: 'phone', year: 2021, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G68 MC4', 'Mali-G68MC4', 'ARM Mali-G68 MC4', 'mali-g68', 'Mali-G68', 'ANGLE (ARM, Mali-G68 MC4, OpenGL ES 3.2)', '天玑 900'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: null, shaderUnits: null, gpuCores: 4, baseClockMhz: null, boostClockMhz: null },
      note: '联发科 天玑 900 等中端 5G SoC；LPDDR4X/LPDDR5 视机型而定，带宽填 null；「GPU 频率无可靠公开口径（核心数 4 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g615-mc6', vendor: 'ARM', name: 'Mali-G615 MC6', family: 'Mali-G615',
      type: 'mobile-soc', platform: 'phone', year: 2023, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G615 MC6', 'Mali-G615MC6', 'ARM Mali-G615 MC6', 'mali-g615', 'Mali-G615', 'ANGLE (ARM, Mali-G615 MC6, OpenGL ES 3.2)', '天玑 8300'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: 68.3, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR5X', busWidth: 64, shaderUnits: null, gpuCores: 6, baseClockMhz: null, boostClockMhz: null },
      note: '联发科 天玑 8300 / 8350；统一内存 LPDDR5X-8533 四通道（68.3 GB/s）；「GPU 频率无可靠公开口径（核心数 6 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g615-mc2', vendor: 'ARM', name: 'Mali-G615 MC2', family: 'Mali-G615',
      type: 'mobile-soc', platform: 'phone', year: 2023, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G615 MC2', 'Mali-G615MC2', 'ARM Mali-G615 MC2', 'mali-g615 mc2', 'ANGLE (ARM, Mali-G615 MC2, OpenGL ES 3.2)', '天玑 7025'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: null, busWidth: null, shaderUnits: null, gpuCores: 2, baseClockMhz: null, boostClockMhz: null },
      note: 'Mali-G615 双核配置（天玑 7025 / 7030 等入门 5G SoC）；内存与频率随机型变化，带宽填 null；「GPU 频率无可靠公开口径（核心数 2 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g610-mc6', vendor: 'ARM', name: 'Mali-G610 MC6', family: 'Mali-G610',
      type: 'mobile-soc', platform: 'phone', year: 2022, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G610 MC6', 'Mali-G610MC6', 'ARM Mali-G610 MC6', 'mali-g610', 'Mali-G610', 'ANGLE (ARM, Mali-G610 MC6, OpenGL ES 3.2)', '天玑 8100'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: 51.2, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 64, shaderUnits: null, gpuCores: 6, baseClockMhz: null, boostClockMhz: null },
      note: '联发科 天玑 8100 / 8200；统一内存 LPDDR5-6400 四通道（51.2 GB/s）；「GPU 频率无可靠公开口径（核心数 6 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g610-mc4', vendor: 'ARM', name: 'Mali-G610 MC4', family: 'Mali-G610',
      type: 'tablet', platform: 'tablet', year: 2022, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G610 MC4', 'Mali-G610MC4', 'ARM Mali-G610 MC4', 'mali-g610 mc4', 'ANGLE (ARM, Mali-G610 MC4, OpenGL ES 3.2)', 'RK3588', 'Rockchip RK3588'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: null, shaderUnits: null, gpuCores: 4, baseClockMhz: null, boostClockMhz: null },
      note: '瑞芯微 RK3588 / RK3588S（Android 平板、电视盒子、开发板，亦支持 Linux）；LPDDR4X/LPDDR5 视机型而定；「GPU 频率无可靠公开口径（核心数 4 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g510-mc6', vendor: 'ARM', name: 'Mali-G510 MC6', family: 'Mali-G510',
      type: 'mobile-soc', platform: 'phone', year: 2022, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G510 MC6', 'Mali-G510MC6', 'ARM Mali-G510 MC6', 'mali-g510', 'Mali-G510', 'ANGLE (ARM, Mali-G510 MC6, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: null, busWidth: null, shaderUnits: null, gpuCores: 6, baseClockMhz: null, boostClockMhz: null },
      note: 'Mali-G510 六核（2022 中端 SoC / 平板、车机）；内存与频率随 SoC 变化，带宽填 null；「GPU 频率无可靠公开口径（核心数 6 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g57-mc6', vendor: 'ARM', name: 'Mali-G57 MC6', family: 'Mali-G57',
      type: 'mobile-soc', platform: 'phone', year: 2020, api: 'gles', apis: ['gles', 'vulkan'], os: ['android', 'harmonyos'], unifiedMemory: true,
      aliases: ['Mali-G57 MC6', 'Mali-G57MC6', 'Mali-G57 MP6', 'ARM Mali-G57 MC6', 'mali-g57', 'Mali-G57', 'ANGLE (ARM, Mali-G57 MC6, OpenGL ES 3.2)', 'Kirin 820', 'HUAWEI Kirin 820'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: null, shaderUnits: null, gpuCores: 6, baseClockMhz: null, boostClockMhz: null },
      note: '麒麟 820（荣耀 30S / nova 7 SE）；华为口径写作 Mali-G57 MP6（同一 6 核配置）；LPDDR4X-2133，带宽填 null；「GPU 频率无可靠公开口径（核心数 6 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g57-mc5', vendor: 'ARM', name: 'Mali-G57 MC5', family: 'Mali-G57',
      type: 'mobile-soc', platform: 'phone', year: 2020, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G57 MC5', 'Mali-G57MC5', 'ARM Mali-G57 MC5', 'mali-g57 mc5', 'ANGLE (ARM, Mali-G57 MC5, OpenGL ES 3.2)', '天玑 820'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: null, shaderUnits: null, gpuCores: 5, baseClockMhz: null, boostClockMhz: null },
      note: '联发科 天玑 820；LPDDR4X（位宽口径不一致，带宽填 null）；「GPU 频率无可靠公开口径（核心数 5 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g57-mc4', vendor: 'ARM', name: 'Mali-G57 MC4', family: 'Mali-G57',
      type: 'mobile-soc', platform: 'phone', year: 2020, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G57 MC4', 'Mali-G57MC4', 'ARM Mali-G57 MC4', 'mali-g57 mc4', 'ANGLE (ARM, Mali-G57 MC4, OpenGL ES 3.2)', '天玑 800'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: null, shaderUnits: null, gpuCores: 4, baseClockMhz: null, boostClockMhz: null },
      note: '联发科 天玑 800 / 800U；LPDDR4X（位宽口径不一致，带宽填 null）；「GPU 频率无可靠公开口径（核心数 4 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g57-mc3', vendor: 'ARM', name: 'Mali-G57 MC3', family: 'Mali-G57',
      type: 'mobile-soc', platform: 'phone', year: 2020, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G57 MC3', 'Mali-G57MC3', 'ARM Mali-G57 MC3', 'mali-g57 mc3', 'ANGLE (ARM, Mali-G57 MC3, OpenGL ES 3.2)', '天玑 720'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: null, shaderUnits: null, gpuCores: 3, baseClockMhz: null, boostClockMhz: null },
      note: '联发科 天玑 720 / 天玑 800U；LPDDR4X；带宽填 null（无一致公开口径）；「GPU 频率无可靠公开口径（核心数 3 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g57-mc2', vendor: 'ARM', name: 'Mali-G57 MC2', family: 'Mali-G57',
      type: 'mobile-soc', platform: 'phone', year: 2021, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G57 MC2', 'Mali-G57MC2', 'ARM Mali-G57 MC2', 'mali-g57 mc2', 'mali-g57mc2', 'ANGLE (ARM, Mali-G57 MC2, OpenGL ES 3.2)', 'Helio G99', '天玑 810', '天玑 700'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: null, shaderUnits: null, gpuCores: 2, baseClockMhz: null, boostClockMhz: null },
      note: '联发科 Helio G99 / 天玑 810 / 天玑 700；LPDDR4X（位宽口径不一致，带宽填 null）；「GPU 频率无可靠公开口径（核心数 2 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g57-mc1', vendor: 'ARM', name: 'Mali-G57 MC1', family: 'Mali-G57',
      type: 'mobile-soc', platform: 'phone', year: 2021, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G57 MC1', 'Mali-G57MC1', 'ARM Mali-G57 MC1', 'mali-g57 mc1', 'ANGLE (ARM, Mali-G57 MC1, OpenGL ES 3.2)', 'Unisoc T606', '紫光展锐 T606'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: null, shaderUnits: null, gpuCores: 1, baseClockMhz: null, boostClockMhz: null },
      note: '紫光展锐 T606 / T612 等入门 5G SoC；LPDDR4X；带宽填 null；「GPU 频率无可靠公开口径（核心数 1 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g52-mc6', vendor: 'ARM', name: 'Mali-G52 MC6', family: 'Mali-G52',
      type: 'mobile-soc', platform: 'phone', year: 2019, api: 'gles', apis: ['gles', 'vulkan'], os: ['android', 'harmonyos'], unifiedMemory: true,
      aliases: ['Mali-G52 MC6', 'Mali-G52MC6', 'Mali-G52 MP6', 'ARM Mali-G52 MC6', 'mali-g52', 'Mali-G52', 'ANGLE (ARM, Mali-G52 MC6, OpenGL ES 3.2)', 'Kirin 810', 'HUAWEI Kirin 810'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: null, shaderUnits: null, gpuCores: 6, baseClockMhz: null, boostClockMhz: null },
      note: '麒麟 810（nova 5 / 荣耀 9X）；华为口径写作 Mali-G52 MP6；LPDDR4X-2133，带宽填 null；「GPU 频率无可靠公开口径（核心数 6 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g52-mc4', vendor: 'ARM', name: 'Mali-G52 MC4', family: 'Mali-G52',
      type: 'mobile-soc', platform: 'phone', year: 2019, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G52 MC4', 'Mali-G52MC4', 'Mali-G52 MP4', 'ARM Mali-G52 MC4', 'mali-g52 mc4', 'ANGLE (ARM, Mali-G52 MC4, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: null, shaderUnits: null, gpuCores: 4, baseClockMhz: null, boostClockMhz: null },
      note: 'Mali-G52 四核（2019-2020 中端机型 / 平板）；LPDDR4X；带宽填 null；「GPU 频率无可靠公开口径（核心数 4 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g52-mc2', vendor: 'ARM', name: 'Mali-G52 MC2', family: 'Mali-G52',
      type: 'mobile-soc', platform: 'phone', year: 2019, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G52 MC2', 'Mali-G52MC2', 'Mali-G52 MP2', 'ARM Mali-G52 MC2', 'mali-g52 mc2', 'mali-g52mc2', 'ANGLE (ARM, Mali-G52 MC2, OpenGL ES 3.2)', 'Helio G85', 'Helio G88', 'Helio G96'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: null, shaderUnits: null, gpuCores: 2, baseClockMhz: null, boostClockMhz: null },
      note: '联发科 Helio G70 / G80 / G85 / G88 / G96；LPDDR4X-1800（位宽口径不一致，带宽填 null）；「GPU 频率无可靠公开口径（核心数 2 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g52-mc1', vendor: 'ARM', name: 'Mali-G52 MC1', family: 'Mali-G52',
      type: 'mobile-soc', platform: 'phone', year: 2020, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G52 MC1', 'Mali-G52MC1', 'Mali-G52 MP1', 'ARM Mali-G52 MC1', 'mali-g52 mc1', 'ANGLE (ARM, Mali-G52 MC1, OpenGL ES 3.2)', 'Exynos 850'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: null, shaderUnits: null, gpuCores: 1, baseClockMhz: null, boostClockMhz: null },
      note: '三星 Exynos 850（Galaxy A21s / A12 等）；LPDDR4X；带宽填 null；「GPU 频率无可靠公开口径（核心数 1 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g51-mp4', vendor: 'ARM', name: 'Mali-G51 MP4', family: 'Mali-G51',
      type: 'mobile-soc', platform: 'phone', year: 2018, api: 'gles', apis: ['gles', 'vulkan'], os: ['android', 'harmonyos'], unifiedMemory: true,
      aliases: ['Mali-G51 MP4', 'Mali-G51MP4', 'ARM Mali-G51 MP4', 'mali-g51', 'Mali-G51', 'ANGLE (ARM, Mali-G51 MP4, OpenGL ES 3.2)', 'Kirin 710', 'HUAWEI Kirin 710'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: null, shaderUnits: null, gpuCores: 4, baseClockMhz: null, boostClockMhz: null },
      note: '麒麟 710 / 710F（nova 3i / P smart / 荣耀 8X）；LPDDR4X-1866，带宽填 null；「GPU 频率无可靠公开口径（核心数 4 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g51-mp2', vendor: 'ARM', name: 'Mali-G51 MP2', family: 'Mali-G51',
      type: 'mobile-soc', platform: 'phone', year: 2018, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G51 MP2', 'Mali-G51MP2', 'ARM Mali-G51 MP2', 'mali-g51 mp2', 'ANGLE (ARM, Mali-G51 MP2, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: null, shaderUnits: null, gpuCores: 2, baseClockMhz: null, boostClockMhz: null },
      note: 'Mali-G51 双核（2018-2019 入门机型）；LPDDR4X；带宽填 null；「GPU 频率无可靠公开口径（核心数 2 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g31-mp2', vendor: 'ARM', name: 'Mali-G31 MP2', family: 'Mali-G31',
      type: 'tablet', platform: 'tablet', year: 2019, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G31 MP2', 'Mali-G31MP2', 'ARM Mali-G31 MP2', 'mali-g31', 'Mali-G31', 'ANGLE (ARM, Mali-G31 MP2, OpenGL ES 3.2)', 'Amlogic S905X3', 'Allwinner H616'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'DDR4', busWidth: null, shaderUnits: null, gpuCores: 2, baseClockMhz: null, boostClockMhz: null },
      note: 'Amlogic S905X3 / S905X4、全志 H616 等电视盒子与入门平板 SoC；DDR4/LPDDR4，带宽填 null；「GPU 频率无可靠公开口径（核心数 2 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g310-mc4', vendor: 'ARM', name: 'Mali-G310 MC4', family: 'Mali-G310',
      type: 'mobile-soc', platform: 'phone', year: 2023, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G310 MC4', 'Mali-G310MC4', 'ARM Mali-G310 MC4', 'mali-g310', 'Mali-G310', 'ANGLE (ARM, Mali-G310 MC4, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: null, busWidth: null, shaderUnits: null, gpuCores: 4, baseClockMhz: null, boostClockMhz: null },
      note: '第五代 Valhall 入门 IP（紫光展锐 / 联发科入门 SoC、车机）；内存与频率随平台变化，带宽填 null；「GPU 频率无可靠公开口径（核心数 4 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-g310-mc2', vendor: 'ARM', name: 'Mali-G310 MC2', family: 'Mali-G310',
      type: 'mobile-soc', platform: 'phone', year: 2023, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-G310 MC2', 'Mali-G310MC2', 'ARM Mali-G310 MC2', 'mali-g310 mc2', 'ANGLE (ARM, Mali-G310 MC2, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: null, busWidth: null, shaderUnits: null, gpuCores: 2, baseClockMhz: null, boostClockMhz: null },
      note: 'Mali-G310 双核（入门 SoC / 车机 / 穿戴）；无公开内存与频率口径，带宽填 null；「GPU 频率无可靠公开口径（核心数 2 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },

    /* ==================================================================
     * 四、ARM Mali Midgard 老架构（2014 - 2016）
     * ================================================================== */

    {
      id: 'arm-mali-t880-mp12', vendor: 'ARM', name: 'Mali-T880 MP12', family: 'Mali-T8xx',
      type: 'mobile-soc', platform: 'phone', year: 2016, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-T880 MP12', 'Mali-T880MP12', 'ARM Mali-T880 MP12', 'mali-t880', 'Mali-T880', 'ANGLE (ARM, Mali-T880 MP12, OpenGL ES 3.2)', 'Exynos 8890'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4', busWidth: null, shaderUnits: null, gpuCores: 12, baseClockMhz: null, boostClockMhz: null },
      note: '三星 Exynos 8890（Galaxy S7 / Note 7）；LPDDR4（位宽口径不一致，带宽填 null）；「GPU 频率无可靠公开口径（核心数 12 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-t880-mp4', vendor: 'ARM', name: 'Mali-T880 MP4', family: 'Mali-T8xx',
      type: 'mobile-soc', platform: 'phone', year: 2015, api: 'gles', apis: ['gles', 'vulkan'], os: ['android', 'harmonyos'], unifiedMemory: true,
      aliases: ['Mali-T880 MP4', 'Mali-T880MP4', 'ARM Mali-T880 MP4', 'mali-t880 mp4', 'ANGLE (ARM, Mali-T880 MP4, OpenGL ES 3.2)', 'Kirin 950', 'HUAWEI Kirin 955'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4', busWidth: null, shaderUnits: null, gpuCores: 4, baseClockMhz: null, boostClockMhz: null },
      note: '麒麟 950 / 955（Mate 8 / P9 系列）；LPDDR4；带宽填 null；「GPU 频率无可靠公开口径（核心数 4 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-t880-mp2', vendor: 'ARM', name: 'Mali-T880 MP2', family: 'Mali-T8xx',
      type: 'mobile-soc', platform: 'phone', year: 2016, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-T880 MP2', 'Mali-T880MP2', 'ARM Mali-T880 MP2', 'mali-t880 mp2', 'ANGLE (ARM, Mali-T880 MP2, OpenGL ES 3.2)', 'Helio P20', 'Helio P25'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: null, shaderUnits: null, gpuCores: 2, baseClockMhz: null, boostClockMhz: null },
      note: '联发科 Helio P20 / P25；LPDDR4X；带宽填 null；「GPU 频率无可靠公开口径（核心数 2 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-t860-mp4', vendor: 'ARM', name: 'Mali-T860 MP4', family: 'Mali-T8xx',
      type: 'mobile-soc', platform: 'phone', year: 2015, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-T860 MP4', 'Mali-T860MP4', 'ARM Mali-T860 MP4', 'mali-t860', 'Mali-T860', 'ANGLE (ARM, Mali-T860 MP4, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR3', busWidth: null, shaderUnits: null, gpuCores: 4, baseClockMhz: null, boostClockMhz: null },
      note: 'Mali-T860 四核（2015-2016 中高端 SoC / 平板）；LPDDR3/LPDDR4；带宽填 null；「GPU 频率无可靠公开口径（核心数 4 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-t860-mp2', vendor: 'ARM', name: 'Mali-T860 MP2', family: 'Mali-T8xx',
      type: 'mobile-soc', platform: 'phone', year: 2015, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-T860 MP2', 'Mali-T860MP2', 'ARM Mali-T860 MP2', 'mali-t860 mp2', 'ANGLE (ARM, Mali-T860 MP2, OpenGL ES 3.2)', 'Helio P10', 'Helio P18'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR3', busWidth: null, shaderUnits: null, gpuCores: 2, baseClockMhz: null, boostClockMhz: null },
      note: '联发科 Helio P10 / P15 / P18（MT6755 系列）；LPDDR3；带宽填 null；「GPU 频率无可靠公开口径（核心数 2 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-t830-mp2', vendor: 'ARM', name: 'Mali-T830 MP2', family: 'Mali-T8xx',
      type: 'mobile-soc', platform: 'phone', year: 2016, api: 'gles', apis: ['gles'], os: ['android', 'harmonyos'], unifiedMemory: true,
      aliases: ['Mali-T830 MP2', 'Mali-T830MP2', 'ARM Mali-T830 MP2', 'mali-t830', 'Mali-T830', 'ANGLE (ARM, Mali-T830 MP2, OpenGL ES 3.2)', 'Kirin 658', 'Kirin 659'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR3', busWidth: null, shaderUnits: null, gpuCores: 2, baseClockMhz: null, boostClockMhz: null },
      note: '麒麟 658 / 659（荣耀 8 / nova 2）；LPDDR3；带宽填 null；「GPU 频率无可靠公开口径（核心数 2 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-t830-mp1', vendor: 'ARM', name: 'Mali-T830 MP1', family: 'Mali-T8xx',
      type: 'mobile-soc', platform: 'phone', year: 2016, api: 'gles', apis: ['gles'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-T830 MP1', 'Mali-T830MP1', 'ARM Mali-T830 MP1', 'mali-t830 mp1', 'ANGLE (ARM, Mali-T830 MP1, OpenGL ES 3.2)', 'Exynos 7870'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR3', busWidth: null, shaderUnits: null, gpuCores: 1, baseClockMhz: null, boostClockMhz: null },
      note: '三星 Exynos 7870（Galaxy J7 / A3 等）；LPDDR3；带宽填 null；「GPU 频率无可靠公开口径（核心数 1 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-t760-mp8', vendor: 'ARM', name: 'Mali-T760 MP8', family: 'Mali-T7xx',
      type: 'mobile-soc', platform: 'phone', year: 2015, api: 'gles', apis: ['gles'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-T760 MP8', 'Mali-T760MP8', 'ARM Mali-T760 MP8', 'mali-t760', 'Mali-T760', 'ANGLE (ARM, Mali-T760 MP8, OpenGL ES 3.2)', 'Exynos 7420'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: 25.6, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4', busWidth: 64, shaderUnits: null, gpuCores: 8, baseClockMhz: null, boostClockMhz: null },
      note: '三星 Exynos 7420（Galaxy S6 / Note 5）；LPDDR4-3200 双通道 64-bit（25.6 GB/s）；「GPU 频率无可靠公开口径（核心数 8 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-t760-mp6', vendor: 'ARM', name: 'Mali-T760 MP6', family: 'Mali-T7xx',
      type: 'mobile-soc', platform: 'phone', year: 2014, api: 'gles', apis: ['gles'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-T760 MP6', 'Mali-T760MP6', 'ARM Mali-T760 MP6', 'mali-t760 mp6', 'ANGLE (ARM, Mali-T760 MP6, OpenGL ES 3.2)', 'Exynos 5433'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR3', busWidth: null, shaderUnits: null, gpuCores: 6, baseClockMhz: null, boostClockMhz: null },
      note: '三星 Exynos 5433（Galaxy Note 4 / Alpha）；LPDDR3；带宽填 null；「GPU 频率无可靠公开口径（核心数 6 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-t720-mp2', vendor: 'ARM', name: 'Mali-T720 MP2', family: 'Mali-T7xx',
      type: 'mobile-soc', platform: 'phone', year: 2015, api: 'gles', apis: ['gles'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-T720 MP2', 'Mali-T720MP2', 'ARM Mali-T720 MP2', 'mali-t720', 'Mali-T720', 'ANGLE (ARM, Mali-T720 MP2, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR3', busWidth: null, shaderUnits: null, gpuCores: 2, baseClockMhz: null, boostClockMhz: null },
      note: 'Mali-T720 双核（2015 入门机型 / 电视盒子）；LPDDR3；带宽填 null；「GPU 频率无可靠公开口径（核心数 2 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-t628-mp4', vendor: 'ARM', name: 'Mali-T628 MP4', family: 'Mali-T6xx',
      type: 'mobile-soc', platform: 'phone', year: 2015, api: 'gles', apis: ['gles'], os: ['android', 'harmonyos'], unifiedMemory: true,
      aliases: ['Mali-T628 MP4', 'Mali-T628MP4', 'ARM Mali-T628 MP4', 'mali-t628', 'Mali-T628', 'ANGLE (ARM, Mali-T628 MP4, OpenGL ES 3.2)', 'Kirin 935'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR3', busWidth: null, shaderUnits: null, gpuCores: 4, baseClockMhz: null, boostClockMhz: null },
      note: '麒麟 930 / 935 等（2015 华为中高端）；LPDDR3；带宽填 null；「GPU 频率无可靠公开口径（核心数 4 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'arm-mali-450-mp4', vendor: 'ARM', name: 'Mali-450 MP4', family: 'Mali-4xx',
      type: 'tablet', platform: 'tablet', year: 2015, api: 'gles', apis: ['gles'], os: ['android'], unifiedMemory: true,
      aliases: ['Mali-450 MP4', 'Mali-450MP4', 'ARM Mali-450 MP4', 'mali-450', 'Mali-450', 'ANGLE (ARM, Mali-450 MP4, OpenGL ES 2.0)', 'Amlogic S905'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'DDR3', busWidth: null, shaderUnits: null, gpuCores: 4, baseClockMhz: null, boostClockMhz: null },
      note: 'Amlogic S905 系列电视盒子 SoC（Mali-450 多核配置）；DDR3/DDR4；仅支持 OpenGL ES 2.0，带宽填 null；「GPU 频率无可靠公开口径（核心数 4 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },

    /* ==================================================================
     * 五、华为 / 鸿蒙（Maleoon 自研 + 麒麟搭 Mali）
     * ================================================================== */

    {
      id: 'huawei-maleoon-910', vendor: 'Other', name: 'Huawei Maleoon 910', family: 'Huawei Maleoon',
      type: 'mobile-soc', platform: 'phone', year: 2023, api: 'gles', apis: ['gles', 'vulkan'], os: ['android', 'harmonyos'], unifiedMemory: true,
      aliases: ['Maleoon 910', 'Huawei Maleoon 910', 'HUAWEI Maleoon 910', 'Maleoon910', 'maleoon 910', 'Maleoon 910 GPU', 'ANGLE (Huawei, Maleoon 910, OpenGL ES 3.2)', 'Kirin 9000s', 'HUAWEI Kirin 9000s', 'HiSilicon Maleoon 910'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: null, shaderUnits: null, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: '华为自研 Maleoon GPU，随麒麟 9000s 首发（Mate 60 / Mate 60 Pro / MatePad Pro 13.2）；核心数、频率与带宽均未公开；「厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'huawei-maleoon-920', vendor: 'Other', name: 'Huawei Maleoon 920', family: 'Huawei Maleoon',
      type: 'mobile-soc', platform: 'phone', year: 2024, api: 'gles', apis: ['gles', 'vulkan'], os: ['android', 'harmonyos'], unifiedMemory: true,
      aliases: ['Maleoon 920', 'Huawei Maleoon 920', 'HUAWEI Maleoon 920', 'Maleoon920', 'maleoon 920', 'Maleoon 920 GPU', 'ANGLE (Huawei, Maleoon 920, OpenGL ES 3.2)', 'Kirin 9010', 'Kirin 9020', 'HUAWEI Kirin 9010', 'HUAWEI Kirin 9020'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: null, shaderUnits: null, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: '华为自研 Maleoon GPU 第二代，随麒麟 9010（Pura 70）与麒麟 9020（Mate 70 / Mate X6）使用；官方未公布规格；「厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'huawei-kirin-9000-g78-mp24', vendor: 'Other', name: 'Huawei Kirin 9000 (Mali-G78 MP24)', family: 'Huawei Kirin 9000',
      type: 'mobile-soc', platform: 'phone', year: 2020, api: 'gles', apis: ['gles', 'vulkan'], os: ['android', 'harmonyos'], unifiedMemory: true,
      aliases: ['Huawei Kirin 9000', 'HUAWEI Kirin 9000', 'Kirin 9000', 'HiSilicon Kirin 9000', 'Huawei Mali-G78 MP24', 'Kirin 9000 GPU', 'ANGLE (Huawei, Mali-G78 MP24, OpenGL ES 3.2)', 'HUAWEI Mali-G78'],
      specs: { fp32Tflops: 1.15, fp16Tflops: 2.3, bandwidthGBs: 44.0, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 64, shaderUnits: null, gpuCores: 24, baseClockMhz: null, boostClockMhz: 750 },
      note: '麒麟 9000（Mate 40 Pro / P40 Pro+）；GPU 为 Mali-G78 MP24；统一内存 LPDDR5-5500（44.0 GB/s）；「FP32 为推算值：24 核心 × 64 FLOP/核心/时钟 × 750 MHz = 1.15 TFLOPS（Bifrost/Valhall 口径，厂商未公布，仅供横向参照）；FP16 按 2× 打包口径 = 2.30 TFLOPS」'
    },
    {
      id: 'huawei-kirin-9000e-g78-mp22', vendor: 'Other', name: 'Huawei Kirin 9000E (Mali-G78 MP22)', family: 'Huawei Kirin 9000',
      type: 'mobile-soc', platform: 'phone', year: 2020, api: 'gles', apis: ['gles', 'vulkan'], os: ['android', 'harmonyos'], unifiedMemory: true,
      aliases: ['Huawei Kirin 9000E', 'HUAWEI Kirin 9000E', 'Kirin 9000E', 'HiSilicon Kirin 9000E', 'Huawei Mali-G78 MP22', 'Kirin 9000E GPU', 'ANGLE (Huawei, Mali-G78 MP22, OpenGL ES 3.2)'],
      specs: { fp32Tflops: 1.06, fp16Tflops: 2.12, bandwidthGBs: 44.0, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 64, shaderUnits: null, gpuCores: 22, baseClockMhz: null, boostClockMhz: 750 },
      note: '麒麟 9000E（Mate 40 标准版 / MatePad Pro 12.6）；GPU 为 Mali-G78 MP22；LPDDR5-5500（44.0 GB/s）；「FP32 为推算值：22 核心 × 64 FLOP/核心/时钟 × 750 MHz = 1.06 TFLOPS（Bifrost/Valhall 口径，厂商未公布，仅供横向参照）；FP16 按 2× 打包口径 = 2.12 TFLOPS」'
    },
    {
      id: 'huawei-kirin-990-5g-g76-mp16', vendor: 'Other', name: 'Huawei Kirin 990 5G (Mali-G76 MP16)', family: 'Huawei Kirin 990',
      type: 'mobile-soc', platform: 'phone', year: 2019, api: 'gles', apis: ['gles', 'vulkan'], os: ['android', 'harmonyos'], unifiedMemory: true,
      aliases: ['Huawei Kirin 990', 'HUAWEI Kirin 990 5G', 'Kirin 990', 'Kirin 990 5G', 'HiSilicon Kirin 990', 'Huawei Mali-G76 MP16', 'ANGLE (Huawei, Mali-G76 MP16, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: 34.1, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: 64, shaderUnits: null, gpuCores: 16, baseClockMhz: null, boostClockMhz: null },
      note: '麒麟 990 / 990 5G（Mate 30 / P40 系列）；GPU 为 Mali-G76 MP16；LPDDR4X-4266（34.1 GB/s）；「GPU 频率无可靠公开口径（核心数 16 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'huawei-kirin-990e-g76-mp14', vendor: 'Other', name: 'Huawei Kirin 990E (Mali-G76 MP14)', family: 'Huawei Kirin 990',
      type: 'mobile-soc', platform: 'phone', year: 2020, api: 'gles', apis: ['gles', 'vulkan'], os: ['android', 'harmonyos'], unifiedMemory: true,
      aliases: ['Huawei Kirin 990E', 'HUAWEI Kirin 990E', 'Kirin 990E', 'HiSilicon Kirin 990E', 'Huawei Mali-G76 MP14', 'Kirin 990E GPU', 'ANGLE (Huawei, Mali-G76 MP14, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: 34.1, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: 64, shaderUnits: null, gpuCores: 14, baseClockMhz: null, boostClockMhz: null },
      note: '麒麟 990E（Mate 40E 等）；GPU 为 Mali-G76 MP14；LPDDR4X-4266（34.1 GB/s）；「GPU 频率无可靠公开口径（核心数 14 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'huawei-kirin-985-g77-mp8', vendor: 'Other', name: 'Huawei Kirin 985 (Mali-G77 MP8)', family: 'Huawei Kirin 985',
      type: 'mobile-soc', platform: 'phone', year: 2020, api: 'gles', apis: ['gles', 'vulkan'], os: ['android', 'harmonyos'], unifiedMemory: true,
      aliases: ['Huawei Kirin 985', 'HUAWEI Kirin 985', 'Kirin 985', 'HiSilicon Kirin 985', 'Huawei Mali-G77 MP8', 'Kirin 985 GPU', 'ANGLE (Huawei, Mali-G77 MP8, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: 34.1, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: 64, shaderUnits: null, gpuCores: 8, baseClockMhz: null, boostClockMhz: null },
      note: '麒麟 985（nova 7 / 荣耀 30）；GPU 为 Mali-G77 八核配置；LPDDR4X-4266（34.1 GB/s）；「GPU 频率无可靠公开口径（核心数 8 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'huawei-kirin-980-g76-mp10', vendor: 'Other', name: 'Huawei Kirin 980 (Mali-G76 MP10)', family: 'Huawei Kirin 980',
      type: 'mobile-soc', platform: 'phone', year: 2018, api: 'gles', apis: ['gles', 'vulkan'], os: ['android', 'harmonyos'], unifiedMemory: true,
      aliases: ['Huawei Kirin 980', 'HUAWEI Kirin 980', 'Kirin 980', 'HiSilicon Kirin 980', 'Huawei Mali-G76 MP10', 'Kirin 980 GPU', 'ANGLE (Huawei, Mali-G76 MP10, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: 34.1, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: 64, shaderUnits: null, gpuCores: 10, baseClockMhz: null, boostClockMhz: null },
      note: '麒麟 980（Mate 20 / P30 系列）；GPU 为 Mali-G76 MP10；LPDDR4X-4266（34.1 GB/s）；「GPU 频率无可靠公开口径（核心数 10 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'huawei-kirin-970-g72-mp12', vendor: 'Other', name: 'Huawei Kirin 970 (Mali-G72 MP12)', family: 'Huawei Kirin 970',
      type: 'mobile-soc', platform: 'phone', year: 2017, api: 'gles', apis: ['gles', 'vulkan'], os: ['android', 'harmonyos'], unifiedMemory: true,
      aliases: ['Huawei Kirin 970', 'HUAWEI Kirin 970', 'Kirin 970', 'HiSilicon Kirin 970', 'Huawei Mali-G72 MP12', 'Kirin 970 GPU', 'ANGLE (Huawei, Mali-G72 MP12, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: null, shaderUnits: null, gpuCores: 12, baseClockMhz: null, boostClockMhz: null },
      note: '麒麟 970（Mate 10 / P20 系列）；GPU 为 Mali-G72 MP12；LPDDR4X-1866，带宽填 null；「GPU 频率无可靠公开口径（核心数 12 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'huawei-kirin-960-g71-mp8', vendor: 'Other', name: 'Huawei Kirin 960 (Mali-G71 MP8)', family: 'Huawei Kirin 960',
      type: 'mobile-soc', platform: 'phone', year: 2016, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Huawei Kirin 960', 'HUAWEI Kirin 960', 'Kirin 960', 'HiSilicon Kirin 960', 'Huawei Mali-G71 MP8', 'Kirin 960 GPU', 'ANGLE (Huawei, Mali-G71 MP8, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4', busWidth: null, shaderUnits: null, gpuCores: 8, baseClockMhz: null, boostClockMhz: null },
      note: '麒麟 960（Mate 9 / P10 系列）；GPU 为 Mali-G71 MP8；LPDDR4-1866，带宽填 null；「GPU 频率无可靠公开口径（核心数 8 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'huawei-kirin-820-g57-mp6', vendor: 'Other', name: 'Huawei Kirin 820 (Mali-G57 MP6)', family: 'Huawei Kirin 820',
      type: 'mobile-soc', platform: 'phone', year: 2020, api: 'gles', apis: ['gles', 'vulkan'], os: ['android', 'harmonyos'], unifiedMemory: true,
      aliases: ['Huawei Kirin 820', 'HUAWEI Kirin 820', 'Kirin 820', 'HiSilicon Kirin 820', 'Huawei Mali-G57 MP6', 'Kirin 820 GPU', 'ANGLE (Huawei, Mali-G57 MP6, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: null, shaderUnits: null, gpuCores: 6, baseClockMhz: null, boostClockMhz: null },
      note: '麒麟 820（荣耀 30S / nova 7 SE）；GPU 为 Mali-G57 MP6；LPDDR4X-2133，带宽填 null；「GPU 频率无可靠公开口径（核心数 6 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'huawei-kirin-810-g52-mp6', vendor: 'Other', name: 'Huawei Kirin 810 (Mali-G52 MP6)', family: 'Huawei Kirin 810',
      type: 'mobile-soc', platform: 'phone', year: 2019, api: 'gles', apis: ['gles', 'vulkan'], os: ['android', 'harmonyos'], unifiedMemory: true,
      aliases: ['Huawei Kirin 810', 'HUAWEI Kirin 810', 'Kirin 810', 'HiSilicon Kirin 810', 'Huawei Mali-G52 MP6', 'Kirin 810 GPU', 'ANGLE (Huawei, Mali-G52 MP6, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: null, shaderUnits: null, gpuCores: 6, baseClockMhz: null, boostClockMhz: null },
      note: '麒麟 810（nova 5 / 荣耀 9X）；GPU 为 Mali-G52 MP6；LPDDR4X-2133，带宽填 null；「GPU 频率无可靠公开口径（核心数 6 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'huawei-kirin-710-g51-mp4', vendor: 'Other', name: 'Huawei Kirin 710 (Mali-G51 MP4)', family: 'Huawei Kirin 710',
      type: 'mobile-soc', platform: 'phone', year: 2018, api: 'gles', apis: ['gles', 'vulkan'], os: ['android', 'harmonyos'], unifiedMemory: true,
      aliases: ['Huawei Kirin 710', 'HUAWEI Kirin 710', 'Kirin 710', 'HiSilicon Kirin 710', 'Huawei Mali-G51 MP4', 'Kirin 710 GPU', 'ANGLE (Huawei, Mali-G51 MP4, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: null, shaderUnits: null, gpuCores: 4, baseClockMhz: null, boostClockMhz: null },
      note: '麒麟 710（nova 3i / P smart+ / 荣耀 8X）；GPU 为 Mali-G51 MP4；LPDDR4X-1866，带宽填 null；「GPU 频率无可靠公开口径（核心数 4 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'huawei-kirin-710f-g51-mp4', vendor: 'Other', name: 'Huawei Kirin 710F (Mali-G51 MP4)', family: 'Huawei Kirin 710',
      type: 'mobile-soc', platform: 'phone', year: 2019, api: 'gles', apis: ['gles', 'vulkan'], os: ['android', 'harmonyos'], unifiedMemory: true,
      aliases: ['Huawei Kirin 710F', 'HUAWEI Kirin 710F', 'Kirin 710F', 'HiSilicon Kirin 710F', 'Huawei Mali-G51 MP4', 'Kirin 710F GPU', 'ANGLE (Huawei, Mali-G51 MP4, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: null, shaderUnits: null, gpuCores: 4, baseClockMhz: null, boostClockMhz: null },
      note: '麒麟 710F（麒麟 710 的衍生版本，用于 nova 5i / 荣耀 20i 等）；GPU 为 Mali-G51 MP4；带宽填 null；「GPU 频率无可靠公开口径（核心数 4 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'huawei-kirin-8000-g610', vendor: 'Other', name: 'Huawei Kirin 8000 (Mali-G610)', family: 'Huawei Kirin 8000',
      type: 'mobile-soc', platform: 'phone', year: 2023, api: 'gles', apis: ['gles', 'vulkan'], os: ['android', 'harmonyos'], unifiedMemory: true,
      aliases: ['Huawei Kirin 8000', 'HUAWEI Kirin 8000', 'Kirin 8000', 'HiSilicon Kirin 8000', 'Huawei Mali-G610', 'Kirin 8000 GPU', 'ANGLE (Huawei, Mali-G610, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: null, shaderUnits: null, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: '麒麟 8000（nova 12 Pro / nova 12 Ultra 等）；「厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'huawei-kirin-950-t880-mp4', vendor: 'Other', name: 'Huawei Kirin 950 (Mali-T880 MP4)', family: 'Huawei Kirin 950',
      type: 'mobile-soc', platform: 'phone', year: 2015, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Huawei Kirin 950', 'HUAWEI Kirin 950', 'Kirin 950', 'HiSilicon Kirin 950', 'Huawei Mali-T880 MP4', 'Kirin 955', 'Kirin 950 GPU', 'ANGLE (Huawei, Mali-T880 MP4, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4', busWidth: null, shaderUnits: null, gpuCores: 4, baseClockMhz: null, boostClockMhz: null },
      note: '麒麟 950 / 955（Mate 8 / P9 系列）；GPU 为 Mali-T880 MP4；LPDDR4，带宽填 null；「GPU 频率无可靠公开口径（核心数 4 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'huawei-kirin-935-t628-mp4', vendor: 'Other', name: 'Huawei Kirin 935 (Mali-T628 MP4)', family: 'Huawei Kirin 930',
      type: 'mobile-soc', platform: 'phone', year: 2015, api: 'gles', apis: ['gles'], os: ['android'], unifiedMemory: true,
      aliases: ['Huawei Kirin 935', 'HUAWEI Kirin 935', 'Kirin 935', 'HiSilicon Kirin 935', 'Kirin 930', 'Huawei Mali-T628 MP4', 'ANGLE (Huawei, Mali-T628 MP4, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR3', busWidth: null, shaderUnits: null, gpuCores: 4, baseClockMhz: null, boostClockMhz: null },
      note: '麒麟 930 / 935（Mate 7 系列后继 / P8）；GPU 为 Mali-T628 系列；LPDDR3，带宽填 null；「GPU 频率无可靠公开口径（核心数 4 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'huawei-kirin-659-t830-mp2', vendor: 'Other', name: 'Huawei Kirin 659 (Mali-T830 MP2)', family: 'Huawei Kirin 650',
      type: 'mobile-soc', platform: 'phone', year: 2017, api: 'gles', apis: ['gles'], os: ['android'], unifiedMemory: true,
      aliases: ['Huawei Kirin 659', 'HUAWEI Kirin 659', 'Kirin 659', 'HiSilicon Kirin 659', 'Kirin 658', 'Huawei Mali-T830 MP2', 'ANGLE (Huawei, Mali-T830 MP2, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR3', busWidth: null, shaderUnits: null, gpuCores: 2, baseClockMhz: null, boostClockMhz: null },
      note: '麒麟 658 / 659（荣耀 8 / nova 2 / 荣耀 9 Lite）；GPU 为 Mali-T830 MP2；LPDDR3，带宽填 null；「GPU 频率无可靠公开口径（核心数 2 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },

    /* ==================================================================
     * 六、三星 Xclipse（AMD RDNA 架构授权）
     * ================================================================== */

    {
      id: 'samsung-xclipse-920-exynos-2200', vendor: 'Samsung', name: 'Samsung Xclipse 920', family: 'Samsung Xclipse (RDNA 2)',
      type: 'mobile-soc', platform: 'phone', year: 2022, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Xclipse 920', 'Samsung Xclipse 920', 'Xclipse920', 'xclipse 920', 'Samsung Xclipse 920 GPU', 'ANGLE (Samsung, Xclipse 920, OpenGL ES 3.2)', 'Exynos 2200', 'Samsung Exynos 2200'],
      specs: { fp32Tflops: 0.5, fp16Tflops: 1, bandwidthGBs: 51.2, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 64, shaderUnits: 384, gpuCores: 3, baseClockMhz: null, boostClockMhz: 1300 },
      note: 'Exynos 2200（Galaxy S22 系列部分市场）；AMD RDNA 2 架构授权，3 CU / 384 ALU；LPDDR5-6400（51.2 GB/s）；ROP/TMU 未公布；「FP32 为推算值：3 CU × 128 FLOP/CU/时钟 × 1300 MHz = 0.50 TFLOPS（RDNA 口径：每 CU 64 FP32 FMA/时钟记 128 FLOP，gpuCores 记 CU 数；厂商未公布，仅供横向参照）；FP16 按 2× 打包口径 = 1.00 TFLOPS」'
    },
    {
      id: 'samsung-xclipse-940', vendor: 'Samsung', name: 'Samsung Xclipse 940', family: 'Samsung Xclipse (RDNA 3)',
      type: 'mobile-soc', platform: 'phone', year: 2024, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Xclipse 940', 'Samsung Xclipse 940', 'Xclipse940', 'xclipse 940', 'Samsung Xclipse 940 GPU', 'ANGLE (Samsung, Xclipse 940, OpenGL ES 3.2)', 'Exynos 2400', 'Samsung Exynos 2400'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: 68.3, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR5X', busWidth: 64, shaderUnits: null, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: 'Exynos 2400（Galaxy S24 / S24+ 部分市场）；AMD RDNA 3 架构授权，支持硬件光追；LPDDR5X-8533（68.3 GB/s）；CU 数与频率官方未公布；「厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'samsung-xclipse-950', vendor: 'Samsung', name: 'Samsung Xclipse 950', family: 'Samsung Xclipse (RDNA)',
      type: 'mobile-soc', platform: 'phone', year: 2025, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Xclipse 950', 'Samsung Xclipse 950', 'Xclipse950', 'xclipse 950', 'Samsung Xclipse 950 GPU', 'ANGLE (Samsung, Xclipse 950, OpenGL ES 3.2)', 'Exynos 2500', 'Samsung Exynos 2500'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: 76.8, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR5X', busWidth: 64, shaderUnits: null, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: 'Exynos 2500（Galaxy Z Flip 7 / S25 系列部分机型）；AMD RDNA 架构授权；LPDDR5X-9600（76.8 GB/s）；规格未公布；「厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'samsung-xclipse-530', vendor: 'Samsung', name: 'Samsung Xclipse 530', family: 'Samsung Xclipse (RDNA 2)',
      type: 'mobile-soc', platform: 'phone', year: 2024, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['Xclipse 530', 'Samsung Xclipse 530', 'Xclipse530', 'xclipse 530', 'Samsung Xclipse 530 GPU', 'ANGLE (Samsung, Xclipse 530, OpenGL ES 3.2)', 'Exynos 1480', 'Samsung Exynos 1480'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: null, busWidth: null, shaderUnits: null, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: 'Exynos 1480（Galaxy A55 / A56 等中端）；AMD RDNA 架构授权的中端 Xclipse；内存与频率口径不一，带宽填 null；「厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },

    /* ==================================================================
     * 七、Imagination PowerVR
     * ================================================================== */

    {
      id: 'img-powervr-dxt-48', vendor: 'Imagination', name: 'IMG DXT-48-1536', family: 'IMG DXT',
      type: 'tablet', platform: 'tablet', year: 2022, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['IMG DXT-48-1536', 'DXT-48-1536', 'IMGDXT-48-1536', 'PowerVR DXT-48-1536', 'Imagination DXT-48-1536', 'IMG DXT', 'ANGLE (Imagination, IMG DXT-48-1536, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: null, busWidth: null, shaderUnits: null, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: 'IMG DXT 为桌面 / 云游戏级 IP（非手机 SoC），仅在 Android 云游戏实例或开发板中出现；列入本库仅用于渲染器字符串识别，规格不公开；「厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'img-powervr-bxm-8-256', vendor: 'Imagination', name: 'IMG BXM-8-256', family: 'IMG BXM',
      type: 'mobile-soc', platform: 'phone', year: 2022, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['IMG BXM-8-256', 'BXM-8-256', 'IMGBXM-8-256', 'PowerVR BXM-8-256', 'Imagination BXM-8-256', 'IMG BXM', 'ANGLE (Imagination, IMG BXM-8-256, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: null, busWidth: null, shaderUnits: null, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: 'IMG BXM 系列中端移动 IP，见于紫光展锐 / 联发科入门 5G SoC 与平板；核心数、频率与带宽依 SoC 而定；「厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'img-powervr-bxt-32-1024', vendor: 'Imagination', name: 'IMG BXT-32-1024', family: 'IMG BXT',
      type: 'mobile-soc', platform: 'phone', year: 2021, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['IMG BXT-32-1024', 'BXT-32-1024', 'IMGBXT-32-1024', 'PowerVR BXT-32-1024', 'Imagination BXT-32-1024', 'IMG BXT', 'ANGLE (Imagination, IMG BXT-32-1024, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: null, busWidth: null, shaderUnits: null, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: 'IMG BXT 系列中高端移动 / 汽车 IP；多用于紫光展锐与车机座舱芯片，规格随集成方变化；「厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'img-powervr-cxt-48-1536', vendor: 'Imagination', name: 'IMG CXT-48-1536', family: 'IMG CXT',
      type: 'tablet', platform: 'tablet', year: 2021, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['IMG CXT-48-1536', 'CXT-48-1536', 'IMGCXT-48-1536', 'PowerVR CXT-48-1536', 'Imagination CXT-48-1536', 'IMG CXT', 'ANGLE (Imagination, IMG CXT-48-1536, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: null, busWidth: null, shaderUnits: null, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: 'IMG CXT 为汽车 / 云游戏级 IP（含硬件光追），常见于智能座舱与云实例；列入本库用于字符串识别，规格不公开；「厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'img-powervr-ge8320', vendor: 'Imagination', name: 'PowerVR Rogue GE8320', family: 'PowerVR Rogue GE',
      type: 'mobile-soc', platform: 'phone', year: 2018, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['PowerVR Rogue GE8320', 'GE8320', 'PowerVR GE8320', 'Imagination PowerVR GE8320', 'powervr rogue ge8320', 'ANGLE (Imagination, PowerVR Rogue GE8320, OpenGL ES 3.2)', 'Helio G25', 'Helio G35', 'Helio A22'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: null, shaderUnits: null, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: '联发科 Helio G25 / G35 / A22（入门 4G SoC）；LPDDR4X-1600，位宽口径不一致故带宽填 null；「厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'img-powervr-ge8322', vendor: 'Imagination', name: 'PowerVR Rogue GE8322', family: 'PowerVR Rogue GE',
      type: 'mobile-soc', platform: 'phone', year: 2019, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['PowerVR Rogue GE8322', 'GE8322', 'PowerVR GE8322', 'Imagination PowerVR GE8322', 'powervr rogue ge8322', 'ANGLE (Imagination, PowerVR Rogue GE8322, OpenGL ES 3.2)', 'Unisoc SC9863A', '紫光展锐 SC9863A'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: null, shaderUnits: null, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: '紫光展锐 SC9863A 等入门 SoC；LPDDR4X；Imagination 不公布 ROP/TMU 数，带宽填 null；「厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'img-powervr-ge8100', vendor: 'Imagination', name: 'PowerVR Rogue GE8100', family: 'PowerVR Rogue GE',
      type: 'mobile-soc', platform: 'phone', year: 2017, api: 'gles', apis: ['gles'], os: ['android'], unifiedMemory: true,
      aliases: ['PowerVR Rogue GE8100', 'GE8100', 'PowerVR GE8100', 'Imagination PowerVR GE8100', 'powervr rogue ge8100', 'ANGLE (Imagination, PowerVR Rogue GE8100, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR3', busWidth: null, shaderUnits: null, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: '入门级 Rogue IP（紫光展锐 / 联发科入门 SoC、低端平板）；LPDDR3/LPDDR4，带宽填 null；「厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'img-powervr-ge9215', vendor: 'Imagination', name: 'PowerVR Rogue GE9215', family: 'PowerVR Rogue GE',
      type: 'mobile-soc', platform: 'phone', year: 2019, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['PowerVR Rogue GE9215', 'GE9215', 'PowerVR GE9215', 'Imagination PowerVR GE9215', 'powervr rogue ge9215', 'ANGLE (Imagination, PowerVR Rogue GE9215, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: null, busWidth: null, shaderUnits: null, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: '入门 / 中低端 Rogue IP（展锐与联发科入门平台、车机）；规格未公开，带宽填 null；「厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'img-powervr-gm9446', vendor: 'Imagination', name: 'PowerVR Rogue GM9446', family: 'PowerVR Rogue GM',
      type: 'mobile-soc', platform: 'phone', year: 2018, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['PowerVR Rogue GM9446', 'GM9446', 'PowerVR GM9446', 'Imagination PowerVR GM9446', 'powervr rogue gm9446', 'ANGLE (Imagination, PowerVR Rogue GM9446, OpenGL ES 3.2)', 'Helio P90', 'Helio P95'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: null, shaderUnits: null, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: '联发科 Helio P90 / P95（2018-2019 中高端，集成 APU）；LPDDR4X-1866，位宽口径不一致故带宽填 null；「厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'img-powervr-ge8300', vendor: 'Imagination', name: 'PowerVR Rogue GE8300', family: 'PowerVR Rogue GE',
      type: 'mobile-soc', platform: 'phone', year: 2017, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['PowerVR Rogue GE8300', 'GE8300', 'PowerVR GE8300', 'Imagination PowerVR GE8300', 'powervr rogue ge8300', 'ANGLE (Imagination, PowerVR Rogue GE8300, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR3', busWidth: null, shaderUnits: null, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: 'Rogue GE8300 四簇入门配置（联发科 / 展锐入门 SoC、平板）；规格未公开，带宽填 null；「厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'img-powervr-g6430', vendor: 'Imagination', name: 'PowerVR G6430', family: 'PowerVR Series6 (Rogue)',
      type: 'mobile-soc', platform: 'phone', year: 2013, api: 'gles', apis: ['gles', 'metal'], os: ['ios'], unifiedMemory: true,
      aliases: ['PowerVR G6430', 'G6430', 'Imagination PowerVR G6430', 'PowerVR SGX G6430', 'powervr g6430', 'ANGLE (Imagination, PowerVR G6430, OpenGL ES 3.0)', 'Apple A7'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR3', busWidth: null, shaderUnits: null, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: 'Apple A7（iPhone 5s / iPad Air，首个 64 位 iPhone）；Series6 四簇 Rogue，LPDDR3；ROP/TMU 未公布；「厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'img-powervr-g6200', vendor: 'Imagination', name: 'PowerVR G6200', family: 'PowerVR Series6 (Rogue)',
      type: 'mobile-soc', platform: 'phone', year: 2014, api: 'gles', apis: ['gles'], os: ['android'], unifiedMemory: true,
      aliases: ['PowerVR G6200', 'G6200', 'Imagination PowerVR G6200', 'powervr g6200', 'ANGLE (Imagination, PowerVR G6200, OpenGL ES 3.0)', 'MT6595'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR3', busWidth: null, shaderUnits: null, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: 'Series6 双簇 Rogue（联发科 MT6595 等 2014 年机型）；LPDDR3；带宽填 null；「厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'img-powervr-gt8525', vendor: 'Imagination', name: 'PowerVR Series8XT GT8525', family: 'PowerVR Series8XT',
      type: 'mobile-soc', platform: 'phone', year: 2017, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['PowerVR Series8XT GT8525', 'GT8525', 'PowerVR GT8525', 'Imagination PowerVR GT8525', 'powervr gt8525', 'ANGLE (Imagination, PowerVR GT8525, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: null, busWidth: null, shaderUnits: null, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: 'Series8XT 高端移动 IP（参考设计与部分平板、车载平台）；无公开成品规格，带宽填 null；「厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'img-powervr-gx6650', vendor: 'Imagination', name: 'PowerVR Series6XT GX6650', family: 'PowerVR Series6XT',
      type: 'tablet', platform: 'tablet', year: 2014, api: 'gles', apis: ['gles', 'metal'], os: ['android', 'ios'], unifiedMemory: true,
      aliases: ['PowerVR Series6XT GX6650', 'GX6650', 'PowerVR GX6650', 'Imagination PowerVR GX6650', 'powervr gx6650', 'ANGLE (Imagination, PowerVR GX6650, OpenGL ES 3.0)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR3', busWidth: null, shaderUnits: null, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: 'Series6XT 六簇 Rogue（2014-2015 平板 / 大屏设备）；LPDDR3；带宽填 null；「厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'img-powervr-gxa6850', vendor: 'Imagination', name: 'PowerVR Series6XT GXA6850', family: 'PowerVR Series6XT',
      type: 'tablet', platform: 'tablet', year: 2014, api: 'gles', apis: ['gles', 'metal'], os: ['ios'], unifiedMemory: true,
      aliases: ['PowerVR Series6XT GXA6850', 'GXA6850', 'PowerVR GXA6850', 'Imagination PowerVR GXA6850', 'powervr gxa6850', 'ANGLE (Imagination, PowerVR GXA6850, OpenGL ES 3.0)', 'Apple A8X'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR3', busWidth: null, shaderUnits: null, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: 'Apple A8X（iPad Air 2）；Series6XT 八簇 Rogue，LPDDR3；规格未公开，带宽填 null；「厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'img-powervr-gx6450', vendor: 'Imagination', name: 'PowerVR Series6XT GX6450', family: 'PowerVR Series6XT',
      type: 'mobile-soc', platform: 'phone', year: 2014, api: 'gles', apis: ['gles', 'metal'], os: ['ios'], unifiedMemory: true,
      aliases: ['PowerVR Series6XT GX6450', 'GX6450', 'PowerVR GX6450', 'Imagination PowerVR GX6450', 'powervr gx6450', 'ANGLE (Imagination, PowerVR GX6450, OpenGL ES 3.0)', 'Apple A8'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR3', busWidth: null, shaderUnits: null, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: 'Apple A8（iPhone 6 / 6 Plus / iPad mini 4）；Series6XT 四簇 Rogue，LPDDR3；带宽填 null；「厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'img-powervr-sgx543mp2', vendor: 'Imagination', name: 'PowerVR SGX543MP2', family: 'PowerVR SGX5',
      type: 'mobile-soc', platform: 'phone', year: 2011, api: 'gles', apis: ['gles'], os: ['ios'], unifiedMemory: true,
      aliases: ['PowerVR SGX543MP2', 'SGX543MP2', 'PowerVR SGX543', 'Imagination PowerVR SGX543MP2', 'powervr sgx543mp2', 'ANGLE (Imagination, PowerVR SGX543MP2, OpenGL ES 2.0)', 'Apple A5'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR2', busWidth: null, shaderUnits: null, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: 'Apple A5（iPhone 4S / iPad 2，双核 SGX543）；仅 OpenGL ES 2.0，无 Vulkan/Metal；带宽填 null；「厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'img-powervr-sgx543mp3', vendor: 'Imagination', name: 'PowerVR SGX543MP3', family: 'PowerVR SGX5',
      type: 'mobile-soc', platform: 'phone', year: 2012, api: 'gles', apis: ['gles'], os: ['ios'], unifiedMemory: true,
      aliases: ['PowerVR SGX543MP3', 'SGX543MP3', 'PowerVR SGX543MP3 GPU', 'Imagination PowerVR SGX543MP3', 'powervr sgx543mp3', 'ANGLE (Imagination, PowerVR SGX543MP3, OpenGL ES 2.0)', 'Apple A6'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR2', busWidth: null, shaderUnits: null, gpuCores: null, baseClockMhz: null, boostClockMhz: null },
      note: 'Apple A6 / A6X 世代（iPhone 5 / iPad 4，三核 SGX543）；仅 OpenGL ES 2.0；带宽填 null；「厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },

    /* ==================================================================
     * 八、MediaTek（联发科平台口径，用于 ANGLE 厂商字段上报 MediaTek 的机型）
     * ================================================================== */

    {
      id: 'mediatek-mali-g57-mc2-helio-g99', vendor: 'MediaTek', name: 'MediaTek Mali-G57 MC2 (Helio G99)', family: 'MediaTek Helio G',
      type: 'mobile-soc', platform: 'phone', year: 2022, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['MediaTek Mali-G57 MC2', 'MTK Mali-G57 MC2', 'MediaTek Mali-G57', 'MediaTek Helio G99', 'MT6789', 'MediaTek MT6789', 'ANGLE (MediaTek, Mali-G57 MC2, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: null, shaderUnits: null, gpuCores: 2, baseClockMhz: null, boostClockMhz: null },
      note: '联发科 Helio G99（MT6789）；部分驱动/ANGLE 会把厂商字段上报为 MediaTek；GPU IP 同 ARM Mali-G57 MC2；LPDDR4X，带宽填 null；「GPU 频率无可靠公开口径（核心数 2 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'mediatek-mali-g52-mc2-helio-g85', vendor: 'MediaTek', name: 'MediaTek Mali-G52 MC2 (Helio G85/G88)', family: 'MediaTek Helio G',
      type: 'mobile-soc', platform: 'phone', year: 2020, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['MediaTek Mali-G52 MC2', 'MTK Mali-G52 MC2', 'MediaTek Mali-G52', 'MediaTek Helio G85', 'MediaTek Helio G88', 'MediaTek Helio G96', 'MT6769', 'ANGLE (MediaTek, Mali-G52 MC2, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: null, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR4X', busWidth: null, shaderUnits: null, gpuCores: 2, baseClockMhz: null, boostClockMhz: null },
      note: '联发科 Helio G70 / G80 / G85 / G88 / G96（MT6769 系列）；GPU IP 同 ARM Mali-G52 MC2；LPDDR4X，带宽填 null；「GPU 频率无可靠公开口径（核心数 2 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'mediatek-mali-g610-mc6-dimensity-8100', vendor: 'MediaTek', name: 'MediaTek Mali-G610 MC6 (Dimensity 8100)', family: 'MediaTek Dimensity',
      type: 'mobile-soc', platform: 'phone', year: 2022, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['MediaTek Mali-G610 MC6', 'MTK Mali-G610 MC6', 'MediaTek Mali-G610', 'MediaTek Dimensity 8100', 'MediaTek Dimensity 8200', 'MT6895', 'ANGLE (MediaTek, Mali-G610 MC6, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: 51.2, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR5', busWidth: 64, shaderUnits: null, gpuCores: 6, baseClockMhz: null, boostClockMhz: null },
      note: '联发科 天玑 8100 / 8200（MT6895）；GPU IP 同 ARM Mali-G610 MC6；LPDDR5-6400（51.2 GB/s）；「GPU 频率无可靠公开口径（核心数 6 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    },
    {
      id: 'mediatek-mali-g615-mc6-dimensity-8300', vendor: 'MediaTek', name: 'MediaTek Mali-G615 MC6 (Dimensity 8300)', family: 'MediaTek Dimensity',
      type: 'mobile-soc', platform: 'phone', year: 2023, api: 'gles', apis: ['gles', 'vulkan'], os: ['android'], unifiedMemory: true,
      aliases: ['MediaTek Mali-G615 MC6', 'MTK Mali-G615 MC6', 'MediaTek Mali-G615', 'MediaTek Dimensity 8300', 'MediaTek Dimensity 8350', 'MT6897', 'ANGLE (MediaTek, Mali-G615 MC6, OpenGL ES 3.2)'],
      specs: { fp32Tflops: null, fp16Tflops: null, bandwidthGBs: 68.3, pixelRateGps: null, texelRateGts: null, triangleRateGts: null, vramGB: null, memType: 'LPDDR5X', busWidth: 64, shaderUnits: null, gpuCores: 6, baseClockMhz: null, boostClockMhz: null },
      note: '联发科 天玑 8300 / 8350（MT6897）；GPU IP 同 ARM Mali-G615 MC6；LPDDR5X-8533（68.3 GB/s）；「GPU 频率无可靠公开口径（核心数 6 已知），厂商未公布每核心 ALU 数，理论峰值无法归一化，保持 null」'
    }

  ]
});
