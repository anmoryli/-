import { NextRequest } from "next/server"
import { Agent, fetch as undiciFetch } from "undici"

const BACKEND = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:9677"

/** 后端可能较慢（RAG、意图识别等），延长等待响应头时间，避免 Node 默认约 5 分钟 HeadersTimeout */
const STREAM_AGENT = new Agent({
  headersTimeout: 10 * 60 * 1000, // 10 分钟
  bodyTimeout: 0, // 流式响应不限制 body 超时
})

/** 流式代理：转发到后端并逐块透传，避免 Next.js rewrite 缓冲 */
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  // 使用 undici 的 FormData 重建 body，避免与 undiciFetch 序列化差异导致后端收不到 userId 等字段
  const { FormData: UndiciFormData } = await import("undici")
  const body = new UndiciFormData()
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string") {
      body.append(k, v)
    } else {
      body.append(k, v as Blob)
    }
  }

  const res = await undiciFetch(`${BACKEND}/api/ai/chat-stream`, {
    method: "POST",
    body,
    dispatcher: STREAM_AGENT,
  })

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "")
    return new Response(text || `Error ${res.status}`, { status: res.status })
  }

  return new Response(res.body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  })
}
