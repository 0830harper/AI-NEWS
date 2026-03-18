'use client'
import { useState, useEffect } from 'react'
import { Article } from '../types'
import { formatDate } from '../lib/utils'

interface Props {
  article: Article
}

export default function ArticleCard({ article }: Props) {
  const [imgReady, setImgReady] = useState(false)
  const sourceName = article.sources?.name || 'Unknown'
  const sourceDate = formatDate(article.published_at)

  useEffect(() => {
    if (!article.thumbnail) return
    const img = new Image()
    img.onload = () => {
      if (img.naturalWidth >= 50 && img.naturalHeight >= 50) {
        setImgReady(true)
      }
    }
    img.src = article.thumbnail
  }, [article.thumbnail])

  function handleClick() {
    fetch(`/api/articles/${article.id}/click`, { method: 'POST' })
    window.open(article.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div onClick={handleClick} className="cursor-pointer group mb-8 break-inside-avoid">
      {imgReady ? (
        /* ── 有图模式：色块内嵌图片，文字在色块下方 ── */
        <>
          <div
            className="overflow-hidden transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:shadow-xl"
            style={{ backgroundColor: article.card_color }}
          >
            <div className="pt-10 px-10">
              <img
                src={article.thumbnail!}
                alt=""
                className="w-full block"
              />
            </div>
          </div>
          <div className="pt-3 px-0.5">
            <h2 className="text-lg font-semibold text-gray-900 leading-snug mb-1.5">
              {article.title}
            </h2>
            {article.description && (
              <p className="text-xs text-gray-500 leading-relaxed mb-1.5 line-clamp-2">
                {article.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">
                {article.heat_score > 5 && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 mr-1 align-middle" />
                )}
                {sourceName}
              </span>
              <span className="text-xs text-gray-300">{sourceDate}</span>
            </div>
          </div>
        </>
      ) : (
        /* ── 无图模式：标题文字在色块内部 ── */
        <div
          className="overflow-hidden transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:shadow-xl p-10 flex flex-col justify-between min-h-52"
          style={{ backgroundColor: article.card_color }}
        >
          <h2 className="text-lg font-semibold text-gray-900 leading-snug">
            {article.title}
          </h2>
          {article.description && (
            <p className="text-xs text-gray-700 leading-relaxed mt-2 line-clamp-2 opacity-80">
              {article.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs font-medium text-gray-600">
              {article.heat_score > 5 && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1 align-middle" />
              )}
              {sourceName}
            </span>
            <span className="text-xs text-gray-500">{sourceDate}</span>
          </div>
        </div>
      )}
    </div>
  )
}
