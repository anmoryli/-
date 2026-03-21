import { useCallback, useEffect, useRef, useState } from "react"

interface UseInfiniteScrollOptions<T> {
  fetchPage: (page: number, pageSize: number) => Promise<T[]>
  pageSize?: number
}

export function useInfiniteScroll<T>({ fetchPage, pageSize = 20 }: UseInfiniteScrollOptions<T>) {
  const [items, setItems] = useState<T[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const loadPage = useCallback(
    async (p: number) => {
      if (loading) return
      setLoading(true)
      try {
        const data = await fetchPage(p, pageSize)
        if (!data || data.length < pageSize) setHasMore(false)
        setItems((prev) => (p === 1 ? data : [...prev, ...data]))
        setPage(p)
      } catch {
        setHasMore(false)
      } finally {
        setLoading(false)
        setInitialLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchPage, pageSize]
  )

  useEffect(() => {
    loadPage(1)
  }, [loadPage])

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading) {
          loadPage(page + 1)
        }
      },
      { rootMargin: "200px" }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, page, loadPage])

  const reset = useCallback(() => {
    setItems([])
    setPage(1)
    setHasMore(true)
    setInitialLoading(true)
    loadPage(1)
  }, [loadPage])

  return { items, loading, initialLoading, hasMore, sentinelRef, reset }
}
