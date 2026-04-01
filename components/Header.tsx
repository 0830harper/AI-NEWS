'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

const categories = [
  { slug: '',        label: 'Pick',   icon: '/icons/pick.svg',   size: 32 },
  { slug: 'app',    label: 'Tool',   icon: '/icons/tool.svg',   size: 36 },
  { slug: 'design', label: 'Visual', icon: '/icons/visual.svg', size: 36 },
  { slug: 'uxui',   label: 'UX / UI',icon: '/icons/uxui.svg',   size: 38 },
  { slug: 'tech',   label: 'Tech',   icon: '/icons/tech.svg',   size: 38 },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 h-13 flex items-center justify-between">
      <Link href="/">
        <Image src="/icons/logo.svg" alt="AINEWS" width={178} height={47} priority />
      </Link>
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
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
            >
              <Image
                src={cat.icon}
                alt={cat.label}
                width={cat.size}
                height={cat.size}
                className={`shrink-0 transition-transform duration-150 group-hover:scale-110 ${isActive ? 'brightness-0 invert' : ''}`}
              />
              <span className={isActive ? 'inline' : 'hidden sm:inline'}>{cat.label}</span>
            </Link>
          )
        })}
      </nav>
      </div>
    </header>
  )
}
