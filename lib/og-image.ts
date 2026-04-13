import axios from 'axios'
import * as cheerio from 'cheerio'

// 这些域名有 bot 检测或 JS 渲染，axios 抓不到 og:image，改用 microlink API
const MICROLINK_DOMAINS = [
  'arxiv.org',
  'huggingface.co',
  'producthunt.com',
  'github.com',
  'papers.cool',
  'qbitai.com',
  // Medium & Medium custom domains
  'medium.com',
  'uxdesign.cc',
  'uxplanet.org',
  'towardsdatascience.com',
  // Paywalled / bot-protected
  'technologyreview.com',
  'wired.com',
  'theverge.com',
  'wsj.com',
  'bloomberg.com',
  // JS-rendered
  'figma.com',
  'kaggle.com',
  'openrouter.ai',
  'mobbin.com',
  'awwwards.com',
]

function needsMicrolink(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace('www.', '')
    return MICROLINK_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d))
  } catch {
    return false
  }
}

async function extractOgImageViaMicrolink(url: string): Promise<string | null> {
  try {
    const res = await axios.get('https://api.microlink.io', {
      params: { url, screenshot: false },
      timeout: 8000,
    })
    const data = res.data?.data
    const img = data?.image?.url || data?.logo?.url || null
    if (!img || img.startsWith('data:') || img.length < 10) return null
    return img
  } catch {
    return null
  }
}

export async function extractOgImage(url: string): Promise<string | null> {
  if (needsMicrolink(url)) {
    return extractOgImageViaMicrolink(url)
  }

  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 5000,
    })
    const $ = cheerio.load(data)
    const img = (
      $('meta[property="og:image:secure_url"]').attr('content') ||
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('meta[name="twitter:image:src"]').attr('content') ||
      $('meta[itemprop="image"]').attr('content') ||
      null
    )
    if (!img || img.startsWith('data:') || img.length < 10) return null
    return img
  } catch {
    return null
  }
}
