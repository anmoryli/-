# 孕期宝 API 文档

> 基于 Spring Boot 后端 v2.0
> 最后更新：2026-03-20
> 基础 URL: `http://localhost:8080` （请根据实际部署环境调整）

---

## 一、概述

### 1.1 响应格式
所有接口返回统一格式的 JSON 对象：

```json
{
  "code": 200,
  "message": "操作成功",
  "errorCode": null,
  "data": { /* 接口具体数据 */ },
  "timestamp": 1678886400000
}
```

**状态码说明**：
- `200`: 成功
- `400`: 请求参数错误
- `401`: 未登录或 Token 过期
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

### 1.2 认证方式
大部分接口需要 JWT Token 认证，Token 通过登录接口获取，需要在请求头中携带：

```
Authorization: Bearer <token>
```

### 1.3 公共参数
- 所有时间参数格式：`yyyy-MM-dd`（日期）或 `yyyy-MM-dd HH:mm:ss`（日期时间）
- 分页参数：`page`（页码，从1开始）、`pageSize`（每页数量，默认10）

---

## 二、用户认证与管理

### 2.1 UserController

**基础路径**：`/api/user`

| 端点 | 方法 | 描述 | 参数 | 请求示例 |
|------|------|------|------|----------|
| `/register` | POST | 用户注册 | `username` (必填): 用户名<br>`password` (必填): 密码<br>`email` (可选): 邮箱<br>`userType` (可选): 用户类型，默认 `pregnant`<br>`lastMenstrualDate` (可选): 末次月经日期<br>`pregnancyTime` (可选): 怀孕时间<br>`defaultRelationship` (可选): 默认家庭成员关系 | `POST /api/user/register?username=test&password=123456&userType=pregnant` |
| `/login` | POST | 用户登录 | `username` (必填): 用户名<br>`password` (必填): 密码 | `POST /api/user/login?username=test&password=123456` |
| `/bindEmail` | PUT | 绑定邮箱 | `email` (必填): 邮箱地址 | `PUT /api/user/bindEmail?email=test@example.com` |
| `/findPassword` | PUT | 找回密码 | `email` (必填): 邮箱地址<br>`password` (必填): 新密码 | `PUT /api/user/findPassword?email=test@example.com&password=new123` |
| `/changePassword` | PUT | 修改密码 | `oldPassword` (必填): 旧密码<br>`newPassword` (必填): 新密码 | `PUT /api/user/changePassword?oldPassword=123456&newPassword=654321` |
| `/sendPasswordCode` | POST | 发送验证码（用于找回密码） | `email` (必填): 邮箱地址 | `POST /api/user/sendPasswordCode?email=test@example.com` |
| `/changePasswordByCode` | PUT | 通过验证码修改密码 | `email` (必填): 邮箱地址<br>`code` (必填): 验证码<br>`newPassword` (必填): 新密码 | `PUT /api/user/changePasswordByCode?email=test@example.com&code=123456&newPassword=new123` |
| `/uploadAvatar` | POST | 上传头像 | `avatar` (必填): 头像文件（multipart/form-data） | `POST /api/user/uploadAvatar` (form-data) |
| `/updateAvatar` | PUT | 更新头像 | `avatarUrl` (必填): 头像URL | `PUT /api/user/updateAvatar?avatarUrl=http://example.com/avatar.jpg` |
| `/deleteUser` | DELETE | 删除用户账户 | 无参数 | `DELETE /api/user/deleteUser` |
| `/updateUsername` | PUT | 修改用户名 | `username` (必填): 新用户名 | `PUT /api/user/updateUsername?username=newname` |
| `/updateShareScope` | PUT | 更新分享范围 | `shareScope` (必填): 分享范围 | `PUT /api/user/updateShareScope?shareScope=family` |
| `/updatePregnancy` | PUT | 更新孕期信息 | `lastMenstrualDate` (可选): 末次月经日期<br>`pregnancyTime` (可选): 怀孕时间 | `PUT /api/user/updatePregnancy?lastMenstrualDate=2025-12-01` |
| `/privacy/dataCollection` | GET | 获取数据收集隐私设置 | 无参数 | `GET /api/user/privacy/dataCollection` |
| `/privacy/dataCollection` | PUT | 更新数据收集隐私设置 | `dataCollection` (必填): 是否允许数据收集 (true/false) | `PUT /api/user/privacy/dataCollection?dataCollection=true` |
| `/privacy/community` | GET | 获取社区隐私设置 | 无参数 | `GET /api/user/privacy/community` |
| `/privacy/community` | PUT | 更新社区隐私设置 | `community` (必填): 是否允许社区互动 (true/false) | `PUT /api/user/privacy/community?community=true` |
| `/settings/email` | GET | 获取邮箱设置 | 无参数 | `GET /api/user/settings/email` |
| `/settings/email` | PUT | 更新邮箱设置 | `email` (必填): 邮箱地址 | `PUT /api/user/settings/email?email=new@example.com` |
| `/updateUserType` | PUT | 更新用户类型 | `userType` (必填): 用户类型 | `PUT /api/user/updateUserType?userType=family` |
| `/getById` | GET | 根据ID获取用户信息 | `id` (必填): 用户ID | `GET /api/user/getById?id=1` |

