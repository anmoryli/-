"use client"

import { useState, useEffect, useRef } from "react"
import { addContraction, getContractionsByDate, clearContractionsByDate } from "@/lib/api/contraction"
import { format, differenceInSeconds } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Timer, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { getPregnancyInfo } from "@/lib/pregnancy"

interface ContractionTimerProps {
  userId: number
  lastMenstrualDate?: string
  dueDate: string
}

export function ContractionTimer({ userId, lastMenstrualDate, dueDate }: ContractionTimerProps) {
  const info = getPregnancyInfo(lastMenstrualDate ?? dueDate, dueDate)
  if (info.weeksPregnant < 36) return null

  const [contractions, setContractions] = useState<Array<{ startedAt: string; durationSeconds: number }>>([])
  const [startedAt, setStartedAt] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const today = format(new Date(), "yyyy-MM-dd")

  const fetchList = async () => {
    try {
      const list = await getContractionsByDate(userId, today)
      setContractions(
        (list ?? []).map((c) => ({
          startedAt: c.startedAt,
          durationSeconds: c.durationSeconds,
        }))
      )
    } catch {
      setContractions([])
    }
  }

  useEffect(() => {
    fetchList()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [userId, today])

  const handleStart = () => {
    setStartedAt(new Date())
    intervalRef.current = setInterval(() => {}, 1000)
  }

  const handleStop = async () => {
    if (!startedAt) return
    const end = new Date()
    const durationSeconds = differenceInSeconds(end, startedAt)
    setStartedAt(null)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setLoading(true)
    try {
      await addContraction(userId, startedAt.toISOString(), durationSeconds)
      await fetchList()
    } catch {
      toast.error("记录失败")
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    if (!confirm("确定清空今日宫缩记录？")) return
    setLoading(true)
    try {
      await clearContractionsByDate(userId, today)
      setContractions([])
      toast.success("已清空")
    } catch {
      toast.error("清空失败")
    } finally {
      setLoading(false)
    }
  }

  const intervals: number[] = []
  for (let i = 1; i < contractions.length; i++) {
    const prev = new Date(contractions[i - 1].startedAt).getTime()
    const curr = new Date(contractions[i].startedAt).getTime()
    intervals.push(Math.round((curr - prev) / 60000))
  }

  return (
    <div className="card-elevated overflow-hidden rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-[var(--accent-2)]" strokeWidth={1.5} />
          <span className="text-[14px] font-medium text-[var(--foreground)]">宫缩计时</span>
        </div>
        {contractions.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            className="text-micro text-[var(--foreground-muted)] hover:text-[var(--critical)]"
          >
            清空
          </button>
        )}
      </div>
      <p className="mt-1 text-micro text-[var(--foreground-muted)]">
        如有规律宫缩，请及时就医
      </p>
      <div className="mt-4">
        {startedAt ? (
          <button
            type="button"
            onClick={handleStop}
            disabled={loading}
            className="w-full rounded-xl bg-[var(--critical)] px-4 py-3 font-medium text-white active:opacity-90"
          >
            结束宫缩
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStart}
            disabled={loading}
            className="w-full rounded-xl border border-[var(--accent-2)]/50 bg-[var(--accent-2-muted)] px-4 py-3 font-medium text-[var(--accent-2)] active:opacity-90"
          >
            开始宫缩
          </button>
        )}
      </div>
      {contractions.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-micro font-medium text-[var(--foreground-muted)]">今日记录</p>
          {contractions.map((c, i) => (
            <div key={i} className="flex justify-between rounded-lg bg-[var(--muted)]/50 px-3 py-2 text-caption">
              <span>
                {format(new Date(c.startedAt), "HH:mm", { locale: zhCN })} · 持续 {c.durationSeconds}秒
              </span>
              {i > 0 && (
                <span className="text-[var(--accent-2)]">间隔 {intervals[i - 1]}分钟</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
