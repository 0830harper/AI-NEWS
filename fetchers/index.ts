import { supabaseAdmin } from '../lib/supabase'
import { calcHeatScore } from '../lib/heat'
import { randomColor } from '../lib/colors'
import { hashUrl } from '../lib/utils'
import { extractOgImage, isLogoUrl as isLogoUrlLib } from '../lib/og-image'
import { enrichWithImageSizes } from '../lib/image-size'
import { RssFetcher } from './rss/generic'
import { HackerNewsFetcher } from './api/hackernews'
import { RedditFetcher } from './api/reddit'
import { GithubTrendingFetcher } from './scraper/github-trending'
import { HuggingFaceFetcher } from './scraper/huggingface'
import { GenericScraper } from './scraper/generic'
import { FetchedArticle } from '../types'
import { translateAndPersistArticleIds } from '../lib/translate-articles'

// 并发限制
const OG_CONCURRENCY = 20
const HN_CONCURRENCY = 5
const HN_TIMEOUT_MS = 4000
const AI_CONCURRENCY = 20
const AI_TIMEOUT_MS = 8000

const VALID_CATEGORIES = ['app', 'design', 'uxui', 'tech', 'irrelevant']

// 关键词预检：包含这些词的文章直接保留，不需要 AI 判断
const AI_KEYWORDS = [
  // English AI terms
  'AI', 'A.I.', 'artificial intelligence', 'machine learning', 'deep learning',
  'neural network', 'LLM', 'GPT', 'ChatGPT', 'Claude', 'Gemini', 'OpenAI',
  'Anthropic', 'xAI', 'DeepMind', 'Mistral', 'Llama', 'diffusion', 'transformer',
  'AGI', 'generative', 'large language', 'multimodal', 'copilot', 'agent',
  'robotics', 'autonomous', 'computer vision', 'NLP', 'stable diffusion',
  // Chinese AI terms
  '人工智能', '大模型', '机器学习', '深度学习', '神经网络', '智能体', '具身',
  '生成式', '多模态', '模型', '算法', '机器人', 'AI',
  // AI design / UX tools
  'Figma AI', 'AI design', 'AI tool', 'AI app', 'AI product',
]

/** Fast keyword pre-check: if article contains AI/design keywords, skip AI classification */
function hasRelevantKeyword(title: string, description?: string | null): boolean {
  const text = [title, description].filter(Boolean).join(' ')
  return AI_KEYWORDS.some(kw => text.toLowerCase().includes(kw.toLowerCase()))
}

// 融资/商业新闻关键词：命中则直接判 irrelevant，不进 AI 分类
const FUNDING_PATTERNS = [
  /raises?\s+\$[\d.]+\s*[mb]/i,
  /raised?\s+\$[\d.]+\s*[mb]/i,
  /\$[\d.]+\s*[mb]\s+(series\s+[a-e]|seed|funding|round)/i,
  /series\s+[a-e]\s+round/i,
  /funding\s+round/i,
  /valuation\s+of\s+\$/i,
  /\bipo\b/i,
  /goes?\s+public/i,
  /acqui(?:res?|sition)/i,
  /lays?\s+off\s+\d+/i,
]

/** Returns true if title looks like a funding/M&A/layoff news article */
function isFundingNews(title: string): boolean {
  return FUNDING_PATTERNS.some(re => re.test(title))
}

/** Use SiliconFlow Qwen to classify an article into a specific category.
 *  Returns: 'app' | 'design' | 'uxui' | 'tech' | 'irrelevant' */
