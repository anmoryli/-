// 浏览器端用同源代理避免 CORS；服务端/直连时用完整地址
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== "undefined" ? "/api-backend" : "http://localhost:9677")

export function getApiBaseUrl() {
  return BASE_URL
}
if (typeof window !== "undefined") {
  console.log("[API] BASE_URL =", BASE_URL)
}

const DEBUG = true
const log = (tag: string, ...args: unknown[]) => {
  if (DEBUG) console.log(`[API] ${tag}`, ...args)
}

/** 将日期字符串转为后端 LocalDateTime 可解析的格式（yyyy-MM-dd -> yyyy-MM-ddT00:00:00） */
export function toLocalDateTimeISO(value: string | undefined): string | undefined {
  if (value == null || value === "") return undefined
  if (value.includes("T")) return value
  return `${value}T00:00:00`
}

/** 与后端 Result 一致：code, message, data, timestamp */
export interface ApiResult<T> {
  code: number
  errorCode?: string
  message?: string
  msg?: string
  data: T
  timestamp?: number
}

function getResultMessage(result: ApiResult<unknown>): string {
  const byErrorCode: Record<string, string> = {
    NOT_FOUND: "资源不存在",
    CONFLICT: "数据冲突，请检查后重试",
    FORBIDDEN: "无权限执行该操作",
    VALIDATION_ERROR: "参数不合法，请检查输入",
    AI_SERVICE_ERROR: "AI 服务暂时不可用，请稍后重试",
    INTERNAL_ERROR: "系统繁忙，请稍后重试",
  }
  if (result.errorCode && byErrorCode[result.errorCode]) return byErrorCode[result.errorCode]
  return result.message ?? result.msg ?? "请求失败"
}

async function handleResponse<T>(res: Response, url: string, method: string): Promise<T> {
  const text = await res.text()
  log("response", { url: url.slice(0, 80), method, status: res.status, bodyPreview: text.slice(0, 200) })

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}: ${res.statusText}`
    try {
      const body = JSON.parse(text) as ApiResult<unknown>
      errMsg = getResultMessage(body) || errMsg
    } catch {
      if (res.status >= 500) errMsg = "系统繁忙，请稍后重试"
    }
    log("error", errMsg)
    throw new Error(errMsg)
  }

  let result: ApiResult<T>
  try {
    result = JSON.parse(text) as ApiResult<T>
  } catch (e) {
    log("error", "JSON parse failed", e, text.slice(0, 200))
    throw new Error("响应格式错误")
  }

  if (result.code !== 200) {
    const errMsg = getResultMessage(result)
    log("error", "code !== 200", result.code, errMsg)
    throw new Error(errMsg)
  }

  log("success", { url: url.slice(0, 60), data: result.data != null ? "(present)" : result.data })
  return result.data
}

/**
 * POST request with FormData body
 */
export async function apiPost<T>(
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  const url = `${BASE_URL}${path}`
  log("request", "POST", url, params ?? {})

  const formData = new FormData()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value))
      }
    })
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      body: formData,
    })
    return await handleResponse<T>(res, url, "POST")
  } catch (e) {
    log("error", "apiPost failed (possible CORS or network)", path, e)
    throw e
  }
}

/**
 * GET request
 */
export async function apiGet<T>(
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
  }

  const query = searchParams.toString()
  const url = `${BASE_URL}${path}${query ? `?${query}` : ""}`
  log("request", "GET", url)

  try {
    const res = await fetch(url, { method: "GET" })
    return await handleResponse<T>(res, url, "GET")
  } catch (e) {
    log("error", "apiGet failed (possible CORS or network)", path, e)
    throw e
  }
}

/** 可选：请求超时（毫秒），用于长耗时接口如情景结束生成报告 */
export interface ApiPostJsonOptions {
  timeoutMs?: number
}

/**
 * POST request with JSON body
 */
export async function apiPostJson<T>(
  path: string,
  body: unknown,
  options?: ApiPostJsonOptions
): Promise<T> {
  const url = `${BASE_URL}${path}`
  log("request", "POST JSON", url, options?.timeoutMs ? `timeout=${options.timeoutMs}ms` : "")
  const timeoutMs = options?.timeoutMs
  const controller =
    typeof AbortController !== "undefined" && timeoutMs != null && timeoutMs > 0
      ? new AbortController()
      : null
  const timeoutId =
    controller != null && timeoutMs != null
      ? setTimeout(() => controller.abort(), timeoutMs)
      : undefined
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller?.signal,
    })
    if (timeoutId != null) clearTimeout(timeoutId)
    return await handleResponse<T>(res, url, "POST")
  } catch (e) {
    if (timeoutId != null) clearTimeout(timeoutId)
    if (e instanceof Error && e.name === "AbortError") {
      log("error", "apiPostJson timeout", path, timeoutMs)
      throw new Error("请求超时，请稍后重试")
    }
    log("error", "apiPostJson failed", path, e)
    throw e
  }
}

/**
 * PUT request with JSON body
 */
export async function apiPutJson<T>(path: string, body: unknown): Promise<T> {
  const url = `${BASE_URL}${path}`
  log("request", "PUT JSON", url)
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    return await handleResponse<T>(res, url, "PUT")
  } catch (e) {
    log("error", "apiPutJson failed", path, e)
    throw e
  }
}

/**
 * PUT request with FormData body
 */
export async function apiPut<T>(
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  const url = `${BASE_URL}${path}`
  log("request", "PUT", url, params ?? {})

  const formData = new FormData()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value))
      }
    })
  }

  try {
    const res = await fetch(url, { method: "PUT", body: formData })
    return await handleResponse<T>(res, url, "PUT")
  } catch (e) {
    log("error", "apiPut failed", path, e)
    throw e
  }
}

/**
 * DELETE request with FormData body
 */
export async function apiDelete<T>(
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  const url = `${BASE_URL}${path}`
  log("request", "DELETE", url, params ?? {})

  const formData = new FormData()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value))
      }
    })
  }

  try {
    const res = await fetch(url, { method: "DELETE", body: formData })
    return await handleResponse<T>(res, url, "DELETE")
  } catch (e) {
    log("error", "apiDelete failed", path, e)
    throw e
  }
}

/**
 * DELETE request with query params (for @RequestParam in Spring)
 */
export async function apiDeleteWithQuery<T>(
  path: string,
  params: Record<string, string | number>
): Promise<T> {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => searchParams.append(key, String(value)))
  const query = searchParams.toString()
  const url = `${BASE_URL}${path}${query ? `?${query}` : ""}`
  log("request", "DELETE", url)
  try {
    const res = await fetch(url, { method: "DELETE" })
    return await handleResponse<T>(res, url, "DELETE")
  } catch (e) {
    log("error", "apiDeleteWithQuery failed", path, e)
    throw e
  }
}

/**
 * Upload file(s) with FormData
 */
export async function apiUpload<T>(
  path: string,
  files: { key: string; file: File | File[] },
  params?: Record<string, string | number | undefined>,
  method: "POST" | "PUT" = "POST"
): Promise<T> {
  const url = `${BASE_URL}${path}`
  log("request", method, url, { fileKey: files.key, params: params ?? {} })

  const formData = new FormData()
  if (Array.isArray(files.file)) {
    files.file.forEach((f) => formData.append(files.key, f))
  } else {
    formData.append(files.key, files.file)
  }
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value))
      }
    })
  }

  try {
    const res = await fetch(url, { method, body: formData })
    return await handleResponse<T>(res, url, method)
  } catch (e) {
    log("error", "apiUpload failed", path, e)
    throw e
  }
}
