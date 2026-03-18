import axios from 'axios'
import { BaseFetcher } from '../base'
import { FetchedArticle } from '../../types'

export class RedditFetcher extends BaseFetcher {
  constructor(private subreddit: string) {
    super()
  }

  async fetch(): Promise<FetchedArticle[]> {
    const { data } = await axios.get(
      `https://www.reddit.com/r/${this.subreddit}/hot.json?limit=20`,
      { headers: { 'User-Agent': 'ai-news-aggregator/1.0' } }
    )
    return data.data.children
      .map((child: any) => child.data)
      .filter((post: any) => !post.is_self && post.url)
      .map((post: any) => ({
        title: post.title || 'Untitled',
        description: post.selftext ? this.cleanText(post.selftext).slice(0, 200) : null,
        url: post.url,
        author: post.author || null,
        thumbnail:
          post.thumbnail && post.thumbnail.startsWith('http')
            ? post.thumbnail
            : null,
        published_at: new Date(post.created_utc * 1000),
        raw_score: post.ups || 0,
        tags: [],
      }))
  }
}