async function classifyArticle(title: string, description?: string | null): Promise<string> {
  const apiKey = process.env.SILICONFLOW_API_KEY
  if (!apiKey) return 'keep'

  const text = [title, description].filter(Boolean).join('\n').slice(0, 400)

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)
    const res = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen2.5-7B-Instruct',
        messages: [{
          role: 'user',
          content: `You are classifying articles for an AI NEWS website. Assign this article to ONE category, or mark as irrelevant.

Categories:
- app: A specific named mobile/web/desktop app or AI tool users can directly use. Must be about a concrete product launch, update, or feature. NOT: general AI news, research, company strategy, conferences, funding.
- design: AI-involved visual creation ONLY: AI-generated images/video/art, AIGC cases, tools like Midjourney/DALL-E/Sora/Runway/Stable Diffusion/Firefly, AI artist workflows. Must explicitly use AI in the creative process. NOT: regular graphic design, branding, typography, architecture, packaging, photography without AI.
- uxui: Practical digital UX/UI content: usability research, UI component patterns, interaction design, accessibility, design systems, app interface critique, prototyping methods. Must be actionable and about digital product interfaces. NOT: personal essays, book reviews, philosophical reflection, team management, career advice, job listings, typography essays, general "design thinking" without practical UI/UX methods.
- tech: AI model research, AI company/policy news, AI engineering, developer tools, infrastructure, cybersecurity. Must be AI-related.
- irrelevant: anything not AI-related — sports, politics, cooking, celebrity, real estate, general business, non-AI tech, essays without practical value, book reviews, job listings.

Reply with ONLY one word: app, design, uxui, tech, or irrelevant.

Article: ${text}`,
        }],
        max_tokens: 10,
        temperature: 0,
      }),
    })
    clearTimeout(timer)
    if (!res.ok) return 'keep'
    const data = await res.json()
    const reply = (data.choices?.[0]?.message?.content ?? '').trim().toLowerCase()
    if (reply.includes('irrelevant')) return 'irrelevant'
    if (reply.includes('app')) return 'app'
    if (reply.includes('design')) return 'design'
    if (reply.includes('uxui') || reply.includes('ux')) return 'uxui'
    if (reply.includes('tech')) return 'tech'
    return 'keep'
  } catch {
    return 'keep'
  }
}

/** Filter irrelevant articles and assign AI category to each kept article. */
async function filterIrrelevant(articles: FetchedArticle[]): Promise<FetchedArticle[]> {
  const results: FetchedArticle[] = []

  // Step 1: 融资新闻关键词预过滤，直接跳过，不调 AI
  const toClassify: FetchedArticle[] = []
  for (const article of articles) {
    if (isFundingNews(article.title)) {
      console.log(`  ✗ filtered (funding): ${article.title.slice(0, 60)}`)
    } else {
      toClassify.push(article)
    }
  }

  // Step 2: AI 分类
  for (let i = 0; i < toClassify.length; i += AI_CONCURRENCY) {
    const batch = toClassify.slice(i, i + AI_CONCURRENCY)
    const labels = await Promise.all(
      batch.map(a => classifyArticle(a.title, a.description))
    )
    batch.forEach((article, idx) => {
      const label = labels[idx]
      if (label === 'irrelevant') {
        console.log(`  ✗ filtered (irrelevant): ${article.title.slice(0, 60)}`)
      } else {
        // Attach AI-assigned category if specific (not just 'keep')
        if (['app', 'design', 'uxui', 'tech'].includes(label)) {
          article.ai_category = label
        }
        results.push(article)
      }
    })
  }
  return results
}

/** 用 HN Algolia 反查每篇文章的 points，作为 raw_score */
async function enrichWithHnPoints(articles: FetchedArticle[]): Promise<void> {
  for (let i = 0; i < articles.length; i += HN_CONCURRENCY) {
    const batch = articles.slice(i, i + HN_CONCURRENCY)
    await Promise.allSettled(batch.map(async (article) => {
      if (!article.url) return
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), HN_TIMEOUT_MS)
        const encoded = encodeURIComponent(article.url)
        const res = await fetch(
          `https://hn.algolia.com/api/v1/search?query=${encoded}&restrictSearchableAttributes=url&hitsPerPage=1`,
          { signal: controller.signal }
        )
        clearTimeout(timer)
        if (!res.ok) return
        const data = await res.json()
        const hit = data?.hits?.[0]
        if (hit && typeof hit.points === 'number' && hit.points > 0) {
          article.raw_score = Math.max(article.raw_score ?? 0, hit.points)
        }
      } catch {
        // 查不到或超时，跳过
      }
    }))
  }
}

/** Insert or update an article, preserving published_at for existing rows.
 *  This prevents re-fetches from overwriting the original publication date
 *  with new Date() (which happens when the RSS feed has no pubDate). */
