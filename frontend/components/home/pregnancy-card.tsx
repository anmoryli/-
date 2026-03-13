"use client"

import { useState, useEffect } from "react"
import {
  getPregnancyInfo,
  getBabySize,
  getWeeklyTip as getStaticTip,
  getCountdownMessage,
} from "@/lib/pregnancy"
import { getWeeklyTip as getAiTip } from "@/lib/api/ai"
import { Calendar, Heart, Leaf } from "lucide-react"

interface PregnancyCardProps {
  lastMenstrualDate?: string
  dueDate: string
  userId?: number
}

export function PregnancyCard({ lastMenstrualDate, dueDate, userId }: PregnancyCardProps) {
  const info = getPregnancyInfo(lastMenstrualDate ?? dueDate, dueDate)
  const babySize = getBabySize(info.weeksPregnant)
  const countdownMsg = getCountdownMessage(info.daysRemaining)
  const [tip, setTip] = useState(getStaticTip(info.weeksPregnant))

  useEffect(() => {
    if (userId && info.weeksPregnant >= 4) {
      getAiTip(userId, info.weeksPregnant)
        .then((t) => t && setTip(t))
        .catch(() => {})
    }
  }, [userId, info.weeksPregnant])

  return (
    <div className="card-elevated overflow-hidden p-6">
      {/* Hero: gestational week + day — serif display */}
      <div className="text-center">
        <p className="font-sans text-[12px] font-medium uppercase tracking-widest text-[var(--foreground-muted)]">
          孕周
        </p>
        <p
          className="font-display mt-1 text-hero text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {info.weeksPregnant}周{info.daysInCurrentWeek}天
        </p>
      </div>

      {/* Progress: slim bar, gradient */}
      <div className="mt-5">
        <div className="flex justify-between text-[12px] text-[var(--foreground-secondary)]">
          <span>孕期进度</span>
          <span className="font-semibold text-[var(--foreground)]">
            {Math.round(info.progress)}%
          </span>
        </div>
        <div className="progress-premium mt-1.5">
          <div
            className="progress-premium-fill"
            style={{ width: `${Math.min(info.progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Four stat pills */}
      <div className="mt-5 grid grid-cols-4 gap-2">
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--muted)]/50 px-2.5 py-3 text-center">
          <Calendar className="mx-auto h-4 w-4 text-[var(--foreground-muted)]" strokeWidth={1.5} />
          <p className="text-micro mt-1">预产期</p>
          <p className="mt-0.5 font-semibold text-[var(--foreground)]">
            {info.daysRemaining}天
          </p>
          <p className="mt-0.5 text-micro text-[var(--accent-1)]">{countdownMsg}</p>
        </div>
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--muted)]/50 px-2.5 py-3 text-center">
          <Leaf className="mx-auto h-4 w-4 text-[var(--accent-3)]" strokeWidth={1.5} />
          <p className="text-micro mt-1">宝宝大小</p>
          <p className="mt-0.5 font-semibold text-[var(--foreground)] truncate" title={`宝宝现在和${babySize.name}差不多大`}>
            {babySize.name}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--muted)]/50 px-2.5 py-3 text-center">
          <span className="inline-block text-lg font-semibold text-[var(--foreground-muted)]">
            {info.trimester}
          </span>
          <p className="text-micro mt-1">孕期</p>
          <p className="mt-0.5 font-semibold text-[var(--foreground)]">
            第{info.trimester}期
          </p>
        </div>
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--muted)]/50 px-2.5 py-3 text-center">
          <Heart className="mx-auto h-4 w-4 text-[var(--accent-1)]" strokeWidth={1.5} />
          <p className="text-micro mt-1">已过</p>
          <p className="mt-0.5 font-semibold text-[var(--foreground)]">
            {info.daysPassed}天
          </p>
        </div>
      </div>

      {/* Weekly tip: soft bordered box, sage accent */}
      <div
        className="mt-4 rounded-lg border px-3.5 py-2.5"
        style={{
          borderColor: "var(--accent-3-muted)",
          backgroundColor: "var(--accent-3-muted)",
        }}
      >
        <p className="text-caption leading-relaxed text-[var(--foreground)]">
          <span className="font-medium text-[var(--accent-3)]">本周提示</span>
          <span className="ml-1.5">{tip}</span>
        </p>
      </div>
    </div>
  )
}
