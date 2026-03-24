import { NextRequest, NextResponse } from 'next/server'
import { fetchByCategory } from '../../../../fetchers/index'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = authHeader?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await fetchByCategory('uxui')
  return NextResponse.json({ ok: true, message: 'Fetched: uxui' })
}
