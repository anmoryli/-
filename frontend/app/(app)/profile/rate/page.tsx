"use client"

import { useState } from "react"
import { useBack } from "@/lib/use-back"
import { ArrowLeft, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { apiPost } from "@/lib/api"

export default function RatePage() {
  const goBack = useBack("/profile")
  const { user } = useAuth()

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)

  const ratingLabels = ["", "很差", "较差", "一般", "满意", "非常满意"]

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("请先选择评分")
      return
    }

    setSending(true)
    try {
      const content = [
        `评分：${rating} 星（${ratingLabels[rating] || ""}）`,
        feedback.trim() ? `\n还有什么想说的：\n${feedback.trim()}` : "",
      ].join("")
      await apiPost<void>("/api/feedback/send", {
        subject: "孕期宝 - 评分反馈",
        content: content || "（用户未填写）",
        userId: user?.userId,
      })
      setSubmitted(true)
      toast.success("感谢您的评价！")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "提交失败，请稍后重试")
    } finally {
      setSending(false)
    }
  }

  if (submitted) {
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
          <h1 className="text-lg font-semibold">给我们评分</h1>
        </div>

        <div className="flex flex-col items-center justify-center px-4 py-20">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Star className="h-10 w-10 fill-primary text-primary" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-foreground">
            感谢您的评价
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            您的反馈对我们非常重要，我们会继续努力为您提供更好的服务
          </p>
          <Button
            variant="outline"
            onClick={goBack}
            className="mt-8"
          >
            返回
          </Button>
        </div>
      </div>
    )
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
        <h1 className="text-lg font-semibold">给我们评分</h1>
      </div>

      <div className="px-4 pb-8">
        {/* Rating Stars */}
        <div className="rounded-2xl bg-card p-6">
          <p className="text-center text-base font-medium text-foreground">
            您对「孕期宝」的整体体验如何？
          </p>

          {/* Stars */}
          <div className="mt-6 flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform active:scale-90"
              >
                <Star
                  className={`h-10 w-10 transition-colors ${
                    star <= (hoverRating || rating)
                      ? "fill-primary text-primary"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Rating Label */}
          <p className="mt-3 text-center text-sm font-medium text-primary">
            {ratingLabels[hoverRating || rating] || "点击星星评分"}
          </p>
        </div>

        {/* Feedback */}
        <div className="mt-4 rounded-2xl bg-card p-4">
          <p className="mb-3 text-sm font-medium text-foreground">
            还有什么想对我们说的？（选填）
          </p>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="请输入您的意见和建议..."
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Submit Button */}
        <Button onClick={handleSubmit} className="mt-6 w-full" size="lg" disabled={sending}>
          {sending ? "提交中…" : "提交评价"}
        </Button>

        {/* Note */}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          您的评价将帮助我们改进产品体验
        </p>
      </div>
    </div>
  )
}
