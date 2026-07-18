import type { BarDatum, DashboardData, MotivationDatum } from "./dashboard-data";

type CsvRow = Record<string, string>;

const columnHints = {
  payment: "付款時間",
  cancelled: "取消時間",
  age: "你的年齡",
  entry: "最開始透過什麼管道接觸開放原始碼",
  roles: "開放原始碼運動中扮演什麼角色",
  os: "平常使用的作業系統",
  software: "經常使用哪一種開源軟體",
  license: "授權條款釋出你的作品",
  workAI: "工作中會使用到的AI",
  dailyAI: "生活中會使用到的AI",
  outlook: "AI 會殺死開放原始碼",
  motivations: "COSCUP 大會中得到什麼收穫",
  tracks: "議程軌有興趣",
  coscupNewsletter: "COSCUP 電子報",
  ocfNewsletter: "OCF 電子報",
} as const;

const labelRules: Array<[string, string, string?]> = [
  ["25-34 years old", "25–34 歲"], ["35-44 years old", "35–44 歲"],
  ["19-24 years old", "19–24 歲"], ["45-54 years old", "45–54 歲"],
  ["Under 18", "18 歲以下"], ["Prefer not to say", "不方便告知"],
  ["Users", "使用者", "Users"], ["Coders", "開發者", "Coders"], ["Promoters", "推廣者", "Promoters"],
  ["Joining in an event", "參加開源社群活動"], ["Taking part in Project", "實際參與開源專案"],
  ["社群媒體", "社群媒體"], ["網路論壇", "網路論壇"], ["親友", "親友介紹"],
  ["學校社團", "學校社團"], ["公司同事", "工作需求／公司同事"],
  ["Events ", "活動／講座"], ["學校老師", "學校老師／教授"],
  ["Newsletter", "電子報"], ["News, Newspapers", "新聞、報章雜誌"],
  ["CentOS", "CentOS（含 Stream／Rocky Linux）"],
  ["Web browser", "開源瀏覽器"], ["Web servers", "Web 伺服器"],
  ["Back-end", "後端開發框架"], ["Front-end", "前端開發框架"],
  ["Communication software", "通訊軟體"], ["Office suite", "辦公室軟體"],
  ["Illustration software", "繪圖軟體", "Blender、GIMP、Inkscape、Krita 等"],
  ["Creative Commons", "Creative Commons", "創用 CC"],
  ["Main Session Track", "主議程軌", "Main Session Track"],
  ["綜合議程", "綜合議程", "各種開源議題"],
  ["AI開放治理", "AI 開放治理"], ["JSDC X", "JSDC × DevFrontier"],
  ["Open LLM End User", "Open LLM End User", "開源模型應用"],
  ["Open LLM Tech", "Open LLM Tech", "開源模型技術"],
  ["台灣MySQL", "台灣 MySQL 使用者社群"], ["AI x Civic Tech", "AI × Civic Tech"],
  ["Golang TW x", "Golang TW × Cloud Native"], ["State of the Map", "State of the Map Taiwan／Wikidata Summit"],
  ["匿名網路社群", "匿名網路社群 anoni.net"], ["JVM ", "JVM 台灣代表隊"],
  ["農業永續雙軸", "農業永續雙軸轉型", "農業開放資料社群"],
  ["OSPN", "OSPN 日本", "Open Source People Network"],
  ["Software Defined Vehicle", "Software Defined Vehicle"], ["Open-EP", "Open-EP（E-Paper）"],
  ["Complementing each other", "兩者相輔相成"],
  ["important than before", "開源比以前更重要"], ["Open source will die", "認為開源已死"],
  ["交流", "交流與認識新朋友"], ["學習開源技術", "學習開源技術"],
  ["國際新知", "獲取國際新知"], ["瞭解開放原始碼", "瞭解開放原始碼"],
  ["開源社群互動", "與開源社群互動"], ["公民科技", "體驗公民科技"],
];

const motivationTones: MotivationDatum["tone"][] = ["coral", "blue", "yellow", "green", "pink", "cyan"];

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value); value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(value); value = "";
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
    } else value += char;
  }
  if (value.length > 0 || row.length > 0) { row.push(value); rows.push(row); }
  return rows;
}

function findColumn(headers: string[], hint: string): string {
  const match = headers.find((header) => header.replace(/\s/g, "").includes(hint.replace(/\s/g, "")));
  if (!match) throw new Error(`CSV 缺少必要欄位：${hint}`);
  return match;
}

function splitSelections(value: string): string[] {
  const protectedValue = value.replace(/News,\s*Newspapers and magazines/gi, "News、Newspapers and magazines");
  return protectedValue.split(/,\s*/).map((item) => item.replace("News、", "News, ").trim()).filter(Boolean);
}

function localized(raw: string): { label: string; detail?: string } {
  const rule = labelRules.find(([needle]) => raw.toLowerCase().includes(needle.toLowerCase()));
  if (rule) return rule[2] ? { label: rule[1], detail: rule[2] } : { label: rule[1] };
  const chinese = raw.match(/[\u3400-\u9fff][\u3400-\u9fff\s、／（）·・—-]*/)?.[0]?.trim();
  return { label: chinese || raw.trim() };
}

