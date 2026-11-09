import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Zap, Bell } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { money } from '../lib/format';
import { ProductImage, ProductBadges, Stars } from './ui';

export default function ProductCard({ p }) {
  const { add } = useCart();
  const nav = useNavigate();
  const sellable = p.purchasable;
  const pre = p.availability === 'preorder';
  const blockedLabel = { out_of_stock: 'Out of Stock', coming_soon: 'Coming Soon', out_of_season: 'Out of Season' }[p.availability];

  return (
    <article className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift animate-rise">
      <Link to={`/product/${p.slug}`} className="relative block">
        <ProductImage
          src={p.images?.[0]}
          alt={p.name}
          category={p.category?.slug}
          className={`aspect-square w-full transition duration-500 group-hover:scale-105 ${sellable ? '' : 'grayscale-[.6]'}`}
        />
        <div className="absolute left-2 top-2 max-w-[75%]">
          <ProductBadges p={p} compact />
        </div>
        {p.discountPercent > 0 && sellable && (
          <span className="absolute right-0 top-3 rounded-l-full bg-red-600 py-1 pl-2.5 pr-2 text-xs font-bold text-white shadow">-{p.discountPercent}%</span>
        )}
        {!sellable && (
          <span className="absolute inset-x-0 bottom-0 bg-earth-900/80 py-1 text-center text-xs font-semibold text-white">{blockedLabel}</span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col p-2.5 sm:p-3">
        <Link to={`/product/${p.slug}`} className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-earth-900 hover:text-leaf-700 sm:text-[15px]">
          {p.name}
        </Link>
        {p.nameBn && <p className="line-clamp-1 text-xs text-earth-500">{p.nameBn}</p>}
        <div className="mt-1">
          <Stars value={p.ratingAvg} count={p.ratingCount} />
        </div>

        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-lg font-bold text-leaf-700">{money(p.price)}</span>
          {p.comparePrice > p.price && <span className="text-xs text-earth-400 line-through">{money(p.comparePrice)}</span>}
          <span className="text-xs text-earth-500">/ {p.unit}</span>
        </div>

        <div className="mt-auto grid grid-cols-5 gap-1 pt-3 sm:gap-1.5">
          {sellable ? (
            <>
              <button onClick={() => add(p, 1)} className="btn-outline col-span-2 !min-h-10 !px-0 !py-2" aria-label={`Add ${p.name} to cart`}>
                <ShoppingCart size={16} />
                <span className="text-xs">Add</span>
              </button>
              <button
                onClick={() => {
                  add(p, 1, { silent: true });
                  nav('/checkout');
                }}
                className="btn-honey col-span-3 !min-h-10 !px-1 !py-2 text-[11px] sm:text-xs"
              >
                <Zap size={15} /> {pre ? 'Pre-Order' : 'Order Now'}
              </button>
            </>
          ) : (
            <Link to={`/product/${p.slug}`} className="btn col-span-5 bg-earth-100 !py-2 text-xs text-earth-600">
              <Bell size={14} /> {blockedLabel} · Details
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ items }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p._id} p={p} />
      ))}
    </div>
  );
}
