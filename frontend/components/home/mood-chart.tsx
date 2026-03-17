"use client"

import { useState, useEffect } from "react"
import { getMoodRecordHistory } from "@/lib/api/mood"
import { MOOD_LABELS } from "@/lib/mood-labels"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts"
import { Smile } from "lucide-react"

const MOOD_COLORS = [
  "var(--accent-1)",
  "var(--accent-2)",
  "#a78bfa",
  "#f59e0b",
  "#10b981",
]

interface MoodChartProps {
  userId: number
  days?: number
}

export function MoodChart({ userId, days = 7 }: MoodChartProps) {
  const [data, setData] = useState<Array<{ mood: string; count: number; label: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMoodRecordHistory(userId, days)
      .then((list) => {
        const moodCount: Record<string, number> = {}
        for (const r of list || []) {
          const m = (r as { mood?: string }).mood
          if (m && m.trim()) {
            moodCount[m] = (moodCount[m] || 0) + 1
          }
        }
        const arr = Object.entries(moodCount).map(([mood, count]) => ({
          mood,
          count,
          label: MOOD_LABELS[mood] ?? mood,
        }))
        setData(arr.sort((a, b) => b.count - a.count))
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [userId, days])

  if (loading || data.length === 0) return null

  return (
    <div className="glass-card overflow-hidden rounded-xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <Smile className="h-4 w-4 text-[var(--accent-1)]" strokeWidth={1.75} />
        <p className="text-micro font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
          近{days}天心情分布
        </p>
      </div>
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              width={56}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ payload }) => {
                const p = payload?.[0]?.payload
                if (!p) return null
                return (
                  <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card-solid)] px-3 py-2 text-xs shadow-lg">
                    <p className="font-medium text-[var(--foreground)]">{p.label}</p>
                    <p className="mt-0.5 text-[var(--foreground-muted)]">{p.count} 次</p>
                  </div>
                )
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20}>
              {data.map((_, i) => (
                <Cell key={i} fill={MOOD_COLORS[i % MOOD_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