### 2.2 CaptchaController

**基础路径**：`/api/captcha`

| 端点 | 方法 | 描述 | 参数 | 请求示例 |
|------|------|------|------|----------|
| `/send` | POST | 发送验证码 | `email` (必填): 邮箱地址 | `POST /api/captcha/send?email=test@example.com` |

---

## 三、AI 对话与智能场景

### 3.1 AiController

**基础路径**：`/api/ai`

| 端点 | 方法 | 描述 | 参数 | 请求示例 |
|------|------|------|------|----------|
| `/chat` | POST | AI 对话（支持流式和非流式） | `message` (必填): 用户消息<br>`conversationId` (可选): 对话ID<br>`stream` (可选): 是否流式输出，默认 false<br>`source` (可选): 消息来源 | `POST /api/ai/chat?message=怀孕初期需要注意什么&stream=false` |
| `/chatWithContext` | POST | 带上下文的对话 | `message` (必填): 用户消息<br>`conversationId` (可选): 对话ID<br>`contextType` (可选): 上下文类型<br>`contextId` (可选): 上下文ID | `POST /api/ai/chatWithContext?message=关于这个记录...&contextType=memo&contextId=123` |
| `/community` | POST | 社区 AI 对话 | `message` (必填): 用户消息<br>`conversationId` (可选): 对话ID | `POST /api/ai/community?message=大家怎么看待...` |
| `/scenario` | POST | 场景对话（如宫缩记录、情绪记录等） | `message` (必填): 用户消息<br>`scenario` (必填): 场景标识<br>`conversationId` (可选): 对话ID | `POST /api/ai/scenario?message=我现在有点腹痛&scenario=contraction` |
| `/clearContext` | POST | 清除对话上下文 | `conversationId` (必填): 对话ID | `POST /api/ai/clearContext?conversationId=abc123` |
| `/analyzeRecord` | POST | 分析用户记录 | `recordId` (必填): 记录ID<br>`recordType` (必填): 记录类型 | `POST /api/ai/analyzeRecord?recordId=123&recordType=memo` |
| `/generateTitle` | POST | 为记录生成标题 | `content` (必填): 记录内容<br>`recordType` (可选): 记录类型 | `POST /api/ai/generateTitle?content=今天去医院做了产检...` |
| `/askAboutRecord` | POST | 针对记录的提问 | `recordId` (必填): 记录ID<br>`recordType` (必填): 记录类型<br>`question` (必填): 问题 | `POST /api/ai/askAboutRecord?recordId=123&recordType=memo&question=医生说了什么` |
| `/summarizeRecords` | POST | 汇总多个记录 | `recordIds` (必填): 记录ID列表（逗号分隔）<br>`recordType` (必填): 记录类型 | `POST /api/ai/summarizeRecords?recordIds=1,2,3&recordType=memo` |
| `/extractKeywords` | POST | 提取关键词 | `content` (必填): 内容文本 | `POST /api/ai/extractKeywords?content=怀孕初期需要注意饮食...` |
| `/searchKnowledge` | POST | 搜索知识库 | `query` (必填): 搜索查询<br>`limit` (可选): 结果数量，默认 5 | `POST /api/ai/searchKnowledge?query=叶酸什么时候吃&limit=5` |
| `/evaluateHealth` | POST | 健康评估 | `symptoms` (必填): 症状描述<br>`context` (可选): 上下文信息 | `POST /api/ai/evaluateHealth?symptoms=头晕恶心&context=怀孕8周` |
| `/recommendAction` | POST | 推荐行动建议 | `situation` (必填): 当前状况描述<br>`userContext` (可选): 用户上下文 | `POST /api/ai/recommendAction?situation=胎动频繁` |
| `/explainTerm` | POST | 解释医学术语 | `term` (必填): 术语<br>`language` (可选): 语言，默认 "zh-CN" | `POST /api/ai/explainTerm?term=NT检查&language=zh-CN` |
| `/compareOptions` | POST | 比较选项（如医院、药品等） | `options` (必填): 选项列表（JSON数组）<br>`criteria` (可选): 比较标准 | `POST /api/ai/compareOptions?options=["医院A","医院B"]` |
| `/planSchedule` | POST | 制定日程计划 | `goal` (必填): 目标<br>`constraints` (可选): 约束条件<br>`timeframe` (可选): 时间范围 | `POST /api/ai/planSchedule?goal=准备待产包` |
| `/generateReminder` | POST | 生成提醒 | `task` (必填): 任务描述<br>`priority` (可选): 优先级 | `POST /api/ai/generateReminder?task=每天补充叶酸` |
| `/translate` | POST | 翻译文本 | `text` (必填): 待翻译文本<br>`targetLang` (必填): 目标语言 | `POST /api/ai/translate?text=Hello&targetLang=zh-CN` |
| `/simplifyText` | POST | 简化文本（降低阅读难度） | `text` (必填): 原始文本<br>`targetLevel` (可选): 目标难度等级 | `POST /api/ai/simplifyText?text=医学术语解释...` |
| `/checkFact` | POST | 事实核查 | `statement` (必填): 待核查陈述 | `POST /api/ai/checkFact?statement=怀孕可以喝咖啡` |
| `/getConversationHistory` | GET | 获取对话历史 | `conversationId` (必填): 对话ID<br>`limit` (可选): 消息数量限制 | `GET /api/ai/getConversationHistory?conversationId=abc123&limit=50` |
| `/getUserConversations` | GET | 获取用户的对话列表 | `page` (可选): 页码<br>`pageSize` (可选): 每页数量 | `GET /api/ai/getUserConversations?page=1&pageSize=20` |
| `/deleteConversation` | DELETE | 删除对话 | `conversationId` (必填): 对话ID | `DELETE /api/ai/deleteConversation?conversationId=abc123` |

