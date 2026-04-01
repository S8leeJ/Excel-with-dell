import React, { useMemo, useState } from "react";
import topicReviewsData from "./topic_reviews.json";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  ResponsiveContainer,
  ReferenceLine,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

const COLORS = {
  dellBlue: "#007DB8",
  navy: "#1A1A2E",
  red: "#E63946",
  orange: "#F4A261",
  yellow: "#E9C46A",
  bg: "#F5F7FA",
  card: "#FFFFFF",
  textMuted: "#5B6475",
  border: "#E6EAF0",
};

const KPI_CARDS = [
  { label: "Total Reviews Analyzed", value: "447", tone: "default" },
  { label: "Negative Review Rate", value: "34%", tone: "danger" },
  { label: "Avg Sentiment Severity Score", value: "5.7 / 10", tone: "default" },
  { label: "Top Pain Point", value: "Overheating & Thermal Issues", tone: "default" },
];

const TOPIC_DATA = [
  { topic: "Overheating & Thermal Issues", count: 24, severity: 5.5, priority: "CRITICAL", keywords: "overheat, heat, thermal, fan, hot" },
  { topic: "System Crashes & Freezes", count: 23, severity: 7.3, priority: "CRITICAL", keywords: "crash, freeze, reboot, restart, blue screen" },
  { topic: "Slow Performance & Bloatware", count: 20, severity: 5.2, priority: "HIGH", keywords: "slow, lag, bloatware, sluggish, startup" },
  { topic: "WiFi & Connectivity Drops", count: 19, severity: 6.4, priority: "HIGH", keywords: "wifi, disconnect, connection, bluetooth, network" },
  { topic: "Fan Noise & Vibration", count: 18, severity: 3.4, priority: "MODERATE", keywords: "noise, loud, fan, vibration, whirring" },
  { topic: "Dead-on-Arrival & Defects", count: 16, severity: 6.2, priority: "HIGH", keywords: "defective, dead, broken, DOA, failed" },
  { topic: "Keyboard & Build Quality", count: 11, severity: 4.5, priority: "MODERATE", keywords: "keyboard, hinge, key, stuck, build" },
  { topic: "Battery & Charging Problems", count: 10, severity: 6.2, priority: "HIGH", keywords: "battery, drain, charge, charging, life" },
  { topic: "Screen & Display Issues", count: 6, severity: 8.7, priority: "CRITICAL", keywords: "screen, flicker, display, blurry, brightness" },
  { topic: "Customer Support & Returns", count: 5, severity: 4.6, priority: "MODERATE", keywords: "support, warranty, return, refund, service" },
];

const NEGATIVE_TOTAL = 152;

const HISTOGRAM_DATA = [
  { bucket: "0-2", score: 1.0, count: 18 },
  { bucket: "3-4", score: 3.5, count: 35 },
  { bucket: "5-6", score: 5.5, count: 45 },
  { bucket: "7-8", score: 7.5, count: 32 },
  { bucket: "9-10", score: 9.5, count: 22 },
];

