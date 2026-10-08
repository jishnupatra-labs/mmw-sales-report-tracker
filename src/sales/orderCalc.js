// Pure helpers for the New Order page.
const num = (v) => Number(v) || 0
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

export function todayLocal(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// Per-car totals: quantity x price per car.
export const carTotals = (c) => ({
  cp: round2(num(c.quantity) * num(c.cost_price)),
  sp: round2(num(c.quantity) * num(c.selling_price)),
})

// Order summary (requirement sheet):
//   Total Cars          = SUM(quantity)
//   Total Cost Price    = SUM(quantity x CP per car)
//   Total Selling Price = SUM(quantity x SP per car)
//   Gross Profit        = Total Selling Price - Total Cost Price   (shipping is NOT included)
//   Gross Profit %      = Gross Profit / Total Cost Price x 100
export function orderSummary(cars, shipC, shipMe) {
  let qty = 0, cost = 0, sell = 0
  for (const c of cars) {
    const t = carTotals(c)
    qty += Math.floor(num(c.quantity)); cost += t.cp; sell += t.sp
  }
  cost = round2(cost); sell = round2(sell)
  const gross = round2(sell - cost)
  return {
    cars: qty, cost, sell, gross,
    grossPct: cost > 0 ? round2((gross / cost) * 100) : 0,
    shipC: num(shipC), shipMe: num(shipMe),
  }
}

export function validateCar(v) {
  const e = {}
  if (!v.brand_id) e.brand_id = 'Select a brand'
  if (!String(v.series_name).trim()) e.series_name = 'Enter the series'
  if (!String(v.car_name).trim()) e.car_name = 'Enter the car name'
  const q = Number(v.quantity)
  if (v.quantity === '' || !Number.isInteger(q) || q < 1) e.quantity = 'Enter a whole number, 1 or more'
  for (const k of ['cost_price', 'selling_price']) {
    const n = Number(v[k])
    if (v[k] === '' || !Number.isFinite(n) || n < 0) e[k] = 'Enter a valid amount'
  }
  return e
}

// '' is fine (treated as 0); anything else must be a number >= 0.
export const validAmount = (raw) => raw === '' || (Number.isFinite(Number(raw)) && Number(raw) >= 0)

export function validateOrder(o, sources) {
  const e = {}
  if (!o.order_date) e.order_date = 'Select the order date'
  if (!o.source_id) e.source_id = 'Select a source'
  const src = sources.find((x) => String(x.id) === String(o.source_id))
  if (src?.requires_detail && !String(o.source_other || '').trim()) e.source_other = 'Enter the exact source'
  if (!o.state_id) e.state_id = 'Select a state'
  for (const k of ['shipping_paid_by_customer', 'shipping_paid_by_me']) {
    if (!validAmount(o[k])) e[k] = 'Enter a valid amount'
  }
  return e
}

// Row sent to `orders`. The order number is NOT sent: the database trigger generates it
// (order_counters + next_order_number) and locks it afterwards.
export function orderPayload(o, sources) {
  const src = sources.find((x) => String(x.id) === String(o.source_id))
  return {
    order_date: o.order_date,
    source_id: Number(o.source_id),
    source_other: src?.requires_detail ? String(o.source_other).trim() : null,
    state_id: Number(o.state_id),
    customer_type: o.customer_type,
    shipping_paid_by_customer: num(o.shipping_paid_by_customer),
    shipping_paid_by_me: num(o.shipping_paid_by_me),
    tracking_id: String(o.tracking_id || '').trim() || null,
    shipping_status: o.shipping_status,
  }
}

export const itemPayload = (c) => ({
  brand_id: Number(c.brand_id),
  series_name: String(c.series_name).trim(),
  car_name: String(c.car_name).trim(),
  quantity: Math.floor(num(c.quantity)),
  cost_price: num(c.cost_price),
  selling_price: num(c.selling_price),
})

// Stable string used to detect "has anything changed" on the Edit page.
export function snapshot(order, cars, sources) {
  return JSON.stringify({ o: orderPayload(order, sources), c: cars.map(itemPayload) })
}
