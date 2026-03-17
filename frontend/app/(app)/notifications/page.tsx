"use client"

import { useState, useEffect } from "react"
import { useBack } from "@/lib/use-back"
import { ArrowLeft, Bell } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getNotificationList, markNotificationRead, markAllNotificationsRead, type UserNotification } from "@/lib/api/notifications"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export default function NotificationsPage() {
  const goBack = useBack("/")
  const { user } = useAuth()
  const [list, setList] = useState<UserNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  const fetchList = () => {
    if (!user) return
    getNotificationList(user.userId)
      .then((data) => setList(data || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!user) return
    fetchList()
  }, [user])

  // 页面重新获得焦点时拉取最新列表（导出失败等异步通知插入后，切回本页即可看到）
  useEffect(() => {
    if (!user) return
    const onFocus = () => fetchList()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [user])

  if (!user) return null

  const handleMarkRead = async (n: UserNotification) => {
    if (n.readAt) return
    try {
      await markNotificationRead(user.userId, n.id)
      setList((prev) => prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)))
    } catch {
      toast.error("操作失败")
    }
  }

  return (
    <div className="min-h-dvh pb-8">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/40 px-4 py-4" style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(24px) saturate(1.3)", WebkitBackdropFilter: "blur(24px) saturate(1.3)" }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => goBack()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--muted)] transition-colors active:bg-[var(--muted)]/80"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <h1 className="text-lg font-semibold text-[var(--foreground)]">站内消息</h1>
        </div>
        {list.some((n) => !n.readAt) && (
          <Button
            variant="ghost"
            size="sm"
            disabled={markingAll}
            onClick={async () => {
              if (!user) return
              setMarkingAll(true)
              try {
                await markAllNotificationsRead(user.userId)
                setList((prev) => prev.map((x) => ({ ...x, readAt: new Date().toISOString() })))
                toast.success("已全部标为已读")
              } catch {
                toast.error("操作失败")
              } finally {
                setMarkingAll(false)
              }
            }}
          >
            {markingAll ? "处理中…" : "一键已读"}
          </Button>
        )}
      </div>

      <div className="px-4 pt-6">
        {loading ? (
          <div className="glass-card p-6 text-center text-sm text-[var(--foreground-muted)]">
            加载中...
          </div>
        ) : list.length === 0 ? (
          <div className="glass-card p-8 text-center text-sm text-[var(--foreground-muted)]">
            <Bell className="mx-auto h-10 w-10 opacity-50" strokeWidth={1.5} />
            <p className="mt-2">暂无消息</p>
            <p className="mt-1 text-micro">任务分配等会在这里通知你</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {list.map((n) => (
              <li
                key={n.id}
                className={`glass-card p-4 ${n.readAt ? "opacity-75" : ""}`}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => handleMarkRead(n)}
                >
                  <p className="font-medium text-[var(--foreground)]">{n.title}</p>
                  {n.body && <p className="mt-1 text-sm text-[var(--foreground-muted)]">{n.body}</p>}
                  <p className="mt-1 text-micro text-[var(--foreground-muted)]">
                    {new Date(n.createdAt).toLocaleString("zh-CN")}
                    {n.readAt ? " · 已读" : ""}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
