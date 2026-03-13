"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Mail, MessageSquare, Send } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

const SUPPORT_EMAIL = "support@yunqibao.com"

export default function ContactPage() {
  const router = useRouter()
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL)
    toast.success("邮箱已复制到剪贴板")
  }

  const handleMailto = () => {
    const body = content ? `\n\n---\n${content}` : ""
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject || "孕期宝 - 用户咨询")}${body ? `&body=${encodeURIComponent(body)}` : ""}`
    window.location.href = url
    toast.success("即将打开邮件客户端")
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-background/95 px-4 py-4 backdrop-blur-sm">
        <button
          onClick={() => router.push("/profile")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary transition-colors active:bg-secondary/80"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">联系客服</h1>
      </div>

      <div className="space-y-6 px-4 pb-8">
        <div className="rounded-2xl bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">客服邮箱</p>
              <p className="mt-0.5 text-base text-muted-foreground">{SUPPORT_EMAIL}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyEmail} className="ml-auto">
              复制
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">发送邮件咨询</p>
          <div>
            <Label htmlFor="subject">主题</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="简要描述您的问题"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="content">内容（可选）</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请详细描述您遇到的问题或建议…"
              className="mt-2 min-h-[120px]"
            />
          </div>
          <Button onClick={handleMailto} className="w-full">
            <Send className="mr-2 h-4 w-4" />
            打开邮件客户端
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          我们通常在 1-2 个工作日内回复。如有紧急问题，请直接发送邮件至上述地址。
        </p>
      </div>
    </div>
  )
}