/** Returns new row id on insert, or null if updated existing / failed. */
async function saveArticle(sourceId: number, article: FetchedArticle, heatScore: number): Promise<number | null> {
  const urlHash = hashUrl(article.url)
  const payload = {
    source_id: sourceId,
    title: article.title.slice(0, 500),
    description: article.description?.slice(0, 1000) || null,
    url: article.url,
    url_hash: urlHash,
    author: article.author || null,
    thumbnail: article.thumbnail || null,
    img_width: article.img_width ?? null,
    img_height: article.img_height ?? null,
    raw_score: article.raw_score,
    heat_score: heatScore,
    card_color: randomColor(),
    tags: article.tags,
    ai_category: article.ai_category || null,
  }
  const { data: existing } = await (supabaseAdmin as any)
    .from('articles')
    .select('id')
    .eq('url_hash', urlHash)
    .maybeSingle()

  if (existing) {
    await (supabaseAdmin as any).from('articles').update(payload).eq('url_hash', urlHash)
    return null
  }
  const { data: inserted, error } = await (supabaseAdmin as any)
    .from('articles')
    .insert({
      ...payload,
      published_at: article.published_at.toISOString(),
    })
    .select('id')
    .single()
  if (error) {
    console.error('saveArticle insert:', error.message)
    return null
  }
  return inserted?.id ?? null
}

async function enrichWithOgImages(articles: FetchedArticle[]): Promise<void> {
  articles.forEach((a) => {
    if (a.thumbnail && isLogoUrlLib(a.thumbnail)) a.thumbnail = null
  })

  const noImage = articles.filter((a) => !a.thumbnail && a.url)
  for (let i = 0; i < noImage.length; i += OG_CONCURRENCY) {
    const batch = noImage.slice(i, i + OG_CONCURRENCY)
    const results = await Promise.allSettled(batch.map((a) => extractOgImage(a.url)))
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled' && r.value) {
        batch[idx].thumbnail = r.value
      }
    })
  }

  // 如果同一张图被 3 篇以上文章共用（且占比 60%+），说明是网站 logo，清除掉
  const thumbCount: Record<string, number> = {}
  articles.forEach((a) => { if (a.thumbnail) thumbCount[a.thumbnail] = (thumbCount[a.thumbnail] || 0) + 1 })
  const minAbsolute = 3
  const minRatio = 0.6
  articles.forEach((a) => {
    if (
      a.thumbnail &&
      thumbCount[a.thumbnail] >= minAbsolute &&
      thumbCount[a.thumbnail] >= Math.ceil(articles.length * minRatio)
    ) {
      a.thumbnail = null
    }
  })
}

