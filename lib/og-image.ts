import axios from 'axios'
import * as cheerio from 'cheerio'

// 只保留真正需要 microlink 的 JS 渲染 / bot 防护站点
// microlink 免费版每月仅约 100 次请求，要节省使用
const MICROLINK_DOMAINS = [
  'producthunt.com',
  'figma.com',
  'kaggle.com',
  'openrouter.ai',
  'mobbin.com',
  'awwwards.com',
  'wsj.com',
  'bloomberg.com',
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

/**
 * arXiv papers: try HuggingFace paper thumbnail CDN (no API key, no rate limit).
 * Returns the CDN URL if the paper exists there, otherwise null.
 */
async function tryArxivCdnThumbnail(url: string): Promise<string | null> {
  const match = url.match(/arxiv\.org\/(?:abs|pdf)\/([\d.]+v?\d*)/)
  if (!match) return null
  const cdnUrl = `https://cdn-thumbnails.huggingface.co/social-thumbnails/papers/${match[1]}/gradient.png`
  try {
    const res = await axios.head(cdnUrl, { timeout: 3000 })
    if (res.status === 200) return cdnUrl
  } catch { /* paper not on HuggingFace, fall through */ }
  return null
}

export async function extractOgImage(url: string): Promise<string | null> {
  // Fast path: arXiv papers → HuggingFace CDN thumbnail (no API needed)
  if (url.includes('arxiv.org')) {
    const cdnThumb = await tryArxivCdnThumbnail(url)
    if (cdnThumb) return cdnThumb
    // arXiv pages are server-rendered, fall through to regular axios fetch
  }

  if (needsMicrolink(url)) {
    return extractOgImageViaMicrolink(url)
  }

  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
      },
      timeout: 6000,
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
