import { useState } from 'react';
import { Star, Minus, Plus, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { assetUrl } from '../lib/api';
import { AVAILABILITY } from '../lib/format';

const PLACEHOLDER = {
  'pure-honey': { emoji: '🍯', cls: 'from-honey-200 to-honey-400' },
  'seasonal-fruits': { emoji: '🥭', cls: 'from-orange-200 to-leaf-300' },
  'agricultural-products': { emoji: '🌾', cls: 'from-earth-100 to-leaf-200' },
};

export function ProductImage({ src, alt, category, className = '' }) {
  const [failed, setFailed] = useState(false);
  const ph = PLACEHOLDER[category] || PLACEHOLDER['agricultural-products'];
  if (!src || failed)
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br ${ph.cls} ${className}`} role="img" aria-label={alt}>
        <span className="text-5xl drop-shadow-sm sm:text-6xl">{ph.emoji}</span>
      </div>
    );
  return <img src={assetUrl(src)} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />;
}

export function Stars({ value = 0, count, size = 14 }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-earth-500">
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} size={size} className={n <= Math.round(value) ? 'fill-honey-400 text-honey-400' : 'fill-earth-100 text-earth-200'} />
        ))}
      </span>
      {count > 0 && <span>({count})</span>}
    </span>
  );
}

export function AvailabilityChip({ value }) {
  const a = AVAILABILITY[value] || AVAILABILITY.in_stock;
  return <span className={`chip ${a.cls}`}>{a.label}</span>;
}

// Trust + dynamic badges. Limited/Pre-order tags come from inventory counts automatically.
export function ProductBadges({ p, compact = false }) {
  const b = [];
  if (p.isOrganic) b.push(['Organic', 'bg-leaf-600 text-white']);
  if (p.isPure) b.push(['100% Pure', 'bg-honey-400 text-earth-900']);
  if (p.isSeasonal && p.seasonAvailable) b.push(['Seasonal', 'bg-orange-500 text-white']);
  if (p.availability === 'limited') b.push([`Only ${p.stockQty} left`, 'bg-red-600 text-white']);
  if (p.availability === 'preorder') b.push(['Pre-Order', 'bg-sky-600 text-white']);
  if (p.isTodaysFresh) b.push(['Fresh Today', 'bg-white text-leaf-700 ring-1 ring-leaf-200']);
  return (
    <div className="flex flex-wrap gap-1">
      {(compact ? b.slice(0, 2) : b).map(([t, c]) => (
        <span key={t} className={`chip shadow-sm ${c}`}>
          {t}
        </span>
      ))}
    </div>
  );
}

export function QtyStepper({ value, onChange, max = 99 }) {
  return (
    <div className="inline-flex items-center rounded-xl border border-earth-200 bg-white">
      <button type="button" aria-label="Decrease" className="p-2.5 text-earth-700 disabled:opacity-30" disabled={value <= 1} onClick={() => onChange(value - 1)}>
        <Minus size={16} />
      </button>
      <span className="w-9 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button type="button" aria-label="Increase" className="p-2.5 text-earth-700 disabled:opacity-30" disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Plus size={16} />
      </button>
    </div>
  );
}

export function SectionHeader({ eyebrow, title, subtitle, to, linkText = 'View all', icon: Icon }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-honey-600">
            {Icon && <Icon size={14} />}
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-bold text-leaf-800 sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 max-w-xl text-sm text-earth-600">{subtitle}</p>}
      </div>
      {to && (
        <Link to={to} className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-leaf-700 hover:underline">
          {linkText} <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-earth-100 ${className}`} />;
}

export function ProductGridSkeleton({ n = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <Skeleton className="aspect-square rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Empty({ icon = '🌱', title, text, children }) {
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <div className="text-5xl">{icon}</div>
      <h3 className="mt-3 text-xl font-bold text-leaf-800">{title}</h3>
      {text && <p className="mt-1 text-sm text-earth-600">{text}</p>}
      <div className="mt-4 flex justify-center gap-2">{children}</div>
    </div>
  );
}
