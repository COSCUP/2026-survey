export type BarDatum = {
  label: string;
  value: number;
  detail?: string;
};

export type MotivationDatum = {
  value: number;
  title: string;
  tone: "coral" | "blue" | "yellow" | "green" | "pink" | "cyan";
};

export type PersonaDatum = {
  id: string;
  kind: "role" | "track";
  label: string;
  detail?: string;
  sourceLabel?: string;
  value: number;
  ageGroups: BarDatum[];
  openSourceRoles: BarDatum[];
  entryPaths: BarDatum[];
  operatingSystems: BarDatum[];
  licenses: BarDatum[];
  workAI: BarDatum[];
  dailyAI: BarDatum[];
  motivations: BarDatum[];
  tracks: BarDatum[];
};

export type DashboardData = {
  source: {
    name: string;
    updatedAt: string;
  };
  summary: {
    totalRegistrations: number;
    activeRegistrations: number;
    cancelled: number;
    firstPaymentAt: string;
    firstMinuteEnd: string;
    within1Minute: number;
    within5Minutes: number;
    within30Minutes: number;
    within2Hours: number;
  };
  ageGroups: BarDatum[];
  coscupFirstHeard: BarDatum[];
  ubuconFirstHeard: BarDatum[];
  openSourceRoles: BarDatum[];
  entryPaths: BarDatum[];
  entryPathsMore: BarDatum[];
  operatingSystems: BarDatum[];
  operatingSystemsMore: BarDatum[];
  openSourceSoftware: BarDatum[];
  openSourceSoftwareMore: BarDatum[];
  licenses: BarDatum[];
  workAI: BarDatum[];
  workAIMore: BarDatum[];
  dailyAI: BarDatum[];
  dailyAIMore: BarDatum[];
  aiOutlook: BarDatum[];
  tracks: BarDatum[];
  tracksMore: BarDatum[];
  personas?: {
    roles: PersonaDatum[];
    tracks: PersonaDatum[];
  };
  motivations: MotivationDatum[];
  newsletters: {
    coscup: { subscribe: number; eventOnly: number; none: number };
    ocf: { subscribe: number; already: number; none: number };
  };
};

