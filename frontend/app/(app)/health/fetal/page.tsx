"use client"

import { useEffect, useMemo, useState } from "react"
import { useBack } from "@/lib/use-back"
import { ArrowLeft, Plus, Ruler, MessageSquare } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { mutateFetalRecords } from "@/lib/hooks/use-health"
import { addFetalRecord, listFetalRecords, getAnalysisByRecord, getHealthSummary } from "@/lib/api/health"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type FetalListItem = Record<string, unknown>

function todayISO() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

function badge(status: string) {
  if (status === "within") return { label: "正常", cls: "bg-[var(--accent-3-muted)] text-[var(--accent-3)]" }
  if (status === "above") return { label: "偏高", cls: "bg-[var(--critical-muted)] text-[var(--critical)]" }
  if (status === "below") return { label: "偏低", cls: "bg-[var(--accent-2-muted)] text-[var(--accent-2)]" }
  return { label: "—", cls: "bg-[var(--muted)] text-[var(--foreground-secondary)]" }
}

function pickOverallStatus(statusMap: Record<string, unknown> | null | undefined) {
  if (!statusMap) return "unknown"
  const vals = Object.values(statusMap).map(String)
  if (vals.includes("above")) return "above"
  if (vals.includes("below")) return "below"
  if (vals.includes("within")) return "within"
  return "unknown"
}

