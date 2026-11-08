import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, Truck } from 'lucide-react';
import Seo from '../components/Seo';
import { ProductImage, QtyStepper, Empty } from '../components/ui';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { money } from '../lib/format';

export default function Cart() {
  const { items, setQty, remove, subtotal, weightKg } = useCart();
  const { settings } = useSettings();
  const nav = useNavigate();
  const s = settings.shipping;

  if (!items.length)
    return (
      <div className="container-x py-16">
        <Seo title="Your Cart" noindex />
        <Empty icon="🛒" title="Your cart is empty" text="Add some fresh honey, fruits or farm products."><Link to="/shop" className="btn-primary">Browse products</Link></Empty>
      </div>
    );

  const freeLeft = s.freeShippingThreshold > 0 ? s.freeShippingThreshold - subtotal : 0;

  return (
    <div className="container-x py-6">
      <Seo title="Your Cart" noindex />
      <h1 className="mb-4 text-3xl font-bold text-leaf-800">Your Cart</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {freeLeft > 0 && <p className="flex items-center gap-2 rounded-xl bg-honey-50 p-3 text-sm text-honey-700 ring-1 ring-honey-200"><Truck size={16} /> Add {money(freeLeft)} more for <b>free delivery</b>!</p>}
          {items.map((i) => (
            <div key={i.productId} className="card flex gap-3 p-3">
              <Link to={`/product/${i.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-24"><ProductImage src={i.image} alt={i.name} category={i.categorySlug} className="h-full w-full" /></Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link to={`/product/${i.slug}`} className="line-clamp-2 text-sm font-semibold hover:text-leaf-700">{i.name}</Link>
                <p className="text-xs text-earth-500">{money(i.price)} / {i.unit}{i.preorder && <span className="ml-2 chip bg-sky-100 text-sky-800">Pre-order</span>}</p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <QtyStepper value={i.qty} onChange={(q) => setQty(i.productId, q)} max={i.maxQty} />
                  <p className="font-bold text-leaf-700">{money(i.price * i.qty)}</p>
                </div>
              </div>
              <button onClick={() => remove(i.productId)} className="self-start p-1.5 text-earth-400 hover:text-red-600" aria-label={`Remove ${i.name}`}><Trash2 size={18} /></button>
            </div>
          ))}
        </div>

        <aside className="card h-fit space-y-3 p-5 lg:sticky lg:top-24">
          <h2 className="font-sans text-lg font-bold">Order Summary</h2>
          <div className="flex justify-between text-sm"><span>Subtotal</span><b>{money(subtotal)}</b></div>
          <div className="flex justify-between text-sm text-earth-600"><span>Delivery</span><span>Calculated at checkout</span></div>
          <p className="rounded-lg bg-leaf-50 p-2.5 text-xs text-leaf-800">Inside Dhaka {money(s.insideDhaka)} · Outside Dhaka {money(s.outsideDhaka)}{s.weightBased ? ` (+${money(s.extraPerKg)}/kg over ${s.baseWeightKg}kg — your cart: ${weightKg.toFixed(1)}kg)` : ''}</p>
          <button className="btn-honey w-full !py-3.5 text-base" onClick={() => nav('/checkout')}>Proceed to Checkout <ArrowRight size={18} /></button>
          <Link to="/shop" className="block text-center text-sm font-semibold text-leaf-700 hover:underline">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
