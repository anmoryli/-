"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getScenarioReportDetail, type ScenarioReport } from "@/lib/api/scenario"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { toast } from "sonner"
import { MarkdownView } from "@/components/markdown-view"

export default function ScenarioReportDetailPage() {
  const params = useParams()
  const reportId = params?.id ? Number(params.id) : NaN
  const { user } = useAuth()
  const [report, setReport] = useState<ScenarioReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || Number.isNaN(reportId)) return
    if (user.isSpouse !== true) return
    setLoading(true)
    getScenarioReportDetail(user.userId, reportId)
      .then(setReport)
      .catch(() => {
        setReport(null)
        toast.error("报告不存在或无权限")
      })
      .finally(() => setLoading(false))
  }, [user, reportId])

  if (!user) return null
  if (user.isSpouse !== true) return null

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="border-b border-[var(--card-border)] bg-[var(--card)] px-6 pt-14 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/scenario/reports"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground-muted)] transition-colors active:bg-[var(--muted)]"
            aria-label="返回"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
          </Link>
          <h1
            className="min-w-0 flex-1 truncate text-[1.1rem] font-semibold text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {report ? (report.scenarioTitle ?? "情景报告") : "情景报告"}
          </h1>
        </div>
        {report?.createdAt && (
          <p className="mt-1 text-caption">
            {format(new Date(report.createdAt), "yyyy年M月d日 HH:mm", { locale: zhCN })}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--muted)]" />
            <div className="h-4 animate-pulse rounded bg-[var(--muted)]" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--muted)]" />
          </div>
        ) : !report ? (
          <div className="py-12 text-center text-[var(--foreground-muted)]">
            报告不存在或无权查看
          </div>
        ) : (
          <div className="card-elevated glass-card p-5">
            <div className="prose prose-sm max-w-none text-[var(--foreground)]">
              <MarkdownView content={report.content ?? ""} className="min-h-[1em]" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
