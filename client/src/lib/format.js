export const money = (n) => `৳${Number(n || 0).toLocaleString('en-IN')}`;
export const dateTime = (d) =>
  new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
export const timeAgo = (d) => {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

// Mirror of server/utils/shipping.js (server is authoritative; this is the live preview)
export function calcShipping({ district, subtotal, totalWeightKg, shipping }) {
  if (!district) return { charge: 0, zone: null };
  const inside = district === 'Dhaka';
  let charge = inside ? Number(shipping.insideDhaka) : Number(shipping.outsideDhaka);
  if (shipping.weightBased) charge += Math.max(0, Math.ceil(totalWeightKg - Number(shipping.baseWeightKg || 0))) * Number(shipping.extraPerKg || 0);
  if (Number(shipping.freeShippingThreshold) > 0 && subtotal >= Number(shipping.freeShippingThreshold)) charge = 0;
  return { charge, zone: inside ? 'inside_dhaka' : 'outside_dhaka' };
}

export const isValidBDPhone = (v) => /^(?:\+?88)?01[3-9]\d{8}$/.test(String(v).replace(/[\s-]/g, ''));

export const AVAILABILITY = {
  in_stock: { label: 'In Stock', cls: 'bg-leaf-100 text-leaf-800' },
  limited: { label: 'Limited Stock', cls: 'bg-orange-100 text-orange-800' },
  preorder: { label: 'Pre-Order', cls: 'bg-sky-100 text-sky-800' },
  out_of_stock: { label: 'Out of Stock', cls: 'bg-red-100 text-red-700' },
  coming_soon: { label: 'Coming Soon', cls: 'bg-violet-100 text-violet-800' },
  out_of_season: { label: 'Out of Season', cls: 'bg-earth-100 text-earth-700' },
};

export const ORDER_STATUS = {
  pending: { label: 'Pending', cls: 'bg-amber-100 text-amber-800' },
  processing: { label: 'Processing', cls: 'bg-sky-100 text-sky-800' },
  shipped: { label: 'Shipped', cls: 'bg-violet-100 text-violet-800' },
  delivered: { label: 'Delivered', cls: 'bg-leaf-100 text-leaf-800' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-700' },
};
