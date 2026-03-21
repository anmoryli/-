import { Skeleton } from "@/components/ui/skeleton"

export default function RecordsLoading() {
  return (
    <div className="min-h-dvh px-6 pt-14 pb-8">
      <div className="flex items-center justify-between py-4">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-10 w-full rounded-xl" />
      <Skeleton className="mt-4 h-10 w-full rounded-xl" />
      <div className="mt-8 space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
