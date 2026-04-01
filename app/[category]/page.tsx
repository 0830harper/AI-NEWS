import { notFound } from 'next/navigation'
import CategoryFeed from '../../components/CategoryFeed'

const VALID_CATEGORIES = ['app', 'design', 'uxui', 'tech']

const CATEGORY_LABELS: Record<string, string> = {
  app:    '⚙ Tool',
  design: '◈ Visual',
  uxui:   '✦ UX / UI',
  tech:   '⊞ Tech',
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params

  if (!VALID_CATEGORIES.includes(category)) notFound()

  const label = CATEGORY_LABELS[category]

  return (
    <div>
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-widest text-gray-600">
          {label}
        </p>
      </div>
      <CategoryFeed category={category} />
    </div>
  )
}
