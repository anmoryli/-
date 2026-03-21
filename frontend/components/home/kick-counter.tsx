"use client"

import { useState, useEffect } from "react"
import { getTodayLog, incrementKick } from "@/lib/api/daily"
import { Heart } from "lucide-react"
import { toast } from "sonner"

interface KickCounterProps {
  userId: number
}

export function KickCounter({ userId }: KickCounterProps) {
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchCount = async () => {
    try {
      const log = await getTodayLog(userId)
      setCount(log.kickCount ?? 0)
    } catch {
      setCount(0)
    }
  }

  useEffect(() => {
    fetchCount()
  }, [userId])

  const handleKick = async () => {
    if (loading) return
    setLoading(true)
    try {
      const newCount = await incrementKick(userId)
      setCount(newCount)
      if (newCount === 1) {
        toast.success("宝宝在和妈妈打招呼呢")
      }
    } catch {
      toast.error("记录失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleKick}
      disabled={loading}
      className="glass-card flex items-center gap-2 px-4 py-3 transition-colors active:opacity-90 disabled:opacity-70"
    >
      <Heart className="h-5 w-5 text-[var(--accent-1)]" strokeWidth={1.75} fill="currentColor" />
      <span className="text-[14px] font-medium text-[var(--foreground)]">胎动</span>
      <span className="font-bold text-[var(--accent-1)]">
        {count !== null ? count : "—"}
      </span>
      <span className="text-caption">次/今日</span>
    </button>
  )
}
