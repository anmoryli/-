import { getApiBaseUrl } from "@/lib/api"
const BASE_URL = getApiBaseUrl()
const log = (tag: string, ...args: unknown[]) => console.log("[API:captcha]", tag, ...args)

/** 获取验证码图片地址 */
export function getCaptchaUrl() {
  const url = `${BASE_URL}/captcha/getCaptcha?t=${Date.now()}`
  log("getCaptchaUrl", url)
  return url
}

/** 验证码校验（GET，参数 mycaptcha 与后端一致；session 依赖 Cookie 时可不传） */
export async function checkCaptcha(mycaptcha: string, session?: string): Promise<boolean> {
  const params = new URLSearchParams({ mycaptcha })
  if (session != null && session !== "") params.set("session", session)
  const url = `${BASE_URL}/captcha/check?${params.toString()}`
  log("checkCaptcha", { url: url.slice(0, 80), mycaptcha: mycaptcha ? "(set)" : "(empty)" })

  try {
    const res = await fetch(url, { method: "GET", credentials: "include" })
    const text = await res.text()
    log("checkCaptcha response", { status: res.status, bodyPreview: text.slice(0, 120) })

    if (!res.ok) {
      log("checkCaptcha error", "!res.ok", res.status)
      return false
    }

    let body: unknown
    try {
      body = JSON.parse(text)
    } catch {
      log("checkCaptcha error", "JSON parse failed", text.slice(0, 80))
      return false
    }

    if (typeof body === "boolean") {
      log("checkCaptcha ok", "boolean", body)
      return body
    }
    const code = (body as { code?: number })?.code
    const data = (body as { data?: unknown })?.data
    const ok = code === 200 && (data === true || data === undefined)
    log("checkCaptcha ok", "Result", { code, ok })
    return ok
  } catch (e) {
    log("checkCaptcha error", "fetch failed (possible CORS or network)", e)
    return false
  }
}
