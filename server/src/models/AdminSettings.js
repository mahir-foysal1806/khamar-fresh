import mongoose from 'mongoose';
import { deepMerge } from '../utils/helpers.js';

// Single-document store for everything the owner edits without touching code.
const schema = new mongoose.Schema(
  { key: { type: String, default: 'main', unique: true }, data: { type: mongoose.Schema.Types.Mixed, default: {} } },
  { timestamps: true, minimize: false }
);
const AdminSettings = mongoose.model('AdminSettings', schema);

export const DEFAULT_SETTINGS = {
  brand: {
    name: 'KhamarFresh',
    nameBn: 'খামার ফ্রেশ',
    tagline: 'Pure honey, farm-fresh fruits & grains — delivered to all 64 districts',
    logo: '',
  },
  announcement: {
    active: true,
    text: '🚚 Delivery in all 64 districts · Cash on Delivery available · Fresh stock updated daily',
    link: '/shop',
  },
  banners: [
    { title: 'Pure Sundarban Honey', subtitle: 'Wild-harvested, unprocessed & lab-tested. Straight from the hive to your home.', ctaText: 'Shop Honey', ctaLink: '/shop?category=pure-honey', image: '', theme: 'honey', active: true },
    { title: "Today's Fresh Arrivals", subtitle: 'Seasonal fruits picked this morning from the orchards of Rajshahi & Chapainawabganj.', ctaText: 'See Fresh Fruits', ctaLink: '/shop?category=seasonal-fruits', image: '', theme: 'leaf', active: true },
    { title: 'Direct From Our Farms', subtitle: 'Mustard oil, rice, jaggery & spices — no middlemen, fair prices.', ctaText: 'Shop Agro Products', ctaLink: '/shop?category=agricultural-products', image: '', theme: 'earth', active: true },
  ],
  contact: {
    phones: ['01700-000000'],
    whatsapp: '8801700000000', // international format, no +
    messengerUsername: 'yourpage', // m.me/<username>
    email: 'hello@khamarfresh.com',
    address: 'House 12, Road 5, Mirpur-10, Dhaka-1216, Bangladesh',
    mapUrl: 'https://maps.google.com/?q=Mirpur+10+Dhaka',
    hours: 'Saturday – Thursday: 9:00 AM – 9:00 PM',
    hoursNote: 'Friday: Online orders only',
  },
  social: {
    facebookPageUrl: 'https://www.facebook.com/yourpage',
    facebookReviewsUrl: 'https://www.facebook.com/yourpage/reviews',
    instagram: '',
    youtube: '',
    tiktok: '',
  },
  shipping: {
    insideDhaka: 60,
    outsideDhaka: 120,
    weightBased: false,
    baseWeightKg: 2,
    extraPerKg: 20,
    freeShippingThreshold: 0,
    note: 'Dhaka: 1–2 days · Other districts: 2–4 days via courier',
  },
  payment: {
    cod: { enabled: true },
    bkash: { enabled: false, number: '', instructions: 'Send Money to the bKash Personal number above, then enter the TrxID.' },
    nagad: { enabled: false, number: '', instructions: 'Send Money to the Nagad Personal number above, then enter the TrxID.' },
    sslcommerz: { enabled: false },
  },
  sms: { enabled: false, notifyOnStatus: true, adminPhone: '' },
  trustBadges: [
    { icon: 'leaf', title: '100% Natural', text: 'No chemicals, no adulteration' },
    { icon: 'truck', title: '64 District Delivery', text: 'Courier to every district' },
    { icon: 'shield', title: 'Quality Guarantee', text: 'Not satisfied? We make it right' },
    { icon: 'banknote', title: 'Cash on Delivery', text: 'Pay when you receive' },
  ],
  facebookReviews: [], // owner pastes real customer feedback from the Facebook page here
  about: {
    title: 'From Bangladeshi farms to your family table',
    body: 'We work directly with beekeepers, orchard owners and farmers across Bangladesh to bring you honest, chemical-free food. Every batch is checked before it ships, and our stock is updated every single day so you only order what is truly fresh.',
  },
  seo: {
    title: 'KhamarFresh — Pure Honey, Fresh Fruits & Agro Products in Bangladesh',
    description: 'Order 100% pure honey, seasonal fruits and farm-fresh agricultural products online. Cash on Delivery across all 64 districts of Bangladesh.',
    ogImage: '',
    keywords: 'pure honey bangladesh, mango online, khalisha moo, agro products, fresh fruits dhaka',
  },
};

export async function getSettings() {
  const doc = await AdminSettings.findOne({ key: 'main' }).lean();
  return deepMerge(DEFAULT_SETTINGS, doc?.data || {});
}

export async function saveSettings(data) {
  await AdminSettings.findOneAndUpdate({ key: 'main' }, { data }, { upsert: true, new: true, setDefaultsOnInsert: true });
  return data;
}

// Strip private fields before sending to the public storefront
export const publicSettings = (s) => ({ ...s, sms: { enabled: s.sms.enabled } });

export default AdminSettings;
