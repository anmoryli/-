"use client"

import Link from "next/link"
import { Scale, Baby, Heart } from "lucide-react"
import { getHealthSummary, listWeightRecords } from "@/lib/api/health"
import { useEffect, useState } from "react"

interface HealthArchiveCardProps {
  userId: number
}

export function HealthArchiveCard({ userId }: HealthArchiveCardProps) {
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null)
  const [weightList, setWeightList] = useState<Array<Record<string, unknown>>>([])

  useEffect(() => {
    getHealthSummary(userId).then(setSummary).catch(() => setSummary(null))
    listWeightRecords(userId).then(setWeightList).catch(() => setWeightList([]))
  }, [userId])

  const latestWeight = summary?.latestWeight as Record<string, unknown> | undefined
  const latestFetal = summary?.latestFetal as Record<string, unknown> | undefined
  const bpdMm = latestFetal?.bpdMm as number | undefined
  const gestationWeek = summary?.gestationWeek as number | undefined

  const points = weightList
    .slice(-7)
    .map((it) => {
      const r = (it.record ?? {}) as Record<string, unknown>
      const w = r.weightKg as number | undefined
      return w != null ? Number(w) : null
    })
    .filter((w): w is number => w != null)

  const pts = points.length >= 2 ? points : points.length === 1 ? [points[0], points[0]] : []
  const minW = pts.length ? Math.min(...pts) : 0
  const maxW = pts.length ? Math.max(...pts) : 0
  const range = maxW - minW || 1

  return (
    <Link href="/profile/health-history" className="block">
      <div className="glass-card flex flex-col gap-3 p-4" title="健康档案：体重、B超双顶径等">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--accent-1)]">
              <Heart className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[15px] font-medium text-[var(--foreground)]">健康档案</p>
              <p className="text-[12px] text-[var(--foreground-secondary)]">
                {gestationWeek != null ? `孕 ${gestationWeek} 周` : "记录体重与B超"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5">
              <Scale className="h-3.5 w-3.5 text-[var(--accent-3)]" strokeWidth={1.5} />
              <span className="text-[13px] font-medium text-[var(--foreground)]">
                {latestWeight?.weightKg ?? "—"} kg
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5" title="BPD 双顶径：胎儿头两侧最宽距离（mm），B超常用指标">
              <Baby className="h-3.5 w-3.5 text-[var(--accent-2)]" strokeWidth={1.5} />
              <span className="text-[13px] font-medium text-[var(--foreground)]">
                {bpdMm != null ? `BPD ${bpdMm}mm` : "—"}
              </span>
            </div>
          </div>
        </div>
        {/* 柔和线条体重趋势 — 无边框 */}
        {pts.length > 0 && (
          <div className="h-10 w-full">
            <svg className="h-full w-full" preserveAspectRatio="none" viewBox={`0 0 ${Math.max(pts.length - 1, 1)} 1`}>
              <polyline
                fill="none"
                stroke="var(--accent-1)"
                strokeWidth="0.06"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.55"
                points={pts.map((w, i) => `${i} ${1 - (w - minW) / range}`).join(" ")}
              />
            </svg>
          </div>
        )}
      </div>
    </Link>
  )
}
