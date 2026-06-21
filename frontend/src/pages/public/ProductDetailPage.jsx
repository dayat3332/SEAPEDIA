import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiOutlineBuildingStorefront, HiArrowLeft, HiOutlineShoppingCart } from 'react-icons/hi2';
import { productService, cartService, storeService } from '../../services';
import { Spinner, Button, Badge } from '../../components/ui';
import { formatCurrency, getImageUrl, formatDate } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { isAuthenticated, activeRole } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [storeReviews, setStoreReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const res = await productService.getProductById(id);
      setProduct(res.data.data);

      setLoadingReviews(true);
      try {
        const resReviews = await storeService.getStoreReviews(res.data.data.store_id, { limit: 5 });
        setStoreReviews(resReviews.data.data.reviews || []);
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        setLoadingReviews(false);
      }
    } catch (err) {
      console.error('Failed to load product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await cartService.addItem(product.id, 1);
      toast.success('Successfully added to cart!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart.');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <Spinner className="py-32" />;

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-surface-700 mb-4">Product Not Found</h2>
        <Link to="/products"><Button variant="secondary">Back to Products</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Breadcrumb */}
      <Link to="/products" className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-primary-600 transition-colors mb-6">
        <HiArrowLeft size={16} /> Back to Products
      </Link>
 
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Image */}
        <div className="rounded-2xl overflow-hidden bg-surface-100 aspect-square">
          <img
            src={getImageUrl(product.image_url)}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';
            }}
          />
        </div>

        {/* Product Info */}
        <div>
          {/* Store info */}
          <Link
            to={`/products?store_id=${product.store_id}`}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-50 hover:bg-surface-100 transition-colors mb-4"
          >
            <HiOutlineBuildingStorefront className="text-surface-500" size={16} />
            <span className="text-sm font-medium text-surface-600">{product.store_name}</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 mb-3">{product.name}</h1>

          <p className="text-3xl font-extrabold text-primary-600 mb-6">
            {formatCurrency(product.price)}
          </p>

          {/* Stock Status */}
          <div className="flex items-center gap-3 mb-6">
            <Badge variant={product.stock > 0 ? 'success' : 'danger'}>
              {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
            </Badge>
          </div>

          {/* Add to Cart */}
          <div className="mb-8">
            {isAuthenticated && activeRole === 'buyer' ? (
              <Button size="lg" fullWidth disabled={product.stock <= 0 || adding} onClick={handleAddToCart} loading={adding}>
                <HiOutlineShoppingCart size={20} />
                Add to Cart
              </Button>
            ) : (
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-100">
                <p className="text-sm text-surface-500 text-center">
                  {!isAuthenticated
                    ? <>Please <Link to="/login" className="text-primary-600 font-semibold hover:underline">login</Link> as a Buyer to purchase.</>
                    : 'Switch to Buyer role to add items to cart.'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="border-t border-surface-100 pt-6">
            <h3 className="text-sm font-semibold text-surface-900 uppercase tracking-wider mb-3">Description</h3>
            <p className="text-sm text-surface-600 leading-relaxed whitespace-pre-line">
              {product.description || 'No description available.'}
            </p>
          </div>

          {/* Store Info */}
          <div className="border-t border-surface-100 pt-6 mt-6">
            <h3 className="text-sm font-semibold text-surface-900 uppercase tracking-wider mb-3">Store Information</h3>
            <div className="p-4 rounded-xl bg-surface-50 border border-surface-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-lg">
                  {product.store_name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-surface-800">{product.store_name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-amber-500 flex items-center">
                      <svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                      </svg>
                    </span>
                    <span className="text-xs font-bold text-surface-700">
                      {parseFloat(product.store_average_rating).toFixed(1)} / 5
                    </span>
                    <span className="text-xs text-surface-400">
                      ({product.store_total_reviews} ulasan)
                    </span>
                  </div>
                  <p className="text-xs text-surface-500 mt-1">{product.store_description || 'Verified seller on SEAPEDIA'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Store Reviews Section */}
          <div className="border-t border-surface-100 pt-6">
            <h3 className="text-sm font-semibold text-surface-900 uppercase tracking-wider mb-3">Recent Store Reviews ({product.store_total_reviews})</h3>
            {loadingReviews ? (
              <div className="text-center py-4 text-xs text-surface-400">Loading reviews...</div>
            ) : storeReviews.length === 0 ? (
              <div className="text-center py-6 text-xs text-surface-450 bg-surface-50 rounded-xl border border-dashed border-surface-200">
                No reviews yet for this store.
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {storeReviews.map((rev) => (
                  <div key={rev.id} className="p-3 bg-surface-50 rounded-xl border border-surface-100 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-surface-800">{rev.reviewer_name}</span>
                      <span className="text-[10px] text-surface-400">{formatDate(rev.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-3.5 h-3.5 ${star <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-surface-250'}`}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-surface-600 leading-relaxed italic">"{rev.comment}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
