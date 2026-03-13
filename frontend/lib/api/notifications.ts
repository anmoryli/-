import { apiGet, apiPost, apiPut } from "@/lib/api"

export interface UserNotification {
  id: number
  userId: number
  type: string
  title: string
  body: string | null
  relatedTaskId: number | null
  readAt: string | null
  createdAt: string
}

export async function getNotificationList(userId: number, limit = 50) {
  return apiGet<UserNotification[]>("/api/notifications/list", { userId, limit })
}

export async function getUnreadCount(userId: number) {
  return apiGet<number>("/api/notifications/unreadCount", { userId })
}

export async function markNotificationRead(userId: number, notificationId: number) {
  return apiPut<void>("/api/notifications/markRead", { userId, notificationId })
}

export async function markAllNotificationsRead(userId: number) {
  return apiPut<void>("/api/notifications/markAllRead", { userId })
}

export async function remindNoSpouse(userId: number) {
  return apiPost<void>("/api/notifications/remindNoSpouse", { userId })
}
