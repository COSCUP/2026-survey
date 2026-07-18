/**
 * COSCUP dashboard JSON endpoint.
 *
 * 1. Put this script inside the Google Sheet (Extensions > Apps Script).
 * 2. Change SHEET_NAME to the tab containing the registration export.
 * 3. Deploy as a Web app: Execute as Me; access Anyone.
 * 4. Paste the /exec URL into public/data-source.json.
 *
 * The default endpoint returns aggregate counts. `?view=raw` returns
 * de-identified row-level survey data with explicit personal fields removed.
 * Form schema: 2026-07-19 (field keys field_radio_1005509 through field_radio_1005538).
 */
const SHEET_NAME = "報名資料";
const SCHEMA_VERSION = "2026-07-19-v2";

// KKTIX CSV automation. Fill these two values before installing the trigger.
// Save each full KKTIX export into the Drive folder. The newest CSV is compared
// with SHEET_NAME and only registrations not already present are appended.
const TARGET_SPREADSHEET_ID = "PASTE_GOOGLE_SHEET_ID_HERE";
const KKTIX_IMPORT_FOLDER_ID = "PASTE_GOOGLE_DRIVE_FOLDER_ID_HERE";
const IMPORT_HANDLER = "importLatestKktixCsv";
const LAST_IMPORTED_FILE_KEY = "coscup_latest_kktix_file_id";

const IMPORT_KEY_HINTS = {
  ticketId: ["票券編號", "票券號碼", "ticket id", "ticket number", "registration id", "registration number"],
  orderId: ["訂單編號", "訂單號碼", "order id", "order number", "order no"],
  name: ["姓名", "name"],
  email: ["email", "e-mail", "電子郵件"],
  pickup: ["取票時間", "ticket time", "check-in time"],
};

const PUBLIC_EXCLUDED_HEADER_KEYWORDS = [
  "姓名", "email", "e-mail", "電子郵件", "身分證", "手機", "聯絡電話",
  "電話", "郵遞區號", "地址", "address", "phone", "mobile",
];

const COLUMN_HINTS = {
  payment: ["付款時間"],
  cancelled: ["取消時間"],
  age: ["你的年齡", "field_radio_1005509"],
  coscupFirstHeard: ["第一次聽到 COSCUP 是哪一年", "field_text_1005518"],
  ubuconFirstHeard: ["第一次聽到 UbuCon Asia 是哪一年", "field_text_1005519"],
  entry: ["最開始透過什麼管道接觸開放原始碼", "field_checkbox_1005521"],
  roles: ["開放原始碼運動中扮演什麼角色", "field_checkbox_1005522"],
  os: ["平常使用的作業系統", "field_checkbox_1005523"],
  software: ["經常使用哪一種開源軟體", "field_checkbox_1005524"],
  license: ["授權條款釋出你的作品", "field_checkbox_1005525"],
  workAI: ["工作中會使用到哪些 AI", "工作中會使用到的AI", "field_checkbox_1005616"],
  dailyAI: ["生活中會使用到的AI", "field_checkbox_1005527"],
  outlook: ["AI 會殺死開放原始碼", "field_checkbox_1005528"],
  motivations: ["COSCUP 大會中得到什麼收穫", "field_radio_1005529"],
  tracks: ["議程軌有興趣", "field_checkbox_1005530"],
  coscupNewsletter: ["COSCUP 電子報", "field_radio_1005537"],
  ocfNewsletter: ["OCF 電子報", "field_radio_1005538"],
};

