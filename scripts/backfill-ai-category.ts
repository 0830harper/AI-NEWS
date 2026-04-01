import { supabaseAdmin } from '../lib/supabase'

const AI_CONCURRENCY = 20
const AI_TIMEOUT_MS = 8000
const BATCH_SIZE = 100

async function classifyArticle(title: string, description?: string | null): Promise<string> {
  const apiKey = process.env.SILICONFLOW_API_KEY
  if (!apiKey) return 'tech' // fallback

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
- app: New AI tools, apps, product launches, AI workflows, automation tools, new websites/platforms, product use cases, AI application scenarios
- design: AIGC visual cases, AI-generated art, AI artists, creative expression, generative art, visual creation, creative design tools
- uxui: Product design, user experience, interface interaction, AI product UI cases, interaction design, design systems, usability research
- tech: AI model capabilities, AI research papers, model releases, AI company news, AI engineering, development tools, technical breakthroughs, AI policy
- irrelevant: sports, cooking, weather, celebrity gossip, traditional automotive, real estate, finance unrelated to AI, politics unrelated to AI

Reply with ONLY one word: app, design, uxui, tech, or irrelevant.

Article: ${text}`,
        }],
        max_tokens: 10,
        temperature: 0,
      }),
    })
    clearTimeout(timer)
    if (!res.ok) return 'tech'
    const data = await res.json()
    const reply = (data.choices?.[0]?.message?.content ?? '').trim().toLowerCase()
    if (reply.includes('irrelevant')) return 'irrelevant'
    if (reply.includes('app')) return 'app'
    if (reply.includes('design')) return 'design'
    if (reply.includes('uxui') || reply.includes('ux')) return 'uxui'
    if (reply.includes('tech')) return 'tech'
    return 'tech'
  } catch {
    return 'tech'
  }
}

async function main() {
  // 获取所有没有 ai_category 的文章
  const { count } = await supabaseAdmin
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .is('ai_category', null)

  console.log(`共 ${count} 篇文章需要补分类`)

  let processed = 0
  let offset = 0

  while (true) {
    const { data: articles } = await supabaseAdmin
      .from('articles')
      .select('id, title, description')
      .is('ai_category', null)
      .range(offset, offset + BATCH_SIZE - 1)

    if (!articles || articles.length === 0) break

    // 并发分类
    for (let i = 0; i < articles.length; i += AI_CONCURRENCY) {
      const chunk = articles.slice(i, i + AI_CONCURRENCY)
      const labels = await Promise.all(
        chunk.map(a => classifyArticle(a.title, a.description))
      )

      // 批量更新
      await Promise.all(chunk.map((article, idx) =>
        supabaseAdmin
          .from('articles')
          .update({ ai_category: labels[idx] })
          .eq('id', article.id)
      ))

      processed += chunk.length
      const cats = labels.reduce((acc, l) => { acc[l] = (acc[l] || 0) + 1; return acc }, {} as Record<string, number>)
      console.log(`[${processed}/${count}] ${JSON.stringify(cats)}`)
    }

    // 因为每次都查 ai_category IS NULL，处理完后 offset 不需要移动
    // 直接继续查剩余未处理的
  }

  console.log(`\n✅ 全部完成！共补充分类 ${processed} 篇`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
