import axios from 'axios'
import * as cheerio from 'cheerio'
import { BaseFetcher } from '../base'
import { FetchedArticle } from '../../types'

export class GithubTrendingFetcher extends BaseFetcher {
  async fetch(): Promise<FetchedArticle[]> {
    const { data } = await axios.get(
      'https://github.com/trending/python?since=daily',
      { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 }
    )
    const $ = cheerio.load(data)
    const results: FetchedArticle[] = []

    $('article.Box-row').slice(0, 20).each((_, el) => {
      const titleEl = $(el).find('h2 a')
      const repoPath = titleEl.attr('href') || ''
      const url = `https://github.com${repoPath}`
      const title = repoPath.replace('/', '').replace('/', ' / ')
      const desc = this.cleanText($(el).find('p').first().text())
      const starsText = $(el).find('[aria-label="star"]').parent().text().trim()
      const stars = parseInt(starsText.replace(/,/g, '')) || 0

      if (title && url) {
        // GitHub 每个仓库都有社交预览图
        const thumbnail = `https://opengraph.githubassets.com/1${repoPath}`
        results.push({
          title,
          description: desc || null,
          url,
          author: null,
          thumbnail,
          published_at: new Date(),
          raw_score: stars,
          tags: ['github', 'trending'],
        })
      }
    })

    return results
  }
}
