import { NextRequest, NextResponse } from 'next/server'

const BATCH_SIZE = 10        // articles per LLM call
const MAX_CONCURRENT = 4     // parallel LLM calls at once

interface ArticleInput {
  id: number
  title: string
  description: string | null
}

/**
 * Translate a batch of articles in a single LLM call using JSON format.
 * Falling back to originals if parsing fails.
 */
async function translateBatch(articles: ArticleInput[]): Promise<ArticleInput[]> {
  const apiKey = process.env.SILICONFLOW_API_KEY
  if (!apiKey) return articles

  const input = articles.map(a => ({
    id: a.id,
    t: a.title,
    d: a.description || null,
  }))

  try {
    const res = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen2.5-7B-Instruct',
        messages: [{
          role: 'user',
          content:
            '将下列JSON数组中每项的"t"（标题）和"d"（描述）字段翻译为简体中文。' +
            '保持JSON结构和id不变，直接输出JSON数组，不要任何其他文字：\n\n' +
            JSON.stringify(input),
        }],
        max_tokens: 2500,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(25000),
    })

    if (!res.ok) return articles

    const data = await res.json()
    const reply: string = data.choices?.[0]?.message?.content?.trim() || ''

    // Robustly extract JSON array from response
    const jsonStart = reply.indexOf('[')
    const jsonEnd = reply.lastIndexOf(']')
    if (jsonStart === -1 || jsonEnd === -1) return articles

    const parsed: { id: number; t: string; d: string | null }[] =
      JSON.parse(reply.slice(jsonStart, jsonEnd + 1))
    if (!Array.isArray(parsed)) return articles

    const byId = new Map(parsed.map(item => [item.id, item]))
    return articles.map(a => {
      const tr = byId.get(a.id)
      if (!tr) return a
      return {
        id: a.id,
        title: tr.t?.trim() || a.title,
        description: tr.d !== undefined ? (tr.d?.trim() || null) : a.description,
      }
    })
  } catch {
    return articles
  }
}

export async function POST(req: NextRequest) {
  const { articles } = await req.json()
  if (!Array.isArray(articles) || !articles.length) {
    return NextResponse.json({ translations: [] })
  }

  // Split into batches of BATCH_SIZE
  const batches: ArticleInput[][] = []
  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    batches.push(articles.slice(i, i + BATCH_SIZE))
  }

  // Run batches concurrently (up to MAX_CONCURRENT at a time)
  const allTranslations: ArticleInput[] = []
  for (let i = 0; i < batches.length; i += MAX_CONCURRENT) {
    const chunk = batches.slice(i, i + MAX_CONCURRENT)
    const results = await Promise.all(chunk.map(b => translateBatch(b)))
    results.forEach(r => allTranslations.push(...r))
  }

  return NextResponse.json({ translations: allTranslations })
}
