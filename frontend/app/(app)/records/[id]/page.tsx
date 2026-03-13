"use client"

import { useState, useEffect, useCallback } from "react"
import { useBack } from "@/lib/use-back"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { ArrowLeft, Image, Mic, FileText, Download, Pencil, Users, Sparkles } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getAllEnriched, beautifyPreview, updateText, type MemoItem } from "@/lib/api/memo"
import { getMyFamily } from "@/lib/api/family"
import { MarkdownView } from "@/components/markdown-view"
import { PhotoCarousel } from "@/components/photo-carousel"
import { RecordShareCard } from "@/components/share/record-share-card"
import { LikeButton } from "@/components/record/like-button"
import { CommentList } from "@/components/record/comment-list"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const typeLabels: Record<string, string> = {
  text: "文字",
  photo: "照片",
  voice: "语音",
  file: "文件",
}

function isPdf(url: string) {
  return /\.pdf$/i.test(url) || url.toLowerCase().includes("pdf")
}

function isImageUrl(url: string) {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(url) || url.toLowerCase().includes("image")
}

function isOfficeFile(url: string) {
  return /\.(doc|docx|xls|xlsx|ppt|pptx)(\?|$)/i.test(url)
}

function isVideoUrl(url: string) {
  return /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url)
}

function isAudioUrl(url: string) {
  return /\.(mp3|wav|ogg|m4a|aac)(\?|$)/i.test(url)
}

