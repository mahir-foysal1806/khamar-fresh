import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    district: { type: String, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 600 },
    approved: { type: Boolean, default: false, index: true }, // moderated from admin
  },
  { timestamps: true }
);

export default mongoose.model('Review', reviewSchema);
