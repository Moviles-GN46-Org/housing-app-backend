import { Layers } from "lucide-react";

export default function FeatureUsageCard() {
  return (
    <div className="bg-white_card rounded-2xl border border-[#E8DDD4] shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-xl bg-[#FBF3EB] flex items-center justify-center">
            <Layers size={16} className="text-bronze" strokeWidth={2} />
          </div>
          <div>
            <p className="text-taupe text-xs font-medium uppercase tracking-wider">
              Feature Usage
            </p>
            <h2 className="text-mocha font-semibold text-sm">
              Which features get ignored?
            </h2>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <p className="text-taupe text-sm text-center">Coming soon</p>
        </div>
      </div>
    </div>
  );
}

/*
 * TODO: wire up to a real API endpoint before re-enabling.
 *
 * import { Layers, TrendingDown } from 'lucide-react'
 * import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts'
 *
 * const features = [
 *   { name: 'Search & Filter', usage: 94, sessions: 1208 },
 *   { name: 'Listing Detail',  usage: 87, sessions: 1118 },
 *   { name: 'Favorites ♥',    usage: 72, sessions:  924 },
 *   { name: 'Chat / Messages', usage: 61, sessions:  783 },
 *   { name: 'Feed',            usage: 45, sessions:  578 },
 *   { name: 'Roomies Match',   usage: 28, sessions:  359 },
 *   { name: 'Map View',        usage: 14, sessions:  180 },
 * ]
 *
 * Full hardcoded implementation removed - all numbers above are static mock data.
 */
