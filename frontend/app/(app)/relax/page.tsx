"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Wind, Music, BookOpen, Heart, Headphones } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { addHealthPoints } from "@/lib/api/daily"
import { toast } from "sonner"

type BreathPattern = "4-7-8" | "4-4-4"
const PATTERNS: Record<BreathPattern, { stages: string[]; durations: number[]; desc: string }> = {
  "4-7-8": {
    stages: ["吸气 4 秒", "屏住 7 秒", "呼气 8 秒"],
    durations: [4000, 7000, 8000],
    desc: "促进入眠、激活副交感神经，降低心率",
  },
  "4-4-4": {
    stages: ["吸气 4 秒", "屏住 4 秒", "呼气 4 秒"],
    durations: [4000, 4000, 4000],
    desc: "均匀呼吸，稳定心率变异性，适合日间放松",
  },
}
const RELAX_TIPS = [
  "找个安静的地方，闭上眼睛，深呼吸几次，有助于激活副交感神经",
  "想象自己在海边，听着海浪声，感受阳光温暖",
  "轻轻按摩太阳穴，放松肩颈，缓解肌肉紧张",
  "听一段疗愈音乐或白噪音，让心率和呼吸节奏同步放缓",
  "写下三件今天感恩的事",
]
const HEALING_MUSIC = [
  { name: "疗愈钢琴 · 轻柔曲", desc: "降低皮质醇，调节心率", search: "孕期放松 钢琴" },
  { name: "自然白噪音", desc: "雨声、海浪、森林，掩蔽杂念", search: "白噪音 助眠" },
  { name: "432Hz 疗愈频率", desc: "舒缓神经系统，助眠", search: "432Hz 疗愈音乐" },
]
const MUSIC_SUGGESTIONS = [
  { name: "轻音乐 · 钢琴", desc: "适合午休或睡前" },
  { name: "自然白噪音", desc: "雨声、海浪、森林" },
  { name: "冥想引导", desc: "跟随语音放松身心" },
]
const MEDITATION_GUIDE = [
  "请坐稳或躺下，闭上双眼，将注意力放在呼吸上。",
  "接下来按 4-7-8 节奏呼吸：吸气时想象气流充满腹部，屏住时保持平静，呼气时释放所有紧张。",
  "每完成一轮，在心里默念：我的身体正在放松，心跳更平稳，思绪更清晰。",
  "重复 4～6 轮后，轻轻动动手指和脚趾，再慢慢睁眼。",
]

