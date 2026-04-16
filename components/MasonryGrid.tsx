'use client'
import { Article } from '../types'
import ArticleCard from './ArticleCard'

interface Props {
  articles: Article[]
  showCategory?: boolean
  cols?: number
}

/** Rough height estimate (px) so we can balance columns without measuring the DOM. */
function estimateCardHeight(a: Article): number {
  const hasImage = Boolean(a.thumbnail)
  const titleLen = (a.title || '').length
  const descLen = (a.description || '').length

  if (hasImage) {
    // image block (~200) + padding (80) + title lines + desc + meta
    const titleLines = Math.ceil(titleLen / 28)
    const descLines = descLen > 0 ? Math.ceil(Math.min(descLen, 100) / 40) : 0
    return 280 + titleLines * 28 + descLines * 20 + 40
  }
  // text-only card: min-h 208 + title + desc + meta
  const titleLines = Math.ceil(titleLen / 22)
  const descLines = descLen > 0 ? Math.ceil(Math.min(descLen, 100) / 36) : 0
  return Math.max(208, 80 + titleLines * 28 + descLines * 20 + 60)
}

/**
 * Distribute articles into columns with two goals:
 *   1. Preserve approximate left-to-right reading order (row by row)
 *   2. Keep column heights balanced so the bottom edge is roughly even
 *
 * Algorithm: process articles in row-groups of `cols`. Within each group,
 * assign each article to the column with the smallest accumulated height,
 * but only among the columns that haven't received an article in this group yet.
 * This way each "row" still fills left-to-right-ish, but tall cards get
 * placed in shorter columns first.
 */
function balancedDistribute(articles: Article[], cols: number): Article[][] {
  const columns: Article[][] = Array.from({ length: cols }, () => [])
  const heights: number[] = new Array(cols).fill(0)

  for (let i = 0; i < articles.length; i += cols) {
    const group = articles.slice(i, i + cols)

    // Build (article, estimatedHeight) pairs
    const items = group.map(a => ({ article: a, h: estimateCardHeight(a) }))

    // Sort items tallest-first so tall cards go into the shortest columns
    const sorted = items
      .map((item, idx) => ({ ...item, origIdx: idx }))
      .sort((a, b) => b.h - a.h)

    const usedCols = new Set<number>()

    for (const item of sorted) {
      // Find the shortest available column
      let bestCol = -1
      let bestH = Infinity
      for (let c = 0; c < cols; c++) {
        if (usedCols.has(c)) continue
        if (heights[c] < bestH) {
          bestH = heights[c]
          bestCol = c
        }
      }
      if (bestCol === -1) break
      usedCols.add(bestCol)
      columns[bestCol].push(item.article)
      heights[bestCol] += item.h + 32 // 32 ≈ gap between cards
    }
  }

  return columns
}

export default function MasonryGrid({ articles, showCategory = false, cols = 3 }: Props) {
  if (!articles.length) {
    return (
      <div className="text-center text-gray-400 py-20 text-sm">
        No articles yet. Run the fetcher to populate content.
      </div>
    )
  }

  const columns = balancedDistribute(articles, cols)

  return (
    <div className="flex gap-6 md:gap-8 items-start">
      {columns.map((col, ci) => (
        <div key={ci} className="flex-1 flex flex-col gap-6 md:gap-8">
          {col.map(article => (
            <ArticleCard key={article.id} article={article} showCategory={showCategory} />
          ))}
        </div>
      ))}
    </div>
  )
}
