'use client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import MasonryGrid from '../../components/MasonryGrid'
import { Article } from '../../types'

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQ = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQ)
  const [input, setInput] = useState(initialQ)
  const [articles, setArticles] = useState<Article[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const doSearch = useCallback(async (q: string, pageNum: number) => {
    if (!q.trim()) {
      setArticles([])
      setTotal(null)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&page=${pageNum}`)
      const data = await res.json()
      const newArticles: Article[] = data.articles || []
      setArticles(prev => pageNum === 1 ? newArticles : [...prev, ...newArticles])
      setTotal(data.total ?? 0)
      setHasMore(newArticles.length === 40)
      setPage(pageNum)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialQ) {
      doSearch(initialQ, 1)
    }
    inputRef.current?.focus()
  }, [initialQ, doSearch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = input.trim()
    if (!q) return
    setQuery(q)
    setArticles([])
    setPage(1)
    router.replace(`/search?q=${encodeURIComponent(q)}`)
    doSearch(q, 1)
  }

  return (
    <div>
      {/* Search input */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative max-w-xl">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Search articles… e.g. Claude, Figma, GPT-4"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
          />
          {input && (
            <button
              type="button"
              onClick={() => { setInput(''); setArticles([]); setTotal(null); router.replace('/search') }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Results header */}
      {query && total !== null && !loading && (
        <p className="text-sm font-semibold uppercase tracking-widest text-gray-600 mb-5">
          {total === 0
            ? `No results for "${query}"`
            : `${total} result${total !== 1 ? 's' : ''} for "${query}"`}
        </p>
      )}

      {/* Loading spinner */}
      {loading && page === 1 && (
        <div className="flex justify-center py-24">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        </div>
      )}

      {/* Results */}
      {articles.length > 0 && (
        <MasonryGrid articles={articles} showCategory={true} />
      )}

      {/* Load more */}
      {hasMore && !loading && (
        <div className="flex justify-center mt-10 mb-6">
          <button
            onClick={() => doSearch(query, page + 1)}
            className="transition-transform duration-150 hover:scale-105"
          >
            <img src="/icons/load-more.svg" alt="Load More" width={200} height={62} />
          </button>
        </div>
      )}

      {loading && page > 1 && (
        <div className="flex justify-center mt-8">
          <span className="flex items-center gap-2 text-sm text-gray-500">
            <span className="w-3.5 h-3.5 border border-gray-400 border-t-transparent rounded-full animate-spin" />
            Loading...
          </span>
        </div>
      )}

      {/* Empty state */}
      {!loading && query && total === 0 && (
        <div className="text-center py-20 text-gray-400 text-sm">
          Try a different keyword.
        </div>
      )}

      {/* Default state (no query yet) */}
      {!query && (
        <div className="text-center py-20 text-gray-400 text-sm">
          Type a keyword to search across all articles.
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  )
}
