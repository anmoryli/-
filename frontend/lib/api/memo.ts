import { apiGet, apiPost, apiUpload, getApiBaseUrl } from "@/lib/api"
import {
  USE_MOCK,
  mockDelay,
  mockGetAllMemos,
  mockAddTextMemo,
  mockAddPhotoMemo,
  mockAddVoiceMemo,
  mockAddFileMemo,
  mockDeleteMemo,
} from "@/lib/mock-data"

const log = (tag: string, ...args: unknown[]) => console.log("[API:memo]", tag, ...args)

/** 文字记录 */
export interface TextMemo {
  textId: number
  userId: number
  title?: string
  content: string
  createTime?: string
  updateTime?: string
}

/** 语音记录 */
export interface VoiceMemo {
  voiceId: number
  userId: number
  title?: string
  voiceUrl: string
  createTime?: string
}

/** 文件记录 */
export interface FileMemo {
  fileId: number
  userId: number
  title?: string
  fileUrl: string
  createTime?: string
}

/** 照片记录 */
export interface PhotoMemo {
  photoId: number
  userId: number
  photoDescription?: string
  photoUrls: string[]
  createTime?: string
}

/** 通用记录类型 (getAllByUserId / getAllEnriched 返回) */
export interface MemoItem {
  id: number
  type: "text" | "voice" | "file" | "photo"
  tag?: string
  title?: string
  content?: string
  url?: string
  urls?: string[]
  description?: string
  createTime?: string
  pregnancyWeek?: string
  pregnancyWeekIndex?: number
  recordWeightKg?: number
  mood?: string
  category?: string
  visibilityMode?: "all" | "allowlist" | "blocklist"
  visibleTo?: string
  // 原始字段，后端可能返回混合结构
  textId?: number
  voiceId?: number
  fileId?: number
  photoId?: number
  voiceUrl?: string
  fileUrl?: string
  photoUrls?: string[]
  photoDescription?: string
  /** 家庭合并列表时：该条记录由谁创建 mom=妈妈/创建者 dad=爸爸/配偶 */
  recordBy?: "mom" | "dad"
}

/** 后端 Memo 表返回结构（无 title/content，需与 text/voice/photo 合并） */
interface MemoRaw {
  memoId: number
  userId?: number
  type: string
  tag?: string
  photoDescription?: string
  pregnancyWeek?: string
  pregnancyWeekIndex?: number
  recordWeightKg?: number
  mood?: string
  category?: string
  visibilityMode?: string
  visibleTo?: string
  createdAt?: string
  updatedAt?: string
}

/** 后端 Text 表返回结构 */
interface TextRaw {
  textId: number
  memoId: number
  title?: string
  content?: string
  createdAt?: string
  updatedAt?: string
}

/** 后端 Voice 表返回结构（url 可能以 voiceUrl 返回） */
interface VoiceRaw {
  voiceId: number
  memoId: number
  title?: string
  url?: string
  voiceUrl?: string
  createdAt?: string
  updatedAt?: string
}

/** 后端 Photo 表返回结构（单张照片，同一 memoId 可能多条） */
interface PhotoRaw {
  photoId: number
  memoId: number
  url?: string
  createdAt?: string
  updatedAt?: string
}

/** 后端 File 表返回结构 */
interface FileRaw {
  fileId: number
  memoId: number
  title?: string
  url?: string
  createdAt?: string
  updatedAt?: string
}

// ---- 文字记录 ----

