export interface CFSubmission {
  problemId: string
  problemTitle: string
  tags: string[]
  difficulty: number | null
  status: 'ac' | 'wa'
  submittedAt: Date
}

export interface CodeforcesResult {
  rating: number | null
  maxRating: number | null
  rank: string | null
  totalSolved: number
  todayAC: number
  submissions: CFSubmission[]
}

export async function fetchCodeforces(handle: string): Promise<CodeforcesResult> {
  const [infoRes, statusRes] = await Promise.all([
    fetch(`https://codeforces.com/api/user.info?handles=${handle}`, { next: { revalidate: 0 } }),
    fetch(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=10000`, {
      next: { revalidate: 0 },
    }),
  ])

  if (!infoRes.ok) throw new Error(`CF user.info error: ${infoRes.status}`)
  if (!statusRes.ok) throw new Error(`CF user.status error: ${statusRes.status}`)

  const infoJson = await infoRes.json()
  const statusJson = await statusRes.json()

  if (infoJson.status !== 'OK') throw new Error(`CF: ${infoJson.comment}`)
  if (statusJson.status !== 'OK') throw new Error(`CF: ${statusJson.comment}`)

  const user = infoJson.result[0]
  const rawSubs: {
    verdict: string
    creationTimeSeconds: number
    problem: { contestId?: number; index: string; name: string; rating?: number; tags?: string[] }
  }[] = statusJson.result

  const problemKey = (s: typeof rawSubs[0]) =>
    `${s.problem.contestId ?? 'gym'}-${s.problem.index}`

  // Today's boundary in UTC (CF timestamps are UTC)
  const todayUTCStart = new Date()
  todayUTCStart.setUTCHours(0, 0, 0, 0)
  const todayStartSec = todayUTCStart.getTime() / 1000

  // Unique AC problems (for total count)
  const acProblems = new Set(
    rawSubs.filter((s) => s.verdict === 'OK').map(problemKey)
  )

  // Unique AC problems today
  const todayAcProblems = new Set(
    rawSubs
      .filter((s) => s.verdict === 'OK' && s.creationTimeSeconds >= todayStartSec)
      .map(problemKey)
  )

  // Build submission list — one entry per unique problem, keeping the latest submission
  const seenProblems = new Map<string, CFSubmission>()
  for (const s of rawSubs) {
    const key = problemKey(s)
    const isAC = s.verdict === 'OK'
    const entry: CFSubmission = {
      problemId: key,
      problemTitle: s.problem.name,
      tags: s.problem.tags ?? [],
      difficulty: s.problem.rating ?? null,
      status: isAC ? 'ac' : 'wa',
      submittedAt: new Date(s.creationTimeSeconds * 1000),
    }
    const existing = seenProblems.get(key)
    // Prefer AC over WA; among same verdict prefer newer
    if (!existing || (isAC && existing.status !== 'ac') || entry.submittedAt > existing.submittedAt) {
      seenProblems.set(key, entry)
    }
  }

  return {
    rating: user.rating ?? null,
    maxRating: user.maxRating ?? null,
    rank: user.rank ?? null,
    totalSolved: acProblems.size,
    todayAC: todayAcProblems.size,
    submissions: Array.from(seenProblems.values()),
  }
}
