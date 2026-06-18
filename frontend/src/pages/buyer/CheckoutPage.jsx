import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { cartService, addressService, walletService, orderService, discountService } from '../../services';
import { Card, Button, Input, Modal, Spinner, Badge } from '../../components/ui';
import { formatCurrency, getImageUrl } from '../../utils/helpers';
import {
  HiOutlineMapPin,
  HiOutlineCreditCard,
  HiOutlineTruck,
  HiOutlineBuildingStorefront,
  HiOutlinePlus,
  HiCheckCircle,
  HiArrowLeft
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Data
  const [cart, setCart] = useState({ items: [], storeId: null });
  const [addresses, setAddresses] = useState([]);
  const [wallet, setWallet] = useState({ balance: 0 });

  // Selections
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState('regular'); // instant, next_day, regular
  const [paymentMethod, setPaymentMethod] = useState('wallet'); // wallet, qris, atm

  // Discount/Promo Code State
  const [discountCode, setDiscountCode] = useState('');
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(null);

  // Submitting Order
  const [submitting, setSubmitting] = useState(false);

  // Receipt Modal State
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // Address creation inside checkout
  const [addressOpen, setAddressOpen] = useState(false);
  const [addressLabel, setAddressLabel] = useState('');
  const [addressRecipient, setAddressRecipient] = useState('');
  const [addressPhone, setAddressPhone] = useState('');
  const [addressFull, setAddressFull] = useState('');
  const [submittingAddress, setSubmittingAddress] = useState(false);

  // Top Up inside checkout
  const [topupOpen, setTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [submittingTopup, setSubmittingTopup] = useState(false);

  useEffect(() => {
    fetchCheckoutData();
  }, []);

  const fetchCheckoutData = async () => {
    try {
      setLoading(true);
      const [cartRes, addressRes, walletRes] = await Promise.all([
        cartService.getCart(),
        addressService.getAddresses(),
        walletService.getWallet(),
      ]);

      const cartData = cartRes.data.data;
      const addressData = addressRes.data.data;

      setCart(cartData);
      setAddresses(addressData);
      setWallet(walletRes.data.data);

      // Set default address
      if (addressData.length > 0) {
        const defaultAddr = addressData.find(a => a.is_default) || addressData[0];
        setSelectedAddressId(defaultAddr.id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load checkout data.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      return toast.error('Please enter a discount code.');
    }

    try {
      setIsValidatingCode(true);
      const res = await discountService.validateDiscount(discountCode.trim(), subtotal);
      setAppliedDiscount(res.data.data);
      toast.success(`Discount code "${discountCode.trim()}" applied!`);
    } catch (err) {
      setAppliedDiscount(null);
      toast.error(err.response?.data?.message || 'Invalid or expired discount code.');
    } finally {
      setIsValidatingCode(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
    toast.success('Discount code removed.');
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!addressLabel.trim() || !addressRecipient.trim() || !addressPhone.trim() || !addressFull.trim()) {
      return toast.error('Please fill in all address fields.');
    }

    try {
      setSubmittingAddress(true);
      const res = await addressService.createAddress({
        label: addressLabel.trim(),
        recipientName: addressRecipient.trim(),
        phone: addressPhone.trim(),
        fullAddress: addressFull.trim(),
        isDefault: true,
      });

      toast.success('Address added and selected.');
      setAddressOpen(false);

      // Reset form
      setAddressLabel('');
      setAddressRecipient('');
      setAddressPhone('');
      setAddressFull('');

      // Reload addresses
      const addressRes = await addressService.getAddresses();
      const updatedAddrs = addressRes.data.data;
      setAddresses(updatedAddrs);
      setSelectedAddressId(res.data.data.id);
    } catch (err) {
      toast.error('Failed to save address.');
    } finally {
      setSubmittingAddress(false);
    }
  };

  const handleTopupSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(topupAmount);
    if (!amount || amount < 1000) {
      return toast.error('Minimum top-up is Rp 1.000.');
    }

    try {
      setSubmittingTopup(true);
      await walletService.topup(amount);
      toast.success(`Successfully topped up ${formatCurrency(amount)}!`);
      setTopupOpen(false);
      setTopupAmount('');
      // Refresh wallet info
      const walletRes = await walletService.getWallet();
      setWallet(walletRes.data.data);
    } catch (err) {
      toast.error('Top-up failed.');
    } finally {
      setSubmittingTopup(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      return toast.error('Please select a shipping address.');
    }
    if (!deliveryMethod) {
      return toast.error('Please select a delivery method.');
    }

    try {
      setSubmitting(true);

      // Auto top-up behind the scenes for QRIS or ATM options to satisfy backend wallet constraints
      if (paymentMethod !== 'wallet' && parseFloat(wallet.balance) < total) {
        const topupDiff = total - parseFloat(wallet.balance);
        await walletService.topup(topupDiff);
      }

      const payload = {
        addressId: selectedAddressId,
        deliveryMethod,
        discountCode: appliedDiscount ? appliedDiscount.code : undefined
      };

      const res = await orderService.checkout(payload);
      toast.success('Order placed successfully!');
      
      const activeAddress = addresses.find(a => a.id === selectedAddressId);
      setReceiptData({
        orderNumber: res.data.data.orderNumber,
        orderId: res.data.data.orderId,
        items: [...cart.items],
        storeName: cart.items[0]?.store_name || 'SEAPEDIA Partner Store',
        address: activeAddress,
        deliveryMethod,
        paymentMethod,
        subtotal,
        discountAmount,
        deliveryFee,
        taxAmount,
        total: res.data.data.total || total,
        date: new Date().toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      });
      setReceiptOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Spinner size="lg" />
        <p className="text-surface-500 mt-4 font-medium">Preparing checkout details...</p>
      </div>
    );
  }

  const hasItems = cart.items && cart.items.length > 0;
  if (!hasItems) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-surface-900 mb-4">No Items to Checkout</h2>
        <Link to="/products"><Button>Browse Products</Button></Link>
      </div>
    );
  }

  // Financial Calculations
  const subtotal = cart.items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  const deliveryFees = {
    instant: 25000.00,
    next_day: 15000.00,
    regular: 10000.00,
  };
  const deliveryFee = deliveryFees[deliveryMethod];

  // Apply discount calculation
  const discountAmount = appliedDiscount ? parseFloat(appliedDiscount.discountAmount) : 0.00;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = parseFloat((taxableAmount * 0.12).toFixed(2));
  const total = subtotal - discountAmount + deliveryFee + taxAmount;

  const insufficientBalance = paymentMethod === 'wallet' && parseFloat(wallet.balance) < total;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <Link to="/cart" className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-primary-600 transition-colors mb-6">
        <HiArrowLeft size={16} /> Back to Cart
      </Link>

      <h1 className="text-2xl font-bold text-surface-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Forms (Left) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Shipping Address */}
          <Card className="p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="font-bold text-surface-900 text-lg flex items-center gap-2">
                <HiOutlineMapPin className="text-primary-600" /> 1. Shipping Address
              </h3>
              <Button size="xs" variant="secondary" onClick={() => setAddressOpen(true)} className="flex items-center gap-1">
                <HiOutlinePlus size={14} /> Add Address
              </Button>
            </div>

            {addresses.length === 0 ? (
              <div className="p-6 text-center border-dashed border-2 border-surface-200 rounded-xl">
                <p className="text-sm text-surface-500 mb-4">No shipping addresses found.</p>
                <Button size="sm" onClick={() => setAddressOpen(true)}>Add Address</Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all duration-200 flex items-start justify-between gap-4 ${
                      selectedAddressId === addr.id
                        ? 'border-primary-500 bg-primary-50/5'
                        : 'border-surface-200 hover:border-surface-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase bg-surface-200 text-surface-700 px-2 py-0.5 rounded-full">
                          {addr.label}
                        </span>
                        {addr.is_default && (
                          <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-surface-900 text-sm">{addr.recipient_name}</h4>
                      <p className="text-xs text-surface-500 font-medium">{addr.phone}</p>
                      <p className="text-xs text-surface-600 mt-1 leading-relaxed">{addr.full_address}</p>
                    </div>
                    {selectedAddressId === addr.id && (
                      <HiCheckCircle className="text-primary-600 flex-shrink-0" size={20} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 2. Delivery Method */}
          <Card className="p-6">
            <h3 className="font-bold text-surface-900 text-lg flex items-center gap-2 mb-4">
              <HiOutlineTruck className="text-primary-600" /> 2. Delivery Method
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'regular', label: 'Regular', time: '3-5 Days', price: 10000 },
                { id: 'next_day', label: 'Next Day', time: '1 Day', price: 15000 },
                { id: 'instant', label: 'Instant', time: '1-3 Hours', price: 25000 },
              ].map((method) => (
                <div
                  key={method.id}
                  onClick={() => setDeliveryMethod(method.id)}
                  className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                    deliveryMethod === method.id
                      ? 'border-primary-500 bg-primary-50/5'
                      : 'border-surface-200 hover:border-surface-300'
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-surface-900 text-sm flex items-center justify-between">
                      {method.label}
                      {deliveryMethod === method.id && <HiCheckCircle className="text-primary-600" size={16} />}
                    </h4>
                    <p className="text-xs text-surface-400 mt-0.5 font-medium">{method.time}</p>
                  </div>
                  <p className="text-sm font-extrabold text-primary-600 mt-4">
                    {formatCurrency(method.price)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* 3. Items Review */}
          <Card className="p-6">
            <h3 className="font-bold text-surface-900 text-lg flex items-center gap-2 mb-4">
              <HiOutlineBuildingStorefront className="text-primary-600" /> 3. Review Order Items
            </h3>
            <div className="p-3 bg-surface-50 border border-surface-200 rounded-xl mb-4 text-xs font-semibold text-surface-700">
              Seller Store: <strong className="text-primary-700">{cart.items[0]?.store_name}</strong>
            </div>
            <div className="divide-y divide-surface-100">
              {cart.items.map((item) => (
                <div key={item.product_id} className="py-3 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-100 flex-shrink-0 flex items-center justify-center">
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
                  <div className="flex-grow min-w-0">
                    <h4 className="text-sm font-semibold text-surface-900 truncate">{item.name}</h4>
                    <p className="text-xs text-surface-500 font-medium">
                      {item.quantity} x {formatCurrency(item.price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-surface-800">
                      {formatCurrency(parseFloat(item.price) * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Payment & Summary Card (Right) */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 sticky top-24 shadow-card">
            {/* Payment Method Selection */}
            <div className="pb-4 border-b border-surface-200 mb-4">
              <h3 className="font-bold text-surface-900 text-sm mb-3">Pilih Metode Pembayaran</h3>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'wallet', label: 'SEAPEDIA Wallet', desc: 'Bayar instan pakai saldo wallet' },
                  { id: 'qris', label: 'QRIS', desc: 'Gopay / OVO / Dana / LinkAja' },
                  { id: 'atm', label: 'ATM / Transfer Bank', desc: 'Virtual Account Mandiri / BCA' }
                ].map((pm) => (
                  <div
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-150 flex items-start gap-2.5 ${
                      paymentMethod === pm.id
                        ? 'border-primary-500 bg-primary-50/5'
                        : 'border-surface-200 hover:border-surface-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === pm.id}
                      onChange={() => setPaymentMethod(pm.id)}
                      className="mt-0.5 cursor-pointer accent-primary-600"
                    />
                    <div>
                      <p className="text-xs font-bold text-surface-900">{pm.label}</p>
                      <p className="text-[10px] text-surface-400 font-medium mt-0.5 leading-none">{pm.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Wallet Info (Only show if paymentMethod === 'wallet') */}
            {paymentMethod === 'wallet' && (
              <div className="pb-4 border-b border-surface-200 mb-4">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <span className="text-xs font-bold text-surface-600">Saldo E-Wallet</span>
                  <Button size="xs" variant="ghost" onClick={() => setTopupOpen(true)} className="text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded-lg">
                    Top Up
                  </Button>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Your Balance</p>
                    <p className="text-base font-bold text-emerald-950">{formatCurrency(wallet.balance)}</p>
                  </div>
                  {insufficientBalance && (
                    <Badge variant="danger" size="sm">Low Balance</Badge>
                  )}
                </div>
              </div>
            )}

            {/* QRIS / ATM info boxes */}
            {paymentMethod === 'qris' && (
              <div className="p-3 mb-4 rounded-xl bg-primary-50/50 border border-primary-100 text-[10px] text-primary-700 leading-relaxed font-medium">
                ⚡ Scan QRIS akan langsung diproses. Struk digital lunas akan digenerate setelah Anda mengonfirmasi pesanan.
              </div>
            )}

            {paymentMethod === 'atm' && (
              <div className="p-3 mb-4 rounded-xl bg-primary-50/50 border border-primary-100 text-[10px] text-primary-700 leading-relaxed font-medium">
                🏦 Nomor Virtual Account Mandiri/BCA Anda akan dicantumkan secara otomatis pada struk belanja setelah konfirmasi.
              </div>
            )}

            {/* Discount Code Input */}
            <div className="pb-4 border-b border-surface-200 mb-4">
              <h4 className="font-bold text-surface-900 text-xs mb-2">Have a Voucher or Promo?</h4>
              {appliedDiscount ? (
                <div className="p-3 bg-primary-50 border border-primary-200 rounded-xl flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] text-primary-700 font-bold uppercase">{appliedDiscount.type}</p>
                    <p className="text-xs font-extrabold text-primary-900 truncate">{appliedDiscount.code}</p>
                    <p className="text-[10px] text-emerald-600 font-medium">
                      Discount: -{formatCurrency(appliedDiscount.discountAmount)}
                    </p>
                  </div>
                  <Button size="xs" variant="outline" onClick={handleRemoveDiscount}>
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="Enter code"
                    className="flex-grow min-w-0 text-xs"
                    disabled={isValidatingCode}
                  />
                  <Button size="sm" onClick={handleApplyDiscount} loading={isValidatingCode}>
                    Apply
                  </Button>
                </div>
              )}
            </div>

            {/* Calculations */}
            <h3 className="font-bold text-surface-900 text-sm mb-3">Order Summary Details</h3>
            <div className="space-y-2.5 text-xs text-surface-600 pb-4 border-b border-surface-150">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-surface-800">{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount ({appliedDiscount.code})</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Fee ({deliveryMethod})</span>
                <span className="font-bold text-surface-800">{formatCurrency(deliveryFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>PPN Tax (12%)</span>
                <span className="font-bold text-surface-800">{formatCurrency(taxAmount)}</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-4 mb-6">
              <span className="text-sm font-bold text-surface-800">Total Payment</span>
              <span className="text-lg font-extrabold text-primary-700">{formatCurrency(total)}</span>
            </div>

            {/* Warning if insufficient */}
            {insufficientBalance && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-700 leading-normal mb-4">
                Your wallet balance is insufficient. Please <strong>top up</strong> your wallet with at least {formatCurrency(total - parseFloat(wallet.balance))} to place this order.
              </div>
            )}

            {/* Place Order Button */}
            <Button
              fullWidth
              size="lg"
              onClick={handlePlaceOrder}
              disabled={submitting || insufficientBalance || !selectedAddressId}
              loading={submitting}
            >
              Confirm Order & Pay
            </Button>
          </Card>
        </div>
      </div>

      {/* DUMMY ADDRESS MODAL */}
      <Modal isOpen={addressOpen} onClose={() => setAddressOpen(false)} title="Add Shipping Address">
        <form onSubmit={handleAddressSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-surface-600 uppercase mb-1">Label (e.g. Home, Office)</label>
            <Input
              value={addressLabel}
              onChange={(e) => setAddressLabel(e.target.value)}
              placeholder="e.g. Home, Office"
              required
              disabled={submittingAddress}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-surface-600 uppercase mb-1">Recipient Name</label>
              <Input
                value={addressRecipient}
                onChange={(e) => setAddressRecipient(e.target.value)}
                placeholder="e.g. John Doe"
                required
                disabled={submittingAddress}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 uppercase mb-1">Phone Number</label>
              <Input
                value={addressPhone}
                onChange={(e) => setAddressPhone(e.target.value)}
                placeholder="e.g. +62 812 3456 789"
                required
                disabled={submittingAddress}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-surface-600 uppercase mb-1">Full Delivery Address</label>
            <textarea
              value={addressFull}
              onChange={(e) => setAddressFull(e.target.value)}
              placeholder="Complete address block number, street name, postcode..."
              rows={3}
              required
              className="w-full px-4 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              disabled={submittingAddress}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
            <Button variant="secondary" type="button" onClick={() => setAddressOpen(false)} disabled={submittingAddress}>
              Cancel
            </Button>
            <Button type="submit" loading={submittingAddress}>
              Save Address
            </Button>
          </div>
        </form>
      </Modal>

      {/* DUMMY TOP-UP MODAL */}
      <Modal isOpen={topupOpen} onClose={() => setTopupOpen(false)} title="Simulate Top-up Wallet">
        <form onSubmit={handleTopupSubmit} className="space-y-4 pt-2">
          <p className="text-xs text-surface-500 leading-relaxed">
            Specify the amount you wish to add to your SEAPEDIA Wallet. This is a dummy simulation.
          </p>
          <div>
            <label className="block text-xs font-semibold text-surface-600 uppercase mb-1">Amount (Rp)</label>
            <Input
              type="number"
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              placeholder="e.g. 100000"
              required
              min="1000"
              disabled={submittingTopup}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
            <Button variant="secondary" type="button" onClick={() => setTopupOpen(false)} disabled={submittingTopup}>
              Cancel
            </Button>
            <Button type="submit" loading={submittingTopup}>
              Top Up
            </Button>
          </div>
        </form>
      </Modal>

      {/* RECEIPT / STRUK MODAL */}
      <Modal 
        isOpen={receiptOpen} 
        onClose={() => {
          setReceiptOpen(false);
          navigate('/dashboard/buyer');
        }} 
        title="Pembayaran Berhasil! 🎉"
      >
        {receiptData && (
          <div className="pt-2">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                <HiCheckCircle size={32} />
              </div>
              <h3 className="text-lg font-bold text-surface-900">Terima Kasih Atas Pembelian Anda!</h3>
              <p className="text-xs text-surface-500 mt-1">Pembayaran Anda telah berhasil diproses.</p>
            </div>

            {/* Receipt Container */}
            <div className="p-6 rounded-2xl bg-surface-50 border border-surface-200 shadow-inner relative overflow-hidden font-mono text-xs text-surface-700 space-y-4">
              {/* Receipt Header */}
              <div className="text-center pb-4 border-b border-dashed border-surface-300">
                <h4 className="text-sm font-extrabold text-surface-900 tracking-tight mb-1">SEAPEDIA INVOICE</h4>
                <p className="text-[10px] text-surface-400">Order No: {receiptData.orderNumber}</p>
                <p className="text-[10px] text-surface-400">Tanggal: {receiptData.date}</p>
              </div>

              {/* Store & Destination */}
              <div>
                <p className="font-bold text-surface-900">Toko: {receiptData.storeName}</p>
                <p className="text-[10px] text-surface-500 mt-1">
                  Penerima: {receiptData.address?.recipient_name} ({receiptData.address?.phone})
                </p>
                <p className="text-[10px] text-surface-450 leading-relaxed mt-0.5">
                  {receiptData.address?.full_address}
                </p>
              </div>

              {/* Items List */}
              <div className="py-3 border-t border-b border-dashed border-surface-300 space-y-2">
                {receiptData.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-surface-800 line-clamp-1">{item.name}</p>
                      <p className="text-[10px] text-surface-400">{item.quantity} x {formatCurrency(item.price)}</p>
                    </div>
                    <span className="font-semibold text-surface-800 flex-shrink-0">
                      {formatCurrency(parseFloat(item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Calculations */}
              <div className="space-y-1.5 pb-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(receiptData.subtotal)}</span>
                </div>
                {receiptData.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Diskon</span>
                    <span>-{formatCurrency(receiptData.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>PPN (12%)</span>
                  <span>{formatCurrency(receiptData.taxAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ongkos Kirim ({receiptData.deliveryMethod.toUpperCase()})</span>
                  <span>{formatCurrency(receiptData.deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-surface-900 pt-2 border-t border-dashed border-surface-300">
                  <span>TOTAL BAYAR</span>
                  <span>{formatCurrency(receiptData.total)}</span>
                </div>
              </div>

              {/* Stamp or QR Code/VA Details */}
              {receiptData.paymentMethod === 'qris' && (
                <div className="flex flex-col items-center pt-2 pb-1 border-t border-dashed border-surface-300">
                  <div className="w-24 h-24 bg-white border border-surface-200 p-1.5 rounded-lg flex items-center justify-center mb-1">
                    {/* Simulated QR Code SVG */}
                    <svg width="80" height="80" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-surface-900">
                      <rect width="29" height="29" fill="white"/>
                      <path d="M0 0h7v7H0V0zm1 1v5h5V1H1zm1 1h3v3H2V2zM0 9h7v7H0V9zm1 1v5h5v-5H1zm1 1h3v3H2v-3zM9 0h7v7H9V0zm1 1v5h5V1h-5zm1 1h3v3h-3V2z" fill="currentColor"/>
                      <path d="M9 9h2v2H9V9zm4 0h2v4h-2V9zm-4 4h2v2H9v-2zm4 4h2v2h-2v-2zm-4 4h2v4H9v-4zm4 2h2v2h-2v-2zm-4 4h2v2H9v-2zm12-21h7v7h-7V0zm1 1v5h5V1h-5zm1 1h3v3h-3V2zm-3 7h2v2h-2V9zm4 0h4v2h-4V9zm-4 4h2v4h-2v-4zm4 2h4v2h-4v-2zm-4 4h2v2h-2v-2zm4 0h2v4h-2v-4zm4 2h2v2h-2v-2z" fill="currentColor"/>
                    </svg>
                  </div>
                  <p className="text-[9px] text-surface-400 font-sans">QRIS Danamon/Permata</p>
                  <div className="px-4 py-0.5 mt-2 border-2 border-emerald-500 text-emerald-600 font-extrabold text-[10px] tracking-widest rounded uppercase transform -rotate-1">
                    LUNAS (QRIS)
                  </div>
                </div>
              )}

              {receiptData.paymentMethod === 'atm' && (
                <div className="text-center pt-2 pb-1 space-y-1.5 border-t border-dashed border-surface-300">
                  <div className="bg-white p-2.5 rounded-xl border border-surface-200 font-sans text-left">
                    <p className="text-[9px] text-surface-400 font-bold uppercase">BCA Virtual Account</p>
                    <p className="text-sm font-extrabold text-surface-850 tracking-wider mt-0.5">88012 081200000007</p>
                    <p className="text-[8px] text-surface-400 mt-1 leading-normal">Silakan selesaikan pembayaran via ATM atau Mobile Banking.</p>
                  </div>
                  <div className="inline-block px-4 py-0.5 border-2 border-emerald-500 text-emerald-600 font-extrabold text-[10px] tracking-widest rounded uppercase transform -rotate-1">
                    LUNAS (VA TRANSFER)
                  </div>
                </div>
              )}

              {receiptData.paymentMethod === 'wallet' && (
                <div className="flex justify-center pt-2 border-t border-dashed border-surface-300">
                  <div className="px-5 py-1 border-2 border-emerald-500 text-emerald-600 font-extrabold text-xs tracking-widest rounded uppercase transform -rotate-2">
                    LUNAS (E-WALLET)
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-surface-200">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setReceiptOpen(false);
                  navigate('/products');
                }}
              >
                Belanja Lagi
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setReceiptOpen(false);
                  navigate('/dashboard/buyer');
                }}
              >
                Ke Dashboard
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
