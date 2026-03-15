"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, FileText } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getScenarioReports, type ScenarioReport } from "@/lib/api/scenario"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { toast } from "sonner"

export default function ScenarioReportsPage() {
  const { user } = useAuth()
  const [reports, setReports] = useState<ScenarioReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    if (user.isSpouse !== true) return
    setLoading(true)
    getScenarioReports(user.userId)
      .then(setReports)
      .catch(() => {
        setReports([])
        toast.error("加载报告列表失败")
      })
      .finally(() => setLoading(false))
  }, [user])

  if (!user) return null
  if (user.isSpouse !== true) return null

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--background)]">
      <div className="border-b border-[var(--card-border)] bg-[var(--card)] px-6 pt-14 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/scenario"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground-muted)] transition-colors active:bg-[var(--muted)]"
            aria-label="返回"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
          </Link>
          <h1
            className="flex-1 text-[1.2rem] font-semibold text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            情景报告
          </h1>
        </div>
        <p className="mt-1 text-caption">查看已结束情景的 AI 生成报告</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl border border-[var(--card-border)] bg-[var(--card)]"
              />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-[var(--foreground-muted)]" strokeWidth={1.5} />
            <p className="mt-4 text-[var(--foreground-muted)]">暂无情景报告</p>
            <p className="mt-1 text-micro text-[var(--foreground-muted)]">
              结束情景演绎后将在此显示
            </p>
            <Link
              href="/scenario"
              className="mt-6 rounded-xl px-6 py-3 text-[14px] font-medium transition-opacity active:opacity-90"
              style={{ backgroundColor: "var(--accent-2)", color: "var(--foreground)" }}
            >
              去情景演绎
            </Link>
          </div>
        ) : (
          <div className="card-elevated overflow-hidden rounded-xl">
            {reports.map((r, idx) => (
              <Link
                key={r.reportId}
                href={`/scenario/reports/${r.reportId}`}
                className={`flex items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-[var(--muted)] ${
                  idx < reports.length - 1 ? "border-b border-[var(--card-border)]" : ""
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--accent-1)]/30 bg-[var(--accent-1-muted)]">
                  <FileText className="h-5 w-5 text-[var(--accent-1)]" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[var(--foreground)]">
                    {r.scenarioTitle ?? `情景 #${r.scenarioId}`}
                  </p>
                  <p className="mt-0.5 truncate text-micro text-[var(--foreground-muted)]">
                    {r.content?.slice(0, 60)}
                    {(r.content?.length ?? 0) > 60 ? "…" : ""}
                  </p>
                  <p className="mt-1 text-micro text-[var(--foreground-muted)]">
                    {r.createdAt
                      ? format(new Date(r.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })
                      : ""}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-[var(--foreground-muted)]" strokeWidth={1.75} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
