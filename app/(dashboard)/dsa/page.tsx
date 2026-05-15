'use client'

// app/(dashboard)/dsa/page.tsx
// New DSA Tracker page — athletic dark theme, orange accent.
// Drop-in replacement for the existing app/(dashboard)/dsa/page.tsx.
//
// Backend dependencies (all already exist except /api/dsa/summary):
//   GET  /api/dsa/profile        → DSAProfile
//   GET  /api/dsa/today          → { totalToday, dailyTarget, byPlatform, lastFetched }
//   GET  /api/dsa/heatmap?days=57 → [{ date, problemsSolved }]
//   POST /api/dsa/fetch-now      → triggers all-platform sync
//   GET  /api/dsa/summary        → { streak, topics, recent, nextContest }   (NEW — see api-summary-route.ts)

import { useEffect, useMemo, useState } from 'react'
import { Code2, RefreshCw, Flame, ArrowUp, ArrowDown, Sparkles, Check, X } from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import Heatmap57 from '@/components/dashboard/Heatmap57'
import type { HeatmapDay } from '@/types/dashboard'

// ───────────────────────── types ─────────────────────────

interface DSAProfile {
  userId: number
  lcUsername: string | null
  cfHandle: string | null
  ccUsername: string | null
  csesUsername: string | null
  dailyTarget: number
  targetCfRating: number | null
}

interface Platform {
  platform: string
  problemsSolvedToday: number
  problemsSolvedTotal: number
  rating: number | null
}

interface TodayPayload {
  totalToday: number
  dailyTarget: number
  byPlatform: Platform[]
  lastFetched: string | null
}

interface TopicRow {
  name: string
  solved: number
  isWeak: boolean
}

interface RecentRow {
  status: 'ac' | 'wa'
  title: string
  platform: string
  difficulty: string | null
  tag: string | null
  ago: string
}

interface SummaryPayload {
  streak: { current: number; best: number }
  topics: TopicRow[]
  recent: RecentRow[]
  nextContest: {
    name: string
    startsAt: string  // ISO
    durationMin: number
    ratingChanging: boolean
    daysSinceLast: number | null
  } | null
}

// ───────────────────────── helpers ─────────────────────────

const PLATFORM_META: Record<string, { name: string; short: string; color: string }> = {
  leetcode:   { name: 'LeetCode',    short: 'LC', color: '#ffa116' },
  codeforces: { name: 'Codeforces',  short: 'CF', color: '#3b9eff' },
  codechef:   { name: 'CodeChef',    short: 'CC', color: '#8a6d3b' },
  cses:       { name: 'CSES',        short: 'CS', color: '#5bd06b' },
}

function fmtRelativeContest(iso: string): { label: string; sub: string } {
  const d = new Date(iso)
  const day = d.toLocaleDateString('en-US', { weekday: 'long' })
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  return { label: `${day} ${time}`, sub: '' }
}

// ───────────────────────── page ─────────────────────────

