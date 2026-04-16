/**
 * Backfill thumbnails for articles that have no image.
 * Re-fetches og:image for articles where thumbnail IS NULL.
 *
 * Usage: npx tsx scripts/backfill-thumbnails.ts
 *        npx tsx scripts/backfill-thumbnails.ts --days 7   (only last 7 days, default 30)
 */
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { supabaseAdmin } from '../lib/supabase'
import { extractOgImage, isLogoUrl } from '../lib/og-image'

const CONCURRENCY = 10
const daysIdx = process.argv.indexOf('--days')
const DAYS = daysIdx !== -1 && process.argv[daysIdx + 1]
  ? parseInt(process.argv[daysIdx + 1], 10) || 30
  : 30

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase env vars')
    process.exit(1)
  }

  const since = new Date(Date.now() - DAYS * 24 * 3600 * 1000).toISOString()
  console.log(`Backfilling thumbnails for articles published since ${since.slice(0, 10)} (${DAYS} days)…`)

  const { data, error } = await (supabaseAdmin as any)
    .from('articles')
    .select('id, url')
    .is('thumbnail', null)
    .gte('published_at', since)
    .order('id', { ascending: false })
    .limit(500)

  if (error) {
    console.error('Supabase:', error.message)
    process.exit(1)
  }

  const rows = data || []
  console.log(`Found ${rows.length} articles without thumbnails`)

  let filled = 0
  let skipped = 0

  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const batch = rows.slice(i, i + CONCURRENCY)
    const results = await Promise.allSettled(
      batch.map(async (r: { id: number; url: string }) => {
        const img = await extractOgImage(r.url)
        if (img && !isLogoUrl(img)) {
          await (supabaseAdmin as any)
            .from('articles')
            .update({ thumbnail: img })
            .eq('id', r.id)
          return true
        }
        return false
      })
    )
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) filled++
      else skipped++
    }
    console.log(`  Processed ${Math.min(i + CONCURRENCY, rows.length)}/${rows.length} (${filled} filled, ${skipped} no image)`)
  }

  console.log(`Done. ${filled} thumbnails added, ${skipped} still without image.`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
