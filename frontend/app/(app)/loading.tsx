import { Skeleton } from "@/components/ui/skeleton"

export default function AppLoading() {
  return (
    <div className="min-h-dvh px-5 pb-24">
      <div className="pt-12 pb-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-2 h-7 w-52" />
        <Skeleton className="mt-1 h-4 w-36" />
      </div>
      <Skeleton className="mt-4 h-48 w-full rounded-2xl" />
      <Skeleton className="mt-4 h-32 w-full rounded-2xl" />
      <Skeleton className="mt-4 h-24 w-full rounded-2xl" />
      <div className="mt-6 space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-[72px] w-full rounded-xl" />
        <Skeleton className="h-[72px] w-full rounded-xl" />
        <Skeleton className="h-[72px] w-full rounded-xl" />
      </div>
    </div>
  )
}
