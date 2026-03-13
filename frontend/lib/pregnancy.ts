import { differenceInDays, addDays, format } from "date-fns"
import { zhCN } from "date-fns/locale"

/** 预产期倒计时温馨文案 */
export function getCountdownMessage(daysRemaining: number): string {
  if (daysRemaining <= 0) return "宝宝已经到来，恭喜你！"
  if (daysRemaining <= 7) return "宝宝快要和你见面啦"
  if (daysRemaining <= 14) return "倒计时两周，做好迎接准备噢"
  if (daysRemaining <= 30) return "最后一个月，保持好心情"
  if (daysRemaining <= 100) return "孕期已过半，继续保持"
  if (daysRemaining <= 140) return "宝宝在慢慢长大，记得按时产检"
  return "每一个今天，都是和宝宝更近一步"
}

/**
 * 根据「怀孕起算日」（末次月经）和「预产期」计算孕周等信息。
 * 孕周以末次月经为基准。若只传预产期（兼容旧数据），则用 预产期-280 天反推起算日。
 */
export function getPregnancyInfo(lastMenstrualDateStr: string, dueDateStr?: string) {
  const today = new Date()
  const dueDate = dueDateStr ? new Date(dueDateStr) : new Date(lastMenstrualDateStr)
  const lmp = dueDateStr ? new Date(lastMenstrualDateStr) : addDays(dueDate, -280)

  const totalDays = 280
  const daysPassed = Math.max(0, differenceInDays(today, lmp))
  const daysRemaining = Math.max(0, differenceInDays(dueDate, today))
  const weeksPregnant = Math.floor(daysPassed / 7)
  const daysInCurrentWeek = daysPassed % 7
  const progress = Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100)
  const trimester = weeksPregnant < 13 ? 1 : weeksPregnant < 27 ? 2 : 3

  return {
    dueDate,
    daysPassed,
    daysRemaining,
    weeksPregnant: Math.min(weeksPregnant, 42),
    daysInCurrentWeek,
    progress,
    trimester,
    dueDateFormatted: format(dueDate, "yyyy年M月d日", { locale: zhCN }),
  }
}

export function getBabySize(week: number): { name: string; size: string } {
  const sizes: Record<number, { name: string; size: string }> = {
    4: { name: "芝麻粒", size: "0.1cm" },
    5: { name: "芝麻", size: "0.2cm" },
    6: { name: "小扁豆", size: "0.6cm" },
    7: { name: "蓝莓", size: "1.3cm" },
    8: { name: "覆盆子", size: "1.6cm" },
    9: { name: "葡萄", size: "2.3cm" },
    10: { name: "金桔", size: "3.1cm" },
    11: { name: "无花果", size: "4.1cm" },
    12: { name: "青柠", size: "5.4cm" },
    13: { name: "柠檬", size: "7.4cm" },
    14: { name: "桃子", size: "8.7cm" },
    15: { name: "苹果", size: "10.1cm" },
    16: { name: "牛油果", size: "11.6cm" },
    17: { name: "梨", size: "13cm" },
    18: { name: "红薯", size: "14.2cm" },
    19: { name: "芒果", size: "15.3cm" },
    20: { name: "香蕉", size: "25.6cm" },
    21: { name: "胡萝卜", size: "26.7cm" },
    22: { name: "木瓜", size: "27.8cm" },
    23: { name: "葡萄柚", size: "28.9cm" },
    24: { name: "玉米", size: "30cm" },
    25: { name: "花菜", size: "34.6cm" },
    26: { name: "大白菜", size: "35.6cm" },
    27: { name: "生菜", size: "36.6cm" },
    28: { name: "茄子", size: "37.6cm" },
    29: { name: "南瓜", size: "38.6cm" },
    30: { name: "大白菜", size: "39.9cm" },
    31: { name: "椰子", size: "41.1cm" },
    32: { name: "哈密瓜", size: "42.4cm" },
    33: { name: "菠萝", size: "43.7cm" },
    34: { name: "甜瓜", size: "45cm" },
    35: { name: "蜜瓜", size: "46.2cm" },
    36: { name: "长生菜", size: "47.4cm" },
    37: { name: "冬瓜", size: "48.6cm" },
    38: { name: "西瓜", size: "49.8cm" },
    39: { name: "小南瓜", size: "50.7cm" },
    40: { name: "大西瓜", size: "51.2cm" },
  }

  const clampedWeek = Math.min(Math.max(week, 4), 40)
  return sizes[clampedWeek] || { name: "小宝贝", size: "成长中" }
}

