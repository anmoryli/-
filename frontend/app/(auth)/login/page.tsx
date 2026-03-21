"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Leaf, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "@/lib/api/user"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useAuth()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim() || !password.trim()) {
      toast.error("请输入用户名和密码")
      return
    }

    setLoading(true)

    try {
      const user = await login(username, password)
      setUser(user)
      toast.success("登录成功")
      router.push("/")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "登录失败，请检查用户名和密码")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card-elevated w-full max-w-sm rounded-xl p-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--accent-3)]/40 bg-[var(--accent-3-muted)]">
          <Leaf className="h-6 w-6 text-[var(--accent-3)]" strokeWidth={1.75} />
        </div>
        <h1
          className="text-[1.5rem] font-semibold text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          孕期宝
        </h1>
        <p className="mt-1.5 text-caption">温暖陪伴每一天</p>
      </div>

      <form onSubmit={handleLogin} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-caption font-medium">用户名</Label>
          <Input
            id="username"
            placeholder="请输入用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="rounded-lg border-[var(--card-border)] bg-[var(--card)]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-caption font-medium">密码</Label>
            <Link href="/forgot-password" className="text-xs text-[var(--accent-1)] hover:underline">
              忘记密码？
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="pr-10 rounded-lg border-[var(--card-border)] bg-[var(--card)]"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)]"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "隐藏密码" : "显示密码"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full rounded-xl font-semibold"
          style={{ backgroundColor: "var(--accent-2)", color: "var(--foreground)" }}
          disabled={loading}
        >
          {loading ? "登录中..." : "登录"}
        </Button>

        <p className="text-center text-caption">
          还没有账号？{" "}
          <Link href="/register" className="font-medium text-[var(--accent-1)] hover:underline">
            立即注册
          </Link>
        </p>
      </form>
    </div>
  )
}
