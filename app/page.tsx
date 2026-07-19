import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { aggregateCsv } from "../lib/csv-aggregate";
import { defaultDashboardData, isDashboardData, isPublicAggregateSafe, type BarDatum, type DashboardData, type PersonaDatum } from "../lib/dashboard-data";
import { buildPersonaComparison, type PersonaComparisonDatum } from "../lib/persona-comparison";
import {
  copies,
  initialLocale,
  interpolate,
  localeOptions,
  localizeDashboardData,
  type Copy,
  type Locale,
} from "../lib/i18n";

type DataSourceConfig = {
  url?: string;
  format?: "auto" | "json" | "csv";
};

type TrackDirectoryItem = {
  id: number;
  names: string[];
  url: string;
};

type SessionApiItem = {
  track?: {
    id?: number;
    name?: { en?: string; "zh-hant"?: string };
  };
};

function personaHref(id: string, locale: Locale) {
  const params = new URLSearchParams({ persona: id, lang: locale });
  return `${import.meta.env.BASE_URL}?${params.toString()}`;
}

function overviewHref(locale: Locale, anchor: "community" | "agenda" = "community") {
  return `${import.meta.env.BASE_URL}?lang=${encodeURIComponent(locale)}#${anchor}`;
}

function normalizeTrackName(value: string) {
  return value.toLowerCase().replace(/[×✕]/g, "x").replace(/[^a-z0-9\u3400-\u9fff]/g, "");
}

function resolveTrackUrl(persona: PersonaDatum, directory: TrackDirectoryItem[]) {
  const candidates = [persona.sourceLabel, persona.label, persona.detail]
    .filter((value): value is string => Boolean(value))
    .map(normalizeTrackName)
    .filter(Boolean);
  const exact = directory.find((item) => item.names.some((name) => candidates.includes(normalizeTrackName(name))));
  if (exact) return exact.url;
  const partial = directory.find((item) => item.names.some((name) => {
    const normalized = normalizeTrackName(name);
    return candidates.some((candidate) => candidate.length >= 4 && (candidate.includes(normalized) || normalized.includes(candidate)));
  }));
  return partial?.url || "https://coscup.org/2026/session/";
}

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

function Brand({ copy, href = "#top" }: { copy: Copy; href?: string }) {
  return (
    <a className="wordmark" href={href} aria-label={copy.home}>
      <img
        className="site-logo"
        src="https://coscup.org/2026/_ipx/w_640&f_webp/coscup_logo.png"
        alt={copy.logoAlt}
      />
      <span className="wordmark-kicker">2026</span>
    </a>
  );
}

