import useSWR from "swr"
import { getUnreadCount } from "@/lib/api/notifications"

export function useUnreadCount(userId: number | undefined) {
  return useSWR<number>(
    userId ? ["unread-count", userId] : null,
    () => getUnreadCount(userId!),
    {
      refreshInterval: 30000,
    },
  )
}
