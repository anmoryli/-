import { apiGet, apiPost, apiDelete, getApiBaseUrl } from "@/lib/api"
import {
  USE_MOCK,
  mockDelay,
  mockCreateConversation,
  mockGetConversations,
  mockDeleteConversation,
  mockSendMessage,
  mockGetHistory,
} from "@/lib/mock-data"

const log = (tag: string, ...args: unknown[]) => console.log("[API:ai]", tag, ...args)

export interface Conversation {
  conversationId: number
  userId: number
  title?: string
  createTime?: string
  updateTime?: string
  /** 是否有未读的 AI 消息（用于红点） */
  hasUnreadAi?: boolean
  /** 情景演绎时关联的情景 ID */
  scenarioId?: number | null
}

export interface ChatMessage {
  messageId: number
  conversationId: number
  role: "user" | "assistant"
  content: string
  createTime?: string
}

/** 创建会话 */
export async function createConversation(userId: number, title?: string) {
  log("createConversation", { userId, title })
  if (USE_MOCK) {
    await mockDelay()
    return mockCreateConversation(userId, title)
  }
  const form: Record<string, string | number> = { userId }
  if (title != null) form.title = title
  const data = await apiPost<Conversation>("/api/ai/createConversation", form)
  return data as Conversation
}

/** 获取会话列表 */
export async function getConversationList(userId: number) {
  log("getConversationList", { userId })
  if (USE_MOCK) {
    await mockDelay()
    return mockGetConversations()
  }
  const list = await apiGet<Conversation[]>("/api/ai/conversation/list", { userId })
  return Array.isArray(list) ? list : []
}

/** 删除会话 */
export async function deleteConversation(userId: number, conversationId: number) {
  if (USE_MOCK) {
    await mockDelay()
    mockDeleteConversation(conversationId)
    return null
  }
  await apiDelete<unknown>("/api/ai/deleteConversation", { userId, conversationId })
  return null
}

/** 标记会话已读（清除未读 AI 红点） */
export async function markConversationRead(userId: number, conversationId: number) {
  if (USE_MOCK) return
  await apiPost<unknown>("/api/ai/conversation/markRead", { userId, conversationId })
}

/** 是否有未读 AI 消息（供孕期小伴 Tab 红点） */
export async function getConversationHasUnread(userId: number): Promise<boolean> {
  if (USE_MOCK) return false
  const data = await apiGet<boolean>("/api/ai/conversation/hasUnread", { userId })
  return data === true
}

/** AI 对话（非流式，一次返回） */
export async function chat(userId: number, conversationId: number, question: string) {
  if (USE_MOCK) {
    await mockDelay(800)
    const messages = mockSendMessage(conversationId, question)
    const lastMsg = messages[messages.length - 1]
    return lastMsg.content
  }
  const data = await apiPost<string>("/api/ai/chat", { userId, conversationId, question })
  return typeof data === "string" ? data : ""
}

/**
 * AI 流式对话：SSE 流式解析，UTF-8 解码，通过 onChunk 逐块回调，流结束时 resolve。
 * 情景演绎时若后端发送 scenario_end_suggest 事件，会调用 onScenarioEndSuggest。
 */
export function chatStream(
  userId: number,
  conversationId: number,
  question: string,
  onChunk: (chunk: string) => void,
  images?: File[],
  publishToCommunity?: boolean,
  onScenarioEndSuggest?: () => void
): Promise<void> {
  if (USE_MOCK) {
    const messages = mockSendMessage(conversationId, question)
    const full = messages[messages.length - 1]?.content ?? ""
    return new Promise((resolve) => {
      let i = 0
      const t = setInterval(() => {
        if (i < full.length) {
          onChunk(full.slice(i, i + 2))
          i += 2
        } else {
          clearInterval(t)
          resolve()
        }
      }, 30)
    })
  }

  // 走同源 API 路由代理，流式透传（避免 rewrite 缓冲）
  const base =
    typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:9677"
  const url = `${base}/api/ai/chat-stream`
  const form = new FormData()
  form.append("userId", String(userId))
  form.append("conversationId", String(conversationId))
  form.append("question", question)
  if (images && images.length > 0) {
    images.forEach((img) => form.append("images", img))
  }
  form.append("publishToCommunity", publishToCommunity ? "true" : "false")

  const TIMEOUT_MS = 120_000 // 2 分钟无响应则中止，避免发送按钮一直处于“输入中”
  const ac = typeof AbortController !== "undefined" ? new AbortController() : null
  const timeoutId =
    typeof window !== "undefined" && ac
      ? window.setTimeout(() => ac.abort(), TIMEOUT_MS)
      : undefined

  return fetch(url, { method: "POST", body: form, signal: ac?.signal })
    .then(async (res) => {
      if (timeoutId != null) clearTimeout(timeoutId)
      if (!res.ok) {
        const errText = await res.text()
        const errMsg =
          errText?.replace(/^错误：|^error:/i, "").trim() ||
          `流式请求失败 (${res.status})`
        throw new Error(errMsg)
      }
      if (!res.body) throw new Error("无响应体")

      const reader = res.body.getReader()
      const decoder = new TextDecoder("utf-8", { fatal: false })
      let buf = ""
      let eventType = ""

      const parseLine = (line: string) => {
        if (line.startsWith("event:")) {
          eventType = line.slice(6).trim().toLowerCase()
          return null
        }
        if (line.startsWith("data:")) {
          const data = line.slice(5).replace(/^\s+/, "")
          if (data === "[DONE]" || eventType === "done") return null
          if (eventType === "scenario_end_suggest" && onScenarioEndSuggest) {
            onScenarioEndSuggest()
            eventType = ""
            return null
          }
          eventType = ""
          return data || null
        }
        return null
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const parts = buf.split("\n")
        buf = parts.pop() ?? ""
        for (const line of parts) {
          const data = parseLine(line)
          if (data) onChunk(data)
        }
      }

      for (const line of buf.split("\n")) {
        const data = parseLine(line)
        if (data) onChunk(data)
      }
      if (timeoutId != null) clearTimeout(timeoutId)
    })
    .catch((err: unknown) => {
      if (timeoutId != null) clearTimeout(timeoutId)
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("请求超时，请重试")
      }
      throw err
    })
}

