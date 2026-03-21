"use client"

import { Share2 } from "lucide-react"
import { toast } from "sonner"
import { exportDateRangePdf } from "@/lib/api/memo"

interface DateRangeShareProps {
  userId: number
  username: string
  fromDate: string
  toDate: string
  recordsCount: number
}

export function DateRangeShare({ userId, username, fromDate, toDate, recordsCount }: DateRangeShareProps) {
  const handleShare = () => {
    if (recordsCount === 0) {
      toast.error("该日期范围内暂无记录")
      return
    }
    try {
      exportDateRangePdf(userId, username, fromDate, toDate)
      toast.success("正在下载 PDF")
    } catch {
      toast.error("导出失败")
    }
  }

  if (recordsCount === 0) return null

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex shrink-0 items-center gap-2 rounded-xl border border-[var(--accent-1)]/40 bg-[var(--accent-1-muted)] px-4 py-3 text-[14px] font-medium text-[var(--accent-1)] transition-colors active:opacity-90 whitespace-nowrap"
    >
      <Share2 className="h-4 w-4" strokeWidth={1.75} />
      导出日期范围 PDF
    </button>
  )
}
