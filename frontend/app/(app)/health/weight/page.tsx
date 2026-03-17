"use client"

import { useEffect, useMemo, useState } from "react"
import { useBack } from "@/lib/use-back"
import { ArrowLeft, Plus, TrendingUp } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { mutateWeightRecords } from "@/lib/hooks/use-health"
import { addWeightRecord, listWeightRecords, getHealthSummary } from "@/lib/api/health"
import { toast } from "sonner"
type WeightListItem = Record<string, unknown>

function todayISO() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

function statusMeta(status: unknown) {
  const s = String(status ?? "unknown")
  if (s === "within") return { label: "正常", cls: "bg-[var(--accent-3-muted)] text-[var(--accent-3)]" }
  if (s === "above") return { label: "偏高", cls: "bg-[var(--critical-muted)] text-[var(--critical)]" }
  if (s === "below") return { label: "偏低", cls: "bg-[var(--accent-2-muted)] text-[var(--accent-2)]" }
  return { label: "—", cls: "bg-[var(--muted)] text-[var(--foreground-secondary)]" }
}

export default function WeightPage() {
  const goBack = useBack("/community")
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<WeightListItem[]>([])

  const [recordDate, setRecordDate] = useState(todayISO())
  const [gestationWeek, setGestationWeek] = useState<number | null>(null)
  const [weightKg, setWeightKg] = useState("")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  const canSave = useMemo(() => Number(weightKg) > 0 && !!user?.userId && gestationWeek != null, [weightKg, user?.userId, gestationWeek])

  const refresh = async () => {
    if (!user?.userId) return
    setLoading(true)
    try {
      const res = await listWeightRecords(user.userId)
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
      await addWeightRecord({
        userId: user.userId,
        recordDate,
        gestationWeek: undefined,
        weightKg: Number(weightKg),
        note: note || undefined,
      })
      mutateWeightRecords(user?.userId)
      toast.success("已记录。健康建议生成中，请稍后到「我的」→「健康档案」查看")
      setWeightKg("")
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
        <h1 className="text-lg font-semibold text-[var(--foreground)]">体重记录</h1>
      </div>

      <div className="px-4 pb-24">
        <div className="glass-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-white/30 px-4 py-3">
            <TrendingUp className="h-4 w-4 text-[var(--accent-3)]" />
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

            <label className="grid gap-1">
              <span className="text-xs text-[var(--foreground-secondary)]">体重（kg）</span>
              <input
                inputMode="decimal"
                placeholder="如 55.2"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="h-10 rounded-xl border border-[var(--card-border)] bg-[var(--background-alt)] px-3 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs text-[var(--foreground-secondary)]">备注（可选）</span>
              <input
                placeholder="如：今天走路30分钟"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-10 rounded-xl border border-[var(--card-border)] bg-[var(--background-alt)] px-3 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </label>

            <button
              onClick={onAdd}
              disabled={!canSave || saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--accent-1)] px-4 text-sm font-semibold text-white shadow-sm disabled:opacity-50 active:opacity-90"
            >
              <Plus className="h-4 w-4" />
              记录体重
            </button>
          </div>
        </div>

        <div className="glass-card mt-4 overflow-hidden">
          {loading ? (
            <div className="border-b border-[var(--card-border)] p-4 text-sm text-[var(--foreground-secondary)]">
              加载中…
            </div>
          ) : items.length === 0 ? (
            <div className="p-4 text-sm text-[var(--foreground-secondary)]">
              还没有记录，先添加一条吧。
            </div>
          ) : (
            items.map((it, idx) => {
              const record = (it.record ?? {}) as Record<string, unknown>
              const status = it.status
              const meta = statusMeta(status)
              const gainKg = it.gainKg as unknown
              const range = it.range as Record<string, unknown> | undefined
              const advice = it.advice as unknown
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
                        体重：{record.weightKg ?? "—"} kg
                        {gainKg != null ? ` · 相对首次增重：${gainKg} kg` : ""}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${meta.cls}`}>
                      {meta.label}
                    </span>
                  </div>
                  {range?.min != null && range?.max != null && (
                    <div className="px-4 pb-3 text-xs text-[var(--foreground-secondary)]">
                      参考增重范围：{String(range.min)} ~ {String(range.max)} kg
                    </div>
                  )}
                  {advice ? (
                    <div className="border-t border-[var(--card-border)] bg-[var(--background-alt)] px-4 py-3 text-xs leading-relaxed text-[var(--foreground-secondary)]">
                      {String(advice)}
                    </div>
                  ) : null}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

