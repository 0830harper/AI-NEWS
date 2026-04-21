/**
 * Scan all stored thumbnails and null-out any that are blank/white images
 * (file size too small to contain real content).
 *
 * A truly blank or all-white JPEG/PNG is typically < 5 KB.
 * Real article OG images are almost always ≥ 10 KB.
 *
 * Usage:
 *   npx tsx scripts/clean-blank-thumbnails.ts
 *   npx tsx scripts/clean-blank-thumbnails.ts --dry-run   (report only, no writes)
 *   npx tsx scripts/clean-blank-thumbnails.ts --min-bytes 8000
 */
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { supabaseAdmin } from '../lib/supabase'

const DRY_RUN = process.argv.includes('--dry-run')

const minBytesIdx = process.argv.indexOf('--min-bytes')
const MIN_BYTES = minBytesIdx !== -1 && process.argv[minBytesIdx + 1]
  ? parseInt(process.argv[minBytesIdx + 1], 10)
  : 5_000   // 5 KB — anything below this is almost certainly blank/white

const CONCURRENCY = 12
const TIMEOUT_MS = 8_000

/** Returns the file size in bytes, or null if undetermined. */
async function getImageSize(url: string): Promise<number | null> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    const res = await fetch(url, { method: 'HEAD', signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) return null
    const cl = Number(res.headers.get('content-length') ?? 0)
    if (cl > 0) return cl

    // HEAD gave no Content-Length — use Range request for total size
    const ctrl2 = new AbortController()
    const timer2 = setTimeout(() => ctrl2.abort(), TIMEOUT_MS)
    const range = await fetch(url, {
      headers: { Range: 'bytes=0-0' },
      signal: ctrl2.signal,
    })
    clearTimeout(timer2)
    const cr = range.headers.get('content-range') // "bytes 0-0/TOTAL"
    if (cr) {
      const total = parseInt(cr.split('/')[1] ?? '0')
      if (total > 0) return total
    }
    return null
  } catch {
    return null
  }
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase env vars. Make sure .env.local is present.')
    process.exit(1)
  }

  console.log(`Min size threshold: ${MIN_BYTES.toLocaleString()} bytes`)
  if (DRY_RUN) console.log('DRY RUN — no database writes will happen.')

  // Fetch all articles with a stored thumbnail
  const { data, error } = await (supabaseAdmin as any)
    .from('articles')
    .select('id, url, thumbnail')
    .not('thumbnail', 'is', null)
    .order('id', { ascending: false })

  if (error) {
    console.error('Supabase query failed:', error.message)
    process.exit(1)
  }

  const rows = (data || []) as { id: number; url: string; thumbnail: string }[]
  console.log(`Checking ${rows.length} thumbnails…\n`)

  let blanked = 0
  let kept = 0
  let unknown = 0
  const toNull: number[] = []

  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const batch = rows.slice(i, i + CONCURRENCY)
    const results = await Promise.allSettled(
      batch.map(async (r) => {
        const size = await getImageSize(r.thumbnail)
        return { id: r.id, thumbnail: r.thumbnail, size }
      })
    )

    for (const result of results) {
      if (result.status === 'rejected') { unknown++; continue }
      const { id, thumbnail, size } = result.value
      if (size === null) {
        // Can't determine size — leave it; assume valid
        unknown++
        console.log(`  [?] id=${id}  size=unknown  ${thumbnail.slice(0, 80)}`)
      } else if (size < MIN_BYTES) {
        blanked++
        toNull.push(id)
        console.log(`  [✗] id=${id}  size=${size}B (BLANK) → nulling  ${thumbnail.slice(0, 80)}`)
      } else {
        kept++
      }
    }

    const done = Math.min(i + CONCURRENCY, rows.length)
    process.stdout.write(`\r  Progress: ${done}/${rows.length}`)
  }

  console.log(`\n\nResults:`)
  console.log(`  Blank / too small : ${blanked}`)
  console.log(`  Valid (kept)      : ${kept}`)
  console.log(`  Size unknown      : ${unknown}`)

  if (toNull.length === 0) {
    console.log('\nNo blank thumbnails found. Nothing to clean up.')
    return
  }

  if (DRY_RUN) {
    console.log(`\n[DRY RUN] Would null ${toNull.length} thumbnails: ids ${toNull.join(', ')}`)
    return
  }

  // Null-out blank thumbnails in batches
  console.log(`\nNulling ${toNull.length} blank thumbnails…`)
  const WRITE_BATCH = 50
  for (let i = 0; i < toNull.length; i += WRITE_BATCH) {
    const chunk = toNull.slice(i, i + WRITE_BATCH)
    const { error: updateErr } = await (supabaseAdmin as any)
      .from('articles')
      .update({ thumbnail: null })
      .in('id', chunk)
    if (updateErr) {
      console.error(`  Error updating ids ${chunk}: ${updateErr.message}`)
    } else {
      console.log(`  Cleared ids: ${chunk.join(', ')}`)
    }
  }

  console.log('\nDone. Re-run backfill-thumbnails.ts to attempt fresh og:image fetches.')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
