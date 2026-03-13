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
      <DialogContent className="border-[var(--card-border)] bg-[var(--card)] sm:max-w-md">
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
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "articles">("overview")
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null)

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
  }, [activeTab])

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
          数据概览
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
          用户列表
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
          文章管理
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
      ) : (
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
      )}

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
