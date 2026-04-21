/**
 * Clear thumbnails for OpenAI Blog articles published on Apr 16.
 * These were scraped with blank/white og:images from ctfassets.net.
 *
 * Usage: npx tsx scripts/clear-openai-apr16-thumbnails.ts
 *        npx tsx scripts/clear-openai-apr16-thumbnails.ts --dry-run
 */
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { supabaseAdmin } from '../lib/supabase'

const DRY_RUN = process.argv.includes('--dry-run')

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase env vars.')
    process.exit(1)
  }

  // Find all OpenAI Blog articles published on Apr 16 (any year, but likely 2026)
  // that still have a thumbnail set
  const { data, error } = await (supabaseAdmin as any)
    .from('articles')
    .select('id, title, thumbnail, url, published_at')
    .not('thumbnail', 'is', null)
    .ilike('url', '%openai.com%')
    .gte('published_at', '2026-04-16T00:00:00Z')
    .lt('published_at', '2026-04-17T00:00:00Z')
    .order('id', { ascending: false })

  if (error) {
    console.error('Supabase query failed:', error.message)
    process.exit(1)
  }

  const openai = (data || []) as Array<{
    id: number
    title: string
    thumbnail: string
    url: string
    published_at: string
  }>

  console.log(`Found ${openai.length} OpenAI Blog articles on Apr 16 with thumbnails`)
  if (DRY_RUN) console.log('DRY RUN — no writes.')
  console.log()

  for (const r of openai) {
    console.log(`  [${DRY_RUN ? 'dry' : 'clear'}] id=${r.id}  "${r.title}"`)
    console.log(`         thumbnail: ${r.thumbnail}`)
  }

  if (!openai.length) {
    console.log('Nothing to clear.')
    return
  }

  if (DRY_RUN) {
    console.log(`\n[DRY RUN] Would null ${openai.length} thumbnails.`)
    return
  }

  const ids = openai.map(r => r.id)
  const { error: updateErr } = await (supabaseAdmin as any)
    .from('articles')
    .update({ thumbnail: null })
    .in('id', ids)

  if (updateErr) {
    console.error('Update failed:', updateErr.message)
    process.exit(1)
  }

  console.log(`\nCleared ${ids.length} thumbnails: ids ${ids.join(', ')}`)
  console.log('Done.')
}

main().catch(e => { console.error(e); process.exit(1) })
