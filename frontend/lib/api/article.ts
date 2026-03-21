import { apiGet } from "@/lib/api"

export interface Article {
  articleId: number
  title: string
  summary?: string
  content?: string
  coverUrl?: string
  category?: string
  sortOrder?: number
  isPublished?: boolean
  createdAt?: string
  updatedAt?: string
}

export function listArticles(userId?: number) {
  const params: Record<string, string> = {}
  if (userId != null) params.userId = String(userId)
  return apiGet<Article[]>("/api/article/list", Object.keys(params).length ? params : undefined)
}

export function getArticle(articleId: number) {
  return apiGet<Article>(`/api/article/${articleId}`)
}
