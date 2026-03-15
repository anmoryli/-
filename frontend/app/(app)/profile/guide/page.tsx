"use client"

import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Home,
  BookOpen,
  Bot,
  Users,
  ListTodo,
  Bell,
  Heart,
  Wind,
  Target,
  MessageSquare,
  Settings,
} from "lucide-react"

const sections = [
  {
    title: "首页",
    icon: Home,
    items: [
      "查看孕期进度、孕周和预产期",
      "「本周提示」了解当前孕周注意事项",
      "「宝宝大小」直观感受胎儿发育",
      "快速进入记录、孕期小伴，记录每一天的珍贵时刻",
    ],
  },
  {
    title: "孕期记录",
    icon: BookOpen,
    items: [
      "支持文字、照片、语音、文件四种记录方式",
      "文字记录可自动生成标题与分类标签",
      "多张照片可左右滑动浏览，点击查看大图",
      "语音支持转文字（需配置语音识别）",
      "文件支持 PDF、Word、Excel、图片预览",
      "可设置记录可见范围（谁可见/谁不可见）",
      "在记录页右上角可导出全部记录为 PDF",
    ],
  },
  {
    title: "记录助手（AI 对话）",
    icon: Bot,
    items: [
      "仅孕妇与配偶可使用孕期小伴；其他家庭成员底部不显示入口",
      "帮您整理记录、生成本周小结和孕周回顾，辅助写信给宝宝、提供记录灵感",
      "孕妇在对话中提及老公/配偶时，会向配偶发邮件并追加「已发送给配偶了」",
      "配偶在对话中提及老婆/配偶时，会向孕妇发邮件并追加「已发送给老婆了」",
      "涉及医疗问题时会提醒咨询医生；配偶端不展示「发布到社区」相关功能",
    ],
  },
  {
    title: "我们的小家",
    icon: Users,
    items: [
      "创建家庭并生成邀请码，家人通过邀请码加入",
      "成员关系可设为配偶、爸爸、妈妈等，支持自定义关系",
      "一名孕妇仅可设置一名配偶；配偶可使用孕期小伴并接收提及通知",
      "可设置记录的可见范围，指定谁可见或谁不可见",
    ],
  },
  {
    title: "爸爸成长营",
    icon: ListTodo,
    items: [
      "仅孕妇与配偶在「我的」中可见爸爸成长营入口；其他家庭成员不显示",
      "孕妇可在「我们的小家」中为配偶生成本周小任务（如陪同产检、情感任务）",
      "任务会通过站内消息与邮件推送给配偶；配偶完成可打勾并查看详情",
      "支持常规任务与情感连接任务（如每日一个拥抱、和宝宝说晚安）",
    ],
  },
  {
    title: "站内消息",
    icon: Bell,
    items: [
      "在「我的」中进入「站内消息」查看通知",
      "任务分配、系统通知等会在此展示",
      "可标记已读，便于跟进待办",
    ],
  },
  {
    title: "健康值与目标",
    icon: Heart,
    items: [
      "完成胎动记录、情绪记录、放松练习、饮食打卡等可获得健康值",
      "健康值即时反馈，激励「为宝宝做一件了不起的事」",
      "在「目标与成就」中查看健康值成长曲线与当日健康值",
    ],
  },
  {
    title: "放松练习",
    icon: Wind,
    items: [
      "呼吸节奏训练（如 4-7-8、4-4-4），从生理层面帮助放松",
      "专业疗愈音乐与引导式冥想建议",
      "完成放松练习可获得健康值奖励",
    ],
  },
  {
    title: "时间线与社区",
    icon: MessageSquare,
    items: [
      "时间线按日期浏览孕期记录与重要节点",
      "社区仅孕妇可见（底部导航）；配偶与其他家庭成员不展示社区入口",
      "孕妇可在 AI 图生图完成后选择公开到社区；社区可浏览他人分享内容",
    ],
  },
  {
    title: "个人中心",
    icon: Settings,
    items: [
      "编辑末次月经日、预产期，上传头像、修改密码",
      "邮箱（用于找回密码、配偶提及通知及爸爸成长营任务邮件提醒）",
      "爸爸成长营（仅孕妇/配偶）、站内消息、我的模板作品、我们的小家",
      "隐私设置、通用设置、使用指南、帮助中心、联系客服",
    ],
  },
]

export default function GuidePage() {
  const router = useRouter()

  return (
    <div className="min-h-dvh bg-background">
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-background/95 px-4 py-4 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary transition-colors active:bg-secondary/80"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">使用指南</h1>
      </div>

      <div className="space-y-6 px-4 pb-8">
        <p className="text-sm text-muted-foreground">
          孕期宝专注孕期记录，把每一天都留下来，成为你和宝宝最珍贵的回忆。
        </p>
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <div key={section.title} className="rounded-2xl bg-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
              </div>
              <ul className="mt-4 space-y-2">
                {section.items.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="text-primary">·</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
