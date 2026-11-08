import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

// Safe defaults so the UI renders instantly, even before the API answers
const FALLBACK = {
  brand: { name: 'KhamarFresh', nameBn: 'খামার ফ্রেশ', tagline: 'Pure honey, fresh fruits & farm products', logo: '' },
  announcement: { active: false, text: '', link: '' },
  banners: [],
  contact: { phones: [], whatsapp: '', messengerUsername: '', email: '', address: '', mapUrl: '', hours: '', hoursNote: '' },
  social: { facebookPageUrl: '', facebookReviewsUrl: '', instagram: '', youtube: '', tiktok: '' },
  shipping: { insideDhaka: 60, outsideDhaka: 120, weightBased: false, baseWeightKg: 2, extraPerKg: 20, freeShippingThreshold: 0, note: '' },
  payment: { cod: { enabled: true }, bkash: { enabled: false }, nagad: { enabled: false }, sslcommerz: { enabled: false } },
  trustBadges: [],
  facebookReviews: [],
  about: { title: '', body: '' },
  seo: { title: '', description: '', ogImage: '', keywords: '' },
};

const Ctx = createContext({ settings: FALLBACK, categories: [], refresh: () => {} });
export const useSettings = () => useContext(Ctx);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK);
  const [categories, setCategories] = useState([]);
  const [ready, setReady] = useState(false);

  const refresh = () =>
    Promise.all([api.get('/settings'), api.get('/categories')])
      .then(([s, c]) => {
        setSettings({ ...FALLBACK, ...s });
        setCategories(c);
      })
      .catch(() => {})
      .finally(() => setReady(true));

  useEffect(() => {
    refresh();
  }, []);

  return <Ctx.Provider value={{ settings, categories, ready, refresh }}>{children}</Ctx.Provider>;
}
