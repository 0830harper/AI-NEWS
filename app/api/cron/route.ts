import { NextRequest, NextResponse } from 'next/server'
import { fetchAll } from '../../../fetchers/index'

// GET: Vercel 自动定时触发
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = authHeader?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  fetchAll()
  return NextResponse.json({ ok: true, message: 'Fetch started' })
}

// POST: 手动触发
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') || new URL(req.url).searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  fetchAll()
  return NextResponse.json({ ok: true, message: 'Fetch started' })
}
