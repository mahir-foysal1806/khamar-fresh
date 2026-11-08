import Order from '../models/Order.js';
import { gateways } from '../utils/payments.js';
import { HttpError, asyncHandler, normalizePhone } from '../utils/helpers.js';

const client = () => process.env.CLIENT_URL || 'http://localhost:5173';

// Customer starts an online payment for an order they just placed
export const initPayment = asyncHandler(async (req, res) => {
  const { gateway } = req.params;
  const fn = gateways[`${gateway}_init`];
  if (!fn) throw new HttpError(400, 'Unknown payment gateway');
  const order = await Order.findOne({ orderId: req.body.orderId, 'customer.phone': normalizePhone(req.body.phone) });
  if (!order) throw new HttpError(404, 'Order not found');
  if (order.payment.status === 'paid') throw new HttpError(400, 'Order is already paid');
  res.json(await fn(order));
});

// SSLCommerz posts back here (success / fail / cancel / ipn)
export const sslcommerzCallback = (outcome) =>
  asyncHandler(async (req, res) => {
    const body = { ...req.query, ...req.body };
    const orderId = body.tran_id;
    const order = orderId && (await Order.findOne({ orderId }));
    if (!order) return res.redirect(`${client()}/track`);

    if (outcome === 'success' || outcome === 'ipn') {
      const v = await gateways.sslcommerz_validate(body.val_id);
      const ok = ['VALID', 'VALIDATED'].includes(v.status) && Number(v.amount) >= order.total - 0.5 && v.tran_id === order.orderId;
      if (ok && order.payment.status !== 'paid') {
        order.payment.status = 'paid';
        order.payment.paidAt = new Date();
        order.payment.gatewayRef = body.val_id;
        order.payment.transactionId = v.bank_tran_id;
        await order.save();
      }
      if (outcome === 'ipn') return res.json({ ok });
      return res.redirect(`${client()}/order-success/${order.orderId}?paid=${ok ? 1 : 0}`);
    }
    if (order.payment.status === 'unpaid') {
      order.payment.status = 'failed';
      await order.save();
    }
    res.redirect(`${client()}/order-success/${order.orderId}?paid=0`);
  });
