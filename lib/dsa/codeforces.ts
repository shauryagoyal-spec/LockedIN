export interface CodeforcesResult {
  rating: number | null
  maxRating: number | null
  rank: string | null
  totalSolved: number
  todayAC: number
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
  const submissions: {
    verdict: string
    creationTimeSeconds: number
    problem: { contestId?: number; index: string; name: string }
  }[] = statusJson.result

  const problemKey = (s: typeof submissions[0]) =>
    `${s.problem.contestId ?? 'gym'}-${s.problem.index}`

  // Count unique AC problems
  const acProblems = new Set(
    submissions.filter((s) => s.verdict === 'OK').map(problemKey)
  )

  // Today's AC (UTC)
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)
  const todayStartSec = todayStart.getTime() / 1000

  const todayAcProblems = new Set(
    submissions
      .filter((s) => s.verdict === 'OK' && s.creationTimeSeconds >= todayStartSec)
      .map(problemKey)
  )

  return {
    rating: user.rating ?? null,
    maxRating: user.maxRating ?? null,
    rank: user.rank ?? null,
    totalSolved: acProblems.size,
    todayAC: todayAcProblems.size,
  }
}
