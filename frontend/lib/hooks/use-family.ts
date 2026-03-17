import useSWR from "swr"
import { getMyFamily, getFamilyMembers, getCreatorPregnancy, type Family, type FamilyMember, type CreatorPregnancyInfo } from "@/lib/api/family"

export function useMyFamily(userId: number | undefined) {
  return useSWR<Family | null>(
    userId ? ["my-family", userId] : null,
    () => getMyFamily(userId!),
  )
}

export function useFamilyMembers(familyId: number | undefined, userId: number | undefined) {
  return useSWR<FamilyMember[]>(
    familyId && userId ? ["family-members", familyId, userId] : null,
    () => getFamilyMembers(familyId!, userId!),
  )
}

export function useCreatorPregnancy(userId: number | undefined) {
  return useSWR<CreatorPregnancyInfo | null>(
    userId ? ["creator-pregnancy", userId] : null,
    () => getCreatorPregnancy(userId!),
  )
}
