"use client"

import { useState, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import { Download, X } from "lucide-react"
import { cn } from "@/lib/utils"

/** 判断是否为图片 URL（用于 RAG 返回的链接：图片渲染为 img，文件渲染为可点击文字链接） */
function isImageUrl(url: string): boolean {
  if (!url?.trim()) return false
  const u = url.split("?")[0].toLowerCase()
  return /\.(jpe?g|png|gif|webp|bmp|svg)(\?|$)/i.test(u) || /\/photo\/|\.(jpg|jpeg|png|gif|webp)/i.test(u)
}

/** 将内容中的裸图片 URL 转为 Markdown 图片语法；支持 [URL] 前缀、裸链、无扩展名 OSS */
function ensureImageUrlsAsMarkdown(text: string): string {
  if (!text?.trim()) return text
  let out = text
  // 1) RAG 常见格式：[URL] https://... 或 【URL】https://...
  out = out.replace(/(?:\[URL\]|【URL】|\[url\])\s*(https?:\/\/\S+)/gi, (_, url: string) => {
    const u = url.replace(/[.,;:)]+$/, "")
    return `![图片](${u})`
  })
  // 2) 带扩展名的裸图片 URL
  const extRe = /(https?:\/\/[^\s<>\]\)"']+\.(?:jpe?g|png|gif|webp|bmp|svg)(?:\?[^\s<>\]\)"']*)?)/gi
  out = out.replace(extRe, (match, _p1: string, offset: number) => {
    const before = out.substring(0, offset)
    if (before.endsWith("](")) return match
    return `![图片](${match})`
  })
  // 3) OSS/路径中含 photo 的 URL（可能无扩展名）
  const ossRe = /(https?:\/\/[^\s<>\]\)"']*\/photo\/[^\s<>\]\)"']+)/g
  out = out.replace(ossRe, (match, _p1: string, offset: number) => {
    const before = out.substring(0, offset)
    if (before.endsWith("](")) return match
    return `![图片](${match})`
  })
  return out
}

const markdownStyles = [
  "markdown-body break-words [&_*]:break-words",
  "[&_p]:leading-[1.65] [&_p]:mb-2 [&_p]:whitespace-pre-wrap",
  "[&_h1]:block [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:mt-4 [&_h1]:mb-2",
  "[&_h2]:block [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1.5",
  "[&_h3]:block [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-2.5 [&_h3]:mb-1",
  "[&_h4]:block [&_h4]:text-[15px] [&_h4]:font-semibold [&_h4]:mt-2 [&_h4]:mb-1",
  "[&_h5]:block [&_h5]:text-sm [&_h5]:font-semibold [&_h5]:mt-1.5 [&_h5]:mb-0.5",
  "[&_h6]:block [&_h6]:text-sm [&_h6]:font-medium [&_h6]:mt-1 [&_h6]:mb-0.5",
  "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5",
  "[&_a]:text-[var(--accent-1)] [&_a]:underline",
  "[&_pre]:bg-[var(--muted)] [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap",
  "[&_code]:bg-[var(--muted)] [&_code]:px-1 [&_code]:rounded [&_code]:break-all",
  "[&_blockquote]:border-l-4 [&_blockquote]:border-[var(--accent-1)] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[var(--foreground-muted)]",
  "[&_img]:rounded-lg [&_img]:max-w-full [&_img]:max-h-[360px] [&_img]:w-full [&_img]:object-contain [&_img]:mx-auto",
  "[&_br]:block",
].join(" ")

export function MarkdownView({
  content,
  className,
  /** 流式结束后传入不同值，强制重新挂载以正确渲染完整 Markdown */
  stableKey,
}: {
  content: string
  className?: string
  stableKey?: string
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleSaveImage = useCallback(async (url: string) => {
    try {
      const res = await fetch(url, { mode: "cors" })
      const blob = await res.blob()
      const ext = url.includes(".png") ? "png" : url.includes(".webp") ? "webp" : "jpg"
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = `AI生成图_${Date.now()}.${ext}`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {
      window.open(url, "_blank")
    }
  }, [])

  if (!content?.trim()) return null
  const normalizedContent = ensureImageUrlsAsMarkdown(content)
  return (
    <div key={stableKey} className={cn(markdownStyles, "text-[var(--foreground)]", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: ({ href, children, ...props }) => {
            const url = (href ?? "").trim()
            if (!url) return <span {...props}>{children}</span>
            if (isImageUrl(url)) {
              return (
                <span className="block my-2">
                  <button
                    type="button"
                    onClick={() => setPreviewUrl(url)}
                    className="block cursor-zoom-in text-left"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={typeof children === "string" ? children : "图片"}
                      className="rounded-lg max-w-full max-h-[360px] w-auto h-auto object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                </span>
              )
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent-1)] underline break-all"
                {...props}
              >
                {children ?? url}
              </a>
            )
          },
          img: ({ src, alt: altText }) => {
            const safeSrc = typeof src === "string" && src.trim() ? src : null
            if (!safeSrc) return null
            return (
              <span className="block my-2">
                <button
                  type="button"
                  onClick={() => setPreviewUrl(safeSrc)}
                  className="block cursor-zoom-in text-left"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={safeSrc}
                    alt={altText ?? ""}
                    className="rounded-lg max-w-full max-h-[360px] w-auto h-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                </button>
              </span>
            )
          },
        }}
      >
        {normalizedContent}
      </ReactMarkdown>

      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="图片预览"
        >
          <div className="relative max-h-[90vh] max-w-[95vw]" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="预览" className="max-h-[85vh] max-w-full rounded-lg object-contain" referrerPolicy="no-referrer" />
            <div className="mt-3 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => handleSaveImage(previewUrl)}
                className="flex items-center gap-2 rounded-xl bg-[var(--accent-1)] px-4 py-2 text-sm font-medium text-white"
              >
                <Download className="h-4 w-4" /> 保存图片
              </button>
              <button
                type="button"
                onClick={() => setPreviewUrl(null)}
                className="flex items-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 text-sm"
              >
                <X className="h-4 w-4" /> 关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
