"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getAdminArticle, updateArticle, type AdminArticle } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export default function AdminArticleEditPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const articleId = id ? parseInt(id, 10) : NaN

  const [article, setArticle] = useState<AdminArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState("")
  const [summary, setSummary] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [isPublished, setIsPublished] = useState(true)
  const [sortOrder, setSortOrder] = useState(0)
  const [audience, setAudience] = useState("all")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!Number.isFinite(articleId)) {
      setLoading(false)
      return
    }
    getAdminArticle(articleId)
      .then((a) => {
        setArticle(a)
        if (a) {
          setTitle(a.title ?? "")
          setSummary(a.summary ?? "")
          setContent(a.content ?? "")
          setCategory(a.category ?? "")
          setIsPublished(a.isPublished ?? true)
          setSortOrder(a.sortOrder ?? 0)
          setAudience(a.audience ?? "all")
        }
      })
      .catch(() => toast.error("加载失败"))
      .finally(() => setLoading(false))
  }, [articleId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!article || !title.trim()) {
      toast.error("请输入标题")
      return
    }
    setSaving(true)
    try {
      await updateArticle({
        articleId: article.articleId,
        title: title.trim(),
        summary: summary.trim() || undefined,
        content: content.trim() || undefined,
        category: category.trim() || undefined,
        isPublished,
        sortOrder,
        audience: audience || "all",
      })
      toast.success("文章已更新")
      router.push("/admin")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent-1)]/30 border-t-[var(--accent-1)]" />
      </div>
    )
  }
  if (!article) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[var(--background)] px-4">
        <p className="text-[var(--foreground-muted)]">文章不存在</p>
        <Button variant="outline" onClick={() => router.push("/admin")}>返回管理后台</Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--background)]">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-[var(--card-border)] bg-[var(--background)] px-4 py-4">
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--muted)]"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-[var(--foreground)]">编辑文章</h1>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden px-4 py-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-caption">标题</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="文章标题"
              className="mt-1 border-[var(--card-border)]"
              required
            />
          </div>
          <div>
            <Label htmlFor="summary" className="text-caption">摘要</Label>
            <Input
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="可选"
              className="mt-1 border-[var(--card-border)]"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <div>
              <Label htmlFor="category" className="text-caption">分类</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="如：产检,饮食"
                className="mt-1 w-40 border-[var(--card-border)]"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="pub"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="pub" className="text-caption">发布</Label>
            </div>
            <div>
              <Label htmlFor="audience" className="text-caption">受众</Label>
              <select
                id="audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="mt-1 rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm"
              >
                <option value="all">全部</option>
                <option value="pregnant">孕妇</option>
                <option value="spouse">配偶</option>
              </select>
            </div>
            <div>
              <Label htmlFor="order" className="text-caption">排序</Label>
              <Input
                id="order"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                className="mt-1 w-24 border-[var(--card-border)]"
              />
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-1 flex-col min-h-0">
          <Label htmlFor="content" className="text-caption">内容（Markdown）</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="在此输入正文，支持 Markdown…"
            className="mt-1 min-h-[60vh] flex-1 resize-y border-[var(--card-border)] font-mono text-sm"
            rows={24}
          />
        </div>
        <div className="mt-6 flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/admin")}>
            取消
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "保存中…" : "保存"}
          </Button>
        </div>
      </form>
    </div>
  )
}
