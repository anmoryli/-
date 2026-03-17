import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from "@/components/ui/sonner"
import './globals.css'

/* 字体由 globals.css 的 --font-sans / --font-serif 定义，避免 next/font 与 Turbopack 的兼容性问题 */

export const viewport: Viewport = {
  themeColor: '#F4A6B8',
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
        url: '/icon.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.png',
        type: 'image/svg+xml',
      },
    ],
    apple: '/icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <Toaster position="top-center" />
        <Analytics />
      </body>
    </html>
  )
}