### 3.2 ScenarioController

**基础路径**：`/api/scenario`

| 端点 | 方法 | 描述 | 参数 | 请求示例 |
|------|------|------|------|----------|
| `/list` | GET | 获取可用场景列表 | 无参数 | `GET /api/scenario/list` |
| `/get` | GET | 获取场景详情 | `scenarioId` (必填): 场景ID | `GET /api/scenario/get?scenarioId=contraction` |

---

## 四、健康记录管理

### 4.1 MemoController

**基础路径**：`/api/memo`

| 端点 | 方法 | 描述 | 参数 | 请求示例 |
|------|------|------|------|----------|
| `/create` | POST | 创建备忘录 | `title` (可选): 标题<br>`content` (必填): 内容<br>`type` (可选): 类型<br>`mood` (可选): 心情<br>`weather` (可选): 天气<br>`location` (可选): 位置<br>`relatedDate` (可选): 相关日期<br>`tags` (可选): 标签（逗号分隔）<br>`isPrivate` (可选): 是否私有，默认 false | `POST /api/memo/create?content=今天感觉很好&mood=happy` |
| `/update` | PUT | 更新备忘录 | `id` (必填): 记录ID<br>`title` (可选): 标题<br>`content` (可选): 内容<br>`type` (可选): 类型<br>`mood` (可选): 心情<br>`weather` (可选): 天气<br>`location` (可选): 位置<br>`relatedDate` (可选): 相关日期<br>`tags` (可选): 标签<br>`isPrivate` (可选): 是否私有 | `PUT /api/memo/update?id=1&content=更新后的内容` |
| `/delete` | DELETE | 删除备忘录 | `id` (必填): 记录ID | `DELETE /api/memo/delete?id=1` |
| `/getById` | GET | 根据ID获取备忘录 | `id` (必填): 记录ID | `GET /api/memo/getById?id=1` |
| `/list` | GET | 获取备忘录列表 | `page` (可选): 页码<br>`pageSize` (可选): 每页数量<br>`type` (可选): 按类型过滤<br>`startDate` (可选): 开始日期<br>`endDate` (可选): 结束日期<br>`keyword` (可选): 关键词搜索 | `GET /api/memo/list?page=1&pageSize=20&type=daily` |
| `/search` | GET | 搜索备忘录 | `keyword` (必填): 搜索关键词<br>`page` (可选): 页码<br>`pageSize` (可选): 每页数量 | `GET /api/memo/search?keyword=医院&page=1` |
| `/stats` | GET | 获取统计信息 | `period` (可选): 统计周期（day/week/month）<br>`startDate` (可选): 开始日期<br>`endDate` (可选): 结束日期 | `GET /api/memo/stats?period=month` |

### 4.2 EmotionPregnancyController

**基础路径**：`/api/emotion`

