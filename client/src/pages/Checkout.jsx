import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Banknote, Smartphone, CreditCard, Lock, MapPin, User, Phone, StickyNote, Loader2, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import Seo from '../components/Seo';
import { ProductImage, Empty } from '../components/ui';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { DIVISIONS } from '../data/districts';
import { api } from '../lib/api';
import { calcShipping, isValidBDPhone, money } from '../lib/format';

const METHODS = {
  cod: { label: 'Cash on Delivery', hint: 'Pay in cash when you receive your order', icon: Banknote },
  bkash: { label: 'bKash', hint: 'Send money & enter TrxID', icon: Smartphone },
  nagad: { label: 'Nagad', hint: 'Send money & enter TrxID', icon: Smartphone },
  sslcommerz: { label: 'Card / Mobile Banking', hint: 'Secure online payment (SSLCommerz)', icon: CreditCard },
};

const Field = ({ id, label, icon: Icon, error, children }) => (
  <div data-error={!!error}>
    <label htmlFor={id} className="label flex items-center gap-1.5">{Icon && <Icon size={14} className="text-leaf-600" />}{label}</label>
    {children}
    {error && <p className="mt-1 text-xs font-medium text-red-600" role="alert">{error}</p>}
  </div>
);

export default function Checkout() {
  const { items, subtotal, weightKg, clear } = useCart();
  const { settings } = useSettings();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', phone: '', address: '', district: '', upazila: '', notes: '', method: 'cod', trx: '', sender: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const methods = Object.keys(METHODS).filter((m) => settings.payment?.[m]?.enabled);
  const shipping = useMemo(() => calcShipping({ district: f.district, subtotal, totalWeightKg: weightKg, shipping: settings.shipping }), [f.district, subtotal, weightKg, settings.shipping]);
  const total = subtotal + shipping.charge;
  const pay = settings.payment?.[f.method];

  if (!items.length)
    return <div className="container-x py-16"><Empty icon="🛒" title="Nothing to checkout" text="Your cart is empty."><Link to="/shop" className="btn-primary">Shop now</Link></Empty></div>;

  const validate = () => {
    const e = {};
    if (f.name.trim().length < 2) e.name = 'Please enter your full name';
    if (!isValidBDPhone(f.phone)) e.phone = 'Enter a valid mobile number, e.g. 01712345678';
    if (!f.district) e.district = 'Please select your district';
    if (f.address.trim().length < 8) e.address = 'Please enter your full delivery address';
    if (['bkash', 'nagad'].includes(f.method) && f.trx.trim().length < 6) e.trx = 'Enter the TrxID from your payment SMS';
    setErrors(e);
    if (Object.keys(e).length) document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return toast.error('Please fix the highlighted fields');
    setBusy(true);
    try {
      const order = await api.post('/orders', {
        customer: { name: f.name, phone: f.phone, address: f.address, district: f.district, upazila: f.upazila, notes: f.notes },
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
        paymentMethod: f.method,
        transactionId: f.trx,
        senderNumber: f.sender,
      });
      try { sessionStorage.setItem('kf_last_order', JSON.stringify({ ...order, paymentMethod: f.method })); } catch { /* ignore */ }

      if (f.method === 'sslcommerz') {
        const r = await api.post('/payments/sslcommerz/init', { orderId: order.orderId, phone: f.phone }).catch((e) => { toast.error(`${e.message} — order saved, pay on delivery instead.`); return null; });
        if (r?.redirectUrl) { clear(); window.location.href = r.redirectUrl; return; }
      }
      clear();
      nav(`/order-success/${order.orderId}`, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const bad = (k) => (errors[k] ? '!border-red-400 !ring-2 !ring-red-100' : '');

  return (
    <div className="container-x py-6">
      <Seo title="Checkout" noindex />
      <h1 className="text-3xl font-bold text-leaf-800">Checkout</h1>
      <p className="mb-5 flex items-center gap-1.5 text-sm text-earth-600"><Lock size={14} /> Guest checkout — no registration needed</p>

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_380px]" noValidate>
        <div className="space-y-5">
          <section className="card space-y-4 p-4 sm:p-6">
            <h2 className="font-sans text-lg font-bold">Delivery details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="name" label="Full name" icon={User} error={errors.name}>
                <input id="name" className={`input ${bad('name')}`} autoComplete="name" value={f.name} onChange={set('name')} placeholder="e.g. Rahim Uddin" />
              </Field>
              <Field id="phone" label="Mobile number" icon={Phone} error={errors.phone}>
                <input id="phone" className={`input ${bad('phone')}`} type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} placeholder="01XXXXXXXXX" />
              </Field>
              <Field id="district" label="District (all 64 available)" icon={MapPin} error={errors.district}>
                <select id="district" className={`input ${bad('district')}`} value={f.district} onChange={set('district')}>
                  <option value="">Select your district…</option>
                  {Object.entries(DIVISIONS).map(([div, list]) => (
                    <optgroup key={div} label={`${div} Division`}>{list.map((d) => <option key={d} value={d}>{d}</option>)}</optgroup>
                  ))}
                </select>
              </Field>
              <Field id="upazila" label="Upazila / Thana (optional)">
                <input id="upazila" className="input" value={f.upazila} onChange={set('upazila')} placeholder="e.g. Mirpur, Savar" />
              </Field>
            </div>
            <Field id="address" label="Full delivery address" icon={MapPin} error={errors.address}>
              <textarea id="address" rows={3} className={`input ${bad('address')}`} autoComplete="street-address" value={f.address} onChange={set('address')} placeholder="House, road, area, landmark…" />
            </Field>
            <Field id="notes" label="Delivery notes (optional)" icon={StickyNote}>
              <input id="notes" className="input" value={f.notes} onChange={set('notes')} placeholder="e.g. Call before arriving, deliver after 5 PM" />
            </Field>
            {f.district && (
              <p className="flex items-center gap-2 rounded-xl bg-leaf-50 p-3 text-sm text-leaf-800"><Truck size={16} /> Delivery to <b>{f.district}</b>: {shipping.charge === 0 ? <b>FREE</b> : <b>{money(shipping.charge)}</b>} · {settings.shipping.note}</p>
            )}
          </section>

          <section className="card space-y-3 p-4 sm:p-6">
            <h2 className="font-sans text-lg font-bold">Payment method</h2>
            <div className="grid gap-2.5">
              {methods.map((m) => {
                const { label, hint, icon: Icon } = METHODS[m];
                return (
                  <label key={m} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${f.method === m ? 'border-leaf-500 bg-leaf-50 ring-2 ring-leaf-200' : 'border-earth-200 hover:bg-earth-50'}`}>
                    <input type="radio" name="method" className="accent-leaf-600" checked={f.method === m} onChange={() => setF({ ...f, method: m })} />
                    <Icon size={20} className="text-leaf-600" />
                    <span className="flex-1 leading-tight"><b className="text-sm">{label}</b><span className="block text-xs text-earth-500">{hint}</span></span>
                    {m === 'cod' && <span className="chip bg-honey-100 text-honey-700">Popular</span>}
                  </label>
                );
              })}
            </div>
            {['bkash', 'nagad'].includes(f.method) && (
              <div className="space-y-3 rounded-xl bg-honey-50 p-4 ring-1 ring-honey-200">
                <p className="text-sm">{pay.instructions}</p>
                <p className="text-lg font-bold text-earth-900">{pay.number || 'Number not set'} <span className="text-xs font-normal">(Send Money · {money(total)})</span></p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field id="trx" label="Transaction ID (TrxID)" error={errors.trx}><input id="trx" className={`input ${bad('trx')}`} value={f.trx} onChange={set('trx')} placeholder="e.g. 9H7A5K2L1M" /></Field>
                  <Field id="sender" label="Your bKash/Nagad number"><input id="sender" className="input" inputMode="tel" value={f.sender} onChange={set('sender')} placeholder="01XXXXXXXXX" /></Field>
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="card h-fit space-y-4 p-4 sm:p-6 lg:sticky lg:top-24">
          <h2 className="font-sans text-lg font-bold">Your order</h2>
          <ul className="max-h-64 space-y-3 overflow-y-auto pr-1">
            {items.map((i) => (
              <li key={i.productId} className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg"><ProductImage src={i.image} alt={i.name} category={i.categorySlug} className="h-full w-full" /><span className="absolute -right-0 -top-0 rounded-bl-lg bg-leaf-600 px-1.5 text-[10px] font-bold text-white">{i.qty}</span></div>
                <p className="line-clamp-2 flex-1 text-sm">{i.name}</p>
                <b className="text-sm">{money(i.price * i.qty)}</b>
              </li>
            ))}
          </ul>
          <div className="space-y-1.5 border-t border-earth-100 pt-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><b>{money(subtotal)}</b></div>
            <div className="flex justify-between"><span>Delivery</span><b>{f.district ? (shipping.charge === 0 ? 'FREE' : money(shipping.charge)) : 'Select district'}</b></div>
            <div className="flex justify-between border-t border-earth-100 pt-2 text-lg"><b>Total</b><b className="text-leaf-700">{money(total)}</b></div>
          </div>
          <button className="btn-honey w-full !py-3.5 text-base" disabled={busy}>
            {busy ? <><Loader2 size={18} className="animate-spin" /> Placing order…</> : <>Place Order · {money(total)}</>}
          </button>
          <p className="text-center text-xs text-earth-500">By placing your order you agree to be contacted by phone to confirm delivery.</p>
        </aside>
      </form>
    </div>
  );
}
