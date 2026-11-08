import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';
import { UPLOAD_DIR } from './middleware/upload.js';
import { spaPage, shareProduct, sitemap, robots, hasClientBuild, clientDist } from './controllers/seoController.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());
  app.use(cors({ origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(','), credentials: true }));
  if (process.env.NODE_ENV !== 'test') app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true })); // SSLCommerz callbacks are form-encoded

  app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d' }));
  app.use('/api', rateLimit({ windowMs: 15 * 60e3, max: 600, standardHeaders: true, legacyHeaders: false }), routes);

  app.get('/sitemap.xml', sitemap);
  app.get('/robots.txt', robots);
  app.get('/share/product/:slug', shareProduct);

  // Production: serve the built React app with per-page Open Graph tags
  if (hasClientBuild()) {
    app.use(express.static(clientDist(), { index: false, maxAge: '7d' }));
    app.get('*', spaPage);
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
