# 孕期宝项目 UML 建模文档

> 基于 Spring Boot + Next.js 全栈项目
> 生成时间：2026-03-20
> 使用 PlantUML 语言绘制

---

## 一、用例图 (Use Case Diagram)

### 1.1 系统总体用例图

```plantuml
@startuml
left to right direction
actor "孕妇用户" as PregnantUser
actor "家庭成员" as FamilyMember
actor "系统管理员" as Admin

rectangle "孕期宝系统" {
  (用户注册登录) as UC1
  (记录孕期健康数据) as UC2
  (AI对话咨询) as UC3
  (家庭任务管理) as UC4
  (查看健康报告) as UC5
  (管理个人资料) as UC6
  (数据统计分析) as UC7
  (系统配置管理) as UC8
}

PregnantUser --> UC1
PregnantUser --> UC2
PregnantUser --> UC3
PregnantUser --> UC5
PregnantUser --> UC6

FamilyMember --> UC1
FamilyMember --> UC4
FamilyMember --> UC5

Admin --> UC7
Admin --> UC8

UC2 .> (记录备忘录) : include
UC2 .> (记录情绪) : include
UC2 .> (记录宫缩) : include
UC2 .> (记录每日日志) : include
UC2 .> (记录产检报告) : include

UC3 .> (普通对话) : include
UC3 .> (场景对话) : include
UC3 .> (知识检索) : include
UC3 .> (记录分析) : include

UC4 .> (创建家庭) : include
UC4 .> (邀请成员) : include
UC4 .> (分配任务) : include
UC4 .> (完成任务) : include
@enduml
```

### 1.2 详细用例说明

| 用例编号 | 用例名称 | 参与者 | 描述 |
|---------|---------|--------|------|
| UC-001 | 用户注册登录 | 所有用户 | 用户通过用户名密码注册和登录系统 |
| UC-002 | 记录孕期健康数据 | 孕妇用户 | 记录备忘录、情绪、宫缩、每日日志、产检报告等 |
| UC-003 | AI对话咨询 | 孕妇用户 | 与AI进行孕期相关咨询对话 |
| UC-004 | 家庭任务管理 | 家庭成员 | 创建家庭、邀请成员、分配和完成任务 |
| UC-005 | 查看健康报告 | 孕妇用户、家庭成员 | 查看健康数据统计和分析报告 |
| UC-006 | 管理个人资料 | 所有用户 | 管理个人信息、隐私设置、头像等 |
| UC-007 | 数据统计分析 | 系统管理员 | 查看系统数据统计和分析 |
| UC-008 | 系统配置管理 | 系统管理员 | 管理系统配置和参数 |

---

## 二、类图 (Class Diagram)

### 2.1 核心实体类图

```plantuml
@startuml
package "com.anmory.yunji.entity" {
  class User {
    - Long id
    - String username
    - String password
    - String email
    - String userType
    - Date lastMenstrualDate
    - Integer pregnancyTime
    - String avatarUrl
    - Boolean dataCollection
    - Boolean community
    + getId()
    + getUsername()
    + setUsername()
    + getPassword()
    + setPassword()
    + getEmail()
    + setEmail()
  }

  class Memo {
    - Long id
    - String title
    - String content
    - String type
    - String mood
    - String weather
    - String location
    - Date relatedDate
    - String tags
    - Boolean isPrivate
    - Long userId
    + getId()
    + getTitle()
    + setTitle()
    + getContent()
    + setContent()
    + getUserId()
    + setUserId()
  }

  class EmotionPregnancy {
    - Long id
    - String emotion
    - Integer intensity
    - String trigger
    - String note
    - Date recordTime
    - Long userId
  }

  class Contraction {
    - Long id
    - Date startTime
    - Integer duration
    - Integer intensity
    - String note
    - Long userId
  }

  class DailyLog {
    - Long id
    - Date date
    - String content
    - Integer healthScore
    - Integer sleepHours
    - Integer waterIntake
    - Integer steps
    - Long userId
  }

  class Family {
    - Long id
    - String familyName
    - String description
    - Date createTime
  }

  class FamilyTask {
    - Long id
    - String title
    - String description
    - String status
    - Date dueDate
    - String priority
    - Long familyId
    - Long assigneeId
    - Long creatorId
  }

  class Goal {
    - Long id
    - String title
    - String description
    - String type
    - String status
    - Integer targetValue
    - Date deadline
    - Long userId
  }

  User "1" -- "*" Memo : 拥有
  User "1" -- "*" EmotionPregnancy : 拥有
  User "1" -- "*" Contraction : 拥有
  User "1" -- "*" DailyLog : 拥有
  User "1" -- "*" Goal : 拥有
  Family "1" -- "*" FamilyTask : 包含
}

package "com.anmory.yunji.dto" {
  class UserDTO {
    - Long id
    - String username
    - String email
    - String userType
    - String avatarUrl
  }

  class MemoDTO {
    - Long id
    - String title
    - String content
    - String type
    - String mood
    - Date relatedDate
    - String userName
  }

  UserDTO ..|> User : 转换
  MemoDTO ..|> Memo : 转换
}
@enduml
```

