"use client"

import { Share2 } from "lucide-react"
import { toast } from "sonner"

/** 提取第一个 Markdown 图片 URL */
function extractFirstImageUrl(md: string): string | null {
  const m = md.match(/!\[[^\]]*\]\(([^)]+)\)/)
  return m?.[1]?.trim() ?? null
}

/** 将 Markdown 转为纯文本（去掉图片语法，避免导出卡片上出现 URL 文本） */
function markdownToPlainText(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\r/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

const CARD_WIDTH = 375
const MIN_CARD_HEIGHT = 520
const SCALE = 2
const FOOTER_HEIGHT = 48

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  const chars = text.split("")
  let currentLine = ""
  for (const char of chars) {
    const test = currentLine + char
    const metrics = ctx.measureText(test)
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = char
    } else {
      currentLine = test
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("load image failed"))
    img.src = src
  })
}

/** 测量 AI 小结卡片总高度（完整正文不截断），用于长图导出 */
function measureSummaryCardHeight(ctx: CanvasRenderingContext2D, summaryText: string, cardTitle: string): number {
  let y = 32
  y += 36 // 标题行
  const imageUrl = extractFirstImageUrl(summaryText)
  if (imageUrl) y += 200 + 16
  const plainSummary = markdownToPlainText(summaryText)
  const paragraphs = plainSummary.split("\n")
  ctx.font = "600 16px 'STZhongsong', '华文中宋', serif"
  const summaryLines: string[] = []
  for (const p of paragraphs) {
    const lines = wrapText(ctx, p, CARD_WIDTH - 48)
    if (lines.length === 0) summaryLines.push("")
    else summaryLines.push(...lines)
  }
  for (const line of summaryLines) {
    if (line === "") y += 12
    else y += 24
  }
  y += 16
  y += FOOTER_HEIGHT
  return Math.max(MIN_CARD_HEIGHT, y)
}

async function drawSummaryCardAsync(summaryText: string, cardTitle: string): Promise<HTMLCanvasElement> {
  const measureCanvas = document.createElement("canvas")
  measureCanvas.width = CARD_WIDTH
  measureCanvas.height = MIN_CARD_HEIGHT
  const measureCtx = measureCanvas.getContext("2d")!
  measureCtx.font = "600 16px 'STZhongsong', '华文中宋', serif"
  const totalHeight = measureSummaryCardHeight(measureCtx, summaryText, cardTitle)

  const canvas = document.createElement("canvas")
  canvas.width = CARD_WIDTH * SCALE
  canvas.height = totalHeight * SCALE
  const ctx = canvas.getContext("2d")!
  ctx.scale(SCALE, SCALE)

  const bgColor = "#FDFAF7"
  const borderColor = "rgba(227, 184, 176, 0.5)"
  const mutedColor = "#8A8885"
  const mainColor = "#3D3B39"
  const accentColor = "#E3B8B0"
  const footerColor = "#A8A5A1"

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, CARD_WIDTH, totalHeight)

  ctx.strokeStyle = borderColor
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, CARD_WIDTH - 2, totalHeight - 2)

  let y = 32

  ctx.font = "500 11px 'STZhongsong', '华文中宋', serif"
  ctx.fillStyle = mutedColor
  ctx.textAlign = "center"
  ctx.fillText(`孕期宝 · ${cardTitle}`, CARD_WIDTH / 2, y)
  y += 36

  const imageUrl = extractFirstImageUrl(summaryText)
  if (imageUrl) {
    try {
      const proxyUrl = typeof window !== "undefined" ? `${window.location.origin}/api/file-proxy?url=${encodeURIComponent(imageUrl)}` : imageUrl
      const img = await loadImage(proxyUrl)
      const boxX = 24
      const boxY = y
      const boxW = CARD_WIDTH - 48
      const boxH = 200
      ctx.fillStyle = "#F7F2EE"
      ctx.fillRect(boxX, boxY, boxW, boxH)
      ctx.strokeStyle = borderColor
      ctx.lineWidth = 1
      ctx.strokeRect(boxX, boxY, boxW, boxH)
      const ratio = Math.min(boxW / img.width, boxH / img.height)
      const drawW = img.width * ratio
      const drawH = img.height * ratio
      ctx.drawImage(img, boxX + (boxW - drawW) / 2, boxY + (boxH - drawH) / 2, drawW, drawH)
      y += boxH + 16
    } catch {
      // 图片加载失败时仅略过，继续绘制正文
    }
  }

  ctx.font = "600 16px 'STZhongsong', '华文中宋', serif"
  ctx.fillStyle = mainColor
  const plainSummary = markdownToPlainText(summaryText)
  const paragraphs = plainSummary.split("\n")
  const summaryLines: string[] = []
  for (const p of paragraphs) {
    const lines = wrapText(ctx, p, CARD_WIDTH - 48)
    if (lines.length === 0) summaryLines.push("")
    else summaryLines.push(...lines)
  }
  summaryLines.forEach((line) => {
    if (line === "") {
      y += 12
    } else {
      ctx.fillText(line, CARD_WIDTH / 2, y)
      y += 24
    }
  })

  y = totalHeight - FOOTER_HEIGHT
  ctx.font = "400 11px 'STZhongsong', '华文中宋', serif"
  ctx.fillStyle = accentColor
  ctx.fillText("把每一天都留下来", CARD_WIDTH / 2, y)
  y += 20
  ctx.fillStyle = footerColor
  ctx.fillText("记录于孕期宝", CARD_WIDTH / 2, y)

  return canvas
}

interface PeriodSummaryShareProps {
  summaryText: string
  /** 卡片标题，用于画布标题与下载文件名，默认「本周小结」 */
  cardTitle?: string
}

export function PeriodSummaryShare({ summaryText, cardTitle = "本周小结" }: PeriodSummaryShareProps) {
  const handleShare = async () => {
    try {
      const canvas = await drawSummaryCardAsync(summaryText, cardTitle)
      const link = document.createElement("a")
      link.download = `${cardTitle}-${new Date().toISOString().slice(0, 10)}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
      toast.success("已保存到相册")
    } catch {
      toast.error("生成失败")
    }
  }

  if (!summaryText?.trim()) return null

  return (
    <button
      type="button"
      onClick={handleShare}
      className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--accent-1)]/40 bg-[var(--accent-1-muted)] px-3 py-2 text-[13px] font-medium text-[var(--accent-1)] transition-colors active:opacity-90"
    >
      <Share2 className="h-3.5 w-3.5" strokeWidth={1.75} />
      分享{cardTitle}卡片
    </button>
  )
}