const LABEL_RULES = [
  ["25-34 years old", "25–34 歲"], ["35-44 years old", "35–44 歲"],
  ["19-24 years old", "19–24 歲"], ["45-54 years old", "45–54 歲"],
  ["55-64 years old", "55–64 歲"], ["65 years or older", "65 歲以上"],
  ["Under 18", "18 歲以下"], ["Prefer not to say", "不方便告知"],
  ["Users", "使用者", "Users"], ["Coders", "開發者", "Coders"], ["Promoters", "推廣者", "Promoters"],
  ["Joining in an event", "參加開源社群活動"], ["Taking part in Project", "實際參與開源專案"],
  ["Social Media", "社群媒體"], ["Forums", "網路論壇"], ["Friends and family", "親友介紹"],
  ["School clubs", "學校社團"], ["Work needs", "工作需求／公司同事"],
  ["Events ", "活動／講座"], ["Teachers", "學校老師／教授"],
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
  ["綜合議程", "綜合議程", "各種開源議題"], ["AI開放治理", "AI 開放治理"],
  ["JSDC X", "JSDC × DevFrontier"], ["Open LLM End User", "Open LLM End User", "開源模型應用"],
  ["Open LLM Tech", "Open LLM Tech", "開源模型技術"], ["台灣MySQL", "台灣 MySQL 使用者社群"],
  ["AI x Civic Tech", "AI × Civic Tech"], ["Golang TW x", "Golang TW × Cloud Native"],
  ["State of the Map", "State of the Map Taiwan／Wikidata Summit"], ["匿名網路社群", "匿名網路社群 anoni.net"],
  ["JVM ", "JVM 台灣代表隊"], ["農業永續雙軸", "農業永續雙軸轉型", "農業開放資料社群"],
  ["OSPN", "OSPN 日本", "Open Source People Network"], ["Software Defined Vehicle", "Software Defined Vehicle"],
  ["Open-EP", "Open-EP（E-Paper）"], ["Complementing each other", "兩者相輔相成"],
  ["important than before", "開源比以前更重要"], ["Open source will die", "認為開源已死"],
  ["與他人交流", "交流與認識新朋友"], ["學習開源技術", "學習開源技術"],
  ["國際新知", "獲取國際新知"], ["瞭解開放原始碼", "瞭解開放原始碼"],
  ["開源社群互動", "與開源社群互動"], ["公民科技", "體驗公民科技"],
];

function doGet(event) {
  try {
    const spreadsheet = getSourceSpreadsheet_();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error(`找不到工作表：${SHEET_NAME}`);
    const values = sheet.getDataRange().getDisplayValues();
    const parameters = (event && event.parameter) || {};
    if (parameters.view === "raw") {
      const publicRows = buildPublicRows_(values);
      if (parameters.format === "csv") {
        return ContentService.createTextOutput(toPublicCsv_(publicRows)).setMimeType(ContentService.MimeType.CSV);
      }
      return ContentService.createTextOutput(JSON.stringify(toPublicRecords_(publicRows))).setMimeType(ContentService.MimeType.JSON);
    }

    const data = aggregateSheet_(values, spreadsheet.getName(), sheet.getName());
    assertPublicAggregate_(data);
    if (parameters.format === "csv") {
      return ContentService.createTextOutput(toCsv_(data)).setMimeType(ContentService.MimeType.CSV);
    }
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: String(error.message || error) })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getSourceSpreadsheet_() {
  if (TARGET_SPREADSHEET_ID && !TARGET_SPREADSHEET_ID.includes("PASTE_")) {
    return SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  }
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error("請設定 TARGET_SPREADSHEET_ID，或將程式綁定到目標 Google Sheet。");
  return spreadsheet;
}

function buildPublicRows_(values) {
  if (!values.length) throw new Error("工作表沒有標題列。");
  const headers = values[0].map((header) => String(header).replace(/^\uFEFF/, "").trim());
  const includedIndexes = headers.map((header, index) => ({ header, index }))
    .filter((item) => item.header && !isExcludedPublicHeader_(item.header));
  if (!includedIndexes.length) throw new Error("沒有可公開的非個資欄位。");

  const publicHeaders = includedIndexes.map((item) => item.header);
  const rows = values.slice(1)
    .filter((row) => row.some((cell) => String(cell).trim() !== ""))
    .map((row) => includedIndexes.map((item) => redactPublicValue_(row[item.index])));
  return { headers: publicHeaders, rows };
}