### 2.2 服务层类图

```plantuml
@startuml
package "com.anmory.yunji.controller" {
  interface UserController {
    + register()
    + login()
    + updateProfile()
    + uploadAvatar()
  }

  interface MemoController {
    + createMemo()
    + updateMemo()
    + deleteMemo()
    + getMemoList()
  }

  interface AiController {
    + chat()
    + chatWithContext()
    + searchKnowledge()
    + analyzeRecord()
  }

  interface FamilyController {
    + createFamily()
    + inviteMember()
    + removeMember()
  }
}

package "com.anmory.yunji.service" {
  class UserService {
    - UserRepository userRepository
    + registerUser()
    + authenticate()
    + updateUser()
    + deleteUser()
  }

  class MemoService {
    - MemoRepository memoRepository
    + createMemo()
    + updateMemo()
    + deleteMemo()
    + findMemosByUser()
  }

  class AiService {
    - OpenAIClient openAIClient
    - VectorStore vectorStore
    + processChat()
    + searchKnowledge()
    + analyzeContent()
  }

  class FamilyService {
    - FamilyRepository familyRepository
    + createFamily()
    + inviteMember()
    + assignTask()
  }
}

package "com.anmory.yunji.repository" {
  interface UserRepository {
    + findByUsername()
    + findByEmail()
    + save()
    + delete()
  }

  interface MemoRepository {
    + findByUserId()
    + findByDateRange()
    + save()
    + delete()
  }

  interface FamilyRepository {
    + findById()
    + findByMember()
    + save()
  }
}

UserController ..> UserService : 调用
MemoController ..> MemoService : 调用
AiController ..> AiService : 调用
FamilyController ..> FamilyService : 调用

UserService ..> UserRepository : 依赖
MemoService ..> MemoRepository : 依赖
FamilyService ..> FamilyRepository : 依赖
@enduml
```

---

## 三、时序图 (Sequence Diagram)

### 3.1 用户注册时序图

```plantuml
@startuml
actor 用户 as User
participant "前端" as Frontend
participant "UserController" as Controller
participant "UserService" as Service
participant "UserRepository" as Repository
participant "数据库" as DB

User -> Frontend : 填写注册信息
Frontend -> Controller : POST /api/user/register
Controller -> Service : registerUser(username, password, email)
Service -> Repository : findByUsername(username)
Repository -> DB : SELECT * FROM users WHERE username = ?
DB --> Repository : 返回结果
alt 用户名已存在
  Repository --> Service : 返回已存在
  Service --> Controller : 返回错误
  Controller --> Frontend : 返回400错误
  Frontend --> User : 显示"用户名已存在"
else 用户名可用
  Service -> Service : 密码加密
  Service -> Repository : save(user)
  Repository -> DB : INSERT INTO users
  DB --> Repository : 返回ID
  Repository --> Service : 返回用户对象
  Service -> Service : 生成JWT Token
  Service --> Controller : 返回UserDTO + Token
  Controller --> Frontend : 返回200成功
  Frontend --> User : 显示注册成功，自动登录
end
@enduml
```

