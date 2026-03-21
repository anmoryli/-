import useSWR, { mutate as globalMutate } from "swr"
import { getConversationList, type Conversation } from "@/lib/api/ai"

export function useConversations(userId: number | undefined) {
  return useSWR<Conversation[]>(
    userId ? ["conversations", userId] : null,
    () => getConversationList(userId!),
  )
}

export function mutateConversations(userId: number | undefined) {
  if (!userId) return
  return globalMutate(["conversations", userId])
}