function isExcludedPublicHeader_(header) {
  const normalized = String(header).trim().toLowerCase();
  if (normalized === "name") return true;
  return PUBLIC_EXCLUDED_HEADER_KEYWORDS.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

function redactPublicValue_(value) {
  return String(value || "")
    .replace(/\b[A-Z][12]\d{8}\b/gi, "[REDACTED]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED]")
    .replace(/(?:\+?886[-\s]?)?09\d{2}[-\s]?\d{3}[-\s]?\d{3}\b/g, "[REDACTED]");
}

function toPublicRecords_(publicRows) {
  return publicRows.rows.map((row) => Object.fromEntries(publicRows.headers.map((header, index) => [header, row[index]])));
}

function toPublicCsv_(publicRows) {
  return [publicRows.headers].concat(publicRows.rows)
    .map((row) => row.map(publicCsvCell_).join(","))
    .join("\n");
}

function publicCsvCell_(value) {
  let text = String(value || "");
  if (/^[=+@]/.test(text)) text = `'${text}`;
  return csvCell_(text);
}

function importLatestKktixCsv() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error("另一個 KKTIX 匯入作業仍在執行，請稍後再試。");
  try {
    return importLatestKktixCsv_();
  } finally {
    lock.releaseLock();
  }
}

function importLatestKktixCsv_() {
  assertImportConfiguration_();
  const spreadsheet = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
  const folder = DriveApp.getFolderById(KKTIX_IMPORT_FOLDER_ID);
  const files = folder.getFiles();
  let latestFile = null;
  while (files.hasNext()) {
    const file = files.next();
    if (!/\.csv$/i.test(file.getName())) continue;
    if (!latestFile || file.getLastUpdated().getTime() > latestFile.getLastUpdated().getTime()) latestFile = file;
  }
  if (!latestFile) throw new Error("匯入資料夾內找不到 CSV 檔案。");

  const properties = PropertiesService.getScriptProperties();
  const fileSignature = [latestFile.getId(), latestFile.getLastUpdated().getTime(), latestFile.getSize()].join(":");
  if (properties.getProperty(LAST_IMPORTED_FILE_KEY) === fileSignature) {
    return { status: "unchanged", fileName: latestFile.getName() };
  }

  const text = latestFile.getBlob().getDataAsString("UTF-8").replace(/^\uFEFF/, "");
  const values = Utilities.parseCsv(text);
  if (values.length < 2 || values[0].length < 2) throw new Error("CSV 沒有有效的標題列或資料列。");
  assertKktixImportHeaders_(values[0]);
  const width = Math.max(...values.map((row) => row.length));
  const normalizedValues = values.map((row) => row.concat(Array(width - row.length).fill("")));
  const incomingHeaders = normalizedValues[0].map((header) => String(header).replace(/^\uFEFF/, "").trim());
  const incomingRows = normalizedValues.slice(1).filter((row) => row.some((cell) => String(cell).trim() !== ""));

  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  let newRows = incomingRows;
  let status = "initialized";
  if (sheet.getLastRow() > 0 && sheet.getLastColumn() > 0) {
    const existingValues = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getDisplayValues();
    const existingHeaders = existingValues[0].map((header) => String(header).replace(/^\uFEFF/, "").trim());
    assertMatchingImportHeaders_(existingHeaders, incomingHeaders);
    const existingRows = existingValues.slice(1).filter((row) => row.some((cell) => String(cell).trim() !== ""));
    newRows = selectNewImportRows_(existingRows, incomingRows, incomingHeaders);
    status = newRows.length ? "appended" : "no-new-rows";
  } else {
    ensureSheetSize_(sheet, incomingRows.length + 1, width);
    const initialRange = sheet.getRange(1, 1, incomingRows.length + 1, width);
    initialRange.setNumberFormat("@");
    initialRange.setValues([incomingHeaders].concat(incomingRows));
  }

  if (status === "appended") {
    const startRow = sheet.getLastRow() + 1;
    ensureSheetSize_(sheet, startRow + newRows.length - 1, width);
    const appendRange = sheet.getRange(startRow, 1, newRows.length, width);
    appendRange.setNumberFormat("@");
    appendRange.setValues(newRows);
  }
  sheet.setFrozenRows(1);
  SpreadsheetApp.flush();
  properties.setProperty(LAST_IMPORTED_FILE_KEY, fileSignature);
  properties.setProperty(`${LAST_IMPORTED_FILE_KEY}_name`, latestFile.getName());
  properties.setProperty(`${LAST_IMPORTED_FILE_KEY}_time`, new Date().toISOString());
  return {
    status,
    fileName: latestFile.getName(),
    sourceRows: incomingRows.length,
    appendedRows: status === "initialized" ? incomingRows.length : newRows.length,
    totalRows: sheet.getLastRow() - 1,
  };
}

