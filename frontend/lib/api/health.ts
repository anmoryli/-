import { apiGet, apiPost } from "@/lib/api"

export interface PregnancyWeightRecord {
  id?: number
  userId: number
  recordDate: string // yyyy-MM-dd
  gestationWeek?: number | null
  weightKg: number
  note?: string | null
}

export interface FetalUltrasoundRecord {
  id?: number
  userId: number
  recordDate: string // yyyy-MM-dd
  gestationWeek?: number | null
  bpdMm?: number | null
  hcMm?: number | null
  acMm?: number | null
  flMm?: number | null
  efwG?: number | null
  note?: string | null
}

export async function addWeightRecord(params: {
  userId: number
  recordDate?: string
  gestationWeek?: number
  weightKg: number
  note?: string
}) {
  return apiPost<PregnancyWeightRecord>("/api/health/weightRecords", {
    userId: params.userId,
    recordDate: params.recordDate,
    gestationWeek: params.gestationWeek,
    weightKg: params.weightKg,
    note: params.note,
  })
}

export async function listWeightRecords(userId: number) {
  return apiGet<Array<Record<string, unknown>>>("/api/health/weightRecords", { userId })
}

export async function addFetalRecord(params: {
  userId: number
  recordDate?: string
  gestationWeek?: number
  bpdMm?: number
  hcMm?: number
  acMm?: number
  flMm?: number
  efwG?: number
  note?: string
}) {
  return apiPost<FetalUltrasoundRecord>("/api/health/fetalRecords", {
    userId: params.userId,
    recordDate: params.recordDate,
    gestationWeek: params.gestationWeek,
    bpdMm: params.bpdMm,
    hcMm: params.hcMm,
    acMm: params.acMm,
    flMm: params.flMm,
    efwG: params.efwG,
    note: params.note,
  })
}

export async function listFetalRecords(userId: number) {
  return apiGet<Array<Record<string, unknown>>>("/api/health/fetalRecords", { userId })
}

export async function getHealthSummary(userId: number) {
  return apiGet<Record<string, unknown>>("/api/health/summary", { userId })
}

export interface HealthAnalysisRecord {
  id: number
  userId: number
  recordType: "weight" | "fetal"
  recordId: number
  gestationWeek: number | null
  analysisText: string
  createdAt: string
}

export async function getAnalysisHistory(userId: number, limit = 20) {
  return apiGet<HealthAnalysisRecord[]>("/api/health/analysisHistory", { userId, limit })
}

export async function getAnalysisByRecord(userId: number, recordType: "weight" | "fetal", recordId: number) {
  return apiGet<HealthAnalysisRecord | null>("/api/health/analysisByRecord", { userId, recordType, recordId })
}

