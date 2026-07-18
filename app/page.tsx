import type { CSSProperties } from "react";

type BarDatum = {
  label: string;
  value: number;
  detail?: string;
};

const ageGroups: BarDatum[] = [
  { label: "25–34 歲", value: 22 },
  { label: "35–44 歲", value: 21 },
  { label: "19–24 歲", value: 13 },
  { label: "45–54 歲", value: 6 },
  { label: "18 歲以下", value: 4 },
  { label: "不方便告知", value: 2 },
];

const openSourceRoles: BarDatum[] = [
  { label: "使用者", value: 59, detail: "Users" },
  { label: "開發者", value: 42, detail: "Coders" },
  { label: "推廣者", value: 19, detail: "Promoters" },
];

const entryPaths: BarDatum[] = [
  { label: "參加開源社群活動", value: 31 },
  { label: "實際參與開源專案", value: 16 },
  { label: "社群媒體", value: 15 },
  { label: "網路論壇", value: 14 },
  { label: "親友介紹", value: 12 },
  { label: "學校社團", value: 8 },
];

const operatingSystems: BarDatum[] = [
  { label: "macOS", value: 36 },
  { label: "Windows 11", value: 33 },
  { label: "Ubuntu Linux", value: 22 },
  { label: "Debian Linux", value: 11 },
  { label: "Windows 10", value: 9 },
  { label: "Arch Linux", value: 8 },
];

const openSourceSoftware: BarDatum[] = [
  { label: "開源瀏覽器", value: 47 },
  { label: "Web 伺服器", value: 39 },
  { label: "後端開發框架", value: 31 },
  { label: "前端開發框架", value: 25 },
  { label: "通訊軟體", value: 19 },
  { label: "辦公室軟體", value: 17 },
];

const workAI: BarDatum[] = [
  { label: "Claude", value: 25 },
  { label: "ChatGPT", value: 13 },
  { label: "Gemini", value: 8 },
  { label: "Codex", value: 8 },
  { label: "其他工具", value: 7 },
];

const dailyAI: BarDatum[] = [
  { label: "ChatGPT", value: 44 },
  { label: "Gemini", value: 36 },
  { label: "Claude", value: 30 },
  { label: "Grok", value: 6 },
];

const tracks: BarDatum[] = [
  { label: "主議程軌", value: 42, detail: "Main Session Track" },
  { label: "綜合議程", value: 28, detail: "各種開源議題" },
  { label: "System Software", value: 14 },
  { label: "AI 開放治理", value: 12 },
  { label: "UbuCon Asia", value: 11 },
  { label: "Hackers In Taiwan", value: 10 },
  { label: "臺灣自由軟體在地化社群", value: 10 },
  { label: "開源商業模式", value: 10 },
];

const motivations = [
  { value: 26, title: "交流與認識新朋友", tone: "coral" },
  { value: 23, title: "學習開源技術", tone: "blue" },
  { value: 15, title: "獲取國際新知", tone: "yellow" },
  { value: 3, title: "瞭解開放原始碼", tone: "green" },
  { value: 3, title: "與開源社群互動", tone: "pink" },
  { value: 3, title: "體驗公民科技", tone: "cyan" },
];

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

