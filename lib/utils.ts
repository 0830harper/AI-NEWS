import crypto from 'crypto'

// UTM and other tracking params that vary per newsletter send but don't change the article
const STRIP_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'utm_id', 'utm_reader', 'utm_referrer',
  'campaign_date', 'position', 'partner',
  'ref', 'referrer', 'source',
  'fbclid', 'gclid', 'msclkid', 'twclid', 'li_fat_id',
  'mc_cid', 'mc_eid',
  '_hsenc', '_hsmi', 'hsCtaTracking',
])

/** Canonical URL: strip tracking query params, then hash. */
export function hashUrl(url: string): string {
  try {
    const u = new URL(url)
    // Normalize protocol and www
    u.protocol = 'https:'
    if (u.hostname.startsWith('www.')) u.hostname = u.hostname.slice(4)
    // Strip tracking params
    for (const key of [...u.searchParams.keys()]) {
      if (STRIP_PARAMS.has(key)) u.searchParams.delete(key)
    }
    // Remove trailing slash from pathname and trailing ?
    const canonical = u.toString().replace(/\/(\?|#|$)/, '$1').replace(/\?$/, '')
    return crypto.createHash('sha256').update(canonical).digest('hex')
  } catch {
    return crypto.createHash('sha256').update(url).digest('hex')
  }
}

export function formatDate(dateStr: string, locale: 'en-US' | 'zh-CN' = 'en-US'): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
}

export function truncate(str: string, maxLen: number): string {
  if (!str) return ''
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}
