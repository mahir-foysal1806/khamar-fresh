import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

const Ctx = createContext(null);
export const useCart = () => useContext(Ctx);
const KEY = 'kf_cart_v1';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable */
    }
  }, [items]);

  const add = (p, qty = 1, { silent = false } = {}) => {
    const preorder = p.availability === 'preorder';
    const max = preorder ? 50 : Math.max(1, p.stockQty);
    setItems((cur) => {
      const found = cur.find((i) => i.productId === p._id);
      if (found) return cur.map((i) => (i.productId === p._id ? { ...i, qty: Math.min(max, i.qty + qty), price: p.price, maxQty: max } : i));
      return [...cur, { productId: p._id, slug: p.slug, name: p.name, nameBn: p.nameBn, image: p.images?.[0], unit: p.unit, price: p.price, weightKg: p.weightKg, qty: Math.min(max, qty), maxQty: max, preorder, categorySlug: p.category?.slug }];
    });
    if (!silent) toast.success(`${p.name} added to cart`, { icon: '🛒' });
  };

  const setQty = (id, qty) => setItems((cur) => cur.map((i) => (i.productId === id ? { ...i, qty: Math.max(1, Math.min(i.maxQty, qty)) } : i)));
  const remove = (id) => setItems((cur) => cur.filter((i) => i.productId !== id));
  const clear = () => setItems([]);

  const totals = useMemo(
    () => ({
      count: items.reduce((s, i) => s + i.qty, 0),
      subtotal: items.reduce((s, i) => s + i.qty * i.price, 0),
      weightKg: items.reduce((s, i) => s + i.qty * (i.weightKg || 0), 0),
    }),
    [items]
  );

  return <Ctx.Provider value={{ items, add, setQty, remove, clear, ...totals }}>{children}</Ctx.Provider>;
}