### 3.2 AI对话时序图

```plantuml
@startuml
actor 用户 as User
participant "前端" as Frontend
participant "AiController" as Controller
participant "AiService" as Service
participant "VectorStore" as VectorDB
participant "OpenAI API" as OpenAI
participant "MySQL" as DB

User -> Frontend : 输入问题
Frontend -> Controller : POST /api/ai/chat?message=...
Controller -> Service : processChat(message, userId)
Service -> VectorDB : searchSimilarDocuments(message)
VectorDB --> Service : 返回相关文档
Service -> DB : SELECT * FROM user_records WHERE user_id = ?
DB --> Service : 返回用户历史记录
Service -> Service : 构建上下文提示词
Service -> OpenAI : 发送API请求
OpenAI --> Service : 返回AI回复
Service -> DB : INSERT INTO chat_history
DB --> Service : 确认保存
Service --> Controller : 返回回复内容
Controller --> Frontend : 返回200 + 回复
Frontend --> User : 显示AI回复
@enduml
```

### 3.3 记录宫缩时序图

```plantuml
@startuml
actor 孕妇 as Pregnant
participant "移动端" as Mobile
participant "ContractionController" as Controller
participant "ContractionService" as Service
participant "ContractionRepository" as Repository
participant "MySQL" as DB
participant "Redis" as Cache

Pregnant -> Mobile : 点击"开始宫缩记录"
Mobile -> Controller : POST /api/contraction/create?startTime=...
Controller -> Service : createContraction(startTime, userId)
Service -> Service : 验证参数
Service -> Repository : save(contraction)
Repository -> DB : INSERT INTO contractions
DB --> Repository : 返回ID
Repository --> Service : 返回Contraction对象
Service -> Cache : set("contraction:latest:"+userId, contraction)
Cache --> Service : OK
Service -> Service : 分析宫缩模式
Service --> Controller : 返回ContractionDTO
Controller --> Mobile : 返回200成功
Mobile --> Pregnant : 显示记录成功，开始计时
@enduml
```

---

## 四、活动图 (Activity Diagram)

### 4.1 用户登录活动图

```plantuml
@startuml
start
:用户访问登录页面;
:输入用户名和密码;
:点击登录按钮;

if (表单验证通过?) then (是)
  :发送登录请求到后端;
  if (用户名存在?) then (是)
    if (密码正确?) then (是)
      :生成JWT Token;
      :返回用户信息和Token;
      :前端保存Token到localStorage;
      :跳转到首页;
      stop
    else (否)
      :返回密码错误;
      :显示错误提示;
    endif
  else (否)
    :返回用户不存在;
    :显示错误提示;
  endif
else (否)
  :显示表单验证错误;
endif

:用户重新输入;
detach
@enduml
```

### 4.2 记录健康数据活动图

```plantuml
@startuml
start
:用户进入健康记录页面;
:选择记录类型;
switch (记录类型)
case (备忘录)
  :输入标题和内容;
  :选择心情和天气;
case (情绪记录)
  :选择情绪类型;
  :设置强度等级;
  :输入触发原因;
case (宫缩记录)
  :点击开始计时;
  :宫缩结束时点击结束;
  :自动计算持续时间;
case (每日日志)
  :输入今日总结;
  :设置健康评分;
  :记录睡眠和饮水量;
endswitch

:点击保存按钮;
if (数据验证通过?) then (是)
  :发送保存请求;
  :保存到数据库;
  :更新统计信息;
  :显示保存成功;
  stop
else (否)
  :显示验证错误;
  :返回编辑页面;
endif
@enduml
```

---

## 五、状态图 (State Diagram)

