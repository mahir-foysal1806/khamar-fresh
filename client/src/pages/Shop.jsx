import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import Seo from '../components/Seo';
import { ProductGrid } from '../components/ProductCard';
import { ProductGridSkeleton, Empty } from '../components/ui';
import { useSettings } from '../context/SettingsContext';
import { useDebounced } from '../lib/hooks';
import { api } from '../lib/api';

const SORTS = [['popular', 'Most Popular'], ['newest', 'Newest'], ['price_asc', 'Price: Low → High'], ['price_desc', 'Price: High → Low'], ['rating', 'Top Rated']];

export default function Shop() {
  const { categories } = useSettings();
  const [sp, setSp] = useSearchParams();
  const get = (k, d = '') => sp.get(k) || d;
  const [q, setQ] = useState(get('q'));
  const dq = useDebounced(q, 350);
  const [price, setPrice] = useState({ min: get('minPrice'), max: get('maxPrice') });
  const [showFilters, setShowFilters] = useState(false);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const set = (patch) => {
    const next = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setSp(next, { replace: true });
  };

  // keep input in sync when navigated via header search
  useEffect(() => setQ(get('q')), [sp.get('q')]); // eslint-disable-line
  useEffect(() => { if (dq !== get('q')) set({ q: dq }); }, [dq]); // eslint-disable-line

  const query = useMemo(
    () => ({ q: get('q'), category: get('category'), sort: get('sort', 'popular'), minPrice: get('minPrice'), maxPrice: get('maxPrice'), availability: get('availability'), featured: get('featured'), seasonal: get('seasonal') }),
    [sp] // eslint-disable-line
  );

  useEffect(() => { setPage(1); }, [query]);
  useEffect(() => {
    let live = true;
    setLoading(true);
    api.get('/products', { ...query, page, limit: 12 })
      .then((r) => {
        if (!live) return;
        setItems((cur) => (page === 1 ? r.items : [...cur, ...r.items]));
        setMeta({ total: r.total, pages: r.pages });
      })
      .catch(() => {})
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [query, page]);

  const activeCat = categories.find((c) => c.slug === query.category);
  const title = query.featured === 'fresh' ? "Today's Fresh Arrivals" : query.featured === 'offer' ? "Today's Offers" : query.seasonal ? 'Seasonal Specials' : activeCat?.name || 'All Products';
  const hasFilters = query.minPrice || query.maxPrice || query.availability || query.seasonal || query.featured;

  const Filters = (
    <div className="space-y-5">
      <div>
        <p className="label">Price range (৳)</p>
        <div className="flex items-center gap-2">
          <input className="input" inputMode="numeric" placeholder="Min" value={price.min} onChange={(e) => setPrice({ ...price, min: e.target.value.replace(/\D/g, '') })} />
          <span className="text-earth-400">–</span>
          <input className="input" inputMode="numeric" placeholder="Max" value={price.max} onChange={(e) => setPrice({ ...price, max: e.target.value.replace(/\D/g, '') })} />
        </div>
        <button className="btn-outline mt-2 w-full !py-2" onClick={() => set({ minPrice: price.min, maxPrice: price.max })}>Apply price</button>
      </div>
      <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
        <input type="checkbox" className="h-4 w-4 accent-leaf-600" checked={query.availability === 'in_stock'} onChange={(e) => set({ availability: e.target.checked ? 'in_stock' : '' })} /> In stock only
      </label>
      <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
        <input type="checkbox" className="h-4 w-4 accent-leaf-600" checked={!!query.seasonal} onChange={(e) => set({ seasonal: e.target.checked ? 'true' : '' })} /> In-season specials
      </label>
      {hasFilters && (
        <button className="btn-ghost w-full !py-2 text-red-600" onClick={() => { setPrice({ min: '', max: '' }); set({ minPrice: '', maxPrice: '', availability: '', seasonal: '', featured: '' }); }}>
          <X size={14} /> Clear filters
        </button>
      )}
    </div>
  );

  return (
    <div className="container-x py-6">
      <Seo title={title} description={`Shop ${title.toLowerCase()} — pure, fresh and delivered across Bangladesh.`} />
      <h1 className="text-3xl font-bold text-leaf-800">{title}</h1>
      <p className="text-sm text-earth-500">{loading && page === 1 ? 'Loading…' : `${meta.total} product${meta.total === 1 ? '' : 's'}`}</p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-earth-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="input pl-10" placeholder="Search products…" aria-label="Search" />
          {q && <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400" aria-label="Clear search"><X size={16} /></button>}
        </div>
        <div className="flex gap-2">
          <select className="input sm:w-52" value={query.sort} onChange={(e) => set({ sort: e.target.value })} aria-label="Sort">
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button className="btn-outline lg:hidden" onClick={() => setShowFilters(true)}><SlidersHorizontal size={16} /> Filter</button>
        </div>
      </div>

      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <button onClick={() => set({ category: '' })} className={`chip !px-4 !py-1.5 !text-sm whitespace-nowrap ${!query.category ? 'bg-leaf-600 text-white' : 'bg-white text-earth-700 ring-1 ring-earth-200'}`}>All</button>
        {categories.map((c) => (
          <button key={c._id} onClick={() => set({ category: c.slug })} className={`chip !px-4 !py-1.5 !text-sm whitespace-nowrap ${query.category === c.slug ? 'bg-leaf-600 text-white' : 'bg-white text-earth-700 ring-1 ring-earth-200'}`}>{c.icon} {c.name}</button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="card hidden h-fit p-4 lg:block">{Filters}</aside>
        <div>
          {loading && page === 1 ? <ProductGridSkeleton /> : items.length === 0 ? (
            <Empty icon="🔍" title="No products found" text="Try a different search or clear the filters."><button className="btn-primary" onClick={() => { setQ(''); setSp({}); }}>Reset</button></Empty>
          ) : (
            <>
              <ProductGrid items={items} />
              {page < meta.pages && (
                <div className="mt-8 text-center"><button className="btn-outline px-8" disabled={loading} onClick={() => setPage((p) => p + 1)}>{loading ? 'Loading…' : 'Load more'}</button></div>
              )}
            </>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
          <div className="safe-bottom absolute inset-x-0 bottom-0 animate-rise rounded-t-3xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-bold">Filters</h3><button onClick={() => setShowFilters(false)} aria-label="Close"><X /></button></div>
            {Filters}
            <button className="btn-primary mt-5 w-full" onClick={() => setShowFilters(false)}>Show {meta.total} results</button>
          </div>
        </div>
      )}
    </div>
  );
}
