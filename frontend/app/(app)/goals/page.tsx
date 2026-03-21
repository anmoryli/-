"use client"

import { useEffect, useState } from "react"
import { useBack } from "@/lib/use-back"
import { ArrowLeft, Target, Award, TrendingUp } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getGoalProgress, getAchievements, type GoalProgress, type UserAchievement } from "@/lib/api/goal"
import { getHealthValueHistory, getTodayLog, type UserDailyLog } from "@/lib/api/daily"

export default function GoalsPage() {
  const goBack = useBack("/")
  const { user } = useAuth()
  const [progress, setProgress] = useState<GoalProgress[]>([])
  const [achievements, setAchievements] = useState<UserAchievement[]>([])
  const [healthHistory, setHealthHistory] = useState<Array<{ date: string; healthValue: number }>>([])
  const [todayHealth, setTodayHealth] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.userId) return
    setLoading(true)
    Promise.all([
      getGoalProgress(user.userId),
      getAchievements(user.userId),
      getHealthValueHistory(user.userId, 14),
      getTodayLog(user.userId),
    ])
      .then(([p, a, hh, today]) => {
        setProgress(p ?? [])
        setAchievements(a ?? [])
        setHealthHistory(hh ?? [])
        setTodayHealth((today as UserDailyLog | null)?.healthValue ?? null)
      })
      .catch(() => {
        setProgress([])
        setAchievements([])
        setHealthHistory([])
        setTodayHealth(null)
      })
      .finally(() => setLoading(false))
  }, [user?.userId])

  if (!user) return null

  const activeList = progress.filter((p) => p.status === "active")
  const completedList = progress.filter((p) => p.status === "completed")

  return (
    <div className="min-h-dvh pb-8">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/40 px-4 py-4" style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(24px) saturate(1.3)", WebkitBackdropFilter: "blur(24px) saturate(1.3)" }}>
        <button
          onClick={() => goBack()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--muted)] transition-colors active:bg-[var(--muted)]/80"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <h1 className="text-lg font-semibold text-[var(--foreground)]">孕期小目标</h1>
      </div>

      <div className="space-y-6 px-4 pt-6">
        {/* 健康值成长 */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            <TrendingUp className="h-4 w-4" strokeWidth={1.75} />
            健康值成长
          </h2>
          <div className="glass-card p-4">
            {todayHealth !== null && (
              <p className="mb-3 text-sm text-[var(--foreground-muted)]">
                今日健康值：<span className="font-medium text-[var(--accent-1)]">{todayHealth}</span> / 100（完成胎动、情绪、放松等即可增加）
              </p>
            )}
            {healthHistory.length === 0 ? (
              <p className="py-4 text-center text-sm text-[var(--foreground-muted)]">
                完成记录、胎动、情绪或放松练习后，健康值会在这里展示
              </p>
            ) : (
              <div className="flex items-end justify-between gap-1" style={{ minHeight: 80 }}>
                {healthHistory.slice().reverse().map((d) => (
                  <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full max-w-[20px] rounded-t transition-all"
                      style={{
                        height: Math.max(4, (d.healthValue / 100) * 56),
                        backgroundColor: "var(--accent-1)",
                        opacity: 0.85,
                      }}
                      title={`${d.date}: ${d.healthValue}`}
                    />
                    <span className="text-[10px] text-[var(--foreground-muted)]">
                      {d.date.slice(5).replace("-", "/")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 成就勋章 */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            <Award className="h-4 w-4" strokeWidth={1.75} />
            成就勋章
          </h2>
          <div className="glass-card overflow-hidden">
            {achievements.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--foreground-muted)]">
                完成目标即可解锁勋章
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-px bg-[var(--card-border)] sm:grid-cols-3">
                {achievements.map((a) => (
                  <div
                    key={a.achievementId}
                    className="flex flex-col items-center gap-2 bg-white/40 px-4 py-5"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--accent-1)]/50 bg-[var(--accent-1-muted)]">
                      <Award className="h-7 w-7 text-[var(--accent-1)]" strokeWidth={1.5} />
                    </div>
                    <p className="text-center text-sm font-medium text-[var(--foreground)]">
                      {a.badgeName}
                    </p>
                    <p className="text-micro text-[var(--foreground-muted)]">
                      {a.earnedAt ? new Date(a.earnedAt).toLocaleDateString("zh-CN") : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 进行中 */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            <Target className="h-4 w-4" strokeWidth={1.75} />
            进行中
          </h2>
          <div className="space-y-2">
            {loading ? (
              <div className="glass-card p-6 text-center text-sm text-[var(--foreground-muted)]">
                加载中...
              </div>
            ) : activeList.length === 0 ? (
              <p className="glass-card px-4 py-8 text-center text-sm text-[var(--foreground-muted)]">
                暂无进行中的目标，去记录吧～
              </p>
            ) : (
              activeList.map((p) => (
                <div
                  key={p.templateId}
                  className="glass-card overflow-hidden p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{p.templateName}</p>
                      {p.description && (
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                          {p.description}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full bg-[var(--accent-1-muted)] px-3 py-1 text-sm font-medium text-[var(--accent-1)]">
                      {p.currentValue}/{p.targetValue}
                      {p.unit ?? ""}
                    </span>
                  </div>
                  <div className="progress-premium mt-3">
                    <div
                      className="progress-premium-fill"
                      style={{
                        width: `${Math.min(100, (p.currentValue / p.targetValue) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 已完成 */}
        {completedList.length > 0 && (
          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
              已完成
            </h2>
            <div className="space-y-2">
              {completedList.map((p) => (
                <div
                  key={p.templateId}
                  className="flex items-center justify-between rounded-2xl border border-[var(--card-border)] bg-[var(--card-solid)] px-4 py-4"
                >
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{p.templateName}</p>
                    {p.completedAt && (
                      <p className="mt-0.5 text-micro text-[var(--foreground-muted)]">
                        {new Date(p.completedAt).toLocaleDateString("zh-CN")} 完成
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-[var(--accent-1-muted)] px-3 py-1 text-sm font-medium text-[var(--accent-1)]">
                    已完成
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
