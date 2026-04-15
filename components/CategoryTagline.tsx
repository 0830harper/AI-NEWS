'use client'
import { useTranslation } from '../contexts/TranslationContext'
import { categoryHeading } from '../lib/ui-i18n'

export default function CategoryTagline({ category }: { category: string }) {
  const { isZh } = useTranslation()
  return (
    <div className="mb-5">
      <p
        className={`text-sm font-semibold text-gray-600 ${
          isZh ? 'tracking-wide' : 'uppercase tracking-widest'
        }`}
      >
        {categoryHeading(category, isZh)}
      </p>
    </div>
  )
}
