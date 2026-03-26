import CategoryFeed from '../components/CategoryFeed'

export default function HomePage() {
  return (
    <div>
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
          ⚡ Past 30 days · Top picks
        </p>
      </div>
      <CategoryFeed category="latest" showCategory={true} />
    </div>
  )
}