// 所有来源配置
const FETCHER_MAP: Record<string, () => Promise<FetchedArticle[]>> = {
  // APP (product-focused sources only)
  'techcrunch-ai':  () => new RssFetcher('https://techcrunch.com/category/artificial-intelligence/feed/').fetch(),
  'verge-ai':       () => new RssFetcher('https://www.theverge.com/rss/ai-artificial-intelligence/index.xml').fetch(),
  'wired-ai':       () => new RssFetcher('https://www.wired.com/feed/category/artificial-intelligence/latest/rss').fetch(),
  'jiqizhixin':     () => new RssFetcher('https://www.jiqizhixin.com/rss').fetch(),
  'producthunt':    () => new RssFetcher('https://www.producthunt.com/feed').fetch(),
  // 'radar-ai': disabled — site returns 502
  // 'aitoday':  disabled — site returns 429 (rate limited)
  'qbitai':         () => new RssFetcher('https://www.qbitai.com/feed').fetch(),
  'aibase':         () => new GenericScraper('https://www.aibase.cn/', {
    listSelector: '.article-item, article, .post',
    titleSelector: 'h2, h3, .title',
    linkSelector: 'a',
    descSelector: 'p, .desc',
    baseUrl: 'https://www.aibase.cn',
  }).fetch(),

  // DESIGN
  'behance':        () => new RssFetcher('https://feeds.feedburner.com/behance/vorr').fetch(),
  'design-milk':    () => new RssFetcher('https://design-milk.com/feed/').fetch(),
  'creativebloq':   () => new RssFetcher('https://www.creativebloq.com/feeds/all').fetch(),
  'colossal':       () => new RssFetcher('https://www.thisiscolossal.com/feed/').fetch(),
  'designboom':     () => new RssFetcher('https://www.designboom.com/feed/').fetch(),
  'dezeen':         () => new RssFetcher('https://www.dezeen.com/feed/').fetch(),
  'thedieline':     () => new RssFetcher('https://www.thedieline.com/rss').fetch(),
  'dribbble':       () => new RssFetcher('https://dribbble.com/shots/popular.rss').fetch(),
  'zcool':          () => new GenericScraper('https://www.zcool.com.cn/top/0/0.do', {
    listSelector: '.work-list-box li, .item',
    titleSelector: '.title, h3',
    linkSelector: 'a',
    imgSelector: 'img',
    baseUrl: 'https://www.zcool.com.cn',
  }).fetch(),
  'huaban':         () => new GenericScraper('https://huaban.com/', {
    listSelector: '.pin, .item',
    titleSelector: '.text, span',
    linkSelector: 'a',
    imgSelector: 'img',
    baseUrl: 'https://huaban.com',
  }).fetch(),
  'abduzeedo':      () => new RssFetcher('https://abduzeedo.com/rss.xml').fetch(),
  'weandthecolor':  () => new RssFetcher('https://weandthecolor.com/feed').fetch(),
  'logodesignlove': () => new RssFetcher('https://www.logodesignlove.com/feed').fetch(),
  'notefolio':      () => new GenericScraper('https://notefolio.net/', {
    listSelector: '.work-item, article, li.item',
    titleSelector: '.title, h3, h2',
    linkSelector: 'a',
    imgSelector: 'img',
    baseUrl: 'https://notefolio.net',
  }).fetch(),
  'itsnicethat':    () => new RssFetcher('https://www.itsnicethat.com/rss').fetch(),
  'adobe-blog':     () => new RssFetcher('https://blog.adobe.com/feed').fetch(),
  'fastcompany-design': () => new RssFetcher('https://www.fastcompany.com/section/design/rss').fetch(),
  'print-mag':      () => new RssFetcher('https://www.printmag.com/feed/').fetch(),
  'creative-review':() => new RssFetcher('https://www.creativereview.co.uk/feed/').fetch(),
  'medium-genart':  () => new RssFetcher('https://medium.com/feed/tag/generative-art').fetch(),
  'medium-aiart':   () => new RssFetcher('https://medium.com/feed/tag/ai-art').fetch(),
  'medium-midjourney':      () => new RssFetcher('https://medium.com/feed/tag/midjourney').fetch(),
  'medium-stablediffusion': () => new RssFetcher('https://medium.com/feed/tag/stable-diffusion').fetch(),
  'medium-aiimage':         () => new RssFetcher('https://medium.com/feed/tag/ai-image-generation').fetch(),
  'medium-comfyui':         () => new RssFetcher('https://medium.com/feed/tag/comfyui').fetch(),
  'medium-genai-art':       () => new RssFetcher('https://medium.com/feed/tag/generative-ai-art').fetch(),

  // UXUI - RSS
  'ux-collective':  () => new RssFetcher('https://uxdesign.cc/feed').fetch(),
  'ux-planet':      () => new RssFetcher('https://uxplanet.org/feed').fetch(),
  'nngroup':        () => new RssFetcher('https://www.nngroup.com/feed/rss/').fetch(),
  'smashing-mag':   () => new RssFetcher('https://www.smashingmagazine.com/feed/').fetch(),
  'alistapart':     () => new RssFetcher('https://alistapart.com/main/feed/').fetch(),
  'ux-booth':       () => new RssFetcher('https://www.uxbooth.com/feed/').fetch(),
  'sidebar':        () => new RssFetcher('https://sidebar.io/feed.xml').fetch(),
  'boxes-arrows':   () => new RssFetcher('https://boxesandarrows.com/feed/').fetch(),
  'ux-mag':         () => new RssFetcher('https://uxmag.com/feed').fetch(),
  'ux-matters':     () => new RssFetcher('https://www.uxmatters.com/index.xml').fetch(),
  'uxdesignweekly': () => new RssFetcher('https://uxdesignweekly.com/feed/').fetch(),

  // UXUI - Scraper (legacy)
  'lapa-ninja':     () => new GenericScraper('https://www.lapa.ninja/category/artificial-intelligence/', {
    listSelector: '.site-card, article, .item',
    titleSelector: 'h3, h2, .title',
    linkSelector: 'a',
    imgSelector: 'img',
  }).fetch(),
  'bubbbly':        () => new GenericScraper('https://www.bubbbly.com/', {
    listSelector: 'article, .post, .card',
    titleSelector: 'h2, h3',
    linkSelector: 'a',
    imgSelector: 'img',
  }).fetch(),
  '60fps':          () => new GenericScraper('https://60fps.design/', {
    listSelector: '.item, article, li',
    titleSelector: 'h2, h3, .title',
    linkSelector: 'a',
    imgSelector: 'img',
  }).fetch(),
  'figma-community':() => new GenericScraper('https://www.figma.com/community', {
    listSelector: '[class*="resource"], article',
    titleSelector: '[class*="title"], h3',
    linkSelector: 'a',
    imgSelector: 'img',
    baseUrl: 'https://www.figma.com',
  }).fetch(),
  'aiuxpatterns':   () => new GenericScraper('https://aiuxpatterns.com/', {
    listSelector: 'article, .post, .pattern',
    titleSelector: 'h2, h3',
    linkSelector: 'a',
    imgSelector: 'img',
  }).fetch(),
  'koreawebdesign': () => new GenericScraper('https://koreawebdesign.com/', {
    listSelector: 'article, .post',
    titleSelector: 'h2, h3',
    linkSelector: 'a',
    imgSelector: 'img',
  }).fetch(),
  'siteinspire':    () => new GenericScraper('https://www.siteinspire.com/', {
    listSelector: '.site, article',
    titleSelector: 'h2, h3, .title',
    linkSelector: 'a',
    imgSelector: 'img',
  }).fetch(),
  'pageflows':      () => new GenericScraper('https://pageflows.com/', {
    listSelector: '.flow, article',
    titleSelector: 'h2, h3',
    linkSelector: 'a',
    imgSelector: 'img',
  }).fetch(),
  'mobbin':         () => new GenericScraper('https://mobbin.com/', {
    listSelector: '[class*="app"], article',
    titleSelector: '[class*="name"], h3',
    linkSelector: 'a',
    imgSelector: 'img',
  }).fetch(),
  'awwwards':       () => new GenericScraper('https://www.awwwards.com/websites/', {
    listSelector: 'li[class*="site"], article',
    titleSelector: 'h3, h2, [class*="title"]',
    linkSelector: 'a',
    imgSelector: 'img',
    baseUrl: 'https://www.awwwards.com',
  }).fetch(),

  // TECH
  'ainews':         () => new RssFetcher('https://the-decoder.com/feed/').fetch(),
  'mit-tech-review':() => new RssFetcher('https://www.technologyreview.com/topic/artificial-intelligence/feed').fetch(),
  'arstechnica':    () => new RssFetcher('https://feeds.arstechnica.com/arstechnica/index').fetch(),
  'venturebeat':    () => new RssFetcher('https://venturebeat.com/feed/').fetch(),
  'aibusiness':     () => new RssFetcher('https://aibusiness.com/rss.xml').fetch(),
  'github-trending':() => new GithubTrendingFetcher().fetch(),
  'hackernews':     () => new HackerNewsFetcher().fetch(),
  'huggingface':    () => new HuggingFaceFetcher().fetch(),
  'openrouter':     () => new GenericScraper('https://openrouter.ai/models', {
    listSelector: '[class*="model"], article, tr',
    titleSelector: '[class*="name"], h3, td',
    linkSelector: 'a',
    baseUrl: 'https://openrouter.ai',
  }).fetch(),
  'openai':         () => new RssFetcher('https://openai.com/blog/rss.xml').fetch(),
  'google-ai-dev':  () => new RssFetcher('https://developers.googleblog.com/feeds/posts/default').fetch(),
  'langchain':      () => new RssFetcher('https://blog.langchain.dev/rss/').fetch(),
  'thegradient':    () => new RssFetcher('https://thegradient.pub/rss/').fetch(),
  'towardsdatascience': () => new RssFetcher('https://towardsdatascience.com/feed').fetch(),
  'modelzoo':       () => new GenericScraper('https://modelzoo.co/', {
    listSelector: '.model-card, article',
    titleSelector: 'h3, h2, .title',
    linkSelector: 'a',
    imgSelector: 'img',
  }).fetch(),
  'arxiv-ai':       () => new RssFetcher('https://arxiv.org/rss/cs.AI').fetch(),
  'mlflow':         () => new RssFetcher('https://mlflow.org/blog/feed').fetch(),
  'kaggle':         () => new GenericScraper('https://www.kaggle.com/models', {
    listSelector: '[class*="model"], article, li',
    titleSelector: 'h3, h2, [class*="title"]',
    linkSelector: 'a',
    imgSelector: 'img',
    baseUrl: 'https://www.kaggle.com',
  }).fetch(),
}

