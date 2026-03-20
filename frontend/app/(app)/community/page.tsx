"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import {
  listPublicRecommendedPosts,
  type CommunityPostWrap,
} from "@/lib/api/ai-community"
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll"
import { Sparkles, Loader2 } from "lucide-react"
import { getCommunityEnabled } from "@/lib/api/user"
import { HealthHome } from "@/app/(app)/health/health-home"

export default function CommunityPage() {
  const { user } = useAuth()
  const [communityEnabled, setCommunityEnabled] = useState(false)
  const [tab, setTab] = useState<"health" | "community">("health")

  useEffect(() => {
    if (!user?.userId) return
    getCommunityEnabled(user.userId)
      .then((v) => setCommunityEnabled(v ?? false))
      .catch(() => setCommunityEnabled(false))
  }, [user?.userId])

  useEffect(() => {
    if (!communityEnabled) setTab("health")
  }, [communityEnabled])

  const fetchPage = useCallback(
    (page: number, pageSize: number) => listPublicRecommendedPosts(page, pageSize),
    []
  )
  const { items: posts, initialLoading, loading, hasMore, sentinelRef } =
    useInfiniteScroll<CommunityPostWrap>({ fetchPage, pageSize: 20 })

  const headerTitle = useMemo(
    () => (tab === "health" ? "健康档案" : "社区"),
    [tab]
  )

  return (
    <div className="min-h-dvh">
      <div className="sticky top-0 z-10 px-4 pt-4 pb-3" style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(24px) saturate(1.3)", WebkitBackdropFilter: "blur(24px) saturate(1.3)" }}>
        <h1 className="text-[1.2rem] font-semibold text-[var(--foreground)]">{headerTitle}</h1>
        <p className="mt-0.5 text-xs text-[var(--foreground-secondary)]">
          {tab === "health"
            ? "体重 + B超数据 · 标准范围对比 · 留痕可追溯"
            : "（已开启）你可以浏览公开作品"}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab("health")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === "health"
                ? "bg-[var(--accent-1)] text-white"
                : "bg-[var(--secondary)] text-[var(--foreground-secondary)]"
            }`}
          >
            健康档案
          </button>
          {communityEnabled && (
            <button
              type="button"
              onClick={() => setTab("community")}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === "community"
                  ? "bg-[var(--accent-1)] text-white"
                  : "bg-[var(--secondary)] text-[var(--foreground-secondary)]"
              }`}
            >
              社区
            </button>
          )}
        </div>
      </div>

      {tab === "health" ? (
        <HealthHome showHeader={false} />
      ) : (
        <div className="px-4 pb-24">
          {initialLoading ? (
            <div className="mt-4 columns-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="mb-3 break-inside-avoid animate-pulse rounded-xl bg-[var(--muted)] h-48" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="mt-16 flex flex-col items-center text-center">
              <Sparkles className="h-12 w-12 text-[var(--accent-1)]" />
              <p className="mt-4 text-[var(--foreground-secondary)]">暂时还没有公开作品</p>
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">在 AI 对话页图生图后公开到社区</p>
            </div>
          ) : (
            <div className="mt-4 columns-2 gap-3">
              {posts.map((item) => (
                <Link
                  key={item.post.postId}
                  href={`/community/${item.post.postId}`}
                  className="mb-3 block break-inside-avoid overflow-hidden rounded-xl bg-transparent transition-transform active:scale-[0.98]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.post.outputImageUrl}
                    loading="lazy"
                    alt="AI 生成效果"
                    className="w-full object-cover"
                    style={{ maxHeight: 260 }}
                    loading="lazy"
                  />
                  <div className="px-3 py-2">
                    <p className="truncate text-xs font-medium text-[var(--foreground)]">
                      {item.authorName}
                    </p>
                    {(item as unknown as { usageCount?: number }).usageCount != null && (
                      <p className="text-[11px] text-[var(--foreground-muted)]">
                        {(item as unknown as { usageCount: number }).usageCount} 人使用
                      </p>
                    )}
                  </div>
                </Link>
              ))}
              <div ref={sentinelRef} className="col-span-2 py-4 text-center">
                {loading && <Loader2 className="mx-auto h-5 w-5 animate-spin text-[var(--foreground-muted)]" />}
                {!hasMore && posts.length > 0 && <p className="text-xs text-[var(--foreground-muted)]">没有更多了</p>}
              </div>
            </div>
          )}

          <Link
            href="/chat"
            className="fixed bottom-24 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[var(--accent-1)] px-6 py-3 text-sm font-semibold text-white shadow-lg active:opacity-90"
          >
            <Sparkles className="h-4 w-4" /> 开始创作
          </Link>
        </div>
      )}
    </div>
  )
}
