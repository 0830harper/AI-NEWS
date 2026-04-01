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

  const colClass = cols === 2
    ? 'columns-1 sm:columns-2'
    : 'columns-1 sm:columns-2 lg:columns-3'

  return (
    <div className={`${colClass} gap-6 md:gap-8`}>
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} showCategory={showCategory} />
      ))}
    </div>
  )
}
