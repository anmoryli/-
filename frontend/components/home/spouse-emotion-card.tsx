"use client"

import { useState, useEffect } from "react"
import { getSpouseEmotionSummary, type SpouseEmotionSummaryDto } from "@/lib/api/emotion-pregnancy"
import { Heart } from "lucide-react"

interface SpouseEmotionCardProps {
  userId: number
}

const TREND_LABELS: Record<string, string> = {
  stable: "近几周情绪平稳",
  fluctuating: "老婆这周情绪波动稍大",
  need_support: "老婆近期需要更多陪伴",
}

export function SpouseEmotionCard({ userId }: SpouseEmotionCardProps) {
  const [summary, setSummary] = useState<SpouseEmotionSummaryDto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSpouseEmotionSummary(userId)
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading || !summary) return null

  const hasContent = (summary.lastWeeks && summary.lastWeeks.length > 0) || (summary.suggestedAction && summary.suggestedAction.length > 0)
  if (!hasContent) return null

  const trendLabel = TREND_LABELS[summary.trend] ?? summary.trend

  return (
    <div className="card-elevated overflow-hidden rounded-xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <Heart className="h-4 w-4 text-[var(--accent-1)]" strokeWidth={1.75} />
        <p className="text-micro font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
          妻子情绪趋势
        </p>
      </div>
      <p className="text-sm font-medium text-[var(--foreground)]">{trendLabel}</p>
      {summary.lastWeeks && summary.lastWeeks.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs text-[var(--foreground-muted)]">
          {summary.lastWeeks.slice(0, 4).map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      )}
      {summary.suggestedAction && (
        <p className="mt-2 text-sm text-[var(--accent-1)]" style={{ fontFamily: "var(--font-serif)" }}>
          {summary.suggestedAction}
        </p>
      )}
    </div>
  )
}