export default function RelaxPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [pattern, setPattern] = useState<BreathPattern>("4-7-8")
  const [breathStage, setBreathStage] = useState(0)
  const [isBreathing, setIsBreathing] = useState(false)
  const [showMeditation, setShowMeditation] = useState(false)
  const continueRef = useRef(true)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { stages, durations } = PATTERNS[pattern]

  if (!user) return null

  const startBreathing = () => {
    continueRef.current = true
    setIsBreathing(true)
    let stage = 0
    const cycle = () => {
      if (!continueRef.current) return
      setBreathStage(stage)
      const nextStage = (stage + 1) % 3
      const duration = durations[nextStage]
      timeoutRef.current = setTimeout(cycle, duration)
      stage = nextStage
    }
    timeoutRef.current = setTimeout(cycle, durations[0])
  }

  const stopBreathing = () => {
    continueRef.current = false
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = null
    setIsBreathing(false)
    if (user?.userId) {
      addHealthPoints(user.userId, 5).then(() => {
        toast.success("完成放松练习，+5 健康值")
      }).catch(() => {})
    }
  }

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  const circleScale = breathStage === 0 ? 1.15 : breathStage === 1 ? 1.15 : 0.85

  return (
    <div className="min-h-dvh bg-[var(--background)] pb-8">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-[var(--card-border)] bg-[var(--background)]/95 px-4 py-4 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--muted)] transition-colors active:bg-[var(--muted)]/80"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <h1 className="text-lg font-semibold text-[var(--foreground)]">减压放松</h1>
      </div>

      <div className="space-y-6 px-4 pt-6">
        {/* 呼吸节奏训练 */}
        <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5">
          <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            <Wind className="h-4 w-4" strokeWidth={1.75} />
            呼吸节奏训练
          </h2>
          <p className="mb-3 text-sm text-[var(--foreground-muted)]">
            通过规律呼吸从生理层面激活副交感神经，降低心率和焦虑。
          </p>
          {!isBreathing && (
            <div className="mb-4 flex gap-2">
              {(Object.keys(PATTERNS) as BreathPattern[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPattern(p)}
                  className={`rounded-lg border px-3 py-2 text-sm ${pattern === p ? "border-[var(--accent-2)] bg-[var(--accent-2-muted)] text-[var(--accent-2)]" : "border-[var(--card-border)] text-[var(--foreground-muted)]"}`}
                >
                  {p} 呼吸
                </button>
              ))}
            </div>
          )}
          {!isBreathing && <p className="mb-4 text-micro text-[var(--foreground-muted)]">{PATTERNS[pattern].desc}</p>}
          {!isBreathing ? (
            <Button
              onClick={startBreathing}
              className="w-full"
              style={{ backgroundColor: "var(--accent-2)", color: "var(--foreground)" }}
            >
              开始练习
            </Button>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p className="text-lg font-medium text-[var(--accent-2)]">
                {stages[breathStage]}
              </p>
              <div
                className="rounded-full border-2 border-[var(--accent-2)]/50 bg-[var(--accent-2-muted)] transition-all duration-500 ease-in-out"
                style={{
                  width: 96,
                  height: 96,
                  transform: `scale(${circleScale})`,
                  opacity: breathStage === 2 ? 0.85 : 1,
                }}
              />
              <button
                onClick={stopBreathing}
                className="text-sm text-[var(--foreground-muted)] underline"
              >
                暂停
              </button>
            </div>
          )}
        </section>

        {/* 放松小贴士 */}
        <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5">
          <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            <Heart className="h-4 w-4" strokeWidth={1.75} />
            放松小贴士
          </h2>
          <ul className="space-y-2">
            {RELAX_TIPS.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent-2)]" />
                {tip}
              </li>
            ))}
          </ul>
        </section>

        {/* 专业疗愈音乐 */}
        <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5">
          <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            <Headphones className="h-4 w-4" strokeWidth={1.75} />
            专业疗愈音乐
          </h2>
          <p className="mb-4 text-sm text-[var(--foreground-muted)]">
            从生理层面助眠与减压：节奏和频率可帮助调节心率与呼吸，而不只是心理安慰。
          </p>
          <div className="space-y-2">
            {HEALING_MUSIC.map((m, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-[var(--card-border)] px-3 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{m.name}</p>
                  <p className="text-micro text-[var(--foreground-muted)]">{m.desc}</p>
                </div>
                <BookOpen className="h-4 w-4 shrink-0 text-[var(--foreground-muted)]" strokeWidth={1.75} />
              </div>
            ))}
          </div>
          <p className="mt-2 text-micro text-[var(--foreground-muted)]">
            在网易云音乐、QQ 音乐搜索「孕期放松」「冥想音乐」「432Hz」即可找到相关歌单。
          </p>
        </section>

        {/* 引导式冥想 */}
        <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5">
          <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            <Heart className="h-4 w-4" strokeWidth={1.75} />
            引导式冥想
          </h2>
          <p className="mb-4 text-sm text-[var(--foreground-muted)]">
            结合呼吸与引导语，降低皮质醇、调节呼吸与心率，从生理上放松身体。
          </p>
          <button
            type="button"
            onClick={() => setShowMeditation(!showMeditation)}
            className="mb-2 text-sm font-medium text-[var(--accent-2)] underline"
          >
            {showMeditation ? "收起引导语" : "展开文字引导"}
          </button>
          {showMeditation && (
            <ol className="list-decimal space-y-2 pl-4 text-sm text-[var(--foreground)]">
              {MEDITATION_GUIDE.map((line, i) => (
                <li key={i} className="leading-relaxed">{line}</li>
              ))}
            </ol>
          )}
          <p className="mt-3 text-micro text-[var(--foreground-muted)]">
            建议先完成上方 4-7-8 呼吸 2～3 轮，再按引导语默念，效果更佳。
          </p>
        </section>

        {/* 推荐聆听（保留原入口） */}
        <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5">
          <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            <Music className="h-4 w-4" strokeWidth={1.75} />
            推荐聆听
          </h2>
          <div className="space-y-2">
            {MUSIC_SUGGESTIONS.map((m, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-[var(--card-border)] px-3 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{m.name}</p>
                  <p className="text-micro text-[var(--foreground-muted)]">{m.desc}</p>
                </div>
                <BookOpen className="h-4 w-4 text-[var(--foreground-muted)]" strokeWidth={1.75} />
              </div>
            ))}
          </div>
          <p className="mt-2 text-micro text-[var(--foreground-muted)]">
            可在网易云音乐、QQ 音乐等搜索「孕期放松」「冥想音乐」
          </p>
        </section>
      </div>
    </div>
  )
}
