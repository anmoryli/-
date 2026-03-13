"use client"

import Link from "next/link"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { PenLine, Image, Mic, FileText, ChevronRight } from "lucide-react"
import type { MemoItem } from "@/lib/api/memo"
import { cn } from "@/lib/utils"

interface RecentRecordsProps {
  records: MemoItem[]
  loading?: boolean
}

const typeLabels: Record<string, string> = {
  text: "文字",
  photo: "照片",
  voice: "语音",
  file: "文件",
}

function RecordIcon({ type }: { type: string }) {
  const iconClass = "h-4 w-4 stroke-[1.75]"
  switch (type) {
    case "photo":
      return <Image className={iconClass} />
    case "voice":
      return <Mic className={iconClass} />
    case "file":
      return <FileText className={iconClass} />
    default:
      return <PenLine className={iconClass} />
  }
}

function getRecordIconStyle(type: string) {
  switch (type) {
    case "photo":
      return "border-[var(--accent-3)]/30 bg-[var(--accent-3-muted)] text-[var(--accent-3)]"
    case "voice":
      return "border-[var(--accent-2)]/30 bg-[var(--accent-2-muted)] text-[var(--accent-2)]"
    case "file":
      return "border-[var(--foreground-muted)]/20 bg-[var(--muted)] text-[var(--foreground-secondary)]"
    default:
      return "border-[var(--accent-1)]/30 bg-[var(--accent-1-muted)] text-[var(--accent-1)]"
  }
}

function getRecordTitle(record: MemoItem): string {
  return record.title || record.photoDescription || typeLabels[record.type] || "记录"
}

function getRecordContent(record: MemoItem): string {
  if (record.content) return record.content
  if (record.photoDescription) return record.photoDescription
  return typeLabels[record.type] || ""
}

export function RecentRecords({ records, loading }: RecentRecordsProps) {
  if (loading) {
    return (
      <div className="card-elevated overflow-hidden rounded-xl">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[72px] animate-pulse border-b border-[var(--card-border)] bg-[var(--card)] last:border-b-0"
          />
        ))}
      </div>
    )
  }

  const recentRecords = records.slice(0, 3)

  if (recentRecords.length === 0) {
    return (
      <div className="card-elevated rounded-xl p-8 text-center">
        <p className="text-caption text-[var(--foreground-secondary)]">
          还没有记录，去写第一篇吧
        </p>
      </div>
    )
  }

  return (
    <div className="card-elevated overflow-hidden rounded-xl">
      {recentRecords.map((record, idx) => (
        <Link
          key={record.id || idx}
          href={`/records/${record.id}`}
          className="flex items-start gap-3 p-4 transition-colors active:bg-[var(--muted)]/50"
        >
          <div
            className={cn(
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
              getRecordIconStyle(record.type)
            )}
          >
            <RecordIcon type={record.type} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-micro rounded-md bg-[var(--muted)] px-1.5 py-0.5">
              {typeLabels[record.type] || "记录"}
            </span>
            <p className="mt-1.5 line-clamp-1 text-[15px] font-medium text-[var(--foreground)]">
              {getRecordTitle(record)}
            </p>
            <p className="mt-0.5 line-clamp-1 text-caption">
              {getRecordContent(record)}
            </p>
            {record.createTime && (
              <p className="mt-1.5 text-micro">
                {format(new Date(record.createTime), "M月d日 HH:mm", { locale: zhCN })}
              </p>
            )}
          </div>
          <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-[var(--foreground-muted)]" strokeWidth={1.5} />
        </Link>
      ))}
      <Link
        href="/records"
        className="flex items-center justify-center gap-1.5 py-3.5 text-[14px] font-medium text-[var(--accent-1)] transition-colors active:bg-[var(--muted)]/50"
      >
        查看全部记录
        <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
      </Link>
    </div>
  )
}