function getOfficeViewerUrl(fileUrl: string): string {
  const encoded = encodeURIComponent(fileUrl)
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encoded}`
}

/** 使用代理 URL 强制 inline 预览，避免 OSS 返回 attachment 导致直接下载 */
function getPreviewProxyUrl(fileUrl: string): string {
  const path = `/api/file-proxy?url=${encodeURIComponent(fileUrl)}`
  return typeof window !== "undefined" ? `${window.location.origin}${path}` : path
}

export default function RecordDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const goBack = useBack("/records")
  const id = params.id as string
  const [record, setRecord] = useState<MemoItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [beautifyOpen, setBeautifyOpen] = useState(false)
  const [beautified, setBeautified] = useState("")
  const [beautifyLoading, setBeautifyLoading] = useState(false)
  const [beautifySubmitting, setBeautifySubmitting] = useState(false)

  const fetchRecord = useCallback(async () => {
    if (!user || !id) return
    setLoading(true)
    try {
      let targetUserId = user.userId
      if (user.userType === "family_member") {
        const family = await getMyFamily(user.userId)
        if (family) {
          targetUserId = family.creatorUserId
        }
      }
      const list = await getAllEnriched(targetUserId, user.userId)
      const found = list.find((r) => String(r.id) === id)
      setRecord(found ?? null)
    } catch {
      toast.error("获取记录失败")
      setRecord(null)
    } finally {
      setLoading(false)
    }
  }, [user, id])

  useEffect(() => {
    fetchRecord()
  }, [fetchRecord])

  if (loading) {
    return (
      <div className="px-6 pt-14 pb-8">
        <div className="h-10 w-10 animate-pulse rounded-lg border border-[var(--card-border)] bg-[var(--muted)]" />
        <div className="mt-5 h-8 w-48 animate-pulse rounded bg-[var(--muted)]" />
        <div className="mt-6 h-40 animate-pulse rounded-xl border border-[var(--card-border)] bg-[var(--card)]" />
      </div>
    )
  }

  if (!record) {
    return (
      <div className="px-6 pt-14 pb-8">
        <button
          onClick={goBack}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)]"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <p className="mt-8 text-center text-caption">记录不存在或已删除</p>
        <Link href="/records" className="mt-4 block text-center text-[14px] font-medium text-[var(--accent-1)]">
          返回记录列表
        </Link>
      </div>
    )
  }

  const title = record.title || (record.type === "photo" ? "照片记录" : typeLabels[record.type] || "记录")

  return (
    <div className="px-6 pt-14 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={goBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] transition-colors active:bg-[var(--muted)]"
          aria-label="返回"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <span className="text-micro rounded-md bg-[var(--muted)] px-2 py-1">
          {record.tag === "letter_to_baby"
            ? "给宝宝的信"
            : record.tag === "letter_to_future"
              ? "给未来的自己"
              : typeLabels[record.type] || "记录"}
        </span>
      </div>

      <h1
        className="mt-5 text-[1.25rem] font-semibold text-[var(--foreground)]"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        {title}
      </h1>
      {record.createTime && (
        <p className="mt-1.5 text-caption">
          {format(new Date(record.createTime), "yyyy年M月d日 HH:mm", { locale: zhCN })}
          {record.recordWeightKg != null ? ` · 体重 ${record.recordWeightKg}kg` : ""}
        </p>
      )}
      {(record.mood || record.category) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {record.mood && (
            <span className="rounded-full bg-[var(--accent-3-muted)] px-2 py-0.5 text-[12px] font-medium text-[var(--accent-3)]">
              {record.mood === "happy" ? "开心" : record.mood === "calm" ? "平静" : record.mood === "tired" ? "疲惫" : record.mood === "anxious" ? "焦虑" : record.mood === "excited" ? "期待" : record.mood}
            </span>
          )}
          {record.category?.split(/[,，]/).filter(Boolean).slice(0, 5).map((tag, i) => (
            <span key={i} className="rounded-full bg-[var(--accent-2-muted)] px-2 py-0.5 text-[12px] font-medium text-[var(--accent-2)]">
              {tag.trim().slice(0, 6)}{tag.trim().length > 6 ? "…" : ""}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <RecordShareCard record={record} />
        {user?.userType !== "family_member" && record.type === "text" && record.content && record.textId != null && (
          <button
            type="button"
            onClick={async () => {
              setBeautifyOpen(true)
              setBeautified("")
              setBeautifyLoading(true)
              try {
                const content = await beautifyPreview(record.id, user!.userId)
                setBeautified(content ?? "")
              } catch {
                toast.error("美化生成失败")
              } finally {
                setBeautifyLoading(false)
              }
            }}
            className="flex items-center justify-center gap-2 rounded-xl border border-[var(--accent-1)]/40 bg-[var(--accent-1-muted)] px-4 py-3 text-[14px] font-medium text-[var(--accent-1)]"
          >
            <Sparkles className="h-4 w-4" strokeWidth={1.75} />
            AI 美化
          </button>
        )}
        {user?.userType !== "family_member" && (
          <>
            <Link
              href={`/records/${record.id}/edit`}
              className="flex items-center justify-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-[14px] font-medium"
            >
              <Pencil className="h-4 w-4" strokeWidth={1.75} />
              编辑记录
            </Link>
            <Link
              href={`/records/${record.id}/edit?focus=visibility`}
              className="flex items-center justify-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-[14px] font-medium"
            >
              编辑可见范围
            </Link>
          </>
        )}
        {user && (
          <>
            <LikeButton memoId={record.id} userId={user.userId} />
          </>
        )}
      </div>

      {/* Content by type */}
      <div className="mt-6">
        {record.type === "text" && (
          <div className="card-elevated rounded-xl p-5">
            {record.content ? (
              <MarkdownView content={record.content} className="min-w-0 break-words text-body" />
            ) : (
              <p className="text-caption">暂无内容</p>
            )}
          </div>
        )}

        {record.type === "photo" && (
          <div className="space-y-4">
            {record.photoDescription && (
              <div className="card-elevated rounded-xl p-5">
                <p className="whitespace-pre-wrap text-body text-[var(--foreground)]">
                  {record.photoDescription}
                </p>
              </div>
            )}
            {record.photoUrls && record.photoUrls.length > 0 && (
              <PhotoCarousel urls={record.photoUrls} alt="照片" />
            )}
            {(!record.photoUrls || record.photoUrls.length === 0) && !record.photoDescription && (
              <p className="text-caption">暂无照片</p>
            )}
          </div>
        )}

        {record.type === "voice" && (
          <div className="card-elevated rounded-xl p-5">
            {record.voiceUrl ? (
              <audio
                controls
                src={getPreviewProxyUrl(record.voiceUrl)}
                className="w-full"
                preload="metadata"
              />
            ) : (
              <p className="text-caption">语音链接不可用</p>
            )}
          </div>
        )}

        {record.type === "file" && (
          <div className="space-y-4">
            {record.fileUrl ? (
              <>
                {isPdf(record.fileUrl) ? (
                  <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
                    <iframe
                      src={getPreviewProxyUrl(record.fileUrl) + "#toolbar=0"}
                      title={title}
                      className="h-[70vh] w-full min-h-[400px] border-0"
                    />
                  </div>
                ) : isImageUrl(record.fileUrl) ? (
                  <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getPreviewProxyUrl(record.fileUrl)}
                      alt={title}
                      className="w-full object-contain"
                    />
                  </div>
                ) : isVideoUrl(record.fileUrl) ? (
                  <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
                    <video
                      src={getPreviewProxyUrl(record.fileUrl)}
                      controls
                      className="w-full max-h-[70vh]"
                      preload="metadata"
                    >
                      您的浏览器不支持视频播放
                    </video>
                  </div>
                ) : isAudioUrl(record.fileUrl) ? (
                  <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4">
                    <audio src={getPreviewProxyUrl(record.fileUrl)} controls className="w-full" preload="metadata">
                      您的浏览器不支持音频播放
                    </audio>
                  </div>
                ) : isOfficeFile(record.fileUrl) ? (
                  <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
                    <iframe
                      src={getOfficeViewerUrl(getPreviewProxyUrl(record.fileUrl))}
                      title={title}
                      className="h-[70vh] w-full min-h-[400px] border-0"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6">
                    <p className="text-caption text-[var(--foreground-muted)] mb-4">该文件类型暂不支持页面内预览，可在新标签页打开或下载后查看。</p>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={getPreviewProxyUrl(record.fileUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--accent-1)]/40 bg-[var(--accent-1-muted)] px-4 py-3 text-[14px] font-medium text-[var(--accent-1)]"
                      >
                        在新标签页打开
                      </a>
                      <a
                        href={getPreviewProxyUrl(record.fileUrl)}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--muted)] px-4 py-3 text-[14px] font-medium text-[var(--foreground)]"
                      >
                        <Download className="h-4 w-4" strokeWidth={1.75} />
                        下载文件
                      </a>
                    </div>
                  </div>
                )}
                {(isPdf(record.fileUrl) || isImageUrl(record.fileUrl) || isVideoUrl(record.fileUrl) || isAudioUrl(record.fileUrl) || isOfficeFile(record.fileUrl)) && (
                  <a
                    href={getPreviewProxyUrl(record.fileUrl)}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-[var(--accent-1)]/40 bg-[var(--accent-1-muted)] px-4 py-3 text-[14px] font-medium text-[var(--accent-1)] w-fit"
                  >
                    <Download className="h-4 w-4" strokeWidth={1.75} />
                    下载文件
                  </a>
                )}
              </>
            ) : (
              <p className="text-caption">文件链接暂不可用</p>
            )}
          </div>
        )}

        {/* 评论（本人或家庭成员可见） */}
        {user && (
          <CommentList memoId={record.id} userId={user.userId} />
        )}

        {/* AI 美化弹窗 */}
        <Dialog open={beautifyOpen} onOpenChange={setBeautifyOpen}>
          <DialogContent className="border-[var(--card-border)] bg-[var(--card)] max-h-[85vh] overflow-hidden flex flex-col max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-[var(--foreground)]">AI 美化</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-4 py-2">
              <div>
                <p className="text-xs font-medium text-[var(--foreground-muted)] mb-1">原稿</p>
                <div className="rounded-lg border border-[var(--card-border)] bg-[var(--muted)]/30 p-3 text-sm text-[var(--foreground-secondary)] whitespace-pre-wrap">
                  {record.type === "text" ? record.content : ""}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--foreground-muted)] mb-1">美化稿</p>
                {beautifyLoading ? (
                  <p className="text-caption">生成中…</p>
                ) : beautified ? (
                  <div className="rounded-lg border border-[var(--card-border)] bg-[var(--muted)]/30 p-3 text-sm text-[var(--foreground)] whitespace-pre-wrap">
                    {beautified}
                  </div>
                ) : (
                  <p className="text-caption">点击「重新生成」获取</p>
                )}
              </div>
            </div>
            <DialogFooter className="gap-2 flex-shrink-0">
              <Button variant="outline" onClick={() => setBeautifyOpen(false)}>
                舍弃
              </Button>
              <Button
                variant="outline"
                disabled={beautifyLoading}
                onClick={async () => {
                  setBeautifyLoading(true)
                  try {
                    const content = await beautifyPreview(record.id, user!.userId)
                    setBeautified(content ?? "")
                  } catch {
                    toast.error("重新生成失败")
                  } finally {
                    setBeautifyLoading(false)
                  }
                }}
              >
                重新生成
              </Button>
              <Button
                disabled={!beautified || beautifySubmitting || !record.textId}
                onClick={async () => {
                  if (!beautified || !record.textId || !user) return
                  setBeautifySubmitting(true)
                  try {
                    await updateText(record.textId, record.title ?? "记录", beautified)
                    setRecord((r) => (r ? { ...r, content: beautified } : null))
                    setBeautifyOpen(false)
                    toast.success("已填充到正文")
                  } catch {
                    toast.error("填充失败")
                  } finally {
                    setBeautifySubmitting(false)
                  }
                }}
              >
                {beautifySubmitting ? "保存中…" : "填充到正文"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
