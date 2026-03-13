"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** 时光轴已合并到记录页，重定向至 /records */
export default function TimelinePage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/records")
  }, [router])
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent-1)]/30 border-t-[var(--accent-1)]" />
    </div>
  )
}
