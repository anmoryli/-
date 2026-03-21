import { apiGet, apiPostJson, apiPut, apiPutJson, apiDeleteWithQuery, toLocalDateTimeISO } from "@/lib/api"
import type { User } from "@/lib/api/user"

const log = (tag: string, ...args: unknown[]) => console.log("[API:admin]", tag, ...args)

export interface AdminArticle {
  articleId: number
  title: string
  summary?: string
  content?: string
  coverUrl?: string
  category?: string
  sortOrder?: number
  isPublished?: boolean
  /** 受众: all=全部, pregnant=孕妇, spouse=配偶 */
  audience?: string
  createdAt?: string
  updatedAt?: string
}

/** 获取所有用户 */
export async function getAllUsers() {
  log("getAllUsers")
  return apiGet<User[]>("/api/admin/getAllUsers")
}

/** 获取用户总数 */
export async function getUserCount() {
  return apiGet<number>("/api/admin/getUserCount")
}

/** 根据用户 ID 获取该用户所有记录 */
export async function getUserRecordsByUserId(userId: number) {
  return apiGet<unknown[]>("/api/admin/getUserRecordsByUserId", { userId })
}

/** 获取文字记录总数 */
export async function getTextCount() {
  return apiGet<number>("/api/admin/getTextCount")
}

/** 获取语音记录总数 */
export async function getVoiceCount() {
  return apiGet<number>("/api/admin/getVoiceCount")
}

/** 获取文件记录总数 */
export async function getFileCount() {
  return apiGet<number>("/api/admin/getFileCount")
}

/** 获取照片记录总数 */
export async function getPhotoCount() {
  return apiGet<number>("/api/admin/getPhotoCount")
}

/** 按类型获取新增用户数（type: day | month | year） */
export async function getNewUserCountByType(type: string) {
  return apiGet<number>("/api/admin/getNewUserCountByType", { type })
}

/** 按时间范围获取用户注册数（start/end 会转为 LocalDateTime 格式发给后端） */
export async function getUserCountByTime(start: string, end: string) {
  return apiGet<number>("/api/admin/getUserCountByTime", {
    start: toLocalDateTimeISO(start) ?? start,
    end: toLocalDateTimeISO(end) ?? end,
  })
}

/** 获取 AI 消息总数 */
export async function getAiMessageCount() {
  return apiGet<number>("/api/admin/getAiMessageCount")
}

/** 管理后台：获取文章列表 */
export async function listAdminArticles() {
  return apiGet<AdminArticle[]>("/api/admin/article/list")
}

/** 管理后台：获取单篇文章 */
export async function getAdminArticle(articleId: number) {
  return apiGet<AdminArticle>("/api/admin/article/get", { articleId })
}

/** 管理后台：新增文章 */
export async function createArticle(article: Partial<AdminArticle>) {
  return apiPostJson<AdminArticle>("/api/admin/article/create", article)
}

/** 管理后台：更新文章 */
export async function updateArticle(article: AdminArticle) {
  return apiPutJson<AdminArticle>("/api/admin/article/update", article)
}

/** 管理后台：删除文章 */
export async function deleteArticle(articleId: number) {
  return apiDeleteWithQuery<boolean>("/api/admin/article/delete", { articleId })
}

/** 管理后台：更新用户 */
export async function updateUser(userId: number, data: { username?: string; email?: string; userType?: string }) {
  const params: Record<string, string | number> = { userId }
  if (data.username !== undefined) params.username = data.username
  if (data.email !== undefined) params.email = data.email
  if (data.userType !== undefined) params.userType = data.userType
  return apiPut<User>("/api/admin/user/update", params)
}

/** 管理后台：删除用户 */
export async function deleteUser(userId: number) {
  const url = `/api/admin/user/${userId}`
  return fetch((process.env.NEXT_PUBLIC_API_BASE_URL || "/api-backend") + url, { method: "DELETE" })
    .then((res) => res.json())
    .then((r: { data?: boolean }) => r.data ?? true)
}
