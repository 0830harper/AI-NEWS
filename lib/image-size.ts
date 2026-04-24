import { FetchedArticle } from '../types'

const IMG_PROBE_TIMEOUT_MS = 3000
const IMG_PROBE_CONCURRENCY = 20

// ── Helpers ──────────────────────────────────────────────────────────────────

function readU32BE(b: Uint8Array, o: number): number {
  return ((b[o] << 24) | (b[o+1] << 16) | (b[o+2] << 8) | b[o+3]) >>> 0
}
function readU16BE(b: Uint8Array, o: number): number {
  return (b[o] << 8) | b[o+1]
}
function readU16LE(b: Uint8Array, o: number): number {
  return b[o] | (b[o+1] << 8)
}

// ── URL-pattern parser ────────────────────────────────────────────────────────
// Many CDNs embed dimensions in the URL: ?w=1200&h=628, _1200x628.jpg, /1200/628/
function parseDimsFromUrl(url: string): { width: number; height: number } | null {
  try {
    const u = new URL(url)

    // Query params: w=N&h=N or width=N&height=N
    const qw = parseInt(u.searchParams.get('w') || u.searchParams.get('width') || '0')
    const qh = parseInt(u.searchParams.get('h') || u.searchParams.get('height') || '0')
    if (qw > 0 && qh > 0) return { width: qw, height: qh }

    // Path pattern: _1200x628., -1200x628., /1200x628/
    const m = u.pathname.match(/[/_-](\d{3,5})[xX](\d{3,5})[/._-]/)
    if (m) {
      const w = parseInt(m[1]), h = parseInt(m[2])
      if (w > 0 && h > 0) return { width: w, height: h }
    }
  } catch { /* ignore */ }
  return null
}

// ── Image-header parser ───────────────────────────────────────────────────────
function parseDimsFromBuffer(b: Uint8Array): { width: number; height: number } | null {
  if (b.length < 12) return null

  // PNG: \x89PNG\r\n\x1a\n — width at offset 16, height at 20
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47 && b.length >= 24) {
    const w = readU32BE(b, 16), h = readU32BE(b, 20)
    if (w > 0 && h > 0) return { width: w, height: h }
  }

  // JPEG: FF D8 — scan segments for SOF markers (C0-CF except C4/C8/CC)
  if (b[0] === 0xFF && b[1] === 0xD8) {
    let i = 2
    while (i + 8 < b.length) {
      if (b[i] !== 0xFF) break
      const marker = b[i+1]
      if (marker === 0xD9 || marker === 0xDA) break
      const segLen = readU16BE(b, i+2)
      if (segLen < 2) break
      if ((marker & 0xF0) === 0xC0 && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
        const h = readU16BE(b, i+5), w = readU16BE(b, i+7)
        if (w > 0 && h > 0) return { width: w, height: h }
      }
      i += 2 + segLen
    }
  }

  // WebP: RIFF....WEBP — handle VP8 (lossy), VP8L (lossless), VP8X (extended)
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 && b.length >= 30) {
    const fourcc = String.fromCharCode(b[12], b[13], b[14], b[15])

    if (fourcc === 'VP8 ' && b.length >= 30) {
      // Lossy: keyframe start codes at 23-25, width/height at 26-29
      if (b[23] === 0x9D && b[24] === 0x01 && b[25] === 0x2A) {
        const w = readU16LE(b, 26) & 0x3FFF
        const h = readU16LE(b, 28) & 0x3FFF
        if (w > 0 && h > 0) return { width: w, height: h }
      }
    } else if (fourcc === 'VP8L' && b.length >= 26) {
      // Lossless: signature 0x2F at byte 20, then 14-bit width-1, 14-bit height-1
      if (b[20] === 0x2F) {
        const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24)
        const w = (bits & 0x3FFF) + 1
        const h = ((bits >> 14) & 0x3FFF) + 1
        if (w > 0 && h > 0) return { width: w, height: h }
      }
    } else if (fourcc === 'VP8X' && b.length >= 30) {
      // Extended: canvas width-1 at bytes 24-26 (24-bit LE), height-1 at 27-29
      const w = (b[24] | (b[25] << 8) | (b[26] << 16)) + 1
      const h = (b[27] | (b[28] << 8) | (b[29] << 16)) + 1
      if (w > 0 && h > 0) return { width: w, height: h }
    }
  }

  // GIF: GIF87a / GIF89a — width at 6-7 (LE), height at 8-9 (LE)
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b.length >= 10) {
    const w = readU16LE(b, 6), h = readU16LE(b, 8)
    if (w > 0 && h > 0) return { width: w, height: h }
  }

  return null
}

// ── HTTP probe ────────────────────────────────────────────────────────────────
async function probeDimsFromHttp(url: string): Promise<{ width: number; height: number } | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), IMG_PROBE_TIMEOUT_MS)
    // Fetch first 64 KB — enough to cover any image header format
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Range: 'bytes=0-65535' },
    })
    clearTimeout(timer)
    if (!res.ok && res.status !== 206) return null
    const buf = await res.arrayBuffer()
    return parseDimsFromBuffer(new Uint8Array(buf))
  } catch {
    return null
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Returns image dimensions for a URL, or null on failure.
 *  First tries to parse from URL path/query params (free),
 *  then falls back to probing the image header via HTTP. */
export async function getImageDimensions(url: string): Promise<{ width: number; height: number } | null> {
  return parseDimsFromUrl(url) ?? probeDimsFromHttp(url)
}

/** Enriches articles in place with thumbnail dimensions.
 *  Skips articles with no thumbnail or already-filled dimensions. */
export async function enrichWithImageSizes(articles: FetchedArticle[]): Promise<void> {
  const toProbe = articles.filter(a => a.thumbnail && !a.img_width)
  for (let i = 0; i < toProbe.length; i += IMG_PROBE_CONCURRENCY) {
    const batch = toProbe.slice(i, i + IMG_PROBE_CONCURRENCY)
    const results = await Promise.allSettled(batch.map(a => getImageDimensions(a.thumbnail!)))
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled' && r.value) {
        batch[idx].img_width = r.value.width
        batch[idx].img_height = r.value.height
      }
    })
  }
}
