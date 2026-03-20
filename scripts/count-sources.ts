import { supabaseAdmin } from '../lib/supabase'

async function main() {
  const { data, count } = await supabaseAdmin.from('sources').select('*', { count: 'exact' })
  console.log('Total sources in DB:', count)
  const byCategory: Record<string, number> = {}
  data?.forEach((s: any) => {
    byCategory[s.category] = (byCategory[s.category] || 0) + 1
  })
  console.log('By category:', byCategory)
  const byStatus: Record<string, number> = {}
  data?.forEach((s: any) => {
    byStatus[s.fetch_status || 'null'] = (byStatus[s.fetch_status || 'null'] || 0) + 1
  })
  console.log('By status:', byStatus)
  process.exit(0)
}
main()
