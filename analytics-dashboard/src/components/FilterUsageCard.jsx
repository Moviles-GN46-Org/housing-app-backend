import { useEffect, useState, useMemo } from "react";
import { SlidersHorizontal, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import analyticsService from "../services/analyticsService";

// One stable color per category slot (index-based so new categories still get a color)
const PALETTE = [
  "#DA9958",
  "#5B8DB8",
  "#7C6EA0",
  "#5BAB7A",
  "#E07B7B",
  "#C8874A",
];

function categoryColor(index) {
  return PALETTE[index % PALETTE.length];
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-white_card border border-[#E8DDD4] rounded-xl px-3 py-2 shadow-md text-xs">
        <p className="text-mocha font-semibold">{d.name}</p>
        <p className="text-taupe">
          {d.count.toLocaleString()} uses &middot; {d.pct}%
        </p>
      </div>
    );
  }
  return null;
};

export default function FilterUsageCard() {
  const [byCategory, setByCategory] = useState([]);
  const [totalUsages, setTotalUsages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // null = "All" tab (shows category totals), string = specific category name
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const from = new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString();
        const to = new Date().toISOString();
        const body = await analyticsService.getTopFilters({ from, to });
        if (cancelled) return;
        setByCategory(body.data?.byCategory || []);
        setTotalUsages(body.data?.totalUsages || 0);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load filter data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Color map: category name → color (stable across renders)
  const colorMap = useMemo(
    () =>
      Object.fromEntries(
        byCategory.map((c, i) => [c.category, categoryColor(i)]),
      ),
    [byCategory],
  );

  // Chart data for the selected view
  const chartData = useMemo(() => {
    if (activeCategory === null) {
      // "All" view: one bar per category
      return byCategory.map((c) => ({
        name: c.category,
        count: c.total,
        pct: c.pct,
        color: colorMap[c.category],
      }));
    }
    const cat = byCategory.find((c) => c.category === activeCategory);
    if (!cat) return [];
    return cat.values.map((v) => ({
      name: v.value,
      count: v.count,
      pct: v.pct,
      color: colorMap[activeCategory],
    }));
  }, [activeCategory, byCategory, colorMap]);

  const chartTitle =
    activeCategory === null
      ? "Usage by filter category"
      : `${activeCategory} - breakdown by value`;

  const barHeight = Math.max(chartData.length * 44, 120);

  return (
    <div className="bg-white_card rounded-2xl border border-[#E8DDD4] shadow-sm overflow-hidden">
      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FBF3EB] flex items-center justify-center">
              <SlidersHorizontal
                size={16}
                className="text-bronze"
                strokeWidth={2}
              />
            </div>
            <div>
              <p className="text-taupe text-xs font-medium uppercase tracking-wider">
                Filter Preferences
              </p>
              <h2 className="text-mocha font-semibold text-sm">
                Which filters are most used when looking for housing?
              </h2>
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-2 text-xs text-rose-400">Live data unavailable</p>
        )}

        {/* ── Category tabs ── */}
        {!loading && byCategory.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveCategory(null)}
              className={`text-xs px-3 py-1 rounded-full border transition-all duration-150 ${
                activeCategory === null
                  ? "bg-mocha text-white border-mocha"
                  : "bg-white_card text-taupe border-[#E8DDD4] hover:border-mocha hover:text-ash"
              }`}
            >
              All categories
            </button>
            {byCategory.map((cat) => (
              <button
                key={cat.category}
                onClick={() => setActiveCategory(cat.category)}
                className="text-xs px-3 py-1 rounded-full border transition-all duration-150"
                style={
                  activeCategory === cat.category
                    ? {
                        backgroundColor: colorMap[cat.category],
                        color: "#fff",
                        borderColor: colorMap[cat.category],
                      }
                    : {
                        backgroundColor: "transparent",
                        color: "#8B7364",
                        borderColor: "#E8DDD4",
                      }
                }
              >
                <span className="capitalize">{cat.category}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Chart ── */}
      <div className="px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-40 gap-2 text-taupe text-sm">
            <Loader2 size={18} className="animate-spin text-bronze" />
            Loading filter data…
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-taupe text-sm">
            No filter usage data yet.
          </div>
        ) : (
          <>
            <p className="text-taupe text-xs mb-3 capitalize">{chartTitle}</p>
            <div style={{ height: barHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 0, right: 64, bottom: 0, left: 8 }}
                  barCategoryGap="30%"
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 12, fill: "#58463A" }}
                    width={110}
                    tickFormatter={(v) => String(v ?? "").replace(/_/g, " ")}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "#FBF3EB" }}
                  />
                  <Bar dataKey="count" radius={[0, 5, 5, 0]} barSize={20}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <LabelList
                      dataKey="count"
                      position="right"
                      style={{ fontSize: 11, fill: "#8B7364", fontWeight: 600 }}
                      formatter={(v) => Number(v || 0).toLocaleString()}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ── Category share pills (moved below chart) ── */}
            {!loading && byCategory.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {byCategory.map((cat) => (
                  <div
                    key={cat.category}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border"
                    style={{
                      backgroundColor: colorMap[cat.category] + "18",
                      borderColor: colorMap[cat.category] + "50",
                      color: colorMap[cat.category],
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: colorMap[cat.category] }}
                    />
                    <span className="font-medium capitalize">
                      {cat.category}
                    </span>
                    <span className="opacity-70">{cat.pct}%</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
