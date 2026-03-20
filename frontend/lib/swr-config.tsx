"use client"

import { SWRConfig } from "swr"
import type { ReactNode } from "react"

/**
 * SWR 加载策略：优先用缓存，避免重复请求
 * - 从二级页面返回时直接展示缓存，不再发请求
 * - 数据库有更新时通过 mutate() 主动失效缓存，下次访问会重新请求
 * - 不依赖 focus/mount 自动刷新，保证加载速度
 */
export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnMount: false,
        revalidateOnReconnect: true,
        dedupingInterval: 60000,
        errorRetryCount: 2,
        keepPreviousData: true,
      }}
    >
      {children}
    </SWRConfig>
  )
}
