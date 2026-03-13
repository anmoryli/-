"use client"

import { Share2 } from "lucide-react"
import { toast } from "sonner"
import type { MemoItem } from "@/lib/api/memo"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

const CARD_WIDTH = 375
const MIN_CARD_HEIGHT = 560
const FOOTER_HEIGHT = 40
const SCALE = 2

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

function getTitle(record: MemoItem): string {
  return record.title || record.photoDescription || "记录"
}

/** 将 Markdown 转为纯文本；去掉图片语法，避免卡片上出现 URL 文本（图片由 getCardImageUrl 单独绘制） */
function markdownToPlainText(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "") // 移除 ![alt](url)，图片由 getCardImageUrl 绘制
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // 链接保留文字
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

function getContent(record: MemoItem): string {
  const raw = record.content || record.photoDescription || "记录于孕期时光"
  return markdownToPlainText(raw)
}

function getPreviewProxyUrl(fileUrl: string): string {
  const path = `/api/file-proxy?url=${encodeURIComponent(fileUrl)}`
  return typeof window !== "undefined" ? `${window.location.origin}${path}` : path
}

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(url)
}

function extractFirstMarkdownImage(md: string): string | null {
  const m = md.match(/!\[[^\]]*]\(([^)]+)\)/)
  return m?.[1] ?? null
}

function getCardImageUrl(record: MemoItem): string | null {
  if (record.photoUrls && record.photoUrls.length > 0 && record.photoUrls[0]) {
    return getPreviewProxyUrl(record.photoUrls[0])
  }
  if (record.type === "photo" && record.url) {
    return getPreviewProxyUrl(record.url)
  }
  if (record.url && isImageUrl(record.url)) {
    return getPreviewProxyUrl(record.url)
  }
  if (record.fileUrl && isImageUrl(record.fileUrl)) {
    return getPreviewProxyUrl(record.fileUrl)
  }
  const mdImage = extractFirstMarkdownImage(record.content || "")
  if (mdImage) {
    return getPreviewProxyUrl(mdImage)
  }
  return null
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("load image failed"))
    img.src = src
  })
}

/** 测量内容所需高度（不截断），用于长图导出 */
function measureCardHeight(ctx: CanvasRenderingContext2D, record: MemoItem): number {
  let y = 32
  y += 28 // 品牌
  y += 28 // 日期
  const title = getTitle(record)
  const titleLines = wrapText(ctx, title, CARD_WIDTH - 48)
  y += titleLines.length * 24 + 16
  const imageUrl = getCardImageUrl(record)
  if (imageUrl) y += 180 + 16
  const content = getContent(record)
  if (content) {
    const paragraphs = content.split("\n")
    const contentLines: string[] = []
    for (const p of paragraphs) {
      const lines = wrapText(ctx, p, CARD_WIDTH - 48)
      if (lines.length === 0) contentLines.push("")
      else contentLines.push(...lines)
    }
    for (const line of contentLines) {
      if (line === "") y += 10
      else y += 22
    }
    y += 16
  }
  y += FOOTER_HEIGHT
  return Math.max(MIN_CARD_HEIGHT, y)
}

async function drawRecordCard(record: MemoItem): Promise<HTMLCanvasElement> {
  const measureCanvas = document.createElement("canvas")
  measureCanvas.width = CARD_WIDTH
  measureCanvas.height = MIN_CARD_HEIGHT
  const measureCtx = measureCanvas.getContext("2d")!
  measureCtx.font = "400 14px 'STZhongsong', '华文中宋', serif"
  const totalHeight = measureCardHeight(measureCtx, record)

  const canvas = document.createElement("canvas")
  canvas.width = CARD_WIDTH * SCALE
  canvas.height = totalHeight * SCALE
  const ctx = canvas.getContext("2d")!
  ctx.scale(SCALE, SCALE)

  const bgColor = "#FDFAF7"
  const borderColor = "rgba(227, 184, 176, 0.5)"
  const mutedColor = "#8A8885"
  const mainColor = "#3D3B39"
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
  ctx.fillText("孕期宝 · 把每一天都留下来", CARD_WIDTH / 2, y)
  y += 28

  const dateStr = record.createTime
    ? format(new Date(record.createTime), "yyyy年M月d日", { locale: zhCN })
    : ""
  ctx.font = "400 12px 'STZhongsong', '华文中宋', serif"
  ctx.fillText(dateStr, CARD_WIDTH / 2, y)
  y += 28

  const title = getTitle(record)
  ctx.font = "600 18px 'STZhongsong', '华文中宋', serif"
  ctx.fillStyle = mainColor
  const titleLines = wrapText(ctx, title, CARD_WIDTH - 48)
  titleLines.forEach((line) => {
    ctx.fillText(line, CARD_WIDTH / 2, y)
    y += 24
  })
  y += 16

  const imageUrl = getCardImageUrl(record)
  if (imageUrl) {
    try {
      const img = await loadImage(imageUrl)
      const boxX = 24
      const boxY = y
      const boxW = CARD_WIDTH - 48
      const boxH = 180
      ctx.fillStyle = "#F7F2EE"
      ctx.fillRect(boxX, boxY, boxW, boxH)
      ctx.strokeStyle = borderColor
      ctx.lineWidth = 1
      ctx.strokeRect(boxX, boxY, boxW, boxH)
      const ratio = Math.min(boxW / img.width, boxH / img.height)
      const drawW = img.width * ratio
      const drawH = img.height * ratio
      const drawX = boxX + (boxW - drawW) / 2
      const drawY = boxY + (boxH - drawH) / 2
      ctx.drawImage(img, drawX, drawY, drawW, drawH)
      y += boxH + 16
    } catch {
      // ignore
    }
  }

  const content = getContent(record)
  if (content) {
    ctx.font = "400 14px 'STZhongsong', '华文中宋', serif"
    ctx.fillStyle = mainColor
    const paragraphs = content.split("\n")
    const contentLines: string[] = []
    for (const p of paragraphs) {
      const lines = wrapText(ctx, p, CARD_WIDTH - 48)
      if (lines.length === 0) contentLines.push("")
      else contentLines.push(...lines)
    }
    for (const line of contentLines) {
      if (line === "") {
        y += 10
      } else {
        ctx.fillText(line, CARD_WIDTH / 2, y)
        y += 22
      }
    }
    y += 16
  }

  ctx.font = "400 11px 'STZhongsong', '华文中宋', serif"
  ctx.fillStyle = footerColor
  ctx.fillText("记录于孕期宝", CARD_WIDTH / 2, totalHeight - 24)

  return canvas
}

interface RecordShareCardProps {
  record: MemoItem
}

export function RecordShareCard({ record }: RecordShareCardProps) {
  const handleShare = async () => {
    try {
      const canvas = await drawRecordCard(record)
      const link = document.createElement("a")
      link.download = `记录-${getTitle(record).slice(0, 20)}-${new Date().toISOString().slice(0, 10)}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
      toast.success("已保存到相册")
    } catch {
      toast.error("生成失败")
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex items-center justify-center gap-2 rounded-xl border border-[var(--accent-1)]/40 bg-[var(--accent-1-muted)] px-4 py-3 text-[14px] font-medium text-[var(--accent-1)] transition-colors active:opacity-90"
    >
      <Share2 className="h-4 w-4" strokeWidth={1.75} />
      分享这张记录卡片
    </button>
  )
}
