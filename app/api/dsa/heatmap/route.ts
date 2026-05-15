import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = parseInt(session.user.id)
  const { searchParams } = new URL(req.url)

  let days: number
  if (searchParams.has('days')) {
    days = parseInt(searchParams.get('days')!)
  } else {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { lockInDays: true } })
    days = user?.lockInDays ?? 30
  }

  const since = new Date()
  since.setUTCDate(since.getUTCDate() - days)
  since.setUTCHours(0, 0, 0, 0)

  const snapshots = await prisma.dSASnapshot.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: 'asc' },
  })

  const grouped: Record<string, number> = {}
  for (const s of snapshots) {
    const key = s.date.toISOString().split('T')[0]
    grouped[key] = (grouped[key] ?? 0) + s.problemsSolvedToday
  }

  const result = Object.entries(grouped).map(([date, problemsSolved]) => ({
    date,
    problemsSolved,
  }))

  // Return a plain array — the DSA page does Array.isArray() on this response
  return NextResponse.json(result)
}
