"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { changePassword, sendPasswordCode, changePasswordByCode } from "@/lib/api/user"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

function maskEmail(email: string) {
  if (!email || !email.includes("@")) return email
  const [local, domain] = email.split("@")
  if (local.length <= 2) return `${local[0]}***@${domain}`
  return `${local.slice(0, 2)}***@${domain}`
}

export default function ChangePasswordPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [mode, setMode] = useState<"old" | "code">("old")
  const [oldPassword, setOldPassword] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [codeSending, setCodeSending] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const hasEmail = !!user?.email?.trim()

  const handleSendCode = async () => {
    if (!user) return
    if (!hasEmail) {
      toast.error("请先绑定邮箱")
      return
    }
    setCodeSending(true)
    try {
      await sendPasswordCode({ userId: user.userId })
      toast.success("验证码已发送到您的邮箱")
      setCountdown(60)
      const t = setInterval(() => {
        setCountdown((c) => (c <= 1 ? (clearInterval(t), 0) : c - 1))
      }, 1000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "发送失败")
    } finally {
      setCodeSending(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!newPassword || !confirmPassword) {
      toast.error("请填写新密码并确认")
      return
    }
    if (newPassword.length < 6) {
      toast.error("新密码至少 6 位")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("两次输入的新密码不一致")
      return
    }
    setLoading(true)
    try {
      if (mode === "old") {
        if (!oldPassword) {
          toast.error("请输入原密码")
          setLoading(false)
          return
        }
        if (oldPassword === newPassword) {
          toast.error("新密码不能与原密码相同")
          setLoading(false)
          return
        }
        await changePassword(user.userId, oldPassword, newPassword)
      } else {
        if (!code.trim()) {
          toast.error("请输入验证码")
          setLoading(false)
          return
        }
        await changePasswordByCode({ userId: user.userId, code: code.trim(), newPassword })
      }
      toast.success("密码已修改")
      setOldPassword("")
      setCode("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "修改失败")
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-dvh bg-background">
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-background/95 px-4 py-4 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary transition-colors active:bg-secondary/80"
          aria-label="返回"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">修改密码</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 px-4 pt-6">
        <div className="flex gap-4 rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-2">
          <button
            type="button"
            onClick={() => setMode("old")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${mode === "old" ? "bg-[var(--accent-1)] text-white" : "text-[var(--foreground-muted)]"}`}
          >
            原密码验证
          </button>
          <button
            type="button"
            onClick={() => setMode("code")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${mode === "code" ? "bg-[var(--accent-1)] text-white" : "text-[var(--foreground-muted)]"}`}
          >
            邮箱验证码
          </button>
        </div>

        {mode === "old" && (
          <div>
            <Label htmlFor="old">原密码</Label>
            <Input
              id="old"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="请输入原密码"
              className="mt-2"
              autoComplete="current-password"
            />
          </div>
        )}

        {mode === "code" && (
          <>
            {!hasEmail ? (
              <p className="text-caption text-[var(--foreground-muted)]">
                请先
                <Link href="/profile/bind-email" className="text-[var(--accent-1)] underline">
                  绑定邮箱
                </Link>
                后再使用验证码修改密码。
              </p>
            ) : (
              <div>
                <Label>验证码</Label>
                <p className="mt-1 text-caption text-[var(--foreground-muted)]">
                  将发送至 {maskEmail(user.email ?? "")}
                </p>
                <div className="mt-2 flex gap-2">
                  <Input
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6 位验证码"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={codeSending || countdown > 0}
                    onClick={handleSendCode}
                    className="shrink-0"
                  >
                    {countdown > 0 ? `${countdown}s 后重发` : codeSending ? "发送中..." : "获取验证码"}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        <div>
          <Label htmlFor="new">新密码</Label>
          <Input
            id="new"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="至少 6 位"
            className="mt-2"
            autoComplete="new-password"
          />
        </div>
        <div>
          <Label htmlFor="confirm">确认新密码</Label>
          <Input
            id="confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="再次输入新密码"
            className="mt-2"
            autoComplete="new-password"
          />
        </div>
        <Button
          type="submit"
          disabled={loading || (mode === "code" && !hasEmail)}
          className="w-full"
        >
          {loading ? "提交中..." : "确认修改"}
        </Button>
      </form>
    </div>
  )
}
