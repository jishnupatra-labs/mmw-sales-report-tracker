import { addMonths } from './dateUtils'

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100
const num = (v) => Number(v) || 0

export const STATUS_LABELS = {
  need_to_ship: 'Need to Ship',
  shipped: 'Shipped',
  delivered: 'Delivered',
}
const CUSTOMER_LABELS = { new: 'New Customers', existing: 'Existing Customers' }

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2,
})
const inrShort = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0,
})
export const formatMoney = (v) => inr.format(num(v))
export const formatMoneyShort = (v) => inrShort.format(num(v))
export const formatPercent2 = (v) => `${num(v).toFixed(2)}%`
export const formatInt = (v) => String(Math.round(num(v)))

// ---- KPIs -----------------------------------------------------------------
// Dashboard definitions (shipping is excluded everywhere):
//   Total Sales  = sum of total selling price
//   Total Cost   = sum of total cost price
//   Gross Profit = Total Sales - Total Cost   (NOT the database gross_profit column)
//   Profit Margin = Gross Profit / Total Cost * 100
export function summarize(rows) {
  let sales = 0, cost = 0, cars = 0
  for (const r of rows) {
    sales += num(r.total_selling_price)
    cost += num(r.total_cost_price)
    cars += num(r.car_count)
  }
  sales = round2(sales)
  cost = round2(cost)
  const gross = round2(sales - cost)
  const margin = cost > 0 ? round2((gross / cost) * 100) : 0
  return { sales, cost, gross, margin, cars, orders: rows.length }
}

const NEUTRAL = { direction: 'neutral', text: '— 0%' }

// Percentage change vs the previous month, used for every KPI (including margin).
// Previous value of zero (e.g. no data) or no change -> neutral "— 0%".
// (buildModel also forces neutral when the selected month has no orders.)
export function compare(current, previous) {
  if (previous === 0 || current === previous) return NEUTRAL
  const pct = ((current - previous) / Math.abs(previous)) * 100
  const rounded = Math.round(pct * 10) / 10
  if (rounded === 0) return NEUTRAL
  const shown = Number(Math.abs(rounded).toFixed(1))
  return rounded > 0
    ? { direction: 'up', text: `+${shown}%` }
    : { direction: 'down', text: `-${shown}%` }
}

// ---- Chart data -----------------------------------------------------------
// Sales per order date (orders on the same date are summed); only dates that
// have orders; at most `max` of them (the latest ones), oldest first.
export function dailySales(rows, max = 10) {
  const byDate = new Map()
  for (const r of rows) {
    byDate.set(r.order_date, round2((byDate.get(r.order_date) || 0) + num(r.total_selling_price)))
  }
  return [...byDate.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, sales]) => ({ date, sales }))
    .slice(-max)
}

export function countBy(rows, labelFn) {
  const m = new Map()
  for (const r of rows) {
    const label = labelFn(r)
    m.set(label, (m.get(label) || 0) + 1)
  }
  return sortedCounts(m)
}

// order_items rows -> cars per brand (by quantity, not by order count)
export function brandCounts(items) {
  const m = new Map()
  for (const it of items) {
    const b = Array.isArray(it.brands) ? it.brands[0] : it.brands
    const name = b?.name ?? 'Unknown'
    m.set(name, (m.get(name) || 0) + num(it.quantity))
  }
  return sortedCounts(m)
}

function sortedCounts(map) {
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
}

// "Nice" axis for the sales chart.
export function niceScale(maxValue, targetTicks = 4) {
  if (!(maxValue > 0)) return { max: 1000, ticks: [0, 250, 500, 750, 1000] }
  const raw = maxValue / targetTicks
  const mag = 10 ** Math.floor(Math.log10(raw))
  const norm = raw / mag
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag
  const count = Math.ceil(maxValue / step)
  const ticks = Array.from({ length: count + 1 }, (_, i) => round2(i * step))
  return { max: ticks[ticks.length - 1], ticks }
}

// ---- Whole-page model -------------------------------------------------------
export function buildModel(data, month) {
  const prevKey = addMonths(month, -1)
  const cur = data.orders.filter((r) => r.month_start === month)
  const prev = data.orders.filter((r) => r.month_start === prevKey)
  const kpis = summarize(cur)
  const before = summarize(prev)

  // A month with no orders always shows the neutral "— 0%", whatever the previous month had.
  const comparisons = {}
  for (const key of Object.keys(kpis)) {
    comparisons[key] = cur.length === 0 ? NEUTRAL : compare(kpis[key], before[key])
  }

  const orders = cur
    .map((r) => ({
      id: r.order_number,
      date: r.order_date,
      cars: num(r.car_count),
      cost: num(r.total_cost_price),
      sales: num(r.total_selling_price),
      gross: round2(num(r.total_selling_price) - num(r.total_cost_price)),
      status: r.shipping_status,
    }))
    .sort((a, b) => (a.date === b.date ? (a.id < b.id ? 1 : -1) : a.date < b.date ? 1 : -1))

  return {
    month,
    prevKey,
    kpis,
    comparisons,
    daily: dailySales(cur),
    brands: brandCounts(data.items),
    sources: countBy(cur, (r) => r.source),
    customers: countBy(cur, (r) => CUSTOMER_LABELS[r.customer_type] ?? r.customer_type),
    orders,
  }
}
