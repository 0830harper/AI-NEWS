'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import MasonryGrid, { MasonryGridHandle } from './MasonryGrid'
import { Article } from '../types'
import { buildColumns, SHORT, TALL } from '../lib/masonry'
import { useTranslation } from '../contexts/TranslationContext'
import { ui } from '../lib/ui-i18n'

interface Props {
  category: string
  showCategory?: boolean
}

const PAGE_SIZE = 30

export default function CategoryFeed({ category, showCategory = false }: Props) {
  const [articles, setArticles] = useState<Article[]>([])
  const [columns, setColumns] = useState<Article[][]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [cols, setCols] = useState(3)

  const gridRef = useRef<MasonryGridHandle>(null)
  const pendingTrimRef = useRef(false)
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
    pendingTrimRef.current = true
    setColumns(buildColumns(articles, cols))
  }, [cols, articles])

  // ── Image-wait trim ──────────────────────────────────────────────────────
  // After columns render, waits for all grid images to load (or 800ms timeout),
  // then reads real column heights and trims tallest column up to 3 passes.
  useEffect(() => {
    if (!pendingTrimRef.current) return

    let resolved = false

    const doTrim = () => {
      if (resolved) return
      resolved = true
      clearTimeout(timer)
      pendingTrimRef.current = false

      if (!gridRef.current) return
      const heights = gridRef.current.getColumnHeights()
      if (heights.every(h => h === 0)) return

      setColumns(prev => {
        const result = prev.map(c => [...c])
        const workH = [...heights]
        for (let pass = 0; pass < 3; pass++) {
          const maxH = Math.max(...workH)
          const minH = Math.min(...workH)
          if (maxH - minH <= SHORT / 2) break
          const maxIdx = workH.indexOf(maxH)
          if (!result[maxIdx]?.length) break
          const last = result[maxIdx][result[maxIdx].length - 1]
          workH[maxIdx] -= last.thumbnail ? TALL : SHORT
          result[maxIdx].pop()
        }
        return result
      })
    }

    const timer = setTimeout(doTrim, 800)

    const gridEl = document.querySelector('[data-testid="masonry-grid"]')
    const imgs = gridEl ? Array.from(gridEl.querySelectorAll<HTMLImageElement>('img')) : []
    let pending = imgs.filter(img => !img.complete).length

    if (pending === 0) {
      doTrim()
    } else {
      for (const img of imgs) {
        if (!img.complete) {
          const onSettle = () => { pending--; if (pending === 0) doTrim() }
          img.addEventListener('load', onSettle, { once: true })
          img.addEventListener('error', onSettle, { once: true })
        }
      }
    }

    return () => { resolved = true; clearTimeout(timer) }
  }, [columns])

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
        pendingTrimRef.current = true
        setColumns(buildColumns(newArticles, cols))
      } else {
        const realHeights = gridRef.current?.getColumnHeights() ?? Array.from({ length: cols }, () => 0)
        const newCols = buildColumns(newArticles, cols, realHeights)
        setArticles(prev => [...prev, ...newArticles])
        pendingTrimRef.current = true
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
