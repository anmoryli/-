import { apiGet, apiPostJson } from "@/lib/api"

export interface Scenario {
  scenarioId: number
  title: string
  description?: string
  sortOrder?: number
  openingPromptKey?: string
  endTriggerHint?: string
  createdAt?: string
  updatedAt?: string
}

export interface ScenarioReport {
  reportId: number
  conversationId: number
  scenarioId: number
  spouseUserId: number
  creatorUserId: number
  content: string
  createdAt: string
  /** 列表接口 JOIN 返回 */
  scenarioTitle?: string
}

/** 情景列表（仅配偶） */
export async function getScenarioList(userId: number): Promise<Scenario[]> {
  const list = await apiGet<Scenario[]>("/api/scenario/list", { userId })
  return Array.isArray(list) ? list : []
}

/** 结束情景并生成报告（JSON 请求；后端 AI 有 20s 超时后兜底，前端给 35s 避免先于后端超时） */
export async function endScenario(
  userId: number,
  conversationId: number,
  reason?: string
): Promise<ScenarioReport> {
  const body = { userId, conversationId, reason: reason ?? "" }
  return apiPostJson<ScenarioReport>("/api/scenario/end", body, { timeoutMs: 35000 })
}

/** 情景报告列表（仅配偶） */
export async function getScenarioReports(userId: number): Promise<ScenarioReport[]> {
  const list = await apiGet<ScenarioReport[]>("/api/scenario/reports", { userId })
  return Array.isArray(list) ? list : []
}

/** 情景报告详情 */
export async function getScenarioReportDetail(
  userId: number,
  reportId: number
): Promise<ScenarioReport | null> {
  const data = await apiGet<ScenarioReport>(`/api/scenario/report/${reportId}`, { userId })
  return data ?? null
}
