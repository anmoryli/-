"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Target, ChevronRight } from "lucide-react"
import { getGoalProgress, type GoalProgress } from "@/lib/api/goal"

interface GoalWidgetProps {
  userId: number
}

export function GoalWidget({ userId }: GoalWidgetProps) {
  const [progress, setProgress] = useState<GoalProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getGoalProgress(userId)
      .then(setProgress)
      .catch(() => setProgress([]))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading || progress.length === 0) return null

  const active = progress.filter((p) => p.status === "active")
  const completed = progress.filter((p) => p.status === "completed")
  const displayList = [...active.slice(0, 3), ...completed.slice(0, 2)]

  return (
    <Link
      href="/goals"
      className="glass-card block overflow-hidden rounded-xl transition-opacity active:opacity-90"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-1-muted)] text-[var(--accent-1)]">
          <Target className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold text-[var(--foreground)] whitespace-nowrap truncate">孕期小目标</h3>
          <p className="mt-0.5 text-xs text-[var(--foreground-muted)] whitespace-nowrap truncate">
            已完成 {completed.length} / {progress.length}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-[var(--foreground-muted)]" strokeWidth={1.75} />
      </div>
      <div className="border-t border-[var(--card-border)] px-4 py-3">
        <div className="space-y-2">
          {displayList.map((p) => (
            <div key={p.templateId} className="flex items-center justify-between text-sm">
              <span className="truncate text-[var(--foreground)]">{p.templateName}</span>
              <span
                className={`ml-2 shrink-0 font-medium whitespace-nowrap ${
                  p.status === "completed" ? "text-[var(--accent-1)]" : "text-[var(--foreground-muted)]"
                }`}
              >
                {p.status === "completed"
                  ? "已完成"
                  : `${p.currentValue}/${p.targetValue}${p.unit ?? ""}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Link>
  )
}
