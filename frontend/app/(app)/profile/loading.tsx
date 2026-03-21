import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileLoading() {
  return (
    <div className="px-6 pt-14 pb-8">
      <div className="rounded-lg p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>
      <div className="mt-6 rounded-lg">
        <div className="flex">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2 py-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 space-y-1 rounded-lg overflow-hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3.5">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-4 w-4" />
          </div>
        ))}
      </div>
    </div>
  )
}
