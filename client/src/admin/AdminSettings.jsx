import { createContext, useContext, useEffect, useState } from 'react';
import { Save, Plus, Trash2, ArrowUp, ArrowDown, Upload, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import { useFetch } from '../lib/hooks';
import { api, assetUrl } from '../lib/api';

const clone = (o) => JSON.parse(JSON.stringify(o));
function setIn(obj, path, value) {
  const next = clone(obj);
  const keys = path.split('.');
  let cur = next;
  keys.slice(0, -1).forEach((k) => { cur[k] ??= {}; cur = cur[k]; });
  cur[keys.at(-1)] = value;
  return next;
}

const TABS = [['banners', '🖼 Banners'], ['announce', '📣 Announcement'], ['business', '🏪 Business info'], ['delivery', '🚚 Delivery & Payment'], ['facebook', '📘 Facebook'], ['system', '⚙️ SMS & SEO']];
const THEMES = [['leaf', 'Green'], ['honey', 'Honey'], ['earth', 'Earth'], ['mango', 'Mango']];

function ImageInput({ value, onChange, label = 'Image' }) {
  const [busy, setBusy] = useState(false);
  const up = async (files) => { if (!files?.length) return; setBusy(true); try { onChange((await api.upload([files[0]])).urls[0]); } catch (e) { toast.error(e.message); } finally { setBusy(false); } };
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-2">
        {value && <img src={assetUrl(value)} alt="" className="h-12 w-12 rounded-lg object-cover ring-1 ring-earth-200" />}
        <input className="input" placeholder="Paste URL or upload →" value={value || ''} onChange={(e) => onChange(e.target.value)} />
        <label className="btn-outline cursor-pointer !px-3">{busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}<input type="file" accept="image/*" hidden onChange={(e) => up(e.target.files)} /></label>
      </div>
    </div>
  );
}


const FormCtx = createContext(null);
const getIn = (o, path) => path.split('.').reduce((a, k) => a?.[k], o);

// Defined at module level so inputs keep focus while typing
function T({ path, label, type, ...p }) {
  const { s, set } = useContext(FormCtx);
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" type={type} value={getIn(s, path) ?? ''} onChange={(e) => set(path, type === 'number' ? Number(e.target.value) : e.target.value)} {...p} />
    </div>
  );
}
function Check({ path, label }) {
  const { s, set } = useContext(FormCtx);
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
      <input type="checkbox" className="h-4 w-4 accent-leaf-600" checked={!!getIn(s, path)} onChange={(e) => set(path, e.target.checked)} />
      {label}
    </label>
  );
}

