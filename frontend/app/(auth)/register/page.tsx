"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Leaf, Eye, EyeOff } from "lucide-react"
import { addMonths } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DateInput } from "@/components/date-input"
import { register } from "@/lib/api/user"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

/** 从怀孕日开始算 13 个月内的日期，用于预产期可选范围 */
function dueDateMinMax(pregnancyStartYMD: string | null) {
  const today = new Date()
  const todayStr = today.toISOString().split("T")[0]
  if (!pregnancyStartYMD || !/^\d{4}-\d{2}-\d{2}$/.test(pregnancyStartYMD)) {
    const fallbackEnd = addMonths(today, 13)
    return { min: todayStr, max: fallbackEnd.toISOString().split("T")[0] }
  }
  const start = new Date(pregnancyStartYMD + "T00:00:00")
  const end = addMonths(start, 13)
  return {
    min: pregnancyStartYMD,
    max: end.toISOString().split("T")[0],
  }
}

export default function RegisterPage() {
  const router = useRouter()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [email, setEmail] = useState("")
  const [userType, setUserType] = useState<"pregnant" | "family_member">("pregnant")
  /** 家庭成员子类型：配偶、婆婆、妈妈、爸爸、其他。用于 UI 区分选中项 */
  const [familyRole, setFamilyRole] = useState<string>("配偶")
  /** 选择「其他」时的自定义关系 */
  const [customFamilyRole, setCustomFamilyRole] = useState("")
  const [lastMenstrualDate, setLastMenstrualDate] = useState("")
  const [pregnancyTime, setPregnancyTime] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim() || !password.trim()) {
      toast.error("请输入用户名和密码")
      return
    }

    if (password !== confirmPassword) {
      toast.error("两次输入的密码不一致")
      return
    }

    if (password.length < 6) {
      toast.error("密码长度至少6位")
      return
    }

    if (userType === "pregnant" && (!lastMenstrualDate || !pregnancyTime)) {
      toast.error("请选择怀孕日和预产期")
      return
    }

    if (userType === "family_member" && familyRole === "其他") {
      if (!customFamilyRole.trim()) {
        toast.error("请输入与孕妇的关系")
        return
      }
      const forbidden = ["配偶", "老公", "丈夫"]
      if (forbidden.some((f) => customFamilyRole.trim() === f)) {
        toast.error("自定义关系不能为配偶类称呼")
        return
      }
    }

    setLoading(true)

    try {
      const defaultRel = userType === "family_member"
        ? (familyRole === "其他" ? customFamilyRole.trim() : familyRole)
        : undefined
      await register(
        username,
        password,
        email || undefined,
        userType,
        userType === "pregnant" ? lastMenstrualDate : undefined,
        userType === "pregnant" ? pregnancyTime : undefined,
        defaultRel
      )
      toast.success("注册成功，请登录")
      router.push("/login")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "注册失败，请稍后重试")
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
          创建账号
        </h1>
        <p className="mt-1.5 text-caption">开启您的孕期记录之旅</p>
      </div>

      <form onSubmit={handleRegister} className="mt-8 space-y-4">
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
          <Label htmlFor="password" className="text-caption font-medium">密码</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="至少6位密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-caption font-medium">确认密码</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="请再次输入密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            className="rounded-lg border-[var(--card-border)] bg-[var(--card)]"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-caption font-medium">身份</Label>
          <div className="flex flex-wrap gap-2">
            <label className="cursor-pointer rounded-lg border border-[var(--card-border)] px-4 py-2.5 has-[:checked]:border-[var(--accent-1)] has-[:checked]:bg-[var(--accent-1-muted)]">
              <input type="radio" name="userType" value="pregnant" checked={userType === "pregnant"} onChange={() => setUserType("pregnant")} className="sr-only" />
              <span className="text-sm font-medium">孕妇本人</span>
            </label>
            <label className={cn("cursor-pointer rounded-lg border px-4 py-2.5", userType === "family_member" && familyRole === "配偶" ? "border-[var(--accent-1)] bg-[var(--accent-1-muted)]" : "border-[var(--card-border)]")}>
              <input type="radio" name="userType" value="family_member" checked={userType === "family_member" && familyRole === "配偶"} onChange={() => { setUserType("family_member"); setFamilyRole("配偶") }} className="sr-only" />
              <span className="text-sm font-medium">配偶</span>
            </label>
            <label className={cn("cursor-pointer rounded-lg border px-4 py-2.5", userType === "family_member" && familyRole === "婆婆" ? "border-[var(--accent-1)] bg-[var(--accent-1-muted)]" : "border-[var(--card-border)]")}>
              <input type="radio" name="userType" value="family_member" checked={userType === "family_member" && familyRole === "婆婆"} onChange={() => { setUserType("family_member"); setFamilyRole("婆婆") }} className="sr-only" />
              <span className="text-sm font-medium">婆婆</span>
            </label>
            <label className={cn("cursor-pointer rounded-lg border px-4 py-2.5", userType === "family_member" && familyRole === "妈妈" ? "border-[var(--accent-1)] bg-[var(--accent-1-muted)]" : "border-[var(--card-border)]")}>
              <input type="radio" name="userType" value="family_member" checked={userType === "family_member" && familyRole === "妈妈"} onChange={() => { setUserType("family_member"); setFamilyRole("妈妈") }} className="sr-only" />
              <span className="text-sm font-medium">妈妈</span>
            </label>
            <label className={cn("cursor-pointer rounded-lg border px-4 py-2.5", userType === "family_member" && familyRole === "爸爸" ? "border-[var(--accent-1)] bg-[var(--accent-1-muted)]" : "border-[var(--card-border)]")}>
              <input type="radio" name="userType" value="family_member" checked={userType === "family_member" && familyRole === "爸爸"} onChange={() => { setUserType("family_member"); setFamilyRole("爸爸") }} className="sr-only" />
              <span className="text-sm font-medium">爸爸</span>
            </label>
            <label className={cn("cursor-pointer rounded-lg border px-4 py-2.5", userType === "family_member" && familyRole === "其他" ? "border-[var(--accent-1)] bg-[var(--accent-1-muted)]" : "border-[var(--card-border)]")}>
              <input type="radio" name="userType" value="family_member" checked={userType === "family_member" && familyRole === "其他"} onChange={() => { setUserType("family_member"); setFamilyRole("其他") }} className="sr-only" />
              <span className="text-sm font-medium">其他</span>
            </label>
          </div>
        {userType === "family_member" && familyRole === "其他" && (
          <div className="mt-2">
            <Input
              placeholder="请输入与孕妇的关系（如叔叔、舅舅等）"
              value={customFamilyRole}
              onChange={(e) => setCustomFamilyRole(e.target.value)}
              className="rounded-lg border-[var(--card-border)] bg-[var(--card)]"
            />
          </div>
        )}
          <p className="text-xs text-[var(--foreground-muted)]">
            {userType === "pregnant"
              ? "怀孕的孕妇，可记录孕期日常并与 AI 对话，需填写怀孕日和预产期"
              : "配偶、婆婆、妈妈、爸爸等身份，可查看创建者共享的孕期记录，加入家庭时需使用邀请码"}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-caption font-medium">邮箱（选填）</Label>
          <Input
            id="email"
            type="email"
            placeholder="用于找回密码"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="rounded-lg border-[var(--card-border)] bg-[var(--card)]"
          />
        </div>

        {userType === "pregnant" && (() => {
          const { min: dueMin, max: dueMax } = dueDateMinMax(lastMenstrualDate || null)
          return (
            <>
              <DateInput
                id="lastMenstrualDate"
                label="怀孕日（末次月经）"
                value={lastMenstrualDate}
                onChange={setLastMenstrualDate}
                max={new Date().toISOString().split("T")[0]}
              />
              <DateInput
                id="pregnancyTime"
                label="预产期"
                value={pregnancyTime}
                onChange={setPregnancyTime}
                min={dueMin}
                max={dueMax}
              />
            </>
          )
        })()}

        <Button
          type="submit"
          className="mt-6 w-full rounded-xl font-semibold"
          style={{ backgroundColor: "var(--accent-2)", color: "var(--foreground)" }}
          disabled={loading}
        >
          {loading ? "注册中..." : "注册"}
        </Button>

        <p className="text-center text-caption">
          已有账号？{" "}
          <Link href="/login" className="font-medium text-[var(--accent-1)] hover:underline">
            去登录
          </Link>
        </p>
      </form>
    </div>
  )
}
