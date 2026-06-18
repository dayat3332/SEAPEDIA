import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HiMagnifyingGlass, HiOutlineShoppingBag } from 'react-icons/hi2';
import { productService } from '../../services';
import ProductCard from '../../components/shared/ProductCard';
import { Input, Spinner, Button } from '../../components/ui';

// React Bits animation components
import { BlurText, ScrollReveal, FadeContent } from '../../components/reactbits';

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const page = parseInt(searchParams.get('page'), 10) || 1;

  useEffect(() => {
    loadProducts();
  }, [page, searchParams.get('search')]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await productService.getProducts({
        page,
        limit: 12,
        search: searchParams.get('search') || '',
      });
      setProducts(res.data.data.products);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams(search ? { search, page: 1 } : { page: 1 });
  };

  const goToPage = (p) => {
    const params = {};
    if (search) params.search = search;
    params.page = p;
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with BlurText animation */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-surface-900 mb-2">
          <BlurText
            text="Product Catalog"
            delay={0.06}
            duration={0.5}
            animateBy="words"
          />
        </h1>
        <FadeContent delay={0.3} duration={0.5} direction="up" distance={16}>
          <p className="text-surface-500">Discover products from verified sellers across SEAPEDIA.</p>
        </FadeContent>
      </div>

      {/* Search Bar */}
      <FadeContent delay={0.4} duration={0.5} direction="up" distance={16}>
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <div className="flex-1">
            <Input
              icon={HiMagnifyingGlass}
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </FadeContent>

      {/* Results info */}
      {!loading && (
        <p className="text-sm text-surface-500 mb-6">
          Showing {products.length} of {pagination.total} products
          {searchParams.get('search') && <> for "<strong>{searchParams.get('search')}</strong>"</>}
        </p>
      )}

      {/* Product Grid */}
      {loading ? (
        <Spinner className="py-20" />
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product, idx) => (
              <ScrollReveal
                key={product.id}
                delay={idx * 0.06}
                duration={0.5}
                origin="bottom"
                distance={30}
                threshold={0.05}
              >
                <ProductCard product={product} />
              </ScrollReveal>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              >
                Previous
              </Button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`w-10 h-10 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                    p === page
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-surface-600 hover:bg-surface-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => goToPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <HiOutlineShoppingBag className="mx-auto text-surface-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-surface-700 mb-2">No Products Found</h3>
          <p className="text-surface-500">Try adjusting your search or check back later.</p>
        </div>
      )}
    </div>
  );
}
