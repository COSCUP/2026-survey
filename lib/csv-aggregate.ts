import type { BarDatum, DashboardData, MotivationDatum, PersonaDatum, RegistrationTimelineDatum } from "./dashboard-data";

type CsvRow = Record<string, string>;

const columnHints = {
  payment: ["付款時間"],
  cancelled: ["取消時間"],
  age: ["你的年齡", "field_radio_1005509"],
  coscupFirstHeard: ["第一次聽到COSCUP是哪一年", "field_text_1005518"],
  ubuconFirstHeard: ["第一次聽到UbuConAsia是哪一年", "field_text_1005519"],
  profession: ["目前的工作", "current job", "field_checkbox_1005520"],
  entry: ["最開始透過什麼管道接觸開放原始碼", "field_checkbox_1005521"],
  roles: ["開放原始碼運動中扮演什麼角色", "field_checkbox_1005522"],
  os: ["平常使用的作業系統", "field_checkbox_1005523"],
  software: ["經常使用哪一種開源軟體", "field_checkbox_1005524"],
  license: ["授權條款釋出你的作品", "field_checkbox_1005525"],
  workAI: ["工作中會使用到哪些AI", "工作中會使用到的AI", "field_checkbox_1005616"],
  dailyAI: ["生活中會使用到的AI", "field_checkbox_1005527"],
  outlook: ["AI會殺死開放原始碼", "field_checkbox_1005528"],
  motivations: ["COSCUP大會中得到什麼收穫", "field_radio_1005529"],
  tracks: ["議程軌有興趣", "field_checkbox_1005530"],
  coscupNewsletter: ["COSCUP電子報", "field_radio_1005537"],
  ocfNewsletter: ["OCF電子報", "field_radio_1005538"],
} as const;

