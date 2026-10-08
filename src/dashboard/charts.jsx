import { useEffect, useId, useRef, useState } from 'react'
import Icon from './Icon'
import { dayLabel, daysInMonth } from './dateUtils'
import { formatMoney, formatMoneyShort, niceScale } from './calc'

const PALETTE = ['#2f6df6', '#f5a524', '#10c27a', '#f43f5e', '#8b5cf6', '#14b8a6', '#ec4899', '#94a3b8']

function useWidth(initial) {
  const ref = useRef(null)
  const [width, setWidth] = useState(initial)
  useEffect(() => {
    if (!ref.current || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, width]
}

// Sales bars + a line through the bar tops. One bar per order date.
// With no data it draws the empty axes for the month with the message on top.
export function SalesOverviewChart({ data, month, emptyText }) {
  const [ref, measured] = useWidth(640)
  const gid = useId().replace(/:/g, '')
  const width = Math.max(measured, 280)
  const height = width < 600 ? 220 : 178
  const empty = data.length === 0

  const scale = empty ? { max: 20000, ticks: [0, 5000, 10000, 15000, 20000] } : niceScale(Math.max(0, ...data.map((d) => d.sales)))
  const { max, ticks } = scale
  const labelWidth = Math.max(...ticks.map((t) => formatMoneyShort(t).length)) * 7 + 10
  const m = { top: 14, right: 18, bottom: 34, left: labelWidth + 10 }
  const iw = width - m.left - m.right
  const ih = height - m.top - m.bottom
  const y = (v) => m.top + ih - (v / max) * ih

  // x positions: one per order date, or fixed day ticks when empty
  const last = month ? daysInMonth(month) : 31
  const emptyDays = [1, 5, 10, 15, 20, 25, last]
  const band = empty ? iw / emptyDays.length : iw / data.length
  const x = (i) => m.left + band * i + band / 2
  const emptyX = (d) => m.left + ((d - 1) / (last - 1)) * iw
  const barW = Math.min(56, band * 0.5)
  const labelStep = Math.max(1, Math.ceil(46 / band)) // thin out date labels on narrow screens
  const points = data.map((d, i) => `${x(i)},${y(d.sales)}`).join(' ')

  return (
    <div ref={ref} className="db-chart">
      <svg width={width} height={height} role="img" aria-label="Monthly sales by order date">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3b82f6" />
            <stop offset="1" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={m.left} x2={width - m.right} y1={y(t)} y2={y(t)} className="db-grid" />
            <text x={m.left - 8} y={y(t) + 4} textAnchor="end" className="db-axis">{formatMoneyShort(t)}</text>
          </g>
        ))}
        {empty && emptyDays.map((d) => (
          <g key={d}>
            <line x1={emptyX(d)} x2={emptyX(d)} y1={m.top} y2={m.top + ih} className="db-grid" />
            <text x={emptyX(d)} y={height - 12} textAnchor="middle" className="db-axis">{dayLabel(`${month.slice(0, 8)}${String(d).padStart(2, '0')}`)}</text>
          </g>
        ))}
        {data.map((d, i) => (
          <rect key={d.date} x={x(i) - barW / 2} y={y(d.sales)} width={barW}
                height={Math.max(0, m.top + ih - y(d.sales))} rx="3" fill={`url(#${gid})`}>
            <title>{`${dayLabel(d.date)}: ${formatMoney(d.sales)}`}</title>
          </rect>
        ))}
        {data.length > 1 && <polyline points={points} className="db-line" />}
        {data.map((d, i) => (
          <circle key={d.date} cx={x(i)} cy={y(d.sales)} r="3.5" className="db-dot-marker" />
        ))}
        {data.map((d, i) => (i % labelStep === 0 ? (
          <text key={d.date} x={x(i)} y={height - 12} textAnchor="middle" className="db-axis">{dayLabel(d.date)}</text>
        ) : null))}
      </svg>
      {empty && (
        <div className="db-chart-empty">
          <span className="db-empty-icon"><Icon name="barchart" size={26} /></span>
          <p>{emptyText}</p>
        </div>
      )}
    </div>
  )
}

// Donut with percentage labels on the slices, centre total, and a legend with counts.
export function PieCard({ rows, centerLabel }) {
  const total = rows.reduce((s, r) => s + r.value, 0)
  const size = 190
  const c = size / 2
  const r = 64
  const stroke = 40
  const circ = 2 * Math.PI * r

  const slices = rows.map((row, i) => {
    const before = rows.slice(0, i).reduce((s, x) => s + x.value, 0)
    const frac = row.value / total
    const start = before / total
    const mid = (start + frac / 2) * 2 * Math.PI - Math.PI / 2
    return { ...row, frac, start, color: PALETTE[i % PALETTE.length], lx: c + r * Math.cos(mid), ly: c + r * Math.sin(mid) }
  })
  const pct = (f) => `${(f * 100).toFixed(1)}%`

  return (
    <div className="db-pie">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="db-donut" role="img"
           aria-label={`${centerLabel} distribution`}>
        {slices.map((s) => (
          <circle key={s.label} cx={c} cy={c} r={r} fill="none" stroke={s.color} strokeWidth={stroke}
                  strokeDasharray={`${s.frac * circ} ${circ}`} strokeDashoffset={-s.start * circ}
                  transform={`rotate(-90 ${c} ${c})`} />
        ))}
        {slices.filter((s) => s.frac >= 0.04).map((s) => (
          <text key={s.label} x={s.lx} y={s.ly + 4} textAnchor="middle" className="db-slice-label">{pct(s.frac)}</text>
        ))}
        <text x={c} y={c - 2} textAnchor="middle" className="db-donut-total">{total}</text>
        <text x={c} y={c + 16} textAnchor="middle" className="db-donut-sub">{centerLabel}</text>
      </svg>
      <ul className="db-legend">
        {slices.map((s) => (
          <li key={s.label}>
            <span className="db-swatch" style={{ background: s.color }} />
            <span className="db-legend-name">{s.label}</span>
            <span className="db-legend-count">{s.value}</span>
            <span className="db-legend-pct">({pct(s.frac)})</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
