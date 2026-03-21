"use client"

import { useMusicPlayer } from "@/lib/music-player-context"
import { Play, Pause, X, Music } from "lucide-react"

function formatTime(seconds: number) {
  if (!seconds || !isFinite(seconds)) return "0:00"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function GlobalMusicPlayer() {
  const { track, isPlaying, currentTime, duration, visible, pause, resume, seek, dismiss } = useMusicPlayer()

  if (!visible || !track) return null

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] mx-auto max-w-lg">
      <div
        className="mx-3 mt-2 flex items-center gap-3 rounded-2xl border border-white/50 px-4 py-2.5 shadow-lg"
        style={{
          background: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(20px) saturate(1.4)",
          WebkitBackdropFilter: "blur(20px) saturate(1.4)",
        }}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-2-muted)] text-[var(--accent-2)]">
          <Music className="h-4.5 w-4.5" strokeWidth={1.75} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-[var(--foreground)]">{track.title}</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--muted)]">
              <div
                className="h-full rounded-full bg-[var(--accent-2)] transition-[width] duration-300 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="shrink-0 text-[10px] tabular-nums text-[var(--foreground-muted)]">
              {formatTime(currentTime)}/{formatTime(duration)}
            </span>
          </div>
        </div>

        <button
          onClick={() => (isPlaying ? pause() : resume())}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-2)] text-white transition-transform active:scale-90"
        >
          {isPlaying ? <Pause className="h-4 w-4" strokeWidth={2.5} /> : <Play className="h-4 w-4 ml-0.5" strokeWidth={2.5} />}
        </button>

        <button
          onClick={dismiss}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--foreground-muted)] transition-colors hover:bg-[var(--muted)] active:scale-90"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