export default function FetalPage() {
  const goBack = useBack("/community")
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<FetalListItem[]>([])

  const [recordDate, setRecordDate] = useState(todayISO())
  const [gestationWeek, setGestationWeek] = useState<number | null>(null)
  const [bpdMm, setBpdMm] = useState("")
  const [hcMm, setHcMm] = useState("")
  const [acMm, setAcMm] = useState("")
  const [flMm, setFlMm] = useState("")
  const [efwG, setEfwG] = useState("")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  const canSave = useMemo(() => !!user?.userId && gestationWeek != null, [user?.userId, gestationWeek])

  const [adviceOpen, setAdviceOpen] = useState(false)
  const [adviceContent, setAdviceContent] = useState<string | null>(null)
  const [adviceLoading, setAdviceLoading] = useState(false)

  const onViewAdvice = async (recordId: number) => {
    if (!user?.userId) return
    setAdviceOpen(true)
    setAdviceContent(null)
    setAdviceLoading(true)
    try {
      const res = await getAnalysisByRecord(user.userId, "fetal", recordId)
      setAdviceContent(res?.analysisText ?? null)
    } catch {
      setAdviceContent(null)
    } finally {
      setAdviceLoading(false)
    }
  }

  const refresh = async () => {
    if (!user?.userId) return
    setLoading(true)
    try {
      const res = await listFetalRecords(user.userId)
      setItems(res ?? [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "加载失败")
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user?.userId) return
    getHealthSummary(user.userId)
      .then((s) => {
        const w = s?.gestationWeek
        setGestationWeek(typeof w === "number" ? w : null)
      })
      .catch(() => setGestationWeek(null))
  }, [user?.userId])

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId])

  const onAdd = async () => {
    if (!user?.userId || !canSave) return
    setSaving(true)
    try {
      await addFetalRecord({
        userId: user.userId,
        recordDate,
        gestationWeek: gestationWeek ?? undefined,
        bpdMm: bpdMm ? Number(bpdMm) : undefined,
        hcMm: hcMm ? Number(hcMm) : undefined,
        acMm: acMm ? Number(acMm) : undefined,
        flMm: flMm ? Number(flMm) : undefined,
        efwG: efwG ? Number(efwG) : undefined,
        note: note || undefined,
      })
      mutateFetalRecords(user?.userId)
      toast.success("已记录。健康建议生成中，请稍后到「我的」→「健康档案」查看")
      setBpdMm("")
      setHcMm("")
      setAcMm("")
      setFlMm("")
      setEfwG("")
      setNote("")
      await refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-dvh">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/40 px-4 py-4" style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(24px) saturate(1.3)", WebkitBackdropFilter: "blur(24px) saturate(1.3)" }}>
        <button
          onClick={() => goBack()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--secondary)] transition-colors active:opacity-80"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-[var(--foreground)]">胎儿B超指标</h1>
      </div>

      <div className="px-4 pb-24">
        <div className="glass-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[var(--card-border)] px-4 py-3">
            <Ruler className="h-4 w-4 text-[var(--accent-2)]" />
            <p className="text-sm font-semibold text-[var(--foreground)]">新增记录</p>
          </div>
          <div className="grid gap-3 px-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className="text-xs text-[var(--foreground-secondary)]">日期</span>
                <input
                  type="date"
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  className="h-10 rounded-xl border border-[var(--card-border)] bg-[var(--background-alt)] px-3 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-[var(--foreground-secondary)]">当前孕周</span>
                <div className="flex h-10 items-center rounded-xl border border-[var(--card-border)] bg-[var(--background-alt)] px-3 text-sm text-[var(--foreground)]">
                  {gestationWeek != null ? `孕 ${gestationWeek} 周` : "请先在「我的」设置末次月经或预产期"}
                </div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className="text-xs text-[var(--foreground-secondary)]">双顶径 BPD (mm)</span>
                <input inputMode="decimal" value={bpdMm} onChange={(e) => setBpdMm(e.target.value)} className="h-10 rounded-xl border border-[var(--card-border)] bg-[var(--background-alt)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]" />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-[var(--foreground-secondary)]">头围 HC (mm)</span>
                <input inputMode="decimal" value={hcMm} onChange={(e) => setHcMm(e.target.value)} className="h-10 rounded-xl border border-[var(--card-border)] bg-[var(--background-alt)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className="text-xs text-[var(--foreground-secondary)]">腹围 AC (mm)</span>
                <input inputMode="decimal" value={acMm} onChange={(e) => setAcMm(e.target.value)} className="h-10 rounded-xl border border-[var(--card-border)] bg-[var(--background-alt)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]" />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-[var(--foreground-secondary)]">股骨长 FL (mm)</span>
                <input inputMode="decimal" value={flMm} onChange={(e) => setFlMm(e.target.value)} className="h-10 rounded-xl border border-[var(--card-border)] bg-[var(--background-alt)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]" />
              </label>
            </div>
            <label className="grid gap-1">
              <span className="text-xs text-[var(--foreground-secondary)]">预估体重 EFW (g)</span>
              <input
                inputMode="numeric"
                value={efwG}
                onChange={(e) => setEfwG(e.target.value.replace(/[^\d]/g, ""))}
                className="h-10 rounded-xl border border-[var(--card-border)] bg-[var(--background-alt)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-[var(--foreground-secondary)]">备注（可选）</span>
              <input
                placeholder="如：医生说整体正常"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-10 rounded-xl border border-[var(--card-border)] bg-[var(--background-alt)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </label>

            <button
              onClick={onAdd}
              disabled={!canSave || saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--accent-1)] px-4 text-sm font-semibold text-white shadow-sm disabled:opacity-50 active:opacity-90"
            >
              <Plus className="h-4 w-4" />
              记录B超数据
            </button>
          </div>
        </div>

        <div className="mt-4 glass-card overflow-hidden">
          {loading ? (
            <div className="border-b border-[var(--card-border)] p-4 text-sm text-[var(--foreground-secondary)]">加载中…</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-sm text-[var(--foreground-secondary)]">还没有记录，先添加一条吧。</div>
          ) : (
            items.map((it, idx) => {
              const record = (it.record ?? {}) as Record<string, unknown>
              const reference = (it.reference ?? null) as Record<string, unknown> | null
              const statusMap = (it.status ?? null) as Record<string, unknown> | null
              const overall = pickOverallStatus(statusMap)
              const meta = badge(overall)
              const advice = it.advice as unknown

              const renderMetric = (key: string, label: string, unit: string) => {
                const v = record[key] as unknown
                const s = statusMap ? String(statusMap[key] ?? "unknown") : "unknown"
                const m = badge(s)
                const refMetric = reference ? (reference[key] as Record<string, unknown> | null) : null
                const range = refMetric?.range as Record<string, unknown> | undefined
                if (v == null && !range) return null
                return (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--background-alt)] px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--foreground)]">{label}</p>
                      <p className="mt-0.5 text-[11px] text-[var(--foreground-secondary)]">
                        你的值：{v ?? "—"} {unit}
                        {range?.min != null && range?.max != null ? ` · 参考：${String(range.min)}~${String(range.max)}` : ""}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${m.cls}`}>{m.label}</span>
                  </div>
                )
              }

              return (
                <div
                  key={String((record.id as unknown as string) ?? idx)}
                  className={idx > 0 ? "border-t border-[var(--card-border)]" : ""}
                >
                  <div className="flex items-center justify-between gap-2 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                        {(record.recordDate as string) ?? "—"}{" "}
                        {record.gestationWeek ? `· 孕${record.gestationWeek}周` : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--foreground-secondary)]">
                        可对照：基准 ±10%（用于趋势自查）
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${meta.cls}`}>{meta.label}</span>
                  </div>
                  <div className="grid gap-2 px-4 pb-4">
                    {renderMetric("bpdMm", "双顶径 BPD", "mm")}
                    {renderMetric("hcMm", "头围 HC", "mm")}
                    {renderMetric("acMm", "腹围 AC", "mm")}
                    {renderMetric("flMm", "股骨长 FL", "mm")}
                    {renderMetric("efwG", "预估体重 EFW", "g")}
                  </div>
                  {advice ? (
                    <div className="border-t border-[var(--card-border)] bg-[var(--background-alt)] px-4 py-3 text-xs leading-relaxed text-[var(--foreground-secondary)]">
                      {String(advice)}
                    </div>
                  ) : null}
                  <div className="border-t border-[var(--card-border)] px-4 py-2">
                    <button
                      type="button"
                      onClick={() => record.id != null && onViewAdvice(Number(record.id))}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--card-border)] py-2 text-xs font-medium text-[var(--accent-1)] transition-colors active:bg-[var(--accent-1-muted)]"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      查看建议
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
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
              分析中，请稍后到「我的」→「健康档案」查看
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

