/**
 * One-off: fill title_zh / description_zh for every row still missing title_zh.
 * Usage (from ai-news/): npx tsx scripts/backfill-zh.ts
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SILICONFLOW_API_KEY.
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import { translateAndPersistArticleIds } from '../lib/translate-articles'
import { supabaseAdmin } from '../lib/supabase'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const CHUNK = 80

async function main() {
  if (!process.env.SILICONFLOW_API_KEY) {
    console.error('Missing SILICONFLOW_API_KEY')
    process.exit(1)
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')
    process.exit(1)
  }

  let total = 0
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
    total += ids.length
    console.log(`Translated + persisted ${ids.length} rows (running total ${total})`)
  }

  console.log(total === 0 ? 'Nothing to backfill (all rows have title_zh).' : `Done. ${total} rows processed.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
