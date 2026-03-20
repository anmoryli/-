import { NextRequest } from "next/server"

const BACKEND = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:9677"

/**
 * 代理 B超 PDF 解析请求，解决手机端经 rewrite 上传可能失败的问题
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const body = new FormData()
    for (const [key, value] of formData.entries()) {
      body.append(key, value)
    }
    const res = await fetch(`${BACKEND}/api/health/fetalRecords/parsePdf`, {
      method: "POST",
      body,
    })
    const text = await res.text()
    return new Response(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
    })
  } catch (e) {
    console.error("[parse-fetal-pdf]", e)
    return new Response(
      JSON.stringify({ code: 500, message: "解析服务异常", data: null }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
