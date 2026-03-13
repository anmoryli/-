"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, useDayPicker } from "react-day-picker"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import "react-day-picker/style.css"

interface MobileDatePickerProps {
  value: string
  onChange: (value: string) => void
  label?: string
  minDate?: Date
  maxDate?: Date
  placeholder?: string
}

function CalendarCaption(
  props: { calendarMonth: { date: Date }; displayIndex: number } & React.HTMLAttributes<HTMLDivElement>
) {
  const { calendarMonth, displayIndex, ...divProps } = props
  const { goToMonth, previousMonth, nextMonth } = useDayPicker()
  const d = calendarMonth.date
  const year = d.getFullYear()
  const monthName = format(d, "M月", { locale: zhCN })

  return (
    <div className="flex flex-col gap-3 pb-3" {...divProps}>
      {/* 年份行：左右箭头 + 居中年份 */}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => goToMonth(new Date(year - 1, d.getMonth(), 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--foreground-muted)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          aria-label="上一年"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2} />
        </button>
        <span className="min-w-[4rem] text-center text-[17px] font-semibold text-[var(--foreground)]">
          {year}
        </span>
        <button
          type="button"
          onClick={() => goToMonth(new Date(year + 1, d.getMonth(), 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--foreground-muted)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          aria-label="下一年"
        >
          <ChevronRight className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>
      {/* 月份行：月份名 + 左右箭头 */}
      <div className="flex items-center justify-between">
        <span
          className="text-[16px] font-medium"
          style={{ color: "var(--accent-1)" }}
        >
          {monthName}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            disabled={!previousMonth}
            onClick={() => previousMonth && goToMonth(previousMonth)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--foreground-muted)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-40"
            aria-label="上个月"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            disabled={!nextMonth}
            onClick={() => nextMonth && goToMonth(nextMonth)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--foreground-muted)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-40"
            aria-label="下个月"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  )
}

export function MobileDatePicker({
  value,
  onChange,
  label,
  minDate,
  maxDate,
  placeholder = "请选择日期",
}: MobileDatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = value ? new Date(value + "T12:00:00") : undefined
  const [displayMonth, setDisplayMonth] = useState<Date>(() => selected || new Date())

  useEffect(() => {
    if (open) setDisplayMonth(value ? new Date(value + "T12:00:00") : new Date())
  }, [open, value])

  const handleSelect = (date: Date | undefined) => {
    if (!date) return
    onChange(format(date, "yyyy-MM-dd"))
    setOpen(false)
  }

  const displayText = value
    ? format(new Date(value + "T12:00:00"), "yyyy年M月d日", { locale: zhCN })
    : placeholder

  return (
    <>
      <div className="space-y-2">
        {label && (
          <label className="text-caption font-medium text-[var(--foreground)]">
            {label}
          </label>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3.5 text-left text-[15px] text-[var(--foreground)] shadow-sm transition-[box-shadow,color] hover:border-[var(--foreground-muted)]/30"
        >
          <Calendar className="h-5 w-5 shrink-0 text-[var(--accent-1)]" strokeWidth={1.75} />
          <span className={value ? "" : "text-[var(--foreground-muted)]"}>
            {displayText}
          </span>
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[min(100vw-2rem,380px)] overflow-hidden rounded-2xl border-[var(--card-border)] bg-[var(--card)] p-0 shadow-xl">
          <DialogHeader className="border-b border-[var(--card-border)] px-4 py-3">
            <DialogTitle className="text-[var(--foreground)]">
              {label || "选择日期"}
            </DialogTitle>
          </DialogHeader>
          <div className="px-4 pb-5 pt-2">
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={handleSelect}
              month={displayMonth}
              onMonthChange={setDisplayMonth}
              locale={zhCN}
              disabled={{ before: minDate, after: maxDate }}
              showOutsideDays
              className="modern-calendar"
              components={{
                MonthCaption: (captionProps) => <CalendarCaption {...captionProps} />,
                Nav: () => null,
              }}
              classNames={{
                months: "flex flex-col",
                month: "w-full",
                month_caption: "flex flex-col",
                weekdays: "flex",
                weekday: "w-[--rdp-cell-size] text-center text-[12px] font-medium text-[var(--foreground-muted)]",
                week: "flex w-full mt-1",
                day: "relative w-[--rdp-cell-size] h-[--rdp-cell-size] p-0 text-center text-[15px]",
                day_button: [
                  "inline-flex h-[--rdp-cell-size] w-[--rdp-cell-size] items-center justify-center rounded-full font-medium transition-colors",
                  "hover:bg-[var(--muted)]",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-1)]/50",
                  "data-[selected=true]:bg-[var(--accent-1)] data-[selected=true]:text-white",
                  "data-[today=true]:font-semibold data-[today=true]:text-[var(--accent-1)]",
                  "data-[today=true][data-selected=true]:text-white",
                ].join(" "),
                outside: "text-[var(--foreground-muted)]/50",
                disabled: "opacity-40 cursor-not-allowed",
                hidden: "invisible",
              }}
              styles={{
                "--rdp-cell-size": "40px",
              } as React.CSSProperties}
            />
          </div>
          <div className="flex justify-end border-t border-[var(--card-border)] px-4 py-3">
            <Button
              type="button"
              variant="ghost"
              className="text-[var(--foreground-muted)]"
              onClick={() => setOpen(false)}
            >
              取消
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
