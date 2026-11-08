import { useState } from 'react';
import { PackageSearch, Check, Loader2 } from 'lucide-react';
import Seo from '../components/Seo';
import { api } from '../lib/api';
import { money, dateTime, ORDER_STATUS } from '../lib/format';

const STEPS = ['pending', 'processing', 'shipped', 'delivered'];

export default function TrackOrder() {
  const [f, setF] = useState(() => ({ orderId: new URLSearchParams(location.search).get('id') || '', phone: '' }));
  const [order, setOrder] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(''); setOrder(null);
    try { setOrder(await api.get('/orders/track', f)); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  const idx = order ? STEPS.indexOf(order.status) : -1;

  return (
    <div className="container-x py-8">
      <Seo title="Track your order" noindex />
      <div className="mx-auto max-w-xl">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-leaf-800"><PackageSearch /> Track your order</h1>
        <form onSubmit={submit} className="card mt-5 space-y-3 p-5">
          <input className="input" placeholder="Order ID (e.g. KF2411081234)" value={f.orderId} onChange={(e) => setF({ ...f, orderId: e.target.value })} required />
          <input className="input" type="tel" inputMode="tel" placeholder="Phone number used for the order" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} required />
          <button className="btn-primary w-full" disabled={busy}>{busy ? <Loader2 className="animate-spin" size={16} /> : 'Track'}</button>
          {err && <p className="text-sm font-medium text-red-600" role="alert">{err}</p>}
        </form>

        {order && (
          <div className="card mt-5 space-y-5 p-5">
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-earth-500">Order</p><p className="font-display text-xl font-bold">{order.orderId}</p></div>
              <span className={`chip !text-sm ${ORDER_STATUS[order.status].cls}`}>{ORDER_STATUS[order.status].label}</span>
            </div>
            {order.status === 'cancelled' ? (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">This order was cancelled. Please contact us if you need help.</p>
            ) : (
              <ol className="grid grid-cols-4 gap-1">
                {STEPS.map((s, n) => (
                  <li key={s} className="text-center">
                    <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${n <= idx ? 'bg-leaf-600 text-white' : 'bg-earth-100 text-earth-400'}`}>{n <= idx ? <Check size={18} /> : n + 1}</div>
                    <p className={`mt-1 text-[11px] font-semibold ${n <= idx ? 'text-leaf-700' : 'text-earth-400'}`}>{ORDER_STATUS[s].label}</p>
                  </li>
                ))}
              </ol>
            )}
            <ul className="divide-y divide-earth-100 text-sm">
              {order.items.map((i, n) => <li key={n} className="flex justify-between py-2"><span>{i.name} × {i.qty}</span><b>{money(i.price * i.qty)}</b></li>)}
              <li className="flex justify-between py-2"><span>Delivery to {order.customer.district}</span><b>{money(order.shippingCharge)}</b></li>
              <li className="flex justify-between py-2 text-base"><b>Total · {order.payment.method.toUpperCase()} ({order.payment.status})</b><b className="text-leaf-700">{money(order.total)}</b></li>
            </ul>
            <ul className="space-y-1 text-xs text-earth-500">
              {[...order.statusHistory].reverse().map((h, n) => <li key={n}>• {ORDER_STATUS[h.status]?.label || h.status} — {dateTime(h.at)}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
