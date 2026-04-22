'use client'
import { useMemo } from 'react'
import { Article } from '../types'
import ArticleCard from './ArticleCard'

interface Props {
  articles: Article[]
  showCategory?: boolean
  cols?: number
}

// Image card: colour block + image + text area + gap
const TALL = 500
// Text-only card: min-h-36 on mobile / min-h-52 on desktop + padding
const SHORT = 260

export default function MasonryGrid({ articles, showCategory = false, cols = 3 }: Props) {
  const columns = useMemo(() => {
    const cols_: Article[][] = Array.from({ length: cols }, () => [])
    const heights = Array(cols).fill(0)
    for (const article of articles) {
      let min = 0
      for (let c = 1; c < cols; c++) if (heights[c] < heights[min]) min = c
      cols_[min].push(article)
      heights[min] += article.thumbnail ? TALL : SHORT
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
    <div data-testid="masonry-grid" className="flex gap-6 md:gap-8 items-start">
      {columns.map((col, ci) => (
        <div key={ci} data-testid="masonry-col" className="flex-1 flex flex-col gap-6 md:gap-8">
          {col.map(article => (
            <ArticleCard key={article.id} article={article} showCategory={showCategory} />
          ))}
        </div>
      ))}
    </div>
  )
}
