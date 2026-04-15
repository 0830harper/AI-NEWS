import crypto from 'crypto'

export function hashUrl(url: string): string {
  return crypto.createHash('sha256').update(url).digest('hex')
}

export function formatDate(dateStr: string, locale: 'en-US' | 'zh-CN' = 'en-US'): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
}

export function truncate(str: string, maxLen: number): string {
  if (!str) return ''
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}
