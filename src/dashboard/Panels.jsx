import Icon from './Icon'
import { STATUS_LABELS, formatMoney, formatPercent2, formatInt } from './calc'
import { monthLabelShort } from './dateUtils'

const KPIS = [
  { key: 'sales', label: 'Total Sales', sub: '(Selling Price)', icon: 'bag', tone: 'blue', fmt: formatMoney },
  { key: 'cost', label: 'Total Cost Price', icon: 'coins', tone: 'amber', fmt: formatMoney },
  { key: 'gross', label: 'Gross Profit', icon: 'bars', tone: 'green', fmt: formatMoney },
  { key: 'margin', label: 'Profit Margin', icon: 'percent', tone: 'purple', fmt: formatPercent2 },
  { key: 'cars', label: 'Total Cars Sold', icon: 'car', tone: 'red', fmt: formatInt },
  { key: 'orders', label: 'Total Orders', icon: 'doc', tone: 'teal', fmt: formatInt },
]

export function KpiRow({ model }) {
  return (
    <div className="db-kpis">
      {KPIS.map((k) => {
        const cmp = model.comparisons[k.key]
        const arrow = cmp.direction === 'up' ? '↑ ' : cmp.direction === 'down' ? '↓ ' : ''
        const value = k.fmt(model.kpis[k.key])
        const size = value.length > 13 ? ' xlong' : value.length > 10 ? ' long' : ''
        return (
          <div key={k.key} className="db-card db-kpi">
            <div className="db-kpi-body">
              <span className={`db-kpi-icon tone-${k.tone}`}><Icon name={k.icon} size={24} /></span>
              <div className="db-kpi-label">
                {k.label}
                {k.sub && <small>{k.sub}</small>}
              </div>
              <div className={`db-kpi-value${size}`}>{value}</div>
              <div className="db-kpi-cmp">
                <span className={`db-delta ${cmp.direction}`}>{arrow}{cmp.text}</span>
                <span className="db-kpi-vs">vs {monthLabelShort(model.prevKey)}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function Panel({ icon, title, children, className = '' }) {
  return (
    <section className={`db-card db-panel ${className}`}>
      <h3 className="db-panel-title"><Icon name={icon} size={20} />{title}</h3>
      {children}
    </section>
  )
}

export function EmptyState({ icon, text }) {
  return (
    <div className="db-empty">
      <span className="db-empty-icon"><Icon name={icon} size={26} /></span>
      <p>{text}</p>
    </div>
  )
}

export function OrdersTable({ orders, emptyText }) {
  return (
    <div className="db-table-wrap">
      <table className="db-table">
        <colgroup>
          <col style={{ width: '18%' }} /><col style={{ width: '9%' }} /><col style={{ width: '18%' }} />
          <col style={{ width: '19%' }} /><col style={{ width: '18%' }} /><col style={{ width: '18%' }} />
        </colgroup>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Cars</th>
            <th>Total Cost Price</th>
            <th>Total Selling Price</th>
            <th>Gross Profit</th>
            <th className="c">Delivery Status</th>
          </tr>
        </thead>
        {orders.length > 0 && (
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.cars}</td>
                <td>{formatMoney(o.cost)}</td>
                <td>{formatMoney(o.sales)}</td>
                <td className={o.gross > 0 ? 'gain' : o.gross < 0 ? 'loss' : ''}>{formatMoney(o.gross)}</td>
                <td className="c"><span className={`db-status s-${o.status}`}>{STATUS_LABELS[o.status] ?? o.status}</span></td>
              </tr>
            ))}
          </tbody>
        )}
      </table>
      {orders.length === 0 && <EmptyState icon="doc" text={emptyText} />}
    </div>
  )
}
