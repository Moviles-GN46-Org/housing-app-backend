import { MapPin, TrendingUp } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const zones = [
  { name: 'Chapinero', searches: 4820, pct: 35, color: '#DA9958' },
  { name: 'Usaquén', searches: 3260, pct: 24, color: '#C8874A' },
  { name: 'Teusaquillo', searches: 2190, pct: 16, color: '#B87640' },
  { name: 'La Candelaria', searches: 1780, pct: 13, color: '#E8B07A' },
  { name: 'Suba', searches: 820, pct: 6, color: '#F2CFA0' },
  { name: 'Other', searches: 830, pct: 6, color: '#E8DDD4' },
]

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload
    return (
      <div className="bg-white_card border border-[#E8DDD4] rounded-xl px-3 py-2 shadow-md text-xs">
        <p className="text-mocha font-semibold">{d.name}</p>
        <p className="text-taupe">{d.searches.toLocaleString()} searches · {d.pct}%</p>
      </div>
    )
  }
  return null
}

export default function ZonesCard() {
  const top = zones[0]

  return (
    <div className="bg-white_card rounded-2xl border border-[#E8DDD4] shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FBF3EB] flex items-center justify-center">
              <MapPin size={16} className="text-bronze" strokeWidth={2} />
            </div>
            <div>
              <p className="text-taupe text-xs font-medium uppercase tracking-wider">Search Zones</p>
              <h2 className="text-mocha font-semibold text-sm">Where are users looking?</h2>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 text-xs font-semibold px-2.5 py-1 rounded-full">
            <TrendingUp size={11} />
            {zones.length} zones
          </div>
        </div>

        <div className="mt-5 flex gap-4 items-center">
          {/* Pie chart */}
          <div className="w-36 h-36 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={zones}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={62}
                  paddingAngle={2}
                  dataKey="pct"
                >
                  {zones.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend list */}
          <div className="flex-1 space-y-2">
            {zones.map((z, i) => (
              <div key={z.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: z.color }} />
                <span className="text-ash text-xs flex-1 truncate">{z.name}</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1.5 bg-[#F0E8E0] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${z.pct}%`, backgroundColor: z.color }} />
                  </div>
                  <span className="text-taupe text-xs w-7 text-right font-medium">{z.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top zone callout */}
        <div className="mt-4 flex items-center gap-3 bg-[#FBF3EB] border border-[#E8DDD4] rounded-xl px-4 py-3">
          <MapPin size={14} className="text-bronze shrink-0" />
          <div className="flex-1">
            <p className="text-taupe text-xs">Most searched zone</p>
            <p className="text-mocha font-semibold">{top.name}</p>
          </div>
          <div className="text-right">
            <p className="text-mocha font-bold text-lg">{top.pct}%</p>
            <p className="text-taupe text-xs">{top.searches.toLocaleString()} searches</p>
          </div>
        </div>
      </div>
    </div>
  )
}
