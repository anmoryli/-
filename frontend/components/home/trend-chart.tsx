"use client"

import { useState, useEffect } from "react"
import { getMoodHistory } from "@/lib/api/daily"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Line } from "recharts"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { TrendingUp } from "lucide-react"

const MOOD_LABELS: Record<string, string> = {
  happy: "开心",
  calm: "平静",
  tired: "疲惫",
  anxious: "焦虑",
  peaceful: "安心",
}

interface TrendChartProps {
  userId: number
}

export function TrendChart({ userId }: TrendChartProps) {
  const [data, setData] = useState<Array<{ date: string; kickCount: number; mood: string | null; weightKg: number | null }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMoodHistory(userId, 7)
      .then((list) => {
        const filled = (list || [])
          .map((d: { date: string; kickCount?: number; mood?: string | null; weightKg?: number | null }) => ({
            date: d.date,
            kickCount: d.kickCount ?? 0,
            mood: d.mood ?? null,
            weightKg: d.weightKg ?? null,
          }))
          .sort((a, b) => a.date.localeCompare(b.date))
        setData(filled)
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading || data.length === 0) return null

  return (
    <div className="glass-card overflow-hidden rounded-xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-[var(--accent-1)]" strokeWidth={1.75} />
        <p className="text-micro font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
          近7天 · 胎动与心情
        </p>
      </div>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tickFormatter={(v) => format(new Date(v), "M/d", { locale: zhCN })}
              tick={{ fontSize: 10 }}
            />
            <YAxis allowDecimals={false} width={20} tick={{ fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" width={28} tick={{ fontSize: 10 }} domain={["dataMin - 1", "dataMax + 1"]} />
            <Tooltip
              content={({ payload }) => {
                const p = payload?.[0]?.payload
                if (!p) return null
                return (
                  <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card-solid)] px-3 py-2 text-xs shadow-lg">
                    <p className="font-medium">
                      {format(new Date(p.date), "M月d日", { locale: zhCN })}
                    </p>
                    <p className="mt-0.5">胎动 {p.kickCount} 次</p>
                    {p.weightKg != null && <p className="mt-0.5">体重 {p.weightKg} kg</p>}
                    {p.mood && (
                      <p className="mt-0.5 text-[var(--foreground-muted)]">
                        心情：{MOOD_LABELS[p.mood] ?? p.mood}
                      </p>
                    )}
                  </div>
                )
              }}
            />
            <Bar
              dataKey="kickCount"
              fill="var(--accent-1)"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="weightKg"
              stroke="var(--accent-2)"
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
