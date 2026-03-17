"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import {
  Plus,
  PenLine,
  Image,
  Mic,
  FileText,
  FileDown,
  Pencil,
  Trash2,
  Mail,
  Clock,
  ChevronDown,
  Calendar,
  Search,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  getAllEnriched,
  getFamilyEnriched,
  deleteText,
  deletePhoto,
  deleteVoice,
  deleteFile,
  exportPdfToEmail,
  type MemoItem,
} from "@/lib/api/memo"
import { getMyFamily, getFamilyMembers } from "@/lib/api/family"
import { getPregnancyInfo } from "@/lib/pregnancy"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { DateRangeShare } from "@/components/share/date-range-share"

const typeLabels: Record<string, string> = {
  text: "文字",
  photo: "照片",
  voice: "语音",
  file: "文件",
}

const moodLabels: Record<string, string> = {
  happy: "开心",
  calm: "平静",
  tired: "疲惫",
  anxious: "焦虑",
  excited: "期待",
}

const addRecordOptions = [
  { label: "写日记", href: "/records/new?type=text", icon: PenLine },
  { label: "拍照片", href: "/records/new?type=photo", icon: Image },
  { label: "录语音", href: "/records/new?type=voice", icon: Mic },
  { label: "上传文件", href: "/records/new?type=file", icon: FileText },
  { label: "写信给宝宝", href: "/records/new?type=text&tag=letter_to_baby", icon: Mail },
  { label: "给未来的自己", href: "/records/new?type=text&tag=letter_to_future", icon: Clock },
]

const segments = [
  { value: "all", label: "全部" },
  { value: "milestone", label: "重要时刻" },
  { value: "letter_to_future", label: "给未来的自己" },
  { value: "text", label: "文字" },
  { value: "photo", label: "照片" },
  { value: "voice", label: "语音" },
  { value: "file", label: "文件" },
]

function isMilestoneRecord(r: MemoItem): boolean {
  const t = (r.title || "").toLowerCase()
  const c = (r.content || r.photoDescription || "").toLowerCase()
  const tag = (r.tag || "").toLowerCase()
  const text = `${t} ${c} ${tag}`
  if (tag === "letter_to_baby") return true
  const firstKeywords = ["第一次", "首次"]
  const milestoneKeywords = ["胎动", "产检", "b超", "nt", "唐筛", "四维", "糖耐", "见面"]
  return firstKeywords.some((k) => text.includes(k)) && milestoneKeywords.some((k) => text.includes(k))
}

function RecordTypeIcon({ type, tag }: { type: string; tag?: string }) {
  const iconClass = "h-5 w-5 stroke-[1.6]"
  const base = "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
  if (tag === "letter_to_baby") {
    return (
      <div className={`${base} bg-[var(--accent-1-muted)] text-[var(--accent-1)]`}>
        <Mail className={iconClass} />
      </div>
    )
  }
  if (tag === "letter_to_future") {
    return (
      <div className={`${base} bg-[var(--accent-3-muted)] text-[var(--accent-3)]`}>
        <Clock className={iconClass} />
      </div>
    )
  }
  switch (type) {
    case "photo":
      return (
        <div className={`${base} bg-[var(--accent-3-muted)] text-[var(--accent-3)]`}>
          <Image className={iconClass} />
        </div>
      )
    case "voice":
      return (
        <div className={`${base} bg-[var(--accent-2-muted)] text-[var(--accent-2)]`}>
          <Mic className={iconClass} />
        </div>
      )
    case "file":
      return (
        <div className={`${base} bg-[var(--muted)] text-[var(--foreground-muted)]`}>
          <FileText className={iconClass} />
        </div>
      )
    default:
      return (
        <div className={`${base} bg-[var(--accent-1-muted)] text-[var(--accent-1)]`}>
          <PenLine className={iconClass} />
        </div>
      )
  }
}

function getTitle(record: MemoItem): string {
  if (record.title && record.title.trim()) return record.title
  if (record.type === "photo") return "照片记录"
  return typeLabels[record.type] || "记录"
}

function getContent(record: MemoItem): string {
  if (record.content) return record.content
  if (record.photoDescription) return record.photoDescription
  if (record.voiceUrl) return "语音记录"
  if (record.fileUrl) return "文件记录"
  return ""
}

function getTagLabel(record: MemoItem): string {
  if (record.tag === "letter_to_baby") return "给宝宝的信"
  if (record.tag === "letter_to_future") return "给未来的自己"
  return typeLabels[record.type] || "记录"
}

