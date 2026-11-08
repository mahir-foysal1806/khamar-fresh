import Order, { ORDER_STATUSES } from '../models/Order.js';
import Product from '../models/Product.js';
import { getSettings } from '../models/AdminSettings.js';
import { isValidDistrict } from '../config/districts.js';
import { HttpError, asyncHandler, normalizePhone, escapeRegex, startOfTodayDhaka } from '../utils/helpers.js';
import { calcShipping } from '../utils/shipping.js';
import { sendSMS, orderPlacedSMS, statusSMS } from '../utils/sms.js';

async function generateOrderId() {
  const d = new Date(Date.now() + 6 * 3600e3);
  const ymd = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  for (;;) {
    const id = `KF${ymd}${Math.floor(1000 + Math.random() * 9000)}`;
    if (!(await Order.exists({ orderId: id }))) return id;
  }
}

const publicOrder = (o) => ({
  orderId: o.orderId,
  status: o.status,
  statusHistory: o.statusHistory,
  items: o.items,
  subtotal: o.subtotal,
  shippingCharge: o.shippingCharge,
  total: o.total,
  payment: { method: o.payment.method, status: o.payment.status },
  customer: { name: o.customer.name, district: o.customer.district },
  createdAt: o.createdAt,
});

async function notify(order, message) {
  if (!message) return;
  const result = await sendSMS(order.customer.phone, message);
  await Order.updateOne({ _id: order._id }, { $push: { smsLog: { to: result.to, message, ok: result.ok, provider: result.provider, response: result.response } } });
}

// ---------- Public ----------
export const createOrder = asyncHandler(async (req, res) => {
  const { customer = {}, items = [], paymentMethod = 'cod', transactionId, senderNumber } = req.body;
  const settings = await getSettings();

  const phone = normalizePhone(customer.phone);
  if (!customer.name?.trim()) throw new HttpError(400, 'Please enter your name');
  if (!phone) throw new HttpError(400, 'Please enter a valid Bangladeshi mobile number (01XXXXXXXXX)');
  if (!customer.address?.trim() || customer.address.trim().length < 8) throw new HttpError(400, 'Please enter your full delivery address');
  if (!isValidDistrict(customer.district)) throw new HttpError(400, 'Please select a valid district');
  if (!Array.isArray(items) || !items.length) throw new HttpError(400, 'Your cart is empty');

  const pay = settings.payment[paymentMethod];
  if (!pay || !pay.enabled) throw new HttpError(400, 'Selected payment method is not available');
  if (['bkash', 'nagad'].includes(paymentMethod) && !String(transactionId || '').trim()) throw new HttpError(400, 'Please enter the payment TrxID');

  // Rebuild items from DB — never trust client prices
  const ids = items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: ids }, isActive: true });
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const lines = [];
  for (const i of items) {
    const p = byId.get(String(i.productId));
    const qty = Math.floor(Number(i.qty));
    if (!p) throw new HttpError(400, 'A product in your cart is no longer available');
    if (!(qty >= 1 && qty <= 100)) throw new HttpError(400, `Invalid quantity for ${p.name}`);
    if (!p.purchasable) throw new HttpError(400, `${p.name} is currently unavailable`);
    const preorder = p.availability === 'preorder';
    if (!preorder && qty > p.stockQty) throw new HttpError(400, `Only ${p.stockQty} ${p.unit} of ${p.name} left in stock`);
    lines.push({ product: p._id, name: p.name, nameBn: p.nameBn, image: p.images?.[0], unit: p.unit, price: p.price, qty, weightKg: p.weightKg, preorder });
  }

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const totalWeightKg = lines.reduce((s, l) => s + l.weightKg * l.qty, 0);
  const { charge, zone } = calcShipping({ district: customer.district, subtotal, totalWeightKg, shipping: settings.shipping });

  // Atomically reserve stock (pre-orders don't consume stock)
  const reserved = [];
  try {
    for (const l of lines.filter((x) => !x.preorder)) {
      const r = await Product.updateOne({ _id: l.product, stockQty: { $gte: l.qty } }, { $inc: { stockQty: -l.qty, soldCount: l.qty } });
      if (!r.modifiedCount) throw new HttpError(409, `${l.name} just went out of stock. Please update your cart.`);
      reserved.push(l);
    }
  } catch (e) {
    await Promise.all(reserved.map((l) => Product.updateOne({ _id: l.product }, { $inc: { stockQty: l.qty, soldCount: -l.qty } })));
    throw e;
  }

  const order = await Order.create({
    orderId: await generateOrderId(),
    customer: { name: customer.name.trim(), phone, address: customer.address.trim(), district: customer.district, upazila: customer.upazila?.trim(), notes: customer.notes?.trim() },
    items: lines,
    subtotal,
    shippingCharge: charge,
    total: subtotal + charge,
    totalWeightKg,
    deliveryZone: zone,
    payment: { method: paymentMethod, transactionId: transactionId?.trim(), senderNumber: senderNumber?.trim() },
    statusHistory: [{ status: 'pending', note: 'Order placed', by: 'customer' }],
    source: req.body.source || 'website',
  });

  if (settings.sms.enabled) {
    notify(order, orderPlacedSMS(order, settings.brand.name)).catch(() => {});
    if (settings.sms.adminPhone) {
      const adminPhone = normalizePhone(settings.sms.adminPhone);
      if (adminPhone) sendSMS(adminPhone, `New order ${order.orderId} - Tk ${order.total} - ${order.customer.district}`).catch(() => {});
    }
  }

  res.status(201).json({ ...publicOrder(order), customer: { name: order.customer.name, phone, district: order.customer.district, address: order.customer.address } });
});

