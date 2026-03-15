"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Trash2, ChevronRight, User } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { updateUserType } from "@/lib/api/user"
import { toast } from "sonner"
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

export default function SettingsPage() {
  const router = useRouter()
  const { user, setUser } = useAuth()
  const [updating, setUpdating] = useState(false)

  const handleUserTypeChange = async (newType: "pregnant" | "family_member") => {
    if (!user || user.userType === newType) return
    setUpdating(true)
    try {
      const updated = await updateUserType(user.userId, newType)
      setUser({ ...user, userType: updated.userType ?? newType })
      toast.success("身份已更新")
    } catch {
      toast.error("更新失败")
    } finally {
      setUpdating(false)
    }
  }

  const handleClearCache = () => {
    try {
      sessionStorage.clear()
      toast.success("缓存已清除")
    } catch {
      toast.success("缓存已清除")
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-background/95 px-4 py-4 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary transition-colors active:bg-secondary/80"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">通用设置</h1>
      </div>

      <div className="space-y-4 px-4 pb-8">
        {user && (
          <div>
            <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">
              身份
            </p>
            <div className="overflow-hidden rounded-2xl bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">身份切换</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      当前：{user.userType === "family_member" ? "家庭成员" : "孕妇本人"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-t border-border">
                <button
                  type="button"
                  onClick={() => handleUserTypeChange("pregnant")}
                  disabled={updating || user.userType === "pregnant"}
                  className={`flex-1 py-3 text-sm font-medium transition-colors disabled:opacity-50 ${
                    user.userType === "pregnant" ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  }`}
                >
                  孕妇本人
                </button>
                <button
                  type="button"
                  onClick={() => handleUserTypeChange("family_member")}
                  disabled={updating || user.userType === "family_member"}
                  className={`flex-1 py-3 text-sm font-medium transition-colors disabled:opacity-50 ${
                    user.userType === "family_member" ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  }`}
                >
                  家庭成员
                </button>
              </div>
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">
            存储
          </p>
          <div className="overflow-hidden rounded-2xl bg-card">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors active:bg-secondary">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      清除缓存
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      清除本地缓存数据，释放存储空间
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>清除缓存</AlertDialogTitle>
                  <AlertDialogDescription>
                    确定要清除本地缓存吗？这不会删除您的账号数据。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearCache}>
                    确认清除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Version Info */}
        <div className="pt-4 text-center">
          <p className="text-sm text-muted-foreground">孕期宝 v1.0.0</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Copyright 2024 孕期宝
          </p>
        </div>
      </div>
    </div>
  )
}
