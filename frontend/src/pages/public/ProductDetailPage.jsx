import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiOutlineBuildingStorefront, HiArrowLeft, HiOutlineShoppingCart } from 'react-icons/hi2';
import { productService, cartService } from '../../services';
import { Spinner, Button, Badge } from '../../components/ui';
import { formatCurrency, getImageUrl } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { isAuthenticated, activeRole } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const res = await productService.getProductById(id);
      setProduct(res.data.data);
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
            <div className="p-4 rounded-xl bg-surface-50 border border-surface-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-lg">
                  {product.store_name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-surface-800">{product.store_name}</p>
                  <p className="text-xs text-surface-400">{product.store_description || 'Verified seller on SEAPEDIA'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
