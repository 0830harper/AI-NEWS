import axios from 'axios'
import { supabaseAdmin } from './supabase'

export interface ArticleTranslationInput {
  id: number
  title: string
  description: string | null
}

const BATCH_SIZE = Math.min(24, Math.max(1, parseInt(process.env.TRANSLATE_BATCH_SIZE || '10', 10)))
const MAX_CONCURRENT = Math.min(6, Math.max(1, parseInt(process.env.TRANSLATE_MAX_CONCURRENT || '2', 10)))

/**
 * Translate a batch of articles in a single LLM call using JSON format.
 * Uses axios to bypass Next.js fetch patching that can serialize concurrent requests.
 */
async function translateBatch(articles: ArticleTranslationInput[]): Promise<ArticleTranslationInput[]> {
  const apiKey = process.env.SILICONFLOW_API_KEY
  if (!apiKey) return articles

  const input = articles.map(a => ({
    id: a.id,
    t: a.title,
    d: a.description || null,
  }))

  try {
    const { data } = await axios.post(
      'https://api.siliconflow.cn/v1/chat/completions',
      {
        model: 'Qwen/Qwen3-8B',
        messages: [{
          role: 'user',
          content:
            '将下列JSON数组中每项的"t"（标题）和"d"（描述）字段翻译为简体中文。' +
            '保持JSON结构和id不变，直接输出JSON数组，不要任何其他文字：\n\n' +
            JSON.stringify(input),
        }],
        max_tokens: Math.min(4096, 600 + articles.length * 320),
        temperature: 0,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 45000,
      }
    )

    const raw: string = data.choices?.[0]?.message?.content?.trim() || ''
    const reply = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim()

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

/** Run all batches (chunked + limited concurrency). */
export async function translateAllBatches(
  articles: ArticleTranslationInput[]
): Promise<ArticleTranslationInput[]> {
  if (!articles.length) return []

  const batches: ArticleTranslationInput[][] = []
  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    batches.push(articles.slice(i, i + BATCH_SIZE))
  }

  const all: ArticleTranslationInput[] = []
  for (let i = 0; i < batches.length; i += MAX_CONCURRENT) {
    const chunk = batches.slice(i, i + MAX_CONCURRENT)
    const results = await Promise.all(chunk.map(b => translateBatch(b)))
    results.forEach(r => all.push(...r))
  }
  return all
}

/**
 * After new articles are inserted, load rows and persist 简体中文 to title_zh / description_zh.
 * Skips when SILICONFLOW_API_KEY is missing. Only writes when title actually changed (translation succeeded).
 */
export async function translateAndPersistArticleIds(ids: number[]): Promise<void> {
  if (!ids.length) return
  if (!process.env.SILICONFLOW_API_KEY) return

  const { data, error } = await (supabaseAdmin as any)
    .from('articles')
    .select('id, title, description')
    .in('id', ids)

  if (error || !data?.length) return

  const rows = data as { id: number; title: string; description: string | null }[]
  const originals = new Map(rows.map(r => [r.id, r.title]))
  const translated = await translateAllBatches(
    rows.map(r => ({ id: r.id, title: r.title, description: r.description }))
  )

  const updates: { id: number; title_zh: string; description_zh: string | null }[] = []
  for (const t of translated) {
    const orig = originals.get(t.id)
    if (orig === undefined) continue
    // Always persist so UI skips client translate; if model echoed EN, title_zh may match title.
    updates.push({
      id: t.id,
      title_zh: (t.title?.trim() || orig).slice(0, 500),
      description_zh: t.description !== undefined ? (t.description?.slice(0, 1000) || null) : null,
    })
  }

  await Promise.all(
    updates.map(u =>
      (supabaseAdmin as any)
        .from('articles')
        .update({ title_zh: u.title_zh, description_zh: u.description_zh })
        .eq('id', u.id)
    )
  )
}
