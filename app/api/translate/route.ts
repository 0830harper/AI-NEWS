import { NextRequest, NextResponse } from 'next/server'

const CONCURRENCY = 8

async function translateOne(id: number, title: string, description: string | null) {
  const apiKey = process.env.SILICONFLOW_API_KEY
  if (!apiKey) return { id, title, description }

  const hasDesc = description && description.trim().length > 0
  const content = hasDesc ? `标题：${title}\n描述：${description}` : `标题：${title}`

  try {
    const res = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'Qwen/Qwen2.5-7B-Instruct',
        messages: [{
          role: 'user',
          content: `请将以下内容翻译成简体中文，保持原意简洁，只输出翻译结果，格式与输入一致：\n\n${content}`,
        }],
        max_tokens: 300,
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(8000),
    })
    const data = await res.json()
    const reply: string = data.choices?.[0]?.message?.content?.trim() || ''

    const titleMatch = reply.match(/标题：(.+?)(?:\n|$)/)
    const descMatch = reply.match(/描述：(.+?)(?:\n|$)/)

    return {
      id,
      title: titleMatch?.[1]?.trim() || title,
      description: hasDesc ? (descMatch?.[1]?.trim() || description) : description,
    }
  } catch {
    return { id, title, description }
  }
}

export async function POST(req: NextRequest) {
  const { articles } = await req.json()
  if (!Array.isArray(articles) || !articles.length) {
    return NextResponse.json({ translations: [] })
  }

  const translations: any[] = []
  for (let i = 0; i < articles.length; i += CONCURRENCY) {
    const batch = articles.slice(i, i + CONCURRENCY)
    const results = await Promise.allSettled(
      batch.map((a: any) => translateOne(a.id, a.title, a.description))
    )
    results.forEach((r, j) => {
      translations.push(r.status === 'fulfilled' ? r.value : batch[j])
    })
  }

  return NextResponse.json({ translations })
}
