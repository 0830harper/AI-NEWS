'use client'
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { Article } from '../types'
import { buildColumns } from '../lib/masonry'
import ArticleCard from './ArticleCard'

interface Props {
  /** Pre-built columns from CategoryFeed (incremental mode). */
  columns?: Article[][]
  /** Flat list fallback — used by search page; MasonryGrid builds columns internally. */
  articles?: Article[]
  showCategory?: boolean
  cols?: number
}

export interface MasonryGridHandle {
  /** Returns the real rendered height (px) of each column div. */
  getColumnHeights: () => number[]
}

const MasonryGrid = forwardRef<MasonryGridHandle, Props>(function MasonryGrid(
  { columns: propColumns, articles, showCategory = false, cols = 3 },
  ref,
) {
  const colRefs = useRef<(HTMLDivElement | null)[]>([])

  const columns = useMemo(
    () => propColumns ?? buildColumns(articles ?? [], cols),
    [propColumns, articles, cols],
  )

  useImperativeHandle(ref, () => ({
    getColumnHeights: () =>
      colRefs.current.slice(0, columns.length).map(el => el?.offsetHeight ?? 0),
  }), [columns.length])

  const hasArticles = columns.some(c => c.length > 0)

  if (!hasArticles) {
    return (
      <div className="text-center text-gray-400 py-20 text-sm">
        No articles yet. Run the fetcher to populate content.
      </div>
    )
  }

  return (
    <div data-testid="masonry-grid" className="flex gap-6 md:gap-8 items-start">
      {columns.map((col, ci) => (
        <div
          key={ci}
          data-testid="masonry-col"
          ref={el => { colRefs.current[ci] = el }}
          className="flex-1 flex flex-col gap-6 md:gap-8"
        >
          {col.map(article => (
            <ArticleCard key={article.id} article={article} showCategory={showCategory} />
          ))}
        </div>
      ))}
    </div>
  )
})

export default MasonryGrid
