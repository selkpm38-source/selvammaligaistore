'use strict';

const { mongoose } = require('../config/db');

const productSchema = new mongoose.Schema(
  {
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    sku: { type: String, required: true, unique: true },
    unit: { type: String, required: true, default: 'pcs' },
    variants: [{
      label: { type: String, trim: true },
      mrp: { type: Number, default: 0 },
      sellingPrice: { type: Number, default: 0 },
      discountPercentage: { type: Number, default: 0 },
    }],
    mrp: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    discountPercentage: { type: Number, default: 0 },
    stockStatus: {
      type: String,
      enum: ['in_stock', 'low_stock', 'out_of_stock'],
      default: 'in_stock',
    },
    isFeatured: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    status: { type: String, enum: ['draft', 'active', 'inactive'], default: 'active' },
    avgRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    image: { type: String, default: '🍚' },
  },
  { timestamps: true }
);

productSchema.index({ status: 1 });
productSchema.index({ category: 1 });
productSchema.index({ name: 'text', slug: 'text' });

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
