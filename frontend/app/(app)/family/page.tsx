"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Users, Copy, UserPlus, LogOut, Trash2, Pencil } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  createFamily,
  getMyFamily,
  getFamilyMembers,
  leaveFamily,
  dissolveFamily,
  updateMemberRelationship,
  type Family,
  type FamilyMember,
} from "@/lib/api/family"
import { getById } from "@/lib/api/user"
import { generateTasksForWeek } from "@/lib/api/family-tasks"
import { toast } from "sonner"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function RelationshipEditDialog({
  member,
  familyId,
  userId,
  onClose,
  onSaved,
  updateMemberRelationship,
  toast,
}: {
  member: FamilyMember
  familyId: number
  userId: number
  onClose: () => void
  onSaved: () => void
  updateMemberRelationship: (familyId: number, memberId: number, relationship: string, userId: number) => Promise<void>
  toast: { success: (m: string) => void; error: (m: string) => void }
}) {
  const [relationship, setRelationship] = useState(member.relationship ?? "")
  const [saving, setSaving] = useState(false)
  const memberId = member.memberId!

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateMemberRelationship(familyId, memberId, relationship.trim(), userId)
      onSaved()
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "更新失败")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-[var(--card-border)] bg-[var(--card)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[var(--foreground)]">编辑关系</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="rel-edit" className="text-caption">与孕妇关系</Label>
            <Input
              id="rel-edit"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="如：配偶、婆婆、妈妈"
              className="mt-1 border-[var(--card-border)]"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
            <Button type="submit" disabled={saving}>{saving ? "保存中..." : "保存"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function FamilyPage() {
  const router = useRouter()
  const { user, setUser } = useAuth()
  const [family, setFamily] = useState<Family | null>(null)
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [dissolving, setDissolving] = useState(false)
  const [generatingTasks, setGeneratingTasks] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)

  const load = useCallback(async (showLoading = true) => {
    if (!user) return
    if (showLoading) setLoading(true)
    try {
      const f = await getMyFamily(user.userId)
      setFamily(f ?? null)
      if (f) {
        const m = await getFamilyMembers(f.familyId, user.userId)
        setMembers(m)
        if (showLoading) {
          setTimeout(() => {
            getById(user.userId)
              .then((u) => {
                if (u.isSpouse !== user?.isSpouse) setUser(u)
              })
              .catch(() => {})
          }, 400)
        } else {
          getById(user.userId)
            .then((u) => {
              if (u.isSpouse !== user?.isSpouse) setUser(u)
            })
            .catch(() => {})
        }
      } else {
        setMembers([])
      }
    } catch {
      setFamily(null)
      setMembers([])
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [user, setUser])

  useEffect(() => {
    load(true)
  }, [load])

  // 家庭成员列表实时更新：有家庭时每 5 秒静默轮询（不触发 loading，避免页面抖动）
  useEffect(() => {
    if (!family || !user) return
    const interval = setInterval(() => load(false), 5000)
    return () => clearInterval(interval)
  }, [family, user, load])

  const handleCreate = async () => {
    if (!user) return
    setCreating(true)
    try {
      const data = await createFamily(user.userId)
      setFamily({
        familyId: data.familyId,
        creatorUserId: user.userId,
        inviteCode: data.inviteCode,
        inviteExpiresAt: data.expiresAt,
      })
      await load()
      toast.success("家庭已创建")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "创建失败")
    } finally {
      setCreating(false)
    }
  }

  const copyCode = () => {
    if (family?.inviteCode) {
      navigator.clipboard.writeText(family.inviteCode)
      toast.success("邀请码已复制")
    }
  }

  const handleLeave = async () => {
    if (!user) return
    setLeaving(true)
    try {
      await leaveFamily(user.userId)
      setFamily(null)
      setMembers([])
      toast.success("已退出家庭")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "退出失败")
    } finally {
      setLeaving(false)
    }
  }

  const handleDissolve = async () => {
    if (!user) return
    setDissolving(true)
    try {
      await dissolveFamily(user.userId)
      setFamily(null)
      setMembers([])
      toast.success("家庭已解散")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "解散失败")
    } finally {
      setDissolving(false)
    }
  }

  const handleGenerateTasks = async () => {
    if (!user) return
    setGeneratingTasks(true)
    try {
      const created = await generateTasksForWeek(user.userId)
      toast.success(created.length > 0 ? `已为配偶生成 ${created.length} 个本周任务，已发送站内消息与邮件提醒` : "暂无配偶，无法生成任务")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "生成失败")
    } finally {
      setGeneratingTasks(false)
    }
  }

  const fallbackRole = family?.creatorUserId === user?.userId ? "creator" : "member"
  const myRole = members.find((m) => m.userId === user?.userId)?.role ?? fallbackRole
  const isCreator = myRole === "creator"

  if (!user) return null

  return (
    <div className="min-h-dvh bg-[var(--background)] pb-8">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-[var(--card-border)] bg-[var(--background)]/95 px-4 py-4 backdrop-blur-sm">
        <button
          onClick={() => router.push("/profile")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--muted)] transition-colors active:bg-[var(--muted)]/80"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <h1 className="text-lg font-semibold text-[var(--foreground)]">家人共享</h1>
      </div>

      <div className="space-y-6 px-4 pt-6">
        {loading ? (
          <div className="rounded-2xl bg-[var(--card)] p-8 text-center text-[var(--foreground-muted)]">
            加载中...
          </div>
        ) : !family ? (
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-8 text-center">
            <Users className="mx-auto h-14 w-14 text-[var(--accent-1)]" strokeWidth={1.5} />
            <p className="mt-4 text-[15px] font-medium text-[var(--foreground)]">
              创建家庭，邀请家人一起见证孕期时光
            </p>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">
              家人可通过邀请码加入，查看并互动您的共享记录
            </p>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-1)] px-6 py-4 text-[15px] font-semibold text-white transition-opacity active:opacity-90 disabled:opacity-60"
            >
              {creating ? "创建中..." : "创建家庭"}
            </button>
            <button
              onClick={() => router.push("/family/join")}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--accent-1)]/50 bg-[var(--accent-1-muted)] px-6 py-3 text-[14px] font-medium text-[var(--accent-1)]"
            >
              <UserPlus className="h-4 w-4" strokeWidth={1.75} />
              我有邀请码，直接加入
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold text-[var(--foreground)]">
                <Copy className="h-4 w-4" strokeWidth={1.75} />
                邀请码
              </h2>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-[var(--muted)] px-4 py-4">
                <span className="font-mono text-2xl font-bold tracking-widest text-[var(--accent-1)]">
                  {family.inviteCode}
                </span>
                <button
                  onClick={copyCode}
                  className="rounded-lg border border-[var(--accent-1)]/50 bg-[var(--accent-1-muted)] px-4 py-2 text-sm font-medium text-[var(--accent-1)]"
                >
                  复制
                </button>
              </div>
              {isCreator && (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-[var(--accent-2)] text-[var(--accent-2)]"
                    onClick={handleGenerateTasks}
                    disabled={generatingTasks}
                  >
                    {generatingTasks ? "生成中..." : "生成本周任务（推送给配偶）"}
                  </Button>
                </div>
              )}
              <p className="mt-2 text-xs text-[var(--foreground-muted)]">
                有效期至 {format(new Date(family.inviteExpiresAt), "yyyy年M月d日", { locale: zhCN })}
              </p>
            </div>

            {myRole && (
              <p className="mb-2 text-sm text-[var(--foreground-muted)]">
                你的身份：{myRole === "creator" ? "创建者" : "家庭成员"}
              </p>
            )}

            <div className="overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card)]">
              <div className="flex items-center gap-3 border-b border-[var(--card-border)] px-4 py-4">
                <Users className="h-5 w-5 text-[var(--accent-1)]" strokeWidth={1.75} />
                <h2 className="text-[15px] font-semibold text-[var(--foreground)]">家庭成员</h2>
              </div>
              <div className="divide-y divide-[var(--card-border)]">
                {members.length === 0 && (
                  <div className="px-4 py-6 text-sm text-[var(--foreground-muted)]">
                    暂无成员数据，请稍后自动刷新
                  </div>
                )}
                {members.map((m) => (
                  <div key={m.userId} className="flex items-center gap-3 px-4 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-1-muted)] text-[var(--accent-1)]">
                      {m.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[var(--foreground)]">{m.username}</p>
                        <span className="rounded-full bg-[var(--accent-1-muted)] px-2 py-0.5 text-xs text-[var(--accent-1)]">
                          {m.role === "creator" ? "创建者" : m.relationship || "成员"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                        {m.relationship && `${m.relationship} · `}
                        {m.joinedAt ? format(new Date(m.joinedAt), "M月d日加入", { locale: zhCN }) : ""}
                      </p>
                    </div>
                    {isCreator && m.role !== "creator" && m.memberId && (
                      <button
                        onClick={() => setEditingMember(m)}
                        className="flex items-center gap-1.5 rounded-lg border border-[var(--card-border)] px-3 py-2 text-sm text-[var(--foreground-muted)] hover:bg-[var(--muted)]"
                        aria-label="编辑角色"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={1.75} />
                        编辑角色
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => router.push("/family/join")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--accent-1)]/50 bg-[var(--accent-1-muted)] px-6 py-3 text-[14px] font-medium text-[var(--accent-1)]"
            >
              <UserPlus className="h-4 w-4" strokeWidth={1.75} />
              通过邀请码加入其他家庭
            </button>

            {!isCreator && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    disabled={leaving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--critical)]/50 bg-[var(--critical-muted)] px-6 py-3 text-[14px] font-medium text-[var(--critical)]"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={1.75} />
                    退出家庭
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-[var(--card-border)]">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-[var(--foreground)]">退出家庭</AlertDialogTitle>
                    <AlertDialogDescription className="text-[var(--foreground-muted)]">
                      退出后将无法查看家人的共享记录，如需重新加入需使用邀请码。确定要退出吗？
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleLeave}
                      className="bg-[var(--critical)] text-white hover:opacity-90"
                    >
                      确认退出
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {editingMember && family && user && editingMember.memberId && (
              <RelationshipEditDialog
                member={editingMember}
                familyId={family.familyId}
                userId={user.userId}
                onClose={() => setEditingMember(null)}
                onSaved={() => {
                  load()
                  setEditingMember(null)
                  if (editingMember?.userId === user?.userId) {
                    getById(user.userId).then((u) => {
                      setUser(u)
                      toast.success("关系已更新，已刷新你的权限（配偶可使用记录助手）")
                    }).catch(() => { toast.success("关系已更新") })
                  } else {
                    toast.success("关系已更新")
                  }
                }}
                updateMemberRelationship={updateMemberRelationship}
                toast={toast}
              />
            )}

            {isCreator && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    disabled={dissolving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--critical)]/50 bg-[var(--critical-muted)] px-6 py-3 text-[14px] font-medium text-[var(--critical)]"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    解散家庭
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-[var(--card-border)]">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-[var(--foreground)]">解散家庭</AlertDialogTitle>
                    <AlertDialogDescription className="text-[var(--foreground-muted)]">
                      解散后所有成员将退出该家庭，邀请码失效。该操作不可恢复，确定继续吗？
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDissolve}
                      className="bg-[var(--critical)] text-white hover:opacity-90"
                    >
                      确认解散
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </>
        )}
      </div>
    </div>
  )
}
