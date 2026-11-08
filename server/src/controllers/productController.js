import slugify from 'slugify';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { HttpError, asyncHandler, escapeRegex } from '../utils/helpers.js';

const uniqueSlug = async (name, ignoreId) => {
  const base = slugify(name, { lower: true, strict: true }) || 'product';
  let slug = base;
  while (await Product.exists({ slug, ...(ignoreId ? { _id: { $ne: ignoreId } } : {}) })) {
    slug = `${base}-${crypto.randomBytes(2).toString('hex')}`;
  }
  return slug;
};

const seasonOk = [{ isSeasonal: false }, { seasonAvailable: true }];

// ---------- Public ----------
export const listProducts = asyncHandler(async (req, res) => {
  const { q, category, minPrice, maxPrice, availability, sort = 'popular', featured, seasonal, page = 1, limit = 12 } = req.query;
  const filter = { isActive: true };
  const and = [];

  if (category) {
    const cat = mongoose.isValidObjectId(category) ? await Category.findById(category) : await Category.findOne({ slug: category });
    filter.category = cat ? cat._id : null;
  }
  if (q) {
    const rx = new RegExp(escapeRegex(q.trim()), 'i');
    and.push({ $or: [{ name: rx }, { nameBn: rx }, { shortDescription: rx }, { origin: rx }] });
  }
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (availability === 'in_stock') {
    filter.stockStatus = 'in_stock';
    filter.stockQty = { $gt: 0 };
    and.push({ $or: seasonOk });
  }
  if (featured === 'fresh') filter.isTodaysFresh = true;
  if (featured === 'offer') filter.isTodaysOffer = true;
  if (seasonal === 'true') {
    filter.isSeasonal = true;
    filter.seasonAvailable = true;
  }
  if (and.length) filter.$and = and;

  const sorts = {
    popular: { soldCount: -1, ratingAvg: -1 },
    newest: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating: { ratingAvg: -1, ratingCount: -1 },
  };
  const p = Math.max(1, Number(page));
  const l = Math.min(48, Math.max(1, Number(limit)));
  const [items, total] = await Promise.all([
    Product.find(filter).populate('category', 'name nameBn slug icon').sort(sorts[sort] || sorts.popular).skip((p - 1) * l).limit(l),
    Product.countDocuments(filter),
  ]);
  res.json({ items, total, page: p, pages: Math.ceil(total / l) });
});

export const homeProducts = asyncHandler(async (_req, res) => {
  const base = { isActive: true };
  const pop = (q) => q.populate('category', 'name nameBn slug icon');
  const [fresh, offers, seasonal, popular] = await Promise.all([
    pop(Product.find({ ...base, isTodaysFresh: true }).sort('-updatedAt').limit(12)),
    pop(Product.find({ ...base, isTodaysOffer: true }).sort('-updatedAt').limit(12)),
    pop(Product.find({ ...base, isSeasonal: true, seasonAvailable: true }).sort('-soldCount').limit(8)),
    pop(Product.find({ ...base, $or: seasonOk }).sort({ soldCount: -1, ratingAvg: -1 }).limit(8)),
  ]);
  res.json({ fresh, offers, seasonal, popular });
});

export const getProduct = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const query = mongoose.isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
  const product = await Product.findOne({ ...query, isActive: true }).populate('category', 'name nameBn slug icon');
  if (!product) throw new HttpError(404, 'Product not found');
  const related = await Product.find({ category: product.category._id, _id: { $ne: product._id }, isActive: true }).sort('-soldCount').limit(4);
  res.json({ product, related });
});

// ---------- Admin ----------
export const adminListProducts = asyncHandler(async (req, res) => {
  const { q, category } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (q) filter.name = new RegExp(escapeRegex(q), 'i');
  res.json(await Product.find(filter).populate('category', 'name slug icon').sort('-updatedAt'));
});

export const createProduct = asyncHandler(async (req, res) => {
  const slug = await uniqueSlug(req.body.name);
  res.status(201).json(await Product.create({ ...req.body, slug }));
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found');
  const { slug: _s, ratingAvg: _a, ratingCount: _c, soldCount: _sc, ...data } = req.body;
  if (data.name && data.name !== product.name) data.slug = await uniqueSlug(data.name, product._id);
  product.set(data);
  await product.save();
  res.json(product);
});

// Fast daily edits from the inventory table (price / stock / toggles)
const QUICK_FIELDS = ['price', 'comparePrice', 'stockQty', 'stockStatus', 'isTodaysFresh', 'isTodaysOffer', 'seasonAvailable', 'isActive', 'allowPreOrder'];
export const quickUpdateProduct = asyncHandler(async (req, res) => {
  const patch = {};
  for (const k of QUICK_FIELDS) if (req.body[k] !== undefined) patch[k] = req.body[k];
  const product = await Product.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true });
  if (!product) throw new HttpError(404, 'Product not found');
  res.json(product);
});

// End-of-day: clear "Today's Fresh" / "Today's Offer" flags in one click
export const resetDailyFlags = asyncHandler(async (_req, res) => {
  const r = await Product.updateMany({}, { isTodaysFresh: false, isTodaysOffer: false });
  res.json({ cleared: r.modifiedCount });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const p = await Product.findByIdAndDelete(req.params.id);
  if (!p) throw new HttpError(404, 'Product not found');
  res.json({ message: 'Deleted' });
});
