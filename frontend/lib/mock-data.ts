import type { User } from "./api/user"
import type { MemoItem } from "./api/memo"
import type { Conversation, ChatMessage } from "./api/ai"

// 是否使用 mock 模式。默认 false 走真实后端；设 NEXT_PUBLIC_USE_MOCK=true 可切回 mock
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true"

// 模拟延迟
export const mockDelay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

// ---- Mock 用户数据 ----

let mockUserId = 1
const mockUsers: Map<string, User> = new Map()

export function mockRegister(
  username: string,
  password: string,
  email?: string,
  lastMenstrualDate?: string,
  pregnancyTime?: string
): User {
  if (mockUsers.has(username)) {
    throw new Error("用户名已存在")
  }
  const user: User = {
    userId: mockUserId++,
    username,
    password,
    email,
    lastMenstrualDate,
    pregnancyTime,
    createTime: new Date().toISOString(),
  }
  mockUsers.set(username, user)
  return user
}

export function mockLogin(username: string, password: string): User {
  const user = mockUsers.get(username)
  if (!user || user.password !== password) {
    throw new Error("用户名或密码错误")
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...safeUser } = user
  return safeUser
}

// 预置一个测试用户
mockUsers.set("test", {
  userId: 1,
  username: "test",
  password: "123456",
  email: "test@example.com",
  lastMenstrualDate: "2025-11-08",
  pregnancyTime: "2026-08-15",
  createTime: "2026-01-01T00:00:00.000Z",
})

// ---- Mock 记录数据 (使用 localStorage 持久化) ----

const MEMOS_STORAGE_KEY = "pregnancy_memos"
const MEMO_ID_KEY = "pregnancy_memo_id"

const defaultMemos: MemoItem[] = [
  {
    id: 1,
    type: "text",
    title: "第一次感受到胎动",
    content: "今天早上感受到了宝宝的胎动，像小鱼在游动一样，好神奇的感觉！",
    createTime: "2026-03-05T10:30:00.000Z",
  },
  {
    id: 2,
    type: "photo",
    photoDescription: "孕20周大肚照",
    photoUrls: ["/placeholder.svg?height=200&width=200"],
    createTime: "2026-03-03T15:20:00.000Z",
  },
  {
    id: 3,
    type: "text",
    title: "产检记录",
    content: "今天去做了四维彩超，医生说宝宝发育正常，体重约500g。",
    createTime: "2026-03-01T09:00:00.000Z",
  },
]

function getMemos(): MemoItem[] {
  if (typeof window === "undefined") return defaultMemos
  const stored = localStorage.getItem(MEMOS_STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return defaultMemos
    }
  }
  // 首次使用，初始化默认数据
  localStorage.setItem(MEMOS_STORAGE_KEY, JSON.stringify(defaultMemos))
  return defaultMemos
}

function saveMemos(memos: MemoItem[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(MEMOS_STORAGE_KEY, JSON.stringify(memos))
}

function getNextMemoId(): number {
  if (typeof window === "undefined") return 100
  const stored = localStorage.getItem(MEMO_ID_KEY)
  const id = stored ? parseInt(stored, 10) : 100
  localStorage.setItem(MEMO_ID_KEY, String(id + 1))
  return id
}

export function mockGetAllMemos(): MemoItem[] {
  const memos = getMemos()
  return [...memos].sort(
    (a, b) => new Date(b.createTime!).getTime() - new Date(a.createTime!).getTime()
  )
}

export function mockAddTextMemo(title: string, content: string): MemoItem {
  const memo: MemoItem = {
    id: getNextMemoId(),
    type: "text",
    title,
    content,
    createTime: new Date().toISOString(),
  }
  const memos = getMemos()
  memos.unshift(memo)
  saveMemos(memos)
  return memo
}

export function mockAddPhotoMemo(description: string): MemoItem {
  const memo: MemoItem = {
    id: getNextMemoId(),
    type: "photo",
    photoDescription: description,
    photoUrls: ["/placeholder.svg?height=200&width=200"],
    createTime: new Date().toISOString(),
  }
  const memos = getMemos()
  memos.unshift(memo)
  saveMemos(memos)
  return memo
}

export function mockAddVoiceMemo(title: string): MemoItem {
  const memo: MemoItem = {
    id: getNextMemoId(),
    type: "voice",
    title,
    voiceUrl: "/placeholder-audio.mp3",
    createTime: new Date().toISOString(),
  }
  const memos = getMemos()
  memos.unshift(memo)
  saveMemos(memos)
  return memo
}

export function mockAddFileMemo(title: string, fileName: string): MemoItem {
  const memo: MemoItem = {
    id: getNextMemoId(),
    type: "file",
    title,
    fileUrl: `/files/${fileName}`,
    createTime: new Date().toISOString(),
  }
  const memos = getMemos()
  memos.unshift(memo)
  saveMemos(memos)
  return memo
}

export function mockDeleteMemo(id: number): boolean {
  const memos = getMemos()
  const idx = memos.findIndex((m) => m.id === id)
  if (idx !== -1) {
    memos.splice(idx, 1)
    saveMemos(memos)
    return true
  }
  return false
}

// ---- Mock AI 会话数据 (使用 localStorage 持久化) ----

const CONVERSATIONS_STORAGE_KEY = "pregnancy_conversations"
const MESSAGES_STORAGE_KEY = "pregnancy_messages"
const CONV_ID_KEY = "pregnancy_conv_id"
const MSG_ID_KEY = "pregnancy_msg_id"

function getConversations(): Conversation[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(CONVERSATIONS_STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

function saveConversations(conversations: Conversation[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations))
}

function getAllMessages(): Record<number, ChatMessage[]> {
  if (typeof window === "undefined") return {}
  const stored = localStorage.getItem(MESSAGES_STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return {}
    }
  }
  return {}
}

function saveAllMessages(messages: Record<number, ChatMessage[]>) {
  if (typeof window === "undefined") return
  localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages))
}

