import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { categories, products as rawProducts } from '../data/mockProducts.js';
import apiClient from '../api/axiosClient.js';

const ProductsContext = createContext(null);
const STORAGE_KEY = 'selvam-products';

const normalizeProductCategory = (product) => {
  const category = categories.find(
    (c) => c.id === product.category || c.slug === product.category || c.name === product.category
  );
  return {
    ...product,
    category: category?.slug || product.category,
  };
};

const loadInitialProducts = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeProductCategory);
      }
    }
  } catch {
    // ignore invalid JSON
  }
  return rawProducts.map(normalizeProductCategory);
};

const persistProducts = (productsList) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(productsList));
  } catch (err) {
    console.warn('[ProductsContext] Could not persist products locally.', err);
  }
};

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(loadInitialProducts);
  const [apiAvailable, setApiAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiClient.get('/products')
      .then(({ data }) => {
        if (!cancelled && Array.isArray(data.data)) {
          setProducts(data.data.map(normalizeProductCategory));
          setApiAvailable(true);
        }
      })
      .catch((err) => {
        // Left visible on purpose: if products aren't showing up, this is
        // the first place to look. A failure here means the frontend could
        // not reach the backend (wrong API base URL, backend not running,
        // CORS), so it's falling back to the local/mock catalog only.
        console.warn(
          '[ProductsContext] Could not load products from the backend API — falling back to local data. ' +
          'Check that the backend is running and reachable, and that VITE_API_BASE_URL / CLIENT_URL are set correctly.',
          err
        );
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (apiAvailable) return;
    persistProducts(products);
  }, [products, apiAvailable]);

  const updateProduct = async (updatedProduct) => {
    const productId = updatedProduct.id || updatedProduct._id;
    const categorySlug = categories.find((c) => c.id === updatedProduct.category)?.slug || updatedProduct.category;
    const payload = {
      name: updatedProduct.name,
      category: categorySlug,
      image: updatedProduct.image,
      mrp: Number(updatedProduct.mrp),
      sellingPrice: Number(updatedProduct.sellingPrice),
      discountPercentage: updatedProduct.discountPercentage ?? null,
      unit: updatedProduct.unit,
      stockStatus: updatedProduct.stockStatus || 'in_stock',
      variants: Array.isArray(updatedProduct.variants)
        ? updatedProduct.variants.map((variant) => ({
            label: variant.label,
            mrp: Number(variant.mrp || 0),
            sellingPrice: Number(variant.sellingPrice || 0),
            discountPercentage: variant.discountPercentage ?? null,
          }))
        : [],
    };

    if (apiAvailable) {
      try {
        const { data } = await apiClient.put(`/products/${productId}`, payload);
        const nextProduct = data.data;
        setProducts((prev) => {
          const next = prev.map((product) => (product.id === productId ? nextProduct : product));
          persistProducts(next);
          return next;
        });
        return nextProduct;
      } catch (err) {
        console.error('[ProductsContext] Product update failed.', err);
        throw err;
      }
    }

    setProducts((prev) => {
      const next = prev.map((product) =>
        product.id === productId ? { ...product, ...updatedProduct, ...payload, category: categorySlug } : product
      );
      persistProducts(next);
      return next;
    });
    return { ...updatedProduct, ...payload, category: categorySlug };
  };

  const addProduct = async (newProduct) => {
    const categorySlug = categories.find((c) => c.id === newProduct.category)?.slug || newProduct.category;
    const payload = {
      name: newProduct.name,
      category: categorySlug,
      image: newProduct.image,
      mrp: Number(newProduct.mrp),
      sellingPrice: Number(newProduct.sellingPrice),
      discountPercentage: newProduct.discountPercentage ?? null,
      unit: newProduct.unit,
      stockStatus: newProduct.stockStatus || 'in_stock',
      variants: Array.isArray(newProduct.variants)
        ? newProduct.variants.map((variant) => ({
            label: variant.label,
            mrp: Number(variant.mrp || 0),
            sellingPrice: Number(variant.sellingPrice || 0),
            discountPercentage: variant.discountPercentage ?? null,
          }))
        : [],
    };

    if (apiAvailable) {
      try {
        const { data } = await apiClient.post('/products', payload);
        const nextProduct = data.data;
        setProducts((prev) => {
          const next = [nextProduct, ...prev];
          persistProducts(next);
          return next;
        });
        return nextProduct.id;
      } catch (err) {
        console.error('[ProductsContext] Product creation failed.', err);
        throw err;
      }
    }

    const id = `p${Date.now()}`;
    const product = {
      id,
      rating: 4.0,
      ratingCount: 0,
      discountPercentage: Math.round(((newProduct.mrp - newProduct.sellingPrice) / newProduct.mrp) * 100),
      isFeatured: false,
      isTrending: false,
      isBestseller: false,
      isNewArrival: false,
      ...newProduct,
      category: categorySlug,
    };
    setProducts((prev) => {
      const next = [product, ...prev];
      persistProducts(next);
      return next;
    });
    return id;
  };

  const deleteProduct = async (productId) => {
    if (apiAvailable) await apiClient.delete(`/products/${productId}`);
    setProducts((prev) => prev.filter((product) => product.id !== productId));
  };

  const dealsOfToday = useMemo(
    () => products.filter((product) => product.discountPercentage >= 12),
    [products]
  );
  const featuredProducts = useMemo(() => products.filter((product) => product.isFeatured), [products]);
  const trendingProducts = useMemo(() => products.filter((product) => product.isTrending), [products]);
  const bestSellers = useMemo(() => products.filter((product) => product.isBestseller), [products]);
  const newArrivals = useMemo(() => products.filter((product) => product.isNewArrival), [products]);
  const recommended = useMemo(() => products.slice(2, 8), [products]);

  return (
    <ProductsContext.Provider
      value={{ products, dealsOfToday, featuredProducts, trendingProducts, bestSellers, newArrivals, recommended, updateProduct, addProduct, deleteProduct }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used within ProductsProvider');
  return ctx;
}
