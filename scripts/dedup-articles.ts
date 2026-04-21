/**
 * Find and remove duplicate articles caused by tracking-parameter URL variants.
 * Keeps the oldest copy (lowest id), deletes the rest.
 *
 * Usage:
 *   npx tsx scripts/dedup-articles.ts           # live run
 *   npx tsx scripts/dedup-articles.ts --dry-run
 */
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import crypto from 'crypto'
import { supabaseAdmin } from '../lib/supabase'
import { hashUrl } from '../lib/utils'

const DRY_RUN = process.argv.includes('--dry-run')

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase env vars.'); process.exit(1)
  }
  if (DRY_RUN) console.log('DRY RUN — no deletes.\n')

  // Load ALL articles in pages (Supabase caps at 1000 rows per request)
  const rows: { id: number; url: string; title: string }[] = []
  const PAGE = 1000
  let from = 0
  while (true) {
    const { data, error } = await (supabaseAdmin as any)
      .from('articles')
      .select('id, url, title')
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) { console.error(error.message); process.exit(1) }
    if (!data?.length) break
    rows.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }
  console.log(`Loaded ${rows.length} articles`)

  // Group by canonical url_hash (strips tracking params)
  const byHash: Record<string, number[]> = {}
  for (const r of rows) {
    const h = hashUrl(r.url)
    if (!byHash[h]) byHash[h] = []
    byHash[h].push(r.id)
  }

  // Collect ids to delete (all but the first/lowest id per canonical hash)
  const toDelete: number[] = []
  let dupGroups = 0
  for (const [, ids] of Object.entries(byHash)) {
    if (ids.length < 2) continue
    dupGroups++
    const [keep, ...remove] = ids  // ids are already sorted ascending
    console.log(`  dup: keep id=${keep}, delete ids=${remove.join(', ')}`)
    toDelete.push(...remove)
  }

  console.log(`\nDuplicate groups: ${dupGroups}, articles to delete: ${toDelete.length}`)
  if (!toDelete.length) { console.log('Nothing to do.'); return }
  if (DRY_RUN) { console.log('[DRY RUN] No deletes executed.'); return }

  // Delete in batches of 50
  const BATCH = 50
  for (let i = 0; i < toDelete.length; i += BATCH) {
    const chunk = toDelete.slice(i, i + BATCH)
    const { error: delErr } = await (supabaseAdmin as any)
      .from('articles')
      .delete()
      .in('id', chunk)
    if (delErr) console.error(`  Delete error (ids ${chunk}): ${delErr.message}`)
    else console.log(`  Deleted ids: ${chunk.join(', ')}`)
  }

  console.log('\nDone. Also update existing url_hash values to canonical form:')
  console.log('  Run: npx tsx scripts/recanonicalise-url-hashes.ts')
}

main().catch(e => { console.error(e); process.exit(1) })
