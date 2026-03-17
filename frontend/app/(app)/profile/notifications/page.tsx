"use client"

import { useState, useEffect } from "react"
import { useBack } from "@/lib/use-back"
import { ArrowLeft, Bell, MessageSquare } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

const DAILY_TIPS_KEY = "yunqi_notify_daily_tips"
const AI_REPLY_KEY = "yunqi_notify_ai_reply"
const RECORD_REMINDER_KEY = "yunqi_notify_record_reminder"

export default function NotificationsPage() {
  const goBack = useBack("/profile")
  const [dailyTips, setDailyTips] = useState(true)
  const [aiReply, setAiReply] = useState(true)
  const [recordReminder, setRecordReminder] = useState(true)

  useEffect(() => {
    try {
      const dt = localStorage.getItem(DAILY_TIPS_KEY)
      const ar = localStorage.getItem(AI_REPLY_KEY)
      const rr = localStorage.getItem(RECORD_REMINDER_KEY)
      setDailyTips(dt !== "false")
      setAiReply(ar !== "false")
      setRecordReminder(rr !== "false")
    } catch {
      // ignore
    }
  }, [])

  const save = (key: string, value: boolean) => {
    try {
      localStorage.setItem(key, String(value))
    } catch {
      // ignore
    }
    toast.success("设置已更新")
  }

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4" style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(24px) saturate(1.3)", WebkitBackdropFilter: "blur(24px) saturate(1.3)" }}>
        <button
          onClick={goBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary transition-colors active:bg-secondary/80"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">消息通知</h1>
      </div>

      <div className="px-4 pb-8">
        <div className="overflow-hidden rounded-2xl bg-card">
          <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bell className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">每日提醒</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                每日首次打开应用时提醒孕期小贴士
              </p>
            </div>
            <Switch
              checked={dailyTips}
              onCheckedChange={(v) => {
                setDailyTips(v)
                save(DAILY_TIPS_KEY, v)
              }}
            />
          </div>
          <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-2/10 text-chart-2">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">孕期小伴回复通知</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                孕期小伴回复完成时在页面内提示
              </p>
            </div>
            <Switch
              checked={aiReply}
              onCheckedChange={(v) => {
                setAiReply(v)
                save(AI_REPLY_KEY, v)
              }}
            />
          </div>
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-3/10 text-chart-3">
              <Bell className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">每日记录提醒</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                今日还未记录时，首次打开应用会温和提醒
              </p>
            </div>
            <Switch
              checked={recordReminder}
              onCheckedChange={(v) => {
                setRecordReminder(v)
                save(RECORD_REMINDER_KEY, v)
              }}
            />
          </div>
        </div>
        <p className="mt-4 px-2 text-xs text-muted-foreground">
          以上为网页内通知，开启后将在应用内以提示形式显示。
        </p>
      </div>
    </div>
  )
}