| 端点 | 方法 | 描述 | 参数 | 请求示例 |
|------|------|------|------|----------|
| `/create` | POST | 记录孕期情绪 | `emotion` (必填): 情绪类型<br>`intensity` (可选): 强度 (1-10)<br>`trigger` (可选): 触发原因<br>`note` (可选): 备注<br>`recordTime` (可选): 记录时间 | `POST /api/emotion/create?emotion=happy&intensity=8` |
| `/update` | PUT | 更新情绪记录 | `id` (必填): 记录ID<br>`emotion` (可选): 情绪类型<br>`intensity` (可选): 强度<br>`trigger` (可选): 触发原因<br>`note` (可选): 备注 | `PUT /api/emotion/update?id=1&emotion=calm` |
| `/delete` | DELETE | 删除情绪记录 | `id` (必填): 记录ID | `DELETE /api/emotion/delete?id=1` |
| `/getById` | GET | 根据ID获取情绪记录 | `id` (必填): 记录ID | `GET /api/emotion/getById?id=1` |
| `/list` | GET | 获取情绪记录列表 | `page` (可选): 页码<br>`pageSize` (可选): 每页数量<br>`startDate` (可选): 开始日期<br>`endDate` (可选): 结束日期<br>`emotion` (可选): 按情绪类型过滤 | `GET /api/emotion/list?page=1&startDate=2026-01-01` |
| `/stats` | GET | 获取情绪统计 | `period` (可选): 统计周期（day/week/month）<br>`startDate` (可选): 开始日期<br>`endDate` (可选): 结束日期 | `GET /api/emotion/stats?period=week` |

### 4.3 ContractionController

**基础路径**：`/api/contraction`

| 端点 | 方法 | 描述 | 参数 | 请求示例 |
|------|------|------|------|----------|
| `/create` | POST | 记录宫缩 | `startTime` (必填): 开始时间<br>`duration` (必填): 持续时间（秒）<br>`intensity` (可选): 强度 (1-10)<br>`note` (可选): 备注 | `POST /api/contraction/create?startTime=2026-03-20 10:00:00&duration=45` |
| `/update` | PUT | 更新宫缩记录 | `id` (必填): 记录ID<br>`startTime` (可选): 开始时间<br>`duration` (可选): 持续时间<br>`intensity` (可选): 强度<br>`note` (可选): 备注 | `PUT /api/contraction/update?id=1&intensity=8` |
| `/delete` | DELETE | 删除宫缩记录 | `id` (必填): 记录ID | `DELETE /api/contraction/delete?id=1` |
| `/getById` | GET | 根据ID获取宫缩记录 | `id` (必填): 记录ID | `GET /api/contraction/getById?id=1` |
| `/list` | GET | 获取宫缩记录列表 | `page` (可选): 页码<br>`pageSize` (可选): 每页数量<br>`startDate` (可选): 开始日期<br>`endDate` (可选): 结束日期 | `GET /api/contraction/list?page=1&startDate=2026-03-20` |
| `/stats` | GET | 获取宫缩统计 | `period` (可选): 统计周期（hour/day）<br>`startTime` (必填): 开始时间<br>`endTime` (必填): 结束时间 | `GET /api/contraction/stats?period=hour&startTime=2026-03-20 00:00:00&endTime=2026-03-20 23:59:59` |
| `/analyze` | GET | 分析宫缩模式 | `hours` (可选): 分析的小时数，默认 24 | `GET /api/contraction/analyze?hours=24` |

### 4.4 DailyLogController

**基础路径**：`/api/dailyLog`

| 端点 | 方法 | 描述 | 参数 | 请求示例 |
|------|------|------|------|----------|
| `/create` | POST | 创建每日日志 | `date` (可选): 日志日期，默认今天<br>`content` (必填): 日志内容<br>`healthScore` (可选): 健康评分 (1-10)<br>`sleepHours` (可选): 睡眠时长<br>`waterIntake` (可选): 饮水量（毫升）<br>`steps` (可选): 步数 | `POST /api/dailyLog/create?content=今天状态良好&healthScore=8` |
| `/update` | PUT | 更新每日日志 | `id` (必填): 记录ID<br>`content` (可选): 日志内容<br>`healthScore` (可选): 健康评分<br>`sleepHours` (可选): 睡眠时长<br>`waterIntake` (可选): 饮水量<br>`steps` (可选): 步数 | `PUT /api/dailyLog/update?id=1&healthScore=9` |
| `/delete` | DELETE | 删除每日日志 | `id` (必填): 记录ID | `DELETE /api/dailyLog/delete?id=1` |
| `/getById` | GET | 根据ID获取每日日志 | `id` (必填): 记录ID | `GET /api/dailyLog/getById?id=1` |
| `/getByDate` | GET | 根据日期获取每日日志 | `date` (必填): 日期 | `GET /api/dailyLog/getByDate?date=2026-03-20` |
| `/list` | GET | 获取每日日志列表 | `page` (可选): 页码<br>`pageSize` (可选): 每页数量<br>`startDate` (可选): 开始日期<br>`endDate` (可选): 结束日期 | `GET /api/dailyLog/list?page=1&startDate=2026-03-01` |
| `/stats` | GET | 获取日志统计 | `period` (可选): 统计周期（week/month）<br>`startDate` (可选): 开始日期<br>`endDate` (可选): 结束日期 | `GET /api/dailyLog/stats?period=month` |

