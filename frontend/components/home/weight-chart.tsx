"use client"

import { useState, useEffect } from "react"
import { getMoodHistory } from "@/lib/api/daily"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Scale } from "lucide-react"

interface WeightChartProps {
  userId: number
  days?: number
}

export function WeightChart({ userId, days = 30 }: WeightChartProps) {
  const [data, setData] = useState<Array<{ date: string; weightKg: number; display: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMoodHistory(userId, days)
      .then((list) => {
        const withWeight = (list || [])
          .filter((d: { weightKg?: number | null }) => d.weightKg != null && d.weightKg > 0)
          .map((d: { date: string; weightKg?: number | null }) => ({
            date: d.date,
            weightKg: Number(d.weightKg),
            display: format(new Date(d.date), "M/d", { locale: zhCN }),
          }))
          .sort((a, b) => a.date.localeCompare(b.date))
        setData(withWeight)
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [userId, days])

  if (loading || data.length === 0) return null

  const minW = Math.min(...data.map((d) => d.weightKg))
  const maxW = Math.max(...data.map((d) => d.weightKg))
  const domain = [Math.floor(minW) - 1, Math.ceil(maxW) + 1]

  return (
    <div className="card-elevated overflow-hidden rounded-xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <Scale className="h-4 w-4 text-[var(--accent-2)]" strokeWidth={1.75} />
        <p className="text-micro font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
          体重曲线 · 近{days}天
        </p>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" opacity={0.5} />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => format(new Date(v), "M/d", { locale: zhCN })}
              tick={{ fontSize: 10 }}
            />
            <YAxis
              domain={domain}
              tick={{ fontSize: 10 }}
              width={28}
              tickFormatter={(v) => `${v}kg`}
            />
            <Tooltip
              content={({ payload }) => {
                const p = payload?.[0]?.payload
                if (!p) return null
                return (
                  <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-xs shadow-lg">
                    <p className="font-medium">
                      {format(new Date(p.date), "M月d日 EEEE", { locale: zhCN })}
                    </p>
                    <p className="mt-0.5 text-[var(--accent-2)] font-semibold">
                      {p.weightKg} kg
                    </p>
                  </div>
                )
              }}
            />
            <Line
              type="monotone"
              dataKey="weightKg"
              stroke="var(--accent-2)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--accent-2)" }}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