function ensureSheetSize_(sheet, requiredRows, requiredColumns) {
  if (requiredRows > sheet.getMaxRows()) {
    sheet.insertRowsAfter(sheet.getMaxRows(), requiredRows - sheet.getMaxRows());
  }
  if (requiredColumns > sheet.getMaxColumns()) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), requiredColumns - sheet.getMaxColumns());
  }
}

function assertMatchingImportHeaders_(existingHeaders, incomingHeaders) {
  const normalize = (header) => String(header).replace(/^\uFEFF/, "").trim().replace(/\s+/g, " ").toLowerCase();
  const existing = existingHeaders.map(normalize);
  const incoming = incomingHeaders.map(normalize);
  if (existing.length !== incoming.length || existing.some((header, index) => header !== incoming[index])) {
    throw new Error("CSV 與「報名資料」的欄位或順序不同。為避免資料錯位，已停止差異匯入，且未修改既有資料。");
  }
}

function selectNewImportRows_(existingRows, incomingRows, headers) {
  const keyConfig = buildImportKeyConfig_(headers);
  const remainingExisting = new Map();
  existingRows.forEach((row) => {
    const key = importRowKey_(row, keyConfig);
    remainingExisting.set(key, (remainingExisting.get(key) || 0) + 1);
  });

  const newRows = [];
  incomingRows.forEach((row) => {
    const key = importRowKey_(row, keyConfig);
    const remaining = remainingExisting.get(key) || 0;
    if (remaining > 0) remainingExisting.set(key, remaining - 1);
    else newRows.push(row);
  });
  return newRows;
}

function buildImportKeyConfig_(headers) {
  const config = {
    ticketId: findOptionalColumn_(headers, IMPORT_KEY_HINTS.ticketId),
    orderId: findOptionalColumn_(headers, IMPORT_KEY_HINTS.orderId),
    name: findPersonalColumn_(headers, IMPORT_KEY_HINTS.name),
    email: findPersonalColumn_(headers, IMPORT_KEY_HINTS.email),
    payment: findOptionalColumn_(headers, COLUMN_HINTS.payment),
    pickup: findOptionalColumn_(headers, IMPORT_KEY_HINTS.pickup),
  };
  if (config.ticketId < 0 && config.orderId < 0 && config.payment < 0 && config.pickup < 0) {
    throw new Error("找不到可用於差異匯入的訂單、票券或時間欄位。");
  }
  return config;
}

function importRowKey_(row, config) {
  const value = (index) => index < 0 ? "" : normalizeImportKeyValue_(row[index]);
  const ticketId = value(config.ticketId);
  if (ticketId) return `ticket:${ticketId}`;
  const parts = [
    value(config.orderId),
    value(config.email),
    value(config.name),
    normalizeImportTimestamp_(config.payment < 0 ? "" : row[config.payment]),
    normalizeImportTimestamp_(config.pickup < 0 ? "" : row[config.pickup]),
  ];
  if (!parts.some(Boolean)) throw new Error("有資料列缺少可用於差異比對的識別內容。");
  return `registration:${parts.join("|")}`;
}