### 4.5 MoodRecordController

**基础路径**：`/api/mood`

| 端点 | 方法 | 描述 | 参数 | 请求示例 |
|------|------|------|------|----------|
| `/create` | POST | 记录心情 | `mood` (必填): 心情类型<br>`intensity` (可选): 强度 (1-10)<br>`reason` (可选): 原因<br>`note` (可选): 备注 | `POST /api/mood/create?mood=happy&intensity=7` |
| `/update` | PUT | 更新心情记录 | `id` (必填): 记录ID<br>`mood` (可选): 心情类型<br>`intensity` (可选): 强度<br>`reason` (可选): 原因<br>`note` (可选): 备注 | `PUT /api/mood/update?id=1&mood=neutral` |
| `/delete` | DELETE | 删除心情记录 | `id` (必填): 记录ID | `DELETE /api/mood/delete?id=1` |
| `/getById` | GET | 根据ID获取心情记录 | `id` (必填): 记录ID | `GET /api/mood/getById?id=1` |
| `/list` | GET | 获取心情记录列表 | `page` (可选): 页码<br>`pageSize` (可选): 每页数量<br>`startDate` (可选): 开始日期<br>`endDate` (可选): 结束日期 | `GET /api/mood/list?page=1&startDate=2026-03-01` |
| `/stats` | GET | 获取心情统计 | `period` (可选): 统计周期（week/month）<br>`startDate` (可选): 开始日期<br>`endDate` (可选): 结束日期 | `GET /api/mood/stats?period=week` |

### 4.6 CheckReportController

**基础路径**：`/api/checkReport`

| 端点 | 方法 | 描述 | 参数 | 请求示例 |
|------|------|------|------|----------|
| `/create` | POST | 创建产检报告 | `checkDate` (必填): 产检日期<br>`hospital` (可选): 医院名称<br>`doctor` (可选): 医生姓名<br>`content` (必填): 报告内容<br>`files` (可选): 附件文件（multipart/form-data） | `POST /api/checkReport/create?checkDate=2026-03-19&content=一切正常` |
| `/update` | PUT | 更新产检报告 | `id` (必填): 记录ID<br>`checkDate` (可选): 产检日期<br>`hospital` (可选): 医院名称<br>`doctor` (可选): 医生姓名<br>`content` (可选): 报告内容 | `PUT /api/checkReport/update?id=1&hospital=市妇幼医院` |
| `/delete` | DELETE | 删除产检报告 | `id` (必填): 记录ID | `DELETE /api/checkReport/delete?id=1` |
| `/getById` | GET | 根据ID获取产检报告 | `id` (必填): 记录ID | `GET /api/checkReport/getById?id=1` |
| `/list` | GET | 获取产检报告列表 | `page` (可选): 页码<br>`pageSize` (可选): 每页数量<br>`startDate` (可选): 开始日期<br>`endDate` (可选): 结束日期 | `GET /api/checkReport/list?page=1&startDate=2026-01-01` |
| `/uploadFile` | POST | 上传报告附件 | `reportId` (必填): 报告ID<br>`file` (必填): 附件文件 | `POST /api/checkReport/uploadFile?reportId=1` |
| `/deleteFile` | DELETE | 删除报告附件 | `fileId` (必填): 文件ID | `DELETE /api/checkReport/deleteFile?fileId=abc123` |

---

## 五、家庭与任务管理

### 5.1 FamilyController

**基础路径**：`/api/family`

