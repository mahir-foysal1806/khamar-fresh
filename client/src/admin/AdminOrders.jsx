import { useMemo, useState } from 'react';
import { Search, X, Phone, MessageCircle, MapPin, ChevronDown, Layers, List, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useFetch, useDebounced } from '../lib/hooks';
import { api } from '../lib/api';
import { money, dateTime, ORDER_STATUS } from '../lib/format';
import { DISTRICTS } from '../data/districts';

const FLOW = ['pending', 'processing', 'shipped', 'delivered'];

function OrderModal({ order, onClose, onChange }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(order.adminNote || '');
  const o = order;
  const setStatus = async (status) => {
    if (status === 'cancelled' && !confirm('Cancel this order? Stock will be restored.')) return;
    setBusy(true);
    try { const r = await api.apatch(`/admin/orders/${o._id}/status`, { status }); onChange(r); toast.success(`Marked ${ORDER_STATUS[status].label}`); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const setPay = async (patch) => { try { onChange(await api.apatch(`/admin/orders/${o._id}/payment`, patch)); toast.success('Saved'); } catch (e) { toast.error(e.message); } };
  const phoneIntl = `88${o.customer.phone}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-h-[94vh] w-full max-w-2xl animate-rise overflow-y-auto rounded-t-3xl bg-white sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-earth-100 bg-white p-4">
          <div><p className="font-display text-lg font-bold">{o.orderId}</p><p className="text-xs text-earth-500">{dateTime(o.createdAt)}</p></div>
          <div className="flex items-center gap-2"><span className={`chip !text-xs ${ORDER_STATUS[o.status].cls}`}>{ORDER_STATUS[o.status].label}</span><button onClick={onClose} aria-label="Close"><X /></button></div>
        </div>
        <div className="space-y-5 p-4 sm:p-6">
          <div className="rounded-2xl bg-earth-50 p-4 text-sm">
            <p className="text-base font-bold">{o.customer.name}</p>
            <p className="mt-1 flex items-start gap-1.5"><MapPin size={15} className="mt-0.5 shrink-0 text-leaf-600" /><span>{o.customer.address}{o.customer.upazila && `, ${o.customer.upazila}`}, <b>{o.customer.district}</b></span></p>
            {o.customer.notes && <p className="mt-2 rounded-lg bg-honey-50 p-2 text-honey-700">📝 {o.customer.notes}</p>}
            <div className="mt-3 flex gap-2"><a href={`tel:${o.customer.phone}`} className="btn-primary !py-2"><Phone size={15} /> {o.customer.phone}</a><a href={`https://wa.me/${phoneIntl}`} target="_blank" rel="noreferrer" className="btn bg-[#25D366] !py-2 text-white"><MessageCircle size={15} /> WhatsApp</a></div>
          </div>

          <div>
            <p className="label">Update stage</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {FLOW.map((s) => <button key={s} disabled={busy || o.status === s} onClick={() => setStatus(s)} className={`btn !py-2.5 text-xs ${o.status === s ? ORDER_STATUS[s].cls + ' ring-2 ring-current' : 'border border-earth-200 bg-white hover:bg-earth-50'}`}>{ORDER_STATUS[s].label}</button>)}
            </div>
            {o.status !== 'cancelled' ? <button disabled={busy} onClick={() => setStatus('cancelled')} className="mt-2 text-xs font-semibold text-red-600 hover:underline">Cancel order</button> : <button disabled={busy} onClick={() => setStatus('pending')} className="mt-2 text-xs font-semibold text-leaf-700 hover:underline">Re-open order</button>}
          </div>

          <ul className="divide-y divide-earth-100 rounded-2xl border border-earth-100 text-sm">
            {o.items.map((i, n) => <li key={n} className="flex justify-between gap-3 p-3"><span>{i.name} <span className="text-earth-500">× {i.qty} {i.unit}</span>{i.preorder && <span className="chip ml-2 bg-sky-100 text-sky-800">Pre-order</span>}</span><b>{money(i.price * i.qty)}</b></li>)}
            <li className="flex justify-between p-3 text-earth-600"><span>Subtotal</span><span>{money(o.subtotal)}</span></li>
            <li className="flex justify-between p-3 text-earth-600"><span>Delivery ({o.deliveryZone === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'} · {o.totalWeightKg?.toFixed(1)}kg)</span><span>{money(o.shippingCharge)}</span></li>
            <li className="flex justify-between p-3 text-base font-bold"><span>Total</span><span className="text-leaf-700">{money(o.total)}</span></li>
          </ul>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-earth-100 p-3 text-sm">
              <p className="font-semibold">Payment: {o.payment.method.toUpperCase()}</p>
              {o.payment.transactionId && <p className="text-xs text-earth-600">TrxID: <b>{o.payment.transactionId}</b>{o.payment.senderNumber && ` · from ${o.payment.senderNumber}`}</p>}
              <select className="input mt-2 !py-2" value={o.payment.status} onChange={(e) => setPay({ status: e.target.value })}>{['unpaid', 'paid', 'failed', 'refunded'].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select>
            </div>
            <div className="rounded-2xl border border-earth-100 p-3 text-sm">
              <p className="font-semibold">Internal note</p>
              <textarea rows={2} className="input mt-2 !py-2" placeholder="Only visible to staff" value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => note !== (o.adminNote || '') && setPay({ adminNote: note })} />
            </div>
          </div>

          <ul className="space-y-1 text-xs text-earth-500">{[...o.statusHistory].reverse().map((h, n) => <li key={n}>• {ORDER_STATUS[h.status]?.label} — {dateTime(h.at)}{h.by && ` · ${h.by}`}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}

function OrderRow({ o, onOpen }) {
  return (
    <button onClick={() => onOpen(o)} className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-leaf-50/60">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{o.customer.name} <span className="font-normal text-earth-500">· {o.customer.phone}</span></p>
        <p className="truncate text-xs text-earth-500">{o.orderId} · {o.customer.district} · {o.items.length} item(s) · {dateTime(o.createdAt)}</p>
      </div>
      <div className="text-right"><p className="text-sm font-bold">{money(o.total)}</p><p className="text-[11px] text-earth-500">{o.payment.method.toUpperCase()} · {o.payment.status}</p></div>
      <span className={`chip hidden sm:inline-flex ${ORDER_STATUS[o.status].cls}`}>{ORDER_STATUS[o.status].label}</span>
    </button>
  );
}

export default function AdminOrders() {
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [mode, setMode] = useState('district');
  const [open, setOpen] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const ds = useDebounced(search, 350);
  const { data, setData, loading, reload } = useFetch(() => api.aget('/admin/orders', { status, search: ds, district }), [status, ds, district]);

  const counts = useMemo(() => (data || []).reduce((a, o) => ({ ...a, [o.status]: (a[o.status] || 0) + 1 }), {}), [data]);
  const groups = useMemo(() => {
    const m = {};
    (data || []).forEach((o) => { (m[o.customer.district] ||= []).push(o); });
    return Object.entries(m).sort((a, b) => b[1].length - a[1].length);
  }, [data]);
  const update = (o) => { setData((cur) => cur.map((x) => (x._id === o._id ? o : x))); setOpen(o); };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center justify-between"><div><h1 className="text-2xl font-bold text-leaf-800 sm:text-3xl">Orders</h1><p className="text-sm text-earth-500">{data?.length ?? 0} order(s) shown</p></div><button onClick={reload} className="btn-ghost" aria-label="Refresh"><RefreshCw size={16} /></button></div>

      <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_200px_auto]">
        <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" /><input className="input pl-9" placeholder="Search phone, order ID or name…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <select className="input" value={district} onChange={(e) => setDistrict(e.target.value)}><option value="">All districts</option>{DISTRICTS.slice().sort().map((d) => <option key={d}>{d}</option>)}</select>
        <div className="flex rounded-xl border border-earth-200 bg-white p-1">
          <button onClick={() => setMode('district')} className={`btn !px-3 !py-1.5 text-xs ${mode === 'district' ? 'bg-leaf-600 text-white' : 'text-earth-600'}`}><Layers size={14} /> By district</button>
          <button onClick={() => setMode('list')} className={`btn !px-3 !py-1.5 text-xs ${mode === 'list' ? 'bg-leaf-600 text-white' : 'text-earth-600'}`}><List size={14} /> List</button>
        </div>
      </div>

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`chip whitespace-nowrap !px-3.5 !py-1.5 !text-xs ${status === s ? 'bg-leaf-600 text-white' : 'bg-white text-earth-700 ring-1 ring-earth-200'}`}>{s === 'all' ? 'All' : ORDER_STATUS[s].label}{status === 'all' && s !== 'all' && counts[s] ? ` (${counts[s]})` : ''}</button>
        ))}
      </div>

      {loading ? <div className="py-16 text-center"><Loader2 className="mx-auto animate-spin text-leaf-600" /></div> : !data?.length ? <p className="py-12 text-center text-earth-500">No orders found.</p> : mode === 'list' ? (
        <div className="card divide-y divide-earth-100 overflow-hidden">{data.map((o) => <OrderRow key={o._id} o={o} onOpen={setOpen} />)}</div>
      ) : (
        <div className="space-y-3">
          {groups.map(([d, list]) => (
            <section key={d} className="card overflow-hidden">
              <button onClick={() => setCollapsed((c) => ({ ...c, [d]: !c[d] }))} className="flex w-full items-center gap-3 bg-leaf-50 px-4 py-3 text-left">
                <MapPin size={16} className="text-leaf-600" /><span className="font-sans font-bold text-leaf-800">{d}</span>
                <span className="chip bg-white text-leaf-700">{list.length} order{list.length > 1 ? 's' : ''}</span>
                <span className="ml-auto text-sm font-semibold text-earth-700">{money(list.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0))}</span>
                <ChevronDown size={16} className={`transition ${collapsed[d] ? '-rotate-90' : ''}`} />
              </button>
              {!collapsed[d] && <div className="divide-y divide-earth-100">{list.map((o) => <OrderRow key={o._id} o={o} onOpen={setOpen} />)}</div>}
            </section>
          ))}
        </div>
      )}
      {open && <OrderModal order={open} onClose={() => setOpen(null)} onChange={update} />}
    </div>
  );
}
