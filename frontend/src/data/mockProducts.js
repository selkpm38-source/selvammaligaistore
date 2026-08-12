/**
 * Placeholder catalog data. Phase 2 replaces this with real calls to
 * GET /api/products (category, discount, featured, etc. all come from the
 * `products` table already defined in the Phase 1 schema). Shape here
 * matches that table 1:1 so swapping the data source later is a no-op.
 */

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const categories = [
  { id: 'c1', slug: 'rice-grains', name: 'Rice & Grains', icon: '🌾' },
  { id: 'c2', slug: 'dals-pulses', name: 'Dals & Pulses', icon: '🫘' },
  { id: 'c3', slug: 'spices-masalas', name: 'Spices & Masalas', icon: '🌶️' },
  { id: 'c4', slug: 'oils-ghee', name: 'Oils & Ghee', icon: '🫙' },
  { id: 'c9', slug: 'stationery', name: 'Stationery', icon: '✏️' },
  { id: 'c10', slug: 'tea-coffee', name: 'Tea & Coffee', icon: '☕' },
  { id: 'c11', slug: 'toilet-cleaner', name: 'Toilet Cleaner', icon: '🧼' },
  { id: 'c12', slug: 'pooja-products', name: 'Pooja Products', icon: '🕉️' },
  { id: 'c13', slug: 'fancy-products', name: 'Fancy Products', icon: '🎁' },
  { id: 'c15', slug: 'home-cleaner', name: 'Home Cleaner', icon: '🧽' },
  { id: 'c16', slug: 'napkins', name: 'Napkins', icon: '🧻' },
  { id: 'c17', slug: 'detergent-liquid-powder', name: 'Detergent Liquid & Powder', icon: '🧼' },
  { id: 'c18', slug: 'soap', name: 'Soap', icon: '🧼' }, // Original c18
  { id: 'c19', slug: 'shampoo', name: 'Shampoo', icon: '🧴' }, // Original c19
  { id: 'c20', slug: 'paste-brush', name: 'Paste & Brush', icon: '🪥' }, // Original c20
  { id: 'c21', slug: 'maavu-noodles', name: 'Maavu & Noodles', icon: '🍜' },
];

function product(overrides) {
  const defaultDiscount = Math.round(((overrides.mrp - overrides.sellingPrice) / overrides.mrp) * 100);
  const base = {
    id: overrides.id,
    name: overrides.name,
    category: overrides.category,
    image: overrides.image,
    mrp: overrides.mrp,
    sellingPrice: overrides.sellingPrice,
    discountPercentage: overrides.discountPercentage ?? defaultDiscount,
    unit: overrides.unit,
    rating: overrides.rating ?? 4.3,
    ratingCount: overrides.ratingCount ?? 128,
    stockStatus: overrides.stockStatus ?? 'in_stock',
    isFeatured: !!overrides.isFeatured,
    isTrending: !!overrides.isTrending,
    isBestseller: !!overrides.isBestseller,
    isNewArrival: !!overrides.isNewArrival,
  };

  if (Array.isArray(overrides.variants) && overrides.variants.length > 0) {
    return {
      ...base,
      variants: overrides.variants.map((variant) => ({
        label: variant.label,
        mrp: variant.mrp,
        sellingPrice: variant.sellingPrice,
        discountPercentage:
          variant.discountPercentage ?? Math.round(((variant.mrp - variant.sellingPrice) / variant.mrp) * 100),
      })),
    };
  }

  return base;
}

export const products = [
  product({
    id: 'p1',
    name: 'Ponni Boiled Rice',
    category: 'rice-grains',
    image: '🍚',
    mrp: 620,
    sellingPrice: 549,
    unit: '10 kg',
    isFeatured: true,
    isBestseller: true,
    rating: 4.6,
    variants: [
      { label: '5 kg', mrp: 320, sellingPrice: 289 },
      { label: '10 kg', mrp: 620, sellingPrice: 549 },
    ],
  }),
  product({ id: 'p2', name: 'Toor Dal (Split Pigeon Pea)', category: 'dals-pulses', image: '🫘', mrp: 165, sellingPrice: 139, unit: '1 kg', isFeatured: true, rating: 4.4 }),
  product({ id: 'p3', name: 'Sambar Powder', category: 'spices-masalas', image: '🌶️', mrp: 95, sellingPrice: 79, unit: '200 g', isTrending: true, rating: 4.7 }),
  product({ id: 'p4', name: 'Cold-Pressed Groundnut Oil', category: 'oils-ghee', image: '🫙', mrp: 340, sellingPrice: 289, unit: '1 L', isFeatured: true, rating: 4.5 }),
  product({ id: 'p9', name: 'Idli / Dosa Rice', category: 'rice-grains', image: '🍚', mrp: 480, sellingPrice: 419, unit: '10 kg', rating: 4.3 }),
  product({ id: 'p10', name: 'Urad Dal (Split)', category: 'dals-pulses', image: '🫘', mrp: 145, sellingPrice: 129, unit: '1 kg', isNewArrival: true, rating: 4.2 }),
  product({ id: 'p11', name: 'Turmeric Powder', category: 'spices-masalas', image: '🟡', mrp: 60, sellingPrice: 49, unit: '200 g', isFeatured: true, rating: 4.6 }),
];

export const dealsOfToday = products.filter((p) => p.discountPercentage >= 12);
export const featuredProducts = products.filter((p) => p.isFeatured);
export const trendingProducts = products.filter((p) => p.isTrending);
export const bestSellers = products.filter((p) => p.isBestseller);
export const newArrivals = products.filter((p) => p.isNewArrival);
export const recommended = products.slice(2, 8);

export const reviews = [
  { id: 'r1', name: 'Meena R.', rating: 5, comment: 'Rice quality is exactly like the shop near my hometown. Delivery was quick too.' },
  { id: 'r2', name: 'Arun K.', rating: 5, comment: 'Filter coffee powder is fresh and aromatic — reorder every month now.' },
  { id: 'r3', name: 'Priya S.', rating: 4, comment: 'Good packaging for the murukku, arrived without breaking. Will order again.' },
  { id: 'r4', name: 'Karthik V.', rating: 5, comment: 'Ghee tastes homemade. Prices are fair compared to the supermarket.' },
];

export const storeStats = [
  { label: 'Happy Customers', value: 42000, suffix: '+' },
  { label: 'Products Stocked', value: 1800, suffix: '+' },
  { label: 'Towns Served', value: 24, suffix: '' },
  { label: 'Years Serving You', value: 43, suffix: '' },
];
