"use client"

import { useEffect, useState } from "react"
import { useBack } from "@/lib/use-back"
import { ArrowLeft, Trash2, ChevronRight, User, Mail } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getEmailEnabled, updateEmailEnabled, updateUserType } from "@/lib/api/user"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
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

const FAMILY_ROLES = ["配偶", "婆婆", "妈妈", "爸爸", "其他"] as const

export default function SettingsPage() {
  const goBack = useBack("/profile")
  const { user, setUser } = useAuth()
  const [updating, setUpdating] = useState(false)
  const [emailEnabled, setEmailEnabledState] = useState(true)
  const [emailLoading, setEmailLoading] = useState(true)

  const [selectedRole, setSelectedRole] = useState<string>("")
  const [customRole, setCustomRole] = useState("")

  useEffect(() => {
    if (user?.defaultRelationship) {
      const found = FAMILY_ROLES.find((r) => r === user.defaultRelationship)
      if (found && found !== "其他") {
        setSelectedRole(found)
      } else if (user.defaultRelationship) {
        setSelectedRole("其他")
        setCustomRole(user.defaultRelationship)
      }
    }
  }, [user?.defaultRelationship])

  useEffect(() => {
    if (!user?.userId) {
      setEmailLoading(false)
      return
    }
    getEmailEnabled(user.userId)
      .then((v) => setEmailEnabledState(v ?? true))
      .catch(() => setEmailEnabledState(true))
      .finally(() => setEmailLoading(false))
  }, [user?.userId])

  const handleIdentityChange = async (
    newType: "pregnant" | "family_member",
    relationship?: string
  ) => {
    if (!user) return
    if (newType === user.userType && !relationship) return

    if (newType === "family_member" && selectedRole === "其他" && !customRole.trim()) {
      toast.error("请输入自定义身份")
      return
    }

    setUpdating(true)
    try {
      const rel = relationship || (selectedRole === "其他" ? customRole.trim() : selectedRole) || undefined
      const updated = await updateUserType(
        user.userId,
        newType,
        newType === "family_member" ? rel : undefined
      )
      setUser({
        ...user,
        userType: updated.userType ?? newType,
        defaultRelationship: updated.defaultRelationship ?? user.defaultRelationship,
      })
      toast.success("身份已更新")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "更新失败"
      toast.error(msg)
    } finally {
      setUpdating(false)
    }
  }

  const handleClearCache = () => {
    try {
      sessionStorage.clear()
      toast.success("缓存已清除")
    } catch {
      toast.success("缓存已清除")
    }
  }

  const toggleEmailEnabled = async (enabled: boolean) => {
    if (!user?.userId) return
    setEmailEnabledState(enabled)
    try {
      await updateEmailEnabled(user.userId, enabled)
      toast.success("设置已更新")
    } catch {
      setEmailEnabledState(!enabled)
      toast.error("保存失败，请重试")
    }
  }

  const isPregnant = user?.userType === "pregnant"

  return (
    <div className="min-h-dvh">
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4" style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(24px) saturate(1.3)", WebkitBackdropFilter: "blur(24px) saturate(1.3)" }}>
        <button
          onClick={goBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary transition-colors active:bg-secondary/80"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">通用设置</h1>
      </div>

      <div className="space-y-4 px-4 pb-8">
        {!emailLoading && user && (
          <div>
            <p className="mb-2 px-2 text-xs font-medium text-[var(--foreground-muted)]">
              通知
            </p>
            <div className="glass-card overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-1)]/15 text-[var(--accent-1)]">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--foreground)]">接收邮箱消息</p>
                  <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                    关闭后将收不到任何邮件（含提醒/验证码等）
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleEmailEnabled(!emailEnabled)}
                  className={`h-7 w-12 rounded-full p-1 transition-colors ${
                    emailEnabled ? "bg-[var(--accent-1)]" : "bg-[var(--muted)]"
                  }`}
                  aria-label="toggle-email"
                >
                  <span
                    className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                      emailEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {user && (
          <div>
            <p className="mb-2 px-2 text-xs font-medium text-[var(--foreground-muted)]">
              身份
            </p>
            <div className="glass-card overflow-hidden">
              <div className="flex items-center gap-3 border-b border-white/30 px-4 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-1)]/15 text-[var(--accent-1)]">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">身份切换</p>
                  <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                    当前：{isPregnant ? "孕妇本人" : (user.defaultRelationship || "家庭成员")}
                  </p>
                </div>
              </div>

              <div className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleIdentityChange("pregnant")}
                    disabled={updating}
                    className={cn(
                      "rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50",
                      isPregnant
                        ? "border-[var(--accent-1)] bg-[var(--accent-1)]/20 text-[var(--accent-1)]"
                        : "border-[var(--card-border)] text-[var(--foreground-secondary)] hover:border-[var(--accent-1)]/40"
                    )}
                  >
                    孕妇本人
                  </button>
                  {FAMILY_ROLES.filter((r) => r !== "其他").map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        setSelectedRole(role)
                        handleIdentityChange("family_member", role)
                      }}
                      disabled={updating}
                      className={cn(
                        "rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50",
                        !isPregnant && selectedRole === role
                          ? "border-[var(--accent-1)] bg-[var(--accent-1)]/20 text-[var(--accent-1)]"
                          : "border-[var(--card-border)] text-[var(--foreground-secondary)] hover:border-[var(--accent-1)]/40"
                      )}
                    >
                      {role}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole("其他")
                      if (customRole.trim()) {
                        handleIdentityChange("family_member", customRole.trim())
                      }
                    }}
                    disabled={updating}
                    className={cn(
                      "rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50",
                      !isPregnant && selectedRole === "其他"
                        ? "border-[var(--accent-1)] bg-[var(--accent-1)]/20 text-[var(--accent-1)]"
                        : "border-[var(--card-border)] text-[var(--foreground-secondary)] hover:border-[var(--accent-1)]/40"
                    )}
                  >
                    其他
                  </button>
                </div>

                {!isPregnant && selectedRole === "其他" && (
                  <div className="mt-3 flex gap-2">
                    <input
                      placeholder="请输入身份，如：舅舅、叔叔"
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      className="flex-1 rounded-lg border border-[var(--card-border)] bg-[var(--background-alt)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent-1)]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customRole.trim()) handleIdentityChange("family_member", customRole.trim())
                      }}
                      disabled={updating || !customRole.trim()}
                      className="shrink-0 rounded-lg bg-[var(--accent-1)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      确认
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 px-2 text-xs font-medium text-[var(--foreground-muted)]">
            存储
          </p>
          <div className="glass-card overflow-hidden">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors active:bg-white/30">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--critical)]/10 text-[var(--critical)]">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      清除缓存
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                      清除本地缓存数据，释放存储空间
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--foreground-muted)]" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>清除缓存</AlertDialogTitle>
                  <AlertDialogDescription>
                    确定要清除本地缓存吗？这不会删除您的账号数据。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearCache}>
                    确认清除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="pt-4 text-center">
          <p className="text-sm text-[var(--foreground-muted)]">孕期宝 v1.0.0</p>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
            Copyright 2024 孕期宝
          </p>
        </div>
      </div>
    </div>
  )
}
