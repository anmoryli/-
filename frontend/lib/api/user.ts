import { apiGet, apiPost, apiPut, apiDelete, apiUpload, toLocalDateTimeISO } from "@/lib/api"
import { USE_MOCK, mockDelay, mockRegister, mockLogin } from "@/lib/mock-data"

const log = (tag: string, ...args: unknown[]) => console.log("[API:user]", tag, ...args)

export interface User {
  userId: number
  username: string
  password?: string
  email?: string
  userType?: "pregnant" | "family_member"
  lastMenstrualDate?: string
  pregnancyTime?: string
  avatarUrl?: string
  createTime?: string
  updateTime?: string
  createdAt?: string
  /** 注册时选择的默认关系（配偶/婆婆/妈妈/爸爸等），加入家庭时沿用 */
  defaultRelationship?: string
  /** 是否为某家庭的配偶（后端根据 family_member 表填充），配偶可开放 AI 对话 */
  isSpouse?: boolean
}

/** 用户注册：孕妇本人需填怀孕日、预产期；家庭成员可选 defaultRelationship 供加入家庭时沿用 */
export async function register(
  username: string,
  password: string,
  email: string | undefined,
  userType: "pregnant" | "family_member",
  lastMenstrualDate: string | undefined,
  pregnancyTime: string | undefined,
  defaultRelationship?: string
) {
  log("register", { username, email: email ?? "(none)", userType, lastMenstrualDate, pregnancyTime, defaultRelationship })
  if (USE_MOCK) {
    await mockDelay()
    const out = mockRegister(username, password, email, lastMenstrualDate ?? "", pregnancyTime ?? "")
    log("register mock ok", out)
    return out
  }
  try {
    const params: Record<string, string | undefined> = {
      username,
      password,
      email: email || undefined,
      userType,
    }
    if (lastMenstrualDate) params.lastMenstrualDate = lastMenstrualDate.includes("T") ? lastMenstrualDate.slice(0, 10) : lastMenstrualDate
    if (pregnancyTime) params.pregnancyTime = toLocalDateTimeISO(pregnancyTime)
    if (userType === "family_member" && defaultRelationship) params.defaultRelationship = defaultRelationship
    const out = await apiPost<User>("/api/user/register", params)
    log("register ok", out)
    return out
  } catch (e) {
    log("register error", e)
    throw e
  }
}

/** 更新用户角色（孕妇/家庭成员） */
export async function updateUserType(userId: number, userType: "pregnant" | "family_member") {
  return apiPut<User>("/api/user/updateUserType", { userId, userType })
}

/** 修改用户名 */
export async function updateUsername(userId: number, username: string) {
  if (USE_MOCK) {
    await mockDelay()
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem("pregnancy_user") : null
    if (stored) {
      const user = JSON.parse(stored)
      user.username = username.trim()
      localStorage.setItem("pregnancy_user", JSON.stringify(user))
      return user
    }
  }
  return apiPut<User>("/api/user/updateUsername", { userId, username })
}

/** 更新怀孕日与预产期 */
export async function updatePregnancy(
  userId: number,
  lastMenstrualDate: string,
  pregnancyTime: string
) {
  if (USE_MOCK) {
    await mockDelay()
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem("pregnancy_user") : null
    if (stored) {
      const user = JSON.parse(stored)
      user.lastMenstrualDate = lastMenstrualDate
      user.pregnancyTime = pregnancyTime
      localStorage.setItem("pregnancy_user", JSON.stringify(user))
    }
    return
  }
  await apiPut<unknown>("/api/user/updatePregnancy", {
    userId,
    lastMenstrualDate: lastMenstrualDate.slice(0, 10),
    pregnancyTime: toLocalDateTimeISO(pregnancyTime),
  })
}

/** 获取当前用户信息（含 isSpouse），用于刷新权限（如改为配偶后更新底部导航） */
export async function getById(userId: number) {
  return apiGet<User>("/api/user/getById", { userId })
}

/** 用户登录 */
export async function login(username: string, password: string) {
  log("login", { username })
  if (USE_MOCK) {
    await mockDelay()
    const out = mockLogin(username, password)
    log("login mock ok", out)
    return out
  }
  try {
    const out = await apiPost<User>("/api/user/login", { username, password })
    log("login ok", out)
    return out
  } catch (e) {
    log("login error", e)
    throw e
  }
}

/** 绑定邮箱 */
export async function bindEmail(userId: number, email: string) {
  log("bindEmail", { userId, email })
  return apiPut<unknown>("/api/user/bindEmail", { userId, email })
}

/** 找回密码 */
export async function findPassword(email: string, newPassword: string) {
  log("findPassword", { email })
  return apiPut<unknown>("/api/user/findPassword", { email, newPassword })
}

/** 修改密码（需提供原密码） */
export async function changePassword(userId: number, oldPassword: string, newPassword: string) {
  log("changePassword", { userId })
  return apiPut<unknown>("/api/user/changePassword", { userId, oldPassword, newPassword })
}

/** 上传头像（新用户无头像时使用） */
export async function uploadAvatar(userId: number, file: File) {
  log("uploadAvatar", { userId, fileName: file.name })
  return apiUpload<User>("/api/user/uploadAvatar", { key: "file", file }, { userId })
}

/** 更新头像（替换现有头像） */
export async function updateAvatar(userId: number, file: File) {
  log("updateAvatar", { userId, fileName: file.name })
  return apiUpload<User>("/api/user/updateAvatar", { key: "file", file }, { userId }, "PUT")
}

/** 注销用户 */
export async function deleteUser(userId: number) {
  log("deleteUser", { userId })
  return apiDelete<unknown>("/api/user/deleteUser", { userId })
}

/** 获取数据收集偏好（隐私设置） */
export async function getDataCollectionEnabled(userId: number): Promise<boolean> {
  const data = await apiGet<boolean>("/api/user/privacy/dataCollection", { userId })
  return data === true
}

/** 更新数据收集偏好（隐私设置） */
export async function updateDataCollectionEnabled(userId: number, enabled: boolean) {
  return apiPut<unknown>("/api/user/privacy/dataCollection", { userId, enabled: enabled ? "true" : "false" })
}