function normalizeImportKeyValue_(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeImportTimestamp_(value) {
  const text = String(value || "").trim();
  const match = text.match(/(\d{4})\D(\d{1,2})\D(\d{1,2})[T\s]+(\d{1,2}):(\d{2}):(\d{2})/);
  if (!match) return normalizeImportKeyValue_(text);
  return [match[1], match[2].padStart(2, "0"), match[3].padStart(2, "0")].join("-")
    + `T${match[4].padStart(2, "0")}:${match[5]}:${match[6]}`;
}

function findOptionalColumn_(headers, hints) {
  const candidates = Array.isArray(hints) ? hints : [hints];
  const compactHints = candidates.map((hint) => String(hint).replace(/\s/g, "").toLowerCase());
  return headers.findIndex((header) => {
    const compactHeader = String(header).replace(/\s/g, "").toLowerCase();
    return compactHints.some((hint) => compactHeader.includes(hint));
  });
}

function findPersonalColumn_(headers, aliases) {
  const normalizedAliases = aliases.map((alias) => String(alias).trim().toLowerCase());
  return headers.findIndex((header) => {
    const normalizedHeader = String(header).replace(/^\uFEFF/, "").trim().toLowerCase();
    return normalizedAliases.some((alias) => normalizedHeader === alias || normalizedHeader.startsWith(`${alias} `));
  });
}

function installKktixImportTrigger() {
  assertImportConfiguration_();
  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === IMPORT_HANDLER)
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger(IMPORT_HANDLER).timeBased().everyMinutes(15).create();
  return "已建立每 15 分鐘檢查一次的 KKTIX CSV 匯入觸發器。";
}

function assertImportConfiguration_() {
  if (!TARGET_SPREADSHEET_ID || TARGET_SPREADSHEET_ID.includes("PASTE_")) {
    throw new Error("請先設定 TARGET_SPREADSHEET_ID。");
  }
  if (!KKTIX_IMPORT_FOLDER_ID || KKTIX_IMPORT_FOLDER_ID.includes("PASTE_")) {
    throw new Error("請先設定 KKTIX_IMPORT_FOLDER_ID。");
  }
}

function assertKktixImportHeaders_(headers) {
  [COLUMN_HINTS.payment, COLUMN_HINTS.age, COLUMN_HINTS.roles].forEach((hints) => findColumn_(headers, hints));
}

function assertPublicAggregate_(data) {
  const allowedAges = ["25–34 歲", "35–44 歲", "19–24 歲", "45–54 歲", "55–64 歲", "65 歲以上", "18 歲以下", "不方便告知"];
  const ageLabels = data.ageGroups.map((item) => item.label);
  if (!ageLabels.length || ageLabels.some((label) => !allowedAges.includes(label))) {
    throw new Error("年齡欄位對應異常，為避免公開個人資料已停止輸出。請檢查 COLUMN_HINTS 與工作表標題列。");
  }
  const expectedRoles = ["使用者", "開發者", "推廣者"];
  if (!data.openSourceRoles.some((item) => expectedRoles.includes(item.label))) {
    throw new Error("開源角色欄位對應異常，已停止輸出。請檢查 COLUMN_HINTS 與工作表標題列。");
  }
}

function toCsv_(data) {
  const rows = [["dataset", "label", "value", "detail", "updated_at"]];
  const add = (dataset, label, value, detail) => rows.push([dataset, label, value, detail || "", data.source.updatedAt]);
  const summaryLabels = {
    totalRegistrations: "累積報名", activeRegistrations: "目前有效", cancelled: "已取消",
    within1Minute: "開放 1 分鐘", within5Minutes: "開放 5 分鐘", within30Minutes: "開放 30 分鐘", within2Hours: "開放 2 小時",
  };
  Object.keys(summaryLabels).forEach((key) => add("summary", summaryLabels[key], data.summary[key], ""));

  const datasets = {
    coscup_first_heard: data.coscupFirstHeard,
    ubucon_first_heard: data.ubuconFirstHeard,
    age_groups: data.ageGroups,
    open_source_roles: data.openSourceRoles,
    entry_paths: data.entryPaths.concat(data.entryPathsMore),
    operating_systems: data.operatingSystems.concat(data.operatingSystemsMore),
    open_source_software: data.openSourceSoftware.concat(data.openSourceSoftwareMore),
    licenses: data.licenses,
    work_ai: data.workAI.concat(data.workAIMore),
    daily_ai: data.dailyAI.concat(data.dailyAIMore),
    ai_outlook: data.aiOutlook,
    tracks: data.tracks.concat(data.tracksMore),
  };
  Object.keys(datasets).forEach((name) => datasets[name].forEach((item) => add(name, item.label, item.value, item.detail)));
  data.motivations.forEach((item) => add("motivations", item.title, item.value, ""));
  add("coscup_newsletter", "願意訂閱", data.newsletters.coscup.subscribe, "");
  add("coscup_newsletter", "僅收活動通知", data.newsletters.coscup.eventOnly, "");
  add("coscup_newsletter", "不訂閱", data.newsletters.coscup.none, "");
  add("ocf_newsletter", "願意訂閱", data.newsletters.ocf.subscribe, "");
  add("ocf_newsletter", "已訂閱", data.newsletters.ocf.already, "");
  add("ocf_newsletter", "不訂閱", data.newsletters.ocf.none, "");
  return rows.map((row) => row.map(csvCell_).join(",")).join("\n");
}

