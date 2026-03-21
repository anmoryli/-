/** 心情选项与标签（与后端 mood_record.mood 一致） */
export const MOOD_OPTIONS = [
  { key: "happy", label: "开心", emoji: "😊" },
  { key: "calm", label: "平静", emoji: "😌" },
  { key: "tired", label: "疲惫", emoji: "😴" },
  { key: "anxious", label: "焦虑", emoji: "😟" },
  { key: "peaceful", label: "安心", emoji: "🧘" },
  { key: "excited", label: "兴奋", emoji: "🤩" },
  { key: "grateful", label: "感恩", emoji: "🙏" },
  { key: "sleepy", label: "困倦", emoji: "😪" },
  { key: "energetic", label: "精力充沛", emoji: "💪" },
  { key: "sad", label: "难过", emoji: "😢" },
  { key: "worried", label: "担忧", emoji: "😰" },
  { key: "relaxed", label: "放松", emoji: "😊" },
  { key: "stressed", label: "紧张", emoji: "😣" },
  { key: "nervous", label: "忐忑", emoji: "😬" },
  { key: "joyful", label: "喜悦", emoji: "😄" },
  { key: "content", label: "满足", emoji: "😊" },
  { key: "irritable", label: "烦躁", emoji: "😤" },
  { key: "expectant", label: "期待", emoji: "😊" },
] as const

export const MOOD_LABELS: Record<string, string> = Object.fromEntries(
  MOOD_OPTIONS.map((m) => [m.key, m.label])
)
