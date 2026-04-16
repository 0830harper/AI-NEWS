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

function needsTranslate(a: Article, cache: Translations): boolean {
  if (!a.title?.trim()) return false
  if (looksLikeChinese(a.title_zh) || looksLikeChinese(cache[a.id]?.title)) return false
  return true
}

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [isZh, setIsZh] = useState(false)
  const [translations, setTranslations] = useState<Translations>({})
  const inflight = useRef(false)

  const translateArticles = useCallback(
    async (articles: Article[]) => {
      const todo = articles.filter(a => needsTranslate(a, translations))
      if (!todo.length || inflight.current) return
      inflight.current = true

      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            articles: todo.map(a => ({
              id: a.id,
              title: a.title,
              description: a.description,
            })),
          }),
        })
        if (!res.ok) return
        const data = await res.json()
        const merged: Translations = {}

        for (const item of (data.translations || [])) {
          if (item.title) {
            merged[item.id] = { title: item.title, description: item.description }
          }
        }

        if (Object.keys(merged).length) {
          setTranslations(prev => ({ ...prev, ...merged }))

          const payload = Object.entries(merged)
            .map(([id, v]) => ({
              id: Number(id),
              title_zh: v.title,
              description_zh: v.description,
            }))
            .filter(u => looksLikeChinese(u.title_zh))
          if (payload.length) {
            void fetch('/api/articles/persist-translation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ updates: payload }),
            }).catch(() => {})
          }
        }
      } catch {
        // retry on next toggle
      } finally {
        inflight.current = false
      }
    },
    [translations]
  )

  const toggle = useCallback(() => setIsZh(v => !v), [])

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
