import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nameBn: { type: String, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    icon: { type: String, default: '🌾' },
    image: String,
    description: String,
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Category', categorySchema);
