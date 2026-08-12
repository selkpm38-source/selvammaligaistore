'use strict';

const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { AppError } = require('../middlewares/errorHandler');

const CATEGORY_NAMES = {
  c1: 'Rice & Grains',
  c2: 'Dals & Pulses',
  c3: 'Spices & Masalas',
  c4: 'Oils & Ghee',
  c9: 'Stationery',
  c10: 'Tea & Coffee',
  c11: 'Toilet Cleaner',
  c12: 'Pooja Products',
  c13: 'Fancy Products',
  c15: 'Home Cleaner',
  c16: 'Napkins',
  c17: 'Detergent Liquid & Powder',
  c18: 'Soap', // Original c18
  c19: 'Shampoo', // Original c19
  c20: 'Paste & Brush', // Original c20
  c21: 'Maavu & Noodles',
};

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeVariants(variants) {
  if (!Array.isArray(variants)) return [];

  return variants
    .filter((variant) => variant && (variant.label || variant.mrp || variant.sellingPrice))
    .map((variant) => ({
      label: String(variant.label || '').trim(),
      mrp: Number(variant.mrp || 0),
      sellingPrice: Number(variant.sellingPrice || 0),
      discountPercentage: Number(
        variant.discountPercentage ?? Math.max(0, Math.round(((Number(variant.mrp || 0) - Number(variant.sellingPrice || 0)) / Math.max(Number(variant.mrp || 0), 1)) * 100))
      ),
    }))
    .filter((variant) => variant.label);
}

function toProduct(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;

  return {
    id: obj._id.toString(),
    name: obj.name,
    category: (obj.category && obj.category.slug) || obj.category,
    image: obj.image || '🍚',
    mrp: Number(obj.mrp),
    sellingPrice: Number(obj.sellingPrice),
    discountPercentage: Number(obj.discountPercentage),
    unit: obj.unit,
    variants: (obj.variants || []).map((variant) => ({
      label: variant.label,
      mrp: Number(variant.mrp || 0),
      sellingPrice: Number(variant.sellingPrice || 0),
      discountPercentage: Number(variant.discountPercentage || 0),
    })),
    stockStatus: obj.stockStatus,
    rating: Number(obj.avgRating),
    ratingCount: obj.ratingCount,
    isFeatured: Boolean(obj.isFeatured),
    isTrending: Boolean(obj.isTrending),
    isBestseller: Boolean(obj.isBestseller),
    isNewArrival: Boolean(obj.isNewArrival),
  };
}

async function resolveCategory(category) {
  const name = CATEGORY_NAMES[category] || category || 'General';
  const slug = slugify(name);

  const existing = await Category.findOne({ slug });
  if (existing) return existing._id;

  const created = await Category.create({ name, slug, isActive: true, displayOrder: 0 });
  return created._id;
}

function productValues(body) {
  const mrp = Number(body.mrp);
  const sellingPrice = Number(body.sellingPrice);

  if (!body.name || !body.unit || !Number.isFinite(mrp) || !Number.isFinite(sellingPrice)) {
    throw new AppError('Name, unit, MRP, and selling price are required.', 422);
  }

  const discountPercentage =
    body.discountPercentage == null
      ? Math.max(0, Math.round(((mrp - sellingPrice) / mrp) * 100))
      : Number(body.discountPercentage);

  return { mrp, sellingPrice, discountPercentage };
}

async function list(req, res, next) {
  try {
    const docs = await Product.find({ status: 'active' })
      .populate('category', 'slug')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: docs.map(toProduct),
    });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { mrp, sellingPrice, discountPercentage } = productValues(req.body);
    const variants = normalizeVariants(req.body.variants);

    const categoryId = await resolveCategory(req.body.category);
    const rawId = new mongoose.Types.ObjectId();
    const slug = `${slugify(req.body.name)}-${rawId.toString().slice(-8)}`;

    const doc = await Product.create({
      _id: rawId,
      category: categoryId,
      name: req.body.name.trim(),
      slug,
      sku: `SKU-${rawId.toString().slice(-8).toUpperCase()}`,
      unit: req.body.unit,
      variants,
      mrp,
      sellingPrice,
      discountPercentage,
      stockStatus: req.body.stockStatus || 'in_stock',
      status: 'active',
      ...(req.body.image ? { image: req.body.image } : {}),
    });

    const populated = await doc.populate('category', 'slug');

    res.status(201).json({
      success: true,
      data: toProduct(populated),
    });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { mrp, sellingPrice, discountPercentage } = productValues(req.body);
    const variants = normalizeVariants(req.body.variants);
    const categoryId = await resolveCategory(req.body.category);

    const doc = await Product.findByIdAndUpdate(
      req.params.id,
      {
        category: categoryId,
        name: req.body.name.trim(),
        unit: req.body.unit,
        variants,
        mrp,
        sellingPrice,
        discountPercentage,
        stockStatus: req.body.stockStatus || 'in_stock',
        ...(req.body.image ? { image: req.body.image } : {}),
      },
      { new: true }
    ).populate('category', 'slug');

    if (!doc) {
      throw new AppError('Product not found.', 404);
    }

    res.json({
      success: true,
      data: toProduct(doc),
    });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const doc = await Product.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );

    if (!doc) {
      throw new AppError('Product not found.', 404);
    }

    res.json({
      success: true,
      message: 'Product deleted.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  create,
  update,
  remove,
};
