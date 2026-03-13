import { apiGet, apiPost, apiPut } from "@/lib/api"

export interface FamilyTaskItem {
  id: number
  familyId: number
  assigneeUserId: number
  title: string
  description: string | null
  taskType: string
  pregnancyWeek: number | null
  dueDate: string | null
  status: string
  completedAt: string | null
  createdAt: string
}

export async function getMyTasks(userId: number) {
  return apiGet<FamilyTaskItem[]>("/api/family/tasks/my", { userId })
}

/** 家庭维度任务列表（创建者用，展示「我分配的任务」） */
export async function getFamilyTasks(familyId: number, userId: number) {
  return apiGet<FamilyTaskItem[]>("/api/family/tasks/family", { familyId, userId })
}

export async function completeTask(userId: number, taskId: number) {
  return apiPut<FamilyTaskItem>("/api/family/tasks/complete", { userId, taskId })
}

export async function generateTasksForWeek(userId: number) {
  return apiPost<FamilyTaskItem[]>("/api/family/tasks/generateForWeek", { userId })
}

export async function createTask(
  userId: number,
  familyId: number,
  assigneeUserId: number,
  title: string,
  description?: string,
  taskType = "routine"
) {
  const params: Record<string, string | number> = {
    userId,
    familyId,
    assigneeUserId,
    title,
    taskType,
  }
  if (description) params.description = description
  return apiPost<FamilyTaskItem>("/api/family/tasks/create", params)
}

/** AI 生成本周任务建议（不落库），返回 { title, description }[] */
export async function suggestTasks(userId: number): Promise<Array<{ title: string; description: string }>> {
  const data = await apiGet<Array<{ title: string; description: string }>>("/api/family/tasks/suggest", { userId })
  return Array.isArray(data) ? data : []
}
