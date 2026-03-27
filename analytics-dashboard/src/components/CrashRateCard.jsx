import { AlertTriangle, Smartphone } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const screens = [
  { name: 'Map Search', crashes: 48, color: '#DA9958' },
  { name: 'Listing Detail', crashes: 31, color: '#C8874A' },
  { name: 'Photo Gallery', crashes: 27, color: '#DA9958' },
  { name: 'Login / Auth', crashes: 19, color: '#C8874A' },
  { name: 'Chat Screen', crashes: 12, color: '#DA9958' },
  { name: 'Profile Edit', crashes: 8, color: '#C8874A' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white_card border border-[#E8DDD4] rounded-xl px-3 py-2 shadow-md text-xs">
        <p className="text-taupe font-medium">{label}</p>
        <p className="text-mocha font-semibold">{payload[0].value} crashes</p>
      </div>
    )
  }
  return null
}

export default function CrashRateCard() {
  const topScreen = screens[0]
  const total = screens.reduce((a, b) => a + b.crashes, 0)

  return (
    <div className="bg-white_card rounded-2xl border border-[#E8DDD4] shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFF3ED] flex items-center justify-center">
              <AlertTriangle size={16} className="text-orange-400" strokeWidth={2} />
            </div>
            <div>
              <p className="text-taupe text-xs font-medium uppercase tracking-wider">Crash Rate</p>
              <h2 className="text-mocha font-semibold text-sm">Where does the app break?</h2>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-orange-50 text-orange-500 text-xs font-semibold px-2.5 py-1 rounded-full">
            <Smartphone size={11} />
            {total} total
          </div>
        </div>

        {/* Highlighted worst offender */}
        <div className="mt-5 flex items-center gap-3 bg-[#FFF8F3] border border-[#F2D9C0] rounded-xl px-4 py-3">
          <div className="flex-1">
            <p className="text-taupe text-xs">Highest crash rate</p>
            <p className="text-mocha font-semibold text-lg">{topScreen.name}</p>
            <p className="text-ash text-xs mt-0.5">
              {topScreen.crashes} crashes · {Math.round((topScreen.crashes / total) * 100)}% of all crashes
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
            <span className="text-orange-500 font-bold text-lg">
              {Math.round((topScreen.crashes / total) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="h-40 px-2 pb-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={screens} margin={{ top: 4, right: 12, left: -24, bottom: 0 }} barSize={18}>
            <XAxis dataKey="name" tick={{ fontSize: 9.5, fill: '#8B7364' }} axisLine={false} tickLine={false} interval={0} />
            <YAxis tick={{ fontSize: 10, fill: '#8B7364' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#FBF3EB' }} />
            <Bar dataKey="crashes" radius={[6, 6, 0, 0]}>
              {screens.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? '#DA9958' : '#E8DDD4'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
