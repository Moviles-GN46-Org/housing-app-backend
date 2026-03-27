import { useEffect, useMemo, useState } from 'react'
import { MapPin, TrendingUp } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
const MAX_ZONES = 5
const ZONE_COLORS = ['#DA9958', '#C8874A', '#B87640', '#E8B07A', '#F2CFA0']

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

function toTop5Zones(rawZones) {
  const filtered = (rawZones || []).filter((zone) => {
    const neighborhood = String(zone?.neighborhood || '').trim()
    return neighborhood.length > 0
  })

  const topFive = filtered.slice(0, MAX_ZONES)
  const total = topFive.reduce((sum, z) => sum + Number(z.searches || 0), 0)

  return topFive.map((zone, index) => {
    const searches = Number(zone.searches || 0)
    const pct = total > 0 ? Math.round((searches / total) * 100) : 0
    return {
      name: zone.neighborhood,
      city: zone.city,
      searches,
      pct,
      color: ZONE_COLORS[index % ZONE_COLORS.length],
    }
  })
}

export default function ZonesCard({ refreshToken = 0 }) {
  const [zones, setZones] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ignore = false

    async function loadTopZones() {
      setIsLoading(true)
      setError(null)
      try {
        const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const to = new Date().toISOString()
        const url = `${API_BASE_URL}/analytics/top-searched-zones?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=${MAX_ZONES}`
        const res = await fetch(url)
        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`)
        }
        const json = await res.json()
        if (!ignore) {
          setZones(toTop5Zones(json?.data?.zones || []))
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Failed to load zones')
          setZones([])
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadTopZones()
    return () => {
      ignore = true
    }
  }, [refreshToken])

  const top = zones[0]
  const zoneCountLabel = useMemo(() => {
    if (isLoading) return 'loading'
    if (error) return 'error'
    return `${zones.length} zones`
  }, [isLoading, error, zones.length])

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
            {zoneCountLabel}
          </div>
        </div>

        <div className="mt-5 flex gap-4 items-center">
          {/* Pie chart */}
          <div className="w-36 h-36 shrink-0">
            {isLoading ? (
              <div className="h-full w-full rounded-full border border-[#E8DDD4] bg-[#FBF3EB] flex items-center justify-center text-xs text-taupe">
                Loading...
              </div>
            ) : zones.length > 0 ? (
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
            ) : (
              <div className="h-full w-full rounded-full border border-[#E8DDD4] bg-[#FBF3EB] flex items-center justify-center text-xs text-taupe text-center px-2">
                {error ? 'Failed to load' : 'No data'}
              </div>
            )}
          </div>

          {/* Legend list */}
          <div className="flex-1 space-y-2">
            {zones.map((z) => (
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
        {top && (
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
        )}

        {error && (
          <p className="mt-3 text-xs text-rose-500">{error}</p>
        )}
      </div>
    </div>
  )
}
