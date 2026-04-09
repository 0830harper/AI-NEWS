'use client'
import { useState, useEffect, useCallback } from 'react'
import MasonryGrid from './MasonryGrid'
import { Article } from '../types'
import { useTranslation } from '../contexts/TranslationContext'

interface Props {
  category: string
  showCategory?: boolean
}

const PAGE_SIZE = 30

export default function CategoryFeed({ category, showCategory = false }: Props) {
  const [articles, setArticles] = useState<Article[]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const { isZh, translateArticles } = useTranslation()

  const fetchPage = useCallback(async (pageNum: number) => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/articles?category=${category}&limit=${PAGE_SIZE}&page=${pageNum}`
      )
      const data = await res.json()
      const newArticles: Article[] = data.articles || []
      setArticles(prev => pageNum === 1 ? newArticles : [...prev, ...newArticles])
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
  }, [category])

  useEffect(() => {
    setArticles([])
    setPage(0)
    setHasMore(true)
    setInitialLoading(true)
    fetchPage(1)
  }, [category, fetchPage])

  // Translate when isZh toggles on
  useEffect(() => {
    if (isZh && articles.length > 0) {
      translateArticles(articles)
    }
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
        No articles yet. Run the fetcher to populate content.
      </div>
    )
  }

  const handleLoadMore = async () => {
    const newArticles = await fetchPage(page + 1)
    if (isZh && newArticles.length > 0) {
      translateArticles(newArticles)
    }
  }

  return (
    <div>
      <MasonryGrid key={isZh ? 'zh' : 'en'} articles={articles} showCategory={showCategory} />

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
                Loading...
              </span>
            ) : (
              <img src="/icons/load-more.svg" alt="Load More" width={200} height={62} />
            )}
          </button>
        </div>
      )}

      {!hasMore && articles.length > 0 && (
        <div className="text-center mt-10 mb-6 text-xs text-gray-400 tracking-widest uppercase">
          You&apos;ve reached the end
        </div>
      )}
    </div>
  )
}
