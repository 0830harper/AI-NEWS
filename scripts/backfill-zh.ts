/**
 * Backfill Chinese columns for articles.
 *
 * Default: only rows where title_zh IS NULL.
 *
 * Repair mode (--repair): rows where title_zh exists but has no CJK characters
 * (model previously echoed English into title_zh — script said "done" but UI still English).
 *
 * Usage (from ai-news/):
 *   npx tsx scripts/backfill-zh.ts
 *   npx tsx scripts/backfill-zh.ts --repair
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import { translateAndPersistArticleIds } from '../lib/translate-articles'
import { looksLikeChinese } from '../lib/article-needs-client-translate'
import { supabaseAdmin } from '../lib/supabase'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const CHUNK = 80
const PAGE = 400
const repair = process.argv.includes('--repair')

async function flushIds(ids: number[], totalRef: { n: number }) {
  if (!ids.length) return
  await translateAndPersistArticleIds(ids)
  totalRef.n += ids.length
  console.log(`Translated + persisted ${ids.length} rows (running total ${totalRef.n})`)
}

async function main() {
  if (!process.env.SILICONFLOW_API_KEY) {
    console.error('Missing SILICONFLOW_API_KEY')
    process.exit(1)
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')
    process.exit(1)
  }

  const total = { n: 0 }

  if (repair) {
    console.log('Repair mode: re-translating rows where title_zh has no Chinese characters…')
    let offset = 0
    let pending: number[] = []

    for (;;) {
      const { data, error } = await (supabaseAdmin as any)
        .from('articles')
        .select('id, title_zh')
        .not('title_zh', 'is', null)
        .order('id', { ascending: true })
        .range(offset, offset + PAGE - 1)

      if (error) {
        console.error('Supabase:', error.message)
        process.exit(1)
      }
      const rows = data || []
      if (!rows.length) break

      for (const r of rows as { id: number; title_zh: string | null }[]) {
        const tz = r.title_zh || ''
        if (!looksLikeChinese(tz)) pending.push(r.id)
        if (pending.length >= CHUNK) {
          const batch = pending.splice(0, CHUNK)
          await flushIds(batch, total)
        }
      }
      offset += PAGE
      if (rows.length < PAGE) break
    }
    if (pending.length) await flushIds(pending, total)

    console.log(
      total.n === 0
        ? 'Nothing to repair (every title_zh contains CJK, or table empty).'
        : `Repair done. ${total.n} rows processed.`
    )
    return
  }

  // Default: NULL title_zh only
  for (;;) {
    const { data, error } = await (supabaseAdmin as any)
      .from('articles')
      .select('id')
      .is('title_zh', null)
      .limit(CHUNK)

    if (error) {
      console.error('Supabase:', error.message)
      console.error('Did you run scripts/add-article-zh-columns.sql ?')
      process.exit(1)
    }
    const ids = (data || []).map((r: { id: number }) => r.id)
    if (!ids.length) break

    await translateAndPersistArticleIds(ids)
    total.n += ids.length
    console.log(`Translated + persisted ${ids.length} rows (running total ${total.n})`)
  }

  console.log(
    total.n === 0
      ? 'Nothing to backfill (all rows have title_zh). If UI is still English, run: npx tsx scripts/backfill-zh.ts --repair'
      : `Done. ${total.n} rows processed.`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
