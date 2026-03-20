import 'dotenv/config'
import { supabaseAdmin } from '../lib/supabase'

const sources = [
  // APP (6 sources)
  { name: 'TechCrunch AI',      slug: 'techcrunch-ai',    category: 'app',    fetch_type: 'rss',     fetch_url: 'https://techcrunch.com/category/artificial-intelligence/feed/', home_url: 'https://techcrunch.com/category/artificial-intelligence/' },
  { name: 'The Verge AI',       slug: 'verge-ai',         category: 'app',    fetch_type: 'rss',     fetch_url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', home_url: 'https://theverge.com/ai-artificial-intelligence' },
  { name: 'Reddit r/artificial',slug: 'reddit-ai',        category: 'app',    fetch_type: 'api',     fetch_url: 'https://www.reddit.com/r/artificial/hot.json?limit=20', home_url: 'https://www.reddit.com/r/artificial/' },
  { name: 'MIT Tech Review',    slug: 'mit-tech-review',  category: 'app',    fetch_type: 'rss',     fetch_url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed', home_url: 'https://www.technologyreview.com/topic/artificial-intelligence/' },
  { name: 'AI Today',           slug: 'aitoday',          category: 'app',    fetch_type: 'scraper', fetch_url: 'https://www.aitoday.io/', home_url: 'https://www.aitoday.io/' },
  { name: '量子位',              slug: 'qbitai',           category: 'app',    fetch_type: 'rss',     fetch_url: 'https://www.qbitai.com/feed', home_url: 'https://www.qbitai.com/' },
  // DESIGN (4 sources)
  { name: 'Behance',            slug: 'behance',          category: 'design', fetch_type: 'rss',     fetch_url: 'https://feeds.feedburner.com/behance/vorr', home_url: 'https://www.behance.net/' },
  { name: 'Abduzeedo',          slug: 'abduzeedo',        category: 'design', fetch_type: 'rss',     fetch_url: 'https://abduzeedo.com/rss.xml', home_url: 'https://abduzeedo.com/' },
  { name: 'We and the Color',   slug: 'weandthecolor',    category: 'design', fetch_type: 'rss',     fetch_url: 'https://weandthecolor.com/feed', home_url: 'https://weandthecolor.com/' },
  { name: 'Logo Design Love',   slug: 'logodesignlove',   category: 'design', fetch_type: 'rss',     fetch_url: 'https://www.logodesignlove.com/feed', home_url: 'https://www.logodesignlove.com/' },
  // UXUI (9 sources)
  { name: 'UX Collective',       slug: 'ux-collective',    category: 'uxui',   fetch_type: 'rss', fetch_url: 'https://uxdesign.cc/feed',                       home_url: 'https://uxdesign.cc/' },
  { name: 'UX Planet',           slug: 'ux-planet',        category: 'uxui',   fetch_type: 'rss', fetch_url: 'https://uxplanet.org/feed',                      home_url: 'https://uxplanet.org/' },
  { name: 'Nielsen Norman Group',slug: 'nngroup',          category: 'uxui',   fetch_type: 'rss', fetch_url: 'https://www.nngroup.com/feed/rss/',              home_url: 'https://www.nngroup.com/' },
  { name: 'Smashing Magazine',   slug: 'smashing-mag',     category: 'uxui',   fetch_type: 'rss', fetch_url: 'https://www.smashingmagazine.com/feed/',         home_url: 'https://www.smashingmagazine.com/' },
  { name: 'A List Apart',        slug: 'alistapart',       category: 'uxui',   fetch_type: 'rss', fetch_url: 'https://alistapart.com/main/feed/',              home_url: 'https://alistapart.com/' },
  { name: 'Sidebar',             slug: 'sidebar',          category: 'uxui',   fetch_type: 'rss', fetch_url: 'https://sidebar.io/feed.xml',                    home_url: 'https://sidebar.io/' },
  { name: 'Boxes and Arrows',    slug: 'boxes-arrows',     category: 'uxui',   fetch_type: 'rss', fetch_url: 'https://boxesandarrows.com/feed/',               home_url: 'https://boxesandarrows.com/' },
  { name: 'UX Magazine',         slug: 'ux-mag',           category: 'uxui',   fetch_type: 'rss', fetch_url: 'https://uxmag.com/feed',                         home_url: 'https://uxmag.com/' },
  { name: 'UX Matters',          slug: 'ux-matters',       category: 'uxui',   fetch_type: 'rss', fetch_url: 'https://www.uxmatters.com/index.xml',            home_url: 'https://www.uxmatters.com/' },
  // TECH (6 sources)
  { name: 'GitHub Trending',    slug: 'github-trending',  category: 'tech',   fetch_type: 'scraper', fetch_url: 'https://github.com/trending/python?since=daily', home_url: 'https://github.com/trending/python?since=daily' },
  { name: 'Hacker News',        slug: 'hackernews',       category: 'tech',   fetch_type: 'api',     fetch_url: 'https://hacker-news.firebaseio.com/v0/showstories.json', home_url: 'https://news.ycombinator.com/show' },
  { name: 'Hugging Face',       slug: 'huggingface',      category: 'tech',   fetch_type: 'scraper', fetch_url: 'https://huggingface.co/papers', home_url: 'https://huggingface.co/' },
  { name: 'Google AI Dev',      slug: 'google-ai-dev',    category: 'tech',   fetch_type: 'rss',     fetch_url: 'https://developers.googleblog.com/feeds/posts/default', home_url: 'https://ai.google.dev/' },
  { name: 'LangChain Blog',     slug: 'langchain',        category: 'tech',   fetch_type: 'rss',     fetch_url: 'https://blog.langchain.dev/rss/', home_url: 'https://www.langchain.com/' },
  { name: 'arXiv cs.AI',        slug: 'arxiv-ai',         category: 'tech',   fetch_type: 'rss',     fetch_url: 'https://arxiv.org/rss/cs.AI', home_url: 'https://arxiv.org/list/cs.AI/recent' },
  { name: 'DeepMind Blog',      slug: 'deepmind',         category: 'tech',   fetch_type: 'rss',     fetch_url: 'https://deepmind.google/blog/rss.xml', home_url: 'https://deepmind.google/blog/' },
  { name: 'Radar AI',           slug: 'radar-ai',         category: 'tech',   fetch_type: 'scraper', fetch_url: 'https://radarai.top/', home_url: 'https://radarai.top/' },
]

async function seed() {
  console.log('Seeding sources...')
  const { error } = await supabaseAdmin
    .from('sources')
    .upsert(sources, { onConflict: 'slug', ignoreDuplicates: true })
  if (error) {
    console.error('Seed error:', error)
    process.exit(1)
  }
  console.log(`✓ Seeded ${sources.length} sources`)
  process.exit(0)
}

seed()
