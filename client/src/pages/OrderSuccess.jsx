import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, PackageSearch, MessageCircle, Facebook } from 'lucide-react';
import Seo from '../components/Seo';
import { useSettings } from '../context/SettingsContext';
import { money } from '../lib/format';

export default function OrderSuccess() {
  const { orderId } = useParams();
  const [sp] = useSearchParams();
  const { settings } = useSettings();
  let order = null;
  try {
    const o = JSON.parse(sessionStorage.getItem('kf_last_order'));
    if (o?.orderId === orderId) order = o;
  } catch { /* ignore */ }
  const paid = sp.get('paid');
  const wa = settings.contact.whatsapp && `https://wa.me/${settings.contact.whatsapp}?text=${encodeURIComponent(`Hello, my order ID is ${orderId}.`)}`;

  return (
    <div className="container-x py-10">
      <Seo title="Order placed" noindex />
      <div className="card mx-auto max-w-xl p-6 text-center sm:p-10">
        {paid === '0' ? <XCircle className="mx-auto text-red-500" size={64} /> : <CheckCircle2 className="mx-auto text-leaf-600" size={64} />}
        <h1 className="mt-3 text-3xl font-bold text-leaf-800">{paid === '0' ? 'Payment not completed' : 'Thank you for your order!'}</h1>
        <p className="mt-1 text-earth-600">{paid === '0' ? 'Your order is saved. You can pay on delivery or contact us.' : "We'll call you shortly to confirm delivery."}</p>

        <div className="mt-5 rounded-2xl bg-leaf-50 p-4">
          <p className="text-xs uppercase tracking-wider text-earth-500">Your order ID</p>
          <p className="font-display text-2xl font-bold tracking-wide text-leaf-800">{orderId}</p>
        </div>

        {order && (
          <div className="mt-4 space-y-1 text-left text-sm">
            <div className="flex justify-between"><span>Name</span><b>{order.customer.name}</b></div>
            <div className="flex justify-between"><span>Deliver to</span><b className="text-right">{order.customer.district}</b></div>
            <div className="flex justify-between"><span>Items</span><b>{order.items.length}</b></div>
            <div className="flex justify-between"><span>Delivery charge</span><b>{money(order.shippingCharge)}</b></div>
            <div className="flex justify-between border-t border-earth-100 pt-2 text-base"><b>Total ({(order.paymentMethod || 'cod').toUpperCase()})</b><b className="text-leaf-700">{money(order.total)}</b></div>
          </div>
        )}

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Link to="/track" className="btn-primary"><PackageSearch size={16} /> Track order</Link>
          <Link to="/shop" className="btn-outline">Continue shopping</Link>
          {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn bg-[#25D366] text-white"><MessageCircle size={16} /> WhatsApp us</a>}
          {settings.social.facebookPageUrl && <a href={settings.social.facebookPageUrl} target="_blank" rel="noreferrer" className="btn bg-[#1877F2] text-white"><Facebook size={16} /> Follow on Facebook</a>}
        </div>
        <p className="mt-4 text-xs text-earth-500">Save your order ID and phone number to track delivery anytime.</p>
      </div>
    </div>
  );
}
