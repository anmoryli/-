"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useBack } from "@/lib/use-back"
import { ArrowLeft, Heart, MessageCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import {
  listMyPosts,
  togglePostPublic,
  type CommunityPostWrap,
} from "@/lib/api/ai-community"

export default function MyPostsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const goBack = useBack("/profile")
  const [posts, setPosts] = useState<CommunityPostWrap[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!user) return
    setLoading(true)
    try {
      setPosts(await listMyPosts(user.userId))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "加载失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId])

  const onToggle = async (postId: number, nextPublic: boolean) => {
    if (!user) return
    try {
      await togglePostPublic(user.userId, postId, nextPublic)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "操作失败")
    }
  }

  if (!user) return null

  const canPublishToCommunity = user.userType === "pregnant" && user.isSpouse !== true

  return (
    <div className="min-h-dvh bg-[var(--background)] px-4 pt-14 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={goBack} className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--card)]">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">我的模板作品</h1>
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--muted)]" />)}
        </div>
      ) : posts.length === 0 ? (
        <p className="mt-20 text-center text-sm text-[var(--foreground-muted)]">暂无作品，在 AI 对话里图生图后公开即可</p>
      ) : (
        <div className="mt-6 space-y-3">
          {posts.map((item) => {
            const wrap = item as unknown as { likeCount?: number; commentCount?: number; usageCount?: number }
            return (
              <div key={item.post.postId} className="flex items-center gap-3 rounded-xl bg-transparent p-3">
                <Link
                  href={`/community/${item.post.postId}`}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.post.outputImageUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.post.promptText.slice(0, 30)}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[var(--foreground-muted)]">
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {wrap.likeCount ?? 0}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {wrap.commentCount ?? 0}</span>
                      {wrap.usageCount != null && <span>{wrap.usageCount} 人使用</span>}
                    </div>
                  </div>
                </Link>
                {canPublishToCommunity ? (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      onToggle(item.post.postId, !item.post.isPublic)
                    }}
                    className="shrink-0 rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-xs"
                  >
                    {item.post.isPublic ? "取消公开" : "公开"}
                  </button>
                ) : (
                  <span className="shrink-0 text-xs text-[var(--foreground-muted)]" title="仅孕妇可将作品公开到社区">
                    仅本人可见
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
