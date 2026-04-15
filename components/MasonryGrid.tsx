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

  // CSS columns: the browser measures actual rendered heights and balances
  // column bottoms automatically — no JS estimation needed.
  // Responsive: 1 col on mobile, 2 on tablet, 3 on desktop.
  const colClass =
    cols === 1 ? 'columns-1' :
    cols === 2 ? 'columns-1 sm:columns-2' :
                 'columns-1 sm:columns-2 lg:columns-3'

  return (
    <div className={`${colClass} gap-6 md:gap-8`}>
      {articles.map(article => (
        <div key={article.id} className="break-inside-avoid">
          <ArticleCard article={article} showCategory={showCategory} />
        </div>
      ))}
    </div>
  )
}
