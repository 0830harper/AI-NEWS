'use client'
import { useMemo } from 'react'
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
// Measured from real cards (column ~395px wide, og:image typically 16:9 → image ~165px,
// but many logos/art are square/portrait → average closer to 260px, plus pt-10 block + text area):
const TALL = 500   // image card: colour-block (≈300px) + text (≈130px) + gap (≈32px) + mb-8 (≈32px)
const SHORT = 260  // text-only: min-h-52 (208px) + title/desc/meta (≈52px)

export default function MasonryGrid({ articles, showCategory = false, cols = 3 }: Props) {
  const columns = useMemo(() => {
    const cols_: Article[][] = Array.from({ length: cols }, () => [])
    const heights = Array(cols).fill(0)
    for (const article of articles) {
      let col = 0
      for (let c = 1; c < cols; c++) {
        if (heights[c] < heights[col]) col = c
      }
      cols_[col].push(article)
      heights[col] += article.thumbnail ? TALL : SHORT
    }
    return cols_
  }, [articles, cols])

  if (!articles.length) {
    return (
      <div className="text-center text-gray-400 py-20 text-sm">
        No articles yet. Run the fetcher to populate content.
      </div>
    )
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
