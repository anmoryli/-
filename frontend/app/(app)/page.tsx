"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { PregnancyCard } from "@/components/home/pregnancy-card"
import { QuickActions } from "@/components/home/quick-actions"
import { RecentRecords } from "@/components/home/recent-records"
import { RecordStats } from "@/components/home/record-stats"
import { TrendChart } from "@/components/home/trend-chart"
import { WeightChart } from "@/components/home/weight-chart"
import { MoodChart } from "@/components/home/mood-chart"
import { KickCounter } from "@/components/home/kick-counter"
import { MoodPicker } from "@/components/home/mood-picker"
import { WeightRecorder } from "@/components/home/weight-recorder"
import { ContractionTimer } from "@/components/home/contraction-timer"
import { ShareCard } from "@/components/home/share-card"
import { GoalWidget } from "@/components/home/goal-widget"
import { TimeCapsule } from "@/components/home/time-capsule"
import { useAuth } from "@/lib/auth-context"
import { getAllEnriched, getFamilyEnriched, type MemoItem } from "@/lib/api/memo"
import { getPregnancyInfo, getWeeklyTip, getDailyWarmth } from "@/lib/pregnancy"
import { toast } from "sonner"
import { format } from "date-fns"

const DAILY_TIP_SHOWN_KEY = "yunqi_daily_tip_shown"
const DAILY_TIPS_KEY = "yunqi_notify_daily_tips"
const RECORD_REMINDER_KEY = "yunqi_notify_record_reminder"
const RECORD_REMINDER_SHOWN_KEY = "yunqi_record_reminder_shown"

export default function HomePage() {
  const { user } = useAuth()
  const [records, setRecords] = useState<MemoItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    if (user.userType === "family_member") {
      getFamilyEnriched(user.userId)
        .then((data) => setRecords(data || []))
        .catch(() => setRecords([]))
        .finally(() => setLoading(false))
    } else {
      getAllEnriched(user.userId)
        .then((data) => setRecords(data || []))
        .catch(() => setRecords([]))
        .finally(() => setLoading(false))
    }
  }, [user])

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
        message = `本周提示：${getWeeklyTip(info.weeksPregnant)}`
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
    <div className="space-y-8 px-6 pt-14 pb-8" style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem" }}>
      {/* Header: large date + greeting */}
      <div>
        <p className="text-caption">
          {new Date().toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
          })}
        </p>
        <h1
          className="mt-2 text-section text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-serif)", fontSize: "1.35rem" }}
        >
          你好，{user.username}
        </h1>
        <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
          {isPregnant ? "今天想记录点什么？" : "查看家人的共享记录"}
        </p>
      </div>

      {/* Pregnancy Status Card — 仅孕妇本人 */}
      {isPregnant && user.pregnancyTime && (
        <PregnancyCard
          lastMenstrualDate={user.lastMenstrualDate}
          dueDate={user.pregnancyTime}
          userId={user.userId}
        />
      )}

      {/* 时光胶囊：随机掉落小惊喜 — 仅孕妇本人，放在孕期小目标上方 */}
      {isPregnant && records.length > 0 && (
        <section>
          <TimeCapsule records={records} userId={user.userId} />
        </section>
      )}

      {/* 孕期小目标 — 仅孕妇本人 */}
      {isPregnant && (
        <section>
          <GoalWidget userId={user.userId} />
        </section>
      )}

      {/* 记录回顾、本周小结、时光轴、胎动心情趋势与数据可视化 — 仅孕妇本人 */}
      {isPregnant && (
        <section className="space-y-4">
          {records.length > 0 && <RecordStats records={records} />}
          <TrendChart userId={user.userId} />
          <WeightChart userId={user.userId} days={30} />
          <MoodChart userId={user.userId} days={7} />
        </section>
      )}

      {/* Kick + Mood — 仅孕妇本人 */}
      {isPregnant && (
        <section className="flex flex-col gap-4">
          <div className="flex-1">
            <KickCounter userId={user.userId} />
          </div>
          <div className="flex-1">
            <MoodPicker userId={user.userId} />
          </div>
          <div className="flex-1">
            <WeightRecorder userId={user.userId} />
          </div>
        </section>
      )}

      {/* 宫缩计时（孕36周+显示）— 仅孕妇本人 */}
      {isPregnant && user.pregnancyTime && (
        <section>
          <ContractionTimer
            userId={user.userId}
            lastMenstrualDate={user.lastMenstrualDate ?? undefined}
            dueDate={user.pregnancyTime}
          />
        </section>
      )}

      {/* 分享卡片 — 仅孕妇本人 */}
      {isPregnant && user.pregnancyTime && (
        <section>
          <ShareCard
            username={user.username ?? "用户"}
            lastMenstrualDate={user.lastMenstrualDate ?? undefined}
            dueDate={user.pregnancyTime}
          />
        </section>
      )}

      {/* Quick Actions — 仅孕妇本人显示添加入口；家庭成员可查看记录 */}
      <section>
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
          {isPregnant ? "快捷操作" : "家人共享"}
        </h2>
        <QuickActions isPregnant={isPregnant} />
      </section>

      {/* Recent Records — 家庭成员无自己的记录，可前往家人共享 */}
      <section>
        <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
          最近记录
        </h2>
        <RecentRecords records={records} loading={loading} />
      </section>
    </div>
  )
}