/** 添加文字记录（tag 如 letter_to_baby 表示给宝宝的信） */
export async function addText(
  userId: number,
  content: string,
  title?: string,
  tag?: string,
  options?: { mood?: string; visibilityMode?: "all" | "allowlist" | "blocklist"; visibleTo?: string; category?: string }
) {
  log("addText", { userId, title, tag, contentLen: content?.length })
  if (USE_MOCK) {
    await mockDelay()
    return mockAddTextMemo(title || "无标题", content) as unknown as TextMemo
  }
  const params: Record<string, string | number> = { userId, content }
  if (title) params.title = title
  if (tag) params.tag = tag
  if (options?.mood) params.mood = options.mood
  if (options?.visibilityMode) params.visibilityMode = options.visibilityMode
  if (options?.visibleTo) params.visibleTo = options.visibleTo
  if (options?.category) params.category = options.category
  return apiGet<number>("/api/memo/addText", params)
}

/** 更新文字记录 */
export async function updateText(
  textId: number,
  title: string,
  content: string,
  options?: { visibilityMode?: "all" | "allowlist" | "blocklist"; visibleTo?: string }
) {
  const params: Record<string, string | number> = { textId, title, content }
  if (options?.visibilityMode) params.visibilityMode = options.visibilityMode
  if (options?.visibleTo != null) params.visibleTo = options.visibleTo
  return apiGet<boolean>("/api/memo/updateText", params)
}

/** 灵感/帮写：新建文字记录时生成一段灵感或开头草稿，不落库 */
export async function inspireMemo(
  userId: number,
  options?: { content?: string; week?: string; tag?: string }
): Promise<string> {
  const params: Record<string, string | number | undefined> = { userId }
  if (options?.content != null) params.content = options.content
  if (options?.week != null) params.week = options.week
  if (options?.tag != null) params.tag = options.tag
  const data = await apiPost<string>("/api/memo/inspire", params)
  return typeof data === "string" ? data : ""
}

/** 笔记 AI 美化预览（仅文字记录），返回美化后的正文，不落库 */
export async function beautifyPreview(memoId: number, userId: number): Promise<string | null> {
  const data = await apiPost<string>("/api/memo/beautify-preview", { memoId, userId })
  return data ?? null
}

/** 更新记录可见范围 */
export async function updateMemoVisibility(
  memoId: number,
  userId: number,
  visibilityMode: "all" | "allowlist" | "blocklist",
  visibleTo: string
) {
  return apiGet<boolean>("/api/memo/updateVisibility", {
    memoId,
    userId,
    visibilityMode,
    visibleTo,
  })
}

/** 删除文字记录 */
export async function deleteText(memoId: number) {
  if (USE_MOCK) {
    await mockDelay()
    mockDeleteMemo(memoId)
    return null
  }
  return apiGet<boolean>("/api/memo/deleteText", { memoId })
}

/** 获取用户所有文字记录 */
export async function getTextByUserId(userId: number) {
  return apiGet<TextMemo[]>("/api/memo/getTextByUserId", { userId })
}

// ---- 语音记录 ----

/** 添加语音记录 */
export async function addVoice(
  userId: number,
  file: File,
  title?: string,
  options?: { mood?: string; visibilityMode?: "all" | "allowlist" | "blocklist"; visibleTo?: string; category?: string }
) {
  if (USE_MOCK) {
    await mockDelay()
    return mockAddVoiceMemo(title || "语音记录") as unknown as VoiceMemo
  }
  const extra: Record<string, string | number> = { userId }
  if (title) extra.title = title
  if (options?.mood) extra.mood = options.mood
  if (options?.visibilityMode) extra.visibilityMode = options.visibilityMode
  if (options?.visibleTo) extra.visibleTo = options.visibleTo
  if (options?.category) extra.category = options.category
  const path = "/api/memo/addVoice?userId=" + userId
  return apiUpload<VoiceMemo>(path, { key: "file", file }, extra)
}

/** 删除语音记录 */
export async function deleteVoice(memoId: number) {
  if (USE_MOCK) {
    await mockDelay()
    mockDeleteMemo(memoId)
    return null
  }
  return apiGet<boolean>("/api/memo/deleteVoice", { memoId })
}

export async function updateVoice(memoId: number, userId: number, file: File, title?: string) {
  return apiUpload<boolean>("/api/memo/updateVoice", { key: "file", file }, { memoId, userId, title })
}

