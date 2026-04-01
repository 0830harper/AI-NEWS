import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs text-gray-400">
        <span>AI NEWS — Curated from 46 sources</span>
        <div className="flex items-center gap-4">
          <span>Updated daily</span>
          <Link
            href="/source"
            className="hover:text-gray-600 transition-colors underline underline-offset-2"
          >
            Source list
          </Link>
        </div>
      </div>
    </footer>
  )
}
