'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import MasonryGrid, { MasonryGridHandle } from './MasonryGrid'
import { Article } from '../types'
import { buildColumnsExact, SHORT, TALL } from '../lib/masonry'
import { useTranslation } from '../contexts/TranslationContext'
import { ui } from '../lib/ui-i18n'

interface Props {
  category: string
  showCategory?: boolean
}

const PAGE_SIZE = 30

// ── Height estimation ─────────────────────────────────────────────────────────
// ArticleCard image layout: pt-10 (40px) top pad inside color block,
// px-10 (40px each side = 80px) horizontal pad, then text block below.
const COL_SIDE_PAD = 80   // px-10 × 2
const CARD_TOP_PAD = 40   // pt-10
const TEXT_BLOCK   = 100  // title + source/date row below color block

function estimateColWidth(numCols: number): number {
  // Rough column widths based on breakpoint:
  // 3-col ≈ 380px, 2-col ≈ 390px, 1-col ≈ 600px
  return numCols === 1 ? 600 : 390
}

function getArticleHeight(article: Article, colWidth: number): number {
  if (article.thumbnail && article.img_width && article.img_height && article.img_width > 0) {
    const imgW = colWidth - COL_SIDE_PAD
    const imgH = (article.img_height / article.img_width) * imgW
    return CARD_TOP_PAD + imgH + TEXT_BLOCK
  }
  return article.thumbnail ? TALL : SHORT
}

function layoutColumns(
  articles: Article[],
  numCols: number,
  startHeights?: number[],
): Article[][] {
  const colWidth = estimateColWidth(numCols)
  const heights = articles.map(a => getArticleHeight(a, colWidth))
  return buildColumnsExact(
    articles,
    numCols,
    heights,
    startHeights ?? Array.from({ length: numCols }, () => 0),
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CategoryFeed({ category, showCategory = false }: Props) {
  const [articles, setArticles] = useState<Article[]>([])
  const [columns, setColumns] = useState<Article[][]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [cols, setCols] = useState(3)

  const gridRef = useRef<MasonryGridHandle>(null)
  const { isZh, translateArticles } = useTranslation()
  const t = ui(isZh)

  // ── Responsive column count ──────────────────────────────────────────────
  useEffect(() => {
    const update = () => setCols(window.innerWidth < 640 ? 1 : window.innerWidth < 1024 ? 2 : 3)
    update()
    window.addEventListener('resize', update, { passive: true })
    return () => window.removeEventListener('resize', update)
  }, [])

  // ── Rebuild columns on viewport resize ──────────────────────────────────
  const prevColsRef = useRef(cols)
  useEffect(() => {
    if (prevColsRef.current === cols || articles.length === 0) {
      prevColsRef.current = cols
      return
    }
    prevColsRef.current = cols
    setColumns(layoutColumns(articles, cols))
  }, [cols, articles])

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
        setColumns(layoutColumns(newArticles, cols))
      } else {
        // Use real DOM heights so new articles extend from actual column bottoms
        const realHeights = gridRef.current?.getColumnHeights() ?? Array.from({ length: cols }, () => 0)
        const newCols = layoutColumns(newArticles, cols, realHeights)
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
