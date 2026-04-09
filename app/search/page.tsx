'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import MasonryGrid from '../../components/MasonryGrid'
import { Article } from '../../types'
import { useTranslation } from '../../contexts/TranslationContext'

function SearchContent() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ''
  const { isZh } = useTranslation()

  const [articles, setArticles] = useState<Article[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const doSearch = useCallback(async (query: string, pageNum: number) => {
    if (!query.trim()) { setArticles([]); setTotal(null); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&page=${pageNum}`)
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
    setArticles([])
    setPage(1)
    doSearch(q, 1)
  }, [q, doSearch])

  return (
    <div>
      {/* Results count */}
      {q && total !== null && !loading && (
        <p className="text-sm font-semibold uppercase tracking-widest text-gray-600 mb-5">
          {total === 0
            ? `No results for "${q}"`
            : `${total} result${total !== 1 ? 's' : ''} for "${q}"`}
        </p>
      )}

      {/* Loading */}
      {loading && page === 1 && (
        <div className="flex justify-center py-24">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        </div>
      )}

      {/* Results */}
      {articles.length > 0 && (
        <MasonryGrid key={isZh ? 'zh' : 'en'} articles={articles} showCategory={true} />
      )}

      {/* Load more */}
      {hasMore && !loading && (
        <div className="flex justify-center mt-10 mb-6">
          <button onClick={() => doSearch(q, page + 1)} className="transition-transform duration-150 hover:scale-105">
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

      {/* Empty */}
      {!loading && q && total === 0 && (
        <div className="text-center py-20 text-gray-400 text-sm">Try a different keyword.</div>
      )}

      {/* No query */}
      {!q && !loading && (
        <div className="text-center py-20 text-gray-400 text-sm">
          Type a keyword in the search bar above.
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
