import { categories } from '../data/mockProducts.js';

function getCategoryName(categoryValue) {
  const category = categories.find((c) => c.id === categoryValue || c.slug === categoryValue);
  return category?.name || categoryValue || '';
}

export function getMatchingProducts(products, query) {
  const trimmed = query.trim().toLowerCase();

  if (!trimmed) return [];

  return products.filter((product) => {
    const variantLabels = Array.isArray(product.variants)
      ? product.variants.map((variant) => variant.label).filter(Boolean)
      : [];

    const haystack = [
      product.name,
      getCategoryName(product.category),
      product.category,
      product.unit,
      ...variantLabels,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(trimmed);
  });
}
