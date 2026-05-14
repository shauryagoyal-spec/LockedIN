'use client'

import type { HeatmapDay } from '@/types/dashboard'

interface Heatmap57Props {
  data: HeatmapDay[]
  /** Highlight today's cell with a ring. */
  todayIndex?: number
  cell?: number
  gap?: number
}

function scoreColor(s: number | null): string {
  if (s == null) return '#141416'
  if (s < 30) return '#3a1b0a'
  if (s < 60) return '#9c3a15'
  if (s < 80) return '#e64f1a'
  return '#ff7a45'
}

/** 57-day vacation heatmap, GitHub-style. 9 cols × 7 rows = 63 cells —
 *  the trailing 6 are rendered transparent so the row stays square. */
export default function Heatmap57({ data, todayIndex, cell = 16, gap = 4 }: Heatmap57Props) {
  // Pad to 63 with nulls so the grid always reads cleanly.
  const cells = [...data.slice(0, 57)]
  while (cells.length < 63) {
    cells.push({ day: cells.length + 1, score: null, date: '' })
  }
  return (
    <div
      className="grid"
      style={{
        gridTemplateRows: `repeat(7, ${cell}px)`,
        gridTemplateColumns: `repeat(9, ${cell}px)`,
        gridAutoFlow: 'column',
        gap,
      }}
    >
      {cells.map((d, i) => {
        const isOver = i >= 57
        const isToday = todayIndex === i
        return (
          <div
            key={i}
            title={d.date ? `Day ${d.day} · ${d.date} · ${d.score ?? 'no log'}` : ''}
            className="rounded-[3px]"
            style={{
              width: cell,
              height: cell,
              background: isOver ? 'transparent' : scoreColor(d.score),
              boxShadow: isToday ? 'inset 0 0 0 1.5px #ff5b1f' : 'none',
            }}
          />
        )
      })}
    </div>
  )
}