export default function AdminSettings() {
  const { refresh } = useSettings();
  const { data, loading } = useFetch(() => api.aget('/admin/settings'), []);
  const [s, setS] = useState(null);
  const [tab, setTab] = useState('banners');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setS(clone(data)); }, [data]);
  if (loading || !s) return <Loader2 className="mx-auto mt-20 animate-spin text-leaf-600" />;

  const set = (path, v) => setS((cur) => setIn(cur, path, v));
  const move = (key, i, d) => { const a = [...s[key]]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; set(key, a); };

  const save = async () => {
    setBusy(true);
    try { await api.aput('/admin/settings', s); await refresh(); toast.success('Saved — your store is updated'); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <FormCtx.Provider value={{ s, set }}>
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between gap-3"><div><h1 className="text-2xl font-bold text-leaf-800 sm:text-3xl">Site Settings</h1><p className="text-sm text-earth-500">Change banners, offers and business info — no code needed.</p></div>
        <button onClick={save} disabled={busy} className="btn-primary sticky top-2 z-20">{busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save changes</button></div>

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">{TABS.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`chip whitespace-nowrap !px-3.5 !py-2 !text-sm ${tab === k ? 'bg-leaf-600 text-white' : 'bg-white text-earth-700 ring-1 ring-earth-200'}`}>{l}</button>)}</div>

      <div className="space-y-4">
        {tab === 'banners' && (<>
          {s.banners.map((b, i) => (
            <div key={i} className="card space-y-3 p-4">
              <div className="flex items-center justify-between"><span className="font-sans font-bold">Banner {i + 1}</span>
                <div className="flex items-center gap-1"><Check path={`banners.${i}.active`} label="Active" /><button className="btn-ghost !p-2" onClick={() => move('banners', i, -1)} aria-label="Move up"><ArrowUp size={16} /></button><button className="btn-ghost !p-2" onClick={() => move('banners', i, 1)} aria-label="Move down"><ArrowDown size={16} /></button><button className="btn-ghost !p-2 text-red-600" onClick={() => set('banners', s.banners.filter((_, n) => n !== i))} aria-label="Delete"><Trash2 size={16} /></button></div></div>
              <div className="grid gap-3 sm:grid-cols-2"><T path={`banners.${i}.title`} label="Headline" /><T path={`banners.${i}.ctaText`} label="Button text" /></div>
              <div><label className="label">Sub-headline</label><textarea rows={2} className="input" value={b.subtitle || ''} onChange={(e) => set(`banners.${i}.subtitle`, e.target.value)} /></div>
              <div className="grid gap-3 sm:grid-cols-2"><T path={`banners.${i}.ctaLink`} label="Button link" placeholder="/shop?category=pure-honey" /><div><label className="label">Colour theme (when no image)</label><select className="input" value={b.theme} onChange={(e) => set(`banners.${i}.theme`, e.target.value)}>{THEMES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div></div>
              <ImageInput label="Background image (optional, wide 1600×700 works best)" value={b.image} onChange={(v) => set(`banners.${i}.image`, v)} />
            </div>
          ))}
          <button className="btn-outline w-full" onClick={() => set('banners', [...s.banners, { title: 'New offer', subtitle: '', ctaText: 'Shop now', ctaLink: '/shop', image: '', theme: 'leaf', active: true }])}><Plus size={16} /> Add banner</button>
        </>)}

        {tab === 'announce' && (
          <div className="card space-y-3 p-4"><Check path="announcement.active" label="Show announcement bar at the very top of the site" /><T path="announcement.text" label="Message" placeholder="🔥 Fresh Himsagar mango arrived today!" /><T path="announcement.link" label="Link (optional)" placeholder="/shop?featured=fresh" />
            <hr className="border-earth-100" /><T path="brand.name" label="Brand name" /><T path="brand.nameBn" label="Brand name (বাংলা)" /><T path="brand.tagline" label="Tagline" /><ImageInput label="Logo (square)" value={s.brand.logo} onChange={(v) => set('brand.logo', v)} /></div>
        )}

        {tab === 'business' && (
          <div className="card space-y-3 p-4">
            <div><label className="label">Phone numbers (one per line)</label><textarea rows={2} className="input" value={(s.contact.phones || []).join('\n')} onChange={(e) => set('contact.phones', e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))} /></div>
            <div className="grid gap-3 sm:grid-cols-2"><T path="contact.whatsapp" label="WhatsApp number (880…, no +)" placeholder="8801712345678" /><T path="contact.messengerUsername" label="Messenger username (m.me/…)" /><T path="contact.email" label="Official email" type="email" /><T path="contact.mapUrl" label="Google Maps link" /></div>
            <T path="contact.address" label="Physical address" /><div className="grid gap-3 sm:grid-cols-2"><T path="contact.hours" label="Business hours" /><T path="contact.hoursNote" label="Hours note" /></div>
            <hr className="border-earth-100" /><T path="about.title" label="About — headline" /><div><label className="label">About — story</label><textarea rows={4} className="input" value={s.about.body} onChange={(e) => set('about.body', e.target.value)} /></div>
          </div>
        )}

        {tab === 'delivery' && (<>
          <div className="card space-y-3 p-4"><h3 className="font-sans font-bold">Delivery charges</h3>
            <div className="grid gap-3 sm:grid-cols-3"><T path="shipping.insideDhaka" label="Inside Dhaka (৳)" type="number" /><T path="shipping.outsideDhaka" label="Outside Dhaka — 63 districts (৳)" type="number" /><T path="shipping.freeShippingThreshold" label="Free delivery above (৳, 0 = off)" type="number" /></div>
            <Check path="shipping.weightBased" label="Add weight-based surcharge" />
            {s.shipping.weightBased && <div className="grid gap-3 sm:grid-cols-2"><T path="shipping.baseWeightKg" label="Included weight (kg)" type="number" /><T path="shipping.extraPerKg" label="Extra ৳ per additional kg" type="number" /></div>}
            <T path="shipping.note" label="Delivery time note" /></div>
          <div className="card space-y-3 p-4"><h3 className="font-sans font-bold">Payment methods</h3>
            <Check path="payment.cod.enabled" label="Cash on Delivery" />
            {['bkash', 'nagad'].map((m) => (<div key={m} className="space-y-2 rounded-xl bg-earth-50 p-3"><Check path={`payment.${m}.enabled`} label={`${m === 'bkash' ? 'bKash' : 'Nagad'} (manual Send Money + TrxID)`} />{s.payment[m].enabled && <div className="grid gap-3 sm:grid-cols-2"><T path={`payment.${m}.number`} label="Your personal/merchant number" /><T path={`payment.${m}.instructions`} label="Instructions shown to customer" /></div>}</div>))}
            <Check path="payment.sslcommerz.enabled" label="SSLCommerz online payment (needs keys in server .env)" /></div>
        </>)}

        {tab === 'facebook' && (<>
          <div className="card space-y-3 p-4"><div className="grid gap-3 sm:grid-cols-2"><T path="social.facebookPageUrl" label="Facebook Page URL" placeholder="https://facebook.com/yourpage" /><T path="social.facebookReviewsUrl" label="Facebook reviews URL" /><T path="social.instagram" label="Instagram URL" /><T path="social.youtube" label="YouTube URL" /></div>
            <p className="text-xs text-earth-500">The homepage shows your live Facebook Page feed automatically once the Page URL is set (the Page must be public).</p></div>
          <h3 className="font-sans font-bold">Customer feedback from Facebook</h3>
          <p className="-mt-2 text-xs text-earth-500">Copy real comments/reviews from your Page (with the customer's permission) to show them as social proof.</p>
          {s.facebookReviews.map((r, i) => (
            <div key={i} className="card space-y-3 p-4"><div className="flex justify-between"><span className="text-sm font-semibold">Feedback {i + 1}</span><button className="text-red-600" onClick={() => set('facebookReviews', s.facebookReviews.filter((_, n) => n !== i))} aria-label="Delete"><Trash2 size={16} /></button></div>
              <div className="grid gap-3 sm:grid-cols-3"><T path={`facebookReviews.${i}.name`} label="Customer name" /><T path={`facebookReviews.${i}.date`} label="Date" placeholder="12 Jun 2026" /><div><label className="label">Rating</label><select className="input" value={r.rating || 5} onChange={(e) => set(`facebookReviews.${i}.rating`, Number(e.target.value))}>{[5, 4, 3, 2, 1].map((n) => <option key={n}>{n}</option>)}</select></div></div>
              <div><label className="label">Comment</label><textarea rows={2} className="input" value={r.text || ''} onChange={(e) => set(`facebookReviews.${i}.text`, e.target.value)} /></div><T path={`facebookReviews.${i}.link`} label="Link to the post (optional)" /></div>
          ))}
          <button className="btn-outline w-full" onClick={() => set('facebookReviews', [...s.facebookReviews, { name: '', text: '', rating: 5, date: '', link: '' }])}><Plus size={16} /> Add feedback</button>
        </>)}

        {tab === 'system' && (<>
          <div className="card space-y-3 p-4"><h3 className="font-sans font-bold">SMS notifications</h3><Check path="sms.enabled" label="Send SMS to customers on new orders" /><Check path="sms.notifyOnStatus" label="Also send SMS when order status changes" /><T path="sms.adminPhone" label="Your phone (get an SMS for every new order)" placeholder="01XXXXXXXXX" />
            <p className="text-xs text-earth-500">Gateway credentials live in the server .env (SMS_PROVIDER, SMS_API_KEY, SMS_SENDER_ID).</p></div>
          <div className="card space-y-3 p-4"><h3 className="font-sans font-bold">SEO & social sharing (default)</h3><T path="seo.title" label="Site title" /><div><label className="label">Description</label><textarea rows={2} className="input" value={s.seo.description} onChange={(e) => set('seo.description', e.target.value)} /></div><T path="seo.keywords" label="Keywords" /><ImageInput label="Default share image (1200×630) shown when the homepage is shared on Facebook" value={s.seo.ogImage} onChange={(v) => set('seo.ogImage', v)} /></div>
        </>)}
      </div>
    </div>
    </FormCtx.Provider>
  );
}