function csvCell_(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function aggregateSheet_(values, spreadsheetName, sheetName) {
  if (values.length < 2) throw new Error("工作表沒有資料列。");
  const headers = values[0].map(String);
  const columns = {};
  Object.keys(COLUMN_HINTS).forEach((key) => { columns[key] = findColumn_(headers, COLUMN_HINTS[key]); });
  const rows = values.slice(1).filter((row) => row.some((cell) => String(cell).trim() !== ""));
  const payments = rows.map((row) => parsePayment_(row[columns.payment])).filter(Boolean).sort((a, b) => a - b);
  if (!payments.length) throw new Error("找不到可辨識的付款時間。");
  const first = payments[0];
  const cumulative = (minutes) => payments.filter((date) => date.getTime() <= first.getTime() + minutes * 60000).length;
  const split = (items, size) => [items.slice(0, size), items.slice(size)];
  const entry = split(countSelections_(rows, columns.entry), 6);
  const os = split(countSelections_(rows, columns.os), 6);
  const software = split(countSelections_(rows, columns.software), 6);
  const workAI = split(countSelections_(rows, columns.workAI), 4);
  const dailyAI = split(countSelections_(rows, columns.dailyAI), 4);
  const tracks = split(countSelections_(rows, columns.tracks), 8);
  const motivationTones = ["coral", "blue", "yellow", "green", "pink", "cyan"];
  const motivations = countSelections_(rows, columns.motivations).map((item, index) => ({ value: item.value, title: item.label, tone: motivationTones[index % motivationTones.length] }));
  const coscup = countNewsletter_(rows, columns.coscupNewsletter);
  const ocf = countNewsletter_(rows, columns.ocfNewsletter);

  return {
    source: {
      name: `${spreadsheetName} / ${sheetName}`,
      updatedAt: Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "Asia/Taipei", "yyyy.MM.dd HH:mm"),
      schemaVersion: SCHEMA_VERSION,
    },
    summary: {
      totalRegistrations: rows.length,
      activeRegistrations: rows.filter((row) => !String(row[columns.cancelled]).trim()).length,
      cancelled: rows.filter((row) => String(row[columns.cancelled]).trim()).length,
      firstPaymentAt: timeText_(first), firstMinuteEnd: timeText_(new Date(first.getTime() + 60000)),
      within1Minute: cumulative(1), within5Minutes: cumulative(5), within30Minutes: cumulative(30), within2Hours: cumulative(120),
    },
    ageGroups: countSelections_(rows, columns.age),
    coscupFirstHeard: countFirstHeard_(rows, columns.coscupFirstHeard, "coscup"),
    ubuconFirstHeard: countFirstHeard_(rows, columns.ubuconFirstHeard, "ubucon"),
    openSourceRoles: countSelections_(rows, columns.roles),
    entryPaths: entry[0], entryPathsMore: entry[1],
    operatingSystems: os[0], operatingSystemsMore: os[1],
    openSourceSoftware: software[0], openSourceSoftwareMore: software[1],
    licenses: countSelections_(rows, columns.license),
    workAI: workAI[0], workAIMore: workAI[1], dailyAI: dailyAI[0], dailyAIMore: dailyAI[1],
    aiOutlook: countSelections_(rows, columns.outlook), tracks: tracks[0], tracksMore: tracks[1], motivations,
    newsletters: {
      coscup: { subscribe: coscup.subscribe, eventOnly: coscup.eventOnly, none: coscup.none },
      ocf: { subscribe: ocf.subscribe, already: ocf.already, none: ocf.none },
    },
  };
}

