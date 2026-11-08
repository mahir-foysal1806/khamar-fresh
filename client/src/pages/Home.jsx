import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, Flame, Sun, TrendingUp, Facebook, Star, ExternalLink, Leaf, Truck, ShieldCheck, Banknote } from 'lucide-react';
import Seo from '../components/Seo';
import ProductCard, { ProductGrid } from '../components/ProductCard';
import { SectionHeader, ProductGridSkeleton, Skeleton } from '../components/ui';
import { useSettings } from '../context/SettingsContext';
import { useFetch, useInterval } from '../lib/hooks';
import { api, assetUrl } from '../lib/api';

const THEMES = {
  honey: 'from-honey-600 via-honey-500 to-honey-300 text-earth-900',
  leaf: 'from-leaf-800 via-leaf-600 to-leaf-400 text-white',
  earth: 'from-earth-900 via-earth-700 to-earth-500 text-white',
  mango: 'from-orange-600 via-amber-500 to-yellow-300 text-earth-900',
};

function HeroBanner() {
  const { settings } = useSettings();
  const banners = (settings.banners || []).filter((b) => b.active !== false);
  const [i, setI] = useState(0);
  useInterval(() => banners.length > 1 && setI((x) => (x + 1) % banners.length), 6000);
  if (!banners.length) return <Skeleton className="m-4 h-56 sm:h-80" />;
  const b = banners[i % banners.length];
  const dark = !(b.theme === 'honey' || b.theme === 'mango') || b.image;

  return (
    <section className="container-x pt-4">
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${THEMES[b.theme] || THEMES.leaf} shadow-lift`}>
        {b.image && (
          <>
            <img src={assetUrl(b.image)} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
          </>
        )}
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 right-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div key={i} className={`relative flex min-h-[15rem] animate-rise flex-col justify-center gap-3 p-6 sm:min-h-[22rem] sm:p-12 ${b.image ? 'text-white' : ''}`}>
          <span className={`chip w-fit ${dark ? 'bg-white/20 text-white' : 'bg-black/10'}`}><Sparkles size={12} /> Updated daily</span>
          <h1 className="max-w-xl text-3xl font-bold leading-tight sm:text-5xl">{b.title}</h1>
          <p className="max-w-lg text-sm opacity-90 sm:text-lg">{b.subtitle}</p>
          {b.ctaText && (
            <Link to={b.ctaLink || '/shop'} className="btn mt-2 w-fit bg-white px-6 py-3 text-leaf-800 shadow-lift hover:bg-leaf-50">
              {b.ctaText} <ChevronRight size={18} />
            </Link>
          )}
        </div>
        {banners.length > 1 && (
          <>
            <button onClick={() => setI((i - 1 + banners.length) % banners.length)} aria-label="Previous banner" className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 text-leaf-800 shadow sm:block"><ChevronLeft size={18} /></button>
            <button onClick={() => setI((i + 1) % banners.length)} aria-label="Next banner" className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 text-leaf-800 shadow sm:block"><ChevronRight size={18} /></button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {banners.map((_, n) => (
                <button key={n} onClick={() => setI(n)} aria-label={`Banner ${n + 1}`} className={`h-1.5 rounded-full transition-all ${n === i % banners.length ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function HScroll({ items }) {
  return (
    <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 no-scrollbar sm:mx-0 sm:px-0">
      {items.map((p) => (
        <div key={p._id} className="w-44 shrink-0 snap-start sm:w-56">
          <ProductCard p={p} />
        </div>
      ))}
    </div>
  );
}

function Categories() {
  const { categories } = useSettings();
  const tone = ['bg-leaf-50 border-leaf-200', 'bg-honey-50 border-honey-200', 'bg-orange-50 border-orange-200'];
  return (
    <section className="container-x pt-8">
      <div className="grid grid-cols-3 gap-3 sm:gap-5">
        {categories.map((c, i) => (
          <Link key={c._id} to={`/shop?category=${c.slug}`} className={`group rounded-2xl border p-3 text-center transition hover:-translate-y-0.5 hover:shadow-lift sm:p-6 ${tone[i % 3]}`}>
            <div className="text-4xl transition group-hover:scale-110 sm:text-6xl">{c.icon}</div>
            <p className="mt-2 text-xs font-bold leading-tight text-leaf-800 sm:text-lg">{c.name}</p>
            <p className="text-[11px] text-earth-600 sm:text-sm">{c.nameBn}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [[Leaf, '100% Natural', 'No chemicals'], [Truck, '64 Districts', 'Courier delivery'], [ShieldCheck, 'Quality Promise', 'Checked daily'], [Banknote, 'Cash on Delivery', 'Pay at your door']];
  return (
    <div className="container-x pt-6">
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-3 shadow-soft sm:grid-cols-4">
        {items.map(([Icon, t, s]) => (
          <div key={t} className="flex items-center gap-2.5 p-1.5">
            <span className="rounded-xl bg-leaf-50 p-2 text-leaf-600"><Icon size={20} /></span>
            <div className="leading-tight"><p className="text-sm font-semibold">{t}</p><p className="text-xs text-earth-500">{s}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FacebookSection() {
  const { settings } = useSettings();
  const { social, facebookReviews, brand } = settings;
  const page = social.facebookPageUrl;
  if (!page && !facebookReviews.length) return null;
  const plugin = page && `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(page)}&tabs=timeline&width=340&height=480&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true`;

  return (
    <section className="container-x pt-12">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#1877F2] to-[#0b4fb5] p-5 text-white shadow-lift sm:p-10">
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-100"><Facebook size={14} /> Social proof</p>
            <h2 className="text-2xl font-bold sm:text-3xl">Customer Feedback from Facebook</h2>
            <p className="mt-1 text-sm text-blue-100">Real words from real families who ordered from {brand.name}.</p>

            {facebookReviews.length > 0 ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {facebookReviews.slice(0, 4).map((r, n) => (
                  <figure key={n} className="rounded-2xl bg-white p-4 text-earth-900 shadow">
                    <div className="flex items-center gap-2.5">
                      {r.avatar ? <img src={assetUrl(r.avatar)} alt="" className="h-9 w-9 rounded-full object-cover" /> : <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1877F2] text-sm font-bold text-white">{r.name?.[0] || '?'}</span>}
                      <div className="leading-tight"><p className="text-sm font-semibold">{r.name}</p><p className="text-[11px] text-earth-500">{r.date}</p></div>
                      <Facebook size={16} className="ml-auto text-[#1877F2]" />
                    </div>
                    <div className="mt-2 flex">{[1, 2, 3, 4, 5].map((s) => <Star key={s} size={14} className={s <= (r.rating || 5) ? 'fill-honey-400 text-honey-400' : 'text-earth-200'} />)}</div>
                    <blockquote className="mt-1.5 text-sm leading-relaxed text-earth-700">“{r.text}”</blockquote>
                    {r.link && <a href={r.link} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1877F2]">View on Facebook <ExternalLink size={11} /></a>}
                  </figure>
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-2xl bg-white/10 p-4 text-sm">See what customers say about us on our Facebook page — and share your own experience!</p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {page && <a href={page} target="_blank" rel="noreferrer" className="btn bg-white text-[#1877F2] hover:bg-blue-50"><Facebook size={16} /> Follow our Page</a>}
              {social.facebookReviewsUrl && <a href={social.facebookReviewsUrl} target="_blank" rel="noreferrer" className="btn border border-white/50 text-white hover:bg-white/10"><Star size={16} /> Read all reviews</a>}
            </div>
          </div>

          {plugin && (
            <div className="lg:col-span-2">
              <div className="overflow-hidden rounded-2xl bg-white">
                <iframe title="Facebook Page feed" src={plugin} width="100%" height="480" style={{ border: 'none', overflow: 'hidden' }} loading="lazy" allow="encrypted-media" />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { settings } = useSettings();
  const { data, loading } = useFetch(() => api.get('/products/home'), []);

  return (
    <>
      <Seo />
      <HeroBanner />
      <TrustStrip />
      <Categories />

      {loading && <section className="container-x pt-10"><ProductGridSkeleton n={4} /></section>}

      {data?.fresh?.length > 0 && (
        <section className="container-x pt-10">
          <SectionHeader icon={Sun} eyebrow="Picked this morning" title="Today's Fresh Arrivals" subtitle="Just landed — grab them while stock lasts." to="/shop?featured=fresh" />
          <HScroll items={data.fresh} />
        </section>
      )}

      {data?.offers?.length > 0 && (
        <section className="container-x pt-8">
          <div className="rounded-3xl bg-gradient-to-br from-honey-100 to-honey-50 p-4 ring-1 ring-honey-200 sm:p-8">
            <SectionHeader icon={Flame} eyebrow="Limited-time" title="Today's Offers" subtitle="Special prices valid today only." to="/shop?featured=offer" />
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {data.offers.slice(0, 4).map((p) => (
                <div key={p._id} className="relative">
                  {p.offerNote && <span className="absolute -top-2 left-3 z-10 rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow">{p.offerNote}</span>}
                  <ProductCard p={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {data?.seasonal?.length > 0 && (
        <section className="container-x pt-12">
          <SectionHeader eyebrow="In season now" title="Seasonal Specials" subtitle="Available only while the season lasts." to="/shop?seasonal=true" />
          <ProductGrid items={data.seasonal.slice(0, 4)} />
        </section>
      )}

      {data?.popular?.length > 0 && (
        <section className="container-x pt-12">
          <SectionHeader icon={TrendingUp} eyebrow="Customer favourites" title="Best Sellers" to="/shop?sort=popular" />
          <ProductGrid items={data.popular.slice(0, 8)} />
        </section>
      )}

      <section className="container-x pt-12">
        <div className="grid items-center gap-6 rounded-3xl bg-leaf-50 p-6 ring-1 ring-leaf-100 sm:p-10 md:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-honey-600">Our promise</p>
            <h2 className="mt-1 text-2xl font-bold text-leaf-800 sm:text-3xl">{settings.about.title}</h2>
            <p className="mt-3 text-earth-700">{settings.about.body}</p>
            <Link to="/shop" className="btn-primary mt-5">Start shopping <ChevronRight size={16} /></Link>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            {[['64', 'Districts served'], ['100%', 'Natural products'], ['Daily', 'Stock updates'], ['COD', 'Pay on delivery']].map(([n, l]) => (
              <div key={l} className="rounded-2xl bg-white p-4 shadow-soft"><p className="font-display text-3xl font-bold text-leaf-700">{n}</p><p className="text-xs text-earth-600">{l}</p></div>
            ))}
          </div>
        </div>
      </section>

      <FacebookSection />
    </>
  );
}
