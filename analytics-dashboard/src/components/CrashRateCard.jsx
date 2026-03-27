import { useState, useMemo, useEffect } from 'react'
import { AlertTriangle, Smartphone, ArrowDownWideNarrow, ArrowUpAZ, Filter, Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

const FALLBACK_SCREENS = [
  { name: 'Map Search', crashes: 48 },
  { name: 'Listing Detail', crashes: 31 },
  { name: 'Photo Gallery', crashes: 27 },
  { name: 'Login / Auth', crashes: 19 },
  { name: 'Chat Screen', crashes: 12 },
  { name: 'Profile Edit', crashes: 8 },
]

export default function CrashRateCard() {
  const [screens, setScreens] = useState(FALLBACK_SCREENS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedBar, setSelectedBar] = useState(null)
  const [sortMode, setSortMode] = useState('crashes')

  useEffect(() => {
    let cancelled = false
    async function fetchCrashStats() {
      try {
        const res = await fetch(`${API_BASE}/api/analytics/crash-stats`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const body = await res.json()
        if (!cancelled && body.success && body.data.screens.length > 0) {
          setScreens(body.data.screens)
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchCrashStats()
    return () => { cancelled = true }
  }, [])

  const total = useMemo(() => screens.reduce((a, b) => a + b.crashes, 0), [screens])
  const topScreen = useMemo(
    () => screens.reduce((max, s) => (s.crashes > max.crashes ? s : max), screens[0]),
    [screens]
  )

  const sortedScreens = useMemo(() => {
    const copy = [...screens]
    switch (sortMode) {
      case 'crashes':
        return copy.sort((a, b) => b.crashes - a.crashes)
      case 'alpha':
        return copy.sort((a, b) => a.name.localeCompare(b.name))
      case 'threshold':
        return copy.filter(s => s.crashes >= 20).sort((a, b) => b.crashes - a.crashes)
      default:
        return copy
    }
  }, [sortMode, screens])

  const handleBarClick = (_data, index) => {
    setSelectedBar(prev => (prev === index ? null : index))
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const crashes = payload[0].value
      const pct = Math.round((crashes / total) * 100)
      return (
        <div className="bg-white_card border border-[#E8DDD4] rounded-xl px-3 py-2 shadow-md text-xs">
          <p className="text-mocha font-semibold">{label}</p>
          <p className="text-taupe">{crashes} crashes &middot; {pct}%</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white_card rounded-2xl border border-[#E8DDD4] shadow-sm overflow-hidden">
      <div className="px-6 pt-6 pb-2">
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
            {loading ? <Loader2 size={11} className="animate-spin" /> : <Smartphone size={11} />}
            {total} total
          </div>
        </div>

        {/* Compact worst-offender strip */}
        <div className="mt-3 flex items-center gap-2 bg-[#FFF8F3] border border-[#F2D9C0] rounded-lg px-3 py-1.5">
          <AlertTriangle size={12} className="text-orange-400 shrink-0" />
          <span className="text-xs text-ash truncate">
            <span className="font-semibold text-mocha">{topScreen.name}</span>
            {' '}&mdash; {topScreen.crashes} crashes ({Math.round((topScreen.crashes / total) * 100)}%)
          </span>
        </div>

        {error && (
          <p className="mt-2 text-xs text-orange-500">Using fallback data ({error})</p>
        )}

        {/* Sort toggle */}
        <div className="flex items-center gap-1 mt-3">
          {[
            { key: 'crashes', label: 'By count', icon: ArrowDownWideNarrow },
            { key: 'alpha', label: 'A\u2013Z', icon: ArrowUpAZ },
            { key: 'threshold', label: '\u226520', icon: Filter },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                setSortMode(key)
                setSelectedBar(null)
              }}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all duration-200 ${
                sortMode === key
                  ? 'bg-bronze text-white border-bronze'
                  : 'bg-white_card text-taupe border-[#E8DDD4] hover:border-bronze hover:text-ash'
              }`}
            >
              <Icon size={11} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bar chart */}
      <div className="h-56 px-2 pb-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedScreens} margin={{ top: 4, right: 12, left: -24, bottom: 0 }} barSize={18}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DDD4" strokeOpacity={0.6} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8B7364' }} axisLine={false} tickLine={false} interval={0} />
            <YAxis tick={{ fontSize: 10, fill: '#8B7364' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#FBF3EB', radius: 4 }} />
            <Bar
              dataKey="crashes"
              radius={[6, 6, 0, 0]}
              onClick={handleBarClick}
              cursor="pointer"
              animationDuration={400}
              animationEasing="ease-in-out"
              activeBar={{ fill: '#DA9958', fillOpacity: 0.85, stroke: '#C8874A', strokeWidth: 1 }}
            >
              {sortedScreens.map((entry, index) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={
                    selectedBar === index
                      ? '#DA9958'
                      : index === 0 && sortMode === 'crashes'
                        ? '#DA9958'
                        : '#E8DDD4'
                  }
                  fillOpacity={selectedBar !== null && selectedBar !== index ? 0.4 : 1}
                  stroke={selectedBar === index ? '#C8874A' : 'none'}
                  strokeWidth={selectedBar === index ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Selected bar detail panel */}
      {selectedBar !== null && sortedScreens[selectedBar] && (
        <div className="mx-4 mb-4 flex items-center gap-3 bg-[#FBF3EB] border border-[#E8DDD4] rounded-lg px-3 py-2 text-xs">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#DA9958' }} />
          <div className="flex-1">
            <span className="text-mocha font-semibold">{sortedScreens[selectedBar].name}</span>
            <span className="text-taupe ml-2">
              {sortedScreens[selectedBar].crashes} crashes &middot; {Math.round((sortedScreens[selectedBar].crashes / total) * 100)}% of total
            </span>
          </div>
          <button
            onClick={() => setSelectedBar(null)}
            className="text-taupe hover:text-mocha transition-colors"
          >
            &#10005;
          </button>
        </div>
      )}
    </div>
  )
}
