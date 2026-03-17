"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useBack } from "@/lib/use-back"
import { ArrowLeft, Heart, MessageCircle, Send, Sparkles, CornerDownRight, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import {
  listPublicRecommendedPosts,
  listMyPosts,
  getPostLikeStatus,
  togglePostLike,
  getPostComments,
  addPostComment,
  updatePostComment,
  deletePostComment,
  toggleCommentLike,
  getPostInputImageUrls,
  type CommunityPostWrap,
  type CommunityPostComment,
} from "@/lib/api/ai-community"

function buildCommentTree(
  comments: CommunityPostComment[]
): (CommunityPostComment & { children: CommunityPostComment[] })[] {
  const map = new Map<number, CommunityPostComment & { children: CommunityPostComment[] }>()
  const roots: (CommunityPostComment & { children: CommunityPostComment[] })[] = []
  for (const c of comments) {
    map.set(c.commentId, { ...c, children: [] })
  }
  for (const c of comments) {
    const node = map.get(c.commentId)!
    if (c.parentCommentId && map.has(c.parentCommentId)) {
      map.get(c.parentCommentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  return roots
}

export default function CommunityPostDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const postId = Number(params.postId)
  const goBack = useBack("/community")

  const [post, setPost] = useState<CommunityPostWrap | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [comments, setComments] = useState<CommunityPostComment[]>([])
  const [commentInput, setCommentInput] = useState("")
  const [replyTarget, setReplyTarget] = useState<{ commentId: number; username: string } | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

  const loadComments = useCallback(async () => {
    if (!user) return
    const cmts = await getPostComments(postId, user.userId)
    setComments(cmts)
  }, [postId, user])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        let found: CommunityPostWrap | null = null
        const publicList = await listPublicRecommendedPosts()
        found = publicList.find((p) => p.post.postId === postId) ?? null
        if (!found && user) {
          const myList = await listMyPosts(user.userId)
          found = myList.find((p) => p.post.postId === postId) ?? null
        }
        setPost(found)
        if (found && user) {
          const status = await getPostLikeStatus(postId, user.userId)
          setLiked(status)
          setLikeCount((found as unknown as { likeCount?: number }).likeCount ?? 0)
          await loadComments()
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "加载失败")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [postId, user, loadComments])

  const onToggleLike = async () => {
    if (!user) return
    try {
      const res = await togglePostLike(postId, user.userId)
      setLiked(res.liked)
      setLikeCount(res.count)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "点赞失败")
    }
  }

  const onAddComment = async () => {
    if (!user || !commentInput.trim()) return
    try {
      await addPostComment(postId, user.userId, commentInput.trim(), replyTarget?.commentId)
      setCommentInput("")
      setReplyTarget(null)
      await loadComments()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "评论失败")
    }
  }

  const onSaveEdit = async () => {
    if (!user || !editingId || !editingContent.trim()) return
    try {
      await updatePostComment(editingId, user.userId, editingContent.trim())
      setEditingId(null)
      await loadComments()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "修改失败")
    }
  }

  const onDeleteComment = async (commentId: number) => {
    if (!user) return
    try {
      await deletePostComment(commentId, user.userId)
      await loadComments()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "删除失败")
    }
  }

  const onToggleCommentLike = async (commentId: number) => {
    if (!user) return
    try {
      await toggleCommentLike(commentId, user.userId)
      await loadComments()
    } catch {
      // silent
    }
  }

  const onMakeSame = () => {
    if (!post) return
    // 跳转到 AI 对话页并把完整提示词填入输入框（不自动发送）
    router.push(`/chat?prompt=${encodeURIComponent(post.post.promptText)}`)
  }

  if (loading) return <div className="px-6 pt-14 text-sm text-[var(--foreground-muted)]">加载中...</div>
  if (!post) return <div className="px-6 pt-14 text-sm text-[var(--foreground-muted)]">作品不存在或未公开</div>

  const tree = buildCommentTree(comments)

  return (
    <div className="min-h-dvh pb-32">
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/40 px-4 py-3" style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(24px) saturate(1.3)", WebkitBackdropFilter: "blur(24px) saturate(1.3)" }}>
        <button onClick={goBack} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--card-solid)]">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium">{post.authorName}</span>
      </div>

      <button
        type="button"
        onClick={() => setPreviewImageUrl(post.post.outputImageUrl)}
        className="w-full text-left"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.post.outputImageUrl} alt="效果图" className="w-full cursor-zoom-in" />
      </button>

      <div className="space-y-4 px-4 pt-4">
        <p className="text-sm text-[var(--foreground)]">{post.post.promptText}</p>

        {(() => {
          const inputUrls = getPostInputImageUrls(post.post)
          return (
            <>
              {inputUrls.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-medium text-[var(--foreground-muted)]">
                    参考图 {inputUrls.length} 张
                  </p>
                  <div className="flex overflow-x-auto pb-1 scrollbar-thin">
                    {inputUrls.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPreviewImageUrl(url)}
                        className="h-24 w-24 shrink-0 overflow-hidden border-0 border-r border-[var(--card-border)] bg-[var(--muted)] last:border-r-0 first:rounded-l-lg last:rounded-r-lg"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`参考图${i + 1}`} loading="lazy" className="h-full w-full object-cover block" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="mb-2 text-[11px] font-medium text-[var(--foreground-muted)]">效果图</p>
                <button
                  type="button"
                  onClick={() => setPreviewImageUrl(post.post.outputImageUrl)}
                  className="block w-full overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--muted)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.post.outputImageUrl} alt="效果图" loading="lazy" className="h-40 w-full object-cover sm:h-48" referrerPolicy="no-referrer" />
                </button>
              </div>
            </>
          )
        })()}
      </div>

      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setPreviewImageUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="图片预览"
        >
          <div className="relative max-h-[90vh] max-w-[95vw]" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewImageUrl} alt="预览" className="max-h-[90vh] max-w-full rounded-lg object-contain" />
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute -top-10 right-0 flex items-center gap-1 rounded-lg border border-[var(--card-border)] bg-[var(--card-solid)] px-3 py-1.5 text-sm text-[var(--foreground)]"
            >
              <X className="h-4 w-4" /> 关闭
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 border-t border-[var(--card-border)] px-4 pt-4">
        <p className="text-sm font-medium">评论 {comments.length}</p>

        <div className="mt-3 flex items-center gap-2">
          <input
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAddComment()}
            placeholder={replyTarget ? `回复 @${replyTarget.username}` : "写评论..."}
            className="h-10 flex-1 rounded-xl border border-[var(--card-border)] bg-[var(--card-solid)] px-3 text-sm"
          />
          {replyTarget && (
            <button onClick={() => setReplyTarget(null)} className="shrink-0 text-xs text-[var(--foreground-muted)]">取消</button>
          )}
          <button onClick={onAddComment} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-1)] text-white">
            <Send className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 space-y-1">
          {tree.map((c) => (
            <CommentNode
              key={c.commentId}
              comment={c}
              depth={0}
              currentUserId={user?.userId}
              onReply={(cmt) => setReplyTarget({ commentId: cmt.commentId, username: cmt.username })}
              onEdit={(cmt) => { setEditingId(cmt.commentId); setEditingContent(cmt.content) }}
              onDelete={onDeleteComment}
              onToggleLike={onToggleCommentLike}
              editingId={editingId}
              editingContent={editingContent}
              setEditingContent={setEditingContent}
              onSaveEdit={onSaveEdit}
              onCancelEdit={() => setEditingId(null)}
            />
          ))}
        </div>
      </div>

      <div className="fixed bottom-20 left-0 right-0 z-30 mx-auto flex max-w-lg items-center justify-between border-t border-[var(--card-border)] bg-[var(--card-solid)]/98 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button onClick={onToggleLike} className="flex items-center gap-1 text-sm">
            <Heart className={`h-5 w-5 ${liked ? "fill-current text-[var(--critical)]" : "text-[var(--foreground-muted)]"}`} />
            {likeCount}
          </button>
          <span className="flex items-center gap-1 text-sm text-[var(--foreground-muted)]">
            <MessageCircle className="h-5 w-5" /> {comments.length}
          </span>
        </div>
        <button
          onClick={onMakeSame}
          className="flex items-center gap-2 rounded-full bg-[var(--accent-1)] px-5 py-2.5 text-sm font-semibold text-white active:opacity-90"
        >
          <Sparkles className="h-4 w-4" /> 制作同款
        </button>
      </div>
    </div>
  )
}

