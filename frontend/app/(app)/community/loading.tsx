import { Skeleton } from "@/components/ui/skeleton"

export default function CommunityLoading() {
  return (
    <div className="min-h-dvh px-4 pt-4 pb-24">
      <Skeleton className="h-7 w-28" />
      <Skeleton className="mt-1 h-4 w-64" />
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-5 h-24 w-full rounded-xl" />
      <Skeleton className="mt-3 h-24 w-full rounded-xl" />
      <Skeleton className="mt-3 h-24 w-full rounded-xl" />
    </div>
  )
}
