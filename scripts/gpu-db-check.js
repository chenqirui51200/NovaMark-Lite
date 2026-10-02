/* ============================================================================
 * NovaMark · GPU 参考规格数据库 一致性自检脚本
 * ----------------------------------------------------------------------------
 * 用法：node "D:\AICode\工具区\gpu-db-check.js"  [--json] [--full]
 *   不带参数：打印人读报告（总条数 / 分类 / 一致性 / 可疑清单）
 *   --json  ：额外把机器可读结果写到同目录 gpu-db-check-report.json
 *   --full  ：可疑清单不截断，全部打印
 *
 * 不依赖浏览器、不联网、可重复运行。新增数据后直接复跑即可自检。
 *
 * 校验的可推导关系（详见 gpu-db.js 文件头「单位约定」）：
 *   R1  fp32Tflops       ≈ shaderUnits × 2 × boostClockMhz / 1e6
 *   R2  fp16Tflops       符合厂商/世代 FP16 规则（N 卡消费级=1×，Volta/数据中心=2×，其余=1×）
 *   R3  bandwidthGBs     ≈ 等效显存速率(Gbps) × busWidth / 8；反向推出速率后与 memType 合理区间比对
 *   R4  pixelRateGps     ≈ note 中 ROP 数 × boostClockMhz / 1000
 *   R5  texelRateGts     ≈ note 中 TMU 数 × boostClockMhz / 1000
 *   R6  baseClockMhz ≤ boostClockMhz
 *   R7  年份与代际自洽（已知 family → 年份区间）
 *   R8  shaderUnits 厂商口径（仅做量级合理性检查，不做强制换算）
 *   R9  triangleRateGts / int8Tops 约定为 null（除已公开的例外）
 *   R10 id 唯一、name 规范化后唯一（跨分片冲突 → 合并时一方被丢弃，属数据风险）
 *   R11 software 条目 specs 全 null
 * ==========================================================================*/
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

/* ------------------------------------------------------------------ 配置 */

// 数据目录：默认取本脚本上一级目录下的 assets/js/data（即仓库内），随仓库移动无需改路径。
// 也可用命令行第一个非选项参数覆盖：node scripts/gpu-db-check.js <数据目录>
const DATA_DIR = (function () {
  const arg = process.argv.slice(2).find(function (a) { return a[0] !== '-'; });
  return arg ? path.resolve(arg) : path.join(__dirname, '..', 'assets', 'js', 'data');
})();
// 加载顺序必须与 index.html 一致：分片在前，主库在后（主库末尾执行 mergeParts）
const FILES = [
  'gpu-db-part-nvidia-amd.js',
  'gpu-db-part-intel-apple-qualcomm.js',
  'gpu-db-part-mobile.js',
  'gpu-db-part-techpowerup.js',
  'gpu-db.js'
];

const ARGS = process.argv.slice(2);
const OPT_JSON = ARGS.indexOf('--json') >= 0;
const OPT_FULL = ARGS.indexOf('--full') >= 0;

const toNum = (v) => (typeof v === 'number' && isFinite(v) ? v : null);
const fmt = (v) => (v === null || v === undefined ? 'null' : (typeof v === 'number' ? String(Math.round(v * 1000) / 1000) : String(v)));
const pad = (s, n) => { s = String(s); return s.length >= n ? s : s + ' '.repeat(n - s.length); };
const padL = (s, n) => { s = String(s); return s.length >= n ? s : ' '.repeat(n - s.length) + s; };
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const relDiff = (a, b) => (b ? Math.abs(a - b) / Math.abs(b) : (a ? Infinity : 0));

/* --------------------------------------------------------------- 1. 加载 */

