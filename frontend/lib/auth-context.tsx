"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { User } from "@/lib/api/user"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  logout: () => void
  updateUser: (partial: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const USER_STORAGE_KEY = "yunqi_user"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY)
      if (stored) {
        setUserState(JSON.parse(stored))
      }
    } catch {
      // ignore parse error
    }
    setIsLoading(false)
  }, [])

  const setUser = useCallback((u: User | null) => {
    setUserState(u)
    if (u) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u))
    } else {
      localStorage.removeItem(USER_STORAGE_KEY)
    }
  }, [])

  const logout = useCallback(() => {
    setUserState(null)
    localStorage.removeItem(USER_STORAGE_KEY)
  }, [])

  const updateUser = useCallback((partial: Partial<User>) => {
    setUserState((prev) => {
      if (!prev) return prev
      const updated = { ...prev, ...partial }
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
