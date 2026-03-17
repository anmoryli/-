"use client"

import { useState, useRef, useEffect } from "react"
import { useBack } from "@/lib/use-back"
import { ArrowLeft, Wind, Music, Heart, Headphones, Play, Pause } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { addHealthPoints } from "@/lib/api/daily"
import { toast } from "sonner"
import { listRelaxMusic, type RelaxMusic } from "@/lib/api/relax-music"
import { useMusicPlayer } from "@/lib/music-player-context"

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
const MEDITATION_GUIDE = [
  "请坐稳或躺下，闭上双眼，将注意力放在呼吸上。",
  "接下来按 4-7-8 节奏呼吸：吸气时想象气流充满腹部，屏住时保持平静，呼气时释放所有紧张。",
  "每完成一轮，在心里默念：我的身体正在放松，心跳更平稳，思绪更清晰。",
  "重复 4～6 轮后，轻轻动动手指和脚趾，再慢慢睁眼。",
]

function formatDuration(seconds?: number) {
  if (!seconds) return ""
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

export default function RelaxPage() {
  const goBack = useBack("/")
  const { user } = useAuth()
  const player = useMusicPlayer()
  const [pattern, setPattern] = useState<BreathPattern>("4-7-8")
  const [breathStage, setBreathStage] = useState(0)
  const [isBreathing, setIsBreathing] = useState(false)
  const [showMeditation, setShowMeditation] = useState(false)
  const continueRef = useRef(true)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [healingMusic, setHealingMusic] = useState<RelaxMusic[]>([])
  const [recommendMusic, setRecommendMusic] = useState<RelaxMusic[]>([])
  const [musicLoading, setMusicLoading] = useState(true)

  useEffect(() => {
    listRelaxMusic()
      .then((list) => {
        setHealingMusic(list.filter((m) => m.category === "healing"))
        setRecommendMusic(list.filter((m) => m.category === "recommend"))
      })
      .catch(() => {})
      .finally(() => setMusicLoading(false))
  }, [])

  const { stages, durations } = PATTERNS[pattern]

  const handlePlay = (m: RelaxMusic) => {
    if (player.track?.musicId === m.musicId && player.isPlaying) {
      player.pause()
    } else if (player.track?.musicId === m.musicId) {
      player.resume()
    } else {
      player.play({
        musicId: m.musicId,
        title: m.title,
        artist: m.artist,
        fileUrl: m.fileUrl,
        coverUrl: m.coverUrl,
        durationSeconds: m.durationSeconds,
      })
    }
  }

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
    <div className="min-h-dvh pb-8">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/40 px-4 py-4" style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(24px) saturate(1.3)", WebkitBackdropFilter: "blur(24px) saturate(1.3)" }}>
        <button
          onClick={() => goBack()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--muted)] transition-colors active:bg-[var(--muted)]/80"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <h1 className="text-lg font-semibold text-[var(--foreground)]">减压放松</h1>
      </div>

      <div className="space-y-6 px-4 pt-6">
        {/* 呼吸节奏训练 */}
        <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-solid)] p-5">
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
        <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-solid)] p-5">
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
        <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-solid)] p-5">
          <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            <Headphones className="h-4 w-4" strokeWidth={1.75} />
            专业疗愈音乐
          </h2>
          <p className="mb-4 text-sm text-[var(--foreground-muted)]">
            从生理层面助眠与减压：节奏和频率可帮助调节心率与呼吸，而不只是心理安慰。
          </p>
          {musicLoading ? (
            <div className="flex justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent-2)]/30 border-t-[var(--accent-2)]" />
            </div>
          ) : healingMusic.length === 0 ? (
            <p className="text-sm text-[var(--foreground-muted)] text-center py-4">暂无疗愈音乐</p>
          ) : (
            <div className="space-y-2">
              {healingMusic.map((m) => {
                const isCurrent = player.track?.musicId === m.musicId
                const isThisPlaying = isCurrent && player.isPlaying
                return (
                  <button
                    key={m.musicId}
                    type="button"
                    onClick={() => handlePlay(m)}
                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${
                      isCurrent ? "border-[var(--accent-2)]/50 bg-[var(--accent-2-muted)]" : "border-[var(--card-border)] hover:bg-[var(--muted)]/50"
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isCurrent ? "bg-[var(--accent-2)] text-white" : "bg-[var(--muted)] text-[var(--foreground-muted)]"}`}>
                      {isThisPlaying ? <Pause className="h-3.5 w-3.5" strokeWidth={2.5} /> : <Play className="h-3.5 w-3.5 ml-0.5" strokeWidth={2.5} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--foreground)]">{m.title}</p>
                      <p className="text-micro text-[var(--foreground-muted)]">
                        {m.description || m.artist || ""}
                        {m.durationSeconds ? ` · ${formatDuration(m.durationSeconds)}` : ""}
                      </p>
                    </div>
                    {m.tags && (
                      <div className="flex shrink-0 gap-1">
                        {m.tags.split(",").slice(0, 2).map((tag) => (
                          <span key={tag} className="rounded-full bg-[var(--accent-2-muted)] px-2 py-0.5 text-[10px] text-[var(--accent-2)]">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {/* 引导式冥想 */}
        <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-solid)] p-5">
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

        {/* 推荐聆听 */}
        <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-solid)] p-5">
          <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            <Music className="h-4 w-4" strokeWidth={1.75} />
            推荐聆听
          </h2>
          {musicLoading ? (
            <div className="flex justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent-1)]/30 border-t-[var(--accent-1)]" />
            </div>
          ) : recommendMusic.length === 0 ? (
            <p className="text-sm text-[var(--foreground-muted)] text-center py-4">暂无推荐音乐</p>
          ) : (
            <div className="space-y-2">
              {recommendMusic.map((m) => {
                const isCurrent = player.track?.musicId === m.musicId
                const isThisPlaying = isCurrent && player.isPlaying
                return (
                  <button
                    key={m.musicId}
                    type="button"
                    onClick={() => handlePlay(m)}
                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${
                      isCurrent ? "border-[var(--accent-1)]/50 bg-[var(--accent-1-muted)]" : "border-[var(--card-border)] hover:bg-[var(--muted)]/50"
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isCurrent ? "bg-[var(--accent-1)] text-white" : "bg-[var(--muted)] text-[var(--foreground-muted)]"}`}>
                      {isThisPlaying ? <Pause className="h-3.5 w-3.5" strokeWidth={2.5} /> : <Play className="h-3.5 w-3.5 ml-0.5" strokeWidth={2.5} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--foreground)]">{m.title}</p>
                      <p className="text-micro text-[var(--foreground-muted)]">
                        {m.description || m.artist || ""}
                        {m.durationSeconds ? ` · ${formatDuration(m.durationSeconds)}` : ""}
                      </p>
                    </div>
                    {m.tags && (
                      <div className="flex shrink-0 gap-1">
                        {m.tags.split(",").slice(0, 2).map((tag) => (
                          <span key={tag} className="rounded-full bg-[var(--accent-1-muted)] px-2 py-0.5 text-[10px] text-[var(--accent-1)]">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
