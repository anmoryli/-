"use client"

import { useEffect, useState } from "react"
import { getTodayLog, updateWeight } from "@/lib/api/daily"
import { toast } from "sonner"

interface WeightRecorderProps {
  userId: number
}

export function WeightRecorder({ userId }: WeightRecorderProps) {
  const [weight, setWeight] = useState<string>("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getTodayLog(userId)
      .then((log) => setWeight(log.weightKg != null ? String(log.weightKg) : ""))
      .catch(() => setWeight(""))
  }, [userId])

  const onSave = async () => {
    const value = Number(weight)
    if (!Number.isFinite(value) || value <= 0 || value > 300) {
      toast.error("请输入合理体重（kg）")
      return
    }
    setSaving(true)
    try {
      await updateWeight(userId, value)
      toast.success("今日体重已记录")
    } catch {
      toast.error("体重记录失败，请稍后重试")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4">
      <p className="mb-2 text-micro font-medium text-[var(--foreground-muted)]">今日体重</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="0.1"
          min="0"
          placeholder="例如 58.6"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="h-10 flex-1 rounded-lg border border-[var(--card-border)] bg-[var(--muted)]/40 px-3 text-sm outline-none focus:border-[var(--accent-1)]"
        />
        <button
          type="button"
          disabled={saving}
          onClick={onSave}
          className="h-10 rounded-lg bg-[var(--accent-1)] px-4 text-sm text-white disabled:opacity-70"
        >
          保存
        </button>
      </div>
    </div>
  )
}

