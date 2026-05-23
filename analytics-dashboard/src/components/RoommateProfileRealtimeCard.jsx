import { useEffect, useMemo, useState } from "react";
import { Users, Radio, Loader2, AlertCircle } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import analyticsService from "../services/analyticsService";

const REFRESH_MS = 10000;
const BAR_PALETTE = ["#DA9958", "#C8874A", "#E8B07A", "#B87640", "#F2CFA0"];

function formatPct(pct) {
  return `${Number(pct || 0).toFixed(1)}%`;
}

function MetricList({ title, items, emptyText }) {
  if (!items || items.length === 0) {
    return <p className="text-xs text-taupe">{emptyText}</p>;
  }

  return (
    <div>
      <p className="text-taupe text-xs uppercase tracking-wider mb-2">{title}</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <span className="text-xs text-ash flex-1 truncate">{item.name}</span>
            <span className="text-xs text-taupe font-medium">{item.count}</span>
            <span className="text-xs text-taupe w-12 text-right">{formatPct(item.pct)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RoommateProfileRealtimeCard({ refreshToken = 0 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSyncAt, setLastSyncAt] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const body = await analyticsService.getRoommateProfileCharacteristics({ top: 5 });
        if (cancelled) return;
        setData(body?.data || null);
        setError(null);
        setLastSyncAt(new Date());
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || "Failed to load roommate profile metrics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const intervalId = setInterval(load, REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [refreshToken]);

  const totalProfiles = Number(data?.totalProfiles || 0);
  const metrics = data?.metrics || {};

  const habitsData = useMemo(() => {
    const smokes = metrics.smokes || [];
    const hasPets = metrics.hasPets || [];
    return [
      {
        name: "Smokes",
        count: Number(smokes.find((r) => r.name === "Smokes")?.count || 0),
      },
      {
        name: "Has pets",
        count: Number(hasPets.find((r) => r.name === "Has pets")?.count || 0),
      },
    ];
  }, [metrics.smokes, metrics.hasPets]);

  const preferredAreaItems = metrics.preferredArea?.items || [];
  const budgetRanges = metrics.budgetRanges || [];
  const noisePreference = metrics.noisePreference || [];
  const jobItems = metrics.job?.items || [];
  const universityItems = metrics.university?.items || [];

  return (
    <div className="bg-white_card rounded-2xl border border-[#E8DDD4] shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FBF3EB] flex items-center justify-center">
              <Users size={16} className="text-bronze" strokeWidth={2} />
            </div>
            <div>
              <p className="text-taupe text-xs font-medium uppercase tracking-wider">
                Roomie Profile Trends
              </p>
              <h2 className="text-mocha font-semibold text-sm">
                Common roommate characteristics (live)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 text-xs font-semibold px-2.5 py-1 rounded-full">
            {loading ? <Loader2 size={11} className="animate-spin" /> : <Radio size={11} />}
            {totalProfiles} active
          </div>
        </div>

        <div className="mt-3 text-xs text-taupe">
          {lastSyncAt ? `Updated ${lastSyncAt.toLocaleTimeString()}` : "Waiting for first update..."}
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-xs text-rose-500 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-[#FBF3EB] rounded-xl border border-[#E8DDD4] p-4">
            <p className="text-taupe text-xs uppercase tracking-wider mb-3">Noise Preference</p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={noisePreference} margin={{ top: 8, right: 6, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DDD4" strokeOpacity={0.6} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8B7364" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#8B7364" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "#F6EDE4" }}
                    formatter={(value) => [`${value} profiles`, "Count"]}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {noisePreference.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={BAR_PALETTE[index % BAR_PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#FBF3EB] rounded-xl border border-[#E8DDD4] p-4">
            <p className="text-taupe text-xs uppercase tracking-wider mb-3">Budget Ranges</p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetRanges} margin={{ top: 8, right: 6, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DDD4" strokeOpacity={0.6} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#8B7364" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#8B7364" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "#F6EDE4" }}
                    formatter={(value) => [`${value} profiles`, "Count"]}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {budgetRanges.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={BAR_PALETTE[index % BAR_PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#FBF3EB] rounded-xl border border-[#E8DDD4] p-4">
            <p className="text-taupe text-xs uppercase tracking-wider mb-3">Top Preferred Areas</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={preferredAreaItems}
                  layout="vertical"
                  margin={{ top: 4, right: 12, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DDD4" strokeOpacity={0.6} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={120}
                    tick={{ fontSize: 10, fill: "#8B7364" }}
                  />
                  <Tooltip
                    cursor={{ fill: "#F6EDE4" }}
                    formatter={(value) => [`${value} profiles`, "Count"]}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {preferredAreaItems.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={BAR_PALETTE[index % BAR_PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#FBF3EB] rounded-xl border border-[#E8DDD4] p-4 space-y-4">
            <MetricList
              title="Habits"
              items={habitsData.map((item) => ({
                ...item,
                pct: totalProfiles > 0 ? (item.count / totalProfiles) * 100 : 0,
              }))}
              emptyText="No habit data yet"
            />
            <MetricList
              title="Most Common Jobs"
              items={jobItems}
              emptyText="No job data yet"
            />
            <MetricList
              title="Most Common Universities"
              items={universityItems}
              emptyText="No university data yet"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
