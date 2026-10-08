// Month helpers. A "month key" is the first day of a month as 'YYYY-MM-01',
// the same shape as month_start in v_order_summary.
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
export const MONTH_SHORT = MONTH_NAMES.map((m) => m.slice(0, 3))

const pad = (n) => String(n).padStart(2, '0')

export function monthKey(year, monthIndex) {
  const d = new Date(Date.UTC(year, monthIndex, 1)) // handles month overflow/underflow
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-01`
}

export function currentMonthKey(now = new Date()) {
  return monthKey(now.getFullYear(), now.getMonth())
}

export function monthKeyOf(dateStr) {
  return `${dateStr.slice(0, 7)}-01`
}

function parseKey(key) {
  const [y, m] = key.split('-').map(Number)
  return { year: y, month: m - 1 }
}

export function addMonths(key, delta) {
  const { year, month } = parseKey(key)
  return monthKey(year, month + delta)
}

export function monthLabel(key) {
  const { year, month } = parseKey(key)
  return `${MONTH_NAMES[month]} ${year}`
}

export function monthLabelShort(key) {
  const { year, month } = parseKey(key)
  return `${MONTH_SHORT[month]} ${year}`
}

// '2026-10-05' -> '5 Oct' (string based, so no timezone shifts)
export function dayLabel(dateStr) {
  const [, m, d] = dateStr.split('-').map(Number)
  return `${d} ${MONTH_SHORT[m - 1]}`
}

// Years the month picker offers: from 5 years back (or the earliest order year, if
// earlier) to the current year (or the latest order year, if later). Every month of
// every year in this range is selectable, whether or not it has orders.
export function yearRange(earliestDate, latestDate, now = new Date()) {
  const thisYear = now.getFullYear()
  const minYear = Math.min(thisYear - 5, earliestDate ? Number(earliestDate.slice(0, 4)) : thisYear)
  const maxYear = Math.max(thisYear, latestDate ? Number(latestDate.slice(0, 4)) : thisYear)
  return { minYear, maxYear }
}

export function daysInMonth(key) {
  const { year, month } = parseKey(key)
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
}