export default function RecordsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [records, setRecords] = useState<MemoItem[]>([])
  const [filter, setFilter] = useState("all")
  const [recordFilter, setRecordFilter] = useState<"all" | "mom" | "dad">("all")
  const [loading, setLoading] = useState(true)
  const [dateRangeFrom, setDateRangeFrom] = useState<string>("")
  const [dateRangeTo, setDateRangeTo] = useState<string>("")
  const [keyword, setKeyword] = useState("")
  const [creatorUserId, setCreatorUserId] = useState<number | null>(null)
  const [creatorUsername, setCreatorUsername] = useState<string>("")
  const [hasFamilyTwo, setHasFamilyTwo] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportScope, setExportScope] = useState<"mom" | "dad" | "both">("both")
  const [exportFromDate, setExportFromDate] = useState("")
  const [exportToDate, setExportToDate] = useState("")
  const [exportSubmitting, setExportSubmitting] = useState(false)
  const timelineContainerRef = useRef<HTMLDivElement>(null)

  const isFamilyMember = user?.userType === "family_member"
  const canAddRecord = !isFamilyMember || !!user?.isSpouse

  // 红→蓝→绿曲线：以视口中心为基准，远离中心的卡片沿曲线过渡（向中线靠拢+缩放）直至“消失感”，无透明度变化
  const updateScrollState = useCallback(() => {
    const container = timelineContainerRef.current
    if (!container) return
    const centerY = typeof window !== "undefined" ? window.innerHeight / 2 : 400
    const rows = container.querySelectorAll<HTMLElement>(".timeline-row")
    const range = 220
    rows.forEach((row) => {
      const rect = row.getBoundingClientRect()
      const rowCenterY = rect.top + rect.height / 2
      const side = row.getAttribute("data-side") || "left"
      const dist = rowCenterY - centerY
      const progress = Math.min(1, Math.abs(dist) / range)
      const sign = dist < 0 ? -1 : 1
      const tx = side === "left" ? progress * 32 : -progress * 32
      const ty = sign * progress * 20
      const scale = 1 - progress * 0.22
      row.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`
    })
  }, [])

  useEffect(() => {
    updateScrollState()
    window.addEventListener("scroll", updateScrollState, { passive: true })
    const raf = requestAnimationFrame(updateScrollState)
    return () => {
      window.removeEventListener("scroll", updateScrollState)
      cancelAnimationFrame(raf)
    }
  }, [updateScrollState, loading, records.length])

  const fetchRecords = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      let targetUserId = user.userId
      let targetUsername = user.username || "用户"
      if (isFamilyMember) {
        const family = await getMyFamily(user.userId)
        if (family) {
          targetUserId = family.creatorUserId
          setCreatorUserId(family.creatorUserId)
          const members = await getFamilyMembers(family.familyId, user.userId)
          const creator = members.find((m) => m.role === "creator")
          targetUsername = creator?.username || "家人"
          setCreatorUsername(targetUsername)
        } else {
          setCreatorUserId(null)
          setCreatorUsername("")
          setHasFamilyTwo(false)
          setRecords([])
          setLoading(false)
          return
        }
      } else {
        setCreatorUserId(user.userId)
        setCreatorUsername(targetUsername)
        setHasFamilyTwo(false)
      }
      const family = await getMyFamily(user.userId)
      const members = family ? await getFamilyMembers(family.familyId, user.userId) : []
      const hasSpouse = (members ?? []).some((m) => m.isSpouse)
      let data: MemoItem[]
      if (family && hasSpouse) {
        data = await getFamilyEnriched(user.userId)
        setHasFamilyTwo(true)
      } else {
        data = await getAllEnriched(targetUserId, user.userId)
        setHasFamilyTwo(false)
      }
      setRecords(data || [])
    } catch {
      toast.error("获取记录失败")
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [user, isFamilyMember])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const handleDelete = useCallback(
    async (record: MemoItem) => {
      try {
        switch (record.type) {
          case "text":
            await deleteText(record.id)
            break
          case "photo":
            await deletePhoto(record.id)
            break
          case "voice":
            await deleteVoice(record.id)
            break
          case "file":
            await deleteFile(record.id)
            break
        }
        toast.success("记录已删除")
        fetchRecords()
      } catch {
        toast.error("删除失败")
      }
    },
    [fetchRecords]
  )

  const recordByFiltered =
    !hasFamilyTwo || recordFilter === "all"
      ? records
      : recordFilter === "mom"
        ? records.filter((r) => r.recordBy === "mom")
        : records.filter((r) => r.recordBy === "dad")
  const typeFilteredRecords =
    filter === "all"
      ? recordByFiltered
      : filter === "milestone"
        ? recordByFiltered.filter(isMilestoneRecord)
        : filter === "letter_to_future"
          ? recordByFiltered.filter((r) => r.tag === "letter_to_future")
          : recordByFiltered.filter((r) => r.type === filter)

  const searchKey = keyword.trim().toLowerCase()
  const filteredRecords = !searchKey
    ? typeFilteredRecords
    : typeFilteredRecords.filter((r) => {
        const text = `${r.title || ""} ${r.content || ""} ${r.photoDescription || ""} ${r.tag || ""}`.toLowerCase()
        return text.includes(searchKey)
      })

  const dateFilteredRecords =
    !dateRangeFrom && !dateRangeTo
      ? filteredRecords
      : filteredRecords.filter((r) => {
          const d = r.createTime?.slice(0, 10)
          if (!d || d === "未知") return false
          const from = dateRangeFrom || "0000-01-01"
          const to = dateRangeTo || "9999-12-31"
          return d >= from && d <= to
        })

  const groupedByDate = dateFilteredRecords.reduce<Record<string, MemoItem[]>>((acc, r) => {
    const date = r.createTime?.slice(0, 10) ?? "未知"
    if (!acc[date]) acc[date] = []
    acc[date].push(r)
    return acc
  }, {})
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => (a > b ? -1 : 1))

  const rangeFrom = dateRangeFrom || sortedDates[0]
  const rangeTo = dateRangeTo || sortedDates[sortedDates.length - 1]
  const rangeRecords = dateFilteredRecords.filter((r) => {
    const d = r.createTime?.slice(0, 10)
    if (!d || d === "未知") return false
    return d >= rangeFrom && d <= rangeTo
  })

  const info = user?.pregnancyTime
    ? getPregnancyInfo(user.lastMenstrualDate ?? user.pregnancyTime, user.pregnancyTime)
    : null

  const getWeekLabel = (dateStr: string, items: MemoItem[]) => {
    const withWeek = items.find((it) => it.pregnancyWeek)
    if (withWeek?.pregnancyWeek) return `孕 ${withWeek.pregnancyWeek}`
    if (!info || dateStr === "未知") return null
    const date = new Date(dateStr)
    const lmp = new Date(user?.lastMenstrualDate ?? user?.pregnancyTime ?? "")
    const daysPassed = Math.floor((date.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24))
    const week = Math.floor(daysPassed / 7)
    if (week >= 1) return `孕 ${week} 周`
    return "孕周未知"
  }

  if (!user) return null

  return (
    <div className="min-h-dvh bg-[var(--background)] px-6 pt-14 pb-8">
      {/* Header — 固定在顶部 */}
      <div className="sticky top-0 z-10 -mx-6 -mt-14 flex items-center justify-between border-b border-[var(--card-border)] bg-[var(--background)]/95 px-6 py-4 backdrop-blur-sm">
        <div>
          <h1
            className="text-[1.4rem] font-semibold tracking-tight text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            孕期时光轴
          </h1>
          <p className="mt-1.5 text-[14px] text-[var(--foreground-muted)]">
            {isFamilyMember ? "查看家人的共享记录" : "记录每一天，留住珍贵时光"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {records.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const earliest = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : ""
                const today = new Date().toISOString().slice(0, 10)
                setExportFromDate(dateRangeFrom || earliest)
                setExportToDate(dateRangeTo || today)
                setShowExportModal(true)
              }}
              className="flex items-center gap-2 rounded-full border border-[var(--accent-2)]/50 bg-[var(--accent-2-muted)] px-3 py-2 text-[13px] font-medium text-[var(--accent-2)] transition-transform active:scale-95"
            >
              <FileDown className="h-4 w-4" strokeWidth={1.75} />
              导出 PDF
            </button>
          )}
          {canAddRecord && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--accent-1)]/50 bg-[var(--accent-1-muted)] text-[var(--accent-1)] transition-transform active:scale-95"
              >
                <Plus className="h-5 w-5" strokeWidth={2} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              {addRecordOptions.map((opt) => {
                const Icon = opt.icon
                return (
                  <DropdownMenuItem key={opt.href} asChild>
                    <Link href={opt.href} className="flex items-center gap-2 cursor-pointer">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                      {opt.label}
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          )}
        </div>
      </div>

      {/* 导出 PDF 模态框：发邮箱、范围、日期 */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !exportSubmitting && setShowExportModal(false)}>
          <div className="w-full max-w-sm rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-body font-semibold text-[var(--foreground)]">导出 PDF 至邮箱</h3>
            <p className="mt-1 text-[13px] text-[var(--foreground-muted)]">完成后将发送至你的邮箱，请稍候查收。</p>
            <div className="mt-4 space-y-3">
              <p className="text-[13px] font-medium text-[var(--foreground)]">导出范围</p>
              <div className="flex gap-2">
                {(["both", "mom", "dad"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setExportScope(s)}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors",
                      exportScope === s
                        ? "border-[var(--accent-2)] bg-[var(--accent-2-muted)] text-[var(--accent-2)]"
                        : "border-[var(--card-border)] bg-[var(--muted)] text-[var(--foreground-muted)]"
                    )}
                  >
                    {s === "both" ? "两人的记录" : s === "mom" ? "仅妈妈" : "仅爸爸"}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={exportFromDate}
                  onChange={(e) => setExportFromDate(e.target.value)}
                  className="rounded-lg border border-[var(--card-border)] bg-[var(--muted)] px-3 py-2 text-[13px] text-[var(--foreground)]"
                />
                <input
                  type="date"
                  value={exportToDate}
                  onChange={(e) => setExportToDate(e.target.value)}
                  className="rounded-lg border border-[var(--card-border)] bg-[var(--muted)] px-3 py-2 text-[13px] text-[var(--foreground)]"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => !exportSubmitting && setShowExportModal(false)}
                className="flex-1 rounded-lg border border-[var(--card-border)] py-2.5 text-[14px] font-medium text-[var(--foreground-muted)]"
              >
                取消
              </button>
              <button
                type="button"
                disabled={exportSubmitting}
                onClick={async () => {
                  setExportSubmitting(true)
                  try {
                    // 始终用当前登录用户：收件邮箱与导出失败站内通知都发给操作人（如爸爸），不发给创建者（妈妈）
                    await exportPdfToEmail(user!.userId, {
                      scope: exportScope,
                      fromDate: exportFromDate || undefined,
                      toDate: exportToDate || undefined,
                    })
                    toast.success("导出已提交，完成后将发送至您的邮箱")
                    setShowExportModal(false)
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "提交失败")
                  } finally {
                    setExportSubmitting(false)
                  }
                }}
                className="flex-1 rounded-lg bg-[var(--accent-2)] py-2.5 text-[14px] font-medium text-[var(--foreground)] disabled:opacity-60"
              >
                {exportSubmitting ? "提交中…" : "确认导出"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 日期范围分享 */}
      {sortedDates.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4">
          <Calendar className="h-5 w-5 text-[var(--accent-1)]" strokeWidth={1.75} />
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={dateRangeFrom}
              onChange={(e) => setDateRangeFrom(e.target.value)}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--muted)] px-3 py-2 text-[13px] text-[var(--foreground)]"
            />
            <span className="text-[var(--foreground-muted)]">至</span>
            <input
              type="date"
              value={dateRangeTo}
              onChange={(e) => setDateRangeTo(e.target.value)}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--muted)] px-3 py-2 text-[13px] text-[var(--foreground)]"
            />
          </div>
          <DateRangeShare
            userId={creatorUserId ?? user!.userId}
            username={creatorUsername || user!.username || "用户"}
            fromDate={rangeFrom}
            toDate={rangeTo}
            recordsCount={rangeRecords.length}
          />
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5">
        <Search className="h-4 w-4 text-[var(--foreground-muted)]" strokeWidth={1.75} />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索标题、内容、标签"
          className="w-full bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] outline-none"
        />
      </div>

      {/* 总/妈妈/爸爸 筛选（有配偶时显示） */}
      {hasFamilyTwo && (
        <div className="mt-4 flex gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--muted)]/40 p-1">
          {(["all", "mom", "dad"] as const).map((rf) => (
            <button
              key={rf}
              type="button"
              onClick={() => setRecordFilter(rf)}
              className={cn(
                "flex-1 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all",
                recordFilter === rf ? "bg-white text-[var(--foreground)] shadow-sm" : "text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)]"
              )}
            >
              {rf === "all" ? "总" : rf === "mom" ? "妈妈的记录" : "爸爸的记录"}
            </button>
          ))}
        </div>
      )}

      {/* Filter tabs — 隐藏横向滚动条 */}
      <div className="scrollbar-hide mt-6 -mx-6 overflow-x-auto overflow-y-hidden px-6">
        <div className="flex min-w-max gap-1 rounded-xl border border-[var(--card-border)] bg-[var(--muted)]/40 p-1">
          {segments.map((seg) => (
            <button
              key={seg.value}
              type="button"
              onClick={() => setFilter(seg.value)}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                filter === seg.value
                  ? "bg-white text-[var(--foreground)] shadow-sm"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)]"
              )}
            >
              {seg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline List：滚动渐入 + 曲线时间线 */}
      <div className="mt-8" ref={timelineContainerRef}>
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-[var(--muted)]" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-32 animate-pulse rounded bg-[var(--muted)]" />
                  <div className="h-20 animate-pulse rounded-xl bg-[var(--muted)]" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedDates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-1-muted)] to-[var(--accent-1-muted)]/50">
              <PenLine className="h-10 w-10 text-[var(--accent-1)]" strokeWidth={1.5} />
            </div>
            <p className="mt-6 text-[15px] font-medium text-[var(--foreground-secondary)]">
              {filter !== "all" ? "暂无此类记录" : isFamilyMember ? (creatorUserId ? "家人暂无共享记录" : "还没有记录") : "还没有记录"}
            </p>
            <p className="mt-1 text-caption text-[var(--foreground-muted)]">
              {isFamilyMember
                ? creatorUserId
                  ? "等待家人分享记录"
                  : "加入家庭以查看家人的共享记录"
                : "点击右上角 + 添加第一条记录"}
            </p>
            {isFamilyMember && !creatorUserId ? (
              <Link
                href="/family"
                className="mt-6 rounded-xl border border-[var(--accent-1)]/50 bg-[var(--accent-1-muted)] px-6 py-3 text-[14px] font-medium text-[var(--accent-1)]"
              >
                前往我们的小家
              </Link>
            ) : (
              canAddRecord && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="mt-6 flex items-center gap-2 rounded-xl border border-[var(--accent-1)]/50 bg-[var(--accent-1-muted)] px-5 py-3 text-[14px] font-medium text-[var(--accent-1)] transition-colors active:opacity-90"
                    >
                      <Plus className="h-4 w-4" strokeWidth={2} />
                      添加记录
                      <ChevronDown className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="min-w-[200px]">
                    {addRecordOptions.map((opt) => {
                      const Icon = opt.icon
                      return (
                        <DropdownMenuItem key={opt.href} asChild>
                          <Link href={opt.href} className="flex items-center gap-2 cursor-pointer">
                            <Icon className="h-4 w-4" strokeWidth={1.75} />
                            {opt.label}
                          </Link>
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            )}
          </div>
        ) : (
          <div className="relative -mx-6 w-[calc(100%+3rem)]" ref={timelineContainerRef}>
            {/* 中央一条竖线：所有红点对齐此线 */}
            <div className="timeline-central-spine" aria-hidden>
              <svg viewBox="0 0 2 1000" preserveAspectRatio="none">
                <line x1="1" y1="0" x2="1" y2="1000" stroke="rgba(227,184,176,0.55)" strokeWidth="1" />
              </svg>
            </div>

            {sortedDates.map((dateStr) => {
              const items = groupedByDate[dateStr] ?? []
              const weekLabel = getWeekLabel(dateStr, items)
              const dadItems = hasFamilyTwo ? items.filter((r) => r.recordBy === "dad") : []
              const momItems = hasFamilyTwo ? items.filter((r) => r.recordBy === "mom") : []
              const sortByTimeDesc = (a: MemoItem, b: MemoItem) => (new Date(b.createTime ?? 0).getTime() - new Date(a.createTime ?? 0).getTime())
              const sortedDad = [...dadItems].sort(sortByTimeDesc)
              const sortedMom = [...momItems].sort(sortByTimeDesc)

              const renderCard = (record: MemoItem) => (
                <div key={record.id} className="group flex w-full min-h-[52px] items-stretch overflow-hidden rounded-lg bg-transparent">
                  <Link href={`/records/${record.id}`} className="flex min-w-0 flex-1 gap-2 p-2 pr-0">
                    <RecordTypeIcon type={record.type} tag={record.tag} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-1">
                        <span className="inline-block rounded-full bg-[var(--muted)]/80 px-1.5 py-0.5 text-[10px] font-medium text-[var(--foreground-muted)]">
                          {getTagLabel(record)}
                        </span>
                        {record.mood && moodLabels[record.mood] && (
                          <span className="inline-block rounded-full bg-[var(--accent-3-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent-3)]">{moodLabels[record.mood]}</span>
                        )}
                        {record.category?.split(/[,，]/).filter(Boolean).slice(0, 5).map((tag, i) => {
                          const t = tag.trim()
                          const show = t.length > 6 ? t.slice(0, 6) + "…" : t
                          return (
                            <span key={i} className="inline-block rounded-full bg-[var(--accent-2-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent-2)]">{show}</span>
                          )
                        })}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[13px] font-medium leading-snug text-[var(--foreground)]" style={{ fontFamily: "var(--font-serif)" }}>
                        {getTitle(record)}
                      </p>
                      {getContent(record) && (
                        <p className="mt-0.5 line-clamp-2 text-[12px] text-[var(--foreground-secondary)] leading-snug">{getContent(record)}</p>
                      )}
                      {record.type === "photo" && record.photoUrls && record.photoUrls.length > 0 && (
                        <div className="mt-1 flex gap-1">
                          {record.photoUrls.slice(0, 3).map((url, i) => (
                            <div key={i} className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-[var(--muted)]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          ))}
                          {record.photoUrls.length > 3 && (
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--muted)] text-[10px]">+{record.photoUrls.length - 3}</div>
                          )}
                        </div>
                      )}
                      {record.createTime && (
                        <p className="mt-0.5 text-[11px] text-[var(--foreground-muted)]">
                          {format(new Date(record.createTime), "HH:mm", { locale: zhCN })}
                          {record.recordWeightKg != null ? ` · ${record.recordWeightKg}kg` : ""}
                        </p>
                      )}
                    </div>
                  </Link>
                  {(!isFamilyMember || (user?.isSpouse && record.recordBy === "dad")) && (
                    <div className="flex shrink-0 flex-col items-center justify-start gap-0.5 py-2 pr-2 pl-1">
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); router.push(`/records/${record.id}/edit`) }}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--foreground-muted)] hover:bg-[var(--muted)] active:opacity-80"
                        aria-label="编辑"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            type="button"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--foreground-muted)] hover:bg-[var(--critical-muted)] hover:text-[var(--critical)]"
                            aria-label="删除"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-[var(--card-border)]">
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>确定要删除这条记录吗？此操作不可撤销。</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(record)} className="bg-[var(--critical)] text-white hover:opacity-90">
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              )

              return (
                <div key={dateStr} className="mb-6 animate-in fade-in duration-300">
                  <div className="flex flex-wrap items-baseline justify-center gap-2 py-3 px-6">
                    <p className="text-[15px] font-medium text-[var(--foreground)]" style={{ fontFamily: "var(--font-serif)" }}>
                      {dateStr === "未知" ? "未知日期" : format(new Date(dateStr), "M月d日 EEEE", { locale: zhCN })}
                    </p>
                    {weekLabel && (
                      <span className="rounded-full bg-[var(--accent-1-muted)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent-1)]">{weekLabel}</span>
                    )}
                    {items.find((it) => it.recordWeightKg != null)?.recordWeightKg != null && (
                      <span className="rounded-full bg-[var(--accent-2-muted)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent-2)]">
                        体重 {items.find((it) => it.recordWeightKg != null)?.recordWeightKg}kg
                      </span>
                    )}
                  </div>

                  {hasFamilyTwo ? (
                    <div className="grid grid-cols-2 gap-4 px-2">
                      <div className="space-y-2 min-w-0">
                        <p className="text-[11px] font-medium text-[var(--foreground-muted)] mb-1">爸爸</p>
                        {sortedDad.map((r) => (
                          <div key={r.id} className="timeline-row min-h-[60px]" data-side="left" style={{ contentVisibility: "auto" } as React.CSSProperties}>
                            {renderCard(r)}
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2 min-w-0">
                        <p className="text-[11px] font-medium text-[var(--foreground-muted)] mb-1">妈妈</p>
                        {sortedMom.map((r) => (
                          <div key={r.id} className="timeline-row min-h-[60px]" data-side="right" style={{ contentVisibility: "auto" } as React.CSSProperties}>
                            {renderCard(r)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 px-2">
                      {items.map((record) => (
                        <div key={record.id} className="timeline-row" style={{ contentVisibility: "auto" } as React.CSSProperties}>
                          {renderCard(record)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
