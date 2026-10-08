import { STATUS_LABELS } from '../dashboard/calc'

const num = (v) => Number(v) || 0
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

export const CUSTOMER_LABELS = { new: 'New', existing: 'Existing' }
export { STATUS_LABELS }

// One order row for the table. Definitions (from the Sales spec):
//   Gross Profit = Total Selling Price - Total Cost Price
//   Net Profit   = (Selling + Shipping paid by customer) - (Cost + Shipping paid by me)
// These are calculated here from the base columns; the database view's
// gross_profit / net_profit columns use different definitions and are NOT used.
export function toOrderRow(r) {
  const cost = num(r.total_cost_price)
  const sell = num(r.total_selling_price)
  const shipC = num(r.shipping_paid_by_customer)
  const shipMe = num(r.shipping_paid_by_me)
  return {
    id: r.id,
    number: r.order_number,
    date: r.order_date,
    cars: num(r.car_count),
    cost, sell, shipC, shipMe,
    gross: round2(sell - cost),
    net: round2(sell + shipC - cost - shipMe),
    shipMeHigh: shipMe > shipC,
    customer: r.customer_type,
    status: r.shipping_status,
  }
}

export function summarize(rows) {
  let cars = 0, cost = 0, sell = 0, shipC = 0, shipMe = 0
  for (const r of rows) {
    cars += r.cars; cost += r.cost; sell += r.sell; shipC += r.shipC; shipMe += r.shipMe
  }
  cost = round2(cost); sell = round2(sell); shipC = round2(shipC); shipMe = round2(shipMe)
  const gross = round2(sell - cost)
  const net = round2(sell + shipC - cost - shipMe)
  return {
    orders: rows.length, cars, cost, sell, shipC, shipMe,
    shipMeHigh: shipMe > shipC,
    gross, grossPct: cost > 0 ? round2((gross / cost) * 100) : 0,
    net, netPct: cost + shipMe > 0 ? round2((net / (cost + shipMe)) * 100) : 0,
  }
}

export function buildSalesModel(rawRows, month) {
  const rows = rawRows
    .map(toOrderRow)
    .sort((a, b) => (a.date === b.date ? (a.number < b.number ? 1 : -1) : a.date < b.date ? 1 : -1))
  return { month, rows, totals: summarize(rows) }
}
