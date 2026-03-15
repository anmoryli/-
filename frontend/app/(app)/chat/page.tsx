"use client"

import { useState, useRef, useEffect, useCallback, memo, type ChangeEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Bot, Send, MessageSquare, Trash2, ChevronLeft, ImagePlus, X, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { useAuth } from "@/lib/auth-context"
import {
  chatStream,
  createConversation,
  getConversationList,
  getConversationHistory,
  getDailyWarm,
  deleteConversation,
  markConversationRead,
  type Conversation,
  type ChatMessage,
} from "@/lib/api/ai"
import { endScenario } from "@/lib/api/scenario"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { MarkdownView } from "@/components/markdown-view"
import { PeriodSummaryShare } from "@/components/share/period-summary-share"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

function DividerOrnament() {
  return <div className="divider-ornament" />
}

const quickQuestions = [
  "请根据我的孕期记录，帮我写一段温馨的本周小结",
  "帮我想一句对宝宝说的话",
  "这封信可以怎么改得更温馨",
  "今天有什么值得记录的",
  "帮我整理一下最近的日记",
]

/** 从内容中提取 Markdown 图片 URL */
function extractImageUrls(content: string): string[] {
  const urls: string[] = []
  const re = /!\[[^\]]*\]\(([^)]+)\)/g
  let m
  while ((m = re.exec(content)) !== null) urls.push(m[1].trim())
  return urls
}

/** 去掉内容中的 Markdown 图片语法，保留其余文字 */
function stripImageMarkdown(content: string): string {
  return content.replace(/!\[[^\]]*\]\([^)]+\)/g, "").replace(/\n{3,}/g, "\n\n").trim()
}

/** 根据 AI 回复内容推断分享卡片标题（用于导出文件名与卡片头） */
function deriveShareCardTitle(content: string): string {
  if (!content?.trim()) return "AI 小结"
  const s = content.slice(0, 400)
  if (/本周|小结|周总结|周记/.test(s)) return "本周小结"
  if (/信.*宝宝|宝宝.*信|写给宝宝/.test(s)) return "给宝宝的信"
  if (/未来.*自己|写给未来|未来的我/.test(s)) return "给未来的自己"
  if (/记录灵感|日记|今日/.test(s)) return "记录灵感"
  if (/图生图|生成.*图|宝宝.*样子/.test(s)) return "图生图作品"
  return "AI 小结"
}

// 单条消息：无头像；用户=右侧彩色气泡（图片不包裹，文字在气泡内）；AI=无气泡直接渲染；图片限定尺寸
const MessageBubble = memo(function MessageBubble({
  msg,
  isLast,
  isTyping,
  isIntentRecognizing,
  intentAnchorMessageId,
}: {
  msg: Message
  isLast: boolean
  isTyping: boolean
  isIntentRecognizing: boolean
  intentAnchorMessageId: string | null
}) {
  const skipEmptyStreaming =
    isTyping && isLast && msg.role === "assistant" && !msg.content
  if (skipEmptyStreaming) return null

  if (msg.role === "user") {
    const imageUrls = extractImageUrls(msg.content)
    const textOnly = stripImageMarkdown(msg.content)
    return (
      <div className="space-y-2 flex flex-col items-end animate-in fade-in slide-in-from-bottom-2 duration-200">
        {imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-end max-w-[85%]">
            {imageUrls.map((src, i) => (
              <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="block shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  className="rounded-lg object-contain max-w-[200px] max-h-[200px] w-auto h-auto border border-[var(--card-border)]"
                />
              </a>
            ))}
          </div>
        )}
        {textOnly && (
          <div className="max-w-[85%] rounded-xl px-4 py-3 text-[15px] leading-relaxed border border-[var(--accent-2)]/35 bg-[var(--accent-2-muted)] text-[var(--foreground)]">
            <MarkdownView content={textOnly} className="min-h-[1em]" />
          </div>
        )}
        {!textOnly && imageUrls.length === 0 && (
          <div className="max-w-[85%] rounded-xl px-4 py-3 text-[15px] text-[var(--foreground-muted)] border border-[var(--accent-2)]/35 bg-[var(--accent-2-muted)]">
            （空消息）
          </div>
        )}
        {isIntentRecognizing && intentAnchorMessageId === msg.id && (
          <div className="text-[13px] text-[var(--foreground-muted)] mt-1">
            正在进行意图识别…
          </div>
        )}
      </div>
    )
  }

  const showTypingCursor = isTyping && isLast && msg.role === "assistant"
  return (
    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="max-w-[85%] text-[15px] leading-relaxed text-[var(--foreground)] [&_img]:max-w-[200px] [&_img]:max-h-[200px] [&_img]:object-contain [&_img]:rounded-lg [&_img]:block">
        <MarkdownView
          content={msg.content}
          className="min-h-[1em]"
          stableKey={`${msg.id}-${isTyping && isLast ? "streaming" : "done"}`}
        />
        {showTypingCursor && (
          <span className="inline-block w-2 h-4 ml-0.5 align-middle bg-[var(--foreground)]/70 animate-pulse" aria-hidden />
        )}
        {!isTyping && msg.content && (
          <PeriodSummaryShare summaryText={msg.content} cardTitle={deriveShareCardTitle(msg.content)} />
        )}
      </div>
    </div>
  )
})

