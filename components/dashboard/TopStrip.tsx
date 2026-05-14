'use client'

import { Plus } from 'lucide-react'

interface TopStripProps {
  /** Formatted "Tuesday, 28 May" */
  dayLabel: string
  dayNumber: number
  daysRemaining: number
  icpcDaysAway?: number
  score: number | null
  streak: number
  /** Score delta vs goal pace, e.g. "-13" or "+4" */
  pace: number
  onQuickLog?: () => void
}

/** The persistent header on the dashboard — date on the left, KPIs and
 *  a quick-log CTA on the right. */
export default function TopStrip({
  dayLabel,
  dayNumber,
  daysRemaining,
  icpcDaysAway,
  score,
  streak,
  pace,
  onQuickLog,
}: TopStripProps) {
  const scoreAlert = score !== null && score < 60
  const paceAlert = pace < 0
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 px-4 py-5 md:px-8"
      style={{ background: 'linear-gradient(180deg, rgba(255,91,31,0.04), transparent)' }}
    >
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-white md:text-2xl">{dayLabel}</h1>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-gray-500">
          Day {String(dayNumber).padStart(2, '0')} · {daysRemaining} left
          {icpcDaysAway != null ? ` · ICPC in ${icpcDaysAway}` : ''}
        </p>
      </div>

      <div className="flex items-center gap-5">
        <KPI label="Score" value={score === null ? '--' : String(score)} hint="/100" alert={scoreAlert} />
        <KPI label="Streak" value={streak} hint="d" />
        <KPI
          label="Pace"
          value={pace > 0 ? `+${pace}` : String(pace)}
          hint="vs goal"
          alert={paceAlert}
        />
        <button
          onClick={onQuickLog}
          className="flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-brand-glow transition-transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus size={14} /> Quick log
        </button>
      </div>
    </div>
  )
}

function KPI({
  label,
  value,
  hint,
  alert,
}: {
  label: string
  value: string | number
  hint: string
  alert?: boolean
}) {
  return (
    <div className="flex min-w-[60px] flex-col items-end">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <div className="flex items-baseline gap-1">
        <span
          className={`text-base font-bold md:text-lg ${alert ? 'text-brand-500' : 'text-white'}`}
        >
          {value}
        </span>
        <span className="font-mono text-[10px] text-gray-500">{hint}</span>
      </div>
    </div>
  )
}