function countSelections(rows: CsvRow[], column: string): BarDatum[] {
  const counts = new Map<string, BarDatum>();
  for (const row of rows) {
    for (const raw of splitSelections(row[column] || "")) {
      const item = localized(raw);
      const existing = counts.get(item.label);
      counts.set(item.label, { ...item, value: (existing?.value || 0) + 1 });
    }
  }
  return [...counts.values()].sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "zh-Hant"));
}

function splitTop(data: BarDatum[], size: number): [BarDatum[], BarDatum[]] {
  return [data.slice(0, size), data.slice(size)];
}

function parsePayment(value: string): Date | null {
  const match = value.match(/^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
}

function timeText(date: Date): string {
  return [date.getHours(), date.getMinutes(), date.getSeconds()].map((part) => String(part).padStart(2, "0")).join(":");
}

function updatedAtFromFile(name: string, lastModified?: number): string {
  const match = name.match(/(20\d{6})[-_](\d{6})/);
  if (match) return `${match[1].slice(0, 4)}.${match[1].slice(4, 6)}.${match[1].slice(6, 8)} ${match[2].slice(0, 2)}:${match[2].slice(2, 4)}`;
  const date = lastModified ? new Date(lastModified) : new Date();
  const parts = [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((part, index) => index === 0 ? String(part) : String(part).padStart(2, "0"));
  return `${parts.join(".")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function countNewsletter(rows: CsvRow[], column: string) {
  let subscribe = 0, eventOnly = 0, already = 0, none = 0;
  for (const row of rows) {
    const value = row[column] || "";
    if (value.includes("已經訂閱") || value.includes("Already subscribed")) already += 1;
    else if (value.includes("僅接收") || value.includes("pre-event")) eventOnly += 1;
    else if (value.includes("不訂閱") || value.includes("Do not subscribe")) none += 1;
    else if (value.includes("願意訂閱") || value.includes("Subscribe")) subscribe += 1;
  }
  return { subscribe, eventOnly, already, none };
}

export function aggregateCsv(text: string, sourceName: string, lastModified?: number): DashboardData {
  const parsed = parseCsv(text.replace(/^\uFEFF/, ""));
  if (parsed.length < 2) throw new Error("CSV 沒有可用的資料列。");
  const headers = parsed[0].map((cell) => cell.trim());
  const rows = parsed.slice(1).map((cells) => Object.fromEntries(headers.map((header, index) => [header, (cells[index] || "").trim()])));
  const columns = Object.fromEntries(Object.entries(columnHints).map(([key, hint]) => [key, findColumn(headers, hint)])) as Record<keyof typeof columnHints, string>;

  const payments = rows.map((row) => parsePayment(row[columns.payment])).filter((date): date is Date => Boolean(date)).sort((a, b) => a.getTime() - b.getTime());
  if (!payments.length) throw new Error("找不到可辨識的付款時間。");
  const first = payments[0];
  const cumulative = (minutes: number) => payments.filter((date) => date.getTime() <= first.getTime() + minutes * 60_000).length;

  const [entryPaths, entryPathsMore] = splitTop(countSelections(rows, columns.entry), 6);
  const [operatingSystems, operatingSystemsMore] = splitTop(countSelections(rows, columns.os), 6);
  const [openSourceSoftware, openSourceSoftwareMore] = splitTop(countSelections(rows, columns.software), 6);
  const [workAI, workAIMore] = splitTop(countSelections(rows, columns.workAI), 4);
  const [dailyAI, dailyAIMore] = splitTop(countSelections(rows, columns.dailyAI), 4);
  const [tracks, tracksMore] = splitTop(countSelections(rows, columns.tracks), 8);
  const motivationCounts = countSelections(rows, columns.motivations);
  const coscup = countNewsletter(rows, columns.coscupNewsletter);
  const ocf = countNewsletter(rows, columns.ocfNewsletter);

  return {
    source: { name: sourceName, updatedAt: updatedAtFromFile(sourceName, lastModified) },
    summary: {
      totalRegistrations: rows.length,
      activeRegistrations: rows.filter((row) => !row[columns.cancelled]).length,
      cancelled: rows.filter((row) => Boolean(row[columns.cancelled])).length,
      firstPaymentAt: timeText(first),
      firstMinuteEnd: timeText(new Date(first.getTime() + 60_000)),
      within1Minute: cumulative(1), within5Minutes: cumulative(5), within30Minutes: cumulative(30), within2Hours: cumulative(120),
    },
    ageGroups: countSelections(rows, columns.age),
    openSourceRoles: countSelections(rows, columns.roles),
    entryPaths, entryPathsMore, operatingSystems, operatingSystemsMore,
    openSourceSoftware, openSourceSoftwareMore,
    licenses: countSelections(rows, columns.license),
    workAI, workAIMore, dailyAI, dailyAIMore,
    aiOutlook: countSelections(rows, columns.outlook),
    tracks, tracksMore,
    motivations: motivationCounts.map((item, index) => ({ value: item.value, title: item.label, tone: motivationTones[index % motivationTones.length] })),
    newsletters: {
      coscup: { subscribe: coscup.subscribe, eventOnly: coscup.eventOnly, none: coscup.none },
      ocf: { subscribe: ocf.subscribe, already: ocf.already, none: ocf.none },
    },
  };
}
