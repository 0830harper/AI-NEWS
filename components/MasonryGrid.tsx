'use client'
import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react'
import { Article } from '../types'
import ArticleCard from './ArticleCard'

interface Props {
  articles: Article[]
  showCategory?: boolean
  cols?: number
}

// ── Height estimation constants ──────────────────────────────────────────────
// Target desktop column (~395px wide). Title is text-xl bold (≈20px), leading-snug
// (1.375) → ~27.5px/line; bold chars average ~11px wide → ~36 chars/line.
// We use 30 as a slightly conservative figure to account for short words that wrap early.
const CHARS_PER_LINE = 30
const TITLE_LINE_H   = 28  // px per title line

// Image card: colour block (pt-10 + og:image ≈ 270px) + text area base
const IMG_BASE    = 300
// Text-only card: min-h-52 (208px) + p-10 padding already included in min-h
const TEXT_BASE   = 220
// Shared footer: description (≈40px) + source/date row (≈36px) + mb-8 gap (≈32px)
const CARD_FOOTER = 110

// Max acceptable measured height difference before we rebalance (px)
const BALANCE_THRESHOLD = 200

// ── Helpers ──────────────────────────────────────────────────────────────────
function estimateHeight(article: Article): number {
  const titleLines = Math.max(1, Math.ceil((article.title?.length ?? 0) / CHARS_PER_LINE))
  return article.thumbnail
    ? IMG_BASE + titleLines * TITLE_LINE_H + CARD_FOOTER
    : TEXT_BASE + titleLines * TITLE_LINE_H
}

function buildColumns(articles: Article[], numCols: number): Article[][] {
  const cols: Article[][] = Array.from({ length: numCols }, () => [])
  const heights = Array(numCols).fill(0)
  for (const article of articles) {
    let min = 0
    for (let c = 1; c < numCols; c++) if (heights[c] < heights[min]) min = c
    cols[min].push(article)
    heights[min] += estimateHeight(article)
  }
  return cols
}

/** Stable fingerprint of the current layout — used to detect adjustment loops. */
function layoutKey(columns: Article[][]): string {
  return columns.map(c => c.map(a => a.id).join(',')).join('|')
}

// ── Component ────────────────────────────────────────────────────────────────
export default function MasonryGrid({ articles, showCategory = false, cols = 3 }: Props) {
  const initial = useMemo(() => buildColumns(articles, cols), [articles, cols])
  const [columns, setColumns] = useState(initial)
  const colRefs = useRef<(HTMLDivElement | null)[]>([])
  // Stores the layout key of the last adjustment source — prevents infinite loops
  const lastAdjKey = useRef('')

  // Reset to greedy initial whenever the article list or column count changes
  useEffect(() => {
    setColumns(initial)
    lastAdjKey.current = ''
  }, [initial])

  // After each render: measure real column heights and move one card if needed.
  // useLayoutEffect fires before paint so the user never sees an intermediate state.
  useLayoutEffect(() => {
    if (cols <= 1) return

    const heights = colRefs.current.slice(0, cols).map(el => el?.offsetHeight ?? 0)
    if (heights.some(h => h === 0)) return  // columns not yet in DOM

    const maxH = Math.max(...heights)
    const minH = Math.min(...heights)
    if (maxH - minH <= BALANCE_THRESHOLD) return

    // If we already adjusted from this exact layout, stop — prevents A→B→A loops
    const key = layoutKey(columns)
    if (key === lastAdjKey.current) return
    lastAdjKey.current = key

    // Move the last card of the tallest column to the bottom of the shortest
    const tallest = heights.indexOf(maxH)
    const shortest = heights.indexOf(minH)
    const next = columns.map(c => [...c])
    const card = next[tallest].pop()
    if (!card) return
    next[shortest].push(card)
    setColumns(next)
  }, [columns, cols])

  if (!articles.length) {
    return (
      <div className="text-center text-gray-400 py-20 text-sm">
        No articles yet. Run the fetcher to populate content.
      </div>
    )
  }

  return (
    <div className="flex gap-6 md:gap-8 items-start">
      {columns.map((col, ci) => (
        <div
          key={ci}
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
}
