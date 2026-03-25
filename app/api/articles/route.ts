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

/** Normalize each article's score to 0–100 within its source,
 *  then sort all articles by that weighted score descending.
 *  Trims the result to a full multiple of COLS so the last row is always complete. */
function weightedSort(articles: any[], maxPerSource: number, limit: number): any[] {
  // Find max raw_score per source
  const sourceMax: Record<number, number> = {}
  for (const a of articles) {
    sourceMax[a.source_id] = Math.max(sourceMax[a.source_id] ?? 0, a.raw_score ?? 0)
  }
  // Attach weighted_score (0–100) and cap per source
  const sourceCount: Record<number, number> = {}
  const scored = articles
    .map(a => ({
      ...a,
      weighted_score: sourceMax[a.source_id] > 0
        ? Math.round((a.raw_score / sourceMax[a.source_id]) * 100)
        : 0,
    }))
    .filter(a => {
      sourceCount[a.source_id] = (sourceCount[a.source_id] ?? 0) + 1
      return sourceCount[a.source_id] <= maxPerSource
    })
    .sort((a, b) => b.weighted_score - a.weighted_score)
    .slice(0, limit)
  // Trim to complete rows
  return scored.slice(0, Math.floor(scored.length / COLS) * COLS)
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
  const cutoff = new Date(Date.now() - (isLatest ? 30 : 90) * 24 * 3600 * 1000).toISOString()

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
    ? weightedSort(cleaned, 10, limit)
    : diversify(cleaned, MAX_PER_SOURCE).slice(0, limit)

  return NextResponse.json({ articles: result, page, limit })
}
