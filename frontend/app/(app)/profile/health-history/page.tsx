"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useBack } from "@/lib/use-back"
import { ArrowLeft, HeartPulse, Scale, Baby, Smile, Heart, MessageSquare } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  getAnalysisHistory,
  getAnalysisByRecord,
  listWeightRecords,
  listFetalRecords,
  type HealthAnalysisRecord,
} from "@/lib/api/health"
import { getMoodHistory } from "@/lib/api/daily"
import { getMoodRecordHistory, type MoodRecord } from "@/lib/api/mood"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { MOOD_LABELS } from "@/lib/mood-labels"

const RECORD_TYPE_LABEL: Record<string, string> = {
  weight: "体重",
  fetal: "B超",
}

export default function HealthHistoryPage() {
  const router = useRouter()
  const goBack = useBack("/profile")
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState<HealthAnalysisRecord[]>([])
  const [weightItems, setWeightItems] = useState<Record<string, unknown>[]>([])
  const [fetalItems, setFetalItems] = useState<Record<string, unknown>[]>([])
  const [moodHistory, setMoodHistory] = useState<Array<{ date: string; mood: string | null; kickCount: number }>>([])
  const [moodRecords, setMoodRecords] = useState<MoodRecord[]>([])

  const [adviceOpen, setAdviceOpen] = useState(false)
  const [adviceContent, setAdviceContent] = useState<string | null>(null)
  const [adviceLoading, setAdviceLoading] = useState(false)

  const analysisByRecord = new Map<string, HealthAnalysisRecord>()
  for (const a of analysis) {
    analysisByRecord.set(`${a.recordType}:${a.recordId}`, a)
  }

  const onViewAdvice = async (recordType: "weight" | "fetal", recordId: number) => {
    if (!user?.userId) return
    setAdviceOpen(true)
    setAdviceContent(null)
    setAdviceLoading(true)
    try {
      const res = await getAnalysisByRecord(user.userId, recordType, recordId)
      setAdviceContent(res?.analysisText ?? null)
    } catch {
      setAdviceContent(null)
    } finally {
      setAdviceLoading(false)
    }
  }

  useEffect(() => {
    if (!user?.userId) return
    setLoading(true)
    Promise.all([
      getAnalysisHistory(user.userId, 50),
      listWeightRecords(user.userId),
      listFetalRecords(user.userId),
      getMoodHistory(user.userId, 90),
      getMoodRecordHistory(user.userId, 90),
    ])
      .then(([a, w, f, m, mr]) => {
        setAnalysis(Array.isArray(a) ? a : [])
        setWeightItems(Array.isArray(w) ? w : [])
        setFetalItems(Array.isArray(f) ? f : [])
        setMoodHistory(Array.isArray(m) ? m : [])
        setMoodRecords(Array.isArray(mr) ? mr : [])
      })
      .catch(() => {
        toast.error("加载失败")
        setAnalysis([])
        setWeightItems([])
        setFetalItems([])
        setMoodHistory([])
        setMoodRecords([])
      })
      .finally(() => setLoading(false))
  }, [user?.userId])

  if (!user) return null

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4" style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(24px) saturate(1.3)", WebkitBackdropFilter: "blur(24px) saturate(1.3)" }}>
        <button
          type="button"
          onClick={goBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/40 text-[var(--foreground)]" style={{ background: "rgba(255,255,255,0.5)" }}
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <h1 className="flex-1 text-[1.1rem] font-semibold text-[var(--foreground)]" style={{ fontFamily: "var(--font-serif)" }}>
          健康档案
        </h1>
      </div>

      <div className="min-w-0 px-4 pb-8">
        {/* 快捷入口 */}
        <div className="card-elevated mt-2 overflow-hidden rounded-lg">
          <div className="flex">
            {[
              { label: "体重", icon: Scale, href: "/health/weight" },
              { label: "B超", icon: Baby, href: "/health/fetal" },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => router.push(item.href)}
                  className={`flex min-w-0 flex-1 flex-col items-center gap-1.5 py-4 ${i < 1 ? "border-r border-[var(--card-border)]" : ""}`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--accent-1)]/30 bg-[var(--accent-1-muted)] text-[var(--accent-1)]">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <span className="text-micro">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {loading ? (
          <div className="mt-6 flex justify-center py-12 text-caption">加载中...</div>
        ) : (
          <>
            {/* 体重记录 */}
            <section className="mt-6">
              <h2 className="mb-3 flex items-center gap-2 text-[15px] font-medium text-[var(--foreground)]">
                <Scale className="h-4 w-4 text-[var(--accent-2)]" strokeWidth={1.75} />
                体重记录
              </h2>
              {weightItems.length === 0 ? (
                <div className="card-elevated rounded-lg p-6 text-center text-caption">暂无体重记录</div>
              ) : (
                <div className="card-elevated overflow-hidden rounded-lg">
                  {weightItems.slice(0, 10).map((item, i) => {
                    const r = item.record as Record<string, unknown> | undefined
                    const gainKg = item.gainKg as number | undefined
                    const status = item.status as string | undefined
                    const statusCls =
                      status === "within"
                        ? "bg-[var(--accent-3-muted)] text-[var(--accent-3)]"
                        : status === "above"
                          ? "bg-[var(--critical-muted)] text-[var(--critical)]"
                          : status === "below"
                            ? "bg-[var(--accent-2-muted)] text-[var(--accent-2)]"
                            : "bg-[var(--muted)] text-[var(--foreground-secondary)]"
                    const recordId = r?.id as number | undefined
                    const hasAdvice = recordId != null && analysisByRecord.has(`weight:${recordId}`)
                    return (
                      <div
                        key={(r?.id as number) ?? i}
                        className="min-w-0 border-b border-[var(--card-border)] last:border-b-0"
                      >
                        <div className="flex min-w-0 items-center justify-between gap-2 px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-[var(--foreground)]">{r?.weightKg ?? "-"} kg</span>
                            {gainKg != null && (
                              <span className="ml-2 text-caption">增重 {gainKg} kg</span>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {r?.recordDate && (
                              <span className="text-micro text-[var(--foreground-muted)]">
                                {String(r.recordDate)}
                              </span>
                            )}
                            {status && (
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${statusCls}`}>
                                {status === "within" ? "正常" : status === "above" ? "偏高" : status === "below" ? "偏低" : "—"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="border-t border-[var(--card-border)] px-4 py-2">
                          <button
                            type="button"
                            onClick={() => recordId != null && onViewAdvice("weight", recordId)}
                            className="flex w-full min-w-0 items-center justify-center gap-2 rounded-lg border border-[var(--card-border)] py-2 text-xs font-medium text-[var(--accent-1)] transition-colors active:bg-[var(--accent-1-muted)]"
                          >
                            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{hasAdvice ? "查看建议" : "分析中"}</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* B超记录 */}
            <section className="mt-6">
              <h2 className="mb-3 flex items-center gap-2 text-[15px] font-medium text-[var(--foreground)]">
                <Baby className="h-4 w-4 text-[var(--accent-3)]" strokeWidth={1.75} />
                B超记录
              </h2>
              {fetalItems.length === 0 ? (
                <div className="card-elevated rounded-lg p-6 text-center text-caption">暂无 B 超记录</div>
              ) : (
                <div className="card-elevated overflow-hidden rounded-lg min-w-0">
                  {fetalItems.slice(0, 10).map((item, i) => {
                    const r = item.record as Record<string, unknown> | undefined
                    const statusMap = item.status as Record<string, unknown> | undefined
                    const overall =
                      statusMap && Object.values(statusMap).includes("above")
                        ? "above"
                        : statusMap && Object.values(statusMap).includes("below")
                          ? "below"
                          : "within"
                    const statusCls =
                      overall === "within"
                        ? "bg-[var(--accent-3-muted)] text-[var(--accent-3)]"
                        : overall === "above"
                          ? "bg-[var(--critical-muted)] text-[var(--critical)]"
                          : overall === "below"
                            ? "bg-[var(--accent-2-muted)] text-[var(--accent-2)]"
                            : "bg-[var(--muted)] text-[var(--foreground-secondary)]"
                    const recordId = r?.id as number | undefined
                    const hasAdvice = recordId != null && analysisByRecord.has(`fetal:${recordId}`)
                    return (
                      <div
                        key={(r?.id as number) ?? i}
                        className="min-w-0 border-b border-[var(--card-border)] last:border-b-0"
                      >
                        <div className="flex min-w-0 items-center justify-between gap-2 px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-[var(--foreground)]">
                              孕{r?.gestationWeek ?? "-"}周
                            </span>
                            {r?.efwG != null && (
                              <span className="ml-2 text-caption">EFW {r.efwG} g</span>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {r?.recordDate && (
                              <span className="text-micro text-[var(--foreground-muted)]">
                                {String(r.recordDate)}
                              </span>
                            )}
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${statusCls}`}>
                              {overall === "within" ? "正常" : overall === "above" ? "偏高" : overall === "below" ? "偏低" : "—"}
                            </span>
                          </div>
                        </div>
                        <div className="border-t border-[var(--card-border)] px-4 py-2">
                          <button
                            type="button"
                            onClick={() => recordId != null && onViewAdvice("fetal", recordId)}
                            className="flex w-full min-w-0 items-center justify-center gap-2 rounded-lg border border-[var(--card-border)] py-2 text-xs font-medium text-[var(--accent-1)] transition-colors active:bg-[var(--accent-1-muted)]"
                          >
                            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{hasAdvice ? "查看建议" : "分析中"}</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* 心情与胎动 */}
            <section className="mt-6">
              <h2 className="mb-3 flex items-center gap-2 text-[15px] font-medium text-[var(--foreground)]">
                <Smile className="h-4 w-4 text-[var(--accent-1)]" strokeWidth={1.75} />
                <Heart className="h-4 w-4 text-[var(--accent-1)]" strokeWidth={1.75} />
                心情与胎动
              </h2>
              {(moodRecords.length > 0 || moodHistory.some((d) => d.mood || d.kickCount > 0)) ? (
                <div className="card-elevated overflow-hidden rounded-lg">
                  {moodRecords.length > 0
                    ? moodRecords.slice(0, 30).map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between border-b border-[var(--card-border)] px-4 py-2.5 last:border-b-0"
                        >
                          <span className="text-[14px] text-[var(--foreground)]">{r.recordDate}</span>
                          <div className="flex items-center gap-3 text-[13px]">
                            <span className="text-[var(--accent-1)]">
                              {MOOD_LABELS[r.mood] ?? r.mood}
                            </span>
                            <span className="text-[var(--foreground-muted)]">
                              {r.recordTime ? String(r.recordTime).slice(0, 5) : ""}
                            </span>
                          </div>
                        </div>
                      ))
                    : moodHistory
                        .filter((d) => d.mood || d.kickCount > 0)
                        .slice(0, 15)
                        .map((d) => (
                          <div
                            key={d.date}
                            className="flex items-center justify-between border-b border-[var(--card-border)] px-4 py-3 last:border-b-0"
                          >
                            <span className="text-[14px] text-[var(--foreground)]">{d.date}</span>
                            <div className="flex items-center gap-3 text-caption">
                              {d.mood && (
                                <span className="text-[var(--accent-1)]">
                                  {MOOD_LABELS[d.mood] ?? d.mood}
                                </span>
                              )}
                              {d.kickCount > 0 && <span>胎动 {d.kickCount} 次</span>}
                            </div>
                          </div>
                        ))}
                  {moodRecords.length === 0 && moodHistory.filter((d) => d.mood || d.kickCount > 0).length === 0 && (
                    <div className="p-4 text-center text-caption">暂无心情或胎动记录</div>
                  )}
                </div>
              ) : (
                <div className="card-elevated rounded-lg p-6 text-center text-caption">暂无记录</div>
              )}
            </section>
          </>
        )}
      </div>

      <Dialog open={adviceOpen} onOpenChange={setAdviceOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[var(--foreground)]">健康建议</DialogTitle>
          </DialogHeader>
          {adviceLoading ? (
            <p className="py-4 text-center text-sm text-[var(--foreground-secondary)]">加载中…</p>
          ) : adviceContent ? (
            <p className="text-sm leading-relaxed text-[var(--foreground)]">{adviceContent}</p>
          ) : (
            <p className="py-4 text-center text-sm text-[var(--foreground-secondary)]">
              分析中，请稍后再试
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
