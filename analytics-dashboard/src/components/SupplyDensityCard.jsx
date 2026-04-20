import { useEffect, useState } from "react";
import { LocateFixed, Activity, Loader2, AlertCircle } from "lucide-react";

const RAW_API_BASE = "http://localhost:3000";

const API_BASE = RAW_API_BASE.replace(/\/$/, "");
const API_PREFIX = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

export default function SupplyDensityCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_PREFIX}/analytics/supply-density`);
        if (!response.ok) throw new Error("Network error");
        const json = await response.json();
        setData(json.data);
      } catch (err) {
        console.error("Error loading density data:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white_card rounded-2xl border border-[#E8DDD4] p-12 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-bronze mb-2" size={24} />
        <p className="text-taupe text-xs">Loading Bryan's metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white_card rounded-2xl border border-[#E8DDD4] p-12 flex flex-col items-center justify-center text-center">
        <AlertCircle className="text-rose-400 mb-2" size={24} />
        <p className="text-mocha font-medium text-sm">Connection Error</p>
        <p className="text-taupe text-xs">
          Check that the backend is running at {API_BASE}
        </p>
      </div>
    );
  }

  const averageDensity = Number(data?.averageDensity || 0);
  const densityPct = (averageDensity * 100).toFixed(1);

  return (
    <div className="bg-white_card rounded-2xl border border-[#E8DDD4] shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FBF3EB] flex items-center justify-center">
              <LocateFixed size={16} className="text-bronze" strokeWidth={2} />
            </div>
            <div>
              <p className="text-taupe text-xs font-medium uppercase tracking-wider">
                Supply Density
              </p>
              <h2 className="text-mocha font-semibold text-sm">
                Are there enough properties nearby?
              </h2>
            </div>
          </div>
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
              data?.status === "High Supply"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-orange-50 text-orange-600"
            }`}
          >
            <Activity size={11} />
            {data?.status || "Calculating"}
          </div>
        </div>

        {/* Main Metric */}
        <div className="mt-6 bg-linen rounded-2xl p-6 border border-[#E8DDD4] flex items-center justify-between">
          <div>
            <p className="text-taupe text-xs mb-1 uppercase font-bold tracking-tighter">
              Global Average
            </p>
            <p className="text-mocha font-bold text-5xl tracking-tighter">
              {densityPct}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-mocha font-bold text-lg">
              {data?.totalChecks || 0}
            </p>
            <p className="text-taupe text-[10px] leading-tight">
              GPS Checks
              <br />
              performed today
            </p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-mocha font-medium text-xs mb-2">
            Availability Analysis
          </p>
          <div className="h-2 bg-[#F0E8E0] rounded-full overflow-hidden">
            <div
              className="h-full bg-bronze transition-all duration-1000"
              style={{ width: `${densityPct}%` }}
            ></div>
          </div>
          <p className="text-taupe text-[11px] mt-3 italic leading-snug">
            * This metric represents the percentage of total inventory
            properties found within a 5km radius by users.
          </p>
        </div>
      </div>

      {/* BQ Footer */}
      <div className="mt-auto bg-[#FBF3EB] px-6 py-3 border-t border-[#E8DDD4]">
        <p className="text-[10px] text-taupe font-bold uppercase tracking-widest text-center">
          Business Question implemented by Bryan
        </p>
      </div>
    </div>
  );
}
