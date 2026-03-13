"use client"

import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { getLikeCount, isLiked, toggleLike } from "@/lib/api/record-interaction"

interface LikeButtonProps {
  memoId: number
  userId: number
}

export function LikeButton({ memoId, userId }: LikeButtonProps) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([getLikeCount(memoId), isLiked(memoId, userId)])
      .then(([c, l]) => {
        setCount(c)
        setLiked(l)
      })
      .catch(() => {})
  }, [memoId, userId])

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await toggleLike(memoId, userId)
      setLiked(res.liked)
      setCount(res.count)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--muted)]/50 px-3 py-2 text-sm font-medium transition-colors active:opacity-90 disabled:opacity-60"
    >
      <Heart
        className={`h-4 w-4 ${liked ? "fill-[var(--accent-1)] text-[var(--accent-1)]" : "text-[var(--foreground-muted)]"}`}
        strokeWidth={1.75}
      />
      <span className={liked ? "text-[var(--accent-1)]" : "text-[var(--foreground-muted)]"}>
        {count}
      </span>
    </button>
  )
}