| 端点 | 方法 | 描述 | 参数 | 请求示例 |
|------|------|------|------|----------|
| `/create` | POST | 创建家庭 | `familyName` (必填): 家庭名称<br>`description` (可选): 家庭描述 | `POST /api/family/create?familyName=我的家庭` |
| `/update` | PUT | 更新家庭信息 | `familyId` (必填): 家庭ID<br>`familyName` (可选): 家庭名称<br>`description` (可选): 家庭描述 | `PUT /api/family/update?familyId=1&familyName=新家庭名` |
| `/delete` | DELETE | 删除家庭 | `familyId` (必填): 家庭ID | `DELETE /api/family/delete?familyId=1` |
| `/getById` | GET | 根据ID获取家庭信息 | `familyId` (必填): 家庭ID | `GET /api/family/getById?familyId=1` |
| `/list` | GET | 获取用户所在家庭列表 | 无参数 | `GET /api/family/list` |
| `/invite` | POST | 邀请家庭成员 | `familyId` (必填): 家庭ID<br>`email` (必填): 被邀请人邮箱<br>`relationship` (可选): 关系类型 | `POST /api/family/invite?familyId=1&email=member@example.com` |
| `/acceptInvitation` | POST | 接受家庭邀请 | `invitationCode` (必填): 邀请码 | `POST /api/family/acceptInvitation?invitationCode=abc123` |
| `/rejectInvitation` | POST | 拒绝家庭邀请 | `invitationCode` (必填): 邀请码 | `POST /api/family/rejectInvitation?invitationCode=abc123` |
| `/removeMember` | DELETE | 移除家庭成员 | `familyId` (必填): 家庭ID<br>`memberId` (必填): 成员ID | `DELETE /api/family/removeMember?familyId=1&memberId=2` |
| `/updateMemberRole` | PUT | 更新成员角色 | `familyId` (必填): 家庭ID<br>`memberId` (必填): 成员ID<br>`role` (必填): 新角色 | `PUT /api/family/updateMemberRole?familyId=1&memberId=2&role=admin` |
| `/leave` | DELETE | 离开家庭 | `familyId` (必填): 家庭ID | `DELETE /api/family/leave?familyId=1` |

### 5.2 FamilyTaskController

**基础路径**：`/api/familyTask`

| 端点 | 方法 | 描述 | 参数 | 请求示例 |
|------|------|------|------|----------|
| `/create` | POST | 创建家庭任务 | `familyId` (必填): 家庭ID<br>`title` (必填): 任务标题<br>`description` (可选): 任务描述<br>`assigneeId` (可选): 分配给的成员ID<br>`dueDate` (可选): 截止日期<br>`priority` (可选): 优先级 | `POST /api/familyTask/create?familyId=1&title=购买婴儿用品` |
| `/update` | PUT | 更新家庭任务 | `taskId` (必填): 任务ID<br>`title` (可选): 任务标题<br>`description` (可选): 任务描述<br>`assigneeId` (可选): 分配给的成员ID<br>`dueDate` (可选): 截止日期<br>`priority` (可选): 优先级<br>`status` (可选): 状态 | `PUT /api/familyTask/update?taskId=1&status=in_progress` |
| `/delete` | DELETE | 删除家庭任务 | `taskId` (必填): 任务ID | `DELETE /api/familyTask/delete?taskId=1` |
| `/getById` | GET | 根据ID获取家庭任务 | `taskId` (必填): 任务ID | `GET /api/familyTask/getById?taskId=1` |
| `/list` | GET | 获取家庭任务列表 | `familyId` (必填): 家庭ID<br>`status` (可选): 按状态过滤<br>`assigneeId` (可选): 按分配人过滤<br>`page` (可选): 页码<br>`pageSize` (可选): 每页数量 | `GET /api/familyTask/list?familyId=1&status=pending` |
| `/assign` | PUT | 分配任务给成员 | `taskId` (必填): 任务ID<br>`assigneeId` (必填): 成员ID | `PUT /api/familyTask/assign?taskId=1&assigneeId=2` |
| `/complete` | PUT | 标记任务完成 | `taskId` (必填): 任务ID | `PUT /api/familyTask/complete?taskId=1` |
| `/reopen` | PUT | 重新打开任务 | `taskId` (必填): 任务ID | `PUT /api/familyTask/reopen?taskId=1` |

---

## 六、目标与反馈

### 6.1 GoalController

**基础路径**：`/api/goal`

| 端点 | 方法 | 描述 | 参数 | 请求示例 |
|------|------|------|------|----------|
| `/create` | POST | 创建目标 | `title` (必填): 目标标题<br>`description` (可选): 目标描述<br>`type` (可选): 目标类型<br>`targetValue` (可选): 目标值<br>`deadline` (可选): 截止日期 | `POST /api/goal/create?title=每天散步30分钟` |
| `/update` | PUT | 更新目标 | `goalId` (必填): 目标ID<br>`title` (可选): 目标标题<br>`description` (可选): 目标描述<br>`type` (可选): 目标类型<br>`targetValue` (可选): 目标值<br>`deadline` (可选): 截止日期<br>`status` (可选): 状态 | `PUT /api/goal/update?goalId=1&status=in_progress` |
| `/delete` | DELETE | 删除目标 | `goalId` (必填): 目标ID | `DELETE /api/goal/delete?goalId=1` |
| `/getById` | GET | 根据ID获取目标 | `goalId` (必填): 目标ID | `GET /api/goal/getById?goalId=1` |
| `/list` | GET | 获取目标列表 | `type` (可选): 按类型过滤<br>`status` (可选): 按状态过滤<br>`page` (可选): 页码<br>`pageSize` (可选): 每页数量 | `GET /api/goal/list?status=active&page=1` |
| `/recordProgress` | POST | 记录目标进展 | `goalId` (必填): 目标ID<br>`progressValue` (可选): 进展值<br>`note` (可选): 备注 | `POST /api/goal/recordProgress?goalId=1&progressValue=50` |
| `/complete` | PUT | 标记目标完成 | `goalId` (必填): 目标ID | `PUT /api/goal/complete?goalId=1` |
| `/abandon` | PUT | 放弃目标 | `goalId` (必填): 目标ID<br>`reason` (可选): 放弃原因 | `PUT /api/goal/abandon?goalId=1&reason=时间不够` |

