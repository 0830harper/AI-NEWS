import axios from 'axios'
import * as cheerio from 'cheerio'
import { BaseFetcher } from '../base'
import { FetchedArticle } from '../../types'

export class HuggingFaceFetcher extends BaseFetcher {
  async fetch(): Promise<FetchedArticle[]> {
    const { data } = await axios.get('https://huggingface.co/papers', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000,
    })
    const $ = cheerio.load(data)
    const results: FetchedArticle[] = []

    $('article').slice(0, 20).each((_, el) => {
      const titleEl = $(el).find('h3 a, h2 a').first()
      const title = this.cleanText(titleEl.text())
      const href = titleEl.attr('href') || ''
      const url = href.startsWith('http') ? href : `https://huggingface.co${href}`
      const desc = this.cleanText($(el).find('p').first().text())
      const upvotes = parseInt($(el).find('[data-upvotes]').attr('data-upvotes') || '0')

      if (title && url) {
        results.push({
          title,
          description: desc || null,
          url,
          author: null,
          thumbnail: null,
          published_at: new Date(),
          raw_score: upvotes,
          tags: ['ai', 'paper'],
        })
      }
    })

    return results
  }
}
