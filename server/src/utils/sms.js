import { toIntlPhone } from './helpers.js';

/**
 * SMS gateway hook. Providers:
 *  - log        : prints to console (default, safe for development)
 *  - bulksmsbd  : https://bulksmsbd.net HTTP API
 *  - custom     : POST JSON { to, message } to SMS_API_URL with Bearer SMS_API_KEY
 * Add any other Bangladeshi gateway (SSL Wireless, Greenweb, etc.) as a new branch.
 */
export async function sendSMS(localPhone, message) {
  const provider = (process.env.SMS_PROVIDER || 'log').toLowerCase();
  const to = toIntlPhone(localPhone);
  try {
    if (provider === 'bulksmsbd') {
      const url = new URL('http://bulksmsbd.net/api/smsapi');
      url.search = new URLSearchParams({
        api_key: process.env.SMS_API_KEY || '',
        type: 'text',
        number: to,
        senderid: process.env.SMS_SENDER_ID || '',
        message,
      }).toString();
      const r = await fetch(url);
      return { ok: r.ok, provider, to, message, response: (await r.text()).slice(0, 300) };
    }
    if (provider === 'custom') {
      const r = await fetch(process.env.SMS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.SMS_API_KEY}` },
        body: JSON.stringify({ to, message, sender: process.env.SMS_SENDER_ID }),
      });
      return { ok: r.ok, provider, to, message, response: (await r.text()).slice(0, 300) };
    }
    console.log(`[SMS:log] -> ${to}: ${message}`);
    return { ok: true, provider: 'log', to, message };
  } catch (e) {
    return { ok: false, provider, to, message, response: e.message };
  }
}

export const orderPlacedSMS = (o, brand) =>
  `${brand}: Apnar order ${o.orderId} confirmed. Total Tk ${o.total} (${o.payment.method.toUpperCase()}). Track: ${process.env.SITE_URL || ''}/track. Dhonnobad!`;

export const statusSMS = (o, brand) => {
  const map = {
    processing: 'processing hocche',
    shipped: 'courier-e pathano hoyeche',
    delivered: 'delivered hoyeche. Dhonnobad!',
    cancelled: 'cancel kora hoyeche',
  };
  return map[o.status] ? `${brand}: Order ${o.orderId} ${map[o.status]}.` : null;
};
