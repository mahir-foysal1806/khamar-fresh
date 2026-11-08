# KhamarFresh — MERN E-commerce (honey, fruits, agro products · 64 districts of Bangladesh)

## Quick start
```bash
npm install && npm run install:all
cp server/.env.example server/.env   # set JWT_SECRET, MONGODB_URI, admin email/password
npm run seed                         # categories, demo products, settings, admin user
npm run dev                          # API :5000, site :5173
```
Admin: http://localhost:5173/admin (credentials from .env — change password after login).

## Production
`npm run build` then `npm start`. Express serves client/dist and injects per-product Open Graph tags
(Facebook/WhatsApp previews). Set SITE_URL, CLIENT_URL, API_PUBLIC_URL.

## Where things are
- Daily stock/price/toggles: client/src/admin/AdminProducts.jsx, server productController (/quick, /reset-daily)
- Orders by district + stages: admin/AdminOrders.jsx, orderController.js
- Banners, contact, shipping, payments, FB reviews: admin/AdminSettings.jsx, models/AdminSettings.js
- Limited Stock / Pre-Order tags: models/Product.js (availability virtual)
- Checkout + shipping (Dhaka 60 / others 120, optional weight-based): pages/Checkout.jsx, utils/shipping.js
- Payments: COD, manual bKash/Nagad (TrxID), SSLCommerz flow; merchant API hooks in utils/payments.js
- SMS hook: utils/sms.js · SEO/OG/sitemap: seoController.js

## Notes
- Seed products have no photos; upload real ones in Admin. Uploads go to server/uploads (use Cloudinary/S3 on ephemeral hosts).
- Contact details/URLs are placeholders — edit in Admin → Site Settings.
- Facebook feedback is entered by you (real reviews only); the live feed uses Facebook's Page Plugin.
