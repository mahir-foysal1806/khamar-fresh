/**
 * Payment gateway hooks.
 * - SSLCommerz: working init + validation flow (sandbox/live via env).
 * - bKash / Nagad: manual "send money + TrxID" works out of the box from checkout.
 *   For tokenized merchant APIs, implement init()/verify() below.
 */
import { HttpError } from './helpers.js';

const sslBase = () =>
  process.env.SSLCOMMERZ_SANDBOX === 'false' ? 'https://securepay.sslcommerz.com' : 'https://sandbox.sslcommerz.com';

export const gateways = {
  async sslcommerz_init(order) {
    const { SSLCOMMERZ_STORE_ID: id, SSLCOMMERZ_STORE_PASS: pass } = process.env;
    if (!id || !pass) throw new HttpError(501, 'SSLCommerz is not configured on the server');
    const api = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;
    const params = new URLSearchParams({
      store_id: id,
      store_passwd: pass,
      total_amount: String(order.total),
      currency: 'BDT',
      tran_id: order.orderId,
      success_url: `${api}/api/payments/sslcommerz/success`,
      fail_url: `${api}/api/payments/sslcommerz/fail`,
      cancel_url: `${api}/api/payments/sslcommerz/cancel`,
      ipn_url: `${api}/api/payments/sslcommerz/ipn`,
      cus_name: order.customer.name,
      cus_email: 'customer@example.com',
      cus_add1: order.customer.address,
      cus_city: order.customer.district,
      cus_country: 'Bangladesh',
      cus_phone: order.customer.phone,
      shipping_method: 'Courier',
      ship_name: order.customer.name,
      ship_add1: order.customer.address,
      ship_city: order.customer.district,
      ship_country: 'Bangladesh',
      num_of_item: String(order.items.length),
      product_name: 'Agricultural products',
      product_category: 'Grocery',
      product_profile: 'general',
    });
    const r = await fetch(`${sslBase()}/gwprocess/v4/api.php`, { method: 'POST', body: params });
    const j = await r.json();
    if (j.status !== 'SUCCESS') throw new HttpError(502, j.failedreason || 'SSLCommerz session failed');
    return { redirectUrl: j.GatewayPageURL };
  },

  async sslcommerz_validate(valId) {
    const { SSLCOMMERZ_STORE_ID: id, SSLCOMMERZ_STORE_PASS: pass } = process.env;
    const url = `${sslBase()}/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(valId)}&store_id=${id}&store_passwd=${pass}&format=json`;
    const r = await fetch(url);
    return r.json();
  },

  async bkash_init() {
    // TODO: grant token -> create payment -> return { redirectUrl: bkashURL }
    throw new HttpError(501, 'bKash merchant API is not configured. Use manual bKash (TrxID) or implement utils/payments.js');
  },
  async nagad_init() {
    // TODO: initialize -> complete -> return { redirectUrl }
    throw new HttpError(501, 'Nagad merchant API is not configured. Use manual Nagad (TrxID) or implement utils/payments.js');
  },
};
