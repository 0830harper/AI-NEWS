import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

const MAX_PER_SOURCE = 5
const COLS = 3

// Filter out articles whose titles are mostly '?' (encoding failure)
function hasGarbageTitle(article: any): boolean {
  const title: string = article.title || ''
  const qCount = (title.match(/\?/g) || []).length
  return qCount >= 4 && qCount / title.length > 0.3
}

function diversify(articles: any[], maxPerSource: number): any[] {
  const countMap: Record<number, number> = {}
  const result: any[] = []
  for (const article of articles) {
    const sid = article.source_id
    countMap[sid] = (countMap[sid] || 0) + 1
    if (countMap[sid] <= maxPerSource) {
      result.push(article)
    }
  }
  return result
}

/** Round-robin interleave by source: take rank-1 from each source, then rank-2, …
 *  Sources ordered by their top article's score so the best sources appear first. */
function roundRobin(articles: any[], maxPerSource: number, limit: number): any[] {
  // Group by source, preserving score-desc order within each group
  const sourceMap = new Map<number, any[]>()
  for (const a of articles) {
    if (!sourceMap.has(a.source_id)) sourceMap.set(a.source_id, [])
    sourceMap.get(a.source_id)!.push(a)
  }
  // Order sources by their best article's score
  const sources = [...sourceMap.values()].sort(
    (a, b) => (b[0]?.raw_score ?? 0) - (a[0]?.raw_score ?? 0)
  )
  const result: any[] = []
  for (let round = 0; round < maxPerSource && result.length < limit; round++) {
    for (const src of sources) {
      if (round < src.length) result.push(src[round])
      if (result.length >= limit) break
    }
  }
  // Trim to complete rows so the last row is always full
  return result.slice(0, Math.floor(result.length / COLS) * COLS)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') || 'latest'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '40')
  // Simple sequential pagination: page 1 = rows 0..limit-1, page 2 = rows limit..2*limit-1, etc.
  const windowSize = limit
  const offset = (page - 1) * windowSize

  const isLatest = category === 'latest'
  // 全部用90天窗口，按发布时间倒序
  const cutoff = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString()

  // For category filtering, first get matching source IDs
  let sourceIds: number[] | null = null
  if (!isLatest) {
    const { data: sources } = await supabase
      .from('sources')
      .select('id')
      .eq('category', category)
    sourceIds = (sources || []).map((s: { id: number }) => s.id)
    if (sourceIds.length === 0) {
      return NextResponse.json({ articles: [], page, limit })
    }
  }

  let query = supabase
    .from('articles')
    .select('*, sources(name, slug, category, home_url)')
    .gte('published_at', cutoff)
    .order(isLatest ? 'raw_score' : 'published_at', { ascending: false })

  if (!isLatest) {
    query = query.range(offset, offset + windowSize - 1)
  }

  if (sourceIds !== null) {
    query = query.in('source_id', sourceIds)
  }

  // Pick 区只展示有 HN points 的文章
  if (isLatest) {
    query = query.gt('raw_score', 0).range(offset, offset + windowSize * 4 - 1)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const cleaned = (data || [])
    .map((a: any) => ({
      ...a,
      title: (a.title || '').replace(/\?{2,}/g, '').replace(/^\?+/, '').trim()
    }))
    .filter((a: any) => !hasGarbageTitle(a))

  const result = isLatest
    ? roundRobin(cleaned, 5, limit)
    : diversify(cleaned, MAX_PER_SOURCE).slice(0, limit)

  return NextResponse.json({ articles: result, page, limit })
}
