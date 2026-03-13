import { apiGet } from "@/lib/api"

export interface GoalTemplate {
  templateId: number
  category: string
  trackKey: string
  name: string
  description?: string
  targetValue: number
  unit?: string
  points: number
  sortOrder: number
}

export interface GoalProgress {
  templateId: number
  templateName: string
  description?: string
  category: string
  targetValue: number
  unit?: string
  points: number
  currentValue: number
  status: "active" | "completed"
  completedAt?: string
}

export interface UserAchievement {
  achievementId: number
  userId: number
  badgeKey: string
  badgeName: string
  earnedAt: string
}

export async function getGoalTemplates(): Promise<GoalTemplate[]> {
  const data = await apiGet<GoalTemplate[]>("/api/goal/templates")
  return Array.isArray(data) ? data : []
}

export async function getGoalProgress(userId: number): Promise<GoalProgress[]> {
  const data = await apiGet<GoalProgress[]>("/api/goal/progress", { userId })
  return Array.isArray(data) ? data : []
}

export async function getAchievements(userId: number): Promise<UserAchievement[]> {
  const data = await apiGet<UserAchievement[]>("/api/goal/achievements", { userId })
  return Array.isArray(data) ? data : []
}
