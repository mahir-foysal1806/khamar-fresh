
import 'dotenv/config';
import mongoose from 'mongoose';
import slugify from 'slugify';

import { connectDB } from '../config/db.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Admin from '../models/Admin.js';
import { getSettings, saveSettings } from '../models/AdminSettings.js';

// ==============================
// CATEGORIES
// ==============================

const categories = [
  {
    name: 'Agricultural Products',
    nameBn: 'কৃষি পণ্য',
    slug: 'agricultural-products',
    icon: '🌾',
    sortOrder: 1,
    description: 'Rice, oils, spices, jaggery and more — direct from farms.',
  },
  {
    name: 'Pure Honey',
    nameBn: 'খাঁটি মধু',
    slug: 'pure-honey',
    icon: '🍯',
    sortOrder: 2,
    description: 'Wild and apiary honey, unprocessed and lab-tested.',
  },
  {
    name: 'Seasonal Fruits',
    nameBn: 'মৌসুমি ফল',
    slug: 'seasonal-fruits',
    icon: '🥭',
    sortOrder: 3,
    description: 'Orchard-fresh fruits of the season.',
  },
];

// ==============================
// DEMO PRODUCTS
// ==============================

const products = [
  // HONEY
  {
    cat: 'pure-honey',
    name: 'Sundarban Wild Honey (Khalisha Phool)',
    nameBn: 'সুন্দরবনের খলিশা ফুলের মধু',
    price: 950,
    comparePrice: 1100,
    unit: '1 kg',
    weightKg: 1.3,
    stockQty: 40,
    isPure: true,
    isOrganic: true,
    origin: 'Sundarban',
    sold: 120,
    isTodaysOffer: true,
    offerNote: 'Save ৳150 today',
    shortDescription: 'Dark, aromatic wild honey collected by mawalis from khalisha blossoms.',
  },
  {
    cat: 'pure-honey',
    name: 'Mustard Flower Honey (Shorisha)',
    nameBn: 'সরিষা ফুলের মধু',
    price: 620,
    comparePrice: 700,
    unit: '1 kg',
    weightKg: 1.3,
    stockQty: 60,
    isPure: true,
    origin: 'Faridpur',
    sold: 210,
    seasonLabel: 'Dec – Feb',
    isSeasonal: true,
    shortDescription: 'Light golden, creamy honey — a winter favourite.',
  },
  {
    cat: 'pure-honey',
    name: 'Litchi Flower Honey',
    nameBn: 'লিচু ফুলের মধু',
    price: 780,
    unit: '1 kg',
    weightKg: 1.3,
    stockQty: 8,
    isPure: true,
    origin: 'Dinajpur',
    sold: 64,
    isSeasonal: true,
    seasonLabel: 'March – April',
    shortDescription: 'Delicately sweet with a floral finish.',
  },
  {
    cat: 'pure-honey',
    name: 'Black Seed Honey (Kalojira)',
    nameBn: 'কালোজিরা ফুলের মধু',
    price: 850,
    unit: '500 g',
    weightKg: 0.8,
    stockQty: 25,
    isPure: true,
    isOrganic: true,
    origin: 'Rajshahi',
    sold: 85,
    isTodaysFresh: true,
    shortDescription: 'Bold, slightly spicy honey prized for wellness.',
  },

  // FRUITS
  {
    cat: 'seasonal-fruits',
    name: 'Himsagar Mango (Chapainawabganj)',
    nameBn: 'হিমসাগর আম',
    price: 130,
    comparePrice: 150,
    unit: 'kg',
    weightKg: 1,
    stockQty: 300,
    isSeasonal: true,
    seasonLabel: 'May – July',
    origin: 'Chapainawabganj',
    sold: 540,
    isTodaysFresh: true,
    shortDescription: 'Fibreless, honey-sweet mangoes, formalin-free and tree-ripened.',
  },
  {
    cat: 'seasonal-fruits',
    name: 'Langra Mango',
    nameBn: 'ল্যাংড়া আম',
    price: 120,
    unit: 'kg',
    weightKg: 1,
    stockQty: 6,
    isSeasonal: true,
    seasonLabel: 'June – July',
    origin: 'Rajshahi',
    sold: 330,
    shortDescription: 'The classic sweet-tangy Rajshahi mango.',
  },
  {
    cat: 'seasonal-fruits',
    name: 'Amrapali Mango',
    nameBn: 'আম্রপালি আম',
    price: 110,
    unit: 'kg',
    weightKg: 1,
    stockQty: 0,
    stockStatus: 'coming_soon',
    allowPreOrder: true,
    isSeasonal: true,
    seasonLabel: 'July – August',
    origin: 'Rajshahi',
    sold: 90,
    shortDescription: 'Late-season, deep orange and extra sweet. Pre-order now.',
  },
  {
    cat: 'seasonal-fruits',
    name: 'Dinajpur Litchi (Bombai)',
    nameBn: 'দিনাজপুরের লিচু',
    price: 420,
    comparePrice: 480,
    unit: '100 pcs',
    weightKg: 2.5,
    stockQty: 20,
    isSeasonal: true,
    seasonAvailable: false,
    seasonLabel: 'May – June',
    origin: 'Dinajpur',
    sold: 410,
    shortDescription: 'Juicy Bombai litchi — back next season.',
  },
  {
    cat: 'seasonal-fruits',
    name: 'Sweet Guava (Kazi Peyara)',
    nameBn: 'কাজি পেয়ারা',
    price: 90,
    unit: 'kg',
    weightKg: 1,
    stockQty: 80,
    origin: 'Pirojpur',
    sold: 140,
    isTodaysFresh: true,
    shortDescription: 'Crunchy, large and naturally sweet.',
  },

  // AGRICULTURAL PRODUCTS
  {
    cat: 'agricultural-products',
    name: 'Cold-Pressed Mustard Oil (Ghani)',
    nameBn: 'ঘানিভাঙা সরিষার তেল',
    price: 380,
    comparePrice: 420,
    unit: '1 L',
    weightKg: 1,
    stockQty: 70,
    isPure: true,
    origin: 'Pabna',
    sold: 260,
    isTodaysOffer: true,
    offerNote: '৳40 off',
    shortDescription: 'Traditional wooden ghani-pressed oil with a sharp, authentic aroma.',
  },
  {
    cat: 'agricultural-products',
    name: 'Khejur Gur (Date Palm Jaggery)',
    nameBn: 'খেজুরের গুড়',
    price: 320,
    unit: 'kg',
    weightKg: 1,
    stockQty: 35,
    isOrganic: true,
    isSeasonal: true,
    seasonLabel: 'Dec – Feb',
    origin: 'Jashore',
    sold: 190,
    shortDescription: 'Fresh winter jaggery, rich and caramel-like.',
  },
  {
    cat: 'agricultural-products',
    name: 'Miniket Rice (Premium)',
    nameBn: 'মিনিকেট চাল',
    price: 78,
    unit: 'kg',
    weightKg: 1,
    stockQty: 500,
    origin: 'Dinajpur',
    sold: 380,
    shortDescription: 'Polished, fluffy and uniform grains for everyday meals.',
  },
  {
    cat: 'agricultural-products',
    name: 'Turmeric Powder (Hand-Ground)',
    nameBn: 'হলুদ গুঁড়া',
    price: 260,
    unit: '500 g',
    weightKg: 0.5,
    stockQty: 4,
    isPure: true,
    origin: 'Bogura',
    sold: 95,
    shortDescription: 'Deep-yellow, no colour, no filler.',
  },
];

