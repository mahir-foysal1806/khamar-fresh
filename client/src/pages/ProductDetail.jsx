import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ShoppingCart, Zap, Truck, ShieldCheck, Share2, Facebook, MessageCircle, MapPin, Star, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Seo from '../components/Seo';
import { ProductGrid } from '../components/ProductCard';
import { ProductImage, ProductBadges, Stars, QtyStepper, AvailabilityChip, Skeleton } from '../components/ui';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { api, assetUrl } from '../lib/api';
import { money } from '../lib/format';
import { useFetch } from '../lib/hooks';
import NotFound from './NotFound';

function Reviews({ product }) {
  const { data, reload } = useFetch(() => api.get(`/reviews/product/${product._id}`), [product._id]);
  const [f, setF] = useState({ name: '', rating: 5, comment: '' });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.post('/reviews', { ...f, product: product._id });
      toast.success(r.message);
      setF({ name: '', rating: 5, comment: '' });
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-3">
        {data?.length ? data.map((r) => (
          <div key={r._id} className="card p-4">
            <div className="flex items-center justify-between"><p className="text-sm font-semibold">{r.name}{r.district && <span className="font-normal text-earth-500"> · {r.district}</span>}</p><Stars value={r.rating} /></div>
            {r.comment && <p className="mt-1 text-sm text-earth-700">{r.comment}</p>}
          </div>
        )) : <p className="text-sm text-earth-500">No reviews yet — be the first to share your experience.</p>}
      </div>
      <form onSubmit={submit} className="card space-y-3 p-4">
        <h4 className="font-sans font-semibold">Write a review</h4>
        <input className="input" placeholder="Your name" required maxLength={60} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} onClick={() => setF({ ...f, rating: n })} aria-label={`${n} stars`}><Star size={26} className={n <= f.rating ? 'fill-honey-400 text-honey-400' : 'text-earth-200'} /></button>)}</div>
        <textarea className="input" rows={3} placeholder="How was the product?" maxLength={600} value={f.comment} onChange={(e) => setF({ ...f, comment: e.target.value })} />
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Sending…' : 'Submit review'}</button>
      </form>
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { add } = useCart();
  const { settings } = useSettings();
  const { data, loading, error } = useFetch(() => api.get(`/products/${slug}`), [slug]);
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [tab, setTab] = useState('desc');
  useEffect(() => { setQty(1); setImg(0); setTab('desc'); }, [slug]);

  if (loading) return <div className="container-x grid gap-8 py-8 md:grid-cols-2"><Skeleton className="aspect-square" /><div className="space-y-3"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-6 w-1/3" /><Skeleton className="h-24" /></div></div>;
  if (error || !data) return <NotFound />;

  const { product: p, related } = data;
  const sellable = p.purchasable;
  const pre = p.availability === 'preorder';
  const max = pre ? 50 : Math.max(1, p.stockQty);
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const wa = settings.contact.whatsapp && `https://wa.me/${settings.contact.whatsapp}?text=${encodeURIComponent(`Hello, I want to ask about: ${p.name} (${url})`)}`;
  const fbShare = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const share = async () => {
    if (navigator.share) return navigator.share({ title: p.name, url }).catch(() => {});
    await navigator.clipboard?.writeText(url);
    toast.success('Link copied');
  };
  const images = p.images?.length ? p.images : [null];

  return (
    <div className="container-x py-6">
      <Seo title={p.name} description={p.shortDescription || p.description} image={p.images?.[0]} type="product" />
      <nav className="mb-4 flex items-center gap-1 text-xs text-earth-500" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-leaf-700">Home</Link><ChevronRight size={12} />
        <Link to={`/shop?category=${p.category?.slug}`} className="hover:text-leaf-700">{p.category?.name}</Link><ChevronRight size={12} />
        <span className="line-clamp-1 text-earth-700">{p.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="card relative overflow-hidden">
            <ProductImage src={images[img]} alt={p.name} category={p.category?.slug} className="aspect-square w-full" />
            <div className="absolute left-3 top-3"><ProductBadges p={p} /></div>
            {p.discountPercent > 0 && <span className="absolute right-0 top-4 rounded-l-full bg-red-600 py-1 pl-3 pr-2.5 text-sm font-bold text-white">-{p.discountPercent}%</span>}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
              {images.map((s, n) => (
                <button key={n} onClick={() => setImg(n)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-2 ${n === img ? 'ring-leaf-500' : 'ring-transparent'}`} aria-label={`Image ${n + 1}`}><img src={assetUrl(s)} alt="" className="h-full w-full object-cover" /></button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold leading-tight text-leaf-900 sm:text-3xl">{p.name}</h1>
          {p.nameBn && <p className="text-earth-600">{p.nameBn}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-3"><Stars value={p.ratingAvg} count={p.ratingCount} size={16} /><AvailabilityChip value={p.availability} />{p.origin && <span className="flex items-center gap-1 text-xs text-earth-500"><MapPin size={12} /> {p.origin}</span>}</div>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-leaf-700">{money(p.price)}</span>
            {p.comparePrice > p.price && <span className="text-lg text-earth-400 line-through">{money(p.comparePrice)}</span>}
            <span className="text-earth-500">/ {p.unit}</span>
          </div>
          {p.isTodaysOffer && p.offerNote && <p className="mt-2 inline-block rounded-lg bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">🔥 {p.offerNote}</p>}
          {p.shortDescription && <p className="mt-4 text-earth-700">{p.shortDescription}</p>}
          {p.isSeasonal && p.seasonLabel && <p className="mt-2 text-sm text-orange-700">🌿 Season: {p.seasonLabel}</p>}
          {p.availability === 'limited' && <p className="mt-2 text-sm font-semibold text-red-600">Hurry — only {p.stockQty} {p.unit} left!</p>}
          {pre && <p className="mt-2 rounded-lg bg-sky-50 p-3 text-sm text-sky-800">This item is available for pre-order. We'll confirm delivery timing by phone once your order is placed.</p>}

          {sellable ? (
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3"><QtyStepper value={qty} onChange={setQty} max={max} /><span className="text-sm text-earth-600">Total: <b className="text-leaf-700">{money(p.price * qty)}</b></span></div>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-outline !py-3" onClick={() => add(p, qty)}><ShoppingCart size={18} /> Add to Cart</button>
                <button className="btn-honey !py-3" onClick={() => { add(p, qty, { silent: true }); nav('/checkout'); }}><Zap size={18} /> {pre ? 'Pre-Order Now' : 'Order Now'}</button>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-xl bg-earth-100 p-4 text-sm text-earth-700">
              {p.availability === 'out_of_season' ? 'This product is out of season right now. Follow our Facebook page to know when it returns.' : p.availability === 'coming_soon' ? 'Coming soon! Message us to be notified when it arrives.' : 'Currently out of stock. Message us and we will notify you when it is back.'}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn bg-[#25D366] text-white"><MessageCircle size={16} /> Ask on WhatsApp</a>}
            <a href={fbShare} target="_blank" rel="noreferrer" className="btn bg-[#1877F2] text-white"><Facebook size={16} /> Share</a>
            <button onClick={share} className="btn-ghost border border-earth-200"><Share2 size={16} /> Copy link</button>
          </div>

          <div className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-xl bg-leaf-50 p-3"><Truck size={18} className="text-leaf-600" /> Inside Dhaka {money(settings.shipping.insideDhaka)} · Others {money(settings.shipping.outsideDhaka)}</div>
            <div className="flex items-center gap-2 rounded-xl bg-leaf-50 p-3"><ShieldCheck size={18} className="text-leaf-600" /> Cash on Delivery available</div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex gap-1 border-b border-earth-200">
          {[['desc', 'Description'], ['reviews', `Reviews (${p.ratingCount})`]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold ${tab === k ? 'border-leaf-600 text-leaf-700' : 'border-transparent text-earth-500'}`}>{l}</button>
          ))}
        </div>
        <div className="py-5">
          {tab === 'desc' ? <div className="max-w-3xl whitespace-pre-line leading-relaxed text-earth-700">{p.description || p.shortDescription || 'No description yet.'}</div> : <Reviews product={p} />}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-4 text-2xl font-bold text-leaf-800">You may also like</h2>
          <ProductGrid items={related} />
        </section>
      )}

      {sellable && (
        <div className="safe-bottom fixed inset-x-0 bottom-[3.6rem] z-30 flex items-center gap-3 border-t border-earth-100 bg-white/95 p-3 backdrop-blur md:hidden">
          <div className="leading-tight"><p className="text-xs text-earth-500">{qty} × {p.unit}</p><p className="font-bold text-leaf-700">{money(p.price * qty)}</p></div>
          <button className="btn-honey ml-auto flex-1" onClick={() => { add(p, qty, { silent: true }); nav('/checkout'); }}><Zap size={16} /> {pre ? 'Pre-Order' : 'Order Now'}</button>
        </div>
      )}
    </div>
  );
}