/** 获取用户所有语音记录 */
export async function getVoiceByUserId(userId: number) {
  return apiGet<VoiceMemo[]>("/api/memo/getVoiceByUserId", { userId })
}

// ---- 文件记录 ----

/** 添加文件记录 */
export async function addFile(
  userId: number,
  file: File,
  title?: string,
  options?: { mood?: string; visibilityMode?: "all" | "allowlist" | "blocklist"; visibleTo?: string; category?: string }
) {
  if (USE_MOCK) {
    await mockDelay()
    return mockAddFileMemo(title || "文件", file.name) as unknown as FileMemo
  }
  const extra: Record<string, string | number> = { userId }
  if (title) extra.title = title
  if (options?.mood) extra.mood = options.mood
  if (options?.visibilityMode) extra.visibilityMode = options.visibilityMode
  if (options?.visibleTo) extra.visibleTo = options.visibleTo
  if (options?.category) extra.category = options.category
  const path = "/api/memo/addFile?userId=" + userId
  return apiUpload<FileMemo>(path, { key: "file", file }, extra)
}

/** 删除文件记录 */
export async function deleteFile(memoId: number) {
  if (USE_MOCK) {
    await mockDelay()
    mockDeleteMemo(memoId)
    return null
  }
  return apiGet<boolean>("/api/memo/deleteFile", { memoId })
}

export async function updateFile(memoId: number, userId: number, file: File, title?: string) {
  return apiUpload<boolean>("/api/memo/updateFile", { key: "file", file }, { memoId, userId, title })
}

// ---- 照片记录 ----

/** 添加照片记录 (最多9张) */
export async function addPhoto(
  userId: number,
  files: File[],
  photoDescription?: string,
  options?: { mood?: string; visibilityMode?: "all" | "allowlist" | "blocklist"; visibleTo?: string; category?: string }
) {
  if (USE_MOCK) {
    await mockDelay()
    return mockAddPhotoMemo(photoDescription || "照片") as unknown as PhotoMemo
  }
  const extra: Record<string, string | number> = { userId }
  if (photoDescription) extra.photoDescription = photoDescription
  if (options?.mood) extra.mood = options.mood
  if (options?.visibilityMode) extra.visibilityMode = options.visibilityMode
  if (options?.visibleTo) extra.visibleTo = options.visibleTo
  if (options?.category) extra.category = options.category
  return apiUpload<PhotoMemo>("/api/memo/addPhoto", { key: "files", file: files }, extra)
}

/** 删除照片记录 */
export async function deletePhoto(memoId: number) {
  if (USE_MOCK) {
    await mockDelay()
    mockDeleteMemo(memoId)
    return null
  }
  return apiGet<boolean>("/api/memo/deletePhoto", { memoId })
}

export async function updatePhoto(memoId: number, userId: number, files: File[] = [], photoDescription?: string) {
  return apiUpload<boolean>("/api/memo/updatePhoto", { key: "files", file: files }, { memoId, userId, photoDescription })
}

/** 获取用户所有照片记录 */
export async function getPhotoByUserId(userId: number) {
  return apiGet<PhotoMemo[]>("/api/memo/getPhotoByUserId", { userId })
}

// ---- 通用 ----

/** 导出全部记录为 PDF（触发下载） */
export function exportPdf(userId: number, username: string) {
  if (typeof window === "undefined") return
  const params = new URLSearchParams({ userId: String(userId), username })
  const url = `${getApiBaseUrl()}/api/memo/exportPdf?${params}`
  window.open(url, "_blank")
}

/** 导出指定日期范围内的记录为 PDF */
export function exportDateRangePdf(userId: number, username: string, fromDate: string, toDate: string) {
  if (typeof window === "undefined") return
  const params = new URLSearchParams({
    userId: String(userId),
    username,
    fromDate,
    toDate,
  })
  const url = `${getApiBaseUrl()}/api/memo/exportDateRangePdf?${params}`
  window.open(url, "_blank")
}