// ==============================
// SEED FUNCTIONS
// ==============================

async function seedCategories() {
  const categoryMap = {};

  for (const category of categories) {
    const savedCategory = await Category.findOneAndUpdate(
      { slug: category.slug },
      { $set: category },
      { upsert: true, new: true, runValidators: true }
    );

    categoryMap[category.slug] = savedCategory;
  }

  console.log(`Categories ready: ${categories.length}`);

  return categoryMap;
}

async function seedProducts(categoryMap) {
  const reset = process.argv.includes('--reset');
  const productCount = await Product.countDocuments();

  if (productCount > 0 && !reset) {
    console.log(`Products already exist: ${productCount}. Skipped.`);
    return;
  }

  if (reset) {
    await Product.deleteMany({});
  }

  for (const { cat, sold, ...product } of products) {
    const category = categoryMap[cat];

    if (!category) {
      throw new Error(`Category not found: ${cat}`);
    }

    await Product.create({
      ...product,
      slug: slugify(product.name, { lower: true, strict: true }),
      category: category._id,
      soldCount: sold || 0,
    });
  }

  console.log(`Products seeded: ${products.length}`);
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@khamarfresh.com')
    .trim()
    .toLowerCase();

  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Owner';

  if (!password || password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be set and at least 8 characters long.');
  }

  const existingAdmin = await Admin.findOne({ email });

  if (existingAdmin) {
    console.log(`Admin already exists: ${email}`);
    console.log('Existing password was NOT changed.');
    return;
  }

  await Admin.create({
    name,
    email,
    password,
    role: 'admin',
    isActive: true,
  });

  console.log(`Admin created successfully: ${email}`);
}

async function seedSettings() {
  const settings = await getSettings();
  await saveSettings(settings);
  console.log('Settings ready.');
}

// ==============================
// MAIN
// ==============================

async function run() {
  try {
    await connectDB();

    console.log('Starting KhamarFresh seed...');

    const categoryMap = await seedCategories();

    await seedProducts(categoryMap);
    await seedSettings();
    await seedAdmin();

    console.log('KhamarFresh seed completed successfully.');
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});