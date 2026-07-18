import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { aggregateCsv } from "../lib/csv-aggregate";
import { defaultDashboardData, isDashboardData, type BarDatum, type DashboardData } from "../lib/dashboard-data";

type DataSourceConfig = {
  url?: string;
  format?: "auto" | "json" | "csv";
};

function BarList({
  data,
  color = "blue",
  compact = false,
}: {
  data: BarDatum[];
  color?: "blue" | "coral" | "green" | "pink" | "yellow";
  compact?: boolean;
}) {
  const max = Math.max(...data.map((item) => item.value));

  return (
    <div className={`bar-list ${compact ? "bar-list--compact" : ""}`}>
      {data.map((item) => (
        <div className="bar-row" key={item.label}>
          <div className="bar-label">
            <span>{item.label}</span>
            {item.detail ? <small>{item.detail}</small> : null}
          </div>
          <div className="bar-track" aria-hidden="true">
            <span
              className={`bar-fill bar-fill--${color}`}
              style={
                {
                  "--bar-width": `${Math.max((item.value / max) * 100, 4)}%`,
                } as CSSProperties
              }
            />
          </div>
          <strong className="bar-value">{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function LegendItem({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="legend-item">
      <span className={`legend-dot legend-dot--${color}`} />
      {children}
    </span>
  );
}

function ExpandableNumbers({ label, data }: { label: string; data: BarDatum[] }) {
  if (!data.length) return null;

  return (
    <details className="data-expander">
      <summary>
        <span>{label}</span>
        <strong aria-hidden="true">＋</strong>
      </summary>
      <div className="number-list">
        {data.map((item) => (
          <div className="number-row" key={item.label}>
            <div>
              <span>{item.label}</span>
              {item.detail ? <small>{item.detail}</small> : null}
            </div>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </details>
  );
}

export default function Home() {
  const [data, setData] = useState<DashboardData>(defaultDashboardData);
  const [syncStatus, setSyncStatus] = useState("正在讀取最新資料…");
  const [dataSourceUrl, setDataSourceUrl] = useState("");

  const loadRemoteData = useCallback(async () => {
    setSyncStatus("正在讀取最新資料…");
    try {
      const configResponse = await fetch(`${import.meta.env.BASE_URL}data-source.json`, { cache: "no-store" });
      if (!configResponse.ok) throw new Error("找不到 data-source.json");
      const config = await configResponse.json() as DataSourceConfig;
      setDataSourceUrl(config.url || "");
      if (!config.url) {
        setSyncStatus("尚未設定 Google Sheet，目前顯示內建快照");
        return;
      }

      const separator = config.url.includes("?") ? "&" : "?";
      const response = await fetch(`${config.url}${separator}_=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`資料來源回應 ${response.status}`);
      const text = await response.text();
      const looksLikeJson = config.format === "json" || (config.format !== "csv" && text.trimStart().startsWith("{"));

      let nextData: DashboardData;
      if (looksLikeJson) {
        const parsed = JSON.parse(text) as unknown;
        const candidate = (parsed as { data?: unknown })?.data ?? parsed;
        if (!isDashboardData(candidate)) throw new Error("彙總 JSON 格式不正確");
        nextData = candidate;
      } else {
        nextData = aggregateCsv(text, config.url.split("/").pop() || "google-sheet.csv");
      }

      setData(nextData);
      setSyncStatus("已同步 Google Sheet");
    } catch (error) {
      console.error(error);
      setSyncStatus("同步失敗，目前顯示上一版資料");
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void loadRemoteData(), 0);
    const timer = window.setInterval(() => void loadRemoteData(), 5 * 60_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [loadRemoteData]);

  const {
    ageGroups,
    openSourceRoles,
    entryPaths,
    entryPathsMore,
    operatingSystems,
    operatingSystemsMore,
    openSourceSoftware,
    openSourceSoftwareMore,
    licenses,
    workAI,
    workAIMore,
    dailyAI,
    dailyAIMore,
    tracks,
    tracksMore,
    motivations,
  } = data;
  const { summary, newsletters, aiOutlook } = data;
  const percentage = (value: number, total: number) => `${total ? (value / total) * 100 : 0}%`;
  const endpoint = (format: "json" | "csv") => {
    if (!dataSourceUrl) return "";
    const separator = dataSourceUrl.includes("?") ? "&" : "?";
    return `${dataSourceUrl}${separator}format=${format}`;
  };

  return (
    <main>
      <a className="skip-link" href="#content">
        跳至主要內容
      </a>

      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="回到頁首">
          <span className="wordmark-kicker">2026</span>
          <span>COSCUP × UbuCon Asia</span>
        </a>
        <nav aria-label="頁面導覽">
          <a href="#pulse">報名節奏</a>
          <a href="#community">社群輪廓</a>
          <a href="#ai">AI 使用</a>
          <a href="#agenda">議程興趣</a>
          <a href="#open-data">開放資料</a>
          <button className="nav-refresh" type="button" onClick={() => void loadRemoteData()}>重新同步</button>
        </nav>
      </header>

      <div id="top" className="hero-shell">
        <div className="hero-doodles" aria-hidden="true">
          <span className="doodle doodle--loop" />
          <span className="doodle doodle--dash" />
          <span className="doodle doodle--note">♪</span>
          <span className="doodle doodle--spark">✦</span>
        </div>
        <figure className="hero-visual">
          <img
            src={`${import.meta.env.BASE_URL}coscup-2026-banner.png`}
            alt="COSCUP 2026 與 UbuCon Asia 主視覺：臺灣島、海洋、夏日小吃與吉祥物"
          />
        </figure>

        <section className="hero-copy" id="content">
          <div>
            <p className="eyebrow">REGISTRATION SNAPSHOT · 2026</p>
            <h1>
              從 {summary.totalRegistrations} 筆報名，<br />
              看見今年的<span>開源海岸線</span>
            </h1>
          </div>
          <div className="hero-intro">
            <p>
              把行前問卷化成一張可閱讀的參與者地圖：大家如何走進開源、平常使用哪些工具，又最期待在會場遇見什麼。
            </p>
            <div className="update-chip">
              <span className="status-dot" /> 資料更新至 {data.source.updatedAt}
              <small>{syncStatus}</small>
            </div>
          </div>
        </section>

        <section className="kpi-grid" aria-label="報名概況">
          <article className="kpi-card kpi-card--blue">
            <span>累積報名</span>
            <strong>{summary.totalRegistrations}</strong>
            <small>筆 preregistration</small>
          </article>
          <article className="kpi-card kpi-card--green">
            <span>目前有效</span>
            <strong>{summary.activeRegistrations}</strong>
            <small>扣除 {summary.cancelled} 筆取消</small>
          </article>
          <article className="kpi-card kpi-card--coral">
            <span>開放首分鐘</span>
            <strong>{summary.within1Minute}</strong>
            <small>筆快速湧入</small>
          </article>
          <article className="kpi-card kpi-card--yellow">
            <span>開放 30 分鐘</span>
            <strong>{summary.within30Minutes}</strong>
            <small>筆累積報名</small>
          </article>
        </section>
      </div>

      <section className="section section--blue" id="pulse">
        <div className="section-doodles section-doodles--pulse" aria-hidden="true">
          <span>♫</span>
          <i />
        </div>
        <div className="section-inner">
          <SectionHeading
            eyebrow="01 · REGISTRATION PULSE"
            title="開放後的第一波浪潮"
            description="7 月 17 日晚間 20:00 開放後，最密集的報名出現在起跑的第一分鐘。"
          />

          <div className="pulse-layout">
            <article className="feature-stat">
              <span className="feature-stat__spark">✦</span>
              <p>{summary.firstPaymentAt} → {summary.firstMinuteEnd}</p>
              <strong>{summary.within1Minute}</strong>
              <h3>第一分鐘完成報名</h3>
              <small>報名熱度在開放當下立即形成</small>
            </article>

            <div className="timeline-card">
              <div className="timeline-row">
                <span>1 分鐘</span>
                <div><i style={{ "--pulse": "35%" } as CSSProperties} /></div>
                <strong>{summary.within1Minute}</strong>
              </div>
              <div className="timeline-row">
                <span>5 分鐘</span>
                <div><i style={{ "--pulse": "43%" } as CSSProperties} /></div>
                <strong>{summary.within5Minutes}</strong>
              </div>
              <div className="timeline-row">
                <span>30 分鐘</span>
                <div><i style={{ "--pulse": "70%" } as CSSProperties} /></div>
                <strong>{summary.within30Minutes}</strong>
              </div>
              <div className="timeline-row">
                <span>2 小時</span>
                <div><i style={{ "--pulse": "100%" } as CSSProperties} /></div>
                <strong>{summary.within2Hours}</strong>
              </div>
              <p className="card-note">數字為各時間點的累積報名筆數。</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="community">
        <div className="section-inner">
          <SectionHeading
            eyebrow="02 · COMMUNITY PROFILE"
            title="這片海岸，聚集了哪些人？"
            description="25–44 歲是目前最顯著的年齡帶；開源身分則跨越使用、開發與推廣，彼此重疊。"
          />

          <div className="dashboard-grid dashboard-grid--community">
            <article className="chart-card chart-card--wide">
              <div className="card-heading">
                <div>
                  <p className="card-kicker">年齡分布</p>
                  <h3>25–44 歲形成主要區段</h3>
                </div>
                <span className="shape-badge">AGE</span>
              </div>
              <BarList data={ageGroups} color="blue" />
            </article>

            <article className="chart-card chart-card--dark">
              <div className="card-heading">
                <div>
                  <p className="card-kicker">開源角色</p>
                  <h3>不只一種身分</h3>
                </div>
                <span className="shape-badge shape-badge--light">ROLE</span>
              </div>
              <div className="role-list">
                {openSourceRoles.map((role, index) => (
                  <div className="role-row" key={role.label}>
                    <span className={`role-orbit role-orbit--${index + 1}`} />
                    <div>
                      <small>{role.detail}</small>
                      <h4>{role.label}</h4>
                    </div>
                    <strong>{role.value}</strong>
                  </div>
                ))}
              </div>
              <p className="card-note card-note--light">複選題，同一人可同時扮演多種角色。</p>
            </article>

            <article className="chart-card">
              <div className="card-heading">
                <div>
                  <p className="card-kicker">開源入口</p>
                  <h3>社群活動是最常見的起點</h3>
                </div>
              </div>
              <BarList data={entryPaths} color="coral" compact />
              <ExpandableNumbers label={`展開其餘 ${entryPathsMore.length} 種開源入口`} data={entryPathsMore} />
              <p className="card-note">複選題，呈現被選擇的人次。</p>
            </article>

            <article className="chart-card tech-card">
              <div className="card-heading">
                <div>
                  <p className="card-kicker">日常系統</p>
                  <h3>跨平台，是開源人的日常</h3>
                </div>
              </div>
              <BarList data={operatingSystems} color="green" compact />
              <ExpandableNumbers label={`展開其餘 ${operatingSystemsMore.length} 種作業系統`} data={operatingSystemsMore} />
              <p className="card-note">複選題，呈現被選擇的人次。</p>
            </article>

            <article className="chart-card chart-card--full software-card">
              <div className="card-heading">
                <div>
                  <p className="card-kicker">開源軟體版圖</p>
                  <h3>從瀏覽器一路延伸到前後端</h3>
                </div>
              </div>
              <div className="software-pills">
                {openSourceSoftware.map((item, index) => (
                  <div className={`software-pill software-pill--${(index % 4) + 1}`} key={item.label}>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="expander-group">
                <ExpandableNumbers label={`展開其餘 ${openSourceSoftwareMore.length} 類開源軟體`} data={openSourceSoftwareMore} />
                <ExpandableNumbers label="展開授權條款完整數字" data={licenses} />
              </div>
              <p className="card-note">複選題，呈現被選擇的人次。</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section section--sand" id="ai">
        <div className="section-doodles section-doodles--fruit" aria-hidden="true">
          <span className="fruit fruit--watermelon" />
          <span className="fruit fruit--pineapple">◆</span>
        </div>
        <div className="section-inner">
          <SectionHeading
            eyebrow="03 · AI & OPEN SOURCE"
            title="AI 已在工作與生活中成為日常"
            description="工作情境以 Claude 居首；生活情境則由 ChatGPT、Gemini 與 Claude 形成主要組合。"
          />

          <div className="ai-grid">
            <article className="chart-card ai-card ai-card--work">
              <div className="card-heading">
                <div>
                  <p className="card-kicker">工作中使用</p>
                  <h3>{workAI[0]?.label || "AI 工具"} 位居首位</h3>
                </div>
                <span className="context-chip">WORK</span>
              </div>
              <BarList data={workAI} color="coral" />
              <ExpandableNumbers label={`展開其餘 ${workAIMore.length} 種工作 AI`} data={workAIMore} />
            </article>

            <article className="chart-card ai-card ai-card--daily">
              <div className="card-heading">
                <div>
                  <p className="card-kicker">生活中使用</p>
                  <h3>{dailyAI[0]?.label || "AI 工具"} 使用人次最高</h3>
                </div>
                <span className="context-chip context-chip--blue">LIFE</span>
              </div>
              <BarList data={dailyAI} color="blue" />
              <ExpandableNumbers label={`展開其餘 ${dailyAIMore.length} 種生活 AI`} data={dailyAIMore} />
              <p className="card-note">複選題，呈現被選擇的人次。</p>
            </article>
          </div>

          <article className="outlook-panel">
            <div className="outlook-copy">
              <p className="card-kicker">AI 會殺死開源，還是開啟新篇章？</p>
              <h3>多數聲音指向「共生」與「更重要」</h3>
              <p>相較於零和競爭，參與者更常把 AI 與開源視為可以相互推進的力量。</p>
            </div>
            <div className="outlook-stats">
              {aiOutlook.slice(0, 3).map((item) => (
                <div key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <p className="card-note card-note--light">複選題，呈現被選擇的人次。</p>
          </article>
        </div>
      </section>

      <section className="section" id="agenda">
        <div className="section-inner">
          <SectionHeading
            eyebrow="04 · WHAT PEOPLE WANT"
            title="大家想在會場帶走什麼？"
            description="交流、技術與國際新知是最主要的期待；議程興趣則從主議程一路展開至系統、AI 治理與在地化。"
          />

          <div className="dashboard-grid dashboard-grid--agenda">
            <article className="chart-card chart-card--wide track-card">
              <div className="card-heading">
                <div>
                  <p className="card-kicker">議程興趣排行</p>
                  <h3>主議程軌領先，多元社群緊隨</h3>
                </div>
                <span className="shape-badge shape-badge--pink">TOP 8</span>
              </div>
              <BarList data={tracks} color="pink" />
              <ExpandableNumbers label={`展開其餘 ${tracksMore.length} 條議程軌`} data={tracksMore} />
              <p className="card-note">複選題，呈現被選擇的人次。</p>
            </article>

            <article className="chart-card motivation-card">
              <div className="card-heading">
                <div>
                  <p className="card-kicker">參與期待</p>
                  <h3>人與知識，都是會場主角</h3>
                </div>
              </div>
              <div className="motivation-grid">
                {motivations.map((item) => (
                  <div className={`motivation motivation--${item.tone}`} key={item.title}>
                    <strong>{item.value}</strong>
                    <span>{item.title}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <article className="newsletter-panel">
            <div>
              <p className="card-kicker">NEWSLETTER</p>
              <h3>會後，還想繼續保持連結嗎？</h3>
              <p>電子報意願顯示，活動之外的長期內容與社群聯繫仍有明確需求。</p>
            </div>
            <div className="newsletter-bars">
              <div className="newsletter-row">
                <div className="newsletter-title">
                  <strong>COSCUP 電子報</strong>
                  <span>訂閱 {newsletters.coscup.subscribe} · 僅收行前／會後通知 {newsletters.coscup.eventOnly} · 不訂閱 {newsletters.coscup.none}</span>
                </div>
                <div className="stacked-bar" aria-label={`COSCUP 電子報：訂閱 ${newsletters.coscup.subscribe}，僅收活動通知 ${newsletters.coscup.eventOnly}，不訂閱 ${newsletters.coscup.none}`}>
                  <span className="stacked-bar__green" style={{ width: percentage(newsletters.coscup.subscribe, newsletters.coscup.subscribe + newsletters.coscup.eventOnly + newsletters.coscup.none) }} />
                  <span className="stacked-bar__yellow" style={{ width: percentage(newsletters.coscup.eventOnly, newsletters.coscup.subscribe + newsletters.coscup.eventOnly + newsletters.coscup.none) }} />
                  <span className="stacked-bar__neutral" style={{ width: percentage(newsletters.coscup.none, newsletters.coscup.subscribe + newsletters.coscup.eventOnly + newsletters.coscup.none) }} />
                </div>
              </div>
              <div className="newsletter-row">
                <div className="newsletter-title">
                  <strong>OCF 電子報</strong>
                  <span>訂閱 {newsletters.ocf.subscribe} · 已訂閱 {newsletters.ocf.already} · 不訂閱 {newsletters.ocf.none}</span>
                </div>
                <div className="stacked-bar" aria-label={`OCF 電子報：訂閱 ${newsletters.ocf.subscribe}，已訂閱 ${newsletters.ocf.already}，不訂閱 ${newsletters.ocf.none}`}>
                  <span className="stacked-bar__green" style={{ width: percentage(newsletters.ocf.subscribe, newsletters.ocf.subscribe + newsletters.ocf.already + newsletters.ocf.none) }} />
                  <span className="stacked-bar__blue" style={{ width: percentage(newsletters.ocf.already, newsletters.ocf.subscribe + newsletters.ocf.already + newsletters.ocf.none) }} />
                  <span className="stacked-bar__neutral" style={{ width: percentage(newsletters.ocf.none, newsletters.ocf.subscribe + newsletters.ocf.already + newsletters.ocf.none) }} />
                </div>
              </div>
              <div className="legend">
                <LegendItem color="green">願意訂閱</LegendItem>
                <LegendItem color="blue">已訂閱</LegendItem>
                <LegendItem color="yellow">僅收活動通知</LegendItem>
                <LegendItem color="neutral">不訂閱</LegendItem>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="section section--open-data" id="open-data">
        <div className="open-data-shell">
          <div className="open-data-copy">
            <p className="eyebrow">05 · OPEN DATA</p>
            <h2>把數據帶走，<br />做出你的觀察。</h2>
            <p>
              我們提供與本頁一致的彙總統計，歡迎社群下載、介接與延伸分析。
              開放資料不包含逐筆回覆或可識別個人的資料。
            </p>
          </div>

          <div className="open-data-formats">
            <article className="format-card format-card--json">
              <span className="format-badge">JSON</span>
              <h3>介接用 API</h3>
              <p>適合程式、視覺化與自動分析流程。</p>
              {dataSourceUrl ? <a href={endpoint("json")} target="_blank" rel="noreferrer">開啟 JSON ↗</a> : <span className="format-pending">等待設定資料網址</span>}
            </article>
            <article className="format-card format-card--csv">
              <span className="format-badge">CSV</span>
              <h3>表格與分析工具</h3>
              <p>將各圖表統計整理為長表，可直接匯入。</p>
              {dataSourceUrl ? <a href={endpoint("csv")} target="_blank" rel="noreferrer">下載 CSV ↗</a> : <span className="format-pending">等待設定資料網址</span>}
            </article>
          </div>

          <div className="open-data-meta">
            <span>最新資料：{data.source.updatedAt}</span>
            <span>格式：UTF-8 · JSON / CSV</span>
            <span>粒度：彙總統計</span>
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-mark">
          <span>✦</span>
          <strong>COSCUP × UbuCon Asia 2026</strong>
        </div>
        <p>資料來源：活動預先報名資料，統計截止 {data.source.updatedAt}。複選題以人次計算。</p>
        <a href="#top">回到頁首 ↑</a>
      </footer>
    </main>
  );
}
