import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { getImageDimensions } from '../../../lib/image-size'

const BATCH = 20
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
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) return NextResponse.json({ done: true, updated: 0 })

  let updated = 0
  let failed = 0

  for (let i = 0; i < data.length; i += BATCH) {
    const batch = data.slice(i, i + BATCH)
    const results = await Promise.allSettled(
      batch.map((a: { id: number; thumbnail: string }) => getImageDimensions(a.thumbnail))
    )
    const updates = results
      .map((r, idx) => ({ id: batch[idx].id, dims: r.status === 'fulfilled' ? r.value : null }))
      .filter(x => x.dims !== null)

    for (const { id, dims } of updates) {
      await (supabaseAdmin as any)
        .from('articles')
        .update({ img_width: dims!.width, img_height: dims!.height })
        .eq('id', id)
      updated++
    }
    failed += batch.length - updates.length
  }

  const remaining = data.length === 500 ? 'more rows remaining — call again' : 'all done'
  return NextResponse.json({ updated, failed, remaining })
}
