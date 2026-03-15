"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mail, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { sendPasswordCode, changePasswordByCode } from "@/lib/api/user"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [codeSending, setCodeSending] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const handleSendCode = async () => {
    if (!email.trim()) {
      toast.error("请输入邮箱")
      return
    }
    setCodeSending(true)
    try {
      await sendPasswordCode({ email: email.trim() })
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
    if (!email.trim()) {
      toast.error("请输入邮箱")
      return
    }
    if (!code.trim()) {
      toast.error("请输入验证码")
      return
    }
    if (newPassword.length < 6) {
      toast.error("密码至少 6 位")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("两次输入的密码不一致")
      return
    }
    setLoading(true)
    try {
      await changePasswordByCode({
        email: email.trim(),
        code: code.trim(),
        newPassword,
      })
      toast.success("密码已重置，请登录")
      router.push("/login")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "重置失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card-elevated w-full max-w-sm rounded-xl p-8">
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)]"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        返回登录
      </Link>
      <div className="mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--accent-1)]/40 bg-[var(--accent-1-muted)]">
          <Mail className="h-6 w-6 text-[var(--accent-1)]" strokeWidth={1.75} />
        </div>
        <h1
          className="mt-4 text-[1.25rem] font-semibold text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          找回密码
        </h1>
        <p className="mt-1.5 text-caption">
          向已绑定邮箱发送 6 位验证码，验证后可重置密码
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">邮箱</Label>
          <Input
            id="email"
            type="email"
            placeholder="请输入已绑定的邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="rounded-lg border-[var(--card-border)] bg-[var(--card)]"
          />
        </div>
        <div className="space-y-2">
          <Label>验证码</Label>
          <div className="flex gap-2">
            <Input
              inputMode="numeric"
              maxLength={6}
              placeholder="6 位验证码"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="flex-1 rounded-lg border-[var(--card-border)] bg-[var(--card)]"
            />
            <Button
              type="button"
              variant="outline"
              disabled={codeSending || countdown > 0}
              onClick={handleSendCode}
              className="shrink-0"
            >
              {countdown > 0 ? `${countdown}s` : codeSending ? "发送中" : "获取验证码"}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">新密码</Label>
          <Input
            id="newPassword"
            type="password"
            placeholder="请输入新密码（至少 6 位）"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            className="rounded-lg border-[var(--card-border)] bg-[var(--card)]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">确认新密码</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="再次输入新密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            className="rounded-lg border-[var(--card-border)] bg-[var(--card)]"
          />
        </div>
        <Button
          type="submit"
          className="w-full rounded-xl font-semibold"
          style={{ backgroundColor: "var(--accent-1)", color: "white" }}
          disabled={loading}
        >
          {loading ? "重置中..." : "重置密码"}
        </Button>
      </form>
    </div>
  )
}