### 5.1 用户账户状态图

```plantuml
@startuml
[*] --> 未注册

未注册 --> 已注册 : 注册成功
已注册 --> 已激活 : 邮箱验证
已激活 --> 正常使用 : 首次登录
正常使用 --> 已禁用 : 违反规则
已禁用 --> 正常使用 : 管理员解禁
正常使用 --> 已注销 : 用户注销
已注销 --> [*]

state 正常使用 {
  [*] --> 未登录
  未登录 --> 已登录 : 登录成功
  已登录 --> 未登录 : 退出登录
  已登录 --> 会话过期 : Token过期
  会话过期 --> 已登录 : 重新登录
}
@enduml
```

### 5.2 家庭任务状态图

```plantuml
@startuml
[*] --> 待创建

待创建 --> 待分配 : 创建成功
待分配 --> 进行中 : 分配给成员
进行中 --> 已完成 : 成员完成
进行中 --> 已取消 : 创建者取消
已完成 --> 已归档 : 7天后自动归档
已归档 --> [*]

state 进行中 {
  [*] --> 未开始
  未开始 --> 处理中 : 开始处理
  处理中 --> 待审核 : 提交完成
  待审核 --> 处理中 : 需要修改
  待审核 --> 已完成 : 审核通过
}
@enduml
```

---

## 六、组件图 (Component Diagram)

```plantuml
@startuml
package "前端应用" {
  [Next.js Web应用] as WebApp
  [React组件库] as Components
  [状态管理] as State
  [API客户端] as APIClient
  
  WebApp --> Components
  WebApp --> State
  WebApp --> APIClient
}

package "后端服务" {
  component "Spring Boot应用" as SpringApp {
    [REST Controllers] as Controllers
    [Business Services] as Services
    [Data Repositories] as Repositories
    [Security Filter] as Security
    
    Controllers --> Services
    Services --> Repositories
    Security --> Controllers
  }
}

package "数据存储" {
  database "MySQL" as MySQL {
    folder "业务数据" as BusinessData
  }
  
  database "Redis" as Redis {
    folder "会话缓存" as SessionCache
    folder "热点数据" as HotData
  }
  
  database "Milvus" as Milvus {
    folder "向量嵌入" as VectorEmbeddings
  }
}

package "外部服务" {
  [OpenAI API] as OpenAI
  [短信服务] as SMS
  [邮件服务] as Email
}

APIClient --> Controllers : HTTP/HTTPS
Repositories --> MySQL : JDBC
SpringApp --> Redis : Jedis
Services --> Milvus : gRPC
Services --> OpenAI : REST API
Services --> SMS : HTTP
Services --> Email : SMTP

note right of SpringApp
  版本: Spring Boot 3.x
  Java 17+
  端口: 8080
end note
@enduml
```

---

## 七、部署图 (Deployment Diagram)

```plantuml
@startuml
node "云服务器" as Server {
  node "Docker容器集群" as Docker {
    artifact "Nginx反向代理" as Nginx {
      file "nginx.conf"
    }
    
    artifact "Spring Boot应用" as Backend {
      file "yunji-backend.jar"
      database "H2内存数据库" as H2
    }
    
    artifact "Next.js前端" as Frontend {
      file "next-app"
    }
    
    artifact "MySQL数据库" as MySQL {
      folder "yunfu数据库"
      folder "31张业务表"
    }
    
    artifact "Redis缓存" as Redis {
      folder "会话存储"
      folder "热点缓存"
    }
    
    artifact "Milvus向量库" as Milvus {
      folder "yunji_rag集合"
      folder "向量索引"
    }
  }
}

node "用户设备" as UserDevice {
  device "手机浏览器" as MobileBrowser
  device "电脑浏览器" as PCBrowser
  device "微信小程序" as WechatMini
}

node "开发环境" as DevEnv {
  artifact "开发机器" as DevMachine
  artifact "Git仓库" as GitRepo
  artifact "CI/CD流水线" as CICD
}

Nginx --> Backend : 代理请求 8080
Nginx --> Frontend : 服务静态文件
Backend --> MySQL : 3306
Backend --> Redis : 6379
Backend --> Milvus : 19530

MobileBrowser --> Nginx : HTTPS 443
PCBrowser --> Nginx : HTTPS 443
WechatMini --> Backend : REST API

DevMachine --> GitRepo : 代码推送
GitRepo --> CICD : 触发构建
CICD --> Docker : 自动部署

note right of Docker
  使用docker-compose编排
  多容器隔离部署
  健康检查自动重启
end note
@enduml
```

