"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { changePassword } from "@/lib/api/user"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function ChangePasswordPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("请填写所有字段")
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
    if (oldPassword === newPassword) {
      toast.error("新密码不能与原密码相同")
      return
    }
    setLoading(true)
    try {
      await changePassword(user.userId, oldPassword, newPassword)
      toast.success("密码已修改，请使用新密码登录")
      setOldPassword("")
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
          onClick={() => router.push("/profile")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary transition-colors active:bg-secondary/80"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">修改密码</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 px-4 pt-6">
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
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "提交中..." : "确认修改"}
        </Button>
      </form>
    </div>
  )
}
