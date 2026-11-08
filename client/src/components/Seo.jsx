import { Helmet } from 'react-helmet-async';
import { useSettings } from '../context/SettingsContext';
import { assetUrl } from '../lib/api';

// Client-side meta (for users + Google). Facebook/WhatsApp crawlers get the same tags
// from the server (see server/src/controllers/seoController.js).
export default function Seo({ title, description, image, type = 'website', noindex = false }) {
  const { settings } = useSettings();
  const t = title ? `${title} — ${settings.brand.name}` : settings.seo.title || settings.brand.name;
  const d = description || settings.seo.description;
  const img = assetUrl(image || settings.seo.ogImage);
  const abs = img && !/^https?:/.test(img) ? `${window.location.origin}${img}` : img;
  return (
    <Helmet>
      <title>{t}</title>
      <meta name="description" content={d} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <meta property="og:title" content={t} />
      <meta property="og:description" content={d} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={window.location.href} />
      {abs && <meta property="og:image" content={abs} />}
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
}
