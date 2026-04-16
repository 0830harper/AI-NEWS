'use client'
import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { Article } from '../types'
import { looksLikeChinese } from '../lib/article-needs-client-translate'

type Translations = Record<number, { title: string; description: string | null }>

interface TranslationContextType {
  isZh: boolean
  toggle: () => void
  translations: Translations
  translateArticles: (articles: Article[]) => Promise<void>
}

const TranslationContext = createContext<TranslationContextType | null>(null)

/** Articles per /api/translate request. Smaller = more reliable per batch. */
const CHUNK = 5
/** Delay between chunks (ms) to stay within SiliconFlow rate limits. */
const CHUNK_DELAY_MS = 400
/** Max automatic retries when HTTP errors occur (resets on toggle). */
const MAX_HTTP_RETRIES = 4

function needsTranslate(a: Article, cache: Translations): boolean {
  if (!a.title?.trim()) return false
  if (looksLikeChinese(a.title_zh) || looksLikeChinese(cache[a.id]?.title)) return false
  return true
}

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [isZh, setIsZh] = useState(false)
  const [translations, setTranslations] = useState<Translations>({})
  const inflight = useRef(false)
  /** How many HTTP-error retries have been scheduled this session. */
  const httpRetries = useRef(0)
  /** Pending retry timer handle. */
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const translateArticles = useCallback(
    async (articles: Article[]) => {
      const todo = articles.filter(a => needsTranslate(a, translations))
      if (!todo.length || inflight.current) return
      inflight.current = true

      const merged: Translations = {}
      let hadHttpFailure = false

      try {
        // Send in small chunks so a single HTTP failure only affects a few articles.
        for (let i = 0; i < todo.length; i += CHUNK) {
          if (i > 0) await new Promise(r => setTimeout(r, CHUNK_DELAY_MS))
          const slice = todo.slice(i, i + CHUNK)
          try {
            const res = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                articles: slice.map(a => ({
                  id: a.id,
                  title: a.title,
                  description: a.description,
                })),
              }),
            })
            if (!res.ok) { hadHttpFailure = true; continue }
            const data = await res.json()
            for (const item of (data.translations ?? [])) {
              if (item.title) {
                merged[item.id] = { title: item.title, description: item.description }
              }
            }
          } catch {
            hadHttpFailure = true
          }
        }

        if (Object.keys(merged).length > 0) {
          setTranslations(prev => ({ ...prev, ...merged }))

          // Persist only Chinese translations back to DB for future page loads.
          const payload = Object.entries(merged)
            .map(([id, v]) => ({ id: Number(id), title_zh: v.title, description_zh: v.description }))
            .filter(u => looksLikeChinese(u.title_zh))
          if (payload.length) {
            void fetch('/api/articles/persist-translation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ updates: payload }),
            }).catch(() => {})
          }
        }

        // KEY FIX: on HTTP failure, schedule a retry so the effect re-fires
        // and the still-untranslated articles get another attempt.
        if (hadHttpFailure && httpRetries.current < MAX_HTTP_RETRIES) {
          httpRetries.current++
          retryTimer.current = setTimeout(() => {
            // Nudge `translations` to a new reference so the useEffect dependency
            // fires again and calls translateArticles with the remaining articles.
            setTranslations(prev => ({ ...prev }))
          }, 2500)
        }
      } catch {
        // Outer network-level failure — will retry naturally on next toggle.
      } finally {
        inflight.current = false
      }
    },
    [translations]
  )

  const toggle = useCallback(() => {
    // Clear any pending retry from the previous session.
    if (retryTimer.current) {
      clearTimeout(retryTimer.current)
      retryTimer.current = null
    }
    httpRetries.current = 0
    setIsZh(v => !v)
  }, [])

  return (
    <TranslationContext.Provider value={{ isZh, toggle, translations, translateArticles }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(TranslationContext)
  if (!ctx) throw new Error('useTranslation must be used within TranslationProvider')
  return ctx
}