---

## 八、包图 (Package Diagram)

```plantuml
@startuml
package "孕期宝项目" {
  package "前端层" {
    [Next.js应用] as Frontend
    [React组件] as Components
    [状态管理] as StateMgmt
    [API集成] as APIIntegration
  }
  
  package "后端层" {
    package "表现层" {
      [REST Controllers] as Controllers
      [DTO对象] as DTOs
      [请求验证] as Validation
    }
    
    package "业务层" {
      [Service接口] as Services
      [业务逻辑] as BusinessLogic
      [事务管理] as Transaction
    }
    
    package "数据层" {
      [Repository接口] as Repositories
      [实体类] as Entities
      [数据库映射] as ORM
    }
    
    package "基础设施" {
      [安全认证] as Security
      [配置管理] as Config
      [工具类] as Utils
    }
  }
  
  package "数据存储层" {
    [MySQL数据库] as MySQL
    [Redis缓存] as Redis
    [Milvus向量库] as Milvus
  }
  
  package "外部服务层" {
    [OpenAI API] as OpenAI
    [第三方API] as ThirdParty
  }
}

Frontend --> Controllers : HTTP请求
Controllers --> Services : 方法调用
Services --> Repositories : 数据访问
Repositories --> MySQL : SQL查询
Services --> Redis : 缓存操作
Services --> Milvus : 向量检索
Services --> OpenAI : API调用

Components --> StateMgmt : 状态更新
StateMgmt --> APIIntegration : 数据获取
APIIntegration --> Controllers : REST调用

Security --> Controllers : 拦截验证
Config --> Services : 配置注入
Utils --> BusinessLogic : 工具方法

note on link
  遵循分层架构原则
  依赖单向流动
  层间通过接口通信
end note
@enduml
```

---

## 九、对象图 (Object Diagram)

```plantuml
@startuml
object 当前用户 {
  用户ID = 123
  用户名 = "李萌洁"
  用户类型 = "pregnant"
  邮箱 = "limengjie@example.com"
  末次月经日期 = "2025-12-01"
  怀孕时间 = 16周
}

object 今日备忘录 {
  记录ID = 456
  标题 = "产检日记"
  内容 = "今天去医院做了NT检查，一切正常"
  类型 = "daily"
  心情 = "relieved"
  记录时间 = "2026-03-20 10:30:00"
}

object 当前情绪 {
  记录ID = 789
  情绪类型 = "happy"
  强度 = 8
  触发原因 = "检查结果良好"
  记录时间 = "2026-03-20 11:00:00"
}

object 家庭组 {
  家庭ID = 1
  家庭名称 = "李家"
  成员数 = 3
  创建时间 = "2026-01-15"
}

当前用户 --> 今日备忘录 : 创建
当前用户 --> 当前情绪 : 记录
当前用户 --> 家庭组 : 属于

note top of 当前用户
  孕妇用户实例
  怀孕16周状态
end note

note right of 今日备忘录
  今日的健康记录
  包含产检信息
end note
@enduml
```

---

## 十、通信图 (Communication Diagram)

