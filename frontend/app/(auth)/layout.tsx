import { AuthProvider } from "@/lib/auth-context"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-dvh flex items-center justify-center p-6" style={{ backgroundColor: "var(--background)" }}>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </AuthProvider>
  )
}
