import { apiGet, apiUpload } from "@/lib/api"

export interface CheckReportItem {
  reportId: number
  userId: number
  fileUrl: string
  originalFilename?: string
  parsedSummary?: string
  nextCheckDate?: string
  emailSent?: boolean
  sendStatus?: string
  retryCount?: number
  createdAt?: string
  updatedAt?: string
}

export async function uploadCheckReport(userId: number, file: File, extraText?: string) {
  return apiUpload<CheckReportItem>("/api/check-report/upload", { key: "file", file }, { userId, extraText })
}

export async function listCheckReports(userId: number) {
  return apiGet<CheckReportItem[]>("/api/check-report/list", { userId })
}

