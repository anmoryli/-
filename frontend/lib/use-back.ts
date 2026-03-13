import { useRouter } from "next/navigation"
import { useCallback } from "react"

/**
 * 返回上一级：优先使用浏览器历史后退，避免 Next 路由导致“随机跳到其他页”；
 * 若无历史则跳转到指定默认页。
 */
export function useBack(defaultPath: string = "/records") {
  const router = useRouter()
  return useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back()
    } else {
      router.push(defaultPath)
    }
  }, [router, defaultPath])
}
