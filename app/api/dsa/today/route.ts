import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = parseInt(session.user.id)
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const snapshots = await prisma.dSASnapshot.findMany({
    where: { userId, date: today },
  })

  const profile = await prisma.dSAProfile.findUnique({ where: { userId } })
  const dailyTarget = profile?.dailyTarget ?? 5

  const totalToday = snapshots.reduce((sum, s) => sum + s.problemsSolvedToday, 0)
  const byPlatform = snapshots.map((s) => ({
    platform: s.platform,
    problemsSolvedToday: s.problemsSolvedToday,
    problemsSolvedTotal: s.problemsSolvedTotal,
    rating: s.rating,
  }))

  const lastFetched = snapshots.length > 0
    ? snapshots.reduce((latest, s) => s.createdAt > latest ? s.createdAt : latest, snapshots[0].createdAt)
    : null

  return NextResponse.json({
    date: today.toISOString(),
    totalToday,
    dailyTarget,
    progress: dailyTarget > 0 ? Math.min(100, Math.round((totalToday / dailyTarget) * 100)) : 0,
    byPlatform,
    lastFetched,
  })
}
