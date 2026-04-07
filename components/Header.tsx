'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'

const categories = [
  { slug: '',        label: 'Pick',   icon: '/icons/pick.svg',   size: 32 },
  { slug: 'app',    label: 'Tool',   icon: '/icons/tool.svg',   size: 36 },
  { slug: 'design', label: 'Visual', icon: '/icons/visual.svg', size: 36 },
  { slug: 'uxui',   label: 'UX / UI',icon: '/icons/uxui.svg',   size: 38 },
  { slug: 'tech',   label: 'Tech',   icon: '/icons/tech.svg',   size: 38 },
]

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSearchOpen(false); setSearchInput('') }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchInput.trim()
    if (!q) return
    setSearchOpen(false)
    setSearchInput('')
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  const isSearchActive = pathname === '/search'

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
      {/* Row 1: logo + nav + search icon — never moves */}
      <div className="max-w-7xl mx-auto px-4 h-13 flex items-center justify-between">
        <Link href="/">
          <Image src="/icons/logo.svg" alt="AINEWS" width={178} height={47} priority />
        </Link>

        <div className="flex items-center gap-0.5 sm:gap-1">
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

          {/* Search icon */}
          <button
            onClick={() => setSearchOpen(v => !v)}
            className={`ml-1 flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150
              ${isSearchActive || searchOpen
                ? 'bg-gray-100 text-gray-900 ring-1 ring-gray-200'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}
            aria-label="Search"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>
      </div>

      {/* Row 2: search bar — slides in below nav */}
      {searchOpen && (
        <div className="border-t border-gray-100 bg-white">
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-2"
          >
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                ref={inputRef}
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search articles… e.g. Claude, Figma, GPT-4"
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
              />
            </div>
            <button
              type="button"
              onClick={() => { setSearchOpen(false); setSearchInput('') }}
              className="shrink-0 text-gray-400 hover:text-gray-600 p-1"
              aria-label="Close search"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </header>
  )
}
