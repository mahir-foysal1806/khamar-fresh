// Authoritative shipping calculation (client has an identical preview copy).
export function calcShipping({ district, subtotal, totalWeightKg, shipping }) {
  const inside = district === 'Dhaka';
  let charge = inside ? Number(shipping.insideDhaka) : Number(shipping.outsideDhaka);
  if (shipping.weightBased) {
    const extraKg = Math.max(0, Math.ceil(totalWeightKg - Number(shipping.baseWeightKg || 0)));
    charge += extraKg * Number(shipping.extraPerKg || 0);
  }
  if (Number(shipping.freeShippingThreshold) > 0 && subtotal >= Number(shipping.freeShippingThreshold)) charge = 0;
  return { charge, zone: inside ? 'inside_dhaka' : 'outside_dhaka' };
}
