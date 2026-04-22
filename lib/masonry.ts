import { Article } from '../types'

export const TALL = 500   // image card estimated height
export const SHORT = 260  // text-only card estimated height

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