const MONTHLY_TREND = [
  { month: "Jul 2021", total: 6, overheating: 2, crashes: 1, slow: 1 },
  { month: "Aug 2021", total: 7, overheating: 2, crashes: 2, slow: 1 },
  { month: "Sep 2021", total: 5, overheating: 1, crashes: 2, slow: 1 },
  { month: "Oct 2021", total: 8, overheating: 2, crashes: 2, slow: 2 },
  { month: "Nov 2021", total: 9, overheating: 2, crashes: 3, slow: 2 },
  { month: "Dec 2021", total: 7, overheating: 2, crashes: 2, slow: 1 },
  { month: "Jan 2022", total: 10, overheating: 3, crashes: 3, slow: 2 },
  { month: "Feb 2022", total: 8, overheating: 2, crashes: 3, slow: 2 },
  { month: "Mar 2022", total: 6, overheating: 2, crashes: 2, slow: 1 },
  { month: "Apr 2022", total: 9, overheating: 3, crashes: 2, slow: 2 },
  { month: "May 2022", total: 11, overheating: 3, crashes: 3, slow: 3 },
  { month: "Jun 2022", total: 12, overheating: 4, crashes: 3, slow: 3 },
  { month: "Jul 2022", total: 10, overheating: 3, crashes: 3, slow: 2 },
  { month: "Aug 2022", total: 8, overheating: 2, crashes: 2, slow: 2 },
  { month: "Sep 2022", total: 7, overheating: 2, crashes: 2, slow: 2 },
  { month: "Oct 2022", total: 9, overheating: 3, crashes: 2, slow: 2 },
  { month: "Nov 2022", total: 11, overheating: 3, crashes: 3, slow: 3 },
  { month: "Dec 2022", total: 9, overheating: 3, crashes: 2, slow: 2 },
  { month: "Jan 2023", total: 8, overheating: 2, crashes: 2, slow: 2 },
  { month: "Feb 2023", total: 7, overheating: 2, crashes: 2, slow: 2 },
  { month: "Mar 2023", total: 9, overheating: 3, crashes: 2, slow: 2 },
  { month: "Apr 2023", total: 10, overheating: 3, crashes: 3, slow: 2 },
  { month: "May 2023", total: 11, overheating: 3, crashes: 3, slow: 3 },
  { month: "Jun 2023", total: 9, overheating: 2, crashes: 3, slow: 2 },
  { month: "Jul 2023", total: 8, overheating: 2, crashes: 2, slow: 2 },
];

/** Reference palette: severity tiers (0–10 scale) — matches executive bar style */
const SEVERITY_BAR = {
  moderate: { color: "#e8c474", label: "Moderate" },
  high: { color: "#f19b5c", label: "High Priority" },
  critical: { color: "#e53e3e", label: "Critical" },
};

function barFillBySeverity(severity) {
  if (severity >= 7) return SEVERITY_BAR.critical.color;
  if (severity >= 5) return SEVERITY_BAR.high.color;
  return SEVERITY_BAR.moderate.color;
}

const BAR_DATA = [...TOPIC_DATA].sort((a, b) => b.count - a.count).map((d) => {
  return {
    ...d,
    share: (d.count / NEGATIVE_TOTAL) * 100,
    barFill: barFillBySeverity(d.severity),
  };
});

const PRIORITY_BADGE = {
  CRITICAL: "bg-red-100 text-red-700",
  HIGH: "bg-orange-100 text-orange-700",
  MODERATE: "bg-yellow-100 text-yellow-700",
};

const CARD_BASE = "rounded-xl border p-4 shadow-sm";
const PANEL_BASE = "rounded-xl border bg-white p-4 shadow-sm";
const PANEL_HEADER = "mb-3 flex items-start justify-between gap-3";

function MatrixTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (!d?.topic) return null;
  return (
    <div
      className="max-w-[280px] rounded-lg border bg-white px-3 py-2.5 text-left shadow-lg"
      style={{ borderColor: COLORS.border, color: COLORS.navy }}
    >
      <p className="text-sm font-semibold leading-snug" style={{ color: COLORS.dellBlue }}>
        {d.topic}
      </p>
      <p className="mt-1 text-xs" style={{ color: COLORS.textMuted }}>
        Reviews: <span className="font-medium text-slate-800">{d.count}</span>
        {" · "}
        Avg severity: <span className="font-medium text-slate-800">{Number(d.severity).toFixed(1)}</span>
      </p>
    </div>
  );
}

/** Softer wrapping for long topic names on the Y-axis (HTML in foreignObject). */
function PainPointYAxisTick({ x, y, payload }) {
  const text = String(payload?.value ?? "");
  const labelWidth = 232;
  return (
    <foreignObject x={x - labelWidth - 4} y={y - 22} width={labelWidth} height={44}>
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        className="flex h-full items-center justify-end pr-1 text-right text-[11px] font-medium leading-snug text-[#1c1e33]"
        style={{
          wordBreak: "normal",
          overflowWrap: "break-word",
          hyphens: "manual",
        }}
      >
        {text}
      </div>
    </foreignObject>
  );
}

