import { Article } from '../types'

export const TALL = 500   // image card estimated height
export const SHORT = 260  // text-only card estimated height

/**
 * After greedy assignment, trim the last card from the tallest column if it
 * sticks out by more than half a SHORT card vs the shortest column.
 * Runs up to 2 passes so a 2-card overhang is also fixed.
 * Purely estimate-based — no DOM measurement, no oscillation risk.
 */
export function trimToBalance(cols: Article[][]): Article[][] {
  const result = cols.map(c => [...c])
  for (let pass = 0; pass < 5; pass++) {
    const heights = result.map(col =>
      col.reduce((h, a) => h + (a.thumbnail ? TALL : SHORT), 0),
    )
    const maxH = Math.max(...heights)
    const minH = Math.min(...heights)
    if (maxH - minH <= SHORT / 2) break
    result[heights.indexOf(maxH)].pop()
  }
  return result
}

/**
 * Greedy shortest-column assignment.
 * startHeights defaults to zeros (full rebuild); pass real DOM heights for
 * incremental Load More so new articles extend from actual column bottoms.
 */
export function buildColumns(
  articles: Article[],
  numCols: number,
  startHeights: number[] = Array.from({ length: numCols }, () => 0),
): Article[][] {
  const cols: Article[][] = Array.from({ length: numCols }, () => [])
  const heights = [...startHeights]
  for (const article of articles) {
    let min = 0
    for (let c = 1; c < numCols; c++) if (heights[c] < heights[min]) min = c
    cols[min].push(article)
    heights[min] += article.thumbnail ? TALL : SHORT
  }
  return cols
}
