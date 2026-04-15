import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'

/**
 * Write client-side translation results to Supabase so reload / other sessions see 中文.
 * Called from the browser after /api/translate succeeds (server uses service role only here).
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const updates = body?.updates as
    | { id: number; title_zh: string; description_zh: string | null }[]
    | undefined
  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ ok: false, error: 'invalid body' }, { status: 400 })
  }

  const capped = updates.slice(0, 80)
  await Promise.all(
    capped.map(u => {
      if (!Number.isFinite(u.id)) return Promise.resolve()
      return (supabaseAdmin as any)
        .from('articles')
        .update({
          title_zh: (u.title_zh || '').slice(0, 500),
          description_zh:
            u.description_zh !== undefined && u.description_zh !== null
              ? String(u.description_zh).slice(0, 1000)
              : null,
        })
        .eq('id', u.id)
    })
  )

  return NextResponse.json({ ok: true })
}