/** Normalize a title for deduplication: lowercase, strip punctuation, collapse spaces, first 80 chars */
function normalizeTitle(title: string): string {
  // Only strip extra whitespace and lowercase — exact same title = duplicate
  return title.trim().toLowerCase().replace(/\s+/g, ' ')
}

export async function fetchByCategory(category: string) {
  const { data: sources } = await (supabaseAdmin as any)
    .from('sources')
    .select('*')
    .eq('is_active', true)
    .eq('category', category)

  if (!sources) return

  // Build dedup set from articles published in the last 2 days
  const since = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  const { data: recentArticles } = await (supabaseAdmin as any)
    .from('articles')
    .select('title')
    .gte('published_at', since)
  const existingTitles = new Set<string>(
    (recentArticles || []).map((a: any) => normalizeTitle(a.title))
  )
  console.log(`  Dedup set: ${existingTitles.size} titles from last 2 days`)

  for (const source of sources) {
    const fetcher = FETCHER_MAP[source.slug]
    if (!fetcher) continue

    console.log(`Fetching ${source.name}...`)
    try {
      const articles = await fetcher()

      await enrichWithOgImages(articles)
      await enrichWithImageSizes(articles)
      await enrichWithHnPoints(articles)

      // AI 过滤：去掉与 AI/设计/科技无关的内容
      const relevant = await filterIrrelevant(articles)
      console.log(`  AI filter: ${articles.length} → ${relevant.length} kept`)

      let saved = 0
      let dupes = 0
      const newArticleIds: number[] = []
      for (const article of relevant) {
        if (!article.url || !article.title) continue
        const norm = normalizeTitle(article.title)
        if (existingTitles.has(norm)) {
          console.log(`  ✗ duplicate: ${article.title.slice(0, 60)}`)
          dupes++
          continue
        }
        existingTitles.add(norm)
        const heatScore = calcHeatScore(article.raw_score, article.published_at)
        const newId = await saveArticle(source.id, article, heatScore)
        if (newId !== null) newArticleIds.push(newId)
        saved++
      }

      if (newArticleIds.length) {
        await translateAndPersistArticleIds(newArticleIds).catch((e: Error) =>
          console.error(`  translate persist (${source.name}):`, e.message)
        )
      }

      await (supabaseAdmin as any)
        .from('sources')
        .update({
          last_fetched_at: new Date().toISOString(),
          fetch_status: 'ok',
          error_msg: null,
        })
        .eq('id', source.id)

      console.log(`✓ ${source.name}: ${saved} saved, ${dupes} dupes skipped (${articles.length} total)`)
    } catch (err: any) {
      console.error(`✗ ${source.name}: ${err.message}`)
      await (supabaseAdmin as any)
        .from('sources')
        .update({
          last_fetched_at: new Date().toISOString(),
          fetch_status: 'error',
          error_msg: err.message?.slice(0, 500),
        })
        .eq('id', source.id)
    }
  }
}

