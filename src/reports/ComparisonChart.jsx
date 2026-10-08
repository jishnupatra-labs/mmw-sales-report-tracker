import { useEffect, useRef, useState } from 'react'
import { formatMoney, formatMoneyShort } from '../dashboard/calc'
import { niceRange } from './reportCalc'

// NOTE: all SVG styling below is done with presentation attributes (not CSS classes) so the chart
// is rendered correctly when the page is exported to PDF.
const FONT = "Inter, 'Segoe UI', system-ui, sans-serif"
const AXIS = '#b0bcd3'
const GRID = 'rgba(150,175,230,0.16)'

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

// Grouped bar chart: one group per bucket (date group / month), one bar per series. Handles negative values.
export default function ComparisonChart({ labels, series, money, emptyText }) {
  const [ref, measured] = useWidth(760)
  const width = Math.max(measured, 300)
  const height = width < 600 ? 260 : 250
  const all = series.flatMap((s) => s.values)
  const { min, max, ticks } = niceRange(Math.min(0, ...all), Math.max(0, ...all), !money)
  const fmt = (v) => (money ? formatMoneyShort(v) : String(v))
  const labelW = Math.max(...ticks.map((t) => fmt(t).length)) * 7.5 + 10
  const m = { top: 14, right: 16, bottom: 34, left: labelW + 10 }
  const iw = width - m.left - m.right
  const ih = height - m.top - m.bottom
  const y = (v) => m.top + ih - ((v - min) / (max - min)) * ih
  const band = iw / labels.length
  const barW = Math.min(44, (band * 0.72) / series.length)
  const groupW = barW * series.length + 3 * (series.length - 1)
  const step = Math.max(1, Math.ceil(56 / band)) // thin out x labels on narrow screens
  const zeroY = y(0)

  return (
    <div ref={ref} className="rp-chart">
      <svg width={width} height={height} role="img" aria-label="Comparison chart" style={{ display: 'block' }}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={m.left} x2={width - m.right} y1={y(t)} y2={y(t)} stroke={GRID} />
            <text x={m.left - 8} y={y(t) + 4} textAnchor="end" fill={AXIS} fontSize="12" fontFamily={FONT}>{fmt(t)}</text>
          </g>
        ))}
        {labels.map((l, i) => (
          <g key={l}>
            {i > 0 && <line x1={m.left + band * i} x2={m.left + band * i} y1={m.top} y2={m.top + ih} stroke={GRID} />}
            {series.map((s, j) => {
              const v = s.values[i]
              const x = m.left + band * i + (band - groupW) / 2 + j * (barW + 3)
              return (
                <rect key={s.name} x={x} y={Math.min(y(v), zeroY)} width={barW} height={Math.abs(y(v) - zeroY)} rx="2" fill={s.color}>
                  <title>{`${l} – ${s.name}: ${money ? formatMoney(v) : v}`}</title>
                </rect>
              )
            })}
            {i % step === 0 && (
              <text x={m.left + band * i + band / 2} y={height - 12} textAnchor="middle" fill={AXIS} fontSize="13" fontFamily={FONT}>{l}</text>
            )}
          </g>
        ))}
        <line x1={m.left} x2={width - m.right} y1={zeroY} y2={zeroY} stroke="rgba(190,205,235,0.35)" />
        {series.map((s, j) => {
          const pts = s.values.map((v, i) => [m.left + band * i + (band - groupW) / 2 + j * (barW + 3) + barW / 2, y(v)])
          return (
            <g key={`line-${s.name}`}>
              <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={s.color} stroke="#0b1428" strokeWidth="1" />)}
            </g>
          )
        })}
      </svg>
      {emptyText && <div className="rp-chart-empty">{emptyText}</div>}
      <ul className="rp-legend-row">
        {series.map((s) => (
          <li key={s.name}><span className="rp-swatch sq" style={{ background: s.color }} />{s.name}</li>
        ))}
      </ul>
    </div>
  )
}