function CommentNode({
  comment,
  depth,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onToggleLike,
  editingId,
  editingContent,
  setEditingContent,
  onSaveEdit,
  onCancelEdit,
}: {
  comment: CommunityPostComment & { children: CommunityPostComment[] }
  depth: number
  currentUserId?: number
  onReply: (c: CommunityPostComment) => void
  onEdit: (c: CommunityPostComment) => void
  onDelete: (id: number) => void
  onToggleLike: (id: number) => void
  editingId: number | null
  editingContent: string
  setEditingContent: (v: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
}) {
  const isEditing = editingId === comment.commentId

  return (
    <div className={depth > 0 ? "ml-6 border-l border-[var(--card-border)] pl-3" : ""}>
      <div className="rounded-xl bg-transparent p-3 text-sm">
        <div className="flex items-center justify-between">
          <p className="font-medium text-[var(--foreground)]">
            {comment.username}
            {comment.userType && (
              <span className="ml-1.5 text-xs font-normal text-[var(--foreground-muted)]">
                （{comment.userType === "pregnant" ? "孕妇" : "家庭成员"}）
              </span>
            )}
          </p>
          <button onClick={() => onToggleLike(comment.commentId)} className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
            <Heart className={`h-3.5 w-3.5 ${comment.isLiked ? "fill-current text-[var(--critical)]" : ""}`} />
            {comment.likeCount ?? 0}
          </button>
        </div>
        {isEditing ? (
          <div className="mt-1 space-y-2">
            <input
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              className="h-9 w-full rounded-lg border border-[var(--card-border)] bg-[var(--card-solid)] px-2 text-sm"
            />
            <div className="flex gap-2">
              <button onClick={onSaveEdit} className="rounded-lg border px-3 py-1 text-xs">保存</button>
              <button onClick={onCancelEdit} className="rounded-lg border px-3 py-1 text-xs">取消</button>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-[var(--foreground-secondary)]">{comment.content}</p>
        )}
        <div className="mt-1 flex items-center gap-3 text-xs">
          {depth < 3 && (
            <button onClick={() => onReply(comment)} className="flex items-center gap-1 text-[var(--foreground-muted)]">
              <CornerDownRight className="h-3 w-3" /> 回复
            </button>
          )}
          {currentUserId === comment.userId && !isEditing && (
            <>
              <button onClick={() => onEdit(comment)} className="text-[var(--foreground-muted)]">编辑</button>
              <button onClick={() => onDelete(comment.commentId)} className="text-[var(--critical)]">删除</button>
            </>
          )}
        </div>
      </div>
      {comment.children.length > 0 && (
        <div className="mt-1 space-y-1">
          {comment.children.map((child) => (
            <CommentNode
              key={child.commentId}
              comment={child as CommunityPostComment & { children: CommunityPostComment[] }}
              depth={depth + 1}
              currentUserId={currentUserId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleLike={onToggleLike}
              editingId={editingId}
              editingContent={editingContent}
              setEditingContent={setEditingContent}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
}
