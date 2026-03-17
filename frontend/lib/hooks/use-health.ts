import useSWR, { mutate as globalMutate } from "swr"
import { listWeightRecords, listFetalRecords, getHealthSummary } from "@/lib/api/health"

export function useWeightRecords(userId: number | undefined) {
  return useSWR(
    userId ? ["weight-records", userId] : null,
    () => listWeightRecords(userId!),
  )
}

export function useFetalRecords(userId: number | undefined) {
  return useSWR(
    userId ? ["fetal-records", userId] : null,
    () => listFetalRecords(userId!),
  )
}

export function useHealthSummary(userId: number | undefined) {
  return useSWR(
    userId ? ["health-summary", userId] : null,
    () => getHealthSummary(userId!),
  )
}

export function mutateWeightRecords(userId: number | undefined) {
  if (!userId) return
  return globalMutate(["weight-records", userId])
}

export function mutateFetalRecords(userId: number | undefined) {
  if (!userId) return
  return globalMutate(["fetal-records", userId])
}
