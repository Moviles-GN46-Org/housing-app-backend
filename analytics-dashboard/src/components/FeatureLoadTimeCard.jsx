import { useState, useMemo, useEffect } from "react";
import {
  Gauge,
  Timer,
  ArrowDownWideNarrow,
  ArrowUpAZ,
  Flame,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

// "842 ms" for small values, "1.24 s" once we're past a second.
function formatMs(ms) {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export default function FeatureLoadTimeCard() {
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBar, setSelectedBar] = useState(null);
  // Default view answers the business question directly: the 3 most-used
  // features' load times. Other modes stay available for comparison.
  const [sortMode, setSortMode] = useState("top3");

  useEffect(() => {
    let cancelled = false;
    async function fetchLoadTimes() {
      try {
        const res = await fetch(
          `${API_BASE}/api/analytics/feature-load-times`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        if (!cancelled && body.success && body.data.screens.length > 0) {
          setScreens(body.data.screens);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchLoadTimes();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalSamples = useMemo(
    () => screens.reduce((a, b) => a + b.samples, 0),
    [screens],
  );

  const slowestScreen = useMemo(
    () =>
      screens.length > 0
        ? screens.reduce(
            (max, s) => (s.avgMs > max.avgMs ? s : max),
            screens[0],
          )
        : null,
    [screens],
  );

  const sortedScreens = useMemo(() => {
    const copy = [...screens];
    switch (sortMode) {
      case "top3":
        // Sort by sample count (most used) and take the top 3 — the exact
        // answer to "how long do the 3 most used features take to load?"
        return copy.sort((a, b) => b.samples - a.samples).slice(0, 3);
      case "slowest":
        return copy.sort((a, b) => b.avgMs - a.avgMs);
      case "alpha":
        return copy.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return copy;
    }
  }, [sortMode, screens]);

  const handleBarClick = (_data, index) => {
    setSelectedBar((prev) => (prev === index ? null : index));
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const row = payload[0].payload;
      return (
        <div className="bg-white_card border border-[#E8DDD4] rounded-xl px-3 py-2 shadow-md text-xs">
          <p className="text-mocha font-semibold">{label}</p>
          <p className="text-taupe">
            avg {formatMs(row.avgMs)} &middot; median {formatMs(row.medianMs)}
          </p>
          <p className="text-taupe">
            p95 {formatMs(row.p95Ms)} &middot; {row.samples} samples
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white_card rounded-2xl border border-[#E8DDD4] shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFF3ED] flex items-center justify-center">
              <Gauge size={16} className="text-orange-400" strokeWidth={2} />
            </div>
            <div>
              <p className="text-taupe text-xs font-medium uppercase tracking-wider">
                Feature Load Time
              </p>
              <h2 className="text-mocha font-semibold text-sm">
                How long do the top 3 features take to load?
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-orange-50 text-orange-500 text-xs font-semibold px-2.5 py-1 rounded-full">
            {loading ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <Timer size={11} />
            )}
            {totalSamples} samples
          </div>
        </div>

        {slowestScreen && (
          <div className="mt-3 flex items-center gap-2 bg-[#FFF8F3] border border-[#F2D9C0] rounded-lg px-3 py-1.5">
            <Flame size={12} className="text-orange-400 shrink-0" />
            <span className="text-xs text-ash truncate">
              <span className="font-semibold text-mocha">
                Slowest to load:
              </span>{" "}
              {slowestScreen.name} &mdash; avg {formatMs(slowestScreen.avgMs)}{" "}
              (p95 {formatMs(slowestScreen.p95Ms)})
            </span>
          </div>
        )}

        {error && (
          <p className="mt-2 text-xs text-rose-400">Live data unavailable</p>
        )}

        <div className="flex items-center gap-1 mt-3">
          {[
            { key: "top3", label: "Top 3 used", icon: ArrowDownWideNarrow },
            { key: "slowest", label: "Slowest", icon: Flame },
            { key: "alpha", label: "A–Z", icon: ArrowUpAZ },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                setSortMode(key);
                setSelectedBar(null);
              }}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all duration-200 ${
                sortMode === key
                  ? "bg-bronze text-white border-bronze"
                  : "bg-white_card text-taupe border-[#E8DDD4] hover:border-bronze hover:text-ash"
              }`}
            >
              <Icon size={11} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-56 px-2 pb-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedScreens}
            margin={{ top: 4, right: 12, left: -24, bottom: 0 }}
            barSize={18}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E8DDD4"
              strokeOpacity={0.6}
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#8B7364" }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#8B7364" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}s` : `${v}ms`)}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "#FBF3EB", radius: 4 }}
            />
            <Bar
              dataKey="avgMs"
              radius={[6, 6, 0, 0]}
              onClick={handleBarClick}
              cursor="pointer"
              animationDuration={400}
              animationEasing="ease-in-out"
              activeBar={{
                fill: "#DA9958",
                fillOpacity: 0.85,
                stroke: "#C8874A",
                strokeWidth: 1,
              }}
            >
              {sortedScreens.map((entry, index) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={
                    selectedBar === index
                      ? "#DA9958"
                      : index === 0 && sortMode === "slowest"
                        ? "#DA9958"
                        : "#E8DDD4"
                  }
                  fillOpacity={
                    selectedBar !== null && selectedBar !== index ? 0.4 : 1
                  }
                  stroke={selectedBar === index ? "#C8874A" : "none"}
                  strokeWidth={selectedBar === index ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {selectedBar !== null && sortedScreens[selectedBar] && (
        <div className="mx-4 mb-4 flex items-center gap-3 bg-[#FBF3EB] border border-[#E8DDD4] rounded-lg px-3 py-2 text-xs">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: "#DA9958" }}
          />
          <div className="flex-1">
            <span className="text-mocha font-semibold">
              {sortedScreens[selectedBar].name}
            </span>
            <span className="text-taupe ml-2">
              avg {formatMs(sortedScreens[selectedBar].avgMs)} &middot; median{" "}
              {formatMs(sortedScreens[selectedBar].medianMs)} &middot; p95{" "}
              {formatMs(sortedScreens[selectedBar].p95Ms)} &middot;{" "}
              {sortedScreens[selectedBar].samples} samples
            </span>
          </div>
          <button
            onClick={() => setSelectedBar(null)}
            className="text-taupe hover:text-mocha transition-colors"
          >
            &#10005;
          </button>
        </div>
      )}
    </div>
  );
}
