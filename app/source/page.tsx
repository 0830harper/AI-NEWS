import SourcePageClient from '../../components/SourcePageClient'
import { Source } from '../../types'
import { supabaseAdmin } from '../../lib/supabase'

export const dynamic = 'force-dynamic'

async function getSources(): Promise<Source[]> {
  const { data, error } = await supabaseAdmin
    .from('sources')
    .select('*')
    .order('name')
  if (error) return []
  return data || []
}

export default async function SourcePage() {
  const sources = await getSources()
  return <SourcePageClient sources={sources} />
}
