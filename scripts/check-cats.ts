import 'dotenv/config'
import { supabase } from '../lib/supabase'

async function check() {
  const { data, error } = await supabase
    .from('sources')
    .select('id, name, category')
    .order('category')
  
  if (error) { console.error(error); return }
  
  const byCat: Record<string, any[]> = {}
  for (const s of (data || [])) {
    if (!byCat[s.category]) byCat[s.category] = []
    byCat[s.category].push(s)
  }
  
  for (const [cat, srcs] of Object.entries(byCat)) {
    console.log(`\n[${cat}] (${srcs.length} sources):`)
    srcs.forEach((s: any) => console.log('  -', s.name))
  }

  console.log('\n--- Article counts by category ---')
  for (const [cat, srcs] of Object.entries(byCat)) {
    const ids = srcs.map((s: any) => s.id)
    const { count } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .in('source_id', ids)
    console.log(`[${cat}]: ${count} articles`)
  }
}
check()
