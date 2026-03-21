"use client"

import { useState, useEffect } from "react"
import { useBack } from "@/lib/use-back"
import Link from "next/link"
import { ArrowLeft, FileText, ChevronRight } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { listArticles, type Article } from "@/lib/api/article"

export default function ArticlesPage() {
  const goBack = useBack("/")
  const { user } = useAuth()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listArticles(user?.userId)
      .then((data) => setArticles(data || []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false))
  }, [user?.userId])

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
        <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-serif)" }}>
          孕期百科
        </h1>
      </div>

      <div className="px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--card)]" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-1-muted)] text-[var(--accent-1)]">
              <FileText className="h-7 w-7" strokeWidth={1.75} />
            </div>
            <p className="mt-4 text-[var(--foreground-muted)]">暂无科普文章</p>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map((a) => (
              <Link
                key={a.articleId}
                href={`/articles/${a.articleId}`}
                className="flex items-center gap-3 glass-card p-4 transition-colors active:bg-[var(--muted)]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-1-muted)] text-[var(--accent-1)]">
                  <FileText className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-medium text-[var(--foreground)] line-clamp-1">{a.title}</h2>
                  {a.summary ? (
                    <p className="mt-0.5 text-xs text-[var(--foreground-muted)] line-clamp-2">{a.summary}</p>
                  ) : null}
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-[var(--foreground-muted)]" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
