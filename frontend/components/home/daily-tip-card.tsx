"use client"

import { Sparkles } from "lucide-react"
import { getWeeklyTip } from "@/lib/pregnancy"
import { getPregnancyInfo } from "@/lib/pregnancy"

interface DailyTipCardProps {
  lastMenstrualDate?: string
  dueDate: string
  customTip?: string
}

export function DailyTipCard({ lastMenstrualDate, dueDate, customTip }: DailyTipCardProps) {
  const info = getPregnancyInfo(lastMenstrualDate ?? dueDate, dueDate)
  const tip = customTip ?? getWeeklyTip(info.weeksPregnant)

  return (
    <div className="glass-card flex items-start gap-3 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--accent-3)]">
        <Sparkles className="h-5 w-5" strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="text-[12px] font-medium text-[var(--accent-3)] whitespace-nowrap">本周小贴士</p>
        <p className="mt-1 text-[15px] leading-relaxed text-[var(--foreground)] whitespace-nowrap overflow-hidden text-ellipsis" title={tip}>
          {tip}
        </p>
      </div>
    </div>
  )
}
