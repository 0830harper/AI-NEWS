import MasonryGrid from '../components/MasonryGrid'
import { Article } from '../types'
import { supabaseAdmin } from '../lib/supabase'

export const revalidate = 300 // 5分钟缓存

async function getLatestArticles(): Promise<Article[]> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString()
  const { data, error } = await supabaseAdmin
    .from('articles')
    .select('*, sources(name, slug, category, home_url)')
    .gte('published_at', ninetyDaysAgo)
    .order('published_at', { ascending: false })
    .limit(50)
  if (error) return []
  return data || []
}

export default async function HomePage() {
  const articles = await getLatestArticles()

  return (
    <div>
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
          ⚡ Past 30 days · Top picks
        </p>
      </div>
      <MasonryGrid articles={articles} />
    </div>
  )
}
