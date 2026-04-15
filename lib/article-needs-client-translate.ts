import type { Article } from '../types'

type ClientPiece = { title: string; description: string | null } | undefined

/**
 * True if this article still needs a client-side /api/translate call
 * (missing Chinese title and/or missing Chinese summary while English summary exists).
 */
export function articleNeedsClientTranslate(a: Article, client: ClientPiece): boolean {
  if (!a.title?.trim()) return false

  const hasZhTitle = Boolean(a.title_zh?.trim() || client?.title?.trim())
  if (!hasZhTitle) return true

  const enDesc = a.description?.trim()
  if (!enDesc) return false

  const hasZhDescInDb =
    a.description_zh !== undefined && a.description_zh !== null
  const hasZhDescInClient =
    client?.description !== undefined && client?.description !== null

  if (!hasZhDescInDb && !hasZhDescInClient) return true

  return false
}
