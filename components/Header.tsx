'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef } from 'react'
import { useTranslation } from '../contexts/TranslationContext'
import { ui } from '../lib/ui-i18n'

const categories = [
  { slug: '',        labelKey: 'navPick' as const,   icon: '/icons/pick.svg',   size: 32 },
  { slug: 'app',    labelKey: 'navTool' as const,   icon: '/icons/tool.svg',   size: 36 },
  { slug: 'design', labelKey: 'navVisual' as const, icon: '/icons/visual.svg', size: 42 },
  { slug: 'uxui',   labelKey: 'navUxui' as const,   icon: '/icons/uxui.svg',   size: 38 },
  { slug: 'tech',   labelKey: 'navTech' as const,   icon: '/icons/tech.svg',   size: 38 },
]

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [searchInput, setSearchInput] = useState('')
  const desktopInputRef = useRef<HTMLInputElement>(null)
  const { isZh, toggle } = useTranslation()
  const t = ui(isZh)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchInput.trim()
    if (!q) return
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  /* ── EN/中 toggle (shared by mobile + desktop rows) ── */
  const ToggleBtn = ({ className = '' }: { className?: string }) => (
    <button
      type="button"
      onClick={toggle}
      aria-label={isZh ? 'Switch to English' : 'Switch to Chinese'}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        filter: 'drop-shadow(2px 3px 0px var(--search-shadow, #c0c0c0))',
        flexShrink: 0,
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="62" height="34" viewBox="0 0 62 34" fill="none">
        <rect x="1.5" y="1.5" width="59" height="31" rx="8" fill="#ffffff"/>
        <rect x="1.5" y="1.5" width="59" height="31" rx="8" fill="none" stroke="#1a1a1a" strokeWidth="2.5"/>
        {!isZh ? (
          <>
            <rect x="1.5" y="1.5" width="29.5" height="31" rx="8" fill="#1a1a1a"/>
            <rect x="24" y="1.5" width="7" height="31" fill="#1a1a1a"/>
          </>
        ) : (
          <>
            <rect x="31" y="1.5" width="29.5" height="31" rx="8" fill="#1a1a1a"/>
            <rect x="31" y="1.5" width="7" height="31" fill="#1a1a1a"/>
          </>
        )}
        <line x1="31" y1="1.5" x2="31" y2="32.5" stroke="#1a1a1a" strokeWidth="2.5"/>
        <text x="16.5" y="17" textAnchor="middle" dominantBaseline="central"
          fontFamily="'Arial Black','Helvetica Neue',sans-serif" fontSize="11" fontWeight="900"
          fill={!isZh ? '#ffffff' : '#1a1a1a'}>EN</text>
        <text x="46" y="17" textAnchor="middle" dominantBaseline="central"
          fontFamily="'Arial Black','Helvetica Neue',sans-serif" fontSize="11" fontWeight="900"
          fill={isZh ? '#ffffff' : '#1a1a1a'}>中</text>
      </svg>
    </button>
  )

  return (
    <header style={{ backgroundColor: 'var(--header-bg)', borderBottom: '1px solid var(--header-border)' }} className="sticky top-0 z-10">

      {/* ── Row 1: Logo + (mobile: compact search + toggle) ── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2">
        <Link href="/" className="-ml-2 sm:-ml-[18px] flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/logo.svg" alt="Signal Lab" className="h-7 sm:h-[54px] w-auto" />
        </Link>

        {/* Mobile-only controls (hidden on sm+) */}
        <div className="flex sm:hidden items-center gap-2 ml-auto">
          <form onSubmit={handleSearchSubmit}>
            <div style={{
              position: 'relative', display: 'inline-flex', alignItems: 'center',
              height: '30px', border: '2px solid var(--search-border)',
              borderRadius: '8px', background: 'var(--search-bg)',
              filter: 'drop-shadow(2px 3px 0px var(--search-shadow))',
              width: '120px',
            }}>
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search…"
                style={{
                  width: '100%', height: '100%', border: 'none', background: 'transparent',
                  padding: '0 28px 0 8px', fontSize: '12px',
                  color: 'var(--search-text)', outline: 'none', borderRadius: '8px',
                }}
              />
              {searchInput ? (
                <button type="button" onClick={() => setSearchInput('')}
                  style={{ position: 'absolute', right: '8px', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--search-text)" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              ) : (
                <span style={{ position: 'absolute', right: '8px', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                  <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
                    <circle cx="7.5" cy="7.5" r="6" stroke="var(--search-text)" strokeWidth="3"/>
                    <line x1="12" y1="12" x2="16.5" y2="16.5" stroke="var(--search-text)" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </span>
              )}
            </div>
          </form>
          <ToggleBtn />
        </div>
      </div>

      {/* ── Row 2: Nav + (desktop: search + toggle) ── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-0.5 pb-2 flex items-center gap-2 sm:gap-3">

        {/* Category nav — horizontally scrollable on mobile */}
        <nav className="flex flex-nowrap overflow-x-auto min-w-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
          {categories.map((cat) => {
            const href = cat.slug ? `/${cat.slug}` : '/'
            const isActive = pathname === href
            const label = t[cat.labelKey]
            return (
              <Link
                key={cat.slug}
                href={href}
                className="group flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 flex-shrink-0"
                style={isActive ? {
                  backgroundColor: 'var(--nav-active-bg)',
                  color: 'var(--nav-active-text)',
                  boxShadow: '0 0 0 1px var(--nav-active-ring)',
                } : {
                  color: 'var(--nav-inactive-text)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.icon}
                  alt={label}
                  width={cat.size}
                  height={cat.size}
                  className="shrink-0 transition-transform duration-150 group-hover:scale-110"
                />
                <span className={isActive ? 'inline' : 'hidden sm:inline'}>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Desktop-only controls (hidden on mobile) */}
        <div className="hidden sm:flex items-center gap-3 shrink-0 ml-auto">
          <form onSubmit={handleSearchSubmit}>
            <div style={{
              position: 'relative', display: 'inline-flex', alignItems: 'center',
              width: '220px', height: '34px',
              border: '2.5px solid var(--search-border)', borderRadius: '10px',
              background: 'var(--search-bg)',
              filter: 'drop-shadow(3px 4px 0px var(--search-shadow))',
              boxSizing: 'border-box',
            }}>
              <input
                ref={desktopInputRef}
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder={t.searchPlaceholder}
                style={{
                  width: '100%', height: '100%', border: 'none', background: 'transparent',
                  padding: '0 36px 0 12px', fontSize: '12px',
                  color: 'var(--search-text)', outline: 'none',
                  borderRadius: '10px', boxSizing: 'border-box',
                }}
              />
              {searchInput ? (
                <button type="button" onClick={() => { setSearchInput(''); desktopInputRef.current?.focus() }}
                  style={{ position: 'absolute', right: '13px', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--search-text)" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              ) : (
                <button type="submit" aria-label="Search"
                  style={{ position: 'absolute', right: '13px', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0, pointerEvents: 'none' }}>
                  <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
                    <circle cx="7.5" cy="7.5" r="6" stroke="var(--search-text)" strokeWidth="3"/>
                    <line x1="12" y1="12" x2="16.5" y2="16.5" stroke="var(--search-text)" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          </form>
          <ToggleBtn />
        </div>
      </div>
    </header>
  )
}
