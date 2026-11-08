import { Link } from 'react-router-dom';
import { ShoppingBag, Clock, Banknote, PackageX, AlertTriangle, ArrowRight, Sun, Tag, RefreshCw } from 'lucide-react';
import { useFetch, useInterval } from '../lib/hooks';
import { api } from '../lib/api';
import { money, timeAgo, ORDER_STATUS } from '../lib/format';

function Stat({ icon: Icon, label, value, tone = 'leaf', to }) {
  const tones = { leaf: 'bg-leaf-50 text-leaf-600', honey: 'bg-honey-50 text-honey-600', red: 'bg-red-50 text-red-600', sky: 'bg-sky-50 text-sky-600' };
  const body = (
    <div className="card flex items-center gap-3 p-4 transition hover:shadow-lift">
      <span className={`rounded-xl p-3 ${tones[tone]}`}><Icon size={22} /></span>
      <div><p className="text-xs text-earth-500">{label}</p><p className="text-2xl font-bold tabular-nums">{value}</p></div>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

export default function Dashboard() {
  const stats = useFetch(() => api.aget('/admin/orders/stats'), []);
  const recent = useFetch(() => api.aget('/admin/orders', { limit: 8 }), []);
  useInterval(() => { stats.reload(); recent.reload(); }, 60000); // auto-refresh every minute
  const s = stats.data;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-end justify-between"><div><h1 className="text-2xl font-bold text-leaf-800 sm:text-3xl">Dashboard</h1><p className="text-sm text-earth-500">Today in Bangladesh time</p></div><button onClick={() => { stats.reload(); recent.reload(); }} className="btn-ghost" aria-label="Refresh"><RefreshCw size={16} /></button></div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={ShoppingBag} label="Today's orders" value={s?.today.orders ?? '–'} to="/admin/orders" />
        <Stat icon={Banknote} label="Today's sales" value={s ? money(s.today.revenue) : '–'} tone="honey" />
        <Stat icon={Clock} label="Pending orders" value={s?.byStatus.pending ?? 0} tone="sky" to="/admin/orders" />
        <Stat icon={PackageX} label="Out of stock" value={s?.outOfStock ?? '–'} tone="red" to="/admin/products" />
      </div>

      <div className="card bg-gradient-to-br from-leaf-700 to-leaf-600 p-5 text-white">
        <h2 className="font-sans text-lg font-bold">Daily update checklist</h2>
        <p className="mb-3 text-sm text-leaf-100">Keep the storefront fresh in under 2 minutes.</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {[[Tag, 'Update today\'s prices & stock'], [Sun, 'Mark Fresh Arrivals & Offers'], [AlertTriangle, `${s?.lowStock ?? 0} item(s) running low`]].map(([Icon, t]) => (
            <Link key={t} to="/admin/products" className="flex items-center gap-2 rounded-xl bg-white/10 p-3 text-sm font-semibold hover:bg-white/20"><Icon size={18} className="text-honey-300" />{t}<ArrowRight size={14} className="ml-auto" /></Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card p-4 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-sans font-bold">Recent orders</h2><Link to="/admin/orders" className="text-sm font-semibold text-leaf-700">View all</Link></div>
          <ul className="divide-y divide-earth-100">
            {recent.data?.map((o) => (
              <li key={o._id} className="flex items-center gap-3 py-2.5 text-sm">
                <div className="min-w-0 flex-1"><p className="truncate font-semibold">{o.customer.name} <span className="font-normal text-earth-500">· {o.customer.district}</span></p><p className="text-xs text-earth-500">{o.orderId} · {timeAgo(o.createdAt)}</p></div>
                <b>{money(o.total)}</b><span className={`chip ${ORDER_STATUS[o.status].cls}`}>{ORDER_STATUS[o.status].label}</span>
              </li>
            ))}
            {recent.data?.length === 0 && <li className="py-6 text-center text-sm text-earth-500">No orders yet</li>}
          </ul>
        </section>

        <section className="card p-4 lg:col-span-2">
          <h2 className="mb-3 font-sans font-bold">Top districts (30 days)</h2>
          {s?.topDistricts.length ? (
            <ul className="space-y-2.5">
              {s.topDistricts.map((d) => (
                <li key={d._id} className="text-sm"><div className="flex justify-between"><span className="font-medium">{d._id}</span><span className="text-earth-500">{d.orders} orders · {money(d.revenue)}</span></div><div className="mt-1 h-1.5 rounded-full bg-earth-100"><div className="h-full rounded-full bg-leaf-500" style={{ width: `${(d.orders / s.topDistricts[0].orders) * 100}%` }} /></div></li>
              ))}
            </ul>
          ) : <p className="py-6 text-center text-sm text-earth-500">No data yet</p>}
          <p className="mt-4 border-t border-earth-100 pt-3 text-xs text-earth-500">Last 30 days: {s?.last30.orders ?? 0} orders · {money(s?.last30.revenue)}</p>
        </section>
      </div>
    </div>
  );
}
