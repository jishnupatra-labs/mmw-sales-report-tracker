import { toOrderRow, summarize } from '../sales/salesCalc'
import { brandCounts, countBy } from '../dashboard/calc'
import { MONTH_SHORT, addMonths, currentMonthKey, dayLabel, daysInMonth, monthLabel, monthLabelShort } from '../dashboard/dateUtils'

export const PERIODS = [
  { id: 'monthly', label: 'Monthly' },
  { id: '3m', label: '3 Months' },
  { id: '6m', label: '6 Months' },
  { id: 'mtd', label: 'MTD' },
  { id: 'ytd', label: 'YTD' },
]
export const COMPARE_OPTIONS = ['Sales', 'Orders', 'Cars', 'Brand', 'Customer Type']

const pad2 = (n) => String(n).padStart(2, '0')
const ymd = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
const lastDayOf = (monthKey) => `${monthKey.slice(0, 7)}-${pad2(daysInMonth(monthKey))}`

// Date range + display label for a report period. `month` is only used by "Monthly".
export function periodRange(periodId, month, now = new Date()) {
  const cur = currentMonthKey(now)
  const today = ymd(now)
  switch (periodId) {
    case '3m':
    case '6m': {
      const first = addMonths(cur, periodId === '3m' ? -2 : -5)
      return { start: first, end: lastDayOf(cur), label: `${monthLabelShort(first)} – ${monthLabelShort(cur)}` }
    }
    case 'mtd':
      return { start: cur, end: today, label: `${dayLabel(cur)} – ${dayLabel(today)} ${today.slice(0, 4)}` }
    case 'ytd':
      return { start: `${today.slice(0, 4)}-01-01`, end: today, label: `1 Jan – ${dayLabel(today)} ${today.slice(0, 4)}` }
    default:
      return { start: month, end: lastDayOf(month), label: monthLabel(month) }
  }
}

// X-axis buckets for the comparison chart (kept small so the chart never gets cluttered):
//   Monthly / MTD -> 5 weekly groups (1-7, 8-14, 15-21, 22-28, 29-end), each labelled with its start date
//   3 / 6 Months  -> one group per month;  YTD -> one group per month since January
export function chartBuckets(periodId, month, now = new Date()) {
  const cur = currentMonthKey(now)
  if (periodId === 'monthly' || periodId === 'mtd') {
    const key = periodId === 'mtd' ? cur : month
    const last = daysInMonth(key)
    const limit = periodId === 'mtd' ? now.getDate() : last
    const prefix = key.slice(0, 7)
    const mon = MONTH_SHORT[Number(key.slice(5, 7)) - 1]
    return [1, 8, 15, 22, 29].filter((d) => d <= last && d <= limit).map((d) => ({
      label: `${pad2(d)} ${mon}`, start: `${prefix}-${pad2(d)}`, end: `${prefix}-${pad2(Math.min(d + 6, last, limit))}`,
    }))
  }
  const count = periodId === '3m' ? 3 : periodId === '6m' ? 6 : Number(cur.slice(5, 7))
  return Array.from({ length: count }, (_, i) => {
    const key = addMonths(cur, i - (count - 1))
    return { label: periodId === 'ytd' ? MONTH_SHORT[Number(key.slice(5, 7)) - 1] : monthLabelShort(key), start: key, end: lastDayOf(key) }
  })
}

export const toReportRow = (r) => ({ ...toOrderRow(r), state: r.state, source: r.source })
const normItems = (items) => items.map((it) => {
  const b = Array.isArray(it.brands) ? it.brands[0] : it.brands
  const o = Array.isArray(it.orders) ? it.orders[0] : it.orders
  return { brand: b?.name ?? 'Unknown', qty: Number(it.quantity) || 0, date: o?.order_date }
})

const abbreviate = (name) => (name === 'Hot Wheels' ? 'HW' : name === 'Matchbox' ? 'MBX' : name)

// Top `max` entries by value, everything else summed into "Others".
export function topWithOthers(list, max = 4) {
  if (list.length <= max) return list
  const top = list.slice(0, max)
  const rest = list.slice(max).reduce((s, x) => s + x.value, 0)
  return rest > 0 ? [...top, { label: 'Others', value: rest }] : top
}

