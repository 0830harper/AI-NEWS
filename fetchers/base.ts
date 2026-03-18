import { FetchedArticle } from '../types'

export abstract class BaseFetcher {
  abstract fetch(): Promise<FetchedArticle[]>

  protected safeDate(dateStr: string | undefined | null): Date {
    if (!dateStr) return new Date()
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? new Date() : d
  }

  protected cleanText(str: string | undefined | null): string {
    if (!str) return ''
    let text = str.replace(/<[^>]*>/g, '')
    // Decode HTML entities
    text = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => {
        try { return String.fromCodePoint(parseInt(hex, 16)) } catch { return '' }
      })
      .replace(/&#(\d+);/g, (_, dec) => {
        try { return String.fromCodePoint(parseInt(dec, 10)) } catch { return '' }
      })
    return text.trim()
  }

  protected isGarbageTitle(title: string): boolean {
    if (!title || title.length < 2) return true
    // If more than 30% of chars are '?', it's an encoding failure
    const qCount = (title.match(/\?/g) || []).length
    return qCount >= 4 && qCount / title.length > 0.3
  }
}
