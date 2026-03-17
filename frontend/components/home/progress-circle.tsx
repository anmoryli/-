"use client"

import { getPregnancyInfo } from "@/lib/pregnancy"
import { BabySizeVisual } from "@/components/home/baby-size-visual"

interface ProgressCircleProps {
  lastMenstrualDate?: string
  dueDate: string
  motivationalText?: string
}

export function ProgressCircle({
  lastMenstrualDate,
  dueDate,
  motivationalText = "每一天都在和宝宝更近一步，加油哦~",
}: ProgressCircleProps) {
  const info = getPregnancyInfo(lastMenstrualDate ?? dueDate, dueDate)
  const progress = Math.min(100, Math.max(0, info.progress))
  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 孕周圆环 + 宝宝大小示意 */}
      <div className="flex items-center gap-6">
      {/* Central progress circle */}
      <div className="relative shrink-0">
        <svg className="h-[140px] w-[140px] -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="rgba(244, 166, 184, 0.2)"
            strokeWidth="8"
          />
          {/* Glowing progress arc */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="progress-glow transition-all duration-700 ease-out"
            style={{
              filter: "drop-shadow(0 0 8px var(--accent-1-glow))",
            }}
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-1)" />
              <stop offset="100%" stopColor="var(--accent-1-soft)" />
            </linearGradient>
          </defs>
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--foreground-muted)]">
            孕周
          </p>
          <p className="mt-0.5 text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {info.weeksPregnant}周{info.daysInCurrentWeek}天
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--accent-1)]">
            {Math.round(progress)}%
          </p>
        </div>
      </div>
      <BabySizeVisual weeksPregnant={info.weeksPregnant} />
      </div>

      {/* 温暖手写风励志文字 */}
      <p
        className="max-w-[300px] text-center text-[15px] leading-relaxed text-[var(--foreground-secondary)]"
        style={{ fontFamily: "var(--font-handwritten)" }}
      >
        {motivationalText}
      </p>
    </div>
  )
}
