"use client"

import { useState, useEffect, useRef } from "react"
import { MessageCircle, Send, Trash2, Reply } from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import {
  getComments,
  addComment,
  deleteComment,
  type Comment,
} from "@/lib/api/record-interaction"

function countComments(roots: Comment[]): number {
  return roots.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0)
}

function CommentItem({
  c,
  userId,
  replyingTo,
  onReply,
  onDelete,
  isReply,
}: {
  c: Comment
  userId: number
  replyingTo: number | null
  onReply: (commentId: number) => void
  onDelete: (commentId: number) => void
  isReply?: boolean
}) {
  return (
    <li className={isReply ? "ml-6 mt-2 border-l-2 border-[var(--card-border)] pl-3" : ""}>
      <div className="flex items-start justify-between gap-2 rounded-lg bg-[var(--muted)]/50 px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--foreground)]">
            {c.username}
            {c.userType && (
              <span className="ml-1.5 text-xs font-normal text-[var(--foreground-muted)]">
                （{c.userType === "pregnant" ? "孕妇" : "家庭成员"}）
              </span>
            )}
          </p>
          <p className="mt-0.5 text-sm text-[var(--foreground-secondary)]">{c.content}</p>
          <p className="mt-1 flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
            <span>{format(new Date(c.createdAt), "M月d日 HH:mm", { locale: zhCN })}</span>
            {!isReply && (
              <button
                type="button"
                onClick={() => onReply(c.commentId)}
                className="flex items-center gap-1 text-[var(--accent-1)] hover:underline"
              >
                <Reply className="h-3 w-3" />
                回复
              </button>
            )}
          </p>
        </div>
        {c.userId === userId && (
          <button
            onClick={() => onDelete(c.commentId)}
            className="shrink-0 rounded p-1 text-[var(--foreground-muted)] hover:bg-[var(--critical-muted)] hover:text-[var(--critical)]"
            aria-label="删除"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
          </button>
        )}
      </div>
      {c.replies && c.replies.length > 0 && (
        <ul className="mt-1 space-y-1">
          {c.replies.map((r) => (
            <CommentItem
              key={r.commentId}
              c={r}
              userId={userId}
              replyingTo={replyingTo}
              onReply={onReply}
              onDelete={onDelete}
              isReply
            />
          ))}
        </ul>
      )}
    </li>
  )
}

interface CommentListProps {
  memoId: number
  userId: number
}

export function CommentList({ memoId, userId }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [input, setInput] = useState("")
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    try {
      const list = await getComments(memoId, userId)
      setComments(list)
    } catch {
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [memoId, userId])

  const handleSubmit = async () => {
    const text = input.trim()
    if (!text || submitting) return
    setSubmitting(true)
    try {
      const res = await addComment(memoId, userId, text, replyingTo ?? undefined)
      if (res) {
        setInput("")
        setReplyingTo(null)
        load()
      }
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (replyingTo !== null) inputRef.current?.focus()
  }, [replyingTo])

  const handleDelete = async (commentId: number) => {
    try {
      await deleteComment(commentId, userId)
      load()
    } catch {
      // ignore
    }
  }

  const totalCount = countComments(comments)

  return (
    <div className="mt-6 rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4">
      <div className="flex items-center gap-2 text-[15px] font-semibold text-[var(--foreground)]">
        <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
        评论 {totalCount > 0 && `(${totalCount})`}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder={replyingTo ? "回复..." : "写一句温暖的留言..."}
          className="flex-1 rounded-lg border border-[var(--card-border)] bg-[var(--muted)] px-3 py-2.5 text-sm placeholder:text-[var(--foreground-muted)]"
        />
        <button
          onClick={handleSubmit}
          disabled={submitting || !input.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-1)] text-white transition-opacity active:opacity-90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
      {replyingTo !== null && (
        <p className="mt-1 text-xs text-[var(--foreground-muted)]">
          正在回复 · <button type="button" onClick={() => setReplyingTo(null)} className="text-[var(--accent-1)]">取消</button>
        </p>
      )}

      {loading ? (
        <p className="mt-4 text-center text-sm text-[var(--foreground-muted)]">加载中...</p>
      ) : comments.length === 0 ? (
        <p className="mt-4 text-center text-sm text-[var(--foreground-muted)]">暂无评论</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {comments.map((c) => (
            <CommentItem
              key={c.commentId}
              c={c}
              userId={userId}
              replyingTo={replyingTo}
              onReply={setReplyingTo}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
