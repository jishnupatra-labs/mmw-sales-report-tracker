import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const today = new Date().toISOString().slice(0, 10)
const currentMonth = today.slice(0, 7)

const emptyOrder = {
  order_date: today,
  source_id: '',
  source_other: '',
  state_id: '',
  customer_type: 'new',
  shipping_paid_by_customer: 0,
  shipping_paid_by_me: 0,
  tracking_id: '',
  shipping_status: 'need_to_ship',
}

const emptyItem = {
  brand_id: '',
  series_name: '',
  car_name: '',
  quantity: 1,
  cost_price: '',
  selling_price: '',
}

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const pct = (value) => `${Number(value || 0).toFixed(2)}%`

function numberValue(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function itemTotals(item) {
  const qty = numberValue(item.quantity)
  const cost = qty * numberValue(item.cost_price)
  const selling = qty * numberValue(item.selling_price)
  return { cost, selling }
}

function statusLabel(status) {
  return status === 'need_to_ship' ? 'Need To Ship' : status === 'shipped' ? 'Shipped' : 'Delivered'
}

export default function SalesPage() {
  const [sources, setSources] = useState([])
  const [brands, setBrands] = useState([])
  const [states, setStates] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState('list')
  const [orderDraft, setOrderDraft] = useState({ ...emptyOrder })
  const [itemDraft, setItemDraft] = useState({ ...emptyItem })
  const [draftItems, setDraftItems] = useState([])
  const [currentOrder, setCurrentOrder] = useState(null)
  const [items, setItems] = useState([])
  const [itemDrafts, setItemDrafts] = useState({})
  const [busy, setBusy] = useState(false)
  const [monthFilter, setMonthFilter] = useState(currentMonth)

  async function loadLookups() {
    const [sourceResult, brandResult, stateResult] = await Promise.all([
      supabase.from('order_sources').select('id,name,requires_detail').eq('is_active', true).order('sort_order'),
      supabase.from('brands').select('id,name').eq('is_active', true).order('sort_order'),
      supabase.from('indian_states').select('id,name').order('name'),
    ])
    if (sourceResult.error) throw sourceResult.error
    if (brandResult.error) throw brandResult.error
    if (stateResult.error) throw stateResult.error
    setSources(sourceResult.data || [])
    setBrands(brandResult.data || [])
    setStates(stateResult.data || [])
  }

  async function loadOrders() {
    let query = supabase.from('v_order_summary').select('*').order('order_date', { ascending: false }).order('order_number', { ascending: false })
    if (monthFilter) {
      const [year, month] = monthFilter.split('-').map(Number)
      const start = `${monthFilter}-01`
      const next = new Date(year, month, 1).toISOString().slice(0, 10)
      query = query.gte('order_date', start).lt('order_date', next)
    }
    const { data, error: queryError } = await query
    if (queryError) throw queryError
    setOrders(data || [])
  }

  async function loadAll() {
    try {
      setError('')
      await Promise.all([loadLookups(), loadOrders()])
    } catch (e) {
      setError(e.message || 'Unable to load sales data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])
  useEffect(() => {
    loadOrders().catch((e) => setError(e.message || 'Unable to load orders.'))
  }, [monthFilter])

  const draftTotals = useMemo(() => draftItems.reduce((totals, item) => {
    const row = itemTotals(item)
    totals.cars += numberValue(item.quantity)
    totals.cost += row.cost
    totals.selling += row.selling
    return totals
  }, { cars: 0, cost: 0, selling: 0 }), [draftItems])

  const currentTotals = useMemo(() => items.reduce((totals, item) => {
    const row = itemTotals(item)
    totals.cars += numberValue(item.quantity)
    totals.cost += row.cost
    totals.selling += row.selling
    return totals
  }, { cars: 0, cost: 0, selling: 0 }), [items])

  const dashboardTotals = useMemo(() => orders.reduce((totals, order) => {
    totals.orders += 1
    totals.cars += numberValue(order.car_count)
    totals.cost += numberValue(order.total_cost_price)
    totals.selling += numberValue(order.total_selling_price)
    return totals
  }, { orders: 0, cars: 0, cost: 0, selling: 0 }), [orders])

  const dashboardGross = dashboardTotals.selling - dashboardTotals.cost
  const dashboardGrossPct = dashboardTotals.cost ? (dashboardGross / dashboardTotals.cost) * 100 : 0
  const currentGross = currentTotals.selling - currentTotals.cost
  const currentGrossPct = currentTotals.cost ? (currentGross / currentTotals.cost) * 100 : 0

  function updateOrderDraft(key, value) {
    setOrderDraft((draft) => ({ ...draft, [key]: value }))
  }

  function updateItemDraft(key, value) {
    setItemDraft((draft) => ({ ...draft, [key]: value }))
  }

  function startNewOrder() {
    setError('')
    const westBengal = states.find((state) => state.name === 'West Bengal')
    setOrderDraft({
      ...emptyOrder,
      source_id: sources[0]?.id ? String(sources[0].id) : '',
      state_id: westBengal?.id ? String(westBengal.id) : '',
    })
    setItemDraft({ ...emptyItem })
    setDraftItems([])
    setCurrentOrder(null)
    setItems([])
    setView('new')
  }

  function addDraftItem(e) {
    e.preventDefault()
    setError('')
    if (!itemDraft.brand_id || !itemDraft.series_name.trim() || !itemDraft.car_name.trim()) {
      setError('Brand, series name and car name are required.')
      return
    }
    if (numberValue(itemDraft.quantity) <= 0 || numberValue(itemDraft.cost_price) < 0 || numberValue(itemDraft.selling_price) < 0) {
      setError('Quantity must be greater than 0 and prices cannot be negative.')
      return
    }
    setDraftItems((items) => [...items, {
      ...itemDraft,
      brand_id: Number(itemDraft.brand_id),
      quantity: Math.floor(numberValue(itemDraft.quantity)),
      cost_price: numberValue(itemDraft.cost_price),
      selling_price: numberValue(itemDraft.selling_price),
    }])
    setItemDraft({ ...emptyItem })
  }

  function removeDraftItem(index) {
    setDraftItems((items) => items.filter((_, itemIndex) => itemIndex !== index))
  }

  function updateDraftItem(index, key, value) {
    setDraftItems((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item))
  }

  async function saveNewOrder(e) {
    e.preventDefault()
    setError('')
    if (!orderDraft.source_id || !orderDraft.state_id) {
      setError('Please select the source and state.')
      return
    }
    if (draftItems.length === 0) {
      setError('Add at least one car before saving the order.')
      return
    }
    const source = sources.find((item) => String(item.id) === String(orderDraft.source_id))
    if (source?.requires_detail && !orderDraft.source_other.trim()) {
      setError('Please enter the exact source for Other.')
      return
    }

    setBusy(true)
    const orderPayload = {
      ...orderDraft,
      source_id: Number(orderDraft.source_id),
      state_id: Number(orderDraft.state_id),
      shipping_paid_by_customer: numberValue(orderDraft.shipping_paid_by_customer),
      shipping_paid_by_me: numberValue(orderDraft.shipping_paid_by_me),
      tracking_id: orderDraft.tracking_id.trim() || null,
      source_other: source?.requires_detail ? orderDraft.source_other.trim() : null,
    }

    const { data: order, error: orderError } = await supabase.from('orders').insert(orderPayload).select('id,order_number').single()
    if (orderError) {
      setBusy(false)
      setError(orderError.message)
      return
    }

    const itemPayload = draftItems.map((item) => ({
      order_id: order.id,
      brand_id: Number(item.brand_id),
      series_name: item.series_name.trim(),
      car_name: item.car_name.trim(),
      quantity: Math.floor(numberValue(item.quantity)),
      cost_price: numberValue(item.cost_price),
      selling_price: numberValue(item.selling_price),
    }))
    const { error: itemsError } = await supabase.from('order_items').insert(itemPayload)
    if (itemsError) {
      await supabase.from('orders').delete().eq('id', order.id)
      setBusy(false)
      setError(itemsError.message)
      return
    }

    setBusy(false)
    setView('list')
    await loadOrders()
  }

  async function openOrder(orderId) {
    setBusy(true)
    setError('')
    const [orderResult, itemResult] = await Promise.all([
      supabase.from('orders').select('*, order_sources(name,requires_detail), indian_states(name)').eq('id', orderId).single(),
      supabase.from('order_items').select('id,order_id,brand_id,series_name,car_name,quantity,cost_price,selling_price,brands(name)').eq('order_id', orderId).order('created_at'),
    ])
    setBusy(false)
    if (orderResult.error) { setError(orderResult.error.message); return }
    if (itemResult.error) { setError(itemResult.error.message); return }
    setCurrentOrder(orderResult.data)
    setItems(itemResult.data || [])
    setItemDrafts(Object.fromEntries((itemResult.data || []).map((item) => [item.id, { ...item }])))
    setItemDraft({ ...emptyItem })
    setView('detail')
  }

  async function updateOrder(e) {
    e.preventDefault()
    if (!currentOrder) return
    setBusy(true)
    setError('')
    const source = sources.find((item) => String(item.id) === String(currentOrder.source_id))
    const payload = {
      order_date: currentOrder.order_date,
      source_id: Number(currentOrder.source_id),
      source_other: source?.requires_detail ? (currentOrder.source_other || '').trim() : null,
      state_id: Number(currentOrder.state_id),
      customer_type: currentOrder.customer_type,
      shipping_paid_by_customer: numberValue(currentOrder.shipping_paid_by_customer),
      shipping_paid_by_me: numberValue(currentOrder.shipping_paid_by_me),
      tracking_id: currentOrder.tracking_id?.trim() || null,
      shipping_status: currentOrder.shipping_status,
    }
    const { error: updateError } = await supabase.from('orders').update(payload).eq('id', currentOrder.id)
    setBusy(false)
    if (updateError) { setError(updateError.message); return }
    setView('list')
    setCurrentOrder(null)
    await loadOrders()
  }

  async function updateItem(itemId) {
    const draft = itemDrafts[itemId]
    if (!draft) return
    setBusy(true)
    setError('')
    const payload = {
      brand_id: Number(draft.brand_id),
      series_name: draft.series_name.trim(),
      car_name: draft.car_name.trim(),
      quantity: Math.max(1, Math.floor(numberValue(draft.quantity))),
      cost_price: Math.max(0, numberValue(draft.cost_price)),
      selling_price: Math.max(0, numberValue(draft.selling_price)),
    }
    const { error: updateError } = await supabase.from('order_items').update(payload).eq('id', itemId)
    setBusy(false)
    if (updateError) { setError(updateError.message); return }
    await openOrder(currentOrder.id)
  }

  async function deleteItem(itemId) {
    if (!window.confirm('Delete this car entry from the order?')) return
    setBusy(true)
    const { error: deleteError } = await supabase.from('order_items').delete().eq('id', itemId)
    setBusy(false)
    if (deleteError) { setError(deleteError.message); return }
    await openOrder(currentOrder.id)
  }

  async function deleteOrder() {
    if (!currentOrder) return
    const ok = window.confirm(`Permanently delete ${currentOrder.order_number}? This cannot be undone.`)
    if (!ok) return
    setBusy(true)
    const { error: deleteError } = await supabase.from('orders').delete().eq('id', currentOrder.id)
    setBusy(false)
    if (deleteError) { setError(deleteError.message); return }
    setView('list')
    setCurrentOrder(null)
    await loadOrders()
  }

  function updateCurrentOrder(key, value) {
    setCurrentOrder((order) => ({ ...order, [key]: value }))
  }

  function updateItemDraftValue(itemId, key, value) {
    setItemDrafts((drafts) => ({ ...drafts, [itemId]: { ...drafts[itemId], [key]: value } }))
  }

  if (loading) return <section><h2>Sales</h2><div className="card">Loading sales data…</div></section>

  if (view === 'new') {
    const selectedSource = sources.find((source) => String(source.id) === String(orderDraft.source_id))
    const draftGross = draftTotals.selling - draftTotals.cost
    const draftGrossPct = draftTotals.cost ? (draftGross / draftTotals.cost) * 100 : 0

    return (
      <section>
        <div className="page-heading">
          <div><h2>New Order</h2><p className="muted">Enter order details and add the cars in this order.</p></div>
          <button className="btn" onClick={() => setView('list')}>Cancel</button>
        </div>
        {error && <div className="alert error">{error}</div>}

        <form onSubmit={saveNewOrder}>
          <div className="card form-card">
            <div className="section-title"><h3>Order Details</h3><span className="muted">Order number is generated when saved</span></div>
            <div className="form-grid order-detail-grid">
              <div><label>Order date</label><input type="date" value={orderDraft.order_date} onChange={(e) => updateOrderDraft('order_date', e.target.value)} required /></div>
              <div><label>Source</label><select value={orderDraft.source_id} onChange={(e) => updateOrderDraft('source_id', e.target.value)} required><option value="">Select source</option>{sources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}</select></div>
              {selectedSource?.requires_detail && <div><label>Exact source</label><input value={orderDraft.source_other} onChange={(e) => updateOrderDraft('source_other', e.target.value)} placeholder="Enter exact source" required /></div>}
              <div><label>State</label><select value={orderDraft.state_id} onChange={(e) => updateOrderDraft('state_id', e.target.value)} required><option value="">Select state</option>{states.map((state) => <option key={state.id} value={state.id}>{state.name}</option>)}</select></div>
              <div><label>Customer</label><select value={orderDraft.customer_type} onChange={(e) => updateOrderDraft('customer_type', e.target.value)}><option value="new">New customer</option><option value="existing">Existing customer</option></select></div>
              <div><label>Shipping paid by customer (₹)</label><input type="number" min="0" step="0.01" value={orderDraft.shipping_paid_by_customer} onChange={(e) => updateOrderDraft('shipping_paid_by_customer', e.target.value)} /></div>
              <div><label>Shipping paid by me (₹)</label><input type="number" min="0" step="0.01" value={orderDraft.shipping_paid_by_me} onChange={(e) => updateOrderDraft('shipping_paid_by_me', e.target.value)} /></div>
              <div><label>Tracking ID</label><input value={orderDraft.tracking_id} onChange={(e) => updateOrderDraft('tracking_id', e.target.value)} placeholder="Optional" /></div>
              <div><label>Shipping status</label><select value={orderDraft.shipping_status} onChange={(e) => updateOrderDraft('shipping_status', e.target.value)}><option value="need_to_ship">Need To Ship</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option></select></div>
            </div>
          </div>

          <div className="card form-card cars-card">
            <div className="section-title"><h3>Cars in this order</h3><span className="muted">Total cars: {draftTotals.cars}</span></div>
            <div className="cars-grid cars-header-row">
              <div>#</div><div>Brand</div><div>Series</div><div>Car name</div><div>Qty</div><div>CP / car (₹)</div><div>SP / car (₹)</div><div>Total CP (₹)</div><div>Total SP (₹)</div><div>Actions</div>
            </div>
            {draftItems.length === 0 && <p className="muted empty-cars">No cars added yet.</p>}
            {draftItems.map((item, index) => {
              const row = itemTotals(item)
              return <div className="cars-grid cars-data-row" key={`${index}-${item.car_name}`}>
                <div className="row-number">{index + 1}</div>
                <div><select aria-label="Brand" value={item.brand_id} onChange={(e) => updateDraftItem(index, 'brand_id', e.target.value)}>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></div>
                <div><input aria-label="Series" value={item.series_name} onChange={(e) => updateDraftItem(index, 'series_name', e.target.value)} /></div>
                <div><input aria-label="Car name" value={item.car_name} onChange={(e) => updateDraftItem(index, 'car_name', e.target.value)} /></div>
                <div><input aria-label="Quantity" type="number" min="1" step="1" value={item.quantity} onChange={(e) => updateDraftItem(index, 'quantity', e.target.value)} /></div>
                <div><input aria-label="Cost price per car" type="number" min="0" step="0.01" value={item.cost_price} onChange={(e) => updateDraftItem(index, 'cost_price', e.target.value)} /></div>
                <div><input aria-label="Selling price per car" type="number" min="0" step="0.01" value={item.selling_price} onChange={(e) => updateDraftItem(index, 'selling_price', e.target.value)} /></div>
                <div className="item-total-cell">{money(row.cost)}</div>
                <div className="item-total-cell">{money(row.selling)}</div>
                <div className="row-actions"><button type="button" className="btn small danger-outline" onClick={() => removeDraftItem(index)}>Delete</button></div>
              </div>
            })}
            <div className="add-item">
              <h4>Add another car</h4>
              <div className="cars-grid new-car-row">
                <div><select aria-label="Brand" value={itemDraft.brand_id} onChange={(e) => updateItemDraft('brand_id', e.target.value)} required><option value="">Select brand</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></div>
                <div><input aria-label="Series" value={itemDraft.series_name} onChange={(e) => updateItemDraft('series_name', e.target.value)} placeholder="Series name" /></div>
                <div><input aria-label="Car name" value={itemDraft.car_name} onChange={(e) => updateItemDraft('car_name', e.target.value)} placeholder="Car name" /></div>
                <div><input aria-label="Quantity" type="number" min="1" step="1" value={itemDraft.quantity} onChange={(e) => updateItemDraft('quantity', e.target.value)} /></div>
                <div><input aria-label="Cost price per car" type="number" min="0" step="0.01" value={itemDraft.cost_price} onChange={(e) => updateItemDraft('cost_price', e.target.value)} placeholder="CP / car" /></div>
                <div><input aria-label="Selling price per car" type="number" min="0" step="0.01" value={itemDraft.selling_price} onChange={(e) => updateItemDraft('selling_price', e.target.value)} placeholder="SP / car" /></div>
                <div className="new-car-spacer"></div><div className="new-car-spacer"></div>
                <button type="button" className="btn primary compact add-car-btn" onClick={addDraftItem}>+ Add Car</button>
              </div>
            </div>
          </div>

          <div className="summary-grid new-summary">
            <div className="stat shipping-stat"><span>Shipping paid by customer</span><strong>{money(orderDraft.shipping_paid_by_customer)}</strong></div>
            <div className="stat shipping-stat"><span>Shipping paid by me</span><strong>{money(orderDraft.shipping_paid_by_me)}</strong></div>
            <div className="stat"><span>Total Cars</span><strong>{draftTotals.cars}</strong></div>
            <div className="stat"><span>Total Cost Price</span><strong>{money(draftTotals.cost)}</strong></div>
            <div className="stat"><span>Total Selling Price</span><strong>{money(draftTotals.selling)}</strong></div>
            <div className="stat profit-stat"><span>Gross Profit</span><strong>{money(draftGross)}</strong><small>{pct(draftGrossPct)}</small></div>
          </div>
          <div className="form-actions"><button type="button" className="btn" onClick={() => setView('list')}>Cancel</button><button type="submit" className="btn primary" disabled={busy || draftItems.length === 0}>{busy ? 'Saving…' : 'Save Order Details'}</button></div>
        </form>
      </section>
    )
  }

  if (view === 'detail' && currentOrder) {
    const source = sources.find((item) => String(item.id) === String(currentOrder.source_id))
    const gross = currentTotals.selling - currentTotals.cost
    const grossPct = currentTotals.cost ? (gross / currentTotals.cost) * 100 : 0

    return (
      <section>
        <div className="page-heading"><div><h2>{currentOrder.order_number}</h2><p className="muted">Order details and car entries</p></div><div className="heading-actions"><button className="btn" onClick={() => { setView('list'); loadOrders() }}>Back to orders</button><button className="btn danger-outline" onClick={deleteOrder} disabled={busy}>Delete Order</button></div></div>
        {error && <div className="alert error">{error}</div>}
        <form className="card form-card" onSubmit={updateOrder}>
          <div className="section-title"><h3>Order Details</h3><span className={`status status-${currentOrder.shipping_status}`}>{statusLabel(currentOrder.shipping_status)}</span></div>
          <div className="form-grid order-detail-grid">
            <div><label>Order number</label><input value={currentOrder.order_number} disabled /></div>
            <div><label>Order date</label><input type="date" value={currentOrder.order_date} onChange={(e) => updateCurrentOrder('order_date', e.target.value)} required /></div>
            <div><label>Source</label><select value={currentOrder.source_id} onChange={(e) => updateCurrentOrder('source_id', Number(e.target.value))} required>{sources.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
            {source?.requires_detail && <div><label>Exact source</label><input value={currentOrder.source_other || ''} onChange={(e) => updateCurrentOrder('source_other', e.target.value)} required /></div>}
            <div><label>State</label><select value={currentOrder.state_id} onChange={(e) => updateCurrentOrder('state_id', Number(e.target.value))} required>{states.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
            <div><label>Customer</label><select value={currentOrder.customer_type} onChange={(e) => updateCurrentOrder('customer_type', e.target.value)}><option value="new">New customer</option><option value="existing">Existing customer</option></select></div>
            <div><label>Shipping paid by customer (₹)</label><input type="number" min="0" step="0.01" value={currentOrder.shipping_paid_by_customer} onChange={(e) => updateCurrentOrder('shipping_paid_by_customer', e.target.value)} /></div>
            <div><label>Shipping paid by me (₹)</label><input type="number" min="0" step="0.01" value={currentOrder.shipping_paid_by_me} onChange={(e) => updateCurrentOrder('shipping_paid_by_me', e.target.value)} /></div>
            <div><label>Tracking ID</label><input value={currentOrder.tracking_id || ''} onChange={(e) => updateCurrentOrder('tracking_id', e.target.value)} /></div>
            <div><label>Shipping status</label><select value={currentOrder.shipping_status} onChange={(e) => updateCurrentOrder('shipping_status', e.target.value)}><option value="need_to_ship">Need To Ship</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option></select></div>
          </div>
          <button className="btn primary compact" disabled={busy}>{busy ? 'Saving…' : 'Save Order Details'}</button>
        </form>

        <div className="summary-grid">
          <div className="stat shipping-stat"><span>Shipping paid by customer</span><strong>{money(currentOrder.shipping_paid_by_customer)}</strong></div>
          <div className="stat shipping-stat"><span>Shipping paid by me</span><strong>{money(currentOrder.shipping_paid_by_me)}</strong></div>
          <div className="stat"><span>Total Cars</span><strong>{currentTotals.cars}</strong></div>
          <div className="stat"><span>Total Cost Price</span><strong>{money(currentTotals.cost)}</strong></div>
          <div className="stat"><span>Total Selling Price</span><strong>{money(currentTotals.selling)}</strong></div>
          <div className="stat profit-stat"><span>Gross Profit</span><strong>{money(gross)}</strong><small>{pct(grossPct)}</small></div>
        </div>

        <div className="card form-card cars-card">
          <div className="section-title"><h3>Cars in this order</h3><span className="muted">{currentTotals.cars} cars</span></div>
          {items.length === 0 && <p className="muted">No cars added yet. Add the first car below.</p>}
          <div className="cars-grid cars-header-row">
            <div>#</div><div>Brand</div><div>Series</div><div>Car name</div><div>Qty</div><div>CP / car</div><div>SP / car</div><div>Total CP</div><div>Total SP</div><div>Actions</div>
          </div>
          {items.map((item, index) => {
            const draft = itemDrafts[item.id] || item
            const row = itemTotals(draft)
            return <div className="cars-grid cars-data-row" key={item.id}>
              <div className="row-number">{index + 1}</div>
              <div><select aria-label="Brand" value={draft.brand_id} onChange={(e) => updateItemDraftValue(item.id, 'brand_id', e.target.value)}>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></div>
              <div><input aria-label="Series" value={draft.series_name} onChange={(e) => updateItemDraftValue(item.id, 'series_name', e.target.value)} /></div>
              <div><input aria-label="Car name" value={draft.car_name} onChange={(e) => updateItemDraftValue(item.id, 'car_name', e.target.value)} /></div>
              <div><input aria-label="Quantity" type="number" min="1" step="1" value={draft.quantity} onChange={(e) => updateItemDraftValue(item.id, 'quantity', e.target.value)} /></div>
              <div><input aria-label="Cost price per car" type="number" min="0" step="0.01" value={draft.cost_price} onChange={(e) => updateItemDraftValue(item.id, 'cost_price', e.target.value)} /></div>
              <div><input aria-label="Selling price per car" type="number" min="0" step="0.01" value={draft.selling_price} onChange={(e) => updateItemDraftValue(item.id, 'selling_price', e.target.value)} /></div>
              <div className="item-total-cell">{money(row.cost)}</div>
              <div className="item-total-cell">{money(row.selling)}</div>
              <div className="row-actions"><button className="btn small" onClick={() => updateItem(item.id)} disabled={busy}>Save</button><button className="btn small danger-outline" onClick={() => deleteItem(item.id)} disabled={busy}>Delete</button></div>
            </div>
          })}
          <form className="add-item" onSubmit={async (e) => {
            e.preventDefault()
            if (!itemDraft.brand_id || !itemDraft.series_name.trim() || !itemDraft.car_name.trim()) { setError('Brand, series name and car name are required.'); return }
            if (numberValue(itemDraft.quantity) <= 0 || numberValue(itemDraft.cost_price) < 0 || numberValue(itemDraft.selling_price) < 0) { setError('Quantity must be greater than 0 and prices cannot be negative.'); return }
            setBusy(true)
            const payload = { order_id: currentOrder.id, brand_id: Number(itemDraft.brand_id), series_name: itemDraft.series_name.trim(), car_name: itemDraft.car_name.trim(), quantity: Math.floor(numberValue(itemDraft.quantity)), cost_price: numberValue(itemDraft.cost_price), selling_price: numberValue(itemDraft.selling_price) }
            const { error: insertError } = await supabase.from('order_items').insert(payload)
            setBusy(false)
            if (insertError) { setError(insertError.message); return }
            setItemDraft({ ...emptyItem })
            await openOrder(currentOrder.id)
          }}>
            <h4>Add another car</h4>
            <div className="cars-grid new-car-row">
              <div><select aria-label="Brand" value={itemDraft.brand_id} onChange={(e) => updateItemDraft('brand_id', e.target.value)} required><option value="">Select brand</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></div>
              <div><input aria-label="Series" value={itemDraft.series_name} onChange={(e) => updateItemDraft('series_name', e.target.value)} placeholder="Series name" required /></div>
              <div><input aria-label="Car name" value={itemDraft.car_name} onChange={(e) => updateItemDraft('car_name', e.target.value)} placeholder="Car name" required /></div>
              <div><input aria-label="Quantity" type="number" min="1" step="1" value={itemDraft.quantity} onChange={(e) => updateItemDraft('quantity', e.target.value)} required /></div>
              <div><input aria-label="Cost price per car" type="number" min="0" step="0.01" value={itemDraft.cost_price} onChange={(e) => updateItemDraft('cost_price', e.target.value)} placeholder="CP / car" required /></div>
              <div><input aria-label="Selling price per car" type="number" min="0" step="0.01" value={itemDraft.selling_price} onChange={(e) => updateItemDraft('selling_price', e.target.value)} placeholder="SP / car" required /></div>
              <div className="new-car-spacer"></div><div className="new-car-spacer"></div>
              <button className="btn primary compact add-car-btn" disabled={busy}>{busy ? 'Adding…' : '+ Add Car'}</button>
            </div>
          </form>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="dashboard-head">
        <div className="dashboard-title-block">
          <h2>Sales</h2>
          <div className="month-control"><label>Month</label><input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} /></div>
        </div>
        <div className="summary-grid dashboard-summary">
          <div className="stat"><span>Total Orders</span><strong>{dashboardTotals.orders}</strong></div>
          <div className="stat"><span>Total Cars</span><strong>{dashboardTotals.cars}</strong></div>
          <div className="stat"><span>Total Cost Price</span><strong>{money(dashboardTotals.cost)}</strong></div>
          <div className="stat"><span>Total Selling Price</span><strong>{money(dashboardTotals.selling)}</strong></div>
          <div className="stat profit-stat"><span>Gross Profit</span><strong>{money(dashboardGross)}</strong><small>{pct(dashboardGrossPct)}</small></div>
        </div>
        <button className="btn primary action-btn" onClick={startNewOrder}>+ New Order</button>
      </div>
      {error && <div className="alert error">{error}</div>}

      <div className="card table-card">
        <div className="section-title"><h3>Orders</h3><span className="muted">{orders.length} order{orders.length === 1 ? '' : 's'}</span></div>
        {orders.length === 0 ? <p className="muted">No orders found for this month. Click <strong>+ New Order</strong> to record your first sale.</p> : (
          <div className="table-wrap"><table><thead><tr><th>Order ID</th><th>Number of cars</th><th>Total Cost Price</th><th>Total Selling Price</th><th>Gross Profit</th><th>Status</th><th>Action</th></tr></thead><tbody>{orders.map((order) => {
            const gross = numberValue(order.total_selling_price) - numberValue(order.total_cost_price)
            const grossPct = numberValue(order.total_cost_price) ? (gross / numberValue(order.total_cost_price)) * 100 : 0
            return <tr key={order.id}>
              <td><strong>{order.order_number}</strong></td>
              <td>{order.car_count}</td>
              <td>{money(order.total_cost_price)}</td>
              <td>{money(order.total_selling_price)}</td>
              <td><strong>{money(gross)}</strong> <span className="muted">({pct(grossPct)})</span></td>
              <td><span className={`status status-${order.shipping_status}`}>{statusLabel(order.shipping_status)}</span></td>
              <td><button className="btn small open-btn" onClick={() => openOrder(order.id)}>Open</button></td>
            </tr>
          })}</tbody></table></div>
        )}
      </div>
    </section>
  )
}
