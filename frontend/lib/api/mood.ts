import { apiGet, apiPost } from "@/lib/api"

export interface MoodRecord {
  id: number
  userId: number
  recordDate: string
  recordTime: string
  mood: string
  createdAt?: string
}

export async function addMoodRecord(params: {
  userId: number
  recordDate?: string
  recordTime?: string
  mood: string
}) {
  return apiPost<MoodRecord>("/api/moodRecord/add", {
    userId: params.userId,
    recordDate: params.recordDate,
    recordTime: params.recordTime,
    mood: params.mood,
  })
}

export async function getMoodRecordHistory(userId: number, days = 7) {
  return apiGet<MoodRecord[]>("/api/moodRecord/history", { userId, days })
}
