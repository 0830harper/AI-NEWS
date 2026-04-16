import { NextRequest, NextResponse } from 'next/server'
import { googleTranslateBatch, type TranslateItem } from '../../../lib/google-translate'

/**
 * Client-side translation endpoint: uses Google Translate for speed (~1-2s for 30 articles).
 * The heavier SiliconFlow LLM is only used in the backfill pipeline (lib/translate-articles.ts).
 */
export async function POST(req: NextRequest) {
  const { articles } = await req.json()
  if (!Array.isArray(articles) || !articles.length) {
    return NextResponse.json({ translations: [] })
  }

  const inputs: TranslateItem[] = articles.slice(0, 60).map(
    (a: { id: number; title: string; description: string | null }) => ({
      id: a.id,
      title: a.title,
      description: a.description ?? null,
    })
  )

  const translations = await googleTranslateBatch(inputs)
  return NextResponse.json({ translations })
}
