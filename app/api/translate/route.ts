import { NextRequest, NextResponse } from 'next/server'
import { translateAllBatches, type ArticleTranslationInput } from '../../../lib/translate-articles'

export async function POST(req: NextRequest) {
  const { articles } = await req.json()
  if (!Array.isArray(articles) || !articles.length) {
    return NextResponse.json({ translations: [] })
  }

  const inputs: ArticleTranslationInput[] = articles.map((a: { id: number; title: string; description: string | null }) => ({
    id: a.id,
    title: a.title,
    description: a.description ?? null,
  }))

  const allTranslations = await translateAllBatches(inputs)
  return NextResponse.json({ translations: allTranslations })
}
