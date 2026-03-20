"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { ProgressCircle } from "@/components/home/progress-circle"
import { DailyTipCard } from "@/components/home/daily-tip-card"
import { HealthArchiveCard } from "@/components/home/health-archive-card"
import { VoiceRecordBubble } from "@/components/home/voice-record-bubble"
import { QuickActions } from "@/components/home/quick-actions"
import { RecentRecords } from "@/components/home/recent-records"
import { RecordStats } from "@/components/home/record-stats"
import { ShareCard } from "@/components/home/share-card"
import { useAuth } from "@/lib/auth-context"
import { getAllEnrichedPaged, getFamilyEnriched, type MemoItem } from "@/lib/api/memo"
import { getPregnancyInfo, getWeeklyTip, getDailyWarmth } from "@/lib/pregnancy"
import { toast } from "sonner"
import { format } from "date-fns"

const TrendChart = dynamic(() => import("@/components/home/trend-chart").then((m) => ({ default: m.TrendChart })), { ssr: false })
const WeightChart = dynamic(() => import("@/components/home/weight-chart").then((m) => ({ default: m.WeightChart })), { ssr: false })
const MoodChart = dynamic(() => import("@/components/home/mood-chart").then((m) => ({ default: m.MoodChart })), { ssr: false })
const KickCounter = dynamic(() => import("@/components/home/kick-counter").then((m) => ({ default: m.KickCounter })), { ssr: false })
const MoodPicker = dynamic(() => import("@/components/home/mood-picker").then((m) => ({ default: m.MoodPicker })), { ssr: false })
const ContractionTimer = dynamic(() => import("@/components/home/contraction-timer").then((m) => ({ default: m.ContractionTimer })), { ssr: false })
const GoalWidget = dynamic(() => import("@/components/home/goal-widget").then((m) => ({ default: m.GoalWidget })), { ssr: false })
const TimeCapsule = dynamic(() => import("@/components/home/time-capsule").then((m) => ({ default: m.TimeCapsule })), { ssr: false })
const SpouseEmotionCard = dynamic(() => import("@/components/home/spouse-emotion-card").then((m) => ({ default: m.SpouseEmotionCard })), { ssr: false })
const DAILY_TIP_SHOWN_KEY = "yunqi_daily_tip_shown"
const DAILY_TIPS_KEY = "yunqi_notify_daily_tips"
const RECORD_REMINDER_KEY = "yunqi_notify_record_reminder"
const RECORD_REMINDER_SHOWN_KEY = "yunqi_record_reminder_shown"