export default function ChatPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefillQ = searchParams.get("q")
  const prefillPrompt = searchParams.get("prompt") // 制作同款：仅填入输入框，不自动发送
  const scenarioConversationId = searchParams.get("conversationId")
    ? Number(searchParams.get("conversationId"))
    : null
  const isScenarioMode = searchParams.get("mode") === "scenario"

  // 视图状态：list 显示历史列表，chat 显示对话（制作同款带 prompt 时直接进对话页）
  const [view, setView] = useState<"list" | "chat">(
    prefillQ || prefillPrompt || (scenarioConversationId != null && isScenarioMode) ? "chat" : "list"
  )
  
  // 会话列表
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConversations, setLoadingConversations] = useState(true)
  
  // 当前会话
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isIntentRecognizing, setIsIntentRecognizing] = useState(false)
  const [intentAnchorMessageId, setIntentAnchorMessageId] = useState<string | null>(null)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [publishImageToCommunity, setPublishImageToCommunity] = useState(false)
  const [showPublishSuccess, setShowPublishSuccess] = useState(false)
  /** 来自「制作同款」的提示词仅填框未发送时，必须上传 1 张图才能发送 */
  const [isTemplateMakingMode, setIsTemplateMakingMode] = useState(false)
  /** 无消息时展示的每日暖心语 */
  const [dailyWarm, setDailyWarm] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  
  // 删除确认
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null)
  /** 情景演绎：结束情景并生成报告中 */
  const [endingScenario, setEndingScenario] = useState(false)
  /** 情景演绎：AI 建议结束，展示确认条 */
  const [showScenarioEndSuggest, setShowScenarioEndSuggest] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)

  const isScenarioSession = currentConversation?.scenarioId != null

  const canUseChat = user && (user.userType === "pregnant" || user.isSpouse === true)
  useEffect(() => {
    if (user && !canUseChat) {
      router.replace("/family")
      toast.error("仅孕妇本人或配偶可使用 AI 对话")
    }
  }, [user, canUseChat, router])

  // 加载会话列表（返回列表供情景入口使用）
  const loadConversations = async (): Promise<Conversation[]> => {
    if (!user) return []
    setLoadingConversations(true)
    try {
      const list = await getConversationList(user.userId)
      const arr = list || []
      setConversations(arr)
      return arr
    } catch {
      setConversations([])
      return []
    } finally {
      setLoadingConversations(false)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [user])

  // 情景演绎入口：/chat?conversationId=xxx&mode=scenario — 优先用 sessionStorage 的开场白，否则拉会话列表后打开
  const scenarioOpenDoneRef = useRef(false)
  const scenarioProcessedConvIdRef = useRef<number | null>(null)
  useEffect(() => {
    if (!user || scenarioConversationId == null || !isScenarioMode) return
    // 每次进入新的情景会话都允许处理（避免从列表再进情景时 ref 仍为 true 导致不跳转）
    if (scenarioProcessedConvIdRef.current !== scenarioConversationId) {
      scenarioOpenDoneRef.current = false
      scenarioProcessedConvIdRef.current = scenarioConversationId
    }
    if (scenarioOpenDoneRef.current) return
    scenarioOpenDoneRef.current = true
    const stored = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("yunqi_scenario_pending") : null
    let parsed: { conversationId: number; title: string; scenarioId: number; openingContent: string } | null = null
    if (stored) {
      try {
        parsed = JSON.parse(stored) as typeof parsed
      } catch {
        // ignore
      }
    }
    if (parsed && parsed.conversationId === scenarioConversationId) {
      sessionStorage.removeItem("yunqi_scenario_pending")
      setCurrentConversation({
        conversationId: parsed.conversationId,
        userId: user.userId,
        title: parsed.title,
        scenarioId: parsed.scenarioId,
      })
      setMessages([
        {
          id: `opening-${parsed.conversationId}`,
          role: "assistant",
          content: parsed.openingContent || "来聊聊吧～",
        },
      ])
      setView("chat")
      window.history.replaceState({}, "", "/chat")
      return
    }
    loadConversations().then(async (list) => {
      const conv = list.find((c) => c.conversationId === scenarioConversationId)
      if (conv) {
        await openConversation(conv)
        setView("chat")
        window.history.replaceState({}, "", "/chat")
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once for scenario entry
  }, [user, scenarioConversationId, isScenarioMode])

  // 支持 /chat?q=xxx 自动发起问题（如记录灵感、本周小结入口）
  const prefillSentRef = useRef(false)
  useEffect(() => {
    if (!prefillQ || !user || prefillSentRef.current) return
    prefillSentRef.current = true
    startNewChat()
    window.history.replaceState({}, "", "/chat")
    const timer = setTimeout(() => sendMessage(prefillQ), 50)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prefillQ intentionally run once
  }, [prefillQ, user])

  // 支持 /chat?prompt=xxx 制作同款：仅把提示词填入输入框，不自动发送；进入模板制作模式（须上传 1 张图才能发）
  const prefillPromptDoneRef = useRef(false)
  useEffect(() => {
    if (!prefillPrompt || !user || prefillPromptDoneRef.current) return
    prefillPromptDoneRef.current = true
    try {
      setInput(decodeURIComponent(prefillPrompt))
    } catch {
      setInput(prefillPrompt)
    }
    setIsTemplateMakingMode(true)
    startNewChat()
    setView("chat")
    window.history.replaceState({}, "", "/chat")
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when prompt param present
  }, [prefillPrompt, user])

  const scrollToBottom = useCallback(() => {
    const run = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        run()
        setTimeout(run, 80)
      })
    })
  }, [])

  useEffect(() => {
    if (view === "chat") scrollToBottom()
  }, [view, messages, scrollToBottom])

  // 无消息时拉取每日暖心语
  useEffect(() => {
    if (view !== "chat" || messages.length > 0 || !user) {
      if (messages.length > 0) setDailyWarm(null)
      return
    }
    let cancelled = false
    getDailyWarm(user.userId)
      .then((text) => {
        if (!cancelled && text) setDailyWarm(text)
      })
      .catch(() => {
        if (!cancelled) setDailyWarm(null)
      })
    return () => {
      cancelled = true
    }
  }, [view, messages.length, user])

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previewUrls])

  const onSelectImages = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const remain = Math.max(0, 4 - selectedImages.length)
    if (remain <= 0) {
      toast.error("单次最多发送 4 张图片")
      return
    }
    const accepted = files.slice(0, remain)
    const merged = [...selectedImages, ...accepted]
    previewUrls.forEach((url) => URL.revokeObjectURL(url))
    const nextPreview = merged.map((f) => URL.createObjectURL(f))
    setSelectedImages(merged)
    setPreviewUrls(nextPreview)
    if (merged.length !== 1) setPublishImageToCommunity(false)
  }

  const removePreviewImage = (idx: number) => {
    URL.revokeObjectURL(previewUrls[idx])
    const nextFiles = selectedImages.filter((_, i) => i !== idx)
    const nextUrls = previewUrls.filter((_, i) => i !== idx)
    setSelectedImages(nextFiles)
    setPreviewUrls(nextUrls)
  }

  // 开始新对话
  const startNewChat = () => {
    setCurrentConversation(null)
    setMessages([])
    setView("chat")
  }

  // 打开历史会话
  const openConversation = async (conv: Conversation) => {
    if (!user) return
    setCurrentConversation(conv)
    setView("chat")
    setShowScenarioEndSuggest(false)
    try {
      const history = await getConversationHistory(user.userId, conv.conversationId)
      const msgs: Message[] = (history || []).map((m: ChatMessage) => ({
        id: `msg-${m.messageId}`,
        role: m.role,
        content: m.content,
      }))
      setMessages(msgs)
      markConversationRead(user.userId, conv.conversationId).catch(() => {})
      setConversations((prev) =>
        prev.map((c) =>
          c.conversationId === conv.conversationId ? { ...c, hasUnreadAi: false } : c
        )
      )
      window.dispatchEvent(new Event("chat-conversation-read"))
      setTimeout(() => scrollToBottom(), 120)
    } catch {
      setMessages([])
    }
  }

  // 返回列表（情景会话时返回情景首页）
  const backToList = () => {
    if (isScenarioSession) {
      router.push("/scenario")
      return
    }
    setView("list")
    loadConversations()
  }

  // 结束情景并生成报告
  const handleEndScenario = async () => {
    if (!user || !currentConversation?.conversationId || endingScenario) return
    setEndingScenario(true)
    try {
      const report = await endScenario(user.userId, currentConversation.conversationId, "user_confirm")
      toast.success("情景报告已生成")
      router.push(`/scenario/reports/${report.reportId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "结束情景失败")
    } finally {
      setEndingScenario(false)
    }
  }

  // 删除会话
  const handleDelete = async () => {
    if (!user || !deleteTarget) return
    try {
      await deleteConversation(user.userId, deleteTarget.conversationId)
      setConversations((prev) =>
        prev.filter((c) => c.conversationId !== deleteTarget.conversationId)
      )
      if (currentConversation?.conversationId === deleteTarget.conversationId) {
        setCurrentConversation(null)
        setMessages([])
      }
    } catch {
      // ignore
    } finally {
      setDeleteTarget(null)
    }
  }

  // 发送消息（流式，收到即显示）
  const sendMessage = async (text: string, images: File[] = selectedImages) => {
    if ((!text.trim() && images.length === 0) || !user || isTyping) return
    // 模板制作（制作同款）：必须上传 1 张图片才能发送
    if (isTemplateMakingMode && images.length === 0) {
      toast.error("请先上传一张图片用于图生图")
      return
    }
    if (isTemplateMakingMode && images.length >= 1) setIsTemplateMakingMode(false)

    const localImageMarkdown = previewUrls.map((url) => `![用户上传图片](${url})`).join("\n")
    const userContent = `${localImageMarkdown}${localImageMarkdown && text.trim() ? "\n\n" : ""}${text.trim()}`.trim()
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userContent || "（空消息）",
    }

    setMessages((prev) => [...prev, userMsg])
    setInput("")
    const urlsToRevoke = [...previewUrls]
    setSelectedImages([])
    setPreviewUrls([])
    if (imageInputRef.current) imageInputRef.current.value = ""
    setIsTyping(true)
    if (!isScenarioSession) {
      setIsIntentRecognizing(true)
      setIntentAnchorMessageId(userMsg.id)
    }
    scrollToBottom()

    const aiMsgId = `ai-${Date.now()}`
    const aiMsg: Message = {
      id: aiMsgId,
      role: "assistant",
      content: "",
    }
    setMessages((prev) => [...prev, aiMsg])
    scrollToBottom()

    try {
      let convId = currentConversation?.conversationId
      if (!convId) {
        const conv = await createConversation(user.userId, text.trim().slice(0, 20))
        convId = conv.conversationId
        setCurrentConversation(conv)
      }

      let hasReceivedChunk = false
      setShowScenarioEndSuggest(false)
      await chatStream(
        user.userId,
        convId,
        text.trim(),
        (chunk) => {
          if (!hasReceivedChunk) {
            hasReceivedChunk = true
            setIsIntentRecognizing(false)
            setIntentAnchorMessageId(null)
          }
          const normalizedChunk = chunk.replace(/\r/g, "").replace(/\\n/g, "\n")
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId ? { ...m, content: m.content + normalizedChunk } : m
            )
          )
        },
        images,
        user.userType === "pregnant" && publishImageToCommunity && images.length === 1,
        isScenarioSession ? () => setShowScenarioEndSuggest(true) : undefined
      )
      // 流式结束后立即使用后端持久化内容回填，避免必须退出重进才渲染正常
      try {
        const history = await getConversationHistory(user.userId, convId)
        const msgs: Message[] = (history || []).map((m: ChatMessage) => ({
          id: `msg-${m.messageId}`,
          role: m.role,
          content: m.content,
        }))
        setMessages(msgs)
        urlsToRevoke.forEach((url) => URL.revokeObjectURL(url))
      } catch {
        // ignore history refresh failure；未刷新成功时暂不 revoke，避免用户消息中的图片立刻失效
      }
      try {
        if (localStorage.getItem("yunqi_notify_ai_reply") !== "false") {
          toast.success("AI 已回复")
        }
      } catch {
        // ignore
      }
      // 社区发布成功时显示发表动画
      if (publishImageToCommunity && images?.length === 1) {
        setShowPublishSuccess(true)
        setTimeout(() => setShowPublishSuccess(false), 2200)
        toast.success("已发布到社区")
      }
    } catch (err) {
      setIsIntentRecognizing(false)
      setIntentAnchorMessageId(null)
      const errMsg =
        err instanceof Error ? err.message : "抱歉，网络连接出现问题，请稍后再试。"
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId ? { ...m, content: errMsg } : m
        )
      )
      toast.error(errMsg)
    } finally {
      setIsIntentRecognizing(false)
      setIntentAnchorMessageId(null)
      setIsTyping(false)
      scrollToBottom()
      setPublishImageToCommunity(false)
    }
  }

  // 历史列表视图 — calm, spacious, journaling-like
  if (view === "list") {
    return (
      <div className="flex h-dvh flex-col bg-[var(--background)]">
        {/* Header */}
        <div className="border-b border-[var(--card-border)] bg-[var(--card)] px-6 pt-14 pb-4">
          <h1
            className="text-[1.2rem] font-semibold text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            孕期小伴
          </h1>
          <p className="mt-1 text-caption">陪你整理记录、写信给宝宝、回顾时光</p>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loadingConversations ? (
            <div className="card-elevated overflow-hidden rounded-xl">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse border-b border-[var(--card-border)] bg-[var(--card)] last:border-b-0" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--accent-1)]/30 bg-[var(--accent-1-muted)]">
                <MessageSquare className="h-6 w-6 text-[var(--accent-1)]" strokeWidth={1.75} />
              </div>
              <h2 className="mt-6 text-[1.1rem] font-semibold text-[var(--foreground)]">
                暂无历史对话
              </h2>
              <p className="mt-2 max-w-xs text-caption">
                孕期小伴陪你记录孕期点滴，点击下方开始新对话
              </p>
              <button
                onClick={startNewChat}
                className="mt-8 w-full max-w-sm rounded-xl px-6 py-4 text-[15px] font-semibold transition-opacity active:opacity-90"
                style={{ backgroundColor: "var(--accent-2)", color: "var(--foreground)" }}
              >
                + 开始新对话
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={startNewChat}
                className="mb-6 w-full rounded-xl border border-[var(--accent-1)]/50 bg-[var(--accent-1-muted)] px-6 py-3.5 text-[14px] font-medium text-[var(--accent-1)] transition-colors active:opacity-90"
              >
                + 开始新对话
              </button>
              <div className="card-elevated overflow-hidden rounded-xl">
                {conversations.map((conv, idx) => (
                  <div key={conv.conversationId}>
                    {idx > 0 && <DividerOrnament />}
                    <div className="flex items-center gap-3 p-4">
                    <button
                      onClick={() => openConversation(conv)}
                      className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    >
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--accent-1)]/30 bg-[var(--accent-1-muted)]">
                        <Bot className="h-5 w-5 text-[var(--accent-1)]" strokeWidth={1.75} />
                        {conv.hasUnreadAi && (
                          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[var(--critical)]" aria-label="未读" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="truncate text-[15px] font-medium text-[var(--foreground)]">
                          {conv.title || "新对话"}
                        </p>
                        <p className="mt-0.5 truncate text-micro">
                          {conv.updateTime || conv.createTime
                            ? format(
                                new Date(conv.updateTime || conv.createTime!),
                                "M月d日 HH:mm",
                                { locale: zhCN }
                              )
                            : ""}
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(conv)}
                      className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground-muted)] transition-colors hover:bg-[var(--critical-muted)] hover:text-[var(--critical)]"
                      aria-label="删除"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent className="border-[var(--card-border)]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[var(--foreground)]">确定删除这个对话？</AlertDialogTitle>
              <AlertDialogDescription className="text-caption">
                删除后将无法恢复，对话中的所有消息都会被清除。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-[var(--critical)] text-white hover:opacity-90"
              >
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  // 对话视图
  return (
    <div className="relative flex h-dvh flex-col bg-[var(--background)]">
      {/* 社区发布成功动画 overlay */}
      {showPublishSuccess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-300"
          aria-hidden="true"
        >
          <div
            className="flex flex-col items-center gap-3 rounded-2xl bg-[var(--card)] px-8 py-6 shadow-xl animate-in zoom-in-95 duration-300"
            style={{ border: "1px solid var(--card-border)" }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-2)]/20">
              <CheckCircle className="h-8 w-8 text-[var(--accent-2)]" strokeWidth={2} />
            </div>
            <p className="text-base font-semibold text-[var(--foreground)]">已发布到社区</p>
          </div>
        </div>
      )}
      {/* Header — 固定在顶部 */}
      <div className="sticky top-0 z-20 shrink-0 border-b border-[var(--card-border)] bg-[var(--card)]/98 backdrop-blur-sm px-6 pt-14 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={backToList}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground-muted)] transition-colors active:bg-[var(--muted)]"
            aria-label="返回"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <h1
            className="min-w-0 flex-1 truncate text-[1.1rem] font-semibold text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {isScenarioSession
              ? `情景：${currentConversation?.title ?? "情景演绎"}`
              : currentConversation?.title || "新对话"}
          </h1>
          {isScenarioSession && (
            <button
              onClick={handleEndScenario}
              disabled={endingScenario}
              className="shrink-0 rounded-lg border border-[var(--accent-2)]/50 bg-[var(--accent-2-muted)] px-3 py-2 text-[13px] font-medium text-[var(--accent-2)] transition-colors active:opacity-90 disabled:opacity-60"
            >
              {endingScenario ? "生成中…" : "结束情景"}
            </button>
          )}
        </div>
      </div>

      {/* Messages — 预留底部空间给固定输入框 */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-6 pb-[180px]">
        {messages.length === 0 && !isTyping && (
          <div className="flex min-h-[40vh] flex-col items-center justify-center text-center animate-in fade-in duration-300">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--accent-1)]/30 bg-[var(--accent-1-muted)]">
              <Bot className="h-6 w-6 text-[var(--accent-1)]" strokeWidth={1.75} />
            </div>
            {dailyWarm && (
              <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-[var(--foreground)]/90 italic">
                {dailyWarm}
              </p>
            )}
            <h2 className="mt-6 text-[1.05rem] font-semibold text-[var(--foreground)]">
              孕期小伴
            </h2>
            <p className="mt-2 max-w-xs text-caption">
              你好呀～我是你的孕期小伴，可以陪你整理记录、写信给宝宝、回顾时光。
            </p>
            <div className="mt-8 w-full max-w-sm">
              <p className="mb-2 text-micro font-medium">试试问我</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {quickQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5 text-left text-[13px] font-medium text-[var(--foreground)] transition-all duration-200 hover:border-[var(--accent-1)]/40 active:bg-[var(--muted)]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isLast={i === messages.length - 1}
              isTyping={isTyping}
              isIntentRecognizing={isIntentRecognizing}
              intentAnchorMessageId={intentAnchorMessageId}
            />
          ))}

        </div>
      </div>

      {/* Input — 固定在底部、导航栏上方 */}
      <div className="fixed left-0 right-0 bottom-20 z-30 mx-auto max-w-lg border-t border-[var(--card-border)] bg-[var(--card)]/98 backdrop-blur-sm px-4 py-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4">
        {isScenarioSession && showScenarioEndSuggest && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-[var(--accent-2)]/40 bg-[var(--accent-2-muted)] px-3 py-2">
            <span className="text-[13px] text-[var(--foreground)]">AI 建议结束情景，是否生成报告？</span>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setShowScenarioEndSuggest(false)}
                className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--foreground-muted)]"
              >
                继续对话
              </button>
              <button
                type="button"
                onClick={handleEndScenario}
                disabled={endingScenario}
                className="rounded-lg border border-[var(--accent-2)]/50 bg-[var(--accent-2)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--foreground)] disabled:opacity-60"
              >
                {endingScenario ? "生成中…" : "结束并生成报告"}
              </button>
            </div>
          </div>
        )}
        {previewUrls.length > 0 && (
          <div className="mb-3 grid grid-cols-2 gap-2">
            {previewUrls.map((url, idx) => (
              <div key={url} className="relative overflow-hidden rounded-lg border border-[var(--card-border)] bg-[var(--background)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`待发送图片${idx + 1}`} className="h-28 w-full object-contain bg-black/5" />
                <button
                  onClick={() => removePreviewImage(idx)}
                  className="absolute right-1 top-1 rounded-full bg-black/55 p-1 text-white"
                  aria-label="移除图片"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        {selectedImages.length === 1 && user?.userType === "pregnant" && (
          <label className="mb-2 flex items-center gap-2 text-[13px] text-[var(--foreground-muted)]">
            <input
              type="checkbox"
              checked={publishImageToCommunity}
              onChange={(e) => setPublishImageToCommunity(e.target.checked)}
            />
            图生图完成后公开到社区（公开提示词、原图、结果图）
          </label>
        )}
        <div className="flex items-center gap-2">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onSelectImages}
          />
          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={isTyping}
            className="flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground-muted)]"
            aria-label="上传图片"
          >
            <ImagePlus className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <div className="flex min-h-[44px] flex-1 items-center">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(input, selectedImages)
                }
              }}
              placeholder={
                isTemplateMakingMode
                  ? "请输入提示词并上传一张图片"
                  : isScenarioSession
                    ? "输入消息… 结束可点「结束情景」生成报告"
                    : "输入消息..."
              }
              rows={1}
              className="min-h-[44px] w-full resize-none rounded-xl border border-[var(--card-border)] bg-[var(--background)] py-3 pl-4 pr-4 text-body leading-tight placeholder:text-[var(--foreground-muted)] focus:border-[var(--accent-1)] focus:outline-none"
            />
          </div>
          <button
            onClick={() => sendMessage(input, selectedImages)}
            disabled={!user || (!input.trim() && selectedImages.length === 0) || isTyping || (isTemplateMakingMode && selectedImages.length === 0)}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all",
              (input.trim() || selectedImages.length > 0) && !isTyping && !(isTemplateMakingMode && selectedImages.length === 0)
                ? "border border-[var(--accent-2)]/50 bg-[var(--accent-2)] text-[var(--foreground)] active:opacity-90"
                : "border border-[var(--card-border)] bg-[var(--muted)] text-[var(--foreground-muted)]"
            )}
            aria-label="发送"
          >
            <Send className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  )
}
