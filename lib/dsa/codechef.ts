export interface CodeChefResult {
  rating: number | null
  stars: string | null
  totalSolved: number
  globalRank: number | null
}

export async function fetchCodeChef(username: string): Promise<CodeChefResult> {
  // CodeChef public API (unofficial but stable)
  const res = await fetch(`https://www.codechef.com/users/${username}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; lockedIN/1.0)',
      Accept: 'text/html',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    next: { revalidate: 0 },
  })

  if (!res.ok) throw new Error(`CodeChef fetch error: ${res.status}`)

  const html = await res.text()

  // Rating — multiple possible JSON shapes in the page
  const ratingMatch = html.match(/"currentRating"\s*:\s*(\d+)/) ?? html.match(/rating['":\s]+(\d{3,4})/)
  const rating = ratingMatch ? parseInt(ratingMatch[1]) : null

  // Stars
  const starsMatch = html.match(/(\d)\s*[★*]/)
  const stars = starsMatch ? `${starsMatch[1]}★` : null

  // Total problems solved — try multiple patterns
  const solvedMatch =
    html.match(/(\d+)\s*<\/span>\s*<span[^>]*>Problems Solved/) ??
    html.match(/Problems Solved[^<]*<[^>]*>\s*(\d+)/) ??
    html.match(/"totalSolved"\s*:\s*(\d+)/) ??
    html.match(/(\d+)\s*problems?\s*solved/i)
  const totalSolved = solvedMatch ? parseInt(solvedMatch[1]) : 0

  // Global rank
  const rankMatch = html.match(/"globalRank"\s*:\s*(\d+)/)
  const globalRank = rankMatch ? parseInt(rankMatch[1]) : null

  return { rating, stars, totalSolved, globalRank }
}
