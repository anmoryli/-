import { apiDelete, apiGet, apiPost, apiPut, apiUpload } from "@/lib/api"

export interface AiTemplateItem {
  templateId: number
  userId: number
  title: string
  promptText: string
  category?: string
  isPublic: boolean
  usageCount: number
}

export interface CommunityPostWrap {
  post: {
    postId: number
    userId: number
    templateId?: number
    inputImageUrl: string
    outputImageUrl: string
    promptText: string
    isPublic: boolean
    createdAt?: string
  }
  authorName: string
}

export interface CommunityPostComment {
  commentId: number
  postId: number
  parentCommentId?: number | null
  userId: number
  username: string
  /** 孕妇 | 家庭成员 */
  userType?: string
  content: string
  createdAt: string
  updatedAt?: string
  likeCount?: number
  isLiked?: boolean
}

export function listPublicTemplates() {
  return apiGet<AiTemplateItem[]>("/api/ai/community/templates/public")
}

export function listMyTemplates(userId: number) {
  return apiGet<AiTemplateItem[]>("/api/ai/community/templates/mine", { userId })
}

export function listPublicLatestPosts(page = 1, pageSize = 20) {
  return apiGet<CommunityPostWrap[]>("/api/ai/community/posts/public/latest", { page, pageSize })
}

export function listPublicRecommendedPosts(page = 1, pageSize = 20) {
  return apiGet<CommunityPostWrap[]>("/api/ai/community/posts/public/recommended", { page, pageSize })
}

export function listMyPosts(userId: number) {
  return apiGet<CommunityPostWrap[]>("/api/ai/community/posts/mine", { userId })
}

export function togglePostPublic(userId: number, postId: number, isPublic: boolean) {
  return apiPost<boolean>("/api/ai/community/posts/toggle-public", { userId, postId, isPublic: isPublic ? "true" : "false" })
}

export function getPostLikeCount(postId: number) {
  return apiGet<number>("/api/ai/community/post/like/count", { postId })
}

export function getPostLikeStatus(postId: number, userId: number) {
  return apiGet<boolean>("/api/ai/community/post/like/status", { postId, userId })
}

export function togglePostLike(postId: number, userId: number) {
  return apiPost<{ liked: boolean; count: number }>("/api/ai/community/post/like/toggle", { postId, userId })
}

export function getPostComments(postId: number, requestUserId?: number) {
  return apiGet<CommunityPostComment[]>("/api/ai/community/post/comments", { postId, requestUserId })
}

export function addPostComment(postId: number, userId: number, content: string, parentCommentId?: number) {
  return apiPost<CommunityPostComment>("/api/ai/community/post/comment", { postId, userId, content, parentCommentId })
}

export function toggleCommentLike(commentId: number, userId: number) {
  return apiPost<{ liked: boolean; count: number }>("/api/ai/community/post/comment/like/toggle", { commentId, userId })
}

export function updatePostComment(commentId: number, userId: number, content: string) {
  return apiPut<boolean>("/api/ai/community/post/comment", { commentId, userId, content })
}

export function deletePostComment(commentId: number, userId: number) {
  return apiDelete<boolean>("/api/ai/community/post/comment", { commentId, userId })
}

export async function communityImageToImage(params: {
  userId: number
  image: File
  templateId?: number
  prompt?: string
  publishPost?: boolean
  publishTemplate?: boolean
  templateTitle?: string
  category?: string
}) {
  return apiUpload<{
    postId: number
    templateId?: number
    inputImageUrl: string
    outputImageUrl: string
    isPublic: boolean
  }>(
    "/api/ai/community/image-to-image",
    { key: "image", file: params.image },
    {
      userId: params.userId,
      templateId: params.templateId,
      prompt: params.prompt,
      publishPost: params.publishPost ? "true" : "false",
      publishTemplate: params.publishTemplate ? "true" : "false",
      templateTitle: params.templateTitle,
      category: params.category,
    }
  )
}

