import { apiGet, apiPutJson, apiDeleteWithQuery, getApiBaseUrl } from "@/lib/api"

export interface RelaxMusic {
  musicId: number
  title: string
  artist?: string
  description?: string
  category: string
  tags?: string
  fileUrl: string
  coverUrl?: string
  durationSeconds?: number
  sortOrder?: number
  isEnabled?: boolean
  createdAt?: string
  updatedAt?: string
}

export async function listRelaxMusic() {
  return apiGet<RelaxMusic[]>("/api/relax-music/list")
}

export async function listRelaxMusicByCategory(category: string) {
  return apiGet<RelaxMusic[]>("/api/relax-music/list/category", { category })
}

export async function listAllRelaxMusic() {
  return apiGet<RelaxMusic[]>("/api/relax-music/admin/list")
}

export async function uploadRelaxMusic(data: {
  file: File
  title: string
  category: string
  artist?: string
  description?: string
  tags?: string
  durationSeconds?: number
  sortOrder?: number
  cover?: File
}): Promise<RelaxMusic> {
  const formData = new FormData()
  formData.append("file", data.file)
  formData.append("title", data.title)
  formData.append("category", data.category)
  if (data.artist) formData.append("artist", data.artist)
  if (data.description) formData.append("description", data.description)
  if (data.tags) formData.append("tags", data.tags)
  if (data.durationSeconds != null) formData.append("durationSeconds", String(data.durationSeconds))
  if (data.sortOrder != null) formData.append("sortOrder", String(data.sortOrder))
  if (data.cover) formData.append("cover", data.cover)

  const base = getApiBaseUrl()
  const res = await fetch(`${base}/api/relax-music/admin/upload`, {
    method: "POST",
    body: formData,
  })
  const json = await res.json()
  if (json.code !== 200) throw new Error(json.message || "上传失败")
  return json.data
}

export async function updateRelaxMusic(music: Partial<RelaxMusic> & { musicId: number }) {
  return apiPutJson<RelaxMusic>("/api/relax-music/admin/update", music)
}

export async function deleteRelaxMusic(musicId: number) {
  const base = getApiBaseUrl()
  const res = await fetch(`${base}/api/relax-music/admin/${musicId}`, { method: "DELETE" })
  const json = await res.json()
  if (json.code !== 200) throw new Error(json.message || "删除失败")
  return json.data as boolean
}
