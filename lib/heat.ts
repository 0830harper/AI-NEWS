// 热度分算法：对数热度 × 时间衰减
// 7天内线性衰减到0，7天外固定0
export function calcHeatScore(rawScore: number, publishedAt: Date): number {
  const ageHours = (Date.now() - publishedAt.getTime()) / 3_600_000
  const timeFactor = Math.max(0, 1 - ageHours / 168) // 168h = 7天
  const scoreFactor = Math.log(1 + rawScore)
  return Math.round(scoreFactor * timeFactor * 100) / 100
}
