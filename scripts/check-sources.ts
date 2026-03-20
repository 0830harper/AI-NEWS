import { supabaseAdmin } from '../lib/supabase'

async function main() {
  const { data: articles } = await supabaseAdmin.from('articles').select('source_id, sources(name, category, fetch_type, slug)')
  const { data: sources } = await supabaseAdmin.from('sources').select('name, category, fetch_type, slug')

  const counts: Record<string, any> = {}
  articles!.forEach((a: any) => {
    const s = a.sources
    if (!s) return
    if (!counts[s.slug]) counts[s.slug] = { name: s.name, category: s.category, fetch_type: s.fetch_type, count: 0 }
    counts[s.slug].count++
  })

  console.log('=== WORKING SOURCES ===')
  Object.values(counts).sort((a: any, b: any) => a.category.localeCompare(b.category))
    .forEach((s: any) => console.log(s.category.padEnd(8), s.fetch_type.padEnd(8), String(s.count).padStart(4), ' ', s.name))

  console.log('\n=== DEAD SOURCES (0 articles) ===')
  sources!.forEach((s: any) => {
    if (!counts[s.slug]) console.log(s.category.padEnd(8), s.fetch_type.padEnd(8), '   0  ', s.name)
  })
}
main()
