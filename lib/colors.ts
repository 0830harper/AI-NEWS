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
