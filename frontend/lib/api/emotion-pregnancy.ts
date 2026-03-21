import { apiGet } from "@/lib/api"

export interface EmotionWeekDto {
  pregnancyWeekIndex: number
  weekLabel: string
  moodDistribution: Record<string, number> | null
  recordCount: number
  avgWeightKg?: number | null
  weightInRange?: boolean | null
}

export interface EmotionPregnancySummaryDto {
  weeks: EmotionWeekDto[]
  warmSentence: string
  weightInRangeHint: string | null
}

export interface SpouseEmotionSummaryDto {
  trend: "stable" | "fluctuating" | "need_support"
  lastWeeks: string[]
  suggestedAction: string
}

export async function getEmotionPregnancySummary(userId: number): Promise<EmotionPregnancySummaryDto> {
  return apiGet<EmotionPregnancySummaryDto>("/api/emotionPregnancy/summary", { userId })
}

export async function getSpouseEmotionSummary(requestUserId: number): Promise<SpouseEmotionSummaryDto> {
  return apiGet<SpouseEmotionSummaryDto>("/api/emotionPregnancy/spouseSummary", {
    requestUserId,
  })
}

/** 情绪孕周每日一句（0 点刷新，≤30 字） */
export async function getEmotionPregnancyDailyHint(userId: number): Promise<string> {
  const data = await apiGet<string>("/api/emotionPregnancy/dailyHint", { userId })
  return typeof data === "string" ? data : ""
}
