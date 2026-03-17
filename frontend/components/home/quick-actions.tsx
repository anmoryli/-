"use client"

import Link from "next/link"
import { PenLine, Camera, Mic, FileText, Mail, Lightbulb, Clock, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const familyActions = [
  {
    label: "我们的小家",
    icon: Users,
    href: "/family",
    className: "border-[var(--accent-1)]/40 bg-[var(--accent-1-muted)] text-[var(--accent-1)]",
  },
]

const actions = [
  {
    label: "写日记",
    icon: PenLine,
    href: "/records/new?type=text",
    className: "border-[var(--accent-1)]/40 bg-[var(--accent-1-muted)] text-[var(--accent-1)]",
  },
  {
    label: "拍照片",
    icon: Camera,
    href: "/records/new?type=photo",
    className: "border-[var(--accent-3)]/40 bg-[var(--accent-3-muted)] text-[var(--accent-3)]",
  },
  {
    label: "录语音",
    icon: Mic,
    href: "/records/new?type=voice",
    className: "border-[var(--accent-2)]/40 bg-[var(--accent-2-muted)] text-[var(--accent-2)]",
  },
  {
    label: "上传文件",
    icon: FileText,
    href: "/records/new?type=file",
    className: "border-[var(--foreground-muted)]/40 bg-[var(--muted)] text-[var(--foreground-secondary)]",
  },
  {
    label: "写信给宝宝",
    icon: Mail,
    href: "/records/new?type=text&tag=letter_to_baby",
    className: "border-[var(--accent-1)]/40 bg-[var(--accent-1-muted)] text-[var(--accent-1)]",
  },
  {
    label: "记录灵感",
    icon: Lightbulb,
    href: "/chat?q=今天有什么值得记录的",
    className: "border-[var(--accent-2)]/40 bg-[var(--accent-2-muted)] text-[var(--accent-2)]",
  },
  {
    label: "给未来的自己",
    icon: Clock,
    href: "/records/new?type=text&tag=letter_to_future",
    className: "border-[var(--accent-3)]/40 bg-[var(--accent-3-muted)] text-[var(--accent-3)]",
  },
]

export function QuickActions({ isPregnant = true }: { isPregnant?: boolean }) {
  const displayActions = isPregnant ? actions : familyActions
  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-4">
      {displayActions.map((action) => {
        const Icon = action.icon
        return (
          <Link
            key={action.label}
            href={action.href}
            className="flex flex-col items-center gap-2.5 transition-transform active:scale-[0.97]"
          >
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-2xl border transition-all active:scale-95",
                action.className
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <span className="text-[13px] font-medium text-[var(--foreground)]">
              {action.label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
