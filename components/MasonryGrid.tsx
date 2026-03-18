import { Article } from '../types'
import ArticleCard from './ArticleCard'

interface Props {
  articles: Article[]
}

function interleave(articles: Article[]): Article[] {
  const withImg = articles.filter((a) => !!a.thumbnail)
  const noImg = articles.filter((a) => !a.thumbnail)
  const result: Article[] = []
  const max = Math.max(withImg.length, noImg.length)
  for (let i = 0; i < max; i++) {
    if (i < withImg.length) result.push(withImg[i])
    if (i < noImg.length) result.push(noImg[i])
  }
  return result
}

export default function MasonryGrid({ articles }: Props) {
  if (!articles.length) {
    return (
      <div className="text-center text-gray-400 py-20 text-sm">
        No articles yet. Run the fetcher to populate content.
      </div>
    )
  }

  const sorted = interleave(articles)

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
      {sorted.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  )
}