export default function Home() {
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
            src="/coscup-2026-banner.png"
            alt="COSCUP 2026 與 UbuCon Asia 主視覺：臺灣島、海洋、夏日小吃與吉祥物"
          />
        </figure>

        <section className="hero-copy" id="content">
          <div>
            <p className="eyebrow">REGISTRATION SNAPSHOT · 2026</p>
            <h1>
              從 98 筆報名，<br />
              看見今年的<span>開源海岸線</span>
            </h1>
          </div>
          <div className="hero-intro">
            <p>
              把行前問卷化成一張可閱讀的參與者地圖：大家如何走進開源、平常使用哪些工具，又最期待在會場遇見什麼。
            </p>
            <div className="update-chip">
              <span className="status-dot" /> 資料更新至 2026.07.18 22:27
            </div>
          </div>
        </section>

        <section className="kpi-grid" aria-label="報名概況">
          <article className="kpi-card kpi-card--blue">
            <span>累積報名</span>
            <strong>98</strong>
            <small>筆 preregistration</small>
          </article>
          <article className="kpi-card kpi-card--green">
            <span>目前有效</span>
            <strong>96</strong>
            <small>扣除 2 筆取消</small>
          </article>
          <article className="kpi-card kpi-card--coral">
            <span>開放首分鐘</span>
            <strong>13</strong>
            <small>筆快速湧入</small>
          </article>
          <article className="kpi-card kpi-card--yellow">
            <span>開放 30 分鐘</span>
            <strong>26</strong>
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
              <p>20:00:09 → 20:01:09</p>
              <strong>13</strong>
              <h3>第一分鐘完成報名</h3>
              <small>報名熱度在開放當下立即形成</small>
            </article>

            <div className="timeline-card">
              <div className="timeline-row">
                <span>1 分鐘</span>
                <div><i style={{ "--pulse": "35%" } as CSSProperties} /></div>
                <strong>13</strong>
              </div>
              <div className="timeline-row">
                <span>5 分鐘</span>
                <div><i style={{ "--pulse": "43%" } as CSSProperties} /></div>
                <strong>16</strong>
              </div>
              <div className="timeline-row">
                <span>30 分鐘</span>
                <div><i style={{ "--pulse": "70%" } as CSSProperties} /></div>
                <strong>26</strong>
              </div>
              <div className="timeline-row">
                <span>2 小時</span>
                <div><i style={{ "--pulse": "100%" } as CSSProperties} /></div>
                <strong>37</strong>
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
                  <h3>Claude 位居首位</h3>
                </div>
                <span className="context-chip">WORK</span>
              </div>
              <BarList data={workAI} color="coral" />
            </article>

            <article className="chart-card ai-card ai-card--daily">
              <div className="card-heading">
                <div>
                  <p className="card-kicker">生活中使用</p>
                  <h3>ChatGPT 使用人次最高</h3>
                </div>
                <span className="context-chip context-chip--blue">LIFE</span>
              </div>
              <BarList data={dailyAI} color="blue" />
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
              <div>
                <strong>50</strong>
                <span>兩者相輔相成</span>
              </div>
              <div>
                <strong>24</strong>
                <span>開源比以前更重要</span>
              </div>
              <div>
                <strong>5</strong>
                <span>認為開源已死</span>
              </div>
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
                  <span>訂閱 38 · 僅收行前／會後通知 20 · 不訂閱 15</span>
                </div>
                <div className="stacked-bar" aria-label="COSCUP 電子報：訂閱 38，僅收行前及會後通知 20，不訂閱 15">
                  <span className="stacked-bar__green" style={{ width: "52.05%" }} />
                  <span className="stacked-bar__yellow" style={{ width: "27.4%" }} />
                  <span className="stacked-bar__neutral" style={{ width: "20.55%" }} />
                </div>
              </div>
              <div className="newsletter-row">
                <div className="newsletter-title">
                  <strong>OCF 電子報</strong>
                  <span>訂閱 27 · 已訂閱 21 · 不訂閱 25</span>
                </div>
                <div className="stacked-bar" aria-label="OCF 電子報：訂閱 27，已訂閱 21，不訂閱 25">
                  <span className="stacked-bar__green" style={{ width: "36.99%" }} />
                  <span className="stacked-bar__blue" style={{ width: "28.77%" }} />
                  <span className="stacked-bar__neutral" style={{ width: "34.24%" }} />
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

      <footer>
        <div className="footer-mark">
          <span>✦</span>
          <strong>COSCUP × UbuCon Asia 2026</strong>
        </div>
        <p>資料來源：活動預先報名資料，統計截止 2026.07.18 22:27。複選題以人次計算。</p>
        <a href="#top">回到頁首 ↑</a>
      </footer>
    </main>
  );
}
