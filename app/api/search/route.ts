import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 40
  const offset = (page - 1) * limit

  if (!q || q.length < 1) {
    return NextResponse.json({ articles: [], page, total: 0 })
  }

  const pattern = `%${q}%`

  const { data, error, count } = await supabase
    .from('articles')
    .select('*, sources(name, slug, category, home_url)', { count: 'exact' })
    .or(`title.ilike.${pattern},description.ilike.${pattern}`)
    .neq('ai_category', 'irrelevant')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ articles: data || [], page, total: count ?? 0 })
}
