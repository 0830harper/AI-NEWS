'use client'
import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { Article } from '../types'
import { articleNeedsClientTranslate } from '../lib/article-needs-client-translate'

type Translations = Record<number, { title: string; description: string | null }>

interface TranslationContextType {
  isZh: boolean
  toggle: () => void
  translations: Translations
  translateArticles: (articles: Article[]) => Promise<void>
}

const TranslationContext = createContext<TranslationContextType | null>(null)

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [isZh, setIsZh] = useState(false)
  const [translations, setTranslations] = useState<Translations>({})
  const inflight = useRef(false)
  /** IDs where API returned 200 but text unchanged — avoid infinite retry loops */
  const skipIds = useRef<Set<number>>(new Set())

  const translateArticles = useCallback(
    async (articles: Article[]) => {
      const toTranslate = articles.filter(
        a =>
          !skipIds.current.has(a.id) &&
          articleNeedsClientTranslate(a, translations[a.id])
      )
      if (!toTranslate.length) return
      if (inflight.current) return
      inflight.current = true

      const originals = new Map(toTranslate.map(a => [a.id, a.title]))
      const originalsDesc = new Map(toTranslate.map(a => [a.id, a.description]))

      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            articles: toTranslate.map(a => ({
              id: a.id,
              title: a.title,
              description: a.description,
            })),
          }),
        })
        if (!res.ok) return
        const data = await res.json()
        const newTranslations: Translations = {}
        const rows = (data.translations || []) as {
          id: number
          title: string
          description: string | null
        }[]

        for (const item of rows) {
          const originalTitle = originals.get(item.id)
          const originalDesc = originalsDesc.get(item.id)
          if (!item.title || originalTitle === undefined) continue
          const titleChanged = item.title !== originalTitle
          const descChanged =
            item.description !== undefined && item.description !== originalDesc
          if (titleChanged || descChanged) {
            newTranslations[item.id] = {
              title: item.title,
              description: item.description,
            }
          } else {
            skipIds.current.add(item.id)
          }
        }
        if (Object.keys(newTranslations).length) {
          setTranslations(prev => ({ ...prev, ...newTranslations }))
        }
      } catch {
        // Network / parse error — retry on next effect / toggle
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