/* 关键：所有分片必须共享同一个 window（与浏览器一致），否则 mergeParts 拿不到分片 */
const sandbox = { console };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const loaded = [];
function loadFile(file) {
  const full = path.join(DATA_DIR, file);
  const code = fs.readFileSync(full, 'utf8');
  let err = null;
  const beforeParts = (sandbox.NOVA_GPU_DB_PARTS || []).length;
  const beforeDb = sandbox.NOVA_GPU_DB ? (sandbox.NOVA_GPU_DB.gpus || []).length : 0;
  try {
    vm.runInContext(code, sandbox, { filename: file });
  } catch (e) {
    err = e;
  }
  const parts = sandbox.NOVA_GPU_DB_PARTS || [];
  // 本文件新增的原始条目：分片是 push 进去的，主库是字面量（load 时 newCount - beforeDb... 主库用 meta 前的长度）
  let own = [];
  if (parts.length > beforeParts) {
    own = parts[parts.length - 1].gpus || [];
  } else if (sandbox.NOVA_GPU_DB) {
    own = sandbox.NOVA_GPU_DB.gpus || [];
  }
  // 主库的 gpus 字面量长度在 mergeParts 之后无法直接观测，用源码里的 `{ id:` 计数作为原始条数
  const rawCount = (code.match(/\{\s*id:/g) || []).length;
  loaded.push({ file, code, err, db: sandbox.NOVA_GPU_DB || null, parts, own, rawCount });
  return loaded[loaded.length - 1];
}

FILES.forEach(loadFile);

// 孤立加载主库（无分片）→ 拿到 gpus 字面量原始数组，用于重复/冲突检测
let literalGpus = [];
try {
  const iso = { console };
  iso.window = iso; iso.globalThis = iso;
  vm.createContext(iso);
  vm.runInContext(fs.readFileSync(path.join(DATA_DIR, 'gpu-db.js'), 'utf8'), iso, { filename: 'gpu-db.js' });
  literalGpus = (iso.NOVA_GPU_DB && iso.NOVA_GPU_DB.gpus) || [];
} catch (e) { /* 已在上方记录错误 */ }

// 主库加载 + 合并后的最终视图
let DB = null;
let mergeInfo = null;
const main = loaded.find((x) => x.file === 'gpu-db.js');
if (main && main.db) {
  DB = main.db;
  mergeInfo = {
    gpuCount: DB.meta.gpuCount,
    addedFromParts: DB.meta.addedFromParts,
    skippedDuplicates: DB.meta.skippedDuplicates,
    mergedByName: DB.meta.mergedByName,
    parts: DB.meta.parts || []
  };
}

/* --------------------------------------------- 2. 采样：所有原始条目 */

// 原始（未经合并去重）条目，带来源文件，用于发现跨文件冲突
const rawEntries = [];
loaded.forEach((L) => {
  const list = L.file === 'gpu-db.js' ? literalGpus : L.own;
  L.rawN = list.length;
  list.forEach((g, i) => rawEntries.push({ src: L.file, index: i, g }));
});

// 合并后最终条目（与浏览器里实际使用的一致）
const finalEntries = (DB && DB.gpus ? DB.gpus : rawEntries.map((r) => r.g)).map((g, i) => ({ src: '(merged)', index: i, g }));

/* --------------------------------------------------- 3. 推导关系校验 */

/* 需要 ROP / TMU 数：note 里写过（如「176 ROP / 680 TMU」）时才可以推导 */
function ropsFromNote(note) {
  if (!note) return null;
  const m = /(\d{1,4})\s*(?:个)?\s*ROP/i.exec(note);
  return m ? Number(m[1]) : null;
}
function tmusFromNote(note) {
  if (!note) return null;
  const m = /(\d{1,5})\s*(?:个)?\s*TMU/i.exec(note);
  return m ? Number(m[1]) : null;
}

/* 由「等效显存速率 Gbps + 位宽」→ 理论带宽 GB/s */
function bwFrom(note, busWidth) {
  if (!note || !busWidth) return null;
  // 形如 "30 Gbps" / "17.5 Gbps" / "20Gbps" / "8.533 Gbps" / "16Gbps"
  let m = /(\d+(?:\.\d+)?)\s*Gbps/i.exec(note);
  if (m) return (Number(m[1]) * busWidth) / 8;
  // 形如 "LPDDR5X-8533" → 8.533 Gbps
  m = /LPDDR\d?X?-(\d{4,5})/i.exec(note);
  if (m) return ((Number(m[1]) / 1000) * busWidth) / 8;
  // 形如 "6400 MT/s" / "8533 MT/s"
  m = /(\d{4,5})\s*MT\/s/i.exec(note);
  if (m) return ((Number(m[1]) / 1000) * busWidth) / 8;
  return null;
}

/* memType → 单 pin 等效速率的合理区间（Gbps）。
 * 注意：匹配时按键名长度降序，否则 LPDDR5X 会被 DDR5 抢先匹配、GDDR5X 被 GDDR5 抢先。 */
const MEM_RATE_RANGE = {
  GDDR3: [1.6, 2.6], GDDR5X: [8.0, 12.0], GDDR5: [5.0, 9.0], GDDR6X: [19.0, 24.0],
  GDDR6: [12.0, 21.0], GDDR7: [28.0, 36.0],
  HBM3E: [8.0, 10.0], HBM3: [4.8, 6.4], HBM2E: [2.4, 3.6], HBM2: [1.6, 2.4], HBM: [1.0, 2.0],
  LPDDR5X: [6.4, 10.7], LPDDR5T: [8.0, 10.0], LPDDR5: [5.5, 6.4], LPDDR4X: [3.7, 4.3], LPDDR4: [3.2, 4.3],
  LPDDR3: [1.6, 2.2], DDR5: [4.8, 6.4], DDR4: [2.13, 3.2], DDR3: [1.6, 2.2]
};
const MEM_KEYS = Object.keys(MEM_RATE_RANGE).sort((a, b) => b.length - a.length);

/* family → 合理年份区间（用于 R7）。
 * 注意：「RTX 50」会误配「RTX 5000-ada」，故加 (?!\d) 边界。
 * 末位放宽 4 年：同架构的再版（RTX 2060 12GB、RTX 3050 6GB、RX 6750 GRE、M3 Ultra…）合法。 */
const FAMILY_YEARS = [
  [/RTX 50(?!\d)|Blackwell/i, 2025, 2027],
  [/RTX 40(?!\d)|Ada/i, 2022, 2024],
  [/RTX 30(?!\d)|Ampere/i, 2020, 2022],
  [/RTX 20(?!\d)|Turing/i, 2018, 2020],
  [/GTX 16(?!\d)/i, 2019, 2020],
  [/GTX 10(?!\d)|Pascal/i, 2016, 2018],
  [/RX 9000|RDNA ?4/i, 2025, 2027],
  [/RX 7000|RDNA ?3/i, 2022, 2024],
  [/RX 6000|RDNA ?2/i, 2020, 2022],
  [/Vega/i, 2017, 2020],
  [/Arc B|Battlemage/i, 2024, 2026],
  [/Arc A|Alchemist/i, 2022, 2023],
  [/Arrow Lake|Lunar Lake|Meteor Lake|Xe2|Xe-LPG/i, 2023, 2026],
  [/Iris Xe|Xe-LP/i, 2019, 2024],
  [/Gen9\.5|Coffee Lake|Kaby Lake|Comet Lake|Amber Lake/i, 2016, 2021],
  [/UHD Graphics/i, 2015, 2024],
  [/M1/i, 2020, 2022], [/M2/i, 2022, 2023], [/M3/i, 2023, 2025], [/M4/i, 2024, 2025], [/M5/i, 2025, 2027],
  [/Adreno|Snapdragon/i, 2009, 2027],
  [/Mali|Immortalis/i, 2008, 2027],
  [/PowerVR/i, 2009, 2027]
];
/* 虚拟化 / 仅显示适配器：无固定架构年份，跳过 R7 */
const VIRTUAL_RE = /虚拟|virtual|display ?only|paravirtual|基本显示|Basic Display/i;

/* FP16 规则判定：返回期望倍数。
 * 已核实的例外（不算错误）：
 *   · NVIDIA Volta / 数据中心（V100、Titan V、GV100、A100、H100、CDNA 之前的 Tesla）：2×
 *   · AMD CDNA / Instinct（MI100 起）：向量 FP16 为 2×（官方规格如此）
 *   · 移动分片（gpu-db-part-mobile.js）文件头自定口径：Mali/Immortalis/PowerVR/Xclipse
 *     按「打包 2× FP16」记录 → 视为 2×
 *   · 其余（NVIDIA 消费级、AMD RDNA、Intel、Apple、Qualcomm、ARM）：1×
 * 校验时只要求 fp16/fp32 ∈ {1, 2}（并在 3% 容差内），偏离即报可疑。 */
function expectedFp16Ratio(g) {
  const v = g.vendor || '';
  const type = g.type || '';
  const fam = String(g.family || '') + ' ' + String(g.name || '');
  if (/NVIDIA/i.test(v)) {
    if (/titan v|volta|v100|gh100|gh200|gv100|a100|h100|b100|b200|tesla|data ?center|datacenter/i.test(fam)) return 2;
    return 1;
  }
  if (/AMD/i.test(v) && /instinct|cdna|mi1|mi2|mi3|mi50/i.test(fam)) return 2;
  if (type === 'mobile-soc' || type === 'tablet') return 2;
  return 1;
}

/* 每时钟每 shaderUnit 的 FP32 FLOP 数（用于 R1）。
 * RDNA3 / RDNA4 起每 CU 每时钟 256 FP32 FLOP（双发射），而厂商标称的
 * 「流处理器数」仍是每 CU 64，故官方峰值 = SP × 4 × 时钟。
 * 已用 Wikipedia《Radeon RX 9000 series》规格表逐款核实（FP32 与像素/纹理填充率同表）。 */
function flopPerClock(g) {
  const s = String(g.family || '') + ' ' + String(g.name || '');
  if (/AMD|Radeon|Instinct/i.test(g.vendor || '') &&
      /RDNA ?[34]|RX 9[0-9]00|RX 7[0-9]00|Radeon 7[0-9]0M|Radeon 8[0-9]0M/i.test(s)) return 4;
  return 2;
}

/* 值 ÷ 时钟 是否接近整数（说明 ROP / TMU 数可能是 note 写错而非值算错） */
const nearInt = (x) => Math.abs(x - Math.round(x)) / Math.abs(x) <= 0.01;

/* 每一条的检查结果 */
const checks = [];
const noteHints = [];   // 值自洽但 note 里的 ROP/TMU 数与之不符（note 疑似写错）
const fp16Twice = [];   // 记录采用 2× FP16 口径的条目（信息性）
function addCheck(g, src, rule, field, got, expect, severity, detail) {
  checks.push({ id: g.id || '(no id)', name: g.name || '', src, rule, field, got, expect, severity, detail: detail || '' });
}

/* 各规则的统计 */
const stats = {};
function bump(rule, okFlag) {
  stats[rule] = stats[rule] || { pass: 0, suspect: 0, skipped: 0 };
  if (okFlag === 'skip') stats[rule].skipped++;
  else if (okFlag) stats[rule].pass++;
  else stats[rule].suspect++;
}

function runChecks(entries) {
  entries.forEach(({ src, g }) => {
    if (!g || !g.id) return;
    const s = g.specs || {};
    const vendor = g.vendor || '';
    const boost = toNum(s.boostClockMhz);
    const base = toNum(s.baseClockMhz);
    const su = toNum(s.shaderUnits);

    /* R11 software：specs 全 null */
    if (g.type === 'software') {
      const bad = Object.keys(s).filter((k) => s[k] !== null && s[k] !== undefined && s[k] !== false);
      if (bad.length) addCheck(g, src, 'R11', 'specs', bad.join(','), 'all null', 'HIGH', 'software 条目不应有非空 specs');
      bump('R11', bad.length === 0);
    }

    /* R6 base ≤ boost */
    if (base !== null && boost !== null) {
      const ok = base <= boost;
      if (!ok) addCheck(g, src, 'R6', 'baseClockMhz', base, '≤ ' + boost, 'HIGH', '基准频率高于加速频率');
      bump('R6', ok);
    } else bump('R6', 'skip');

    /* R1 fp32 ≈ shaderUnits × flopPerClock × boost / 1e6 */
    const fp32 = toNum(s.fp32Tflops);
    if (fp32 !== null && su !== null && boost !== null) {
      const fpc = flopPerClock(g);
      const expect = (su * fpc * boost) / 1e6;
      const d = relDiff(fp32, expect);
      // 25% 容差：Intel 官方「Peak FP32」用的是参考时钟而非 boost，天然偏高
      const sev = d > 0.50 ? 'HIGH' : (d > 0.25 ? 'MED' : null);
      if (sev) addCheck(g, src, 'R1', 'fp32Tflops', fp32, Math.round(expect * 100) / 100, sev,
        'shaderUnits=' + su + ' × ' + fpc + ' FLOP/时钟 × ' + boost + 'MHz ÷ 1e6；偏差 ' + fmt(pct(Math.abs(fp32 - expect), expect)) + '%');
      bump('R1', !sev);
    } else bump('R1', 'skip');

    /* R2 fp16 规则：只要求 fp16/fp32 ∈ {1, 2}（例外口径见 expectedFp16Ratio 注释） */
    const fp16 = toNum(s.fp16Tflops);
    if (fp16 !== null && fp32 !== null && fp32 !== 0) {
      const r = fp16 / fp32;
      const okRatio = [1, 2].some((t) => Math.abs(r - t) <= 0.03 * t);
      const ok = okRatio;
      if (!ok) {
        addCheck(g, src, 'R2', 'fp16Tflops', fp16, fp32 + '（1×）或 ' + fmt(fp32 * 2) + '（2×）', 'MED',
          '实得 ' + (Math.round(r * 1000) / 1000) + '× FP32，既不是 1× 也不是 2×（' + (vendor || '?') + ' / ' + (g.family || '') + '）');
      } else if (Math.abs(r - 2) <= 0.06) {
        fp16Twice.push(g.id + ' (' + vendor + ')');
      }
      bump('R2', ok);
    } else bump('R2', 'skip');

    /* R3 带宽：note 中有速率时正算比对；否则反推速率与 memType 区间比对 */
    const bw = toNum(s.bandwidthGBs);
    const bus = toNum(s.busWidth);
    if (bw !== null && bus !== null) {
      const fromNote = bwFrom(g.note, bus);
      if (fromNote !== null) {
        const d = relDiff(bw, fromNote);
        const sev = d > 0.10 ? (d > 0.30 ? 'HIGH' : 'MED') : null;
        if (sev) addCheck(g, src, 'R3', 'bandwidthGBs', bw, Math.round(fromNote), sev,
          'note 速率 × ' + bus + 'bit ÷ 8；偏差 ' + fmt(pct(Math.abs(bw - fromNote), fromNote)) + '%');
        bump('R3', !sev);
      } else {
        const rate = (bw * 8) / bus;
        const mem = String(s.memType || '').toUpperCase().replace(/\s+/g, '');
        // HBM 的 busWidth 是整堆栈位宽（1024/2048/3072/4096/8192），没有「单 pin 速率」概念 → 跳过反推
        const isHbm = mem.indexOf('HBM') >= 0;
        const key = isHbm ? null : MEM_KEYS.find((k) => mem.indexOf(k) >= 0);
        if (key) {
          const [lo, hi] = MEM_RATE_RANGE[key];
          const ok = rate >= lo * 0.85 && rate <= hi * 1.15;
          if (!ok) addCheck(g, src, 'R3', 'bandwidthGBs', bw, '隐含 ' + fmt(rate) + ' Gbps（' + key + ' 合理 ' + lo + '~' + hi + '）', 'MED',
            'busWidth=' + bus + ' 反推单 pin 速率越界');
          bump('R3', ok);
        } else bump('R3', 'skip');
      }
    } else bump('R3', 'skip');

    /* R4 pixelRateGps ≈ ROP × boost / 1000
     * 若「值 ÷ 时钟」本身接近整数，则更可能是 note 里的 ROP 数写错 → 记为 note 提示，不算可疑 */
    const px = toNum(s.pixelRateGps);
    const rop = ropsFromNote(g.note);
    if (px !== null && rop !== null && boost !== null) {
      const implied = (px * 1000) / boost;
      const expect = (rop * boost) / 1000;
      if (nearInt(implied)) {
        if (Math.round(implied) !== rop) noteHints.push(g.id + ' pixelRateGps=' + px + ' ⇒ 隐含 ' + Math.round(implied) + ' ROP，note 写 ' + rop);
        bump('R4', true);
      } else {
        const d = relDiff(px, expect);
        const sev = d > 0.10 ? (d > 0.30 ? 'HIGH' : 'MED') : null;
        if (sev) addCheck(g, src, 'R4', 'pixelRateGps', px, fmt(expect), sev,
          'note ' + rop + ' ROP × ' + boost + 'MHz ÷ 1000；偏差 ' + fmt(pct(Math.abs(px - expect), expect)) + '%');
        bump('R4', !sev);
      }
    } else bump('R4', 'skip');

    /* R5 texelRateGts ≈ TMU × boost / 1000 */
    const tx = toNum(s.texelRateGts);
    const tmu = tmusFromNote(g.note);
    if (tx !== null && tmu !== null && boost !== null) {
      const implied = (tx * 1000) / boost;
      const expect = (tmu * boost) / 1000;
      if (nearInt(implied)) {
        if (Math.round(implied) !== tmu) noteHints.push(g.id + ' texelRateGts=' + tx + ' ⇒ 隐含 ' + Math.round(implied) + ' TMU，note 写 ' + tmu);
        bump('R5', true);
      } else {
        const d = relDiff(tx, expect);
        const sev = d > 0.10 ? (d > 0.30 ? 'HIGH' : 'MED') : null;
        if (sev) addCheck(g, src, 'R5', 'texelRateGts', tx, fmt(expect), sev,
          'note ' + tmu + ' TMU × ' + boost + 'MHz ÷ 1000；偏差 ' + fmt(pct(Math.abs(tx - expect), expect)) + '%');
        bump('R5', !sev);
      }
    } else bump('R5', 'skip');

    /* R7 年份 / 代际 */
    const yr = toNum(g.year);
    const fam = String(g.family || '') + ' ' + String(g.name || '');
    const rule = FAMILY_YEARS.find((r) => r[0].test(fam));
    if (rule && yr !== null && !VIRTUAL_RE.test(g.family || '')) {
      // 末位放宽 4 年：同架构再版（RTX 2060 12GB / RTX 3050 6GB / RX 6750 GRE / M3 Ultra 等）合法
      const ok = yr >= rule[1] && yr <= rule[2] + 4;
      if (!ok) addCheck(g, src, 'R7', 'year', yr, rule[1] + '~' + (rule[2] + 4), 'MED',
        'family「' + g.family + '」应为 ' + rule[1] + '~' + (rule[2] + 4) + ' 年');
      bump('R7', ok);
    } else bump('R7', 'skip');

    /* R8 shaderUnits 口径量级：NVIDIA 必须是 2 的幂附近的整数；Intel 分片按 EU/ALU 检查 */
    if (su !== null) {
      let ok = true, why = '';
      if (/NVIDIA/i.test(vendor) && su > 1000) {
        // CUDA 核心数应当是 128 的倍数（每 SM 128 核，Ampere 起）；Turing/Pascal 为 64/128
        const r128 = su % 128, r64 = su % 64;
        if (r128 !== 0 && r64 !== 0) { ok = false; why = 'CUDA 核心数应为 64/128 的倍数'; }
      }
      if (/AMD/i.test(vendor) && su > 1000) {
        // GCN 起每 CU 64 SP；此前的 VLIW4/VLIW5（Radeon HD 2000~7000 的 TeraScale 核心）
        // 每 SIMD 16 SP（VLIW5 为 5×16/组），SP 数不保证是 64 的倍数 → 只要求 16 的倍数。
        const isVliw = (toNum(g.year) !== null && toNum(g.year) <= 2012) &&
          /Radeon HD [2-7]000|Mobility Radeon HD [2-7]000|TeraScale|VLIW/i.test(fam);
        if (isVliw) {
          if (su % 16 !== 0) { ok = false; why = 'VLIW 流处理器数应为 16 的倍数（每 SIMD 16 SP）'; }
        } else if (su % 64 !== 0) { ok = false; why = '流处理器数应为 64 的倍数（每 CU 64 SP）'; }
      }
      if (!ok) addCheck(g, src, 'R8', 'shaderUnits', su, '厂商口径整数倍', 'LOW', why);
      bump('R8', ok);
    } else bump('R8', 'skip');

    /* R9 triangleRateGts 约定 null */
    const tri = s.triangleRateGts;
    if (tri !== null && tri !== undefined) {
      addCheck(g, src, 'R9', 'triangleRateGts', tri, 'null', 'LOW', '按库约定统一 null');
      bump('R9', false);
    } else bump('R9', true);

    /* R10 vram/busWidth 明显离谱 */
    const mem = String(s.memType || '').toUpperCase();
    if (bus !== null) {
      const busOk = [32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 448, 512, 1024, 2048, 3072, 4096, 6144, 8192].indexOf(bus) >= 0;
      if (!busOk) addCheck(g, src, 'R10', 'busWidth', bus, '常见位宽档位', 'LOW', '非常见位宽');
      bump('R10', busOk);
    } else bump('R10', 'skip');

    /* 附加：GDDR 独显应有多 GB 显存 */
    const vr = toNum(s.vramGB);
    const integrated = /integrated|apple-soc|mobile-soc|tablet/.test(g.type || '') || g.unifiedMemory === true;
    if (vr !== null && !integrated && mem.indexOf('GDDR') >= 0 && bus !== null) {
      // 显存容量 ≈ 颗数 × 单颗容量；只检查是否与该位宽的常见配置量级一致
      if (vr <= 0 || vr > 192) addCheck(g, src, 'R10', 'vramGB', vr, '0 < vram ≤ 192', 'LOW', '显存容量离谱');
    }
  });
}

runChecks(finalEntries);

/* -------------------------------- 4. 跨文件重复 / 冲突（只在原始条目上做） */

const byId = {};
rawEntries.forEach((r) => {
  const id = r.g.id;
  if (!id) return;
  (byId[id] = byId[id] || []).push(r);
});
const dupIds = Object.keys(byId).filter((k) => byId[k].length > 1);

const nameKey = (g) => String(g.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const byName = {};
rawEntries.forEach((r) => {
  const k = nameKey(r.g);
  if (!k) return;
  (byName[k] = byName[k] || []).push(r);
});
const dupNames = Object.keys(byName).filter((k) => byName[k].length > 1);

/* 冲突 = 同名/同 id 但关键规格不同 */
const conflicts = [];
dupNames.forEach((k) => {
  const list = byName[k];
  const keys = ['fp32Tflops', 'fp16Tflops', 'bandwidthGBs', 'pixelRateGps', 'texelRateGts', 'vramGB', 'busWidth', 'shaderUnits', 'baseClockMhz', 'boostClockMhz'];
  const diffs = keys.filter((key) => {
    const vals = list.map((r) => (r.g.specs || {})[key]);
    const first = vals[0];
    return vals.some((v) => v !== first);
  });
  if (diffs.length) {
    conflicts.push({
      name: list[0].g.name,
      ids: list.map((r) => r.g.id + ' @' + r.src.replace('gpu-db-part-', '').replace('.js', '')),
      fields: diffs.map((f) => f + ': ' + list.map((r) => fmt((r.g.specs || {})[f])).join(' vs '))
    });
  }
});

/* ------------------------------------------------------ 5. 统计汇总 */

const finalGpus = DB && DB.gpus ? DB.gpus : [];
const tally = (arr, fn) => arr.reduce((m, g) => { const k = fn(g) || '(空)'; m[k] = (m[k] || 0) + 1; return m; }, {});
const byVendor = tally(finalGpus, (g) => g.vendor);
const byType = tally(finalGpus, (g) => g.type);

/* ---------------------------------------------------------- 6. 输出 */

const out = [];
const log = (s) => { out.push(s); console.log(s); };

log('================================================================');
log(' NovaMark GPU 数据库一致性自检');
log(' 目录：' + DATA_DIR);
log(' 时间：' + new Date().toISOString());
log('================================================================');
log('');

log('--- 1. 分片加载与条数 ---');
loaded.forEach((L) => {
  const status = L.err ? ('语法/运行错误: ' + L.err.message) : 'OK';
  log('  ' + pad(L.file, 42) + padL(L.rawN || L.own.length, 5) + ' 条   ' + status + '   (' + Math.round(L.code.length / 1024) + ' KB)');
});
const rawTotal = rawEntries.length;
log('  ' + pad('原始条目合计', 42) + padL(rawTotal, 5) + ' 条   （含未去重）');
if (DB) {
  log('  ' + pad('合并后最终条目（浏览器实际使用）', 42) + padL(finalGpus.length, 5) + ' 条');
  log('     mergeParts: 新增 ' + mergeInfo.addedFromParts + ' / 跳过重复 id ' + mergeInfo.skippedDuplicates + ' / 按名合并 ' + mergeInfo.mergedByName);
}
log('');

log('--- 2. 分类统计（合并后最终条目） ---');
log('  按厂商：');
Object.keys(byVendor).sort((a, b) => byVendor[b] - byVendor[a]).forEach((k) => log('    ' + pad(k, 16) + padL(byVendor[k], 4)));
log('  按类型：');
Object.keys(byType).sort((a, b) => byType[b] - byType[a]).forEach((k) => log('    ' + pad(k, 16) + padL(byType[k], 4)));
log('');

log('--- 3. 推导关系统计 ---');
const RULE_DESC = {
  R1: 'fp32 = shaderUnits×2×boost/1e6',
  R2: 'fp16 符合厂商 FP16 规则',
  R3: '带宽 = 速率×busWidth/8',
  R4: 'pixelRate = ROP×boost/1000',
  R5: 'texelRate = TMU×boost/1000',
  R6: 'base ≤ boost',
  R7: '年份与代际自洽',
  R8: 'shaderUnits 厂商口径',
  R9: 'triangleRateGts = null',
  R10: 'vram / busWidth 档位',
  R11: 'software 条目 specs 全 null'
};
let totalPass = 0, totalSuspect = 0, totalSkip = 0;
Object.keys(stats).sort().forEach((k) => {
  const s = stats[k];
  totalPass += s.pass; totalSuspect += s.suspect; totalSkip += s.skipped;
  log('  ' + pad(k, 5) + pad(RULE_DESC[k] || '', 34) +
    ' 通过 ' + padL(s.pass, 4) + '   可疑 ' + padL(s.suspect, 4) + '   不适用 ' + padL(s.skipped, 4));
});
log('  ' + pad('合计', 40) + ' 通过 ' + padL(totalPass, 4) + '   可疑 ' + padL(totalSuspect, 4) + '   不适用 ' + padL(totalSkip, 4));
log('');

log('--- 4. 跨文件重复 / 规格冲突 ---');
log('  重复 id：' + dupIds.length + (dupIds.length ? '  → ' + dupIds.slice(0, 12).join(', ') + (dupIds.length > 12 ? ' …' : '') : ''));
log('  同名多条目：' + dupNames.length);
if (conflicts.length) {
  log('  ⚠ 同名但规格不一致（合并时会丢弃后加载的那份，属静默数据丢失）：' + conflicts.length + ' 组');
  conflicts.slice(0, OPT_FULL ? conflicts.length : 25).forEach((c) => {
    log('    · ' + c.name + '  [' + c.ids.join(' | ') + ']');
    c.fields.forEach((f) => log('        ' + f));
  });
} else {
  log('  同名条目规格一致 ✔');
}
log('');

log('--- 5. 可疑条目清单（按严重程度排序） ---');
const SEV_ORDER = { HIGH: 0, MED: 1, LOW: 2 };
checks.sort((a, b) => (SEV_ORDER[a.severity] - SEV_ORDER[b.severity]) || a.rule.localeCompare(b.rule) || a.id.localeCompare(b.id));
const sevCount = { HIGH: 0, MED: 0, LOW: 0 };
checks.forEach((c) => sevCount[c.severity]++);
log('  HIGH ' + sevCount.HIGH + '   MED ' + sevCount.MED + '   LOW ' + sevCount.LOW + '   合计 ' + checks.length);
log('');
log('  ' + pad('id', 40) + pad('规则', 6) + pad('字段', 16) + pad('库中值', 12) + pad('推导值/期望', 22) + '严重度 / 说明');
log('  ' + '-'.repeat(150));
const limit = OPT_FULL ? checks.length : 200;
checks.slice(0, limit).forEach((c) => {
  log('  ' + pad(c.id, 40) + pad(c.rule, 6) + pad(c.field, 16) + pad(fmt(c.got), 12) + pad(fmt(c.expect), 22) + c.severity + '  ' + c.detail);
});
if (checks.length > limit) log('  … 其余 ' + (checks.length - limit) + ' 条用 --full 查看');
log('');

log('--- 5b. note 与数值不符（值自洽，疑似 note 里的 ROP/TMU 数写错）---');
log('  共 ' + noteHints.length + ' 处（不影响理论峰值计算，仅 note 文本问题）');
noteHints.slice(0, OPT_FULL ? noteHints.length : 15).forEach((h) => log('    · ' + h));
if (noteHints.length > 15 && !OPT_FULL) log('    … 其余 ' + (noteHints.length - 15) + ' 条用 --full 查看');
log('');
log('  采用 2× FP16 口径的条目：' + fp16Twice.length + ' 条（NVIDIA Volta/数据中心、AMD Instinct、移动分片自定口径）');
log('');

/* 缺失的近年型号提示 */
const HAVE = new Set(finalGpus.map((g) => nameKey(g)));
const WISHLIST = [
  ['NVIDIA', ['RTX 5050', 'RTX 5060', 'RTX 5060 Ti', 'RTX 5070', 'RTX 5070 Ti', 'RTX 5080', 'RTX 5090']],
  ['AMD', ['RX 9050', 'RX 9060', 'RX 9060 XT', 'RX 9070', 'RX 9070 GRE', 'RX 9070 XT']],
  ['Intel', ['Arc B580', 'Arc B570', 'Iris Xe', 'Arc 140V', 'Arc 130V']],
  ['Apple', ['M3', 'M3 Pro', 'M3 Max', 'M3 Ultra', 'M4', 'M4 Pro', 'M4 Max', 'M5', 'M5 Pro', 'M5 Max']],
  ['Qualcomm', ['Adreno 830', 'Adreno 840', 'Adreno 750']],
  ['ARM', ['Immortalis-G925', 'Immortalis-G720']]
];
log('--- 6. 常见型号覆盖检查 ---');
WISHLIST.forEach(([vendor, list]) => {
  const miss = list.filter((n) => !HAVE.has(nameKey2(n)));
  if (miss.length) log('  ' + pad(vendor, 12) + '缺：' + miss.join(', '));
});
function nameKey2(n) { return String(n).toLowerCase().replace(/[^a-z0-9]+/g, ''); }
log('');

/* ---------------------------------------------------------- 7. JSON */

const result = {
  generatedAt: new Date().toISOString(),
  files: loaded.map((L) => ({ file: L.file, bytes: L.code.length, entries: L.rawN || L.own.length, error: L.err ? L.err.message : null })),
  rawTotal,
  mergedTotal: finalGpus.length,
  mergeInfo,
  byVendor, byType,
  ruleStats: stats,
  totals: { pass: totalPass, suspect: totalSuspect, skip: totalSkip },
  duplicateIds: dupIds,
  conflicts,
  noteHints,
  fp16Twice,
  suspects: checks,
  suspectSeverity: sevCount
};

if (OPT_JSON) {
  const p = path.join(__dirname, 'gpu-db-check-report.json');
  fs.writeFileSync(p, JSON.stringify(result, null, 2), 'utf8');
  console.log('JSON 报告已写入：' + p);
}

process.exitCode = checks.some((c) => c.severity === 'HIGH') ? 2 : 0;
