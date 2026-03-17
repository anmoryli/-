"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useBack } from "@/lib/use-back"
import {
  ArrowLeft,
  ChevronDown,
  MessageCircle,
  FileText,
  Mail,
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { toast } from "sonner"

const faqItems = [
  {
    question: "如何修改预产期？",
    answer:
      "进入「我的」页面，点击头像旁边的「编辑」按钮，在弹出的对话框中修改末次月经日或预产期即可。",
  },
  {
    question: "记录可以删除吗？",
    answer:
      "可以的。在「记录」页面，向左滑动您想删除的记录，点击「删除」按钮即可。删除后的记录无法恢复，请谨慎操作。",
  },
  {
    question: "孕期小伴能做什么？",
    answer:
      "孕期小伴专注陪伴你的孕期记录：帮你整理记录、生成本周小结和孕周回顾，辅助写信给宝宝、润色文字，在你不知道写什么时提供记录灵感建议。孕妇本人与配偶均可使用。对话中提及配偶（如老公、老婆）时，系统会尝试向配偶邮箱发送通知，并在回复末尾追加「已发送给配偶了」；若家中未添加配偶或配偶未绑定邮箱，会提示先到「我们的小家」设置。涉及医疗问题时会提醒你咨询医生。",
  },
  {
    question: "对话里提到老公/老婆，为什么没有发邮件也没有追加消息？",
    answer:
      "请确认：1）你已在「我们的小家」中创建或加入家庭，并已将一位成员的关系设为配偶（老公/老婆/丈夫/妻子等）；2）该配偶账号已绑定邮箱（在「我的」或设置中可绑定）。满足后，在孕期小伴中发送包含配偶关键词的消息，回复结束后会发送邮件并在对话中追加「已发送给配偶了」。若仍无反应，请查看后端日志中的「配偶提及」相关输出。",
  },
  {
    question: "爸爸成长营与站内消息怎么用？",
    answer:
      "「爸爸成长营」在「我的」中进入，可查看分配给你的家庭任务（如陪同产检、情感任务）。孕妇在「我们的小家」页面点击「为 TA 生成本周小任务」即可为配偶生成本周小任务，配偶会在「站内消息」中收到任务通知。在「我的」→「站内消息」可查看所有通知并标记已读。",
  },
  {
    question: "健康值是什么？怎么增加？",
    answer:
      "健康值是对您孕期行为的正向激励。完成胎动记录、情绪记录、放松练习、饮食打卡等都会增加当日健康值（有上限）。在「目标与成就」页面可查看最近健康值成长曲线与当日健康值。",
  },
  {
    question: "如何保护我的隐私？",
    answer:
      "您可以在「隐私设置」中管理您的隐私选项。在发布或编辑记录时可设置可见范围（指定谁可见或谁不可见），严格保护您的个人信息。",
  },
  {
    question: "忘记密码怎么办？",
    answer:
      "若已绑定邮箱，可在登录页通过「找回密码」重置。登录后可在「我的」→「修改密码」中随时修改密码，请牢记新密码。",
  },
  {
    question: "如何注销账号？",
    answer:
      "如需注销账号，请通过「联系客服」功能提交申请，我们会在 3 个工作日内处理您的请求。注销后账号数据将无法恢复。",
  },
  {
    question: "我们的小家怎么用？",
    answer:
      "进入「我的」→「我们的小家」。创建者点击「创建家庭」获取 6 位邀请码，复制后发给家人。家人在「我们的小家」页面点「通过邀请码加入其他家庭」，输入邀请码并选择与孕妇的关系（如配偶、爸爸、妈妈或自定义）即可加入。一名孕妇只能设置一名配偶；配偶可使用孕期小伴并接收提及邮件。邀请码有效期 7 天。",
  },
]

export default function HelpPage() {
  const router = useRouter()
  const goBack = useBack("/profile")

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4" style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(24px) saturate(1.3)", WebkitBackdropFilter: "blur(24px) saturate(1.3)" }}>
        <button
          onClick={goBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary transition-colors active:bg-secondary/80"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold">帮助中心</h1>
      </div>

      <div className="space-y-4 px-4 pb-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/profile/contact")}
            className="flex flex-col items-center gap-2 rounded-2xl bg-card py-5 transition-colors active:bg-secondary"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MessageCircle className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium text-foreground">
              联系客服
            </span>
          </button>

          <button
            onClick={() => router.push("/profile/guide")}
            className="flex flex-col items-center gap-2 rounded-2xl bg-card py-5 transition-colors active:bg-secondary"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-2/10 text-chart-2">
              <FileText className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium text-foreground">
              使用指南
            </span>
          </button>
        </div>

        {/* FAQ */}
        <div>
          <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">
            常见问题
          </p>
          <div className="overflow-hidden rounded-2xl bg-card">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className={index < faqItems.length - 1 ? "border-b" : ""}
                >
                  <AccordionTrigger className="px-4 py-4 text-sm font-medium text-foreground hover:no-underline [&[data-state=open]>svg]:rotate-180">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* Contact */}
        <div>
          <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">
            联系我们
          </p>
          <div className="overflow-hidden rounded-2xl bg-card">
            <button
              onClick={() => {
                navigator.clipboard.writeText("anmory@qq.com")
                toast.success("邮箱已复制到剪贴板")
              }}
              className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors active:bg-secondary"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-chart-3/10 text-chart-3">
                <Mail className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">客服邮箱</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  anmory@qq.com
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
