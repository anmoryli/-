"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DateInputProps {
  id?: string
  label?: string
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  placeholder?: string
  className?: string
}

/**
 * 简约原生日期选择：仅对 type="date" 做轻度美化，保持原生交互。
 * 提交格式为 YYYY-MM-DD。
 */
export function DateInput({
  id,
  label,
  value,
  onChange,
  min,
  max,
  placeholder = "请选择日期",
  className = "",
}: DateInputProps) {
  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      {label && (
        <Label htmlFor={id} className="text-caption font-medium text-[var(--foreground)]">
          {label}
        </Label>
      )}
      <Input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        placeholder={placeholder}
        className="h-11 rounded-lg border-[var(--card-border)] bg-[var(--card)] text-[15px] text-[var(--foreground)] focus:border-[var(--accent-1)] focus:ring-1 focus:ring-[var(--accent-1)]/30"
      />
    </div>
  )
}
