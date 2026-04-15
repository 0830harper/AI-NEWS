import CategoryFeed from '../components/CategoryFeed'
import HomeTagline from '../components/HomeTagline'

export default function HomePage() {
  return (
    <div>
      <HomeTagline />
      <CategoryFeed category="latest" showCategory={true} />
    </div>
  )
}