```plantuml
@startuml
actor 用户
participant 前端
participant UserController
participant UserService
participant MemoService
participant AiService
participant MySQL
participant Redis
participant OpenAI

用户 -> 前端 : 1: 登录请求
前端 -> UserController : 2: POST /login
UserController -> UserService : 3: authenticate()
UserService -> MySQL : 4: 查询用户
MySQL --> UserService : 5: 返回用户数据
UserService -> Redis : 6: 缓存用户信息
Redis --> UserService : 7: 确认缓存
UserService --> UserController : 8: 返回Token
UserController --> 前端 : 9: 登录成功
前端 --> 用户 : 10: 显示首页

用户 -> 前端 : 11: 提问AI
前端 -> AiService : 12: 调用chat()
AiService -> MySQL : 13: 获取用户历史
MySQL --> AiService : 14: 返回历史记录
AiService -> OpenAI : 15: 发送问题+上下文
OpenAI --> AiService : 16: 返回AI回复
AiService -> MemoService : 17: 保存对话记录
MemoService -> MySQL : 18: 插入记录
MySQL --> MemoService : 19: 确认保存
MemoService --> AiService : 20: 保存成功
AiService --> 前端 : 21: 返回回复
前端 --> 用户 : 22: 显示AI回答

note left of 用户
  用户交互序列:
  1. 登录系统
  2. 使用AI功能
  3. 自动保存记录
end note
@enduml
```

---

## 十一、交互概览图 (Interaction Overview Diagram)

```plantuml
@startuml
start
:用户访问系统;

ref 用户登录流程

if (登录成功?) then (是)
  :显示主界面;
  
  partition "健康记录模块" {
    ref 记录备忘录流程
    ref 记录情绪流程
    ref 记录宫缩流程
  }
  
  partition "AI咨询模块" {
    ref AI对话流程
    ref 知识检索流程
  }
  
  partition "家庭模块" {
    ref 家庭任务流程
  }
  
  :生成综合报告;
else (否)
  :显示登录错误;
  stop
endif

:用户退出系统;
stop

' 子流程定义
frame 用户登录流程 {
  :输入用户名密码;
  :验证凭证;
  :生成会话Token;
}

frame 记录备忘录流程 {
  :选择记录类型;
  :输入内容;
  :添加标签;
  :保存到数据库;
}

frame AI对话流程 {
  :输入问题;
  :检索相关知识;
  :调用AI模型;
  :返回回答;
}

frame 家庭任务流程 {
  :查看家庭任务;
  :领取或分配任务;
  :更新任务状态;
}
@enduml
```

---

## 十二、时序图补充 - 关键业务流程

### 12.1 多源异构数据处理时序图

```plantuml
@startuml
actor 系统 as System
participant "数据采集器" as Collector
participant "数据清洗器" as Cleaner
participant "数据转换器" as Transformer
participant "向量化引擎" as Vectorizer
participant "Milvus向量库" as VectorDB
participant "知识图谱" as KnowledgeGraph

System -> Collector : 1: 启动数据采集
Collector -> Collector : 2: 从多个源采集数据
note right of Collector
  数据源包括:
  - 医疗文献API
  - 学术数据库
  - 公共健康数据
  - 用户生成内容
end note

Collector --> Cleaner : 3: 传递原始数据
Cleaner -> Cleaner : 4: 数据清洗和去重
Cleaner --> Transformer : 5: 传递清洗后数据

Transformer -> Transformer : 6: 格式标准化
note right of Transformer
  转换任务:
  - 统一数据格式
  - 提取关键信息
  - 结构化处理
end note

Transformer --> Vectorizer : 7: 传递标准化数据
Vectorizer -> Vectorizer : 8: 生成向量嵌入
Vectorizer --> VectorDB : 9: 存储向量数据

Transformer --> KnowledgeGraph : 10: 构建知识图谱
KnowledgeGraph -> KnowledgeGraph : 11: 建立实体关系

System <-- VectorDB : 12: 数据就绪通知
System <-- KnowledgeGraph : 13: 知识图谱就绪

note left of System
  多源异构数据处理流程:
  1. 采集 → 2. 清洗 → 3. 转换
  4. 向量化 → 5. 知识图谱构建
  支持RAG检索和智能分析
end note
@enduml
```

