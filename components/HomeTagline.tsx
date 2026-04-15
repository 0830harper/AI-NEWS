'use client'
import { useTranslation } from '../contexts/TranslationContext'
import { ui } from '../lib/ui-i18n'

export default function HomeTagline() {
  const { isZh } = useTranslation()
  const t = ui(isZh)
  return (
    <div className="mb-5">
      <p
        className={`text-sm font-semibold text-gray-600 ${
          isZh ? 'tracking-wide' : 'uppercase tracking-widest'
        }`}
      >
        {t.homeSubtitle}
      </p>
    </div>
  )
}
