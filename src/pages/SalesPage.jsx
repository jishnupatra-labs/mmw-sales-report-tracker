import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import SalesLanding from '../sales/SalesLanding'
import NewOrder from '../sales/NewOrder'
import { currentMonthKey } from '../dashboard/dateUtils'

// Sales tab: landing page (order list) -> New Order / Edit Order (same editor, two modes).
export default function SalesPage() {
  const [lookups, setLookups] = useState(null)
  const [error, setError] = useState('')
  const [view, setView] = useState({ name: 'list' }) // { name: 'list' } | { name: 'new' } | { name: 'edit', id }
  const [landingMonth, setLandingMonth] = useState(() => currentMonthKey()) // survives New Order / Edit and back

  useEffect(() => {
    let cancelled = false
    Promise.all([
      supabase.from('order_sources').select('id,name,requires_detail').eq('is_active', true).order('sort_order'),
      supabase.from('brands').select('id,name').eq('is_active', true).order('sort_order'),
      supabase.from('indian_states').select('id,name').order('name'),
    ]).then(([s, b, st]) => {
      if (cancelled) return
      const failure = s.error || b.error || st.error
      if (failure) { setError(failure.message || 'Unable to load sales data.'); return }
      setLookups({ sources: s.data || [], brands: b.data || [], states: st.data || [] })
    })
    return () => { cancelled = true }
  }, [])

  if (error) return <section><h2>Sales</h2><div className="card"><div className="alert error">{error}</div></div></section>
  if (!lookups) return <section><h2>Sales</h2><div className="card">Loading sales data…</div></section>

  const toList = () => setView({ name: 'list' })

  if (view.name === 'new') return <NewOrder key="new" mode="new" lookups={lookups} onClose={toList} />
  if (view.name === 'edit') return <NewOrder key={view.id} mode="edit" orderId={view.id} lookups={lookups} onClose={toList} />

  return (
    <SalesLanding
      month={landingMonth}
      onMonthChange={setLandingMonth}
      onNewOrder={() => setView({ name: 'new' })}
      onEditOrder={(id) => setView({ name: 'edit', id })}
      busy={false}
      error=""
    />
  )
}
