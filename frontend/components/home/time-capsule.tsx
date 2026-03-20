"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Gift } from "lucide-react"
import type { MemoItem } from "@/lib/api/memo"
import { format, differenceInDays, parseISO } from "date-fns"
import { zhCN } from "date-fns/locale"

interface TimeCapsuleProps {
  records: MemoItem[]
  userId: number
}

/** 按「日期 + userId」生成当日稳定种子，用于每天固定一条随机惊喜 */
function dailySeed(dateStr: string, uid: number): number {
  let h = 0
  const s = dateStr + "|" + uid
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function TimeCapsule({ records, userId }: TimeCapsuleProps) {
  const capsule = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd")
    const past = records.filter((r) => {
      const d = r.createTime?.slice(0, 10)
      return d && d < today
    })
    if (past.length === 0) return null
    const seed = dailySeed(today, userId)
    const idx = seed % past.length
    const pick = past[idx]
    const createDate = pick.createTime ? parseISO(pick.createTime.slice(0, 10)) : null
    const daysAgo = createDate ? differenceInDays(new Date(), createDate) : 0
    const title =
      pick.title ||
      (pick.type === "photo" ? "一张照片" : pick.type === "voice" ? "一条语音" : pick.type === "file" ? "一个文件" : null) ||
      (pick.content ? (pick.content.slice(0, 20) + (pick.content.length > 20 ? "…" : "")) : "一条记录")
    const caption =
      daysAgo <= 0
        ? "你们记录了："
        : daysAgo === 1
          ? "昨天你们记录了："
          : daysAgo < 365
            ? `${daysAgo}天前你们记录了：`
            : `${Math.floor(daysAgo / 365)}年前你们记录了：`
    const firstPhoto =
      pick.photoUrls && pick.photoUrls.length > 0 ? pick.photoUrls[0] : null
    return {
      ...pick,
      daysAgo,
      caption,
      title: title || "一条记录",
      firstPhoto,
    }
  }, [records, userId])

  if (!capsule) return null

  return (
    <section>
      <Link
        href={`/records/${capsule.id}`}
        className="glass-card block overflow-hidden rounded-xl transition-opacity active:opacity-90"
      >
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-400">
            <Gift className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold text-[var(--foreground)]">时光胶囊</h3>
            <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
              {capsule.caption}
            </p>
          </div>
        </div>
        <div className="px-4 pb-4 pt-0">
          {capsule.firstPhoto ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-[var(--card-bg)]">
<img
              src={capsule.firstPhoto}
              loading="lazy"
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                <p className="text-sm font-medium text-white drop-shadow">
                  {capsule.title}
                </p>
                {capsule.createTime && (
                  <p className="text-xs text-white/90">
                    {format(parseISO(capsule.createTime), "M月d日 EEEE", { locale: zhCN })}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-3">
              <p className="text-sm font-medium text-[var(--foreground)]">
                {capsule.title}
              </p>
              {capsule.createTime && (
                <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                  {format(parseISO(capsule.createTime), "M月d日 EEEE", { locale: zhCN })}
                </p>
              )}
            </div>
          )}
        </div>
      </Link>
    </section>
  )
}
