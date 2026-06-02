import { useState } from "react";
import SessionCard from "./components/SessionCard";
import CrashRateCard from "./components/CrashRateCard";
import FeatureUsageCard from "./components/FeatureUsageCard";
import ZonesCard from "./components/ZonesCard";
import SupplyDensityCard from "./components/SupplyDensityCard";
import LocalidadChart from "./components/LocalidadChart";
import FeatureLoadTimeCard from "./components/FeatureLoadTimeCard";
import FilterUsageCard from "./components/FilterUsageCard";
import RoommateProfileRealtimeCard from "./components/RoommateProfileRealtimeCard";
import DeviceBrandChart from "./components/DeviceBrandChart"; 
import { LayoutDashboard, RefreshCw } from "lucide-react";

export default function App() {
  const [dashboardRefreshToken, setDashboardRefreshToken] = useState(0);

  return (
    <div className="min-h-screen bg-linen font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white_card border-b border-[#E8DDD4] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-bronze flex items-center justify-center shadow-sm">
              <LayoutDashboard size={18} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-mocha font-semibold text-lg leading-tight tracking-tight">
                CasAndes Analytics
              </h1>
              <p className="text-taupe text-xs">Analytics Dashboard</p>
            </div>
          </div>

          <button
            onClick={() => setDashboardRefreshToken((v) => v + 1)}
            className="flex items-center gap-1.5 bg-bronze text-white text-xs font-medium px-3.5 py-1.5 rounded-full hover:bg-[#C8874A] transition-colors"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </header>

      {/* Dashboard Grid */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-animate" style={{ animationDelay: "0ms" }}>
            <CrashRateCard />
          </div>
          <div className="card-animate" style={{ animationDelay: "80ms" }}>
            <ZonesCard refreshToken={dashboardRefreshToken} />
          </div>
          <div className="card-animate" style={{ animationDelay: "160ms" }}>
            <SessionCard />
          </div>
          <div className="card-animate" style={{ animationDelay: "240ms" }}>
            <SupplyDensityCard />
          </div>
          <div className="card-animate" style={{ animationDelay: "320ms" }}>
            <LocalidadChart refreshToken={dashboardRefreshToken} />
          </div>
          <div className="card-animate" style={{ animationDelay: "400ms" }}>
            <FilterUsageCard />
          </div>
          <div className="card-animate" style={{ animationDelay: "480ms" }}>
            <FeatureLoadTimeCard />
          </div>

          {/* ¡Y ESTA ES LA TARJETA QUE FALTABA EN EL GRID! */}
          <div className="card-animate" style={{ animationDelay: "520ms" }}>
            <DeviceBrandChart refreshToken={dashboardRefreshToken} />
          </div>

          <div className="card-animate lg:col-span-2" style={{ animationDelay: "560ms" }}>
            <RoommateProfileRealtimeCard refreshToken={dashboardRefreshToken} />
          </div>
        </div>
      </main>
    </div>
  );
}