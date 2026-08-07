import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HeroSlider from '../components/HeroSlider.jsx';
import CategoryChips from '../components/CategoryChips.jsx';
import ProductRail from '../components/ProductRail.jsx';
import StoreStats from '../components/StoreStats.jsx';
import { WhyChooseUs, AboutStore } from '../components/StoreInfo.jsx';
import { useProducts } from '../context/ProductsContext.jsx';
import { categories, storeStats } from '../data/mockProducts.js';
import { getMatchingProducts } from '../utils/productSearch.js';

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const { dealsOfToday, featuredProducts, trendingProducts, bestSellers, newArrivals, recommended, products } = useProducts();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search')?.trim() ?? '';
  const selectedProductId = searchParams.get('selected');
  const selectedCategory = searchParams.get('category') ?? '';

  const filteredByCategory = useMemo(() => {
    if (!selectedCategory) return products;

    const categorySlug = categories.find((c) => c.id === selectedCategory)?.slug;
    if (!categorySlug) return products;

    return products.filter((product) => product.category === categorySlug);
  }, [products, selectedCategory]);

  const showSearchResults = Boolean(searchQuery);
  const searchResults = useMemo(
    () => (showSearchResults ? getMatchingProducts(filteredByCategory, searchQuery) : []),
    [filteredByCategory, searchQuery, showSearchResults]
  );

  const categoryName = categories.find((c) => c.id === selectedCategory)?.name;

  return (
    <main>
      <HeroSlider />
      <CategoryChips categories={categories} selectedCategory={selectedCategory} onCategorySelect={(categoryId) => {
        const params = new URLSearchParams(location.search);

        if (categoryId === selectedCategory) {
          params.delete('category');
          params.delete('search');
          params.delete('selected');
        } else {
          params.set('category', categoryId);
        }

        navigate({ pathname: '/', search: params.toString() ? `?${params.toString()}` : '' });
      }} />

      {(showSearchResults || selectedCategory) ? (
        (showSearchResults ? searchResults : filteredByCategory).length > 0 ? (
          <ProductRail
            title={showSearchResults ? `Search results${categoryName ? ` in ${categoryName}` : ''}` : `Category: ${categoryName}`}
            subtitle={showSearchResults ? 'Tap any match to jump to that product card.' : 'Showing products only from this category.'}
            products={showSearchResults ? searchResults : filteredByCategory}
            selectedProductId={selectedProductId}
          />
        ) : (
          <section className="px-3 xs:px-4 md:px-6 py-6 md:py-8">
            <div className="rounded-2xl border border-dashed border-leaf-200 bg-rice-50 p-4 text-sm text-ink-600 dark:border-leaf-400/20 dark:bg-leaf-700/40 dark:text-rice-100">
              No products found {showSearchResults ? `for “${searchQuery}”` : ''}{categoryName ? ` in ${categoryName}` : ''}. Try another name or category.
            </div>
          </section>
        )
      ) : (
        <>
          <ProductRail
            title="Today's Deals"
            subtitle="Discounted the moment we add them — while stock lasts"
            products={dealsOfToday}
            selectedProductId={selectedProductId}
          />
          <ProductRail title="Featured Products" products={featuredProducts} selectedProductId={selectedProductId} />
          <ProductRail title="Trending Now" products={trendingProducts} selectedProductId={selectedProductId} />
          <ProductRail title="Top Selling" products={bestSellers} selectedProductId={selectedProductId} />
          <ProductRail title="Recently Added" products={newArrivals} selectedProductId={selectedProductId} />

          <StoreStats stats={storeStats} />

          <ProductRail title="Recommended For You" subtitle="Based on what customers like you buy" products={recommended} selectedProductId={selectedProductId} />

          <WhyChooseUs />
          <AboutStore />
        </>
      )}
    </main>
  );
}
