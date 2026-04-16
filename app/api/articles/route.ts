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
 *  apply exponential time decay (half-life = 7 days),
 *  then sort all articles by final score descending.
 *  Trims the result to a full multiple of COLS so the last row is always complete. */
function weightedSort(articles: any[], maxPerSource: number, limit: number): any[] {
  // Find max raw_score per source
  const sourceMax: Record<number, number> = {}
  for (const a of articles) {
    sourceMax[a.source_id] = Math.max(sourceMax[a.source_id] ?? 0, a.raw_score ?? 0)
  }
  const now = Date.now()
  // Attach weighted_score = normalised(0–100) × time_decay, cap per source
  const sourceCount: Record<number, number> = {}
  const scored = articles
    .map(a => {
      const normalised = sourceMax[a.source_id] > 0
        ? (a.raw_score / sourceMax[a.source_id]) * 100
        : 0
      const ageDays = Math.max(0, (now - new Date(a.published_at).getTime()) / 86_400_000)
      const timeFactor = Math.pow(0.5, ageDays / 3) // half-life 3 days (was 7)
      const freshMultiplier = ageDays < 1 ? 1.8 : ageDays < 2 ? 1.4 : ageDays < 3 ? 1.1 : 1.0
      const imageBoost = a.thumbnail ? 1.3 : 1.0
      const ws = normalised > 0 ? Math.max(1, Math.round(normalised * timeFactor * freshMultiplier * imageBoost)) : 0
      return {
        ...a,
        weighted_score: ws,
      }
    })
    .filter(a => {
      sourceCount[a.source_id] = (sourceCount[a.source_id] ?? 0) + 1
      return sourceCount[a.source_id] <= maxPerSource
    })
    .sort((a, b) => b.weighted_score - a.weighted_score)
    .slice(0, limit)
  return scored
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
  // Pick 区限制 30 天；分类页无时间限制，可无限回溯
  const pickCutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()

  // For category filtering, get matching source IDs (for fallback)
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
    .order(isLatest ? 'raw_score' : 'published_at', { ascending: false })
    .neq('ai_category', 'irrelevant')  // 全局排除 irrelevant，任何页面都不显示

  // 只有 Pick 区才加时间过滤
  if (isLatest) {
    // 拉取全部候选文章（30天内有 HN points 的），排序后再分页
    // 避免分页窗口重叠导致重复文章
    query = query
      .gte('published_at', pickCutoff)
      .gt('raw_score', 0)
      .range(0, 999)  // 最多取 1000 篇候选，足够覆盖所有精选
  } else {
    query = query.range(offset, offset + windowSize - 1)
  }

  if (sourceIds !== null) {
    query = query.or(`ai_category.eq.${category},and(ai_category.is.null,source_id.in.(${sourceIds.join(',')}))`)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const cleaned = (data || [])
    .map((a: any) => ({
      ...a,
      title: (a.title || '').replace(/\?{2,}/g, '').replace(/^\?+/, '').trim()
    }))
    .filter((a: any) => !hasGarbageTitle(a))

  // Pick 页：全量排序后按页切片，确保无重复
  const result = isLatest
    ? weightedSort(cleaned, 10, 9999).slice(offset, offset + limit)
    : diversify(cleaned, MAX_PER_SOURCE).slice(0, limit)

  return NextResponse.json(
    { articles: result, page, limit },
    { headers: { 'Cache-Control': 'private, no-store, max-age=0' } }
  )
}