export default function HomePage() {
  const { user } = useAuth()
  const [records, setRecords] = useState<MemoItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.userId) return
    setLoading(true)
    const fetchRecords = async () => {
      try {
        const list = user.userType === "family_member"
          ? await getFamilyEnriched(user.userId)
          : await getAllEnrichedPaged(user.userId, 1, 30, user.userId)
        setRecords(list ?? [])
      } catch {
        setRecords([])
      } finally {
        setLoading(false)
      }
    }
    fetchRecords()
  }, [user?.userId, user?.userType])

  useEffect(() => {
    try {
      if (localStorage.getItem(DAILY_TIPS_KEY) === "false") return
      const today = new Date().toDateString()
      if (localStorage.getItem(DAILY_TIP_SHOWN_KEY) === today) return
      if (!user) return
      if (user.userType === "family_member") return
      const dayOfWeek = new Date().getDay()
      const useWarmth = dayOfWeek % 2 === 0
      let message: string
      if (useWarmth) {
        message = getDailyWarmth()
      } else if (user.pregnancyTime) {
        const info = getPregnancyInfo(user.lastMenstrualDate ?? user.pregnancyTime, user.pregnancyTime)
        message = `本周小贴士：${getWeeklyTip(info.weeksPregnant)}`
      } else {
        message = getDailyWarmth()
      }
      toast.info(message, { duration: 5000 })
      localStorage.setItem(DAILY_TIP_SHOWN_KEY, today)
    } catch {
      // ignore
    }
  }, [user])

  useEffect(() => {
    try {
      if (localStorage.getItem(RECORD_REMINDER_KEY) === "false") return
      const today = new Date().toDateString()
      if (localStorage.getItem(RECORD_REMINDER_SHOWN_KEY) === today) return
      if (!user || loading || user.userType === "family_member") return
      const todayStr = format(new Date(), "yyyy-MM-dd")
      const hasRecordToday = records.some((r) => r.createTime?.slice(0, 10) === todayStr)
      if (hasRecordToday) return
      toast.info("今天还没记录哟，要不要写点什么～", { duration: 4000 })
      localStorage.setItem(RECORD_REMINDER_SHOWN_KEY, today)
    } catch {
      // ignore
    }
  }, [user, records, loading])

  if (!user) return null

  const isPregnant = user.userType !== "family_member"

  return (
    <div className="min-h-dvh pb-24">
      <div className="space-y-0 px-5 pb-8">
        {/* Header: 紧凑日期与问候 */}
        <div className="pt-12 pb-4 min-w-0 overflow-hidden">
          <p className="text-[13px] text-[var(--foreground-secondary)] whitespace-nowrap overflow-hidden text-ellipsis" title={new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}>
            {new Date().toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
          </p>
          <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-[var(--foreground)]">
            你好，{user.username}
          </h1>
          <p className="mt-0.5 text-sm text-[var(--foreground-secondary)]">
            {isPregnant ? "今天想记录点什么？" : "查看家人的共享记录"}
          </p>
        </div>

        {/* 爸爸端：妻子情绪趋势 */}
        {!isPregnant && (
          <>
            <div className="section-divider" />
            <section className="py-4">
              <SpouseEmotionCard userId={user.userId} />
            </section>
          </>
        )}

        {/* 中央孕周进度圆环 + 励志文字 — 仅孕妇本人 */}
        {isPregnant && user.pregnancyTime && (
          <>
            <div className="section-divider" />
            <section className="py-4">
              <div className="glass-card p-6">
              <ProgressCircle
                lastMenstrualDate={user.lastMenstrualDate ?? undefined}
                dueDate={user.pregnancyTime}
                motivationalText={`${user.username}，每一天都和宝宝更近一步哦～加油呀`}
              />
              </div>
            </section>
            <div className="section-divider" />

            {/* 本周小贴士 */}
            <section className="py-4">
              <DailyTipCard
                lastMenstrualDate={user.lastMenstrualDate ?? undefined}
                dueDate={user.pregnancyTime}
              />
            </section>
            <div className="section-divider" />

            {/* 健康档案概览 */}
            <section className="py-4">
              <HealthArchiveCard userId={user.userId} />
            </section>
            <div className="section-divider" />

            {/* 语音记录气泡 */}
            <section className="py-4">
              <VoiceRecordBubble />
            </section>
            <div className="section-divider" />
          </>
        )}

        {/* 时光胶囊 — 仅孕妇本人 */}
        {isPregnant && records.length > 0 && (
          <>
            <div className="section-divider" />
            <section className="py-4">
              <TimeCapsule records={records} userId={user.userId} />
            </section>
          </>
        )}

        {/* 孕期小目标 */}
        {isPregnant && (
          <>
            <div className="section-divider" />
            <section className="py-4">
              <GoalWidget userId={user.userId} />
            </section>
          </>
        )}

        {/* 趋势与数据 — 仅孕妇本人 */}
        {isPregnant && (
          <>
            <div className="section-divider" />
            <section className="space-y-4 py-4">
              {records.length > 0 && <RecordStats records={records} />}
              <TrendChart userId={user.userId} />
              <WeightChart userId={user.userId} days={30} />
              <MoodChart userId={user.userId} days={7} />
            </section>
          </>
        )}

        {/* Kick + Mood — 仅孕妇本人（体重记录在健康档案） */}
        {isPregnant && (
          <>
            <div className="section-divider" />
            <section className="space-y-3 py-4">
              <KickCounter userId={user.userId} />
              <MoodPicker userId={user.userId} />
            </section>
          </>
        )}

        {/* 宫缩计时（孕36周+） */}
        {isPregnant && user.pregnancyTime && (
          <>
            <div className="section-divider" />
            <section className="py-4">
              <ContractionTimer
                userId={user.userId}
                lastMenstrualDate={user.lastMenstrualDate ?? undefined}
                dueDate={user.pregnancyTime}
              />
            </section>
          </>
        )}

        {/* 分享卡片 */}
        {isPregnant && user.pregnancyTime && (
          <>
            <div className="section-divider" />
            <section className="py-4">
              <ShareCard
                username={user.username ?? "用户"}
                lastMenstrualDate={user.lastMenstrualDate ?? undefined}
                dueDate={user.pregnancyTime}
              />
            </section>
          </>
        )}

        {/* Quick Actions */}
        <>
          <div className="section-divider" />
          <section className="py-4">
            <h2 className="mb-3 text-[12px] font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
              {isPregnant ? "快捷操作" : "家人共享"}
            </h2>
            <QuickActions isPregnant={isPregnant} />
          </section>
        </>

        {/* Recent Records */}
        <>
          <div className="section-divider" />
          <section className="py-4">
            <h2 className="mb-3 text-[12px] font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
              最近记录
            </h2>
            <RecentRecords records={records} loading={loading} />
          </section>
        </>
      </div>
    </div>
  )
}
