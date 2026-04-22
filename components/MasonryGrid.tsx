'use client'
import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react'
import { Article } from '../types'
import ArticleCard from './ArticleCard'

interface Props {
  articles: Article[]
  showCategory?: boolean
  cols?: number
}

const TALL = 500
const SHORT = 260

// Only rebalance when tallest column exceeds shortest by more than this.
// One SHORT card is the smallest meaningful correction.
const BALANCE_THRESHOLD = 200

function buildColumns(articles: Article[], numCols: number): Article[][] {
  const cols: Article[][] = Array.from({ length: numCols }, () => [])
  const heights = Array(numCols).fill(0)
  for (const article of articles) {
    let min = 0
    for (let c = 1; c < numCols; c++) if (heights[c] < heights[min]) min = c
    cols[min].push(article)
    heights[min] += article.thumbnail ? TALL : SHORT
  }
  return cols
}

function layoutKey(cols: Article[][]): string {
  return cols.map(c => c.map(a => a.id).join(',')).join('|')
}

export default function MasonryGrid({ articles, showCategory = false, cols = 3 }: Props) {
  const initial = useMemo(() => buildColumns(articles, cols), [articles, cols])
  const [columns, setColumns] = useState(initial)

  // ── Guard refs (declared before effects that use them) ────────────────────

  const colRefs = useRef<(HTMLDivElement | null)[]>([])

  // GUARD 1 — re-entry flag.
  // Set to true immediately before every setState call inside useLayoutEffect.
  // The very next useLayoutEffect invocation checks this first and exits early,
  // then resets the flag so future measurement cycles are not skipped.
  const adjusting = useRef(false)

  // GUARD 2 (oscillation half) — tracks which layout we last adjusted FROM.
  // If we arrive at the exact same layout a second time we stop, preventing
  // the A → B → A → B infinite loop even if BALANCE_THRESHOLD is never met.
  const adjustedFrom = useRef('')

  // ─────────────────────────────────────────────────────────────────────────

  // Reset to greedy layout whenever the article set or column count changes.
  // Also clears adjustedFrom so the fresh layout gets one measurement pass.
  useEffect(() => {
    setColumns(initial)
    adjustedFrom.current = ''
  }, [initial])

  useLayoutEffect(() => {
    // GUARD 1: skip the render that was triggered by our own setState.
    if (adjusting.current) {
      adjusting.current = false   // reset so the *next* render is measured normally
      return
    }

    // Single-column layout needs no balancing.
    if (cols <= 1) return

    // Read real rendered heights from DOM refs.
    const heights = colRefs.current.slice(0, cols).map(el => el?.offsetHeight ?? 0)
    if (heights.some(h => h === 0)) return  // columns not yet in DOM

    const maxH = Math.max(...heights)
    const minH = Math.min(...heights)
    if (maxH - minH <= BALANCE_THRESHOLD) return  // already balanced

    const currentKey = layoutKey(columns)

    // GUARD 2 (oscillation check): we already adjusted FROM this exact layout — stop.
    if (adjustedFrom.current === currentKey) return

    // Move the last card of the tallest column to the bottom of the shortest.
    const tallest = heights.indexOf(maxH)
    const shortest = heights.indexOf(minH)
    const next = columns.map(c => [...c])
    const card = next[tallest].pop()
    if (!card) return
    next[shortest].push(card)

    // GUARD 2 (value-equality check): if the resulting layout is identical, don't
    // call setState at all — avoids a wasted render with no visible change.
    if (layoutKey(next) === currentKey) return

    adjustedFrom.current = currentKey   // record what we adjusted FROM
    adjusting.current = true            // GUARD 1: arm the re-entry skip
    setColumns(next)

  // GUARD 3 — stable dependency array.
  // Only primitive/state values; no inline objects, no functions, no refs
  // (refs are mutable containers — listing them would never trigger the effect).
  }, [columns, cols])

  if (!articles.length) {
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
}
