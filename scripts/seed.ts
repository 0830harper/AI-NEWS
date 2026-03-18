import 'dotenv/config'
import { supabaseAdmin } from '../lib/supabase'

const sources = [
  // APP
  { name: 'TechCrunch AI',      slug: 'techcrunch-ai',    category: 'app',    fetch_type: 'rss',     fetch_url: 'https://techcrunch.com/category/artificial-intelligence/feed/', home_url: 'https://techcrunch.com/category/artificial-intelligence/' },
  { name: 'The Verge AI',       slug: 'verge-ai',         category: 'app',    fetch_type: 'rss',     fetch_url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', home_url: 'https://theverge.com/ai-artificial-intelligence' },
  { name: 'Reddit r/artificial',slug: 'reddit-ai',        category: 'app',    fetch_type: 'api',     fetch_url: 'https://www.reddit.com/r/artificial/hot.json?limit=20', home_url: 'https://www.reddit.com/r/artificial/' },
  { name: 'MIT Tech Review',    slug: 'mit-tech-review',  category: 'app',    fetch_type: 'rss',     fetch_url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed', home_url: 'https://www.technologyreview.com/topic/artificial-intelligence/' },
  { name: 'DeepMind Blog',      slug: 'deepmind',         category: 'app',    fetch_type: 'rss',     fetch_url: 'https://deepmind.google/blog/rss.xml', home_url: 'https://deepmind.google/blog/' },
  { name: 'Wired AI',           slug: 'wired-ai',         category: 'app',    fetch_type: 'rss',     fetch_url: 'https://www.wired.com/feed/category/artificial-intelligence/latest/rss', home_url: 'https://www.wired.com/category/artificial-intelligence/' },
  { name: '机器之心',            slug: 'jiqizhixin',       category: 'app',    fetch_type: 'rss',     fetch_url: 'https://www.jiqizhixin.com/rss', home_url: 'https://www.jiqizhixin.com/' },
  { name: 'Radar AI',           slug: 'radar-ai',         category: 'app',    fetch_type: 'scraper', fetch_url: 'https://radarai.top/', home_url: 'https://radarai.top/' },
  { name: 'AI Today',           slug: 'aitoday',          category: 'app',    fetch_type: 'scraper', fetch_url: 'https://www.aitoday.io/', home_url: 'https://www.aitoday.io/' },
  { name: '量子位',              slug: 'qbitai',           category: 'app',    fetch_type: 'rss',     fetch_url: 'https://www.qbitai.com/feed', home_url: 'https://www.qbitai.com/' },
  { name: 'AIBase',             slug: 'aibase',           category: 'app',    fetch_type: 'scraper', fetch_url: 'https://www.aibase.cn/', home_url: 'https://www.aibase.cn/' },
  // DESIGN
  { name: 'Behance',            slug: 'behance',          category: 'design', fetch_type: 'rss',     fetch_url: 'https://feeds.feedburner.com/behance/vorr', home_url: 'https://www.behance.net/' },
  { name: 'Dribbble',           slug: 'dribbble',         category: 'design', fetch_type: 'rss',     fetch_url: 'https://dribbble.com/shots/popular.rss', home_url: 'https://dribbble.com/' },
  { name: '站酷',                slug: 'zcool',            category: 'design', fetch_type: 'scraper', fetch_url: 'https://www.zcool.com.cn/top/0/0.do', home_url: 'https://www.zcool.com.cn/' },
  { name: '花瓣',                slug: 'huaban',           category: 'design', fetch_type: 'scraper', fetch_url: 'https://huaban.com/', home_url: 'https://huaban.com/' },
  { name: 'Abduzeedo',          slug: 'abduzeedo',        category: 'design', fetch_type: 'rss',     fetch_url: 'https://abduzeedo.com/rss.xml', home_url: 'https://abduzeedo.com/' },
  { name: 'We and the Color',   slug: 'weandthecolor',    category: 'design', fetch_type: 'rss',     fetch_url: 'https://weandthecolor.com/feed', home_url: 'https://weandthecolor.com/' },
  { name: 'Logo Design Love',   slug: 'logodesignlove',   category: 'design', fetch_type: 'rss',     fetch_url: 'https://www.logodesignlove.com/feed', home_url: 'https://www.logodesignlove.com/' },
  { name: 'Notefolio',          slug: 'notefolio',        category: 'design', fetch_type: 'scraper', fetch_url: 'https://notefolio.net/', home_url: 'https://notefolio.net/' },
  { name: "It's Nice That",     slug: 'itsnicethat',      category: 'design', fetch_type: 'rss',     fetch_url: 'https://www.itsnicethat.com/rss', home_url: 'https://www.itsnicethat.com/' },
  // UXUI
  { name: 'Lapa Ninja AI',      slug: 'lapa-ninja',       category: 'uxui',   fetch_type: 'scraper', fetch_url: 'https://www.lapa.ninja/category/artificial-intelligence/', home_url: 'https://www.lapa.ninja/category/artificial-intelligence/' },
  { name: 'Bubbbly',            slug: 'bubbbly',          category: 'uxui',   fetch_type: 'scraper', fetch_url: 'https://www.bubbbly.com/', home_url: 'https://www.bubbbly.com/' },
  { name: '60fps.design',       slug: '60fps',            category: 'uxui',   fetch_type: 'scraper', fetch_url: 'https://60fps.design/', home_url: 'https://60fps.design/' },
  { name: 'Figma Community',    slug: 'figma-community',  category: 'uxui',   fetch_type: 'scraper', fetch_url: 'https://www.figma.com/community', home_url: 'https://www.figma.com/community' },
  { name: 'AI UX Patterns',     slug: 'aiuxpatterns',     category: 'uxui',   fetch_type: 'scraper', fetch_url: 'https://aiuxpatterns.com/', home_url: 'https://aiuxpatterns.com/' },
  { name: 'Korea Web Design',   slug: 'koreawebdesign',   category: 'uxui',   fetch_type: 'scraper', fetch_url: 'https://koreawebdesign.com/', home_url: 'https://koreawebdesign.com/' },
  { name: 'Site Inspire',       slug: 'siteinspire',      category: 'uxui',   fetch_type: 'scraper', fetch_url: 'https://www.siteinspire.com/', home_url: 'https://www.siteinspire.com/' },
  { name: 'Page Flows',         slug: 'pageflows',        category: 'uxui',   fetch_type: 'scraper', fetch_url: 'https://pageflows.com/', home_url: 'https://pageflows.com/' },
  { name: 'Mobbin',             slug: 'mobbin',           category: 'uxui',   fetch_type: 'scraper', fetch_url: 'https://mobbin.com/', home_url: 'https://mobbin.com/' },
  { name: 'Awwwards',           slug: 'awwwards',         category: 'uxui',   fetch_type: 'scraper', fetch_url: 'https://www.awwwards.com/websites/', home_url: 'https://www.awwwards.com/' },
  // TECH
  { name: 'GitHub Trending',    slug: 'github-trending',  category: 'tech',   fetch_type: 'scraper', fetch_url: 'https://github.com/trending/python?since=daily', home_url: 'https://github.com/trending/python?since=daily' },
  { name: 'Hacker News',        slug: 'hackernews',       category: 'tech',   fetch_type: 'api',     fetch_url: 'https://hacker-news.firebaseio.com/v0/showstories.json', home_url: 'https://news.ycombinator.com/show' },
  { name: 'Hugging Face',       slug: 'huggingface',      category: 'tech',   fetch_type: 'scraper', fetch_url: 'https://huggingface.co/papers', home_url: 'https://huggingface.co/' },
  { name: 'OpenRouter',         slug: 'openrouter',       category: 'tech',   fetch_type: 'scraper', fetch_url: 'https://openrouter.ai/models', home_url: 'https://openrouter.ai/' },
  { name: 'Google AI Dev',      slug: 'google-ai-dev',    category: 'tech',   fetch_type: 'rss',     fetch_url: 'https://developers.googleblog.com/feeds/posts/default', home_url: 'https://ai.google.dev/' },
  { name: 'LangChain Blog',     slug: 'langchain',        category: 'tech',   fetch_type: 'rss',     fetch_url: 'https://blog.langchain.dev/rss/', home_url: 'https://www.langchain.com/' },
  { name: 'ModelZoo',           slug: 'modelzoo',         category: 'tech',   fetch_type: 'scraper', fetch_url: 'https://modelzoo.co/', home_url: 'https://modelzoo.co/' },
  { name: 'arXiv cs.AI',        slug: 'arxiv-ai',         category: 'tech',   fetch_type: 'rss',     fetch_url: 'https://arxiv.org/rss/cs.AI', home_url: 'https://arxiv.org/list/cs.AI/recent' },
  { name: 'MLflow Blog',        slug: 'mlflow',           category: 'tech',   fetch_type: 'rss',     fetch_url: 'https://mlflow.org/blog/feed', home_url: 'https://mlflow.org/' },
  { name: 'Kaggle Models',      slug: 'kaggle',           category: 'tech',   fetch_type: 'scraper', fetch_url: 'https://www.kaggle.com/models', home_url: 'https://www.kaggle.com/models' },
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
