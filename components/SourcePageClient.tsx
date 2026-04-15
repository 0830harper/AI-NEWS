'use client'
import SourceStatusTable from './SourceStatusTable'
import { Source } from '../types'
import { useTranslation } from '../contexts/TranslationContext'
import { ui, sourceTotalLabel, sourceOkLabel, sourceErrLabel } from '../lib/ui-i18n'

export default function SourcePageClient({ sources }: { sources: Source[] }) {
  const { isZh } = useTranslation()
  const t = ui(isZh)
  const okCount = sources.filter((s) => s.fetch_status === 'ok').length
  const errCount = sources.filter((s) => s.fetch_status === 'error').length

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <h1 className="text-lg font-medium text-gray-900">{t.sourceStatusTitle}</h1>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {sourceTotalLabel(sources.length, isZh)}
        </span>
        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
          {sourceOkLabel(okCount, isZh)}
        </span>
        {errCount > 0 && (
          <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full">
            {sourceErrLabel(errCount, isZh)}
          </span>
        )}
      </div>
      <SourceStatusTable sources={sources} />
    </div>
  )
}
