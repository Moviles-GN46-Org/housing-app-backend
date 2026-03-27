import { Clock, TrendingUp } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const data = [
  { day: 'Mon', minutes: 3.2 },
  { day: 'Tue', minutes: 4.1 },
  { day: 'Wed', minutes: 3.8 },
  { day: 'Thu', minutes: 5.0 },
  { day: 'Fri', minutes: 4.7 },
  { day: 'Sat', minutes: 6.2 },
  { day: 'Sun', minutes: 4.5 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white_card border border-[#E8DDD4] rounded-xl px-3 py-2 shadow-md text-xs">
        <p className="text-taupe font-medium">{label}</p>
        <p className="text-mocha font-semibold">{payload[0].value} min</p>
      </div>
    )
  }
  return null
}

export default function SessionCard() {
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
              <p className="text-taupe text-xs font-medium uppercase tracking-wider">Session Duration</p>
              <h2 className="text-mocha font-semibold text-sm">How long do users stay?</h2>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 text-xs font-semibold px-2.5 py-1 rounded-full">
            <TrendingUp size={11} />
            +12%
          </div>
        </div>

        {/* Big stat */}
        <div className="mt-5 flex items-end gap-3">
          <span className="text-mocha text-5xl font-semibold tracking-tight">4:32</span>
          <span className="text-taupe text-sm mb-2">min avg / session</span>
        </div>

        <div className="mt-3 flex gap-4">
          {[
            { label: 'Shortest', value: '0:48' },
            { label: 'Longest', value: '18:21' },
            { label: 'Median', value: '3:55' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-taupe text-xs">{s.label}</p>
              <p className="text-ash text-sm font-semibold">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-36 px-2 pb-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 12, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="sessionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#DA9958" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#DA9958" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8B7364' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#8B7364' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="minutes"
              stroke="#DA9958"
              strokeWidth={2}
              fill="url(#sessionGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#DA9958', stroke: '#FEFBF9', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
