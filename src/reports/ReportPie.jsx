// Donut chart + legend ("name  count (pct%)"). SVG uses presentation attributes only (PDF export friendly).
const FONT = "Inter, 'Segoe UI', system-ui, sans-serif"

export default function ReportPie({ rows, centerLabel, colors }) {
  const total = rows.reduce((s, r) => s + r.value, 0)
  const size = 172
  const c = size / 2
  const r = 60
  const stroke = 38
  const circ = 2 * Math.PI * r

  const slices = rows.map((row, i) => {
    const before = rows.slice(0, i).reduce((s, x) => s + x.value, 0)
    const frac = row.value / total
    const start = before / total
    const mid = (start + frac / 2) * 2 * Math.PI - Math.PI / 2
    return { ...row, frac, start, color: colors[i % colors.length], lx: c + r * Math.cos(mid), ly: c + r * Math.sin(mid) }
  })
  const pct = (f) => `${Math.round(f * 100)}%`

  return (
    <div className="rp-pie">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label={`${centerLabel} distribution`} style={{ flex: 'none', maxWidth: '100%' }}>
        {slices.map((s) => (
          <circle key={s.label} cx={c} cy={c} r={r} fill="none" stroke={s.color} strokeWidth={stroke}
                  strokeDasharray={`${s.frac * circ} ${circ}`} strokeDashoffset={-s.start * circ}
                  transform={`rotate(-90 ${c} ${c})`} />
        ))}
        {slices.filter((s) => s.frac >= 0.06).map((s) => (
          <text key={`t-${s.label}`} x={s.lx} y={s.ly + 4} textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700" fontFamily={FONT}>{pct(s.frac)}</text>
        ))}
        <text x={c} y={c - 1} textAnchor="middle" fill="#ffffff" fontSize="28" fontWeight="700" fontFamily={FONT}>{total}</text>
        <text x={c} y={c + 18} textAnchor="middle" fill="#d3dbec" fontSize="13" fontFamily={FONT}>{centerLabel}</text>
      </svg>
      <ul className="rp-pie-legend">
        {slices.map((s) => (
          <li key={s.label}>
            <span className="rp-swatch" style={{ background: s.color }} />
            <span className="rp-pie-name">{s.label}</span>
            <span className="rp-pie-count">{s.value}</span>
            <span className="rp-pie-pct">({pct(s.frac)})</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
