"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { AuthProvider, useAuth } from "@/lib/auth-context"

export function triggerMotionFast() {
  // no-op after removing gradient animation
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/welcome")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--background)]">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent-1)]/30 border-t-[var(--accent-1)]"
        />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-[var(--background)]">
      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  )
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <AuthGuard>{children}</AuthGuard>
    </AuthProvider>
  )
}
