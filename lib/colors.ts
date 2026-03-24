export const CARD_COLORS = [
  '#FFE066', // 明黄
  '#FF6B6B', // 珊瑚红
  '#6BCB77', // 草绿
  '#4D96FF', // 天蓝
  '#FF9F1C', // 橙
  '#C77DFF', // 薰衣草紫
  '#00C9A7', // 薄荷青
  '#FF6FD8', // 亮粉
  '#AACC00', // 黄绿
  '#00B4D8', // 蓝绿
]

export function randomColor(): string {
  return CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)]
}

/** Returns true if the hex color is light enough to need dark text. */
export function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  // Perceived luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6
}
