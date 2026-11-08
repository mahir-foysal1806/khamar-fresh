import mongoose from 'mongoose';

const { Schema } = mongoose;

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    nameBn: { type: String, trim: true },
    slug: { type: String, unique: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    shortDescription: { type: String, trim: true, maxlength: 220 },
    description: { type: String },
    origin: { type: String, trim: true }, // e.g. "Chapainawabganj"
    images: [String],

    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, default: 0, min: 0 }, // original price -> discount tag
    unit: { type: String, default: 'kg' }, // kg, 500g, 1L, dozen, pc
    weightKg: { type: Number, default: 1, min: 0 }, // used for weight-based shipping

    // ---- Daily inventory controls ----
    stockStatus: { type: String, enum: ['in_stock', 'out_of_stock', 'coming_soon'], default: 'in_stock', index: true },
    stockQty: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
    allowPreOrder: { type: Boolean, default: false },

    // ---- Seasonality ----
    isSeasonal: { type: Boolean, default: false },
    seasonAvailable: { type: Boolean, default: true }, // admin toggles when the season starts/ends
    seasonLabel: { type: String, trim: true }, // e.g. "April – August"

    // ---- Trust badges ----
    isOrganic: { type: Boolean, default: false },
    isPure: { type: Boolean, default: false },

    // ---- Homepage daily showcase ----
    isTodaysFresh: { type: Boolean, default: false, index: true },
    isTodaysOffer: { type: Boolean, default: false, index: true },
    offerNote: { type: String, trim: true },

    isActive: { type: Boolean, default: true, index: true },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.index({ name: 'text', nameBn: 'text', shortDescription: 'text' });

productSchema.virtual('discountPercent').get(function () {
  return this.comparePrice > this.price ? Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100) : 0;
});

// Automatic availability derived from admin toggles + inventory counts
productSchema.virtual('availability').get(function () {
  if (this.isSeasonal && !this.seasonAvailable) return 'out_of_season';
  if (this.stockStatus === 'coming_soon') return this.allowPreOrder ? 'preorder' : 'coming_soon';
  if (this.stockStatus === 'out_of_stock' || this.stockQty <= 0) return this.allowPreOrder ? 'preorder' : 'out_of_stock';
  if (this.stockQty <= this.lowStockThreshold) return 'limited';
  return 'in_stock';
});

productSchema.virtual('purchasable').get(function () {
  return ['in_stock', 'limited', 'preorder'].includes(this.availability);
});

export default mongoose.model('Product', productSchema);
