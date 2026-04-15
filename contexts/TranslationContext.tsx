'use client'
import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { Article } from '../types'

type Translations = Record<number, { title: string; description: string | null }>

interface TranslationContextType {
  isZh: boolean
  toggle: () => void
  translations: Translations
  translateArticles: (articles: Article[]) => Promise<void>
  isTranslating: boolean
}

const TranslationContext = createContext<TranslationContextType | null>(null)

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [isZh, setIsZh] = useState(false)
  const [translations, setTranslations] = useState<Translations>({})
  const [isTranslating, setIsTranslating] = useState(false)
  // Only IDs that were *successfully* translated (title actually changed)
  const doneIds = useRef<Set<number>>(new Set())

  const translateArticles = useCallback(async (articles: Article[]) => {
    const toTranslate = articles.filter(a => !doneIds.current.has(a.id))
    if (!toTranslate.length) return

    // Build a lookup of original titles to detect failed translations
    const originals = new Map(toTranslate.map(a => [a.id, a.title]))

    setIsTranslating(true)
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

      for (const item of (data.translations || [])) {
        const originalTitle = originals.get(item.id)
        // Only store if the title actually changed — if it's identical to the
        // original, the translation failed silently; don't mark as done so
        // the next toggle will retry it.
        if (item.title && originalTitle && item.title !== originalTitle) {
          newTranslations[item.id] = { title: item.title, description: item.description }
          doneIds.current.add(item.id)
        }
      }
      setTranslations(prev => ({ ...prev, ...newTranslations }))
    } catch {
      // Network / parse error — no articles marked done, all will retry next time
    } finally {
      setIsTranslating(false)
    }
  }, [])

  const toggle = useCallback(() => setIsZh(v => !v), [])

  return (
    <TranslationContext.Provider value={{ isZh, toggle, translations, translateArticles, isTranslating }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(TranslationContext)
  if (!ctx) throw new Error('useTranslation must be used within TranslationProvider')
  return ctx
}
