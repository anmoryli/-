"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useBack } from "@/lib/use-back"
import Link from "next/link"
import { ArrowLeft, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { joinFamily, getMyFamily } from "@/lib/api/family"
import { toast } from "sonner"

const RELATIONSHIP_OPTIONS = [
  { value: "", label: "请选择与孕妇的关系（可选）" },
  { value: "老公", label: "老公" },
  { value: "丈夫", label: "丈夫" },
  { value: "婆婆", label: "婆婆" },
  { value: "妈妈", label: "妈妈" },
  { value: "爸爸", label: "爸爸" },
  { value: "其他", label: "其他" },
]

export default function FamilyJoinPage() {
  const router = useRouter()
  const goBack = useBack("/family")
  const { user } = useAuth()
  const [inviteCode, setInviteCode] = useState("")
  const [relationship, setRelationship] = useState("")
  const [customRelationship, setCustomRelationship] = useState("")
  const [loading, setLoading] = useState(false)
  const [hasFamily, setHasFamily] = useState<boolean | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getMyFamily(user.userId)
      .then((f) => setHasFamily(!!f))
      .catch(() => setHasFamily(false))
  }, [user])

  // 沿用注册时选择的身份：从 user.defaultRelationship 预填关系
  useEffect(() => {
    const dr = (user as { defaultRelationship?: string })?.defaultRelationship
    if (!dr || dr.trim() === "") return
    const r = dr.trim()
    if (r === "配偶") {
      setRelationship("老公")
      return
    }
    if (["婆婆", "妈妈", "爸爸", "老公", "丈夫"].includes(r)) {
      setRelationship(r)
      return
    }
    if (r === "其他") return
    setRelationship("其他")
    setCustomRelationship(r)
  }, [user])

  const handleBack = () => goBack()

  const handleJoin = async () => {
    if (!user || !inviteCode.trim()) {
      toast.error("请输入邀请码")
      return
    }
    if (relationship === "其他" && !customRelationship.trim()) {
      toast.error("请输入与孕妇的关系")
      return
    }
    const forbidden = ["配偶", "老公", "丈夫"]
    if (relationship === "其他" && forbidden.some((f) => customRelationship.trim() === f)) {
      toast.error("自定义关系不能为配偶类称呼")
      return
    }
    setLoading(true)
    setLastError(null)
    try {
      const rel = relationship === "其他" ? customRelationship.trim() : relationship.trim()
      await joinFamily(user.userId, inviteCode.trim().toUpperCase(), rel || undefined)
      toast.success("加入成功")
      router.replace("/family")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "加入失败，邀请码可能无效或已过期"
      toast.error(msg)
      if (msg.includes("已在家庭中")) setLastError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-dvh px-4 pt-14 pb-8">
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--muted)]"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <h1 className="text-lg font-semibold text-[var(--foreground)]">加入家庭</h1>
      </div>

      {lastError && (
        <div className="mt-6 rounded-xl border border-[var(--accent-1)]/50 bg-[var(--accent-1-muted)] p-4">
          <p className="text-sm text-[var(--foreground)]">{lastError}</p>
          <Link
            href="/family"
            className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-[var(--accent-1)] px-4 py-2 text-sm font-medium text-white"
          >
            <Users className="h-4 w-4" strokeWidth={1.75} />
            前往我们的小家
          </Link>
        </div>
      )}

      <div className="mt-8">
        <p className="text-sm text-[var(--foreground-muted)]">与孕妇的关系（可选）</p>
        <select
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className="mt-2 w-full rounded-xl border border-[var(--card-border)] bg-[var(--card-solid)] px-4 py-3 text-[var(--foreground)]"
        >
          {RELATIONSHIP_OPTIONS.map((opt) => (
            <option key={opt.value || "empty"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {relationship === "其他" && (
          <div className="mt-2">
            <Input
              placeholder="请输入与孕妇的关系（如叔叔、舅舅等）"
              value={customRelationship}
              onChange={(e) => setCustomRelationship(e.target.value)}
              className="rounded-xl border-[var(--card-border)] bg-[var(--card-solid)] px-4 py-3"
            />
          </div>
        )}

        <p className="mt-6 text-sm text-[var(--foreground-muted)]">请输入 6 位邀请码</p>
        <input
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase().slice(0, 6))}
          placeholder="ABCD12"
          maxLength={6}
          className="mt-2 w-full rounded-xl border border-[var(--card-border)] bg-[var(--card-solid)] px-4 py-4 text-center font-mono text-2xl tracking-[0.5em] placeholder:text-[var(--foreground-muted)]"
        />
        <button
          onClick={handleJoin}
          disabled={loading || inviteCode.length !== 6}
          className="mt-6 flex w-full items-center justify-center rounded-xl bg-[var(--accent-1)] py-4 text-[15px] font-semibold text-white transition-opacity active:opacity-90 disabled:opacity-50"
        >
          {loading ? "加入中..." : "确认加入"}
        </button>
      </div>
    </div>
  )
}
