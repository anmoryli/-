"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, FileText, Theater } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getScenarioList, type Scenario } from "@/lib/api/scenario"
import { createScenarioConversation } from "@/lib/api/ai"
import { toast } from "sonner"
import Link from "next/link"

const SCENARIO_STORAGE_KEY = "yunqi_scenario_pending"

export default function ScenarioPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingId, setCreatingId] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    if (user.isSpouse !== true) {
      router.replace("/profile")
      toast.error("仅配偶可使用情景演绎")
      return
    }
    setLoading(true)
    getScenarioList(user.userId)
      .then(setScenarios)
      .catch(() => {
        setScenarios([])
        toast.error("加载情景列表失败")
      })
      .finally(() => setLoading(false))
  }, [user, router])

  const handleStartScenario = async (s: Scenario) => {
    if (!user) return
    setCreatingId(s.scenarioId)
    try {
      const result = await createScenarioConversation(user.userId, s.scenarioId)
      try {
        sessionStorage.setItem(
          SCENARIO_STORAGE_KEY,
          JSON.stringify({
            conversationId: result.conversationId,
            title: result.title,
            scenarioId: result.scenarioId,
            openingContent: result.openingContent,
          })
        )
      } catch {
        // ignore
      }
      // 使用完整跳转确保 chat 页能拿到 URL 参数并读到 sessionStorage 中的开场白
      const chatUrl = `/chat?conversationId=${result.conversationId}&mode=scenario`
      window.location.href = chatUrl
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "创建情景对话失败")
    } finally {
      setCreatingId(null)
    }
  }

  if (!user) return null
  if (user.isSpouse !== true) return null

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="border-b border-[var(--card-border)] bg-[var(--card)] px-6 pt-14 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground-muted)] transition-colors active:bg-[var(--muted)]"
            aria-label="返回"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
          </Link>
          <h1
            className="flex-1 text-[1.2rem] font-semibold text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            情景演绎
          </h1>
        </div>
        <p className="mt-1 text-caption">选择情景，与 AI 扮演的孕妇对话练习</p>
      </div>

      <div className="flex-1 px-6 py-4">
        <Link
          href="/scenario/reports"
          className="mb-4 flex items-center gap-3 glass-card px-4 py-3 text-left transition-colors active:bg-[var(--muted)]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--accent-1)]/30 bg-[var(--accent-1-muted)]">
            <FileText className="h-5 w-5 text-[var(--accent-1)]" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-[var(--foreground)]">历史报告</p>
            <p className="text-micro text-[var(--foreground-muted)]">查看已生成的情景报告</p>
          </div>
        </Link>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse glass-card"
              />
            ))}
          </div>
        ) : scenarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Theater className="h-12 w-12 text-[var(--foreground-muted)]" strokeWidth={1.5} />
            <p className="mt-4 text-[var(--foreground-muted)]">暂无情景</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scenarios.map((s) => (
              <button
                key={s.scenarioId}
                type="button"
                onClick={() => handleStartScenario(s)}
                disabled={creatingId != null}
                className="card-elevated w-full glass-card p-4 text-left transition-colors active:bg-[var(--muted)] disabled:opacity-60"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--accent-2)]/30 bg-[var(--accent-2-muted)]">
                    <Theater className="h-5 w-5 text-[var(--accent-2)]" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--foreground)]">{s.title}</p>
                    {s.description && (
                      <p className="mt-0.5 text-micro text-[var(--foreground-muted)]">
                        {s.description}
                      </p>
                    )}
                    <p className="mt-2 text-[13px] text-[var(--accent-2)]">
                      {creatingId === s.scenarioId ? "正在创建对话…" : "开始演绎"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
