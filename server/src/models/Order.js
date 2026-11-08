import mongoose from 'mongoose';

const { Schema } = mongoose;

export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const itemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    nameBn: String,
    image: String,
    unit: String,
    price: Number, // snapshot at order time
    qty: Number,
    weightKg: Number,
    preorder: { type: Boolean, default: false },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderId: { type: String, unique: true, index: true },
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, index: true },
      address: { type: String, required: true, trim: true },
      district: { type: String, required: true, index: true },
      upazila: { type: String, trim: true },
      notes: { type: String, trim: true },
    },
    items: { type: [itemSchema], validate: (v) => v.length > 0 },
    subtotal: Number,
    shippingCharge: Number,
    discount: { type: Number, default: 0 },
    total: Number,
    totalWeightKg: Number,
    deliveryZone: { type: String, enum: ['inside_dhaka', 'outside_dhaka'] },

    payment: {
      method: { type: String, enum: ['cod', 'bkash', 'nagad', 'sslcommerz'], default: 'cod' },
      status: { type: String, enum: ['unpaid', 'paid', 'failed', 'refunded'], default: 'unpaid' },
      transactionId: String, // customer-entered TrxID for manual bKash/Nagad
      senderNumber: String,
      gatewayRef: String,
      paidAt: Date,
    },

    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    statusHistory: [{ status: String, note: String, by: String, at: { type: Date, default: Date.now }, _id: false }],
    adminNote: String,
    source: { type: String, default: 'website' },
    smsLog: [{ to: String, message: String, ok: Boolean, provider: String, response: String, at: { type: Date, default: Date.now }, _id: false }],
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

export default mongoose.model('Order', orderSchema);
