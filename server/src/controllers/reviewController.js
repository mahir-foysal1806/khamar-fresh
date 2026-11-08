import Review from '../models/Review.js';
import Product from '../models/Product.js';
import { HttpError, asyncHandler } from '../utils/helpers.js';

async function recalc(productId) {
  const [agg] = await Review.aggregate([
    { $match: { product: productId, approved: true } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Product.updateOne({ _id: productId }, { ratingAvg: agg ? Math.round(agg.avg * 10) / 10 : 0, ratingCount: agg?.count || 0 });
}

export const productReviews = asyncHandler(async (req, res) => {
  res.json(await Review.find({ product: req.params.productId, approved: true }).sort('-createdAt').limit(50));
});

export const createReview = asyncHandler(async (req, res) => {
  const { product, name, rating, comment, district } = req.body;
  if (!(await Product.exists({ _id: product }))) throw new HttpError(404, 'Product not found');
  await Review.create({ product, name, rating: Number(rating), comment, district });
  res.status(201).json({ message: 'Thank you! Your review will appear after approval.' });
});

export const adminListReviews = asyncHandler(async (req, res) => {
  const filter = req.query.approved === undefined ? {} : { approved: req.query.approved === 'true' };
  res.json(await Review.find(filter).populate('product', 'name slug').sort('-createdAt').limit(200));
});

export const setApproval = asyncHandler(async (req, res) => {
  const r = await Review.findByIdAndUpdate(req.params.id, { approved: !!req.body.approved }, { new: true });
  if (!r) throw new HttpError(404, 'Review not found');
  await recalc(r.product);
  res.json(r);
});

export const deleteReview = asyncHandler(async (req, res) => {
  const r = await Review.findByIdAndDelete(req.params.id);
  if (r) await recalc(r.product);
  res.json({ message: 'Deleted' });
});
