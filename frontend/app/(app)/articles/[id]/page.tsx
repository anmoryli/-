"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useBack } from "@/lib/use-back"
import { ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getArticle, type Article } from "@/lib/api/article"
import { MarkdownView } from "@/components/markdown-view"

export default function ArticleDetailPage() {
  const params = useParams()
  const goBack = useBack("/articles")
  const { user } = useAuth()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  const id = typeof params?.id === "string" ? parseInt(params.id, 10) : null

  useEffect(() => {
    if (id == null || isNaN(id)) {
      setLoading(false)
      return
    }
    getArticle(id)
      .then(setArticle)
      .catch(() => setArticle(null))
      .finally(() => setLoading(false))
  }, [id])

  if (!user) return null

  return (
    <div className="min-h-dvh">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-[var(--card-border)] bg-[var(--card)]/98 px-4 py-4 backdrop-blur-sm">
        <button
          onClick={() => goBack()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--muted)] transition-colors active:bg-[var(--card)]"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold line-clamp-1" style={{ fontFamily: "var(--font-serif)" }}>
          {article?.title ?? "文章"}
        </h1>
      </div>

      <div className="px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            <div className="h-6 w-3/4 animate-pulse rounded bg-[var(--muted)]" />
            <div className="h-4 animate-pulse rounded bg-[var(--muted)]" />
            <div className="h-4 w-1/2 max-w-[50%] animate-pulse rounded bg-[var(--muted)]" />
          </div>
        ) : !article ? (
          <p className="text-[var(--foreground-muted)]">文章不存在</p>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {article.coverUrl ? (
              <img
                src={article.coverUrl}
                loading="lazy"
                alt=""
                className="mb-4 w-full rounded-xl object-cover"
              />
            ) : null}
            <MarkdownView content={article.content ?? ""} />
          </div>
        )}
      </div>
    </div>
  )
}
