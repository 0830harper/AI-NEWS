import Parser from 'rss-parser'
import { BaseFetcher } from '../base'
import { FetchedArticle } from '../../types'

const FETCH_TIMEOUT_MS = 15000

const parser = new Parser({
  customFields: {
    item: ['media:content', 'media:thumbnail', 'enclosure'],
  },
  requestOptions: {
    timeout: FETCH_TIMEOUT_MS,
  },
})

export class RssFetcher extends BaseFetcher {
  constructor(private feedUrl: string) {
    super()
  }

  async fetch(): Promise<FetchedArticle[]> {
    const feed = await parser.parseURL(this.feedUrl)
    return feed.items.slice(0, 20).map((item) => {
      const thumbnail =
        (item as any)['media:content']?.$.url ||
        (item as any)['media:thumbnail']?.$.url ||
        (item as any).enclosure?.url ||
        null

      return {
        title: this.cleanText(item.title) || 'Untitled',
        description: this.cleanText(item.contentSnippet || item.summary) || null,
        url: item.link || item.guid || '',
        author: item.creator || (item as any).author || null,
        thumbnail,
        published_at: this.safeDate(item.pubDate || item.isoDate),
        raw_score: 0,
        tags: item.categories || [],
      }
    }).filter((a) => a.url && !this.isGarbageTitle(a.title))
  }
}
