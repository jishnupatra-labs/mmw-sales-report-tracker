import { supabase } from '../lib/supabaseClient'

const COLUMNS = [
  'id', 'order_number', 'order_date', 'month_start', 'customer_type', 'shipping_status', 'car_count',
  'total_cost_price', 'total_selling_price', 'shipping_paid_by_customer', 'shipping_paid_by_me',
].join(', ')

// All orders of one month from the existing v_order_summary view.
export async function fetchMonthOrders(month) {
  const { data, error } = await supabase
    .from('v_order_summary')
    .select(COLUMNS)
    .eq('month_start', month)
    .order('order_date', { ascending: false })
    .order('order_number', { ascending: false })
  if (error) throw error
  return data ?? []
}
