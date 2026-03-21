import { apiGet, apiPost, apiDelete } from "@/lib/api"

export interface ContractionRecord {
  contractionId: number
  userId: number
  startedAt: string
  durationSeconds: number
  createdAt?: string
}

export async function addContraction(userId: number, startedAt: string, durationSeconds: number) {
  return apiPost<ContractionRecord>("/api/contraction/add", { userId, startedAt, durationSeconds })
}

export async function getContractionsByDate(userId: number, date: string) {
  return apiGet<ContractionRecord[]>("/api/contraction/list", { userId, date })
}

export async function clearContractionsByDate(userId: number, date: string) {
  return apiDelete<void>("/api/contraction/clear", { userId, date })
}
