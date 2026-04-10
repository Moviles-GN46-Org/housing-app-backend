import { useState, useEffect } from "react";
import { Clock, TrendingUp, Loader2 } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

function formatSeconds(totalSeconds) {
  if (totalSeconds == null) return "-";
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white_card border border-[#E8DDD4] rounded-xl px-3 py-2 shadow-md text-xs">
        <p className="text-taupe font-medium">{label}</p>
        <p className="text-mocha font-semibold">{payload[0].value} min</p>
      </div>
    );
  }
  return null;
};

export default function SessionCard() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchSessionStats() {
      try {
        const res = await fetch(
          `${API_BASE}/api/analytics/session-stats?days=7`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        if (cancelled) return;
        const { overall, daily } = body.data;
        setStats(overall);
        if (daily) {
          setChartData(
            daily.map((row) => ({ day: row.day, minutes: row.avgMinutes })),
          );
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchSessionStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const avgDisplay = loading ? "-" : formatSeconds(stats?.avgSeconds);
  const minDisplay = loading ? "-" : formatSeconds(stats?.minSeconds);
  const maxDisplay = loading ? "-" : formatSeconds(stats?.maxSeconds);
  const medianDisplay = loading ? "-" : formatSeconds(stats?.medianSeconds);

  return (
    <div className="bg-white_card rounded-2xl border border-[#E8DDD4] shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FBF3EB] flex items-center justify-center">
              <Clock size={16} className="text-bronze" strokeWidth={2} />
            </div>
            <div>
              <p className="text-taupe text-xs font-medium uppercase tracking-wider">
                Session Duration
              </p>
              <h2 className="text-mocha font-semibold text-sm">
                How long do users stay?
              </h2>
            </div>
          </div>
          {error && (
            <span className="text-rose-400 text-xs">Live data unavailable</span>
          )}
        </div>

        {/* Big stat */}
        <div className="mt-5 flex items-end gap-3">
          {loading ? (
            <Loader2 size={32} className="text-bronze animate-spin mb-1" />
          ) : (
            <span className="text-mocha text-5xl font-semibold tracking-tight">
              {avgDisplay}
            </span>
          )}
          <span className="text-taupe text-sm mb-2">
            minutes per session in average
          </span>
        </div>

        <div className="mt-3 flex gap-4">
          {[
            { label: "Shortest", value: minDisplay },
            { label: "Longest", value: maxDisplay },
            { label: "Median", value: medianDisplay },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-taupe text-xs">{s.label}</p>
              <p className="text-ash text-sm font-semibold">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      {/* <div className="h-36 px-2 pb-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 12, left: -24, bottom: 0 }}
          >
            <defs>
              <linearGradient id="sessionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#DA9958" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#DA9958" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "#8B7364" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#8B7364" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="minutes"
              stroke="#DA9958"
              strokeWidth={2}
              fill="url(#sessionGradient)"
              dot={false}
              activeDot={{
                r: 4,
                fill: "#DA9958",
                stroke: "#FEFBF9",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div> */}
    </div>
  );
}
