'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LightningIcon,
  PhoneIcon,
  BrushIcon,
  LayersIcon,
  ChipIcon,
  SignalIcon,
} from './NavIcons'

const categories = [
  { slug: '',        label: 'Pick',        Icon: LightningIcon },
  { slug: 'app',    label: 'Tool',        Icon: PhoneIcon     },
  { slug: 'design', label: 'Visual',      Icon: BrushIcon     },
  { slug: 'uxui',   label: 'UX / UI',     Icon: LayersIcon    },
  { slug: 'tech',   label: 'Tech',        Icon: ChipIcon      },
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
              <cat.Icon size={17} />
              {cat.label}
            </Link>
          )
        })}
        <Link
          href="/source"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors
            ${pathname === '/source'
              ? 'bg-gray-900 text-white'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
        >
          <SignalIcon size={17} />
          Source
        </Link>
      </nav>
      </div>
    </header>
  )
}
