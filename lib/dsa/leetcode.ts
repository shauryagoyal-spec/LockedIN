export interface LeetCodeResult {
  totalSolved: number
  easySolved: number
  mediumSolved: number
  hardSolved: number
  ranking: number | null
}

const GRAPHQL_URL = 'https://leetcode.com/graphql'

const QUERY = `
  query userProfile($username: String!) {
    matchedUser(username: $username) {
      profile { ranking }
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
    }
  }
`

export async function fetchLeetCode(username: string): Promise<LeetCodeResult> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Referer: 'https://leetcode.com',
      Origin: 'https://leetcode.com',
      'User-Agent': 'Mozilla/5.0 (compatible; lockedIN/1.0)',
    },
    body: JSON.stringify({ query: QUERY, variables: { username } }),
    next: { revalidate: 0 },
  })

  if (!res.ok) throw new Error(`LeetCode API error: ${res.status}`)

  const json = await res.json()
  const user = json?.data?.matchedUser
  if (!user) throw new Error(`LeetCode user "${username}" not found`)

  const stats: { difficulty: string; count: number }[] =
    user.submitStatsGlobal?.acSubmissionNum ?? []

  const get = (d: string) => stats.find((s) => s.difficulty === d)?.count ?? 0

  return {
    totalSolved: get('All'),
    easySolved: get('Easy'),
    mediumSolved: get('Medium'),
    hardSolved: get('Hard'),
    ranking: user.profile?.ranking ?? null,
  }
}
