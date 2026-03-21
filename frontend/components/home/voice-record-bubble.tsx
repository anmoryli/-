"use client"

import Link from "next/link"
import { Mic } from "lucide-react"

/**
 * 语音记录气泡 — 可爱头像，无边框
 */
export function VoiceRecordBubble() {
  return (
    <Link href="/records/new?type=voice" className="glass-card flex items-center gap-4 p-4">
      {/* 可爱头像 */}
      <div
        className="h-12 w-12 shrink-0 rounded-full"
        style={{
          background: "linear-gradient(135deg, var(--accent-1-soft) 0%, var(--accent-1) 100%)",
          boxShadow: "0 2px 8px rgba(244, 166, 184, 0.25)",
        }}
      >
        <div className="flex h-full w-full items-center justify-center">
          <Mic className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium text-[var(--foreground)]">录语音</p>
        <p className="mt-0.5 text-[13px] text-[var(--foreground-secondary)]">
          把想说的话说给宝宝听
        </p>
      </div>
      <span className="text-[13px] font-medium text-[var(--accent-1)]">去记录</span>
    </Link>
  )
}
