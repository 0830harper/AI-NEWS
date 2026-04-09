'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useState, useRef } from 'react'
import { useTranslation } from '../contexts/TranslationContext'

const categories = [
  { slug: '',        label: 'Pick',   icon: '/icons/pick.svg',   size: 32 },
  { slug: 'app',    label: 'Tool',   icon: '/icons/tool.svg',   size: 36 },
  { slug: 'design', label: 'Visual', icon: '/icons/visual.svg', size: 42 },
  { slug: 'uxui',   label: 'UX / UI',icon: '/icons/uxui.svg',   size: 38 },
  { slug: 'tech',   label: 'Tech',   icon: '/icons/tech.svg',   size: 38 },
]

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [searchInput, setSearchInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { isZh, toggle, isTranslating } = useTranslation()

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchInput.trim()
    if (!q) return
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
      {/* Row 1: logo */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <Link href="/">
          <Image src="/icons/logo.svg" alt="AINEWS" width={178} height={47} priority />
        </Link>
      </div>

      {/* Row 2: nav (left) + search + 中文 (right) */}
      <div className="max-w-7xl mx-auto px-4 pt-1 pb-2 flex items-center justify-between gap-3">
        {/* Category nav */}
        <nav className="flex gap-0.5 sm:gap-1">
          {categories.map((cat) => {
            const href = cat.slug ? `/${cat.slug}` : '/'
            const isActive = pathname === href
            return (
              <Link
                key={cat.slug}
                href={href}
                className={`group flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive
                    ? 'bg-gray-100 text-gray-900 ring-1 ring-gray-200'
                    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                <Image
                  src={cat.icon}
                  alt={cat.label}
                  width={cat.size}
                  height={cat.size}
                  className="shrink-0 transition-transform duration-150 group-hover:scale-110"
                />
                <span className={isActive ? 'inline' : 'hidden sm:inline'}>{cat.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Search + 中文 */}
        <div className="flex items-center gap-2 shrink-0">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative w-64">
              <button
                type="submit"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Search"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
              <input
                ref={inputRef}
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search articles…"
                className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => { setSearchInput(''); inputRef.current?.focus() }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </form>

          {/* 中文 toggle */}
          <button
            onClick={toggle}
            disabled={isTranslating}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 shrink-0
              ${isZh
                ? 'bg-gray-900 text-white'
                : 'text-gray-400 hover:text-gray-600 border border-gray-200 hover:border-gray-300'}`}
          >
            {isTranslating ? (
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                翻译中
              </span>
            ) : (
              '中文'
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
