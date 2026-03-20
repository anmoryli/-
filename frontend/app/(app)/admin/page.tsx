"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  BookOpen,
  MessageSquare,
  PenLine,
  Image,
  Mic,
  FileText,
  ChevronRight,
  Calendar,
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  Music,
  Upload,
  Power,
  PowerOff,
  Play,
  Pause,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  getAllUsers,
  getUserCount,
  getTextCount,
  getVoiceCount,
  getPhotoCount,
  getFileCount,
  getAiMessageCount,
  getNewUserCountByType,
  listAdminArticles,
  deleteArticle,
  updateUser,
  deleteUser,
  type AdminArticle,
} from "@/lib/api/admin"
import type { User } from "@/lib/api/user"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { toast } from "sonner"
import {
  listAllRelaxMusic,
  uploadRelaxMusic,
  updateRelaxMusic,
  deleteRelaxMusic,
  type RelaxMusic,
} from "@/lib/api/relax-music"
import { useMusicPlayer } from "@/lib/music-player-context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useRef } from "react"

function MusicUploadModal({
  uploading,
  onClose,
  onUpload,
}: {
  uploading: boolean
  onClose: () => void
  onUpload: (data: {
    file: File
    title: string
    category: string
    artist?: string
    description?: string
    tags?: string
    durationSeconds?: number
    cover?: File
  }) => void
}) {
  const [title, setTitle] = useState("")
  const [artist, setArtist] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<string>("healing")
  const [tags, setTags] = useState("")
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [duration, setDuration] = useState<number | undefined>(undefined)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAudioFile(file)
    const audio = new Audio()
    audio.src = URL.createObjectURL(file)
    audio.addEventListener("loadedmetadata", () => {
      setDuration(Math.round(audio.duration))
      URL.revokeObjectURL(audio.src)
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!audioFile) {
      toast.error("请选择音频文件")
      return
    }
    if (!title.trim()) {
      toast.error("请输入音乐标题")
      return
    }
    onUpload({
      file: audioFile,
      title: title.trim(),
      category,
      artist: artist.trim() || undefined,
      description: description.trim() || undefined,
      tags: tags.trim() || undefined,
      durationSeconds: duration,
      cover: coverFile || undefined,
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !uploading && onClose()}>
      <DialogContent className="border-[var(--card-border)] bg-[var(--card-solid)] sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[var(--foreground)]">上传放松音乐</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-caption">音频文件 *</Label>
            <Input
              type="file"
              accept="audio/*"
              onChange={handleAudioChange}
              className="mt-1 border-[var(--card-border)]"
              required
            />
            {audioFile && (
              <p className="mt-1 text-[12px] text-[var(--foreground-muted)]">
                {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(1)} MB)
                {duration != null && ` · ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}`}
              </p>
            )}
          </div>
          <div>
            <Label className="text-caption">音乐标题 *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="如：疗愈钢琴曲" className="mt-1 border-[var(--card-border)]" required />
          </div>
          <div>
            <Label className="text-caption">分类 *</Label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm">
              <option value="healing">专业疗愈音乐</option>
              <option value="recommend">推荐聆听</option>
            </select>
          </div>
          <div>
            <Label className="text-caption">艺术家/来源</Label>
            <Input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="可选" className="mt-1 border-[var(--card-border)]" />
          </div>
          <div>
            <Label className="text-caption">描述</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="简短描述音乐特点" className="mt-1 border-[var(--card-border)]" rows={2} />
          </div>
          <div>
            <Label className="text-caption">标签（逗号分隔）</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="如：钢琴,助眠,白噪音" className="mt-1 border-[var(--card-border)]" />
          </div>
          <div>
            <Label className="text-caption">封面图片</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              className="mt-1 border-[var(--card-border)]"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={uploading}>取消</Button>
            <Button type="submit" disabled={uploading}>{uploading ? "上传中..." : "确认上传"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function UserEditModal({
  user,
  onClose,
  onSaved,
  updateUser,
  toast,
}: {
  user: User
  onClose: () => void
  onSaved: (u: User) => void
  updateUser: (userId: number, data: { username?: string; email?: string; userType?: string }) => Promise<User>
  toast: { success: (m: string) => void; error: (m: string) => void }
}) {
  const [username, setUsername] = useState(user.username ?? "")
  const [email, setEmail] = useState(user.email ?? "")
  const [userType, setUserType] = useState<string>(user.userType ?? "pregnant")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) {
      toast.error("请输入用户名")
      return
    }
    setSaving(true)
    try {
      const u = await updateUser(user.userId, { username: username.trim(), email: email.trim() || undefined, userType })
      onSaved(u)
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-[var(--card-border)] bg-[var(--card-solid)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[var(--foreground)]">编辑用户</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="ue-username" className="text-caption">用户名</Label>
            <Input id="ue-username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="用户名" className="mt-1 border-[var(--card-border)]" required />
          </div>
          <div>
            <Label htmlFor="ue-email" className="text-caption">邮箱</Label>
            <Input id="ue-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="可选" className="mt-1 border-[var(--card-border)]" />
          </div>
          <div>
            <Label htmlFor="ue-type" className="text-caption">用户类型</Label>
            <select id="ue-type" value={userType} onChange={(e) => setUserType(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm">
              <option value="pregnant">孕妇</option>
              <option value="family_member">家庭成员</option>
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
            <Button type="submit" disabled={saving}>{saving ? "保存中..." : "保存"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    userCount: 0,
    textCount: 0,
    voiceCount: 0,
    photoCount: 0,
    fileCount: 0,
    aiMessageCount: 0,
    newUserToday: 0,
    newUserMonth: 0,
  })
  const [users, setUsers] = useState<User[]>([])
  const [articles, setArticles] = useState<AdminArticle[]>([])
  const [articlesLoading, setArticlesLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "articles" | "music">("overview")
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null)
  const [musicList, setMusicList] = useState<RelaxMusic[]>([])
  const [musicLoading, setMusicLoading] = useState(false)
  const [showMusicUpload, setShowMusicUpload] = useState(false)
  const [musicUploading, setMusicUploading] = useState(false)

  useEffect(() => {
    if (!user) {
      router.replace("/login")
      return
    }
  }, [user, router])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([
      getUserCount(),
      getTextCount(),
      getVoiceCount(),
      getPhotoCount(),
      getFileCount(),
      getAiMessageCount(),
      getNewUserCountByType("day"),
      getNewUserCountByType("month"),
      getAllUsers(),
    ])
      .then(([uc, tc, vc, pc, fc, amc, nut, num, ul]) => {
        setStats({
          userCount: uc ?? 0,
          textCount: tc ?? 0,
          voiceCount: vc ?? 0,
          photoCount: pc ?? 0,
          fileCount: fc ?? 0,
          aiMessageCount: amc ?? 0,
          newUserToday: nut ?? 0,
          newUserMonth: num ?? 0,
        })
        setUsers(Array.isArray(ul) ? ul : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (activeTab === "articles") {
      setArticlesLoading(true)
      listAdminArticles()
        .then((list) => setArticles(Array.isArray(list) ? list : []))
        .catch(() => setArticles([]))
        .finally(() => setArticlesLoading(false))
    }
    if (activeTab === "music") {
      loadMusic()
    }
  }, [activeTab])

  const loadMusic = () => {
    setMusicLoading(true)
    listAllRelaxMusic()
      .then((list) => setMusicList(Array.isArray(list) ? list : []))
      .catch(() => setMusicList([]))
      .finally(() => setMusicLoading(false))
  }

  const handleMusicUpload = async (formData: {
    file: File
    title: string
    category: string
    artist?: string
    description?: string
    tags?: string
    durationSeconds?: number
    cover?: File
  }) => {
    setMusicUploading(true)
    try {
      await uploadRelaxMusic(formData)
      toast.success("音乐上传成功")
      setShowMusicUpload(false)
      loadMusic()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "上传失败")
    } finally {
      setMusicUploading(false)
    }
  }

  const player = useMusicPlayer()

  const handleMusicPlay = (music: RelaxMusic) => {
    if (!music.fileUrl) {
      toast.error("音频地址无效")
      return
    }
    if (player.track?.musicId === music.musicId && player.isPlaying) {
      player.pause()
    } else if (player.track?.musicId === music.musicId) {
      player.resume()
    } else {
      player.play({
        musicId: music.musicId,
        title: music.title,
        artist: music.artist,
        fileUrl: music.fileUrl,
        coverUrl: music.coverUrl,
        durationSeconds: music.durationSeconds,
      })
    }
  }

  const handleMusicToggle = async (music: RelaxMusic) => {
    try {
      await updateRelaxMusic({ musicId: music.musicId, isEnabled: !music.isEnabled })
      toast.success(music.isEnabled ? "已禁用" : "已启用")
      setMusicList((prev) => prev.map((m) => m.musicId === music.musicId ? { ...m, isEnabled: !m.isEnabled } : m))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "操作失败")
    }
  }

  const handleMusicDelete = async (musicId: number) => {
    if (!confirm("确定删除该音乐吗？音频文件也会一并删除。")) return
    try {
      await deleteRelaxMusic(musicId)
      toast.success("已删除")
      setMusicList((prev) => prev.filter((m) => m.musicId !== musicId))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "删除失败")
    }
  }

  const loadArticles = () => {
    listAdminArticles().then((list) => setArticles(Array.isArray(list) ? list : [])).catch(() => {})
  }

  const handleArticleDelete = async (articleId: number) => {
    try {
      await deleteArticle(articleId)
      toast.success("文章已删除")
      loadArticles()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "删除失败")
    }
  }

  if (!user) return null

  const statCards = [
    {
      label: "用户总数",
      value: stats.userCount,
      icon: Users,
      color: "border-[var(--accent-1)]/30 bg-[var(--accent-1-muted)] text-[var(--accent-1)]",
    },
    {
      label: "今日新增",
      value: stats.newUserToday,
      icon: Calendar,
      color: "border-[var(--accent-3)]/30 bg-[var(--accent-3-muted)] text-[var(--accent-3)]",
    },
    {
      label: "本月新增",
      value: stats.newUserMonth,
      icon: BarChart3,
      color: "border-[var(--accent-2)]/30 bg-[var(--accent-2-muted)] text-[var(--accent-2)]",
    },
    {
      label: "文字记录",
      value: stats.textCount,
      icon: PenLine,
      color: "border-[var(--accent-1)]/30 bg-[var(--accent-1-muted)] text-[var(--accent-1)]",
    },
    {
      label: "语音记录",
      value: stats.voiceCount,
      icon: Mic,
      color: "border-[var(--accent-2)]/30 bg-[var(--accent-2-muted)] text-[var(--accent-2)]",
    },
    {
      label: "照片记录",
      value: stats.photoCount,
      icon: Image,
      color: "border-[var(--accent-3)]/30 bg-[var(--accent-3-muted)] text-[var(--accent-3)]",
    },
    {
      label: "文件记录",
      value: stats.fileCount,
      icon: FileText,
      color: "border-[var(--foreground-muted)]/20 bg-[var(--muted)] text-[var(--foreground-secondary)]",
    },
    {
      label: "AI 对话条数",
      value: stats.aiMessageCount,
      icon: MessageSquare,
      color: "border-[var(--accent-1)]/30 bg-[var(--accent-1-muted)] text-[var(--accent-1)]",
    },
  ]

  return (
    <div className="min-h-screen px-4 pb-24 pt-14 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-[1.35rem] font-semibold text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          管理后台
        </h1>
        <p className="mt-0.5 text-caption">数据概览与用户管理</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 rounded-xl bg-[var(--muted)] p-1">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "flex-1 rounded-lg py-2.5 text-[14px] font-medium transition-colors",
            activeTab === "overview"
              ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--foreground-muted)]"
          )}
        >
          概览
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={cn(
            "flex-1 rounded-lg py-2.5 text-[14px] font-medium transition-colors",
            activeTab === "users"
              ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--foreground-muted)]"
          )}
        >
          用户
        </button>
        <button
          onClick={() => setActiveTab("articles")}
          className={cn(
            "flex-1 rounded-lg py-2.5 text-[14px] font-medium transition-colors",
            activeTab === "articles"
              ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--foreground-muted)]"
          )}
        >
          文章
        </button>
        <button
          onClick={() => setActiveTab("music")}
          className={cn(
            "flex-1 rounded-lg py-2.5 text-[14px] font-medium transition-colors",
            activeTab === "music"
              ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--foreground-muted)]"
          )}
        >
          音乐
        </button>
      </div>

      {loading && activeTab !== "articles" ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent-1)]/30 border-t-[var(--accent-1)]" />
        </div>
      ) : activeTab === "overview" ? (
        <>
          {/* Stats Grid — 响应式 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {statCards.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="card-elevated flex flex-col items-center gap-2 rounded-xl p-4"
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg border",
                      stat.color
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <span className="text-xl font-bold text-[var(--foreground)]">{stat.value}</span>
                  <span className="text-center text-[12px] text-caption">{stat.label}</span>
                </div>
              )
            })}
          </div>

          {/* 记录类型分布 */}
          <div className="card-elevated mt-6 rounded-xl p-5">
            <h2 className="text-[15px] font-semibold text-[var(--foreground)]">记录类型分布</h2>
            <div className="mt-4 space-y-3">
              {[
                { label: "文字", count: stats.textCount, color: "bg-[var(--accent-1)]" },
                { label: "语音", count: stats.voiceCount, color: "bg-[var(--accent-2)]" },
                { label: "照片", count: stats.photoCount, color: "bg-[var(--accent-3)]" },
                { label: "文件", count: stats.fileCount, color: "bg-[var(--foreground-muted)]" },
              ].map((item) => {
                const total = stats.textCount + stats.voiceCount + stats.photoCount + stats.fileCount
                const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-[var(--foreground-secondary)]">{item.label}</span>
                      <span className="font-medium text-[var(--foreground)]">
                        {item.count} ({pct}%)
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                      <div
                        className={cn("h-full rounded-full transition-all", item.color)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      ) : activeTab === "users" ? (
        <div className="card-elevated overflow-hidden rounded-xl">
          {users.length === 0 ? (
            <div className="py-12 text-center text-caption">暂无用户数据</div>
          ) : (
            <div className="divide-y divide-[var(--card-border)]">
              {users.map((u) => (
                <div
                  key={u.userId}
                  className="flex items-center gap-4 px-4 py-3.5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--accent-1)]/30 bg-[var(--accent-1-muted)] text-[var(--accent-1)]">
                    <span className="text-sm font-semibold">
                      {(u.username || "?").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--foreground)]">{u.username}</p>
                    <p className="text-[12px] text-caption">
                      ID {u.userId}
                      {(u.createdAt ?? u.createTime) && (
                        <> · 注册于 {format(new Date((u.createdAt ?? u.createTime)!), "yyyy/M/d", { locale: zhCN })}</>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => setEditingUser(u)}
                      className="rounded-lg border border-[var(--card-border)] p-2 text-[var(--foreground-muted)] hover:bg-[var(--muted)]"
                      aria-label="编辑"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("确定删除该用户吗？此操作不可恢复。")) {
                          setDeletingUserId(u.userId)
                          deleteUser(u.userId)
                            .then(() => {
                              toast.success("已删除")
                              setUsers((prev) => prev.filter((x) => x.userId !== u.userId))
                            })
                            .catch((e) => toast.error(e instanceof Error ? e.message : "删除失败"))
                            .finally(() => setDeletingUserId(null))
                        }
                      }}
                      disabled={deletingUserId === u.userId}
                      className="rounded-lg border border-[var(--critical)]/30 p-2 text-[var(--critical)] hover:bg-[var(--critical-muted)] disabled:opacity-50"
                      aria-label="删除"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === "articles" ? (
        <div className="card-elevated overflow-hidden rounded-xl">
          <div className="flex items-center justify-between border-b border-[var(--card-border)] px-4 py-4">
            <h2 className="text-[15px] font-semibold text-[var(--foreground)]">文章列表</h2>
            <button
              onClick={() => router.push("/admin/article/new")}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--accent-1)] px-3 py-2 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              新增
            </button>
          </div>
          {articlesLoading ? (
            <div className="flex min-h-[120px] items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent-1)]/30 border-t-[var(--accent-1)]" />
            </div>
          ) : articles.length === 0 ? (
            <div className="py-12 text-center text-caption">暂无文章</div>
          ) : (
            <div className="divide-y divide-[var(--card-border)]">
              {articles.map((a) => (
                <div key={a.articleId} className="flex items-center justify-between gap-4 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--foreground)] truncate">{a.title}</p>
                    <p className="text-[12px] text-caption">
                      ID {a.articleId}
                      {a.category && ` · ${a.category}`}
                      {a.isPublished === false && " · 未发布"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => router.push(`/admin/article/${a.articleId}`)}
                      className="rounded-lg border border-[var(--card-border)] p-2 text-[var(--foreground-muted)] hover:bg-[var(--muted)]"
                      aria-label="编辑"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("确定删除该文章吗？")) return
                        try {
                          await deleteArticle(a.articleId)
                          toast.success("已删除")
                          setArticles((prev) => prev.filter((x) => x.articleId !== a.articleId))
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "删除失败")
                        }
                      }}
                      className="rounded-lg border border-[var(--critical)]/30 p-2 text-[var(--critical)] hover:bg-[var(--critical-muted)]"
                      aria-label="删除"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === "music" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-[var(--foreground)]">放松音乐管理</h2>
            <button
              onClick={() => setShowMusicUpload(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--accent-1)] px-3 py-2 text-sm font-medium text-white"
            >
              <Upload className="h-4 w-4" strokeWidth={2} />
              上传音乐
            </button>
          </div>

          {musicLoading ? (
            <div className="flex min-h-[120px] items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent-1)]/30 border-t-[var(--accent-1)]" />
            </div>
          ) : musicList.length === 0 ? (
            <div className="card-elevated rounded-xl py-12 text-center text-caption">
              暂无音乐，点击上方按钮上传
            </div>
          ) : (
            <div className="card-elevated overflow-hidden rounded-xl divide-y divide-[var(--card-border)]">
              {musicList.map((m) => (
                <div key={m.musicId} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--accent-2)]/30 bg-[var(--accent-2-muted)]">
                    <Music className="h-5 w-5 text-[var(--accent-2)]" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--foreground)] truncate">{m.title}</p>
                    <p className="text-[12px] text-caption truncate">
                      {m.artist && `${m.artist} · `}
                      {m.category === "healing" ? "疗愈音乐" : "推荐聆听"}
                      {m.tags && ` · ${m.tags}`}
                      {m.durationSeconds && ` · ${Math.floor(m.durationSeconds / 60)}:${String(m.durationSeconds % 60).padStart(2, "0")}`}
                      {!m.isEnabled && " · 已禁用"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      onClick={() => handleMusicPlay(m)}
                      className="rounded-lg border border-[var(--accent-1)]/30 p-2 text-[var(--accent-1)] hover:bg-[var(--accent-1-muted)] transition-colors"
                      aria-label="播放预览"
                      title="播放预览"
                    >
                      {player.track?.musicId === m.musicId && player.isPlaying ? (
                        <Pause className="h-4 w-4" strokeWidth={1.75} />
                      ) : (
                        <Play className="h-4 w-4" strokeWidth={1.75} />
                      )}
                    </button>
                    <button
                      onClick={() => handleMusicToggle(m)}
                      className={cn(
                        "rounded-lg border p-2 transition-colors",
                        m.isEnabled
                          ? "border-[var(--accent-2)]/30 text-[var(--accent-2)] hover:bg-[var(--accent-2-muted)]"
                          : "border-[var(--foreground-muted)]/30 text-[var(--foreground-muted)] hover:bg-[var(--muted)]"
                      )}
                      aria-label={m.isEnabled ? "禁用" : "启用"}
                      title={m.isEnabled ? "点击禁用" : "点击启用"}
                    >
                      {m.isEnabled ? <Power className="h-4 w-4" strokeWidth={1.75} /> : <PowerOff className="h-4 w-4" strokeWidth={1.75} />}
                    </button>
                    <button
                      onClick={() => handleMusicDelete(m.musicId)}
                      className="rounded-lg border border-[var(--critical)]/30 p-2 text-[var(--critical)] hover:bg-[var(--critical-muted)]"
                      aria-label="删除"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showMusicUpload && (
            <MusicUploadModal
              uploading={musicUploading}
              onClose={() => setShowMusicUpload(false)}
              onUpload={handleMusicUpload}
            />
          )}
        </div>
      ) : null}

      {/* 用户编辑弹窗 */}
      {editingUser && (
        <UserEditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={(u) => {
            setUsers((prev) => prev.map((x) => (x.userId === u.userId ? u : x)))
            setEditingUser(null)
            toast.success("已更新")
          }}
          updateUser={updateUser}
          toast={toast}
        />
      )}

      <p className="mt-8 text-center text-micro">管理后台</p>
    </div>
  )
}
