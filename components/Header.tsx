'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

const categories = [
  { slug: '',        label: 'Pick',   icon: '/icons/pick.svg'   },
  { slug: 'app',    label: 'Tool',   icon: '/icons/tool.svg'   },
  { slug: 'design', label: 'Visual', icon: '/icons/visual.svg' },
  { slug: 'uxui',   label: 'UX / UI',icon: '/icons/uxui.svg'   },
  { slug: 'tech',   label: 'Tech',   icon: '/icons/tech.svg'   },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 h-13 flex items-center justify-between">
      <Link href="/" className="text-base font-medium text-gray-900 tracking-tight">
        AI NEWS
      </Link>
      <nav className="flex gap-1">
        {categories.map((cat) => {
          const href = cat.slug ? `/${cat.slug}` : '/'
          const isActive = pathname === href
          return (
            <Link
              key={cat.slug}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors
                ${isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
            >
              <Image
                src={cat.icon}
                alt={cat.label}
                width={22}
                height={22}
                className="shrink-0"
              />
              {cat.label}
            </Link>
          )
        })}
      </nav>
      </div>
    </header>
  )
}
