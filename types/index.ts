export interface Article {
  id: number
  source_id: number
  title: string
  description: string | null
  url: string
  url_hash: string
  author: string | null
  thumbnail: string | null
  published_at: string
  fetched_at: string
  raw_score: number
  heat_score: number
  click_count: number
  card_color: string
  tags: string[]
  created_at: string
  sources?: {
    name: string
    slug: string
    category: string
    home_url: string
  }
}

export interface Source {
  id: number
  name: string
  slug: string
  category: 'app' | 'design' | 'uxui' | 'tech'
  fetch_type: 'rss' | 'api' | 'scraper'
  fetch_url: string
  home_url: string
  is_active: boolean
  last_fetched_at: string | null
  fetch_status: 'ok' | 'error' | 'pending'
  error_msg: string | null
  created_at: string
}

export interface FetchedArticle {
  title: string
  description: string | null
  url: string
  author: string | null
  thumbnail: string | null
  published_at: Date
  raw_score: number
  tags: string[]
}
