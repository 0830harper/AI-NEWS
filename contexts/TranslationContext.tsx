'use client'
import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { Article } from '../types'
import {
  articleNeedsClientTranslate,
  looksLikeChinese,
} from '../lib/article-needs-client-translate'

type Translations = Record<number, { title: string; description: string | null }>

interface TranslationContextType {
  isZh: boolean
  toggle: () => void
  translations: Translations
  translateArticles: (articles: Article[]) => Promise<void>
}

const TranslationContext = createContext<TranslationContextType | null>(null)

/** Smaller batches = fewer token errors / timeouts on SiliconFlow */
const CLIENT_CHUNK = 10
/** Model returned same text this many times → stop retrying until user toggles 中 again */
const MAX_UNCHANGED_RETRIES = 8

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [isZh, setIsZh] = useState(false)
  const [translations, setTranslations] = useState<Translations>({})
  const inflight = useRef(false)
  /** Too many identical responses — pause until user toggles EN → 中 */
  const skipIds = useRef<Set<number>>(new Set())
  const unchangedRetries = useRef<Map<number, number>>(new Map())

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
      const merged: Translations = {}

      try {
        for (let i = 0; i < toTranslate.length; i += CLIENT_CHUNK) {
          const slice = toTranslate.slice(i, i + CLIENT_CHUNK)
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
          if (!res.ok) continue
          const data = await res.json()
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
              merged[item.id] = {
                title: item.title,
                description: item.description,
              }
              unchangedRetries.current.delete(item.id)
            } else {
              const n = (unchangedRetries.current.get(item.id) ?? 0) + 1
              unchangedRetries.current.set(item.id, n)
              if (n >= MAX_UNCHANGED_RETRIES) {
                skipIds.current.add(item.id)
              }
            }
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
            .filter(u => {
              if (looksLikeChinese(u.title_zh)) return true
              if (u.description_zh !== null && u.description_zh !== undefined) {
                const d = String(u.description_zh).trim()
                if (d === '') return true
                if (looksLikeChinese(u.description_zh)) return true
              }
              return false
            })
          if (payload.length) {
            void fetch('/api/articles/persist-translation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ updates: payload }),
            }).catch(() => {})
          }
        }
      } catch {
        // Network error — retry on next effect
      } finally {
        inflight.current = false
      }
    },
    [translations]
  )

  const toggle = useCallback(() => {
    setIsZh(prev => {
      const next = !prev
      if (next) {
        skipIds.current.clear()
        unchangedRetries.current.clear()
      }
      return next
    })
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
