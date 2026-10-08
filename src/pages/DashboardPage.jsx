import { useEffect, useMemo, useState } from 'react'
import { KpiRow, Panel, EmptyState, OrdersTable } from '../dashboard/Panels'
import { SalesOverviewChart, PieCard } from '../dashboard/charts'
import { buildModel } from '../dashboard/calc'
import MonthPicker from '../dashboard/MonthPicker'
import { currentMonthKey, monthLabel, yearRange } from '../dashboard/dateUtils'
import { fetchDashboardData, fetchOrderDateBounds } from '../dashboard/queries'
import '../dashboard/Dashboard.css'

export default function DashboardPage() {
  const [month, setMonth] = useState(() => currentMonthKey())
  const [bounds, setBounds] = useState({ earliest: null, latest: null })
  const [result, setResult] = useState(null) // { month, data } | { month, error }

  useEffect(() => {
    let cancelled = false
    fetchOrderDateBounds()
      .then((b) => { if (!cancelled) setBounds(b) })
      .catch(() => { /* the picker falls back to the default year range */ })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchDashboardData(month)
      .then((data) => { if (!cancelled) setResult({ month, data }) })
      .catch((err) => { if (!cancelled) setResult({ month, error: err?.message || 'Unknown error' }) })
    return () => { cancelled = true }
  }, [month])

  const { minYear, maxYear } = useMemo(() => yearRange(bounds.earliest, bounds.latest), [bounds])
  const model = useMemo(
    () => (result?.data ? buildModel(result.data, result.month) : null),
    [result],
  )
  const loading = !result || result.month !== month
  const failed = result?.error && !loading

  const label = model ? monthLabel(model.month) : ''

  return (
    <div className="db">
      <header className="db-header">
        <div>
          <h2 className="db-title">Dashboard</h2>
          <p className="db-subtitle">Overview of MMW Sales and business performance</p>
        </div>
        <MonthPicker value={month} minYear={minYear} maxYear={maxYear} onChange={setMonth} />
      </header>

      {failed && (
        <div className="db-card db-message" role="alert">
          Unable to load dashboard data. {result.error}
        </div>
      )}

      {!failed && !model && <div className="db-card db-message">Loading dashboard…</div>}

      {!failed && model && (
        <div className={`db-body${loading ? ' is-loading' : ''}`} aria-busy={loading}>
          <KpiRow model={model} />

          <Panel icon="barchart" title="Monthly Sales Overview">
            <SalesOverviewChart data={model.daily} month={model.month} emptyText={`No sales data for ${label}`} />
          </Panel>

          <div className="db-trio">
            <Panel icon="pie" title="Brand Distribution">
              {model.brands.length > 0
                ? <PieCard rows={model.brands} centerLabel="Cars Sold" />
                : <EmptyState icon="box" text={`No Brand data for ${label}`} />}
            </Panel>
            <Panel icon="share" title="Sales from Source">
              {model.sources.length > 0
                ? <PieCard rows={model.sources} centerLabel="Orders" />
                : <EmptyState icon="share" text={`No Source data for ${label}`} />}
            </Panel>
            <Panel icon="users" title="Customer">
              {model.customers.length > 0
                ? <PieCard rows={model.customers} centerLabel="Customers" />
                : <EmptyState icon="users" text={`No Customer data for ${label}`} />}
            </Panel>
          </div>

          <Panel icon="list" title="Orders">
            <OrdersTable orders={model.orders} emptyText={`No Order data for ${label}`} />
          </Panel>
        </div>
      )}
    </div>
  )
}