export const defaultDashboardData: DashboardData = {
  source: {
    name: "event-preregist-orders-20260718-222734-63f83107.csv",
    updatedAt: "2026.07.18 22:27",
  },
  summary: {
    totalRegistrations: 98,
    activeRegistrations: 96,
    cancelled: 2,
    firstPaymentAt: "20:00:09",
    firstMinuteEnd: "20:01:09",
    within1Minute: 13,
    within5Minutes: 16,
    within30Minutes: 26,
    within2Hours: 37,
  },
  ageGroups: [
    { label: "25–34 歲", value: 22 },
    { label: "35–44 歲", value: 21 },
    { label: "19–24 歲", value: 13 },
    { label: "45–54 歲", value: 6 },
    { label: "18 歲以下", value: 4 },
    { label: "不方便告知", value: 2 },
  ],
  coscupFirstHeard: [
    { label: "2006–2012", value: 10 },
    { label: "2013–2017", value: 20 },
    { label: "2018–2022", value: 17 },
    { label: "2023–2025", value: 22 },
    { label: "2026", value: 2 },
    { label: "無法判定", value: 2 },
  ],
  ubuconFirstHeard: [
    { label: "2026 首次聽聞", value: 36 },
    { label: "2025 以前已聽聞", value: 18 },
    { label: "未聽過／無法判定", value: 19 },
  ],
  openSourceRoles: [
    { label: "使用者", value: 59, detail: "Users" },
    { label: "開發者", value: 42, detail: "Coders" },
    { label: "推廣者", value: 19, detail: "Promoters" },
  ],
  entryPaths: [
    { label: "參加開源社群活動", value: 31 },
    { label: "實際參與開源專案", value: 16 },
    { label: "社群媒體", value: 15 },
    { label: "網路論壇", value: 14 },
    { label: "親友介紹", value: 12 },
    { label: "學校社團", value: 8 },
  ],
  entryPathsMore: [
    { label: "工作需求／公司同事", value: 8 },
    { label: "活動／講座", value: 7 },
    { label: "學校老師／教授", value: 7 },
    { label: "新聞、報章雜誌", value: 2 },
    { label: "電子報", value: 1 },
  ],
  operatingSystems: [
    { label: "macOS", value: 36 },
    { label: "Windows 11", value: 33 },
    { label: "Ubuntu Linux", value: 22 },
    { label: "Debian Linux", value: 11 },
    { label: "Windows 10", value: 9 },
    { label: "Arch Linux", value: 8 },
  ],
  operatingSystemsMore: [
    { label: "WSL2", value: 7 },
    { label: "CentOS（含 Stream／Rocky Linux）", value: 5 },
    { label: "openSUSE Linux", value: 4 },
    { label: "Red Hat Linux", value: 2 },
    { label: "Kali Linux", value: 2 },
    { label: "Fedora Linux", value: 1 },
  ],
  openSourceSoftware: [
    { label: "開源瀏覽器", value: 47 },
    { label: "Web 伺服器", value: 39 },
    { label: "後端開發框架", value: 31 },
    { label: "前端開發框架", value: 25 },
    { label: "通訊軟體", value: 19 },
    { label: "辦公室軟體", value: 17 },
  ],
  openSourceSoftwareMore: [
    { label: "繪圖軟體", value: 13, detail: "Blender、GIMP、Inkscape、Krita 等" },
  ],
  licenses: [
    { label: "MIT", value: 49 },
    { label: "Apache 2.0", value: 15 },
    { label: "(L/A)GPL 3.0", value: 11 },
    { label: "Creative Commons", value: 11, detail: "創用 CC" },
    { label: "(L/A)GPL 2.0", value: 4 },
    { label: "BSD", value: 3 },
    { label: "WTFPL", value: 2 },
    { label: "CC0", value: 1 },
  ],
  workAI: [
    { label: "Claude", value: 25 },
    { label: "ChatGPT", value: 13 },
    { label: "Gemini", value: 8 },
    { label: "Codex", value: 8 },
  ],
  workAIMore: [
    { label: "OpenCode", value: 2 },
    { label: "Copilot", value: 2 },
    { label: "Google Antigravity", value: 2 },
    { label: "NotebookLM", value: 1 },
  ],
  dailyAI: [
    { label: "ChatGPT", value: 44 },
    { label: "Gemini", value: 36 },
    { label: "Claude", value: 30 },
    { label: "Grok", value: 6 },
  ],
  dailyAIMore: [
    { label: "Meta AI", value: 2 },
    { label: "Pi", value: 2 },
    { label: "Wispr Flow", value: 1 },
  ],
  aiOutlook: [
    { label: "兩者相輔相成", value: 50 },
    { label: "開源比以前更重要", value: 24 },
    { label: "認為開源已死", value: 5 },
  ],
  tracks: [
    { label: "主議程軌", value: 42, detail: "Main Session Track" },
    { label: "綜合議程", value: 28, detail: "各種開源議題" },
    { label: "System Software", value: 14 },
    { label: "AI 開放治理", value: 12 },
    { label: "UbuCon Asia", value: 11 },
    { label: "Hackers In Taiwan", value: 10 },
    { label: "臺灣自由軟體在地化社群", value: 10 },
    { label: "開源商業模式", value: 10 },
  ],
  tracksMore: [
    { label: "Open LLM End User", value: 9, detail: "開源模型應用" },
    { label: "開源政策", value: 9 },
    { label: "GDG TW", value: 8 },
    { label: "Python Track by Taipei.py", value: 8 },
    { label: "PostgreSQL Taiwan", value: 7 },
    { label: "匿名網路社群 anoni.net", value: 7 },
    { label: "農業永續雙軸轉型", value: 7, detail: "農業開放資料社群" },
    { label: "JSDC × DevFrontier", value: 6 },
    { label: "Open LLM Tech", value: 6, detail: "開源模型技術" },
    { label: "台灣 MySQL 使用者社群", value: 6 },
    { label: "帶您讀源碼", value: 6 },
    { label: "State of the Map Taiwan／Wikidata Summit", value: 5 },
    { label: "Golang TW × Cloud Native", value: 5 },
    { label: "JVM 台灣代表隊", value: 4 },
    { label: "AI × Civic Tech", value: 4 },
    { label: "Open Source Inspired Hardware", value: 4 },
    { label: "Open Source Firmware", value: 3 },
    { label: "Twinkle AI", value: 2 },
    { label: "Ruby Taiwan", value: 2 },
    { label: "OSPN 日本", value: 1, detail: "Open Source People Network" },
    { label: "Software Defined Vehicle", value: 1 },
    { label: "Open-EP（E-Paper）", value: 1 },
  ],
  motivations: [
    { value: 26, title: "交流與認識新朋友", tone: "coral" },
    { value: 23, title: "學習開源技術", tone: "blue" },
    { value: 15, title: "獲取國際新知", tone: "yellow" },
    { value: 3, title: "瞭解開放原始碼", tone: "green" },
    { value: 3, title: "與開源社群互動", tone: "pink" },
    { value: 3, title: "體驗公民科技", tone: "cyan" },
  ],
  newsletters: {
    coscup: { subscribe: 38, eventOnly: 20, none: 15 },
    ocf: { subscribe: 27, already: 21, none: 25 },
  },
};

export function isDashboardData(value: unknown): value is DashboardData {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<DashboardData>;
  return Boolean(
    data.source &&
      typeof data.source.name === "string" &&
      typeof data.source.updatedAt === "string" &&
      data.summary &&
      Number.isFinite(data.summary.totalRegistrations) &&
      Array.isArray(data.ageGroups) &&
      Array.isArray(data.openSourceRoles) &&
      Array.isArray(data.tracks) &&
      Array.isArray(data.motivations) &&
      data.newsletters,
  );
}

export function isPublicAggregateSafe(data: DashboardData): boolean {
  const allowedAges = new Set(["25–34 歲", "35–44 歲", "19–24 歲", "45–54 歲", "55–64 歲", "65 歲以上", "18 歲以下", "不方便告知"]);
  const expectedRoles = new Set(["使用者", "開發者", "推廣者"]);
  return (
    data.ageGroups.length > 0 &&
    data.ageGroups.every((item) => allowedAges.has(item.label)) &&
    data.openSourceRoles.some((item) => expectedRoles.has(item.label))
  );
}
