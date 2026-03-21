import { apiGet, apiPost, apiPut } from "@/lib/api"

export interface Family {
  familyId: number
  creatorUserId: number
  inviteCode: string
  inviteExpiresAt: string
}

export interface FamilyMember {
  memberId?: number
  userId: number
  username: string
  role: string
  relationship?: string
  isSpouse?: boolean
  joinedAt: string
}

/** 更新家庭成员关系（仅创建者可操作） */
export async function updateMemberRelationship(
  familyId: number,
  memberId: number,
  relationship: string,
  userId: number
): Promise<void> {
  await apiPut<void>("/api/family/members/relationship", {
    familyId,
    memberId,
    relationship,
    userId,
  })
}

export async function createFamily(userId: number): Promise<{
  familyId: number
  inviteCode: string
  expiresAt: string
}> {
  const data = await apiPost<{ familyId: number; inviteCode: string; expiresAt: string }>(
    "/api/family/create",
    { userId }
  )
  return data
}

/** 加入家庭，relationship 为与孕妇关系（如老公、婆婆、妈妈），可选 */
export async function joinFamily(
  userId: number,
  inviteCode: string,
  relationship?: string
): Promise<Family | null> {
  const params: Record<string, string | number> = { userId, inviteCode }
  if (relationship && relationship.trim()) params.relationship = relationship.trim()
  const data = await apiPost<Family>("/api/family/join", params)
  return data
}

export async function getMyFamily(userId: number): Promise<Family | null> {
  const data = await apiGet<Family | null>("/api/family/my", { userId })
  return data
}

export async function getFamilyMembers(
  familyId: number,
  userId: number
): Promise<FamilyMember[]> {
  const data = await apiGet<FamilyMember[]>("/api/family/members", {
    familyId,
    userId,
  })
  return Array.isArray(data) ? data : []
}

export async function leaveFamily(userId: number): Promise<void> {
  await apiPost<void>("/api/family/leave", { userId })
}

export async function dissolveFamily(userId: number): Promise<void> {
  await apiPost<void>("/api/family/dissolve", { userId })
}

/** 家庭成员查看孕妇的怀孕进度：返回创建者的孕期信息与记录数 */
export interface CreatorPregnancyInfo {
  creatorUserId: number
  creatorUsername: string
  lastMenstrualDate: string | null
  pregnancyTime: string | null
  recordCount: number
  recordCountTotal?: number
  recordCountMom?: number
  recordCountDad?: number
}

export async function getCreatorPregnancy(userId: number): Promise<CreatorPregnancyInfo | null> {
  const data = await apiGet<CreatorPregnancyInfo | Record<string, never>>("/api/family/creator-pregnancy", { userId })
  if (!data || typeof (data as CreatorPregnancyInfo).creatorUserId !== "number") return null
  return data as CreatorPregnancyInfo
}