/** 本周小贴士：调用 AI 生成一行（旧接口，作回退用） */
export async function getWeeklyTip(userId: number, week?: number): Promise<string> {
  if (USE_MOCK) return "保持好心情，注意均衡饮食"
  const params: Record<string, string | number> = { userId }
  if (week != null && week > 0) params.week = week
  const data = await apiGet<string>("/api/ai/weeklyTip", params)
  return typeof data === "string" ? data : "保持好心情，注意均衡饮食"
}

/** 本周提醒 AI：基于上周摘要生成 ≤20 字，主页「本周小贴士」优先使用 */
export async function getWeeklyReminder(userId: number, week?: number): Promise<string> {
  if (USE_MOCK) return "保持好心情，注意均衡饮食"
  const params: Record<string, string | number> = { userId }
  if (week != null && week > 0) params.week = week
  const data = await apiGet<string>("/api/ai/weeklyReminder", params)
  return typeof data === "string" ? data : "保持好心情，注意均衡饮食"
}

/** 产检提醒：AI 生成 */
export async function getPrenatalReminder(userId: number): Promise<string> {
  if (USE_MOCK) return "请按时产检，注意身体变化。"
  const data = await apiGet<string>("/api/ai/prenatalReminder", { userId })
  return typeof data === "string" ? data : ""
}

/** 宝宝成长：AI 生成 */
export async function getBabyGrowth(userId: number, week?: number): Promise<string> {
  if (USE_MOCK) return "宝宝正在健康成长。"
  const params: Record<string, string | number> = { userId }
  if (week != null && week > 0) params.week = week
  const data = await apiGet<string>("/api/ai/babyGrowth", params)
  return typeof data === "string" ? data : ""
}

/** 每日/开场暖心语：根据用户孕周返回一句鼓励或祝福，用于聊天页空状态展示 */
export async function getDailyWarm(userId: number): Promise<string> {
  if (USE_MOCK) return "今天也要好好照顾自己呀～"
  const data = await apiGet<string>("/api/ai/daily-warm", { userId })
  return typeof data === "string" ? data : "今天也要好好照顾自己呀～"
}

/** 创建情景演绎对话（仅配偶）：返回 conversationId, title, scenarioId, openingContent */
export interface CreateScenarioConversationResult {
  conversationId: number
  title: string
  scenarioId: number
  openingContent: string
}
export async function createScenarioConversation(
  userId: number,
  scenarioId: number
): Promise<CreateScenarioConversationResult> {
  const data = await apiPost<CreateScenarioConversationResult>(
    "/api/ai/createScenarioConversation",
    { userId, scenarioId }
  )
  return data
}

/** 获取会话历史（后端返回 isAi，映射为 role） */
export async function getConversationHistory(userId: number, conversationId: number) {
  if (USE_MOCK) {
    await mockDelay()
    return mockGetHistory(conversationId)
  }
  const raw = await apiGet<Array<{ messageId: number; content: string; isAi?: boolean }>>(
    "/api/ai/conversation/history",
    { userId, conversationId }
  )
  if (!Array.isArray(raw)) return []
  return raw.map((m) => ({
    messageId: m.messageId,
    conversationId,
    role: (m as { isAi?: boolean }).isAi ? ("assistant" as const) : ("user" as const),
    content: m.content,
  })) as ChatMessage[]
}