---

## 附录

### A. PlantUML 使用说明

#### A.1 环境配置
```bash
# 安装PlantUML
# 方式1: 使用在线版本 (https://www.plantuml.com/plantuml)
# 方式2: 本地安装
sudo apt-get install plantuml  # Ubuntu
# 或使用Docker
docker run -d -p 8080:8080 plantuml/plantuml-server:jetty
```

#### A.2 常用语法速查
```plantuml
' 基本元素
@startuml
actor 用户
participant 组件
database 数据库
queue 队列

' 关系箭头
用户 -> 组件 : 请求
组件 --> 用户 : 响应
组件 -> 组件 : 调用
组件 ..> 数据库 : 依赖

' 控制结构
alt 条件1
  :操作1;
else 条件2
  :操作2;
end

loop 每次
  :循环操作;
end

group 分组
  :操作A;
  :操作B;
end
@enduml
```

### B. UML图类型总结

| 图类型 | 用途 | 本项目示例 |
|--------|------|-----------|
| 用例图 | 系统功能需求，用户与系统交互 | 用户注册、健康记录、AI咨询 |
| 类图 | 系统静态结构，类之间的关系 | 实体类、DTO、Service、Repository |
| 时序图 | 对象间交互的时间顺序 | 用户登录、AI对话、数据记录 |
| 活动图 | 业务流程和工作流 | 登录流程、记录流程、审批流程 |
| 状态图 | 对象状态变化 | 用户状态、任务状态、订单状态 |
| 组件图 | 系统物理组件部署 | 前端、后端、数据库、缓存 |
| 部署图 | 系统运行环境配置 | 服务器、容器、网络拓扑 |
| 包图 | 代码组织结构和模块划分 | 分层架构、包依赖关系 |
| 对象图 | 特定时刻的对象实例 | 当前用户、今日记录、家庭信息 |
| 通信图 | 对象间消息传递（强调结构） | 系统组件间通信 |
| 交互概览图 | 多个交互流程的组合 | 完整业务流程概览 |

### C. 项目架构映射

#### C.1 UML图与代码对应关系
- **用例图** → `docs/02-需求文档.md` 中的功能需求
- **类图** → `backend/src/main/java/com/anmory/yunji/` 中的Java类
- **时序图** → `backend/src/main/java/com/anmory/yunji/controller/` 中的API端点
- **组件图** → `docker-compose.yml` 和部署配置
- **部署图** → 服务器环境和容器编排

#### C.2 技术栈对应
- **前端组件**：Next.js + React → 组件图中的前端层
- **后端服务**：Spring Boot → 组件图中的后端层
- **数据存储**：MySQL + Redis + Milvus → 数据存储层
- **外部服务**：OpenAI API → 外部服务层

---

## 文档转换说明

本Markdown文档包含完整的PlantUML代码，可通过以下方式转换为可视化UML图：

### 1. 在线转换
访问 [PlantUML在线服务器](https://www.plantuml.com/plantuml)，粘贴PlantUML代码即可生成图片。

### 2. 本地转换
```bash
# 安装PlantUML
sudo apt install plantuml

# 转换单个文件
plantuml -tsvg 孕期宝UML文档.md

# 批量转换所有UML图
plantuml -tsvg "**/*.puml"
```

### 3. IDE插件
- **VSCode**: PlantUML扩展
- **IntelliJ IDEA**: PlantUML integration插件
- **Eclipse**: PlantUML插件

### 4. 转换为DOCX
使用Python脚本将本Markdown文档转换为DOCX格式：
```python
# 需要安装: pip install python-docx markdown
python convert_to_docx.py 孕期宝UML文档.md
```

---

**文档维护**：
- 当项目代码变更时，需同步更新UML图
- 新增功能模块时，补充相应的UML图
- 定期审查架构图与实际代码的一致性

**版本记录**：
- v1.0 (2026-03-20): 初始版本，基于代码分析生成
- 下次更新：项目架构重大变更时