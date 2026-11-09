import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Search, ShoppingCart, Menu, X, Phone, Home, Store, PackageSearch, MapPin, Mail, Clock, Facebook, MessageCircle,
  Leaf, Truck, ShieldCheck, Banknote, Instagram, Youtube, ExternalLink, MessagesSquare,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useCart } from '../context/CartContext';
import { assetUrl } from '../lib/api';

const telHref = (n) => `tel:${String(n).replace(/[^\d+]/g, '')}`;

function AnnouncementBar() {
  const { settings } = useSettings();
  const a = settings.announcement;
  if (!a?.active || !a.text) return null;
  const inner = <span className="mx-8 whitespace-nowrap">{a.text}</span>;
  const content = (
    <div className="overflow-hidden bg-leaf-800 py-1.5 text-xs font-medium text-leaf-50 sm:text-sm">
      <div className="flex w-max animate-marquee sm:animate-none sm:w-full sm:justify-center">
        {inner}
        <span className="sm:hidden">{inner}</span>
        <span className="sm:hidden">{inner}</span>
        <span className="sm:hidden">{inner}</span>
      </div>
    </div>
  );
  return a.link ? <Link to={a.link}>{content}</Link> : content;
}

function Logo() {
  const { settings } = useSettings();
  const b = settings.brand;
  return (
    <Link to="/" className="flex items-center gap-2">
      {b.logo ? (
        <img src={assetUrl(b.logo)} alt={b.name} className="h-9 w-9 rounded-lg object-cover" />
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-leaf-600 text-white shadow-soft">
          <Leaf size={20} />
        </span>
      )}
      <span className="leading-none">
        <span className="block font-display text-xl font-bold text-leaf-800">{b.name}</span>
        {b.nameBn && <span className="block text-[11px] font-medium text-honey-600">{b.nameBn}</span>}
      </span>
    </Link>
  );
}

function SearchBox({ className = '', onDone }) {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  return (
    <form
      className={`relative ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        nav(`/shop${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
        onDone?.();
      }}
      role="search"
    >
      <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-earth-400" />
      <input value={q} onChange={(e) => setQ(e.target.value)} className="input !rounded-full !py-2 pl-10" placeholder="Search honey, mango, mustard oil…" aria-label="Search products" />
    </form>
  );
}

