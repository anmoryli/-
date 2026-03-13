import { apiGet, apiPost, apiDelete } from "@/lib/api"

export interface Comment {
  commentId: number
  parentCommentId?: number | null
  userId: number
  username: string
  /** 孕妇 | 家庭成员，用于展示评论者身份 */
  userType?: string
  content: string
  createdAt: string
  /** 回复列表（仅根评论有） */
  replies?: Comment[]
}

export async function getComments(memoId: number, userId: number): Promise<Comment[]> {
  const data = await apiGet<Comment[]>("/api/record-interaction/comments", {
    memoId,
    userId,
  })
  return Array.isArray(data) ? data : []
}

export async function addComment(
  memoId: number,
  userId: number,
  content: string,
  parentCommentId?: number | null
): Promise<{ commentId: number } | null> {
  const params: Record<string, unknown> = { memoId, userId, content }
  if (parentCommentId != null) params.parentCommentId = parentCommentId
  const data = await apiPost<{ commentId: number }>("/api/record-interaction/comment", params)
  return data
}

export async function deleteComment(
  commentId: number,
  userId: number
): Promise<boolean> {
  const data = await apiDelete<boolean>("/api/record-interaction/comment", {
    commentId,
    userId,
  })
  return !!data
}

export async function getLikeCount(memoId: number): Promise<number> {
  const data = await apiGet<number>("/api/record-interaction/like/count", {
    memoId,
  })
  return typeof data === "number" ? data : 0
}

export async function isLiked(memoId: number, userId: number): Promise<boolean> {
  const data = await apiGet<boolean>("/api/record-interaction/like/status", {
    memoId,
    userId,
  })
  return !!data
}

export async function toggleLike(
  memoId: number,
  userId: number
): Promise<{ liked: boolean; count: number }> {
  const data = await apiPost<{ liked: boolean; count: number }>(
    "/api/record-interaction/like/toggle",
    { memoId, userId }
  )
  return data ?? { liked: false, count: 0 }
}
