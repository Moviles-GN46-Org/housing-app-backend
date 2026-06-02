import { useEffect, useState } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import analyticsService from "../services/analyticsService";

const BAR_COLOR = "#DA9958";
const BAR_COLOR_PEAK = "#C8874A";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-white_card border border-[#E8DDD4] rounded-xl px-3 py-2 shadow-md text-xs">
        <p className="text-mocha font-semibold">{d.monthLabel}</p>
        <p className="text-taupe">{d.searches.toLocaleString()} searches</p>
      </div>
    );
  }
  return null;
};

export default function SearchByMonthCard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const body = await analyticsService.getSearchesByMonth();
        if (cancelled) return;
        setData(body.data || []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const maxSearches =
    data.length > 0 ? Math.max(...data.map((d) => d.searches)) : 0;

  return (
    <div className="bg-white_card rounded-2xl border border-[#E8DDD4] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F5ECE3] flex items-center justify-center">
              <CalendarDays size={15} className="text-bronze" />
            </div>
            <div>
              <h3 className="text-mocha font-semibold text-sm leading-tight">
                Search Concentration by Month
              </h3>
              <p className="text-taupe text-xs mt-0.5">
                All-time housing searches grouped by month
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 pb-6">
        {loading && (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={22} className="animate-spin text-bronze" />
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center justify-center h-48">
            <p className="text-rose-500 text-xs">{error}</p>
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <div className="flex items-center justify-center h-48">
            <p className="text-taupe text-xs">No search data available yet.</p>
          </div>
        )}

        {!loading && !error && data.length > 0 && (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data}
              margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
            >
              <XAxis
                dataKey="monthLabel"
                tick={{ fontSize: 11, fill: "#9C8878" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9C8878" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "#F5ECE3" }}
              />
              <Bar dataKey="searches" radius={[5, 5, 0, 0]} maxBarSize={40}>
                {data.map((entry) => (
                  <Cell
                    key={entry.month}
                    fill={
                      entry.searches === maxSearches
                        ? BAR_COLOR_PEAK
                        : BAR_COLOR
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Peak month callout */}
        {!loading && !error && data.length > 0 && (
          <div className="mt-3 flex items-center gap-2 bg-[#F5ECE3] rounded-xl px-4 py-2.5">
            <span className="text-xs text-mocha font-semibold">
              Peak month:
            </span>
            <span className="text-xs text-taupe">
              {data.find((d) => d.searches === maxSearches)?.monthLabel} —{" "}
              {maxSearches.toLocaleString()} searches
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
