'use client'
import { Article } from '../types'
import ArticleCard from './ArticleCard'

interface Props {
  articles: Article[]
  showCategory?: boolean
  cols?: number
}

export default function MasonryGrid({ articles, showCategory = false, cols = 3 }: Props) {
  if (!articles.length) {
    return (
      <div className="text-center text-gray-400 py-20 text-sm">
        No articles yet. Run the fetcher to populate content.
      </div>
    )
  }

  // Distribute articles round-robin across columns for left-to-right reading order
  const columns: Article[][] = Array.from({ length: cols }, () => [])
  articles.forEach((article, i) => {
    columns[i % cols].push(article)
  })

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
