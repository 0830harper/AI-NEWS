import { NextRequest, NextResponse } from 'next/server'
import { fetchAll } from '../../../fetchers/index'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  fetchAll() // 不 await，立即返回
  return NextResponse.json({ ok: true, message: 'Fetch started' })
}
