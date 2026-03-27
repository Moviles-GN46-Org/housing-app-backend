import { Layers, TrendingDown } from 'lucide-react'
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts'

const features = [
  { name: 'Search & Filter', usage: 94, sessions: 1208 },
  { name: 'Listing Detail', usage: 87, sessions: 1118 },
  { name: 'Favorites ♥', usage: 72, sessions: 924 },
  { name: 'Chat / Messages', usage: 61, sessions: 783 },
  { name: 'Feed', usage: 45, sessions: 578 },
  { name: 'Roomies Match', usage: 28, sessions: 359 },
  { name: 'Map View', usage: 14, sessions: 180 },
]

export default function FeatureUsageCard() {
  const leastUsed = features[features.length - 1]

  return (
    <div className="bg-white_card rounded-2xl border border-[#E8DDD4] shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FBF3EB] flex items-center justify-center">
              <Layers size={16} className="text-bronze" strokeWidth={2} />
            </div>
            <div>
              <p className="text-taupe text-xs font-medium uppercase tracking-wider">Feature Usage</p>
              <h2 className="text-mocha font-semibold text-sm">Which features get ignored?</h2>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-rose-50 text-rose-400 text-xs font-semibold px-2.5 py-1 rounded-full">
            <TrendingDown size={11} />
            1 low
          </div>
        </div>

        {/* Least used callout */}
        <div className="mt-5 flex items-center gap-3 bg-[#FFF3F3] border border-[#F2CDCD] rounded-xl px-4 py-3">
          <div className="flex-1">
            <p className="text-taupe text-xs">Least used feature</p>
            <p className="text-mocha font-semibold text-lg">{leastUsed.name}</p>
            <p className="text-ash text-xs mt-0.5">{leastUsed.sessions} sessions · only {leastUsed.usage}% of users</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center">
            <span className="text-rose-400 font-bold text-lg">{leastUsed.usage}%</span>
          </div>
        </div>

        {/* Feature bars */}
        <div className="mt-5 space-y-2.5">
          {features.map((f) => {
            const isLeast = f.name === leastUsed.name
            return (
              <div key={f.name}>
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-medium ${isLeast ? 'text-rose-400' : 'text-ash'}`}>{f.name}</span>
                  <span className={`text-xs font-semibold ${isLeast ? 'text-rose-400' : 'text-taupe'}`}>{f.usage}%</span>
                </div>
                <div className="h-2 bg-[#F0E8E0] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${f.usage}%`,
                      backgroundColor: isLeast ? '#FCA5A5' : '#DA9958',
                      opacity: isLeast ? 1 : 0.7 + (f.usage / 100) * 0.3,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
