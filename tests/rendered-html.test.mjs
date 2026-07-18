import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const root = new URL("../", import.meta.url);

test("GitHub Pages build contains the live data-source workflow", async () => {
  const [html, page, config, workflow, appsScript] = await Promise.all([
    readFile(new URL("dist/index.html", root), "utf8"),
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("dist/data-source.json", root), "utf8"),
    readFile(new URL(".github/workflows/pages.yml", root), "utf8"),
    readFile(new URL("google-apps-script/Code.gs", root), "utf8"),
  ]);

  assert.match(html, /COSCUP/);
  assert.match(page, /data-source\.json/);
  assert.match(page, /setInterval/);
  assert.match(page, /aggregateCsv/);
  assert.deepEqual(JSON.parse(config), { url: "", format: "json" });
  assert.match(workflow, /actions\/configure-pages@v6/);
  assert.match(workflow, /actions\/upload-pages-artifact@v5/);
  assert.match(workflow, /actions\/deploy-pages@v5/);
  assert.match(appsScript, /function doGet\(event\)/);
  assert.match(appsScript, /event\.parameter\.format === "csv"/);
  assert.match(appsScript, /aggregate counts only/);
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
    "付款時間", "取消時間", "你的年齡", "最開始透過什麼管道接觸開放原始碼",
    "開放原始碼運動中扮演什麼角色", "平常使用的作業系統", "經常使用哪一種開源軟體",
    "授權條款釋出你的作品", "工作中會使用到的AI", "生活中會使用到的AI",
    "AI 會殺死開放原始碼", "COSCUP 大會中得到什麼收穫", "議程軌有興趣", "COSCUP 電子報", "OCF 電子報",
  ];
  const cells = [
    "2026/07/17 20:00:09", "", "25-34 years old 25-34 歲",
    "News, Newspapers and magazines 新聞、報章雜誌", "Users 使用者", "macOS",
    "Web browser瀏覽器軟體（Firefox 等）", "MIT", "Claude", "ChatGPT",
    "Complementing each other 兩者相輔相成", "Learn new open source technologies 學習開源技術",
    "主議程軌 - Main Session Track", "願意訂閱 Subscribe", "已經訂閱 Already subscribed",
  ];
  const escape = (value) => `"${value.replaceAll('"', '""')}"`;
  const csv = `${headers.map(escape).join(",")}\n${cells.map(escape).join(",")}\n`;
  const data = aggregateCsv(csv, "event-preregist-orders-20260718-222734-test.csv");

  assert.equal(data.summary.totalRegistrations, 1);
  assert.equal(data.summary.within1Minute, 1);
  assert.deepEqual(data.entryPaths[0], { label: "新聞、報章雜誌", value: 1 });
  assert.equal(data.newsletters.ocf.already, 1);
  assert.equal(data.source.updatedAt, "2026.07.18 22:27");
});
