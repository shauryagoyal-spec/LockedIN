import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDayNumber, getDaysRemaining } from '@/lib/utils'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    date: new Date().toISOString(),
    dayNumber: getDayNumber(),
    daysRemaining: getDaysRemaining(),
    dsaToday: null,
    gymToday: null,
    score: null,
  })
}
