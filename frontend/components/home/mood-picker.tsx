"use client"

import { useState, useEffect } from "react"
import { addMoodRecord, getMoodRecordHistory, type MoodRecord } from "@/lib/api/mood"
import { MOOD_OPTIONS } from "@/lib/mood-labels"
import { toast } from "sonner"
import { format } from "date-fns"

function formatTime(t: string) {
  if (!t) return ""
  const parts = t.split(":")
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`
  return t
}

interface MoodPickerProps {
  userId: number
}

export function MoodPicker({ userId }: MoodPickerProps) {
  const [todayRecords, setTodayRecords] = useState<MoodRecord[]>([])
  const [loading, setLoading] = useState(false)

  const fetchToday = async () => {
    try {
      const list = await getMoodRecordHistory(userId, 1)
      const today = format(new Date(), "yyyy-MM-dd")
      setTodayRecords((list || []).filter((r) => r.recordDate === today))
    } catch {
      setTodayRecords([])
    }
  }

  useEffect(() => {
    fetchToday()
  }, [userId])

  const handleSelect = async (key: string) => {
    if (loading) return
    setLoading(true)
    try {
      const now = new Date()
      await addMoodRecord({
        userId,
        recordDate: format(now, "yyyy-MM-dd"),
        recordTime: format(now, "HH:mm"),
        mood: key,
      })
      toast.success("已记录此刻心情")
      await fetchToday()
    } catch {
      toast.error("记录失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card p-4">
      <p className="mb-3 text-[13px] font-medium text-[var(--foreground-muted)]">今日心情</p>
      <div className="flex flex-wrap gap-2">
        {MOOD_OPTIONS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => handleSelect(m.key)}
            disabled={loading}
            className="flex flex-col items-center gap-0.5 rounded-xl border border-[var(--card-border)] bg-[var(--muted)]/50 px-2.5 py-2 text-[18px] transition-colors active:bg-[var(--accent-1-muted)] disabled:opacity-50"
            title={m.label}
          >
            {m.emoji}
            <span className="text-[10px] text-[var(--foreground-muted)]">{m.label}</span>
          </button>
        ))}
      </div>
      {todayRecords.length > 0 && (
        <div className="mt-4 border-t border-[var(--card-border)] pt-3">
          <p className="mb-2 text-[12px] font-medium text-[var(--foreground-muted)]">今日已记录</p>
          <div className="space-y-1.5">
            {todayRecords.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg bg-[var(--muted)]/40 px-3 py-2 text-[13px]"
              >
                <span className="text-[var(--foreground)]">
                  {MOOD_OPTIONS.find((m) => m.key === r.mood)?.label ?? r.mood}
                </span>
                <span className="text-[var(--foreground-muted)]">{formatTime(r.recordTime)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