const labelRules: Array<[string, string, string?]> = [
  ["25-34 years old", "25–34 歲"], ["35-44 years old", "35–44 歲"],
  ["19-24 years old", "19–24 歲"], ["45-54 years old", "45–54 歲"],
  ["55-64 years old", "55–64 歲"], ["65 years or older", "65 歲以上"],
  ["Under 18", "18 歲以下"], ["Prefer not to say", "不方便告知"],
  ["Users", "使用者", "Users"], ["Coders", "開發者", "Coders"], ["Promoters", "推廣者", "Promoters"],
  ["Joining in an event", "參加開源社群活動"], ["Taking part in Project", "實際參與開源專案"],
  ["社群媒體", "社群媒體"], ["網路論壇", "網路論壇"], ["親友", "親友介紹"],
  ["學校社團", "學校社團"], ["公司同事", "工作需求／公司同事"],
  ["Events ", "活動／講座"], ["學校老師", "學校老師／教授"],
  ["Newsletter", "電子報"], ["News, Newspapers", "新聞、報章雜誌"], ["Official documants", "公文書函"],
  ["CentOS", "CentOS（含 Stream／Rocky Linux）"],
  ["Redhat Linux", "Red Hat Linux"], ["alpine linux", "Alpine Linux"],
  ["Web browser", "開源瀏覽器"], ["Web servers", "Web 伺服器"],
  ["Back-end", "後端開發框架"], ["Front-end", "前端開發框架"],
  ["Communication software", "通訊軟體"], ["Office suite", "辦公室軟體"],
  ["Illustration software", "繪圖軟體", "Blender、GIMP、Inkscape、Krita 等"],
  ["3D modeling and hardware design software", "3D 建模與硬體設計軟體"],
  ["Audio, video and streaming software", "影音製作與串流軟體"],
  ["Knowledge management and note-taking software", "知識管理與筆記軟體"],
  ["Project management and collaboration software", "專案管理與協作軟體"],
  ["Content management and publishing software", "內容管理與出版軟體"],
  ["Databases", "資料庫軟體"], ["Version control and code collaboration software", "版本控制與程式碼協作軟體"],
  ["Development tools and code editors", "開發工具與程式碼編輯器"], ["Operating systems", "作業系統"],
  ["Containers and orchestration software", "容器與編排軟體"],
  ["Cloud infrastructure and automation tools", "雲端基礎設施與自動化工具"],
  ["System administration and monitoring software", "系統管理與監控軟體"],
  ["Cybersecurity and privacy software", "資安與隱私軟體"], ["Networking and VPN software", "網路與 VPN 軟體"],
  ["Data analysis and visualization software", "資料分析與視覺化軟體"],
  ["Geographic information and mapping software", "地理資訊與地圖軟體"],
  ["Artificial intelligence and machine learning software", "人工智慧與機器學習軟體"],
  ["Civic technology and community platforms", "公民科技與社群平台"],
  ["Other open source software", "其他開源軟體"],
  ["I am not sure whether the software", "不確定使用的軟體是否為開源"],
  ["Creative Commons", "Creative Commons", "創用 CC"],
  ["Other open-source", "其他開源模型"], ["Other open-weight", "其他開放權重模型"],
  ["I use open models but do not know their names", "有使用開放模型，但不確定名稱"],
  ["Locally hosted or self-hosted AI models", "本機或自行架設的 AI 模型"],
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

const professionRules: Array<[string, string]> = [
  ["Student", "學生"], ["Not employed", "目前未就業"], ["Developer, Front-end", "前端工程師"],
  ["Developer, Back-end", "後端工程師"], ["Developer, Full-stack", "全端工程師"],
  ["Developer, Mobile", "手機工程師"], ["Developer, Desktop or Enterprise", "桌面／企業應用工程師"],
  ["Developer, Embedded", "嵌入式應用／裝置工程師"], ["Developer, Game or Graphics", "遊戲／圖像工程師"],
  ["Developer, QA or test", "QA／測試工程師"], ["Developer, Automation", "自動化工程師"],
  ["DevOps Engineer", "開發維運工程師"], ["Engineer, Data", "資料工程師"],
  ["Engineer, Digital Circuit Design", "數位電路設計工程師"], ["Engineer, Site Reliability", "網站可靠性工程師"],
  ["System Administrator", "系統管理員"], ["Database Administrator", "資料庫管理員"],
  ["Data Scientist or Machine Learning", "資料科學／機器學習"], ["Data or Business Analyst", "資料／商業分析"],
  ["Academic Researcher", "學術研究人員"], ["Educator", "教育人員"], ["Training Instructor/Consultant", "培訓講師／顧問"],
  ["Technician", "技術員"], ["Security Professional", "資安專業人員"], ["IT Support / Help Desk", "資訊支援／IT 維運"],
  ["Project Management", "專案管理"], ["Engineering Manager", "工程經理"], ["Senior Executive", "高階管理者"],
  ["Business or Sales Professional", "業務／銷售人員"], ["Marketing-related Professional", "行銷人員"],
  ["Designer", "設計師"], ["Community Manager / Developer Relations", "社群經營／開發者關係"],
  ["Open Source Community Organizer", "開源社群組織者"],
];

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

function findColumn(headers: string[], hints: readonly string[]): string {
  const normalizedHints = hints.map((hint) => hint.replace(/\s/g, "").toLowerCase());
  const match = headers.find((header) => {
    const normalizedHeader = header.replace(/\s/g, "").toLowerCase();
    return normalizedHints.some((hint) => normalizedHeader.includes(hint));
  });
  if (!match) throw new Error(`CSV 缺少必要欄位：${hints[0]}`);
  return match;
}

function findOptionalColumn(headers: string[], hints: readonly string[]): string {
  const normalizedHints = hints.map((hint) => hint.replace(/\s/g, "").toLowerCase());
  return headers.find((header) => normalizedHints.some((hint) => header.replace(/\s/g, "").toLowerCase().includes(hint))) || "";
}

function splitSelections(value: string): string[] {
  const protectedValue = value
    .replace(/News,\s*Newspapers and magazines/gi, "News、Newspapers and magazines")
    .replace(/Audio,\s*video and streaming software/gi, "Audio、video and streaming software");
  return protectedValue.split(/,\s*/)
    .map((item) => item.replace("News、", "News, ").replace("Audio、", "Audio, ").trim())
    .filter(Boolean);
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

function countProfessions(rows: CsvRow[], column: string): BarDatum[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = row[column] || "";
    for (const [needle, label] of professionRules) {
      if (value.toLowerCase().includes(needle.toLowerCase())) counts.set(label, (counts.get(label) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "zh-Hant"));
}

function selectionHasLabel(value: string, label: string): boolean {
  return splitSelections(value || "").some((raw) => localized(raw).label === label);
}

function firstSourceSelection(rows: CsvRow[], column: string, label: string): string {
  for (const row of rows) {
    const found = splitSelections(row[column] || "").find((raw) => localized(raw).label === label);
    if (found) return found;
  }
  return label;
}

function buildPersonas(rows: CsvRow[], columns: Record<keyof typeof columnHints, string>) {
  const build = (item: BarDatum, kind: PersonaDatum["kind"], selectionColumn: string): PersonaDatum => {
    const cohort = rows.filter((row) => selectionHasLabel(row[selectionColumn] || "", item.label));
    return {
      id: `${kind}:${item.label}`,
      kind,
      label: item.label,
      detail: item.detail,
      sourceLabel: firstSourceSelection(rows, selectionColumn, item.label),
      value: cohort.length,
      ageGroups: countSelections(cohort, columns.age),
      professions: countProfessions(cohort, columns.profession),
      openSourceRoles: countSelections(cohort, columns.roles),
      entryPaths: countSelections(cohort, columns.entry),
      operatingSystems: countSelections(cohort, columns.os),
      licenses: countSelections(cohort, columns.license),
      workAI: countSelections(cohort, columns.workAI),
      dailyAI: countSelections(cohort, columns.dailyAI),
      motivations: countSelections(cohort, columns.motivations),
      tracks: kind === "role" ? countSelections(cohort, columns.tracks) : [],
    };
  };
  return {
    roles: countSelections(rows, columns.roles).map((item) => build(item, "role", columns.roles)),
    tracks: countSelections(rows, columns.tracks).map((item) => build(item, "track", columns.tracks)),
  };
}

function splitTop(data: BarDatum[], size: number): [BarDatum[], BarDatum[]] {
  return [data.slice(0, size), data.slice(size)];
}

function countFirstHeard(rows: CsvRow[], column: string, event: "coscup" | "ubucon"): BarDatum[] {
  if (event === "ubucon") {
    const counts = { current: 0, earlier: 0, unclear: 0 };
    for (const row of rows) {
      const value = row[column]?.trim();
      if (!value) continue;
      const match = value.match(/^(20\d{2})$/);
      if (!match) counts.unclear += 1;
      else if (Number(match[1]) === 2026) counts.current += 1;
      else if (Number(match[1]) >= 2000 && Number(match[1]) < 2026) counts.earlier += 1;
      else counts.unclear += 1;
    }
    return [
      { label: "2026 首次聽聞", value: counts.current },
      { label: "2025 以前已聽聞", value: counts.earlier },
      { label: "未聽過／無法判定", value: counts.unclear },
    ];
  }

  const buckets = [
    { label: "2006–2012", from: 2006, to: 2012, value: 0 },
    { label: "2013–2017", from: 2013, to: 2017, value: 0 },
    { label: "2018–2022", from: 2018, to: 2022, value: 0 },
    { label: "2023–2025", from: 2023, to: 2025, value: 0 },
    { label: "2026", from: 2026, to: 2026, value: 0 },
  ];
  let unclear = 0;
  for (const row of rows) {
    const value = row[column]?.trim();
    if (!value) continue;
    const match = value.match(/^(20\d{2})$/);
    const year = match ? Number(match[1]) : NaN;
    const bucket = buckets.find((candidate) => year >= candidate.from && year <= candidate.to);
    if (bucket) bucket.value += 1;
    else unclear += 1;
  }
  return [...buckets.map(({ label, value }) => ({ label, value })), { label: "無法判定", value: unclear }];
}

function parsePayment(value: string): Date | null {
  const match = value.match(/^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{1,2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
}

function timeText(date: Date): string {
  return [date.getHours(), date.getMinutes(), date.getSeconds()].map((part) => String(part).padStart(2, "0")).join(":");
}

function timelineDateText(date: Date): string {
  const parts = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()]
    .map((part, index) => index === 0 ? String(part) : String(part).padStart(2, "0"));
  return `${parts[0]}-${parts[1]}-${parts[2]} ${parts[3]}:${parts[4]}`;
}

function timelineBinStart(date: Date): Date {
  const start = new Date(date);
  const hour = start.getHours();
  if (hour < 2) start.setDate(start.getDate() - 1);
  start.setHours(hour < 2 || hour >= 20 ? 20 : hour < 8 ? 2 : hour < 14 ? 8 : 14, 0, 0, 0);
  return start;
}

function buildRegistrationTimeline(payments: Date[]): RegistrationTimelineDatum[] {
  const horizon = new Date(2026, 7, 10, 0, 0, 0);
  const bins: RegistrationTimelineDatum[] = [];
  let cumulative = 0;
  for (let start = timelineBinStart(payments[0]); start < horizon; start = new Date(start.getTime() + 6 * 60 * 60_000)) {
    const end = new Date(start.getTime() + 6 * 60 * 60_000);
    const value = payments.filter((date) => date >= start && date < end).length;
    cumulative += value;
    bins.push({
      startAt: timelineDateText(start),
      endAt: timelineDateText(end),
      slot: `${String(start.getHours()).padStart(2, "0")}–${String(end.getHours()).padStart(2, "0")}` as RegistrationTimelineDatum["slot"],
      value,
      cumulative,
    });
  }
  return bins;
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
  const columns = Object.fromEntries(Object.entries(columnHints).map(([key, hint]) => [key, key === "profession" ? findOptionalColumn(headers, hint) : findColumn(headers, hint)])) as Record<keyof typeof columnHints, string>;

  const payments = rows.map((row) => parsePayment(row[columns.payment])).filter((date): date is Date => Boolean(date)).sort((a, b) => a.getTime() - b.getTime());
  if (!payments.length) throw new Error("找不到可辨識的付款時間。");
  const first = payments[0];
  const cumulative = (minutes: number) => payments.filter((date) => date.getTime() <= first.getTime() + minutes * 60_000).length;

  const [entryPaths, entryPathsMore] = splitTop(countSelections(rows, columns.entry), 6);
  const [professions, professionsMore] = splitTop(countProfessions(rows, columns.profession), 8);
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
      registrationTimeline: buildRegistrationTimeline(payments),
    },
    ageGroups: countSelections(rows, columns.age),
    professions, professionsMore,
    coscupFirstHeard: countFirstHeard(rows, columns.coscupFirstHeard, "coscup"),
    ubuconFirstHeard: countFirstHeard(rows, columns.ubuconFirstHeard, "ubucon"),
    openSourceRoles: countSelections(rows, columns.roles),
    entryPaths, entryPathsMore, operatingSystems, operatingSystemsMore,
    openSourceSoftware, openSourceSoftwareMore,
    licenses: countSelections(rows, columns.license),
    workAI, workAIMore, dailyAI, dailyAIMore,
    aiOutlook: countSelections(rows, columns.outlook),
    tracks, tracksMore,
    personas: buildPersonas(rows, columns),
    motivations: motivationCounts.map((item, index) => ({ value: item.value, title: item.label, tone: motivationTones[index % motivationTones.length] })),
    newsletters: {
      coscup: { subscribe: coscup.subscribe, eventOnly: coscup.eventOnly, none: coscup.none },
      ocf: { subscribe: ocf.subscribe, already: ocf.already, none: ocf.none },
    },
  };
}
