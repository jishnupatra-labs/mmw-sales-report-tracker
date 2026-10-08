import { useEffect, useMemo, useState } from 'react'
import Icon from '../dashboard/Icon'
import MonthPicker from '../dashboard/MonthPicker'
import { fetchOrderDateBounds } from '../dashboard/queries'
import { formatInt, formatMoney } from '../dashboard/calc'
import { monthLabel, yearRange } from '../dashboard/dateUtils'
import { CUSTOMER_LABELS, STATUS_LABELS, buildSalesModel } from './salesCalc'
import { fetchMonthOrders } from './queries'
import EmptyBox from './EmptyBox'
import '../dashboard/Dashboard.css'
import './Sales.css'

const KPIS = [
  { key: 'orders', label: 'Total Orders', icon: 'doc', tone: 'blue', fmt: formatInt },
  { key: 'cars', label: 'Total Cars', icon: 'car', tone: 'green', fmt: formatInt },
  { key: 'cost', label: 'Total Cost Price', icon: 'coins', tone: 'amber', fmt: formatMoney },
  { key: 'sell', label: 'Total Selling Price', icon: 'tag', tone: 'red', fmt: formatMoney },
  { key: 'shipC', label: 'Total Shipping Paid by Customer', icon: 'truck', tone: 'teal', fmt: formatMoney },
  { key: 'shipMe', label: 'Total Shipping Paid by Me', icon: 'truck', tone: 'orange', fmt: formatMoney, red: (t) => t.shipMeHigh },
  { key: 'gross', label: 'Gross Profit', icon: 'bars', tone: 'purple', fmt: formatMoney, pct: 'grossPct' },
  { key: 'net', label: 'Net Profit', icon: 'trend', tone: 'indigo', fmt: formatMoney, pct: 'netPct' },
]

const HEADERS = ['Order ID', 'Cars', 'Total Cost Price', 'Total Selling Price', 'Total Shipping Paid by Customer',
  'Total Shipping Paid by Me', 'Gross Profit', 'Net Profit', 'Customer Type', 'Delivery Status']

const pctText = (v) => `(${Number(v).toFixed(2)}%)`

export default function SalesLanding({ month, onMonthChange, onNewOrder, onEditOrder, busy, error }) {
  const [bounds, setBounds] = useState({ earliest: null, latest: null })
  const [result, setResult] = useState(null) // { month, rows } | { month, error }

  useEffect(() => {
    let cancelled = false
    fetchOrderDateBounds()
      .then((b) => { if (!cancelled) setBounds(b) })
      .catch(() => { /* the picker falls back to the default year range */ })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchMonthOrders(month)
      .then((rows) => { if (!cancelled) setResult({ month, rows }) })
      .catch((err) => { if (!cancelled) setResult({ month, error: err?.message || 'Unknown error' }) })
    return () => { cancelled = true }
  }, [month])

  const { minYear, maxYear } = useMemo(() => yearRange(bounds.earliest, bounds.latest), [bounds])
  const model = useMemo(() => (result?.rows ? buildSalesModel(result.rows, result.month) : null), [result])
  const loading = !result || result.month !== month
  const failed = result?.error && !loading

  const label = monthLabel(model?.month ?? month)
  const count = model ? model.rows.length : 0

  return (
    <div className="db sl-root">
      <header className="sl-header">
        <div>
          <h2 className="sl-title">Sales</h2>
          <p className="sl-subtitle">Record and manage your MMW monthly orders.</p>
        </div>
        <button type="button" className="sl-new" onClick={onNewOrder} disabled={busy}>
          <Icon name="plus" size={20} />
          New Order Details
        </button>
      </header>

      {error && <div className="sl-alert" role="alert">{error}</div>}

      <section className="db-card sl-monthbar">
        <span className="sl-monthlabel">Month</span>
        <MonthPicker value={month} minYear={minYear} maxYear={maxYear} onChange={onMonthChange} />
      </section>

      {failed && <div className="db-card db-message" role="alert">Unable to load orders. {result.error}</div>}
      {!failed && !model && <div className="db-card db-message">Loading orders…</div>}

      {!failed && model && (
        <div className={`sl-body${loading ? ' is-loading' : ''}`} aria-busy={loading}>
          <div className="sl-kpis">
            {KPIS.map((k) => {
              const t = model.totals
              const value = k.fmt(t[k.key])
              const size = value.length > 13 ? ' xlong' : value.length > 10 ? ' long' : ''
              return (
                <div key={k.key} className="db-card db-kpi">
                  <div className="db-kpi-body">
                    <span className={`db-kpi-icon tone-${k.tone}`}><Icon name={k.icon} size={24} /></span>
                    <div className="db-kpi-label">{k.label}</div>
                    <div className={`db-kpi-value${size}${k.red?.(t) ? ' is-red' : ''}`}>
                      {value}
                      {k.pct && <span className="sl-pct"> {pctText(t[k.pct])}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <section className="db-card sl-orders">
            <div className="sl-orders-head">
              <h3 className="sl-orders-title"><Icon name="list" size={24} />Orders — {label}</h3>
              <span className="sl-count">{count} order{count === 1 ? '' : 's'}</span>
            </div>
            <div className="sl-table-wrap">
              <table className="sl-table">
                <thead>
                  <tr>
                    {HEADERS.map((h) => <th key={h}>{h}</th>)}
                    <th className="c">Edit</th>
                  </tr>
                </thead>
                {count > 0 && (
                  <tbody>
                    {model.rows.map((o) => (
                      <tr key={o.id}>
                        <td>{o.number}</td>
                        <td>{o.cars}</td>
                        <td>{formatMoney(o.cost)}</td>
                        <td>{formatMoney(o.sell)}</td>
                        <td>{formatMoney(o.shipC)}</td>
                        <td className={o.shipMeHigh ? 'is-red' : ''}>{formatMoney(o.shipMe)}</td>
                        <td className={o.gross > 0 ? 'gain' : o.gross < 0 ? 'loss' : ''}>{formatMoney(o.gross)}</td>
                        <td>{formatMoney(o.net)}</td>
                        <td>{CUSTOMER_LABELS[o.customer] ?? o.customer}</td>
                        <td><span className={`db-status s-${o.status}`}>{STATUS_LABELS[o.status] ?? o.status}</span></td>
                        <td className="c">
                          <button type="button" className="sl-edit" aria-label={`Edit ${o.number}`} title="Edit"
                                  disabled={busy} onClick={() => onEditOrder(o.id)}>
                            <Icon name="pencil" size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
            {count === 0 && (
              <div className="sl-empty">
                <EmptyBox />
                <p>No Orders for {label}</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
