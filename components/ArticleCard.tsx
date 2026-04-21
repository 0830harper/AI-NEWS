'use client'
import { useState, useEffect } from 'react'
import { Article } from '../types'
import { formatDate } from '../lib/utils'
import { isLightColor } from '../lib/colors'
import { useTranslation } from '../contexts/TranslationContext'
import { looksLikeChinese } from '../lib/article-needs-client-translate'
import { ui } from '../lib/ui-i18n'

interface Props {
  article: Article
  showCategory?: boolean
}

const CATEGORY_LABELS_EN: Record<string, string> = {
  app: 'Tool',
  design: 'Visual',
  uxui: 'UX / UI',
  tech: 'Tech',
}
const CATEGORY_LABELS_ZH: Record<string, string> = {
  app: '工具',
  design: '视觉',
  uxui: 'UX / UI',
  tech: '科技',
}

const DESC_LIMIT = 100

/** Keep only complete sentences that fit within DESC_LIMIT characters, add ellipsis if trimmed. */
function trimDesc(raw: string): string {
  // Collapse all whitespace (newlines, tabs, multiple spaces) into single space
  const collapsed = raw.replace(/\s+/g, ' ').trim()
  // Strip leading byline: "Author Name • " or "Author Name | "
  const stripped = collapsed.replace(/^[^•|]{1,80}[•|]\s*/, '').trim()
  // If byline was stripped and nothing useful remains, hide entirely
  if (stripped !== collapsed && stripped.length < 20) return ''
  const text = stripped.length >= 20 ? stripped : collapsed
  if (text.length < 20) return ''
  // Hide descriptions that are just IDs / reference codes (e.g. "arXiv:2603.12345")
  if (/^[a-zA-Z]+:\d/.test(text)) return ''

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
  const { isZh, translations } = useTranslation()
  const tUi = ui(isZh)
  const translated = translations[article.id]

  const zhTitleFromDb = looksLikeChinese(article.title_zh) ? article.title_zh! : null
  const zhTitleFromClient = looksLikeChinese(translated?.title) ? translated!.title : null
  const title = isZh
    ? (zhTitleFromDb || zhTitleFromClient || article.title)
    : article.title
  const hasZhTitle = isZh && Boolean(zhTitleFromDb || zhTitleFromClient)

  const zhDescFromDb = (() => {
    if (article.description_zh === null || article.description_zh === undefined) return null
    const d = String(article.description_zh).trim()
    if (d === '' || looksLikeChinese(d)) return article.description_zh
    return null
  })()
  const zhDescFromClient = (() => {
    if (translated?.description === null || translated?.description === undefined) return null
    const d = String(translated.description).trim()
    if (d === '' || looksLikeChinese(d)) return translated.description
    return null
  })()
  const description = (() => {
    if (!isZh) return article.description
    if (zhDescFromDb !== null) return zhDescFromDb
    if (zhDescFromClient !== null) return zhDescFromClient
    if (hasZhTitle) return null
    return article.description
  })()
  const sourceName = article.sources?.name || tUi.unknownSource
  const sourceDate = formatDate(article.published_at, isZh ? 'zh-CN' : 'en-US')
  const category = article.sources?.category
  const categoryLabel = category
    ? (isZh ? CATEGORY_LABELS_ZH[category] : CATEGORY_LABELS_EN[category]) ?? null
    : null
  const lightBg = isLightColor(article.card_color || '#4D96FF')

  // Only use stored thumbnails (og:image from the article source).
  // thum.io fallbacks frequently return blank white screenshots when the
  // page was captured mid-load — removing them eliminates white-image cards.
  const thumbSrc = article.thumbnail ?? null

  const SAMPLE_W = 80, SAMPLE_H = 60
  const WHITE_THRESHOLD = 240  // per channel — values above this are near-white
  const WHITE_RATIO = 0.85     // fraction of pixels that must be white to reject the image
  const MIN_DIM = 50           // ignore tiny images (icons, spacers)

  useEffect(() => {
    if (!thumbSrc) return

    let mounted = true

    const img = new Image()
    img.crossOrigin = 'anonymous'   // needed for getImageData(); falls back on error

    img.onload = () => {
      if (!mounted) return
      if (img.naturalWidth < MIN_DIM || img.naturalHeight < MIN_DIM) return
      // Sample pixels at low resolution to catch blank/white og:images without
      // downloading the full file. Falls open on SecurityError (cross-origin CORS denial).
      try {
        const canvas = document.createElement('canvas')
        canvas.width = SAMPLE_W
        canvas.height = SAMPLE_H
        const ctx = canvas.getContext('2d')
        if (!ctx) { setImgReady(true); return }
        ctx.drawImage(img, 0, 0, SAMPLE_W, SAMPLE_H)
        const { data } = ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H)
        let white = 0
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] > WHITE_THRESHOLD && data[i + 1] > WHITE_THRESHOLD && data[i + 2] > WHITE_THRESHOLD) white++
        }
        if (white / (SAMPLE_W * SAMPLE_H) > WHITE_RATIO) return  // blank image — stay text-mode
        setImgReady(true)
      } catch {
        setImgReady(true)  // CORS tainted — fail open
      }
    }

    img.onerror = () => {
      if (!mounted) return
      // Server didn't send CORS headers; reload without crossOrigin so the browser
      // can at least display the image (pixel analysis unavailable, but that's acceptable).
      const fallback = new Image()
      fallback.onload = () => {
        if (mounted && fallback.naturalWidth >= MIN_DIM && fallback.naturalHeight >= MIN_DIM) setImgReady(true)
      }
      fallback.src = thumbSrc
    }

    img.src = thumbSrc
    return () => { mounted = false }
  }, [thumbSrc])

  function handleClick() {
    fetch(`/api/articles/${article.id}/click`, { method: 'POST' })
    window.open(article.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div onClick={handleClick} className="cursor-pointer group mb-5 sm:mb-8 break-inside-avoid">
      {imgReady ? (
        /* ── 有图模式：色块内嵌图片，文字在色块下方 ── */
        <>
          <div
            className="overflow-hidden transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:shadow-xl"
            style={{ backgroundColor: article.card_color }}
          >
            <div className="pt-6 px-6 sm:pt-10 sm:px-10">
              <img
                src={thumbSrc!}
                alt=""
                className="w-full block"
              />
            </div>
          </div>
          <div className="pt-3 px-0.5">
            <h2 className="text-base sm:text-xl font-bold leading-snug mb-1.5" style={{ color: 'var(--card-title)' }}>
              {title}
            </h2>
            {description && (
              <p className="text-[13px] leading-relaxed mb-1.5" style={{ color: 'var(--card-desc)' }}>
                {trimDesc(description)}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--card-source)' }}>
                {sourceName}
                {showCategory && categoryLabel && (
                  <span className="px-1.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wide" style={{ backgroundColor: 'var(--nav-active-bg)', color: 'var(--card-source)' }}>
                    {categoryLabel}
                  </span>
                )}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-sm" style={{ color: 'var(--card-date)' }}>{sourceDate}</span>
              </span>
            </div>
          </div>
        </>
      ) : (
        /* ── 无图模式：标题文字在色块内部 ── */
        <div
          className="overflow-hidden transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:shadow-xl p-5 sm:p-10 flex flex-col justify-between min-h-36 sm:min-h-52"
          style={{ backgroundColor: article.card_color }}
        >
          <h2 className="text-base sm:text-xl font-bold text-gray-900 leading-snug">
            {title}
          </h2>
          {description && (
            <p className={`text-[13px] font-medium leading-relaxed mt-2 ${lightBg ? 'text-gray-500' : 'text-white/90'}`}>
              {trimDesc(description)}
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
              <span className={`text-sm font-medium ${lightBg ? 'text-gray-400' : 'text-white/60'}`}>{sourceDate}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
