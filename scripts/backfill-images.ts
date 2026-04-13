/**
 * backfill-images.ts
 * 批量给数据库里 thumbnail=null 的文章补抓 og:image
 * 用法: npx ts-node -r tsconfig-paths/register scripts/backfill-images.ts [days=30] [limit=500]
 */

import '../lib/env'
import { supabaseAdmin } from '../lib/supabase'
import { extractOgImage } from '../lib/og-image'

const CONCURRENCY = 8
const DAYS = parseInt(process.argv[2] ?? '30', 10)
const LIMIT = parseInt(process.argv[3] ?? '500', 10)

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

async function main() {
  const since = new Date(Date.now() - DAYS * 24 * 3600 * 1000).toISOString()

  console.log(`🔍 Querying articles with no thumbnail from last ${DAYS} days (limit ${LIMIT})...`)

  const { data: articles, error } = await (supabaseAdmin as any)
    .from('articles')
    .select('id, url, title')
    .is('thumbnail', null)
    .gte('published_at', since)
    .order('published_at', { ascending: false })
    .limit(LIMIT)

  if (error) {
    console.error('Query failed:', error.message)
    process.exit(1)
  }

  console.log(`📋 Found ${articles.length} articles without images`)

  let updated = 0
  let failed = 0

  for (let i = 0; i < articles.length; i += CONCURRENCY) {
    const batch = articles.slice(i, i + CONCURRENCY)

    const results = await Promise.allSettled(
      batch.map(async (article: any) => {
        try {
          const img = await extractOgImage(article.url)
          if (img) {
            await (supabaseAdmin as any)
              .from('articles')
              .update({ thumbnail: img })
              .eq('id', article.id)
            console.log(`  ✓ [${article.id}] ${article.title.slice(0, 50)}`)
            return true
          } else {
            console.log(`  – [${article.id}] no image: ${article.title.slice(0, 50)}`)
            return false
          }
        } catch (err: any) {
          console.log(`  ✗ [${article.id}] error: ${err.message?.slice(0, 60)}`)
          return false
        }
      })
    )

    results.forEach(r => {
      if (r.status === 'fulfilled' && r.value === true) updated++
      else failed++
    })

    const progress = Math.min(i + CONCURRENCY, articles.length)
    console.log(`Progress: ${progress}/${articles.length} — updated: ${updated}`)

    // 每批之间等一下，避免 microlink rate limit
    if (i + CONCURRENCY < articles.length) await sleep(500)
  }

  console.log(`\n✅ Done. Updated: ${updated} / ${articles.length} articles`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
