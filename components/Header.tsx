'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useState, useRef } from 'react'
import { useTranslation } from '../contexts/TranslationContext'

const categories = [
  { slug: '',        label: 'Pick',   icon: '/icons/pick.svg',   size: 32, w: 'w-24' },
  { slug: 'app',    label: 'Tool',   icon: '/icons/tool.svg',   size: 36, w: 'w-24' },
  { slug: 'design', label: 'Visual', icon: '/icons/visual.svg', size: 42, w: 'w-28' },
  { slug: 'uxui',   label: 'UX / UI',icon: '/icons/uxui.svg',   size: 38, w: 'w-28' },
  { slug: 'tech',   label: 'Tech',   icon: '/icons/tech.svg',   size: 38, w: 'w-24' },
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
    <header style={{ backgroundColor: 'var(--header-bg)', borderBottom: '1px solid var(--header-border)' }} className="sticky top-0 z-10">
      {/* Row 1: logo */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <Link href="/">
          <Image src="/icons/logo.svg" alt="AINEWS" width={178} height={47} priority />
        </Link>
      </div>

      {/* Row 2: nav (left) + search + 中文 (right) */}
      <div className="max-w-7xl mx-auto px-4 pt-1 pb-2 flex items-center justify-between gap-3">
        {/* Category nav */}
        <nav className="flex">
          {categories.map((cat) => {
            const href = cat.slug ? `/${cat.slug}` : '/'
            const isActive = pathname === href
            return (
              <Link
                key={cat.slug}
                href={href}
                className={`group flex items-center justify-center gap-1.5 ${cat.w} py-1.5 rounded-lg text-sm font-medium transition-all duration-150`}
                style={isActive ? {
                  backgroundColor: 'var(--nav-active-bg)',
                  color: 'var(--nav-active-text)',
                  boxShadow: '0 0 0 1px var(--nav-active-ring)',
                } : {
                  color: 'var(--nav-inactive-text)',
                }}
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
        <div className="flex items-center gap-3 shrink-0">
          <form onSubmit={handleSearchSubmit}>
            <div
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                width: '220px',
                height: '34px',
                border: '2.5px solid var(--search-border)',
                borderRadius: '10px',
                background: 'var(--search-bg)',
                filter: 'drop-shadow(3px 4px 0px var(--search-shadow))',
                boxSizing: 'border-box',
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search articles…"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: 'transparent',
                  padding: '0 36px 0 12px',
                  fontSize: '12px',
                  color: 'var(--search-text)',
                  outline: 'none',
                  borderRadius: '10px',
                  boxSizing: 'border-box',
                }}
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={() => { setSearchInput(''); inputRef.current?.focus() }}
                  style={{ position: 'absolute', right: '13px', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--search-text)" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  aria-label="Search"
                  style={{ position: 'absolute', right: '13px', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0, pointerEvents: 'none' }}
                >
                  <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
                    <circle cx="7.5" cy="7.5" r="6" stroke="var(--search-text)" strokeWidth="3"/>
                    <line x1="12" y1="12" x2="16.5" y2="16.5" stroke="var(--search-text)" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          </form>

          {/* 中文 toggle */}
          <button
            onClick={toggle}
            disabled={isTranslating}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'none', border: 'none', padding: 0, opacity: isTranslating ? 0.6 : 1, transition: 'opacity 0.15s' }}
          >
            <svg width="64" height="34" viewBox="0 0 74 54" fill="none">
              <rect x="2" y="4" width="69" height="46" rx="10" fill="var(--translate-shadow)" transform="translate(3,4)"/>
              <rect x="2" y="4" width="69" height="46" rx="10" fill={isZh ? 'var(--translate-active-bg)' : 'var(--translate-bg)'}/>
              <rect x="2" y="4" width="69" height="46" rx="10" fill="none" stroke="var(--translate-border)" strokeWidth="3.5"/>
              <circle cx="22" cy="27" r="10" fill="var(--translate-shadow)" transform="translate(1,1.5)"/>
              <circle cx="22" cy="27" r="10" fill={isZh ? 'var(--translate-active-bg)' : 'var(--translate-bg)'}/>
              <circle cx="22" cy="27" r="10" fill="none" stroke="var(--translate-border)" strokeWidth="2.2"/>
              <ellipse cx="22" cy="27" rx="4.2" ry="10" fill="none" stroke="var(--translate-border)" strokeWidth="1.6"/>
              <line x1="12" y1="27" x2="32" y2="27" stroke="var(--translate-border)" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M13 22.5 Q22 20.5 31 22.5" fill="none" stroke="var(--translate-border)" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M13 31.5 Q22 33.5 31 31.5" fill="none" stroke="var(--translate-border)" strokeWidth="1.6" strokeLinecap="round"/>
              <text x="50" y="27" textAnchor="middle" dominantBaseline="central"
                fontFamily="'Arial Black','Helvetica Neue',sans-serif"
                fontSize="13" fontWeight="900" fill={isZh ? 'var(--translate-active-text)' : 'var(--translate-text)'} letterSpacing="0.5">
                {isTranslating ? '…' : '中文'}
              </text>
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