/** 导出 PDF 并异步发邮件（202 立即返回，完成后发邮箱；失败发站内通知） */
export async function exportPdfToEmail(
  userId: number,
  options?: { email?: string; scope?: "mom" | "dad" | "both"; fromDate?: string; toDate?: string }
): Promise<void> {
  const params: Record<string, string | number> = { userId }
  if (options?.email) params.email = options.email
  params.scope = options?.scope ?? "both"
  if (options?.fromDate) params.fromDate = options.fromDate
  if (options?.toDate) params.toDate = options.toDate
  await apiPost<void>("/api/memo/exportPdfToEmail", params)
}

/** 获取用户所有记录（仅 memo 主表，无 title/content，文字类只会有类型标签）
 * @param requestUserId 当前查看者的 userId，用于按可见范围过滤。若与 userId 相同则为本人查看
 */
export async function getAllByUserId(userId: number, requestUserId?: number) {
  log("getAllByUserId", { userId, requestUserId })
  if (USE_MOCK) {
    await mockDelay()
    return mockGetAllMemos()
  }
  const params: Record<string, string> = { userId: String(userId) }
  if (requestUserId != null) params.requestUserId = String(requestUserId)
  return apiGet<MemoItem[]>("/api/memo/getAllByUserId", params)
}

/**
 * 获取用户所有记录并合并详情（文字/语音/照片的 title、content、url 等）
 * 后端 getAllByUserId 只返回 memo 主表，具体内容在 text/voice/photo 表中，需并行拉取并合并
 * @param requestUserId 当前查看者的 userId，用于按可见范围过滤（allowlist/blocklist）
 */
export async function getAllEnriched(userId: number, requestUserId?: number): Promise<MemoItem[]> {
  log("getAllEnriched", { userId, requestUserId })
  if (USE_MOCK) {
    await mockDelay()
    return mockGetAllMemos()
  }
  const memoParams: Record<string, string> = { userId: String(userId) }
  if (requestUserId != null) memoParams.requestUserId = String(requestUserId)
  const [memos, texts, voices, photos, files] = await Promise.all([
    apiGet<MemoRaw[]>("/api/memo/getAllByUserId", memoParams),
    apiGet<TextRaw[]>("/api/memo/getTextByUserId", { userId }),
    apiGet<VoiceRaw[]>("/api/memo/getVoiceByUserId", { userId }),
    apiGet<PhotoRaw[]>("/api/memo/getPhotoByUserId", { userId }),
    apiGet<FileRaw[]>("/api/memo/getFileByUserId", { userId }),
  ])

  const textByMemoId = new Map<number, TextRaw>()
  for (const t of texts ?? []) {
    textByMemoId.set(t.memoId, t)
  }
  const voiceByMemoId = new Map<number, VoiceRaw>()
  for (const v of voices ?? []) {
    voiceByMemoId.set(v.memoId, v)
  }
  const photoUrlsByMemoId = new Map<number, string[]>()
  for (const p of photos ?? []) {
    const list = photoUrlsByMemoId.get(p.memoId) ?? []
    if (p.url) list.push(p.url)
    photoUrlsByMemoId.set(p.memoId, list)
  }
  const fileByMemoId = new Map<number, FileRaw>()
  for (const f of files ?? []) {
    fileByMemoId.set(f.memoId, f)
  }

  const list: MemoItem[] = (memos ?? []).map((m) => {
    const type = (m.type === "text" || m.type === "voice" || m.type === "file" || m.type === "photo"
      ? m.type
      : "text") as MemoItem["type"]
    const item: MemoItem = {
      id: m.memoId,
      type,
      tag: m.tag,
      createTime: m.createdAt,
      photoDescription: m.photoDescription,
      pregnancyWeek: m.pregnancyWeek,
      pregnancyWeekIndex: m.pregnancyWeekIndex,
      recordWeightKg: m.recordWeightKg,
      mood: m.mood,
      category: m.category,
      visibilityMode: m.visibilityMode ?? "all",
      visibleTo: m.visibleTo,
    }
    if (item.type === "text") {
      const t = textByMemoId.get(m.memoId)
      if (t) {
        item.title = t.title
        item.content = t.content
        item.textId = t.textId
      }
    } else if (item.type === "voice") {
      const v = voiceByMemoId.get(m.memoId)
      if (v) {
        item.title = v.title
        item.voiceUrl = v.voiceUrl ?? v.url
        item.voiceId = v.voiceId
      }
    } else if (item.type === "photo") {
      item.title = "照片记录"
      item.photoUrls = photoUrlsByMemoId.get(m.memoId) ?? []
    } else if (item.type === "file") {
      const f = fileByMemoId.get(m.memoId)
      if (f) {
        item.title = f.title
        item.fileUrl = f.url
        item.fileId = f.fileId
      }
    }
    return item
  })

  return list.sort((a, b) => {
    const ta = a.createTime ? new Date(a.createTime).getTime() : 0
    const tb = b.createTime ? new Date(b.createTime).getTime() : 0
    return tb - ta
  })
}