function countFirstHeard_(rows, column, eventName) {
  if (eventName === "ubucon") {
    const counts = { current: 0, earlier: 0, unclear: 0 };
    rows.forEach((row) => {
      const value = String(row[column] || "").trim();
      if (!value) return;
      const match = value.match(/^(20\d{2})$/);
      if (!match) counts.unclear += 1;
      else if (Number(match[1]) === 2026) counts.current += 1;
      else if (Number(match[1]) >= 2000 && Number(match[1]) < 2026) counts.earlier += 1;
      else counts.unclear += 1;
    });
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
  rows.forEach((row) => {
    const value = String(row[column] || "").trim();
    if (!value) return;
    const match = value.match(/^(20\d{2})$/);
    const year = match ? Number(match[1]) : NaN;
    const bucket = buckets.find((candidate) => year >= candidate.from && year <= candidate.to);
    if (bucket) bucket.value += 1;
    else unclear += 1;
  });
  return buckets.map(({ label, value }) => ({ label, value })).concat([{ label: "無法判定", value: unclear }]);
}

function findColumn_(headers, hints) {
  const candidates = Array.isArray(hints) ? hints : [hints];
  const compactHints = candidates.map((hint) => hint.replace(/\s/g, "").toLowerCase());
  const index = headers.findIndex((header) => {
    const compactHeader = String(header).replace(/\s/g, "").toLowerCase();
    return compactHints.some((hint) => compactHeader.includes(hint));
  });
  if (index < 0) throw new Error(`缺少必要欄位：${candidates[0]}`);
  return index;
}

function countSelections_(rows, column) {
  const counts = {};
  rows.forEach((row) => splitSelections_(String(row[column] || "")).forEach((raw) => {
    const item = localized_(raw);
    if (!counts[item.label]) counts[item.label] = { ...item, value: 0 };
    counts[item.label].value += 1;
  }));
  return Object.values(counts).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function splitSelections_(value) {
  return value.replace(/News,\s*Newspapers and magazines/gi, "News、Newspapers and magazines")
    .replace(/Audio,\s*video and streaming software/gi, "Audio、video and streaming software")
    .split(/,\s*/)
    .map((item) => item.replace("News、", "News, ").replace("Audio、", "Audio, ").trim())
    .filter(Boolean);
}

function localized_(raw) {
  const lower = raw.toLowerCase();
  const rule = LABEL_RULES.find((candidate) => lower.includes(candidate[0].toLowerCase()));
  if (rule) return rule[2] ? { label: rule[1], detail: rule[2] } : { label: rule[1] };
  const chinese = raw.match(/[\u3400-\u9fff][\u3400-\u9fff\s、／（）·・—-]*/);
  return { label: chinese ? chinese[0].trim() : raw.trim() };
}

function parsePayment_(value) {
  const match = String(value).match(/^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6]));
}

function timeText_(date) {
  return [date.getHours(), date.getMinutes(), date.getSeconds()].map((part) => String(part).padStart(2, "0")).join(":");
}

function countNewsletter_(rows, column) {
  const result = { subscribe: 0, eventOnly: 0, already: 0, none: 0 };
  rows.forEach((row) => {
    const value = String(row[column] || "");
    if (value.includes("已經訂閱") || value.includes("Already subscribed")) result.already += 1;
    else if (value.includes("僅接收") || value.includes("pre-event")) result.eventOnly += 1;
    else if (value.includes("不訂閱") || value.includes("Do not subscribe")) result.none += 1;
    else if (value.includes("願意訂閱") || value.includes("Subscribe")) result.subscribe += 1;
  });
  return result;
}
