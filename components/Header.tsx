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
        <Link href="/" style={{ marginLeft: '-18px', display: 'inline-block' }}>
          <Image src="/icons/logo.svg" alt="Signal Lab" width={280} height={54} priority />
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
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150`}
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

          {/* EN / 中 toggle */}
          <button
            onClick={toggle}
            disabled={isTranslating}
            aria-label={isZh ? 'Switch to English' : 'Switch to Chinese'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: isTranslating ? 'not-allowed' : 'pointer',
              opacity: isTranslating ? 0.55 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            <svg width="72" height="34" viewBox="0 0 72 34" fill="none">
              {/* Shadow */}
              <rect x="3" y="3" width="68" height="30" rx="9" fill="var(--translate-shadow)"/>
              {/* Base bg */}
              <rect x="1" y="1" width="68" height="30" rx="9" fill="var(--translate-bg)"/>
              {/* Border */}
              <rect x="1" y="1" width="68" height="30" rx="9" fill="none" stroke="var(--translate-border)" strokeWidth="2.5"/>
              {/* Active side fill */}
              {!isZh ? (
                <>
                  <rect x="1" y="1" width="34" height="30" rx="9" fill="var(--translate-active-bg)"/>
                  <rect x="27" y="1" width="7" height="30" fill="var(--translate-active-bg)"/>
                </>
              ) : (
                <>
                  <rect x="35" y="1" width="34" height="30" rx="9" fill="var(--translate-active-bg)"/>
                  <rect x="35" y="1" width="7" height="30" fill="var(--translate-active-bg)"/>
                </>
              )}
              {/* Divider */}
              <line x1="35" y1="1" x2="35" y2="31" stroke="var(--translate-border)" strokeWidth="2"/>
              {/* EN label */}
              <text x="18" y="16" textAnchor="middle" dominantBaseline="central"
                fontFamily="'Arial Black','Helvetica Neue',sans-serif"
                fontSize="12" fontWeight="900"
                fill={!isZh ? 'var(--translate-active-text)' : 'var(--translate-border)'}>
                {isTranslating ? '…' : 'EN'}
              </text>
              {/* 中 label */}
              <text x="53" y="16" textAnchor="middle" dominantBaseline="central"
                fontFamily="'Arial Black','Helvetica Neue',sans-serif"
                fontSize="12" fontWeight="900"
                fill={isZh ? 'var(--translate-active-text)' : 'var(--translate-border)'}>
                中
              </text>
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
