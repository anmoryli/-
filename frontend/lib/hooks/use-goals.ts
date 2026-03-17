import useSWR from "swr"
import { getGoalProgress, getAchievements, type GoalProgress, type UserAchievement } from "@/lib/api/goal"
import { getHealthValueHistory, getTodayLog, type UserDailyLog } from "@/lib/api/daily"

export function useGoals(userId: number | undefined) {
  return useSWR<{ progress: GoalProgress[]; achievements: UserAchievement[]; healthHistory: Array<{ date: string; healthValue: number }>; todayHealth: number | null }>(
    userId ? ["goals", userId] : null,
    async () => {
      const [progress, achievements, healthHistory, todayLog] = await Promise.all([
        getGoalProgress(userId!),
        getAchievements(userId!),
        getHealthValueHistory(userId!, 14),
        getTodayLog(userId!),
      ])
      return {
        progress,
        achievements,
        healthHistory: healthHistory || [],
        todayHealth: (todayLog as UserDailyLog | null)?.healthValue ?? null,
      }
    },
  )
}
