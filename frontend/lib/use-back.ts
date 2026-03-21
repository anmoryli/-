import { useRouter } from "next/navigation"
import { useCallback } from "react"

export function useBack(defaultPath: string) {
  const router = useRouter()
  return useCallback(() => {
    router.push(defaultPath)
  }, [router, defaultPath])
}
