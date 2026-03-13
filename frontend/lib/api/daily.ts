import { apiGet, apiPost, apiPut } from "@/lib/api"

export interface UserDailyLog {
  logId: number
  userId: number
  recordDate: string
  kickCount: number
  mood: string | null
  weightKg?: number | null
  healthValue?: number | null
  createdAt?: string
  updatedAt?: string
}

export async function getTodayLog(userId: number) {
  return apiGet<UserDailyLog>("/api/dailyLog/today", { userId })
}

export async function incrementKick(userId: number) {
  return apiPut<number>("/api/dailyLog/kick", { userId })
}

export async function updateMood(userId: number, mood: string) {
  return apiPut<UserDailyLog>("/api/dailyLog/mood", { userId, mood })
}

export async function updateWeight(userId: number, weightKg: number) {
  return apiPut<UserDailyLog>("/api/dailyLog/weight", { userId, weightKg })
}

export async function getMoodHistory(userId: number, days = 7) {
  return apiGet<Array<{ date: string; mood: string | null; kickCount: number; weightKg?: number | null; healthValue?: number | null }>>("/api/dailyLog/moodHistory", {
    userId,
    days,
  })
}

/** 行为即时反馈：增加当日健康值（放松练习等完成后调用） */
export async function addHealthPoints(userId: number, points = 5) {
  return apiPost<UserDailyLog>("/api/dailyLog/addHealth", { userId, points })
}

/** 健康值历史，用于图表展示 */
export async function getHealthValueHistory(userId: number, days = 30) {
  return apiGet<Array<{ date: string; healthValue: number }>>("/api/dailyLog/healthHistory", {
    userId,
    days,
  })
}