/** Two-line stats so the long pipe string does not wrap awkwardly. */
function PainPointBarLabel({ x, y, width, height, index, payload }) {
  const row = BAR_DATA[index] ?? (payload?.topic ? BAR_DATA.find((d) => d.topic === payload.topic) : null);
  if (!row || width == null || x == null) return null;
  const pct = ((row.count / NEGATIVE_TOTAL) * 100).toFixed(1);
  const labelW = 200;
  return (
    <foreignObject x={x + width + 6} y={y} width={labelW} height={height}>
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        className="flex h-full flex-col justify-center gap-0.5 text-[9.5px] leading-tight text-[#1c1e33]"
      >
        <span style={{ whiteSpace: "nowrap" }}>
          {row.count} reviews ({pct}%)
        </span>
        <span className="text-[#5B6475]" style={{ whiteSpace: "nowrap" }}>
          avg severity: {row.severity.toFixed(1)}
        </span>
      </div>
    </foreignObject>
  );
}

export default function FusionTechDashboard() {
  const [sortConfig, setSortConfig] = useState({ key: "count", direction: "desc" });
  const [controlsTab, setControlsTab] = useState("scope");
  const [reviewsTopic, setReviewsTopic] = useState(TOPIC_DATA[0].topic);

  const medianCount = useMemo(() => {
    const counts = TOPIC_DATA.map((d) => d.count).sort((a, b) => a - b);
    return (counts[4] + counts[5]) / 2;
  }, []);

  const medianSeverity = useMemo(() => {
    const sev = TOPIC_DATA.map((d) => d.severity).sort((a, b) => a - b);
    return (sev[4] + sev[5]) / 2;
  }, []);

  const sortedTableData = useMemo(() => {
    const rows = TOPIC_DATA.map((d) => ({
      ...d,
      share: ((d.count / NEGATIVE_TOTAL) * 100).toFixed(1),
    }));

    const { key, direction } = sortConfig;
    return [...rows].sort((a, b) => {
      const dir = direction === "asc" ? 1 : -1;
      if (typeof a[key] === "number" && typeof b[key] === "number") {
        return (a[key] - b[key]) * dir;
      }
      return String(a[key]).localeCompare(String(b[key])) * dir;
    });
  }, [sortConfig]);

  const onSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: key === "topic" || key === "keywords" || key === "priority" ? "asc" : "desc" };
    });
  };

  const sortArrow = (key) => {
    if (sortConfig.key !== key) return "";
    return sortConfig.direction === "asc" ? " asc" : " desc";
  };

  const lastUpdatedLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const topicReviewBundle = topicReviewsData[reviewsTopic];
  const topicReviewsList = topicReviewBundle?.reviews ?? [];

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: COLORS.bg, color: COLORS.navy }}>
      <nav className="sticky top-0 z-30 border-b shadow-sm" style={{ backgroundColor: COLORS.navy }}>
        <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 text-white">
            <div
              className="grid h-9 w-9 place-items-center rounded-md text-xs font-bold"
              style={{ backgroundColor: COLORS.dellBlue }}
            >
              FT
            </div>
            <div className="text-lg font-semibold tracking-tight">
              <span style={{ color: "#D3ECF8" }}>FusionTech</span>
              <span className="mx-2 text-slate-500">|</span>
              <span>Customer Intelligence Dashboard</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
            <span className="rounded-full bg-white/10 px-3 py-1 text-slate-100">Last updated: {lastUpdatedLabel}</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-slate-100">Last 24 Months</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-slate-100">152 Negative Reviews Analyzed</span>
          </div>
        </div>
      </nav>

      <main className="mx-auto grid w-full max-w-[1700px] grid-cols-1 gap-4 px-4 py-4 pb-20 2xl:grid-cols-12">
        <aside className="hidden 2xl:col-span-2 2xl:block">
          <div className="sticky top-24 rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: COLORS.border }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>
              Dashboard Controls
            </p>
            <div className="mt-3 flex rounded-lg border p-0.5" style={{ borderColor: COLORS.border, backgroundColor: COLORS.bg }}>
              <button
                type="button"
                onClick={() => setControlsTab("scope")}
                className="flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: controlsTab === "scope" ? COLORS.dellBlue : "transparent",
                  color: controlsTab === "scope" ? "#fff" : COLORS.textMuted,
                }}
              >
                Scope
              </button>
              <button
                type="button"
                onClick={() => setControlsTab("reviews")}
                className="flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: controlsTab === "reviews" ? COLORS.dellBlue : "transparent",
                  color: controlsTab === "reviews" ? "#fff" : COLORS.textMuted,
                }}
              >
                Topic reviews
              </button>
            </div>

            {controlsTab === "scope" && (
              <>
                <div className="mt-4 space-y-2">
                  <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: COLORS.border }}>
                    Scope: Negative reviews only
                  </div>
                  <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: COLORS.border }}>
                    Window: Jul 2021 - Jul 2023
                  </div>
                  <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: COLORS.border }}>
                    Refresh: Real-time NLP pipeline
                  </div>
                </div>
                <div className="mt-4 rounded-lg p-3 text-xs" style={{ backgroundColor: "#EEF7FC", color: COLORS.dellBlue }}>
                  Executive snapshot for merchandising managers.
                </div>
              </>
            )}

            {controlsTab === "reviews" && (
              <div className="mt-4 flex flex-col gap-3">
                <div
                  className="rounded-xl border px-3 py-3 shadow-inner"
                  style={{ borderColor: COLORS.border, background: "linear-gradient(180deg, #f0f6fa 0%, #ffffff 100%)" }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Topic filter</p>
                  <label className="mt-2 block">
                    <span className="sr-only">Topic</span>
                    <select
                      value={reviewsTopic}
                      onChange={(e) => setReviewsTopic(e.target.value)}
                      className="w-full rounded-lg border-2 bg-white px-2.5 py-2 text-xs font-medium text-slate-900 shadow-sm outline-none ring-0 transition-shadow focus:border-[#007DB8] focus:shadow-md"
                      style={{ borderColor: "#c5d4e0" }}
                    >
                      {TOPIC_DATA.map((t) => (
                        <option key={t.topic} value={t.topic}>
                          {t.topic}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {topicReviewBundle && (
                  <div
                    className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5"
                    style={{
                      borderColor: COLORS.dellBlue,
                      backgroundColor: "rgba(0, 125, 184, 0.08)",
                    }}
                  >
                    <span className="text-xs font-bold" style={{ color: COLORS.navy }}>
                      {topicReviewBundle.review_count} review{topicReviewBundle.review_count === 1 ? "" : "s"}
                    </span>

                  </div>
                )}

                <div
                  className="max-h-[min(70vh,520px)] overflow-y-auto rounded-xl border-2 border-slate-200/90 bg-slate-100/90 p-2 shadow-inner"
                  style={{ scrollbarGutter: "stable" }}
                >
                  {topicReviewsList.length === 0 ? (
                    <p className="px-2 py-6 text-center text-xs text-slate-500">No reviews for this topic in the dataset.</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {topicReviewsList.map((r, i) => (
                        <li key={`${r.date}-${i}`}>
                          <article
                            className="overflow-hidden rounded-lg border border-slate-200/90 bg-white text-xs shadow-md ring-1 ring-black/[0.04]"
                            style={{ borderLeftWidth: "4px", borderLeftColor: COLORS.dellBlue }}
                          >
                            <div className="flex items-start gap-2 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-2.5 py-2">
                              <span
                                className="mt-0.5 flex h-5 min-w-[1.35rem] items-center justify-center rounded text-[10px] font-bold text-white"
                                style={{ backgroundColor: COLORS.dellBlue }}
                              >
                                {i + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold leading-snug text-slate-900">{r.title}</p>
                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                  <span
                                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                                    style={{
                                      backgroundColor: r.rating <= 2 ? "rgba(230, 57, 70, 0.12)" : "rgba(244, 162, 97, 0.2)",
                                      color: r.rating <= 2 ? COLORS.red : "#9a3412",
                                    }}
                                  >
                                    {r.rating}★ rating
                                  </span>
                                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">{r.date}</span>
                                  {typeof r.topic_confidence === "number" && (
                                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                                      {(r.topic_confidence * 100).toFixed(0)}% match
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="px-2.5 py-2.5">
                              <div className="max-h-40 overflow-y-auto rounded-md border border-slate-100 bg-slate-50/90 px-2 py-2 leading-relaxed text-slate-800">
                                {r.review}
                              </div>
                              {r.product && (
                                <p className="mt-2 border-t border-slate-100 pt-2 text-[10px] leading-snug text-slate-500">
                                  <span className="font-semibold text-slate-600">Product: </span>
                                  {r.product}
                                </p>
                              )}
                            </div>
                          </article>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className="flex w-full flex-col gap-4 2xl:col-span-10">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {KPI_CARDS.map((kpi) => (
            <div
              key={kpi.label}
              className={`${CARD_BASE} relative overflow-hidden rounded-2xl`}
              style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
            >
              <div className="absolute left-0 top-0 h-1 w-full" style={{ backgroundColor: kpi.tone === "danger" ? COLORS.red : COLORS.dellBlue }} />
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>
                {kpi.label}
              </p>
              <p
                className={`mt-2 text-2xl font-semibold leading-tight ${kpi.value.length > 24 ? "text-xl" : ""} lg:text-[1.75rem]`}
                style={{ color: kpi.tone === "danger" ? COLORS.red : COLORS.navy }}
              >
                {kpi.value}
              </p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:items-stretch">
          <div className={`${PANEL_BASE} flex min-h-0 flex-col rounded-2xl xl:col-span-7 xl:h-full`} style={{ borderColor: COLORS.border }}>
            <div className={PANEL_HEADER}>
              <h2 className="text-base font-semibold">Pain Points by Review Volume</h2>
              <span className="rounded-md bg-slate-50 px-2 py-1 text-xs" style={{ color: COLORS.textMuted }}>
                Bars colored by avg severity
              </span>
            </div>
            <div className="relative min-h-[500px] w-full flex-1 rounded-lg xl:min-h-[580px]" style={{ backgroundColor: "#f5f6f8" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={BAR_DATA}
                  layout="vertical"
                  margin={{ top: 12, right: 218, left: 4, bottom: 12 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e6ed" vertical />
                  <XAxis type="number" domain={[0, 40]} ticks={[0, 5, 10, 15, 20, 25, 30, 35, 40]} tick={{ fill: "#5B6475", fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="topic"
                    width={236}
                    tick={PainPointYAxisTick}
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value, key, item) =>
                      key === "count"
                        ? [`${value} (${item?.payload?.share?.toFixed?.(1) ?? "0.0"}%) · avg severity ${item?.payload?.severity?.toFixed?.(1)}`, "Volume"]
                        : [value, key]
                    }
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} isAnimationActive={false} stroke="none">
                    {BAR_DATA.map((entry) => (
                      <Cell key={entry.topic} fill={entry.barFill} />
                    ))}
                    <LabelList content={PainPointBarLabel} position="right" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div
                className="pointer-events-none absolute bottom-2 right-2 rounded border bg-white/95 px-2.5 py-2 text-[10px] shadow-sm"
                style={{ borderColor: COLORS.border, color: "#1c1e33" }}
              >
                <div className="mb-1 font-semibold uppercase tracking-wide" style={{ color: COLORS.textMuted }}>
                  Avg severity
                </div>
                <div className="flex items-center gap-1.5 py-0.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: SEVERITY_BAR.critical.color }} />
                  Critical (≥ 7.0)
                </div>
                <div className="flex items-center gap-1.5 py-0.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: SEVERITY_BAR.high.color }} />
                  High (5.0 – 6.9)
                </div>
                <div className="flex items-center gap-1.5 py-0.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: SEVERITY_BAR.moderate.color }} />
                  Moderate (&lt; 5.0)
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-col gap-3 xl:col-span-5 xl:h-full">
            <div className={`${PANEL_BASE} flex min-h-0 flex-1 flex-col`} style={{ borderColor: COLORS.border }}>
              <div className={PANEL_HEADER}>
                <h2 className="text-base font-semibold">Topic Priority Matrix</h2>
                <span className="rounded-md bg-slate-50 px-2 py-1 text-xs" style={{ color: COLORS.textMuted }}>Frequency vs Severity</span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-1">
                <div className="flex flex-shrink-0 items-start justify-between gap-3 px-0.5 text-[10px] font-semibold uppercase leading-snug tracking-wide">
                  <span className="max-w-[48%] shrink-0 text-slate-500">HIDDEN RISK</span>
                  <span className="max-w-[48%] shrink-0 text-right text-red-600">ACT NOW</span>
                </div>
                <div className="min-h-[140px] w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 8, right: 12, left: 12, bottom: 28 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#DFE5ED" />
                      <XAxis type="number" dataKey="count" name="Review Count" domain={[0, 26]} tick={{ fill: COLORS.textMuted, fontSize: 10 }} />
                      <YAxis type="number" dataKey="severity" name="Severity" domain={[0, 10]} tick={{ fill: COLORS.textMuted, fontSize: 10 }} />
                      <ZAxis type="number" dataKey="severity" range={[120, 950]} />
                      <Tooltip cursor={{ strokeDasharray: "4 4" }} content={MatrixTooltip} />
                      <ReferenceLine x={medianCount} stroke={COLORS.navy} strokeDasharray="6 6" />
                      <ReferenceLine y={medianSeverity} stroke={COLORS.navy} strokeDasharray="6 6" />
                      <Scatter data={TOPIC_DATA} fill={COLORS.dellBlue}>
                        {TOPIC_DATA.map((entry) => (
                          <Cell key={entry.topic} fill={entry.severity >= 6.5 ? COLORS.red : entry.severity >= 5 ? COLORS.orange : COLORS.yellow} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-shrink-0 items-start justify-between gap-3 px-0.5 text-[10px] font-semibold uppercase leading-snug tracking-wide">
                  <span className="max-w-[48%] shrink-0 text-slate-500">LOW PRIORITY</span>
                  <span className="max-w-[48%] shrink-0 text-right text-orange-600">MONITOR</span>
                </div>
              </div>
            </div>

            <div className={`${PANEL_BASE} flex min-h-0 flex-1 flex-col`} style={{ borderColor: COLORS.border }}>
              <div className={PANEL_HEADER}>
                <h2 className="text-base font-semibold">How Frustrated Are Customers?</h2>
                <span className="rounded-md bg-slate-50 px-2 py-1 text-xs" style={{ color: COLORS.textMuted }}>Severity Distribution</span>
              </div>
              <div className="min-h-[140px] w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={HISTOGRAM_DATA} margin={{ top: 20, right: 20, left: 5, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" />
                    <XAxis type="number" dataKey="score" domain={[0, 10]} tick={{ fill: COLORS.textMuted }} />
                    <YAxis tick={{ fill: COLORS.textMuted }} />
                    <Tooltip formatter={(value, key) => [value, key === "count" ? "Reviews" : key]} labelFormatter={(label) => `Severity Score: ${label}`} />
                    <ReferenceLine x={5} stroke={COLORS.red} strokeDasharray="6 6" label={{ value: "Median: 5.0", fill: COLORS.red, position: "insideTopRight" }} />
                    <ReferenceLine x={5.7} stroke={COLORS.orange} strokeDasharray="2 4" label={{ value: "Mean: 5.7", fill: COLORS.orange, position: "insideTopLeft" }} />
                    <Bar dataKey="count" fill={COLORS.dellBlue} barSize={48} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-shrink-0 flex-wrap gap-3 text-xs" style={{ color: COLORS.textMuted }}>
                {HISTOGRAM_DATA.map((d) => (
                  <span key={d.bucket}>
                    {d.bucket}: {d.count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className={`${PANEL_BASE} rounded-2xl xl:col-span-12`} style={{ borderColor: COLORS.border }}>
            <div className={PANEL_HEADER}>
              <h2 className="text-base font-semibold">Monthly Negative Review Trend</h2>
              <span className="rounded-md bg-slate-50 px-2 py-1 text-xs" style={{ color: COLORS.textMuted }}>Jul 2021 - Jul 2023</span>
            </div>
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MONTHLY_TREND} margin={{ top: 10, right: 20, left: 0, bottom: 15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" />
                  <XAxis dataKey="month" tick={{ fill: COLORS.textMuted, fontSize: 11 }} interval={2} />
                  <YAxis tick={{ fill: COLORS.textMuted }} domain={[0, 12]} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="total" name="Total Negatives" stroke={COLORS.dellBlue} fill={COLORS.dellBlue} fillOpacity={0.18} strokeWidth={2.5} />
                  <Line type="monotone" dataKey="overheating" name="Overheating" stroke={COLORS.red} strokeDasharray="6 4" dot={false} />
                  <Line type="monotone" dataKey="crashes" name="Crashes" stroke={COLORS.orange} strokeDasharray="6 4" dot={false} />
                  <Line type="monotone" dataKey="slow" name="Slow Performance" stroke={COLORS.yellow} strokeDasharray="6 4" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className={`${PANEL_BASE} rounded-2xl`} style={{ borderColor: COLORS.border }}>
          <div className={PANEL_HEADER}>
            <h2 className="text-base font-semibold">Topic Deep Dive</h2>
            <span className="rounded-md bg-slate-50 px-2 py-1 text-xs" style={{ color: COLORS.textMuted }}>Sortable by all columns</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide" style={{ borderColor: COLORS.border, color: COLORS.textMuted }}>
                  <th className="cursor-pointer px-3 py-2" onClick={() => onSort("topic")}>Topic {sortArrow("topic")}</th>
                  <th className="cursor-pointer px-3 py-2" onClick={() => onSort("count")}>Reviews {sortArrow("count")}</th>
                  <th className="cursor-pointer px-3 py-2" onClick={() => onSort("share")}>% Share {sortArrow("share")}</th>
                  <th className="cursor-pointer px-3 py-2" onClick={() => onSort("severity")}>Avg Severity {sortArrow("severity")}</th>
                  <th className="cursor-pointer px-3 py-2" onClick={() => onSort("priority")}>Priority {sortArrow("priority")}</th>
                  <th className="cursor-pointer px-3 py-2" onClick={() => onSort("keywords")}>Sample Keywords {sortArrow("keywords")}</th>
                </tr>
              </thead>
              <tbody>
                {sortedTableData.map((row) => (
                  <tr key={row.topic} className="border-b transition-colors hover:bg-slate-50 last:border-0" style={{ borderColor: COLORS.border }}>
                    <td className="px-3 py-2 font-medium">{row.topic}</td>
                    <td className="px-3 py-2">{row.count}</td>
                    <td className="px-3 py-2">{row.share}%</td>
                    <td className="px-3 py-2">{row.severity.toFixed(1)}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${PRIORITY_BADGE[row.priority]}`}>{row.priority}</span>
                    </td>
                    <td className="px-3 py-2" style={{ color: COLORS.textMuted }}>{row.keywords}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        </div>
      </main>

      <div className="pointer-events-none fixed bottom-3 right-4 text-xs font-semibold uppercase tracking-wide opacity-60" style={{ color: COLORS.navy }}>
        Dell Technologies
      </div>
    </div>
  );
}
