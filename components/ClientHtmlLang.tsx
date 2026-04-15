'use client'
import { useEffect } from 'react'
import { useTranslation } from '../contexts/TranslationContext'

/** Syncs <html lang> with EN / 中 toggle for accessibility and fonts. */
export default function ClientHtmlLang() {
  const { isZh } = useTranslation()
  useEffect(() => {
    document.documentElement.lang = isZh ? 'zh-CN' : 'en'
  }, [isZh])
  return null
}
