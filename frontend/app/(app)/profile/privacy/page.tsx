"use client"

import { useState, useEffect } from "react"
import { useBack } from "@/lib/use-back"
import { ArrowLeft, Database } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import {
  getCommunityEnabled,
  getDataCollectionEnabled,
  updateCommunityEnabled,
  updateDataCollectionEnabled,
} from "@/lib/api/user"

export default function PrivacyPage() {
  const goBack = useBack("/profile")
  const { user } = useAuth()
  const [dataCollection, setDataCollection] = useState(false)
  const [communityEnabled, setCommunityEnabled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.userId) {
      setLoading(false)
      return
    }
    Promise.all([
      getDataCollectionEnabled(user.userId).catch(() => false),
      getCommunityEnabled(user.userId).catch(() => false),
    ])
      .then(([dc, ce]) => {
        setDataCollection(dc ?? false)
        setCommunityEnabled(ce ?? false)
      })
      .finally(() => setLoading(false))
  }, [user?.userId])

  const toggleDataCollection = async (enabled: boolean) => {
    if (!user?.userId) return
    setDataCollection(enabled)
    try {
      await updateDataCollectionEnabled(user.userId, enabled)
      toast.success("设置已更新")
    } catch {
      setDataCollection(!enabled)
      toast.error("保存失败，请重试")
    }
  }

  const toggleCommunityEnabled = async (enabled: boolean) => {
    if (!user?.userId) return
    setCommunityEnabled(enabled)
    try {
      await updateCommunityEnabled(user.userId, enabled)
      toast.success("设置已更新")
    } catch {
      setCommunityEnabled(!enabled)
      toast.error("保存失败，请重试")
    }
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
        <h1 className="text-lg font-semibold">隐私设置</h1>
      </div>

      <div className="px-4 pb-8">
        {!loading && (
          <div className="mb-4 overflow-hidden rounded-2xl bg-card">
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-1/10 text-chart-1">
                <Database className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">社区功能</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  默认关闭。开启后才会显示“社区”内容（健康档案不受影响）
                </p>
              </div>
              <Switch checked={communityEnabled} onCheckedChange={toggleCommunityEnabled} />
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl bg-card">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-3/10 text-chart-3">
              <Database className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">数据收集</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                允许收集匿名使用数据以改进服务体验
              </p>
            </div>
            <Switch
              checked={dataCollection}
              onCheckedChange={toggleDataCollection}
            />
          </div>
        </div>

        {/* Tips */}
        <p className="mt-4 px-2 text-xs text-muted-foreground">
          我们重视您的隐私。您的数据将按照我们的隐私政策进行处理和保护。
        </p>
      </div>
    </div>
  )
}