### 6.2 FeedbackController

**基础路径**：`/api/feedback`

| 端点 | 方法 | 描述 | 参数 | 请求示例 |
|------|------|------|------|----------|
| `/create` | POST | 提交反馈 | `type` (必填): 反馈类型<br>`content` (必填): 反馈内容<br>`contact` (可选): 联系方式 | `POST /api/feedback/create?type=bug&content=发现一个问题...` |
| `/list` | GET | 获取反馈列表（管理员） | `type` (可选): 按类型过滤<br>`status` (可选): 按状态过滤<br>`page` (可选): 页码<br>`pageSize` (可选): 每页数量 | `GET /api/feedback/list?type=bug&page=1` |
| `/updateStatus` | PUT | 更新反馈状态（管理员） | `feedbackId` (必填): 反馈ID<br>`status` (必填): 新状态<br>`response` (可选): 回复内容 | `PUT /api/feedback/updateStatus?feedbackId=1&status=resolved` |

---

## 七、内容与资源

### 7.1 ArticleController

**基础路径**：`/api/article`

| 端点 | 方法 | 描述 | 参数 | 请求示例 |
|------|------|------|------|----------|
| `/list` | GET | 获取文章列表 | `category` (可选): 文章分类<br>`page` (可选): 页码<br>`pageSize` (可选): 每页数量 | `GET /api/article/list?category=pregnancy&page=1` |
| `/getById` | GET | 根据ID获取文章 | `articleId` (必填): 文章ID | `GET /api/article/getById?articleId=1` |
| `/search` | GET | 搜索文章 | `keyword` (必填): 搜索关键词<br>`page` (可选): 页码<br>`pageSize` (可选): 每页数量 | `GET /api/article/search?keyword=营养&page=1` |
| `/categories` | GET | 获取文章分类列表 | 无参数 | `GET /api/article/categories` |

### 7.2 RelaxMusicController

**基础路径**：`/api/relaxMusic`

| 端点 | 方法 | 描述 | 参数 | 请求示例 |
|------|------|------|------|----------|
| `/list` | GET | 获取放松音乐列表 | `category` (可选): 音乐分类<br>`page` (可选): 页码<br>`pageSize` (可选): 每页数量 | `GET /api/relaxMusic/list?category=meditation&page=1` |
| `/getById` | GET | 根据ID获取音乐 | `musicId` (必填): 音乐ID | `GET /api/relaxMusic/getById?musicId=1` |
| `/play` | POST | 记录播放（用于统计） | `musicId` (必填): 音乐ID | `POST /api/relaxMusic/play?musicId=1` |
| `/favorite` | POST | 收藏音乐 | `musicId` (必填): 音乐ID | `POST /api/relaxMusic/favorite?musicId=1` |
| `/unfavorite` | DELETE | 取消收藏音乐 | `musicId` (必填): 音乐ID | `DELETE /api/relaxMusic/unfavorite?musicId=1` |
| `/favorites` | GET | 获取收藏的音乐列表 | `page` (可选): 页码<br>`pageSize` (可选): 每页数量 | `GET /api/relaxMusic/favorites?page=1` |

---

## 八、社区与互动

### 8.1 RecordInteractionController

**基础路径**：`/api/interaction`

