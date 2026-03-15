"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { addMonths } from "date-fns"
import {
  Calendar,
  ChevronRight,
  BookOpen,
  Heart,
  Settings,
  Bell,
  Shield,
  KeyRound,
  HelpCircle,
  Star,
  LogOut,
  BarChart3,
  Target,
  Users,
  Mail,
  Wind,
  FileText,
  ListTodo,
  Theater,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { updatePregnancy, updateUsername, uploadAvatar, updateAvatar } from "@/lib/api/user"
import { getAllEnriched, type MemoItem } from "@/lib/api/memo"
import { getUnreadCount } from "@/lib/api/notifications"
import { getCreatorPregnancy } from "@/lib/api/family"
import { getPregnancyInfo } from "@/lib/pregnancy"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { DateInput } from "@/components/date-input"
import { toast } from "sonner"

export default function ProfilePage() {
  const router = useRouter()
  const { user, setUser, logout } = useAuth()

  const [editOpen, setEditOpen] = useState(false)
  const [editUsername, setEditUsername] = useState(user?.username ?? "")
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null)
  const [editLastMenstrualDate, setEditLastMenstrualDate] = useState(
    user?.lastMenstrualDate ? user.lastMenstrualDate.slice(0, 10) : ""
  )
  const [editDueDate, setEditDueDate] = useState(
    user?.pregnancyTime ? user.pregnancyTime.slice(0, 10) : ""
  )
  const [saving, setSaving] = useState(false)
  const [records, setRecords] = useState<MemoItem[]>([])
  const [loadingRecords, setLoadingRecords] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [creatorPregnancy, setCreatorPregnancy] = useState<{
    creatorUsername: string
    recordCount: number
    lastMenstrualDate: string | null
    pregnancyTime: string | null
  } | null>(null)

  // Fetch user records count（孕妇本人）
  useEffect(() => {
    if (!user) return
    setLoadingRecords(true)
    getAllEnriched(user.userId)
      .then((data) => setRecords(data || []))
      .catch(() => setRecords([]))
      .finally(() => setLoadingRecords(false))
  }, [user])

  // 家庭成员或孕妇本人：拉取怀孕进度与记录统计（总/妈/爸）
  useEffect(() => {
    if (!user) {
      setCreatorPregnancy(null)
      return
    }
    if (user.userType !== "family_member" && user.userType !== "pregnant") {
      setCreatorPregnancy(null)
      return
    }
    getCreatorPregnancy(user.userId)
      .then((data) => {
        if (data && (data.lastMenstrualDate || data.pregnancyTime || typeof data.recordCount === "number"))
          setCreatorPregnancy({
            creatorUsername: data.creatorUsername || "孕妇",
            recordCount: data.recordCount ?? 0,
            recordCountTotal: data.recordCountTotal,
            recordCountMom: data.recordCountMom,
            recordCountDad: data.recordCountDad,
            lastMenstrualDate: data.lastMenstrualDate ?? null,
            pregnancyTime: data.pregnancyTime ?? null,
          })
        else setCreatorPregnancy(null)
      })
      .catch(() => setCreatorPregnancy(null))
  }, [user?.userId, user?.userType])

  // Fetch unread notifications count (poll; toast when new messages arrive)
  useEffect(() => {
    if (!user) return
    let prev = 0
    const fetchUnread = () => {
      getUnreadCount(user.userId)
        .then((n) => {
          const count = n ?? 0
          if (count > prev) toast.info(`您有 ${count} 条未读站内消息`, { id: "unread-notifications" })
          prev = count
          setUnreadCount(count)
        })
        .catch(() => setUnreadCount(0))
    }
    fetchUnread()
    const t = setInterval(fetchUnread, 30000)
    return () => clearInterval(t)
  }, [user])

  if (!user) return null

  // 孕妇本人用自己数据；家庭成员用创建者（孕妇）数据展示怀孕进度
  const info =
    user.userType === "pregnant" && user.pregnancyTime
      ? getPregnancyInfo(user.lastMenstrualDate ?? user.pregnancyTime, user.pregnancyTime)
      : creatorPregnancy?.lastMenstrualDate || creatorPregnancy?.pregnancyTime
        ? getPregnancyInfo(
            creatorPregnancy.lastMenstrualDate ?? creatorPregnancy.pregnancyTime!,
            creatorPregnancy.pregnancyTime ?? undefined
          )
        : null

  const handleSave = async () => {
    const usernameChanged = editUsername.trim() && editUsername.trim() !== user.username
    const pregnancyChanged =
      user.userType === "pregnant" &&
      editLastMenstrualDate && editDueDate &&
      (editLastMenstrualDate !== (user.lastMenstrualDate?.slice(0, 10) ?? "") || editDueDate !== (user.pregnancyTime?.slice(0, 10) ?? ""))
    const hasChanges = usernameChanged || editAvatarFile || pregnancyChanged
    if (!hasChanges) {
      toast.error("请至少修改一项")
      return
    }
    if (user.userType === "pregnant" && (editLastMenstrualDate || editDueDate) && (!editLastMenstrualDate || !editDueDate)) {
      toast.error("怀孕日和预产期需同时填写")
      return
    }
    setSaving(true)
    try {
      let updated = { ...user }
      if (editUsername.trim() && editUsername.trim() !== user.username) {
        const u = await updateUsername(user.userId, editUsername.trim())
        updated = { ...updated, username: u.username ?? updated.username }
      }
      if (editAvatarFile) {
        const u = user.avatarUrl
          ? await updateAvatar(user.userId, editAvatarFile)
          : await uploadAvatar(user.userId, editAvatarFile)
        updated = { ...updated, avatarUrl: u.avatarUrl ?? updated.avatarUrl }
      }
      if (pregnancyChanged) {
        await updatePregnancy(user.userId, editLastMenstrualDate!, editDueDate!)
        updated = {
          ...updated,
          lastMenstrualDate: editLastMenstrualDate.slice(0, 10),
          pregnancyTime: editDueDate.includes("T") ? editDueDate : `${editDueDate}T00:00:00`,
        }
      }
      setUser(updated)
      setEditAvatarFile(null)
      setEditOpen(false)
      toast.success("已更新")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新失败")
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
    toast.success("已退出登录")
  }

  const recordDisplay =
    (user.userType === "family_member" || user.userType === "pregnant") && creatorPregnancy && typeof creatorPregnancy.recordCountTotal === "number"
      ? `共 ${creatorPregnancy.recordCountTotal} 条 · 妈妈 ${creatorPregnancy.recordCountMom ?? 0} · 爸爸 ${creatorPregnancy.recordCountDad ?? 0}`
      : user.userType === "family_member" && creatorPregnancy
        ? (creatorPregnancy.recordCount ?? "-")
        : loadingRecords
          ? "-"
          : records.length

  const stats = [
    {
      label: "孕期记录",
      value: recordDisplay,
      icon: BookOpen,
      color: "border-[var(--accent-1)]/30 bg-[var(--accent-1-muted)] text-[var(--accent-1)]",
    },
    {
      label: "孕期天数",
      value: info?.daysPassed ?? "-",
      icon: Heart,
      color: "border-[var(--accent-3)]/30 bg-[var(--accent-3-muted)] text-[var(--accent-3)]",
    },
    {
      label: "距预产期",
      value: info?.daysRemaining ?? "-",
      icon: Calendar,
      color: "border-[var(--accent-2)]/30 bg-[var(--accent-2-muted)] text-[var(--accent-2)]",
      suffix: "天",
    },
  ]

  const isAdmin = ["admin", "administrator"].includes((user?.username ?? "").toLowerCase())

  const menuItems = [
    ...(isAdmin ? [{ label: "管理后台", icon: BarChart3, href: "/admin" }] : []),
    ...(user.userType === "pregnant" ? [
      { label: "孕期小目标", icon: Target, href: "/goals" },
      { label: "减压放松", icon: Wind, href: "/relax" },
    ] : []),
    ...((user.userType === "pregnant" || user.isSpouse === true) ? [
      { label: "孕期百科", icon: FileText, href: "/articles" },
      { label: "爸爸成长营", icon: ListTodo, href: "/tasks" },
    ] : []),
    ...(user.isSpouse === true ? [{ label: "情景演绎", icon: Theater, href: "/scenario" }] : []),
    { label: "站内消息", icon: Bell, href: "/notifications" },
    ...(user.userType === "pregnant" ? [{ label: "我的模板作品", icon: Star, href: "/profile/my-posts" }] : []),
    { label: "我们的小家", icon: Users, href: "/family" },
    { label: user?.email ? "邮箱（已绑定）" : "邮箱与安全", icon: Mail, href: "/profile/bind-email" },
    { label: "修改密码", icon: KeyRound, href: "/profile/change-password" },
    { label: "消息通知", icon: Bell, href: "/profile/notifications" },
    { label: "隐私设置", icon: Shield, href: "/profile/privacy" },
    { label: "通用设置", icon: Settings, href: "/profile/settings" },
    { label: "帮助中心", icon: HelpCircle, href: "/profile/help" },
    { label: "给我们评分", icon: Star, href: "/profile/rate" },
  ]

  return (
    <div className="px-6 pt-14 pb-8">
      {/* Profile Header */}
      <div className="card-elevated rounded-xl p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 shrink-0 border-2 border-[var(--accent-1)]/30">
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={user.username} />
            ) : null}
            <AvatarFallback
              className="text-lg font-semibold text-[var(--accent-1)]"
              style={{ backgroundColor: "var(--accent-1-muted)" }}
            >
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1
              className="text-[1.2rem] font-semibold text-[var(--foreground)]"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {user.username}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-caption">
              <span className="rounded-full bg-[var(--accent-1-muted)] px-2 py-0.5 text-xs text-[var(--accent-1)]">
                {user.userType === "family_member" ? "家庭成员 · 仅查看" : "孕妇本人 · 可记录"}
              </span>
              {info && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {user.userType === "family_member" && creatorPregnancy
                    ? `${creatorPregnancy.creatorUsername} 的预产期 ${info.dueDateFormatted}`
                    : `预产期 ${info.dueDateFormatted}`}
                </span>
              )}
            </div>
          </div>
          <Dialog
            open={editOpen}
            onOpenChange={(open) => {
              setEditOpen(open)
              if (open && user) {
                setEditUsername(user.username ?? "")
                setEditAvatarFile(null)
                setEditLastMenstrualDate(user.lastMenstrualDate ? user.lastMenstrualDate.slice(0, 10) : "")
                setEditDueDate(user.pregnancyTime ? user.pregnancyTime.slice(0, 10) : "")
              }
            }}
          >
            <DialogTrigger asChild>
              <button className="rounded-lg border border-[var(--card-border)] bg-[var(--muted)] px-3 py-2 text-[12px] font-medium text-[var(--foreground-secondary)] transition-colors active:bg-[var(--card)]">
                编辑
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-sm border-[var(--card-border)]">
              <DialogHeader>
                <DialogTitle className="text-[var(--foreground)]">编辑资料</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label className="text-caption font-medium">用户名</Label>
                  <Input
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="mt-1.5 border-[var(--card-border)]"
                    placeholder="请输入用户名"
                  />
                </div>
                <div>
                  <Label className="text-caption font-medium">头像</Label>
                  <div className="mt-1.5 flex items-center gap-3">
                    <Avatar className="h-12 w-12 shrink-0 border border-[var(--card-border)]">
                      {editAvatarFile ? (
                        <AvatarImage src={URL.createObjectURL(editAvatarFile)} alt="预览" />
                      ) : user.avatarUrl ? (
                        <AvatarImage src={user.avatarUrl} alt={user.username} />
                      ) : null}
                      <AvatarFallback className="text-sm text-[var(--accent-1)]">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <label className="cursor-pointer rounded-lg border border-[var(--card-border)] bg-[var(--muted)] px-3 py-2 text-[13px] font-medium text-[var(--foreground-secondary)] transition-colors active:bg-[var(--card)]">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setEditAvatarFile(e.target.files?.[0] ?? null)}
                      />
                      {editAvatarFile ? "已选择，点击更换" : "选择图片"}
                    </label>
                    {editAvatarFile && (
                      <button
                        type="button"
                        onClick={() => setEditAvatarFile(null)}
                        className="text-micro text-[var(--foreground-muted)]"
                      >
                        取消
                      </button>
                    )}
                  </div>
                </div>
                {user.userType === "pregnant" && (() => {
                  const pregnancyStart = editLastMenstrualDate && /^\d{4}-\d{2}-\d{2}$/.test(editLastMenstrualDate) ? editLastMenstrualDate : null
                  const today = new Date()
                  const todayStr = today.toISOString().split("T")[0]
                  const dueMin = pregnancyStart ?? todayStr
                  const dueMax = pregnancyStart
                    ? addMonths(new Date(pregnancyStart + "T00:00:00"), 13).toISOString().split("T")[0]
                    : addMonths(today, 13).toISOString().split("T")[0]
                  return (
                    <>
                      <div>
                        <DateInput
                          label="怀孕日（末次月经）"
                          value={editLastMenstrualDate}
                          onChange={setEditLastMenstrualDate}
                        />
                      </div>
                      <div>
                        <DateInput
                          label="预产期"
                          value={editDueDate}
                          onChange={setEditDueDate}
                          min={dueMin}
                          max={dueMax}
                        />
                      </div>
                    </>
                  )
                })()}
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full rounded-xl font-semibold"
                  style={{ backgroundColor: "var(--accent-2)", color: "var(--foreground)" }}
                >
                  {saving ? "保存中..." : "保存"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          const isRecordStat = stat.label === "孕期记录"
          return (
            <div
              key={stat.label}
              className="card-elevated flex min-w-0 flex-col items-center gap-2 rounded-xl py-4"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${stat.color}`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <span
                className={`min-w-0 max-w-full break-words text-center font-bold text-[var(--foreground)] ${isRecordStat ? "text-sm leading-tight" : "text-[1.25rem]"}`}
              >
                {stat.value}
                {stat.suffix && stat.value !== "-" && (
                  <span className="text-caption font-normal">{stat.suffix}</span>
                )}
              </span>
              <span className="text-micro shrink-0">{stat.label}</span>
            </div>
          )
        })}
      </div>

      {/* Pregnancy Progress Card — 孕妇本人或家庭成员（展示孕妇进度） */}
      {info && (user.userType === "pregnant" || creatorPregnancy) && (
        <div className="card-elevated mt-6 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[15px] font-medium text-[var(--foreground)]">
                {user.userType === "family_member" && creatorPregnancy ? "孕妇的怀孕进度" : "孕期进度"}
              </p>
              <p className="mt-0.5 text-caption">
                第{info.weeksPregnant}周{info.daysInCurrentWeek}天 · 第{info.trimester}孕期
              </p>
            </div>
            <span className="text-2xl font-bold text-[var(--accent-1)]">
              {Math.round(info.progress)}%
            </span>
          </div>
          <div className="progress-premium mt-3">
            <div
              className="progress-premium-fill"
              style={{ width: `${Math.min(info.progress, 100)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-micro">
            <span>怀孕第1天</span>
            <span>预产期</span>
          </div>
        </div>
      )}

      {/* Menu — clean list, subtle dividers */}
      <div className="card-elevated mt-6 overflow-hidden rounded-xl">
        {menuItems.map((item, index) => {
          const Icon = item.icon
          return (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className={`flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors active:bg-[var(--muted)] ${
                index < menuItems.length - 1 ? "border-b border-[var(--card-border)]" : ""
              }`}
            >
              <Icon className="h-5 w-5 text-[var(--foreground-muted)]" strokeWidth={1.75} />
              <span className="flex-1 text-[15px] font-medium text-[var(--foreground)]">
                {item.label}
              </span>
              {item.href === "/notifications" && unreadCount > 0 && (
                <span className="rounded-full bg-[var(--critical)] px-2 py-0.5 text-[11px] font-medium text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
              <ChevronRight className="h-4 w-4 text-[var(--foreground-muted)]" strokeWidth={1.75} />
            </button>
          )
        })}
      </div>

      {/* Logout Button */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--card)] py-3.5 text-[14px] font-medium text-[var(--critical)] transition-colors active:bg-[var(--critical-muted)]">
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            退出登录
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="border-[var(--card-border)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[var(--foreground)]">确认退出</AlertDialogTitle>
            <AlertDialogDescription className="text-caption">
              确定要退出登录吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-[var(--critical)] text-white hover:opacity-90"
            >
              确认退出
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Version */}
      <p className="mt-8 text-center text-micro">孕期宝 v1.0.0</p>
    </div>
  )
}
