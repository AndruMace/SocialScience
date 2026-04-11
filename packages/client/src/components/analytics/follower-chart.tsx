import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { AnalyticsSnapshot } from '@socialscience/shared'

interface FollowerChartProps {
  snapshots: AnalyticsSnapshot[]
}

export function FollowerChart({ snapshots }: FollowerChartProps) {
  const data = snapshots.map((s) => ({
    date: new Date(s.capturedAt).toLocaleDateString(),
    followers: s.followers,
  }))

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-[hsl(var(--muted-foreground))] pixel-border">
        <span className="font-pixel text-[8px]">NO DATA YET</span>
      </div>
    )
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="hsl(240 10% 22%)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: 'VT323', fill: 'hsl(240 5% 55%)' }} />
          <YAxis tick={{ fontSize: 10, fontFamily: 'VT323', fill: 'hsl(240 5% 55%)' }} />
          <Tooltip
            contentStyle={{ background: 'hsl(240 10% 12%)', border: '2px solid hsl(240 10% 28%)', borderRadius: 0, fontFamily: 'VT323' }}
          />
          <Line type="stepAfter" dataKey="followers" stroke="hsl(120 80% 50%)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