/** 按 ID 获取单条记录（含权限校验），用于详情页在列表中未命中时的回退。404 或无权限时返回 null。 */
export async function getRecordById(memoId: number, requestUserId: number): Promise<MemoItem | null> {
  log("getRecordById", { memoId, requestUserId })
  if (USE_MOCK) return null
  try {
    const data = await apiGet<Record<string, unknown>>("/api/memo/getById", {
      memoId: String(memoId),
      requestUserId: String(requestUserId),
    })
    if (!data || data.memoId == null) return null
    const type = (data.type === "text" || data.type === "voice" || data.type === "file" || data.type === "photo"
      ? data.type
      : "text") as MemoItem["type"]
    const item: MemoItem = {
      id: Number(data.memoId),
      type,
      tag: data.tag as string | undefined,
      createTime: data.createdAt as string | undefined,
      pregnancyWeek: data.pregnancyWeek as string | undefined,
      pregnancyWeekIndex: data.pregnancyWeekIndex as number | undefined,
      recordWeightKg: data.recordWeightKg as number | undefined,
      mood: data.mood as string | undefined,
      category: data.category as string | undefined,
      photoDescription: data.photoDescription as string | undefined,
      visibilityMode: data.visibilityMode as MemoItem["visibilityMode"],
      visibleTo: data.visibleTo as string | undefined,
      recordBy: data.recordBy as "mom" | "dad" | undefined,
    }
    if (type === "text") {
      item.title = data.title as string | undefined
      item.content = data.content as string | undefined
      item.textId = data.textId as number | undefined
    } else if (type === "voice") {
      item.title = data.title as string | undefined
      item.voiceUrl = data.voiceUrl as string | undefined
      item.voiceId = data.voiceId as number | undefined
    } else if (type === "photo") {
      item.photoUrls = Array.isArray(data.photoUrls) ? (data.photoUrls as string[]) : []
    } else if (type === "file") {
      item.title = data.title as string | undefined
      item.fileUrl = data.fileUrl as string | undefined
      item.fileId = data.fileId as number | undefined
    }
    return item
  } catch {
    return null
  }
}