| 端点 | 方法 | 描述 | 参数 | 请求示例 |
|------|------|------|------|----------|
| `/like` | POST | 点赞记录 | `recordId` (必填): 记录ID<br>`recordType` (必填): 记录类型 | `POST /api/interaction/like?recordId=1&recordType=memo` |
| `/unlike` | DELETE | 取消点赞 | `recordId` (必填): 记录ID<br>`recordType` (必填): 记录类型 | `DELETE /api/interaction/unlike?recordId=1&recordType=memo` |
| `/comment` | POST | 评论记录 | `recordId` (必填): 记录ID<br>`recordType` (必填): 记录类型<br>`content` (必填): 评论内容 | `POST /api/interaction/comment?recordId=1&recordType=memo&content=很好的分享` |
| `/deleteComment` | DELETE | 删除评论 | `commentId` (必填): 评论ID | `DELETE /api/interaction/deleteComment?commentId=1` |
| `/getComments` | GET | 获取记录的评论 | `recordId` (必填): 记录ID<br>`recordType` (必填): 记录类型<br>`page` (可选): 页码<br>`pageSize` (可选): 每页数量 | `GET /api/interaction/getComments?recordId=1&recordType=memo&page=1` |

---

## 九、通知系统

### 9.1 UserNotificationController

**基础路径**：`/api/notification`

| 端点 | 方法 | 描述 | 参数 | 请求示例 |
|------|------|------|------|----------|
| `/list` | GET | 获取用户通知列表 | `unreadOnly` (可选): 只获取未读通知，默认 false<br>`page` (可选): 页码<br>`pageSize` (可选): 每页数量 | `GET /api/notification/list?unreadOnly=true&page=1` |
| `/markAsRead` | PUT | 标记通知为已读 | `notificationId` (必填): 通知ID | `PUT /api/notification/markAsRead?notificationId=1` |
| `/markAllAsRead` | PUT | 标记所有通知为已读 | 无参数 | `PUT /api/notification/markAllAsRead` |
| `/delete` | DELETE | 删除通知 | `notificationId` (必填): 通知ID | `DELETE /api/notification/delete?notificationId=1` |
| `/countUnread` | GET | 获取未读通知数量 | 无参数 | `GET /api/notification/countUnread` |

---

## 十、系统管理

### 10.1 AdminController

**基础路径**：`/api/admin`

| 端点 | 方法 | 描述 | 参数 | 请求示例 |
|------|------|------|------|----------|
| `/users` | GET | 获取所有用户列表（管理员） | `page` (可选): 页码<br>`pageSize` (可选): 每页数量<br>`keyword` (可选): 搜索关键词 | `GET /api/admin/users?page=1&keyword=test` |
| `/stats` | GET | 获取系统统计（管理员） | `period` (可选): 统计周期（day/week/month） | `GET /api/admin/stats?period=week` |

---

## 十一、系统健康

### 11.1 HealthController

**基础路径**：`/api/health`

| 端点 | 方法 | 描述 | 参数 | 请求示例 |
|------|------|------|------|----------|
| `/` | GET | 健康检查 | 无参数 | `GET /api/health` |

---

## 附录

### A. 数据模型参考

主要实体模型：
- **User**: 用户信息（ID、用户名、邮箱、用户类型、孕期信息等）
- **Memo**: 备忘录记录（标题、内容、类型、心情、标签等）
- **EmotionPregnancy**: 孕期情绪记录（情绪类型、强度、触发原因等）
- **Contraction**: 宫缩记录（开始时间、持续时间、强度等）
- **DailyLog**: 每日日志（日期、内容、健康评分、睡眠时长等）
- **Family**: 家庭信息（名称、描述、创建时间等）
- **FamilyTask**: 家庭任务（标题、描述、分配人、截止日期等）
- **Goal**: 个人目标（标题、描述、类型、目标值、截止日期等）

### B. 枚举值

**用户类型**:
- `pregnant`: 孕妇
- `family`: 家庭成员
- `doctor`: 医生（预留）

**记录类型**:
- `memo`: 备忘录
- `emotion`: 情绪
- `contraction`: 宫缩
- `dailyLog`: 每日日志
- `checkReport`: 产检报告

**任务状态**:
- `pending`: 待处理
- `in_progress`: 进行中
- `completed`: 已完成
- `cancelled`: 已取消

**反馈类型**:
- `bug`: 错误报告
- `feature`: 功能建议
- `question`: 问题咨询
- `other`: 其他

### C. 错误码参考

常见业务错误码：
- `USER_NOT_FOUND`: 用户不存在
- `INVALID_CREDENTIALS`: 用户名或密码错误
- `EMAIL_ALREADY_EXISTS`: 邮箱已被注册
- `INSUFFICIENT_PERMISSION`: 权限不足
- `RESOURCE_NOT_FOUND`: 资源不存在
- `INVALID_PARAMETER`: 参数无效

---

**文档说明**：
1. 本 API 文档基于代码自动生成，部分接口描述为推断结果
2. 实际参数和返回值可能因版本更新而变化
3. 建议配合 Swagger UI（如已集成）或实际接口测试使用
4. 生产环境请根据实际部署情况调整基础 URL

**更新日志**：
- 2026-03-20: 初始版本，基于代码分析生成