'use client'
import { useState, useEffect } from 'react'
import { Article } from '../types'
import { formatDate } from '../lib/utils'
import { isLightColor } from '../lib/colors'

interface Props {
  article: Article
  showCategory?: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  app: 'Tool',
  design: 'Visual',
  uxui: 'UX/UI',
  tech: 'Tech',
}

const DESC_LIMIT = 100

/** Keep only complete sentences that fit within DESC_LIMIT characters, add ellipsis if trimmed. */
function trimDesc(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text]
  let result = ''
  for (const s of sentences) {
    const next = result ? result + ' ' + s.trim() : s.trim()
    if (next.length > DESC_LIMIT) break
    result = next
  }
  const trimmed = result || text.slice(0, DESC_LIMIT)
  return trimmed.length < text.trim().length ? trimmed + '…' : trimmed
}

export default function ArticleCard({ article, showCategory = false }: Props) {
  const [imgReady, setImgReady] = useState(false)
  const sourceName = article.sources?.name || 'Unknown'
  const sourceDate = formatDate(article.published_at)
  const category = article.sources?.category
  const categoryLabel = category ? CATEGORY_LABELS[category] : null
  const lightBg = isLightColor(article.card_color || '#4D96FF')

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
            <h2 className="text-xl font-bold text-gray-900 leading-snug mb-1.5">
              {article.title}
            </h2>
            {article.description && (
              <p className="text-[13px] text-gray-500 leading-relaxed mb-1.5">
                {trimDesc(article.description)}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                {sourceName}
                {showCategory && categoryLabel && (
                  <span className="px-1.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wide bg-gray-100 text-gray-500">
                    {categoryLabel}
                  </span>
                )}
              </span>
              <span className="flex items-center gap-2">
                {article.raw_score > 0 && (
                  <span className="text-xs font-bold text-orange-400">▲ {article.raw_score} pts</span>
                )}
                <span className="text-sm text-gray-300">{sourceDate}</span>
              </span>
            </div>
          </div>
        </>
      ) : (
        /* ── 无图模式：标题文字在色块内部 ── */
        <div
          className="overflow-hidden transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:shadow-xl p-10 flex flex-col justify-between min-h-52"
          style={{ backgroundColor: article.card_color }}
        >
          <h2 className="text-xl font-bold text-gray-900 leading-snug">
            {article.title}
          </h2>
          {article.description && (
            <p className={`text-[13px] font-medium leading-relaxed mt-2 ${lightBg ? 'text-gray-500' : 'text-white/90'}`}>
              {trimDesc(article.description)}
            </p>
          )}
          <div className="flex items-center justify-between mt-3">
            <span className={`text-sm font-bold flex items-center gap-2 ${lightBg ? 'text-gray-500' : 'text-white/80'}`}>
              {sourceName}
              {showCategory && categoryLabel && (
                <span className={`px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${lightBg ? 'bg-black/10 text-gray-500' : 'bg-white/20 text-white'}`}>
                  {categoryLabel}
                </span>
              )}
            </span>
            <span className="flex items-center gap-2">
              {article.raw_score > 0 && (
                <span className={`text-xs font-bold ${lightBg ? 'text-orange-500' : 'text-orange-300'}`}>▲ {article.raw_score} pts</span>
              )}
              <span className={`text-sm font-medium ${lightBg ? 'text-gray-400' : 'text-white/60'}`}>{sourceDate}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
