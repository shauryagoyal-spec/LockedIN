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
  const days = parseInt(searchParams.get('days') ?? '57')

  const since = new Date()
  since.setDate(since.getDate() - days)
  since.setHours(0, 0, 0, 0)

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

  return NextResponse.json(result)
}
