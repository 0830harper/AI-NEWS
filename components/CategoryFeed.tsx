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

function computeColWidth(numCols: number): number {
  if (typeof window === 'undefined') return numCols === 1 ? 600 : 390
  const vw = window.innerWidth
  // Matches layout.tsx: max-w-7xl (1280px), px-3 sm:px-4 md:px-6
  const sidePad = vw >= 768 ? 24 : vw >= 640 ? 16 : 12
  const containerWidth = Math.min(vw, 1280) - sidePad * 2
  // Matches MasonryGrid: gap-6 md:gap-8
  const gap = vw >= 768 ? 32 : 24
  return (containerWidth - (numCols - 1) * gap) / numCols
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
  const colWidth = computeColWidth(numCols)
  const articleHeights = articles.map(a => getArticleHeight(a, colWidth))
  let cols = buildColumnsExact(
    articles,
    numCols,
    articleHeights,
    startHeights ?? Array.from({ length: numCols }, () => 0),
  )

  // Balance pass: if the tallest column overhangs the shortest by more than
  // half a SHORT card, move its last card to the shortest column.
  // Up to 2 passes — no cards are removed, just relocated.
  for (let pass = 0; pass < 2; pass++) {
    const colHeights = cols.map(col =>
      col.reduce((h, a) => h + getArticleHeight(a, colWidth), 0),
    )
    const maxH = Math.max(...colHeights)
    const minH = Math.min(...colHeights)
    if (maxH - minH <= SHORT / 2) break
    const maxIdx = colHeights.indexOf(maxH)
    const minIdx = colHeights.indexOf(minH)
    if (cols[maxIdx].length <= 1) break
    const moved = cols[maxIdx][cols[maxIdx].length - 1]
    cols = cols.map((col, i) => {
      if (i === maxIdx) return col.slice(0, -1)
      if (i === minIdx) return [...col, moved]
      return col
    })
  }

  return cols
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
