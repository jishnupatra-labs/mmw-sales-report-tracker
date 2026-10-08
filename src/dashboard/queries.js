import { supabase } from '../lib/supabaseClient'
import { addMonths } from './dateUtils'

const ORDER_COLUMNS =
  'order_number, order_date, month_start, source, customer_type, shipping_status, car_count, total_cost_price, total_selling_price'

// Everything the Dashboard needs for one month (plus the previous month for the
// KPI comparison). Uses the existing v_order_summary view; the brand split needs
// order_items + brands, which the view does not expose.
export async function fetchDashboardData(month) {
  const prev = addMonths(month, -1)
  const next = addMonths(month, 1)

  const [orders, items] = await Promise.all([
    supabase
      .from('v_order_summary')
      .select(ORDER_COLUMNS)
      .in('month_start', [prev, month])
      .order('order_date', { ascending: false })
      .order('order_number', { ascending: false }),
    supabase
      .from('order_items')
      .select('quantity, brands(name), orders!inner(order_date)')
      .gte('orders.order_date', month)
      .lt('orders.order_date', next),
  ])

  if (orders.error) throw orders.error
  if (items.error) throw items.error
  return { orders: orders.data ?? [], items: items.data ?? [] }
}

// Earliest / latest order date, to build the month dropdown.
export async function fetchOrderDateBounds() {
  const [first, last] = await Promise.all([
    supabase.from('orders').select('order_date').order('order_date', { ascending: true }).limit(1),
    supabase.from('orders').select('order_date').order('order_date', { ascending: false }).limit(1),
  ])
  if (first.error) throw first.error
  if (last.error) throw last.error
  return {
    earliest: first.data?.[0]?.order_date ?? null,
    latest: last.data?.[0]?.order_date ?? null,
  }
}
