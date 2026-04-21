'use client'
import { Article } from '../types'
import ArticleCard from './ArticleCard'

interface Props {
  articles: Article[]
  showCategory?: boolean
  cols?: number
}

/**
 * Distribute articles into columns using round-robin.
 *
 * Round-robin guarantees:
 *   • Left-to-right, row-by-row reading order is preserved.
 *   • Card counts differ by at most 1 between columns.
 *   • When N % cols ≠ 0 the *last* column ends up with one fewer card
 *     (right-side taper), which is less visually jarring than a short
 *     middle column.
 *   • For PAGE_SIZE = 30 (divisible by 3) there is zero gap.
 */

export default function MasonryGrid({ articles, showCategory = false, cols = 3 }: Props) {
  if (!articles.length) {
    return (
      <div className="text-center text-gray-400 py-20 text-sm">
        No articles yet. Run the fetcher to populate content.
      </div>
    )
  }

  const columns: Article[][] = Array.from({ length: cols }, () => [])
  articles.forEach((article, i) => columns[i % cols].push(article))

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
