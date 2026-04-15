'use client'
import Link from 'next/link'
import { useTranslation } from '../contexts/TranslationContext'
import { ui } from '../lib/ui-i18n'

export default function Footer() {
  const { isZh } = useTranslation()
  const t = ui(isZh)
  return (
    <footer className="border-t border-gray-100 py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs text-gray-400">
        <span>{t.footerLine}</span>
        <div className="flex items-center gap-4">
          <span>{t.footerUpdated}</span>
          <Link
            href="/source"
            className="hover:text-gray-600 transition-colors underline underline-offset-2"
          >
            {t.footerSource}
          </Link>
        </div>
      </div>
    </footer>
  )
}
