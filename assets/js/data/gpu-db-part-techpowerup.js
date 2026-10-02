/* ============================================================================
 * NovaMark · GPU 参考规格数据库分片 —— TechPowerUp 导入（占位）
 *
 * 这是一个**空占位文件**，作用是让 index.html 的 <script> 标签先有一个可加载的目标，
 * 避免在还没导入数据时出现 404。
 *
 * 导入真实数据：
 *   1) 用浏览器打开 https://www.techpowerup.com/gpu-specs/ （翻页全部导出更佳）
 *   2) 全选页面表格内容复制，存成 .tsv / .txt；或者直接「网页另存为」.html
 *   3) 在 D:\AICode\工具区 下执行：
 *        node import-techpowerup.js <你导出的文件> [更多文件...]
 *      脚本会覆盖本文件，并打印厂商/类型/字段覆盖率报告。
 *   4) 刷新页面即可看到条数变化。
 *
 * 换算规则与「不估算」原则见 import-techpowerup.js 顶部注释。
 * ==========================================================================*/
(function (global) {
  'use strict';
  var PARTS = global.NOVA_GPU_DB_PARTS = global.NOVA_GPU_DB_PARTS || [];
  PARTS.push({
    name: 'techpowerup',
    label: 'TechPowerUp GPU Database（尚未导入）',
    gpus: []
  });
})(window);
