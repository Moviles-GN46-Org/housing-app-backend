import { useState } from "react";
import SessionCard from "./components/SessionCard";
import CrashRateCard from "./components/CrashRateCard";
import FeatureUsageCard from "./components/FeatureUsageCard";
import ZonesCard from "./components/ZonesCard";
import { LayoutDashboard, Calendar, RefreshCw } from "lucide-react";

export default function App() {
  const [lastUpdated] = useState("Mar 26, 2025 · 9:41 AM");
  const [zonesRefreshToken, setZonesRefreshToken] = useState(0);

  return (
    <div className="min-h-screen bg-linen font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white_card border-b border-[#E8DDD4] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-bronze flex items-center justify-center shadow-sm">
              <LayoutDashboard
                size={18}
                className="text-white"
                strokeWidth={2}
              />
            </div>
            <div>
              <h1 className="text-mocha font-semibold text-lg leading-tight tracking-tight">
                CasAndes Analytics
              </h1>
              <p className="text-taupe text-xs">Analytics Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* <div className="hidden sm:flex items-center gap-1.5 text-taupe text-xs bg-linen rounded-full px-3 py-1.5 border border-[#E8DDD4]">
              <Calendar size={12} />
              <span>{lastUpdated}</span>
            </div> */}
            <button
              onClick={() => setZonesRefreshToken((v) => v + 1)}
              className="flex items-center gap-1.5 bg-bronze text-white text-xs font-medium px-3.5 py-1.5 rounded-full hover:bg-[#C8874A] transition-colors"
            >
              <RefreshCw size={12} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Summary strip */}
      {/* <div className="bg-white_card border-b border-[#E8DDD4]">
        <div className="max-w-7xl mx-auto px-6 py-3 flex gap-6 overflow-x-auto">
          {[
            { label: "Avg. Session", value: "4m 32s", delta: "+12%" },
            {
              label: "Crash Rate",
              value: "2.4%",
              delta: "-0.3%",
              negative: false,
            },
            { label: "Active Users", value: "1,284", delta: "+8%" },
            { label: "Top Zone", value: "Chapinero", delta: null },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 shrink-0">
              <div>
                <p className="text-taupe text-xs">{stat.label}</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-mocha font-semibold text-sm">
                    {stat.value}
                  </span>
                  {stat.delta && (
                    <span
                      className={`text-xs font-medium ${stat.delta.startsWith("+") ? "text-emerald-600" : "text-rose-500"}`}
                    >
                      {stat.delta}
                    </span>
                  )}
                </div>
              </div>
              <div className="h-8 w-px bg-[#E8DDD4] last:hidden" />
            </div>
          ))}
        </div>
      </div> */}

      {/* Dashboard Grid */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-animate" style={{ animationDelay: "0ms" }}>
            <CrashRateCard />
          </div>
          <div className="card-animate" style={{ animationDelay: "80ms" }}>
            <ZonesCard refreshToken={zonesRefreshToken} />
          </div>
          <div className="card-animate" style={{ animationDelay: "160ms" }}>
            <SessionCard />
          </div>
          <div className="card-animate" style={{ animationDelay: "240ms" }}>
            <FeatureUsageCard />
          </div>
        </div>
      </main>
    </div>
  );
}