function Header() {
  const { settings, categories } = useSettings();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const phone = settings.contact.phones?.[0];
  const link = ({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-leaf-50 text-leaf-700' : 'text-earth-700 hover:bg-earth-50'}`;

  return (
    <header className="sticky top-0 z-40 border-b border-earth-100 bg-white/95 backdrop-blur">
      <div className="container-x flex items-center gap-3 py-2.5">
        <button className="rounded-lg p-2 text-earth-700 hover:bg-earth-50 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu size={22} />
        </button>
        <Logo />
        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          <NavLink to="/" end className={link}>Home</NavLink>
          <NavLink to="/shop" end className={link}>All Products</NavLink>
          {categories.map((c) => (
            <NavLink key={c._id} to={`/shop?category=${c.slug}`} className={() => 'rounded-lg px-3 py-2 text-sm font-semibold text-earth-700 hover:bg-earth-50'}>
              {c.icon} {c.name}
            </NavLink>
          ))}
        </nav>
        <SearchBox className="ml-auto hidden max-w-xs flex-1 md:block" />
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          {phone && (
            <a href={telHref(phone)} className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-leaf-700 hover:bg-leaf-50 sm:flex">
              <Phone size={16} /> {phone}
            </a>
          )}
          <Link to="/cart" className="relative rounded-xl p-2.5 text-leaf-800 hover:bg-leaf-50" aria-label={`Cart, ${count} items`}>
            <ShoppingCart size={22} />
            {count > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-honey-500 px-1 text-[11px] font-bold text-white">{count}</span>}
          </Link>
        </div>
      </div>
      <div className="container-x pb-2.5 md:hidden">
        <SearchBox />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full max-h-[100dvh] w-72 max-w-[85%] flex-col overflow-y-auto overscroll-contain bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <Logo />
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-earth-50" aria-label="Close menu"><X size={20} /></button>
            </div>
            <nav className="flex flex-col gap-1" onClick={() => setOpen(false)}>
              <NavLink to="/" end className={link}>🏠 Home</NavLink>
              <NavLink to="/shop" end className={link}>🛍️ All Products</NavLink>
              {categories.map((c) => (
                <Link key={c._id} to={`/shop?category=${c.slug}`} className="rounded-lg px-3 py-2 text-sm font-semibold text-earth-700 hover:bg-earth-50">
                  {c.icon} {c.name} <span className="text-earth-400">· {c.nameBn}</span>
                </Link>
              ))}
              <NavLink to="/track" className={link}>📦 Track Order</NavLink>
            </nav>
            <div className="mt-auto space-y-2 border-t border-earth-100 pt-4">
              {phone && <a href={telHref(phone)} className="btn-primary w-full"><Phone size={16} /> Call {phone}</a>}
              {settings.social.facebookPageUrl && (
                <a href={settings.social.facebookPageUrl} target="_blank" rel="noreferrer" className="btn w-full bg-[#1877F2] text-white"><Facebook size={16} /> Our Facebook Page</a>
              )}
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}

const ICONS = { leaf: Leaf, truck: Truck, shield: ShieldCheck, banknote: Banknote };

function Footer() {
  const { settings, categories } = useSettings();
  const { brand, contact, social, trustBadges, about } = settings;
  const wa = contact.whatsapp && `https://wa.me/${contact.whatsapp}`;
  return (
    <footer className="mt-12 bg-leaf-900 text-leaf-100">
      <div className="border-b border-white/10">
        <div className="container-x grid grid-cols-2 gap-4 py-6 lg:grid-cols-4">
          {trustBadges.map((t) => {
            const Icon = ICONS[t.icon] || Leaf;
            return (
              <div key={t.title} className="flex items-start gap-3">
                <span className="rounded-xl bg-white/10 p-2.5 text-honey-300"><Icon size={20} /></span>
                <div>
                  <p className="text-sm font-semibold text-white">{t.title}</p>
                  <p className="text-xs text-leaf-200">{t.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="container-x grid gap-8 py-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-bold text-white">{brand.name}</p>
          {brand.nameBn && <p className="text-sm text-honey-300">{brand.nameBn}</p>}
          <p className="mt-3 text-sm leading-relaxed text-leaf-200">{about.body}</p>
          {social.facebookPageUrl && (
            <a href={social.facebookPageUrl} target="_blank" rel="noreferrer" className="btn mt-4 bg-[#1877F2] text-white hover:bg-[#1465d0]">
              <Facebook size={16} /> Visit our Facebook Page
            </a>
          )}
        </div>

        <div>
          <h3 className="mb-3 font-sans text-sm font-bold uppercase tracking-wider text-honey-300">Shop</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/shop" className="hover:text-white">All Products</Link></li>
            {categories.map((c) => (
              <li key={c._id}><Link to={`/shop?category=${c.slug}`} className="hover:text-white">{c.icon} {c.name}</Link></li>
            ))}
            <li><Link to="/track" className="hover:text-white">📦 Track Your Order</Link></li>
          </ul>
        </div>

        <div className="space-y-3 text-sm">
          <h3 className="mb-3 font-sans text-sm font-bold uppercase tracking-wider text-honey-300">Contact & Location</h3>
          {contact.address && (
            <p className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-honey-300" />
              <span>{contact.address} {contact.mapUrl && <a href={contact.mapUrl} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center gap-0.5 underline">Map <ExternalLink size={12} /></a>}</span>
            </p>
          )}
          {contact.phones?.map((p) => (
            <p key={p} className="flex gap-2"><Phone size={16} className="shrink-0 text-honey-300" /><a href={telHref(p)} className="hover:text-white">{p}</a></p>
          ))}
          {contact.email && <p className="flex gap-2"><Mail size={16} className="shrink-0 text-honey-300" /><a href={`mailto:${contact.email}`} className="hover:text-white">{contact.email}</a></p>}
          {wa && <p className="flex gap-2"><MessageCircle size={16} className="shrink-0 text-honey-300" /><a href={wa} target="_blank" rel="noreferrer" className="hover:text-white">WhatsApp us</a></p>}
        </div>

        <div className="text-sm">
          <h3 className="mb-3 font-sans text-sm font-bold uppercase tracking-wider text-honey-300">Business Hours</h3>
          <p className="flex gap-2"><Clock size={16} className="mt-0.5 shrink-0 text-honey-300" /><span>{contact.hours}<br />{contact.hoursNote}</span></p>
          <p className="mt-4 text-leaf-200">{settings.shipping.note}</p>
          <div className="mt-4 flex gap-2">
            {[[social.facebookPageUrl, Facebook, 'Facebook'], [social.instagram, Instagram, 'Instagram'], [social.youtube, Youtube, 'YouTube']].filter(([u]) => u).map(([u, Icon, n]) => (
              <a key={n} href={u} target="_blank" rel="noreferrer" aria-label={n} className="rounded-xl bg-white/10 p-2.5 hover:bg-white/20"><Icon size={18} /></a>
            ))}
          </div>
          <p className="mt-4 text-xs text-leaf-300">We accept: Cash on Delivery · bKash · Nagad · Cards</p>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-leaf-300">
        © {new Date().getFullYear()} {brand.name}. All rights reserved. · Delivering to all 64 districts of Bangladesh 🇧🇩
      </div>
    </footer>
  );
}

function FloatingChat() {
  const { settings } = useSettings();
  const { contact } = settings;
  const wa = contact.whatsapp && `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(`Hello ${settings.brand.name}, I'd like to know more about your products.`)}`;
  const ms = contact.messengerUsername && `https://m.me/${contact.messengerUsername}`;
  if (!wa && !ms) return null;
  return (
    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-3 z-30 flex flex-col gap-2.5 md:bottom-6 md:right-5">
      {ms && (
        <a href={ms} target="_blank" rel="noreferrer" aria-label="Chat on Messenger" className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#00B2FF] to-[#006AFF] text-white shadow-lift transition hover:scale-110">
          <MessagesSquare size={22} />
        </a>
      )}
      {wa && (
        <a href={wa} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp" className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lift transition hover:scale-110">
          <MessageCircle size={24} />
        </a>
      )}
    </div>
  );
}

function BottomNav() {
  const { count } = useCart();
  const { settings } = useSettings();
  const phone = settings.contact.phones?.[0];
  const item = ({ isActive }) => `relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${isActive ? 'text-leaf-700' : 'text-earth-500'}`;
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex min-h-16 border-t border-earth-100 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(0,0,0,0.04)] backdrop-blur md:hidden" aria-label="Quick navigation">
      <NavLink to="/" end className={item}><Home size={20} />Home</NavLink>
      <NavLink to="/shop" className={item}><Store size={20} />Shop</NavLink>
      <NavLink to="/cart" className={item}>
        <span className="relative"><ShoppingCart size={20} />{count > 0 && <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-honey-500 px-1 text-[10px] font-bold text-white">{count}</span>}</span>
        Cart
      </NavLink>
      <NavLink to="/track" className={item}><PackageSearch size={20} />Track</NavLink>
      {phone && <a href={telHref(phone)} className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-earth-500"><Phone size={20} />Call</a>}
    </nav>
  );
}

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <Header />
      <main className="min-w-0 flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <FloatingChat />
      <BottomNav />
    </div>
  );
}
