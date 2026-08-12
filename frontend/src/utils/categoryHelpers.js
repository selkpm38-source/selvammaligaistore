import { categories } from '../data/mockProducts.js';

const categoryById = new Map(categories.map((category) => [category.id, category]));
const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));

export function getCategoryName(categoryValue) {
  if (!categoryValue) return '';
  const category = categoryById.get(categoryValue) || categoryBySlug.get(categoryValue);
  return category?.name ?? categoryValue;
}

export function normalizeCategoryId(categoryValue) {
  if (!categoryValue) return '';
  if (categoryById.has(categoryValue)) return categoryValue;
  const normalized = categoryBySlug.get(categoryValue);
  return normalized ?? categoryValue;
}