export const trackOrder = asyncHandler(async (req, res) => {
  const phone = normalizePhone(req.query.phone);
  const orderId = String(req.query.orderId || '').trim().toUpperCase();
  if (!phone || !orderId) throw new HttpError(400, 'Enter your order ID and the phone number used');
  const order = await Order.findOne({ orderId, 'customer.phone': phone });
  if (!order) throw new HttpError(404, 'No order found with these details');
  res.json(publicOrder(order));
});

// ---------- Admin ----------
export const adminListOrders = asyncHandler(async (req, res) => {
  const { status, district, search, from, to, limit = 300 } = req.query;
  const filter = {};
  if (status && status !== 'all') filter.status = status;
  if (district) filter['customer.district'] = district;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  if (search?.trim()) {
    const s = search.trim();
    const rx = new RegExp(escapeRegex(s), 'i');
    const phone = normalizePhone(s);
    filter.$or = [{ orderId: rx }, { 'customer.phone': phone || rx }, { 'customer.name': rx }];
  }
  const orders = await Order.find(filter).sort('-createdAt').limit(Math.min(Number(limit), 500));
  res.json(orders);
});

export const adminGetOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new HttpError(404, 'Order not found');
  res.json(order);
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  if (!ORDER_STATUSES.includes(status)) throw new HttpError(400, 'Invalid status');
  const order = await Order.findById(req.params.id);
  if (!order) throw new HttpError(404, 'Order not found');
  if (order.status === status) return res.json(order);

  // Restock when cancelling; re-reserve when un-cancelling
  const stockItems = order.items.filter((i) => !i.preorder);
  if (status === 'cancelled') {
    await Promise.all(stockItems.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stockQty: i.qty, soldCount: -i.qty } })));
  } else if (order.status === 'cancelled') {
    await Promise.all(stockItems.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stockQty: -i.qty, soldCount: i.qty } })));
  }

  order.status = status;
  order.statusHistory.push({ status, note, by: req.admin.name });
  if (status === 'delivered' && order.payment.method === 'cod' && order.payment.status === 'unpaid') {
    order.payment.status = 'paid';
    order.payment.paidAt = new Date();
  }
  await order.save();

  const settings = await getSettings();
  if (settings.sms.enabled && settings.sms.notifyOnStatus) notify(order, statusSMS(order, settings.brand.name)).catch(() => {});
  res.json(order);
});

export const updateOrderPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new HttpError(404, 'Order not found');
  const { status, adminNote } = req.body;
  if (status) {
    if (!['unpaid', 'paid', 'failed', 'refunded'].includes(status)) throw new HttpError(400, 'Invalid payment status');
    order.payment.status = status;
    if (status === 'paid') order.payment.paidAt = new Date();
  }
  if (adminNote !== undefined) order.adminNote = adminNote;
  await order.save();
  res.json(order);
});

export const orderStats = asyncHandler(async (_req, res) => {
  const today = startOfTodayDhaka();
  const since30 = new Date(today.getTime() - 29 * 86400e3);
  const live = { status: { $ne: 'cancelled' } };
  const [byStatus, todayAgg, monthAgg, topDistricts, lowStock, outOfStock, totalProducts] = await Promise.all([
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { ...live, createdAt: { $gte: today } } }, { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: '$total' } } }]),
    Order.aggregate([{ $match: { ...live, createdAt: { $gte: since30 } } }, { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: '$total' } } }]),
    Order.aggregate([
      { $match: { ...live, createdAt: { $gte: since30 } } },
      { $group: { _id: '$customer.district', orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
      { $sort: { orders: -1 } },
      { $limit: 8 },
    ]),
    Product.countDocuments({ isActive: true, stockStatus: 'in_stock', stockQty: { $gt: 0 }, $expr: { $lte: ['$stockQty', '$lowStockThreshold'] } }),
    Product.countDocuments({ isActive: true, $or: [{ stockStatus: 'out_of_stock' }, { stockQty: { $lte: 0 } }] }),
    Product.countDocuments({ isActive: true }),
  ]);
  res.json({
    byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    today: todayAgg[0] || { orders: 0, revenue: 0 },
    last30: monthAgg[0] || { orders: 0, revenue: 0 },
    topDistricts,
    lowStock,
    outOfStock,
    totalProducts,
  });
});
