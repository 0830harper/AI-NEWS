'use client'
import { useState, useEffect } from 'react'
import { Article } from '../types'
import ArticleCard from './ArticleCard'

interface Props {
  articles: Article[]
  showCategory?: boolean
  cols?: number
}

function splitIntoColumns(articles: Article[], n: number): Article[][] {
  const columns: Article[][] = Array.from({ length: n }, () => [])
  articles.forEach((a, i) => columns[i % n].push(a))
  return columns
}

function useCols(maxCols: number) {
  const [cols, setCols] = useState(maxCols)
  useEffect(() => {
    function update() {
      if (window.innerWidth < 640) setCols(1)
      else if (window.innerWidth < 1024) setCols(Math.min(2, maxCols))
      else setCols(maxCols)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [maxCols])
  return cols
}

export default function MasonryGrid({ articles, showCategory = false, cols = 3 }: Props) {
  const responsiveCols = useCols(cols)

  if (!articles.length) {
    return (
      <div className="text-center text-gray-400 py-20 text-sm">
        No articles yet. Run the fetcher to populate content.
      </div>
    )
  }

  const columns = splitIntoColumns(articles, responsiveCols)

  return (
    <div className="flex gap-6 md:gap-8">
      {columns.map((col, ci) => (
        <div key={ci} className="flex-1 flex flex-col gap-6 md:gap-8 min-w-0">
          {col.map((article) => (
            <ArticleCard key={article.id} article={article} showCategory={showCategory} />
          ))}
        </div>
      ))}
    </div>
  )
}
