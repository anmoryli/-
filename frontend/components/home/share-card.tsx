"use client"

import { getPregnancyInfo, getBabySize, getCountdownMessage } from "@/lib/pregnancy"
import { Share2 } from "lucide-react"
import { toast } from "sonner"

interface ShareCardProps {
  username: string
  lastMenstrualDate?: string
  dueDate: string
}

const CARD_WIDTH = 375
const CARD_HEIGHT = 520
const SCALE = 2

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
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

function drawShareImage(
  username: string,
  weeksPregnant: number,
  daysInCurrentWeek: number,
  countdownMsg: string,
  babySizeName: string,
  daysRemaining: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  canvas.width = CARD_WIDTH * SCALE
  canvas.height = CARD_HEIGHT * SCALE
  const ctx = canvas.getContext("2d")!
  ctx.scale(SCALE, SCALE)

  const bgColor = "#FDFAF7"
  const borderColor = "rgba(227, 184, 176, 0.5)"
  const mutedColor = "#8A8885"
  const mainColor = "#3D3B39"
  const accentColor = "#E3B8B0"
  const footerColor = "#A8A5A1"

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  ctx.strokeStyle = borderColor
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, CARD_WIDTH - 2, CARD_HEIGHT - 2)

  let y = 32

  ctx.font = "500 11px 'STZhongsong', '华文中宋', serif"
  ctx.fillStyle = mutedColor
  ctx.textAlign = "center"
  ctx.fillText("孕期宝", CARD_WIDTH / 2, y)
  y += 28

  ctx.font = "500 15px 'STZhongsong', '华文中宋', serif"
  ctx.fillStyle = mainColor
  ctx.fillText(username, CARD_WIDTH / 2, y)
  y += 36

  const weekStr = `${weeksPregnant}周${daysInCurrentWeek}天`
  ctx.font = "600 32px 'STZhongsong', '华文中宋', serif"
  ctx.fillStyle = mainColor
  ctx.fillText(weekStr, CARD_WIDTH / 2, y)
  y += 36

  ctx.font = "400 14px 'STZhongsong', '华文中宋', serif"
  ctx.fillStyle = accentColor
  const countdownLines = wrapText(ctx, countdownMsg, CARD_WIDTH - 48)
  countdownLines.forEach((line) => {
    ctx.fillText(line, CARD_WIDTH / 2, y)
    y += 22
  })
  y += 16

  const infoStr = `宝宝约 ${babySizeName} 大小 · 距预产期 ${daysRemaining} 天`
  ctx.font = "400 13px 'STZhongsong', '华文中宋', serif"
  ctx.fillStyle = mutedColor
  const infoLines = wrapText(ctx, infoStr, CARD_WIDTH - 48)
  infoLines.forEach((line) => {
    ctx.fillText(line, CARD_WIDTH / 2, y)
    y += 22
  })
  y += 36

  ctx.font = "400 11px 'STZhongsong', '华文中宋', serif"
  ctx.fillStyle = footerColor
  ctx.fillText("愿这段孕期时光，成为永恒的美好", CARD_WIDTH / 2, y)

  return canvas
}

export function ShareCard({ username, lastMenstrualDate, dueDate }: ShareCardProps) {
  const info = getPregnancyInfo(lastMenstrualDate ?? dueDate, dueDate)
  const babySize = getBabySize(info.weeksPregnant)
  const countdownMsg = getCountdownMessage(info.daysRemaining)

  const handleShare = () => {
    try {
      const canvas = drawShareImage(
        username,
        info.weeksPregnant,
        info.daysInCurrentWeek,
        countdownMsg,
        babySize.name,
        info.daysRemaining
      )
      const link = document.createElement("a")
      link.download = `孕期-${username}-${new Date().toISOString().slice(0, 10)}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
      toast.success("已保存到相册")
    } catch {
      toast.error("生成失败")
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleShare}
        className="glass-card flex w-full items-center justify-center gap-2 px-4 py-3 text-[14px] font-medium text-[var(--accent-1)] transition-colors active:opacity-90"
      >
        <Share2 className="h-4 w-4" strokeWidth={1.75} />
        生成分享卡片
      </button>
      <div
        className="rounded-xl border-2 p-6 overflow-hidden min-w-0"
        style={{
          borderColor: "rgba(227, 184, 176, 0.5)",
          backgroundColor: "#FDFAF7",
          minWidth: 320,
        }}
      >
        <p className="text-center text-[11px] uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis px-2" style={{ color: "#8A8885" }}>
          孕期宝
        </p>
        <p className="mt-2 text-center text-[15px] font-medium whitespace-nowrap overflow-hidden text-ellipsis px-2" style={{ color: "#3D3B39" }}>
          {username}
        </p>
        <p className="mt-4 text-center text-3xl font-semibold whitespace-nowrap overflow-hidden text-ellipsis px-2" style={{ color: "#3D3B39" }}>
          {info.weeksPregnant}周{info.daysInCurrentWeek}天
        </p>
        <p className="mt-2 text-center text-[14px] whitespace-nowrap overflow-hidden text-ellipsis px-2" style={{ color: "#E3B8B0" }}>
          {countdownMsg}
        </p>
        <p className="mt-4 text-center text-[13px] whitespace-nowrap overflow-hidden text-ellipsis px-2" style={{ color: "#8A8885" }} title={`宝宝约 ${babySize.name} 大小 · 距预产期 ${info.daysRemaining} 天`}>
          宝宝约 {babySize.name} 大小 · 距预产期 {info.daysRemaining} 天
        </p>
        <p className="mt-6 text-center text-[10px] whitespace-nowrap overflow-hidden text-ellipsis px-2" style={{ color: "#A8A5A1" }}>
          愿这段孕期时光，成为永恒的美好
        </p>
      </div>
    </div>
  )
}
