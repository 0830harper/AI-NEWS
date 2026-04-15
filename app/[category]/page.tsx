import { notFound } from 'next/navigation'
import CategoryFeed from '../../components/CategoryFeed'
import CategoryTagline from '../../components/CategoryTagline'

const VALID_CATEGORIES = ['app', 'design', 'uxui', 'tech']

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params

  if (!VALID_CATEGORIES.includes(category)) notFound()

  return (
    <div>
      <CategoryTagline category={category} />
      <CategoryFeed category={category} />
    </div>
  )
}
