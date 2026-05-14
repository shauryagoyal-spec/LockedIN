export interface CSESResult {
  totalSolved: number
}

export async function fetchCSES(username: string): Promise<CSESResult> {
  const res = await fetch(`https://cses.fi/user/${encodeURIComponent(username)}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; lockedIN/1.0)',
      Accept: 'text/html',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    next: { revalidate: 0 },
  })

  if (!res.ok) throw new Error(`CSES fetch error: ${res.status}`)

  const html = await res.text()

  // CSES profile page shows solved count in various formats
  const match =
    html.match(/(\d+)\s*\/\s*\d+\s*tasks?/i) ??
    html.match(/Tasks solved[^<]*<[^>]*>\s*(\d+)/) ??
    html.match(/<b>(\d+)<\/b>\s*\/\s*\d+/)
  const totalSolved = match ? parseInt(match[1]) : 0

  return { totalSolved }
}
