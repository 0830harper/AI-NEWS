import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { getImageDimensions } from '../../../lib/image-size'

const BATCH = 25       // probe 25 concurrently
const LIMIT = 25       // process 25 articles per call (fits in Vercel 10s limit)
const SECRET = process.env.CRON_SECRET

export async function POST(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Fetch articles that have a thumbnail but no dimensions yet
  const { data, error } = await (supabaseAdmin as any)
    .from('articles')
    .select('id, thumbnail')
    .not('thumbnail', 'is', null)
    .is('img_width', null)
    .limit(LIMIT)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) return NextResponse.json({ done: true, updated: 0 })

  let updated = 0
  let failed = 0

  for (let i = 0; i < data.length; i += BATCH) {
    const batch = data.slice(i, i + BATCH)
    const results = await Promise.allSettled(
      batch.map((a: { id: number; thumbnail: string }) => getImageDimensions(a.thumbnail))
    )
    for (let j = 0; j < batch.length; j++) {
      const r = results[j]
      const dims = r.status === 'fulfilled' ? r.value : null
      if (dims) {
        await (supabaseAdmin as any)
          .from('articles')
          .update({ img_width: dims.width, img_height: dims.height })
          .eq('id', batch[j].id)
        updated++
      } else {
        // Mark as failed with 0 so it's excluded from future runs
        await (supabaseAdmin as any)
          .from('articles')
          .update({ img_width: 0, img_height: 0 })
          .eq('id', batch[j].id)
        failed++
      }
    }
  }

  const remaining = data.length === LIMIT ? 'more rows remaining — call again' : 'all done'
  return NextResponse.json({ updated, failed, remaining })
}