export function getWeeklyTip(week: number): string {
  const tips: Record<number, string> = {
    4: "胚胎已经着床，开始补充叶酸",
    5: "心脏开始跳动，注意休息",
    6: "大脑开始发育，保持好心情",
    7: "手臂和腿部开始形成",
    8: "宝宝开始活动，但妈妈还感受不到",
    9: "所有重要器官已开始发育",
    10: "骨骼开始变硬，指甲开始生长",
    11: "宝宝开始打哈欠和伸展",
    12: "第一孕期结束，孕吐可能减轻",
    13: "进入第二孕期，精力渐恢复",
    14: "宝宝开始练习吞咽和呼吸",
    15: "能感受到宝宝的味觉在发育",
    16: "可能感受到第一次胎动了",
    17: "脂肪开始积累，保持营养均衡",
    18: "宝宝能听到妈妈的声音了",
    19: "五感正在快速发育",
    20: "孕期过半，可以做排畸检查",
    21: "宝宝开始有规律的睡眠模式",
    22: "眉毛和眼睑已经形成",
    23: "宝宝开始快速增重",
    24: "肺部正在发育表面活性物质",
    25: "宝宝开始有自己的作息规律",
    26: "眼睛开始睁开，能看到光线",
    27: "进入第三孕期，注意休息",
    28: "宝宝开始做梦了",
    29: "大脑发育迅速，多补充DHA",
    30: "宝宝开始头朝下准备出生",
    31: "五感已经完全发育",
    32: "指甲和头发继续生长",
    33: "骨骼继续硬化，补充钙质",
    34: "肺部接近成熟",
    35: "宝宝的肾脏已经完全发育",
    36: "准备待产包，随时做好准备",
    37: "足月了，宝宝随时可能到来",
    38: "继续记录胎动，保持心情愉快",
    39: "多散步有助于顺产",
    40: "预产期到了，宝宝即将到来",
  }

  const clampedWeek = Math.min(Math.max(week, 4), 40)
  return tips[clampedWeek] || "保持好心情，注意均衡饮食"
}

/** 每日温暖一句：提升幸福感的温馨语录，按日期轮换 */
const DAILY_WARMTH_MESSAGES = [
  "今天也要好好爱自己，你已经很棒了",
  "每一个小记录，都是给宝宝最好的礼物",
  "慢慢来，享受和宝宝在一起的每一刻",
  "你的笑容，是宝宝感受到的第一束光",
  "记录下此刻的心情，未来会感谢今天的你",
  "孕期时光独一无二，值得被好好珍藏",
  "小小的日常，组成了最珍贵的回忆",
  "你做的每一条记录，都是爱的见证",
  "放松一点，今天也要对自己温柔",
  "孕育生命的你，本身就充满力量",
  "把今天的美好记下来，留给未来的自己",
  "和宝宝说句悄悄话吧，他会听到的",
  "记录让时光有迹可循，温暖可回味",
  "愿你今天心情明媚，如春日阳光",
]

export function getDailyWarmth(): string {
  const now = new Date()
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  )
  const index = dayOfYear % DAILY_WARMTH_MESSAGES.length
  return DAILY_WARMTH_MESSAGES[index] ?? DAILY_WARMTH_MESSAGES[0]
}
