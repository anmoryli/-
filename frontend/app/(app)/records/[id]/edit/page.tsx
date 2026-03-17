"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Upload, Mic, Play, Pause, X } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import {
  getAllEnriched,
  getFamilyEnriched,
  updateFile,
  updatePhoto,
  updateText,
  updateVoice,
  updateMemoVisibility,
  type MemoItem,
} from "@/lib/api/memo"
import { getMyFamily, getFamilyMembers, type FamilyMember } from "@/lib/api/family"
import { cn } from "@/lib/utils"
import { useBack } from "@/lib/use-back"

export default function EditRecordPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const id = String(params.id || "")
  const goBack = useBack("/records")
  const [record, setRecord] = useState<MemoItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [photoDescription, setPhotoDescription] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([])

  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const voiceFileInputRef = useRef<HTMLInputElement | null>(null)

  const [visibilityMode, setVisibilityMode] = useState<"all" | "allowlist" | "blocklist">("all")
  const [visibleTo, setVisibleTo] = useState<number[]>([])
  const [showVisibleModal, setShowVisibleModal] = useState(false)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [creatorUserId, setCreatorUserId] = useState<number | null>(null)
  const searchParams = useSearchParams()
  const visibilitySectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      if (!user || !id) return
      setLoading(true)
      try {
        let list: MemoItem[]
        const family = await getMyFamily(user.userId)
        const members = family ? await getFamilyMembers(family.familyId, user.userId) : []
        const hasSpouse = (members ?? []).some((m) => m.isSpouse)
        if (family && hasSpouse) {
          list = await getFamilyEnriched(user.userId)
        } else {
          const targetUserId = user.userType === "family_member" ? (family?.creatorUserId ?? user.userId) : user.userId
          list = await getAllEnriched(targetUserId, user.userId)
        }
        const found = list.find((r) => String(r.id) === id) || null
        setRecord(found)
        if (found) {
          setTitle(found.title || "")
          setContent(found.content || "")
          setPhotoDescription(found.photoDescription || "")
          setVisibilityMode((found.visibilityMode as "all" | "allowlist" | "blocklist") || "all")
          const vt = found.visibleTo
          setVisibleTo(
            vt ? vt.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n)) : []
          )
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "加载失败")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, user])

  useEffect(() => {
    if (!user) return
    getMyFamily(user.userId)
      .then((f) => {
        if (f) {
          setCreatorUserId(f.creatorUserId)
          return getFamilyMembers(f.familyId, user!.userId)
        }
        return null
      })
      .then((members) => setFamilyMembers(members ?? []))
      .catch(() => setFamilyMembers([]))
  }, [user])

  useEffect(() => {
    if (searchParams.get("focus") === "visibility" && visibilitySectionRef.current && !loading) {
      visibilitySectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [searchParams, loading])

  const canEdit = useMemo(() => user && user.userType !== "family_member", [user])

  const startRecording = async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        toast.error("当前浏览器不支持网页录音，请使用兼容模式")
        voiceFileInputRef.current?.click()
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      const chunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        setSelectedFile(null)
        stream.getTracks().forEach((t) => t.stop())
      }
      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      const name = err instanceof DOMException ? err.name : ""
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        toast.error("麦克风权限被拒绝，请使用兼容模式上传录音")
      } else {
        toast.error("无法访问麦克风，请使用兼容模式上传录音")
      }
      voiceFileInputRef.current?.click()
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const clearVoiceInput = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioBlob(null)
    setAudioUrl(null)
    setSelectedFile(null)
    setIsPlaying(false)
  }

  const onVoiceFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("audio/")) {
      toast.error("请选择音频文件")
      return
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioBlob(null)
    setSelectedFile(file)
    setAudioUrl(URL.createObjectURL(file))
  }

  const onSubmit = async () => {
    if (!user || !record || !canEdit) return
    setSubmitting(true)
    try {
      if (record.type === "text") {
        if (!record.textId) throw new Error("textId 缺失")
        await updateText(record.textId, title || "记录", content)
      } else if (record.type === "voice") {
        const voiceFile = audioBlob
          ? new File([audioBlob], "voice.webm", { type: "audio/webm" })
          : selectedFile
        if (!voiceFile) throw new Error("请先录制新录音或使用兼容模式上传")
        await updateVoice(record.id, user.userId, voiceFile, title || "语音记录")
      } else if (record.type === "file") {
        if (!selectedFile) throw new Error("请上传新的文件")
        await updateFile(record.id, user.userId, selectedFile, title || selectedFile.name)
      } else if (record.type === "photo") {
        await updatePhoto(record.id, user.userId, selectedPhotos, photoDescription)
      }
      await updateMemoVisibility(
        record.id,
        user.userId,
        visibilityMode,
        (visibilityMode === "allowlist" || visibilityMode === "blocklist") ? visibleTo.join(",") : ""
      )
      toast.success("修改成功")
      router.push(`/records/${record.id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "修改失败")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="px-6 pt-14 pb-8 text-sm text-[var(--foreground-muted)]">加载中...</div>
  if (!record) return <div className="px-6 pt-14 pb-8 text-sm text-[var(--foreground-muted)]">记录不存在</div>

  return (
    <div className="space-y-4 px-6 pt-14 pb-8">
      <button
        type="button"
        onClick={goBack}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--card)]"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h1 className="text-xl font-semibold">编辑记录</h1>

      {(record.type === "text" || record.type === "voice" || record.type === "file") && (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="标题"
          className="h-11 w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3"
        />
      )}

      {record.type === "text" && (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="内容"
          className="min-h-44 w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-3"
        />
      )}

      {record.type === "photo" && (
        <>
          <textarea
            value={photoDescription}
            onChange={(e) => setPhotoDescription(e.target.value)}
            placeholder="照片描述"
            className="min-h-28 w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-3"
          />
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-sm">
            <Upload className="h-4 w-4" />
            选新照片（可选，不选则仅更新描述）
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => setSelectedPhotos(Array.from(e.target.files || []).slice(0, 9))}
            />
          </label>
        </>
      )}

      {record.type === "voice" && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-[var(--foreground)]">录制新录音</p>
          {audioUrl || selectedFile ? (
            <div className="card-elevated flex items-center gap-3 rounded-xl p-4">
              <button
                type="button"
                onClick={() => {
                  if (!audioRef.current || !audioUrl) return
                  if (isPlaying) audioRef.current.pause()
                  else audioRef.current.play()
                  setIsPlaying(!isPlaying)
                }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--accent-2)]/40 bg-[var(--accent-2-muted)] text-[var(--accent-2)]"
              >
                {isPlaying ? <Pause className="h-5 w-5" strokeWidth={2} /> : <Play className="h-5 w-5 ml-0.5" strokeWidth={2} />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-[var(--foreground)]">
                  {selectedFile ? selectedFile.name : "新录音"}
                </p>
                <p className="text-caption">点击播放试听，保存后替换原录音</p>
              </div>
              <button
                type="button"
                onClick={clearVoiceInput}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--critical-muted)] text-[var(--critical)]"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
              <audio ref={audioRef} src={audioUrl ?? undefined} onEnded={() => setIsPlaying(false)} className="hidden" />
            </div>
          ) : (
            <div className="card-elevated flex flex-col items-center gap-3 rounded-xl p-6">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-full transition-all",
                  isRecording ? "animate-pulse bg-[var(--critical)] text-white" : "border border-[var(--accent-2)]/40 bg-[var(--accent-2-muted)] text-[var(--accent-2)]"
                )}
              >
                <Mic className="h-7 w-7" />
              </button>
              <p className="text-sm text-[var(--foreground-muted)]">
                {isRecording ? "录制中… 点击停止" : "点击开始录制新录音"}
              </p>
              <button
                type="button"
                onClick={() => voiceFileInputRef.current?.click()}
                className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-caption text-[var(--foreground-muted)]"
              >
                兼容模式：上传音频文件
              </button>
              <input
                ref={voiceFileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={onVoiceFileSelect}
              />
            </div>
          )}
        </div>
      )}

      {record.type === "file" && (
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-sm">
          <Upload className="h-4 w-4" />
          上传新文件（支持文档、视频等，最大 500MB）
          <input
            type="file"
            className="hidden"
            accept="video/*,.mp4,.webm,.mov,.m4v,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          />
        </label>
      )}

      {canEdit && (
        <div ref={visibilitySectionRef} className="space-y-2">
          <p className="text-sm font-medium text-[var(--foreground)]">可见范围</p>
          <div className="flex flex-wrap gap-2">
            {(["all", "allowlist", "blocklist"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setVisibilityMode(mode)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-caption transition-colors",
                  visibilityMode === mode
                    ? "bg-[var(--accent-2)] text-[var(--foreground)]"
                    : "border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground-muted)]"
                )}
              >
                {mode === "all" ? "全部可见" : mode === "allowlist" ? "仅这些人可见" : "仅这些人不可见"}
              </button>
            ))}
          </div>
          {(visibilityMode === "allowlist" || visibilityMode === "blocklist") && (
            <button
              type="button"
              onClick={() => setShowVisibleModal(true)}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-left text-caption w-full text-[var(--foreground)]"
            >
              {visibleTo.length === 0 ? "点击选择成员" : `已选 ${visibleTo.length} 人`}
            </button>
          )}
        </div>
      )}

      {showVisibleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowVisibleModal(false)}>
          <div className="mx-4 max-h-[70vh] w-full max-w-sm overflow-auto rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-body font-semibold">{visibilityMode === "blocklist" ? "选择不可见成员" : "选择可见成员"}</h3>
            <p className="mt-1 text-micro text-[var(--foreground-muted)]">
              {visibilityMode === "blocklist"
                ? "勾选的成员将无法查看此记录。配偶与孕妇始终互相可见，不可排除。"
                : "仅勾选的成员可查看，配偶会自动包含"}
            </p>
            <div className="mt-4 space-y-2">
              {familyMembers.filter((m) => m.userId !== user?.userId).map((m) => {
                const isPartner = !!m.isSpouse || m.userId === creatorUserId
                const blocklistDisabled = visibilityMode === "blocklist" && isPartner
                return (
                  <label
                    key={m.userId}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border border-[var(--card-border)] px-3 py-2",
                      blocklistDisabled && "opacity-70"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={visibleTo.includes(m.userId)}
                      disabled={(visibilityMode === "allowlist" && !!m.isSpouse) || blocklistDisabled}
                      onChange={(e) => {
                        if (visibilityMode === "allowlist" && m.isSpouse) return
                        if (blocklistDisabled) return
                        if (e.target.checked) setVisibleTo((p) => [...p, m.userId])
                        else setVisibleTo((p) => p.filter((id) => id !== m.userId))
                      }}
                      className="rounded"
                    />
                    <span className="text-caption">
                      {m.username || "成员"}
                      {m.relationship ? ` (${m.relationship})` : ""}
                      {visibilityMode === "allowlist" && m.isSpouse && <span className="ml-1 text-[var(--accent-2)]">（配偶，必含）</span>}
                      {blocklistDisabled && <span className="ml-1 text-[var(--accent-2)]">（始终可见）</span>}
                    </span>
                  </label>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => setShowVisibleModal(false)}
              className="mt-4 w-full rounded-lg bg-[var(--accent-2)] py-2 text-[15px] font-medium text-[var(--foreground)]"
            >
              确定
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting || !canEdit}
        className="h-11 w-full rounded-xl bg-[var(--accent-1)] text-white disabled:opacity-60"
      >
        {submitting ? "保存中..." : "保存修改"}
      </button>
    </div>
  )
}

