'use strict';

const bcrypt = require('bcryptjs');

const db = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

async function ensureOwnerAccount() {
  const ownerEmail = (process.env.OWNER_EMAIL || 'owner@selvammaligai.store').toLowerCase();
  const ownerPassword = process.env.OWNER_PASSWORD || 'Owner@1234';
  const passwordHash = await bcrypt.hash(ownerPassword, 10);

  await User.UserModel.updateOne(
    { email: ownerEmail },
    {
      $set: {
        name: 'Store Owner',
        passwordHash,
        role: 'owner',
        status: 'active',
      },
    },
    { upsert: true }
  );
}

// Keep these names/slugs identical to CATEGORY_NAMES in productController.js
// so a fresh product added later via the owner panel reuses the same rows
// instead of creating duplicate categories.
const CATEGORY_NAMES = {
  c1: 'Rice & Grains',
  c2: 'Dals & Pulses',
  c3: 'Spices & Masalas',
  c4: 'Oils & Ghee',
  c5: 'Snacks',
  c6: 'Dairy',
  c7: 'Vegetables',
  c8: 'Beverages',
  c9: 'Stationery',
  c10: 'Tea & Coffee',
  c11: 'Toilet Cleaner',
  c12: 'Pooja Products',
  c13: 'Fancy Products',
  c14: 'Biscuits',
  c15: 'Home Cleaner',
  c16: 'Napkins',
  c17: 'Detergent Oil',
  c18: 'Soap',
  c19: 'Shampoo',
  c20: 'Paste & Brush',
  c21: 'Maavu',
};

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Same starter catalog as frontend/src/data/mockProducts.js, so the
// storefront isn't empty the first time the frontend talks to a real
// (freshly created) database instead of its built-in mock data.
const SEED_PRODUCTS = [
  { name: 'Ponni Boiled Rice', category: 'c1', image: '🍚', mrp: 620, sellingPrice: 549, unit: '10 kg', rating: 4.6, ratingCount: 128, isFeatured: true, isBestseller: true },
  { name: 'Toor Dal (Split Pigeon Pea)', category: 'c2', image: '🫘', mrp: 165, sellingPrice: 139, unit: '1 kg', rating: 4.4, ratingCount: 128, isFeatured: true },
  { name: 'Sambar Powder', category: 'c3', image: '🌶️', mrp: 95, sellingPrice: 79, unit: '200 g', rating: 4.7, ratingCount: 128, isTrending: true },
  { name: 'Cold-Pressed Groundnut Oil', category: 'c4', image: '🫙', mrp: 340, sellingPrice: 289, unit: '1 L', rating: 4.5, ratingCount: 128, isFeatured: true },
  { name: 'Murukku (Handmade)', category: 'c5', image: '🥨', mrp: 90, sellingPrice: 75, unit: '250 g', rating: 4.2, ratingCount: 128, isNewArrival: true },
  { name: 'Fresh Cow Ghee', category: 'c6', image: '🧈', mrp: 620, sellingPrice: 549, unit: '500 ml', rating: 4.8, ratingCount: 128, isBestseller: true },
  { name: 'Curry Leaves (Fresh)', category: 'c7', image: '🌿', mrp: 20, sellingPrice: 15, unit: '100 g', rating: 4.1, ratingCount: 128 },
  { name: 'Filter Coffee Powder', category: 'c8', image: '☕', mrp: 210, sellingPrice: 179, unit: '500 g', rating: 4.9, ratingCount: 128, isTrending: true, isBestseller: true },
  { name: 'Idli / Dosa Rice', category: 'c1', image: '🍚', mrp: 480, sellingPrice: 419, unit: '10 kg', rating: 4.3, ratingCount: 128 },
  { name: 'Urad Dal (Split)', category: 'c2', image: '🫘', mrp: 145, sellingPrice: 129, unit: '1 kg', rating: 4.2, ratingCount: 128, isNewArrival: true },
  { name: 'Turmeric Powder', category: 'c3', image: '🟡', mrp: 60, sellingPrice: 49, unit: '200 g', rating: 4.6, ratingCount: 128, isFeatured: true },
  { name: 'Banana Chips', category: 'c5', image: '🍌', mrp: 110, sellingPrice: 89, unit: '200 g', rating: 4.4, ratingCount: 128, isTrending: true },
];

async function ensureCategory(code) {
  const name = CATEGORY_NAMES[code];
  const slug = slugify(name);

  const existing = await Category.findOne({ slug });
  if (existing) return existing._id;

  const created = await Category.create({ name, slug, isActive: true, displayOrder: 0 });
  return created._id;
}

async function ensureSeedProducts() {
  const count = await Product.countDocuments();
  if (count > 0) return; // never overwrite real data — only seeds an empty collection

  for (const item of SEED_PRODUCTS) {
    const categoryId = await ensureCategory(item.category);
    const slug = slugify(item.name);
    const discountPercentage = Math.round(((item.mrp - item.sellingPrice) / item.mrp) * 100);

    await Product.updateOne(
      { slug },
      {
        $setOnInsert: {
          category: categoryId,
          name: item.name,
          slug,
          sku: `SKU-${slug.slice(0, 8).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          unit: item.unit,
          mrp: item.mrp,
          sellingPrice: item.sellingPrice,
          discountPercentage,
          stockStatus: 'in_stock',
          isFeatured: !!item.isFeatured,
          isTrending: !!item.isTrending,
          isBestseller: !!item.isBestseller,
          isNewArrival: !!item.isNewArrival,
          status: 'active',
          avgRating: item.rating,
          ratingCount: item.ratingCount,
          image: item.image,
        },
      },
      { upsert: true }
    );
  }
}

async function initializeDatabase() {
  await db.connect();
  await ensureOwnerAccount();
  await ensureSeedProducts();
}

module.exports = { initializeDatabase };
