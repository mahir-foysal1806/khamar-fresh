import mongoose from 'mongoose';

// Optional customer accounts. Checkout is guest-first, so this is ready for
// future "My Orders" / saved addresses without any schema change.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, lowercase: true, trim: true, sparse: true },
    password: { type: String, select: false },
    addresses: [
      {
        label: String,
        address: String,
        district: String,
        upazila: String,
        isDefault: { type: Boolean, default: false },
      },
    ],
    totalOrders: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
