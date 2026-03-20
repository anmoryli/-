"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ChevronRight, HeartPulse, Ruler, Scale } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getHealthSummary } from "@/lib/api/health"

function formatWeekLabel(week: unknown) {
  const w = typeof week === "number" ? week : typeof week === "string" ? Number(week) : NaN
  if (!Number.isFinite(w) || w <= 0) return "未设置孕周"
  return `孕 ${w} 周`
}

export function HealthHome({ showHeader = true }: { showHeader?: boolean }) {
  const { user } = useAuth()
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getHealthSummary>>>(null)

  useEffect(() => {
    if (!user?.userId) return
    getHealthSummary(user.userId).then((s) => setSummary(s ?? null)).catch(() => setSummary(null))
  }, [user?.userId])

  const weekLabel = useMemo(() => formatWeekLabel(summary?.gestationWeek), [summary])

  return (
    <div className={`min-h-dvh px-4 pb-24 ${showHeader ? "pt-14" : "pt-4"}`}>
      {showHeader && (
        <>
          <h1 className="text-[1.35rem] font-semibold text-[var(--foreground)]">孕期健康档案</h1>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">{weekLabel} · 记录可追溯可对比</p>
        </>
      )}

      <div className="glass-card mt-5 overflow-hidden">
        <Link
          href="/health/weight"
          className="group flex items-center justify-between border-b border-[var(--card-border)] px-4 py-3.5 active:bg-[var(--muted)]/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-3-muted)] text-[var(--accent-3)]">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">体重记录</p>
              <p className="mt-0.5 text-xs text-[var(--foreground-secondary)]">趋势 + 标准范围 + 建议</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-[var(--foreground-muted)]" />
        </Link>
        <Link
          href="/health/fetal"
          className="group flex items-center justify-between border-b border-[var(--card-border)] px-4 py-3.5 active:bg-[var(--muted)]/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-2-muted)] text-[var(--accent-2)]">
              <Ruler className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">胎儿B超指标</p>
              <p className="mt-0.5 text-xs text-[var(--foreground-secondary)]">BPD/HC/AC/FL/估重 对照</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-[var(--foreground-muted)]" />
        </Link>
        <div className="flex items-start gap-3 px-4 py-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-1-muted)] text-[var(--accent-1)]">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--foreground)]">提示</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--foreground-secondary)]">
              标准范围为参考值（基准±10%/固定浮动），用于自查趋势；如出现连续异常或不适，请优先咨询产科医生。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

