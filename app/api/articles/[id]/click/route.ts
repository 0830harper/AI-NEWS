import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await supabaseAdmin.rpc('increment_click', { article_id: parseInt(id) })
  return NextResponse.json({ ok: true })
}
