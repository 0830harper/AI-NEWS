import { Article } from '../types'
import ArticleCard from './ArticleCard'

interface Props {
  articles: Article[]
  showCategory?: boolean
  cols?: number
}

/** Split articles into N columns in horizontal reading order:
 *  article[0]→col0, article[1]→col1, article[2]→col2, article[3]→col0 …
 *  Each column stacks naturally (masonry effect), order reads left→right. */
function splitIntoColumns(articles: Article[], n: number): Article[][] {
  const columns: Article[][] = Array.from({ length: n }, () => [])
  articles.forEach((a, i) => columns[i % n].push(a))
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

  const columns = splitIntoColumns(articles, cols)

  return (
    <div className="flex gap-8">
      {columns.map((col, ci) => (
        <div key={ci} className="flex-1 flex flex-col gap-8 min-w-0">
          {col.map((article) => (
            <ArticleCard key={article.id} article={article} showCategory={showCategory} />
          ))}
        </div>
      ))}
    </div>
  )
}
