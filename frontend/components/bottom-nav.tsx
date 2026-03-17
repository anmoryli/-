"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Home, BookOpen, MessageCircle, User, Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { getConversationHasUnread } from "@/lib/api/ai"

const baseNavItems = [
  { href: "/", label: "首页", icon: Home, match: (p: string) => p === "/" },
  { href: "/records", label: "记录", icon: BookOpen, match: (p: string) => p === "/records" || p.startsWith("/records/") },
  { href: "/community", label: "健康档案", icon: Heart, match: (p: string) => p === "/community" || p.startsWith("/community") },
  { href: "/chat", label: "孕期小伴", icon: MessageCircle, match: (p: string) => p === "/chat" || p.startsWith("/chat") },
  { href: "/profile", label: "我的", icon: User, match: (p: string) => p === "/profile" || p.startsWith("/profile/") },
]

export function BottomNav() {
  const pathname = usePathname() ?? ""
  const [chatHasUnread, setChatHasUnread] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user } = useAuth()

  const canUseChat = user && (user.userType === "pregnant" || user.isSpouse === true)
  useEffect(() => {
    if (!canUseChat || !user?.userId) return
    getConversationHasUnread(user.userId)
      .then(setChatHasUnread)
      .catch(() => setChatHasUnread(false))
  }, [canUseChat, user?.userId, pathname])

  useEffect(() => {
    const onRead = () => setChatHasUnread(false)
    window.addEventListener("chat-conversation-read", onRead)
    return () => window.removeEventListener("chat-conversation-read", onRead)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  if (pathname === "/admin" || pathname?.startsWith("/admin/")) return null

  const showCommunity = user?.userType === "pregnant"
  const navItems = baseNavItems
    .filter((i) => (i.href === "/chat" ? canUseChat : true))
    .filter((i) => (i.href === "/community" ? showCommunity : true))

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: "rgba(255, 255, 255, 0.4)",
        backdropFilter: "blur(24px) saturate(1.3)",
        WebkitBackdropFilter: "blur(24px) saturate(1.3)",
        borderTop: "1px solid rgba(255, 255, 255, 0.6)",
        boxShadow: "0 -4px 24px -6px rgba(180, 140, 160, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
      }}
    >
      <div
        className={cn(
          "mx-auto flex max-w-lg items-center justify-around transition-all duration-300",
          scrolled ? "px-1 py-1.5" : "px-1 py-2.5"
        )}
      >
        {navItems.map((item) => {
          const isActive = item.match(pathname)
          const Icon = item.icon
          const showUnread = item.href === "/chat" && chatHasUnread

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-[11px] font-medium transition-all duration-200",
                isActive
                  ? "text-[var(--accent-1)]"
                  : "text-[var(--foreground-muted)] active:text-[var(--foreground-secondary)]"
              )}
            >
              <span
                className={cn(
                  "relative flex items-center justify-center transition-all duration-200",
                  isActive && "scale-110"
                )}
                style={
                  isActive
                    ? {
                        filter: "drop-shadow(0 0 8px var(--accent-1-glow))",
                      }
                    : undefined
                }
              >
                <Icon
                  className={cn("h-5 w-5", scrolled && "h-4 w-4", isActive && "stroke-[2.25]")}
                  strokeWidth={isActive ? 2.25 : 1.75}
                />
                {showUnread && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[var(--critical)]" aria-label="未读" />
                )}
              </span>
              <span className={cn(isActive && "font-semibold", scrolled && "text-[10px]")}>{item.label}</span>
            </Link>
          )
        })}
      </div>
      <div className="h-safe-area-inset-bottom" />
    </nav>
  )
}
