"use client"

/**
 * 顶部沉浸式毛玻璃 hero — 参考图一：渐变底色透出毛玻璃，温暖光晕
 */
export function HeroBanner() {
  return (
    <div className="relative -mx-5 -mt-6 mb-4 overflow-hidden min-h-[160px]">
      <div
        className="absolute inset-0"
        style={{
          background: `rgba(255, 255, 255, 0.3)`,
          backdropFilter: "blur(24px) saturate(1.3)",
          WebkitBackdropFilter: "blur(24px) saturate(1.3)",
        }}
      />
      {/* 柔和渐变光晕 */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 30% 20%, rgba(255, 200, 180, 0.35) 0%, transparent 60%),
            radial-gradient(ellipse 100% 60% at 70% 70%, rgba(200, 230, 210, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse 80% 50% at 50% 40%, rgba(240, 200, 230, 0.25) 0%, transparent 55%)
          `,
        }}
      />
      {/* 孕妇剪影 — 温柔光圈 */}
      <div className="relative flex min-h-[130px] items-end justify-center px-6 pb-5">
        <div
          className="h-16 w-16 rounded-full"
          style={{
            background: "radial-gradient(circle at 40% 40%, rgba(244, 166, 184, 0.5), rgba(248, 196, 206, 0.2))",
            boxShadow: "0 0 40px rgba(244, 166, 184, 0.3), 0 0 80px rgba(244, 166, 184, 0.1)",
          }}
        />
      </div>
    </div>
  )
}
