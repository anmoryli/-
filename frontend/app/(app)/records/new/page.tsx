"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, PenLine, Image, Mic, FileText, Upload, X, Play, Pause, Users, Smile, Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { addText, addPhoto, addVoice, addFile, inspireMemo } from "@/lib/api/memo"
import { getMyFamily, getFamilyMembers, type FamilyMember } from "@/lib/api/family"
import { getTodayLog, updateWeight } from "@/lib/api/daily"
import { getPregnancyInfo } from "@/lib/pregnancy"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useBack } from "@/lib/use-back"
import { triggerMotionFast } from "@/app/(app)/layout"

type MemoType = "text" | "photo" | "voice" | "file"

const recordTypes = [
  { value: "text" as MemoType, label: "文字", icon: PenLine },
  { value: "photo" as MemoType, label: "照片", icon: Image },
  { value: "voice" as MemoType, label: "语音", icon: Mic },
  { value: "file" as MemoType, label: "文件", icon: FileText },
]

export default function NewRecordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const goBack = useBack("/records")
  const initialType = (searchParams.get("type") as MemoType) || "text"
  const isLetterToBaby = searchParams.get("tag") === "letter_to_baby"
  const isLetterToFuture = searchParams.get("tag") === "letter_to_future"

  const [type, setType] = useState<MemoType>(initialType)
  const [title, setTitle] = useState(
    isLetterToBaby ? "给宝宝的信" : isLetterToFuture ? "给未来的自己" : ""
  )
  const [unlockTime, setUnlockTime] = useState("baby_3")
  const [content, setContent] = useState("")
  const [photoDescription, setPhotoDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recordWeight, setRecordWeight] = useState("")
  const [showSuccessAnim, setShowSuccessAnim] = useState(false)
  const [inspireLoading, setInspireLoading] = useState(false)

  // Photo upload states
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([])
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([])
  const photoInputRef = useRef<HTMLInputElement>(null)

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const voiceFileInputRef = useRef<HTMLInputElement>(null)

  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 心情 / 可见范围 / 分类（Phase 3）
  const MOOD_OPTIONS: { value: string; label: string }[] = [
    { value: "happy", label: "开心" },
    { value: "calm", label: "平静" },
    { value: "tired", label: "疲惫" },
    { value: "anxious", label: "焦虑" },
    { value: "excited", label: "期待" },
    { value: "", label: "不选" },
  ]
  const [mood, setMood] = useState("")
  const [category, setCategory] = useState("")
  const [visibilityMode, setVisibilityMode] = useState<"all" | "allowlist" | "blocklist">("all")
  const [visibleTo, setVisibleTo] = useState<number[]>([])
  const [showVisibleModal, setShowVisibleModal] = useState(false)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [creatorUserId, setCreatorUserId] = useState<number | null>(null)

  // 非配偶的家庭成员不可创建记录，重定向到记录页；配偶（爸爸）可创建记录
  useEffect(() => {
    if (user && user.userType === "family_member" && !user?.isSpouse) {
      router.replace("/records")
    }
  }, [user, router])

  // Get pregnancy info if user has pregnancyTime
  const info = user?.pregnancyTime
    ? getPregnancyInfo(user.lastMenstrualDate ?? user.pregnancyTime, user.pregnancyTime)
    : null

  // Photo handling + 家庭成员（可见范围）
  useEffect(() => {
    if (!user) return
    getTodayLog(user.userId)
      .then((log) => setRecordWeight(log.weightKg != null ? String(log.weightKg) : ""))
      .catch(() => setRecordWeight(""))
    getMyFamily(user.userId)
      .then((f) => {
        if (f) {
          setCreatorUserId(f.creatorUserId)
          return getFamilyMembers(f.familyId, user.userId).then((members) => {
            setFamilyMembers(members ?? [])
            const spouseIds = (members ?? []).filter((m) => m.isSpouse).map((m) => m.userId)
            if (spouseIds.length > 0) {
              setVisibleTo((prev) => [...new Set([...prev, ...spouseIds])])
            }
          })
        }
      })
      .catch(() => {})
  }, [user])

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + selectedPhotos.length > 9) {
      toast.error("最多只能上传9张照片")
      return
    }
    const newPhotos = [...selectedPhotos, ...files].slice(0, 9)
    setSelectedPhotos(newPhotos)
    
    // Create preview URLs
    const newUrls = newPhotos.map(file => URL.createObjectURL(file))
    photoPreviewUrls.forEach(url => URL.revokeObjectURL(url))
    setPhotoPreviewUrls(newUrls)
  }

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviewUrls[index])
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index))
    setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  // Voice recording
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
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      const name = err instanceof DOMException ? err.name : ""
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        toast.error("麦克风权限被拒绝，请在浏览器设置中允许后重试，或使用兼容模式")
      } else {
        toast.error("无法访问麦克风，请稍后重试或使用兼容模式")
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

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const clearRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioBlob(null)
    setAudioFile(null)
    setAudioUrl(null)
    setIsPlaying(false)
  }

  const handleVoiceFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("audio/")) {
      toast.error("请选择音频文件")
      return
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioBlob(null)
    setAudioFile(file)
    setAudioUrl(URL.createObjectURL(file))
  }

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        toast.error("文件大小不能超过 500MB")
        return
      }
      setSelectedFile(file)
      const isVideo = file.type.startsWith("video/")
      toast.success(isVideo ? "已选择视频，可保存记录" : "已选择文件")
    }
  }

  const handleSubmit = async () => {
    if (!user) {
      toast.error("请先登录")
      return
    }

    // Validation based on type
    if (type === "text" && !content.trim()) {
      toast.error("请输入内容")
      return
    }

    if (type === "photo" && selectedPhotos.length === 0 && !photoDescription.trim()) {
      toast.error("请上传照片或输入描述")
      return
    }

    if (type === "voice" && !audioBlob && !audioFile) {
      toast.error("请先录制或上传语音")
      return
    }

    if (type === "file" && !selectedFile) {
      toast.error("请先选择文件")
      return
    }

    setIsSubmitting(true)

    try {
      const weightVal = Number(recordWeight)
      if (recordWeight.trim()) {
        if (!Number.isFinite(weightVal) || weightVal <= 0 || weightVal > 300) {
          toast.error("请输入合理体重（kg）")
          setIsSubmitting(false)
          return
        }
        await updateWeight(user.userId, weightVal)
      }
      switch (type) {
        case "text":
          const tag = isLetterToBaby ? "letter_to_baby" : isLetterToFuture ? "letter_to_future" : undefined
          const unlockLabels: Record<string, string> = {
            after_birth_1: "产后1年",
            baby_1: "宝宝1岁时",
            baby_3: "宝宝3岁时",
            baby_5: "宝宝5岁时",
          }
          const finalTitle = isLetterToFuture
            ? `【${unlockLabels[unlockTime] ?? unlockTime}】${title.trim() || "给未来的自己"}`
            : title.trim() || (isLetterToBaby ? "给宝宝的信" : undefined)
          await addText(user.userId, content.trim(), finalTitle, tag, {
            mood: mood || undefined,
            visibilityMode: visibilityMode,
            visibleTo: visibilityMode !== "all" && visibleTo.length ? visibleTo.join(",") : undefined,
            category: category.trim() || undefined,
          })
          break
        case "photo":
          await addPhoto(user.userId, selectedPhotos, photoDescription.trim(), {
            mood: mood || undefined,
            visibilityMode: visibilityMode,
            visibleTo: visibilityMode !== "all" && visibleTo.length ? visibleTo.join(",") : undefined,
            category: category.trim() || undefined,
          })
          break
        case "voice":
          if (audioBlob) {
            const voiceFile = new File([audioBlob], "voice.webm", { type: "audio/webm" })
            await addVoice(user.userId, voiceFile, title.trim() || "语音记录", {
              mood: mood || undefined,
              visibilityMode: visibilityMode,
              visibleTo: visibilityMode !== "all" && visibleTo.length ? visibleTo.join(",") : undefined,
              category: category.trim() || undefined,
            })
          } else if (audioFile) {
            await addVoice(user.userId, audioFile, title.trim() || "语音记录", {
              mood: mood || undefined,
              visibilityMode: visibilityMode,
              visibleTo: visibilityMode !== "all" && visibleTo.length ? visibleTo.join(",") : undefined,
              category: category.trim() || undefined,
            })
          }
          break
        case "file":
          if (selectedFile) {
            await addFile(user.userId, selectedFile, title.trim() || selectedFile.name, {
              mood: mood || undefined,
              visibilityMode: visibilityMode,
              visibleTo: visibilityMode !== "all" && visibleTo.length ? visibleTo.join(",") : undefined,
              category: category.trim() || undefined,
            })
          }
          break
      }

      setShowSuccessAnim(true)
      setTimeout(() => {
        toast.success("记录已保存")
        triggerMotionFast()
        router.push("/records")
      }, 600)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh">
      {/* 保存成功中性动画 */}
      {showSuccessAnim && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30"
          aria-hidden="true"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-2)] shadow-lg animate-in zoom-in-95 fade-in duration-300">
            <Check className="h-8 w-8 text-white stroke-[2.5]" strokeWidth={2.5} />
          </div>
        </div>
      )}
      <div className="px-6 pt-14 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={goBack}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] transition-colors active:bg-[var(--muted)]"
          aria-label="返回"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <h1
          className="text-[1.2rem] font-semibold text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          新建记录
        </h1>
      </div>

      {/* Week Badge */}
      {info && (
        <div
          className="mt-5 inline-flex rounded-lg border px-3 py-1.5"
          style={{ borderColor: "var(--accent-3-muted)", backgroundColor: "var(--accent-3-muted)" }}
        >
          <span className="text-micro font-medium text-[var(--accent-3)]">
            第{info.weeksPregnant}周{info.daysInCurrentWeek}天
          </span>
        </div>
      )}

      {/* Type Selector — 写信/给未来的自己时隐藏 */}
      {!isLetterToBaby && !isLetterToFuture && (
      <div className="mt-6 flex gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--muted)]/40 p-1">
        {recordTypes.map((rt) => {
          const Icon = rt.icon
          return (
            <button
              key={rt.value}
              type="button"
              onClick={() => setType(rt.value)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lg py-3 text-[12px] font-medium transition-all",
                type === rt.value
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                  : "text-[var(--foreground-muted)]"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
              {rt.label}
            </button>
          )
        })}
      </div>
      )}

      {/* Title（照片记录不需要标题输入） */}
      {type !== "photo" && (
      <div className="mt-6 space-y-2">
        <Label htmlFor="title" className="text-caption font-medium">
          {isLetterToBaby ? "标题" : isLetterToFuture ? "标题（选填）" : "标题（选填）"}
        </Label>
        {isLetterToFuture && (
          <div className="flex gap-2">
            <select
              value={unlockTime}
              onChange={(e) => setUnlockTime(e.target.value)}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-[14px] text-[var(--foreground)]"
            >
              <option value="after_birth_1">产后1年</option>
              <option value="baby_1">宝宝1岁时</option>
              <option value="baby_3">宝宝3岁时</option>
              <option value="baby_5">宝宝5岁时</option>
            </select>
            <Input
              id="title"
              placeholder="给未来的自己"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 rounded-lg border-[var(--card-border)] bg-[var(--card)]"
            />
          </div>
        )}
        {!isLetterToFuture && (
          <Input
            id="title"
            placeholder={isLetterToBaby ? "给宝宝的信" : "给这条记录起个标题"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border-[var(--card-border)] bg-[var(--card)]"
          />
        )}
      </div>
      )}

      {isLetterToBaby && (
        <p className="mt-2 text-micro text-[var(--accent-1)]">写下你想对宝宝说的话，这份心意会一直保存</p>
      )}
      {isLetterToFuture && (
        <p className="mt-2 text-micro text-[var(--accent-3)]">
          写下给未来自己的话，设定时间后将在那时再看
        </p>
      )}

      <div className="mt-6 space-y-2">
        <Label htmlFor="recordWeight" className="text-caption font-medium">记录时体重（kg）</Label>
        <Input
          id="recordWeight"
          type="number"
          step="0.1"
          value={recordWeight}
          onChange={(e) => setRecordWeight(e.target.value)}
          placeholder="例如 58.6"
          className="rounded-lg border-[var(--card-border)] bg-[var(--card)]"
        />
      </div>

      {/* 心情 / 可见范围 / 分类 */}
      {!isLetterToBaby && !isLetterToFuture && (
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-caption font-medium flex items-center gap-1.5">
              <Smile className="h-4 w-4" strokeWidth={1.75} />
              心情（选填）
            </Label>
            <div className="flex flex-wrap gap-2">
              {MOOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value || "none"}
                  type="button"
                  onClick={() => setMood(opt.value)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-caption transition-colors",
                    mood === opt.value
                      ? "bg-[var(--accent-2)] text-[var(--foreground)]"
                      : "border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground-muted)]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {familyMembers.length > 0 && (
            <div className="space-y-2">
              <Label className="text-caption font-medium flex items-center gap-1.5">
                <Users className="h-4 w-4" strokeWidth={1.75} />
                可见范围
              </Label>
              <div className="flex flex-wrap gap-2">
                {(["all", "allowlist", "blocklist"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setVisibilityMode(mode)
                      if (mode === "all") setVisibleTo([])
                    }}
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
          {type !== "text" && (
            <div className="space-y-2">
              <Label htmlFor="category" className="text-caption font-medium">
                分类标签（选填，逗号分隔，如：产检,心情）
              </Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="语音/照片/文件 或自定义"
                className="rounded-lg border-[var(--card-border)] bg-[var(--card)]"
              />
            </div>
          )}
        </div>
      )}

      {/* 可见范围弹窗 */}
      {showVisibleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowVisibleModal(false)}>
          <div className="mx-4 max-h-[70vh] w-full max-w-sm overflow-auto glass-card p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
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
                      disabled={(visibilityMode === "allowlist" && m.isSpouse) || blocklistDisabled}
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

      {/* Content based on type */}
      {type === "text" && (
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="content" className="text-caption font-medium">内容（支持 Markdown）</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-caption"
              disabled={inspireLoading || !user}
              onClick={async () => {
                if (!user) return
                setInspireLoading(true)
                try {
                  const weekStr = info ? `第${info.weeksPregnant}周` : undefined
                  const tagStr = isLetterToBaby ? "letter_to_baby" : isLetterToFuture ? "letter_to_future" : undefined
                  const text = await inspireMemo(user.userId, { content: content || undefined, week: weekStr, tag: tagStr })
                  setContent((prev) => (prev.trim() ? prev + "\n\n" + text : text))
                  toast.success("已填入 AI 帮写内容")
                } catch {
                  toast.error("AI 帮写失败，请稍后重试")
                } finally {
                  setInspireLoading(false)
                }
              }}
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
              {inspireLoading ? "生成中…" : "AI 帮写"}
            </Button>
          </div>
          <Textarea
            id="content"
            placeholder={
              isLetterToBaby
                ? "亲爱的宝宝，妈妈想对你说…\n\n写下你的心里话，支持 Markdown 格式"
                : isLetterToFuture
                  ? "亲爱的未来的自己，我想对你说…\n\n写下你的期待、祝福或想记住的事，支持 Markdown 格式"
                  : "今天有什么想记录的？宝宝的变化、你的心情、产检情况…\n\n支持 Markdown：**粗体**、*斜体*、- 列表、[链接](url)、# 标题等"
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[200px] resize-none rounded-xl border-[var(--card-border)] bg-[var(--card)] p-4 text-body leading-relaxed placeholder:text-[var(--foreground-muted)]"
          />
          <p className="text-right text-micro">
            {content.length}/1000 · 支持 Markdown，查看时将渲染
          </p>
        </div>
      )}

      {type === "photo" && (
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="photoDescription" className="text-caption font-medium">照片描述</Label>
            <Textarea
              id="photoDescription"
              placeholder="描述一下这张照片..."
              value={photoDescription}
              onChange={(e) => setPhotoDescription(e.target.value)}
              className="min-h-[100px] resize-none rounded-xl border-[var(--card-border)] bg-[var(--card)] p-4 text-body leading-relaxed placeholder:text-[var(--foreground-muted)]"
            />
          </div>

          {photoPreviewUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photoPreviewUrls.map((url, index) => (
                <div key={index} className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`照片 ${index + 1}`}
                    className="h-full w-full rounded-xl object-cover"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--critical)] text-white shadow-md"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedPhotos.length < 9 && (
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--card-border)] bg-[var(--muted)]/50 py-8 transition-colors active:bg-[var(--muted)]"
            >
              <Upload className="h-8 w-8 text-[var(--foreground-muted)]" strokeWidth={1.75} />
              <span className="text-caption">点击上传照片（最多9张）</span>
            </button>
          )}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotoSelect}
          />
        </div>
      )}

      {type === "voice" && (
        <div className="mt-6 space-y-4">
          {audioUrl ? (
            <div className="card-elevated rounded-xl p-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--accent-2)]/40 bg-[var(--accent-2-muted)] text-[var(--accent-2)]"
                >
                  {isPlaying ? <Pause className="h-5 w-5" strokeWidth={2} /> : <Play className="h-5 w-5 ml-0.5" strokeWidth={2} />}
                </button>
                <div className="flex-1">
                  <p className="text-[15px] font-medium text-[var(--foreground)]">语音已录制</p>
                  <p className="text-caption">点击播放试听</p>
                </div>
                <button
                  type="button"
                  onClick={clearRecording}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--critical-muted)] text-[var(--critical)]"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            </div>
          ) : (
            <div className="card-elevated flex flex-col items-center gap-4 rounded-xl p-8">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={cn(
                  "flex h-20 w-20 items-center justify-center rounded-full transition-all",
                  isRecording
                    ? "animate-pulse bg-[var(--critical)] text-white"
                    : "border border-[var(--accent-2)]/40 bg-[var(--accent-2-muted)] text-[var(--accent-2)]"
                )}
              >
                <Mic className="h-8 w-8" />
              </button>
              <p className="text-sm text-muted-foreground">
                {isRecording ? "录制中...点击停止" : "点击开始录音"}
              </p>
              <button
                type="button"
                onClick={() => voiceFileInputRef.current?.click()}
                className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-caption text-[var(--foreground-muted)]"
              >
                兼容模式：上传/调用系统录音
              </button>
              <p className="text-micro text-[var(--foreground-muted)]">
                若浏览器不支持网页录音或未弹出权限，请使用兼容模式
              </p>
            </div>
          )}
          <input
            ref={voiceFileInputRef}
            type="file"
            accept="audio/*"
            capture="user"
            className="hidden"
            onChange={handleVoiceFileSelect}
          />
        </div>
      )}

      {type === "file" && (
        <div className="mt-6 space-y-4">
          {selectedFile ? (
            <div className="card-elevated flex items-center gap-3 rounded-xl p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--accent-1)]/30 bg-[var(--accent-1-muted)]">
                <FileText className="h-5 w-5 text-[var(--accent-1)]" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-[var(--foreground)]">
                  {selectedFile.name}
                </p>
                <p className="text-caption">
                  {selectedFile.size >= 1024 * 1024
                    ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                    : `${(selectedFile.size / 1024).toFixed(1)} KB`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--critical-muted)] text-[var(--critical)]"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--card-border)] bg-[var(--muted)]/50 py-8 transition-colors active:bg-[var(--muted)]"
            >
              <Upload className="h-8 w-8 text-[var(--foreground-muted)]" strokeWidth={1.75} />
              <span className="text-caption">支持文档、视频等（最大 500MB）</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="video/*,.mp4,.webm,.mov,.m4v,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
            onChange={handleFileSelect}
          />
        </div>
      )}

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={
          isSubmitting ||
          (type === "text" && !content.trim()) ||
          (type === "photo" && selectedPhotos.length === 0 && !photoDescription.trim()) ||
          (type === "voice" && !audioBlob && !audioFile) ||
          (type === "file" && !selectedFile)
        }
        className="mt-8 h-12 w-full rounded-xl border-0 text-[15px] font-semibold transition-opacity disabled:opacity-50"
        style={{ backgroundColor: "var(--accent-2)", color: "var(--foreground)" }}
      >
        {isSubmitting ? "保存中..." : "保存记录"}
      </Button>
    </div>
  </div>
  )
}
