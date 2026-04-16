import axios from 'axios'
import * as cheerio from 'cheerio'

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

async function tryArxivCdnThumbnail(url: string): Promise<string | null> {
  const match = url.match(/arxiv\.org\/(?:abs|pdf)\/([\d.]+v?\d*)/)
  if (!match) return null
  const cdnUrl = `https://cdn-thumbnails.huggingface.co/social-thumbnails/papers/${match[1]}/gradient.png`
  try {
    const res = await axios.head(cdnUrl, { timeout: 3000 })
    if (res.status === 200) return cdnUrl
  } catch { /* not on HuggingFace */ }
  return null
}

/** Resolve potentially relative image URL against the page URL */
function resolveUrl(imgUrl: string, pageUrl: string): string {
  try {
    return new URL(imgUrl, pageUrl).href
  } catch {
    return imgUrl
  }
}

/** Return true if the image URL looks like a site logo/icon rather than article content */
export function isLogoUrl(imgUrl: string): boolean {
  try {
    const path = new URL(imgUrl).pathname.toLowerCase()
    return (
      /\/(favicon|logo|icon|brand|watermark|placeholder|default[-_]?(img|image|thumb)?)(\.|\/|-|_)/.test(path) ||
      /([-_](logo|icon|favicon|brand))\.(png|jpg|jpeg|svg|webp|gif)$/.test(path) ||
      path.endsWith('qbitai_icon.png')
    )
  } catch {
    return false
  }
}

/** Known domains where og:image is always a generic logo, not article-specific */
const SKIP_OG_DOMAINS = [
  'arxiv.org',
  'github.com',
  'news.ycombinator.com',
]

function shouldSkipOg(url: string): boolean {
  try {
    const h = new URL(url).hostname.replace('www.', '')
    return SKIP_OG_DOMAINS.some(d => h === d || h.endsWith('.' + d))
  } catch {
    return false
  }
}

/** Try GitHub repo social image: works for public repos without scraping */
async function tryGithubSocialImage(url: string): Promise<string | null> {
  const match = url.match(/github\.com\/([\w.-]+\/[\w.-]+)/)
  if (!match) return null
  const ogUrl = `https://opengraph.githubassets.com/1/${match[1]}`
  try {
    const res = await axios.head(ogUrl, { timeout: 4000 })
    if (res.status === 200) return ogUrl
  } catch { /* */ }
  return null
}

/**
 * Extract og:image (or fallback) from a URL.
 * Handles: og:image, twitter:image, schema.org image, first large <img>, relative URLs.
 */
export async function extractOgImage(url: string): Promise<string | null> {
  if (url.includes('arxiv.org')) return tryArxivCdnThumbnail(url)
  if (url.includes('github.com/') && !url.includes('/blog')) return tryGithubSocialImage(url)
  if (needsMicrolink(url)) return extractOgImageViaMicrolink(url)
  if (shouldSkipOg(url)) return null

  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
      },
      timeout: 10000,
      maxRedirects: 5,
      maxContentLength: 2 * 1024 * 1024,
    })
    const $ = cheerio.load(data)

    // Priority order for meta image extraction
    const metaImg =
      $('meta[property="og:image:secure_url"]').attr('content') ||
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('meta[name="twitter:image:src"]').attr('content') ||
      $('meta[itemprop="image"]').attr('content') ||
      $('link[rel="image_src"]').attr('href') ||
      null

    if (metaImg) {
      const resolved = resolveUrl(metaImg, url)
      if (!resolved.startsWith('data:') && resolved.length >= 10 && !isLogoUrl(resolved)) {
        return resolved
      }
    }

    // Fallback: first <img> in <article> or main content with reasonable src
    const contentImg = $('article img[src], main img[src], .post-content img[src], .entry-content img[src]')
      .toArray()
      .map(el => $(el).attr('src') || '')
      .filter(src => src.length > 20 && !src.startsWith('data:') && !isLogoUrl(src))[0]

    if (contentImg) {
      return resolveUrl(contentImg, url)
    }

    return null
  } catch {
    return null
  }
}
