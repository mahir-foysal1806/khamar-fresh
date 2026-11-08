import { useMemo, useRef, useState } from 'react';
import { Plus, Search, Pencil, Trash2, X, Upload, Loader2, Eraser, Sun, Flame, Leaf, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { ProductImage, AvailabilityChip } from '../components/ui';
import { useSettings } from '../context/SettingsContext';
import { useFetch } from '../lib/hooks';
import { api, assetUrl } from '../lib/api';
import { money } from '../lib/format';

function Toggle({ on, onChange, label, icon: Icon, tone = 'leaf' }) {
  const tones = { leaf: 'bg-leaf-600', honey: 'bg-honey-500', orange: 'bg-orange-500', gray: 'bg-earth-500' };
  return (
    <button type="button" onClick={() => onChange(!on)} aria-pressed={on} className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${on ? `${tones[tone]} border-transparent text-white` : 'border-earth-200 bg-white text-earth-600'}`}>
      {Icon && <Icon size={13} />}{label}
    </button>
  );
}

function NumField({ label, value, onCommit, prefix, width = 'w-24' }) {
  const [v, setV] = useState(String(value ?? 0));
  const last = useRef(value);
  if (last.current !== value) { last.current = value; setV(String(value ?? 0)); }
  const commit = () => { const n = Number(v); if (!Number.isNaN(n) && n !== value && n >= 0) onCommit(n); else setV(String(value ?? 0)); };
  return (
    <label className="block text-[11px] font-medium text-earth-500">{label}
      <div className="relative mt-0.5">{prefix && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-earth-400">{prefix}</span>}
        <input className={`input !rounded-lg !py-1.5 text-sm tabular-nums ${prefix ? 'pl-5' : ''} ${width}`} inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
      </div>
    </label>
  );
}

const blank = { name: '', nameBn: '', category: '', shortDescription: '', description: '', origin: '', images: [], price: '', comparePrice: '', unit: 'kg', weightKg: 1, stockStatus: 'in_stock', stockQty: 0, lowStockThreshold: 10, allowPreOrder: false, isSeasonal: false, seasonAvailable: true, seasonLabel: '', isOrganic: false, isPure: false, isTodaysFresh: false, isTodaysOffer: false, offerNote: '', isActive: true };

function ProductForm({ product, categories, onClose, onSaved }) {
  const [f, setF] = useState(() => ({ ...blank, ...(product ? { ...product, category: product.category?._id || product.category } : { category: categories[0]?._id || '' }) }));
  const [busy, setBusy] = useState(false);
  const [up, setUp] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const chk = (k, label) => <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-leaf-600" checked={!!f[k]} onChange={set(k)} />{label}</label>;

  const upload = async (files) => {
    if (!files?.length) return;
    setUp(true);
    try { const r = await api.upload(files); setF((s) => ({ ...s, images: [...s.images, ...r.urls] })); } catch (e) { toast.error(e.message); } finally { setUp(false); }
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const body = { ...f, price: Number(f.price), comparePrice: Number(f.comparePrice || 0), weightKg: Number(f.weightKg || 0), stockQty: Number(f.stockQty || 0), lowStockThreshold: Number(f.lowStockThreshold || 0) };
    delete body._id; delete body.__v; delete body.createdAt; delete body.updatedAt; delete body.id; delete body.availability; delete body.purchasable; delete body.discountPercent;
    try {
      const saved = product ? await api.aput(`/admin/products/${product._id}`, body) : await api.apost('/admin/products', body);
      toast.success(product ? 'Product updated' : 'Product added');
      onSaved(saved);
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <form onSubmit={save} className="relative flex max-h-[94vh] w-full max-w-3xl animate-rise flex-col rounded-t-3xl bg-white sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-earth-100 p-4"><h2 className="font-sans text-lg font-bold">{product ? 'Edit product' : 'Add new product'}</h2><button type="button" onClick={onClose} aria-label="Close"><X /></button></div>
        <div className="space-y-5 overflow-y-auto p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Name (English) *</label><input required className="input" value={f.name} onChange={set('name')} /></div>
            <div><label className="label">নাম (বাংলা)</label><input className="input" value={f.nameBn || ''} onChange={set('nameBn')} /></div>
            <div><label className="label">Category *</label><select required className="input" value={f.category} onChange={set('category')}>{categories.map((c) => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}</select></div>
            <div><label className="label">Origin / source</label><input className="input" placeholder="e.g. Chapainawabganj" value={f.origin || ''} onChange={set('origin')} /></div>
          </div>
          <div><label className="label">Short description (shown on cards & Facebook shares)</label><input className="input" maxLength={220} value={f.shortDescription || ''} onChange={set('shortDescription')} /></div>
          <div><label className="label">Full description</label><textarea rows={4} className="input" value={f.description || ''} onChange={set('description')} /></div>

          <fieldset className="rounded-2xl border border-earth-100 p-4">
            <legend className="px-2 text-sm font-bold text-leaf-700">Price & unit</legend>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div><label className="label">Price (৳) *</label><input required type="number" min="0" className="input" value={f.price} onChange={set('price')} /></div>
              <div><label className="label">Old price (৳)</label><input type="number" min="0" className="input" placeholder="for discount tag" value={f.comparePrice || ''} onChange={set('comparePrice')} /></div>
              <div><label className="label">Unit</label><input className="input" placeholder="kg, 500 g, dozen" value={f.unit} onChange={set('unit')} /></div>
              <div><label className="label">Weight (kg)</label><input type="number" step="0.1" min="0" className="input" value={f.weightKg} onChange={set('weightKg')} /></div>
            </div>
          </fieldset>

          <fieldset className="rounded-2xl border border-earth-100 p-4">
            <legend className="px-2 text-sm font-bold text-leaf-700">Stock</legend>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div><label className="label">Status</label><select className="input" value={f.stockStatus} onChange={set('stockStatus')}><option value="in_stock">In Stock</option><option value="out_of_stock">Out of Stock</option><option value="coming_soon">Coming Soon</option></select></div>
              <div><label className="label">Quantity available</label><input type="number" min="0" className="input" value={f.stockQty} onChange={set('stockQty')} /></div>
              <div><label className="label">“Limited stock” at ≤</label><input type="number" min="0" className="input" value={f.lowStockThreshold} onChange={set('lowStockThreshold')} /></div>
            </div>
            <div className="mt-3">{chk('allowPreOrder', 'Allow Pre-Order when out of stock / coming soon')}</div>
          </fieldset>

          <fieldset className="rounded-2xl border border-earth-100 p-4">
            <legend className="px-2 text-sm font-bold text-leaf-700">Badges, season & homepage</legend>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {chk('isOrganic', '🌱 Organic badge')}{chk('isPure', '✨ 100% Pure badge')}
              {chk('isSeasonal', '🍃 Seasonal product')}{f.isSeasonal && chk('seasonAvailable', 'Season is ON (available now)')}
              {chk('isTodaysFresh', "☀️ Show in “Today's Fresh Arrivals”")}{chk('isTodaysOffer', "🔥 Show in “Today's Offers”")}
              {chk('isActive', '👁 Visible in store')}
            </div>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {f.isSeasonal && <div><label className="label">Season label</label><input className="input" placeholder="May – July" value={f.seasonLabel || ''} onChange={set('seasonLabel')} /></div>}
              {f.isTodaysOffer && <div><label className="label">Offer note</label><input className="input" placeholder="Save ৳50 today" value={f.offerNote || ''} onChange={set('offerNote')} /></div>}
            </div>
          </fieldset>

          <div>
            <label className="label">Photos (first is the main image & Facebook preview)</label>
            <div className="flex flex-wrap gap-2">
              {f.images.map((u, n) => (
                <div key={u + n} className="group relative h-20 w-20 overflow-hidden rounded-xl ring-1 ring-earth-200">
                  <img src={assetUrl(u)} alt="" className="h-full w-full object-cover" />
                  {n === 0 && <span className="absolute inset-x-0 bottom-0 bg-leaf-600 text-center text-[10px] font-bold text-white">MAIN</span>}
                  <button type="button" onClick={() => setF((s) => ({ ...s, images: s.images.filter((_, i) => i !== n) }))} className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white" aria-label="Remove image"><X size={12} /></button>
                </div>
              ))}
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-earth-300 text-xs text-earth-500 hover:bg-earth-50">
                {up ? <Loader2 className="animate-spin" size={18} /> : <><Upload size={18} />Upload</>}
                <input type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
              </label>
            </div>
            <input className="input mt-2" placeholder="…or paste an image URL and press Enter" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const v = e.target.value.trim(); if (v) { setF((s) => ({ ...s, images: [...s.images, v] })); e.target.value = ''; } } }} />
          </div>
        </div>
        <div className="flex gap-2 border-t border-earth-100 p-4"><button type="button" className="btn-ghost flex-1" onClick={onClose}>Cancel</button><button className="btn-primary flex-[2]" disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button></div>
      </form>
    </div>
  );
}

export default function AdminProducts() {
  const { categories, refresh } = useSettings();
  const { data, setData, loading, reload } = useFetch(() => api.aget('/admin/products'), []);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [view, setView] = useState('all');
  const [editing, setEditing] = useState(null); // null | 'new' | product

  const patchLocal = (p) => setData((cur) => cur.map((x) => (x._id === p._id ? { ...x, ...p, category: x.category } : x)));
  const quick = async (p, patch, msg = 'Saved') => {
    patchLocal({ ...p, ...patch });
    try { patchLocal(await api.apatch(`/admin/products/${p._id}/quick`, patch)); toast.success(msg, { duration: 900 }); } catch (e) { toast.error(e.message); reload(); }
  };

  const list = useMemo(() => (data || []).filter((p) => {
    if (q && !`${p.name} ${p.nameBn || ''}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (cat && p.category?._id !== cat) return false;
    if (view === 'low') return p.availability === 'limited';
    if (view === 'out') return ['out_of_stock', 'out_of_season', 'coming_soon'].includes(p.availability);
    if (view === 'fresh') return p.isTodaysFresh;
    if (view === 'offer') return p.isTodaysOffer;
    if (view === 'hidden') return !p.isActive;
    return true;
  }), [data, q, cat, view]);

  const resetDaily = async () => {
    if (!confirm("Clear all 'Today's Fresh' and 'Today's Offer' flags?")) return;
    const r = await api.apost('/admin/products/reset-daily');
    toast.success(`Cleared ${r.cleared} product(s)`); reload();
  };
  const del = async (p) => {
    if (!confirm(`Delete "${p.name}" permanently?`)) return;
    try { await api.adel(`/admin/products/${p._id}`); setData((c) => c.filter((x) => x._id !== p._id)); toast.success('Deleted'); } catch (e) { toast.error(e.message); }
  };

  const views = [['all', 'All'], ['low', 'Low stock'], ['out', 'Unavailable'], ['fresh', 'Fresh today'], ['offer', 'Offers'], ['hidden', 'Hidden']];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-leaf-800 sm:text-3xl">Products & Daily Stock</h1><p className="text-sm text-earth-500">Edit price and stock right in the list — changes go live instantly.</p></div>
        <div className="flex gap-2"><button onClick={resetDaily} className="btn-ghost border border-earth-200 text-xs"><Eraser size={15} /> End-of-day reset</button><button onClick={() => setEditing('new')} className="btn-primary"><Plus size={16} /> Add product</button></div>
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" /><input className="input pl-9" placeholder="Search product…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select className="input sm:w-56" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All categories</option>{categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select>
      </div>
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">{views.map(([k, l]) => <button key={k} onClick={() => setView(k)} className={`chip whitespace-nowrap !px-3.5 !py-1.5 !text-xs ${view === k ? 'bg-leaf-600 text-white' : 'bg-white text-earth-700 ring-1 ring-earth-200'}`}>{l}</button>)}</div>

      {loading ? <div className="py-16 text-center"><Loader2 className="mx-auto animate-spin text-leaf-600" /></div> : (
        <div className="space-y-3">
          {list.map((p) => (
            <div key={p._id} className={`card p-3 sm:p-4 ${p.isActive ? '' : 'opacity-60'}`}>
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl sm:h-16 sm:w-16"><ProductImage src={p.images?.[0]} alt={p.name} category={p.category?.slug} className="h-full w-full" /></div>
                <div className="min-w-0 flex-1"><p className="truncate font-semibold">{p.name}</p><p className="truncate text-xs text-earth-500">{p.nameBn} · {p.category?.name}</p><div className="mt-1 flex flex-wrap items-center gap-1.5"><AvailabilityChip value={p.availability} />{p.discountPercent > 0 && <span className="chip bg-red-100 text-red-700">-{p.discountPercent}%</span>}<span className="text-xs text-earth-400">{money(p.price)}/{p.unit}</span></div></div>
                <div className="flex shrink-0"><button onClick={() => setEditing(p)} className="btn-ghost !p-2" aria-label="Edit"><Pencil size={17} /></button><button onClick={() => del(p)} className="btn-ghost !p-2 text-red-600" aria-label="Delete"><Trash2 size={17} /></button></div>
              </div>
              <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-3 border-t border-earth-100 pt-3">
                <NumField label="Price" prefix="৳" value={p.price} onCommit={(n) => quick(p, { price: n }, 'Price updated')} width="w-24" />
                <NumField label="Old price" prefix="৳" value={p.comparePrice} onCommit={(n) => quick(p, { comparePrice: n })} width="w-24" />
                <NumField label={`Stock (${p.unit})`} value={p.stockQty} onCommit={(n) => quick(p, { stockQty: n }, 'Stock updated')} width="w-20" />
                <label className="block text-[11px] font-medium text-earth-500">Status
                  <select className="input mt-0.5 !w-36 !rounded-lg !py-1.5 text-sm" value={p.stockStatus} onChange={(e) => quick(p, { stockStatus: e.target.value })}><option value="in_stock">In Stock</option><option value="out_of_stock">Out of Stock</option><option value="coming_soon">Coming Soon</option></select>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <Toggle on={p.isTodaysFresh} onChange={(v) => quick(p, { isTodaysFresh: v })} label="Fresh today" icon={Sun} tone="leaf" />
                  <Toggle on={p.isTodaysOffer} onChange={(v) => quick(p, { isTodaysOffer: v })} label="Offer" icon={Flame} tone="honey" />
                  {p.isSeasonal && <Toggle on={p.seasonAvailable} onChange={(v) => quick(p, { seasonAvailable: v })} label="In season" icon={Leaf} tone="orange" />}
                  <Toggle on={p.isActive} onChange={(v) => quick(p, { isActive: v })} label={p.isActive ? 'Visible' : 'Hidden'} icon={p.isActive ? Eye : EyeOff} tone="gray" />
                </div>
              </div>
            </div>
          ))}
          {!list.length && <p className="py-12 text-center text-earth-500">No products match.</p>}
        </div>
      )}

      {editing && <ProductForm product={editing === 'new' ? null : editing} categories={categories} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); refresh(); }} />}
    </div>
  );
}
