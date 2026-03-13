"use client"

import Link from "next/link"
import { PenLine, Image, Mic, FileText, Clock, FileEdit } from "lucide-react"

const WEEKLY_SUMMARY_PROMPT =
  "请根据我在孕期宝的记录，帮我写一段温馨的本周小结。请总结：这周的记录亮点、心情变化、重要时刻（如胎动、产检等），用温暖细腻的笔触，像一位闺蜜在回味这周的时光。字数适中，适合保存留念。"
import type { MemoItem } from "@/lib/api/memo"

interface RecordStatsProps {
  records: MemoItem[]
}

export function RecordStats({ records }: RecordStatsProps) {
  if (!records || records.length === 0) return null

  const textCount = records.filter((r) => r.type === "text").length
  const photoCount = records.filter((r) => r.type === "photo").length
  const voiceCount = records.filter((r) => r.type === "voice").length
  const fileCount = records.filter((r) => r.type === "file").length
  const photoTotal = records
    .filter((r) => r.type === "photo" && r.photoUrls)
    .reduce((sum, r) => sum + (r.photoUrls?.length ?? 0), 0)
  const recordDays = new Set(records.map((r) => r.createTime?.slice(0, 10)).filter(Boolean)).size

  const stats = [
    { label: "记录天数", value: recordDays, suffix: "天", icon: PenLine },
    { label: "文字", value: textCount, icon: PenLine },
    { label: "照片", value: photoTotal, suffix: "张", icon: Image },
    { label: "语音", value: voiceCount, icon: Mic },
    { label: "文件", value: fileCount, icon: FileText },
  ]

  return (
    <div className="card-elevated overflow-hidden rounded-xl p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-micro font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
          记录回顾
        </p>
        <div className="flex items-center gap-3">
          <Link
            href={`/chat?q=${encodeURIComponent(WEEKLY_SUMMARY_PROMPT)}&_n=${Date.now()}`}
            className="flex items-center gap-1 text-[12px] font-medium text-[var(--accent-2)]"
          >
            <FileEdit className="h-3.5 w-3.5" strokeWidth={1.75} />
            本周小结
          </Link>
          <Link
            href="/records"
            className="flex items-center gap-1 text-[12px] font-medium text-[var(--accent-1)]"
          >
            <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
            时光轴
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--muted)]/50 px-3 py-2"
            >
              <Icon className="h-4 w-4 text-[var(--foreground-muted)]" strokeWidth={1.5} />
              <span className="text-caption text-[var(--foreground-secondary)]">{s.label}</span>
              <span className="font-semibold text-[var(--foreground)]">
                {s.value}
                {s.suffix ?? ""}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
