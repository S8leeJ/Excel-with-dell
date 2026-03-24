import React, { useMemo, useState } from "react";
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

const BAR_DATA = [...TOPIC_DATA].sort((a, b) => b.count - a.count).map((d) => ({
  ...d,
  share: (d.count / NEGATIVE_TOTAL) * 100,
  label: `${d.count} (${((d.count / NEGATIVE_TOTAL) * 100).toFixed(1)}%)`,
}));

const PRIORITY_BADGE = {
  CRITICAL: "bg-red-100 text-red-700",
  HIGH: "bg-orange-100 text-orange-700",
  MODERATE: "bg-yellow-100 text-yellow-700",
};

const CARD_BASE = "rounded-xl border p-4 shadow-sm";
const PANEL_BASE = "rounded-xl border bg-white p-4 shadow-sm";
const PANEL_HEADER = "mb-3 flex items-start justify-between gap-3";

function getBarColor(index) {
  if (index < 3) return COLORS.red;
  if (index < 6) return COLORS.orange;
  return COLORS.yellow;
}

export default function FusionTechDashboard() {
  const [sortConfig, setSortConfig] = useState({ key: "count", direction: "desc" });

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
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

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
            <span className="rounded-full bg-white/10 px-3 py-1 text-slate-100">Last updated: July 2023</span>
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

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className={`${PANEL_BASE} rounded-2xl xl:col-span-8`} style={{ borderColor: COLORS.border }}>
            <div className={PANEL_HEADER}>
              <h2 className="text-base font-semibold">Topic Priority Matrix</h2>
              <span className="rounded-md bg-slate-50 px-2 py-1 text-xs" style={{ color: COLORS.textMuted }}>Frequency vs Severity</span>
            </div>
            <div className="relative h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, left: 10, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DFE5ED" />
                  <XAxis type="number" dataKey="count" name="Review Count" domain={[0, 26]} tick={{ fill: COLORS.textMuted }} />
                  <YAxis type="number" dataKey="severity" name="Severity" domain={[0, 10]} tick={{ fill: COLORS.textMuted }} />
                  <ZAxis type="number" dataKey="severity" range={[120, 950]} />
                  <Tooltip cursor={{ strokeDasharray: "4 4" }} formatter={(value, key) => [value, key === "count" ? "Reviews" : "Severity"]} />
                  <ReferenceLine x={medianCount} stroke={COLORS.navy} strokeDasharray="6 6" />
                  <ReferenceLine y={medianSeverity} stroke={COLORS.navy} strokeDasharray="6 6" />
                  <Scatter data={TOPIC_DATA} fill={COLORS.dellBlue}>
                    {TOPIC_DATA.map((entry) => (
                      <Cell key={entry.topic} fill={entry.severity >= 6.5 ? COLORS.red : entry.severity >= 5 ? COLORS.orange : COLORS.yellow} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 text-xs font-semibold">
                <span className="absolute left-4 top-2 text-slate-500">HIDDEN RISK</span>
                <span className="absolute right-4 top-2 text-red-600">ACT NOW</span>
                <span className="absolute bottom-2 left-4 text-slate-500">LOW PRIORITY</span>
                <span className="absolute bottom-2 right-4 text-orange-600">MONITOR</span>
              </div>
            </div>
          </div>

          <div className={`${PANEL_BASE} rounded-2xl xl:col-span-4`} style={{ borderColor: COLORS.border }}>
            <div className={PANEL_HEADER}>
              <h2 className="text-base font-semibold">Pain Points by Review Volume</h2>
              <span className="rounded-md bg-slate-50 px-2 py-1 text-xs" style={{ color: COLORS.textMuted }}>Top 10 Topics</span>
            </div>
            <div className="h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={BAR_DATA} layout="vertical" margin={{ top: 10, right: 35, left: 5, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" />
                  <XAxis type="number" tick={{ fill: COLORS.textMuted }} />
                  <YAxis type="category" dataKey="topic" width={150} tick={{ fill: COLORS.textMuted, fontSize: 11 }} />
                  <Tooltip
                    formatter={(value, key, item) =>
                      key === "count"
                        ? [`${value} (${item?.payload?.share?.toFixed?.(1) ?? "0.0"}%)`, "Volume"]
                        : [value, key]
                    }
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {BAR_DATA.map((entry, index) => (
                      <Cell key={entry.topic} fill={getBarColor(index)} />
                    ))}
                    <LabelList dataKey="label" position="right" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className={`${PANEL_BASE} rounded-2xl xl:col-span-5`} style={{ borderColor: COLORS.border }}>
            <div className={PANEL_HEADER}>
              <h2 className="text-base font-semibold">How Frustrated Are Customers?</h2>
              <span className="rounded-md bg-slate-50 px-2 py-1 text-xs" style={{ color: COLORS.textMuted }}>Severity Distribution</span>
            </div>
            <div className="h-[340px] w-full">
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
            <div className="mt-2 flex flex-wrap gap-3 text-xs" style={{ color: COLORS.textMuted }}>
              {HISTOGRAM_DATA.map((d) => (
                <span key={d.bucket}>
                  {d.bucket}: {d.count}
                </span>
              ))}
            </div>
          </div>

          <div className={`${PANEL_BASE} rounded-2xl xl:col-span-7`} style={{ borderColor: COLORS.border }}>
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
