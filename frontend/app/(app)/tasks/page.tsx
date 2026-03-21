"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useBack } from "@/lib/use-back"
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, Circle, ListTodo, Plus, Sparkles } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getMyTasks, getFamilyTasks, completeTask, createTask, suggestTasks, type FamilyTaskItem } from "@/lib/api/family-tasks"
import { getMyFamily, getFamilyMembers, type Family, type FamilyMember } from "@/lib/api/family"
import { remindNoSpouse } from "@/lib/api/notifications"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

export default function TasksPage() {
  const router = useRouter()
  const goBack = useBack("/")
  const { user } = useAuth()
  const [tasks, setTasks] = useState<FamilyTaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [completingId, setCompletingId] = useState<number | null>(null)
  const [isCreator, setIsCreator] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [family, setFamily] = useState<Family | null>(null)
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [customOpen, setCustomOpen] = useState(false)
  const [customTitle, setCustomTitle] = useState("")
  const [customDesc, setCustomDesc] = useState("")
  const [customAssignee, setCustomAssignee] = useState<number | null>(null)
  const [customSubmitting, setCustomSubmitting] = useState(false)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [suggestList, setSuggestList] = useState<Array<{ title: string; description: string }>>([])
  const [suggestSelected, setSuggestSelected] = useState<Set<number>>(new Set())
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [suggestSubmitting, setSuggestSubmitting] = useState(false)

  const loadTasks = () => {
    if (!user) return
    if (isCreator && family) {
      getFamilyTasks(family.familyId, user.userId).then((data) => setTasks(data || [])).catch(() => setTasks([]))
    } else {
      getMyTasks(user.userId).then((data) => setTasks(data || [])).catch(() => setTasks([]))
    }
  }

  useEffect(() => {
    if (!user) return
    if (user.userType !== "pregnant" && user.isSpouse !== true) {
      router.replace("/profile")
      return
    }
    setLoading(true)
    getMyFamily(user.userId)
      .then((f) => {
        setFamily(f ?? null)
        const creator = !!f && f.creatorUserId === user.userId
        setIsCreator(creator)
        if (f) getFamilyMembers(f.familyId, user.userId).then(setMembers).catch(() => setMembers([]))
        if (creator && f) return getFamilyTasks(f.familyId, user.userId)
        return getMyTasks(user.userId)
      })
      .then((data) => setTasks(Array.isArray(data) ? data : []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false))
  }, [user, router])

  if (!user) return null
  if (user.userType !== "pregnant" && user.isSpouse !== true) return null

  const handleComplete = async (taskId: number) => {
    setCompletingId(taskId)
    try {
      await completeTask(user.userId, taskId)
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "completed", completedAt: new Date().toISOString() } : t)))
      toast.success("完成得好～你的每一步都在给家庭加分，妈妈会感受到你的陪伴。")
    } catch {
      toast.error("操作失败")
    } finally {
      setCompletingId(null)
    }
  }

  const pendingList = tasks.filter((t) => t.status !== "completed")
  const completedList = tasks.filter((t) => t.status === "completed")

  return (
    <div className="min-h-dvh pb-8">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/40 px-4 py-4" style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(24px) saturate(1.3)", WebkitBackdropFilter: "blur(24px) saturate(1.3)" }}>
        <button
          onClick={() => goBack()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--muted)] transition-colors active:bg-[var(--muted)]/80"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <h1 className="text-lg font-semibold text-[var(--foreground)]">爸爸成长营</h1>
      </div>

      <div className="space-y-6 px-4 pt-6">
        <p className="text-sm text-[var(--foreground-muted)]">
          家庭任务与情感连接任务，完成即可打勾；孕妇可在「我们的小家」中为配偶生成本周小任务。
        </p>
        {isCreator && family && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setCustomTitle("")
                setCustomDesc("")
                const spouse = members.find((m) => m.isSpouse)
                setCustomAssignee(spouse?.userId ?? null)
                setCustomOpen(true)
                if (!spouse && user) {
                  toast.error("请先在家人共享中添加配偶")
                  remindNoSpouse(user.userId).catch(() => {})
                }
              }}
            >
              <Plus className="h-4 w-4" />
              自定义任务
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={async () => {
                setSuggestOpen(true)
                setSuggestList([])
                setSuggestSelected(new Set())
                setSuggestLoading(true)
                try {
                  const list = await suggestTasks(user.userId)
                  setSuggestList(list)
                } catch {
                  toast.error("AI 生成失败，请稍后重试")
                } finally {
                  setSuggestLoading(false)
                }
              }}
            >
              <Sparkles className="h-4 w-4" />
              AI 生成本周任务
            </Button>
          </div>
        )}
        {loading ? (
          <div className="glass-card p-6 text-center text-sm text-[var(--foreground-muted)]">
            加载中...
          </div>
        ) : pendingList.length === 0 && completedList.length === 0 ? (
          <div className="glass-card p-6 text-center text-sm text-[var(--foreground-muted)]">
            {isCreator ? "暂无分配的任务。添加后将显示在这里。" : "暂无任务。孕妇可在「我们的小家」中为配偶生成本周小任务。"}
          </div>
        ) : (
          <>
            {pendingList.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
                  <ListTodo className="h-4 w-4" strokeWidth={1.75} />
                  待完成
                </h2>
                <div className="space-y-2">
                  {pendingList.map((t) => {
                    const isExpanded = expandedId === t.id
                    const hasDetail = !!t.description
                    return (
                      <div
                        key={t.id}
                        className="glass-card overflow-hidden"
                      >
                        <div className="flex items-start gap-3 p-4">
                          {t.assigneeUserId === user.userId ? (
                            <button
                              type="button"
                              onClick={() => handleComplete(t.id)}
                              disabled={completingId === t.id}
                              className="mt-0.5 shrink-0 text-[var(--foreground-muted)] hover:text-[var(--accent-1)]"
                            >
                              <Circle className="h-5 w-5" strokeWidth={1.75} />
                            </button>
                          ) : (
                            <span className="mt-0.5 shrink-0 text-[var(--foreground-muted)]" aria-hidden><Circle className="h-5 w-5" strokeWidth={1.75} /></span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-[var(--foreground)]">{t.title}</p>
                            {t.description && (
                              <p className={isExpanded ? "mt-1 text-sm text-[var(--foreground-muted)]" : "mt-1 line-clamp-2 text-sm text-[var(--foreground-muted)]"}>
                                {t.description}
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {t.taskType === "emotion" && (
                                <span className="inline-block rounded bg-[var(--accent-2-muted)] px-2 py-0.5 text-xs text-[var(--accent-2)]">
                                  情感任务
                                </span>
                              )}
                              {hasDetail && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedId(isExpanded ? null : t.id)}
                                  className="flex items-center gap-0.5 text-xs text-[var(--accent-1)]"
                                >
                                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                  {isExpanded ? "收起" : "查看详情"}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
            {completedList.length > 0 && (
              <section>
                <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
                  已完成
                </h2>
                <div className="space-y-2">
                  {completedList.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 glass-card p-4 opacity-80"
                    >
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--accent-1)]" strokeWidth={1.75} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[var(--foreground)] line-through">{t.title}</p>
                        {t.completedAt && (
                          <p className="text-micro text-[var(--foreground-muted)]">
                            {new Date(t.completedAt).toLocaleDateString("zh-CN")} 完成
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* 自定义任务弹窗 */}
        <Dialog open={customOpen} onOpenChange={setCustomOpen}>
          <DialogContent className="border-[var(--card-border)] bg-[var(--card-solid)] max-w-sm">
            <DialogHeader>
              <DialogTitle>自定义任务</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>执行人（配偶）</Label>
                <select
                  className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--muted)] px-3 py-2 text-sm"
                  value={customAssignee ?? ""}
                  onChange={(e) => setCustomAssignee(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">{members.some((m) => m.isSpouse) ? "请选择配偶" : "暂无配偶，请先在我们的小家中添加"}</option>
                  {members.filter((m) => m.isSpouse).map((m) => (
                    <option key={m.userId} value={m.userId}>{m.username}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>标题</Label>
                <Input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="任务标题"
                  className="mt-1 border-[var(--card-border)]"
                />
              </div>
              <div>
                <Label>描述（选填）</Label>
                <textarea
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="任务说明"
                  className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--muted)] px-3 py-2 text-sm min-h-[80px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCustomOpen(false)}>取消</Button>
              <Button
                disabled={!customTitle.trim() || !customAssignee || !family || customSubmitting}
                onClick={async () => {
                  if (!family || !customAssignee || !customTitle.trim() || !user) return
                  setCustomSubmitting(true)
                  try {
                    await createTask(user.userId, family.familyId, customAssignee, customTitle.trim(), customDesc.trim() || undefined)
                    loadTasks()
                    setCustomOpen(false)
                    toast.success("任务已添加")
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "添加失败")
                  } finally {
                    setCustomSubmitting(false)
                  }
                }}
              >
                {customSubmitting ? "添加中…" : "添加"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AI 建议任务弹窗 */}
        <Dialog open={suggestOpen} onOpenChange={setSuggestOpen}>
          <DialogContent className="border-[var(--card-border)] bg-[var(--card-solid)] max-w-sm max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>AI 生成本周任务建议</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto py-2">
              {suggestLoading ? (
                <p className="text-sm text-[var(--foreground-muted)]">生成中…</p>
              ) : suggestList.length === 0 ? (
                <p className="text-sm text-[var(--foreground-muted)]">暂无建议</p>
              ) : (
                <div className="space-y-2">
                  {suggestList.map((item, i) => (
                    <label
                      key={i}
                      className="flex cursor-pointer items-start gap-3 glass-card p-4 transition-colors hover:bg-[var(--muted)]/30"
                    >
                      <span className="mt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={suggestSelected.has(i)}
                          onChange={(e) => {
                            setSuggestSelected((prev) => {
                              const next = new Set(prev)
                              if (e.target.checked) next.add(i)
                              else next.delete(i)
                              return next
                            })
                          }}
                          className="h-5 w-5 rounded border-[var(--card-border)] text-[var(--accent-1)]"
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[var(--foreground)]">{item.title}</p>
                        {item.description && (
                          <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">{item.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSuggestOpen(false)}>关闭</Button>
              <Button
                disabled={suggestSelected.size === 0 || !family || suggestSubmitting}
                onClick={async () => {
                  const spouse = members.find((m) => m.isSpouse)
                  if (!family || !spouse || !user) {
                    toast.error("请先在家人共享中添加配偶")
                    return
                  }
                  setSuggestSubmitting(true)
                  try {
                    for (const i of suggestSelected) {
                      const item = suggestList[i]
                      if (item?.title) await createTask(user.userId, family.familyId, spouse.userId, item.title, item.description || undefined)
                    }
                    loadTasks()
                    setSuggestOpen(false)
                    toast.success(`已添加 ${suggestSelected.size} 条任务`)
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "添加失败")
                  } finally {
                    setSuggestSubmitting(false)
                  }
                }}
              >
                {suggestSubmitting ? "添加中…" : `添加选中（${suggestSelected.size}）`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
