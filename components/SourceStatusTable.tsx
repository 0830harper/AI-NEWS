import { Source } from '../types'

interface Props {
  sources: Source[]
}

const STATUS_COLOR: Record<string, string> = {
  ok:      'bg-green-100 text-green-700',
  error:   'bg-red-100 text-red-600',
  pending: 'bg-gray-100 text-gray-500',
}

const CATEGORY_LABEL: Record<string, string> = {
  app:    'App',
  design: 'Design / ART',
  uxui:   'UX / UI',
  tech:   'Tech',
}

export default function SourceStatusTable({ sources }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wider">
            <th className="pb-3 pr-4 font-medium">Source</th>
            <th className="pb-3 pr-4 font-medium">Category</th>
            <th className="pb-3 pr-4 font-medium">Type</th>
            <th className="pb-3 pr-4 font-medium">Status</th>
            <th className="pb-3 font-medium">Last Fetched</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s) => (
            <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="py-3 pr-4">
                <a
                  href={s.home_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-gray-800 hover:text-blue-500"
                >
                  {s.name}
                </a>
                {s.error_msg && (
                  <p className="text-xs text-red-400 mt-0.5 truncate max-w-xs">{s.error_msg}</p>
                )}
              </td>
              <td className="py-3 pr-4 text-gray-500">
                {CATEGORY_LABEL[s.category] || s.category}
              </td>
              <td className="py-3 pr-4">
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {s.fetch_type}
                </span>
              </td>
              <td className="py-3 pr-4">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[s.fetch_status] || STATUS_COLOR.pending}`}>
                  {s.fetch_status}
                </span>
              </td>
              <td className="py-3 text-gray-400 text-xs">
                {s.last_fetched_at
                  ? new Date(s.last_fetched_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
