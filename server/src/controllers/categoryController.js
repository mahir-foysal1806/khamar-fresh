import slugify from 'slugify';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { HttpError, asyncHandler } from '../utils/helpers.js';

export const listCategories = asyncHandler(async (_req, res) => {
  const cats = await Category.find({ isActive: true }).sort('sortOrder name').lean();
  res.json(cats);
});

export const createCategory = asyncHandler(async (req, res) => {
  const slug = slugify(req.body.slug || req.body.name || '', { lower: true, strict: true });
  res.status(201).json(await Category.create({ ...req.body, slug }));
});

export const updateCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!cat) throw new HttpError(404, 'Category not found');
  res.json(cat);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  if (await Product.exists({ category: req.params.id })) throw new HttpError(400, 'Move or delete the products in this category first');
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});
