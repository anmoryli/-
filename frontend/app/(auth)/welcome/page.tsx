"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

const slides = [
  {
    Illustration: HeartIllustration,
    title: "孕期宝",
    slogan: "把每一天都留下来",
    desc: "成为你和宝宝最珍贵的回忆",
  },
  {
    Illustration: BookIllustration,
    title: "孕期记录",
    slogan: null,
    desc: "文字、照片、语音、文件，记录每一天的珍贵时刻。可设置可见范围、导出 PDF。",
  },
  {
    Illustration: CameraIllustration,
    title: "照片与日记",
    slogan: null,
    desc: "记录产检、胎动、心情，生成专属孕期日记。语音随时说，自动转文字保存。",
  },
  {
    Illustration: MessageIllustration,
    title: "孕期小伴",
    slogan: null,
    desc: "孕妇与配偶均可使用。整理记录、写信给宝宝、回顾时光；提及配偶可代为发邮件通知。",
  },
  {
    Illustration: UsersIllustration,
    title: "我们的小家",
    slogan: null,
    desc: "创建家庭、邀请码加入。关系可设为配偶/爸爸/妈妈等，一名孕妇仅一名配偶，配偶可用孕期小伴。",
  },
  {
    Illustration: ListIllustration,
    title: "爸爸成长营",
    slogan: null,
    desc: "孕妇可为配偶生成本周小任务（陪同产检、情感任务），站内消息与邮件提醒，完成即打勾。",
  },
  {
    Illustration: HeartPulseIllustration,
    title: "健康值与放松",
    slogan: null,
    desc: "胎动、情绪、放松、饮食打卡获得健康值；呼吸训练、疗愈音乐与引导冥想，从生理层面放松。",
  },
  {
    Illustration: BellIllustration,
    title: "站内消息与社区",
    slogan: null,
    desc: "任务通知、系统消息在站内查看。孕妇可图生图后公开到社区，仅孕妇可见社区入口。",
  },
]

const totalSteps = slides.length + 1

function HeartIllustration() {
  return (
    <div className="welcome-animate-heart flex h-24 w-24 items-center justify-center">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-1)]">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </div>
  )
}

function BookIllustration() {
  return (
    <div className="welcome-animate-float flex h-24 w-24 items-center justify-center">
      <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-1)]">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M8 7h8" />
        <path d="M8 11h6" />
      </svg>
    </div>
  )
}

function CameraIllustration() {
  return (
    <div className="welcome-animate-float-slow flex h-24 w-24 items-center justify-center">
      <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-1)]">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    </div>
  )
}

function MessageIllustration() {
  return (
    <div className="welcome-animate-pulse flex h-24 w-24 flex-col items-center justify-center gap-1">
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-1)]">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      <div className="welcome-animate-dots flex gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-1)]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-1)]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-1)]" />
      </div>
    </div>
  )
}

function UsersIllustration() {
  return (
    <div className="welcome-animate-float flex h-24 w-24 items-center justify-center">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-1)]">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    </div>
  )
}

function ListIllustration() {
  return (
    <div className="welcome-animate-float-slow flex h-24 w-24 items-center justify-center">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-1)]">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    </div>
  )
}

function HeartPulseIllustration() {
  return (
    <div className="welcome-animate-pulse flex h-24 w-24 items-center justify-center">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-1)]">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        <path d="M2 12h4l2-3 2 6 2-3 4" />
      </svg>
    </div>
  )
}

function BellIllustration() {
  return (
    <div className="welcome-animate-float flex h-24 w-24 items-center justify-center">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-1)]">
        <path d="M10.268 21a2 2 0 0 0 3.464 0" />
        <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
      </svg>
    </div>
  )
}

export default function WelcomePage() {
  const [step, setStep] = useState(0)

  const isLast = step === totalSteps - 1

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-8 pb-8 pt-12">
        {step < slides.length ? (
          <>
            <div className="mb-10 flex h-28 w-28 items-center justify-center rounded-full border border-[var(--accent-1)]/40 bg-[var(--accent-1-muted)]">
              {(() => {
                const { Illustration } = slides[step]
                return <Illustration />
              })()}
            </div>
            <h1
              className="text-center text-3xl font-semibold text-[var(--foreground)]"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {slides[step].title}
            </h1>
            {(slides[step] as { slogan?: string | null }).slogan && (
              <p className="mt-2 text-center text-lg font-medium text-[var(--accent-1)]">
                {(slides[step] as { slogan: string }).slogan}
              </p>
            )}
            <p className="mt-4 max-w-md text-center text-lg leading-relaxed text-[var(--foreground-secondary)]">
              {slides[step].desc}
            </p>
          </>
        ) : (
          <div className="w-full space-y-6 text-center">
            <h1
              className="text-2xl font-semibold text-[var(--foreground)]"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              开始使用
            </h1>
            <p className="text-base text-[var(--foreground-secondary)]">登录或注册，记录你的孕期时光</p>
            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="/register"
                className="flex items-center justify-center rounded-xl py-4 text-[15px] font-semibold transition-opacity active:opacity-90"
                style={{ backgroundColor: "var(--accent-2)", color: "var(--foreground)" }}
              >
                立即注册
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--card)] py-4 text-[15px] font-medium text-[var(--foreground)]"
              >
                已有账号，去登录
              </Link>
            </div>
          </div>
        )}
      </div>

      {!isLast && (
        <div className="flex items-center justify-between px-8 pb-10 pt-4">
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i === step ? "bg-[var(--accent-1)]" : "bg-[var(--foreground-muted)]/40"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="flex items-center gap-1 rounded-full border border-[var(--accent-1)]/50 bg-[var(--accent-1-muted)] px-5 py-2.5 text-[14px] font-medium text-[var(--accent-1)]"
          >
            下一页
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  )
}