function LanguageSwitcher({ locale, copy, onChange }: { locale: Locale; copy: Copy; onChange: (locale: Locale) => void }) {
  return (
    <label className="language-switcher">
      <span>{copy.language}</span>
      <select value={locale} onChange={(event) => onChange(event.target.value as Locale)}>
        {localeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function InitialLoading({ locale, copy, onLocaleChange }: { locale: Locale; copy: Copy; onLocaleChange: (locale: Locale) => void }) {
  return (
    <main className="initial-loading" aria-busy="true">
      <header className="site-header">
        <Brand copy={copy} />
        <LanguageSwitcher locale={locale} copy={copy} onChange={onLocaleChange} />
      </header>

      <div id="top" className="hero-shell hero-shell--loading">
        <figure className="hero-visual">
          <img
            src={`${import.meta.env.BASE_URL}coscup-2026-transparent-banner.png`}
            alt={copy.imageAlt}
            fetchPriority="high"
          />
        </figure>

        <section className="hero-copy loading-copy">
          <div>
            <p className="eyebrow">{copy.loading.eyebrow}</p>
            <h1>{copy.loading.title}</h1>
          </div>
          <div className="hero-intro">
            <p>{copy.loading.description}</p>
            <div className="update-chip update-chip--loading">
              <span className="loading-pulse" aria-hidden="true" />
              <div>
                <strong>{copy.loading.syncing}</strong>
                <small>{copy.loading.noSnapshot}</small>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

type PersonaChartColor = "blue" | "coral" | "green" | "pink" | "yellow";

function comparisonBarWidth(rate: number) {
  if (rate <= 0) return "0%";
  return `${Math.max(Math.min(rate * 100, 100), 1.5)}%`;
}

function comparisonRank(copy: Copy, item: PersonaComparisonDatum) {
  if (item.populationRank == null || item.rankDelta == null) return null;
  const direction = item.rankDelta > 0 ? "up" : item.rankDelta < 0 ? "down" : "same";
  const symbol = direction === "up" ? "↑" : direction === "down" ? "↓" : "＝";
  const change = direction === "up"
    ? interpolate(copy.persona.rankUp, { count: item.rankDelta })
    : direction === "down"
      ? interpolate(copy.persona.rankDown, { count: Math.abs(item.rankDelta) })
      : copy.persona.rankSame;
  const path = interpolate(copy.persona.rankPath, { from: item.populationRank, to: item.cohortRank });
  return { direction, symbol, change, path };
}

function PersonaComparisonRows({
  data,
  color,
  copy,
  locale,
}: {
  data: PersonaComparisonDatum[];
  color: PersonaChartColor;
  copy: Copy;
  locale: Locale;
}) {
  const formatter = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
  return (
    <div className="persona-comparison-list">
      {data.map((item) => {
        const cohortRate = formatter.format(item.cohortRate);
        const populationRate = formatter.format(item.populationRate);
        const rank = comparisonRank(copy, item);
        const ariaLabel = interpolate(copy.persona.comparisonAria, {
          label: item.label,
          cohortValue: item.cohortValue,
          cohortRate,
          populationValue: item.populationValue,
          populationRate,
          rank: rank ? `${rank.path}，${rank.change}` : "",
        });
        return (
          <div className="persona-comparison-row" key={item.label} aria-label={ariaLabel}>
            <div className="persona-comparison-row__heading">
              <div className="bar-label">
                <span>{item.label}</span>
                {item.detail ? <small>{item.detail}</small> : null}
              </div>
              {rank ? (
                <div className={`rank-shift rank-shift--${rank.direction}`} title={`${rank.path}；${rank.change}`}>
                  <small>{rank.path}</small>
                  <strong><span aria-hidden="true">{rank.symbol}</span>{rank.direction === "same" ? null : Math.abs(item.rankDelta || 0)}</strong>
                </div>
              ) : null}
            </div>
            <div className="persona-comparison-series">
              <div className="persona-comparison-line persona-comparison-line--cohort">
                <span>{copy.persona.cohortShort}</span>
                <div className="persona-comparison-track" aria-hidden="true">
                  <i
                    className={`persona-comparison-fill persona-comparison-fill--${color}`}
                    style={{ "--comparison-width": comparisonBarWidth(item.cohortRate) } as CSSProperties}
                  />
                </div>
                <strong>{item.cohortValue}<small>{cohortRate}</small></strong>
              </div>
              <div className="persona-comparison-line persona-comparison-line--population">
                <span>{copy.persona.populationShort}</span>
                <div className="persona-comparison-track" aria-hidden="true">
                  <i
                    className="persona-comparison-fill persona-comparison-fill--population"
                    style={{ "--comparison-width": comparisonBarWidth(item.populationRate) } as CSSProperties}
                  />
                </div>
                <strong>{item.populationValue}<small>{populationRate}</small></strong>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PersonaBreakdownCard({
  title,
  data,
  populationData,
  cohortTotal,
  populationTotal,
  color,
  copy,
  locale,
}: {
  title: string;
  data: BarDatum[];
  populationData: BarDatum[];
  cohortTotal: number;
  populationTotal: number;
  color: PersonaChartColor;
  copy: Copy;
  locale: Locale;
}) {
  if (!data.length) return null;
  const comparisons = buildPersonaComparison(data, populationData, cohortTotal, populationTotal);
  const visible = comparisons.slice(0, 6);
  const rest = comparisons.slice(6);
  return (
    <article className={`chart-card persona-chart persona-chart--${color}`}>
      <div className="card-heading">
        <div>
          <p className="card-kicker">PERSONA BREAKDOWN</p>
          <h3>{title}</h3>
        </div>
      </div>
      <div className="persona-comparison-legend" aria-label={copy.persona.comparisonNote}>
        <span><i className={`persona-legend-line persona-legend-line--cohort persona-legend-line--${color}`} />{copy.persona.cohortLegend}</span>
        <span><i className="persona-legend-line persona-legend-line--population" />{copy.persona.populationLegend}</span>
      </div>
      <p className="persona-comparison-note">{copy.persona.comparisonNote}</p>
      <PersonaComparisonRows data={visible} color={color} copy={copy} locale={locale} />
      {rest.length ? (
        <details className="data-expander persona-comparison-expander">
          <summary>
            <span>{interpolate(copy.common.expandMore, { count: rest.length, unit: copy.persona.expandUnit })}</span>
            <strong aria-hidden="true">＋</strong>
          </summary>
          <PersonaComparisonRows data={rest} color={color} copy={copy} locale={locale} />
        </details>
      ) : null}
    </article>
  );
}

function PersonaPage({
  locale,
  copy,
  persona,
  population,
  allPersonas,
  updatedAt,
  trackUrl,
  onLocaleChange,
}: {
  locale: Locale;
  copy: Copy;
  persona: PersonaDatum | null;
  population: DashboardData;
  allPersonas: PersonaDatum[];
  updatedAt: string;
  trackUrl: string;
  onLocaleChange: (locale: Locale) => void;
}) {
  const backAnchor = persona?.kind === "track" ? "agenda" : "community";
  const populationTotal = population.summary.totalRegistrations;
  const populationMotivations = population.motivations.map((item) => ({ label: item.title, value: item.value }));
  return (
    <main className="persona-page">
      <header className="site-header">
        <Brand copy={copy} href={overviewHref(locale, backAnchor)} />
        <div className="header-actions persona-header-actions">
          <a className="persona-back-link" href={overviewHref(locale, backAnchor)}>{copy.persona.back}</a>
          <LanguageSwitcher locale={locale} copy={copy} onChange={onLocaleChange} />
        </div>
      </header>

      <section className="persona-hero" id="top">
        <div className="persona-hero__doodle" aria-hidden="true">✦</div>
        <div className="persona-hero__inner">
          <a className="persona-back-link persona-back-link--hero" href={overviewHref(locale, backAnchor)}>{copy.persona.back}</a>
          <p className="eyebrow">{copy.persona.eyebrow}</p>
          {persona ? (
            <>
              <div className="persona-hero__grid">
                <div>
                  <h1>{interpolate(persona.kind === "role" ? copy.persona.roleTitle : copy.persona.trackTitle, { name: persona.label })}</h1>
                  <p>{copy.persona.description}</p>
                  {persona.kind === "track" ? (
                    <a className="persona-schedule-link" href={trackUrl} target="_blank" rel="noreferrer">
                      {trackUrl.endsWith("/session/") ? copy.persona.scheduleFallback : copy.persona.schedule}
                    </a>
                  ) : null}
                </div>
                <div className="persona-count-card">
                  <span>{copy.persona.countLabel}</span>
                  <strong>{persona.value}</strong>
                  <small>{copy.persona.countUnit}</small>
                </div>
              </div>
              <div className="persona-freshness">{interpolate(copy.sync.updated, { time: updatedAt })}</div>
            </>
          ) : (
            <div className="persona-unavailable">
              <h1>{copy.persona.eyebrow}</h1>
              <p>{copy.persona.unavailable}</p>
            </div>
          )}
        </div>
      </section>

      {persona ? (
        <section className="section persona-content">
          <div className="section-inner">
            <div className="persona-grid">
              <PersonaBreakdownCard title={copy.persona.age} data={persona.ageGroups} populationData={population.ageGroups} cohortTotal={persona.value} populationTotal={populationTotal} color="blue" copy={copy} locale={locale} />
              <PersonaBreakdownCard title={copy.persona.roles} data={persona.openSourceRoles} populationData={population.openSourceRoles} cohortTotal={persona.value} populationTotal={populationTotal} color="yellow" copy={copy} locale={locale} />
              <PersonaBreakdownCard title={copy.persona.entry} data={persona.entryPaths} populationData={[...population.entryPaths, ...population.entryPathsMore]} cohortTotal={persona.value} populationTotal={populationTotal} color="coral" copy={copy} locale={locale} />
              <PersonaBreakdownCard title={copy.persona.os} data={persona.operatingSystems} populationData={[...population.operatingSystems, ...population.operatingSystemsMore]} cohortTotal={persona.value} populationTotal={populationTotal} color="green" copy={copy} locale={locale} />
              <PersonaBreakdownCard title={copy.persona.licenses} data={persona.licenses} populationData={population.licenses} cohortTotal={persona.value} populationTotal={populationTotal} color="blue" copy={copy} locale={locale} />
              <PersonaBreakdownCard title={copy.persona.workAI} data={persona.workAI} populationData={[...population.workAI, ...population.workAIMore]} cohortTotal={persona.value} populationTotal={populationTotal} color="coral" copy={copy} locale={locale} />
              <PersonaBreakdownCard title={copy.persona.dailyAI} data={persona.dailyAI} populationData={[...population.dailyAI, ...population.dailyAIMore]} cohortTotal={persona.value} populationTotal={populationTotal} color="pink" copy={copy} locale={locale} />
              <PersonaBreakdownCard title={copy.persona.motivations} data={persona.motivations} populationData={populationMotivations} cohortTotal={persona.value} populationTotal={populationTotal} color="yellow" copy={copy} locale={locale} />
              <PersonaBreakdownCard title={copy.persona.tracks} data={persona.tracks} populationData={[...population.tracks, ...population.tracksMore]} cohortTotal={persona.value} populationTotal={populationTotal} color="green" copy={copy} locale={locale} />
            </div>

            <details className="persona-switcher">
              <summary>{copy.persona.switcher}<strong aria-hidden="true">＋</strong></summary>
              <div className="persona-switcher__links">
                {allPersonas.map((item) => (
                  <a className={item.id === persona.id ? "is-active" : ""} href={personaHref(item.id, locale)} key={item.id}>
                    <span>{item.kind === "role" ? "ROLE" : "TRACK"}</span>
                    {item.label}<strong>{item.value}</strong>
                  </a>
                ))}
              </div>
            </details>
          </div>
        </section>
      ) : null}
    </main>
  );
}

export default function Home() {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [data, setData] = useState<DashboardData | null>(null);
  const [syncStatus, setSyncStatus] = useState<"loading" | "noSource" | "success" | "failed">("loading");
  const [dataSourceUrl, setDataSourceUrl] = useState("");
  const [personaId] = useState(() => new URLSearchParams(window.location.search).get("persona") || "");
  const [trackDirectory, setTrackDirectory] = useState<TrackDirectoryItem[]>([]);
  const copy = copies[locale];

  const loadRemoteData = useCallback(async () => {
    setSyncStatus("loading");
    setDataSourceUrl("");
    try {
      const configResponse = await fetch(`${import.meta.env.BASE_URL}data-source.json`, { cache: "no-store" });
      if (!configResponse.ok) throw new Error("找不到 data-source.json");
      const config = await configResponse.json() as DataSourceConfig;
      if (!config.url) {
        setData(defaultDashboardData);
        setSyncStatus("noSource");
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
        nextData = {
          ...candidate,
          coscupFirstHeard: Array.isArray(candidate.coscupFirstHeard) ? candidate.coscupFirstHeard : defaultDashboardData.coscupFirstHeard,
          ubuconFirstHeard: Array.isArray(candidate.ubuconFirstHeard) ? candidate.ubuconFirstHeard : defaultDashboardData.ubuconFirstHeard,
        };
      } else {
        nextData = aggregateCsv(text, config.url.split("/").pop() || "google-sheet.csv");
      }

      if (!isPublicAggregateSafe(nextData)) throw new Error("公開彙總欄位不符合安全規則");
      setDataSourceUrl(config.url);
      setData(nextData);
      setSyncStatus("success");
    } catch (error) {
      console.error(error);
      setData((current) => current ?? defaultDashboardData);
      setDataSourceUrl("");
      setSyncStatus("failed");
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

  useEffect(() => {
    if (!personaId.startsWith("track:")) return;
    let cancelled = false;
    const loadTrackDirectory = async () => {
      try {
        const response = await fetch("https://coscup.org/2026/api/session", { cache: "no-store" });
        if (!response.ok) throw new Error(`COSCUP session API ${response.status}`);
        const payload = await response.json() as Record<string, SessionApiItem[]>;
        const found = new Map<number, TrackDirectoryItem>();
        Object.values(payload).flat().forEach((session) => {
          const track = session.track;
          if (!track?.id || found.has(track.id)) return;
          found.set(track.id, {
            id: track.id,
            names: [track.name?.["zh-hant"], track.name?.en].filter((name): name is string => Boolean(name)),
            url: `https://coscup.org/2026/track/${track.id}/`,
          });
        });
        if (!cancelled) setTrackDirectory([...found.values()]);
      } catch (error) {
        console.warn("Unable to load COSCUP track links", error);
      }
    };
    void loadTrackDirectory();
    return () => { cancelled = true; };
  }, [personaId]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = copy.pageTitle;
    document.querySelector('meta[name="description"]')?.setAttribute("content", copy.pageDescription);
    window.localStorage.setItem("coscup-survey-locale", locale);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", locale);
    window.history.replaceState(null, "", url);
  }, [copy, locale]);

  const localizedData = useMemo(() => data ? localizeDashboardData(data, locale) : null, [data, locale]);
  const allPersonas = useMemo(() => localizedData?.personas
    ? [...localizedData.personas.roles, ...localizedData.personas.tracks]
    : [], [localizedData]);
  const selectedPersona = allPersonas.find((persona) => persona.id === personaId) || null;
  const selectedTrackUrl = selectedPersona?.kind === "track"
    ? resolveTrackUrl(selectedPersona, trackDirectory)
    : "https://coscup.org/2026/session/";

  useEffect(() => {
    if (!personaId) return;
    document.title = selectedPersona
      ? `${selectedPersona.label} Persona｜COSCUP 2026`
      : `Persona｜COSCUP 2026`;
  }, [personaId, selectedPersona]);

  if (!data || !localizedData) return <InitialLoading locale={locale} copy={copy} onLocaleChange={setLocale} />;

  if (personaId) {
    return (
      <PersonaPage
        locale={locale}
        copy={copy}
        persona={selectedPersona}
        population={localizedData}
        allPersonas={allPersonas}
        updatedAt={data.source.updatedAt}
        trackUrl={selectedTrackUrl}
        onLocaleChange={setLocale}
      />
    );
  }

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
    coscupFirstHeard,
    ubuconFirstHeard,
  } = localizedData;
  const { summary, newsletters, aiOutlook } = localizedData;
  const personaRoles = localizedData.personas?.roles ?? [];
  const personaTracks = localizedData.personas?.tracks ?? [];
  const percentage = (value: number, total: number) => `${total ? (value / total) * 100 : 0}%`;
  const endpoint = (format: "json" | "csv") => {
    if (!dataSourceUrl) return "";
    const separator = dataSourceUrl.includes("?") ? "&" : "?";
    return `${dataSourceUrl}${separator}view=raw&format=${format}`;
  };

  return (
    <main>
      <a className="skip-link" href="#content">
        {copy.skip}
      </a>

      <header className="site-header">
        <Brand copy={copy} />
        <div className="header-actions">
          <nav aria-label={copy.nav.label}>
            <a href="#pulse">{copy.nav.pulse}</a>
            <a href="#community">{copy.nav.community}</a>
            <a href="#ai">{copy.nav.ai}</a>
            <a href="#agenda">{copy.nav.agenda}</a>
            <a href="#open-data">{copy.nav.openData}</a>
          </nav>
          <LanguageSwitcher locale={locale} copy={copy} onChange={setLocale} />
        </div>
      </header>

      <div id="top" className="hero-shell">
        <figure className="hero-visual">
          <img
            src={`${import.meta.env.BASE_URL}coscup-2026-transparent-banner.png`}
            alt={copy.imageAlt}
            fetchPriority="high"
          />
        </figure>

        <section className="hero-copy" id="content">
          <div>
            <p className="eyebrow">{copy.hero.eyebrow}</p>
            <h1>
              {copy.hero.beforeCount} {summary.totalRegistrations} {copy.hero.afterCount}<br />
              {copy.hero.title}<span>{copy.hero.highlight}</span>
            </h1>
          </div>
          <div className="hero-intro">
            <p>
              {copy.hero.description}
            </p>
            <div className="update-chip">
              <span className="status-dot" /> {interpolate(copy.sync.updated, { time: data.source.updatedAt })}
              <small>{copy.sync[syncStatus]}</small>
            </div>
          </div>
        </section>

        <section className="kpi-grid" aria-label={copy.hero.overview}>
          <article className="kpi-card kpi-card--blue">
            <span>{copy.kpi.total}</span>
            <strong>{summary.totalRegistrations}</strong>
            <small>{copy.kpi.totalUnit}</small>
          </article>
          <article className="kpi-card kpi-card--green">
            <span>{copy.kpi.active}</span>
            <strong>{summary.activeRegistrations}</strong>
            <small>{interpolate(copy.kpi.activeNote, { count: summary.cancelled })}</small>
          </article>
          <article className="kpi-card kpi-card--coral">
            <span>{copy.kpi.firstMinute}</span>
            <strong>{summary.within1Minute}</strong>
            <small>{copy.kpi.firstMinuteNote}</small>
          </article>
          <article className="kpi-card kpi-card--yellow">
            <span>{copy.kpi.thirtyMinutes}</span>
            <strong>{summary.within30Minutes}</strong>
            <small>{copy.kpi.thirtyMinutesNote}</small>
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
            eyebrow={copy.pulse.eyebrow}
            title={copy.pulse.title}
            description={copy.pulse.description}
          />

          <div className="pulse-layout">
            <article className="feature-stat">
              <span className="feature-stat__spark">✦</span>
              <p>{summary.firstPaymentAt} → {summary.firstMinuteEnd}</p>
              <strong>{summary.within1Minute}</strong>
              <h3>{copy.pulse.firstMinute}</h3>
              <small>{copy.pulse.heat}</small>
            </article>

            <div className="timeline-card">
              <div className="timeline-row">
                <span>{copy.pulse.minute1}</span>
                <div><i style={{ "--pulse": "35%" } as CSSProperties} /></div>
                <strong>{summary.within1Minute}</strong>
              </div>
              <div className="timeline-row">
                <span>{copy.pulse.minute5}</span>
                <div><i style={{ "--pulse": "43%" } as CSSProperties} /></div>
                <strong>{summary.within5Minutes}</strong>
              </div>
              <div className="timeline-row">
                <span>{copy.pulse.minute30}</span>
                <div><i style={{ "--pulse": "70%" } as CSSProperties} /></div>
                <strong>{summary.within30Minutes}</strong>
              </div>
              <div className="timeline-row">
                <span>{copy.pulse.hour2}</span>
                <div><i style={{ "--pulse": "100%" } as CSSProperties} /></div>
                <strong>{summary.within2Hours}</strong>
              </div>
              <p className="card-note">{copy.pulse.note}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="community">
        <div className="section-inner">
          <SectionHeading
            eyebrow={copy.community.eyebrow}
            title={copy.community.title}
            description={copy.community.description}
          />

          <div className="dashboard-grid dashboard-grid--community">
            <article className="chart-card chart-card--dark community-role-feature">
              <div className="card-heading">
                <div>
                  <p className="card-kicker">{copy.community.roleKicker}</p>
                  <h3>{copy.community.roleTitle}</h3>
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
                      {personaRoles[index] ? (
                        <a className="persona-inline-link" href={personaHref(personaRoles[index].id, locale)}>
                          {copy.persona.exploreRole}
                        </a>
                      ) : null}
                    </div>
                    <strong>{role.value}</strong>
                  </div>
                ))}
              </div>
              <p className="card-note card-note--light">{copy.community.roleNote}</p>
            </article>

            <article className="chart-card tech-card">
              <div className="card-heading">
                <div>
                  <p className="card-kicker">{copy.community.osKicker}</p>
                  <h3>{copy.community.osTitle}</h3>
                </div>
              </div>
              <BarList data={operatingSystems} color="green" compact />
              <ExpandableNumbers label={interpolate(copy.common.expandMore, { count: operatingSystemsMore.length, unit: copy.community.osUnit })} data={operatingSystemsMore} />
              <p className="card-note">{copy.common.multiSelect}</p>
            </article>

            <article className="chart-card">
              <div className="card-heading">
                <div>
                  <p className="card-kicker">{copy.community.ageKicker}</p>
                  <h3>{copy.community.ageTitle}</h3>
                </div>
                <span className="shape-badge">AGE</span>
              </div>
              <BarList data={ageGroups} color="blue" />
            </article>

            <article className="chart-card chart-card--full software-card">
              <div className="card-heading">
                <div>
                  <p className="card-kicker">{copy.community.softwareKicker}</p>
                  <h3>{copy.community.softwareTitle}</h3>
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
                <ExpandableNumbers label={interpolate(copy.common.expandMore, { count: openSourceSoftwareMore.length, unit: copy.community.softwareUnit })} data={openSourceSoftwareMore} />
              </div>
              <p className="card-note">{copy.common.multiSelect}</p>
            </article>
          </div>

          <section className="first-experience" aria-labelledby="first-experience-title">
            <div className="first-experience__heading">
              <p className="eyebrow">{copy.firstExperience.eyebrow}</p>
              <h2 id="first-experience-title">{copy.firstExperience.title}</h2>
              <p className="first-experience__description">{copy.firstExperience.description}</p>
            </div>
            <div className="first-experience__grid">
              <article className="chart-card first-experience__card">
                <div className="card-heading"><div><p className="card-kicker">{copy.firstExperience.coscupKicker}</p><h3>{copy.firstExperience.coscupTitle}</h3></div></div>
                <BarList data={coscupFirstHeard} color="green" />
                <p className="card-note">{copy.firstExperience.yearNote}</p>
              </article>
              <article className="chart-card first-experience__card">
                <div className="card-heading"><div><p className="card-kicker">{copy.firstExperience.ubuconKicker}</p><h3>{copy.firstExperience.ubuconTitle}</h3></div></div>
                <BarList data={ubuconFirstHeard} color="yellow" />
                <p className="card-note">{copy.firstExperience.yearNote}</p>
              </article>
              <article className="chart-card first-experience__card first-experience__card--wide">
                <div className="card-heading"><div><p className="card-kicker">{copy.firstExperience.entryKicker}</p><h3>{copy.firstExperience.entryTitle}</h3></div></div>
                <BarList data={[...entryPaths, ...entryPathsMore]} color="coral" />
                <p className="card-note">{copy.common.multiSelect}</p>
              </article>
              <article className="chart-card first-experience__card first-experience__card--wide">
                <div className="card-heading"><div><p className="card-kicker">{copy.firstExperience.licenseKicker}</p><h3>{copy.firstExperience.licenseTitle}</h3></div></div>
                <BarList data={licenses} color="blue" />
                <p className="card-note">{copy.common.multiSelect}</p>
              </article>
            </div>
          </section>
        </div>
      </section>

      <section className="section section--sand" id="ai">
        <div className="section-doodles section-doodles--fruit" aria-hidden="true">
          <span className="fruit fruit--watermelon" />
          <span className="fruit fruit--pineapple">◆</span>
        </div>
        <div className="section-inner">
          <SectionHeading
            eyebrow={copy.ai.eyebrow}
            title={copy.ai.title}
            description={copy.ai.description}
          />

          <div className="ai-grid">
            <article className="chart-card ai-card ai-card--work">
              <div className="card-heading">
                <div>
                  <p className="card-kicker">{copy.ai.workKicker}</p>
                  <h3>{interpolate(copy.ai.workTop, { tool: workAI[0]?.label || copy.common.aiTool })}</h3>
                </div>
                <span className="context-chip">WORK</span>
              </div>
              <BarList data={workAI} color="coral" />
              <ExpandableNumbers label={interpolate(copy.common.expandMore, { count: workAIMore.length, unit: copy.ai.workUnit })} data={workAIMore} />
            </article>

            <article className="chart-card ai-card ai-card--daily">
              <div className="card-heading">
                <div>
                  <p className="card-kicker">{copy.ai.dailyKicker}</p>
                  <h3>{interpolate(copy.ai.dailyTop, { tool: dailyAI[0]?.label || copy.common.aiTool })}</h3>
                </div>
                <span className="context-chip context-chip--blue">LIFE</span>
              </div>
              <BarList data={dailyAI} color="blue" />
              <ExpandableNumbers label={interpolate(copy.common.expandMore, { count: dailyAIMore.length, unit: copy.ai.dailyUnit })} data={dailyAIMore} />
              <p className="card-note">{copy.common.multiSelect}</p>
            </article>
          </div>

          <article className="outlook-panel">
            <div className="outlook-copy">
              <p className="card-kicker">{copy.ai.outlookKicker}</p>
              <h3>{copy.ai.outlookTitle}</h3>
              <p>{copy.ai.outlookDescription}</p>
            </div>
            <div className="outlook-stats">
              {aiOutlook.slice(0, 3).map((item) => (
                <div key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <p className="card-note card-note--light">{copy.common.multiSelect}</p>
          </article>
        </div>
      </section>

      <section className="section" id="agenda">
        <div className="section-inner">
          <SectionHeading
            eyebrow={copy.agenda.eyebrow}
            title={copy.agenda.title}
            description={copy.agenda.description}
          />

          <div className="dashboard-grid dashboard-grid--agenda">
            <article className="chart-card chart-card--wide track-card">
              <div className="card-heading">
                <div>
                  <p className="card-kicker">{copy.agenda.trackKicker}</p>
                  <h3>{copy.agenda.trackTitle}</h3>
                </div>
                <span className="shape-badge shape-badge--pink">TOP 8</span>
              </div>
              <BarList data={tracks} color="pink" />
              <ExpandableNumbers label={interpolate(copy.common.expandMore, { count: tracksMore.length, unit: copy.agenda.trackUnit })} data={tracksMore} />
              {personaTracks.length ? (
                <details className="track-persona-browser">
                  <summary>{copy.persona.exploreTrack}<strong aria-hidden="true">＋</strong></summary>
                  <div className="track-persona-links">
                    {personaTracks.map((persona) => (
                      <a href={personaHref(persona.id, locale)} key={persona.id}>
                        <span>{persona.label}</span><strong>{persona.value}</strong>
                      </a>
                    ))}
                  </div>
                </details>
              ) : null}
              <p className="card-note">{copy.common.multiSelect}</p>
            </article>

            <article className="chart-card motivation-card">
              <div className="card-heading">
                <div>
                  <p className="card-kicker">{copy.agenda.motivationKicker}</p>
                  <h3>{copy.agenda.motivationTitle}</h3>
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
              <h3>{copy.newsletter.title}</h3>
              <p>{copy.newsletter.description}</p>
            </div>
            <div className="newsletter-bars">
              <div className="newsletter-row">
                <div className="newsletter-title">
                  <strong>{copy.newsletter.coscup}</strong>
                  <span>{copy.newsletter.subscribe} {newsletters.coscup.subscribe} · {copy.newsletter.eventOnly} {newsletters.coscup.eventOnly} · {copy.newsletter.none} {newsletters.coscup.none}</span>
                </div>
                <div className="stacked-bar" aria-label={`${copy.newsletter.coscup}: ${copy.newsletter.subscribe} ${newsletters.coscup.subscribe}, ${copy.newsletter.eventOnly} ${newsletters.coscup.eventOnly}, ${copy.newsletter.none} ${newsletters.coscup.none}`}>
                  <span className="stacked-bar__green" style={{ width: percentage(newsletters.coscup.subscribe, newsletters.coscup.subscribe + newsletters.coscup.eventOnly + newsletters.coscup.none) }} />
                  <span className="stacked-bar__yellow" style={{ width: percentage(newsletters.coscup.eventOnly, newsletters.coscup.subscribe + newsletters.coscup.eventOnly + newsletters.coscup.none) }} />
                  <span className="stacked-bar__neutral" style={{ width: percentage(newsletters.coscup.none, newsletters.coscup.subscribe + newsletters.coscup.eventOnly + newsletters.coscup.none) }} />
                </div>
              </div>
              <div className="newsletter-row">
                <div className="newsletter-title">
                  <strong>{copy.newsletter.ocf}</strong>
                  <span>{copy.newsletter.subscribe} {newsletters.ocf.subscribe} · {copy.newsletter.already} {newsletters.ocf.already} · {copy.newsletter.none} {newsletters.ocf.none}</span>
                </div>
                <div className="stacked-bar" aria-label={`${copy.newsletter.ocf}: ${copy.newsletter.subscribe} ${newsletters.ocf.subscribe}, ${copy.newsletter.already} ${newsletters.ocf.already}, ${copy.newsletter.none} ${newsletters.ocf.none}`}>
                  <span className="stacked-bar__green" style={{ width: percentage(newsletters.ocf.subscribe, newsletters.ocf.subscribe + newsletters.ocf.already + newsletters.ocf.none) }} />
                  <span className="stacked-bar__blue" style={{ width: percentage(newsletters.ocf.already, newsletters.ocf.subscribe + newsletters.ocf.already + newsletters.ocf.none) }} />
                  <span className="stacked-bar__neutral" style={{ width: percentage(newsletters.ocf.none, newsletters.ocf.subscribe + newsletters.ocf.already + newsletters.ocf.none) }} />
                </div>
              </div>
              <div className="legend">
                <LegendItem color="green">{copy.newsletter.subscribe}</LegendItem>
                <LegendItem color="blue">{copy.newsletter.already}</LegendItem>
                <LegendItem color="yellow">{copy.newsletter.eventOnly}</LegendItem>
                <LegendItem color="neutral">{copy.newsletter.none}</LegendItem>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="section section--open-data" id="open-data">
        <div className="open-data-shell">
          <div className="open-data-copy">
            <p className="eyebrow">{copy.openData.eyebrow}</p>
            <h2>{copy.openData.title.split("\n").map((line, index) => <span key={line}>{index ? <br /> : null}{line}</span>)}</h2>
            <p>{copy.openData.description}</p>
          </div>

          <div className="open-data-formats">
            <article className="format-card format-card--json">
              <span className="format-badge">JSON</span>
              <h3>{copy.openData.jsonTitle}</h3>
              <p>{copy.openData.jsonDescription}</p>
              {dataSourceUrl ? <a href={endpoint("json")} target="_blank" rel="noreferrer">{copy.openData.jsonAction}</a> : <span className="format-pending">{copy.openData.pending}</span>}
            </article>
            <article className="format-card format-card--csv">
              <span className="format-badge">CSV</span>
              <h3>{copy.openData.csvTitle}</h3>
              <p>{copy.openData.csvDescription}</p>
              {dataSourceUrl ? <a href={endpoint("csv")} target="_blank" rel="noreferrer">{copy.openData.csvAction}</a> : <span className="format-pending">{copy.openData.pending}</span>}
            </article>
          </div>

          <div className="open-data-meta">
            <span>{interpolate(copy.openData.latest, { time: data.source.updatedAt })}</span>
            <span>{copy.openData.format}</span>
            <span>{copy.openData.granularity}</span>
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-mark">
          <span>✦</span>
          <strong>COSCUP × UbuCon Asia 2026</strong>
        </div>
        <p>{interpolate(copy.footer.source, { time: data.source.updatedAt })}</p>
        <a href="#top">{copy.footer.top}</a>
      </footer>
    </main>
  );
}
