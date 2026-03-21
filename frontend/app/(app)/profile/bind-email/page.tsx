"use client"

import { useState } from "react"
import { useBack } from "@/lib/use-back"
import { ArrowLeft, Mail } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { bindEmail } from "@/lib/api/user"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function BindEmailPage() {
  const goBack = useBack("/profile/settings")
  const { user, setUser } = useAuth()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [showChange, setShowChange] = useState(false)

  if (!user) return null

  const handleBind = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      toast.error("请输入邮箱")
      return
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(trimmed)) {
      toast.error("请输入有效的邮箱地址")
      return
    }
    setLoading(true)
    try {
      await bindEmail(user.userId, trimmed)
      setUser({ ...user, email: trimmed })
      toast.success(user.email ? "邮箱已更换" : "邮箱已绑定")
      setShowChange(false)
      setEmail("")
      if (!user.email) goBack()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "绑定失败")
    } finally {
      setLoading(false)
    }
  }

  if (user.email && !showChange) {
    return (
      <div className="min-h-dvh px-4 pb-8">
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/40 px-4 py-4" style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(24px) saturate(1.3)", WebkitBackdropFilter: "blur(24px) saturate(1.3)" }}>
          <button
            onClick={goBack}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--muted)] transition-colors active:bg-[var(--muted)]/80"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <h1 className="text-lg font-semibold text-[var(--foreground)]">邮箱与安全</h1>
        </div>
        <div className="mt-6 glass-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-1-muted)] text-[var(--accent-1)]">
              <Mail className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--foreground-muted)]">当前邮箱</p>
              <p className="mt-0.5 font-medium text-[var(--foreground)]">{user.email}</p>
              <p className="mt-2 text-xs text-[var(--foreground-muted)]">
                绑定后可使用「找回密码」重置密码
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4 rounded-xl border-[var(--card-border)]"
                onClick={() => setShowChange(true)}
              >
                更换邮箱
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (user.email && showChange) {
    return (
      <div className="min-h-dvh px-4 pb-8">
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/40 px-4 py-4" style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(24px) saturate(1.3)", WebkitBackdropFilter: "blur(24px) saturate(1.3)" }}>
          <button
            onClick={() => setShowChange(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--muted)] transition-colors active:bg-[var(--muted)]/80"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <h1 className="text-lg font-semibold text-[var(--foreground)]">更换邮箱</h1>
        </div>
        <div className="mt-6 glass-card p-6">
          <p className="text-sm text-[var(--foreground-muted)]">当前邮箱：{user.email}</p>
          <form onSubmit={handleBind} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="new-email">新邮箱</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="请输入新邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 border-[var(--card-border)] bg-[var(--background)]"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl font-semibold"
              style={{ backgroundColor: "var(--accent-1)", color: "white" }}
            >
              {loading ? "更换中..." : "确认更换"}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh px-4 pb-8">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/40 px-4 py-4" style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(24px) saturate(1.3)", WebkitBackdropFilter: "blur(24px) saturate(1.3)" }}>
        <button
          onClick={goBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--muted)] transition-colors active:bg-[var(--muted)]/80"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <h1 className="text-lg font-semibold text-[var(--foreground)]">邮箱与安全</h1>
      </div>
      <div className="mt-6 glass-card p-6">
        <p className="text-sm text-[var(--foreground-muted)]">
          绑定后可通过「忘记密码」在登录页重置密码
        </p>
        <form onSubmit={handleBind} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              placeholder="请输入邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 border-[var(--card-border)] bg-[var(--background)]"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl font-semibold"
            style={{ backgroundColor: "var(--accent-1)", color: "white" }}
          >
            {loading ? "绑定中..." : "确认绑定"}
          </Button>
        </form>
      </div>
    </div>
  )
}
