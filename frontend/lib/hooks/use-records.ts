import useSWR, { mutate as globalMutate } from "swr"
import { getAllEnriched, getFamilyEnriched, type MemoItem } from "@/lib/api/memo"

export function useRecords(userId: number | undefined, userType: string | undefined, useFamilyView?: boolean) {
  return useSWR<MemoItem[]>(
    userId ? ["records", userId, userType, useFamilyView ? "family" : "self"] : null,
    () =>
      (userType === "family_member" || useFamilyView)
        ? getFamilyEnriched(userId!)
        : getAllEnriched(userId!),
  )
}

export function mutateRecords(userId: number | undefined, userType: string | undefined, useFamilyView?: boolean) {
  if (!userId) return
  globalMutate(["records", userId, userType, "self"])
  globalMutate(["records", userId, userType, "family"])
}