function getNextConvId(): number {
  if (typeof window === "undefined") return 1
  const stored = localStorage.getItem(CONV_ID_KEY)
  const id = stored ? parseInt(stored, 10) : 1
  localStorage.setItem(CONV_ID_KEY, String(id + 1))
  return id
}

function getNextMsgId(): number {
  if (typeof window === "undefined") return 1
  const stored = localStorage.getItem(MSG_ID_KEY)
  const id = stored ? parseInt(stored, 10) : 1
  localStorage.setItem(MSG_ID_KEY, String(id + 1))
  return id
}

export function mockCreateConversation(userId: number, title?: string): Conversation {
  const conv: Conversation = {
    conversationId: getNextConvId(),
    userId,
    title: title || "新对话",
    createTime: new Date().toISOString(),
  }
  const conversations = getConversations()
  conversations.unshift(conv)
  saveConversations(conversations)
  
  // 初始化空消息列表
  const allMessages = getAllMessages()
  allMessages[conv.conversationId] = []
  saveAllMessages(allMessages)
  
  return conv
}

export function mockGetConversations(): Conversation[] {
  return getConversations()
}

export function mockDeleteConversation(conversationId: number): boolean {
  const conversations = getConversations()
  const idx = conversations.findIndex((c) => c.conversationId === conversationId)
  if (idx !== -1) {
    conversations.splice(idx, 1)
    saveConversations(conversations)
    
    // 删除对应的消息
    const allMessages = getAllMessages()
    delete allMessages[conversationId]
    saveAllMessages(allMessages)
    return true
  }
  return false
}

export function mockGetHistory(conversationId: number): ChatMessage[] {
  const allMessages = getAllMessages()
  return allMessages[conversationId] || []
}

const aiResponses: Record<string, string> = {
  饮食: "孕期饮食建议：\n1. 多吃新鲜蔬果，补充叶酸\n2. 适量摄入优质蛋白（鱼、瘦肉、蛋）\n3. 避免生冷、辛辣食物\n4. 少食多餐，控制体重增长",
  胎动: "胎动是宝宝健康的重要信号：\n1. 一般18-20周开始感受到胎动\n2. 28周后建议每天数胎动\n3. 正常胎动每小时3-5次\n4. 如发现胎动明显减少请及时就医",
  睡眠: "孕期睡眠建议：\n1. 左侧卧位有利于胎儿血液供应\n2. 可使用孕妇枕支撑腰部\n3. 睡前避免大量饮水\n4. 保持规律作息时间",
  运动: "孕期适当运动有益健康：\n1. 散步是最安全的运动方式\n2. 孕妇瑜伽可缓解腰背疼痛\n3. 避免剧烈运动和跳跃动作\n4. 运动时注意补充水分",
  产检: "产检时间表：\n1. 孕早期：每4周一次\n2. 孕中期：每2-4周一次\n3. 孕晚期：每1-2周一次\n4. 重要检查：NT、唐筛、四维彩超、糖耐",
}

export function mockChat(question: string): string {
  // 根据问题关键词返回对应回答
  for (const [keyword, answer] of Object.entries(aiResponses)) {
    if (question.includes(keyword)) {
      return answer
    }
  }
  return `感谢您的提问！作为孕期助手，我可以为您解答关于孕期饮食、胎动、睡眠、运动、产检等方面的问题。\n\n您问的是："${question}"\n\n建议您咨询专业医生获取更详细的建议。如有其他问题，欢迎继续提问！`
}

export function mockSendMessage(conversationId: number, question: string): ChatMessage[] {
  const allMessages = getAllMessages()
  const messages = allMessages[conversationId] || []
  
  // 添加用户消息
  const userMsg: ChatMessage = {
    messageId: getNextMsgId(),
    conversationId,
    role: "user",
    content: question,
    createTime: new Date().toISOString(),
  }
  messages.push(userMsg)

  // 添加 AI 回复
  const aiMsg: ChatMessage = {
    messageId: getNextMsgId(),
    conversationId,
    role: "assistant",
    content: mockChat(question),
    createTime: new Date().toISOString(),
  }
  messages.push(aiMsg)

  allMessages[conversationId] = messages
  saveAllMessages(allMessages)
  
  // 更新会话的更新时间
  const conversations = getConversations()
  const convIdx = conversations.findIndex(c => c.conversationId === conversationId)
  if (convIdx !== -1) {
    conversations[convIdx].updateTime = new Date().toISOString()
    saveConversations(conversations)
  }
  
  return messages
}
