import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import vm from "node:vm";

const root = new URL("../", import.meta.url);

test("GitHub Pages build contains the live data-source workflow", async () => {
  const [html, page, i18n, config, workflow, appsScript] = await Promise.all([
    readFile(new URL("dist/index.html", root), "utf8"),
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("lib/i18n.ts", root), "utf8"),
    readFile(new URL("dist/data-source.json", root), "utf8"),
    readFile(new URL(".github/workflows/pages.yml", root), "utf8"),
    readFile(new URL("google-apps-script/Code.gs", root), "utf8"),
  ]);

  assert.match(html, /COSCUP/);
  assert.match(page, /data-source\.json/);
  assert.match(page, /setInterval/);
  assert.match(page, /aggregateCsv/);
  assert.match(page, /useState<DashboardData \| null>\(null\)/);
  assert.match(i18n, /不顯示過期快照/);
  assert.match(i18n, /正體中文/);
  assert.match(i18n, /English/);
  assert.match(i18n, /日本語/);
  assert.match(i18n, /한국어/);
  assert.match(page, /LanguageSwitcher/);
  assert.match(page, /first-experience/);
  assert.doesNotMatch(page, /nav-refresh/);
  assert.doesNotMatch(page, /useState<DashboardData>\(defaultDashboardData\)/);
  const dataSource = JSON.parse(config);
  assert.equal(dataSource.format, "json");
  assert.match(dataSource.url, /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/);
  assert.match(page, /isPublicAggregateSafe/);
  assert.match(workflow, /actions\/configure-pages@v6/);
  assert.match(workflow, /actions\/upload-pages-artifact@v5/);
  assert.match(workflow, /actions\/deploy-pages@v5/);
  assert.match(appsScript, /function doGet\(event\)/);
  assert.match(appsScript, /event\.parameter\.format === "csv"/);
  assert.match(appsScript, /aggregate counts only/);
  assert.match(appsScript, /coscupFirstHeard/);
  assert.match(appsScript, /ubuconFirstHeard/);
  assert.match(appsScript, /assertPublicAggregate_/);
  assert.match(appsScript, /SCHEMA_VERSION = "2026-07-19-v2"/);
  assert.doesNotMatch(page, /填答率/);
});

test("CSV aggregation handles quoted selections and registration timing", async () => {
  const source = await readFile(new URL("lib/csv-aggregate.ts", root), "utf8");
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`;
  const { aggregateCsv } = await import(moduleUrl);

  const headers = [
    "付款時間", "取消時間", "Which age group do you belong to? 你的年齡？", "第一次聽到 COSCUP 是哪一年", "第一次聽到 UbuCon Asia 是哪一年",
    "最開始透過什麼管道接觸開放原始碼",
    "開放原始碼運動中扮演什麼角色", "平常使用的作業系統", "經常使用哪一種開源軟體",
    "授權條款釋出你的作品", "工作中會使用到的AI", "生活中會使用到的AI",
    "AI 會殺死開放原始碼", "COSCUP 大會中得到什麼收穫", "議程軌有興趣", "COSCUP 電子報", "OCF 電子報",
  ];
  const cells = [
    "2026/07/17 20:00:09", "", "55-64 years old 55-64 歲",
    "2023", "2026",
    "News, Newspapers and magazines 新聞、報章雜誌, Official documants 公文書函", "Users 使用者", "macOS",
    "Audio, video and streaming software 影音製作與串流軟體（OBS Studio、Kdenlive 等）", "MPL, ISC", "Other open-source 其他開源模型", "Locally hosted or self-hosted AI models 本機執行或自行架設的 AI 模型",
    "Complementing each other 兩者相輔相成", "Learn new open source technologies 學習開源技術",
    "主議程軌 - Main Session Track", "願意訂閱 Subscribe", "已經訂閱 Already subscribed",
  ];
  const escape = (value) => `"${value.replaceAll('"', '""')}"`;
  const csv = `${headers.map(escape).join(",")}\n${cells.map(escape).join(",")}\n`;
  const data = aggregateCsv(csv, "event-preregist-orders-20260718-222734-test.csv");

  assert.equal(data.summary.totalRegistrations, 1);
  assert.equal(data.summary.within1Minute, 1);
  assert.deepEqual(data.ageGroups[0], { label: "55–64 歲", value: 1 });
  assert.deepEqual(data.entryPaths.find((item) => item.label === "新聞、報章雜誌"), { label: "新聞、報章雜誌", value: 1 });
  assert.deepEqual(data.entryPaths.find((item) => item.label === "公文書函"), { label: "公文書函", value: 1 });
  assert.deepEqual(data.openSourceSoftware[0], { label: "影音製作與串流軟體", value: 1 });
  assert.deepEqual(data.licenses, [{ label: "ISC", value: 1 }, { label: "MPL", value: 1 }]);
  assert.deepEqual(data.workAI[0], { label: "其他開源模型", value: 1 });
  assert.deepEqual(data.dailyAI[0], { label: "本機或自行架設的 AI 模型", value: 1 });
  assert.deepEqual(data.coscupFirstHeard.find((item) => item.label === "2023–2025"), { label: "2023–2025", value: 1 });
  assert.deepEqual(data.ubuconFirstHeard.find((item) => item.label === "2026 首次聽聞"), { label: "2026 首次聽聞", value: 1 });
  assert.equal(data.newsletters.ocf.already, 1);
  assert.equal(data.source.updatedAt, "2026.07.18 22:27");
});

test("public aggregate safety rejects shifted personal-name fields", async () => {
  const source = await readFile(new URL("lib/dashboard-data.ts", root), "utf8");
  const javascript = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`;
  const { defaultDashboardData, isPublicAggregateSafe } = await import(moduleUrl);

  assert.equal(isPublicAggregateSafe(defaultDashboardData), true);
  assert.equal(isPublicAggregateSafe({
    ...defaultDashboardData,
    ageGroups: [{ label: "Example Person", value: 1 }],
  }), false);
  assert.equal(isPublicAggregateSafe({
    ...defaultDashboardData,
    ageGroups: [{ label: "65 歲以上", value: 1 }],
  }), true);
});

test("Apps Script supports the latest field keys and option labels", async () => {
  const source = await readFile(new URL("google-apps-script/Code.gs", root), "utf8");
  const context = vm.createContext({ console });
  vm.runInContext(source, context);

  context.headers = ["field_radio_1005509"];
  assert.equal(vm.runInContext("findColumn_(headers, COLUMN_HINTS.age)", context), 0);

  context.rows = [[
    "55-64 years old 55-64 歲",
    "Official documants 公文書函",
    "Audio, video and streaming software 影音製作與串流軟體（OBS Studio、Kdenlive 等）",
  ]];
  assert.deepEqual(
    structuredClone(vm.runInContext("countSelections_(rows, 0)", context)),
    [{ label: "55–64 歲", value: 1 }],
  );
  assert.deepEqual(
    structuredClone(vm.runInContext("countSelections_(rows, 1)", context)),
    [{ label: "公文書函", value: 1 }],
  );
  assert.deepEqual(
    structuredClone(vm.runInContext("countSelections_(rows, 2)", context)),
    [{ label: "影音製作與串流軟體", value: 1 }],
  );
});
