import type { Article } from '../types'

type ClientPiece = { title: string; description: string | null } | undefined

/** CJK present → treat as Chinese title/summary for “already translated” checks */
export function looksLikeChinese(text: string | null | undefined): boolean {
  if (!text?.trim()) return false
  return /[\u4e00-\u9fff\u3400-\u4dbf]/.test(text)
}

function needsDescTranslate(a: Article, client: ClientPiece): boolean {
  const enDesc = a.description?.trim()
  if (!enDesc) return false

  if (a.description_zh === null || a.description_zh === undefined) {
    if (client?.description !== undefined && client?.description !== null) {
      if (looksLikeChinese(client.description) || client.description.trim() === '') return false
    }
    return true
  }

  const dz = String(a.description_zh).trim()
  if (dz === '') return false
  if (looksLikeChinese(a.description_zh)) return false
  return true
}

/**
 * Still need to call /api/translate: title not Chinese-looking yet, or English summary exists but no zh summary in DB/cache.
 */
export function articleNeedsClientTranslate(a: Article, client: ClientPiece): boolean {
  if (!a.title?.trim()) return false

  const titleOk = looksLikeChinese(a.title_zh) || looksLikeChinese(client?.title)
  if (!titleOk) return true

  return needsDescTranslate(a, client)
}
