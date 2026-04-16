/**
 * Fast EN→ZH translation via Google Translate (unofficial gtx endpoint).
 * ~100-300ms per request, free, no API key needed.
 * Used for real-time client-side translation; SiliconFlow LLM is kept for
 * higher-quality pre-translation in the backfill pipeline.
 */

const ENDPOINT = 'https://translate.googleapis.com/translate_a/single'

async function googleTranslateOne(text: string): Promise<string> {
  if (!text.trim()) return text
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'en',
    tl: 'zh-CN',
    dt: 't',
    q: text.slice(0, 2000),
  })
  const res = await fetch(`${ENDPOINT}?${params}`, { signal: AbortSignal.timeout(5000) })
  if (!res.ok) return text
  const data = await res.json()
  // Response format: [[["translated","original",...], ...], ...]
  const sentences = (data?.[0] || []) as [string, string][]
  return sentences.map(s => s[0]).join('') || text
}

export interface TranslateItem {
  id: number
  title: string
  description: string | null
}

/**
 * Translate a batch of articles concurrently using Google Translate.
 * All requests fire in parallel — typically completes in 0.5-2 seconds for 30 articles.
 */
export async function googleTranslateBatch(articles: TranslateItem[]): Promise<TranslateItem[]> {
  const results = await Promise.allSettled(
    articles.map(async (a) => {
      const [title, description] = await Promise.all([
        googleTranslateOne(a.title),
        a.description ? googleTranslateOne(a.description) : Promise.resolve(null),
      ])
      return { id: a.id, title, description }
    })
  )
  return results.map((r, i) =>
    r.status === 'fulfilled' ? r.value : articles[i]
  )
}
