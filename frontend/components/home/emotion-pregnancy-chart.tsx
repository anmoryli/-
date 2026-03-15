"use client"

import { useState, useEffect } from "react"
import {
  getEmotionPregnancySummary,
  getEmotionPregnancyDailyHint,
  type EmotionPregnancySummaryDto,
  type EmotionWeekDto,
} from "@/lib/api/emotion-pregnancy"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts"
import { Heart } from "lucide-react"

const POSITIVE_MOODS = ["happy", "calm", "peaceful"]
const MOOD_LABELS: Record<string, string> = {
  happy: "开心",
  calm: "平静",
  tired: "疲惫",
  anxious: "焦虑",
  peaceful: "安心",
}

function emotionIndex(week: EmotionWeekDto): number | null {
  const dist = week.moodDistribution
  if (!dist || Object.keys(dist).length === 0) return null
  const total = Object.values(dist).reduce((a, b) => a + b, 0)
  if (total === 0) return null
  const positive = Object.entries(dist)
    .filter(([k]) => POSITIVE_MOODS.includes(k))
    .reduce((a, [, v]) => a + v, 0)
  return Math.round((positive / total) * 100)
}

interface EmotionPregnancyChartProps {
  userId: number
}

export function EmotionPregnancyChart({ userId }: EmotionPregnancyChartProps) {
  const [summary, setSummary] = useState<EmotionPregnancySummaryDto | null>(null)
  const [dailyHint, setDailyHint] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getEmotionPregnancySummary(userId)
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false))
  }, [userId])

  useEffect(() => {
    getEmotionPregnancyDailyHint(userId)
      .then((h) => setDailyHint(h ?? ""))
      .catch(() => setDailyHint(""))
  }, [userId])

  if (loading || !summary) return null

  const weeks = summary.weeks ?? []
  const chartData = weeks
    .map((w) => ({
      ...w,
      index: emotionIndex(w),
    }))
    .filter((d) => d.index != null)
    .sort((a, b) => (a.pregnancyWeekIndex ?? 0) - (b.pregnancyWeekIndex ?? 0))

  const hasEnoughData = chartData.length >= 1
  const showChart = hasEnoughData && chartData.some((d) => d.index != null)

  return (
    <div className="card-elevated overflow-hidden rounded-xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <Heart className="h-4 w-4 text-[var(--accent-1)]" strokeWidth={1.75} />
        <p className="text-micro font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
          情绪 · 孕周
        </p>
      </div>

      {showChart && (
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" opacity={0.5} />
              <XAxis
                dataKey="weekLabel"
                tick={{ fontSize: 10 }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10 }}
                width={28}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                content={({ payload }) => {
                  const p = payload?.[0]?.payload as (typeof chartData)[0] | undefined
                  if (!p) return null
                  const dist = p.moodDistribution
                  const lines = dist
                    ? Object.entries(dist)
                        .sort((a, b) => b[1] - a[1])
                        .map(([k, v]) => `${MOOD_LABELS[k] ?? k} ${v}次`)
                    : []
                  return (
                    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-xs shadow-lg">
                      <p className="font-medium">{p.weekLabel}</p>
                      {p.index != null && (
                        <p className="mt-0.5 text-[var(--accent-1)]">正向情绪占比 {p.index}%</p>
                      )}
                      {lines.length > 0 && (
                        <p className="mt-1 text-[var(--foreground-muted)]">{lines.join(" · ")}</p>
                      )}
                    </div>
                  )
                }}
              />
              <Line
                type="monotone"
                dataKey="index"
                stroke="var(--accent-1)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--accent-1)" }}
                activeDot={{ r: 4 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {!showChart && weeks.length === 0 && (
        <p className="text-sm text-[var(--foreground-muted)]">
          多记录几天心情与日记后，这里会生成你的情绪-孕周曲线。
        </p>
      )}

      {dailyHint && (
        <p className="mt-2 rounded-md bg-[var(--accent-1-muted)]/50 px-2.5 py-1.5 text-xs text-[var(--foreground)]">
          {dailyHint}
        </p>
      )}
      {summary.warmSentence && (
        <p className="mt-3 text-sm text-[var(--foreground)]" style={{ fontFamily: "var(--font-serif)" }}>
          {summary.warmSentence}
        </p>
      )}
      {summary.weightInRangeHint && (
        <p className="mt-1 text-xs text-[var(--foreground-muted)]">{summary.weightInRangeHint}</p>
      )}
    </div>
  )
}
