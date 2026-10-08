import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../dashboard/Icon'
import MonthPicker from '../dashboard/MonthPicker'
import { fetchOrderDateBounds } from '../dashboard/queries'
import { formatMoney } from '../dashboard/calc'
import { currentMonthKey, yearRange } from '../dashboard/dateUtils'
import { COMPARE_OPTIONS, PERIODS, buildReport, chartBuckets, chartSeries, periodRange } from '../reports/reportCalc'
import { fetchReportData } from '../reports/queries'
import ComparisonChart from '../reports/ComparisonChart'
import ReportPie from '../reports/ReportPie'
import RIcon from '../reports/ReportIcon'
import { exportReportPdf } from '../reports/exportPdf'
import '../dashboard/Dashboard.css'
import '../reports/Reports.css'

const STATE_SOURCE_COLORS = ['#2f6df6', '#f43f5e', '#f5a524', '#10c27a', '#8b5cf6']
const BRAND_COLORS = ['#2f6df6', '#f5a524', '#10c27a', '#8b5cf6', '#f43f5e']
const CUSTOMER_COLORS = ['#2f6df6', '#f43f5e']

function Kpi({ icon, tone, label, value, pct, red }) {
  const size = value.length > 13 ? ' xlong' : value.length > 10 ? ' long' : ''
  return (
    <div className="rp-kpi">
      <span className={`rp-kpi-icon rp-tone-${tone}`}><RIcon name={icon} size={28} /></span>
      <div className="rp-kpi-body">
        <div className="rp-kpi-label">{label}</div>
        <div className={`rp-kpi-value${size}${red ? ' is-red' : ''}`}>{value}</div>
        {pct !== undefined && <div className={`rp-kpi-pct${pct < 0 ? ' neg' : ''}`}>({pct.toFixed(2)}%)</div>}
      </div>
    </div>
  )
}

function PanelHead({ icon, tone = 'plain', title, sub, children }) {
  return (
    <div className="rp-panel-head">
      <h3 className="rp-panel-title">
        <span className={`rp-panel-icon rp-tone-${tone}`}><RIcon name={icon} size={26} /></span>{title}
      </h3>
      {sub && <span className="rp-panel-sub">{sub}</span>}
      {children}
    </div>
  )
}

