import { Skeleton } from "@/components/ui/skeleton"

export default function ChatLoading() {
  return (
    <div className="min-h-dvh px-4 pt-4 pb-8">
      <div className="flex items-center justify-between py-3">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
      <div className="mt-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl p-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-3 w-10" />
          </div>
        ))}
      </div>
    </div>
  )
}
