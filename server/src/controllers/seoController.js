import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';
import { getSettings } from '../models/AdminSettings.js';
import { asyncHandler, escapeHtml } from '../utils/helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../../../client/dist');
const site = () => (process.env.SITE_URL || 'http://localhost:5173').replace(/\/$/, '');
const abs = (u) => (!u ? '' : /^https?:/.test(u) ? u : `${site()}${u.startsWith('/') ? '' : '/'}${u}`);

export const hasClientBuild = () => fs.existsSync(path.join(DIST, 'index.html'));
export const clientDist = () => DIST;

function metaTags({ title, description, image, url, type = 'website', price }) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  return `<!--OG_START-->
    <title>${t}</title>
    <meta name="description" content="${d}" />
    <link rel="canonical" href="${escapeHtml(url)}" />
    <meta property="og:site_name" content="${escapeHtml(title.split('—')[0].trim())}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:locale" content="en_BD" />
    ${image ? `<meta property="og:image" content="${escapeHtml(image)}" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" />` : ''}
    ${price ? `<meta property="product:price:amount" content="${price}" /><meta property="product:price:currency" content="BDT" />` : ''}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    ${image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : ''}
  <!--OG_END-->`;
}

const productMetaData = (p, s) => ({
  title: `${p.name}${p.nameBn ? ` (${p.nameBn})` : ''} — ${s.brand.name}`,
  description: `${p.shortDescription || p.description || s.seo.description}`.slice(0, 200) + ` · ৳${p.price}/${p.unit} · Cash on Delivery in 64 districts`,
  image: abs(p.images?.[0] || s.seo.ogImage),
  url: `${site()}/product/${p.slug}`,
  type: 'product',
  price: p.price,
});

const withMeta = (html, tags) => html.replace(/<!--OG_START-->[\s\S]*?<!--OG_END-->/, tags);

// Serve SPA index.html with server-rendered meta (what Facebook/WhatsApp crawlers read)
export const spaPage = asyncHandler(async (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
  const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  const s = await getSettings();
  let data = { title: s.seo.title, description: s.seo.description, image: abs(s.seo.ogImage), url: site() + req.path };
  const m = req.path.match(/^\/product\/([^/]+)$/);
  if (m) {
    const p = await Product.findOne({ slug: m[1], isActive: true });
    if (p) data = productMetaData(p, s);
  }
  res.set('Content-Type', 'text/html').send(withMeta(html, metaTags(data)));
});

// Dev helper & share-link: /share/product/:slug -> crawler gets OG tags, humans get redirected
export const shareProduct = asyncHandler(async (req, res) => {
  const p = await Product.findOne({ slug: req.params.slug, isActive: true });
  const client = (process.env.CLIENT_URL || site()).replace(/\/$/, '');
  if (!p) return res.redirect(client);
  const s = await getSettings();
  const data = productMetaData(p, s);
  res.set('Content-Type', 'text/html').send(`<!doctype html><html lang="en"><head><meta charset="utf-8" />${metaTags(data)}<meta http-equiv="refresh" content="0;url=${client}/product/${p.slug}" /></head><body><a href="${client}/product/${p.slug}">${escapeHtml(p.name)}</a></body></html>`);
});

export const sitemap = asyncHandler(async (_req, res) => {
  const products = await Product.find({ isActive: true }).select('slug updatedAt').lean();
  const urls = [
    { loc: `${site()}/`, mod: new Date() },
    { loc: `${site()}/shop`, mod: new Date() },
    ...products.map((p) => ({ loc: `${site()}/product/${p.slug}`, mod: p.updatedAt })),
  ];
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls
      .map((u) => `<url><loc>${escapeHtml(u.loc)}</loc><lastmod>${new Date(u.mod).toISOString()}</lastmod></url>`)
      .join('')}</urlset>`
  );
});

export const robots = (_req, res) =>
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\nSitemap: ${site()}/sitemap.xml\n`);
