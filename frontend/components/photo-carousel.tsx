"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function PhotoCarousel({
  urls,
  alt = "照片",
  className,
}: {
  urls: string[]
  alt?: string
  className?: string
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const touchStartRef = useRef<number | null>(null)

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i <= 0 ? urls.length - 1 : i - 1))
  }, [urls.length])

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i >= urls.length - 1 ? 0 : i + 1))
  }, [urls.length])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current == null) return
    const diff = touchStartRef.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      diff > 0 ? goNext() : goPrev()
    }
    touchStartRef.current = null
  }

  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev()
      else if (e.key === "ArrowRight") goNext()
      else if (e.key === "Escape") setLightboxOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightboxOpen, goPrev, goNext])

  if (!urls.length) return null

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className="relative mx-auto w-full overflow-hidden rounded-xl border border-[var(--card-border)] bg-black/5"
        style={{ aspectRatio: "4/3" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ width: `${urls.length * 100}%`, transform: `translateX(-${(activeIndex * 100) / urls.length}%)` }}
        >
          {urls.map((url, i) => (
            <div
              key={`slide-${i}`}
              className="relative h-full"
              style={{ width: `${100 / urls.length}%`, flex: "none" }}
            >
              <button
                type="button"
                className="flex h-full w-full items-center justify-center p-2 focus:outline-none"
                onClick={() => setLightboxOpen(true)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  loading="lazy"
                  alt={`${alt} ${i + 1}`}
                  className="max-h-full max-w-full object-contain"
                  draggable={false}
                />
              </button>
            </div>
          ))}
        </div>
        {urls.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm active:bg-black/60"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm active:bg-black/60"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2} />
            </button>
          </>
        )}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
          {activeIndex + 1} / {urls.length}
        </div>
      </div>
      {urls.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {urls.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                i === activeIndex ? "bg-[var(--accent-1)]" : "bg-[var(--foreground-muted)]/40"
              )}
              aria-label={`切换到第 ${i + 1} 张`}
            />
          ))}
        </div>
      )}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white active:bg-white/20"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={urls[activeIndex]}
              loading="lazy"
              alt={`${alt} ${activeIndex + 1}`}
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
            {urls.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-0 top-1/2 flex h-12 w-12 -translate-y-1/2 -translate-x-4 items-center justify-center rounded-full bg-white/20 text-white active:bg-white/40"
                >
                  <ChevronLeft className="h-6 w-6" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-0 top-1/2 flex h-12 w-12 translate-x-4 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white active:bg-white/40"
                >
                  <ChevronRight className="h-6 w-6" strokeWidth={2} />
                </button>
                <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 translate-y-10 gap-2">
                  {urls.map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "block h-2 w-2 rounded-full",
                        i === activeIndex ? "bg-white" : "bg-white/50"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