/** 家庭记录：妈妈+爸爸合并列表，每条带 recordBy。有家庭且为家庭成员时使用。 */
export async function getFamilyEnriched(requestUserId: number): Promise<MemoItem[]> {
  log("getFamilyEnriched", { requestUserId })
  if (USE_MOCK) {
    await mockDelay()
    return mockGetAllMemos()
  }
  const data = await apiGet<{ mom: MemoRaw[]; dad: MemoRaw[] }>("/api/memo/getFamilyEnriched", {
    requestUserId: String(requestUserId),
  })
  const mom = data?.mom ?? []
  const dad = data?.dad ?? []
  const withRecordBy = [
    ...mom.map((m) => ({ ...m, recordBy: "mom" as const })),
    ...dad.map((m) => ({ ...m, recordBy: "dad" as const })),
  ]
  withRecordBy.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return tb - ta
  })
  const ownerIds = [...new Set(withRecordBy.map((m) => m.userId).filter((id): id is number => id != null))]
  const [textsArr, voicesArr, photosArr, filesArr] = await Promise.all([
    Promise.all(ownerIds.map((uid) => apiGet<TextRaw[]>("/api/memo/getTextByUserId", { userId: String(uid) }))),
    Promise.all(ownerIds.map((uid) => apiGet<VoiceRaw[]>("/api/memo/getVoiceByUserId", { userId: String(uid) }))),
    Promise.all(ownerIds.map((uid) => apiGet<PhotoRaw[]>("/api/memo/getPhotoByUserId", { userId: String(uid) }))),
    Promise.all(ownerIds.map((uid) => apiGet<FileRaw[]>("/api/memo/getFileByUserId", { userId: String(uid) }))),
  ])
  const texts = (textsArr ?? []).flat().filter(Boolean)
  const voices = (voicesArr ?? []).flat().filter(Boolean)
  const photos = (photosArr ?? []).flat().filter(Boolean)
  const files = (filesArr ?? []).flat().filter(Boolean)
  const textByMemoId = new Map<number, TextRaw>()
  for (const t of texts) textByMemoId.set(t.memoId, t)
  const voiceByMemoId = new Map<number, VoiceRaw>()
  for (const v of voices) voiceByMemoId.set(v.memoId, v)
  const photoUrlsByMemoId = new Map<number, string[]>()
  for (const p of photos) {
    const list = photoUrlsByMemoId.get(p.memoId) ?? []
    if (p.url) list.push(p.url)
    photoUrlsByMemoId.set(p.memoId, list)
  }
  const fileByMemoId = new Map<number, FileRaw>()
  for (const f of files) fileByMemoId.set(f.memoId, f)

  const list: MemoItem[] = withRecordBy.map((m) => {
    const type = (m.type === "text" || m.type === "voice" || m.type === "file" || m.type === "photo"
      ? m.type
      : "text") as MemoItem["type"]
    const item: MemoItem = {
      id: m.memoId,
      type,
      tag: m.tag,
      createTime: m.createdAt,
      photoDescription: m.photoDescription,
      pregnancyWeek: m.pregnancyWeek,
      pregnancyWeekIndex: m.pregnancyWeekIndex,
      recordWeightKg: m.recordWeightKg,
      mood: m.mood,
      category: m.category,
      visibilityMode: m.visibilityMode ?? "all",
      visibleTo: m.visibleTo,
      recordBy: m.recordBy,
    }
    if (item.type === "text") {
      const t = textByMemoId.get(m.memoId)
      if (t) {
        item.title = t.title
        item.content = t.content
        item.textId = t.textId
      }
    } else if (item.type === "voice") {
      const v = voiceByMemoId.get(m.memoId)
      if (v) {
        item.title = v.title
        item.voiceUrl = v.voiceUrl ?? v.url
        item.voiceId = v.voiceId
      }
    } else if (item.type === "photo") {
      item.title = "照片记录"
      item.photoUrls = photoUrlsByMemoId.get(m.memoId) ?? []
    } else if (item.type === "file") {
      const f = fileByMemoId.get(m.memoId)
      if (f) {
        item.title = f.title
        item.fileUrl = f.url
        item.fileId = f.fileId
      }
    }
    return item
  })

  return list.sort((a, b) => {
    const ta = a.createTime ? new Date(a.createTime).getTime() : 0
    const tb = b.createTime ? new Date(b.createTime).getTime() : 0
    return tb - ta
  })
}