export default function DSAPage() {
  const [profile, setProfile] = useState<DSAProfile | null>(null)
  const [today, setToday] = useState<TodayPayload | null>(null)
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([])
  const [summary, setSummary] = useState<SummaryPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [fetchMsg, setFetchMsg] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/dsa/profile').then(r => r.json()),
      fetch('/api/dsa/today').then(r => r.json()),
      fetch('/api/dsa/heatmap').then(r => r.json()),
      fetch('/api/dsa/summary').then(r => (r.ok ? r.json() : null)),
    ])
      .then(([p, t, h, s]) => {
        setProfile(p)
        setToday(t)
        const lockInDays: number = h?.days ?? 30
        const rawDays: { date: string; problemsSolved: number }[] = Array.isArray(h?.data) ? h.data : []
        const byDate = Object.fromEntries(rawDays.map((d: { date: string; problemsSolved: number }) => [d.date, d.problemsSolved]))
        const target = (p?.dailyTarget ?? 5) || 5
        const out: HeatmapDay[] = []
        for (let i = lockInDays - 1; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const iso = d.toISOString().slice(0, 10)
          const solved = byDate[iso]
          out.push({
            day: lockInDays - i,
            date: iso,
            score: solved != null ? Math.min(100, Math.round((solved / target) * 100)) : null,
          })
        }
        setHeatmap(out)
        setSummary(s)
      })
      .finally(() => setLoading(false))
  }, [])

  const totalAll = today?.byPlatform.reduce((a, p) => a + p.problemsSolvedTotal, 0) ?? 0
  const target = today?.dailyTarget ?? profile?.dailyTarget ?? 5
  const solved = today?.totalToday ?? 0
  const pct = Math.min(100, target > 0 ? (solved / target) * 100 : 0)
  const hit = pct >= 100

  async function triggerFetch() {
    setFetching(true)
    setFetchMsg('')
    try {
      const res = await fetch('/api/dsa/fetch-now', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) setFetchMsg(data.error ?? 'Fetch failed')
      else {
        setFetchMsg(`Synced · ${data.totalSolvedToday} solved today`)
        // refresh today + heatmap after sync
        const [t, h] = await Promise.all([
          fetch('/api/dsa/today').then(r => r.json()),
          fetch('/api/dsa/heatmap').then(r => r.json()),
        ])
        setToday(t)
        const rawDays: { date: string; problemsSolved: number }[] = Array.isArray(h?.data) ? h.data : []
        const byDate = Object.fromEntries(rawDays.map((d: { date: string; problemsSolved: number }) => [d.date, d.problemsSolved]))
        setHeatmap(prev => prev.map(c => ({
          ...c,
          score: byDate[c.date] != null
            ? Math.min(100, Math.round((byDate[c.date] / target) * 100))
            : c.score,
        })))
      }
    } catch (e) {
      setFetchMsg(String(e))
    }
    setFetching(false)
  }

  if (loading) return <LoadingSpinner text="Loading DSA tracker..." />

  return (
    <div className="-m-4 md:-m-8">
      {/* TOP STRIP */}
      <div className="flex items-center justify-between border-b border-line px-6 py-5 md:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <Code2 size={22} className="text-brand-500" />
            <h1 className="text-2xl font-extrabold tracking-tight text-white">DSA Tracker</h1>
          </div>
          <p className="mt-1 font-mono text-[11px] tracking-widest text-ink-subtle">
            {totalAll} TOTAL · 4 PLATFORMS · AUTO-FETCH @ 00:00
          </p>
        </div>
        <button
          onClick={triggerFetch}
          disabled={fetching}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2.5 text-sm font-bold text-white shadow-brand-glow transition hover:bg-brand-600 disabled:opacity-50"
        >
          <RefreshCw size={14} className={fetching ? 'animate-spin' : ''} />
          {fetching ? 'Fetching…' : 'Trigger fetch'}
        </button>
      </div>

      <div className="flex flex-col gap-5 p-6 md:p-8">

        {/* HERO */}
        <section className="relative overflow-hidden rounded-2xl border border-[#2a1812] bg-gradient-to-br from-[#1a0f08] to-[#0e0a08] p-7">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full" style={{
            background: 'radial-gradient(circle, rgba(255,91,31,0.16), transparent 60%)',
          }} />
          <div className="relative grid grid-cols-1 gap-7 md:grid-cols-[1fr_280px]">
            <div>
              <div className="font-mono text-[11px] tracking-[0.2em] text-brand-500">TODAY&apos;S TARGET</div>
              <div className="mt-2 flex items-end gap-3.5">
                <div className="text-[100px] font-black leading-[0.85] tracking-[-0.04em]">{solved}</div>
                <div className="pb-3.5 text-[28px] font-bold text-ink-subtle">/ {target}</div>
                <div className="ml-2 pb-4">
                  <div className="font-mono text-[11px] tracking-wider text-ink-subtle">PROBLEMS SOLVED</div>
                  <div className={`mt-0.5 text-sm font-semibold ${hit ? 'text-[#5bd06b]' : 'text-brand-500'}`}>
                    {hit ? '✓ Target hit' : `${Math.max(0, target - solved)} to go`}
                  </div>
                </div>
              </div>
              <div className="mt-4 h-2 max-w-[540px] overflow-hidden rounded-full bg-[#241612]">
                <div
                  className="h-full transition-[width] duration-500"
                  style={{
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg, #ff5b1f, #ff7a45)',
                  }}
                />
              </div>
            </div>

            <div className="relative flex flex-col justify-between gap-6">
              <div>
                <div className="font-mono text-[11px] tracking-[0.2em] text-ink-subtle">STREAK</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <Flame size={32} className="text-brand-500" />
                  <div className="text-5xl font-extrabold leading-none tracking-tight">
                    {summary?.streak.current ?? 0}
                  </div>
                  <div className="text-sm text-ink-subtle">days</div>
                </div>
              </div>
              <div>
                <div className="mb-2.5 font-mono text-[10px] tracking-widest text-ink-subtle">LAST {heatmap.length} DAYS</div>
                <Heatmap57 data={heatmap} cell={14} gap={3} />
              </div>
            </div>
          </div>
        </section>

        {/* PLATFORMS */}
        <section>
          <div className="mb-3.5 flex items-center justify-between">
            <h2 className="text-base font-bold">Platforms</h2>
            <div className="font-mono text-[11px] tracking-wider text-ink-subtle">
              {today?.lastFetched
                ? `SYNCED ${new Date(today.lastFetched).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'NOT YET SYNCED'}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {(today?.byPlatform ?? []).map(p => {
              const meta = PLATFORM_META[p.platform] ?? { name: p.platform, short: p.platform.slice(0, 2).toUpperCase(), color: '#888' }
              return (
                <div key={p.platform} className="relative overflow-hidden rounded-2xl border border-line bg-surface-2 p-4.5 p-[18px]">
                  <div className="flex items-center justify-between">
                    <div
                      className="grid h-7 w-7 place-items-center rounded-lg font-mono text-xs font-bold"
                      style={{ background: meta.color + '22', color: meta.color }}
                    >
                      {meta.short}
                    </div>
                    {p.problemsSolvedToday > 0 && (
                      <span className="rounded-full bg-brand-500/12 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-brand-500">
                        +{p.problemsSolvedToday} TODAY
                      </span>
                    )}
                  </div>
                  <div className="mt-3.5 text-[13px] font-semibold text-ink-muted">{meta.name}</div>
                  <div className="mt-1 flex items-end gap-2">
                    <div className="text-[28px] font-extrabold leading-none">{p.problemsSolvedTotal}</div>
                    <div className="pb-1 text-[11px] text-ink-subtle">solved</div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                    <div>
                      <div className="font-mono text-[9px] tracking-wider text-ink-subtle">RATING</div>
                      <div className="mt-0.5 text-sm font-bold">{p.rating ?? '—'}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* TOPICS + RECENT */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
          <TopicCoverage topics={summary?.topics ?? []} />
          <RecentSubmissions recent={summary?.recent ?? []} />
        </section>

        {/* CONTEST */}
        {summary?.nextContest && (
          <ContestCard contest={summary.nextContest} targetRating={profile?.targetCfRating ?? null} />
        )}

        {fetchMsg && (
          <div className="rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-xs text-ink-muted">
            {fetchMsg}
          </div>
        )}
      </div>
    </div>
  )
}

// ───────────────────────── pieces ─────────────────────────

function TopicCoverage({ topics }: { topics: TopicRow[] }) {
  const sorted = useMemo(() => [...topics].sort((a, b) => b.solved - a.solved), [topics])
  const weakest = sorted.filter(t => t.isWeak).slice(0, 2)

  return (
    <div className="rounded-2xl border border-line bg-surface-2 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-bold">Topic coverage</div>
          <div className="mt-0.5 text-[11px] text-ink-subtle">Submissions till date</div>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-line-2 px-3 py-1.5 text-[11px] font-semibold text-ink-muted hover:text-white">
          <Sparkles size={11} /> Analyze with AI
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="py-6 text-center text-sm text-ink-subtle">
          No submissions yet. Trigger a fetch to populate topics.
        </div>
      ) : (
        <div className="flex flex-col">
          {sorted.map((t, i) => (
            <div
              key={t.name}
              className={`grid grid-cols-[1fr_auto_50px] items-center gap-4 py-2.5 text-sm ${
                i < sorted.length - 1 ? 'border-b border-line' : ''
              }`}
            >
              <div className="font-semibold text-ink-muted">{t.name}</div>
              <div className="text-right font-mono text-sm font-bold">{t.solved}</div>
              <div
                className={`text-right font-mono text-[10px] font-bold tracking-wider ${
                  t.isWeak ? 'text-brand-500' : 'text-[#5bd06b]'
                }`}
              >
                {t.isWeak ? 'WEAK' : 'OK'}
              </div>
            </div>
          ))}
        </div>
      )}

      {weakest.length > 0 && (
        <div className="mt-3 rounded-lg border border-brand-500/20 bg-brand-500/[0.06] p-3 text-xs leading-relaxed">
          <span className="font-mono text-[10px] font-bold tracking-wider text-brand-500">FOCUS NEXT →</span>{' '}
          {weakest.map(w => `${w.name} (${w.solved} solved)`).join(' and ')} — pick one in your next session.
        </div>
      )}
    </div>
  )
}

function RecentSubmissions({ recent }: { recent: RecentRow[] }) {
  return (
    <div className="rounded-2xl border border-line bg-surface-2 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-bold">Recent submissions</div>
        <div className="font-mono text-[11px] tracking-wider text-ink-subtle">LAST {recent.length || 0}</div>
      </div>
      {recent.length === 0 ? (
        <div className="py-6 text-center text-sm text-ink-subtle">No recent submissions.</div>
      ) : (
        <div className="flex flex-col">
          {recent.map((r, i) => (
            <div
              key={i}
              className={`grid grid-cols-[24px_1fr_auto] items-center gap-3 py-2.5 ${
                i < recent.length - 1 ? 'border-b border-line' : ''
              }`}
            >
              <div
                className={`grid h-[18px] w-[18px] place-items-center rounded font-mono text-[10px] font-bold ${
                  r.status === 'ac' ? 'bg-[#5bd06b]/15 text-[#5bd06b]' : 'bg-red-500/15 text-red-500'
                }`}
              >
                {r.status === 'ac' ? <Check size={11} /> : <X size={11} />}
              </div>
              <div>
                <div className="text-[13px] font-medium">{r.title}</div>
                <div className="mt-0.5 font-mono text-[10px] tracking-wider text-ink-subtle">
                  {r.platform.toUpperCase()}
                  {r.difficulty ? ` · ${r.difficulty}` : ''}
                  {r.tag ? ` · ${r.tag}` : ''}
                </div>
              </div>
              <div className="font-mono text-[11px] text-ink-subtle">{r.ago}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ContestCard({
  contest,
  targetRating,
}: {
  contest: NonNullable<SummaryPayload['nextContest']>
  targetRating: number | null
}) {
  const { label } = fmtRelativeContest(contest.startsAt)
  const hours = Math.floor(contest.durationMin / 60)
  const mins = contest.durationMin % 60
  return (
    <section className="grid grid-cols-1 items-center gap-6 rounded-2xl border border-line bg-surface-2 p-5 md:grid-cols-[1fr_auto]">
      <div>
        <div className="font-mono text-[11px] tracking-[0.2em] text-brand-500">NEXT CONTEST</div>
        <div className="mt-1.5 text-xl font-extrabold">{contest.name}</div>
        <div className="mt-1 text-[13px] text-ink-subtle">
          {label} · {hours}h {mins ? `${mins}m` : ''} {contest.ratingChanging && '· Rating-changing'}
        </div>
        {contest.daysSinceLast != null && (
          <div className="mt-2.5 text-xs leading-relaxed text-ink-subtle">
            <span className="font-semibold text-brand-500">{contest.daysSinceLast} days since last round.</span>
            {targetRating ? ` Target ${targetRating} next.` : ''}
          </div>
        )}
      </div>
      <button className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2.5 text-sm font-bold text-white shadow-brand-glow transition hover:bg-brand-600">
        Set reminder →
      </button>
    </section>
  )
}
