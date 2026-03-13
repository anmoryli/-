"use client"

import { useState, useEffect } from "react"
import { getTodayLog, updateMood } from "@/lib/api/daily"
import { toast } from "sonner"

const MOODS = [
  { key: "happy", label: "开心", emoji: "😊" },
  { key: "calm", label: "平静", emoji: "😌" },
  { key: "tired", label: "疲惫", emoji: "😴" },
  { key: "anxious", label: "焦虑", emoji: "😟" },
  { key: "peaceful", label: "安心", emoji: "🧘" },
] as const

interface MoodPickerProps {
  userId: number
}

export function MoodPicker({ userId }: MoodPickerProps) {
  const [current, setCurrent] = useState<string | null>(null)

  const fetchMood = async () => {
    try {
      const log = await getTodayLog(userId)
      setCurrent(log.mood ?? null)
    } catch {
      setCurrent(null)
    }
  }

  useEffect(() => {
    fetchMood()
  }, [userId])

  const handleSelect = async (key: string) => {
    try {
      await updateMood(userId, key)
      setCurrent(key)
      toast.success("已记录今日心情")
    } catch {
      toast.error("记录失败")
    }
  }

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4">
      <p className="mb-2 text-micro font-medium text-[var(--foreground-muted)]">今日心情</p>
      <div className="flex gap-2">
        {MOODS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => handleSelect(m.key)}
            className={`flex flex-col items-center gap-0.5 rounded-lg border px-3 py-2 text-[20px] transition-colors ${
              current === m.key
                ? "border-[var(--accent-1)] bg-[var(--accent-1-muted)]"
                : "border-[var(--card-border)] bg-[var(--muted)]/50 active:bg-[var(--muted)]"
            }`}
            title={m.label}
          >
            {m.emoji}
            <span className="text-[10px] text-[var(--foreground-muted)]">{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
