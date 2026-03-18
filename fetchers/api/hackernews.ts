import axios from 'axios'
import { BaseFetcher } from '../base'
import { FetchedArticle } from '../../types'

export class HackerNewsFetcher extends BaseFetcher {
  async fetch(): Promise<FetchedArticle[]> {
    const { data: ids } = await axios.get<number[]>(
      'https://hacker-news.firebaseio.com/v0/showstories.json'
    )
    const top20 = ids.slice(0, 20)
    const items = await Promise.allSettled(
      top20.map((id) =>
        axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
      )
    )
    return items
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<any>).value.data)
      .filter((item) => item && item.url)
      .map((item) => ({
        title: item.title || 'Untitled',
        description: null,
        url: item.url,
        author: item.by || null,
        thumbnail: null,
        published_at: new Date(item.time * 1000),
        raw_score: item.score || 0,
        tags: [],
      }))
  }
}
