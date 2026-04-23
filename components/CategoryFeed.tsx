'use client'
import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'
import MasonryGrid, { MasonryGridHandle } from './MasonryGrid'
import { Article } from '../types'
import { buildColumns } from '../lib/masonry'
import { useTranslation } from '../contexts/TranslationContext'
import { ui } from '../lib/ui-i18n'

interface Props {
  category: string
  showCategory?: boolean
}

const PAGE_SIZE = 30
const BALANCE_THRESHOLD = 200

function layoutKey(cols: Article[][]): string {
  return cols.map(c => c.map(a => a.id).join(',')).join('|')
}

export default function CategoryFeed({ category, showCategory = false }: Props) {
  const [articles, setArticles] = useState<Article[]>([])
  const [columns, setColumns] = useState<Article[][]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [cols, setCols] = useState(3)
  const gridRef = useRef<MasonryGridHandle>(null)
  // Oscillation guard: stores the layout key we last adjusted FROM so we
  // never adjust the same layout twice (prevents A→B→A infinite loop).
  const adjustedFrom = useRef('')
  const { isZh, translateArticles } = useTranslation()
  const t = ui(isZh)

  // ── Responsive column count ──────────────────────────────────────────────
  useEffect(() => {
    const update = () => setCols(window.innerWidth < 640 ? 1 : window.innerWidth < 1024 ? 2 : 3)
    update()
    window.addEventListener('resize', update, { passive: true })
    return () => window.removeEventListener('resize', update)
  }, [])

  // ── Rebuild all columns on viewport resize ───────────────────────────────
  // prevColsRef lets us distinguish a cols change from an articles change:
  // only rebuild when cols itself changes, not on every article update.
  const prevColsRef = useRef(cols)
  useEffect(() => {
    if (prevColsRef.current === cols || articles.length === 0) {
      prevColsRef.current = cols
      return
    }
    prevColsRef.current = cols
    adjustedFrom.current = ''
    setColumns(buildColumns(articles, cols))
  }, [cols, articles])

  // ── Post-render balance correction ───────────────────────────────────────
  // Fires after every columns render. Measures real DOM heights; if the
  // tallest column exceeds the shortest by more than one card, moves one
  // card across and re-renders. Repeats until balanced or oscillation is
  // detected (adjustedFrom guard prevents A→B→A loops).
  useLayoutEffect(() => {
    if (cols <= 1 || columns.length < 2) return
    const heights = gridRef.current?.getColumnHeights() ?? []
    if (heights.length < cols || heights.some(h => h === 0)) return

    const maxH = Math.max(...heights)
    const minH = Math.min(...heights)
    if (maxH - minH <= BALANCE_THRESHOLD) return

    const key = layoutKey(columns)
    if (adjustedFrom.current === key) return   // already tried this layout — stop

    const tallest = heights.indexOf(maxH)
    const shortest = heights.indexOf(minH)
    setColumns(prev => {
      const next = prev.map(c => [...c])
      const card = next[tallest].pop()
      if (!card) return prev
      next[shortest].push(card)
      return next
    })
    adjustedFrom.current = key
  }, [columns, cols])

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchPage = useCallback(async (pageNum: number) => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/articles?category=${category}&limit=${PAGE_SIZE}&page=${pageNum}`,
        { cache: 'no-store' },
      )
      const data = await res.json()
      const newArticles: Article[] = data.articles || []

      if (pageNum === 1) {
        // Initial load: full greedy from zero
        setArticles(newArticles)
        setColumns(buildColumns(newArticles, cols))
      } else {
        // Load More: read real column heights, distribute only new articles from there
        const realHeights = gridRef.current?.getColumnHeights() ?? Array.from({ length: cols }, () => 0)
        const newCols = buildColumns(newArticles, cols, realHeights)
        setArticles(prev => [...prev, ...newArticles])
        setColumns(prev =>
          Array.from({ length: cols }, (_, i) => [...(prev[i] ?? []), ...(newCols[i] ?? [])]),
        )
      }

      setHasMore(newArticles.length > 0)
      setPage(pageNum)
      return newArticles
    } catch (e) {
      console.error('Failed to load articles:', e)
      return []
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [category, cols])

  useEffect(() => {
    setArticles([])
    setColumns([])
    setPage(0)
    setHasMore(true)
    setInitialLoading(true)
    fetchPage(1)
  }, [category, fetchPage])

  useEffect(() => {
    if (isZh && articles.length > 0) void translateArticles(articles)
  }, [isZh, articles, translateArticles])

  if (initialLoading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    )
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-24 text-gray-400 text-sm">
        {t.noArticles}
      </div>
    )
  }

  const handleLoadMore = async () => {
    const newArticles = await fetchPage(page + 1)
    if (isZh && newArticles.length > 0) void translateArticles(newArticles)
  }

  return (
    <div>
      <MasonryGrid ref={gridRef} columns={columns} showCategory={showCategory} />

      {hasMore && (
        <div className="flex justify-center mt-10 mb-6">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="transition-transform duration-150 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2 px-8 py-2.5 text-sm text-gray-500">
                <span className="w-3.5 h-3.5 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                {t.loading}
              </span>
            ) : (
              <img src="/icons/load-more.svg" alt={t.loadMoreAlt} width={200} height={62} />
            )}
          </button>
        </div>
      )}

      {!hasMore && articles.length > 0 && (
        <div className="text-center mt-10 mb-6 text-xs text-gray-400 tracking-widest uppercase">
          {t.endOfFeed}
        </div>
      )}
    </div>
  )
}
