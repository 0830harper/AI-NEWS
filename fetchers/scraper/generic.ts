import axios from 'axios'
import * as cheerio from 'cheerio'
import { BaseFetcher } from '../base'
import { FetchedArticle } from '../../types'

export interface ScrapeConfig {
  listSelector: string
  titleSelector: string
  linkSelector: string
  descSelector?: string
  imgSelector?: string
  dateSelector?: string
  baseUrl?: string
}

export class GenericScraper extends BaseFetcher {
  constructor(
    private url: string,
    private config: ScrapeConfig
  ) {
    super()
  }

  async fetch(): Promise<FetchedArticle[]> {
    const { data } = await axios.get(this.url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; ai-news-bot/1.0)',
      },
      timeout: 10000,
    })
    const $ = cheerio.load(data)
    const results: FetchedArticle[] = []

    $(this.config.listSelector)
      .slice(0, 20)
      .each((_, el) => {
        const title = this.cleanText(
          $(el).find(this.config.titleSelector).first().text()
        )
        let link =
          $(el).find(this.config.linkSelector).first().attr('href') || ''
        if (link && !link.startsWith('http')) {
          link = (this.config.baseUrl || '') + link
        }
        const desc = this.config.descSelector
          ? this.cleanText($(el).find(this.config.descSelector).first().text())
          : null
        const img = this.config.imgSelector
          ? $(el).find(this.config.imgSelector).first().attr('src') ||
            $(el).find(this.config.imgSelector).first().attr('data-src') ||
            null
          : null

        if (title && link) {
          results.push({
            title,
            description: desc || null,
            url: link,
            author: null,
            thumbnail: img || null,
            published_at: new Date(),
            raw_score: 0,
            tags: [],
          })
        }
      })

    return results
  }
}
