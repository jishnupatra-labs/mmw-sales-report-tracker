import { supabase } from '../lib/supabaseClient'

const PAGE = 1000
const ORDER_COLUMNS = 'id, order_number, order_date, customer_type, shipping_status, state, source, car_count, total_cost_price, total_selling_price, shipping_paid_by_customer, shipping_paid_by_me'

// PostgREST returns at most 1000 rows per request, so read every page.
async function fetchAll(makeQuery) {
  const all = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await makeQuery().range(from, from + PAGE - 1)
    if (error) throw error
    all.push(...(data ?? []))
    if (!data || data.length < PAGE) return all
  }
}

// Orders and car lines whose order date falls in [start, end] (inclusive, 'YYYY-MM-DD').
export async function fetchReportData(start, end) {
  const [orders, items] = await Promise.all([
    fetchAll(() => supabase.from('v_order_summary').select(ORDER_COLUMNS)
      .gte('order_date', start).lte('order_date', end).order('order_date').order('order_number')),
    fetchAll(() => supabase.from('order_items').select('id, quantity, brands(name), orders!inner(order_date)')
      .gte('orders.order_date', start).lte('orders.order_date', end).order('id')),
  ])
  return { orders, items }
}