export async function fetchAll() {
  const { data: sources } = await (supabaseAdmin as any)
    .from('sources')
    .select('*')
    .eq('is_active', true)

  if (!sources) return

  for (const source of sources) {
    const fetcher = FETCHER_MAP[source.slug]
    if (!fetcher) continue

    console.log(`Fetching ${source.name}...`)
    try {
      const articles = await fetcher()

      // 补充 og:image（对没有缩略图的文章）
      await enrichWithOgImages(articles)
      await enrichWithImageSizes(articles)

      // 用 HN Algolia 反查 points 作为热度
      await enrichWithHnPoints(articles)

      const newArticleIds: number[] = []
      for (const article of articles) {
        if (!article.url || !article.title) continue
        const heatScore = calcHeatScore(article.raw_score, article.published_at)
        const newId = await saveArticle(source.id, article, heatScore)
        if (newId !== null) newArticleIds.push(newId)
      }

      if (newArticleIds.length) {
        await translateAndPersistArticleIds(newArticleIds).catch((e: Error) =>
          console.error(`  translate persist (${source.name}):`, e.message)
        )
      }

      // 更新来源状态
      await (supabaseAdmin as any)
        .from('sources')
        .update({
          last_fetched_at: new Date().toISOString(),
          fetch_status: 'ok',
          error_msg: null,
        })
        .eq('id', source.id)

      console.log(`✓ ${source.name}: ${articles.length} articles`)
    } catch (err: any) {
      console.error(`✗ ${source.name}: ${err.message}`)
      await (supabaseAdmin as any)
        .from('sources')
        .update({
          last_fetched_at: new Date().toISOString(),
          fetch_status: 'error',
          error_msg: err.message?.slice(0, 500),
        })
        .eq('id', source.id)
    }
  }
}
