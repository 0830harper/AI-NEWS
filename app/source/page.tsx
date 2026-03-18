import SourceStatusTable from '../../components/SourceStatusTable'
import { Source } from '../../types'

async function getSources(): Promise<Source[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/sources`, { next: { revalidate: 60 } })
  if (!res.ok) return []
  const data = await res.json()
  return data.sources || []
}

export default async function SourcePage() {
  const sources = await getSources()
  const okCount = sources.filter((s) => s.fetch_status === 'ok').length
  const errCount = sources.filter((s) => s.fetch_status === 'error').length

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <h1 className="text-lg font-medium text-gray-900">📡 Source Status</h1>
        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">{okCount} ok</span>
        {errCount > 0 && (
          <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full">{errCount} errors</span>
        )}
      </div>
      <SourceStatusTable sources={sources} />
    </div>
  )
}
