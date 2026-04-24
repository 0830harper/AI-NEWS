'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import MasonryGrid, { MasonryGridHandle } from './MasonryGrid'
import ArticleCard from './ArticleCard'
import { Article } from '../types'
import { buildColumnsExact } from '../lib/masonry'
import { useTranslation } from '../contexts/TranslationContext'
import { ui } from '../lib/ui-i18n'

interface Props {
  category: string
  showCategory?: boolean
}

const PAGE_SIZE = 30

interface MeasureTask {
  articles: Article[]
  startHeights: number[]
  mode: 'initial' | 'append' | 'rebuild'
}

export default function CategoryFeed({ category, showCategory = false }: Props) {
  const [articles, setArticles] = useState<Article[]>([])
  const [columns, setColumns] = useState<Article[][]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [cols, setCols] = useState(3)
  const [measureTask, setMeasureTask] = useState<MeasureTask | null>(null)

  const gridRef = useRef<MasonryGridHandle>(null)
  const measureRefs = useRef<(HTMLDivElement | null)[]>([])
  const measureContainerRef = useRef<HTMLDivElement>(null)
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
  const prevColsRef = useRef(cols)
  useEffect(() => {
    if (prevColsRef.current === cols || articles.length === 0) {
      prevColsRef.current = cols
      return
    }
    prevColsRef.current = cols
    setMeasureTask({ articles, startHeights: [], mode: 'rebuild' })
  }, [cols, articles])

  // ── Measurement effect ───────────────────────────────────────────────────
  // Waits for all images in the hidden container to load (or 800ms timeout),
  // then reads real offsetHeight of each card and builds columns with true heights.
  useEffect(() => {
    if (!measureTask || measureTask.articles.length === 0) return

    let resolved = false

    const measure = () => {
      if (resolved) return
      resolved = true
      clearTimeout(timer)

      const heights = measureRefs.current
        .slice(0, measureTask.articles.length)
        .map((el, i) => el?.offsetHeight || (measureTask.articles[i]?.thumbnail ? 500 : 260))

      const newCols = buildColumnsExact(
        measureTask.articles,
        cols,
        heights,
        measureTask.startHeights.length > 0 ? measureTask.startHeights : undefined,
      )

      if (measureTask.mode === 'initial') {
        setColumns(newCols)
        setInitialLoading(false)
        setLoading(false)
      } else if (measureTask.mode === 'append') {
        setColumns(prev =>
          Array.from({ length: cols }, (_, i) => [...(prev[i] ?? []), ...(newCols[i] ?? [])]),
        )
        setLoading(false)
      } else {
        setColumns(newCols)
      }

      setMeasureTask(null)
    }

    const timer = setTimeout(measure, 800)

    const imgs = measureContainerRef.current?.querySelectorAll('img') ?? []
    let pending = 0
    for (const img of imgs) {
      if (!img.complete) {
        pending++
        const onSettle = () => { pending--; if (pending === 0) measure() }
        img.addEventListener('load', onSettle, { once: true })
        img.addEventListener('error', onSettle, { once: true })
      }
    }
    if (pending === 0) measure()

    return () => { resolved = true; clearTimeout(timer) }
  }, [measureTask, cols])

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
        setArticles(newArticles)
        setMeasureTask({ articles: newArticles, startHeights: [], mode: 'initial' })
      } else {
        const realHeights = gridRef.current?.getColumnHeights() ?? Array.from({ length: cols }, () => 0)
        setArticles(prev => [...prev, ...newArticles])
        setMeasureTask({ articles: newArticles, startHeights: realHeights, mode: 'append' })
      }

      setHasMore(newArticles.length > 0)
      setPage(pageNum)
      return newArticles
    } catch (e) {
      console.error('Failed to load articles:', e)
      setLoading(false)
      setInitialLoading(false)
      return []
    }
    // setLoading(false) on success is handled inside the measurement effect
  }, [category, cols])

  useEffect(() => {
    setArticles([])
    setColumns([])
    setPage(0)
    setHasMore(true)
    setInitialLoading(true)
    setMeasureTask(null)
    fetchPage(1)
  }, [category, fetchPage])

  useEffect(() => {
    if (isZh && articles.length > 0) void translateArticles(articles)
  }, [isZh, articles, translateArticles])

  const handleLoadMore = async () => {
    const newArticles = await fetchPage(page + 1)
    if (isZh && newArticles.length > 0) void translateArticles(newArticles)
  }

  // Column width for hidden measurement div — matches actual flex column width.
  // gap-6 (1.5rem) is used as an approximation; the ±5px error is negligible for height.
  const measureWidth =
    cols === 1 ? '100%' : `calc((100% - ${(cols - 1) * 1.5}rem) / ${cols})`

  return (
    <div style={{ position: 'relative' }}>
      {/* Hidden pre-render: cards at correct column width so offsetHeight is accurate */}
      {measureTask && (
        <div
          ref={measureContainerRef}
          style={{
            position: 'absolute',
            visibility: 'hidden',
            top: 0,
            left: 0,
            width: measureWidth,
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          {measureTask.articles.map((article, i) => (
            <div key={article.id} ref={el => { measureRefs.current[i] = el }}>
              <ArticleCard article={article} showCategory={showCategory} />
            </div>
          ))}
        </div>
      )}

      {initialLoading ? (
        <div className="flex justify-center py-24">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-24 text-gray-400 text-sm">
          {t.noArticles}
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}
