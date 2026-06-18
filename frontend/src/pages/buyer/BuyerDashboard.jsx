import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Badge, Button, Input, Modal, Spinner } from '../../components/ui';
import { walletService, addressService, orderService } from '../../services';
import { ROLE_CONFIG, formatCurrency, formatDate, getImageUrl } from '../../utils/helpers';
import {
  HiOutlineWallet,
  HiOutlineMapPin,
  HiOutlineClipboardDocumentList,
  HiOutlinePlus,
  HiOutlineCheck,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineClock,
  HiOutlineBuildingStorefront,
  HiOutlineTruck
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('wallet');
  const [loading, setLoading] = useState(true);

  // Data States
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);

  // Top Up Modal State
  const [topupOpen, setTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [submittingTopup, setSubmittingTopup] = useState(false);

  // Address Modal State
  const [addressOpen, setAddressOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressLabel, setAddressLabel] = useState('');
  const [addressRecipient, setAddressRecipient] = useState('');
  const [addressPhone, setAddressPhone] = useState('');
  const [addressFull, setAddressFull] = useState('');
  const [addressDefault, setAddressDefault] = useState(false);
  const [submittingAddress, setSubmittingAddress] = useState(false);

  // Order Details Modal State
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [walletRes, addressRes, orderRes] = await Promise.all([
        walletService.getWallet(),
        addressService.getAddresses(),
        orderService.getBuyerOrders(),
      ]);
      setWallet(walletRes.data.data);
      setAddresses(addressRes.data.data);
      setOrders(orderRes.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleTopupSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(topupAmount);
    if (!amount || amount < 1000) {
      return toast.error('Minimum top-up is Rp 1.000');
    }

    try {
      setSubmittingTopup(true);
      const res = await walletService.topup(amount);
      toast.success(`Successfully topped up ${formatCurrency(amount)}!`);
      setTopupOpen(false);
      setTopupAmount('');
      // Refresh wallet info
      const walletRes = await walletService.getWallet();
      setWallet(walletRes.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Top-up failed.');
    } finally {
      setSubmittingTopup(false);
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!addressLabel.trim() || !addressRecipient.trim() || !addressPhone.trim() || !addressFull.trim()) {
      return toast.error('Please fill in all address fields.');
    }

    try {
      setSubmittingAddress(true);
      const payload = {
        label: addressLabel.trim(),
        recipientName: addressRecipient.trim(),
        phone: addressPhone.trim(),
        fullAddress: addressFull.trim(),
        isDefault: addressDefault,
      };

      if (selectedAddress) {
        await addressService.updateAddress(selectedAddress.id, payload);
        toast.success('Address updated successfully.');
      } else {
        await addressService.createAddress(payload);
        toast.success('Address added successfully.');
      }

      setAddressOpen(false);
      // Refresh address list
      const addressRes = await addressService.getAddresses();
      setAddresses(addressRes.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address.');
    } finally {
      setSubmittingAddress(false);
    }
  };

  const openAddressModal = (address = null) => {
    if (address) {
      setSelectedAddress(address);
      setAddressLabel(address.label);
      setAddressRecipient(address.recipient_name);
      setAddressPhone(address.phone);
      setAddressFull(address.full_address);
      setAddressDefault(!!address.is_default);
    } else {
      setSelectedAddress(null);
      setAddressLabel('');
      setAddressRecipient('');
      setAddressPhone('');
      setAddressFull('');
      setAddressDefault(false);
    }
    setAddressOpen(true);
  };

  const handleDeleteAddress = async (id) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await addressService.deleteAddress(id);
      toast.success('Address deleted successfully.');
      const addressRes = await addressService.getAddresses();
      setAddresses(addressRes.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete address.');
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      await addressService.setDefaultAddress(id);
      toast.success('Default address updated.');
      const addressRes = await addressService.getAddresses();
      setAddresses(addressRes.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set default.');
    }
  };

  const viewOrderDetails = async (orderId) => {
    try {
      setLoadingOrderDetails(true);
      setOrderDetailOpen(true);
      const res = await orderService.getOrderById(orderId);
      setSelectedOrder(res.data.data);
    } catch (err) {
      toast.error('Failed to load order details.');
      setOrderDetailOpen(false);
    } finally {
      setLoadingOrderDetails(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'sedang_dikemas':
        return 'warning';
      case 'menunggu_pengirim':
        return 'primary';
      case 'sedang_dikirim':
        return 'info';
      case 'pesanan_selesai':
        return 'success';
      case 'dikembalikan':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'sedang_dikemas':
        return 'Sedang Dikemas';
      case 'menunggu_pengirim':
        return 'Menunggu Pengirim';
      case 'sedang_dikirim':
        return 'Sedang Dikirim';
      case 'pesanan_selesai':
        return 'Pesanan Selesai';
      case 'dikembalikan':
        return 'Dikembalikan';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Spinner size="lg" />
        <p className="text-surface-500 mt-4 font-medium">Loading buyer dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-surface-900">Buyer Dashboard</h1>
            <Badge variant="buyer" className="flex items-center gap-1">
              {ROLE_CONFIG.buyer.IconComponent ? <ROLE_CONFIG.buyer.IconComponent size={14} /> : ROLE_CONFIG.buyer.icon}
              <span>Buyer</span>
            </Badge>
          </div>
          <p className="text-surface-500 text-sm">Welcome back, {user?.full_name}. Manage your settings and track orders.</p>
        </div>
        <Card className="px-6 py-4 flex items-center gap-4 bg-emerald-50 border border-emerald-100">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <HiOutlineWallet size={22} />
          </div>
          <div>
            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Wallet Balance</p>
            <p className="text-lg font-bold text-emerald-950">{formatCurrency(wallet.balance)}</p>
          </div>
        </Card>
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-surface-200 mb-8 overflow-x-auto gap-2">
        {[
          { id: 'wallet', label: 'My Wallet', icon: HiOutlineWallet },
          { id: 'addresses', label: 'Addresses', icon: HiOutlineMapPin },
          { id: 'orders', label: 'Order History', icon: HiOutlineClipboardDocumentList },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-700 bg-primary-50/50 rounded-t-lg'
                : 'border-transparent text-surface-500 hover:text-surface-800 hover:border-surface-300'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {/* WALLET TAB */}
        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Wallet Overview & Action */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-6 bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 opacity-10">
                  <HiOutlineWallet size={160} />
                </div>
                <div className="relative z-10">
                  <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-2">Available Balance</p>
                  <p className="text-3xl font-extrabold mb-6">{formatCurrency(wallet.balance)}</p>
                  <Button variant="secondary" fullWidth onClick={() => setTopupOpen(true)} className="!bg-white !text-emerald-800 hover:!bg-emerald-50">
                    <HiOutlinePlus size={16} />
                    Top Up Balance
                  </Button>
                </div>
              </Card>

              {/* Spending Report */}
              <Card className="p-6">
                <h3 className="font-bold text-surface-900 text-sm mb-4">Expense & Spending Report</h3>
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-surface-100">
                    <span className="text-surface-500 font-medium">Total Expenses</span>
                    <span className="font-extrabold text-red-600">
                      {formatCurrency(wallet.transactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + parseFloat(t.amount), 0))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-surface-100">
                    <span className="text-surface-500 font-medium">Total Refunds</span>
                    <span className="font-extrabold text-green-600">
                      {formatCurrency(wallet.transactions.filter(t => t.type === 'refund').reduce((sum, t) => sum + parseFloat(t.amount), 0))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-surface-500 font-medium">Total Top-ups</span>
                    <span className="font-extrabold text-primary-600">
                      {formatCurrency(wallet.transactions.filter(t => t.type === 'topup').reduce((sum, t) => sum + parseFloat(t.amount), 0))}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Transactions History */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <h3 className="font-bold text-surface-900 text-lg mb-4">Transaction History</h3>
                {wallet.transactions.length === 0 ? (
                  <div className="text-center py-12 text-surface-400">
                    <HiOutlineWallet className="mx-auto mb-3 opacity-60" size={36} />
                    <p className="text-sm">No transactions yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="border-b border-surface-200 text-surface-500 font-semibold uppercase tracking-wider text-xs">
                        <tr>
                          <th className="pb-3">Date</th>
                          <th className="pb-3">Type</th>
                          <th className="pb-3">Description</th>
                          <th className="pb-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-100 text-surface-700">
                        {wallet.transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-surface-50/50">
                            <td className="py-3 text-xs text-surface-400">{formatDate(tx.created_at)}</td>
                            <td className="py-3">
                              <Badge variant={tx.type === 'topup' || tx.type === 'refund' ? 'success' : 'danger'} size="sm">
                                {tx.type}
                              </Badge>
                            </td>
                            <td className="py-3 text-xs font-medium max-w-[200px] truncate" title={tx.description}>
                              {tx.description}
                            </td>
                            <td className={`py-3 text-right font-bold ${tx.type === 'topup' || tx.type === 'refund' ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.type === 'topup' || tx.type === 'refund' ? '+' : '-'} {formatCurrency(tx.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* ADDRESS TAB */}
        {activeTab === 'addresses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-surface-900 text-lg">My Shipping Addresses</h3>
              <Button onClick={() => openAddressModal()} size="sm" className="flex items-center gap-1.5">
                <HiOutlinePlus size={16} />
                New Address
              </Button>
            </div>

            {addresses.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-2 border-surface-250">
                <HiOutlineMapPin className="mx-auto text-surface-300 mb-4" size={40} />
                <p className="text-surface-500 font-medium mb-1">No addresses saved yet</p>
                <p className="text-xs text-surface-400 mb-6">Add an address so we can deliver your orders.</p>
                <Button onClick={() => openAddressModal()} size="sm" variant="secondary">
                  Add First Address
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {addresses.map((addr) => (
                  <Card key={addr.id} className={`p-6 border-2 relative overflow-hidden transition-all duration-200 ${
                    addr.is_default ? 'border-primary-500 bg-primary-50/5' : 'border-surface-200 hover:border-surface-300'
                  }`}>
                    {addr.is_default && (
                      <div className="absolute top-0 right-0 bg-primary-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-sm">
                        <HiOutlineCheck size={12} /> Default
                      </div>
                    )}
                    <div className="mb-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-surface-100 text-surface-600 mb-2">
                        {addr.label}
                      </span>
                      <h4 className="font-bold text-surface-900 text-base">{addr.recipient_name}</h4>
                      <p className="text-sm text-surface-500 font-medium mb-2">{addr.phone}</p>
                      <p className="text-sm text-surface-600 leading-relaxed max-w-md">{addr.full_address}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-surface-100">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openAddressModal(addr)} className="text-primary-600 hover:bg-primary-50 p-2 rounded-lg">
                          <HiOutlinePencilSquare size={18} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteAddress(addr.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg">
                          <HiOutlineTrash size={18} />
                        </Button>
                      </div>
                      {!addr.is_default && (
                        <Button size="xs" variant="secondary" onClick={() => handleSetDefaultAddress(addr.id)}>
                          Set as Default
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h3 className="font-bold text-surface-900 text-lg">My Orders</h3>
            {orders.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-2 border-surface-250">
                <HiOutlineClipboardDocumentList className="mx-auto text-surface-300 mb-4" size={40} />
                <p className="text-surface-500 font-medium mb-1">No orders placed yet</p>
                <p className="text-xs text-surface-400">Explore products in our catalog and place your first order!</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="p-6 hover:shadow-card-hover transition-shadow border border-surface-150">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-surface-100 mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-bold text-surface-950 text-sm sm:text-base">{order.order_number}</span>
                          <span className="text-xs text-surface-400">{formatDate(order.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-surface-500">
                          <HiOutlineBuildingStorefront size={14} />
                          <span>Store: <strong className="text-surface-700">{order.store_name}</strong></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                        <Button size="xs" variant="outline" onClick={() => viewOrderDetails(order.id)}>
                          View Details
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="text-xs text-surface-500">
                        <p className="mb-0.5">Delivery Method: <strong className="text-surface-700 capitalize">{order.delivery_method}</strong></p>
                        <p className="truncate max-w-sm sm:max-w-md">Address: <span className="text-surface-600">{order.delivery_address_snapshot.split('|')[2]}</span></p>
                      </div>
                      <div className="text-right sm:text-right">
                        <p className="text-xs text-surface-400 font-medium">Total Payment</p>
                        <p className="text-base font-extrabold text-primary-700">{formatCurrency(order.total)}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* TOP-UP MODAL */}
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
              placeholder="e.g. 50000"
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
              Top Up Now
            </Button>
          </div>
        </form>
      </Modal>

      {/* ADDRESS ADD / EDIT MODAL */}
      <Modal isOpen={addressOpen} onClose={() => setAddressOpen(false)} title={selectedAddress ? 'Edit Address' : 'Add New Address'}>
        <form onSubmit={handleAddressSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-surface-600 uppercase mb-1">Label (e.g. Home, Office)</label>
            <Input
              value={addressLabel}
              onChange={(e) => setAddressLabel(e.target.value)}
              placeholder="e.g. Rumah, Kantor"
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
                placeholder="e.g. Budi Santoso"
                required
                disabled={submittingAddress}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-600 uppercase mb-1">Phone Number</label>
              <Input
                value={addressPhone}
                onChange={(e) => setAddressPhone(e.target.value)}
                placeholder="e.g. 08123456789"
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
              placeholder="Enter complete address, block number, postcode..."
              rows={3}
              required
              className="w-full px-4 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              disabled={submittingAddress}
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              id="addr-default"
              type="checkbox"
              checked={addressDefault}
              onChange={(e) => setAddressDefault(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-surface-350 rounded focus:ring-primary-500"
              disabled={submittingAddress}
            />
            <label htmlFor="addr-default" className="text-sm text-surface-700 select-none">
              Set as default shipping address
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
            <Button variant="secondary" type="button" onClick={() => setAddressOpen(false)} disabled={submittingAddress}>
              Cancel
            </Button>
            <Button type="submit" loading={submittingAddress}>
              {selectedAddress ? 'Save Changes' : 'Add Address'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ORDER DETAILS MODAL */}
      <Modal isOpen={orderDetailOpen} onClose={() => setOrderDetailOpen(false)} title="Order Details">
        {loadingOrderDetails || !selectedOrder ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner size="md" />
            <p className="text-surface-500 text-sm mt-3">Loading details...</p>
          </div>
        ) : (
          <div className="space-y-6 pt-2 max-h-[80vh] overflow-y-auto pr-1">
            {/* Header snapshot */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-surface-200">
              <div>
                <p className="text-xs text-surface-400">Order Number</p>
                <p className="font-bold text-surface-900 text-base">{selectedOrder.order_number}</p>
                <p className="text-[11px] text-surface-400">Placed on {formatDate(selectedOrder.created_at)}</p>
              </div>
              <div>
                <Badge variant={getStatusBadgeVariant(selectedOrder.status)} className="text-sm">
                  {getStatusLabel(selectedOrder.status)}
                </Badge>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <HiOutlineClock size={16} /> Order Timeline Status
              </h4>
              <div className="space-y-4 pl-3 relative border-l border-surface-200 ml-2">
                {selectedOrder.statusHistory.map((hist, i) => (
                  <div key={hist.id} className="relative">
                    {/* Bullet */}
                    <div className={`absolute -left-[19px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                      i === selectedOrder.statusHistory.length - 1 ? 'bg-primary-600 scale-110' : 'bg-surface-300'
                    }`} />
                    <div>
                      <p className={`text-xs font-bold capitalize ${
                        i === selectedOrder.statusHistory.length - 1 ? 'text-primary-700' : 'text-surface-600'
                      }`}>
                        {getStatusLabel(hist.status)}
                      </p>
                      {hist.note && <p className="text-[11px] text-surface-500">{hist.note}</p>}
                      <p className="text-[10px] text-surface-400">{formatDate(hist.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Store Information */}
            <div className="p-4 rounded-xl bg-surface-50 border border-surface-150 flex items-center gap-3">
              <HiOutlineBuildingStorefront className="text-surface-500" size={20} />
              <div>
                <p className="text-xs text-surface-400">Store Profile</p>
                <p className="text-sm font-semibold text-surface-800">{selectedOrder.store_name}</p>
              </div>
            </div>

            {/* Shipping details */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider flex items-center gap-1.5">
                <HiOutlineTruck size={16} /> Shipping & Destination
              </h4>
              <Card className="p-4 bg-surface-50/50">
                <p className="text-xs text-surface-500 font-semibold mb-1">
                  Method: <span className="text-surface-800 capitalize font-bold">{selectedOrder.delivery_method}</span>
                </p>
                <p className="text-xs text-surface-500 font-semibold mb-0.5">
                  Recipient Name: <span className="text-surface-800 font-bold">{selectedOrder.delivery_address_snapshot.split(' | ')[0]}</span>
                </p>
                <p className="text-xs text-surface-500 font-semibold mb-0.5">
                  Phone: <span className="text-surface-800 font-bold">{selectedOrder.delivery_address_snapshot.split(' | ')[1]}</span>
                </p>
                <p className="text-xs text-surface-500 font-semibold">
                  Address: <span className="text-surface-800 font-normal">{selectedOrder.delivery_address_snapshot.split(' | ')[2]}</span>
                </p>
              </Card>
            </div>

            {/* Order Items */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Ordered Products</h4>
              <div className="divide-y divide-surface-100">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-3">
                    <div className="w-12 h-12 rounded-lg bg-surface-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {item.image_url ? (
                        <img
                          src={getImageUrl(item.image_url)}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';
                          }}
                        />
                      ) : (
                        <HiOutlineClipboardDocumentList className="text-surface-400" size={22} />
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-semibold text-surface-900 truncate">{item.product_name}</p>
                      <p className="text-xs text-surface-500">
                        {item.quantity} x {formatCurrency(item.product_price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-surface-800">{formatCurrency(item.subtotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price breakdown */}
            <div className="pt-4 border-t border-surface-200 text-sm space-y-2">
              <div className="flex justify-between text-surface-500">
                <span>Subtotal</span>
                <span>{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              {parseFloat(selectedOrder.discount_amount) > 0 && (
                <div className="flex justify-between text-danger-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(selectedOrder.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-surface-500">
                <span>Delivery Fee ({selectedOrder.delivery_method})</span>
                <span>{formatCurrency(selectedOrder.delivery_fee)}</span>
              </div>
              <div className="flex justify-between text-surface-500">
                <span>PPN (12%)</span>
                <span>{formatCurrency(selectedOrder.tax_amount)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-base pt-2 border-t border-surface-100 text-primary-800">
                <span>Total Payment</span>
                <span>{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setOrderDetailOpen(false)} className="w-full sm:w-auto">
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