export default function ReportsPage() {
  const now = useMemo(() => new Date(), [])
  const [period, setPeriod] = useState('monthly')
  const [month, setMonth] = useState(() => currentMonthKey())
  const [compare, setCompare] = useState('Sales')
  const [bounds, setBounds] = useState({ earliest: null, latest: null })
  const [result, setResult] = useState(null) // { key, period, month, data } | { key, error }
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const rootRef = useRef(null)

  // Only "Monthly" uses the selected month; every other period is anchored on the current month / today.
  const effMonth = period === 'monthly' ? month : currentMonthKey(now)
  const range = periodRange(period, effMonth, now)
  const key = `${period}|${range.start}|${range.end}`

  useEffect(() => {
    let cancelled = false
    fetchOrderDateBounds()
      .then((b) => { if (!cancelled) setBounds(b) })
      .catch(() => { /* the picker falls back to the default year range */ })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchReportData(range.start, range.end)
      .then((data) => { if (!cancelled) setResult({ key, period, month: effMonth, data }) })
      .catch((err) => { if (!cancelled) setResult({ key, error: err?.message || 'Unknown error' }) })
    return () => { cancelled = true }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  const { minYear, maxYear } = useMemo(() => yearRange(bounds.earliest, bounds.latest), [bounds])
  const report = useMemo(
    () => (result?.data ? buildReport(result.data, result.period, result.month, now) : null),
    [result, now],
  )
  const chart = useMemo(() => {
    if (!report) return null
    const buckets = chartBuckets(result.period, result.month, now)
    return { labels: buckets.map((b) => b.label), ...chartSeries(compare, buckets, report) }
  }, [report, result, compare, now])

  const loading = !result || result.key !== key
  const failed = Boolean(result?.error) && !loading
  const label = report ? report.range.label : range.label
  const noData = report ? report.rows.length === 0 : false

  async function handleExport() {
    if (!report || exporting) return
    setExportError('')
    setExporting(true)
    try {
      const periodName = PERIODS.find((p) => p.id === result.period)?.label ?? 'Report'
      const slug = `${periodName}_${report.range.label}`.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      await exportReportPdf(rootRef.current, `MMW-Report_${slug}.pdf`)
    } catch (err) {
      setExportError(err?.message || 'The PDF could not be created.')
    } finally {
      setExporting(false)
    }
  }

  const f = report?.fin
  const o = report?.overview
  const pies = report && [
    { title: 'Orders by State', icon: 'pin', rows: report.pies.state, center: 'Orders', total: `Total Orders: ${o.orders}`, colors: STATE_SOURCE_COLORS },
    { title: 'Orders by Source', icon: 'megaphone', rows: report.pies.source, center: 'Orders', total: `Total Orders: ${o.orders}`, colors: STATE_SOURCE_COLORS },
    { title: 'Orders by Brands', icon: 'car', rows: report.pies.brand, center: 'Cars', total: `Total Cars: ${report.totalCars}`, colors: BRAND_COLORS },
    { title: 'Customer Type', icon: 'users', rows: report.pies.customer, center: 'Orders', total: `Total Orders: ${o.orders}`, colors: CUSTOMER_COLORS },
  ]

  return (
    <div className="db rp-root" ref={rootRef}>
      <header className="rp-header">
        <div>
          <h2 className="rp-title">Reports</h2>
          <p className="rp-subtitle">View your detailed sales performance and insights.</p>
        </div>
        <div className="rp-controls">
          <div className="rp-filter">
            <span className="rp-filter-label" id="rp-period-label">Report Period</span>
            <div className="rp-select">
              <span className="rp-select-icon"><Icon name="calendar" size={20} /></span>
              <select aria-labelledby="rp-period-label" value={period} onChange={(e) => setPeriod(e.target.value)}>
                {PERIODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              <span className="rp-select-chevron"><Icon name="chevron" size={18} /></span>
            </div>
          </div>

          <div className="rp-filter">
            <span className="rp-filter-label">Month &amp; Year</span>
            {/* a disabled fieldset disables the picker's button; only "Monthly" lets you choose a month */}
            <fieldset className="rp-fieldset" disabled={period !== 'monthly'}>
              <MonthPicker value={effMonth} minYear={minYear} maxYear={maxYear} onChange={setMonth} />
            </fieldset>
          </div>

          <button type="button" className="rp-export" data-html2canvas-ignore="true" onClick={handleExport} disabled={!report || loading || exporting}>
            <RIcon name="download" size={22} />{exporting ? 'Exporting…' : 'Export'}
          </button>
        </div>
      </header>

      {exportError && <div className="rp-alert" role="alert" data-html2canvas-ignore="true">Export failed. {exportError}</div>}
      {failed && <div className="db-card db-message" role="alert">Unable to load the report. {result.error}</div>}
      {!failed && !report && <div className="db-card db-message">Loading report…</div>}

      {!failed && report && (
        <div className={`rp-body${loading ? ' is-loading' : ''}`} aria-busy={loading}>
          <section className="rp-panel">
            <PanelHead icon="coins" tone="amber" title="Financial Summary" sub={`Overall business performance for ${label}`} />
            <div className="rp-kpis6">
              <Kpi icon="coins" tone="amber" label="Total Cost Price" value={formatMoney(f.cost)} />
              <Kpi icon="tag" tone="red" label="Total Selling Price" value={formatMoney(f.sell)} />
              <Kpi icon="truck" tone="blue" label="Total Shipping Paid by Customer" value={formatMoney(f.shipC)} />
              <Kpi icon="truck" tone="green" label="Total Shipping Paid by Me" value={formatMoney(f.shipMe)} red={f.shipMe > f.shipC} />
              <Kpi icon="bars" tone="purple" label="Gross Profit" value={formatMoney(f.gross)} pct={f.grossPct} />
              <Kpi icon="bars" tone="green" label="Net Profit" value={formatMoney(f.net)} pct={f.netPct} />
            </div>
          </section>

          <section className="rp-panel">
            <PanelHead icon="barchart" title="Business Overview" sub={`Key numbers for ${label}`} />
            <div className="rp-kpis4">
              <Kpi icon="doc" tone="blue" label="Total Orders" value={String(o.orders)} />
              <Kpi icon="car" tone="green" label="Total Cars Sold" value={String(o.cars)} />
              <Kpi icon="userPlus" tone="purple" label="New Customers" value={String(o.newCustomers)} />
              <Kpi icon="users" tone="red" label="Existing Customers" value={String(o.existingCustomers)} />
            </div>
          </section>

          <section className="rp-panel">
            <PanelHead icon="barchart" title="Comparison" sub="Visualise key metrics over the selected period.">
              <label className="rp-compare">
                <span>Compare</span>
                <span className="rp-select rp-select-plain">
                  <select value={compare} onChange={(e) => setCompare(e.target.value)}>
                    {COMPARE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span className="rp-select-chevron"><Icon name="chevron" size={18} /></span>
                </span>
              </label>
            </PanelHead>
            <ComparisonChart labels={chart.labels} series={chart.series} money={chart.money} emptyText={noData ? `No data for ${label}` : ''} />
          </section>

          <div className="rp-pies">
            {pies.map((p) => (
              <section key={p.title} className="rp-panel rp-pie-panel">
                <div className="rp-pie-head">
                  <h3 className="rp-panel-title"><span className="rp-panel-icon rp-tone-plain"><RIcon name={p.icon} size={26} /></span>{p.title}</h3>
                  <span className="rp-total">{p.total}</span>
                </div>
                {p.rows.length > 0
                  ? <ReportPie rows={p.rows} centerLabel={p.center} colors={p.colors} />
                  : <div className="rp-empty">No data for {label}</div>}
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
