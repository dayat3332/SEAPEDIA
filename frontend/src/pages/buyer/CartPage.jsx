import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartService } from '../../services';
import { Card, Button, Spinner, Badge } from '../../components/ui';
import { formatCurrency, getImageUrl } from '../../utils/helpers';
import {
  HiOutlineShoppingBag,
  HiOutlineTrash,
  HiOutlineBuildingStorefront,
  HiOutlineExclamationCircle,
  HiArrowRight,
  HiMinus,
  HiPlus
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function CartPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({ items: [], storeId: null });
  const [updatingItemId, setUpdatingItemId] = useState(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await cartService.getCart();
      setCart(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load cart.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQty = async (productId, currentQty, amount) => {
    const newQty = currentQty + amount;
    if (newQty < 1) return handleRemoveItem(productId);

    try {
      setUpdatingItemId(productId);
      const res = await cartService.updateItem(productId, newQty);
      setCart(res.data.data);
      toast.success('Cart updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update cart.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (productId) => {
    if (!confirm('Remove this product from your cart?')) return;
    try {
      setUpdatingItemId(productId);
      const res = await cartService.removeItem(productId);
      setCart(res.data.data);
      toast.success('Product removed.');
    } catch (err) {
      toast.error('Failed to remove product.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Are you sure you want to clear your cart?')) return;
    try {
      setLoading(true);
      const res = await cartService.clearCart();
      setCart(res.data.data);
      toast.success('Cart cleared.');
    } catch (err) {
      toast.error('Failed to clear cart.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Spinner size="lg" />
        <p className="text-surface-500 mt-4 font-medium">Loading your shopping cart...</p>
      </div>
    );
  }

  const hasItems = cart.items && cart.items.length > 0;
  const subtotal = hasItems ? cart.items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0) : 0;
  const storeName = hasItems ? cart.items[0].store_name : '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-surface-900 mb-8 flex items-center gap-2">
        <HiOutlineShoppingBag /> Shopping Cart
      </h1>

      {!hasItems ? (
        <Card className="p-12 text-center max-w-xl mx-auto">
          <HiOutlineShoppingBag className="mx-auto text-surface-300 mb-4" size={60} />
          <h3 className="text-lg font-semibold text-surface-800 mb-2">Your cart is empty</h3>
          <p className="text-sm text-surface-500 mb-8">Go find some awesome products to fill your cart!</p>
          <Link to="/products">
            <Button>Browse Products</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Store Banner */}
            <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <HiOutlineBuildingStorefront className="text-primary-600" size={20} />
                <span className="text-sm font-semibold text-surface-800">
                  Products from: <strong className="text-primary-700">{storeName}</strong>
                </span>
              </div>
              <Button size="xs" variant="outline" className="text-red-600 hover:bg-red-50" onClick={handleClearCart}>
                Clear Cart
              </Button>
            </div>

            {/* List */}
            <div className="divide-y divide-surface-100 bg-white border border-surface-100 rounded-2xl shadow-card overflow-hidden">
              {cart.items.map((item) => (
                <div key={item.product_id} className="p-5 flex flex-col sm:flex-row items-center gap-5 hover:bg-surface-50/20 transition-colors">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-xl bg-surface-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    <img
                      src={getImageUrl(item.image_url)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';
                      }}
                    />
                  </div>

                  {/* Name and Price */}
                  <div className="flex-grow min-w-0 text-center sm:text-left">
                    <h3 className="font-bold text-surface-900 text-sm sm:text-base truncate hover:text-primary-600">
                      <Link to={`/products/${item.product_id}`}>{item.name}</Link>
                    </h3>
                    <p className="text-sm font-extrabold text-primary-600 mt-1">
                      {formatCurrency(item.price)}
                    </p>
                    <p className="text-xs text-surface-400 mt-0.5">Stock available: {item.stock}</p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="flex items-center border border-surface-200 rounded-xl bg-surface-50/50 p-1">
                      <button
                        onClick={() => handleUpdateQty(item.product_id, item.quantity, -1)}
                        disabled={updatingItemId === item.product_id || item.quantity <= 1}
                        className="p-1.5 rounded-lg hover:bg-surface-200 transition-colors text-surface-500 disabled:opacity-40 cursor-pointer"
                      >
                        <HiMinus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-surface-800">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQty(item.product_id, item.quantity, 1)}
                        disabled={updatingItemId === item.product_id || item.quantity >= item.stock}
                        className="p-1.5 rounded-lg hover:bg-surface-200 transition-colors text-surface-500 disabled:opacity-40 cursor-pointer"
                      >
                        <HiPlus size={14} />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.product_id)}
                      disabled={updatingItemId === item.product_id}
                      className="p-2.5 rounded-xl hover:bg-red-50 text-red-500 transition-colors border border-transparent hover:border-red-100 cursor-pointer"
                      title="Remove product"
                    >
                      <HiOutlineTrash size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Single Store Rules Warning */}
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 flex items-start gap-3">
              <HiOutlineExclamationCircle className="text-orange-500 mt-0.5 flex-shrink-0" size={18} />
              <div>
                <h4 className="text-xs font-bold text-orange-950 uppercase tracking-wider mb-0.5">Single-Store Rule Policy</h4>
                <p className="text-xs text-orange-850 leading-relaxed">
                  Your cart can only hold products from one store at a time. If you add items from a different seller, you will be prompted to clear the cart or stick to the current seller.
                </p>
              </div>
            </div>
          </div>

          {/* Checkout Card Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24 shadow-card">
              <h3 className="font-bold text-surface-900 text-lg mb-4 pb-3 border-b border-surface-100">Order Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-surface-500">
                  <span>Total Items</span>
                  <span className="font-semibold text-surface-800">{cart.items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
                </div>
                <div className="flex justify-between text-base font-bold text-surface-900 pt-3 border-t border-surface-100">
                  <span>Subtotal</span>
                  <span className="text-primary-700">{formatCurrency(subtotal)}</span>
                </div>
                <p className="text-[11px] text-surface-400 leading-normal pt-2">
                  PPN 12% and shipping delivery fees will be calculated on the next checkout step.
                </p>

                <Button fullWidth size="lg" className="mt-4" onClick={() => navigate('/checkout')}>
                  Proceed to Checkout <HiArrowRight size={16} />
                </Button>

                <Link to="/products" className="block text-center mt-3 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                  Continue Shopping
                </Link>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
