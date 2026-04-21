'use client'
import { Article } from '../types'
import ArticleCard from './ArticleCard'

interface Props {
  articles: Article[]
  showCategory?: boolean
  cols?: number
}

/**
 * Greedy shortest-column assignment.
 *
 * Each article goes to the column with the least accumulated estimated height.
 * On ties the leftmost column wins, which approximates left-to-right reading order.
 *
 * Height estimates are reliable now that thum.io fallback is removed:
 *   • article.thumbnail set   → image card  ≈ TALL px
 *   • article.thumbnail null  → text card   ≈ SHORT px
 */
const TALL = 420   // image card (colour block + image + title/meta)
const SHORT = 240  // text-only card (min-h-52 + title/meta)

export default function MasonryGrid({ articles, showCategory = false, cols = 3 }: Props) {
  if (!articles.length) {
    return (
      <div className="text-center text-gray-400 py-20 text-sm">
        No articles yet. Run the fetcher to populate content.
      </div>
    )
  }

  const columns: Article[][] = Array.from({ length: cols }, () => [])
  const heights = Array(cols).fill(0)

  for (const article of articles) {
    // Pick the shortest column (leftmost on tie)
    let col = 0
    for (let c = 1; c < cols; c++) {
      if (heights[c] < heights[col]) col = c
    }
    columns[col].push(article)
    heights[col] += article.thumbnail ? TALL : SHORT
  }

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
