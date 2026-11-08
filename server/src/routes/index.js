import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import * as auth from '../controllers/authController.js';
import * as cat from '../controllers/categoryController.js';
import * as prod from '../controllers/productController.js';
import * as order from '../controllers/orderController.js';
import * as review from '../controllers/reviewController.js';
import * as settings from '../controllers/settingsController.js';
import * as pay from '../controllers/paymentController.js';
import { DIVISIONS } from '../config/districts.js';

const r = Router();
const limiter = (windowMin, max, message) =>
  rateLimit({ windowMs: windowMin * 60e3, max, standardHeaders: true, legacyHeaders: false, message: { message } });

r.get('/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
r.get('/meta/districts', (_req, res) => res.json(DIVISIONS));

// Auth
r.post('/auth/login', limiter(15, 10, 'Too many login attempts, try again later'), auth.login);
r.get('/auth/me', protect, auth.me);
r.post('/auth/change-password', protect, auth.changePassword);

// Settings
r.get('/settings', settings.getPublicSettings);
r.get('/admin/settings', protect, settings.getAdminSettings);
r.put('/admin/settings', protect, requireRole('admin'), settings.updateSettings);

// Categories
r.get('/categories', cat.listCategories);
r.post('/categories', protect, requireRole('admin'), cat.createCategory);
r.put('/categories/:id', protect, requireRole('admin'), cat.updateCategory);
r.delete('/categories/:id', protect, requireRole('admin'), cat.deleteCategory);

// Products (static paths first)
r.get('/products', prod.listProducts);
r.get('/products/home', prod.homeProducts);
r.get('/admin/products', protect, prod.adminListProducts);
r.post('/admin/products/reset-daily', protect, prod.resetDailyFlags);
r.post('/admin/products', protect, prod.createProduct);
r.put('/admin/products/:id', protect, prod.updateProduct);
r.patch('/admin/products/:id/quick', protect, prod.quickUpdateProduct);
r.delete('/admin/products/:id', protect, prod.deleteProduct);
r.get('/products/:idOrSlug', prod.getProduct);

// Orders
r.post('/orders', limiter(60, 20, 'Too many orders from this network, please call us to order'), order.createOrder);
r.get('/orders/track', limiter(15, 30, 'Too many lookups, try again later'), order.trackOrder);
r.get('/admin/orders', protect, order.adminListOrders);
r.get('/admin/orders/stats', protect, order.orderStats);
r.get('/admin/orders/:id', protect, order.adminGetOrder);
r.patch('/admin/orders/:id/status', protect, order.updateOrderStatus);
r.patch('/admin/orders/:id/payment', protect, order.updateOrderPayment);

// Reviews
r.get('/reviews/product/:productId', review.productReviews);
r.post('/reviews', limiter(60, 10, 'Too many reviews submitted'), review.createReview);
r.get('/admin/reviews', protect, review.adminListReviews);
r.patch('/admin/reviews/:id', protect, review.setApproval);
r.delete('/admin/reviews/:id', protect, review.deleteReview);

// Payments
r.post('/payments/:gateway/init', pay.initPayment);
for (const o of ['success', 'fail', 'cancel', 'ipn']) r.all(`/payments/sslcommerz/${o}`, pay.sslcommerzCallback(o));

// Uploads
r.post('/admin/upload', protect, upload.array('images', 8), (req, res) => res.json({ urls: req.files.map((f) => `/uploads/${f.filename}`) }));

export default r;
