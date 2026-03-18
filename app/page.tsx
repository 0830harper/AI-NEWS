import MasonryGrid from '../components/MasonryGrid'
import { Article } from '../types'

async function getLatestArticles(): Promise<Article[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/articles?category=latest&limit=50`, {
    next: { revalidate: 300 }, // 5分钟缓存
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.articles || []
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
