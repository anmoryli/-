import { NextRequest } from "next/server"

/** 白名单：仅代理可信域名，避免滥用 */
const ALLOWED_HOSTS = [
  "aliyuncs.com",
  "oss-",
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/^https?:\/\//, "").split("/")[0] ?? "localhost",
]

function isAllowedUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.protocol !== "https:" && u.protocol !== "http:") return false
    const host = u.hostname.toLowerCase()
    return ALLOWED_HOSTS.some((h) => host.includes(h))
  } catch {
    return false
  }
}

/** 代理文件并强制 inline 预览，解决 OSS Content-Disposition: attachment 导致直接下载的问题 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")
  if (!url || !isAllowedUrl(url)) {
    return new Response("Invalid url", { status: 400 })
  }

  try {
    const res = await fetch(url, {
      headers: { Accept: "*/*" },
      cache: "no-store",
    })
    if (!res.ok) {
      return new Response(await res.text().catch(() => ""), { status: res.status })
    }
    let contentType = res.headers.get("Content-Type") || ""
    if (!contentType || contentType === "application/octet-stream") {
      const pathname = new URL(url).pathname.toLowerCase()
      if (/\.(mp4|m4v|mov)(\?|$)/.test(pathname)) contentType = "video/mp4"
      else if (/\.webm(\?|$)/.test(pathname)) contentType = "video/webm"
      else if (/\.mp3(\?|$)/.test(pathname)) contentType = "audio/mpeg"
      else if (/\.(m4a|aac)(\?|$)/.test(pathname)) contentType = "audio/mp4"
      else if (/\.wav(\?|$)/.test(pathname)) contentType = "audio/wav"
      else if (/\.pdf(\?|$)/.test(pathname)) contentType = "application/pdf"
      else contentType = contentType || "application/octet-stream"
    }
    const buffer = await res.arrayBuffer()
    const disposition = res.headers.get("Content-Disposition")
    let filename: string | null = null
    if (disposition?.includes("filename=")) {
      const m = disposition.match(/filename[*]?=(?:UTF-8'')?["']?([^"'\s;]+)/i)
      if (m) filename = decodeURIComponent(m[1].trim())
    }
    if (!filename) {
      try {
        const pathname = new URL(url).pathname
        const seg = pathname.split("/").pop()
        if (seg) filename = seg
      } catch {
        filename = "file"
      }
    }
    const safeName = filename ? `; filename="${filename.replace(/"/g, "%22")}"` : ""
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline${safeName}`,
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch (e) {
    console.error("[file-proxy]", e)
    return new Response("Proxy error", { status: 502 })
  }
}
