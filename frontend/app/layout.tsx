import type { Metadata, Viewport } from 'next'
import { Noto_Sans_SC, Noto_Serif_SC } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from "@/components/ui/sonner"
import './globals.css'

const notoSansSC = Noto_Sans_SC({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans" })
const notoSerifSC = Noto_Serif_SC({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-serif" })

export const viewport: Viewport = {
  themeColor: '#E3B8B0',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: '孕期宝 - 把每一天都留下来',
  description: '专注孕期记录，文字、照片、语音、写信给宝宝。把每一天都留下来，成为你和宝宝最珍贵的回忆',
  manifest: '/manifest.json',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${notoSansSC.variable} ${notoSerifSC.variable} antialiased`} style={{ fontFamily: 'var(--font-zhongsong)' }} suppressHydrationWarning>
        {children}
        <Toaster position="top-center" />
        <Analytics />
      </body>
    </html>
  )
}