export function buildReport(data, periodId, month, now = new Date()) {
  const range = periodRange(periodId, month, now)
  const rows = data.orders.map(toReportRow)
  const items = normItems(data.items)
  const fin = summarize(rows)
  const newCustomers = rows.filter((r) => r.customer === 'new').length
  const brandRows = brandCounts(data.items).map((b) => ({ label: abbreviate(b.label), value: b.value }))
  return {
    range, rows, items, fin,
    overview: { orders: fin.orders, cars: fin.cars, newCustomers, existingCustomers: rows.length - newCustomers },
    pies: {
      state: countBy(rows, (r) => r.state),
      source: countBy(rows, (r) => r.source),
      brand: brandRows,
      customer: countBy(rows, (r) => (r.customer === 'new' ? 'New Customers' : 'Existing Customers')),
    },
    totalCars: items.reduce((s, i) => s + i.qty, 0),
  }
}

const COLORS = { blue: '#2f6df6', orange: '#f5a524', green: '#10c27a', purple: '#8b5cf6', red: '#f43f5e' }

// Series for the comparison chart: one value per bucket per series.
export function chartSeries(compare, buckets, report) {
  const inB = (b) => (d) => { const k = String(d).slice(0, 10); return k >= b.start && k <= b.end }
  const rowsIn = (b) => report.rows.filter((r) => inB(b)(r.date))
  const itemsIn = (b) => report.items.filter((i) => i.date && inB(b)(i.date))
  const each = (fn) => buckets.map(fn)

  switch (compare) {
    case 'Orders':
      return { money: false, series: [{ name: 'Total Orders', color: COLORS.blue, values: each((b) => rowsIn(b).length) }] }
    case 'Cars':
      return { money: false, series: [{ name: 'Total Cars', color: COLORS.green, values: each((b) => rowsIn(b).reduce((s, r) => s + r.cars, 0)) }] }
    case 'Brand': {
      const sum = (b, test) => itemsIn(b).filter((i) => test(i.brand)).reduce((s, i) => s + i.qty, 0)
      return { money: false, series: [
        { name: 'HW', color: COLORS.blue, values: each((b) => sum(b, (n) => n === 'Hot Wheels')) },
        { name: 'MBX', color: COLORS.orange, values: each((b) => sum(b, (n) => n === 'Matchbox')) },
        { name: 'Others', color: COLORS.green, values: each((b) => sum(b, (n) => n !== 'Hot Wheels' && n !== 'Matchbox')) },
      ] }
    }
    case 'Customer Type':
      return { money: false, series: [
        { name: 'Existing', color: COLORS.red, values: each((b) => rowsIn(b).filter((r) => r.customer === 'existing').length) },
        { name: 'New', color: COLORS.blue, values: each((b) => rowsIn(b).filter((r) => r.customer === 'new').length) },
      ] }
    default: {
      const totals = buckets.map((b) => summarize(rowsIn(b)))
      return { money: true, series: [
        { name: 'Total Cost Price', color: COLORS.blue, values: totals.map((t) => t.cost) },
        { name: 'Total Selling Price', color: COLORS.orange, values: totals.map((t) => t.sell) },
        { name: 'Gross Profit', color: COLORS.green, values: totals.map((t) => t.gross) },
        { name: 'Net Profit', color: COLORS.purple, values: totals.map((t) => t.net) },
      ] }
    }
  }
}

// Axis range that also handles negative values (e.g. a loss-making net profit).
export function niceRange(min, max, integer = false, target = 4) {
  const lo = Math.min(0, min)
  const hi = Math.max(0, max)
  if (lo === 0 && hi === 0) return integer ? { min: 0, max: 4, ticks: [0, 1, 2, 3, 4] } : { min: 0, max: 1000, ticks: [0, 250, 500, 750, 1000] }
  const raw = (hi - lo) / target
  const mag = 10 ** Math.floor(Math.log10(raw))
  const norm = raw / mag
  let step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 && !integer ? 2.5 : norm <= 5 ? 5 : 10) * mag
  if (integer) step = Math.max(1, Math.round(step))
  const start = Math.floor(lo / step) * step
  const end = Math.ceil(hi / step) * step
  const ticks = []
  for (let v = start; v <= end + step / 1e6; v += step) ticks.push(Math.round(v * 100) / 100)
  return { min: ticks[0], max: ticks[ticks.length - 1], ticks }
}
