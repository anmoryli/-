"use client"

import { getBabySize } from "@/lib/pregnancy"

interface BabySizeVisualProps {
  weeksPregnant: number
  className?: string
}

/**
 * 根据孕周显示宝宝大小示意 — 参考图四风格，椭圆代表胎儿，随孕周缩放
 */
export function BabySizeVisual({ weeksPregnant, className = "" }: BabySizeVisualProps) {
  const { name, size } = getBabySize(Math.max(1, Math.min(weeksPregnant, 40)))
  // 孕周 4~40 对应视觉直径约 20~80px
  const baseSize = Math.max(4, Math.min(weeksPregnant, 40))
  const diameter = 16 + (baseSize / 40) * 64

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        className="rounded-full transition-all duration-500"
        style={{
          width: diameter,
          height: diameter * 1.2,
          background: `radial-gradient(ellipse 50% 60% at 50% 40%, 
            rgba(255, 200, 210, 0.9) 0%, 
            rgba(244, 166, 184, 0.6) 40%,
            rgba(230, 180, 195, 0.5) 100%)`,
          boxShadow: "0 2px 12px rgba(244, 166, 184, 0.25)",
        }}
        title={`孕${weeksPregnant}周 · 约${name}大小 (${size})`}
      />
      <p className="text-[11px] text-[var(--foreground-muted)] whitespace-nowrap overflow-hidden text-ellipsis max-w-full" title={`约${name}大小 · ${size}`}>
        约{name}大小 · {size}
      </p>
    </div>
  )
}
